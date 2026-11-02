import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const changePasswordGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  return localStorage.getItem('demo-account') ? true : router.createUrlTree(['/auth/login']);
};
