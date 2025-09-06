import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { BillSession, Payment } from '../types';

interface PaymentsScreenProps {
  session: BillSession;
  onAddPayment: (payment: Omit<Payment, 'id' | 'timestamp'>) => void;
}

export const PaymentsScreen: React.FC<PaymentsScreenProps> = ({
  session,
  onAddPayment,
}) => {
  const [selectedParticipant, setSelectedParticipant] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [amount, setAmount] = useState('');

  const handleAddPayment = () => {
    if (selectedParticipant && amount) {
      onAddPayment({
        participantId: selectedParticipant,
        amount: parseFloat(amount),
        method: paymentMethod,
      });
      setSelectedParticipant('');
      setAmount('');
    }
  };

  const unpaidParticipants = session.participants.filter(p => !p.hasPaid);
  const totalPaid = session.payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingAmount = session.totalAmount - totalPaid;

  return (
    <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
      <div className="flex flex-col items-start pt-4 sm:pt-5 pb-3 px-4 sm:px-6 flex-[0_0_auto] relative self-stretch w-full">
        <h2 className="text-white font-bold text-lg sm:text-[22px]">Manage Payments</h2>
        <p className="text-[#96c4a8] text-sm mt-1">
          Total: ${session.totalAmount.toFixed(2)} | Paid: ${totalPaid.toFixed(2)} | Remaining: ${remainingAmount.toFixed(2)}
        </p>
      </div>

      {unpaidParticipants.length > 0 && (
        <>
          <div className="flex flex-wrap max-w-full sm:max-w-[480px] items-end gap-[16px_16px] px-4 sm:px-6 py-3 relative w-full flex-[0_0_auto]">
            <div className="min-w-40 items-start flex flex-col relative flex-1 grow">
              <label className="relative self-stretch mt-[-1.00px] [font-family:'Spline_Sans',Helvetica] font-medium text-white text-sm sm:text-base tracking-[0] leading-5 sm:leading-6">
                Select Participant *
              </label>
              <select
                value={selectedParticipant}
                onChange={(e) => setSelectedParticipant(e.target.value)}
                className="h-12 sm:h-14 items-center p-3 sm:p-4 bg-[#264433] rounded-xl border-0 text-[#96c4a8] [font-family:'Spline_Sans',Helvetica] font-normal text-sm sm:text-base tracking-[0] leading-5 sm:leading-6 focus-visible:ring-0 focus-visible:ring-offset-0"
              >
                <option value="">Choose participant</option>
                {unpaidParticipants.map((participant) => (
                  <option key={participant.id} value={participant.id}>
                    {participant.name} - ${participant.amountOwed.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap max-w-full sm:max-w-[480px] items-end gap-[16px_16px] px-4 sm:px-6 py-3 relative w-full flex-[0_0_auto]">
            <div className="min-w-40 items-start flex flex-col relative flex-1 grow">
              <label className="relative self-stretch mt-[-1.00px] [font-family:'Spline_Sans',Helvetica] font-medium text-white text-sm sm:text-base tracking-[0] leading-5 sm:leading-6">
                Payment Method *
              </label>
              <div className="flex gap-2 mt-2">
                {(['cash', 'card', 'transfer'] as const).map((method) => (
                  <Button
                    key={method}
                    variant={paymentMethod === method ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod(method)}
                    className={`flex-1 h-10 ${paymentMethod === method ? 'bg-[#38e07a] text-[#112116]' : 'bg-[#264433] text-[#96c4a8] border-[#96c4a8]'}`}
                  >
                    {method.charAt(0).toUpperCase() + method.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap max-w-full sm:max-w-[480px] items-end gap-[16px_16px] px-4 sm:px-6 py-3 relative w-full flex-[0_0_auto]">
            <div className="min-w-40 items-start flex flex-col relative flex-1 grow">
              <label className="relative self-stretch mt-[-1.00px] [font-family:'Spline_Sans',Helvetica] font-medium text-white text-sm sm:text-base tracking-[0] leading-5 sm:leading-6">
                Amount *
              </label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="h-12 sm:h-14 items-center p-3 sm:p-4 bg-[#264433] rounded-xl border-0 text-[#96c4a8] [font-family:'Spline_Sans',Helvetica] font-normal text-sm sm:text-base tracking-[0] leading-5 sm:leading-6 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>

          <div className="flex items-start px-4 sm:px-6 py-3 flex-[0_0_auto] relative self-stretch w-full">
            <Button
              onClick={handleAddPayment}
              disabled={!selectedParticipant || !amount}
              className="flex min-w-[84px] max-w-full sm:max-w-[480px] h-11 sm:h-12 items-center justify-center px-4 sm:px-5 py-0 relative flex-1 grow bg-[#38e07a] rounded-3xl overflow-hidden hover:bg-[#38e07a]/90 disabled:opacity-50"
            >
              <div className="inline-flex flex-col items-center relative flex-[0_0_auto]">
                <span className="relative self-stretch mt-[-1.00px] [font-family:'Spline_Sans',Helvetica] font-bold text-[#112116] text-sm sm:text-base text-center tracking-[0] leading-5 sm:leading-6 whitespace-nowrap">
                  Record Payment
                </span>
              </div>
            </Button>
          </div>
        </>
      )}

      {session.payments.length > 0 && (
        <div className="flex flex-col items-start px-4 sm:px-6 pb-6 flex-[0_0_auto] relative self-stretch w-full">
          <h3 className="text-white font-semibold text-lg mb-4">Payment History</h3>
          <div className="space-y-3 w-full max-w-full sm:max-w-[480px]">
            {session.payments.map((payment) => {
              const participant = session.participants.find(p => p.id === payment.participantId);
              return (
                <div key={payment.id} className="bg-[#264433] rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-white font-medium">{participant?.name}</h4>
                      <p className="text-[#96c4a8] text-sm capitalize">{payment.method}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">${payment.amount.toFixed(2)}</p>
                      <p className="text-[#96c4a8] text-xs">
                        {payment.timestamp.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {remainingAmount <= 0 && (
        <div className="flex flex-col items-start px-4 sm:px-6 pb-6 flex-[0_0_auto] relative self-stretch w-full">
          <div className="w-full max-w-full sm:max-w-[480px] bg-[#38e07a]/20 rounded-xl p-6 text-center">
            <div className="w-16 h-16 bg-[#38e07a]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-[#38e07a] text-2xl">✅</span>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">All Payments Complete!</h3>
            <p className="text-[#96c4a8] text-sm">
              The bill has been fully settled.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};