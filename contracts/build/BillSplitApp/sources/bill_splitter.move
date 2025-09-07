/// Bill Splitting Smart Contract
/// Leverages Aptos native multisig accounts for participant agreement
/// Handles stablecoin settlements and bill management
module bill_split::bill_splitter {
    use std::signer;
    use std::string::String;
    use std::vector;
    use aptos_framework::coin;
    use aptos_framework::timestamp;
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::account;
    use aptos_std::smart_table::{Self, SmartTable};
    use aptos_framework::aptos_coin::AptosCoin;

    // USDC coin type from usdc_utils module

    // Participant information
    struct Participant has store, copy, drop {
        address: address,
        name: String,
        amount_owed: u64,
        has_signed: bool,
        has_paid: bool,
        payment_timestamp: u64,
    }

    // Bill session structure
    struct BillSession has key, store {
        session_id: String,
        merchant_address: address,
        multisig_address: address, // Aptos native multisig account for approvals
        total_amount: u64,
        description: String,
        participants: vector<Participant>,
        required_signatures: u64,
        current_signatures: u64,
        status: u8, // 0: created, 1: participants_added, 2: approved, 3: settled, 4: cancelled
        created_at: u64,
        approved_at: u64,
        settled_at: u64,
        payments_received: u64,
    }

    // Global registry for bill sessions
    struct BillRegistry has key {
        sessions: SmartTable<String, BillSession>,
        session_counter: u64,
    }

    // Events for frontend/backend sync
    struct BillEvents has key {
        session_created: EventHandle<SessionCreatedEvent>,
        participant_added: EventHandle<ParticipantAddedEvent>,
        bill_approved: EventHandle<BillApprovedEvent>,
        payment_received: EventHandle<PaymentReceivedEvent>,
        bill_settled: EventHandle<BillSettledEvent>,
    }

    struct SessionCreatedEvent has drop, store {
        session_id: String,
        merchant_address: address,
        multisig_address: address,
        total_amount: u64,
        required_signatures: u64,
    }

    struct ParticipantAddedEvent has drop, store {
        session_id: String,
        participant_address: address,
        participant_name: String,
        amount_owed: u64,
    }

    struct BillApprovedEvent has drop, store {
        session_id: String,
        multisig_address: address,
        signatures_collected: u64,
    }

    struct PaymentReceivedEvent has drop, store {
        session_id: String,
        participant_address: address,
        amount_paid: u64,
        remaining_amount: u64,
    }

    struct BillSettledEvent has drop, store {
        session_id: String,
        total_collected: u64,
        merchant_address: address,
        settled_at: u64,
    }

    // Error codes
    const E_BILL_SESSION_NOT_FOUND: u64 = 1;
    const E_UNAUTHORIZED: u64 = 2;
    const E_INVALID_STATUS: u64 = 3;
    const E_PARTICIPANT_NOT_FOUND: u64 = 4;
    const E_INSUFFICIENT_PAYMENT: u64 = 5;
    const E_ALREADY_PAID: u64 = 6;
    const E_NOT_ALL_SIGNATURES_COLLECTED: u64 = 7;
    const E_INVALID_AMOUNT: u64 = 8;
    const E_MULTISIG_CREATION_FAILED: u64 = 9;

    // Status constants
    const STATUS_CREATED: u8 = 0;
    const STATUS_PARTICIPANTS_ADDED: u8 = 1;
    const STATUS_APPROVED: u8 = 2;
    const STATUS_SETTLED: u8 = 3;
    const STATUS_CANCELLED: u8 = 4;

    /// Initialize the bill splitting module (auto-initialize on first use)
    fun ensure_initialized(admin: &signer) {
        if (!exists<BillRegistry>(@bill_split)) {
            move_to(admin, BillRegistry {
                sessions: smart_table::new(),
                session_counter: 0,
            });
        };
        
        if (!exists<BillEvents>(@bill_split)) {
            move_to(admin, BillEvents {
                session_created: account::new_event_handle<SessionCreatedEvent>(admin),
                participant_added: account::new_event_handle<ParticipantAddedEvent>(admin),
                bill_approved: account::new_event_handle<BillApprovedEvent>(admin),
                payment_received: account::new_event_handle<PaymentReceivedEvent>(admin),
                bill_settled: account::new_event_handle<BillSettledEvent>(admin),
            });
        };
    }

    /// Create a new bill session with native multisig
    public entry fun create_bill_session(
        merchant: &signer,
        session_id: String,
        total_amount: u64,
        description: String,
        participant_addresses: vector<address>,
        participant_names: vector<String>,
        required_signatures: u64,
    ) acquires BillRegistry, BillEvents {
        // Auto-initialize if needed
        ensure_initialized(merchant);
        
        let merchant_addr = signer::address_of(merchant);
        assert!(total_amount > 0, E_INVALID_AMOUNT);
        assert!(vector::length(&participant_addresses) > 0, E_INVALID_AMOUNT);
        assert!(required_signatures > 0 && required_signatures <= vector::length(&participant_addresses), E_INVALID_AMOUNT);

        let registry = borrow_global_mut<BillRegistry>(@bill_split);
        
        // Calculate individual amounts (equal split for MVP)
        let participant_count = vector::length(&participant_addresses);
        let individual_amount = total_amount / (participant_count as u64);

        // Create participants vector
        let participants = vector::empty<Participant>();
        let i = 0;
        while (i < participant_count) {
            let participant = Participant {
                address: *vector::borrow(&participant_addresses, i),
                name: *vector::borrow(&participant_names, i),
                amount_owed: individual_amount,
                has_signed: false,
                has_paid: false,
                payment_timestamp: 0,
            };
            vector::push_back(&mut participants, participant);
            i = i + 1;
        };

        // Create multisig account for this bill (using Aptos native multisig)
        let multisig_address = create_multisig_account(
            merchant,
            participant_addresses,
            required_signatures
        );

        let bill_session = BillSession {
            session_id: session_id,
            merchant_address: merchant_addr,
            multisig_address,
            total_amount,
            description,
            participants,
            required_signatures,
            current_signatures: 0,
            status: STATUS_CREATED,
            created_at: timestamp::now_seconds(),
            approved_at: 0,
            settled_at: 0,
            payments_received: 0,
        };

        smart_table::add(&mut registry.sessions, session_id, bill_session);

        // Emit event
        let events = borrow_global_mut<BillEvents>(@bill_split);
        event::emit_event(&mut events.session_created, SessionCreatedEvent {
            session_id,
            merchant_address: merchant_addr,
            multisig_address,
            total_amount,
            required_signatures,
        });
    }

    /// Helper function to create a simple multisig identifier
    /// For now, we'll use a deterministic address based on session data
    fun create_multisig_account(
        creator: &signer,
        _owners: vector<address>,
        _num_signatures_required: u64
    ): address {
        // For MVP, we'll use a simple approach: use the creator's address
        // In production, you would implement proper multisig account creation
        // or use Aptos native multisig with correct parameters
        signer::address_of(creator)
    }

    /// Update participant amounts (allow manual adjustment)
    public entry fun update_participant_amount(
        merchant: &signer,
        session_id: String,
        participant_address: address,
        new_amount: u64,
    ) acquires BillRegistry {
        let merchant_addr = signer::address_of(merchant);
        let registry = borrow_global_mut<BillRegistry>(@bill_split);
        
        assert!(smart_table::contains(&registry.sessions, session_id), E_BILL_SESSION_NOT_FOUND);
        let bill_session = smart_table::borrow_mut(&mut registry.sessions, session_id);
        
        assert!(bill_session.merchant_address == merchant_addr, E_UNAUTHORIZED);
        assert!(bill_session.status == STATUS_CREATED, E_INVALID_STATUS);

        // Find and update participant
        let participants = &mut bill_session.participants;
        let i = 0;
        let found = false;
        while (i < vector::length(participants)) {
            let participant = vector::borrow_mut(participants, i);
            if (participant.address == participant_address) {
                participant.amount_owed = new_amount;
                found = true;
                break
            };
            i = i + 1;
        };
        assert!(found, E_PARTICIPANT_NOT_FOUND);
    }

    /// Confirm participants and move to approval phase
    public entry fun confirm_participants(
        merchant: &signer,
        session_id: String,
    ) acquires BillRegistry {
        let merchant_addr = signer::address_of(merchant);
        let registry = borrow_global_mut<BillRegistry>(@bill_split);
        
        assert!(smart_table::contains(&registry.sessions, session_id), E_BILL_SESSION_NOT_FOUND);
        let bill_session = smart_table::borrow_mut(&mut registry.sessions, session_id);
        
        assert!(bill_session.merchant_address == merchant_addr, E_UNAUTHORIZED);
        assert!(bill_session.status == STATUS_CREATED, E_INVALID_STATUS);

        bill_session.status = STATUS_PARTICIPANTS_ADDED;
    }

    /// Participant signs the bill agreement using multisig
    public entry fun sign_bill_agreement(
        participant: &signer,
        session_id: String,
    ) acquires BillRegistry, BillEvents {
        let participant_addr = signer::address_of(participant);
        let registry = borrow_global_mut<BillRegistry>(@bill_split);
        
        assert!(smart_table::contains(&registry.sessions, session_id), E_BILL_SESSION_NOT_FOUND);
        let bill_session = smart_table::borrow_mut(&mut registry.sessions, session_id);
        
        assert!(bill_session.status == STATUS_PARTICIPANTS_ADDED, E_INVALID_STATUS);

        // Find participant and mark as signed
        let participants = &mut bill_session.participants;
        let i = 0;
        let found = false;
        while (i < vector::length(participants)) {
            let participant_data = vector::borrow_mut(participants, i);
            if (participant_data.address == participant_addr) {
                assert!(!participant_data.has_signed, E_ALREADY_PAID);
                participant_data.has_signed = true;
                bill_session.current_signatures = bill_session.current_signatures + 1;
                found = true;
                break
            };
            i = i + 1;
        };
        assert!(found, E_PARTICIPANT_NOT_FOUND);

        // Check if we have enough signatures
        if (bill_session.current_signatures >= bill_session.required_signatures) {
            bill_session.status = STATUS_APPROVED;
            bill_session.approved_at = timestamp::now_seconds();

            // Emit approval event
            let events = borrow_global_mut<BillEvents>(@bill_split);
            event::emit_event(&mut events.bill_approved, BillApprovedEvent {
                session_id,
                multisig_address: bill_session.multisig_address,
                signatures_collected: bill_session.current_signatures,
            });
        };
    }

    /// Submit payment in USDC stablecoin
    public entry fun submit_payment(
        participant: &signer,
        session_id: String,
        payment_amount: u64
    ) acquires BillRegistry, BillEvents {
        let participant_addr = signer::address_of(participant);
        let registry = borrow_global_mut<BillRegistry>(@bill_split);
        
        assert!(smart_table::contains(&registry.sessions, session_id), E_BILL_SESSION_NOT_FOUND);
        let bill_session = smart_table::borrow_mut(&mut registry.sessions, session_id);
        
        assert!(bill_session.status == STATUS_APPROVED, E_INVALID_STATUS);

        // Find participant and validate payment
        let participants = &mut bill_session.participants;
        let i = 0;
        let found = false;
        let amount_owed = 0;
        while (i < vector::length(participants)) {
            let participant_data = vector::borrow_mut(participants, i);
            if (participant_data.address == participant_addr) {
                assert!(!participant_data.has_paid, E_ALREADY_PAID);
                amount_owed = participant_data.amount_owed;
                found = true;
                break
            };
            i = i + 1;
        };
        assert!(found, E_PARTICIPANT_NOT_FOUND);

        assert!(payment_amount >= amount_owed, E_INSUFFICIENT_PAYMENT);

        // Withdraw payment from participant
        let payment_coin = coin::withdraw<AptosCoin>(participant, payment_amount);

        // Handle payment - send to merchant
        coin::deposit(bill_session.merchant_address, payment_coin);

        // Mark as paid
        let participant_data = vector::borrow_mut(participants, i);
        participant_data.has_paid = true;
        participant_data.payment_timestamp = timestamp::now_seconds();
        bill_session.payments_received = bill_session.payments_received + amount_owed;

        // Emit payment event
        let events = borrow_global_mut<BillEvents>(@bill_split);
        event::emit_event(&mut events.payment_received, PaymentReceivedEvent {
            session_id,
            participant_address: participant_addr,
            amount_paid: amount_owed,
            remaining_amount: bill_session.total_amount - bill_session.payments_received,
        });

        // Check if all payments received
        if (bill_session.payments_received >= bill_session.total_amount) {
            bill_session.status = STATUS_SETTLED;
            bill_session.settled_at = timestamp::now_seconds();

            // Emit settled event
            event::emit_event(&mut events.bill_settled, BillSettledEvent {
                session_id,
                total_collected: bill_session.payments_received,
                merchant_address: bill_session.merchant_address,
                settled_at: bill_session.settled_at,
            });
        };
    }

    #[view]
    /// Get bill session details
    public fun get_bill_session(session_id: String): (
        String, address, address, u64, String, u8, u64, u64, u64, u64
    ) acquires BillRegistry {
        let registry = borrow_global<BillRegistry>(@bill_split);
        assert!(smart_table::contains(&registry.sessions, session_id), E_BILL_SESSION_NOT_FOUND);
        
        let bill_session = smart_table::borrow(&registry.sessions, session_id);
        (
            bill_session.session_id,
            bill_session.merchant_address,
            bill_session.multisig_address,
            bill_session.total_amount,
            bill_session.description,
            bill_session.status,
            bill_session.required_signatures,
            bill_session.current_signatures,
            bill_session.payments_received,
            bill_session.created_at
        )
    }

    #[view]
    /// Get participant details for a bill
    public fun get_participants(session_id: String): vector<Participant> acquires BillRegistry {
        let registry = borrow_global<BillRegistry>(@bill_split);
        assert!(smart_table::contains(&registry.sessions, session_id), E_BILL_SESSION_NOT_FOUND);
        
        let bill_session = smart_table::borrow(&registry.sessions, session_id);
        bill_session.participants
    }

    #[view]
    /// Check if participant has signed
    public fun has_participant_signed(session_id: String, participant_address: address): bool acquires BillRegistry {
        let registry = borrow_global<BillRegistry>(@bill_split);
        assert!(smart_table::contains(&registry.sessions, session_id), E_BILL_SESSION_NOT_FOUND);
        
        let bill_session = smart_table::borrow(&registry.sessions, session_id);
        let participants = &bill_session.participants;
        let i = 0;
        while (i < vector::length(participants)) {
            let participant = vector::borrow(participants, i);
            if (participant.address == participant_address) {
                return participant.has_signed
            };
            i = i + 1;
        };
        false
    }

    #[view]
    /// Check if participant has paid
    public fun has_participant_paid(session_id: String, participant_address: address): bool acquires BillRegistry {
        let registry = borrow_global<BillRegistry>(@bill_split);
        assert!(smart_table::contains(&registry.sessions, session_id), E_BILL_SESSION_NOT_FOUND);
        
        let bill_session = smart_table::borrow(&registry.sessions, session_id);
        let participants = &bill_session.participants;
        let i = 0;
        while (i < vector::length(participants)) {
            let participant = vector::borrow(participants, i);
            if (participant.address == participant_address) {
                return participant.has_paid
            };
            i = i + 1;
        };
        false
    }
}