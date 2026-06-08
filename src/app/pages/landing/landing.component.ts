import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiService, ServiceItem } from '../../services/api.service';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [NavbarComponent, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-neutral-50 font-sans flex flex-col">
      <app-navbar></app-navbar>

      <!-- Hero Section -->
      <div class="relative bg-emerald-950 overflow-hidden">
        <div class="absolute inset-0">
          <img src="background.jpg" alt="Background" class="w-full h-full object-cover opacity-60 mix-blend-overlay" />
          <div class="absolute inset-0 bg-gradient-to-r from-emerald-950/80 via-emerald-950/60 to-emerald-950/20"></div>
        </div>
        
        <div class="relative max-w-7xl mx-auto py-24 px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center gap-12">
          <div class="flex-1 text-left z-10">
            <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-800/40 border border-emerald-700/50 text-emerald-200 text-sm font-medium mb-8 backdrop-blur-md">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Layanan Digital Madrasah
            </div>
            <h1 class="text-5xl sm:text-7xl font-extrabold text-white tracking-tight mb-6 leading-tight">
              Pelayanan Terpadu <br/>
              <span class="text-emerald-400">Satu Pintu</span>
            </h1>
            <h2 class="text-2xl sm:text-3xl font-medium text-emerald-100 mb-8 flex items-center gap-3">
              <div class="w-12 h-1 bg-emerald-500 rounded-full hidden sm:block"></div>
              MTsN 2 Kotawaringin Timur
            </h2>
            <p class="text-lg text-emerald-50/80 max-w-2xl mb-10 leading-relaxed">
              Sistem informasi layanan digital madrasah yang cepat, mudah, dan transparan. Kami berkomitmen memberikan pelayanan prima untuk seluruh civitas akademika.
            </p>
            <div class="flex flex-col sm:flex-row gap-4">
              <a href="#layanan" class="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 group">
                <span class="material-icons group-hover:rotate-12 transition-transform">explore</span>
                Jelajahi Layanan
              </a>
              <a routerLink="/login" class="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-semibold py-4 px-8 rounded-xl transition-all flex items-center justify-center gap-2">
                <span class="material-icons">login</span>
                Login Sistem
              </a>
            </div>
          </div>
          <div class="flex-1 flex justify-center relative z-10 mt-12 md:mt-0">
            <div class="absolute inset-0 bg-emerald-500 rounded-full blur-[100px] opacity-20 animate-pulse"></div>
            <div class="w-64 h-64 sm:w-96 sm:h-96 bg-white rounded-full p-4 shadow-2xl relative transform hover:scale-105 transition-transform duration-500 border-8 border-emerald-800/50 flex items-center justify-center overflow-hidden group">
              <img src="sekolah.jpg" alt="Gambar Utama" class="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-700" />
            </div>
          </div>
        </div>
        
        <!-- Decorative bottom wave -->
        <div class="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto text-neutral-50">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 60C1200 60 1320 45 1380 37.5L1440 30V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="currentColor"/>
          </svg>
        </div>
      </div>

      <!-- Services Section -->
      <div id="layanan" class="relative py-24 flex-grow">
        <!-- Background Image -->
        <div class="absolute inset-0 bg-fixed bg-cover bg-center opacity-80" style="background-image: url('background.jpg');"></div>
        <div class="absolute inset-0 bg-white/70 backdrop-blur-[2px]"></div>
        
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div class="text-center mb-20">
            <span class="text-emerald-700 font-bold tracking-widest uppercase text-sm bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full border border-emerald-100 shadow-sm">Layanan Kami</span>
            <h2 class="text-4xl sm:text-5xl font-extrabold text-neutral-900 mt-6 mb-6 drop-shadow-sm">Daftar Layanan PTSP</h2>
            <p class="text-neutral-700 max-w-2xl mx-auto text-lg leading-relaxed font-medium drop-shadow-sm">Pilih layanan yang Anda butuhkan di bawah ini. Proses pengajuan cepat dan dapat dipantau secara real-time melalui dashboard Anda.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            @for (service of services(); track service.id) {
              <div class="bg-white/90 backdrop-blur-md rounded-3xl shadow-lg border border-white/50 p-8 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col h-full group relative overflow-hidden">
                <div class="absolute top-0 right-0 w-32 h-32 bg-emerald-50/50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                <div class="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-8 relative z-10 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                  <span class="material-icons text-3xl">{{ service.icon }}</span>
                </div>
                <h3 class="text-xl font-bold text-neutral-900 mb-4 relative z-10">{{ service.name }}</h3>
                <p class="text-neutral-600 mb-8 flex-grow leading-relaxed relative z-10">{{ service.description }}</p>
                <button (click)="openForm(service)" class="w-full bg-white hover:bg-emerald-50 text-emerald-700 font-semibold py-3.5 px-4 rounded-xl transition-colors mt-auto flex items-center justify-center gap-2 border border-emerald-100 hover:border-emerald-300 relative z-10 group/btn shadow-sm">
                  <span>Ajukan Sekarang</span>
                  <span class="material-icons text-sm group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
                </button>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Stats Section -->
      <div class="bg-white py-6 sm:py-8 relative overflow-hidden border-y border-neutral-200">
        <!-- Background Image -->
        <div class="absolute inset-0">
          <img src="background.jpg" alt="Background Sekolah" class="w-full h-full object-cover opacity-80" />
          <div class="absolute inset-0 bg-white/70 backdrop-blur-sm"></div>
        </div>
        
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <!-- Item 1 -->
            <div class="flex items-center gap-3 bg-white/60 backdrop-blur-md p-3 sm:p-4 rounded-xl border border-white/40 shadow-sm hover:bg-white/80 transition-all duration-300 group">
              <div class="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 group-hover:scale-110 group-hover:bg-emerald-200 transition-all">
                <span class="material-icons text-xl">touch_app</span>
              </div>
              <div class="text-left">
                <div class="text-lg sm:text-xl font-extrabold text-emerald-950 leading-none mb-1">100%</div>
                <div class="text-emerald-700 font-medium text-[10px] sm:text-xs uppercase tracking-wider">Layanan Digital</div>
              </div>
            </div>
            <!-- Item 2 -->
            <div class="flex items-center gap-3 bg-white/60 backdrop-blur-md p-3 sm:p-4 rounded-xl border border-white/40 shadow-sm hover:bg-white/80 transition-all duration-300 group">
              <div class="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 group-hover:scale-110 group-hover:bg-emerald-200 transition-all">
                <span class="material-icons text-xl">update</span>
              </div>
              <div class="text-left">
                <div class="text-lg sm:text-xl font-extrabold text-emerald-950 leading-none mb-1">24/7</div>
                <div class="text-emerald-700 font-medium text-[10px] sm:text-xs uppercase tracking-wider">Akses Sistem</div>
              </div>
            </div>
            <!-- Item 3 -->
            <div class="flex items-center gap-3 bg-white/60 backdrop-blur-md p-3 sm:p-4 rounded-xl border border-white/40 shadow-sm hover:bg-white/80 transition-all duration-300 group">
              <div class="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 group-hover:scale-110 group-hover:bg-emerald-200 transition-all">
                <span class="material-icons text-xl">bolt</span>
              </div>
              <div class="text-left">
                <div class="text-lg sm:text-xl font-extrabold text-emerald-950 leading-none mb-1">Cepat</div>
                <div class="text-emerald-700 font-medium text-[10px] sm:text-xs uppercase tracking-wider">Proses Verifikasi</div>
              </div>
            </div>
            <!-- Item 4 -->
            <div class="flex items-center gap-3 bg-white/60 backdrop-blur-md p-3 sm:p-4 rounded-xl border border-white/40 shadow-sm hover:bg-white/80 transition-all duration-300 group">
              <div class="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 group-hover:scale-110 group-hover:bg-emerald-200 transition-all">
                <span class="material-icons text-xl">security</span>
              </div>
              <div class="text-left">
                <div class="text-lg sm:text-xl font-extrabold text-emerald-950 leading-none mb-1">Aman</div>
                <div class="text-emerald-700 font-medium text-[10px] sm:text-xs uppercase tracking-wider">Data Terlindungi</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <footer class="bg-neutral-950 text-neutral-400 pt-16 pb-8 border-t border-neutral-900">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <!-- Col 1: Info & Socials -->
            <div class="space-y-6">
              <div class="flex items-center gap-4">
                <div class="w-16 h-16 bg-white rounded-full p-1.5 flex items-center justify-center shadow-lg">
                  <img src="logo.png" alt="Logo" class="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 class="text-white font-bold text-xl">MTsN 2 Kotawaringin Timur</h3>
                  <p class="text-emerald-500 text-sm font-medium">Pelayanan Terpadu Satu Pintu</p>
                </div>
              </div>
              <p class="text-sm text-neutral-500 leading-relaxed">
                Sistem informasi layanan digital madrasah yang cepat, mudah, dan transparan. Kami berkomitmen memberikan pelayanan prima untuk seluruh civitas akademika.
              </p>
              <div class="flex gap-4 pt-2">
                <!-- Website -->
                <a href="https://www.mtsn2kotim.sch.id/" target="_blank" title="Website Resmi" class="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center text-neutral-400 hover:bg-emerald-600 hover:text-white hover:-translate-y-1 transition-all duration-300 shadow-lg">
                  <span class="material-icons text-xl">language</span>
                </a>
                <!-- YouTube -->
                <a href="https://youtube.com/@mtsn2kotawaringintimur?si=vKz5BZQPzHpD1tPv" target="_blank" title="YouTube" class="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center text-neutral-400 hover:bg-red-600 hover:text-white hover:-translate-y-1 transition-all duration-300 shadow-lg">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
                <!-- Instagram -->
                <a href="https://www.instagram.com/mtsn2kotawaringintimur?igsh=MWQxaDhjeHVhb3hmcA==" target="_blank" title="Instagram" class="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center text-neutral-400 hover:bg-pink-600 hover:text-white hover:-translate-y-1 transition-all duration-300 shadow-lg">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <!-- WhatsApp -->
                <a href="https://wa.me/6285705790490?text=Assalamu'alaikum,%20Hai%20Admin%20MTsN%202%20Kotawaringin%20Timur,%20mohon%20informasi%20lebih%20lanjut%20perihal%20halaman%20tersebut%20diatas%20Terima%20Kasih" target="_blank" title="WhatsApp" class="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center text-neutral-400 hover:bg-green-500 hover:text-white hover:-translate-y-1 transition-all duration-300 shadow-lg">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.888-4.439 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.347-.272.297-1.04 1.016-1.04 2.479 0 1.463 1.065 2.876 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                </a>
              </div>
            </div>

            <!-- Col 2: Visitor Stats -->
            <div class="space-y-6">
              <h4 class="text-white font-bold text-lg border-b border-neutral-800 pb-2">Statistik Pengunjung</h4>
              <div class="grid grid-cols-2 gap-4">
                <div class="bg-neutral-900 rounded-xl p-4 border border-neutral-800">
                  <div class="text-neutral-500 text-xs uppercase tracking-wider mb-1">Hari Ini</div>
                  <div class="text-2xl font-bold text-white">{{ visitorsToday() }}</div>
                </div>
                <div class="bg-neutral-900 rounded-xl p-4 border border-neutral-800">
                  <div class="text-neutral-500 text-xs uppercase tracking-wider mb-1">Bulan Ini</div>
                  <div class="text-2xl font-bold text-white">{{ visitorsMonth() }}</div>
                </div>
                <div class="bg-neutral-900 rounded-xl p-4 border border-neutral-800">
                  <div class="text-neutral-500 text-xs uppercase tracking-wider mb-1">Tahun Ini</div>
                  <div class="text-2xl font-bold text-white">{{ visitorsYear() }}</div>
                </div>
                <div class="bg-emerald-900/20 rounded-xl p-4 border border-emerald-900/50 relative overflow-hidden">
                  <div class="absolute top-0 right-0 w-2 h-2 bg-emerald-500 rounded-full m-3 animate-ping"></div>
                  <div class="absolute top-0 right-0 w-2 h-2 bg-emerald-500 rounded-full m-3"></div>
                  <div class="text-emerald-500 text-xs uppercase tracking-wider mb-1">Online</div>
                  <div class="text-2xl font-bold text-emerald-400">{{ visitorsOnline() }}</div>
                </div>
              </div>
            </div>

            <!-- Col 3: Maps -->
            <div class="space-y-6">
              <h4 class="text-white font-bold text-lg border-b border-neutral-800 pb-2">Lokasi Madrasah</h4>
              <div class="w-full h-48 bg-neutral-900 rounded-xl overflow-hidden border border-neutral-800 shadow-inner relative group">
                <iframe 
                  src="https://maps.google.com/maps?q=-2.839139,112.960694&hl=id&z=15&output=embed" 
                  width="100%" 
                  height="100%" 
                  style="border:0;" 
                  allowfullscreen="" 
                  loading="lazy" 
                  referrerpolicy="no-referrer-when-downgrade"
                  class="grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500">
                </iframe>
              </div>
              <p class="text-xs text-neutral-500 flex items-start gap-2">
                <span class="material-icons text-sm text-emerald-600">location_on</span>
                <span>2°50'20.9"S 112°57'38.5"E<br/>Kotawaringin Timur, Kalimantan Tengah</span>
              </p>
            </div>
          </div>

          <div class="border-t border-neutral-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p class="text-sm text-neutral-600">&copy; 2026 MTsN 2 Kotawaringin Timur. All rights reserved.</p>
            <div class="flex gap-6 text-sm text-neutral-600">
              <a href="#" class="hover:text-emerald-500 transition-colors">Kebijakan Privasi</a>
              <a href="#" class="hover:text-emerald-500 transition-colors">Syarat & Ketentuan</a>
            </div>
          </div>
        </div>
      </footer>
      <!-- Form Modal -->
      @if (showFormModal()) {
        <div class="fixed inset-0 bg-neutral-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div class="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div class="px-6 py-4 border-b border-neutral-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 class="text-lg font-bold text-neutral-900 flex items-center gap-2">
                <span class="material-icons text-emerald-600">{{ selectedService()?.icon }}</span>
                {{ selectedService()?.name }}
              </h3>
              <button (click)="closeForm()" class="text-neutral-400 hover:text-neutral-500 transition-colors">
                <span class="material-icons">close</span>
              </button>
            </div>
            
            <div class="p-6">
              @if (submitSuccess()) {
                <div class="text-center py-8">
                  <div class="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span class="material-icons text-emerald-600 text-3xl">check_circle</span>
                  </div>
                  <h4 class="text-xl font-bold text-neutral-900 mb-2">Pengajuan Berhasil!</h4>
                  <p class="text-neutral-500">Formulir Anda telah berhasil dikirim dan akan segera diproses oleh Admin.</p>
                </div>
              } @else {
                <p class="text-neutral-600 mb-6 text-sm">{{ selectedService()?.description }}</p>
                
                @if (submitError()) {
                  <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <span class="material-icons text-red-500 mt-0.5">error_outline</span>
                    <p class="text-sm text-red-700">{{ submitError() }}</p>
                  </div>
                }
                
                <form [formGroup]="formGroup" (ngSubmit)="submitForm()" class="space-y-5">
                  @if (isPermohonan()) {
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div class="col-span-1 md:col-span-2">
                        <label for="namaPemohon" class="block text-sm font-medium text-neutral-700 mb-1">Nama Pemohon</label>
                        <input id="namaPemohon" type="text" formControlName="namaPemohon" class="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all">
                      </div>
                      <div>
                        <label for="asalInstansi" class="block text-sm font-medium text-neutral-700 mb-1">Asal Instansi</label>
                        <input id="asalInstansi" type="text" formControlName="asalInstansi" class="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all">
                      </div>
                      <div>
                        <label for="tanggalKegiatan" class="block text-sm font-medium text-neutral-700 mb-1">Tanggal Kegiatan</label>
                        <input id="tanggalKegiatan" type="date" formControlName="tanggalKegiatan" class="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all">
                      </div>
                      <div class="col-span-1 md:col-span-2">
                        <label for="isiPermohonan" class="block text-sm font-medium text-neutral-700 mb-1">Isi Permohonan</label>
                        <textarea id="isiPermohonan" formControlName="isiPermohonan" rows="3" class="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"></textarea>
                      </div>
                      <div class="col-span-1 md:col-span-2">
                        <label for="fileUploadPermohonan" class="block text-sm font-medium text-neutral-700 mb-1">Upload Surat Permohonan (Opsional)</label>
                        <input id="fileUploadPermohonan" type="file" accept=".pdf,.jpg,.jpeg,.png" (change)="onFileChange($event)" class="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100">
                        <p class="text-xs text-neutral-500 mt-1">Format: PDF, JPG, JPEG, PNG</p>
                      </div>
                    </div>
                  } @else if (isPelaporan()) {
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label for="namaPelapor" class="block text-sm font-medium text-neutral-700 mb-1">Nama Pelapor</label>
                        <input id="namaPelapor" type="text" formControlName="namaPelapor" class="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all">
                      </div>
                      <div>
                        <label for="tanggalPelaporan" class="block text-sm font-medium text-neutral-700 mb-1">Tanggal Pelaporan</label>
                        <input id="tanggalPelaporan" type="date" formControlName="tanggalPelaporan" class="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all">
                      </div>
                      <div class="col-span-1 md:col-span-2">
                        <label for="isiLaporan" class="block text-sm font-medium text-neutral-700 mb-1">Isi Laporan</label>
                        <textarea id="isiLaporan" formControlName="isiLaporan" rows="3" class="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"></textarea>
                      </div>
                      <div class="col-span-1 md:col-span-2">
                        <label for="fileUploadPelaporan" class="block text-sm font-medium text-neutral-700 mb-1">Upload Bukti Aduan (Opsional)</label>
                        <input id="fileUploadPelaporan" type="file" accept=".pdf,.jpg,.jpeg,.png" (change)="onFileChange($event)" class="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100">
                        <p class="text-xs text-neutral-500 mt-1">Format: PDF, JPG, JPEG, PNG</p>
                      </div>
                    </div>
                  } @else {
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label for="namaLengkap" class="block text-sm font-medium text-neutral-700 mb-1">Nama Lengkap</label>
                        <input id="namaLengkap" type="text" formControlName="nama" class="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all">
                      </div>
                      <div>
                        <label for="kelasJabatan" class="block text-sm font-medium text-neutral-700 mb-1">Kelas / Jabatan</label>
                        <input id="kelasJabatan" type="text" formControlName="kelas" class="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all">
                      </div>
                      <div class="col-span-1 md:col-span-2">
                        <label for="keperluan" class="block text-sm font-medium text-neutral-700 mb-1">Keperluan</label>
                        <textarea id="keperluan" formControlName="keperluan" rows="3" class="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"></textarea>
                      </div>
                      <div class="col-span-1 md:col-span-2">
                        <label for="fileUploadLainnya" class="block text-sm font-medium text-neutral-700 mb-1">Upload Dokumen Pendukung (Opsional)</label>
                        <input id="fileUploadLainnya" type="file" accept=".pdf,.jpg,.jpeg,.png" (change)="onFileChange($event)" class="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100">
                      </div>
                    </div>
                  }

                  <div class="mt-8 flex justify-end gap-3 pt-4 border-t border-neutral-100">
                    <button type="button" (click)="closeForm()" class="px-6 py-2.5 rounded-xl font-medium text-neutral-600 hover:bg-neutral-100 transition-colors">
                      Batal
                    </button>
                    <button type="submit" [disabled]="formGroup.invalid || isSubmitting()" class="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2.5 rounded-xl font-medium shadow-lg shadow-emerald-200 transition-all disabled:opacity-50 flex items-center gap-2">
                      @if (isSubmitting()) {
                        <span class="material-icons animate-spin text-sm">refresh</span>
                      }
                      Kirim Pengajuan
                    </button>
                  </div>
                </form>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class LandingComponent implements OnInit {
  private router = inject(Router);
  private apiService = inject(ApiService);
  private fb = inject(FormBuilder);

  services = signal<ServiceItem[]>([]);
  showFormModal = signal(false);
  selectedService = signal<ServiceItem | null>(null);
  formGroup!: FormGroup;
  isSubmitting = signal(false);
  submitSuccess = signal(false);
  submitError = signal<string | null>(null);

  isPermohonan = signal(false);
  isPelaporan = signal(false);

  // Visitor Stats Signals
  visitorsToday = signal(142);
  visitorsMonth = signal(3450);
  visitorsYear = signal(15200);
  visitorsOnline = signal(12);

  ngOnInit() {
    this.apiService.getServices().subscribe(data => {
      this.services.set(data);
    });

    // Simulate real-time online visitors fluctuation
    setInterval(() => {
      const current = this.visitorsOnline();
      const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
      let next = current + change;
      if (next < 5) next = 5; // Minimum 5 online
      if (next > 45) next = 45; // Maximum 45 online
      this.visitorsOnline.set(next);
    }, 5000);
  }

  openForm(service: ServiceItem) {
    this.selectedService.set(service);
    this.submitSuccess.set(false);
    
    const permohonanIds = ['permohonan-mou', 'kunjungan'];
    const pelaporanIds = ['laporan-kerusakan', 'peminjaman-barang', 'guru-absen', 'aduan-bolos', 'aduan-kenakalan'];
    
    this.isPermohonan.set(permohonanIds.includes(service.id));
    this.isPelaporan.set(pelaporanIds.includes(service.id));
    
    if (this.isPermohonan()) {
      this.formGroup = this.fb.group({
        namaPemohon: ['', Validators.required],
        asalInstansi: ['', Validators.required],
        tanggalKegiatan: ['', Validators.required],
        isiPermohonan: ['', Validators.required],
        fileUpload: ['']
      });
    } else if (this.isPelaporan()) {
      this.formGroup = this.fb.group({
        namaPelapor: ['', Validators.required],
        tanggalPelaporan: ['', Validators.required],
        isiLaporan: ['', Validators.required],
        fileUpload: ['']
      });
    } else {
      this.formGroup = this.fb.group({
        nama: ['', Validators.required],
        kelas: [''],
        keperluan: ['', Validators.required],
        fileUpload: ['']
      });
    }
    
    this.showFormModal.set(true);
  }

  closeForm() {
    this.showFormModal.set(false);
    this.selectedService.set(null);
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.formGroup.patchValue({
          fileUpload: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  }

  submitForm() {
    if (this.formGroup.valid && this.selectedService()) {
      this.isSubmitting.set(true);
      this.submitError.set(null);
      
      const payload = { ...this.formGroup.value };
      
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            payload.lokasiPelapor = `Lat: ${position.coords.latitude}, Lng: ${position.coords.longitude}`;
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
    this.apiService.submitPublicRequest(this.selectedService()!.id, payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.submitSuccess.set(true);
        setTimeout(() => this.closeForm(), 3000);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.submitError.set('Gagal mengirim pengajuan. Silakan coba lagi.');
      }
    });
  }
}
