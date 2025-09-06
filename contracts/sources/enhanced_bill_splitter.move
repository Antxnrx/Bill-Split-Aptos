/// Enhanced Bill Splitting Smart Contract with Better Scalability
/// Optimized for handling large numbers of participants
module bill_split::enhanced_bill_splitter {
    use std::signer;
    use std::string::String;
    use std::vector;
    use aptos_framework::coin;
    use aptos_framework::timestamp;
    use aptos_framework::multisig_account;
    use aptos_std::smart_table::{Self, SmartTable};
    use aptos_std::table::{Self, Table};
    use bill_split::usdc_utils::USDC;

    // Enhanced participant information with indexing
    struct Participant has store, copy, drop {
        address: address,
        name: String,
        amount_owed: u64,
        has_signed: bool,
        has_paid: bool,
        payment_timestamp: u64,
    }

    // Enhanced bill session with participant lookup table for O(1) access
    struct EnhancedBillSession has key, store {
        session_id: String,
        merchant_address: address,
        multisig_address: address,
        total_amount: u64,
        description: String,
        participants: vector<Participant>,
        participant_lookup: Table<address, u64>, // address -> index mapping for O(1) lookup
        required_signatures: u64,
        current_signatures: u64,
        status: u8,
        created_at: u64,
        approved_at: u64,
        settled_at: u64,
        payments_received: u64,
        max_participants: u64, // Configurable limit
    }

    // Registry with enhanced indexing
    struct EnhancedBillRegistry has key {
        sessions: SmartTable<String, EnhancedBillSession>,
        session_counter: u64,
        participant_sessions: Table<address, vector<String>>, // Track sessions per participant
    }

    // Batch operations for efficiency
    struct BatchPaymentEvent has drop, store {
        session_id: String,
        payments: vector<address>,
        total_amount_paid: u64,
        timestamp: u64,
    }

    // Constants for scalability limits
    const MAX_PARTICIPANTS_DEFAULT: u64 = 1000;
    const MAX_BATCH_SIZE: u64 = 50;
    
    // Error codes
    const E_BILL_SESSION_NOT_FOUND: u64 = 1;
    const E_PARTICIPANT_NOT_FOUND: u64 = 4;
    const E_TOO_MANY_PARTICIPANTS: u64 = 10;
    const E_BATCH_TOO_LARGE: u64 = 11;

    /// Create enhanced bill session with optimized participant management
    public entry fun create_enhanced_bill_session(
        merchant: &signer,
        session_id: String,
        total_amount: u64,
        description: String,
        participant_addresses: vector<address>,
        participant_names: vector<String>,
        required_signatures: u64,
        max_participants: u64,
    ) acquires EnhancedBillRegistry {
        let participant_count = vector::length(&participant_addresses);
        assert!(participant_count <= max_participants, E_TOO_MANY_PARTICIPANTS);
        assert!(max_participants <= MAX_PARTICIPANTS_DEFAULT, E_TOO_MANY_PARTICIPANTS);

        let registry = borrow_global_mut<EnhancedBillRegistry>(@bill_split);
        
        // Create participants with O(1) lookup table
        let participants = vector::empty<Participant>();
        let participant_lookup = table::new<address, u64>();
        let individual_amount = total_amount / (participant_count as u64);

        let i = 0;
        while (i < participant_count) {
            let participant_addr = *vector::borrow(&participant_addresses, i);
            let participant = Participant {
                address: participant_addr,
                name: *vector::borrow(&participant_names, i),
                amount_owed: individual_amount,
                has_signed: false,
                has_paid: false,
                payment_timestamp: 0,
            };
            vector::push_back(&mut participants, participant);
            table::add(&mut participant_lookup, participant_addr, i);
            
            // Track sessions per participant
            if (!table::contains(&registry.participant_sessions, participant_addr)) {
                table::add(&mut registry.participant_sessions, participant_addr, vector::empty<String>());
            };
            let sessions = table::borrow_mut(&mut registry.participant_sessions, participant_addr);
            vector::push_back(sessions, session_id);
            
            i = i + 1;
        };

        // Create multisig account
        let multisig_address = multisig_account::get_next_multisig_account_address(
            signer::address_of(merchant)
        );
        
        multisig_account::create_with_owners(
            merchant,
            participant_addresses,
            required_signatures,
            vector::empty<String>(),
            vector::empty<vector<u8>>()
        );

        let enhanced_session = EnhancedBillSession {
            session_id,
            merchant_address: signer::address_of(merchant),
            multisig_address,
            total_amount,
            description,
            participants,
            participant_lookup,
            required_signatures,
            current_signatures: 0,
            status: 0, // STATUS_CREATED
            created_at: timestamp::now_seconds(),
            approved_at: 0,
            settled_at: 0,
            payments_received: 0,
            max_participants,
        };

        smart_table::add(&mut registry.sessions, session_id, enhanced_session);
    }

    /// Optimized participant lookup with O(1) complexity
    public entry fun submit_payment_optimized(
        participant: &signer,
        session_id: String,
        payment_amount: u64
    ) acquires EnhancedBillRegistry {
        let participant_addr = signer::address_of(participant);
        let registry = borrow_global_mut<EnhancedBillRegistry>(@bill_split);
        
        assert!(smart_table::contains(&registry.sessions, session_id), E_BILL_SESSION_NOT_FOUND);
        let bill_session = smart_table::borrow_mut(&mut registry.sessions, session_id);
        
        // O(1) participant lookup instead of O(n) linear search
        assert!(table::contains(&bill_session.participant_lookup, participant_addr), E_PARTICIPANT_NOT_FOUND);
        let participant_index = *table::borrow(&bill_session.participant_lookup, participant_addr);
        
        let participant_data = vector::borrow_mut(&mut bill_session.participants, participant_index);
        assert!(!participant_data.has_paid, 6); // E_ALREADY_PAID
        
        let amount_owed = participant_data.amount_owed;
        assert!(payment_amount >= amount_owed, 5); // E_INSUFFICIENT_PAYMENT

        // Process payment
        let payment_coin = coin::withdraw<USDC>(participant, payment_amount);
        coin::deposit(bill_session.merchant_address, payment_coin);

        // Update participant status
        participant_data.has_paid = true;
        participant_data.payment_timestamp = timestamp::now_seconds();
        bill_session.payments_received = bill_session.payments_received + amount_owed;
    }

    /// Batch signature collection for efficiency - takes addresses instead of signers
    public entry fun batch_sign_agreements(
        session_id: String,
        signer_addresses: vector<address>
    ) acquires EnhancedBillRegistry {
        let batch_size = vector::length(&signer_addresses);
        assert!(batch_size <= MAX_BATCH_SIZE, E_BATCH_TOO_LARGE);

        let registry = borrow_global_mut<EnhancedBillRegistry>(@bill_split);
        assert!(smart_table::contains(&registry.sessions, session_id), E_BILL_SESSION_NOT_FOUND);
        let bill_session = smart_table::borrow_mut(&mut registry.sessions, session_id);

        let i = 0;
        while (i < batch_size) {
            let signer_addr = *vector::borrow(&signer_addresses, i);
            
            if (table::contains(&bill_session.participant_lookup, signer_addr)) {
                let participant_index = *table::borrow(&bill_session.participant_lookup, signer_addr);
                let participant_data = vector::borrow_mut(&mut bill_session.participants, participant_index);
                
                if (!participant_data.has_signed) {
                    participant_data.has_signed = true;
                    bill_session.current_signatures = bill_session.current_signatures + 1;
                };
            };
            i = i + 1;
        };

        // Check if bill is approved
        if (bill_session.current_signatures >= bill_session.required_signatures) {
            bill_session.status = 2; // STATUS_APPROVED
            bill_session.approved_at = timestamp::now_seconds();
        };
    }

    #[view]
    /// Get sessions for a specific participant (useful for dashboards)
    public fun get_participant_sessions(participant_addr: address): vector<String> acquires EnhancedBillRegistry {
        let registry = borrow_global<EnhancedBillRegistry>(@bill_split);
        if (table::contains(&registry.participant_sessions, participant_addr)) {
            *table::borrow(&registry.participant_sessions, participant_addr)
        } else {
            vector::empty<String>()
        }
    }

    #[view]
    /// Get bill session statistics for monitoring
    public fun get_session_stats(session_id: String): (u64, u64, u64, u64, u8) acquires EnhancedBillRegistry {
        let registry = borrow_global<EnhancedBillRegistry>(@bill_split);
        assert!(smart_table::contains(&registry.sessions, session_id), E_BILL_SESSION_NOT_FOUND);
        
        let bill_session = smart_table::borrow(&registry.sessions, session_id);
        (
            vector::length(&bill_session.participants), // total participants
            bill_session.current_signatures,            // current signatures
            bill_session.required_signatures,           // required signatures
            bill_session.payments_received,             // total payments received
            bill_session.status                         // current status
        )
    }
}
