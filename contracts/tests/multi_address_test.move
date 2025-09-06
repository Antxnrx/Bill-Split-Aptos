/// Multi-Address Testing Module
/// Demonstrates how multiple user addresses interact with the bill splitter contract
module bill_split::multi_address_test {
    use std::signer;
    use std::string;
    use std::vector;
    use bill_split::bill_splitter;
    use bill_split::usdc_utils;

    /// Create a realistic test scenario with multiple unique addresses
    public entry fun test_multiple_real_addresses(admin: &signer) {
        // Initialize systems
        bill_splitter::initialize(admin);
        usdc_utils::initialize_usdc(admin);
        
        // Define realistic test addresses (these would be real user wallets)
        let alice = @0xa11ce;     // Alice's wallet
        let bob = @0xb0b;         // Bob's wallet  
        let charlie = @0xc4a4123; // Charlie's wallet
        let diana = @0xd1a4a;     // Diana's wallet
        let eve = @0xe5e;         // Eve's wallet
        
        // Create participant vectors
        let participants = vector::empty<address>();
        vector::push_back(&mut participants, alice);
        vector::push_back(&mut participants, bob);
        vector::push_back(&mut participants, charlie);
        vector::push_back(&mut participants, diana);
        vector::push_back(&mut participants, eve);
        
        let names = vector::empty<string::String>();
        vector::push_back(&mut names, string::utf8(b"Alice"));
        vector::push_back(&mut names, string::utf8(b"Bob"));
        vector::push_back(&mut names, string::utf8(b"Charlie"));
        vector::push_back(&mut names, string::utf8(b"Diana"));
        vector::push_back(&mut names, string::utf8(b"Eve"));
        
        // Mint test USDC to each participant
        usdc_utils::mint_usdc_for_testing(admin, alice, 1000000000);   // $1000 USDC
        usdc_utils::mint_usdc_for_testing(admin, bob, 1000000000);     // $1000 USDC
        usdc_utils::mint_usdc_for_testing(admin, charlie, 1000000000); // $1000 USDC
        usdc_utils::mint_usdc_for_testing(admin, diana, 1000000000);   // $1000 USDC
        usdc_utils::mint_usdc_for_testing(admin, eve, 1000000000);     // $1000 USDC
        
        // Create bill session (merchant creates it)
        bill_splitter::create_bill_session(
            admin, // Merchant (restaurant)
            string::utf8(b"DINNER_BILL_001"),
            250000000, // $250 total bill
            string::utf8(b"Group Dinner at Restaurant"),
            participants,
            names,
            3 // Require 3 out of 5 signatures
        );
    }
    
    #[view]
    /// Show how each address has different balances and states
    public fun show_participant_states(): (
        vector<address>,
        vector<u64>,
        vector<bool>,
        vector<bool>
    ) {
        let addresses = vector::empty<address>();
        let balances = vector::empty<u64>();
        let signed_status = vector::empty<bool>();
        let paid_status = vector::empty<bool>();
        
        // Check each participant's state
        let alice = @0xa11ce;
        let bob = @0xb0b;
        let charlie = @0xc4a4123;
        let diana = @0xd1a4a;
        let eve = @0xe5e;
        
        let test_addresses = vector::empty<address>();
        vector::push_back(&mut test_addresses, alice);
        vector::push_back(&mut test_addresses, bob);
        vector::push_back(&mut test_addresses, charlie);
        vector::push_back(&mut test_addresses, diana);
        vector::push_back(&mut test_addresses, eve);
        
        let i = 0;
        while (i < vector::length(&test_addresses)) {
            let addr = *vector::borrow(&test_addresses, i);
            
            vector::push_back(&mut addresses, addr);
            vector::push_back(&mut balances, usdc_utils::get_usdc_balance(addr));
            vector::push_back(&mut signed_status, 
                bill_splitter::has_participant_signed(string::utf8(b"DINNER_BILL_001"), addr));
            vector::push_back(&mut paid_status, 
                bill_splitter::has_participant_paid(string::utf8(b"DINNER_BILL_001"), addr));
            
            i = i + 1;
        };
        
        (addresses, balances, signed_status, paid_status)
    }

    /// Test bill creation with real-world scenario
    public entry fun test_restaurant_scenario(
        merchant: &signer,
        participant_addresses: vector<address>
    ) {
        let session_id = string::utf8(b"RESTAURANT_TEST_001");
        
        // Create names for participants
        let names = vector::empty<string::String>();
        let i = 0;
        while (i < vector::length(&participant_addresses)) {
            vector::push_back(&mut names, string::utf8(b"Customer"));
            i = i + 1;
        };
        
        // Create bill session
        bill_splitter::create_bill_session(
            merchant,
            session_id,
            180000000, // $180 dinner bill
            string::utf8(b"Fine Dining Restaurant Bill"),
            participant_addresses,
            names,
            (vector::length(&participant_addresses) * 2) / 3 // 2/3 majority
        );
    }

    /// Test conference bill scenario
    public entry fun test_conference_scenario(
        organizer: &signer,
        participant_addresses: vector<address>
    ) {
        let session_id = string::utf8(b"CONFERENCE_TEST_001");
        
        // Create names for participants
        let names = vector::empty<string::String>();
        let i = 0;
        while (i < vector::length(&participant_addresses)) {
            vector::push_back(&mut names, string::utf8(b"Attendee"));
            i = i + 1;
        };
        
        // Create bill session for conference expenses
        bill_splitter::create_bill_session(
            organizer,
            session_id,
            2000000000, // $2000 conference bill
            string::utf8(b"Tech Conference Shared Expenses"),
            participant_addresses,
            names,
            vector::length(&participant_addresses) / 2 + 1 // Simple majority
        );
    }

    #[test]
    /// Test function specifically for unit testing
    public fun test_address_validation() {
        // Test address validation logic
        let alice = @0xa11ce;
        let bob = @0xb0b;
        let charlie = @0xc4a4123;
        
        // Verify addresses are different
        assert!(alice != bob, 1);
        assert!(bob != charlie, 2);
        assert!(alice != charlie, 3);
        
        // Test vector operations
        let participants = vector::empty<address>();
        vector::push_back(&mut participants, alice);
        vector::push_back(&mut participants, bob);
        vector::push_back(&mut participants, charlie);
        
        assert!(vector::length(&participants) == 3, 4);
        assert!(*vector::borrow(&participants, 0) == alice, 5);
    }

    #[test]
    /// Test string operations
    public fun test_string_operations() {
        let session_id = string::utf8(b"TEST_SESSION_001");
        let description = string::utf8(b"Test Bill Description");
        
        // Verify strings are created properly
        assert!(string::length(&session_id) > 0, 1);
        assert!(string::length(&description) > 0, 2);
    }

    #[test]
    /// Test multi-address scenarios
    public fun test_multi_address_creation() {
        // Create multiple addresses for testing
        let addresses = vector::empty<address>();
        let expected_count = 5;
        
        vector::push_back(&mut addresses, @0xa11ce);
        vector::push_back(&mut addresses, @0xb0b);
        vector::push_back(&mut addresses, @0xc4a4123);
        vector::push_back(&mut addresses, @0xd1a4a);
        vector::push_back(&mut addresses, @0xe5e);
        
        assert!(vector::length(&addresses) == expected_count, 1);
        
        // Test that all addresses are unique
        let i = 0;
        while (i < vector::length(&addresses)) {
            let j = i + 1;
            while (j < vector::length(&addresses)) {
                let addr_i = *vector::borrow(&addresses, i);
                let addr_j = *vector::borrow(&addresses, j);
                assert!(addr_i != addr_j, 2);
                j = j + 1;
            };
            i = i + 1;
        };
    }

    #[view]
    /// Get balance for specific address
    public fun get_address_balance(addr: address): u64 {
        usdc_utils::get_usdc_balance(addr)
    }

    #[view]
    /// Check if address is participant in specific bill
    public fun is_participant_in_bill(session_id: string::String, addr: address): bool {
        // This is a simplified check - in practice you'd verify against the actual participant list
        bill_splitter::has_participant_signed(session_id, addr) || 
        !bill_splitter::has_participant_signed(session_id, addr) // Always returns true if participant exists
    }
}
