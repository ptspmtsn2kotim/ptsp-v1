import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ApiService, UserItem, RequestItem } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { NavbarComponent } from '../../../components/navbar/navbar.component';
import { DatePipe, NgClass } from '@angular/common';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, NavbarComponent, DatePipe, NgClass],
  template: `
    <div class="min-h-screen bg-neutral-50 font-sans flex flex-col">
      <app-navbar></app-navbar>

      <div class="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div class="flex items-center justify-between mb-8">
          <h1 class="text-3xl font-bold text-neutral-900">Admin Dashboard</h1>
          @if (activeTab() === 'users') {
            <button (click)="openForm()" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-2">
              <span class="material-icons">add</span>
              Tambah Pengguna
            </button>
          }
        </div>

        <!-- Tabs -->
        <div class="flex border-b border-neutral-200 mb-8">
          <button 
            (click)="setActiveTab('users')" 
            [class.border-emerald-600]="activeTab() === 'users'"
            [class.text-emerald-600]="activeTab() === 'users'"
            [class.border-transparent]="activeTab() !== 'users'"
            [class.text-neutral-500]="activeTab() !== 'users'"
            class="px-6 py-3 border-b-2 font-medium text-sm hover:text-emerald-600 transition-colors">
            Kelola Pengguna
          </button>
          <button 
            (click)="setActiveTab('requests')" 
            [class.border-emerald-600]="activeTab() === 'requests'"
            [class.text-emerald-600]="activeTab() === 'requests'"
            [class.border-transparent]="activeTab() !== 'requests'"
            [class.text-neutral-500]="activeTab() !== 'requests'"
            class="px-6 py-3 border-b-2 font-medium text-sm hover:text-emerald-600 transition-colors">
            Kelola Pengajuan
          </button>
        </div>

        @if (activeTab() === 'users') {
          @if (showForm()) {
          <div class="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 mb-8">
            <h2 class="text-xl font-semibold mb-6 flex items-center gap-2">
              <span class="material-icons text-emerald-600">{{ editingUserId() ? 'edit' : 'person_add' }}</span>
              {{ editingUserId() ? 'Edit Pengguna' : 'Tambah Pengguna Baru' }}
            </h2>
            <form [formGroup]="userForm" (ngSubmit)="onSubmit()" class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label for="name" class="block text-sm font-medium text-neutral-700">Nama Lengkap</label>
                  <input id="name" type="text" formControlName="name" class="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm">
                </div>
                <div>
                  <label for="username" class="block text-sm font-medium text-neutral-700">Username</label>
                  <input id="username" type="text" formControlName="username" class="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm">
                </div>
                <div>
                  <label for="email" class="block text-sm font-medium text-neutral-700">Email (Opsional)</label>
                  <input id="email" type="email" formControlName="email" class="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm">
                </div>
                <div>
                  <label for="role" class="block text-sm font-medium text-neutral-700">Role</label>
                  <select id="role" formControlName="role" class="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm">
                    <option value="" disabled>Pilih Role</option>
                    <option value="Siswa">Siswa</option>
                    <option value="Wali Kelas">Wali Kelas</option>
                    <option value="Staff Tata Usaha">Staff Tata Usaha</option>
                    <option value="Kepala Madrasah">Kepala Madrasah</option>
                    <option value="Waka Humas">Waka Humas</option>
                    <option value="Waka Kurikulum">Waka Kurikulum</option>
                    <option value="Waka Kesiswaan">Waka Kesiswaan</option>
                    <option value="Waka Sarpras">Waka Sarpras</option>
                    <option value="Guru Piket">Guru Piket</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label for="password" class="block text-sm font-medium text-neutral-700">Password {{ editingUserId() ? '(Kosongkan jika tidak diubah)' : '' }}</label>
                  <input id="password" type="password" formControlName="password" class="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm">
                </div>
                @if (userForm.get('role')?.value === 'Siswa') {
                  <div>
                    <label for="nis" class="block text-sm font-medium text-neutral-700">NIS</label>
                    <input id="nis" type="text" formControlName="nis" class="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm">
                  </div>
                  <div>
                    <label for="kelas" class="block text-sm font-medium text-neutral-700">Kelas</label>
                    <input id="kelas" type="text" formControlName="kelas" class="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm">
                  </div>
                }
              </div>

              <div class="flex justify-end gap-3">
                <button type="button" (click)="closeForm()" class="bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 px-4 py-2 rounded-lg shadow-sm transition-colors">
                  Batal
                </button>
                <button type="submit" [disabled]="userForm.invalid || isSubmitting()" class="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2">
                  @if (isSubmitting()) {
                    <span class="material-icons animate-spin text-sm">refresh</span>
                  }
                  Simpan
                </button>
              </div>
            </form>
          </div>
        }

        <div class="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
          <div class="px-6 py-5 border-b border-neutral-200">
            <h3 class="text-lg font-medium leading-6 text-neutral-900">Daftar Pengguna</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-neutral-200">
              <thead class="bg-neutral-50">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Nama</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Username</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Role</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-neutral-200">
                @for (user of users(); track user.id) {
                  <tr class="hover:bg-neutral-50 transition-colors">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                      {{ user.name }}
                      @if (user.role === 'Siswa') {
                        <span class="text-xs text-neutral-500 block font-normal">{{ user.nis }} - {{ user.kelas }}</span>
                      }
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {{ user.username }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800">
                        {{ user.role }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div class="flex items-center gap-3">
                        <button (click)="editUser(user)" class="text-blue-600 hover:text-blue-900 flex items-center gap-1">
                          <span class="material-icons text-sm">edit</span> Edit
                        </button>
                        <button (click)="deleteUser(user.id)" class="text-red-600 hover:text-red-900 flex items-center gap-1">
                          <span class="material-icons text-sm">delete</span> Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="4" class="px-6 py-10 text-center text-sm text-neutral-500">
                      Belum ada pengguna.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
        }

        @if (activeTab() === 'requests') {
          <div class="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
            <div class="px-6 py-5 border-b border-neutral-200 flex justify-between items-center">
              <h3 class="text-lg font-medium leading-6 text-neutral-900">Daftar Pengajuan Menunggu Tindakan</h3>
              <button (click)="loadRequests()" class="text-emerald-600 hover:text-emerald-800 flex items-center gap-1 text-sm font-medium">
                <span class="material-icons text-sm">refresh</span> Segarkan
              </button>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-neutral-200">
                <thead class="bg-neutral-50">
                  <tr>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Tanggal</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Siswa</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Layanan</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-neutral-200">
                  @for (req of requests(); track req.id) {
                    <tr class="hover:bg-neutral-50 transition-colors">
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        {{ req.createdAt | date:'dd MMM yyyy, HH:mm' }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-neutral-900">{{ req.studentName }}</div>
                        <div class="text-sm text-neutral-500">ID: {{ req.studentId }}</div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                        {{ req.serviceName }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                          [ngClass]="{
                            'bg-yellow-100 text-yellow-800': req.status.includes('Menunggu') || req.status.includes('Diproses'),
                            'bg-green-100 text-green-800': req.status === 'Selesai',
                            'bg-red-100 text-red-800': req.status === 'Ditolak'
                          }">
                          {{ req.status }}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div class="flex items-center gap-3">
                          <button (click)="viewDetails(req)" class="text-emerald-600 hover:text-emerald-900 flex items-center gap-1">
                            <span class="material-icons text-sm">visibility</span> Detail & Tindakan
                          </button>
                          @if (authService.currentUser()?.role === 'Admin') {
                            <button (click)="deleteRequest(req.id)" class="text-red-600 hover:text-red-900 flex items-center gap-1">
                              <span class="material-icons text-sm">delete</span> Hapus
                            </button>
                          }
                        </div>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="5" class="px-6 py-10 text-center text-sm text-neutral-500">
                        Tidak ada pengajuan yang perlu ditindaklanjuti.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      </div>

      <!-- Detail Modal -->
      @if (selectedRequest()) {
        <div class="fixed inset-0 bg-neutral-900/50 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div class="px-6 py-4 border-b border-neutral-200 flex justify-between items-center sticky top-0 bg-white">
              <h3 class="text-lg font-medium text-neutral-900">Detail Pengajuan #{{ selectedRequest()?.id }}</h3>
              <button (click)="selectedRequest.set(null)" class="text-neutral-400 hover:text-neutral-500">
                <span class="material-icons">close</span>
              </button>
            </div>
            
            <div class="p-6 space-y-6">
              <div class="grid grid-cols-2 gap-4 text-sm bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                <div>
                  <p class="text-neutral-500 text-xs uppercase tracking-wider">Pemohon</p>
                  <p class="font-medium text-neutral-900 mt-1">{{ selectedRequest()?.studentName }}</p>
                </div>
                <div>
                  <p class="text-neutral-500 text-xs uppercase tracking-wider">Layanan</p>
                  <p class="font-medium text-neutral-900 mt-1">{{ selectedRequest()?.serviceName }}</p>
                </div>
                <div>
                  <p class="text-neutral-500 text-xs uppercase tracking-wider">Tanggal Pengajuan</p>
                  <p class="font-medium text-neutral-900 mt-1">{{ selectedRequest()?.createdAt | date:'dd MMM yyyy, HH:mm' }}</p>
                </div>
                <div>
                  <p class="text-neutral-500 text-xs uppercase tracking-wider">Status Saat Ini</p>
                  <span class="mt-1 inline-flex px-2 text-xs leading-5 font-semibold rounded-full"
                    [ngClass]="{
                      'bg-yellow-100 text-yellow-800': selectedRequest()?.status?.includes('Menunggu') || selectedRequest()?.status?.includes('Diproses'),
                      'bg-green-100 text-green-800': selectedRequest()?.status === 'Selesai',
                      'bg-red-100 text-red-800': selectedRequest()?.status === 'Ditolak'
                    }">
                    {{ selectedRequest()?.status }}
                  </span>
                </div>
              </div>

              <div>
                <h4 class="text-sm font-medium text-neutral-900 mb-3 border-b border-neutral-200 pb-2">Data Pengajuan</h4>
                <div class="bg-white border border-neutral-200 rounded-xl overflow-hidden">
                  <dl class="divide-y divide-neutral-200">
                    @for (item of getObjectKeys(selectedRequest()?.data); track item) {
                      <div class="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 hover:bg-neutral-50">
                        <dt class="text-sm font-medium text-neutral-500 capitalize">{{ item.replace('_', ' ') }}</dt>
                        <dd class="mt-1 text-sm text-neutral-900 sm:mt-0 sm:col-span-2">
                          @if (item === 'lokasiPelapor' && getObjectValue(selectedRequest()?.data, item).startsWith('Lat:')) {
                            <a [href]="'https://www.google.com/maps/search/?api=1&query=' + getObjectValue(selectedRequest()?.data, item).replace('Lat: ', '').replace(', Lng: ', ',')" target="_blank" class="text-emerald-600 hover:text-emerald-800 flex items-center gap-1">
                              <span class="material-icons text-sm">location_on</span> Buka di Google Maps
                            </a>
                            <span class="text-xs text-neutral-500 block mt-1">{{ getObjectValue(selectedRequest()?.data, item) }}</span>
                          } @else {
                            {{ getObjectValue(selectedRequest()?.data, item) }}
                          }
                        </dd>
                      </div>
                    }
                  </dl>
                </div>
              </div>

              <div>
                <h4 class="text-sm font-medium text-neutral-900 mb-3 border-b border-neutral-200 pb-2">Riwayat Proses</h4>
                <div class="flow-root">
                  <ul role="list" class="-mb-8">
                    @for (history of selectedRequest()?.history; track history; let last = $last) {
                      <li>
                        <div class="relative pb-8">
                          @if (!last) {
                            <span class="absolute top-4 left-4 -ml-px h-full w-0.5 bg-neutral-200" aria-hidden="true"></span>
                          }
                          <div class="relative flex space-x-3">
                            <div>
                              <span class="h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white"
                                [ngClass]="{
                                  'bg-emerald-500': history.action.includes('Disetujui') || history.action.includes('Diteruskan'),
                                  'bg-red-500': history.action === 'Ditolak',
                                  'bg-blue-500': history.action === 'Pengajuan Dibuat'
                                }">
                                <span class="material-icons text-white text-sm">
                                  {{ history.action === 'Ditolak' ? 'close' : (history.action === 'Pengajuan Dibuat' ? 'add' : 'check') }}
                                </span>
                              </span>
                            </div>
                            <div class="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p class="text-sm text-neutral-500">{{ history.action }} <span class="font-medium text-neutral-900">oleh {{ history.by }} ({{ history.role }})</span></p>
                                @if (history.reason) {
                                  <p class="mt-2 text-sm text-neutral-700 bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                                    <span class="font-medium">Alasan:</span> {{ history.reason }}
                                  </p>
                                }
                              </div>
                              <div class="text-right text-xs whitespace-nowrap text-neutral-500">
                                {{ history.date | date:'dd MMM, HH:mm' }}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    }
                  </ul>
                </div>
              </div>

              @if (canVerify()) {
                <div class="border-t border-neutral-200 pt-6 mt-6">
                  <h4 class="text-sm font-medium text-neutral-900 mb-4">Tindakan Verifikasi</h4>
                  
                  @if (showRejectReason()) {
                    <div class="space-y-4 bg-red-50 p-4 rounded-xl border border-red-100">
                      <div>
                        <label for="reason" class="block text-sm font-medium text-red-800">Alasan Penolakan</label>
                        <textarea id="reason" [(ngModel)]="rejectReason" rows="3" class="mt-1 block w-full px-3 py-2 border border-red-300 rounded-lg shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm" placeholder="Masukkan alasan penolakan..."></textarea>
                      </div>
                      <div class="flex gap-3">
                        <button (click)="processRequest('reject')" [disabled]="!rejectReason()" class="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                          <span class="material-icons text-sm">send</span>
                          Kirim Penolakan
                        </button>
                        <button (click)="showRejectReason.set(false)" class="bg-white border border-red-300 text-red-700 hover:bg-red-50 font-medium py-2 px-4 rounded-lg shadow-sm transition-colors">
                          Batal
                        </button>
                      </div>
                    </div>
                  } @else {
                    <div class="flex gap-4">
                      <button (click)="processRequest('approve')" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2">
                        <span class="material-icons text-sm">check_circle</span>
                        Setujui Final
                      </button>
                      <button (click)="showRejectReason.set(true)" class="flex-1 bg-white border border-red-600 text-red-600 hover:bg-red-50 font-medium py-2 px-4 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2">
                        <span class="material-icons text-sm">cancel</span>
                        Tolak
                      </button>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  authService = inject(AuthService);

  users = signal<UserItem[]>([]);
  requests = signal<RequestItem[]>([]);
  activeTab = signal<'users' | 'requests'>('users');
  showForm = signal(false);
  isSubmitting = signal(false);
  editingUserId = signal<number | null>(null);
  selectedRequest = signal<RequestItem | null>(null);
  showRejectReason = signal(false);
  rejectReason = signal('');

  userForm = this.fb.group({
    name: ['', Validators.required],
    username: ['', Validators.required],
    email: ['', Validators.email],
    role: ['', Validators.required],
    password: [''],
    nis: [''],
    kelas: ['']
  });

  ngOnInit() {
    this.loadUsers();
    this.loadRequests();
  }

  setActiveTab(tab: 'users' | 'requests') {
    this.activeTab.set(tab);
    if (tab === 'requests') {
      this.loadRequests();
    } else {
      this.loadUsers();
    }
  }

  loadUsers() {
    this.apiService.getUsers().subscribe(data => this.users.set(data));
  }

  loadRequests() {
    this.apiService.getRequests().subscribe(data => this.requests.set(data));
  }

  getObjectKeys(obj: unknown): string[] {
    if (!obj || typeof obj !== 'object') return [];
    return Object.keys(obj as Record<string, unknown>);
  }

  getObjectValue(obj: unknown, key: string): string {
    if (!obj || typeof obj !== 'object') return '';
    return String((obj as Record<string, unknown>)[key] || '');
  }

  viewDetails(req: RequestItem) {
    this.selectedRequest.set(req);
    this.showRejectReason.set(false);
    this.rejectReason.set('');
  }
  
  canVerify(): boolean {
    const req = this.selectedRequest();
    if (!req) return false;
    if (req.status === 'Ditolak' || req.status === 'Selesai') return false;
    return true; // Admin can verify anything that isn't finished
  }

  processRequest(action: 'approve' | 'reject') {
    const req = this.selectedRequest();
    if (!req) return;

    this.apiService.verifyRequest(req.id, action, action === 'reject' ? this.rejectReason() : undefined).subscribe({
      next: () => {
        this.selectedRequest.set(null);
        this.loadRequests();
      },
      error: () => {
        alert('Gagal memproses pengajuan.');
      }
    });
  }

  openForm() {
    this.editingUserId.set(null);
    this.userForm.reset({ role: '' });
    this.userForm.get('password')?.setValidators([Validators.required]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.editingUserId.set(null);
  }

  editUser(user: UserItem) {
    this.editingUserId.set(user.id);
    this.userForm.patchValue({
      name: user.name,
      username: user.username,
      email: user.email || '',
      role: user.role,
      password: '',
      nis: user.nis || '',
      kelas: user.kelas || ''
    });
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    this.showForm.set(true);
  }

  deleteUser(id: number) {
    const currentUsers = this.users();
    this.users.set(currentUsers.filter(u => u.id !== id));
    this.apiService.deleteUser(id).subscribe({
      next: () => { /* success */ },
      error: (err) => {
        console.error('Gagal menghapus pengguna:', err);
        this.loadUsers();
      }
    });
  }

  deleteRequest(id: number) {
    const currentRequests = this.requests();
    this.requests.set(currentRequests.filter(r => r.id !== id));
    this.apiService.deleteRequest(id).subscribe({
      next: () => { /* success */ },
      error: (err) => {
        console.error('Gagal menghapus pengajuan:', err);
        this.loadRequests();
      }
    });
  }

  onSubmit() {
    if (this.userForm.valid) {
      this.isSubmitting.set(true);
      const payload = this.userForm.value;
      
      const request = this.editingUserId()
        ? this.apiService.updateUser(this.editingUserId()!, payload)
        : this.apiService.createUser(payload);

      request.subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeForm();
          this.loadUsers();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          alert(err.error?.message || 'Gagal menyimpan pengguna.');
        }
      });
    }
  }
}
