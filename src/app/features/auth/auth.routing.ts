import { Routes, RouterModule } from '@angular/router';
import { changePasswordGuard } from '../../core/guards/change-password-guard';

export const AuthRoutes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
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
  {
    path: 'change-password',
    loadComponent: () => import('./change-password').then((module) => module.ChangePasswordPage),
    canActivate: [changePasswordGuard],
    title: 'Account settings — Morrow',
  },
];
