import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';

interface CreateSessionProps {
  onCreateSession: (totalAmount: number, participantCount: number, notes?: string) => void;
}

export const CreateSession: React.FC<CreateSessionProps> = ({ onCreateSession }) => {
  const [totalAmount, setTotalAmount] = useState('');
  const [participantCount, setParticipantCount] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      newErrors.totalAmount = 'Please enter a valid amount greater than 0';
    }

    if (!participantCount || parseInt(participantCount) <= 0) {
      newErrors.participantCount = 'Please enter a valid number of participants';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onCreateSession(
        parseFloat(totalAmount),
        parseInt(participantCount),
        notes.trim() || undefined
      );
    }
  };

  return (
    <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
      <div className="flex flex-wrap max-w-full sm:max-w-[480px] items-end gap-[16px_16px] px-4 sm:px-6 py-3 relative w-full flex-[0_0_auto]">
        <div className="min-w-40 items-start flex flex-col relative flex-1 grow">
          <div className="flex-col items-start pt-0 pb-2 px-0 flex-[0_0_auto] flex relative self-stretch w-full">
            <Label className="relative self-stretch mt-[-1.00px] [font-family:'Spline_Sans',Helvetica] font-medium text-white text-sm sm:text-base tracking-[0] leading-5 sm:leading-6">
              Total Bill Amount *
            </Label>
          </div>

          <Input
            type="number"
            step="0.01"
            min="0"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            placeholder="0.00"
            className={`h-12 sm:h-14 items-center p-3 sm:p-4 bg-[#264433] rounded-xl border-0 text-[#96c4a8] [font-family:'Spline_Sans',Helvetica] font-normal text-sm sm:text-base tracking-[0] leading-5 sm:leading-6 focus-visible:ring-0 focus-visible:ring-offset-0 ${
              errors.totalAmount ? 'ring-2 ring-red-500' : ''
            }`}
          />
          {errors.totalAmount && (
            <span className="text-red-400 text-xs mt-1">{errors.totalAmount}</span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap max-w-full sm:max-w-[480px] items-end gap-[16px_16px] px-4 sm:px-6 py-3 relative w-full flex-[0_0_auto]">
        <div className="min-w-40 items-start flex flex-col relative flex-1 grow">
          <div className="flex-col items-start pt-0 pb-2 px-0 flex-[0_0_auto] flex relative self-stretch w-full">
            <Label className="relative self-stretch mt-[-1.00px] [font-family:'Spline_Sans',Helvetica] font-medium text-white text-sm sm:text-base tracking-[0] leading-5 sm:leading-6">
              Number of Participants *
            </Label>
          </div>

          <Input
            type="number"
            min="1"
            value={participantCount}
            onChange={(e) => setParticipantCount(e.target.value)}
            placeholder="Enter number"
            className={`h-12 sm:h-14 items-center p-3 sm:p-4 bg-[#264433] rounded-xl border-0 text-[#96c4a8] [font-family:'Spline_Sans',Helvetica] font-normal text-sm sm:text-base tracking-[0] leading-5 sm:leading-6 placeholder:text-[#96c4a8] focus-visible:ring-0 focus-visible:ring-offset-0 ${
              errors.participantCount ? 'ring-2 ring-red-500' : ''
            }`}
          />
          {errors.participantCount && (
            <span className="text-red-400 text-xs mt-1">{errors.participantCount}</span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap max-w-full sm:max-w-[480px] items-end gap-[16px_16px] px-4 sm:px-6 py-3 relative w-full flex-[0_0_auto]">
        <div className="min-w-40 items-start flex flex-col relative flex-1 grow">
          <div className="flex-col items-start pt-0 pb-2 px-0 flex-[0_0_auto] flex relative self-stretch w-full">
            <Label className="relative self-stretch mt-[-1.00px] [font-family:'Spline_Sans',Helvetica] font-medium text-white text-sm sm:text-base tracking-[0] leading-5 sm:leading-6">
              Notes (Optional)
            </Label>
          </div>

          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about the bill..."
            className="relative flex-1 self-stretch w-full min-h-24 sm:min-h-36 grow bg-[#264433] rounded-xl border-0 text-[#96c4a8] [font-family:'Spline_Sans',Helvetica] font-normal text-sm sm:text-base tracking-[0] leading-5 sm:leading-6 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 p-3 sm:p-4 placeholder:text-[#96c4a8]"
          />
        </div>
      </div>

      <div className="flex items-start px-4 sm:px-6 py-3 flex-[0_0_auto] relative self-stretch w-full">
        <Button
          onClick={handleSubmit}
          className="flex min-w-[84px] max-w-full sm:max-w-[480px] h-11 sm:h-12 items-center justify-center px-4 sm:px-5 py-0 relative flex-1 grow bg-[#38e07a] rounded-3xl overflow-hidden hover:bg-[#38e07a]/90"
        >
          <div className="inline-flex flex-col items-center relative flex-[0_0_auto]">
            <span className="relative self-stretch mt-[-1.00px] [font-family:'Spline_Sans',Helvetica] font-bold text-[#112116] text-sm sm:text-base text-center tracking-[0] leading-5 sm:leading-6 whitespace-nowrap">
              Create Bill Session
            </span>
          </div>
        </Button>
      </div>

      <div className="flex flex-col items-start pt-4 sm:pt-5 pb-3 px-4 sm:px-6 flex-[0_0_auto] relative self-stretch w-full">
        <h2 className="relative self-stretch mt-[-1.00px] [font-family:'Spline_Sans',Helvetica] font-bold text-white text-lg sm:text-[22px] tracking-[0] leading-6 sm:leading-7">
          Session QR Code
        </h2>
        <p className="text-[#96c4a8] text-sm mt-2">
          QR code will be generated after creating the session
        </p>
      </div>

      <div className="flex items-start p-4 sm:p-6 flex-[0_0_auto] bg-[#112116] relative self-stretch w-full">
        <Card className="flex items-start gap-1 relative flex-1 grow bg-[#264433] rounded-xl overflow-hidden border-0">
          <CardContent className="p-8 relative flex-1 grow h-48 sm:h-[239px] flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#38e07a]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-[#112116] text-2xl">📱</span>
              </div>
              <p className="text-[#96c4a8] text-sm">
                Create session to generate QR code
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};