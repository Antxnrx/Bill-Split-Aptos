import { useState } from 'react';
import { BillSession, Participant, Payment, Screen } from '../types';

export const useAppState = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('create');
  const [currentSession, setCurrentSession] = useState<BillSession | null>(null);
  const [sessions, setSessions] = useState<BillSession[]>([]);

  const createSession = (totalAmount: number, participantCount: number, notes?: string) => {
    const newSession: BillSession = {
      id: Date.now().toString(),
      totalAmount,
      participantCount,
      notes,
      participants: [],
      payments: [],
      createdAt: new Date(),
    };

    setCurrentSession(newSession);
    setSessions(prev => [...prev, newSession]);
    setCurrentScreen('participants');
  };

  const addParticipant = (participant: Omit<Participant, 'id' | 'amountOwed' | 'hasPaid'>) => {
    if (!currentSession) return;

    const amountOwed = currentSession.totalAmount / currentSession.participantCount;
    const newParticipant: Participant = {
      ...participant,
      id: Date.now().toString(),
      amountOwed,
      hasPaid: false,
    };

    const updatedSession = {
      ...currentSession,
      participants: [...currentSession.participants, newParticipant],
    };

    setCurrentSession(updatedSession);
    setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
  };

  const addPayment = (payment: Omit<Payment, 'id' | 'timestamp'>) => {
    if (!currentSession) return;

    const newPayment: Payment = {
      ...payment,
      id: Date.now().toString(),
      timestamp: new Date(),
    };

    const updatedParticipants = currentSession.participants.map(p =>
      p.id === payment.participantId ? { ...p, hasPaid: true } : p
    );

    const updatedSession = {
      ...currentSession,
      participants: updatedParticipants,
      payments: [...currentSession.payments, newPayment],
    };

    setCurrentSession(updatedSession);
    setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
  };

  const navigateToScreen = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  const resetSession = () => {
    setCurrentSession(null);
    setCurrentScreen('create');
  };

  return {
    currentScreen,
    currentSession,
    sessions,
    createSession,
    addParticipant,
    addPayment,
    navigateToScreen,
    resetSession,
  };
};