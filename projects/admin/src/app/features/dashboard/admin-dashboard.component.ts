import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DashboardService } from '../../core/services/dashboard.service';
import { AdminDashboardData, RecentAgency, RecentInquiry } from '../../core/models/admin.models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  loading = signal(true);
  totalAgencies = signal(0);
  pendingAgencies = signal(0);
  approvedAgencies = signal(0);
  totalInquiries = signal(0);
  pendingInquiries = signal(0);
  approvedInquiries = signal(0);
  rejectedInquiries = signal(0);
  totalWalletBalance = signal(0);
  recentAgencies = signal<RecentAgency[]>([]);
  recentInquiries = signal<RecentInquiry[]>([]);

  ngOnInit(): void {
    this.dashboardService.getDashboard().subscribe({
      next: (data: AdminDashboardData) => {
        this.totalAgencies.set(data.totalAgencies);
        this.pendingAgencies.set(data.pendingAgencies);
        this.approvedAgencies.set(data.approvedAgencies);
        this.totalInquiries.set(data.totalInquiries);
        this.pendingInquiries.set(data.pendingInquiries);
        this.approvedInquiries.set(data.approvedInquiries);
        this.rejectedInquiries.set(data.rejectedInquiries);
        this.totalWalletBalance.set(data.totalWalletBalance);
        this.recentAgencies.set(data.recentAgencies);
        this.recentInquiries.set(data.recentInquiries);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Approved': return 'badge-success';
      case 'PendingReview': return 'badge-warning';
      case 'Rejected': return 'badge-danger';
      case 'UnderProcessing': return 'badge-info';
      default: return 'badge-secondary';
    }
  }
}
