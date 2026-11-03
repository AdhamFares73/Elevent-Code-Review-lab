import {
  HttpClient,
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpResponse,
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, delay, mergeMap, of, tap, throwError, timer } from 'rxjs';
import { DemoAccount, DemoAuthResult } from '../../core/models';

// TODO 9 ==> Solved

export function describeAuthError(error: HttpErrorResponse): string {
  return typeof error.error?.message === 'string'
    ? error.error.message
    : 'Something interrupted your request. Please try again.';
}

export const mockAuthInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith('/mock-api/auth/')) return next(request);
  const body = (request.body ?? {}) as Record<string, unknown>;
  const email = typeof body['email'] === 'string' ? body['email'] : 'demo@example.test';
  const name = typeof body['name'] === 'string' ? body['name'] : 'Morrow member';
  const action = request.url.split('/').pop();
  if (request.params.get('scenario') === 'error' || email === 'fail@example.test') {
    return timer(450).pipe(
      mergeMap(() =>
        throwError(
          () =>
            new HttpErrorResponse({
              status: 503,
              statusText: 'Service unavailable',
              url: request.url,
              error: { message: 'Account services are taking a moment. Please try again.' },
            }),
        ),
      ),
    );
  }
  if (action === 'verify-code' && body['code'] !== '123456') {
    return timer(450).pipe(
      mergeMap(() =>
        throwError(
          () =>
            new HttpErrorResponse({
              status: 422,
              statusText: 'Invalid code',
              url: request.url,
              error: { message: 'That code does not match. Please try again.' },
            }),
        ),
      ),
    );
  }
  const messages: Record<string, string> = {
    login: 'Welcome back. Make yourself at home.',
    register: 'Your demo account is ready. Welcome to Morrow.',
    'request-code': 'Your recovery request is ready.',
    'verify-code': 'Code verified. Choose a new password.',
    'reset-password': 'Your demo password reset is complete.',
    'change-password': 'Your demo password change is complete.',
  };
  const response: DemoAuthResult = {
    message: messages[action ?? ''] ?? 'Your request is complete.',
  };
  if (action === 'login' || action === 'register') response.account = { name, email };
  return of(new HttpResponse({ status: 200, body: response })).pipe(delay(450));
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly session = new BehaviorSubject<DemoAccount | null>(null);
  readonly sessionChanges = this.session.asObservable();

  login(email: string, password: string, scenario = 'normal') {
    return this.http
      .post<DemoAuthResult>('/mock-api/auth/login', { email, password }, { params: { scenario } })
      .pipe(tap((result) => this.session.next(result.account ?? null)));
  }

  register(name: string, email: string, password: string, scenario = 'normal') {
    return this.http
      .post<DemoAuthResult>(
        '/mock-api/auth/register',
        { name, email, password },
        { params: { scenario } },
      )
      .pipe(tap((result) => this.session.next(result.account ?? null)));
  }

  requestCode(email: string, scenario = 'normal') {
    return this.http.post<DemoAuthResult>(
      '/mock-api/auth/request-code',
      { email },
      { params: { scenario } },
    );
  }

  verifyCode(email: string, code: string, scenario = 'normal') {
    return this.http.post<DemoAuthResult>(
      '/mock-api/auth/verify-code',
      { email, code },
      { params: { scenario } },
    );
  }

  resetPassword(email: string, password: string, scenario = 'normal') {
    return this.http.post<DemoAuthResult>(
      '/mock-api/auth/reset-password',
      { email, password },
      { params: { scenario } },
    );
  }

  changePassword(currentPassword: string, password: string, scenario = 'normal') {
    return this.http.post<DemoAuthResult>(
      '/mock-api/auth/change-password',
      { currentPassword, password },
      { params: { scenario } },
    );
  }

  signOut(): void {
    this.session.next(null);
    localStorage.removeItem('demo-account');
  }
}
