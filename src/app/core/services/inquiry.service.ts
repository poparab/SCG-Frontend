import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { PagedResult } from '../models/api.models';
import { InquiryListItem, InquiryDetail } from '../models/inquiry.models';

@Injectable({ providedIn: 'root' })
export class InquiryService {
  private readonly api = inject(ApiService);

  getInquiries(agencyId: string, params?: Record<string, string | number | boolean>): Observable<PagedResult<InquiryListItem>> {
    return this.api.get<PagedResult<InquiryListItem>>('/inquiries', { agencyId, ...params });
  }

  getInquiry(id: string): Observable<InquiryDetail> {
    return this.api.get<InquiryDetail>(`/inquiries/${id}`);
  }
}
