import { ChangeDetectorRef, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService, describeAuthError } from './auth-service';
import { LoadingService } from '../../core/loading';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './change-password.html',
  styleUrl: './change-password.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class ChangePasswordPage {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly view = inject(ChangeDetectorRef);
  private readonly fb = inject(FormBuilder).nonNullable;
  readonly loading = inject(LoadingService);

  readonly form = this.fb.group(
    {
      currentPassword: ['', [Validators.required, Validators.minLength(8)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    {
      // TODO 10
      validators: (group: AbstractControl): ValidationErrors | null =>
        group.get('password')?.value === group.get('confirmPassword')?.value
          ? null
          : { passwordMismatch: true },
    },
  );
  accountName = 'Your account';
  error = '';
  success = '';

  constructor() {
    // TODO 8
    this.auth.sessionChanges.subscribe(
      (account) => (this.accountName = account?.name ?? 'Your account'),
    );
  }

  submit(): void {
    if (this.loading.isLoading()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.error = '';
    this.success = '';
    const values = this.form.getRawValue();
    this.auth
      .changePassword(
        values.currentPassword,
        values.password,
        this.route.snapshot.queryParamMap.get('scenario') ?? 'normal',
      )
      .subscribe({
        next: (result) => {
          this.view.markForCheck();
          this.success = result.message;
          this.form.reset();
          // TODO 13
          console.log('Account form completed: password change');
        },
        error: (error) => {
          this.view.markForCheck();
          this.error = describeAuthError(error);
        },
      });
  }
}
