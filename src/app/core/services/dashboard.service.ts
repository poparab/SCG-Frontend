import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AgencyDashboardData } from '../models/dashboard.models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = inject(ApiService);

  getAgencyDashboard(agencyId: string): Observable<AgencyDashboardData> {
    return this.api.get<AgencyDashboardData>(`/dashboard/agency/${agencyId}`);
  }
}
