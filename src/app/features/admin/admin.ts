import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import _ from 'lodash';
import { CatalogApi } from '../../core/catalog-api';
import { Customer, Order, Product, readScenario } from '../../core/models';
import { StatusPanel } from '../../shared/status-panel';

interface OrderRow {
  id: number;
  userId: number;
  date: string;
  status: string;
  total: number;
  items: { productId: number; quantity: number; price: number }[];
}

@Component({
  imports: [CurrencyPipe, DatePipe, DecimalPipe, ReactiveFormsModule, RouterLink, StatusPanel],
  templateUrl: './admin.html',
})
export class AdminPage {
  private readonly api = inject(CatalogApi);
  private readonly route = inject(ActivatedRoute);
  private readonly view = inject(ChangeDetectorRef);
  readonly period = new FormControl('30', { nonNullable: true });
  readonly category = new FormControl('All', { nonNullable: true });
  products: Product[] = [];
  customers: Customer[] = [];
  orders: Order[] = [];
  loading = true;
  error = false;
  reportMessage = '';
  private readonly reportDate = new Date('2026-10-26T23:59:59Z');

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(() => this.load());
  }

  load(normal = false): void {
    this.loading = true;
    this.error = false;
    this.view.markForCheck();
    const scenario = normal
      ? 'normal'
      : readScenario(this.route.snapshot.queryParamMap.get('scenario'));
    forkJoin({
      products: this.api.products(scenario),
      users: this.api.users(scenario),
      orders: this.api.orders(scenario),
    }).subscribe({
      next: (result) => {
        this.products = result.products;
        this.customers = result.users;
        // TODO 7 ==> Solved
        this.orders = result.orders;
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

  getOrdersInPeriod(): OrderRow[] {
    const cutoff = new Date(this.reportDate);
    cutoff.setUTCDate(cutoff.getUTCDate() - Number(this.period.value));
    return this.orders.filter((order) => {
      const inDateRange = new Date(order.date).getTime() >= cutoff.getTime();
      if (this.category.value === 'All') return inDateRange;
      return (
        inDateRange &&
        order.items.some(
          (item) =>
            this.products.find((product) => product.id === item.productId)?.category ===
            this.category.value,
        )
      );
    });
  }

  getRevenue(): number {
    const completed = this.getOrdersInPeriod().filter((order) => order.status !== 'Cancelled');
    return _.sumBy(completed, 'total');
  }

  getAverageOrder(): number {
    const orders = this.getOrdersInPeriod().filter((order) => order.status !== 'Cancelled');
    return orders.length ? this.getRevenue() / orders.length : 0;
  }

  getCustomersInPeriod(): number {
    return _.uniq(this.getOrdersInPeriod().map((order) => order.userId)).length;
  }

  getPendingCount(): number {
    return this.getOrdersInPeriod().filter((order) => order.status === 'Processing').length;
  }

  getRevenueChart(): { label: string; value: number; height: number }[] {
    const orders = this.getOrdersInPeriod().filter((order) => order.status !== 'Cancelled');
    const numberOfDays = Number(this.period.value);
    const buckets = Array.from({ length: 8 }, (unused, index) => {
      const start = new Date(this.reportDate);
      start.setUTCDate(start.getUTCDate() - numberOfDays + Math.floor((index * numberOfDays) / 8));
      const end = new Date(this.reportDate);
      end.setUTCDate(
        end.getUTCDate() - numberOfDays + Math.floor(((index + 1) * numberOfDays) / 8),
      );
      const value = _.sumBy(
        orders.filter((order) => {
          const date = new Date(order.date).getTime();
          return date > start.getTime() && date <= end.getTime();
        }),
        'total',
      );
      return {
        label: end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
        value,
        height: 0,
      };
    });
    const maximum = Math.max(...buckets.map((bucket) => bucket.value), 1);
    return buckets.map((bucket) => ({
      ...bucket,
      height: Math.max(3, (bucket.value / maximum) * 100),
    }));
  }

  getCategorySales(): { name: string; value: number; percent: number; color: string }[] {
    const sales = this.getOrdersInPeriod()
      .filter((order) => order.status !== 'Cancelled')
      .flatMap((order) =>
        order.items.map((item) => ({
          category:
            this.products.find((product) => product.id === item.productId)?.category ?? 'Other',
          amount: item.price * item.quantity,
        })),
      );
    const groups = _.groupBy(sales, 'category');
    const total = _.sumBy(sales, 'amount') || 1;
    const colors = ['#315945', '#8ba789', '#d5b382', '#9cabc0'];
    return Object.entries(groups)
      .map(([name, rows], index) => ({
        name,
        value: _.sumBy(rows, 'amount'),
        percent: Math.round((_.sumBy(rows, 'amount') / total) * 100),
        color: colors[index % colors.length]!,
      }))
      .sort((a, b) => b.value - a.value);
  }

  getPopularProducts(): { product: Product; quantity: number }[] {
    const entries = this.getOrdersInPeriod()
      .filter((order) => order.status !== 'Cancelled')
      .flatMap((order) => order.items);
    const grouped = _.groupBy(entries, 'productId');
    return Object.entries(grouped)
      .map(([id, items]) => ({
        product: this.products.find((product) => product.id === Number(id)),
        quantity: _.sumBy(items, 'quantity'),
      }))
      .filter((entry): entry is { product: Product; quantity: number } => !!entry.product)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 4);
  }

  getRecentOrders(): OrderRow[] {
    return [...this.getOrdersInPeriod()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  }

  customerName(id: number): string {
    return this.customers.find((customer) => customer.id === id)?.name ?? 'Guest';
  }

  downloadReport(): void {
    const header = 'Order,Date,Status,Total';
    const rows = this.getOrdersInPeriod().map((order) =>
      [order.id, order.date, order.status, order.total.toFixed(2)].join(','),
    );
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'morrow-orders.csv';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.reportMessage = 'Your report is ready. A little clarity, to go.';
  }
}
