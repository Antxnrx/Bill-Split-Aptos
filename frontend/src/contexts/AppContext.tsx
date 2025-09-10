"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { WalletInfo, BillSession } from '@/types';
import walletService from '@/lib/wallet-service';

interface AppContextType {
  wallet: WalletInfo | null;
  setWallet: (wallet: WalletInfo | null) => void;
  currentSession: BillSession | null;
  setCurrentSession: (session: BillSession | null) => void;
  sessions: BillSession[];
  setSessions: (sessions: BillSession[]) => void;
  // Blockchain functions
  createBillSession: (sessionData: any) => Promise<any>;
  signBillAgreement: (sessionId: string) => Promise<any>;
  submitPayment: (sessionId: string, amount: number) => Promise<any>;
  getBillSession: (sessionId: string) => Promise<any>;
  getParticipants: (sessionId: string) => Promise<any>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [currentSession, setCurrentSession] = useState<BillSession | null>(null);
  const [sessions, setSessions] = useState<BillSession[]>([]);

  // Load sessions from localStorage on mount
  useEffect(() => {
    const savedSessions = localStorage.getItem('bill-sessions');
    if (savedSessions) {
      try {
        setSessions(JSON.parse(savedSessions));
      } catch (error) {
        console.error('Error loading sessions:', error);
      }
    }
  }, []);

  // Save sessions to localStorage whenever sessions change
  useEffect(() => {
    localStorage.setItem('bill-sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Blockchain functions
  const createBillSession = async (sessionData: any) => {
    try {
      const result = await walletService.createBillSession(
        sessionData.sessionId,
        sessionData.totalAmount,
        sessionData.participantAddresses,
        sessionData.participantNames,
        sessionData.description
      );
      return result;
    } catch (error) {
      console.error('Error creating bill session:', error);
      throw error;
    }
  };

  const signBillAgreement = async (sessionId: string) => {
    try {
      const result = await walletService.signBillAgreement(sessionId);
      return result;
    } catch (error) {
      console.error('Error signing bill agreement:', error);
      throw error;
    }
  };

  const submitPayment = async (sessionId: string, amount: number) => {
    try {
      const result = await walletService.submitPayment(sessionId, amount);
      return result;
    } catch (error) {
      console.error('Error submitting payment:', error);
      throw error;
    }
  };

  const getBillSession = async (sessionId: string) => {
    try {
      const result = await walletService.getBillSession(sessionId);
      return result;
    } catch (error) {
      console.error('Error getting bill session:', error);
      throw error;
    }
  };

  const getParticipants = async (sessionId: string) => {
    try {
      const result = await walletService.getParticipants(sessionId);
      return result;
    } catch (error) {
      console.error('Error getting participants:', error);
      throw error;
    }
  };


  return (
    <AppContext.Provider
      value={{
        wallet,
        setWallet,
        currentSession,
        setCurrentSession,
        sessions,
        setSessions,
        createBillSession,
        signBillAgreement,
        submitPayment,
        getBillSession,
        getParticipants,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}