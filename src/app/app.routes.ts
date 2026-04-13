import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  // Auth routes
  {
    path: '',
    loadComponent: () => import('./layout/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'login' },
      { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
      { path: 'register', loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) },
    ]
  },
  // Portal routes (header + footer layout)
  {
    path: '',
    loadComponent: () => import('./layout/portal-layout/portal-layout.component').then(m => m.PortalLayoutComponent),
    canActivate: [authGuard, roleGuard(['Agency', 'AgencyRepresentative'])],
    children: [
      { path: 'dashboard', loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES) },
      { path: 'batches', loadChildren: () => import('./features/batch/batch.routes').then(m => m.BATCH_ROUTES) },
      { path: 'inquiries', loadChildren: () => import('./features/inquiry/inquiry.routes').then(m => m.INQUIRY_ROUTES) },
      { path: 'wallet', loadChildren: () => import('./features/wallet/wallet.routes').then(m => m.WALLET_ROUTES) },
      { path: 'profile', loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent) },
    ]
  },
  // Fallback
  { path: '**', redirectTo: 'login' }
];
