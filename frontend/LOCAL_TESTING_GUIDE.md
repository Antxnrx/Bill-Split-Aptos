# 🧪 Local Testing Guide

## What is Mock Mode?

Your Bill Split application now has **Mock Mode** enabled for local testing! This means:

- ✅ **No blockchain deployment needed** - Everything works locally
- ✅ **Realistic testing** - Simulates real blockchain behavior
- ✅ **Fast development** - No network delays or gas fees
- ✅ **Complete functionality** - All features work as expected

## 🚀 How to Test

### 1. **Start the Application**
```bash
cd frontend
npm run dev
```

### 2. **Open Your Browser**
Navigate to: `http://localhost:3000`

### 3. **What You'll See**
- **Contract Status**: Shows "Mock Mode" with green status
- **Mock Mode Badge**: Blue badge indicating local testing
- **All Features Work**: Create sessions, add participants, process payments

## 🧾 Test Scenarios

### **Scenario 1: Create a Bill Session**
1. Click "Create New Session"
2. Fill in:
   - Description: "Dinner at Restaurant XYZ"
   - Total Amount: 150 (USDC)
   - Participants: Add 3 friends
3. Click "Create Session"
4. **Result**: Session created with QR code (simulated)

### **Scenario 2: Join a Session**
1. Use the QR code or session ID
2. Add participant details
3. **Result**: Participant added to session

### **Scenario 3: Sign Agreement**
1. Go to Participants screen
2. Click "Sign Agreement" for each participant
3. **Result**: Signatures counted, session approved when threshold reached

### **Scenario 4: Make Payment**
1. Go to Payments screen
2. Click "Pay Now" for a participant
3. **Result**: Payment processed (simulated)

## 📊 Mock Data

### **Test Participants**
- **Alice**: `0x1111...1111` (1000 USDC balance)
- **Bob**: `0x2222...2222` (1000 USDC balance)  
- **Charlie**: `0x3333...3333` (1000 USDC balance)

### **Test Sessions**
- **Session 1**: Dinner at Restaurant XYZ (150 USDC, 3 participants)
- **Session 2**: Conference Lunch (200 USDC, 2 participants)

## 🔧 Mock Features

### **What's Simulated**
- ✅ Contract deployment
- ✅ Transaction creation
- ✅ Multisig signatures
- ✅ USDC payments
- ✅ Network delays (realistic timing)
- ✅ Transaction hashes
- ✅ Account balances

### **What's Real**
- ✅ Complete UI/UX flow
- ✅ All screens and navigation
- ✅ Form validation
- ✅ Error handling
- ✅ QR code generation
- ✅ API endpoints

## 🎯 Testing Checklist

- [ ] **Home Screen**: Contract status shows "Mock Mode"
- [ ] **Create Session**: Can create new bill sessions
- [ ] **Participants**: Can add and manage participants
- [ ] **Signatures**: Can sign agreements (simulated)
- [ ] **Payments**: Can process payments (simulated)
- [ ] **History**: Can view session history
- [ ] **Navigation**: All screens work properly
- [ ] **Mobile**: Responsive design works on phone

## 🚀 Next Steps

### **For Demo/Presentation**
- Mock mode is perfect for demos
- All functionality works
- No blockchain setup required
- Professional presentation ready

### **For Production**
- Deploy contracts to Aptos testnet
- Update environment variables
- Switch to real blockchain mode
- Test with real USDC tokens

## 🛠️ Switching to Real Blockchain

When ready to test with real blockchain:

1. **Deploy Contracts**:
   ```bash
   cd contracts
   ./scripts/deploy.sh
   ```

2. **Update Environment**:
   ```bash
   # Set in your .env file
   USE_MOCK_MODE=false
   APTOS_CONTRACT_ADDRESS=0x[your-deployed-address]
   ```

3. **Restart Application**:
   ```bash
   npm run dev
   ```

## 🎉 You're Ready!

Your Bill Split application is now ready for local testing! The mock mode provides a complete, realistic testing environment without any blockchain complexity.

**Happy Testing!** 🚀
