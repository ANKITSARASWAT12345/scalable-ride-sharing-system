// src/app/core/guards/guest.guard.ts
// Prevents logged-in users from seeing login/register pages

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';
export const guestGuard: CanActivateFn = () => {
  const authService = inject(Auth);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return true;  // not logged in — show login/register page
  }

  // already logged in — redirect to their dashboard
  const user = authService.getCurrentUser();
  if (user?.role === 'RIDER') {
    router.navigate(['/rider/dashboard']);
  } else {
    router.navigate(['/driver/dashboard']);
  }
  return false;
};