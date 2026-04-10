import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, UserInfo } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'scg_token';
  private readonly USER_KEY = 'scg_user';

  readonly isAuthenticated = signal(this.hasToken());

  constructor(private api: ApiService) {}

  login(email: string, password: string, loginType: string = 'agency'): Observable<LoginResponse> {
    const body: LoginRequest = { email, password, loginType };
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

  register(request: RegisterRequest): Observable<RegisterResponse> {
    return this.api.post<RegisterResponse>('/auth/register', request);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.isAuthenticated.set(false);
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
    return !!localStorage.getItem(this.TOKEN_KEY);
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
