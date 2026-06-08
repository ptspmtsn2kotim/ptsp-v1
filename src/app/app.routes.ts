import {Routes} from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { LoginComponent } from './pages/login/login.component';
import { SiswaDashboardComponent } from './pages/dashboard/siswa/siswa-dashboard.component';
import { VerifikatorDashboardComponent } from './pages/dashboard/verifikator/verifikator-dashboard.component';
import { AdminDashboardComponent } from './pages/dashboard/admin/admin-dashboard.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard/siswa', component: SiswaDashboardComponent, canActivate: [authGuard], data: { role: 'Siswa' } },
  { path: 'dashboard/siswa/form/:serviceId', component: SiswaDashboardComponent, canActivate: [authGuard], data: { role: 'Siswa' } },
  { path: 'dashboard/verifikator', component: VerifikatorDashboardComponent, canActivate: [authGuard], data: { role: 'Verifikator' } },
  { path: 'dashboard/admin', component: AdminDashboardComponent, canActivate: [authGuard], data: { role: 'Admin' } },
  { path: '**', redirectTo: '' }
];
