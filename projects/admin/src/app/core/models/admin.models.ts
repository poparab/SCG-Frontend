export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface AdminDashboardData {
  totalAgencies: number;
  pendingAgencies: number;
  approvedAgencies: number;
  totalInquiries: number;
  pendingInquiries: number;
  approvedInquiries: number;
  rejectedInquiries: number;
  totalWalletBalance: number;
  recentAgencies: RecentAgency[];
  recentInquiries: RecentInquiry[];
}

export interface RecentAgency {
  id: string;
  nameEn: string;
  nameAr: string;
  status: string;
  createdAt: string;
}

export interface RecentInquiry {
  id: string;
  referenceNumber: string;
  travelerName: string;
  nationality: string;
  status: string;
  createdAt: string;
}

export interface AgencyListItem {
  id: string;
  nameEn: string;
  nameAr: string;
  email: string;
  commercialLicenseNumber: string;
  status: string;
  walletBalance: number;
  createdAt: string;
}

export interface AgencyDetail {
  id: string;
  nameEn: string;
  nameAr: string;
  email: string;
  phone: string;
  commercialLicenseNumber: string;
  commercialLicenseExpiry: string;
  address?: string;
  status: string;
  rejectionReason?: string;
  walletBalance: number;
  currency: string;
  totalBatches: number;
  totalInquiries: number;
  createdAt: string;
}

export interface NationalityListItem {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  requiresInquiry: boolean;
  currentFee?: number;
  createdAt: string;
}

export interface NationalityDetail {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  requiresInquiry: boolean;
  pricingHistory: PricingItem[];
  createdAt: string;
}

export interface PricingItem {
  id: string;
  fee: number;
  currency: string;
  effectiveFrom: string;
  effectiveTo?: string;
  isActive: boolean;
}

export interface InquiryListItem {
  id: string;
  referenceNumber: string;
  travelerName: string;
  passportNumber: string;
  nationality: string;
  agencyName: string;
  status: string;
  createdAt: string;
}

export interface InquiryDetail {
  id: string;
  referenceNumber: string;
  travelerName: string;
  passportNumber: string;
  nationality: string;
  dateOfBirth: string;
  gender: string;
  travelDate: string;
  arrivalAirport: string;
  flightNumber?: string;
  transitCountries?: string[];
  agencyId: string;
  agencyName: string;
  batchId?: string;
  status: string;
  statusHistory: StatusHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface StatusHistoryItem {
  status: string;
  timestamp: string;
  note?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  loginType: string;
}

export interface LoginResponse {
  token: string;
  email: string;
  role: string;
}

export interface AdminUserInfo {
  userId: string;
  email: string;
  role: string;
}

export interface MasterNationalityItem {
  code: string;
  nameEn: string;
  nameAr: string;
}

export interface AgencyNationalityItem {
  id: string;
  agencyId: string;
  nationalityId: string;
  nationalityCode: string;
  nationalityNameAr: string;
  nationalityNameEn: string;
  defaultFee: number;
  customFee: number | null;
  effectiveFee: number;
  isEnabled: boolean;
}
