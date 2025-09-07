# Simple Local Testing Script for Bill Splitter
# This creates a mock local environment for testing

Write-Host "🧪 Setting up Simple Local Testing Environment..." -ForegroundColor Yellow

# Create a local test profile
Write-Host "👤 Creating local test profile..." -ForegroundColor Yellow
aptos init --profile localtest --network local --assume-yes

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

# Create test participants
Write-Host "👥 Creating test participants..." -ForegroundColor Yellow

# Create participant 1
aptos account create --profile participant1 --network local
$PARTICIPANT1 = (aptos account list --profile participant1 --query account | Select-String -Pattern '0x[a-fA-F0-9]*').Matches[0].Value

# Create participant 2
aptos account create --profile participant2 --network local
$PARTICIPANT2 = (aptos account list --profile participant2 --query account | Select-String -Pattern '0x[a-fA-F0-9]*').Matches[0].Value

# Create participant 3
aptos account create --profile participant3 --network local
$PARTICIPANT3 = (aptos account list --profile participant3 --query account | Select-String -Pattern '0x[a-fA-F0-9]*').Matches[0].Value

Write-Host "✅ Test participants created" -ForegroundColor Green

# Output summary
Write-Host ""
Write-Host "🎉 LOCAL TESTING SETUP COMPLETE! 🎉" -ForegroundColor Green
Write-Host ""
Write-Host "📋 TEST ACCOUNTS:" -ForegroundColor Blue
Write-Host "  Contract Account: $ACCOUNT_ADDRESS"
Write-Host "  Participant 1 (Alice): $PARTICIPANT1"
Write-Host "  Participant 2 (Bob): $PARTICIPANT2"
Write-Host "  Participant 3 (Charlie): $PARTICIPANT3"
Write-Host ""
Write-Host "🔧 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "  1. Update your frontend with these addresses"
Write-Host "  2. Use the test participants in your app"
Write-Host "  3. Test the complete bill splitting flow"
Write-Host ""
Write-Host "🚀 Ready for local testing!" -ForegroundColor Green
