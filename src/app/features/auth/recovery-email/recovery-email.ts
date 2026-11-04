import { Component, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonComponent } from '../../../shared/button/button.component';
import { InputFormComponent } from '../../../shared/input-form/input-form.component';

@Component({
  imports: [ReactiveFormsModule, ButtonComponent, InputFormComponent],
  selector: 'app-recovery-email',
  styleUrl: './recovery-email.scss',
  templateUrl: './recovery-email.html',
})
export class RecoveryEmail {
  readonly loading = input(false);
  readonly error = input('');

  readonly submitted = output<string>();

  private readonly fb = inject(FormBuilder);

  readonly emailForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  submit(): void {
    this.emailForm.markAllAsTouched();

    if (this.emailForm.invalid || this.loading()) return;

    this.submitted.emit(this.emailForm.getRawValue().email!);
  }

  getErrorMessage(field: string): string {
    const control = this.emailForm.get(field);

    if (!control || !control.errors || !control.touched) return '';

    if (control.hasError('required')) return 'Email is required';
    if (control.hasError('email')) return 'Enter a valid email address';

    return '';
  }
}
