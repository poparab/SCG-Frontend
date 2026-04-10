import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { MasterNationalityItem, NationalityDetail, NationalityListItem, PagedResult, PricingItem } from '../models/admin.models';

@Injectable({ providedIn: 'root' })
export class NationalityService {
  constructor(private api: ApiService) {}

  getNationalities(params?: Record<string, string | number | boolean>): Observable<PagedResult<NationalityListItem>> {
    return this.api.get<PagedResult<NationalityListItem>>('/nationalities', params);
  }

  getNationality(id: string): Observable<NationalityDetail> {
    return this.api.get<NationalityDetail>(`/nationalities/${id}`);
  }

  addNationality(req: { code: string; nameAr: string; nameEn: string; requiresInquiry: boolean; defaultFee: number }): Observable<{ id: string }> {
    return this.api.post<{ id: string }>('/nationalities', req);
  }

  updateFee(id: string, fee: number, effectiveFrom: string, effectiveTo?: string): Observable<void> {
    return this.api.put<void>(`/nationalities/${id}/fee`, { fee, effectiveFrom, effectiveTo });
  }

  toggleInquiry(id: string, requiresInquiry: boolean): Observable<void> {
    return this.api.put<void>(`/nationalities/${id}/toggle-inquiry`, { requiresInquiry });
  }

  getPricingList(nationalityCode?: string): Observable<PricingItem[]> {
    const params: Record<string, string> = {};
    if (nationalityCode) params['nationalityCode'] = nationalityCode;
    return this.api.get<PricingItem[]>('/nationalities/pricing', params);
  }

  getMasterList(): Observable<MasterNationalityItem[]> {
    return this.api.get<MasterNationalityItem[]>('/nationalities/master-list');
  }
}
