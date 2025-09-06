import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { BillSession, Participant } from '../types';

interface ParticipantsScreenProps {
  session: BillSession;
  onAddParticipant: (participant: Omit<Participant, 'id' | 'amountOwed' | 'hasPaid'>) => void;
  onNavigateToPayments: () => void;
}

export const ParticipantsScreen: React.FC<ParticipantsScreenProps> = ({
  session,
  onAddParticipant,
  onNavigateToPayments,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleAddParticipant = () => {
    if (name.trim()) {
      onAddParticipant({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      setName('');
      setEmail('');
      setPhone('');
    }
  };

  const canProceedToPayments = session.participants.length === session.participantCount;

  return (
    <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
      <div className="flex flex-col items-start pt-4 sm:pt-5 pb-3 px-4 sm:px-6 flex-[0_0_auto] relative self-stretch w-full">
        <h2 className="text-white font-bold text-lg sm:text-[22px]">Add Participants</h2>
        <p className="text-[#96c4a8] text-sm mt-1">
          {session.participants.length} of {session.participantCount} participants added
        </p>
      </div>

      <div className="flex flex-wrap max-w-full sm:max-w-[480px] items-end gap-[16px_16px] px-4 sm:px-6 py-3 relative w-full flex-[0_0_auto]">
        <div className="min-w-40 items-start flex flex-col relative flex-1 grow">
          <Label className="relative self-stretch mt-[-1.00px] [font-family:'Spline_Sans',Helvetica] font-medium text-white text-sm sm:text-base tracking-[0] leading-5 sm:leading-6">
            Name *
          </Label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter participant name"
            className="h-12 sm:h-14 items-center p-3 sm:p-4 bg-[#264433] rounded-xl border-0 text-[#96c4a8] [font-family:'Spline_Sans',Helvetica] font-normal text-sm sm:text-base tracking-[0] leading-5 sm:leading-6 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
      </div>

      <div className="flex flex-wrap max-w-full sm:max-w-[480px] items-end gap-[16px_16px] px-4 sm:px-6 py-3 relative w-full flex-[0_0_auto]">
        <div className="min-w-40 items-start flex flex-col relative flex-1 grow">
          <Label className="relative self-stretch mt-[-1.00px] [font-family:'Spline_Sans',Helvetica] font-medium text-white text-sm sm:text-base tracking-[0] leading-5 sm:leading-6">
            Email (Optional)
          </Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email address"
            className="h-12 sm:h-14 items-center p-3 sm:p-4 bg-[#264433] rounded-xl border-0 text-[#96c4a8] [font-family:'Spline_Sans',Helvetica] font-normal text-sm sm:text-base tracking-[0] leading-5 sm:leading-6 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
      </div>

      <div className="flex flex-wrap max-w-full sm:max-w-[480px] items-end gap-[16px_16px] px-4 sm:px-6 py-3 relative w-full flex-[0_0_auto]">
        <div className="min-w-40 items-start flex flex-col relative flex-1 grow">
          <Label className="relative self-stretch mt-[-1.00px] [font-family:'Spline_Sans',Helvetica] font-medium text-white text-sm sm:text-base tracking-[0] leading-5 sm:leading-6">
            Phone (Optional)
          </Label>
          <Input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter phone number"
            className="h-12 sm:h-14 items-center p-3 sm:p-4 bg-[#264433] rounded-xl border-0 text-[#96c4a8] [font-family:'Spline_Sans',Helvetica] font-normal text-sm sm:text-base tracking-[0] leading-5 sm:leading-6 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
      </div>

      <div className="flex items-start px-4 sm:px-6 py-3 flex-[0_0_auto] relative self-stretch w-full">
        <Button
          onClick={handleAddParticipant}
          disabled={!name.trim()}
          className="flex min-w-[84px] max-w-full sm:max-w-[480px] h-11 sm:h-12 items-center justify-center px-4 sm:px-5 py-0 relative flex-1 grow bg-[#38e07a] rounded-3xl overflow-hidden hover:bg-[#38e07a]/90 disabled:opacity-50"
        >
          <div className="inline-flex flex-col items-center relative flex-[0_0_auto]">
            <span className="relative self-stretch mt-[-1.00px] [font-family:'Spline_Sans',Helvetica] font-bold text-[#112116] text-sm sm:text-base text-center tracking-[0] leading-5 sm:leading-6 whitespace-nowrap">
              Add Participant
            </span>
          </div>
        </Button>
      </div>

      {session.participants.length > 0 && (
        <div className="flex flex-col items-start px-4 sm:px-6 pb-6 flex-[0_0_auto] relative self-stretch w-full">
          <h3 className="text-white font-semibold text-lg mb-4">Participants Added</h3>
          <div className="space-y-3 w-full max-w-full sm:max-w-[480px]">
            {session.participants.map((participant) => (
              <div key={participant.id} className="bg-[#264433] rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-white font-medium">{participant.name}</h4>
                    {participant.email && (
                      <p className="text-[#96c4a8] text-sm">{participant.email}</p>
                    )}
                    {participant.phone && (
                      <p className="text-[#96c4a8] text-sm">{participant.phone}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-[#96c4a8] text-sm">Amount owed</p>
                    <p className="text-white font-semibold">${participant.amountOwed.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {canProceedToPayments && (
        <div className="flex items-start px-4 sm:px-6 py-3 flex-[0_0_auto] relative self-stretch w-full">
          <Button
            onClick={onNavigateToPayments}
            className="flex min-w-[84px] max-w-full sm:max-w-[480px] h-11 sm:h-12 items-center justify-center px-4 sm:px-5 py-0 relative flex-1 grow bg-[#38e07a] rounded-3xl overflow-hidden hover:bg-[#38e07a]/90"
          >
            <div className="inline-flex flex-col items-center relative flex-[0_0_auto]">
              <span className="relative self-stretch mt-[-1.00px] [font-family:'Spline_Sans',Helvetica] font-bold text-[#112116] text-sm sm:text-base text-center tracking-[0] leading-5 sm:leading-6 whitespace-nowrap">
                Proceed to Payments
              </span>
            </div>
          </Button>
        </div>
      )}
    </div>
  );
};