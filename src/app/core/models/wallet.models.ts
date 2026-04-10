export interface WalletData {
  agencyId: string;
  balance: number;
  currency: string;
  lowBalanceThreshold: number;
}

export interface WalletTransactionItem {
  id: string;
  type: string;
  amount: number;
  reference: string;
  notes?: string;
  balanceAfter: number;
  createdAt: string;
}
