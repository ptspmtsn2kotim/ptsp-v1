import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformServer } from '@angular/common';
import { of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { getLocalMockUsers, AuthService } from './auth.service';

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
  private authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);

  private getBaseUrl() {
    if (isPlatformServer(this.platformId)) {
      const port = typeof process !== 'undefined' && process.env['PORT'] ? process.env['PORT'] : 3000;
      return `http://127.0.0.1:${port}`;
    }
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      if (!host.includes('run.app') && host !== 'localhost' && host !== '127.0.0.1') {
        return 'https://ais-pre-44slwifkesu35agrppcxak-151267158565.asia-east1.run.app';
      }
    }
    return '';
  }

  private sendToGoogleSheetsBackground(serviceId: string, data: Record<string, unknown>) {
    if (typeof window !== 'undefined') {
       const sName = DEFAULT_SERVICES.find(s => s.id === serviceId)?.name || 'Layanan';
       const sheetData = {
          sheetName: sName,
          status: 'Menunggu Verifikasi',
          keterangan: 'Menunggu Verifikasi',
          tanggalPengajuan: new Date().toISOString(),
          namaSiswa: data['nama'] || data['namaPemohon'] || data['studentName'] || 'Masyarakat Umum',
          ...data
       };
       try {
         fetch('https://script.google.com/macros/s/AKfycbyBe9CTI20JrcGQxkaf5RPy0vV6wCze9IHpS84pKv32wSM7k2YzRZA1eEIKk_Y912eg/exec', {
           method: 'POST',
           mode: 'no-cors',
           headers: { 'Content-Type': 'text/plain;charset=utf-8' },
           body: JSON.stringify(sheetData)
         }).catch(err => console.error('Background GS sync failed', err));
       } catch(err) {
         console.error('Error in sendToGoogleSheetsBackground', err);
       }
    }
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
        // Fallback to Google Sheets natively ONLY if backend unreachable
        const gsUrl = 'https://script.google.com/macros/s/AKfycbyBe9CTI20JrcGQxkaf5RPy0vV6wCze9IHpS84pKv32wSM7k2YzRZA1eEIKk_Y912eg/exec?action=get_all';
        return this.http.get<{status: string, data: Record<string, unknown>[]}>(gsUrl).pipe(
          map(gsData => {
            if (gsData && gsData.status === 'success' && Array.isArray(gsData.data)) {
              let mappedRequests: RequestItem[] = gsData.data.map((row) => {
                 const reqObj: RequestItem = {
                    id: Number(row['ID Pengajuan'] || row['id']) || Math.floor(Math.random() * 1000000),
                    studentName: String(row['Nama Pengaju/Siswa'] || row['Nama Pemohon'] || row['Nama Pelapor'] || row['namaSiswa'] || 'Anonim'),
                    serviceName: String(row['serviceName'] || ''),
                    serviceId: DEFAULT_SERVICES.find(s => s.name === row['serviceName'])?.id || '',
                    status: String(row['Status'] || row['status'] || 'Menunggu Verifikasi'),
                    createdAt: String(row['Tanggal Pengajuan'] || row['tanggalPengajuan'] || new Date().toISOString()),
                    studentId: 0,
                    currentTier: 'Staff Admin',
                    data: {} as Record<string, unknown>,
                    history: []
                 };
                 Object.keys(row).forEach(key => {
                   if (!['serviceName', 'ID Pengajuan', 'id', 'Status', 'status', 'Tanggal Pengajuan', 'tanggalPengajuan', 'Nama Pengaju/Siswa', 'Nama Pemohon', 'Nama Pelapor', 'namaSiswa', 'Admin Verifikasi', 'admin', 'Tanggal Verifikasi', 'tanggalVerifikasi', 'Keterangan/Alasan/Catatan', 'keterangan'].includes(key)) {
                     reqObj.data[key] = row[key];
                   }
                 });
                 return reqObj;
               });
               
               // Filter requests based on role
               const user = this.authService.currentUser();
               if (user) {
                 const role = user.role;
                 if (role !== 'Admin') {
                   if (role === 'Siswa') {
                     mappedRequests = mappedRequests.filter(r => r.studentId === user.id || r.studentName === user.name);
                   } else {
                     mappedRequests = mappedRequests.filter(r => {
                       let isCurrentTier = r.currentTier === role;
                       if (role === 'Guru Piket' && r.currentTier === 'Waka Kurikulum') {
                          isCurrentTier = true;
                       }
                       const hasInteracted = r.history.some((h) => h.role === role);
                       return isCurrentTier || hasInteracted;
                     });
                   }
                 }
               }
               
               if (typeof window !== 'undefined' && window.localStorage) {
                 localStorage.setItem('local_requests', JSON.stringify(mappedRequests));
               }
               return mappedRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            }
            throw new Error('Invalid GS Data');
          }),
          catchError((err) => {
             console.error('Failed to fetch from GS, falling back to local storage', err);
             if (typeof window !== 'undefined' && window.localStorage) {
               const localData = localStorage.getItem('local_requests');
               if (localData) {
                 let parsed = JSON.parse(localData) as RequestItem[];
                 const user = this.authService.currentUser();
                 if (user && user.role === 'Siswa') {
                    parsed = parsed.filter(r => r.studentId === user.id || r.studentName === user.name);
                 }
                 return of(parsed);
               }
             }
             return of([]);
          })
        );
      })
    );
  }

  createRequest(data: Record<string, unknown>) {
    const serviceId = data['serviceId'] as string;
    this.sendToGoogleSheetsBackground(serviceId, (data['data'] as Record<string, unknown>) || data);
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
    this.sendToGoogleSheetsBackground(serviceId, data);
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
