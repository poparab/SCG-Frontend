import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, UserInfo } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'scg_token';
  private readonly USER_KEY = 'scg_user';
  private readonly REFRESH_TOKEN_KEY = 'scg_refresh_token';

  readonly isAuthenticated = signal(this.hasToken());

  constructor(private api: ApiService) {}

  login(email: string, password: string, loginType: string = 'agency'): Observable<LoginResponse> {
    const body: LoginRequest = { email, password, loginType };
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

  register(request: RegisterRequest): Observable<RegisterResponse> {
    return this.api.post<RegisterResponse>('/auth/register', request);
  }

  logout(): void {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      this.api.post('/auth/revoke', { refreshToken }).subscribe();
    }
    this.api.post('/auth/logout', {}).subscribe();
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

  getUser(): UserInfo | null {
    const stored = localStorage.getItem(this.USER_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as UserInfo;
      } catch {
        return null;
      }
    }
    return this.decodeToken(this.getToken());
  }

  getAgencyId(): string | null {
    return this.getUser()?.agencyId ?? null;
  }

  getUserRole(): string | null {
    return this.getUser()?.role ?? null;
  }

  private hasToken(): boolean {
    return !!localStorage.getItem(this.USER_KEY) || !!localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  private decodeToken(token: string | null): UserInfo | null {
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1]));
      return {
        userId: payload['sub'] ?? payload['nameid'] ?? '',
        email: payload['email'] ?? '',
        role: payload['role'] ?? '',
        agencyId: payload['agencyId'] ?? undefined,
        agencyName: payload['agencyName'] ?? undefined
      };
    } catch {
      return null;
    }
  }
}
