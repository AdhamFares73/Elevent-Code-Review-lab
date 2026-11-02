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

// TODO 9
interface RecoveryState {
  step: number;
  email: string;
  verified: boolean;
}

@Component({
  imports: [ReactiveFormsModule, RouterLink],
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
      // TODO 10
      validators: (group: AbstractControl): ValidationErrors | null =>
        group.get('password')?.value === group.get('confirmPassword')?.value
          ? null
          : { passwordMismatch: true },
    },
  );
  error = '';
  message = '';
  completed = false;

  constructor() {
    const step = Number(this.route.snapshot.data['step'] ?? 0);
    this.recovery.step = step;
    if (step > 0) {
      this.recovery.email = this.route.snapshot.queryParamMap.get('email') ?? 'demo@example.test';
      this.emailForm.controls.email.setValue(this.recovery.email);
    }
  }

  requestCode(): void {
    if (this.loading.isLoading()) return;
    this.emailForm.markAllAsTouched();
    if (this.emailForm.invalid) return;

    this.error = '';
    const email = this.emailForm.controls.email.value;
    this.auth
      .requestCode(email, this.route.snapshot.queryParamMap.get('scenario') ?? 'normal')
      .subscribe({
        next: (result) => {
          this.view.markForCheck();
          this.message = result.message;
          this.recovery.email = email;
          this.recovery.step = 1;
          this.recovery.verified = false;
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
          this.recovery.step = 2;
          // TODO 13
          console.log('Account recovery moved to password step');
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
      .resetPassword(
        this.recovery.email,
        this.passwordForm.controls.password.value,
        this.route.snapshot.queryParamMap.get('scenario') ?? 'normal',
      )
      .subscribe({
        next: (result) => {
          this.view.markForCheck();
          this.message = result.message;
          this.completed = true;
          this.passwordForm.reset();
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
}
