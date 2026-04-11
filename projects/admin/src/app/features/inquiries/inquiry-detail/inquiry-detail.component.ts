import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { InquiryService } from '../../../core/services/inquiry.service';
import { InquiryDetail } from '../../../core/models/admin.models';

@Component({
  selector: 'app-inquiry-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './inquiry-detail.component.html',
  styleUrl: './inquiry-detail.component.scss'
})
export class InquiryDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private inquiryService = inject(InquiryService);
  private readonly destroyRef = inject(DestroyRef);

  inquiry = signal<InquiryDetail | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
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
