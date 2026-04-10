import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { AdminUserInfo, LoginRequest, LoginResponse } from '../models/admin.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'scg_admin_token';
  private readonly USER_KEY = 'scg_admin_user';

  readonly isAuthenticated = signal(this.hasToken());

  constructor(private api: ApiService) {}

  login(email: string, password: string): Observable<LoginResponse> {
    const body: LoginRequest = { email, password, loginType: 'admin' };
    return this.api.post<LoginResponse>('/auth/login', body).pipe(
      tap(response => {
        localStorage.setItem(this.TOKEN_KEY, response.token);
        const user = this.decodeToken(response.token);
        if (user) {
          localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        }
        this.isAuthenticated.set(true);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.isAuthenticated.set(false);
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
    return !!localStorage.getItem(this.TOKEN_KEY);
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
