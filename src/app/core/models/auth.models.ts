export interface LoginRequest {
  email: string;
  password: string;
  loginType: string;
}

export interface LoginResponse {
  token: string;
  email: string;
  role: string;
  agencyId?: string;
  agencyName?: string;
}

export interface RegisterRequest {
  agencyName: string;
  commercialRegNumber?: string;
  contactPersonName: string;
  email: string;
  password: string;
  countryCode: string;
  mobileNumber: string;
}

export interface RegisterResponse {
  id: string;
}

export interface UserInfo {
  userId: string;
  email: string;
  role: string;
  agencyId?: string;
  agencyName?: string;
}
