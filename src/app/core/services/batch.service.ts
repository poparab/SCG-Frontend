import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { PagedResult } from '../models/api.models';
import { environment } from '../../../environments/environment';
import {
  CreateBatchRequest,
  BatchListItem,
  BatchDetail,
  TravelerSaveRequest,
  SubmitBatchResponse
} from '../models/batch.models';

@Injectable({ providedIn: 'root' })
export class BatchService {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);

  createBatch(request: CreateBatchRequest): Observable<{ id: string }> {
    return this.api.post<{ id: string }>('/batches', request);
  }

  getBatches(agencyId: string, params?: Record<string, string | number | boolean>): Observable<PagedResult<BatchListItem>> {
    return this.api.get<PagedResult<BatchListItem>>('/batches', { agencyId, ...params });
  }

  getBatch(id: string): Observable<BatchDetail> {
    return this.api.get<BatchDetail>(`/batches/${id}`);
  }

  addTraveler(batchId: string, traveler: TravelerSaveRequest): Observable<{ id: string }> {
    return this.api.postFormData<{ id: string }>(`/batches/${batchId}/travelers`, this.buildTravelerFormData(traveler));
  }

  updateTraveler(batchId: string, travelerId: string, traveler: TravelerSaveRequest): Observable<void> {
    return this.api.putFormData<void>(`/batches/${batchId}/travelers/${travelerId}`, this.buildTravelerFormData(traveler));
  }

  removeTraveler(batchId: string, travelerId: string): Observable<void> {
    return this.api.delete<void>(`/batches/${batchId}/travelers/${travelerId}`);
  }

  submitBatch(batchId: string): Observable<SubmitBatchResponse> {
    return this.api.post<SubmitBatchResponse>(`/batches/${batchId}/submit`, {});
  }

  exportBatch(batchId: string): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/batches/${batchId}/export`, {
      responseType: 'blob'
    });
  }

  private buildTravelerFormData(traveler: TravelerSaveRequest): FormData {
    const formData = new FormData();

    formData.append('firstNameEn', traveler.firstNameEn);
    formData.append('lastNameEn', traveler.lastNameEn);
    formData.append('passportNumber', traveler.passportNumber);
    formData.append('nationalityCode', traveler.nationalityCode);
    formData.append('dateOfBirth', traveler.dateOfBirth);
    formData.append('gender', String(traveler.gender));
    formData.append('travelDate', traveler.travelDate);
    formData.append('passportExpiry', traveler.passportExpiry);
    formData.append('departureCountry', traveler.departureCountry);
    formData.append('purposeOfTravel', traveler.purposeOfTravel);

    this.appendOptionalValue(formData, 'firstNameAr', traveler.firstNameAr);
    this.appendOptionalValue(formData, 'lastNameAr', traveler.lastNameAr);
    this.appendOptionalValue(formData, 'arrivalAirport', traveler.arrivalAirport);
    this.appendOptionalValue(formData, 'transitCountries', traveler.transitCountries);
    this.appendOptionalValue(formData, 'flightNumber', traveler.flightNumber);

    if (traveler.passportImage instanceof File) {
      formData.append('passportImageDocument', traveler.passportImage);
    }

    if (traveler.ticketImage instanceof File) {
      formData.append('ticketImageDocument', traveler.ticketImage);
    }

    return formData;
  }

  private appendOptionalValue(formData: FormData, key: string, value?: string): void {
    if (value) {
      formData.append(key, value);
    }
  }
}
