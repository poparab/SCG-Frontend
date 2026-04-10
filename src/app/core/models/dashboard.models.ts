import { WalletTransactionItem } from './wallet.models';

export interface AgencyDashboardData {
  agencyName: string;
  agencyNameEn: string;
  agencyStatus: string;
  registeredAt: string;
  lastActivityAt?: string;
  walletBalance: number;
  currency: string;
  totalBatches: number;
  draftBatches: number;
  submittedBatches: number;
  totalInquiries: number;
  approvedInquiries: number;
  rejectedInquiries: number;
  pendingInquiries: number;
  recentBatches: RecentBatch[];
  recentTransactions: WalletTransactionItem[];
}

export interface RecentBatch {
  id: string;
  name: string;
  status: string;
  travelerCount: number;
  createdAt: string;
}
