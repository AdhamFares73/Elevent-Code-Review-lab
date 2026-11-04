import {
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService, describeAuthError } from './auth-service';
import { LoadingService } from '../../core/loading';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DemoAccount } from '../../core/models';
import { InputFormComponent } from '../../shared/input-form/input-form.component';
import { ButtonComponent } from '../../shared/button/button.component';

@Component({
  imports: [ReactiveFormsModule, RouterLink, InputFormComponent, ButtonComponent],
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
  protected isSubmitting = false;
  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });
  currentUser: DemoAccount | null = null;
  error = '';
  success = '';

  constructor() {
    // TODO 8 ==> Solved
    // this.auth.sessionChanges.subscribe((account) => (this.currentUser = account));
    this.auth.sessionChanges.pipe(takeUntilDestroyed()).subscribe((account) => {
      this.currentUser = account;
    });
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
          localStorage.setItem(
            'demo-account',
            result.account ? JSON.stringify(result.account) : '',
          );
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
    if (control.hasError('minlength')) {
      return `Use at least ${control.errors['minlength'].requiredLength} characters `;
    }
    return '';
  }
}
