import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink],
  template: `
    <nav class="bg-emerald-800 text-white shadow-md sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <a routerLink="/" class="flex items-center gap-3 group">
              <div class="w-10 h-10 bg-white rounded-full p-0.5 shadow-sm group-hover:shadow-md transition-shadow">
                <img src="logo.png" alt="Logo" class="w-full h-full object-contain rounded-full" />
              </div>
              <div class="flex flex-col">
                <span class="font-bold text-lg leading-tight tracking-tight">PTSP MTsN 2</span>
                <span class="text-xs text-emerald-200 leading-tight">Kotawaringin Timur</span>
              </div>
            </a>
          </div>
          <div class="flex items-center space-x-4">
            @if (authService.currentUser()) {
              <div class="flex items-center gap-4">
                <span class="text-sm text-emerald-100 hidden sm:block">
                  {{ authService.currentUser()?.name }} ({{ authService.currentUser()?.role }})
                </span>
                <button (click)="authService.logout()" class="hover:bg-emerald-700 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Logout
                </button>
              </div>
            } @else {
              <a routerLink="/login" class="bg-white text-emerald-800 hover:bg-emerald-50 px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm">
                Login Sistem
              </a>
            }
          </div>
        </div>
      </div>
    </nav>
  `
})
export class NavbarComponent {
  authService = inject(AuthService);
}
