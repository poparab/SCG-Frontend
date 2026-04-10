export interface InquiryListItem {
  id: string;
  referenceNumber: string;
  travelerNameEn: string;
  travelerNameAr?: string;
  passportNumber: string;
  nationalityCode: string;
  status: string;
  travelDate: string;
  createdAt: string;
  batchId?: string;
  batchName?: string;
}

export interface InquiryDetail {
  id: string;
  referenceNumber: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  processedAt?: string;
  traveler: InquiryTraveler;
  fee?: number;
  paymentReference?: string;
  batchId?: string;
  batchName?: string;
  documentUrl?: string;
}

export interface InquiryTraveler {
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
  transitCountries?: string;
  departureCountry?: string;
  purposeOfTravel?: string;
  flightNumber?: string;
  passportExpiry?: string;
}
