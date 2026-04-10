import { Routes } from '@angular/router';

export const BATCH_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./batch-list.component').then(m => m.BatchListComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./batch-wizard/batch-wizard.component').then(m => m.BatchWizardComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./batch-detail/batch-detail.component').then(m => m.BatchDetailComponent)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./batch-wizard/batch-wizard.component').then(m => m.BatchWizardComponent)
  }
];
