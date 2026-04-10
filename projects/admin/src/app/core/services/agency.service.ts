import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AgencyDetail, AgencyListItem, AgencyNationalityItem, PagedResult } from '../models/admin.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AgencyService {
  constructor(private api: ApiService, private http: HttpClient) {}

  getAgencies(params?: Record<string, string | number | boolean>): Observable<PagedResult<AgencyListItem>> {
    return this.api.get<PagedResult<AgencyListItem>>('/agencies', params);
  }

  getAgency(id: string): Observable<AgencyDetail> {
    return this.api.get<AgencyDetail>(`/agencies/${id}`);
  }

  approveAgency(id: string): Observable<void> {
    return this.api.put<void>(`/agencies/${id}/approve`, {});
  }

  rejectAgency(id: string, reason: string): Observable<void> {
    return this.api.put<void>(`/agencies/${id}/reject`, { reason });
  }

  creditWallet(
    id: string,
    amount: number,
    paymentMethod: string,
    reference?: string,
    notes?: string,
    evidence?: File
  ): Observable<{ newBalance: number; transactionId: string }> {
    const formData = new FormData();
    formData.append('amount', amount.toString());
    formData.append('paymentMethod', paymentMethod);
    if (reference) formData.append('reference', reference);
    if (notes) formData.append('notes', notes);
    if (evidence) formData.append('evidence', evidence);
    return this.http.post<{ newBalance: number; transactionId: string }>(
      `${environment.apiUrl}/agencies/${id}/wallet/credit`,
      formData
    );
  }

  getAgencyNationalities(agencyId: string): Observable<AgencyNationalityItem[]> {
    return this.api.get<AgencyNationalityItem[]>(`/agencies/${agencyId}/nationalities`);
  }

  updateAgencyNationality(agencyId: string, nationalityId: string, data: { customFee?: number | null; isEnabled?: boolean }): Observable<void> {
    return this.api.put<void>(`/agencies/${agencyId}/nationalities/${nationalityId}`, data);
  }
}
