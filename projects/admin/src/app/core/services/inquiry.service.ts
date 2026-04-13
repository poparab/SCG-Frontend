import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { InquiryDetail, InquiryListItem, PagedResult } from '../models/admin.models';

@Injectable({ providedIn: 'root' })
export class InquiryService {
  constructor(private api: ApiService) {}

  getInquiries(params?: Record<string, string | number | boolean>): Observable<PagedResult<InquiryListItem>> {
    return this.api.get<PagedResult<InquiryListItem>>('/inquiries', params);
  }

  getInquiry(id: string): Observable<InquiryDetail> {
    return this.api.get<InquiryDetail>(`/inquiries/${id}`);
  }

  approveInquiry(id: string): Observable<void> {
    return this.api.put<void>(`/inquiries/${id}/approve`, {});
  }

  rejectInquiry(id: string, reason: string): Observable<void> {
    return this.api.put<void>(`/inquiries/${id}/reject`, { reason });
  }
}
