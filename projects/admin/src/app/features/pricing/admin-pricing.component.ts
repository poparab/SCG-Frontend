import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NationalityService } from '../../core/services/nationality.service';
import { PricingItem } from '../../core/models/admin.models';

@Component({
  selector: 'app-admin-pricing',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './admin-pricing.component.html',
  styleUrl: './admin-pricing.component.scss'
})
export class AdminPricingComponent implements OnInit {
  private nationalityService = inject(NationalityService);
  private readonly destroyRef = inject(DestroyRef);

  pricingList = signal<PricingItem[]>([]);
  loading = signal(true);
  nationalityFilter = '';

  ngOnInit(): void {
    this.loadPricing();
  }

  loadPricing(): void {
    this.loading.set(true);
    this.nationalityService.getPricingList(this.nationalityFilter || undefined).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (items) => {
        this.pricingList.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onFilter(): void {
    this.loadPricing();
  }
}
