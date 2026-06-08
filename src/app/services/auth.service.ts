import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, of } from 'rxjs';
import { isPlatformServer } from '@angular/common';

export interface User {
  id: number;
  username: string;
  role: string;
  name: string;
  nis?: string;
  kelas?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  currentUser = signal<User | null>(null);
  token = signal<string | null>(typeof window !== 'undefined' && window.localStorage ? localStorage.getItem('token') : null);

  constructor() {
    if (this.token()) {
      this.fetchMe().subscribe();
    }
  }

  private getBaseUrl() {
    if (isPlatformServer(this.platformId)) {
      const port = typeof process !== 'undefined' && process.env['PORT'] ? process.env['PORT'] : 3000;
      return `http://127.0.0.1:${port}`;
    }
    return '';
  }

  login(credentials: Record<string, unknown>) {
    return this.http.post<{ token: string, user: User }>(`${this.getBaseUrl()}/api/auth/login`, credentials).pipe(
      tap(res => {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('token', res.token);
        }
        this.token.set(res.token);
        this.currentUser.set(res.user);
        this.redirectBasedOnRole(res.user.role);
      })
    );
  }

  logout() {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('token');
    }
    this.token.set(null);
    this.currentUser.set(null);
    this.router.navigate(['/']);
  }

  fetchMe() {
    return this.http.get<{ user: User }>(`${this.getBaseUrl()}/api/auth/me`, {
      headers: { Authorization: `Bearer ${this.token()}` }
    }).pipe(
      tap(res => this.currentUser.set(res.user)),
      catchError(() => {
        this.logout();
        return of(null);
      })
    );
  }

  redirectBasedOnRole(role: string) {
    if (role === 'Siswa') {
      this.router.navigate(['/dashboard/siswa']);
    } else if (role === 'Admin') {
      this.router.navigate(['/dashboard/admin']);
    } else {
      this.router.navigate(['/dashboard/verifikator']);
    }
  }
}
