"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X, ArrowLeft, QrCode, User } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { CreateSessionData, QRScanResult } from '@/types';
import { ApiService } from '@/lib/api-service';
import QRScanner from '@/components/QRScanner';

export default function CreateSessionPage() {
  const router = useRouter();
  const { wallet, setSessions, sessions, createBillSession } = useApp();
  const [formData, setFormData] = useState<CreateSessionData>({
    description: '',
    total_amount: 0,
    participants: [],
  });
  const [newParticipant, setNewParticipant] = useState({ address: '', name: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);

  const handleAddParticipant = () => {
    if (newParticipant.address && newParticipant.name) {
      // Check if address is already added
      const isDuplicate = formData.participants.some(p => p.address.toLowerCase() === newParticipant.address.toLowerCase());
      if (isDuplicate) {
        alert('This address is already added to the participants list');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        participants: [...prev.participants, newParticipant]
      }));
      setNewParticipant({ address: '', name: '' });
    }
  };

  const handleQRScan = (result: QRScanResult) => {
    if (result.type === 'wallet_address' && result.address) {
      setNewParticipant(prev => ({
        ...prev,
        address: result.address!
      }));
    }
  };

  const handleRemoveParticipant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.filter((_, i) => i !== index)
    }));
  };


  const handleCreateSession = async () => {
    if (!wallet?.isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!formData.description || Number(formData.total_amount) <= 0 || formData.participants.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    
    try {
      // Generate session ID
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Prepare data for blockchain call
      const participantAddresses = formData.participants.map(p => p.address);
      const participantNames = formData.participants.map(p => p.name);
      
      // Call blockchain to create session
      const blockchainResult = await createBillSession({
        sessionId,
        totalAmount: Number(formData.total_amount),
        participantAddresses,
        participantNames,
        description: formData.description
      });

      // Calculate individual amounts
      const individualAmount = Number(formData.total_amount) / formData.participants.length;
      
      // Create new session
      const newSession = {
        session_id: sessionId,
        merchant_address: wallet.address, // Creator's address (receiver)
        multisig_address: sessionId, // Use session ID as multisig identifier
        total_amount: Number(formData.total_amount),
        description: formData.description,
        participants: formData.participants.map(p => ({
          address: p.address,
          name: p.name,
          amount_owed: individualAmount,
          has_signed: false,
          has_paid: false,
          payment_timestamp: 0,
          payment_request_sent: false,
        })),
        required_signatures: formData.participants.length, // Auto-calculated: all participants must sign
        current_signatures: 0,
        status: 0, // CREATED
        created_at: Date.now(),
        approved_at: 0,
        settled_at: 0,
        payments_received: 0,
        qrCodeData: `session:${sessionId}`, // QR code data for session
      };

      // Add to sessions
      setSessions([...sessions, newSession]);
      
      alert(`Bill session created successfully! Transaction: ${blockchainResult.transactionHash}`);
      
      // Navigate to participants screen
      router.push('/participants');
    } catch (error) {
      console.error('Error creating session:', error);
      alert(`Error creating session: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 pb-20">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 py-6">
          <button 
            className="p-2 bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-200"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Create Bill Session</h1>
            <p className="text-slate-600">Split bills with friends using blockchain</p>
          </div>
        </div>

        {/* Bill Details */}
        <div className="card-modern">
          <div className="mb-6">
            <h3 className="font-bold text-slate-900 text-lg mb-2">Bill Details</h3>
            <p className="text-slate-600">Enter the bill information</p>
          </div>
          <div className="space-y-6">
            <div>
              <Label htmlFor="description" className="text-slate-700 font-medium">Description</Label>
              <Input
                id="description"
                placeholder="e.g., Dinner at Restaurant XYZ"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-2 rounded-2xl border-slate-200 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            <div>
              <Label htmlFor="total_amount" className="text-slate-700 font-medium">Total Amount (USDC)</Label>
              <Input
                id="total_amount"
                type="text"
                placeholder="0.00"
                value={formData.total_amount || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow only numbers and one decimal point
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    setFormData(prev => ({ ...prev, total_amount: value }));
                  }
                }}
                onBlur={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  setFormData(prev => ({ ...prev, total_amount: value }));
                }}
                className="mt-2 rounded-2xl border-slate-200 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Multisig Configuration</p>
                  <p className="text-sm text-slate-600">
                    All {formData.participants.length || 0} participants must sign to approve the bill
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add Participants */}
        <div className="card-modern">
          <div className="mb-6">
            <h3 className="font-bold text-slate-900 text-lg mb-2">Add Participants</h3>
            <p className="text-slate-600">Add people who will split this bill</p>
          </div>
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label htmlFor="participant_name" className="text-slate-700 font-medium">Name</Label>
                  <Input
                    id="participant_name"
                    placeholder="John Doe"
                    value={newParticipant.name}
                    onChange={(e) => setNewParticipant(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-2 rounded-2xl border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="participant_address" className="text-slate-700 font-medium">Aptos Address</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="participant_address"
                      placeholder="0x..."
                      value={newParticipant.address}
                      onChange={(e) => setNewParticipant(prev => ({ ...prev, address: e.target.value }))}
                      className="flex-1 rounded-2xl border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                    />
                    <button
                      onClick={() => setShowQRScanner(true)}
                      className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                    >
                      <QrCode className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-end">
                  <button 
                    onClick={handleAddParticipant}
                    className="p-3 bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500 text-white rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              {/* Quick Add Current User */}
              {wallet?.isConnected && (
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
                  <User className="h-5 w-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">Add yourself as participant</p>
                    <p className="text-xs text-slate-500">{wallet.address.slice(0, 10)}...{wallet.address.slice(-6)}</p>
                  </div>
                  <button
                    onClick={() => {
                      setNewParticipant({
                        address: wallet.address,
                        name: 'You'
                      });
                    }}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    Add Me
                  </button>
                </div>
              )}
            </div>

            {/* Participants List */}
            {formData.participants.length > 0 && (
              <div className="space-y-3">
                <Label className="text-slate-700 font-medium">Participants ({formData.participants.length})</Label>
                {formData.participants.map((participant, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border border-slate-100">
                    <div>
                      <p className="font-semibold text-slate-900">{participant.name}</p>
                      <p className="text-sm text-slate-500 font-mono">
                        {participant.address.slice(0, 10)}...{participant.address.slice(-6)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveParticipant(index)}
                      className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        {formData.participants.length > 0 && formData.total_amount > 0 && (
          <div className="card-modern">
            <div className="mb-6">
              <h3 className="font-bold text-slate-900 text-lg mb-2">Summary</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl">
                <span className="text-slate-600">Total Amount:</span>
                <span className="font-bold text-slate-900">${Number(formData.total_amount || 0).toFixed(2)} USDC</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl">
                <span className="text-slate-600">Participants:</span>
                <span className="font-bold text-slate-900">{formData.participants.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl">
                <span className="text-slate-600">Amount per person:</span>
                <span className="font-bold text-slate-900">
                  ${(Number(formData.total_amount || 0) / formData.participants.length).toFixed(2)} USDC
                </span>
              </div>
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl">
                  <span className="text-slate-600">Required signatures:</span>
                  <span className="font-bold text-slate-900">{formData.participants.length}</span>
                </div>
            </div>
          </div>
        )}

        {/* Create Button */}
        <div className="pb-6">
          <button 
            className="btn-primary w-full" 
            onClick={handleCreateSession}
            disabled={isLoading || !formData.description || formData.total_amount <= 0 || formData.participants.length === 0}
          >
            {isLoading ? 'Creating...' : 'Create Bill Session'}
          </button>
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={handleQRScan}
        title="Scan Wallet Address"
      />
    </div>
  );
}
