import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AdminDashboardData } from '../models/admin.models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private api: ApiService) {}

  getDashboard(): Observable<AdminDashboardData> {
    return this.api.get<AdminDashboardData>('/dashboard/admin');
  }
}
