#!/bin/bash

# Local Testing Script for Bill Splitter Contracts
# This script sets up a local Aptos node and tests the contracts

echo "🧪 Setting up Local Testing Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Aptos CLI is installed
if ! command -v aptos &> /dev/null; then
    echo -e "${RED}❌ Aptos CLI not found. Please install it first.${NC}"
    echo "Install from: https://aptos.dev/tools/aptos-cli-tool/install-aptos-cli"
    exit 1
fi

echo -e "${GREEN}✅ Aptos CLI found (version: $(aptos --version))${NC}"

# Start local testnet
echo -e "${YELLOW}🚀 Starting local Aptos testnet...${NC}"
echo "This will start a local blockchain node on your machine."
echo "Press Ctrl+C to stop the local node when testing is complete."

# Start the local testnet in the background
aptos node run-local-testnet --with-faucet --force-restart &

# Wait for the node to start
echo -e "${YELLOW}⏳ Waiting for local node to start...${NC}"
sleep 10

# Get the local node URL
LOCAL_NODE_URL="http://127.0.0.1:8080"
LOCAL_FAUCET_URL="http://127.0.0.1:8081"

echo -e "${GREEN}✅ Local testnet started!${NC}"
echo -e "${BLUE}📡 Node URL: ${LOCAL_NODE_URL}${NC}"
echo -e "${BLUE}💰 Faucet URL: ${LOCAL_FAUCET_URL}${NC}"

# Create a test profile for local testing
echo -e "${YELLOW}👤 Creating test profile...${NC}"
aptos init --profile localtest --network local --assume-yes

# Fund the account
echo -e "${YELLOW}💰 Funding test account...${NC}"
aptos account fund-with-faucet --profile localtest --amount 100000000

# Get the account address
ACCOUNT_ADDRESS=$(aptos account list --profile localtest --query account | grep -o '0x[a-fA-F0-9]*')

echo -e "${GREEN}✅ Test account created: ${ACCOUNT_ADDRESS}${NC}"

# Compile contracts
echo -e "${YELLOW}🔨 Compiling contracts...${NC}"
aptos move compile --profile localtest

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Compilation failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Contracts compiled successfully${NC}"

# Publish contracts to local testnet
echo -e "${YELLOW}📦 Publishing contracts to local testnet...${NC}"
aptos move publish --profile localtest --assume-yes

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Publishing failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Contracts published to local testnet!${NC}"

# Initialize the system
echo -e "${YELLOW}🎛️ Initializing bill splitter system...${NC}"
aptos move run \
    --function-id ${ACCOUNT_ADDRESS}::bill_splitter::initialize \
    --profile localtest \
    --assume-yes

echo -e "${GREEN}✅ System initialized${NC}"

# Create test participants
echo -e "${YELLOW}👥 Creating test participants...${NC}"

# Create participant 1
aptos account create --profile participant1 --network local
PARTICIPANT1=$(aptos account list --profile participant1 --query account | grep -o '0x[a-fA-F0-9]*')
aptos account fund-with-faucet --profile participant1 --amount 10000000

# Create participant 2
aptos account create --profile participant2 --network local
PARTICIPANT2=$(aptos account list --profile participant2 --query account | grep -o '0x[a-fA-F0-9]*')
aptos account fund-with-faucet --profile participant2 --amount 10000000

# Create participant 3
aptos account create --profile participant3 --network local
PARTICIPANT3=$(aptos account list --profile participant3 --query account | grep -o '0x[a-fA-F0-9]*')
aptos account fund-with-faucet --profile participant3 --amount 10000000

echo -e "${GREEN}✅ Test participants created${NC}"

# Create a test bill session
echo -e "${YELLOW}🧾 Creating test bill session...${NC}"
aptos move run \
    --function-id ${ACCOUNT_ADDRESS}::bill_splitter::create_bill_session \
    --args string:"LOCAL_TEST_BILL" u64:150000000 string:"Local Test Bill" vector:address:"${PARTICIPANT1},${PARTICIPANT2},${PARTICIPANT3}" vector:string:"Alice,Bob,Charlie" u64:2 \
    --profile localtest \
    --assume-yes

echo -e "${GREEN}✅ Test bill session created${NC}"

# Output summary
echo ""
echo -e "${GREEN}🎉 LOCAL TESTING SETUP COMPLETE! 🎉${NC}"
echo ""
echo -e "${BLUE}📋 LOCAL TESTNET INFO:${NC}"
echo "  Node URL: ${LOCAL_NODE_URL}"
echo "  Faucet URL: ${LOCAL_FAUCET_URL}"
echo "  Contract Address: ${ACCOUNT_ADDRESS}"
echo ""
echo -e "${BLUE}👥 TEST PARTICIPANTS:${NC}"
echo "  Alice: ${PARTICIPANT1}"
echo "  Bob: ${PARTICIPANT2}"
echo "  Charlie: ${PARTICIPANT3}"
echo ""
echo -e "${BLUE}🧾 TEST BILL:${NC}"
echo "  Session ID: LOCAL_TEST_BILL"
echo "  Amount: 150 USDC"
echo "  Participants: 3"
echo ""
echo -e "${YELLOW}🔧 NEXT STEPS:${NC}"
echo "  1. Update your frontend with local node URL:"
echo "     APTOS_NODE_URL=${LOCAL_NODE_URL}"
echo "     APTOS_CONTRACT_ADDRESS=${ACCOUNT_ADDRESS}"
echo ""
echo "  2. Test the bill splitting flow in your app"
echo ""
echo "  3. Check bill status:"
echo "     aptos move view --function-id ${ACCOUNT_ADDRESS}::bill_splitter::get_bill_session --args string:LOCAL_TEST_BILL"
echo ""
echo -e "${GREEN}🚀 Ready for local testing!${NC}"
echo -e "${YELLOW}💡 The local node is running. Press Ctrl+C to stop it when done.${NC}"
