import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AdminUserListItem, AdminUserDetail, PagedResult } from '../models/admin.models';

@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private readonly api = inject(ApiService);

  getUsers(params?: Record<string, string | number | boolean>): Observable<PagedResult<AdminUserListItem>> {
    return this.api.get<PagedResult<AdminUserListItem>>('/admin-users', params);
  }

  getUserById(id: string): Observable<AdminUserDetail> {
    return this.api.get<AdminUserDetail>(`/admin-users/${id}`);
  }

  createUser(data: { fullName: string; email: string; password: string; role: string }): Observable<void> {
    return this.api.post<void>('/admin-users', data);
  }

  updateUser(id: string, data: { fullName: string; role: string }): Observable<void> {
    return this.api.put<void>(`/admin-users/${id}`, data);
  }

  toggleActive(id: string): Observable<void> {
    return this.api.put<void>(`/admin-users/${id}/toggle-active`, {});
  }

  resetPassword(id: string, newPassword: string): Observable<void> {
    return this.api.put<void>(`/admin-users/${id}/reset-password`, { newPassword });
  }
}
