import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BatchService } from '../../../core/services/batch.service';
import { BatchDetail, BatchTraveler } from '../../../core/models/batch.models';

@Component({
  selector: 'app-batch-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  templateUrl: './batch-detail.component.html',
  styleUrl: './batch-detail.component.scss'
})
export class BatchDetailComponent implements OnInit {
  private readonly batchService = inject(BatchService);
  private readonly route = inject(ActivatedRoute);

  batch = signal<BatchDetail | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  // Filters
  searchTerm = '';
  filterStatus = '';
  filterNationality = '';

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);

  // Stat counts
  totalTravelers = computed(() => this.batch()?.travelers?.length ?? 0);
  processingCount = computed(() => this.countByStatus('underprocessing', 'processing'));
  approvedCount = computed(() => this.countByStatus('approved', 'completed'));
  rejectedCount = computed(() => this.countByStatus('rejected'));

  // Filtered travelers
  filteredTravelers = computed(() => {
    const b = this.batch();
    if (!b) return [];
    let list = b.travelers;
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      list = list.filter(t =>
        (t.firstNameEn + ' ' + t.lastNameEn).toLowerCase().includes(term) ||
        t.inquiryReferenceNumber?.toLowerCase().includes(term) ||
        t.passportNumber?.toLowerCase().includes(term)
      );
    }
    if (this.filterStatus) {
      const s = this.filterStatus.toLowerCase();
      list = list.filter(t => t.inquiryStatus?.toLowerCase() === s);
    }
    if (this.filterNationality) {
      list = list.filter(t => t.nationalityCode === this.filterNationality);
    }
    return list;
  });

  pagedTravelers = computed(() => {
    const all = this.filteredTravelers();
    const start = (this.currentPage() - 1) * this.pageSize();
    return all.slice(start, start + this.pageSize());
  });

  travelerTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredTravelers().length / this.pageSize()))
  );

  travelerPages = computed(() =>
    Array.from({ length: this.travelerTotalPages() }, (_, i) => i + 1)
  );

  // Unique nationalities for filter
  nationalities = computed(() => {
    const b = this.batch();
    if (!b) return [];
    const set = new Set(b.travelers.map(t => t.nationalityCode));
    return Array.from(set);
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('batch.notFound');
      this.loading.set(false);
      return;
    }
    this.batchService.getBatch(id).subscribe({
      next: (data) => {
        this.batch.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('batch.errorLoading');
        this.loading.set(false);
      }
    });
  }

  private countByStatus(...statuses: string[]): number {
    const travelers = this.batch()?.travelers ?? [];
    return travelers.filter(t =>
      statuses.some(s => t.inquiryStatus?.toLowerCase() === s)
    ).length;
  }

  applyFilters(): void {
    this.currentPage.set(1);
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.filterStatus = '';
    this.filterNationality = '';
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.travelerTotalPages()) return;
    this.currentPage.set(page);
  }

  onPageSizeChange(): void {
    this.currentPage.set(1);
  }

  exportBatch(): void {
    const b = this.batch();
    if (!b || !b.travelers.length) return;

    const headers = ['Reference', 'First Name', 'Last Name', 'Nationality', 'Passport', 'Travel Date', 'Status'];
    const rows = b.travelers.map(t => [
      t.inquiryReferenceNumber || '',
      t.firstNameEn,
      t.lastNameEn,
      t.nationalityCode,
      t.passportNumber,
      t.travelDate ? new Date(t.travelDate).toISOString().split('T')[0] : '',
      t.inquiryStatus || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${b.name || 'batch'}-travelers.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  getStatusPillClass(status: string | undefined): string {
    const s = status?.toLowerCase();
    if (s === 'completed' || s === 'approved') return 'sp-green';
    if (s === 'underprocessing' || s === 'processing') return 'sp-orange';
    if (s === 'submitted' || s === 'received') return 'sp-blue';
    if (s === 'rejected') return 'sp-red';
    return 'sp-gray';
  }

  getStatusIcon(status: string | undefined): string {
    const s = status?.toLowerCase();
    if (s === 'completed' || s === 'approved') return 'fa-solid fa-circle-check';
    if (s === 'underprocessing' || s === 'processing') return 'fa-solid fa-gear';
    if (s === 'submitted' || s === 'received') return 'fa-solid fa-file-circle-check';
    if (s === 'rejected') return 'fa-solid fa-circle-xmark';
    return 'fa-solid fa-circle';
  }

  getStatusLabel(status: string | undefined): string {
    const s = status?.toLowerCase();
    if (s === 'completed' || s === 'approved') return 'batch.statusApproved';
    if (s === 'underprocessing' || s === 'processing') return 'batch.statusProcessing';
    if (s === 'submitted' || s === 'received') return 'batch.statusReceived';
    if (s === 'rejected') return 'batch.statusRejected';
    return 'batch.statusDraft';
  }

  get isDraft(): boolean {
    return this.batch()?.status === 'Draft';
  }
}
