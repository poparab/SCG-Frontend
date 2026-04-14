import { Component, inject, signal, OnInit, OnDestroy, DestroyRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BatchService } from '../../../core/services/batch.service';
import { AuthService } from '../../../core/services/auth.service';
import { NationalityService, AgencyNationality } from '../../../core/services/nationality.service';
import { BatchTraveler, SubmitBatchResponse, TravelerSaveRequest } from '../../../core/models/batch.models';
import { mapApiError } from '../../../core/utils/error-mapper';
import { SearchableSelectComponent } from '../../../shared/components/searchable-select/searchable-select.component';
import { EGYPT_AIRPORTS } from '../../../core/data/egypt-airports';
import { WORLD_COUNTRIES } from '../../../core/data/world-countries';

type TravelerDocumentControlName = 'passportImage' | 'ticketImage';

const MAX_TRAVELER_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TRAVELER_DOCUMENT_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png'];
const ALLOWED_TRAVELER_DOCUMENT_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

function requiredFileValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    return control.value instanceof File ? null : { required: true };
  };
}

function fileTypeValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const file = control.value;
    if (!(file instanceof File)) {
      return null;
    }

    const extension = file.name.includes('.')
      ? file.name.split('.').pop()?.toLowerCase()
      : undefined;
    const matchesMimeType = ALLOWED_TRAVELER_DOCUMENT_MIME_TYPES.includes(file.type);
    const matchesExtension = !!extension && ALLOWED_TRAVELER_DOCUMENT_EXTENSIONS.includes(extension);

    return matchesMimeType || matchesExtension ? null : { invalidFileType: true };
  };
}

function fileSizeValidator(maxBytes: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const file = control.value;
    if (!(file instanceof File)) {
      return null;
    }

    return file.size <= maxBytes ? null : { maxFileSize: true };
  };
}

function pastDateValidator(): ValidatorFn {
  return (control: AbstractControl) => {
    if (!control.value) return null;
    const date = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today ? { futureDate: true } : null;
  };
}

function minPassportExpiryValidator(): ValidatorFn {
  return (control: AbstractControl) => {
    if (!control.value) return null;
    const expiry = new Date(control.value);
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    sixMonthsFromNow.setHours(0, 0, 0, 0);
    return expiry < sixMonthsFromNow ? { passportTooSoon: true } : null;
  };
}

function futureDateValidator(): ValidatorFn {
  return (control: AbstractControl) => {
    if (!control.value) return null;
    const date = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date <= today ? { notFuture: true } : null;
  };
}

@Component({
  selector: 'app-batch-wizard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslateModule, SearchableSelectComponent],
  templateUrl: './batch-wizard.component.html',
  styleUrl: './batch-wizard.component.scss'
})
export class BatchWizardComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly batchService = inject(BatchService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly nationalityService = inject(NationalityService);
  readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('passportImageInput') private passportImageInput?: ElementRef<HTMLInputElement>;
  @ViewChild('ticketImageInput') private ticketImageInput?: ElementRef<HTMLInputElement>;

  currentStep = signal(1);
  batchId = signal<string | null>(null);
  travelers = signal<BatchTraveler[]>([]);
  submitting = signal(false);
  submitResult = signal<SubmitBatchResponse | null>(null);
  editingTravelerId = signal<string | null>(null);
  error = signal<string | null>(null);
  showTravelerForm = signal(true);
  showConfirmModal = signal(false);
  submitFailed = signal(false);
  nationalities = signal<AgencyNationality[]>([]);
  existingTravelerDocuments = signal<{
    passportImage: boolean;
    ticketImage: boolean;
  }>({
    passportImage: false,
    ticketImage: false
  });
  readonly airports = EGYPT_AIRPORTS;
  readonly countries = WORLD_COUNTRIES;
  readonly travelerDocumentAccept = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';

  batchForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    notes: [''],
    inquiryTypeId: ['SecurityClearance']
  });

  travelerForm: FormGroup = this.fb.group({
    firstNameEn: ['', [Validators.required, Validators.minLength(2)]],
    lastNameEn: ['', [Validators.required, Validators.minLength(2)]],
    firstNameAr: [''],
    lastNameAr: [''],
    nationalityCode: ['', Validators.required],
    passportNumber: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9]{5,20}$/)]],
    passportExpiry: ['', [Validators.required, minPassportExpiryValidator()]],
    dateOfBirth: ['', [Validators.required, pastDateValidator()]],
    gender: ['', Validators.required],
    travelDate: ['', [Validators.required, futureDateValidator()]],
    arrivalAirport: [''],
    transitCountries: [''],
    departureCountry: ['', Validators.required],
    purposeOfTravel: ['', Validators.required],
    flightNumber: [''],
    passportImage: [null],
    ticketImage: [null]
  });

  ngOnInit(): void {
    this.syncTravelerDocumentValidators();

    const editId = this.route.snapshot.paramMap.get('id');
    if (editId) {
      this.batchId.set(editId);
      this.loadExistingBatch(editId);
    }

    const agencyId = this.authService.getAgencyId();
    if (agencyId) {
      this.nationalityService.getAgencyNationalities(agencyId).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: (nats) => this.nationalities.set(nats),
        error: () => this.nationalities.set([])
      });
    }
  }

  ngOnDestroy(): void {
    this.submitting.set(false);
    this.showConfirmModal.set(false);
  }

  private loadExistingBatch(id: string): void {
    this.batchService.getBatch(id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (batch) => {
        this.batchForm.patchValue({
          name: batch.name,
          notes: batch.notes
        });
        this.travelers.set(batch.travelers);
        if (batch.travelers.length > 0) {
          this.currentStep.set(2);
        }
      },
      error: () => this.error.set('batch.errorLoading')
    });
  }

  nextStep(): void {
    if (this.currentStep() === 1) {
      if (this.batchForm.invalid) {
        this.batchForm.markAllAsTouched();
        return;
      }
      if (!this.batchId()) {
        this.createBatch();
      } else {
        this.currentStep.set(2);
      }
    } else if (this.currentStep() === 2) {
      if (this.travelers().length === 0) {
        this.error.set('batch.atLeastOneTraveler');
        return;
      }
      this.error.set(null);
      this.showConfirmModal.set(true);
    }
  }

  prevStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update(s => s - 1);
    }
  }

  private createBatch(): void {
    const user = this.authService.getUser();
    if (!user?.agencyId) return;

    this.submitting.set(true);
    this.batchService.createBatch({
      agencyId: user.agencyId,
      createdByUserId: user.userId,
      name: this.batchForm.value.name,
      inquiryTypeId: this.batchForm.value.inquiryTypeId,
      notes: this.batchForm.value.notes || undefined
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (result) => {
        this.batchId.set(result.id);
        this.submitting.set(false);
        this.currentStep.set(2);
      },
      error: (err) => {
        this.error.set(mapApiError(err.error?.error, 'batch.errorCreating'));
        this.submitting.set(false);
      }
    });
  }

  addTraveler(): void {
    if (this.travelerForm.invalid) {
      this.travelerForm.markAllAsTouched();
      return;
    }
    const batchId = this.batchId();
    if (!batchId) return;

    const request = this.buildTravelerRequest();

    this.submitting.set(true);
    this.error.set(null);
    const editing = this.editingTravelerId();

    if (editing) {
      this.batchService.updateTraveler(batchId, editing, request).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: () => {
          this.refreshTravelers();
          this.resetTravelerForm();
          this.submitting.set(false);
        },
        error: (err) => {
          this.error.set(mapApiError(err.error?.error, 'batch.errorSavingTraveler'));
          this.submitting.set(false);
        }
      });
    } else {
      this.batchService.addTraveler(batchId, request).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: () => {
          this.refreshTravelers();
          this.resetTravelerForm();
          this.submitting.set(false);
        },
        error: (err) => {
          this.error.set(mapApiError(err.error?.error, 'batch.errorSavingTraveler'));
          this.submitting.set(false);
        }
      });
    }
  }

  editTraveler(t: BatchTraveler): void {
    this.editingTravelerId.set(t.id);
    this.showTravelerForm.set(true);
    this.setExistingTravelerDocuments(t);
    this.travelerForm.patchValue({
      firstNameEn: t.firstNameEn,
      lastNameEn: t.lastNameEn,
      firstNameAr: t.firstNameAr,
      lastNameAr: t.lastNameAr,
      nationalityCode: t.nationalityCode,
      passportNumber: t.passportNumber,
      passportExpiry: t.passportExpiry?.split('T')[0],
      dateOfBirth: t.dateOfBirth?.split('T')[0],
      gender: this.mapTravelerGenderToFormValue(t.gender),
      travelDate: t.travelDate?.split('T')[0],
      arrivalAirport: t.arrivalAirport,
      departureCountry: t.departureCountry,
      purposeOfTravel: t.purposeOfTravel,
      flightNumber: t.flightNumber,
      passportImage: null,
      ticketImage: null,
    });
    this.clearTravelerDocumentInputs();
  }

  cancelEdit(): void {
    this.resetTravelerForm();
  }

  removeTraveler(t: BatchTraveler): void {
    const batchId = this.batchId();
    if (!batchId) return;
    this.batchService.removeTraveler(batchId, t.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => this.refreshTravelers()
    });
  }

  onTravelerDocumentSelected(event: Event, controlName: TravelerDocumentControlName): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    const control = this.travelerForm.get(controlName);

    control?.setValue(file);
    control?.markAsTouched();
    control?.updateValueAndValidity();
  }

  getTravelerDocumentErrorKey(controlName: TravelerDocumentControlName): string | null {
    const errors = this.travelerForm.get(controlName)?.errors;
    if (!errors) {
      return null;
    }

    if (errors['required']) {
      return controlName === 'passportImage'
        ? 'batch.passportImageRequired'
        : 'batch.ticketImageRequired';
    }

    if (errors['invalidFileType']) {
      return 'batch.documentInvalidType';
    }

    if (errors['maxFileSize']) {
      return 'batch.documentMaxSizeExceeded';
    }

    return null;
  }

  getSelectedTravelerDocumentName(controlName: TravelerDocumentControlName): string | null {
    const file = this.travelerForm.get(controlName)?.value;
    return file instanceof File ? file.name : null;
  }

  hasExistingTravelerDocument(controlName: TravelerDocumentControlName): boolean {
    return this.existingTravelerDocuments()[controlName];
  }

  private refreshTravelers(): void {
    const batchId = this.batchId();
    if (!batchId) return;
    this.batchService.getBatch(batchId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (batch) => this.travelers.set(batch.travelers),
      error: () => this.error.set('batch.errorLoading')
    });
  }

  submitBatch(): void {
    const batchId = this.batchId();
    if (!batchId) return;

    this.showConfirmModal.set(false);
    this.submitting.set(true);
    this.error.set(null);
    this.submitFailed.set(false);
    this.batchService.submitBatch(batchId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (result) => {
        this.submitResult.set(result);
        this.submitting.set(false);
      },
      error: (err) => {
        this.error.set(mapApiError(err.error?.error, 'batch.errorSubmitting'));
        this.submitting.set(false);
        this.submitFailed.set(true);
      }
    });
  }

  goToBatchDetail(): void {
    const batchId = this.batchId();
    if (batchId) {
      this.router.navigate(['/batches', batchId]);
    }
  }

  get genderLabel(): string {
    const v = this.travelerForm.get('gender')?.value;
    return v === '0' || v === 0 ? 'Male' : v === '1' || v === 1 ? 'Female' : '';
  }

  private buildTravelerRequest(): TravelerSaveRequest {
    const formValue = this.travelerForm.getRawValue();

    return {
      firstNameEn: formValue.firstNameEn,
      lastNameEn: formValue.lastNameEn,
      firstNameAr: formValue.firstNameAr || undefined,
      lastNameAr: formValue.lastNameAr || undefined,
      passportNumber: formValue.passportNumber,
      nationalityCode: formValue.nationalityCode,
      dateOfBirth: formValue.dateOfBirth,
      gender: Number(formValue.gender),
      travelDate: formValue.travelDate,
      arrivalAirport: formValue.arrivalAirport || undefined,
      transitCountries: formValue.transitCountries || undefined,
      passportExpiry: formValue.passportExpiry,
      departureCountry: formValue.departureCountry,
      purposeOfTravel: formValue.purposeOfTravel,
      flightNumber: formValue.flightNumber || undefined,
      passportImage: formValue.passportImage,
      ticketImage: formValue.ticketImage
    };
  }

  private resetTravelerForm(): void {
    this.editingTravelerId.set(null);
    this.existingTravelerDocuments.set({ passportImage: false, ticketImage: false });
    this.travelerForm.reset();
    this.syncTravelerDocumentValidators();
    this.clearTravelerDocumentInputs();
  }

  private setExistingTravelerDocuments(traveler: BatchTraveler): void {
    this.existingTravelerDocuments.set({
      passportImage: !!traveler.hasPassportImageDocument,
      ticketImage: !!traveler.hasTicketImageDocument
    });
    this.syncTravelerDocumentValidators();
  }

  private syncTravelerDocumentValidators(): void {
    this.setTravelerDocumentValidators('passportImage', this.hasExistingTravelerDocument('passportImage'));
    this.setTravelerDocumentValidators('ticketImage', this.hasExistingTravelerDocument('ticketImage'));
  }

  private setTravelerDocumentValidators(controlName: TravelerDocumentControlName, hasExistingDocument: boolean): void {
    const control = this.travelerForm.get(controlName);
    if (!control) {
      return;
    }

    const validators: ValidatorFn[] = [fileTypeValidator(), fileSizeValidator(MAX_TRAVELER_DOCUMENT_SIZE_BYTES)];
    if (!hasExistingDocument) {
      validators.unshift(requiredFileValidator());
    }

    control.setValidators(validators);
    control.updateValueAndValidity({ emitEvent: false });
  }

  private clearTravelerDocumentInputs(): void {
    if (this.passportImageInput?.nativeElement) {
      this.passportImageInput.nativeElement.value = '';
    }

    if (this.ticketImageInput?.nativeElement) {
      this.ticketImageInput.nativeElement.value = '';
    }
  }

  private mapTravelerGenderToFormValue(gender: string | number | null | undefined): '' | 0 | 1 {
    const normalized = String(gender ?? '').toLowerCase();

    if (normalized === '0' || normalized === 'male') {
      return 0;
    }

    if (normalized === '1' || normalized === 'female') {
      return 1;
    }

    return '';
  }
}
