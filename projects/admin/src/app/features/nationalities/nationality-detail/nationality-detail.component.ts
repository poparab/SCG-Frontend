import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { NationalityService } from '../../../core/services/nationality.service';
import { NationalityDetail, PricingItem } from '../../../core/models/admin.models';

@Component({
  selector: 'app-nationality-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, TranslateModule],
  templateUrl: './nationality-detail.component.html',
  styleUrl: './nationality-detail.component.scss'
})
export class NationalityDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private nationalityService = inject(NationalityService);
  private fb = inject(FormBuilder);

  nationality = signal<NationalityDetail | null>(null);
  loading = signal(true);
  feeLoading = signal(false);

  feeForm = this.fb.group({
    fee: [null as number | null, [Validators.required, Validators.min(0)]],
    effectiveFrom: ['', [Validators.required]],
    effectiveTo: ['']
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadNationality(id);
  }

  loadNationality(id: string): void {
    this.loading.set(true);
    this.nationalityService.getNationality(id).subscribe({
      next: (data) => {
        this.nationality.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/nationalities']);
      }
    });
  }

  toggleInquiry(): void {
    const nat = this.nationality();
    if (!nat) return;
    this.nationalityService.toggleInquiry(nat.id, !nat.requiresInquiry).subscribe({
      next: () => this.loadNationality(nat.id)
    });
  }

  submitFee(): void {
    if (this.feeForm.invalid) {
      this.feeForm.markAllAsTouched();
      return;
    }
    const nat = this.nationality();
    if (!nat) return;
    const { fee, effectiveFrom, effectiveTo } = this.feeForm.value;
    this.feeLoading.set(true);
    this.nationalityService.updateFee(nat.id, fee!, effectiveFrom!, effectiveTo || undefined).subscribe({
      next: () => {
        this.feeLoading.set(false);
        this.feeForm.reset();
        this.loadNationality(nat.id);
      },
      error: () => this.feeLoading.set(false)
    });
  }

  getActiveFee(): PricingItem | undefined {
    return this.nationality()?.pricingHistory.find(p => p.isActive);
  }
}
