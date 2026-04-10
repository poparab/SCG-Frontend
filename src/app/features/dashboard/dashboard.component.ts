import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DashboardService } from '../../core/services/dashboard.service';
import { AuthService } from '../../core/services/auth.service';
import { AgencyDashboardData } from '../../core/models/dashboard.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly authService = inject(AuthService);
  private readonly translate = inject(TranslateService);

  data = signal<AgencyDashboardData | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  agencyName = computed(() => {
    const d = this.data();
    if (!d) return '';
    return this.translate.currentLang === 'en' ? (d.agencyNameEn || d.agencyName) : d.agencyName;
  });

  approvalRate = computed(() => {
    const d = this.data();
    if (!d || d.totalInquiries === 0) return '0';
    return ((d.approvedInquiries / d.totalInquiries) * 100).toFixed(1);
  });

  ngOnInit(): void {
    const agencyId = this.authService.getAgencyId();
    if (!agencyId) {
      this.error.set('dashboard.noAgency');
      this.loading.set(false);
      return;
    }
    this.dashboardService.getAgencyDashboard(agencyId).subscribe({
      next: (result) => {
        this.data.set(result);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('dashboard.errorLoading');
        this.loading.set(false);
      }
    });
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'Draft': 'sp-gray', 'Submitted': 'sp-blue', 'UnderProcessing': 'sp-orange',
      'Completed': 'sp-green', 'Approved': 'sp-green', 'Rejected': 'sp-red'
    };
    return map[status] || 'sp-blue';
  }

  getStatusIcon(status: string): string {
    const map: Record<string, string> = {
      'Draft': 'fa-solid fa-pen', 'Submitted': 'fa-solid fa-paper-plane',
      'UnderProcessing': 'fa-solid fa-gear', 'Completed': 'fa-solid fa-circle-check',
      'Approved': 'fa-solid fa-circle-check', 'Rejected': 'fa-solid fa-circle-xmark'
    };
    return map[status] || 'fa-solid fa-circle';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      'Draft': 'batch.statusDraft', 'Submitted': 'batch.statusSubmitted',
      'UnderProcessing': 'batch.statusProcessing', 'Completed': 'batch.statusCompleted',
      'Approved': 'inquiry.statusApproved', 'Rejected': 'inquiry.statusRejected'
    };
    return map[status] || status;
  }

  getAgencyStatusClass(status: string): string {
    const map: Record<string, string> = {
      'Approved': 'sp-green', 'PendingReview': 'sp-orange',
      'Rejected': 'sp-red', 'Suspended': 'sp-red'
    };
    return map[status] || 'sp-gray';
  }

  getAgencyStatusIcon(status: string): string {
    const map: Record<string, string> = {
      'Approved': 'fa-solid fa-circle-check', 'PendingReview': 'fa-solid fa-clock',
      'Rejected': 'fa-solid fa-circle-xmark', 'Suspended': 'fa-solid fa-ban'
    };
    return map[status] || 'fa-solid fa-circle';
  }

  getAgencyStatusLabel(status: string): string {
    const map: Record<string, string> = {
      'Approved': 'dashboard.active', 'PendingReview': 'dashboard.pendingReview',
      'Rejected': 'dashboard.rejected', 'Suspended': 'dashboard.suspended'
    };
    return map[status] || status;
  }
}
