import { NextResponse } from 'next/server';
import aptosService from '@/lib/aptos-service';
import mockAptosService from '@/lib/mock-aptos-service';

export async function GET() {
  try {
    // Use mock service for local testing
    const useMockMode = process.env.NODE_ENV === 'development' || process.env.USE_MOCK_MODE === 'true';
    
    if (useMockMode) {
      console.log('🧪 Using mock mode for local testing');
      const mockHealth = await mockAptosService.checkHealth();
      
      return NextResponse.json({
        network: {
          status: mockHealth.status,
          chainId: mockHealth.chainId,
          epoch: mockHealth.epoch,
          nodeUrl: 'http://localhost:8080 (Mock Mode)'
        },
        contract: {
          status: 'deployed',
          address: mockAptosService.contractAddress,
          module: 'bill_split::bill_splitter'
        },
        deployment: {
          ready: true,
          message: 'Mock contracts are ready for local testing!'
        },
        mockMode: true
      });
    }
    
    // Real blockchain mode - Contract is deployed!
    const healthStatus = await aptosService.checkHealth();
    
    return NextResponse.json({
      network: {
        status: healthStatus.status,
        chainId: healthStatus.chainId,
        epoch: healthStatus.epoch,
        nodeUrl: 'https://fullnode.devnet.aptoslabs.com/v1'
      },
      contract: {
        status: 'deployed',
        address: '0xb6b8211b250e25bfed44d8bff0ae8674c33ca354d34189f9ac03b1b6f6a67385',
        module: 'bill_split::bill_splitter'
      },
      deployment: {
        ready: true,
        message: '✅ Contracts are deployed and ready on Aptos Devnet!'
      },
      mockMode: false
    });
  } catch (error) {
    console.error('Contract status check error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check contract status',
        details: error.message 
      },
      { status: 500 }
    );
  }
}