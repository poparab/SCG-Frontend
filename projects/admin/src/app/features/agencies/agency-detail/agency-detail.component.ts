import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AgencyService } from '../../../core/services/agency.service';
import { AgencyDetail, AgencyNationalityItem } from '../../../core/models/admin.models';
import { mapApiError } from '../../../core/utils/error-mapper';

@Component({
  selector: 'app-agency-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, TranslateModule],
  templateUrl: './agency-detail.component.html',
  styleUrl: './agency-detail.component.scss'
})
export class AgencyDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private agencyService = inject(AgencyService);
  private fb = inject(FormBuilder);

  agency = signal<AgencyDetail | null>(null);
  loading = signal(true);
  actionLoading = signal(false);
  actionError = signal('');
  actionSuccess = signal('');

  showRejectModal = signal(false);
  showCreditModal = signal(false);

  agencyNationalities = signal<AgencyNationalityItem[]>([]);
  natLoading = signal(false);
  editingFeeId = signal<string | null>(null);
  editingFeeValue = signal<string>('');

  rejectForm = this.fb.group({
    reason: ['', [Validators.required, Validators.minLength(10)]]
  });

  creditForm = this.fb.group({
    amount: [null as number | null, [Validators.required, Validators.min(1)]],
    paymentMethod: ['', [Validators.required]],
    reference: [''],
    notes: ['']
  });

  selectedEvidence = signal<File | null>(null);

  onEvidenceSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedEvidence.set(input.files[0]);
    } else {
      this.selectedEvidence.set(null);
    }
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadAgency(id);
    this.loadAgencyNationalities(id);
  }

  loadAgency(id: string): void {
    this.loading.set(true);
    this.agencyService.getAgency(id).subscribe({
      next: (data) => {
        this.agency.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/agencies']);
      }
    });
  }

  loadAgencyNationalities(agencyId: string): void {
    this.natLoading.set(true);
    this.agencyService.getAgencyNationalities(agencyId).subscribe({
      next: (data) => {
        this.agencyNationalities.set(data);
        this.natLoading.set(false);
      },
      error: () => this.natLoading.set(false)
    });
  }

  startEditFee(item: AgencyNationalityItem): void {
    this.editingFeeId.set(item.id);
    this.editingFeeValue.set(item.customFee !== null ? String(item.customFee) : '');
  }

  cancelEditFee(): void {
    this.editingFeeId.set(null);
    this.editingFeeValue.set('');
  }

  saveCustomFee(item: AgencyNationalityItem): void {
    const raw = this.editingFeeValue().trim();
    const customFee = raw === '' ? null : Number(raw);
    if (customFee !== null && (isNaN(customFee) || customFee < 0)) return;
    const a = this.agency();
    if (!a) return;
    this.agencyService.updateAgencyNationality(a.id, item.nationalityId, { customFee, isEnabled: item.isEnabled }).subscribe({
      next: () => {
        this.editingFeeId.set(null);
        this.actionSuccess.set('agency.nationalities.updateSuccess');
        this.loadAgencyNationalities(a.id);
      },
      error: (err) => {
        this.actionError.set(mapApiError(err.error?.error, 'admin.errors.genericError'));
      }
    });
  }

  toggleNationalityEnabled(item: AgencyNationalityItem): void {
    const a = this.agency();
    if (!a) return;
    this.agencyService.updateAgencyNationality(a.id, item.nationalityId, { customFee: item.customFee, isEnabled: !item.isEnabled }).subscribe({
      next: () => {
        this.actionSuccess.set('agency.nationalities.updateSuccess');
        this.loadAgencyNationalities(a.id);
      },
      error: (err) => {
        this.actionError.set(mapApiError(err.error?.error, 'admin.errors.genericError'));
      }
    });
  }

  approveAgency(): void {
    const a = this.agency();
    if (!a) return;
    this.actionLoading.set(true);
    this.actionError.set('');
    this.actionSuccess.set('');
    this.agencyService.approveAgency(a.id).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.actionSuccess.set('admin.errors.approveSuccess');
        this.loadAgency(a.id);
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
    const a = this.agency();
    if (!a) return;
    this.actionLoading.set(true);
    this.actionError.set('');
    this.actionSuccess.set('');
    this.agencyService.rejectAgency(a.id, this.rejectForm.value.reason!).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.showRejectModal.set(false);
        this.rejectForm.reset();
        this.actionSuccess.set('admin.errors.rejectSuccess');
        this.loadAgency(a.id);
      },
      error: (err) => {
        this.actionLoading.set(false);
        this.actionError.set(mapApiError(err.error?.error, 'admin.errors.genericError'));
      }
    });
  }

  submitCredit(): void {
    if (this.creditForm.invalid) {
      this.creditForm.markAllAsTouched();
      return;
    }
    const a = this.agency();
    if (!a) return;
    const { amount, paymentMethod, reference, notes } = this.creditForm.value;
    this.actionLoading.set(true);
    this.actionError.set('');
    this.actionSuccess.set('');
    this.agencyService.creditWallet(
      a.id,
      amount!,
      paymentMethod!,
      reference || undefined,
      notes || undefined,
      this.selectedEvidence() || undefined
    ).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.showCreditModal.set(false);
        this.creditForm.reset();
        this.selectedEvidence.set(null);
        this.actionSuccess.set('admin.errors.creditSuccess');
        this.loadAgency(a.id);
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
      case 'PendingReview': return 'badge-warning';
      case 'Rejected': return 'badge-danger';
      case 'Suspended': return 'badge-secondary';
      default: return 'badge-secondary';
    }
  }
}
