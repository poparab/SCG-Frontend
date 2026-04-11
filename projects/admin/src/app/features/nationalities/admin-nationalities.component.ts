import { Component, inject, OnInit, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NationalityService } from '../../core/services/nationality.service';
import { MasterNationalityItem, NationalityListItem } from '../../core/models/admin.models';
import { mapApiError } from '../../core/utils/error-mapper';

@Component({
  selector: 'app-admin-nationalities',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './admin-nationalities.component.html',
  styleUrl: './admin-nationalities.component.scss'
})
export class AdminNationalitiesComponent implements OnInit {
  private nationalityService = inject(NationalityService);
  private fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  nationalities = signal<NationalityListItem[]>([]);
  loading = signal(true);
  totalCount = signal(0);
  currentPage = signal(1);
  pageSize = 10;
  searchTerm = '';
  inquiryFilter = '';

  showAddModal = signal(false);
  addLoading = signal(false);
  addError = signal('');
  addSuccess = signal('');

  masterNationalities = signal<MasterNationalityItem[]>([]);
  selectedMasterNationality = signal<MasterNationalityItem | null>(null);

  availableNationalities = computed(() => {
    const existingCodes = new Set(this.nationalities().map(n => n.code));
    return this.masterNationalities().filter(m => !existingCodes.has(m.code));
  });

  addForm = this.fb.group({
    code: ['', [Validators.required]],
    nameEn: ['', [Validators.required]],
    nameAr: ['', [Validators.required]],
    requiresInquiry: [true],
    defaultFee: [0, [Validators.required, Validators.min(0)]]
  });

  ngOnInit(): void {
    this.loadNationalities();
    this.loadMasterList();
  }

  loadMasterList(): void {
    this.nationalityService.getMasterList().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (list) => this.masterNationalities.set(list)
    });
  }

  onNationalitySelected(code: string): void {
    const item = this.masterNationalities().find(m => m.code === code) || null;
    this.selectedMasterNationality.set(item);
    if (item) {
      this.addForm.patchValue({ code: item.code, nameEn: item.nameEn, nameAr: item.nameAr });
    } else {
      this.addForm.patchValue({ code: '', nameEn: '', nameAr: '' });
    }
  }

  loadNationalities(): void {
    this.loading.set(true);
    const params: Record<string, string | number | boolean> = {
      pageNumber: this.currentPage(),
      pageSize: this.pageSize
    };
    if (this.searchTerm) params['search'] = this.searchTerm;
    if (this.inquiryFilter === 'yes') params['requiresInquiry'] = true;
    if (this.inquiryFilter === 'no') params['requiresInquiry'] = false;

    this.nationalityService.getNationalities(params).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (result) => {
        this.nationalities.set(result.items);
        this.totalCount.set(result.totalCount);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearch(): void {
    this.currentPage.set(1);
    this.loadNationalities();
  }

  onFilterInquiry(filter: string): void {
    this.inquiryFilter = filter;
    this.currentPage.set(1);
    this.loadNationalities();
  }

  toggleInquiry(item: NationalityListItem): void {
    this.nationalityService.toggleInquiry(item.id, !item.requiresInquiry).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => this.loadNationalities()
    });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadNationalities();
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount() / this.pageSize);
  }

  submitAdd(): void {
    if (this.addForm.invalid) {
      this.addForm.markAllAsTouched();
      return;
    }
    this.addLoading.set(true);
    this.addError.set('');
    this.addSuccess.set('');
    const val = this.addForm.value;
    this.nationalityService.addNationality({
      code: val.code!,
      nameAr: val.nameAr!,
      nameEn: val.nameEn!,
      requiresInquiry: val.requiresInquiry!,
      defaultFee: val.defaultFee!
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.addLoading.set(false);
        this.showAddModal.set(false);
        this.addForm.reset({ requiresInquiry: true, defaultFee: 0 });
        this.selectedMasterNationality.set(null);
        this.addSuccess.set('admin.errors.nationalityAddSuccess');
        this.loadNationalities();
      },
      error: (err) => {
        this.addLoading.set(false);
        this.addError.set(mapApiError(err.error?.error, 'admin.errors.genericError'));
      }
    });
  }
}
