import { ChangeDetectorRef, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService, DemoAccount, describeAuthError } from './auth-service';
import { LoadingService } from '../../core/loading';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class LoginPage {
  readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly view = inject(ChangeDetectorRef);
  private readonly fb = inject(FormBuilder).nonNullable;
  readonly loading = inject(LoadingService);
  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });
  currentUser: DemoAccount | null = null;
  error = '';
  success = '';

  constructor() {
    // TODO 8
    this.auth.sessionChanges.subscribe((account) => (this.currentUser = account));
  }

  submit(): void {
    if (this.loading.isLoading()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.error = '';
    this.success = '';
    const values = this.form.getRawValue();
    this.auth
      .login(
        values.email,
        values.password,
        this.route.snapshot.queryParamMap.get('scenario') ?? 'normal',
      )
      .subscribe({
        next: (result) => {
          this.view.markForCheck();
          this.success = result.message;
          this.form.controls.password.reset();
          // TODO 13
          console.log('Account form completed: login');
        },
        error: (error) => {
          this.view.markForCheck();
          this.error = describeAuthError(error);
        },
      });
  }
}
