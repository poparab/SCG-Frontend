import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminUserService } from '../../../core/services/admin-user.service';
import { AdminUserDetail } from '../../../core/models/admin.models';
import { mapApiError } from '../../../core/utils/error-mapper';

function passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
  const val = control.value as string;
  if (!val) return null;
  const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;
  return pattern.test(val) ? null : { passwordPattern: true };
}

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, TranslateModule],
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.scss'
})
export class UserDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly userService = inject(AdminUserService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  user = signal<AdminUserDetail | null>(null);
  loading = signal(true);
  actionLoading = signal(false);
  actionError = signal('');
  actionSuccess = signal('');
  isEditing = signal(false);

  editForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    role: ['Admin', [Validators.required]]
  });

  resetPasswordForm = this.fb.nonNullable.group({
    newPassword: ['', [Validators.required, Validators.minLength(8), passwordStrengthValidator]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: [this.passwordMatchValidator] });

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const pw = control.get('newPassword')?.value;
    const confirm = control.get('confirmPassword')?.value;
    if (pw && confirm && pw !== confirm) {
      control.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadUser(id);
  }

  loadUser(id: string): void {
    this.loading.set(true);
    this.userService.getUserById(id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        this.user.set(data);
        this.editForm.patchValue({ fullName: data.fullName, role: data.role });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/users']);
      }
    });
  }

  startEdit(): void {
    const u = this.user();
    if (u) this.editForm.patchValue({ fullName: u.fullName, role: u.role });
    this.isEditing.set(true);
    this.actionError.set('');
    this.actionSuccess.set('');
  }

  cancelEdit(): void {
    this.isEditing.set(false);
  }

  saveEdit(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const u = this.user();
    if (!u) return;
    this.actionLoading.set(true);
    this.actionError.set('');
    const { fullName, role } = this.editForm.getRawValue();

    this.userService.updateUser(u.id, { fullName, role }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.actionSuccess.set('admin.users.update_success');
        this.isEditing.set(false);
        this.loadUser(u.id);
      },
      error: (err) => {
        this.actionLoading.set(false);
        this.actionError.set(mapApiError(err?.error?.error, 'admin.errors.genericError'));
      }
    });
  }

  toggleActive(): void {
    const u = this.user();
    if (!u) return;
    this.actionLoading.set(true);
    this.actionError.set('');

    this.userService.toggleActive(u.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.actionSuccess.set('admin.users.toggle_success');
        this.loadUser(u.id);
      },
      error: (err) => {
        this.actionLoading.set(false);
        this.actionError.set(mapApiError(err?.error?.error, 'admin.errors.genericError'));
      }
    });
  }

  submitResetPassword(): void {
    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }
    const u = this.user();
    if (!u) return;
    this.actionLoading.set(true);
    this.actionError.set('');
    const { newPassword } = this.resetPasswordForm.getRawValue();

    this.userService.resetPassword(u.id, newPassword).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.actionSuccess.set('admin.users.reset_password_success');
        this.resetPasswordForm.reset();
      },
      error: (err) => {
        this.actionLoading.set(false);
        this.actionError.set(mapApiError(err?.error?.error, 'admin.errors.genericError'));
      }
    });
  }
}
