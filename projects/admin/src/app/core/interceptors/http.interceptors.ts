import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.getToken();

  const cloned = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(cloned).pipe(
    tap({
      error: (err) => {
        if (err.status === 401) {
          auth.logout();
          router.navigate(['/auth/login']);
        }
      }
    })
  );
};

export const correlationIdInterceptor: HttpInterceptorFn = (req, next) => {
  const correlationId = crypto.randomUUID().replace(/-/g, '');
  const cloned = req.clone({
    setHeaders: { 'X-Correlation-Id': correlationId }
  });
  return next(cloned);
};
