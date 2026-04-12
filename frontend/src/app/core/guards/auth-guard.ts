import { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { Auth } from '../services/auth';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(Auth);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;  // allow navigation
  }

  // not logged in — redirect to login page
  router.navigate(['/auth/login']);
  return false;
};
