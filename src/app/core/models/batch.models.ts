export interface CreateBatchRequest {
  agencyId: string;
  createdByUserId: string;
  name: string;
  inquiryTypeId: string;
  notes?: string;
}

export interface BatchListItem {
  id: string;
  name: string;
  status: string;
  travelerCount: number;
  createdAt: string;
  submittedAt?: string;
}

export interface BatchDetail {
  id: string;
  name: string;
  notes?: string;
  status: string;
  travelerCount: number;
  createdAt: string;
  submittedAt?: string;
  totalFee?: number;
  paymentReference?: string;
  travelers: BatchTraveler[];
}

export interface TravelerDocumentMetadata {
  fileName?: string;
  originalFileName?: string;
  contentType?: string;
  fileSize?: number;
  url?: string;
  uploadedAt?: string;
}

export interface BatchTraveler {
  id: string;
  firstNameEn: string;
  lastNameEn: string;
  firstNameAr?: string;
  lastNameAr?: string;
  passportNumber: string;
  nationalityCode: string;
  dateOfBirth: string;
  gender: string;
  travelDate: string;
  arrivalAirport?: string;
  passportExpiry?: string;
  departureCountry?: string;
  purposeOfTravel?: string;
  flightNumber?: string;
  inquiryId?: string;
  inquiryStatus?: string;
  inquiryReferenceNumber?: string;
  hasPassportImageDocument?: boolean;
  hasTicketImageDocument?: boolean;
}

export interface TravelerSaveRequest {
  firstNameEn: string;
  lastNameEn: string;
  firstNameAr?: string;
  lastNameAr?: string;
  passportNumber: string;
  nationalityCode: string;
  dateOfBirth: string;
  gender: number;
  travelDate: string;
  arrivalAirport?: string;
  transitCountries?: string;
  passportExpiry: string;
  departureCountry: string;
  purposeOfTravel: string;
  flightNumber?: string;
  passportImage?: File | null;
  ticketImage?: File | null;
}

export type AddTravelerRequest = TravelerSaveRequest;

export type UpdateTravelerRequest = TravelerSaveRequest;

export interface SubmitBatchResponse {
  batchReference: string;
  totalTravelers: number;
  totalFee: number;
  remainingBalance: number;
}
