import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { PagedResult } from '../models/api.models';
import { WalletData, WalletTransactionItem } from '../models/wallet.models';

@Injectable({ providedIn: 'root' })
export class WalletService {
  private readonly api = inject(ApiService);

  getWallet(agencyId: string): Observable<WalletData> {
    return this.api.get<WalletData>(`/agencies/${agencyId}/wallet`);
  }

  getTransactions(agencyId: string, params?: Record<string, string | number | boolean>): Observable<PagedResult<WalletTransactionItem>> {
    return this.api.get<PagedResult<WalletTransactionItem>>(`/agencies/${agencyId}/wallet/transactions`, params);
  }
}
