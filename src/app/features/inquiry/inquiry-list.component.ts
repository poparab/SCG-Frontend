import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { InquiryService } from '../../core/services/inquiry.service';
import { AuthService } from '../../core/services/auth.service';
import { NationalityService, AgencyNationality } from '../../core/services/nationality.service';
import { InquiryListItem } from '../../core/models/inquiry.models';

@Component({
  selector: 'app-inquiry-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  templateUrl: './inquiry-list.component.html',
  styleUrl: './inquiry-list.component.scss'
})
export class InquiryListComponent implements OnInit {
  private readonly inquiryService = inject(InquiryService);
  private readonly authService = inject(AuthService);
  private readonly nationalityService = inject(NationalityService);

  inquiries = signal<InquiryListItem[]>([]);
  loading = signal(true);
  totalPages = signal(1);
  currentPage = signal(1);
  pageSize = 10;
  nationalities = signal<AgencyNationality[]>([]);

  // Stat counts
  totalCount = signal(0);
  approvedCount = signal(0);
  processingCount = signal(0);
  rejectedCount = signal(0);

  filterStatus = '';
  filterNationality = '';
  searchTerm = '';
  filterDate = '';

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
    this.loadInquiries();
    this.loadStats();

    this.nationalityService.getAgencyNationalities(this.agencyId).subscribe({
      next: (nats) => this.nationalities.set(nats)
    });
  }

  loadInquiries(): void {
    this.loading.set(true);
    const params: Record<string, string | number | boolean> = {
      page: this.currentPage(),
      pageSize: this.pageSize
    };
    if (this.filterStatus) params['status'] = this.filterStatus;
    if (this.filterNationality) params['nationalityCode'] = this.filterNationality;
    if (this.searchTerm) params['search'] = this.searchTerm;
    if (this.filterDate) params['dateFrom'] = this.filterDate;

    this.inquiryService.getInquiries(this.agencyId, params).subscribe({
      next: (result) => {
        this.inquiries.set(result.items);
        this.totalPages.set(result.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadStats(): void {
    const base = { page: 1, pageSize: 1 };
    this.inquiryService.getInquiries(this.agencyId, base).subscribe({
      next: (r) => this.totalCount.set(r.totalCount)
    });
    this.inquiryService.getInquiries(this.agencyId, { ...base, status: 'Approved' }).subscribe({
      next: (r) => this.approvedCount.set(r.totalCount)
    });
    this.inquiryService.getInquiries(this.agencyId, { ...base, status: 'UnderProcessing' }).subscribe({
      next: (r) => this.processingCount.set(r.totalCount)
    });
    this.inquiryService.getInquiries(this.agencyId, { ...base, status: 'Rejected' }).subscribe({
      next: (r) => this.rejectedCount.set(r.totalCount)
    });
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadInquiries();
  }

  resetFilters(): void {
    this.filterStatus = '';
    this.filterNationality = '';
    this.searchTerm = '';
    this.filterDate = '';
    this.applyFilters();
  }

  goToPage(page: number | string): void {
    if (typeof page !== 'number') return;
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadInquiries();
  }

  changePageSize(size: number): void {
    this.pageSize = size;
    this.currentPage.set(1);
    this.loadInquiries();
  }

  getStatusPillClass(status: string): string {
    switch (status) {
      case 'Approved': return 'sp-green';
      case 'UnderProcessing': return 'sp-orange';
      case 'Submitted': return 'sp-blue';
      case 'Rejected': return 'sp-red';
      case 'Failed': return 'sp-red';
      default: return 'sp-gray';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'Approved': return 'fa-solid fa-circle-check';
      case 'UnderProcessing': return 'fa-solid fa-gear';
      case 'Submitted': return 'fa-solid fa-file-circle-check';
      case 'Rejected': return 'fa-solid fa-circle-xmark';
      case 'Failed': return 'fa-solid fa-circle-xmark';
      default: return 'fa-solid fa-circle';
    }
  }

  getStatusKey(status: string): string {
    switch (status) {
      case 'Approved': return 'inquiry.statusApproved';
      case 'UnderProcessing': return 'inquiry.statusProcessing';
      case 'Submitted': return 'inquiry.statusSubmitted';
      case 'Rejected': return 'inquiry.statusRejected';
      case 'Failed': return 'inquiry.statusFailed';
      default: return 'inquiry.status';
    }
  }
}
