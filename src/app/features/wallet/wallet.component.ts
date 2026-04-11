import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WalletService } from '../../core/services/wallet.service';
import { AuthService } from '../../core/services/auth.service';
import { WalletData, WalletTransactionItem } from '../../core/models/wallet.models';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './wallet.component.html',
  styleUrl: './wallet.component.scss'
})
export class WalletComponent implements OnInit {
  private readonly walletService = inject(WalletService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  wallet = signal<WalletData | null>(null);
  transactions = signal<WalletTransactionItem[]>([]);
  loading = signal(true);
  totalPages = signal(1);
  currentPage = signal(1);
  pageSize = 10;

  filterType = '';
  filterDateFrom = '';
  filterDateTo = '';
  searchTerm = '';

  // Computed stats from loaded transactions
  totalDeposits = signal(0);
  totalDeductions = signal(0);

  private agencyId = '';

  pages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | string)[] = [1];
    if (current > 3) pages.push('...');
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (current < total - 2) pages.push('...');
    pages.push(total);
    return pages;
  });

  ngOnInit(): void {
    this.agencyId = this.authService.getAgencyId() ?? '';
    if (!this.agencyId) {
      this.loading.set(false);
      return;
    }
    this.loadWallet();
    this.loadTransactions();
    this.loadTransactionStats();
  }

  loadWallet(): void {
    this.walletService.getWallet(this.agencyId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => this.wallet.set(data),
      error: () => {}
    });
  }

  loadTransactions(): void {
    this.loading.set(true);
    const params: Record<string, string | number | boolean> = {
      page: this.currentPage(),
      pageSize: this.pageSize
    };
    if (this.filterType) params['type'] = this.filterType;
    if (this.filterDateFrom) params['dateFrom'] = this.filterDateFrom;
    if (this.filterDateTo) params['dateTo'] = this.filterDateTo;
    if (this.searchTerm) params['search'] = this.searchTerm;

    this.walletService.getTransactions(this.agencyId, params).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (result) => {
        this.transactions.set(result.items);
        this.totalPages.set(result.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadTransactionStats(): void {
    // Load all Credit transactions to get total deposits count
    this.walletService.getTransactions(this.agencyId, { page: 1, pageSize: 1, type: 'Credit' }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (r) => this.totalDeposits.set(r.totalCount)
    });
    this.walletService.getTransactions(this.agencyId, { page: 1, pageSize: 1, type: 'Debit' }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (r) => this.totalDeductions.set(r.totalCount)
    });
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadTransactions();
  }

  resetFilters(): void {
    this.filterType = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.searchTerm = '';
    this.applyFilters();
  }

  goToPage(page: number | string): void {
    if (typeof page !== 'number') return;
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadTransactions();
  }

  changePageSize(size: number): void {
    this.pageSize = size;
    this.currentPage.set(1);
    this.loadTransactions();
  }

  get isLowBalance(): boolean {
    const w = this.wallet();
    return !!w && w.balance <= w.lowBalanceThreshold;
  }
}
