import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { mockLatencyInterceptor } from './core/catalog-api';
import { withInMemoryScrolling } from '@angular/router';
import { mockAuthInterceptor } from './features/auth/auth-service';
import { loadingInterceptor } from './core/loading';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(
      withInterceptors([loadingInterceptor, mockAuthInterceptor, mockLatencyInterceptor]),
    ),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })),
  ],
};
