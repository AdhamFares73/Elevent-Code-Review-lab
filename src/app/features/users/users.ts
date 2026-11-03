import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { interval } from 'rxjs';
import { CatalogApi } from '../../core/catalog-api';
import { Customer, readScenario } from '../../core/models';
import { StatusPanel } from '../../shared/status-panel';
import { Pagination } from '../../shared/pagination';

@Component({
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule, StatusPanel, Pagination],
  templateUrl: './users.html',
})
export class UsersPage {
  private readonly api = inject(CatalogApi);
  private readonly route = inject(ActivatedRoute);
  private readonly view = inject(ChangeDetectorRef);
  users: Customer[] = [];
  loading = true;
  error = false;
  lastSync = new Date();
  readonly search = new FormControl('', { nonNullable: true });
  readonly page = signal(1);
  readonly pageSize = 20;

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(() => this.load());
    this.search.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.page.set(1);
      this.view.markForCheck();
    });
    // TODO 8 ==> Solved
    interval(10000)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.lastSync = new Date();
        this.view.markForCheck();
      });
  }

  load(normal = false): void {
    this.page.set(1);
    this.loading = true;
    this.error = false;
    this.view.markForCheck();
    this.api
      .users(normal ? 'normal' : readScenario(this.route.snapshot.queryParamMap.get('scenario')))
      .subscribe({
        next: (users) => {
          this.users = users;
          this.loading = false;
          this.view.markForCheck();
        },
        error: () => {
          this.error = true;
          this.loading = false;
          this.view.markForCheck();
        },
      });
  }
  get visibleUsers(): Customer[] {
    const search = this.search.value.trim().toLowerCase();
    return this.users.filter((user) =>
      (user.name + ' ' + user.email + ' ' + user.city).toLowerCase().includes(search),
    );
  }

  get pagedUsers(): Customer[] {
    const start = (this.page() - 1) * this.pageSize;
    return this.visibleUsers.slice(start, start + this.pageSize);
  }
}
