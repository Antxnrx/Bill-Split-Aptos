"use client";

import React, { useState } from 'react';
import { CreditCard, Check, X, Clock, AlertCircle, Copy, Building2 } from 'lucide-react';
import { PaymentRequest as PaymentRequestType, BillSession } from '@/types';

interface PaymentRequestProps {
  paymentRequest: PaymentRequestType;
  session: BillSession;
  onPay: (paymentRequest: PaymentRequestType) => void;
  onCopyAddress: (address: string) => void;
}

export default function PaymentRequest({ 
  paymentRequest, 
  session, 
  onPay, 
  onCopyAddress 
}: PaymentRequestProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = () => {
    // Copy multisig address (where payment should go)
    const addressToCopy = session.multisig_address || paymentRequest.multisig_address;
    onCopyAddress(addressToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusIcon = () => {
    switch (paymentRequest.status) {
      case 'paid':
        return <Check className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <X className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusColor = () => {
    switch (paymentRequest.status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const formatAmount = (amount: number) => {
    return `$${amount.toFixed(2)} USDC`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  return (
    <div className="card-modern">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl">
          <CreditCard className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-900 text-lg">Payment Request</h3>
          <p className="text-sm text-slate-600">{session.description}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor()}`}>
          {paymentRequest.status.toUpperCase()}
        </div>
      </div>

      <div className="space-y-4">
        {/* Amount */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl">
          <div>
            <p className="text-sm text-slate-600">Amount to Pay</p>
            <p className="text-2xl font-bold text-slate-900">{formatAmount(paymentRequest.amount)}</p>
          </div>
          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl">
            {getStatusIcon()}
          </div>
        </div>

        {/* Multisig Flow Info */}
        <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl border border-purple-200">
          <div className="flex items-center gap-3 mb-3">
            <Building2 className="h-5 w-5 text-purple-600" />
            <h4 className="font-semibold text-slate-900">Multisig Payment Flow</h4>
          </div>
          <div className="text-sm text-slate-600 space-y-2">
            <p>• Your payment goes to a <strong>multisig account</strong> (not directly to merchant)</p>
            <p>• All participants must pay before funds are released</p>
            <p>• Final transfer to merchant requires all signatures</p>
          </div>
        </div>

        {/* Payment Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl">
            <span className="text-slate-600">Payment Destination</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-slate-900">
                {formatAddress(session.multisig_address || paymentRequest.multisig_address)}
              </span>
              <button
                onClick={handleCopyAddress}
                className="p-1 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4 text-slate-600" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl">
            <span className="text-slate-600">Final Recipient</span>
            <span className="font-mono text-sm text-slate-900">
              {formatAddress(session.merchant_address)}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl">
            <span className="text-slate-600">Session ID</span>
            <span className="font-mono text-sm text-slate-900">
              {session.session_id.slice(0, 8)}...{session.session_id.slice(-6)}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl">
            <span className="text-slate-600">Created</span>
            <span className="text-sm text-slate-900">{formatDate(paymentRequest.created_at)}</span>
          </div>

          {paymentRequest.paid_at && (
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl">
              <span className="text-slate-600">Paid</span>
              <span className="text-sm text-slate-900">{formatDate(paymentRequest.paid_at)}</span>
            </div>
          )}

          {paymentRequest.tx_hash && (
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl">
              <span className="text-slate-600">Transaction</span>
              <span className="font-mono text-sm text-slate-900">
                {paymentRequest.tx_hash.slice(0, 8)}...{paymentRequest.tx_hash.slice(-6)}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        {paymentRequest.status === 'pending' && (
          <div className="space-y-3">
            <button
              onClick={() => onPay(paymentRequest)}
              className="btn-primary w-full"
            >
              Pay {formatAmount(paymentRequest.amount)} to Multisig
            </button>
            
            <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Payment Instructions:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Send exactly {formatAmount(paymentRequest.amount)} to the multisig address</li>
                    <li>• Use USDC token on Aptos network</li>
                    <li>• Include the session ID in the memo field</li>
                    <li>• Funds will be held in multisig until all participants pay</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {paymentRequest.status === 'paid' && (
          <div className="p-3 bg-green-50 rounded-2xl border border-green-200">
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-600" />
              <div className="text-sm text-green-800">
                <p className="font-medium">Payment Completed</p>
                <p className="text-xs">Your payment is now in the multisig account</p>
              </div>
            </div>
          </div>
        )}

        {paymentRequest.status === 'failed' && (
          <div className="p-3 bg-red-50 rounded-2xl border border-red-200">
            <div className="flex items-center gap-3">
              <X className="h-5 w-5 text-red-600" />
              <div className="text-sm text-red-800">
                <p className="font-medium">Payment Failed</p>
                <p className="text-xs">Please try again or contact support</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}