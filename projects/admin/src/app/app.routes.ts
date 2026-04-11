import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    loadComponent: () => import('./layout/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    canActivate: [authGuard, roleGuard(['Admin', 'SuperAdmin'])],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
      {
        path: 'inquiries',
        children: [
          { path: '', loadComponent: () => import('./features/inquiries/admin-inquiries.component').then(m => m.AdminInquiriesComponent) },
          { path: ':id', loadComponent: () => import('./features/inquiries/inquiry-detail/inquiry-detail.component').then(m => m.InquiryDetailComponent) }
        ]
      },
      {
        path: 'agencies',
        children: [
          { path: '', loadComponent: () => import('./features/agencies/admin-agencies.component').then(m => m.AdminAgenciesComponent) },
          { path: ':id', loadComponent: () => import('./features/agencies/agency-detail/agency-detail.component').then(m => m.AgencyDetailComponent) }
        ]
      },
      {
        path: 'nationalities',
        children: [
          { path: '', loadComponent: () => import('./features/nationalities/admin-nationalities.component').then(m => m.AdminNationalitiesComponent) },
          { path: ':id', loadComponent: () => import('./features/nationalities/nationality-detail/nationality-detail.component').then(m => m.NationalityDetailComponent) }
        ]
      },
      { path: 'announcements', loadComponent: () => import('./features/announcements/admin-announcements.component').then(m => m.AdminAnnouncementsComponent) },
      { path: 'submission-windows', loadComponent: () => import('./features/submission-windows/admin-submission-windows.component').then(m => m.AdminSubmissionWindowsComponent) },
    ]
  },
  { path: '**', redirectTo: '' }
];
