# Local Testing Script for Bill Splitter Contracts (PowerShell)
# This script sets up a local Aptos node and tests the contracts

Write-Host "🧪 Setting up Local Testing Environment..." -ForegroundColor Yellow

# Check if Aptos CLI is installed
try {
    $aptosVersion = aptos --version
    Write-Host "✅ Aptos CLI found: $aptosVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Aptos CLI not found. Please install it first." -ForegroundColor Red
    Write-Host "Install from: https://aptos.dev/tools/aptos-cli-tool/install-aptos-cli" -ForegroundColor Yellow
    exit 1
}

# Start local testnet
Write-Host "🚀 Starting local Aptos testnet..." -ForegroundColor Yellow
Write-Host "This will start a local blockchain node on your machine." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the local node when testing is complete." -ForegroundColor Cyan

# Start the local testnet in the background
Start-Process -FilePath "aptos" -ArgumentList "node", "run-local-testnet", "--with-faucet", "--force-restart" -WindowStyle Hidden

# Wait for the node to start
Write-Host "⏳ Waiting for local node to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Get the local node URL
$LOCAL_NODE_URL = "http://127.0.0.1:8080"
$LOCAL_FAUCET_URL = "http://127.0.0.1:8081"

Write-Host "✅ Local testnet started!" -ForegroundColor Green
Write-Host "📡 Node URL: $LOCAL_NODE_URL" -ForegroundColor Blue
Write-Host "💰 Faucet URL: $LOCAL_FAUCET_URL" -ForegroundColor Blue

# Create a test profile for local testing
Write-Host "👤 Creating test profile..." -ForegroundColor Yellow
aptos init --profile localtest --network local --assume-yes

# Fund the account
Write-Host "💰 Funding test account..." -ForegroundColor Yellow
aptos account fund-with-faucet --profile localtest --amount 100000000

# Get the account address
$ACCOUNT_ADDRESS = (aptos account list --profile localtest --query account | Select-String -Pattern '0x[a-fA-F0-9]*').Matches[0].Value

Write-Host "✅ Test account created: $ACCOUNT_ADDRESS" -ForegroundColor Green

# Compile contracts
Write-Host "🔨 Compiling contracts..." -ForegroundColor Yellow
aptos move compile --profile localtest

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Compilation failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Contracts compiled successfully" -ForegroundColor Green

# Publish contracts to local testnet
Write-Host "📦 Publishing contracts to local testnet..." -ForegroundColor Yellow
aptos move publish --profile localtest --assume-yes

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Publishing failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Contracts published to local testnet!" -ForegroundColor Green

# Initialize the system
Write-Host "🎛️ Initializing bill splitter system..." -ForegroundColor Yellow
aptos move run --function-id "${ACCOUNT_ADDRESS}::bill_splitter::initialize" --profile localtest --assume-yes

Write-Host "✅ System initialized" -ForegroundColor Green

# Create test participants
Write-Host "👥 Creating test participants..." -ForegroundColor Yellow

# Create participant 1
aptos account create --profile participant1 --network local
$PARTICIPANT1 = (aptos account list --profile participant1 --query account | Select-String -Pattern '0x[a-fA-F0-9]*').Matches[0].Value
aptos account fund-with-faucet --profile participant1 --amount 10000000

# Create participant 2
aptos account create --profile participant2 --network local
$PARTICIPANT2 = (aptos account list --profile participant2 --query account | Select-String -Pattern '0x[a-fA-F0-9]*').Matches[0].Value
aptos account fund-with-faucet --profile participant2 --amount 10000000

# Create participant 3
aptos account create --profile participant3 --network local
$PARTICIPANT3 = (aptos account list --profile participant3 --query account | Select-String -Pattern '0x[a-fA-F0-9]*').Matches[0].Value
aptos account fund-with-faucet --profile participant3 --amount 10000000

Write-Host "✅ Test participants created" -ForegroundColor Green

# Create a test bill session
Write-Host "🧾 Creating test bill session..." -ForegroundColor Yellow
aptos move run --function-id "${ACCOUNT_ADDRESS}::bill_splitter::create_bill_session" --args string:"LOCAL_TEST_BILL" u64:150000000 string:"Local Test Bill" vector:address:"${PARTICIPANT1},${PARTICIPANT2},${PARTICIPANT3}" vector:string:"Alice,Bob,Charlie" u64:2 --profile localtest --assume-yes

Write-Host "✅ Test bill session created" -ForegroundColor Green

# Output summary
Write-Host ""
Write-Host "🎉 LOCAL TESTING SETUP COMPLETE! 🎉" -ForegroundColor Green
Write-Host ""
Write-Host "📋 LOCAL TESTNET INFO:" -ForegroundColor Blue
Write-Host "  Node URL: $LOCAL_NODE_URL"
Write-Host "  Faucet URL: $LOCAL_FAUCET_URL"
Write-Host "  Contract Address: $ACCOUNT_ADDRESS"
Write-Host ""
Write-Host "👥 TEST PARTICIPANTS:" -ForegroundColor Blue
Write-Host "  Alice: $PARTICIPANT1"
Write-Host "  Bob: $PARTICIPANT2"
Write-Host "  Charlie: $PARTICIPANT3"
Write-Host ""
Write-Host "🧾 TEST BILL:" -ForegroundColor Blue
Write-Host "  Session ID: LOCAL_TEST_BILL"
Write-Host "  Amount: 150 USDC"
Write-Host "  Participants: 3"
Write-Host ""
Write-Host "🔧 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "  1. Update your frontend with local node URL:"
Write-Host "     APTOS_NODE_URL=$LOCAL_NODE_URL"
Write-Host "     APTOS_CONTRACT_ADDRESS=$ACCOUNT_ADDRESS"
Write-Host ""
Write-Host "  2. Test the bill splitting flow in your app"
Write-Host ""
Write-Host "  3. Check bill status:"
Write-Host "     aptos move view --function-id ${ACCOUNT_ADDRESS}::bill_splitter::get_bill_session --args string:LOCAL_TEST_BILL"
Write-Host ""
Write-Host "🚀 Ready for local testing!" -ForegroundColor Green
Write-Host "💡 The local node is running. Close this window to stop it when done." -ForegroundColor Yellow
