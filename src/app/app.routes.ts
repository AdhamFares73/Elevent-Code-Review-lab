import { Routes } from '@angular/router';
import { HomePage } from './features/home/home';
import { AdminPage } from './features/admin/admin';
import { OrdersPage } from './features/orders/orders';

export const routes: Routes = [
  { path: '', component: HomePage, title: 'Morrow — Everyday, considered' },
  {
    path: 'products',
    loadComponent: () =>
      import('./features/products/products').then((module) => module.ProductsPage),
    title: 'The collection — Morrow',
  },
  {
    path: 'products/:id',
    loadComponent: () =>
      import('./features/products/product-details').then((module) => module.ProductDetailsPage),
    title: 'A considered essential — Morrow',
  },
  {
    path: 'cart',
    loadComponent: () => import('./features/cart/cart').then((module) => module.CartPage),
    title: 'Your bag — Morrow',
  },
  {
    path: 'users',
    loadComponent: () => import('./features/users/users').then((module) => module.UsersPage),
    title: 'Our community — Morrow',
  },
  // TODO 2
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin').then((module) => module.AdminPage),
    title: 'Store overview — Morrow',
  },
  {
    path: 'orders',
    loadComponent: () => import('./features/orders/orders').then((module) => module.OrdersPage),
    title: 'The order book — Morrow',
  },
  // TODO 3
  { path: 'auth', redirectTo: 'auth/login', pathMatch: 'full' },
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login').then((module) => module.LoginPage),
    title: 'Welcome back — Morrow',
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./features/auth/register').then((module) => module.RegisterPage),
    title: 'Join the community — Morrow',
  },
  {
    path: 'auth/forgot-password',
    loadComponent: () => import('./features/auth/recovery').then((module) => module.RecoveryPage),
    data: { step: 0 },
    title: 'A fresh start — Morrow',
  },
  // TODO 4
  {
    path: 'auth/verify-otp',
    loadComponent: () => import('./features/auth/recovery').then((module) => module.RecoveryPage),
    data: { step: 1 },
    title: 'Verify your code — Morrow',
  },
  {
    path: 'auth/reset-password',
    loadComponent: () => import('./features/auth/recovery').then((module) => module.RecoveryPage),
    data: { step: 2 },
    title: 'Refresh your password — Morrow',
  },
  // TODO 5
  {
    path: 'auth/change-password',
    loadComponent: () =>
      import('./features/auth/change-password').then((module) => module.ChangePasswordPage),
    title: 'Account settings — Morrow',
  },
  {
    path: '**',
    loadComponent: () => import('./features/not-found').then((module) => module.NotFoundPage),
    title: 'A little off the path — Morrow',
  },
];
