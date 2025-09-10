const { AptosClient, AptosAccount, FaucetClient, Types } = require('aptos');
const config = require('./config');

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

  async createBillSession(sessionId, totalAmount, participantAddresses, participantNames, requiredSignatures) {
    try {
      if (!this.adminAccount) {
        throw new Error('Admin account not configured');
      }

      // Call the Move contract to create bill session
      const payload = {
        type: "entry_function_payload",
        function: `${this.contractAddress}::bill_splitter::create_bill_session`,
        arguments: [
          sessionId,
          totalAmount.toString(),
          "Bill created via API", // description
          participantAddresses,
          participantNames,
          requiredSignatures.toString()
        ],
        type_arguments: []
      };

      const result = await this.client.generateSignSubmitTransaction(
        this.adminAccount,
        payload
      );

      return {
        sessionId,
        totalAmount,
        transactionHash: result.hash,
        success: true
      };
    } catch (error) {
      console.error('Error creating bill session:', error);
      throw error;
    }
  }

  async addParticipant(sessionId, participantAddress) {
    try {
      if (!this.adminAccount) {
        throw new Error('Admin account not configured');
      }

      const payload = {
        type: "entry_function_payload",
        function: `${this.contractAddress}::bill_splitter::update_participant_amount`,
        arguments: [
          sessionId,
          participantAddress,
          "0" // amount - will be calculated by contract
        ],
        type_arguments: []
      };

      const result = await this.client.generateSignSubmitTransaction(
        this.adminAccount,
        payload
      );

      return {
        sessionId,
        participantAddress,
        transactionHash: result.hash,
        success: true
      };
    } catch (error) {
      console.error('Error adding participant:', error);
      throw error;
    }
  }

  async signBillAgreement(sessionId, participantAccount) {
    try {
      const payload = {
        type: "entry_function_payload",
        function: `${this.contractAddress}::bill_splitter::sign_bill_agreement`,
        arguments: [sessionId],
        type_arguments: []
      };

      const result = await this.client.generateSignSubmitTransaction(
        participantAccount,
        payload
      );

      return {
        sessionId,
        transactionHash: result.hash,
        success: true
      };
    } catch (error) {
      console.error('Error signing bill agreement:', error);
      throw error;
    }
  }

  async submitPayment(sessionId, participantAccount, paymentAmount) {
    try {
      const payload = {
        type: "entry_function_payload",
        function: `${this.contractAddress}::bill_splitter::submit_payment`,
        arguments: [
          sessionId,
          paymentAmount.toString()
        ],
        type_arguments: []
      };

      const result = await this.client.generateSignSubmitTransaction(
        participantAccount,
        payload
      );

      return {
        sessionId,
        paymentAmount,
        transactionHash: result.hash,
        success: true
      };
    } catch (error) {
      console.error('Error submitting payment:', error);
      throw error;
    }
  }

  async getBillSession(sessionId) {
    try {
      const result = await this.client.view({
        payload: {
          function: `${this.contractAddress}::bill_splitter::get_bill_session`,
          arguments: [sessionId],
          type_arguments: []
        }
      });

      return {
        sessionId: result[0],
        merchantAddress: result[1],
        multisigAddress: result[2],
        totalAmount: result[3],
        description: result[4],
        status: result[5],
        requiredSignatures: result[6],
        currentSignatures: result[7],
        paymentsReceived: result[8],
        createdAt: result[9]
      };
    } catch (error) {
      console.error('Error getting bill session:', error);
      throw error;
    }
  }

  async getParticipants(sessionId) {
    try {
      const result = await this.client.view({
        payload: {
          function: `${this.contractAddress}::bill_splitter::get_participants`,
          arguments: [sessionId],
          type_arguments: []
        }
      });

      return result.map(participant => ({
        address: participant[0],
        name: participant[1],
        amountOwed: participant[2],
        hasSigned: participant[3],
        hasPaid: participant[4],
        paymentTimestamp: participant[5]
      }));
    } catch (error) {
      console.error('Error getting participants:', error);
      throw error;
    }
  }

  async checkHealth() {
    try {
      const result = await this.client.getLedgerInfo();
      return {
        status: 'healthy',
        chainId: result.chain_id,
        epoch: result.epoch,
        timestamp: result.ledger_timestamp
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

module.exports = new AptosService();
