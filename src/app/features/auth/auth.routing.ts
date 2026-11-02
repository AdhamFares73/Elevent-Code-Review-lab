import { Routes, RouterModule } from '@angular/router';

export const AuthRoutes: Routes = [
  { path: 'auth', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./login').then((module) => module.LoginPage),
    title: 'Welcome back — Morrow',
  },
  {
    path: 'register',
    loadComponent: () => import('./register').then((module) => module.RegisterPage),
    title: 'Join the community — Morrow',
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./recovery').then((module) => module.RecoveryPage),
    title: 'A fresh start — Morrow',
  },
];
