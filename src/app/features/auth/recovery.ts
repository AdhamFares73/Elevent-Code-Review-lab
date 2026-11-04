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
import { Title } from '@angular/platform-browser';
import { RecoveryState } from '../../core/models';
import { passwordMatchingValidator } from '../../shared/password-matching.validators';
import { InputFormComponent } from '../../shared/input-form/input-form.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonComponent } from '../../shared/button/button.component';

// TODO 9 ==> Solved

@Component({
  imports: [ReactiveFormsModule, RouterLink, InputFormComponent, ButtonComponent],
  templateUrl: './recovery.html',
  styleUrl: './recovery.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class RecoveryPage {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly view = inject(ChangeDetectorRef);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly loading = inject(LoadingService);
  private readonly title = inject(Title);
  protected isSubmittingEmail = false;
  protected isSubmittingCode = false;
  protected isSubmittingPassword = false;
  recovery: RecoveryState = { step: 0, email: '', verified: false };
  readonly emailForm = this.fb.group({ email: ['', [Validators.required, Validators.email]] });
  readonly codeForm = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });
  readonly passwordForm = this.fb.group(
    {
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    {
      // TODO 10 ==> Solved
      validators: passwordMatchingValidator(),
    },
  );
  error = '';
  message = '';
  completed = false;

  constructor() {
    this.updateStep(0);
    const step = Number(this.route.snapshot.data['step'] ?? 0);
    this.recovery.step = step;
    if (step > 0) {
      this.recovery.email = this.route.snapshot.queryParamMap.get('email') ?? 'demo@example.test';
      this.emailForm.controls.email.setValue(this.recovery.email);
    }
    this.emailForm.statusChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      if (value.toLowerCase() === 'valid') {
        this.isSubmittingEmail = true;
      } else {
        this.isSubmittingEmail = false;
      }
    });
    this.codeForm.statusChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      if (value.toLowerCase() === 'valid') {
        this.isSubmittingCode = true;
      } else {
        this.isSubmittingCode = false;
      }
    });
    this.passwordForm.statusChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      if (value.toLowerCase() === 'valid') {
        this.isSubmittingPassword = true;
      } else {
        this.isSubmittingPassword = false;
      }
    });
  }

  requestCode(): void {
    if (this.loading.isLoading()) return;
    this.emailForm.markAllAsTouched();
    if (this.emailForm.invalid) return;

    this.error = '';
    const email = this.emailForm.controls.email.value;
    this.auth.requestCode(email, 'normal').subscribe({
      next: (result) => {
        this.view.markForCheck();
        this.message = result.message;
        this.recovery.email = email;
        this.recovery.verified = false;
        this.updateStep(1);
      },
      error: (error) => {
        this.view.markForCheck();
        this.error = describeAuthError(error);
      },
    });
  }

  verifyCode(): void {
    if (this.loading.isLoading()) return;
    this.codeForm.markAllAsTouched();
    if (this.codeForm.invalid) return;

    this.error = '';
    this.auth
      .verifyCode(
        this.recovery.email,
        this.codeForm.controls.code.value,
        this.route.snapshot.queryParamMap.get('scenario') ?? 'normal',
      )
      .subscribe({
        next: (result) => {
          this.view.markForCheck();
          this.message = result.message;
          this.recovery.verified = true;
          this.updateStep(2);
        },
        error: (error) => {
          this.view.markForCheck();
          this.error = describeAuthError(error);
        },
      });
  }

  resetPassword(): void {
    if (this.loading.isLoading()) return;
    this.passwordForm.markAllAsTouched();
    if (this.passwordForm.invalid) return;
    this.error = '';
    this.auth
      .resetPassword(this.recovery.email, this.passwordForm.controls.password.value, 'normal')
      .subscribe({
        next: (result) => {
          this.view.markForCheck();
          this.message = result.message;
          this.completed = true;
          this.passwordForm.reset();
          this.title.setTitle('Password updated — Morrow');
        },
        error: (error) => {
          this.view.markForCheck();
          this.error = describeAuthError(error);
        },
      });
  }

  back(): void {
    if (this.loading.isLoading()) return;
    this.recovery.step = Math.max(0, this.recovery.step - 1);
    this.error = '';
    this.message = '';
  }
  private updateStep(step: number): void {
    this.recovery.step = step;

    const titles: Record<number, string> = {
      0: 'A fresh start — Morrow',
      1: 'Verify your code — Morrow',
      2: 'Refresh your password — Morrow',
    };

    this.title.setTitle(titles[step]);
  }
  getErrorMessage(field: string): string {
    const control =
      this.codeForm.get(field) || this.emailForm.get(field) || this.passwordForm.get(field);
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
    if (control.hasError('pattern') && field === 'code') {
      return 'Enter exactly six digits.';
    }
    if (control.hasError('minlength')) {
      return `Use at least ${control.errors['minlength'].requiredLength} characters `;
    }

    return '';
  }
}
