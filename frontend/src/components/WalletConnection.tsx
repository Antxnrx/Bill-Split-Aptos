"use client";

import React, { useState, useEffect } from 'react';
import { Wallet, Copy, ExternalLink, Check, Download } from 'lucide-react';
import { WalletInfo } from '@/types';
import walletService from '@/lib/wallet-service';

interface WalletConnectionProps {
  wallet: WalletInfo | null;
  onConnect: (wallet: WalletInfo) => void;
  onDisconnect: () => void;
  onCopyAddress: () => void;
}

export default function WalletConnection({ 
  wallet, 
  onConnect, 
  onDisconnect, 
  onCopyAddress 
}: WalletConnectionProps) {
  const [copied, setCopied] = useState(false);
  const [availableWallets, setAvailableWallets] = useState<Array<{name: string, id: string}>>([]);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    setAvailableWallets(walletService.getAvailableWallets());
  }, []);

  const handleCopyAddress = () => {
    onCopyAddress();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance?: number) => {
    if (!balance) return '0.00';
    return (balance / 100000000).toFixed(2); // Convert from micro-APT to APT
  };

  const connectWallet = async (walletId: string) => {
    setIsConnecting(true);
    try {
      let connectedWallet;
      
      if (walletId === 'petra') {
        connectedWallet = await walletService.connectPetraWallet();
      } else if (walletId === 'martian') {
        connectedWallet = await walletService.connectMartianWallet();
      } else {
        throw new Error('Unsupported wallet');
      }

      // Get balance
      const balance = await walletService.getAccountBalance(connectedWallet.address);
      connectedWallet.balance = balance;

      onConnect(connectedWallet);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert(`Error connecting wallet: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      await walletService.disconnectWallet();
      onDisconnect();
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  if (wallet?.isConnected) {
    return (
      <div className="card-modern">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl">
            <Wallet className="h-5 w-5 text-green-600" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">Wallet Connected</h3>
        </div>
        
        <div className="space-y-4">
          {/* Address */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl">
            <div>
              <p className="text-sm text-slate-600">Address</p>
              <p className="font-mono text-slate-900">{formatAddress(wallet.address)}</p>
            </div>
            <button
              onClick={handleCopyAddress}
              className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4 text-slate-600" />
              )}
            </button>
          </div>

          {/* Network */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl">
            <div>
              <p className="text-sm text-slate-600">Network</p>
              <p className="font-medium text-slate-900 capitalize">
                {wallet.network.replace('-', ' ')}
              </p>
              {wallet.network !== 'devnet' && (
                <p className="text-xs text-red-600 mt-1">
                  ⚠️ Switch to Devnet for this app
                </p>
              )}
            </div>
            <div className={`w-3 h-3 rounded-full ${wallet.network === 'devnet' ? 'bg-green-500' : 'bg-red-500'}`}></div>
          </div>

          {/* Balance */}
          {wallet.balance !== undefined && (
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl">
              <div>
                <p className="text-sm text-slate-600">Balance</p>
                <p className="font-bold text-slate-900">
                  {formatBalance(wallet.balance)} APT
                </p>
              </div>
            </div>
          )}

          {/* Network Warning */}
          {wallet.network?.toLowerCase() !== 'devnet' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <p className="text-sm text-red-800">
                  Your wallet is on <strong>{wallet.network}</strong> but this app requires <strong>devnet</strong>
                </p>
              </div>
              <button
                onClick={async () => {
                  try {
                    let switched = false;
                    if (window.petra) {
                      if (typeof window.petra.changeNetwork === 'function') {
                        await window.petra.changeNetwork('devnet');
                        switched = true;
                      } else if (typeof window.petra.switchNetwork === 'function') {
                        await window.petra.switchNetwork('devnet');
                        switched = true;
                      } else if (typeof window.petra.setNetwork === 'function') {
                        await window.petra.setNetwork('devnet');
                        switched = true;
                      }
                    } else if (window.martian) {
                      if (typeof window.martian.changeNetwork === 'function') {
                        await window.martian.changeNetwork('devnet');
                        switched = true;
                      } else if (typeof window.martian.switchNetwork === 'function') {
                        await window.martian.switchNetwork('devnet');
                        switched = true;
                      } else if (typeof window.martian.setNetwork === 'function') {
                        await window.martian.setNetwork('devnet');
                        switched = true;
                      }
                    }
                    
                    if (switched) {
                      // Refresh network detection instead of reloading page
                      await walletService.refreshNetworkDetection();
                      // Trigger a re-render by calling onConnect with updated wallet
                      const updatedWallet = walletService.connectedWallet;
                      if (updatedWallet) {
                        onConnect(updatedWallet);
                      }
                    } else {
                      alert('Please manually switch to devnet in your wallet settings. Go to your wallet extension and change the network to "Devnet".');
                    }
                  } catch (error) {
                    alert('Please manually switch to devnet in your wallet settings. Go to your wallet extension and change the network to "Devnet".');
                  }
                }}
                className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors"
              >
                Switch to Devnet
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={disconnectWallet}
              className="flex-1 btn-secondary"
            >
              Disconnect
            </button>
            <button
              onClick={async () => {
                try {
                  await walletService.refreshNetworkDetection();
                  const updatedWallet = walletService.connectedWallet;
                  if (updatedWallet) {
                    onConnect(updatedWallet);
                  }
                } catch (error) {
                  console.error('Error refreshing network:', error);
                }
              }}
              className="p-3 bg-blue-100 rounded-2xl hover:bg-blue-200 transition-colors"
              title="Refresh network detection"
            >
              <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={() => window.open(`https://explorer.aptoslabs.com/account/${wallet.address}?network=devnet`, '_blank')}
              className="p-3 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors"
            >
              <ExternalLink className="h-5 w-5 text-slate-600" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-modern">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl">
          <Wallet className="h-5 w-5 text-purple-600" />
        </div>
        <h3 className="font-bold text-slate-900 text-lg">Connect Wallet</h3>
      </div>
      
      <div className="space-y-4">
        <p className="text-slate-600">
          Connect your Aptos wallet to create and manage bill sessions
        </p>
        
        {availableWallets.length > 0 ? (
          <div className="space-y-3">
            {availableWallets.map((wallet) => (
              <button
                key={wallet.id}
                onClick={() => connectWallet(wallet.id)}
                disabled={isConnecting}
                className="w-full btn-primary flex items-center justify-center gap-3"
              >
                {isConnecting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="h-5 w-5" />
                    Connect {wallet.name}
                  </>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={() => connectWallet('petra')}
              disabled={isConnecting}
              className="w-full btn-primary flex items-center justify-center gap-3"
            >
              {isConnecting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="h-5 w-5" />
                  Connect Wallet
                </>
              )}
            </button>
            
            <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200">
              <div className="flex items-center gap-3">
                <Download className="h-5 w-5 text-blue-600" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">No wallet detected</p>
                  <p className="text-xs">Install Petra or Martian wallet to continue</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="text-xs text-slate-500 space-y-1">
          <p>Supported wallets:</p>
          <p>• <a href="https://petra.app" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Petra Wallet</a></p>
          <p>• <a href="https://martianwallet.xyz" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Martian Wallet</a></p>
        </div>
      </div>
    </div>
  );
}