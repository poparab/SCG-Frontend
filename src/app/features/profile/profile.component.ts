import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AgencyService, AgencyProfileData } from '../../core/services/agency.service';
import { AuthService } from '../../core/services/auth.service';
import { mapApiError } from '../../core/utils/error-mapper';

function passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
  const val = control.value as string;
  if (!val) return null;
  const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;
  return pattern.test(val) ? null : { passwordPattern: true };
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  private readonly agencyService = inject(AgencyService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  agency = signal<AgencyProfileData | null>(null);
  loading = signal(true);
  loadError = signal('');

  pwLoading = signal(false);
  pwError = signal('');
  pwSuccess = signal('');

  changePasswordForm = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8), passwordStrengthValidator]],
    confirmNewPassword: ['', [Validators.required]]
  }, { validators: [this.passwordMatchValidator] });

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const pw = control.get('newPassword')?.value;
    const confirm = control.get('confirmNewPassword')?.value;
    if (pw && confirm && pw !== confirm) {
      control.get('confirmNewPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  ngOnInit(): void {
    const agencyId = this.authService.getAgencyId();
    if (!agencyId) {
      this.loadError.set('dashboard.noAgency');
      this.loading.set(false);
      return;
    }
    this.agencyService.getAgency(agencyId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        this.agency.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('portal.profile.load_error');
        this.loading.set(false);
      }
    });
  }

  submitChangePassword(): void {
    if (this.changePasswordForm.invalid) {
      this.changePasswordForm.markAllAsTouched();
      return;
    }
    this.pwLoading.set(true);
    this.pwError.set('');
    this.pwSuccess.set('');
    const { currentPassword, newPassword } = this.changePasswordForm.getRawValue();

    this.authService.changePassword(currentPassword, newPassword).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.pwLoading.set(false);
        this.pwSuccess.set('portal.profile.changePasswordSuccess');
        this.changePasswordForm.reset();
      },
      error: (err) => {
        this.pwLoading.set(false);
        const apiMsg = err?.error?.error as string | undefined;
        if (apiMsg?.toLowerCase().includes('current password') || apiMsg?.toLowerCase().includes('incorrect')) {
          this.pwError.set('portal.profile.currentPasswordWrong');
        } else {
          this.pwError.set(mapApiError(apiMsg, 'errors.api.genericError'));
        }
      }
    });
  }
}
