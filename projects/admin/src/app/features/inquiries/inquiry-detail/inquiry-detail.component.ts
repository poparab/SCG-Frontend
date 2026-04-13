import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { InquiryService } from '../../../core/services/inquiry.service';
import { InquiryDetail } from '../../../core/models/admin.models';
import { mapApiError } from '../../../core/utils/error-mapper';

@Component({
  selector: 'app-inquiry-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, TranslateModule],
  templateUrl: './inquiry-detail.component.html',
  styleUrl: './inquiry-detail.component.scss'
})
export class InquiryDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private inquiryService = inject(InquiryService);
  private fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  inquiry = signal<InquiryDetail | null>(null);
  loading = signal(true);
  actionLoading = signal(false);
  actionError = signal('');
  actionSuccess = signal('');
  showRejectModal = signal(false);

  rejectForm = this.fb.group({
    reason: ['', [Validators.required, Validators.minLength(10)]]
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadInquiry(id);
  }

  private loadInquiry(id: string): void {
    this.loading.set(true);
    this.inquiryService.getInquiry(id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        this.inquiry.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/inquiries']);
      }
    });
  }

  canTakeAction(): boolean {
    const status = this.inquiry()?.status;
    return status === 'Submitted' || status === 'UnderProcessing';
  }

  approveInquiry(): void {
    const inq = this.inquiry();
    if (!inq) return;
    this.actionLoading.set(true);
    this.actionError.set('');
    this.actionSuccess.set('');

    this.inquiryService.approveInquiry(inq.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.actionSuccess.set('admin.inquiries.approve_success');
        this.loadInquiry(inq.id);
      },
      error: (err) => {
        this.actionLoading.set(false);
        this.actionError.set(mapApiError(err.error?.error, 'admin.errors.genericError'));
      }
    });
  }

  submitReject(): void {
    if (this.rejectForm.invalid) {
      this.rejectForm.markAllAsTouched();
      return;
    }
    const inq = this.inquiry();
    if (!inq) return;
    this.actionLoading.set(true);
    this.actionError.set('');
    this.actionSuccess.set('');

    this.inquiryService.rejectInquiry(inq.id, this.rejectForm.value.reason!).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.showRejectModal.set(false);
        this.rejectForm.reset();
        this.actionSuccess.set('admin.inquiries.reject_success');
        this.loadInquiry(inq.id);
      },
      error: (err) => {
        this.actionLoading.set(false);
        this.actionError.set(mapApiError(err.error?.error, 'admin.errors.genericError'));
      }
    });
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

  getTimelineIcon(status: string): string {
    switch (status) {
      case 'Approved': return 'fas fa-check-circle';
      case 'Rejected': return 'fas fa-times-circle';
      case 'UnderProcessing': return 'fas fa-spinner';
      case 'Submitted': return 'fas fa-paper-plane';
      case 'PaymentPending': return 'fas fa-clock';
      case 'Failed': return 'fas fa-exclamation-circle';
      default: return 'fas fa-circle';
    }
  }
}
