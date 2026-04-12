import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { AgencyService } from '../../core/services/agency.service';
import { AgencyListItem } from '../../core/models/admin.models';

@Component({
  selector: 'app-admin-agencies',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, TranslateModule],
  templateUrl: './admin-agencies.component.html',
  styleUrl: './admin-agencies.component.scss'
})
export class AdminAgenciesComponent implements OnInit {
  private readonly agencyService = inject(AgencyService);
  private readonly destroyRef = inject(DestroyRef);

  readonly agencies = signal<AgencyListItem[]>([]);
  readonly loading = signal(true);
  readonly totalCount = signal(0);
  readonly currentPage = signal(1);
  readonly searchTerm = signal('');
  readonly statusFilter = signal('');
  readonly searchControl = new FormControl('', { nonNullable: true });

  pageSize = 10;

  ngOnInit(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((value) => {
      this.updateSearchTerm(value);
    });

    this.loadAgencies();
  }

  loadAgencies(): void {
    this.loading.set(true);
    const params: Record<string, string | number> = {
      page: this.currentPage(),
      pageSize: this.pageSize
    };
    if (this.searchTerm()) params['searchTerm'] = this.searchTerm();
    if (this.statusFilter()) params['status'] = this.statusFilter();

    this.agencyService.getAgencies(params).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (result) => {
        this.agencies.set(result.items);
        this.totalCount.set(result.totalCount);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearch(): void {
    this.updateSearchTerm(this.searchControl.getRawValue());
  }

  onFilterStatus(status: string): void {
    if (this.statusFilter() === status) {
      return;
    }

    this.statusFilter.set(status);
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

  private updateSearchTerm(term: string): void {
    const normalizedTerm = term.trim();

    if (normalizedTerm === this.searchTerm() && this.currentPage() === 1) {
      return;
    }

    this.searchTerm.set(normalizedTerm);
    this.currentPage.set(1);
    this.loadAgencies();
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
