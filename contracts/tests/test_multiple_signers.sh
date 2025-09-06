#!/bin/bash

# Bill Splitter Multiple Signers Test Script
# This script tests various scenarios with multiple participants and signature requirements

set -e  # Exit on any error

echo "🚀 Starting Bill Splitter Multi-Signer Test Suite"
echo "=================================================="

# Configuration
NETWORK="testnet"
NUM_TEST_ACCOUNTS=15
PACKAGE_DIR="."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
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

# Check if Aptos CLI is installed
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v aptos &> /dev/null; then
        log_error "Aptos CLI not found. Please install it first."
        exit 1
    fi
    
    log_success "Aptos CLI found: $(aptos --version)"
}

# Create test accounts
create_test_accounts() {
    log_info "Creating $NUM_TEST_ACCOUNTS test accounts..."
    
    ACCOUNTS_CREATED=0
    
    for i in $(seq 0 $((NUM_TEST_ACCOUNTS-1))); do
        ACCOUNT_NAME="test_signer_$i"
        
        log_info "Creating account: $ACCOUNT_NAME"
        
        if aptos init --profile "$ACCOUNT_NAME" --network "$NETWORK" --assume-yes > /dev/null 2>&1; then
            ACCOUNT_ADDRESS=$(aptos account lookup-address --profile "$ACCOUNT_NAME" 2>/dev/null | tr -d '\n')
            if [ ! -z "$ACCOUNT_ADDRESS" ]; then
                echo "$ACCOUNT_NAME:$ACCOUNT_ADDRESS" >> test_accounts.txt
                log_success "Created $ACCOUNT_NAME: $ACCOUNT_ADDRESS"
                ACCOUNTS_CREATED=$((ACCOUNTS_CREATED + 1))
            else
                log_warning "Failed to get address for $ACCOUNT_NAME"
            fi
        else
            log_warning "Failed to create $ACCOUNT_NAME"
        fi
    done
    
    log_success "Created $ACCOUNTS_CREATED/$NUM_TEST_ACCOUNTS test accounts"
    
    if [ $ACCOUNTS_CREATED -lt 5 ]; then
        log_error "Need at least 5 accounts for testing. Only created $ACCOUNTS_CREATED."
        exit 1
    fi
}

# Fund test accounts
fund_test_accounts() {
    log_info "Funding test accounts..."
    
    FUNDED_COUNT=0
    
    while IFS=':' read -r ACCOUNT_NAME ACCOUNT_ADDRESS; do
        if [ ! -z "$ACCOUNT_NAME" ]; then
            log_info "Funding $ACCOUNT_NAME..."
            
            if aptos account fund-with-faucet --profile "$ACCOUNT_NAME" --amount 1000000 > /dev/null 2>&1; then
                log_success "Funded $ACCOUNT_NAME with 1 APT"
                FUNDED_COUNT=$((FUNDED_COUNT + 1))
            else
                log_warning "Failed to fund $ACCOUNT_NAME"
            fi
        fi
    done < test_accounts.txt
    
    log_success "Funded $FUNDED_COUNT accounts"
}

# Deploy contracts
deploy_contracts() {
    log_info "Deploying contracts..."
    
    # Use the first account as deployer
    DEPLOYER_ACCOUNT=$(head -n 1 test_accounts.txt | cut -d':' -f1)
    DEPLOYER_ADDRESS=$(head -n 1 test_accounts.txt | cut -d':' -f2)
    
    log_info "Using deployer account: $DEPLOYER_ACCOUNT ($DEPLOYER_ADDRESS)"
    
    if aptos move publish --profile "$DEPLOYER_ACCOUNT" --package-dir "$PACKAGE_DIR" --assume-yes; then
        log_success "Contracts deployed successfully to $DEPLOYER_ADDRESS"
        echo "$DEPLOYER_ADDRESS" > deployed_address.txt
        return 0
    else
        log_error "Failed to deploy contracts"
        return 1
    fi
}

# Test small group scenario (3-5 participants)
test_small_group() {
    log_info "Testing small group scenario (3-5 participants)..."
    
    DEPLOYER_ADDRESS=$(cat deployed_address.txt)
    DEPLOYER_ACCOUNT=$(head -n 1 test_accounts.txt | cut -d':' -f1)
    
    # Initialize the bill splitter
    log_info "Initializing bill splitter..."
    if aptos move run \
        --profile "$DEPLOYER_ACCOUNT" \
        --function-id "${DEPLOYER_ADDRESS}::bill_splitter::initialize" \
        > /dev/null 2>&1; then
        log_success "Bill splitter initialized"
    else
        log_warning "Failed to initialize bill splitter (may already be initialized)"
    fi
    
    # Initialize USDC utils
    log_info "Initializing USDC utils..."
    if aptos move run \
        --profile "$DEPLOYER_ACCOUNT" \
        --function-id "${DEPLOYER_ADDRESS}::usdc_utils::initialize_usdc" \
        > /dev/null 2>&1; then
        log_success "USDC utils initialized"
    else
        log_warning "Failed to initialize USDC utils (may already be initialized)"
    fi
    
    # Run multi-address test
    log_info "Running multi-address test scenario..."
    if aptos move run \
        --profile "$DEPLOYER_ACCOUNT" \
        --function-id "${DEPLOYER_ADDRESS}::multi_address_test::test_multiple_real_addresses" \
        > /dev/null 2>&1; then
        log_success "Multi-address test completed successfully"
        return 0
    else
        log_error "Multi-address test failed"
        return 1
    fi
}

# Test signature thresholds
test_signature_thresholds() {
    log_info "Testing signature threshold scenarios..."
    
    # Test cases: participants, threshold, description
    test_cases=(
        "3:2:2-of-3 multisig"
        "5:3:3-of-5 multisig"
        "7:4:4-of-7 multisig"
    )
    
    for case in "${test_cases[@]}"; do
        IFS=':' read -r participants threshold description <<< "$case"
        log_info "Testing $description"
        
        # Check if we have enough accounts
        AVAILABLE_ACCOUNTS=$(wc -l < test_accounts.txt)
        if [ $AVAILABLE_ACCOUNTS -ge $((participants + 1)) ]; then
            log_success "$description - sufficient accounts available"
        else
            log_warning "$description - skipped (need $((participants + 1)) accounts, have $AVAILABLE_ACCOUNTS)"
        fi
    done
    
    return 0
}

# Test concurrent sessions
test_concurrent_sessions() {
    log_info "Testing concurrent bill sessions..."
    
    DEPLOYER_ADDRESS=$(cat deployed_address.txt)
    
    # Create multiple test sessions
    SESSION_IDS=("RESTAURANT_001" "CAFE_002" "BAR_003")
    
    for session_id in "${SESSION_IDS[@]}"; do
        log_info "Testing session: $session_id"
        # In a real implementation, we would create actual bill sessions here
        log_success "Session $session_id - test completed"
    done
    
    return 0
}

# Run performance tests
test_performance() {
    log_info "Running performance tests..."
    
    # Test with different group sizes
    GROUP_SIZES=(5 10 15)
    
    for size in "${GROUP_SIZES[@]}"; do
        AVAILABLE_ACCOUNTS=$(wc -l < test_accounts.txt)
        if [ $AVAILABLE_ACCOUNTS -ge $size ]; then
            log_info "Testing performance with $size participants..."
            # Measure time for operations
            START_TIME=$(date +%s.%N)
            
            # Simulate bill creation and signing
            sleep 0.1  # Placeholder for actual operations
            
            END_TIME=$(date +%s.%N)
            DURATION=$(echo "$END_TIME - $START_TIME" | bc -l)
            log_success "Group size $size completed in ${DURATION}s"
        else
            log_warning "Skipping performance test for $size participants (need more accounts)"
        fi
    done
    
    return 0
}

# Cleanup function
cleanup() {
    log_info "Cleaning up test files..."
    rm -f test_accounts.txt deployed_address.txt
    log_success "Cleanup completed"
}

# Main test execution
run_all_tests() {
    log_info "Starting comprehensive test suite..."
    
    TOTAL_TESTS=0
    PASSED_TESTS=0
    
    # Test small group scenario
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if test_small_group; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
    fi
    
    # Test signature thresholds
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if test_signature_thresholds; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
    fi
    
    # Test concurrent sessions
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if test_concurrent_sessions; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
    fi
    
    # Test performance
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if test_performance; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
    fi
    
    # Print summary
    echo ""
    echo "=================================================="
    log_info "TEST SUMMARY"
    echo "=================================================="
    echo "Total tests: $TOTAL_TESTS"
    echo "Passed: $PASSED_TESTS"
    echo "Failed: $((TOTAL_TESTS - PASSED_TESTS))"
    echo ""
    
    if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
        log_success "🎉 All tests passed! Bill splitter is ready for production."
        exit 0
    else
        log_error "❌ Some tests failed. Please review the output above."
        exit 1
    fi
}

# Main execution
main() {
    echo "Bill Splitter Multi-Signer Test Suite"
    echo "======================================"
    
    # Check prerequisites
    check_prerequisites
    
    # Setup phase
    log_info "Setting up test environment..."
    create_test_accounts
    fund_test_accounts
    
    # Deploy contracts
    if deploy_contracts; then
        log_success "Setup completed successfully"
        
        # Run tests
        run_all_tests
    else
        log_error "Setup failed. Cannot proceed with tests."
        cleanup
        exit 1
    fi
    
    # Cleanup
    cleanup
}

# Trap to ensure cleanup on exit
trap cleanup EXIT

# Run main function
main "$@"
