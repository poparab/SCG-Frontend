import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest } from '../../../core/models/auth.models';
import { mapApiError } from '../../../core/utils/error-mapper';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslateModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  readonly countryCodes = [
    { code: '+20', label: 'auth.register.countries.egypt' },
    { code: '+966', label: 'auth.register.countries.saudiArabia' },
    { code: '+971', label: 'auth.register.countries.uae' },
    { code: '+1', label: 'auth.register.countries.usa' },
    { code: '+44', label: 'auth.register.countries.uk' }
  ];

  form = this.fb.nonNullable.group({
    agencyName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    commercialRegNumber: ['', [Validators.pattern(/^[a-zA-Z0-9]{6,20}$/)]],
    contactPersonName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/)
    ]],
    confirmPassword: ['', [Validators.required]],
    countryCode: ['+20', [Validators.required]],
    mobileNumber: ['', [Validators.required, Validators.pattern(/^\d{7,15}$/)]]
  }, {
    validators: [this.passwordMatchValidator]
  });

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirm = control.get('confirmPassword')?.value;
    if (password && confirm && password !== confirm) {
      control.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update(v => !v);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const v = this.form.getRawValue();
    const request: RegisterRequest = {
      agencyName: v.agencyName,
      commercialRegNumber: v.commercialRegNumber,
      contactPersonName: v.contactPersonName,
      email: v.email,
      password: v.password,
      countryCode: v.countryCode,
      mobileNumber: v.mobileNumber
    };

    this.auth.register(request).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMessage.set('auth.register.success');
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(
          mapApiError(err.error?.error, 'auth.register.errorGeneric')
        );
      }
    });
  }
}
