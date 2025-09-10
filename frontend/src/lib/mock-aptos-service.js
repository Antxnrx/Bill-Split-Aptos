// Mock Aptos Service for Local Testing
// This simulates blockchain functionality for testing without deploying contracts

class MockAptosService {
  constructor() {
    this.contractAddress = '0x1234567890abcdef1234567890abcdef12345678';
    this.sessions = new Map();
    this.participants = new Map();
    
    // Initialize with some mock data
    this.initializeMockData();
  }

  initializeMockData() {
    // Mock participants
    const mockParticipants = [
      {
        address: '0x1111111111111111111111111111111111111111',
        name: 'Alice',
        balance: 1000000000 // 1000 USDC
      },
      {
        address: '0x2222222222222222222222222222222222222222',
        name: 'Bob', 
        balance: 1000000000 // 1000 USDC
      },
      {
        address: '0x3333333333333333333333333333333333333333',
        name: 'Charlie',
        balance: 1000000000 // 1000 USDC
      }
    ];

    mockParticipants.forEach(participant => {
      this.participants.set(participant.address, participant);
    });

    // Mock sessions
    const mockSessions = [
      {
        sessionId: 'MOCK_SESSION_1',
        description: 'Dinner at Restaurant XYZ',
        totalAmount: 150000000, // 150 USDC
        participants: mockParticipants,
        status: 0, // CREATED
        createdAt: Date.now(),
        requiredSignatures: 2,
        currentSignatures: 0,
        paymentsReceived: 0
      },
      {
        sessionId: 'MOCK_SESSION_2',
        description: 'Conference Lunch',
        totalAmount: 200000000, // 200 USDC
        participants: mockParticipants.slice(0, 2),
        status: 2, // APPROVED
        createdAt: Date.now() - 3600000, // 1 hour ago
        requiredSignatures: 2,
        currentSignatures: 2,
        paymentsReceived: 0
      }
    ];

    mockSessions.forEach(session => {
      this.sessions.set(session.sessionId, session);
    });
  }

  async createBillSession(sessionId, totalAmount, participantAddresses, participantNames, requiredSignatures) {
    console.log('🔨 Mock: Creating bill session', { sessionId, totalAmount, participantAddresses, participantNames, requiredSignatures });
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const session = {
      sessionId,
      totalAmount,
      participantAddresses,
      participantNames,
      requiredSignatures,
      status: 0, // CREATED
      currentSignatures: 0,
      paymentsReceived: 0,
      createdAt: Date.now(),
      transactionHash: '0x' + Math.random().toString(16).substr(2, 64)
    };
    
    this.sessions.set(sessionId, session);
    return session;
  }

  async getBillSession(sessionId) {
    console.log('📖 Mock: Getting bill session', sessionId);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    return {
      sessionId: session.sessionId,
      merchantAddress: this.contractAddress,
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
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    return session.participants.map((participant, index) => ({
      address: participant.address,
      name: participant.name,
      amountOwed: Math.floor(session.totalAmount / session.participants.length),
      hasSigned: Math.random() > 0.5,
      hasPaid: Math.random() > 0.7,
      paymentTimestamp: Math.random() > 0.7 ? Date.now() - Math.random() * 3600000 : 0
    }));
  }

  async signBillAgreement(sessionId, participantAccount) {
    console.log('✍️ Mock: Signing bill agreement', { sessionId, participant: participantAccount?.address || 'mock-address' });
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const session = this.sessions.get(sessionId);
    if (session) {
      session.currentSignatures = (session.currentSignatures || 0) + 1;
      if (session.currentSignatures >= session.requiredSignatures) {
        session.status = 2; // APPROVED
      }
    }
    
    return {
      sessionId,
      transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
      success: true
    };
  }

  async submitPayment(sessionId, participantAccount, paymentAmount) {
    console.log('💳 Mock: Submitting payment', { sessionId, participant: participantAccount?.address || 'mock-address', amount: paymentAmount });
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const session = this.sessions.get(sessionId);
    if (session) {
      session.paymentsReceived = (session.paymentsReceived || 0) + paymentAmount;
      if (session.paymentsReceived >= session.totalAmount) {
        session.status = 3; // SETTLED
      }
    }
    
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
      timestamp: Date.now(),
      mockMode: true
    };
  }

  // Mock wallet functions
  async connectWallet() {
    return {
      address: '0x1111111111111111111111111111111111111111',
      isConnected: true,
      network: 'mock-testnet'
    };
  }

  async getBalance(address) {
    const participant = this.participants.get(address);
    return participant ? participant.balance : 0;
  }
}

// Export singleton instance
export default new MockAptosService();
