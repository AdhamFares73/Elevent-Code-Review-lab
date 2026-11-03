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
import { passwordMatchingValidator } from '../../shared/password-matching.validators';
import { InputFormComponent } from '../../shared/input-form/input-form.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  imports: [ReactiveFormsModule, RouterLink, InputFormComponent],
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
  protected isSubmitting = false;
  readonly form = this.fb.group(
    {
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    {
      // TODO 10 ==> Solved
      validators: passwordMatchingValidator(),
    },
  );
  error = '';
  success = '';
  constructor() {
    this.form.statusChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      if (value.toLowerCase() === 'valid') {
        this.isSubmitting = true;
      } else {
        this.isSubmitting = false;
      }
    });
  }
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
  getErrorMessage(field: string): string {
    const control = this.form.get(field);
    if (!control || !control.errors || !control.touched) {
      return '';
    }
    if (control.hasError('required')) {
      return `${field} is required`;
    }
    if (control.hasError('email')) {
      return 'Please enter a valid email address';
    }
    if (control.hasError('pattern') && field === 'password') {
      return 'Must be at least 6 characters ';
    }
    if (control.hasError('minlength')) {
      return `Use at least ${control.errors['minlength'].requiredLength} characters `;
    }

    return '';
  }
}
