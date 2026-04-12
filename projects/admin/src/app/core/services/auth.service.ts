import { Injectable, signal } from '@angular/core';
import { Observable, catchError, concat, finalize, ignoreElements, of, tap } from 'rxjs';
import { ApiService } from './api.service';
import { AdminUserInfo, LoginRequest, LoginResponse } from '../models/admin.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'scg_admin_token';
  private readonly USER_KEY = 'scg_admin_user';
  private readonly REFRESH_TOKEN_KEY = 'scg_admin_refresh_token';

  readonly isAuthenticated = signal(this.hasToken());

  constructor(private api: ApiService) {}

  login(email: string, password: string): Observable<LoginResponse> {
    const body: LoginRequest = { email, password, loginType: 'admin' };
    return this.api.post<LoginResponse>('/auth/login', body).pipe(
      tap(response => {
        // JWT is now stored in HttpOnly cookie by the server.
        // Decode the token from the response body only for user info.
        const user = this.decodeToken(response.token);
        if (user) {
          localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        }
        if (response.refreshToken) {
          localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
        }
        this.isAuthenticated.set(true);
      })
    );
  }

  logout(): Observable<void> {
    const refreshToken = this.getRefreshToken();
    const requests = [];

    if (refreshToken) {
      requests.push(this.api.post('/auth/revoke', { refreshToken }).pipe(
        catchError(() => of(null))
      ));
    }

    requests.push(this.api.post('/auth/logout', {}).pipe(
      catchError(() => of(null))
    ));

    return concat(...requests).pipe(
      ignoreElements(),
      finalize(() => this.clearSession())
    );
  }

  clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    this.isAuthenticated.set(false);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  updateUserFromToken(token: string): void {
    const user = this.decodeToken(token);
    if (user) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUser(): AdminUserInfo | null {
    const stored = localStorage.getItem(this.USER_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as AdminUserInfo;
      } catch {
        return null;
      }
    }
    return this.decodeToken(this.getToken());
  }

  private hasToken(): boolean {
    return !!localStorage.getItem(this.USER_KEY) || !!localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  private decodeToken(token: string | null): AdminUserInfo | null {
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1]));
      return {
        userId: payload['sub'] ?? payload['nameid'] ?? '',
        email: payload['email'] ?? '',
        role: payload['role'] ?? ''
      };
    } catch {
      return null;
    }
  }
}
