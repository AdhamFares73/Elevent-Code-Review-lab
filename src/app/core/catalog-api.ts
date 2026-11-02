import {
  HttpClient,
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpResponse,
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, delay, of, throwError, timer, mergeMap } from 'rxjs';
import { Customer, Order, Product, Scenario } from './models';

export const mockLatencyInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith('/mock-api/')) return next(request);
  const scenario = request.params.get('scenario');
  if (scenario === 'error') {
    return timer(450).pipe(
      mergeMap(() =>
        throwError(
          () =>
            new HttpErrorResponse({
              status: 503,
              statusText: 'Service unavailable',
              url: request.url,
              error: { message: 'We could not reach the store. Please try again.' },
            }),
        ),
      ),
    );
  }
  if (scenario === 'empty') {
    return of(new HttpResponse({ status: 200, body: [] })).pipe(delay(450));
  }
  return next(request).pipe(delay(450));
};

@Injectable({ providedIn: 'root' })
export class CatalogApi {
  private readonly http = inject(HttpClient);
  products(scenario: Scenario = 'normal'): Observable<Product[]> {
    return this.http.get<Product[]>('/mock-api/products.json', { params: { scenario } });
  }
  users(scenario: Scenario = 'normal'): Observable<Customer[]> {
    return this.http.get<Customer[]>('/mock-api/users.json', { params: { scenario } });
  }
  // TODO 7 ==> Solved
  orders(scenario: Scenario = 'normal'): Observable<Order[]> {
    return this.http.get<Order[]>('/mock-api/orders.json', { params: { scenario } });
  }
}
