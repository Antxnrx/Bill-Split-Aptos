import React from 'react';
import { Button } from '../components/ui/button';
import { BillSession } from '../types';
import { Calendar, Users, DollarSign, CheckCircle, Clock } from 'lucide-react';

interface HistoryScreenProps {
  sessions: BillSession[];
  onResetSession: () => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  sessions,
  onResetSession,
}) => {
  const getSessionStatus = (session: BillSession) => {
    const totalPaid = session.payments.reduce((sum, payment) => sum + payment.amount, 0);
    const isComplete = totalPaid >= session.totalAmount;
    return isComplete ? 'completed' : 'pending';
  };

  return (
    <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
      <div className="flex flex-col items-start pt-4 sm:pt-5 pb-3 px-4 sm:px-6 flex-[0_0_auto] relative self-stretch w-full">
        <div className="flex justify-between items-center w-full">
          <h2 className="text-white font-bold text-lg sm:text-[22px]">Session History</h2>
          <Button
            onClick={onResetSession}
            className="bg-[#38e07a] hover:bg-[#38e07a]/90 text-[#112116] font-semibold px-4 py-2 rounded-lg text-sm"
          >
            New Session
          </Button>
        </div>
      </div>

      <div className="flex flex-col items-start px-4 sm:px-6 pb-6 flex-[0_0_auto] relative self-stretch w-full">
        {sessions.length === 0 ? (
          <div className="w-full max-w-full sm:max-w-[480px] bg-[#264433] rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-[#38e07a]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-[#38e07a]" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">No Sessions Yet</h3>
            <p className="text-[#96c4a8] text-sm">
              Create your first bill splitting session to see it here.
            </p>
          </div>
        ) : (
          <div className="space-y-4 w-full max-w-full sm:max-w-[480px]">
            {sessions.map((session) => {
              const status = getSessionStatus(session);
              const totalPaid = session.payments.reduce((sum, payment) => sum + payment.amount, 0);
              const completedParticipants = session.participants.filter(p => p.hasPaid).length;

              return (
                <div key={session.id} className="bg-[#264433] rounded-xl p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center">
                      {status === 'completed' ? (
                        <CheckCircle className="w-5 h-5 text-[#38e07a] mr-2" />
                      ) : (
                        <Clock className="w-5 h-5 text-orange-400 mr-2" />
                      )}
                      <span className={`text-sm font-semibold ${status === 'completed' ? 'text-[#38e07a]' : 'text-orange-400'}`}>
                        {status === 'completed' ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-[#96c4a8] text-xs">
                        {session.createdAt.toLocaleDateString()}
                      </p>
                      <p className="text-[#96c4a8] text-xs">
                        {session.createdAt.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <DollarSign className="w-4 h-4 text-[#96c4a8] mr-2" />
                      <span className="text-[#96c4a8]">Total: </span>
                      <span className="text-white font-semibold ml-1">
                        ${session.totalAmount.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center text-sm">
                      <Users className="w-4 h-4 text-[#96c4a8] mr-2" />
                      <span className="text-[#96c4a8]">Participants: </span>
                      <span className="text-white font-semibold ml-1">
                        {session.participantCount}
                      </span>
                    </div>

                    <div className="flex items-center text-sm">
                      <CheckCircle className="w-4 h-4 text-[#96c4a8] mr-2" />
                      <span className="text-[#96c4a8]">Paid: </span>
                      <span className="text-[#38e07a] font-semibold ml-1">
                        ${totalPaid.toFixed(2)} ({completedParticipants}/{session.participantCount} people)
                      </span>
                    </div>

                    {session.notes && (
                      <div className="mt-3 p-2 bg-[#112116] rounded-lg">
                        <p className="text-[#96c4a8] text-xs">Notes:</p>
                        <p className="text-white text-sm">{session.notes}</p>
                      </div>
                    )}
                  </div>

                  {session.participants.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#112116]">
                      <p className="text-[#96c4a8] text-xs mb-2">Participants:</p>
                      <div className="flex flex-wrap gap-2">
                        {session.participants.map((participant) => (
                          <div
                            key={participant.id}
                            className={`px-2 py-1 rounded-full text-xs ${
                              participant.hasPaid
                                ? 'bg-[#38e07a]/20 text-[#38e07a]'
                                : 'bg-orange-400/20 text-orange-400'
                            }`}
                          >
                            {participant.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};