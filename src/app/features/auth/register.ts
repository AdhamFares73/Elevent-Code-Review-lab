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
  templateUrl: './register.html',
  styleUrl: './register.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly view = inject(ChangeDetectorRef);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly loading = inject(LoadingService);

  readonly form = this.fb.group(
    {
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
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
  error = '';
  success = '';

  submit(): void {
    if (this.loading.isLoading()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.error = '';
    this.success = '';
    const values = this.form.getRawValue();
    this.auth
      .register(
        values.name,
        values.email,
        values.password,
        this.route.snapshot.queryParamMap.get('scenario') ?? 'normal',
      )
      .subscribe({
        next: (result) => {
          this.view.markForCheck();
          this.success = result.message;
          this.form.controls.password.reset();
          this.form.controls.confirmPassword.reset();
          // TODO 13
          console.log('Account form completed: registration');
        },
        error: (error) => {
          this.view.markForCheck();
          this.error = describeAuthError(error);
        },
      });
  }
}
