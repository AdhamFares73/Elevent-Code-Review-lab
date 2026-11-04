import { Component, inject, input, output } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { passwordMatchingValidator } from '../../../shared/password-matching.validators';
import { ButtonComponent } from '../../../shared/button/button.component';
import { InputFormComponent } from '../../../shared/input-form/input-form.component';
@Component({
  imports: [ReactiveFormsModule, ButtonComponent, InputFormComponent],
  selector: 'app-recovery-reset-password',
  styleUrl: './recovery-reset-password.scss',
  templateUrl: './recovery-reset-password.html',
})
export class RecoveryResetPassword {
  readonly loading = input(false);
  readonly error = input('');

  readonly submitted = output<{ password: string; confirmPassword: string }>();
  readonly backClicked = output<void>();

  private readonly fb = inject(FormBuilder);

  readonly passwordForm = this.fb.group(
    {
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordMatchingValidator() },
  );

  submit(): void {
    this.passwordForm.markAllAsTouched();

    if (this.passwordForm.invalid || this.loading()) return;

    this.submitted.emit(
      this.passwordForm.getRawValue() as {
        password: string;
        confirmPassword: string;
      },
    );
  }

  getErrorMessage(field: string): string {
    const control = this.passwordForm.get(field);

    if (!control || !control.errors || !control.touched) return '';

    if (control.hasError('required')) return 'Password is required';
    if (control.hasError('minlength')) return 'Password must be at least 8 characters';

    return '';
  }

  get confirmPasswordError(): string {
    const control = this.passwordForm.get('confirmPassword');

    if (!control?.touched) return '';

    if (control.hasError('required')) return 'Confirm Password is required';

    return this.passwordForm.hasError('passwordMismatch') ? "Your passwords don't match." : '';
  }
}
