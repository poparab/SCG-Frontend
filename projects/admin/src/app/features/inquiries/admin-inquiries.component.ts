import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { InquiryService } from '../../core/services/inquiry.service';
import { InquiryListItem } from '../../core/models/admin.models';

@Component({
  selector: 'app-admin-inquiries',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule],
  templateUrl: './admin-inquiries.component.html',
  styleUrl: './admin-inquiries.component.scss'
})
export class AdminInquiriesComponent implements OnInit {
  private inquiryService = inject(InquiryService);
  private readonly destroyRef = inject(DestroyRef);

  inquiries = signal<InquiryListItem[]>([]);
  loading = signal(true);
  totalCount = signal(0);
  currentPage = signal(1);
  pageSize = 15;
  searchTerm = '';
  statusFilter = '';

  ngOnInit(): void {
    this.loadInquiries();
  }

  loadInquiries(): void {
    this.loading.set(true);
    const params: Record<string, string | number> = {
      pageNumber: this.currentPage(),
      pageSize: this.pageSize
    };
    if (this.searchTerm) params['search'] = this.searchTerm;
    if (this.statusFilter) params['status'] = this.statusFilter;

    this.inquiryService.getInquiries(params).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (result) => {
        this.inquiries.set(result.items);
        this.totalCount.set(result.totalCount);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearch(): void {
    this.currentPage.set(1);
    this.loadInquiries();
  }

  onFilterStatus(status: string): void {
    this.statusFilter = status;
    this.currentPage.set(1);
    this.loadInquiries();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadInquiries();
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount() / this.pageSize);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Approved': return 'badge-success';
      case 'Rejected': return 'badge-danger';
      case 'UnderProcessing': return 'badge-info';
      case 'PaymentPending': return 'badge-warning';
      case 'Submitted': return 'badge-primary';
      case 'Failed': return 'badge-danger';
      default: return 'badge-secondary';
    }
  }
}
