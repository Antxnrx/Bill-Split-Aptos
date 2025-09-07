// Mock Testing Setup for Bill Splitter
// This creates realistic test data for local testing

// Mock contract addresses (these would be real addresses in production)
const MOCK_CONTRACT_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';
const MOCK_PARTICIPANTS = [
  {
    address: '0x1111111111111111111111111111111111111111',
    name: 'Alice',
    privateKey: '0x1111111111111111111111111111111111111111111111111111111111111111'
  },
  {
    address: '0x2222222222222222222222222222222222222222', 
    name: 'Bob',
    privateKey: '0x2222222222222222222222222222222222222222222222222222222222222222'
  },
  {
    address: '0x3333333333333333333333333333333333333333',
    name: 'Charlie', 
    privateKey: '0x3333333333333333333333333333333333333333333333333333333333333333'
  }
];

// Mock bill sessions for testing
const MOCK_SESSIONS = [
  {
    sessionId: 'MOCK_SESSION_1',
    description: 'Dinner at Restaurant XYZ',
    totalAmount: 150000000, // 150 USDC (8 decimals)
    participants: MOCK_PARTICIPANTS,
    status: 0, // CREATED
    createdAt: Date.now(),
    qrCodeData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
  },
  {
    sessionId: 'MOCK_SESSION_2', 
    description: 'Conference Lunch',
    totalAmount: 200000000, // 200 USDC
    participants: MOCK_PARTICIPANTS.slice(0, 2),
    status: 2, // APPROVED
    createdAt: Date.now() - 3600000, // 1 hour ago
    qrCodeData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
  }
];

// Mock Aptos service for testing
class MockAptosService {
  constructor() {
    this.contractAddress = MOCK_CONTRACT_ADDRESS;
    this.sessions = new Map();
    
    // Initialize with mock sessions
    MOCK_SESSIONS.forEach(session => {
      this.sessions.set(session.sessionId, session);
    });
  }

  async createBillSession(sessionId, totalAmount, participantAddresses, participantNames, requiredSignatures) {
    console.log('🔨 Mock: Creating bill session', { sessionId, totalAmount, participantAddresses, participantNames, requiredSignatures });
    
    const session = {
      sessionId,
      totalAmount,
      participantAddresses,
      participantNames,
      requiredSignatures,
      status: 'created',
      transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
      createdAt: Date.now()
    };
    
    this.sessions.set(sessionId, session);
    return session;
  }

  async getBillSession(sessionId) {
    console.log('📖 Mock: Getting bill session', sessionId);
    
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    return {
      sessionId: session.sessionId,
      merchantAddress: MOCK_CONTRACT_ADDRESS,
      multisigAddress: '0x' + Math.random().toString(16).substr(2, 40),
      totalAmount: session.totalAmount,
      description: session.description || 'Mock Bill Session',
      status: session.status || 0,
      requiredSignatures: session.requiredSignatures || 2,
      currentSignatures: session.currentSignatures || 0,
      paymentsReceived: session.paymentsReceived || 0,
      createdAt: session.createdAt || Date.now()
    };
  }

  async getParticipants(sessionId) {
    console.log('👥 Mock: Getting participants', sessionId);
    
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    return MOCK_PARTICIPANTS.map((participant, index) => ({
      address: participant.address,
      name: participant.name,
      amountOwed: Math.floor(session.totalAmount / MOCK_PARTICIPANTS.length),
      hasSigned: Math.random() > 0.5,
      hasPaid: Math.random() > 0.7,
      paymentTimestamp: Math.random() > 0.7 ? Date.now() - Math.random() * 3600000 : 0
    }));
  }

  async signBillAgreement(sessionId, participantAccount) {
    console.log('✍️ Mock: Signing bill agreement', { sessionId, participant: participantAccount.address() });
    
    return {
      sessionId,
      transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
      success: true
    };
  }

  async submitPayment(sessionId, participantAccount, paymentAmount) {
    console.log('💳 Mock: Submitting payment', { sessionId, participant: participantAccount.address(), amount: paymentAmount });
    
    return {
      sessionId,
      paymentAmount,
      transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
      success: true
    };
  }

  async checkHealth() {
    return {
      status: 'healthy',
      chainId: 1,
      epoch: 1000,
      timestamp: Date.now()
    };
  }
}

// Export for use in other files
module.exports = {
  MockAptosService,
  MOCK_CONTRACT_ADDRESS,
  MOCK_PARTICIPANTS,
  MOCK_SESSIONS
};

// If run directly, show the mock data
if (require.main === module) {
  console.log('🧪 Mock Testing Environment Setup');
  console.log('');
  console.log('📋 Mock Contract Address:', MOCK_CONTRACT_ADDRESS);
  console.log('');
  console.log('👥 Mock Participants:');
  MOCK_PARTICIPANTS.forEach((participant, index) => {
    console.log(`  ${index + 1}. ${participant.name}: ${participant.address}`);
  });
  console.log('');
  console.log('🧾 Mock Sessions:');
  MOCK_SESSIONS.forEach((session, index) => {
    console.log(`  ${index + 1}. ${session.description} (${session.totalAmount / 1000000} USDC)`);
  });
  console.log('');
  console.log('✅ Mock environment ready for testing!');
  console.log('');
  console.log('🔧 To use in your app:');
  console.log('  1. Replace aptos-service.js with MockAptosService');
  console.log('  2. Use the mock addresses in your frontend');
  console.log('  3. Test the complete bill splitting flow');
}
