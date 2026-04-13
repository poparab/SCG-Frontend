import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AuditLogItem, PagedResult } from '../models/admin.models';

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly api = inject(ApiService);

  getLogs(params?: Record<string, string | number | boolean>): Observable<PagedResult<AuditLogItem>> {
    return this.api.get<PagedResult<AuditLogItem>>('/audit-logs', params);
  }
}
