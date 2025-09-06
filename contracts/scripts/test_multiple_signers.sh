#!/bin/bash

# Bill Splitter Multi-Signer Testing Script
# Quick setup and testing for multiple participants

set -e

echo "🎯 Bill Splitter Multi-Signer Testing"
echo "====================================="

# Configuration
NETWORK="testnet"
CONTRACT_ADDRESS=""
ADMIN_KEY=""
MERCHANT_KEY=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to create test account
create_test_account() {
    local account_name=$1
    log_info "Creating $account_name account..."
    
    local output=$(aptos account create --network $NETWORK 2>&1)
    
    if [[ $? -eq 0 ]]; then
        local address=$(echo "$output" | grep "Account address:" | awk '{print $3}')
        local private_key=$(echo "$output" | grep "Private key:" | awk '{print $3}')
        
        log_success "$account_name created: $address"
        
        # Fund from faucet
        aptos account fund-with-faucet --account $address --network $NETWORK > /dev/null 2>&1
        log_success "$account_name funded from faucet"
        
        echo "$address,$private_key"
    else
        log_error "Failed to create $account_name account"
        exit 1
    fi
}

# Function to setup test environment
setup_environment() {
    log_info "Setting up test environment..."
    
    # Create admin account
    admin_info=$(create_test_account "Admin")
    ADMIN_ADDRESS=$(echo $admin_info | cut -d',' -f1)
    ADMIN_KEY=$(echo $admin_info | cut -d',' -f2)
    
    # Create merchant account
    merchant_info=$(create_test_account "Merchant")
    MERCHANT_ADDRESS=$(echo $merchant_info | cut -d',' -f1)
    MERCHANT_KEY=$(echo $merchant_info | cut -d',' -f2)
    
    CONTRACT_ADDRESS=$ADMIN_ADDRESS
    
    log_success "Environment setup complete"
    echo "Admin: $ADMIN_ADDRESS"
    echo "Merchant: $MERCHANT_ADDRESS"
}

# Function to deploy contracts
deploy_contracts() {
    log_info "Deploying contracts..."
    
    cd "$(dirname "$0")/.."
    
    local output=$(aptos move publish --private-key $ADMIN_KEY --network $NETWORK 2>&1)
    
    if [[ $? -eq 0 ]]; then
        log_success "Contracts deployed successfully"
    else
        log_error "Contract deployment failed"
        echo "$output"
        exit 1
    fi
}

# Function to initialize systems
initialize_systems() {
    log_info "Initializing bill splitter system..."
    
    # Initialize bill splitter
    aptos move run \
        --function-id "${CONTRACT_ADDRESS}::bill_splitter::initialize" \
        --private-key $ADMIN_KEY \
        --network $NETWORK > /dev/null 2>&1
    
    if [[ $? -eq 0 ]]; then
        log_success "Bill splitter initialized"
    else
        log_error "Failed to initialize bill splitter"
        exit 1
    fi
    
    # Initialize USDC
    aptos move run \
        --function-id "${CONTRACT_ADDRESS}::usdc_utils::initialize_usdc" \
        --private-key $ADMIN_KEY \
        --network $NETWORK > /dev/null 2>&1
    
    if [[ $? -eq 0 ]]; then
        log_success "USDC system initialized"
    else
        log_error "Failed to initialize USDC system"
        exit 1
    fi
}

# Function to create test participants
create_participants() {
    local count=$1
    log_info "Creating $count test participants..."
    
    declare -a PARTICIPANT_ADDRESSES
    declare -a PARTICIPANT_KEYS
    
    for ((i=1; i<=count; i++)); do
        participant_info=$(create_test_account "Participant_$i")
        addr=$(echo $participant_info | cut -d',' -f1)
        key=$(echo $participant_info | cut -d',' -f2)
        
        PARTICIPANT_ADDRESSES+=($addr)
        PARTICIPANT_KEYS+=($key)
        
        # Mint test USDC tokens
        aptos move run \
            --function-id "${CONTRACT_ADDRESS}::usdc_utils::mint_usdc_for_testing" \
            --args "address:$addr" "u64:1000000000" \
            --private-key $ADMIN_KEY \
            --network $NETWORK > /dev/null 2>&1
        
        log_success "Participant $i: $addr (1000 USDC minted)"
    done
    
    # Export arrays for use in other functions
    export PARTICIPANT_ADDRESSES
    export PARTICIPANT_KEYS
}

# Function to test small group scenario
test_small_group() {
    local num_participants=5
    log_info "Testing small group scenario ($num_participants participants)..."
    
    create_participants $num_participants
    
    # Prepare participant data
    local addresses_arg=""
    local names_arg=""
    
    for ((i=0; i<num_participants; i++)); do
        if [[ $i -eq 0 ]]; then
            addresses_arg="${PARTICIPANT_ADDRESSES[$i]}"
            names_arg="Participant_$((i+1))"
        else
            addresses_arg="${addresses_arg},${PARTICIPANT_ADDRESSES[$i]}"
            names_arg="${names_arg},Participant_$((i+1))"
        fi
    done
    
    local session_id="SMALL_GROUP_TEST_$(date +%s)"
    local total_amount=150000000  # $150
    local individual_amount=$((total_amount / num_participants))
    
    # Create bill session
    log_info "Creating bill session..."
    aptos move run \
        --function-id "${CONTRACT_ADDRESS}::bill_splitter::create_bill_session" \
        --args \
            "string:$session_id" \
            "u64:$total_amount" \
            "string:Small Group Test Bill" \
            "vector<address>:$addresses_arg" \
            "vector<string>:$names_arg" \
            "u64:$num_participants" \
        --private-key $MERCHANT_KEY \
        --network $NETWORK > /dev/null 2>&1
    
    if [[ $? -eq 0 ]]; then
        log_success "Bill session created: $session_id"
    else
        log_error "Failed to create bill session"
        return 1
    fi
    
    # Confirm participants
    log_info "Confirming participants..."
    aptos move run \
        --function-id "${CONTRACT_ADDRESS}::bill_splitter::confirm_participants" \
        --args "string:$session_id" \
        --private-key $MERCHANT_KEY \
        --network $NETWORK > /dev/null 2>&1
    
    # All participants sign
    log_info "Participants signing agreement..."
    for ((i=0; i<num_participants; i++)); do
        aptos move run \
            --function-id "${CONTRACT_ADDRESS}::bill_splitter::sign_bill_agreement" \
            --args "string:$session_id" \
            --private-key ${PARTICIPANT_KEYS[$i]} \
            --network $NETWORK > /dev/null 2>&1
        
        log_success "Participant $((i+1)) signed"
    done
    
    # All participants pay
    log_info "Participants submitting payments..."
    for ((i=0; i<num_participants; i++)); do
        aptos move run \
            --function-id "${CONTRACT_ADDRESS}::bill_splitter::submit_payment" \
            --args "string:$session_id" "u64:$individual_amount" \
            --private-key ${PARTICIPANT_KEYS[$i]} \
            --network $NETWORK > /dev/null 2>&1
        
        log_success "Participant $((i+1)) paid \$$((individual_amount / 1000000))"
    done
    
    log_success "Small group test completed successfully!"
}

# Function to test signature thresholds
test_signature_thresholds() {
    local num_participants=10
    log_info "Testing signature threshold scenarios ($num_participants participants)..."
    
    create_participants $num_participants
    
    # Test different thresholds
    local thresholds=(1 3 5 7 10)  # Different signature requirements
    
    for threshold in "${thresholds[@]}"; do
        log_info "Testing threshold: $threshold/$num_participants signatures required"
        
        # Prepare participant data
        local addresses_arg=""
        local names_arg=""
        
        for ((i=0; i<num_participants; i++)); do
            if [[ $i -eq 0 ]]; then
                addresses_arg="${PARTICIPANT_ADDRESSES[$i]}"
                names_arg="Threshold_Participant_$((i+1))"
            else
                addresses_arg="${addresses_arg},${PARTICIPANT_ADDRESSES[$i]}"
                names_arg="${names_arg},Threshold_Participant_$((i+1))"
            fi
        done
        
        local session_id="THRESHOLD_TEST_${threshold}_$(date +%s)"
        
        # Create bill session with specific threshold
        aptos move run \
            --function-id "${CONTRACT_ADDRESS}::bill_splitter::create_bill_session" \
            --args \
                "string:$session_id" \
                "u64:100000000" \
                "string:Threshold Test Bill" \
                "vector<address>:$addresses_arg" \
                "vector<string>:$names_arg" \
                "u64:$threshold" \
            --private-key $MERCHANT_KEY \
            --network $NETWORK > /dev/null 2>&1
        
        # Confirm participants
        aptos move run \
            --function-id "${CONTRACT_ADDRESS}::bill_splitter::confirm_participants" \
            --args "string:$session_id" \
            --private-key $MERCHANT_KEY \
            --network $NETWORK > /dev/null 2>&1
        
        # Have exactly 'threshold' participants sign
        for ((i=0; i<threshold; i++)); do
            aptos move run \
                --function-id "${CONTRACT_ADDRESS}::bill_splitter::sign_bill_agreement" \
                --args "string:$session_id" \
                --private-key ${PARTICIPANT_KEYS[$i]} \
                --network $NETWORK > /dev/null 2>&1
        done
        
        log_success "Threshold test $threshold/$num_participants completed"
    done
    
    log_success "All signature threshold tests completed!"
}

# Function to check balances
check_balances() {
    log_info "Checking final balances..."
    
    echo "Admin USDC balance:"
    aptos move view \
        --function-id "${CONTRACT_ADDRESS}::usdc_utils::get_usdc_balance" \
        --args "address:$ADMIN_ADDRESS" \
        --network $NETWORK 2>/dev/null || echo "0"
    
    echo "Merchant USDC balance:"
    aptos move view \
        --function-id "${CONTRACT_ADDRESS}::usdc_utils::get_usdc_balance" \
        --args "address:$MERCHANT_ADDRESS" \
        --network $NETWORK 2>/dev/null || echo "0"
}

# Main execution
main() {
    echo "Starting Bill Splitter multi-signer testing..."
    
    setup_environment
    deploy_contracts
    initialize_systems
    
    echo ""
    log_info "Running test scenarios..."
    
    # Run tests
    test_small_group
    echo ""
    test_signature_thresholds
    echo ""
    check_balances
    
    echo ""
    log_success "🎉 All tests completed successfully!"
    echo ""
    echo "Summary:"
    echo "- Small group test: ✅ Completed"
    echo "- Signature threshold tests: ✅ Completed"
    echo "- Contract address: $CONTRACT_ADDRESS"
    echo "- Network: $NETWORK"
}

# Run main function
main "$@"
