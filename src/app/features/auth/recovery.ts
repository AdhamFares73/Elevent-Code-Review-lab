import { ChangeDetectorRef, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';

import { AuthService, describeAuthError } from './auth-service';
import { LoadingService } from '../../core/loading';
import { RecoveryState } from '../../core/models';

import { RecoveryEmail } from './recovery-email/recovery-email';
import { RecoveryCode } from './recovery-code/recovery-code';
import { RecoveryResetPassword } from './recovery-reset-password/recovery-reset-password';

@Component({
  imports: [RecoveryEmail, RecoveryCode, RecoveryResetPassword, RouterLink],
  templateUrl: './recovery.html',
  styleUrl: './recovery.scss',
})
export class RecoveryPage {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly view = inject(ChangeDetectorRef);
  protected readonly loading = inject(LoadingService);
  private readonly title = inject(Title);

  recovery: RecoveryState = {
    step: 0,
    email: '',
    verified: false,
  };

  error = '';
  message = '';
  completed = false;

  constructor() {
    const step = Number(this.route.snapshot.data['step'] ?? 0);

    if (step > 0) {
      this.recovery.email = this.route.snapshot.queryParamMap.get('email') ?? 'demo@example.test';
    }

    this.updateStep(step);
  }

  requestCode(email: string): void {
    if (this.loading.isLoading()) return;

    this.error = '';
    this.message = '';
    this.recovery.email = email;

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

  verifyCode(code: string): void {
    if (this.loading.isLoading()) return;

    this.error = '';
    this.message = '';

    this.auth
      .verifyCode(
        this.recovery.email,
        code,
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

  resetPassword(data: { password: string; confirmPassword: string }): void {
    if (this.loading.isLoading()) return;

    this.error = '';
    this.message = '';

    this.auth.resetPassword(this.recovery.email, data.password, 'normal').subscribe({
      next: (result) => {
        this.view.markForCheck();

        this.message = result.message;
        this.completed = true;

        this.updateStep(2);
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

    const previousStep = Math.max(0, this.recovery.step - 1);

    this.error = '';
    this.message = '';

    this.updateStep(previousStep);
  }

  private updateStep(step: number): void {
    this.recovery.step = step;

    const titles: Record<number, string> = {
      0: 'A fresh start — Morrow',
      1: 'Verify your code — Morrow',
      2: 'Refresh your password — Morrow',
    };

    this.title.setTitle(titles[step] ?? titles[0]);
  }
}
