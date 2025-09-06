#!/bin/bash

# Aptos Bill Splitting App - Deployment Script
# For hackathon setup and testing

echo "🚀 Setting up Aptos Bill Splitting App for Hackathon..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Aptos CLI is installed
if ! command -v aptos &> /dev/null; then
    echo -e "${RED}❌ Aptos CLI not found. Please install it first.${NC}"
    echo "Install from: https://aptos.dev/tools/aptos-cli-tool/install-aptos-cli"
    exit 1
fi

echo -e "${GREEN}✅ Aptos CLI found${NC}"

# Check if we're in the right directory
if [ ! -f "Move.toml" ]; then
    echo -e "${RED}❌ Move.toml not found. Please run this script from the project root.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Project structure validated${NC}"

# Initialize Aptos account if needed
echo -e "${YELLOW}📝 Setting up Aptos account...${NC}"
if [ ! -d ".aptos" ]; then
    echo "Creating new Aptos account for testnet..."
    aptos init --network testnet
else
    echo "Using existing Aptos configuration"
fi

# Fund the account with test APT
echo -e "${YELLOW}💰 Funding account with test APT...${NC}"
ACCOUNT_ADDRESS=$(aptos account list --query balance | grep -o '0x[a-fA-F0-9]*' | head -1)
echo "Account address: $ACCOUNT_ADDRESS"

# Request tokens from faucet
aptos account fund-with-faucet --account $ACCOUNT_ADDRESS --amount 100000000

# Compile the Move contracts
echo -e "${YELLOW}🔨 Compiling Move contracts...${NC}"
aptos move compile

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Compilation failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Contracts compiled successfully${NC}"

# Publish the contracts
echo -e "${YELLOW}📦 Publishing contracts to testnet...${NC}"
aptos move publish --profile default

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Publishing failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Contracts published successfully${NC}"

# Run initialization
echo -e "${YELLOW}🎛️ Initializing bill splitter system...${NC}"
aptos move run \
    --function-id ${ACCOUNT_ADDRESS}::test_helpers::setup_hackathon_demo \
    --profile default

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Initialization failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ System initialized${NC}"

# Create demo accounts for testing
echo -e "${YELLOW}👥 Setting up demo participants...${NC}"

# Create test accounts (in real hackathon, these would be actual participant wallets)
echo "Creating test participant accounts..."

# Account 1
aptos account create --account participant1 --profile default
PARTICIPANT1=$(aptos account list --query balance --profile participant1 | grep -o '0x[a-fA-F0-9]*' | head -1)

# Account 2  
aptos account create --account participant2 --profile default
PARTICIPANT2=$(aptos account list --query balance --profile participant2 | grep -o '0x[a-fA-F0-9]*' | head -1)

# Account 3
aptos account create --account participant3 --profile default
PARTICIPANT3=$(aptos account list --query balance --profile participant3 | grep -o '0x[a-fA-F0-9]*' | head -1)

echo "Participant addresses:"
echo "  Participant 1: $PARTICIPANT1"
echo "  Participant 2: $PARTICIPANT2"
echo "  Participant 3: $PARTICIPANT3"

# Fund participants with APT
echo -e "${YELLOW}💰 Funding participants with APT...${NC}"
aptos account fund-with-faucet --account $PARTICIPANT1 --amount 10000000
aptos account fund-with-faucet --account $PARTICIPANT2 --amount 10000000
aptos account fund-with-faucet --account $PARTICIPANT3 --amount 10000000

# Register participants for USDC and fund them
echo -e "${YELLOW}💵 Setting up USDC for participants...${NC}"

# Fund participants with test USDC
aptos move run \
    --function-id ${ACCOUNT_ADDRESS}::test_helpers::fund_test_participants \
    --args address:$PARTICIPANT1 address:$PARTICIPANT2 address:$PARTICIPANT3 u64:200000000 \
    --profile default

echo -e "${GREEN}✅ Demo accounts setup complete${NC}"

# Create a demo bill
echo -e "${YELLOW}🧾 Creating demo bill...${NC}"
aptos move run \
    --function-id ${ACCOUNT_ADDRESS}::test_helpers::create_demo_bill \
    --args address:$PARTICIPANT1 address:$PARTICIPANT2 address:$PARTICIPANT3 u64:150000000 \
    --profile default

echo -e "${GREEN}✅ Demo bill created${NC}"

# Output summary
echo ""
echo -e "${GREEN}🎉 HACKATHON SETUP COMPLETE! 🎉${NC}"
echo ""
echo "📋 SUMMARY:"
echo "  Contract Address: $ACCOUNT_ADDRESS"
echo "  Network: Testnet"
echo "  Demo Bill ID: HACKATHON_DEMO_BILL"
echo "  Bill Amount: $150 USDC"
echo ""
echo "👥 DEMO PARTICIPANTS:"
echo "  Alice (Participant 1): $PARTICIPANT1"
echo "  Bob (Participant 2): $PARTICIPANT2"
echo "  Charlie (Participant 3): $PARTICIPANT3"
echo ""
echo "🔗 USEFUL COMMANDS:"
echo "  Check bill status:"
echo "    aptos move view --function-id ${ACCOUNT_ADDRESS}::bill_splitter::get_bill_session --args string:HACKATHON_DEMO_BILL"
echo ""
echo "  Check participant balance:"
echo "    aptos move view --function-id ${ACCOUNT_ADDRESS}::usdc_utils::get_usdc_balance --args address:$PARTICIPANT1"
echo ""
echo "🌐 FRONTEND SETUP:"
echo "  Update your frontend config with:"
echo "  - Contract Address: $ACCOUNT_ADDRESS"
echo "  - Network: testnet"
echo "  - Node URL: https://fullnode.testnet.aptoslabs.com/v1"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "  1. Update your backend/frontend with the contract address"
echo "  2. Use the participant addresses for testing"
echo "  3. Demo the bill splitting flow in your app"
echo ""
echo -e "${GREEN}Ready for hackathon demo! 🚀${NC}"