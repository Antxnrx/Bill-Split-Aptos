"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, Clock, User, ArrowLeft, Edit3 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { formatAmount, formatAddress } from '@/lib/utils';
import { BillSession } from '@/types';

export default function ParticipantsPage() {
  const router = useRouter();
  const { wallet, sessions, setSessions, setCurrentSession, signBillAgreement } = useApp();
  const [selectedSession, setSelectedSession] = useState<BillSession | null>(null);
  const [editingAmounts, setEditingAmounts] = useState(false);

  const activeSessions = sessions.filter(session => 
    session.status === 0 || session.status === 1
  );

  const handleSelectSession = (session: BillSession) => {
    setSelectedSession(session);
    setCurrentSession(session);
  };

  const handleSignAgreement = async (session: BillSession) => {
    if (!wallet?.isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      // Sign agreement on blockchain
      const blockchainResult = await signBillAgreement(session.session_id);

      // Update session with signature
      const updatedSessions = sessions.map(s => {
        if (s.session_id === session.session_id) {
          const updatedParticipants = s.participants.map(p => {
            if (p.address === wallet.address) {
              return { ...p, has_signed: true };
            }
            return p;
          });
          
          const newSignatureCount = updatedParticipants.filter(p => p.has_signed).length;
          const newStatus = newSignatureCount >= s.required_signatures ? 2 : 1; // APPROVED or PARTICIPANTS_ADDED
          
          return {
            ...s,
            participants: updatedParticipants,
            current_signatures: newSignatureCount,
            status: newStatus,
            approved_at: newStatus === 2 ? Date.now() : s.approved_at,
          };
        }
        return s;
      });

      setSessions(updatedSessions);
      setSelectedSession(updatedSessions.find(s => s.session_id === session.session_id) || null);
      
      alert(`Bill agreement signed successfully! Transaction: ${blockchainResult.transactionHash}`);
    } catch (error) {
      console.error('Error signing agreement:', error);
      alert(`Error signing agreement: ${error.message}`);
    }
  };

  const handleUpdateAmount = (sessionId: string, participantAddress: string, newAmount: number) => {
    const updatedSessions = sessions.map(s => {
      if (s.session_id === sessionId) {
        const updatedParticipants = s.participants.map(p => {
          if (p.address === participantAddress) {
            return { ...p, amount_owed: newAmount };
          }
          return p;
        });
        
        const newTotal = updatedParticipants.reduce((sum, p) => sum + p.amount_owed, 0);
        
        return {
          ...s,
          participants: updatedParticipants,
          total_amount: newTotal,
        };
      }
      return s;
    });

    setSessions(updatedSessions);
    setSelectedSession(updatedSessions.find(s => s.session_id === sessionId) || null);
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 0: return 'Created';
      case 1: return 'Participants Added';
      case 2: return 'Approved';
      case 3: return 'Settled';
      case 4: return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'text-blue-600';
      case 1: return 'text-yellow-600';
      case 2: return 'text-green-600';
      case 3: return 'text-gray-600';
      case 4: return 'text-red-600';
      default: return 'text-gray-600';
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
            <h1 className="text-3xl font-bold gradient-text">Participants</h1>
            <p className="text-slate-600">Manage bill participants and signatures</p>
          </div>
        </div>

        {!selectedSession ? (
          /* Session Selection */
          <div className="space-y-4">
            <div className="card-modern">
              <div className="mb-6">
                <h3 className="font-bold text-slate-900 text-lg mb-2">Select Bill Session</h3>
                <p className="text-slate-600">Choose a bill session to manage participants</p>
              </div>
              {activeSessions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl mb-4">
                    <User className="h-8 w-8 text-blue-600" />
                  </div>
                  <p className="text-slate-600 mb-4">No active bill sessions found</p>
                  <button 
                    className="btn-primary"
                    onClick={() => router.push('/create')}
                  >
                    Create New Bill
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeSessions.map((session) => (
                    <div
                      key={session.session_id}
                      className="p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border border-slate-100 cursor-pointer hover:shadow-md transition-all duration-200"
                      onClick={() => handleSelectSession(session)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-slate-900">{session.description}</h3>
                          <p className="text-sm text-slate-500">
                            {session.participants.length} participants • {formatAmount(session.total_amount)}
                          </p>
                          <p className={`text-xs font-medium ${getStatusColor(session.status)}`}>
                            {getStatusText(session.status)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-900">
                            {session.current_signatures}/{session.required_signatures} signed
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Session Details */
          <div className="space-y-4">
            {/* Session Info */}
            <div className="card-modern">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg mb-2">{selectedSession.description}</h3>
                  <p className="text-slate-600 text-sm">
                    Session ID: {selectedSession.session_id}
                  </p>
                </div>
                <button
                  className="btn-secondary"
                  onClick={() => setSelectedSession(null)}
                >
                  Back to Sessions
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl">
                  <p className="text-sm text-slate-600">Total Amount</p>
                  <p className="font-bold text-slate-900">{formatAmount(selectedSession.total_amount)}</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl">
                  <p className="text-sm text-slate-600">Status</p>
                  <p className={`font-bold ${getStatusColor(selectedSession.status)}`}>
                    {getStatusText(selectedSession.status)}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl">
                  <p className="text-sm text-slate-600">Signatures</p>
                  <p className="font-bold text-slate-900">
                    {selectedSession.current_signatures}/{selectedSession.required_signatures}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl">
                  <p className="text-sm text-slate-600">Participants</p>
                  <p className="font-bold text-slate-900">{selectedSession.participants.length}</p>
                </div>
              </div>
            </div>

            {/* Participants List */}
            <div className="card-modern">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg mb-2">Participants</h3>
                  <p className="text-slate-600">Manage participant amounts and signatures</p>
                </div>
                {selectedSession.status === 0 && (
                  <button
                    className="btn-secondary"
                    onClick={() => setEditingAmounts(!editingAmounts)}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    {editingAmounts ? 'Done' : 'Edit Amounts'}
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {selectedSession.participants.map((participant, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border border-slate-100">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900">{participant.name}</p>
                        {participant.has_signed ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-yellow-600" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-mono">
                        {formatAddress(participant.address)}
                      </p>
                      {editingAmounts && selectedSession.status === 0 ? (
                        <div className="mt-2">
                          <Input
                            type="number"
                            value={participant.amount_owed}
                            onChange={(e) => handleUpdateAmount(
                              selectedSession.session_id,
                              participant.address,
                              parseFloat(e.target.value) || 0
                            )}
                            className="w-24 h-8 text-sm rounded-xl border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                          />
                        </div>
                      ) : (
                        <p className="text-sm font-bold text-green-600">
                          {formatAmount(participant.amount_owed)}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      {participant.has_signed ? (
                        <span className="text-xs text-green-600 font-medium bg-green-100 px-2 py-1 rounded-full">Signed</span>
                      ) : (
                        <button
                          className="btn-primary text-sm px-4 py-2"
                          onClick={() => handleSignAgreement(selectedSession)}
                          disabled={wallet?.address !== participant.address}
                        >
                          Sign
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            {selectedSession.status === 1 && (
              <div className="card-modern">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl mb-4">
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                  <p className="text-slate-600 mb-4">
                    Waiting for {selectedSession.required_signatures - selectedSession.current_signatures} more signatures
                  </p>
                  <button
                    className="btn-primary"
                    onClick={() => handleSignAgreement(selectedSession)}
                    disabled={!selectedSession.participants.find(p => p.address === wallet?.address && !p.has_signed)}
                  >
                    Sign Agreement
                  </button>
                </div>
              </div>
            )}

            {selectedSession.status === 2 && (
              <div className="card-modern">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-lg font-bold text-green-600 mb-2">Bill Approved!</p>
                  <p className="text-slate-600 mb-4">
                    All required signatures have been collected. Participants can now make payments.
                  </p>
                  <button 
                    className="btn-primary"
                    onClick={() => router.push('/payments')}
                  >
                    Go to Payments
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
