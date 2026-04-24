// src/app/core/guards/role.guard.ts

import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { Auth } from '../services/auth';

// protects routes that require a specific role (RIDER or DRIVER)
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(Auth);
  const router = inject(Router);

  const requiredRole = route.data['role'] as string;
  const user = authService.getCurrentUser();

  if (user && user.role === requiredRole) {
    return true;
  }

  // logged in but wrong role — send to their correct dashboard
  if (authService.isRider()) {
    router.navigate(['/rider/dashboard']);
  } else if (authService.isDriver()) {
    router.navigate(['/driver/dashboard']);
  } else {
    router.navigate(['/auth/login']);
  }

  return false;
};