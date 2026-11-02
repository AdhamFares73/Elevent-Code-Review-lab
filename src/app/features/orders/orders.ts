import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CatalogApi } from '../../core/catalog-api';
import { Customer, Order, readScenario } from '../../core/models';
import { StatusPanel } from '../../shared/status-panel';
import { Pagination } from '../../shared/pagination';

@Component({
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule, StatusPanel, Pagination],
  templateUrl: './orders.html',
})
export class OrdersPage {
  private readonly api = inject(CatalogApi);
  private readonly route = inject(ActivatedRoute);
  private readonly view = inject(ChangeDetectorRef);
  customers: Customer[] = [];
  // TODO 7 ==> Solved
  orders: Order[] = [];
  loading = true;
  readonly status = new FormControl('All', { nonNullable: true });
  readonly page = signal(1);
  readonly pageSize = 20;

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(() => this.load());
    this.status.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.load());
  }

  load(): void {
    this.page.set(1);
    this.loading = true;
    this.view.markForCheck();
    this.api.users().subscribe({
      next: (customers) => {
        this.customers = customers;
        this.api.orders(readScenario(this.route.snapshot.queryParamMap.get('scenario'))).subscribe({
          next: (orders) => {
            this.orders = orders.map((order) => ({
              ...order,
              customer: this.customers.find((customer) => customer.id === order.userId)!,
            }));
            this.loading = false;
            this.view.markForCheck();
          },
          error: () => {
            this.orders = [];
            this.loading = false;
            this.view.markForCheck();
          },
        });
      },
      error: () => {
        this.loading = false;
        this.view.markForCheck();
      },
    });
  }

  get visibleOrders(): any[] {
    return this.orders.filter(
      (order) => this.status.value === 'All' || order.status === this.status.value,
    );
  }

  get pagedOrders(): any[] {
    const start = (this.page() - 1) * this.pageSize;
    return this.visibleOrders.slice(start, start + this.pageSize);
  }
}
