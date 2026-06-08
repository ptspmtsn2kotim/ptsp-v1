import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformServer } from '@angular/common';
import { of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { getLocalMockUsers } from './auth.service';

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  targetRole: string;
}

export interface RequestItem {
  id: number;
  studentId: number;
  studentName: string;
  serviceId: string;
  serviceName: string;
  data: Record<string, unknown>;
  status: string;
  currentTier: string;
  createdAt: string;
  history: { action: string, by: string, role: string, date: string, reason?: string }[];
}

export interface UserItem {
  id: number;
  username: string;
  role: string;
  name: string;
  email?: string;
  nis?: string;
  kelas?: string;
}

export const DEFAULT_SERVICES: ServiceItem[] = [
  { id: 'surat-keterangan', name: 'Permohonan Pembuatan Surat Keterangan', description: 'Pengajuan pembuatan surat keterangan aktif, berkelakuan baik, atau jenis lainnya.', icon: 'description', targetRole: 'Staff Tata Usaha' },
  { id: 'legalisir', name: 'Legalisir Raport', description: 'Pengajuan legalisir raport atau ijazah.', icon: 'verified', targetRole: 'Staff Tata Usaha' },
  { id: 'laporan-kerusakan', name: 'Laporan Fasilitas Rusak', description: 'Laporan meja rusak, fasilitas kelas, dll.', icon: 'build', targetRole: 'Waka Sarpras' },
  { id: 'peminjaman-barang', name: 'Peminjaman Barang', description: 'Peminjaman inventaris madrasah.', icon: 'inventory_2', targetRole: 'Waka Sarpras' },
  { id: 'permohonan-mou', name: 'Permohonan Kerjasama (MoU)', description: 'Pengajuan kerjasama dengan pihak luar.', icon: 'handshake', targetRole: 'Waka Humas' },
  { id: 'kunjungan', name: 'Permohonan Kunjungan', description: 'Permohonan kunjungan ke Madrasah.', icon: 'tour', targetRole: 'Waka Humas' },
  { id: 'izin-kbm', name: 'Izin Tidak Masuk KBM', description: 'Permohonan tidak masuk Kegiatan Belajar Mengajar.', icon: 'event_busy', targetRole: 'Waka Kurikulum' },
  { id: 'guru-absen', name: 'Laporan Guru Tidak Masuk', description: 'Laporan guru tidak masuk kelas pada jam mengajar.', icon: 'person_off', targetRole: 'Waka Kurikulum' },
  { id: 'aduan-bolos', name: 'Aduan Siswa Bolos', description: 'Laporan siswa bolos di jam sekolah.', icon: 'directions_run', targetRole: 'Waka Kesiswaan' },
  { id: 'aduan-kenakalan', name: 'Aduan Kenakalan Siswa', description: 'Laporan kenakalan siswa/i.', icon: 'warning', targetRole: 'Waka Kesiswaan' },
];

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  private getBaseUrl() {
    if (isPlatformServer(this.platformId)) {
      const port = typeof process !== 'undefined' && process.env['PORT'] ? process.env['PORT'] : 3000;
      return `http://127.0.0.1:${port}`;
    }
    return '';
  }

  getServices() {
    return this.http.get<ServiceItem[]>(`${this.getBaseUrl()}/api/services?t=${new Date().getTime()}`).pipe(
      catchError(() => {
        console.warn('Backend server is unreachable. Gracefully falling back to default services.');
        return of(DEFAULT_SERVICES);
      })
    );
  }

  getRequests() {
    return this.http.get<RequestItem[]>(`${this.getBaseUrl()}/api/requests?t=${new Date().getTime()}`).pipe(
      tap(data => {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('local_requests', JSON.stringify(data));
        }
      }),
      catchError(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
          const localData = localStorage.getItem('local_requests');
          if (localData) {
            return of(JSON.parse(localData) as RequestItem[]);
          }
        }
        return of([]);
      })
    );
  }

  createRequest(data: Record<string, unknown>) {
    return this.http.post<RequestItem>(`${this.getBaseUrl()}/api/requests`, data).pipe(
      catchError((err) => {
        if (typeof window !== 'undefined' && window.localStorage) {
          const localData = localStorage.getItem('local_requests');
          const list = localData ? (JSON.parse(localData) as RequestItem[]) : [];
          const newId = list.length > 0 ? Math.max(...list.map(r => r.id)) + 1 : 1;
          const serviceId = data['serviceId'] as string;
          const sItem = DEFAULT_SERVICES.find(s => s.id === serviceId);
          
          const newRequest: RequestItem = {
            id: newId,
            studentId: 1,
            studentName: data['studentName'] as string || 'Budi Santoso',
            serviceId: serviceId,
            serviceName: sItem?.name || 'Layanan Baru',
            data: data['data'] as Record<string, unknown> || {},
            status: 'Menunggu Verifikasi',
            currentTier: 'Staff Tata Usaha',
            createdAt: new Date().toISOString(),
            history: [{
              action: 'Pengajuan Baru',
              by: data['studentName'] as string || 'Budi Santoso',
              role: 'Siswa',
              date: new Date().toISOString()
            }]
          };
          list.unshift(newRequest);
          localStorage.setItem('local_requests', JSON.stringify(list));
          return of(newRequest);
        }
        throw err;
      })
    );
  }

  submitPublicRequest(serviceId: string, data: Record<string, unknown>) {
    return this.http.post<RequestItem>(`${this.getBaseUrl()}/api/public/requests`, { serviceId, data }).pipe(
      catchError((err) => {
        if (typeof window !== 'undefined' && window.localStorage) {
          const localData = localStorage.getItem('local_requests');
          const list = localData ? (JSON.parse(localData) as RequestItem[]) : [];
          const newId = list.length > 0 ? Math.max(...list.map(r => r.id)) + 1 : 1;
          
          const sName = DEFAULT_SERVICES.find(s => s.id === serviceId)?.name || 'Layanan';

          const newRequest: RequestItem = {
            id: newId,
            studentId: 99,
            studentName: data['nama'] as string || data['studentName'] as string || 'Masyarakat Umum',
            serviceId: serviceId,
            serviceName: sName,
            data: data,
            status: 'Menunggu Verifikasi',
            currentTier: 'Staff Tata Usaha', // starts at Tata Usaha
            createdAt: new Date().toISOString(),
            history: [{
              action: 'Pengajuan Baru',
              by: data['nama'] as string || data['studentName'] as string || 'Masyarakat Umum',
              role: 'Masyarakat',
              date: new Date().toISOString()
            }]
          };
          list.unshift(newRequest);
          localStorage.setItem('local_requests', JSON.stringify(list));
          return of(newRequest);
        }
        throw err;
      })
    );
  }

  verifyRequest(id: number, action: 'approve' | 'reject', reason?: string) {
    return this.http.post<RequestItem>(`${this.getBaseUrl()}/api/requests/${id}/verify`, { action, reason }).pipe(
      catchError((err) => {
        if (typeof window !== 'undefined' && window.localStorage) {
          const localData = localStorage.getItem('local_requests');
          if (localData) {
            const list = JSON.parse(localData) as RequestItem[];
            const reqIndex = list.findIndex(r => r.id === id);
            if (reqIndex !== -1) {
              const req = list[reqIndex];
              const isApprove = action === 'approve';
              let nextTier = req.currentTier;
              let nextStatus = req.status;

              if (isApprove) {
                if (req.currentTier === 'Staff Tata Usaha') {
                  const sItem = DEFAULT_SERVICES.find(s => s.id === req.serviceId);
                  nextTier = sItem?.targetRole || 'Staff Tata Usaha';
                  if (nextTier === 'Staff Tata Usaha') {
                    nextStatus = 'Selesai';
                  } else {
                    nextStatus = 'Proses Verifikasi Satker';
                  }
                } else {
                  nextStatus = 'Selesai';
                }
              } else {
                nextStatus = 'Ditolak';
              }

              req.status = nextStatus;
              req.currentTier = nextTier;
              req.history.push({
                action: isApprove ? 'Disetujui' : 'Ditolak',
                by: 'Verifikator',
                role: req.currentTier,
                date: new Date().toISOString(),
                reason: reason
              });

              list[reqIndex] = req;
              localStorage.setItem('local_requests', JSON.stringify(list));
              return of(req);
            }
          }
        }
        throw err;
      })
    );
  }

  deleteRequest(id: number) {
    return this.http.delete(`${this.getBaseUrl()}/api/requests/${id}`).pipe(
      catchError((err) => {
        if (typeof window !== 'undefined' && window.localStorage) {
          const localData = localStorage.getItem('local_requests');
          if (localData) {
            const list = JSON.parse(localData) as RequestItem[];
            const filtered = list.filter(r => r.id !== id);
            localStorage.setItem('local_requests', JSON.stringify(filtered));
            return of({ success: true } as unknown);
          }
        }
        throw err;
      })
    );
  }

  getUsers() {
    return this.http.get<UserItem[]>(`${this.getBaseUrl()}/api/users?t=${new Date().getTime()}`).pipe(
      tap(data => {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('local_users', JSON.stringify(data));
        }
      }),
      catchError(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
          const localData = localStorage.getItem('local_users');
          if (localData) {
            return of(JSON.parse(localData) as UserItem[]);
          }
          const initialUsers = getLocalMockUsers().map(u => ({
            id: u.id,
            username: u.username,
            role: u.role,
            name: u.name,
            nis: u.nis,
            kelas: u.kelas
          }));
          localStorage.setItem('local_users', JSON.stringify(initialUsers));
          return of(initialUsers);
        }
        return of([]);
      })
    );
  }

  createUser(data: Record<string, unknown>) {
    return this.http.post<UserItem>(`${this.getBaseUrl()}/api/users`, data).pipe(
      catchError((err) => {
        if (typeof window !== 'undefined' && window.localStorage) {
          const localData = localStorage.getItem('local_users');
          const list = localData ? (JSON.parse(localData) as UserItem[]) : [];
          const newId = list.length > 0 ? Math.max(...list.map(u => u.id)) + 1 : 11;
          const newUser: UserItem = {
            id: newId,
            username: data['username'] as string,
            role: data['role'] as string,
            name: data['name'] as string,
            email: data['email'] as string,
            nis: data['nis'] as string,
            kelas: data['kelas'] as string
          };
          list.push(newUser);
          localStorage.setItem('local_users', JSON.stringify(list));
          
          const authUsers = getLocalMockUsers();
          authUsers.push({
            id: newId,
            username: newUser.username,
            password: (data['password'] as string) || 'password',
            role: newUser.role,
            name: newUser.name,
            nis: newUser.nis,
            kelas: newUser.kelas
          });
          localStorage.setItem('local_mock_auth_users', JSON.stringify(authUsers));
          
          return of(newUser);
        }
        throw err;
      })
    );
  }

  updateUser(id: number, data: Record<string, unknown>) {
    return this.http.put<UserItem>(`${this.getBaseUrl()}/api/users/${id}`, data).pipe(
      catchError((err) => {
        if (typeof window !== 'undefined' && window.localStorage) {
          const localData = localStorage.getItem('local_users');
          if (localData) {
            const list = JSON.parse(localData) as UserItem[];
            const idx = list.findIndex(u => u.id === id);
            if (idx !== -1) {
              list[idx] = {
                ...list[idx],
                username: data['username'] as string || list[idx].username,
                role: data['role'] as string || list[idx].role,
                name: data['name'] as string || list[idx].name,
                email: data['email'] as string || list[idx].email,
                nis: data['nis'] as string || list[idx].nis,
                kelas: data['kelas'] as string || list[idx].kelas
              };
              localStorage.setItem('local_users', JSON.stringify(list));
              
              const authUsers = getLocalMockUsers();
              const authIdx = authUsers.findIndex((u: { id: number }) => u.id === id);
              if (authIdx !== -1) {
                authUsers[authIdx] = {
                  ...authUsers[authIdx],
                  username: list[idx].username,
                  role: list[idx].role,
                  name: list[idx].name,
                  nis: list[idx].nis,
                  kelas: list[idx].kelas,
                  password: (data['password'] as string) || authUsers[authIdx].password
                };
                localStorage.setItem('local_mock_auth_users', JSON.stringify(authUsers));
              }
              
              return of(list[idx]);
            }
          }
        }
        throw err;
      })
    );
  }

  deleteUser(id: number) {
    return this.http.delete(`${this.getBaseUrl()}/api/users/${id}`).pipe(
      catchError((err) => {
        if (typeof window !== 'undefined' && window.localStorage) {
          const localData = localStorage.getItem('local_users');
          if (localData) {
            const list = JSON.parse(localData) as UserItem[];
            const filtered = list.filter(u => u.id !== id);
            localStorage.setItem('local_users', JSON.stringify(filtered));
            
            const authUsers = getLocalMockUsers();
            const filteredAuth = authUsers.filter((u: { id: number }) => u.id !== id);
            localStorage.setItem('local_mock_auth_users', JSON.stringify(filteredAuth));
            
            return of({ success: true } as unknown);
          }
        }
        throw err;
      })
    );
  }
}
