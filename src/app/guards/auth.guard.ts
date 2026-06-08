import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.token()) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  const userRole = authService.currentUser()?.role;
  const expectedRole = route.data['role'];

  if (expectedRole && expectedRole !== userRole && userRole !== 'Admin') {
    // Basic role check, could be more robust
    if (expectedRole === 'Siswa' && userRole !== 'Siswa') {
      router.navigate(['/dashboard/verifikator']);
      return false;
    } else if (expectedRole === 'Verifikator' && userRole === 'Siswa') {
      router.navigate(['/dashboard/siswa']);
      return false;
    } else if (expectedRole === 'Admin' && userRole !== 'Admin') {
      if (userRole === 'Siswa') {
        router.navigate(['/dashboard/siswa']);
      } else {
        router.navigate(['/dashboard/verifikator']);
      }
      return false;
    }
  }

  return true;
};
