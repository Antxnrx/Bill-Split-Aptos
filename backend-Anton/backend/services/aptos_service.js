const { AptosClient, AptosAccount, FaucetClient, Types } = require('aptos');
const config = require('../config');

class AptosService {
  constructor() {
    this.client = new AptosClient(config.aptos.nodeUrl);
    if (config.aptos.faucetUrl) {
      this.faucetClient = new FaucetClient(config.aptos.faucetUrl, this.client);
    }
    this.adminAccount = config.aptos.privateKey
      ? new AptosAccount(Buffer.from(config.aptos.privateKey.replace('0x', ''), 'hex'))
      : null;
    this.contractAddress = config.aptos.contractAddress;
  }

  async createBillSession(sessionId, totalAmount, participantCount) {
    // Placeholder: Call move contract to create bill session on-chain
    // For demo, return success
    return { sessionId, totalAmount, participantCount };
  }

  async addParticipant(sessionId, participantAddress) {
    // Placeholder: Call move contract to add participant
    return { sessionId, participantAddress };
  }

  async finalizeSession(sessionId) {
    // Placeholder: Call move contract finalize entry function
    return { sessionId, finalized: true };
  }

  async getSessionStatus(sessionId) {
    // Placeholder: Query on-chain bill session status
    return {
      sessionId,
      participants: [],
      paidParticipants: [],
      finalized: false
    };
  }
}

module.exports = new AptosService();
