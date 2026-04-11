import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, map, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';

/**
 * Unwraps the backend ApiResponse<T> envelope ({ success, data, error })
 * so services receive the `data` payload directly.
 */
export const apiResponseInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    map(event => {
      if (event instanceof HttpResponse && event.body && typeof event.body === 'object') {
        const body = event.body as Record<string, unknown>;
        if ('success' in body && 'data' in body) {
          return event.clone({ body: body['data'] });
        }
      }
      return event;
    })
  );
};

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const api = inject(ApiService);
  const router = inject(Router);

  // Send HttpOnly cookie with every request
  const cloned = req.clone({ withCredentials: true });

  return next(cloned).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/refresh') && !req.url.includes('/auth/login')) {
        return handleTokenRefresh(req, next, auth, api, router);
      }
      return throwError(() => error);
    })
  );
};

function handleTokenRefresh(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  auth: AuthService,
  api: ApiService,
  router: Router
) {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    const refreshToken = auth.getRefreshToken();
    if (!refreshToken) {
      isRefreshing = false;
      auth.logout();
      router.navigate(['/login']);
      return throwError(() => new Error('No refresh token'));
    }

    return api.post<{ token: string; refreshToken: string }>('/auth/refresh', { refreshToken }).pipe(
      switchMap(response => {
        isRefreshing = false;
        auth.setRefreshToken(response.refreshToken);
        auth.updateUserFromToken(response.token);
        refreshTokenSubject.next(response.token);
        return next(req.clone({ withCredentials: true }));
      }),
      catchError(err => {
        isRefreshing = false;
        auth.logout();
        router.navigate(['/login']);
        return throwError(() => err);
      })
    );
  }

  return refreshTokenSubject.pipe(
    filter(token => token !== null),
    take(1),
    switchMap(() => next(req.clone({ withCredentials: true })))
  );
}

function generateCorrelationId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '');
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

export const correlationIdInterceptor: HttpInterceptorFn = (req, next) => {
  const correlationId = generateCorrelationId();
  const cloned = req.clone({
    setHeaders: {
      'X-Correlation-Id': correlationId
    }
  });
  return next(cloned);
};
