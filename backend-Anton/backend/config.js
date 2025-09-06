require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  aptos: {
    nodeUrl: process.env.APTOS_NODE_URL || 'https://fullnode.testnet.aptoslabs.com/v1',
    faucetUrl: process.env.APTOS_FAUCET_URL || 'https://faucet.testnet.aptoslabs.com',
    privateKey: process.env.APTOS_PRIVATE_KEY,
    contractAddress: process.env.APTOS_CONTRACT_ADDRESS || '0x1'
  },
  gateway: {
    feePercentage: parseInt(process.env.GATEWAY_FEE_PERCENTAGE) || 100,
    treasuryAddress: process.env.TREASURY_ADDRESS || '0x1'
  }
};
