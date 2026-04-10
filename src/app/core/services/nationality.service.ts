import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';

export interface AgencyNationality {
  id: string;
  nationalityCode: string;
  nationalityNameAr: string;
  nationalityNameEn: string;
  isEnabled: boolean;
}

@Injectable({ providedIn: 'root' })
export class NationalityService {
  private readonly api = inject(ApiService);

  getAgencyNationalities(agencyId: string): Observable<AgencyNationality[]> {
    return this.api.get<AgencyNationality[]>(`/agencies/${agencyId}/nationalities`).pipe(
      map(list => list.filter(n => n.isEnabled))
    );
  }
}
