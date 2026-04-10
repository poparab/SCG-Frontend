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
}

export interface AddTravelerRequest {
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
}

export type UpdateTravelerRequest = AddTravelerRequest;

export interface SubmitBatchResponse {
  batchReference: string;
  totalTravelers: number;
  totalFee: number;
  remainingBalance: number;
}
