import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AgencyService } from '../../core/services/agency.service';
import { AgencyListItem } from '../../core/models/admin.models';

@Component({
  selector: 'app-admin-agencies',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule],
  templateUrl: './admin-agencies.component.html',
  styleUrl: './admin-agencies.component.scss'
})
export class AdminAgenciesComponent implements OnInit {
  private agencyService = inject(AgencyService);

  agencies = signal<AgencyListItem[]>([]);
  loading = signal(true);
  totalCount = signal(0);
  currentPage = signal(1);
  pageSize = 10;
  searchTerm = '';
  statusFilter = '';

  ngOnInit(): void {
    this.loadAgencies();
  }

  loadAgencies(): void {
    this.loading.set(true);
    const params: Record<string, string | number> = {
      pageNumber: this.currentPage(),
      pageSize: this.pageSize
    };
    if (this.searchTerm) params['search'] = this.searchTerm;
    if (this.statusFilter) params['status'] = this.statusFilter;

    this.agencyService.getAgencies(params).subscribe({
      next: (result) => {
        this.agencies.set(result.items);
        this.totalCount.set(result.totalCount);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearch(): void {
    this.currentPage.set(1);
    this.loadAgencies();
  }

  onFilterStatus(status: string): void {
    this.statusFilter = status;
    this.currentPage.set(1);
    this.loadAgencies();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadAgencies();
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount() / this.pageSize);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Approved': return 'badge-success';
      case 'PendingReview': return 'badge-warning';
      case 'Rejected': return 'badge-danger';
      case 'Suspended': return 'badge-secondary';
      default: return 'badge-secondary';
    }
  }
}
