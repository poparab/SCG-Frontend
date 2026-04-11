import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BatchService } from '../../core/services/batch.service';
import { AuthService } from '../../core/services/auth.service';
import { BatchListItem } from '../../core/models/batch.models';

@Component({
  selector: 'app-batch-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  templateUrl: './batch-list.component.html',
  styleUrl: './batch-list.component.scss'
})
export class BatchListComponent implements OnInit {
  private readonly batchService = inject(BatchService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  batches = signal<BatchListItem[]>([]);
  loading = signal(true);
  totalPages = signal(1);
  totalCount = signal(0);
  currentPage = signal(1);
  pageSize = signal(10);

  filterStatus = '';
  searchTerm = '';
  filterDate = '';

  private agencyId = '';

  // Stat counts
  completedCount = signal(0);
  processingCount = signal(0);
  receivedCount = signal(0);

  pages = computed(() => {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  ngOnInit(): void {
    this.agencyId = this.authService.getAgencyId() ?? '';
    if (!this.agencyId) {
      this.loading.set(false);
      return;
    }
    this.loadBatches();
  }

  loadBatches(): void {
    this.loading.set(true);
    const params: Record<string, string | number | boolean> = {
      page: this.currentPage(),
      pageSize: this.pageSize()
    };
    if (this.filterStatus) params['status'] = this.filterStatus;
    if (this.searchTerm) params['search'] = this.searchTerm;
    if (this.filterDate) params['date'] = this.filterDate;

    this.batchService.getBatches(this.agencyId, params).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (result) => {
        this.batches.set(result.items);
        this.totalPages.set(result.totalPages);
        this.totalCount.set(result.totalCount ?? result.items.length);
        this.updateStatCounts(result.items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private updateStatCounts(items: BatchListItem[]): void {
    let completed = 0, processing = 0, received = 0;
    for (const b of items) {
      const s = b.status?.toLowerCase();
      if (s === 'completed' || s === 'approved') completed++;
      else if (s === 'underprocessing' || s === 'processing') processing++;
      else if (s === 'submitted' || s === 'received') received++;
    }
    this.completedCount.set(completed);
    this.processingCount.set(processing);
    this.receivedCount.set(received);
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadBatches();
  }

  resetFilters(): void {
    this.filterStatus = '';
    this.searchTerm = '';
    this.filterDate = '';
    this.applyFilters();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadBatches();
  }

  onPageSizeChange(): void {
    this.currentPage.set(1);
    this.loadBatches();
  }

  getStatusPillClass(status: string): string {
    const s = status?.toLowerCase();
    if (s === 'completed' || s === 'approved') return 'sp-green';
    if (s === 'underprocessing' || s === 'processing') return 'sp-orange';
    if (s === 'submitted' || s === 'received') return 'sp-blue';
    if (s === 'rejected') return 'sp-red';
    if (s === 'draft') return 'sp-gray';
    return 'sp-gray';
  }

  getStatusIcon(status: string): string {
    const s = status?.toLowerCase();
    if (s === 'completed' || s === 'approved') return 'fa-solid fa-circle-check';
    if (s === 'underprocessing' || s === 'processing') return 'fa-solid fa-gear';
    if (s === 'submitted' || s === 'received') return 'fa-solid fa-file-circle-check';
    if (s === 'rejected') return 'fa-solid fa-circle-xmark';
    return 'fa-solid fa-circle';
  }

  getStatusLabel(status: string): string {
    const s = status?.toLowerCase();
    if (s === 'completed' || s === 'approved') return 'batch.statusApproved';
    if (s === 'underprocessing' || s === 'processing') return 'batch.statusProcessing';
    if (s === 'submitted' || s === 'received') return 'batch.statusReceived';
    if (s === 'rejected') return 'batch.statusRejected';
    if (s === 'draft') return 'batch.statusDraft';
    return 'batch.statusDraft';
  }
}
