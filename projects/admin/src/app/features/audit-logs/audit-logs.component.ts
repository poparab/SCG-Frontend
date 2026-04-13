import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { AuditService } from '../../core/services/audit.service';
import { AuditLogItem } from '../../core/models/admin.models';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './audit-logs.component.html',
  styleUrl: './audit-logs.component.scss'
})
export class AuditLogsComponent implements OnInit {
  private readonly auditService = inject(AuditService);
  private readonly destroyRef = inject(DestroyRef);

  readonly logs = signal<AuditLogItem[]>([]);
  readonly loading = signal(true);
  readonly totalCount = signal(0);
  readonly currentPage = signal(1);
  readonly pageSize = 20;
  readonly expandedId = signal<string | null>(null);

  readonly entityTypeControl = new FormControl('', { nonNullable: true });
  readonly userEmailControl = new FormControl('', { nonNullable: true });
  readonly actionControl = new FormControl('', { nonNullable: true });
  readonly dateFromControl = new FormControl('', { nonNullable: true });
  readonly dateToControl = new FormControl('', { nonNullable: true });

  ngOnInit(): void {
    const filterControls = [
      this.entityTypeControl,
      this.userEmailControl,
      this.actionControl,
      this.dateFromControl,
      this.dateToControl
    ];

    filterControls.forEach(ctrl => {
      ctrl.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(() => {
        this.currentPage.set(1);
        this.loadLogs();
      });
    });

    this.loadLogs();
  }

  loadLogs(): void {
    this.loading.set(true);
    const params: Record<string, string | number | boolean> = {
      page: this.currentPage(),
      pageSize: this.pageSize
    };
    if (this.entityTypeControl.value) params['entityType'] = this.entityTypeControl.value;
    if (this.userEmailControl.value) params['userEmail'] = this.userEmailControl.value;
    if (this.actionControl.value) params['action'] = this.actionControl.value;
    if (this.dateFromControl.value) params['dateFrom'] = this.dateFromControl.value;
    if (this.dateToControl.value) params['dateTo'] = this.dateToControl.value;

    this.auditService.getLogs(params).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (result) => {
        this.logs.set(result.items);
        this.totalCount.set(result.totalCount);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  toggleExpand(id: string): void {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadLogs();
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount() / this.pageSize);
  }

  clearFilters(): void {
    this.entityTypeControl.setValue('');
    this.userEmailControl.setValue('');
    this.actionControl.setValue('');
    this.dateFromControl.setValue('');
    this.dateToControl.setValue('');
  }
}
