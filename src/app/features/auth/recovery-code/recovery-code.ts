import { Component, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonComponent } from '../../../shared/button/button.component';
import { InputFormComponent } from '../../../shared/input-form/input-form.component';
@Component({
  imports: [ReactiveFormsModule, ButtonComponent, InputFormComponent],
  selector: 'app-recovery-code',
  styleUrl: './recovery-code.scss',
  templateUrl: './recovery-code.html',
})
export class RecoveryCode {
  readonly email = input.required<string>();
  readonly loading = input(false);
  readonly error = input('');

  readonly submitted = output<string>();
  readonly backClicked = output<void>();

  private readonly fb = inject(FormBuilder);

  readonly codeForm = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  submit(): void {
    this.codeForm.markAllAsTouched();

    if (this.codeForm.invalid || this.loading()) return;

    this.submitted.emit(this.codeForm.getRawValue().code!);
  }

  getErrorMessage(field: string): string {
    const control = this.codeForm.get(field);

    if (!control || !control.errors || !control.touched) return '';

    if (control.hasError('required')) return 'Verification code is required';
    if (control.hasError('pattern')) return 'Enter a valid 6-digit code';

    return '';
  }
}
