import { HttpInterceptorFn } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { finalize } from 'rxjs';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loaderService = inject(LoadingService);

  loaderService.loader();

  return next(req).pipe(
    finalize(() => {
      loaderService.loader();
    }),
  );
};

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly loading = signal(false);

  readonly isLoading = computed(() => this.loading());

  loader(): void {
    this.loading.update((value) => !value);
  }
}
