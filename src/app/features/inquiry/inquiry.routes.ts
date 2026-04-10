import { Routes } from '@angular/router';

export const INQUIRY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./inquiry-list.component').then(m => m.InquiryListComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./inquiry-detail/inquiry-detail.component').then(m => m.InquiryDetailComponent)
  }
];
