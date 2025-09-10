export interface Participant {
  address: string;
  name: string;
  amount_owed: number;
  has_signed: boolean;
  has_paid: boolean;
  payment_timestamp: number;
  payment_request_sent: boolean;
  payment_tx_hash?: string;
}

export interface BillSession {
  session_id: string;
  merchant_address: string; // Creator's address (final receiver)
  multisig_address: string; // Multisig account address (temporary holder)
  total_amount: number;
  description: string;
  participants: Participant[];
  required_signatures: number; // Auto-calculated: all participants must sign
  current_signatures: number;
  status: BillStatus;
  created_at: number;
  approved_at: number;
  settled_at: number;
  payments_received: number;
  qrCodeData?: string;
  // Multisig specific fields
  multisig_created: boolean;
  multisig_threshold: number; // How many signatures needed to transfer from multisig
  final_transfer_tx?: string; // Transaction hash when multisig sends to merchant
}

export enum BillStatus {
  CREATED = 0,
  PARTICIPANTS_ADDED = 1,
  MULTISIG_CREATED = 2, // Multisig account created
  APPROVED = 3, // All participants have signed
  PAYMENT_REQUESTS_SENT = 4, // Payment requests sent to all participants
  PAYMENTS_RECEIVED = 5, // All payments received in multisig
  FINAL_TRANSFER = 6, // Multisig transferred to merchant
  SETTLED = 7, // All payments received
  CANCELLED = 8,
}

export interface WalletInfo {
  address: string;
  isConnected: boolean;
  network: string;
  balance?: number;
  publicKey?: string;
}

export interface CreateSessionData {
  description: string;
  total_amount: number;
  participants: {
    address: string;
    name: string;
  }[];
  // required_signatures will be auto-calculated as participants.length
}

export interface PaymentRequest {
  session_id: string;
  participant_address: string;
  amount: number;
  description: string;
  status: 'pending' | 'paid' | 'failed';
  created_at: number;
  paid_at?: number;
  tx_hash?: string;
  // Multisig specific
  multisig_address: string; // Where to send payment
  payment_destination: 'multisig' | 'merchant'; // Always 'multisig' in new flow
}

export interface QRScanResult {
  type: 'wallet_address' | 'session_id' | 'payment_request';
  data: string;
  address?: string;
  session_id?: string;
}

export interface MultisigInfo {
  address: string;
  threshold: number;
  signers: string[];
  balance: number;
  created: boolean;
}