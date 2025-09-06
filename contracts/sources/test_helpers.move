/// Deployment and Testing Utilities
/// Helper functions for hackathon demo and testing
module bill_split::test_helpers {
    use std::signer;
    use std::string;
    use std::vector;
    use aptos_framework::coin;
    use aptos_framework::account;
    use bill_split::bill_splitter;
    use bill_split::usdc_utils;

    // Test scenario data
    struct TestScenario has key {
        merchant_address: address,
        participant_addresses: vector<address>,
        test_session_id: string::String,
        total_bill_amount: u64,
        setup_complete: bool,
    }

    /// Complete hackathon demo setup
    public entry fun setup_hackathon_demo(admin: &signer) acquires TestScenario {
        let admin_addr = signer::address_of(admin);
        
        // Initialize the bill splitter system
        bill_splitter::initialize(admin);
        
        // Initialize USDC for testing
        usdc_utils::initialize_usdc(admin);
        
        // Create test scenario
        move_to(admin, TestScenario {
            merchant_address: admin_addr,
            participant_addresses: vector::empty(),
            test_session_id: string::utf8(b"DEMO_BILL_001"),
            total_bill_amount: 100000000, // $100 USDC
            setup_complete: true,
        });
    }

    /// Create demo bill session with pre-configured participants
    public entry fun create_demo_bill(
        merchant: &signer,
        participant1: address,
        participant2: address,
        participant3: address,
        bill_amount: u64,
    ) {
        let session_id = string::utf8(b"HACKATHON_DEMO_BILL");
        let description = string::utf8(b"Hackathon Demo Restaurant Bill");
        
        let participant_addresses = vector::empty<address>();
        vector::push_back(&mut participant_addresses, participant1);
        vector::push_back(&mut participant_addresses, participant2);
        vector::push_back(&mut participant_addresses, participant3);
        
        let participant_names = vector::empty<string::String>();
        vector::push_back(&mut participant_names, string::utf8(b"Alice"));
        vector::push_back(&mut participant_names, string::utf8(b"Bob"));
        vector::push_back(&mut participant_names, string::utf8(b"Charlie"));
        
        let required_signatures = 3; // All participants must sign
        
        bill_splitter::create_bill_session(
            merchant,
            session_id,
            bill_amount,
            description,
            participant_addresses,
            participant_names,
            required_signatures
        );
    }

    /// Fund test participants with USDC
    public entry fun fund_test_participants(
        admin: &signer,
        participant1: address,
        participant2: address,
        participant3: address,
        amount_each: u64,
    ) {
        // Mint USDC for each participant
        usdc_utils::mint_usdc_for_testing(admin, participant1, amount_each);
        usdc_utils::mint_usdc_for_testing(admin, participant2, amount_each);
        usdc_utils::mint_usdc_for_testing(admin, participant3, amount_each);
    }

    /// Register USDC for test participants
    public entry fun register_participants_for_usdc(
        participant1: &signer,
        participant2: &signer,
        participant3: &signer,
    ) {
        usdc_utils::register_usdc(participant1);
        usdc_utils::register_usdc(participant2);
        usdc_utils::register_usdc(participant3);
    }

    /// Complete demo flow: participants sign agreement
    public entry fun demo_sign_agreements(
        participant1: &signer,
        participant2: &signer,
        participant3: &signer,
    ) {
        let session_id = string::utf8(b"HACKATHON_DEMO_BILL");
        
        bill_splitter::sign_bill_agreement(participant1, session_id);
        bill_splitter::sign_bill_agreement(participant2, session_id);
        bill_splitter::sign_bill_agreement(participant3, session_id);
    }

    /// Complete demo flow: participants submit payments
    public entry fun demo_submit_payments(
        participant1: &signer,
        participant2: &signer,
        participant3: &signer,
        amount_each: u64,
    ) {
        let session_id = string::utf8(b"HACKATHON_DEMO_BILL");
        
        // Extract coins and submit payments
        let payment1 = usdc_utils::extract_usdc(participant1, amount_each);
        let payment2 = usdc_utils::extract_usdc(participant2, amount_each);
        let payment3 = usdc_utils::extract_usdc(participant3, amount_each);
        
        bill_splitter::submit_payment(participant1, session_id, payment1);
        bill_splitter::submit_payment(participant2, session_id, payment2);
        bill_splitter::submit_payment(participant3, session_id, payment3);
    }

    /// Quick setup for frontend testing
    public entry fun quick_frontend_setup(
        admin: &signer,
        test_participant: address,
    ) {
        // Initialize system
        setup_hackathon_demo(admin);
        
        // Fund test participant
        usdc_utils::mint_usdc_for_testing(admin, test_participant, 1000000000); // $1000 USDC
        
        // Create a simple test bill
        let session_id = string::utf8(b"FRONTEND_TEST_001");
        let description = string::utf8(b"Frontend Test Bill");
        
        let participants = vector::empty<address>();
        vector::push_back(&mut participants, test_participant);
        
        let names = vector::empty<string::String>();
        vector::push_back(&mut names, string::utf8(b"Test User"));
        
        bill_splitter::create_bill_session(
            admin,
            session_id,
            50000000, // $50 USDC
            description,
            participants,
            names,
            1 // Only one signature required
        );
    }

    /// Get demo bill status for frontend display
    #[view]
    public fun get_demo_bill_status(): (
        string::String, address, u64, u8, u64, u64
    ) {
        let session_id = string::utf8(b"HACKATHON_DEMO_BILL");
        let (id, merchant, multisig, total, desc, status, req_sigs, curr_sigs, payments, created) = 
            bill_splitter::get_bill_session(session_id);
        
        (id, merchant, total, status, req_sigs, curr_sigs)
    }

    /// Utility to check if demo is ready
    #[view]
    public fun is_demo_ready(): bool acquires TestScenario {
        exists<TestScenario>(@bill_split)
    }

    /// Create custom bill for testing different scenarios
    public entry fun create_custom_test_bill(
        merchant: &signer,
        session_id: string::String,
        total_amount: u64,
        participant_addresses: vector<address>,
        required_signatures: u64,
    ) {
        let description = string::utf8(b"Custom Test Bill");
        
        // Generate simple names
        let participant_names = vector::empty<string::String>();
        let i = 0;
        while (i < vector::length(&participant_addresses)) {
            let name = string::utf8(b"Participant_");
            // In a real implementation, you'd append the index
            vector::push_back(&mut participant_names, name);
            i = i + 1;
        };
        
        bill_splitter::create_bill_session(
            merchant,
            session_id,
            total_amount,
            description,
            participant_addresses,
            participant_names,
            required_signatures
        );
    }

    /// Batch operations for stress testing
    public entry fun stress_test_setup(
        admin: &signer,
        num_participants: u64,
        bill_amount: u64,
    ) {
        // This would create multiple bills for performance testing
        // Implementation simplified for hackathon scope
        let i = 0;
        while (i < 5) { // Create 5 test bills
            let session_id = string::utf8(b"STRESS_TEST_");
            // In real implementation, append counter to session_id
            
            let participants = vector::empty<address>();
            vector::push_back(&mut participants, signer::address_of(admin));
            
            let names = vector::empty<string::String>();
            vector::push_back(&mut names, string::utf8(b"Test User"));
            
            bill_splitter::create_bill_session(
                admin,
                session_id,
                bill_amount,
                string::utf8(b"Stress Test Bill"),
                participants,
                names,
                1
            );
            
            i = i + 1;
        };
    }
}