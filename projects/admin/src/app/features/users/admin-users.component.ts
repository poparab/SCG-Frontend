import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, FormGroup, FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { AdminUserService } from '../../core/services/admin-user.service';
import { AdminUserListItem } from '../../core/models/admin.models';
import { mapApiError } from '../../core/utils/error-mapper';

function passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
  const val = control.value as string;
  if (!val) return null;
  const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;
  return pattern.test(val) ? null : { passwordPattern: true };
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, TranslateModule],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss'
})
export class AdminUsersComponent implements OnInit {
  private readonly userService = inject(AdminUserService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly users = signal<AdminUserListItem[]>([]);
  readonly loading = signal(true);
  readonly totalCount = signal(0);
  readonly currentPage = signal(1);
  readonly pageSize = 20;

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly roleFilter = signal('');
  readonly activeFilter = signal('');

  showCreateModal = signal(false);
  createLoading = signal(false);
  createError = signal('');
  createSuccess = signal('');

  createForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), passwordStrengthValidator]],
    role: ['Admin', [Validators.required]]
  });

  ngOnInit(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.currentPage.set(1);
      this.loadUsers();
    });

    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    const params: Record<string, string | number | boolean> = {
      page: this.currentPage(),
      pageSize: this.pageSize
    };
    const s = this.searchControl.value.trim();
    if (s) params['searchTerm'] = s;
    if (this.roleFilter()) params['role'] = this.roleFilter();
    if (this.activeFilter() !== '') params['isActive'] = this.activeFilter();

    this.userService.getUsers(params).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (result) => {
        this.users.set(result.items);
        this.totalCount.set(result.totalCount);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onRoleFilterChange(value: string): void {
    this.roleFilter.set(value);
    this.currentPage.set(1);
    this.loadUsers();
  }

  onActiveFilterChange(value: string): void {
    this.activeFilter.set(value);
    this.currentPage.set(1);
    this.loadUsers();
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadUsers();
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount() / this.pageSize);
  }

  openCreateModal(): void {
    this.createForm.reset({ role: 'Admin' });
    this.createError.set('');
    this.createSuccess.set('');
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  submitCreate(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }
    this.createLoading.set(true);
    this.createError.set('');
    const { fullName, email, password, role } = this.createForm.getRawValue();

    this.userService.createUser({ fullName, email, password, role }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.createLoading.set(false);
        this.createSuccess.set('admin.users.create_success');
        this.showCreateModal.set(false);
        this.loadUsers();
      },
      error: (err) => {
        this.createLoading.set(false);
        this.createError.set(mapApiError(err?.error?.error, 'admin.errors.genericError'));
      }
    });
  }

  toggleActive(user: AdminUserListItem): void {
    this.userService.toggleActive(user.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => this.loadUsers(),
      error: () => {}
    });
  }
}
