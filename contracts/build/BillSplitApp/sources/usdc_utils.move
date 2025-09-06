/// USDC Integration and Utility Functions
/// Handles stablecoin operations and currency conversion helpers
module bill_split::usdc_utils {
    use std::signer;
    use std::string::{Self, String};
    use std::vector;
    use aptos_framework::coin::{Self, Coin, BurnCapability, FreezeCapability, MintCapability};
    use aptos_framework::timestamp;
    use aptos_std::table::{Self, Table};

    // USDC coin type for the bill splitting app
    struct USDC has key {}

    // USDC coin capabilities (for testnet minting)
    struct USDCCapabilities has key {
        burn_cap: BurnCapability<USDC>,
        freeze_cap: FreezeCapability<USDC>,
        mint_cap: MintCapability<USDC>,
    }

    // Exchange rate tracking for fiat conversion
    struct ExchangeRates has key {
        rates: Table<String, u64>, // currency_pair -> rate (with 6 decimals)
        last_updated: u64,
    }

    // Error codes
    const E_NOT_ADMIN: u64 = 1;
    const E_INSUFFICIENT_BALANCE: u64 = 2;
    const E_INVALID_AMOUNT: u64 = 3;
    const E_RATE_NOT_FOUND: u64 = 4;

    /// Initialize USDC coin and exchange rates (testnet only)
    public entry fun initialize_usdc(admin: &signer) {
        let _admin_addr = signer::address_of(admin);
        
        // Initialize USDC coin for testnet
        let (burn_cap, freeze_cap, mint_cap) = coin::initialize<USDC>(
            admin,
            string::utf8(b"USD Coin"),
            string::utf8(b"USDC"),
            6, // 6 decimal places
            true, // monitor_supply
        );

        move_to(admin, USDCCapabilities {
            burn_cap,
            freeze_cap,
            mint_cap,
        });

        // Initialize exchange rates
        move_to(admin, ExchangeRates {
            rates: table::new(),
            last_updated: timestamp::now_seconds(),
        });

        // Register USDC coin store for admin
        coin::register<USDC>(admin);
    }

    /// Mint test USDC tokens for testing purposes (testnet only)
    public entry fun mint_usdc_for_testing(
        admin: &signer,
        recipient: address,
        amount: u64
    ) acquires USDCCapabilities {
        let capabilities = borrow_global<USDCCapabilities>(@bill_split);
        let minted_coins = coin::mint<USDC>(amount, &capabilities.mint_cap);
        
        // Register coin store if not exists
        if (!coin::is_account_registered<USDC>(recipient)) {
            coin::register<USDC>(admin); // Admin registers for recipient in testing
        };
        
        coin::deposit<USDC>(recipient, minted_coins);
    }

    /// Batch mint test tokens for multiple accounts
    public entry fun batch_mint_usdc_for_testing(
        admin: &signer,
        recipients: vector<address>,
        amounts: vector<u64>
    ) acquires USDCCapabilities {
        assert!(vector::length(&recipients) == vector::length(&amounts), E_INVALID_AMOUNT);
        
        let i = 0;
        while (i < vector::length(&recipients)) {
            let recipient = *vector::borrow(&recipients, i);
            let amount = *vector::borrow(&amounts, i);
            mint_usdc_for_testing(admin, recipient, amount);
            i = i + 1;
        };
    }

    /// Register USDC coin store for an account
    public entry fun register_usdc(account: &signer) {
        coin::register<USDC>(account);
    }

    /// Transfer USDC between accounts
    public entry fun transfer_usdc(
        sender: &signer,
        recipient: address,
        amount: u64
    ) {
        coin::transfer<USDC>(sender, recipient, amount);
    }

    #[view]
    /// Get USDC balance for an account
    public fun get_usdc_balance(account_addr: address): u64 {
        coin::balance<USDC>(account_addr)
    }

    #[view]
    /// Convert fiat amount to USDC amount using exchange rates
    public fun convert_fiat_to_usdc(
        fiat_currency: String,
        fiat_amount: u64
    ): u64 acquires ExchangeRates {
        let _rates = borrow_global<ExchangeRates>(@bill_split);
        
        // For MVP, use simple 1:1 conversion for USD, and fixed rates for others
        let currency_bytes = string::bytes(&fiat_currency);
        if (currency_bytes == &b"USD") {
            fiat_amount * 1000000 // Convert to 6 decimal places
        } else if (currency_bytes == &b"INR") {
            (fiat_amount * 1000000) / 83 // Approximate INR to USD rate
        } else {
            fiat_amount * 1000000 // Default 1:1 conversion
        }
    }

    /// Update exchange rate (admin only)
    public entry fun update_exchange_rate(
        admin: &signer,
        currency_pair: String,
        rate: u64
    ) acquires ExchangeRates {
        let _admin_addr = signer::address_of(admin);
        let rates = borrow_global_mut<ExchangeRates>(@bill_split);
        
        if (table::contains(&rates.rates, currency_pair)) {
            let old_rate = table::borrow_mut(&mut rates.rates, currency_pair);
            *old_rate = rate;
        } else {
            table::add(&mut rates.rates, currency_pair, rate);
        };
        
        rates.last_updated = timestamp::now_seconds();
    }

    #[view]
    /// Get current exchange rate
    public fun get_exchange_rate(currency_pair: String): (u64, u64) acquires ExchangeRates {
        let rates = borrow_global<ExchangeRates>(@bill_split);
        
        if (table::contains(&rates.rates, currency_pair)) {
            let rate = *table::borrow(&rates.rates, currency_pair);
            (rate, rates.last_updated)
        } else {
            (1000000, rates.last_updated) // Default 1:1 rate with 6 decimals
        }
    }

    /// Create a coin from an amount (helper for testing)
    public fun create_usdc_coin(amount: u64, mint_cap: &MintCapability<USDC>): Coin<USDC> {
        coin::mint(amount, mint_cap)
    }

    /// Extract USDC coin from account balance
    public fun extract_usdc(account: &signer, amount: u64): Coin<USDC> {
        coin::withdraw<USDC>(account, amount)
    }

    /// Split a coin into multiple coins for bill splitting
    public fun split_usdc_coin(
        original_coin: Coin<USDC>,
        split_amounts: vector<u64>
    ): vector<Coin<USDC>> {
        let split_coins = vector::empty<Coin<USDC>>();
        let i = 0;
        let len = vector::length(&split_amounts);
        
        while (i < len - 1) {
            let amount = *vector::borrow(&split_amounts, i);
            let split_coin = coin::extract(&mut original_coin, amount);
            vector::push_back(&mut split_coins, split_coin);
            i = i + 1;
        };
        
        // Add the remaining coin
        vector::push_back(&mut split_coins, original_coin);
        split_coins
    }

    /// Merge multiple USDC coins into one
    public fun merge_usdc_coins(coins: vector<Coin<USDC>>): Coin<USDC> {
        let len = vector::length(&coins);
        assert!(len > 0, E_INVALID_AMOUNT);
        
        let merged_coin = vector::pop_back(&mut coins);
        
        while (!vector::is_empty(&coins)) {
            let coin_to_merge = vector::pop_back(&mut coins);
            coin::merge(&mut merged_coin, coin_to_merge);
        };
        
        vector::destroy_empty(coins);
        merged_coin
    }

    /// Calculate service fee for bill splitting
    public fun calculate_service_fee(total_amount: u64, fee_percentage: u64): u64 {
        (total_amount * fee_percentage) / 10000 // fee_percentage in basis points
    }

    #[view]
    /// Format amount for display (convert from 6 decimals to readable format)
    public fun format_usdc_amount(amount: u64): (u64, u64) {
        let whole_part = amount / 1000000;
        let decimal_part = amount % 1000000;
        (whole_part, decimal_part)
    }
}