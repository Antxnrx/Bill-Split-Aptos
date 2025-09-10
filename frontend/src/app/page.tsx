"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Users, CreditCard, History, Wallet } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { formatAmount } from '@/lib/utils';
import WalletConnection from '@/components/WalletConnection';
import { ApiService } from '@/lib/api-service';

interface ContractStatus {
  network: {
    status: string;
    chainId: number;
    epoch: number;
    nodeUrl: string;
  };
  contract: {
    status: string;
    address: string;
    module: string;
  };
  deployment: {
    ready: boolean;
    message: string;
  };
  mockMode?: boolean;
}

export default function HomePage() {
  const router = useRouter();
  const { wallet, sessions, setWallet } = useApp();
  const [contractStatus, setContractStatus] = React.useState<ContractStatus | null>(null);

  const activeSessions = sessions.filter(session => 
    session.status === 0 || session.status === 1 || session.status === 2
  );

  const totalOwed = activeSessions.reduce((sum, session) => {
    const userParticipant = session.participants.find(p => p.address === wallet?.address);
    return sum + (userParticipant?.amount_owed || 0);
  }, 0);

  // Check contract status on component mount
  React.useEffect(() => {
    const checkContractStatus = async () => {
      try {
        const response = await fetch('/api/contracts/status');
        const status = await response.json();
        setContractStatus(status);
      } catch (error) {
        console.error('Error checking contract status:', error);
      }
    };
    
    checkContractStatus();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 pb-20">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold gradient-text mb-3">Bill Split</h1>
          <p className="text-slate-600 text-lg">Split bills with friends using Aptos blockchain</p>
        </div>

        {/* Contract Status */}
        <div className="card-modern">
          <div className="flex items-center gap-3 mb-4">
            <div className={`h-6 w-6 rounded-full shadow-md ${contractStatus?.contract?.status === 'deployed' ? 'bg-gradient-to-r from-green-400 to-green-600' : 'bg-gradient-to-r from-yellow-400 to-orange-500'}`}></div>
            <h3 className="font-bold text-slate-900 text-lg">Contract Status</h3>
            {contractStatus?.mockMode && (
              <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 text-xs rounded-full font-medium shadow-sm">Mock Mode</span>
            )}
          </div>
          {contractStatus ? (
            <div className="space-y-2">
              <p className={`text-sm ${contractStatus.contract.status === 'deployed' ? 'text-green-600' : 'text-yellow-600'}`}>
                {contractStatus.deployment.message}
              </p>
              <p className="text-xs text-gray-500">
                Network: {contractStatus.network.nodeUrl.includes('Mock') ? 'Mock Mode (Local Testing)' : 
                         contractStatus.network.nodeUrl.includes('testnet') ? 'Aptos Testnet' : 'Aptos Mainnet'}
              </p>
              {contractStatus.contract.address && (
                <p className="text-xs text-gray-500 font-mono">
                  Contract: {contractStatus.contract.address.slice(0, 10)}...{contractStatus.contract.address.slice(-6)}
                </p>
              )}
              {contractStatus.mockMode && (
                <p className="text-xs text-blue-600">
                  🧪 Local testing mode - All blockchain functions simulated
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Checking contract status...</p>
            </div>
          )}
        </div>

        {/* Wallet Connection */}
        <WalletConnection
          wallet={wallet}
          onConnect={(connectedWallet) => {
            setWallet(connectedWallet);
          }}
          onDisconnect={() => {
            setWallet(null);
          }}
          onCopyAddress={() => {
            if (wallet?.address) {
              navigator.clipboard.writeText(wallet.address);
            }
          }}
        />

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card-modern">
            <div className="text-center">
              <div className="robotic-text text-4xl font-bold text-slate-900 mb-2">{activeSessions.length}</div>
              <p className="text-sm font-medium text-slate-600">Active Bills</p>
            </div>
          </div>
          <div className="card-modern">
            <div className="text-center">
              <div className="robotic-text text-4xl font-bold text-slate-900 mb-2">{formatAmount(totalOwed)}</div>
              <p className="text-sm font-medium text-slate-600">You Owe</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card-modern">
          <div className="mb-6">
            <h3 className="font-bold text-slate-900 text-lg mb-2">Quick Actions</h3>
            <p className="text-slate-600">Get started with bill splitting</p>
          </div>
          <div className="space-y-4">
            <button 
              className="btn-primary w-full flex items-center justify-center gap-3"
              onClick={() => router.push('/create')}
            >
              <Plus className="h-5 w-5" />
              Create New Bill
            </button>
            <button 
              className="btn-secondary w-full flex items-center justify-center gap-3"
              onClick={() => router.push('/participants')}
            >
              <Users className="h-5 w-5" />
              Manage Participants
            </button>
            <button 
              className="btn-secondary w-full flex items-center justify-center gap-3"
              onClick={() => router.push('/payments')}
            >
              <CreditCard className="h-5 w-5" />
              Make Payment
            </button>
            <button 
              className="btn-secondary w-full flex items-center justify-center gap-3"
              onClick={() => router.push('/history')}
            >
              <History className="h-5 w-5" />
              View History
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        {activeSessions.length > 0 && (
          <div className="card-modern">
            <div className="mb-6">
              <h3 className="font-bold text-slate-900 text-lg mb-2">Recent Bills</h3>
              <p className="text-slate-600">Your active bill sessions</p>
            </div>
            <div className="space-y-4">
              {activeSessions.slice(0, 3).map((session) => (
                <div key={session.session_id} className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border border-slate-100 hover:shadow-md transition-all duration-200">
                  <div>
                    <p className="font-semibold text-slate-900">{session.description}</p>
                    <p className="text-sm text-slate-500">
                      {session.participants.length} participants
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{formatAmount(session.total_amount)}</p>
                    <p className="text-xs text-slate-500">
                      {session.status === 0 && 'Created'}
                      {session.status === 1 && 'Participants Added'}
                      {session.status === 2 && 'Approved'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}