import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService, RequestItem, ServiceItem } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { NavbarComponent } from '../../../components/navbar/navbar.component';
import { DatePipe, NgClass } from '@angular/common';
import { io, Socket } from 'socket.io-client';

@Component({
  selector: 'app-siswa-dashboard',
  standalone: true,
  imports: [ReactiveFormsModule, NavbarComponent, DatePipe, NgClass],
  template: `
    <div class="min-h-screen bg-neutral-50 font-sans flex flex-col relative">
      <app-navbar></app-navbar>

      <!-- Toast Notifications -->
      <div class="fixed top-20 right-4 z-50 flex flex-col gap-2">
        @for (notif of notifications(); track notif.id) {
          <div class="bg-white border-l-4 border-emerald-500 shadow-lg rounded-r-lg p-4 max-w-sm flex items-start gap-3 animate-fade-in-up">
            <span class="material-icons text-emerald-500 mt-0.5">notifications_active</span>
            <div class="flex-grow">
              <h4 class="text-sm font-bold text-neutral-900">Status Diperbarui</h4>
              <p class="text-xs text-neutral-600 mt-1">Pengajuan <strong>{{ notif.serviceName }}</strong> Anda telah <strong>{{ notif.action }}</strong> oleh {{ notif.by }}.</p>
            </div>
            <button (click)="removeNotification(notif.id)" class="text-neutral-400 hover:text-neutral-600">
              <span class="material-icons text-sm">close</span>
            </button>
          </div>
        }
      </div>

      <div class="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div class="flex items-center justify-between mb-8">
          <h1 class="text-3xl font-bold text-neutral-900">Dashboard Siswa</h1>
          <button (click)="showForm.set(!showForm())" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-2">
            <span class="material-icons">{{ showForm() ? 'close' : 'add' }}</span>
            {{ showForm() ? 'Batal' : 'Buat Pengajuan' }}
          </button>
        </div>

        @if (showForm()) {
          <div class="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 mb-8">
            <h2 class="text-xl font-semibold mb-6 flex items-center gap-2">
              <span class="material-icons text-emerald-600">description</span>
              Form Pengajuan Layanan
            </h2>
            <form [formGroup]="requestForm" (ngSubmit)="onSubmit()" class="space-y-6">
              @if (submitError()) {
                <div class="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <span class="material-icons text-red-500 mt-0.5">error_outline</span>
                  <p class="text-sm text-red-700">{{ submitError() }}</p>
                </div>
              }
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label for="nama" class="block text-sm font-medium text-neutral-700">Nama Lengkap</label>
                  <input id="nama" type="text" [value]="authService.currentUser()?.name" disabled class="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-100 text-neutral-500 sm:text-sm">
                </div>
                <div>
                  <label for="nis" class="block text-sm font-medium text-neutral-700">NIS</label>
                  <input id="nis" type="text" [value]="authService.currentUser()?.nis" disabled class="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-100 text-neutral-500 sm:text-sm">
                </div>
                <div>
                  <label for="kelas" class="block text-sm font-medium text-neutral-700">Kelas</label>
                  <input id="kelas" type="text" [value]="authService.currentUser()?.kelas" disabled class="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-100 text-neutral-500 sm:text-sm">
                </div>
                <div>
                  <label for="serviceId" class="block text-sm font-medium text-neutral-700">Jenis Layanan</label>
                  <select id="serviceId" formControlName="serviceId" class="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm">
                    <option value="" disabled>Pilih Layanan</option>
                    @for (service of services(); track service.id) {
                      <option [value]="service.id">{{ service.name }}</option>
                    }
                  </select>
                </div>
              </div>

              <div>
                <label for="description" class="block text-sm font-medium text-neutral-700">Deskripsi / Keterangan Tambahan</label>
                <textarea id="description" formControlName="description" rows="4" class="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"></textarea>
              </div>

              <div class="flex justify-end">
                <button type="submit" [disabled]="requestForm.invalid || isSubmitting()" class="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2">
                  @if (isSubmitting()) {
                    <span class="material-icons animate-spin">refresh</span>
                  }
                  Kirim Pengajuan
                </button>
              </div>
            </form>
          </div>
        }

        <div class="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
          <div class="px-6 py-5 border-b border-neutral-200">
            <h3 class="text-lg font-medium leading-6 text-neutral-900">Riwayat Pengajuan</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-neutral-200">
              <thead class="bg-neutral-50">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Tanggal</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Layanan</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Posisi Saat Ini</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-neutral-200">
                @for (req of requests(); track req.id) {
                  <tr class="hover:bg-neutral-50 transition-colors">
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {{ req.createdAt | date:'dd MMM yyyy, HH:mm' }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
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
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {{ req.currentTier }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button (click)="viewDetails(req)" class="text-emerald-600 hover:text-emerald-900 flex items-center gap-1">
                        <span class="material-icons text-sm">visibility</span> Detail
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="px-6 py-10 text-center text-sm text-neutral-500">
                      Belum ada riwayat pengajuan.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
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
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p class="text-neutral-500">Layanan</p>
                  <p class="font-medium text-neutral-900">{{ selectedRequest()?.serviceName }}</p>
                </div>
                <div>
                  <p class="text-neutral-500">Status</p>
                  <p class="font-medium text-neutral-900">{{ selectedRequest()?.status }}</p>
                </div>
                <div class="col-span-2">
                  <p class="text-neutral-500">Deskripsi</p>
                  <p class="text-neutral-900 bg-neutral-50 p-3 rounded-lg mt-1 border border-neutral-100">{{ selectedRequest()?.data?.['description'] || '-' }}</p>
                </div>
                @if (selectedRequest()?.data?.['lokasiPelapor']) {
                  <div class="col-span-2">
                    <p class="text-neutral-500">Lokasi Pelaporan</p>
                    <div class="text-neutral-900 bg-neutral-50 p-3 rounded-lg mt-1 border border-neutral-100">
                      @if ((selectedRequest()?.data?.['lokasiPelapor'] + '').startsWith('Lat:')) {
                        <a [href]="'https://www.google.com/maps/search/?api=1&query=' + (selectedRequest()?.data?.['lokasiPelapor'] + '').replace('Lat: ', '').replace(', Lng: ', ',')" target="_blank" class="text-emerald-600 hover:text-emerald-800 flex items-center gap-1">
                          <span class="material-icons text-sm">location_on</span> Buka di Google Maps
                        </a>
                        <span class="text-xs text-neutral-500 block mt-1">{{ selectedRequest()?.data?.['lokasiPelapor'] }}</span>
                      } @else {
                        {{ selectedRequest()?.data?.['lokasiPelapor'] }}
                      }
                    </div>
                  </div>
                }
              </div>

              <div>
                <h4 class="text-md font-medium text-neutral-900 mb-4 border-b pb-2">Log Aktivitas</h4>
                <div class="space-y-4">
                  @for (log of selectedRequest()?.history; track log.date) {
                    <div class="flex gap-4">
                      <div class="flex flex-col items-center">
                        <div class="w-2 h-2 bg-emerald-500 rounded-full mt-1.5"></div>
                        <div class="w-px h-full bg-neutral-200 my-1"></div>
                      </div>
                      <div class="pb-4">
                        <p class="text-sm font-medium text-neutral-900">{{ log.action }}</p>
                        <p class="text-xs text-neutral-500">{{ log.by }} ({{ log.role }}) - {{ log.date | date:'dd MMM yyyy, HH:mm' }}</p>
                        @if (log.reason) {
                          <p class="text-sm text-red-600 mt-1 bg-red-50 p-2 rounded border border-red-100">Alasan: {{ log.reason }}</p>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in-up {
      animation: fadeInUp 0.3s ease-out forwards;
    }
  `]
})
export class SiswaDashboardComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  services = signal<ServiceItem[]>([]);
  requests = signal<RequestItem[]>([]);
  showForm = signal(false);
  isSubmitting = signal(false);
  submitError = signal<string | null>(null);
  selectedRequest = signal<RequestItem | null>(null);
  
  notifications = signal<{id: number, serviceName: string, action: string, by: string, status: string, role: string}[]>([]);
  private socket!: Socket;
  private notifCounter = 0;

  requestForm = this.fb.group({
    serviceId: ['', Validators.required],
    description: ['']
  });

  ngOnInit() {
    this.loadData();
    this.setupSocket();
    
    // Check if there's a pre-selected service from landing page
    const serviceIdParam = this.route.snapshot.paramMap.get('serviceId');
    if (serviceIdParam) {
      this.showForm.set(true);
      this.requestForm.patchValue({ serviceId: serviceIdParam });
    }
  }

  ngOnDestroy() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  setupSocket() {
    const user = this.authService.currentUser();
    if (user && user.role === 'Siswa' && typeof window !== 'undefined') {
      this.socket = io({ transports: ['polling'] });
      this.socket.emit('join', user.id);
      
      this.socket.on('request_status_changed', (data) => {
        const newNotif = { id: this.notifCounter++, ...data };
        this.notifications.update(n => [...n, newNotif]);
        this.fetchRequests();
        
        // Auto remove after 5 seconds
        setTimeout(() => {
          this.removeNotification(newNotif.id);
        }, 5000);
      });
    }
  }

  removeNotification(id: number) {
    this.notifications.update(n => n.filter(notif => notif.id !== id));
  }

  loadData() {
    this.apiService.getServices().subscribe(data => this.services.set(data));
    this.fetchRequests();
  }

  fetchRequests() {
    this.apiService.getRequests().subscribe(data => this.requests.set(data));
  }

  onSubmit() {
    if (this.requestForm.valid) {
      this.isSubmitting.set(true);
      this.submitError.set(null);
      
      const payload = {
        serviceId: this.requestForm.value.serviceId,
        data: {
          description: this.requestForm.value.description
        } as Record<string, string>
      };

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            payload.data['lokasiPelapor'] = `Lat: ${position.coords.latitude}, Lng: ${position.coords.longitude}`;
            this.sendRequest(payload);
          },
          (error) => {
            this.isSubmitting.set(false);
            if (error.code === error.PERMISSION_DENIED) {
              this.submitError.set("Setiap Pengajuan Wajib Mengizinkan Lokasi. Izinkan Lokasi Anda!");
            } else {
              this.submitError.set("Gagal mendapatkan lokasi. Pastikan GPS aktif dan coba lagi.");
            }
          },
          { timeout: 10000, enableHighAccuracy: true }
        );
      } else {
        this.submitError.set("Browser Anda tidak mendukung fitur lokasi.");
        this.isSubmitting.set(false);
      }
    }
  }

  private sendRequest(payload: Record<string, unknown>) {
    this.apiService.createRequest(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.showForm.set(false);
        this.requestForm.reset({ serviceId: '' });
        this.fetchRequests();
      },
      error: () => {
        this.isSubmitting.set(false);
        this.submitError.set('Gagal membuat pengajuan.');
      }
    });
  }

  viewDetails(req: RequestItem) {
    this.selectedRequest.set(req);
  }
}
