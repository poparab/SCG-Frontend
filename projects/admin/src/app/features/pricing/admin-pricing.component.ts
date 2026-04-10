import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
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

  pricingList = signal<PricingItem[]>([]);
  loading = signal(true);
  nationalityFilter = '';

  ngOnInit(): void {
    this.loadPricing();
  }

  loadPricing(): void {
    this.loading.set(true);
    this.nationalityService.getPricingList(this.nationalityFilter || undefined).subscribe({
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
