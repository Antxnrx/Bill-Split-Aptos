"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, CheckCircle, Clock, ArrowLeft, DollarSign, QrCode } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { formatAmount, formatAddress } from '@/lib/utils';
import { BillSession, QRScanResult } from '@/types';
import QRScanner from '@/components/QRScanner';

export default function PaymentsPage() {
  const router = useRouter();
  const { wallet, sessions, setSessions, submitPayment } = useApp();
  const [selectedSession, setSelectedSession] = useState<BillSession | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);

  const approvedSessions = sessions.filter(session => 
    session.status === 2 // APPROVED
  );

  const handleQRScan = (result: QRScanResult) => {
    if (result.type === 'session_id' && result.session_id) {
      // Find session by ID
      const session = sessions.find(s => s.session_id === result.session_id);
      if (session) {
        setSelectedSession(session);
        const userParticipant = session.participants.find(p => p.address === wallet?.address);
        if (userParticipant && !userParticipant.has_paid) {
          setPaymentAmount(userParticipant.amount_owed);
        }
      } else {
        alert('Session not found');
      }
    }
  };

  const handleSelectSession = (session: BillSession) => {
    setSelectedSession(session);
    const userParticipant = session.participants.find(p => p.address === wallet?.address);
    if (userParticipant && !userParticipant.has_paid) {
      setPaymentAmount(userParticipant.amount_owed);
    }
  };

  const handleMakePayment = async () => {
    if (!wallet?.isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!selectedSession || paymentAmount <= 0) {
      alert('Please select a session and enter a valid payment amount');
      return;
    }

    const userParticipant = selectedSession.participants.find(p => p.address === wallet.address);
    if (!userParticipant) {
      alert('You are not a participant in this session');
      return;
    }

    if (userParticipant.has_paid) {
      alert('You have already paid for this session');
      return;
    }

    if (paymentAmount < userParticipant.amount_owed) {
      alert(`Minimum payment required: ${formatAmount(userParticipant.amount_owed)}`);
      return;
    }

    setIsProcessing(true);

    try {
      // Submit payment to blockchain
      const blockchainResult = await submitPayment(selectedSession.session_id, paymentAmount);

      // Update session with payment
      const updatedSessions = sessions.map(s => {
        if (s.session_id === selectedSession.session_id) {
          const updatedParticipants = s.participants.map(p => {
            if (p.address === wallet.address) {
              return { 
                ...p, 
                has_paid: true, 
                payment_timestamp: Date.now(),
                amount_owed: paymentAmount, // Update with actual payment amount
                payment_tx_hash: blockchainResult.transactionHash
              };
            }
            return p;
          });
          
          const newPaymentsReceived = updatedParticipants
            .filter(p => p.has_paid)
            .reduce((sum, p) => sum + p.amount_owed, 0);
          
          const allPaid = updatedParticipants.every(p => p.has_paid);
          const newStatus = allPaid ? 3 : 2; // SETTLED or APPROVED
          
          return {
            ...s,
            participants: updatedParticipants,
            payments_received: newPaymentsReceived,
            status: newStatus,
            settled_at: newStatus === 3 ? Date.now() : s.settled_at,
          };
        }
        return s;
      });

      setSessions(updatedSessions);
      setSelectedSession(updatedSessions.find(s => s.session_id === selectedSession.session_id) || null);
      
      alert(`Payment successful! Transaction: ${blockchainResult.transactionHash}`);
    } catch (error) {
      console.error('Error processing payment:', error);
      alert(`Error processing payment: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
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
          <div className="flex-1">
            <h1 className="text-3xl font-bold gradient-text">Payments</h1>
            <p className="text-slate-600">Manage your payment requests</p>
          </div>
          <button
            onClick={() => setShowQRScanner(true)}
            className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            <QrCode className="h-5 w-5" />
          </button>
        </div>

        {!selectedSession ? (
          /* Session Selection */
          <div className="space-y-4">
            <div className="card-modern">
              <div className="mb-6">
                <h3 className="font-bold text-slate-900 text-lg mb-2">Select Bill Session</h3>
                <p className="text-slate-600">Choose a bill session to make payment</p>
              </div>
              <div>
                {approvedSessions.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 mb-4">No approved bill sessions found</p>
                    <p className="text-sm text-slate-500">
                      Bills need to be approved before payments can be made
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {approvedSessions.map((session) => {
                      const userParticipant = session.participants.find(p => p.address === wallet?.address);
                      const canPay = userParticipant && !userParticipant.has_paid;
                      
                      return (
                        <div
                          key={session.session_id}
                          className={`p-4 border border-slate-200 rounded-2xl cursor-pointer transition-all duration-200 ${
                            canPay ? 'hover:bg-slate-50 hover:shadow-md' : 'opacity-60'
                          }`}
                          onClick={() => canPay && handleSelectSession(session)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{session.description}</h3>
                              <p className="text-sm text-slate-500">
                                {session.participants.length} participants • {formatAmount(session.total_amount)}
                              </p>
                              <p className={`text-xs ${getStatusColor(session.status)}`}>
                                {getStatusText(session.status)}
                              </p>
                              {userParticipant && (
                                <p className="text-xs text-blue-600 mt-1">
                                  You owe: {formatAmount(userParticipant.amount_owed)}
                                  {userParticipant.has_paid && ' (Paid ✓)'}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {session.participants.filter(p => p.has_paid).length}/{session.participants.length} paid
                              </p>
                              {canPay && (
                                <button className="mt-2 px-4 py-2 bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500 text-white text-sm rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200">
                                  Pay Now
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Payment Details */
          <div className="space-y-4">
            {/* Session Info */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{selectedSession.description}</CardTitle>
                    <CardDescription>
                      Session ID: {selectedSession.session_id}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedSession(null)}
                  >
                    Back to Sessions
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="font-medium">{formatAmount(selectedSession.total_amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className={`font-medium ${getStatusColor(selectedSession.status)}`}>
                      {getStatusText(selectedSession.status)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payments Received</p>
                    <p className="font-medium">{formatAmount(selectedSession.payments_received)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Remaining</p>
                    <p className="font-medium">
                      {formatAmount(selectedSession.total_amount - selectedSession.payments_received)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Form */}
            <Card>
              <CardHeader>
                <CardTitle>Make Payment</CardTitle>
                <CardDescription>Pay your share using USDC</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(() => {
                  const userParticipant = selectedSession.participants.find(p => p.address === wallet?.address);
                  
                  if (!userParticipant) {
                    return (
                      <div className="text-center py-4">
                        <p className="text-gray-600">You are not a participant in this session</p>
                      </div>
                    );
                  }

                  if (userParticipant.has_paid) {
                    return (
                      <div className="text-center py-4">
                        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                        <p className="text-lg font-medium text-green-600 mb-2">Payment Complete!</p>
                        <p className="text-sm text-gray-600">
                          You paid {formatAmount(userParticipant.amount_owed)} on{' '}
                          {new Date(userParticipant.payment_timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="payment_amount">Payment Amount (USDC)</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="payment_amount"
                            type="text"
                            placeholder="0.00"
                            value={paymentAmount || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              // Allow only numbers and one decimal point
                              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                setPaymentAmount(value);
                              }
                            }}
                            onBlur={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              setPaymentAmount(value);
                            }}
                            className="pl-10"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Minimum: {formatAmount(userParticipant.amount_owed)}
                        </p>
                      </div>

                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">Payment Summary</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Your share:</span>
                            <span>{formatAmount(userParticipant.amount_owed)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Payment amount:</span>
                            <span>{formatAmount(paymentAmount)}</span>
                          </div>
                          {paymentAmount > userParticipant.amount_owed && (
                            <div className="flex justify-between text-green-600">
                              <span>Overpayment:</span>
                              <span>{formatAmount(paymentAmount - userParticipant.amount_owed)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <Button 
                        className="w-full" 
                        onClick={handleMakePayment}
                        disabled={isProcessing || paymentAmount < userParticipant.amount_owed}
                      >
                        {isProcessing ? 'Processing Payment...' : `Pay ${formatAmount(paymentAmount)}`}
                      </Button>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Participants Status */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Status</CardTitle>
                <CardDescription>Track payment progress for all participants</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedSession.participants.map((participant, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {participant.has_paid ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-600" />
                        )}
                        <div>
                          <p className="font-medium">{participant.name}</p>
                          <p className="text-xs text-gray-500 font-mono">
                            {formatAddress(participant.address)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatAmount(participant.amount_owed)}</p>
                        <p className="text-xs text-gray-500">
                          {participant.has_paid ? 'Paid' : 'Pending'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={handleQRScan}
        title="Scan Payment Request"
      />
    </div>
  );
}
