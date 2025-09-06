export interface BillSession {
  id: string;
  totalAmount: number;
  participantCount: number;
  notes?: string;
  participants: Participant[];
  payments: Payment[];
  createdAt: Date;
}

export interface Participant {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  amountOwed: number;
  hasPaid: boolean;
}

export interface Payment {
  id: string;
  participantId: string;
  amount: number;
  timestamp: Date;
  method: 'cash' | 'card' | 'transfer';
}

export type Screen = 'create' | 'participants' | 'payments' | 'history';
