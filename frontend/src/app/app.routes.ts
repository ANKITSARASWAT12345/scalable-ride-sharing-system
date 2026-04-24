// src/app/app.routes.ts
// Master routing file — maps URLs to components

import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { roleGuard } from './core/guards/role-guard';
import { guestGuard } from './core/guards/guest-guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home').then(m => m.Home)
  },
  {
    path: 'auth',
    canActivate: [guestGuard],  // logged-in users can't visit auth pages
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login').then(m => m.Login)
          // loadComponent = lazy loading — only downloads this code when user visits the page
          // better performance than loading everything upfront
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register/register').then(m => m.Register)
      }
    ]
  },
  {
    path: 'rider',
    canActivate: [authGuard, roleGuard],  // must be logged in AND be a RIDER
    data: { role: 'RIDER' },              // roleGuard reads this to know which role to check
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/rider/dashboard/rider-dashboard/rider-dashboard')
            .then(m => m.RiderDashboard)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'driver',
    canActivate: [authGuard, roleGuard],
    data: { role: 'DRIVER' },
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/driver/dashboard/driver-dashboard/driver-dashboard')
            .then(m => m.DriverDashboard)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
    // any unknown URL goes to landing page
  }
];
