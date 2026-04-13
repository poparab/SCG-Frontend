import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface AgencyProfileData {
  id: string;
  nameEn: string;
  nameAr: string;
  email: string;
  phone: string;
  commercialLicenseNumber: string;
  commercialLicenseExpiry: string;
  address?: string;
  status: string;
  walletBalance: number;
  currency: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AgencyService {
  private readonly api = inject(ApiService);

  getAgency(id: string): Observable<AgencyProfileData> {
    return this.api.get<AgencyProfileData>(`/agencies/${id}`);
  }
}
