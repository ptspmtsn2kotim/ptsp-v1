import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NavbarComponent } from '../../components/navbar/navbar.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, NavbarComponent],
  template: `
    <div class="min-h-screen bg-neutral-100 font-sans flex flex-col">
      <app-navbar></app-navbar>

      <div class="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-neutral-200">
          <div class="text-center mb-8">
            <div class="mx-auto h-20 w-20 mb-4">
              <img src="logo.png" alt="Logo MTsN 2 Kotim" class="w-full h-full object-contain" />
            </div>
            <h2 class="text-3xl font-extrabold text-neutral-900">Login Sistem</h2>
            <p class="mt-2 text-sm text-neutral-600">
              Gunakan username dan password Anda
            </p>
          </div>

          <form class="space-y-6" [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <div>
              <label for="username" class="block text-sm font-medium text-neutral-700">Username</label>
              <div class="mt-1">
                <input id="username" type="text" formControlName="username" required
                  class="appearance-none block w-full px-3 py-2 border border-neutral-300 rounded-lg shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm">
              </div>
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-neutral-700">Password</label>
              <div class="mt-1">
                <input id="password" type="password" formControlName="password" required
                  class="appearance-none block w-full px-3 py-2 border border-neutral-300 rounded-lg shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm">
              </div>
            </div>

            @if (errorMsg()) {
              <div class="text-red-600 text-sm text-center bg-red-50 p-2 rounded-md">
                {{ errorMsg() }}
              </div>
            }

            <div>
              <button type="submit" [disabled]="loginForm.invalid || isLoading()"
                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors">
                @if (isLoading()) {
                  <span class="material-icons animate-spin mr-2">refresh</span>
                }
                Masuk
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loginForm = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  isLoading = signal(false);
  errorMsg = signal('');

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      this.errorMsg.set('');
      
      this.authService.login(this.loginForm.value).subscribe({
        next: () => {
          this.isLoading.set(false);
          const returnUrl = this.route.snapshot.queryParams['returnUrl'];
          if (returnUrl) {
            this.router.navigateByUrl(returnUrl);
          }
        },
        error: () => {
          this.isLoading.set(false);
          this.errorMsg.set('Username atau password salah.');
        }
      });
    }
  }
}
