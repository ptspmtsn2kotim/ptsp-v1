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

export interface MockAuthUser {
  id: number;
  username: string;
  password: string;
  role: string;
  name: string;
  nis?: string;
  kelas?: string;
}

export const INITIAL_MOCK_USERS: MockAuthUser[] = [
  { id: 1, username: 'siswa1', password: 'password', role: 'Siswa', name: 'Budi Santoso', nis: '12345', kelas: 'X-A' },
  { id: 2, username: 'wali1', password: 'password', role: 'Wali Kelas', name: 'Pak Guru Andi' },
  { id: 3, username: 'tu1', password: 'password', role: 'Staff Tata Usaha', name: 'Bu TU Rini' },
  { id: 4, username: 'kepsek1', password: 'password', role: 'Kepala Madrasah', name: 'Pak Kepsek Budi' },
  { id: 5, username: 'wakahumas1', password: 'password', role: 'Waka Humas', name: 'Pak Waka Humas' },
  { id: 6, username: 'wakakurikulum1', password: 'password', role: 'Waka Kurikulum', name: 'Bu Waka Kurikulum' },
  { id: 7, username: 'wakakesiswaan1', password: 'password', role: 'Waka Kesiswaan', name: 'Pak Waka Kesiswaan' },
  { id: 8, username: 'wakasarpras1', password: 'password', role: 'Waka Sarpras', name: 'Bu Waka Sarpras' },
  { id: 9, username: 'gurupiket1', password: 'password', role: 'Guru Piket', name: 'Pak Guru Piket' },
  { id: 10, username: 'MTsN2Kotim', password: 'MTsN2KotimBerJaya', role: 'Admin', name: 'Super Admin' },
];

export function getLocalMockUsers(): MockAuthUser[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    const local = localStorage.getItem('local_mock_auth_users');
    if (local) {
      try {
        const parsed = JSON.parse(local) as MockAuthUser[];
        const adminIndex = parsed.findIndex(u => u.username === 'MTsN2Kotim');
        if (adminIndex !== -1 && parsed[adminIndex].password !== 'MTsN2KotimBerJaya') {
          parsed[adminIndex].password = 'MTsN2KotimBerJaya';
          localStorage.setItem('local_mock_auth_users', JSON.stringify(parsed));
        }
        return parsed;
      } catch {
        return INITIAL_MOCK_USERS;
      }
    }
  }
  return INITIAL_MOCK_USERS;
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
      }),
      catchError((err) => {
        // Fallback to client-side auth of Mock Users list if backend is unreachable (e.g. Vercel deployment)
        const typedUsername = credentials['username'] as string;
        const typedPassword = credentials['password'] as string;
        const authList = getLocalMockUsers();
        const findUser = authList.find(
          u => u.username === typedUsername && u.password === typedPassword
        );
        if (findUser) {
          const mockToken = `mock-token-${findUser.id}`;
          const userRes: User = {
            id: findUser.id,
            username: findUser.username,
            role: findUser.role,
            name: findUser.name,
            nis: findUser.nis,
            kelas: findUser.kelas
          };
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('token', mockToken);
          }
          this.token.set(mockToken);
          this.currentUser.set(userRes);
          this.redirectBasedOnRole(userRes.role);
          return of({ token: mockToken, user: userRes });
        }
        throw err;
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
    const currentToken = this.token();
    return this.http.get<{ user: User }>(`${this.getBaseUrl()}/api/auth/me`, {
      headers: { Authorization: `Bearer ${currentToken}` }
    }).pipe(
      tap(res => this.currentUser.set(res.user)),
      catchError(() => {
        if (currentToken && currentToken.startsWith('mock-token-')) {
          const userId = parseInt(currentToken.replace('mock-token-', ''), 10);
          const authList = getLocalMockUsers();
          const findUser = authList.find(u => u.id === userId);
          if (findUser) {
            const userRes: User = {
              id: findUser.id,
              username: findUser.username,
              role: findUser.role,
              name: findUser.name,
              nis: findUser.nis,
              kelas: findUser.kelas
            };
            this.currentUser.set(userRes);
            return of({ user: userRes });
          }
        }
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
