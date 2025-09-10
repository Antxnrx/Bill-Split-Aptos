require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  aptos: {
    nodeUrl: process.env.APTOS_NODE_URL || 'https://fullnode.devnet.aptoslabs.com/v1',
    faucetUrl: process.env.APTOS_FAUCET_URL || 'https://faucet.devnet.aptoslabs.com',
    privateKey: process.env.APTOS_PRIVATE_KEY,
    contractAddress: process.env.APTOS_CONTRACT_ADDRESS || '0xb6b8211b250e25bfed44d8bff0ae8674c33ca354d34189f9ac03b1b6f6a67385'
  },
  gateway: {
    feePercentage: parseInt(process.env.GATEWAY_FEE_PERCENTAGE) || 100,
    treasuryAddress: process.env.TREASURY_ADDRESS || '0x1'
  }
};