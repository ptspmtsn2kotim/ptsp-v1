import { Component, inject, OnInit, signal } from '@angular/core';
import { ApiService, RequestItem } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { NavbarComponent } from '../../../components/navbar/navbar.component';
import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-verifikator-dashboard',
  standalone: true,
  imports: [NavbarComponent, DatePipe, NgClass, FormsModule],
  template: `
    <div class="min-h-screen bg-neutral-50 font-sans flex flex-col">
      <app-navbar></app-navbar>

      <div class="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-neutral-900">Dashboard Verifikator</h1>
          <p class="text-neutral-500 mt-2">Role Anda: <span class="font-semibold text-emerald-700">{{ authService.currentUser()?.role }}</span></p>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
          <div class="px-6 py-5 border-b border-neutral-200 flex justify-between items-center">
            <h3 class="text-lg font-medium leading-6 text-neutral-900">Daftar Pengajuan Menunggu Tindakan</h3>
            <button (click)="fetchRequests()" class="text-emerald-600 hover:text-emerald-800 flex items-center gap-1 text-sm font-medium">
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
                      <button (click)="viewDetails(req)" class="text-emerald-600 hover:text-emerald-900 flex items-center gap-1">
                        <span class="material-icons text-sm">visibility</span> Detail & Tindakan
                      </button>
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
                <div class="col-span-2 mt-2">
                  <p class="text-neutral-500 text-xs uppercase tracking-wider">Deskripsi</p>
                  <p class="text-neutral-900 mt-1">{{ selectedRequest()?.data?.['description'] || '-' }}</p>
                </div>
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

              <!-- Action Buttons -->
              @if (canVerify()) {
                <div class="border-t border-neutral-200 pt-6 mt-6">
                  <h4 class="text-md font-medium text-neutral-900 mb-4">Tindakan</h4>
                  
                  @if (showRejectReason()) {
                    <div class="mb-4">
                      <label for="rejectReason" class="block text-sm font-medium text-neutral-700 mb-1">Alasan Penolakan</label>
                      <textarea id="rejectReason" [ngModel]="rejectReason()" (ngModelChange)="rejectReason.set($event)" rows="3" class="w-full px-3 py-2 border border-neutral-300 rounded-lg shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"></textarea>
                      <div class="flex gap-2 mt-2 justify-end">
                        <button (click)="showRejectReason.set(false)" class="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50">Batal</button>
                        <button (click)="processRequest('reject')" [disabled]="!rejectReason()" class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">Konfirmasi Tolak</button>
                      </div>
                    </div>
                  } @else {
                    <div class="flex gap-4">
                      <button (click)="processRequest('approve')" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2">
                        <span class="material-icons text-sm">check_circle</span>
                        {{ getApproveActionText() }}
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
export class VerifikatorDashboardComponent implements OnInit {
  private apiService = inject(ApiService);
  authService = inject(AuthService);

  requests = signal<RequestItem[]>([]);
  selectedRequest = signal<RequestItem | null>(null);
  showRejectReason = signal(false);
  rejectReason = signal('');

  ngOnInit() {
    this.fetchRequests();
  }

  fetchRequests() {
    this.apiService.getRequests().subscribe(data => this.requests.set(data));
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
    
    const role = this.authService.currentUser()?.role;
    if (role === 'Admin') return true;
    if (req.currentTier === role) return true;
    if (role === 'Guru Piket' && req.currentTier === 'Waka Kurikulum') return true;
    
    return false;
  }

  getApproveActionText(): string {
    const role = this.authService.currentUser()?.role;
    const req = this.selectedRequest();
    if (req?.currentTier === 'Kepala Madrasah' || role === 'Kepala Madrasah') return 'Setujui Final';
    return 'Teruskan ke Kepala Madrasah';
  }

  processRequest(action: 'approve' | 'reject') {
    const req = this.selectedRequest();
    if (!req) return;

    this.apiService.verifyRequest(req.id, action, action === 'reject' ? this.rejectReason() : undefined).subscribe({
      next: () => {
        this.selectedRequest.set(null);
        this.fetchRequests();
      },
      error: () => {
        alert('Gagal memproses pengajuan.');
      }
    });
  }
}
