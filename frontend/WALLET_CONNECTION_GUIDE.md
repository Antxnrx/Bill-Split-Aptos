# 🔗 Wallet Connection Guide

## 🧪 **Mock Mode Testing (Current Setup)**

Your app is currently in **Mock Mode** for local testing. Here's how to connect a wallet:

### **1. Connect Mock Wallet**
- Click the **"Connect Mock Wallet"** button on the home screen
- This connects you as **Alice** with:
  - Address: `0x1111...1111`
  - Balance: 1000 USDC
  - Network: Mock Testnet

### **2. Test Features**
Once connected, you can:
- ✅ Create bill sessions
- ✅ Add participants
- ✅ Sign agreements
- ✅ Process payments
- ✅ View transaction history

## 🔗 **Real Wallet Connection (For Production)**

When you're ready to test with real blockchain, here are the options:

### **Option 1: Petra Wallet (Recommended)**
1. **Install Petra Wallet**:
   - Chrome: [Petra Wallet Extension](https://chrome.google.com/webstore/detail/petra-aptos-wallet/ejjladinnckdgjemekebdpeokbikhfci)
   - Firefox: [Petra Wallet Extension](https://addons.mozilla.org/en-US/firefox/addon/petra-wallet/)

2. **Create/Import Account**:
   - Create new account or import existing
   - Fund with testnet tokens from [Aptos Faucet](https://faucet.testnet.aptoslabs.com/)

3. **Connect to App**:
   - Click "Connect Wallet" in your app
   - Select Petra Wallet
   - Approve connection

### **Option 2: Martian Wallet**
1. **Install Martian Wallet**:
   - [Martian Wallet Extension](https://martianwallet.xyz/)

2. **Setup Account**:
   - Create new account
   - Fund with testnet tokens

3. **Connect to App**:
   - Click "Connect Wallet"
   - Select Martian Wallet

### **Option 3: Pontem Wallet**
1. **Install Pontem Wallet**:
   - [Pontem Wallet Extension](https://pontem.network/)

2. **Setup Account**:
   - Create new account
   - Fund with testnet tokens

3. **Connect to App**:
   - Click "Connect Wallet"
   - Select Pontem Wallet

## 🧪 **Mock Participants for Testing**

In mock mode, you have these test participants:

### **Alice** (You)
- Address: `0x1111111111111111111111111111111111111111`
- Balance: 1000 USDC
- Role: Primary user

### **Bob**
- Address: `0x2222222222222222222222222222222222222222`
- Balance: 1000 USDC
- Role: Test participant

### **Charlie**
- Address: `0x3333333333333333333333333333333333333333`
- Balance: 1000 USDC
- Role: Test participant

## 🎯 **Testing Scenarios**

### **Scenario 1: Create Bill Session**
1. Connect mock wallet (Alice)
2. Click "Create New Bill"
3. Fill in details:
   - Description: "Dinner at Restaurant XYZ"
   - Amount: 150 USDC
   - Participants: Add Bob and Charlie
4. Create session

### **Scenario 2: Join Session**
1. Use QR code or session ID
2. Add participant details
3. Sign agreement

### **Scenario 3: Process Payment**
1. Go to Payments screen
2. Click "Pay Now"
3. Confirm payment

## 🔧 **Switching to Real Blockchain**

When ready for real blockchain testing:

### **1. Deploy Contracts**
```bash
cd contracts
./scripts/deploy.sh
```

### **2. Update Environment**
```bash
# Set in your .env file
USE_MOCK_MODE=false
APTOS_CONTRACT_ADDRESS=0x[your-deployed-address]
```

### **3. Install Real Wallet**
- Install Petra, Martian, or Pontem wallet
- Fund with testnet tokens

### **4. Connect Real Wallet**
- Click "Connect Wallet"
- Select your wallet
- Approve connection

## 🚀 **Quick Start for Testing**

### **Right Now (Mock Mode)**:
1. Open your app: `http://localhost:3000`
2. Click "Connect Mock Wallet"
3. Start testing all features!

### **For Real Blockchain**:
1. Install Petra Wallet
2. Get testnet tokens from faucet
3. Deploy contracts
4. Connect real wallet

## 💡 **Tips**

- **Mock Mode**: Perfect for UI/UX testing and demos
- **Real Mode**: Use for blockchain functionality testing
- **Testnet**: Always use testnet for development
- **Mainnet**: Only for production deployment

## 🎉 **You're Ready!**

Your app supports both mock and real wallet connections. Start with mock mode for testing, then switch to real wallets when ready for blockchain testing!
