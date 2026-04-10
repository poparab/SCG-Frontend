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
  AddTravelerRequest,
  UpdateTravelerRequest,
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

  addTraveler(batchId: string, traveler: AddTravelerRequest): Observable<{ id: string }> {
    return this.api.post<{ id: string }>(`/batches/${batchId}/travelers`, traveler);
  }

  updateTraveler(batchId: string, travelerId: string, traveler: UpdateTravelerRequest): Observable<void> {
    return this.api.put<void>(`/batches/${batchId}/travelers/${travelerId}`, traveler);
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
}
