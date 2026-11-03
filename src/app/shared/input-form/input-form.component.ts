import { Component, forwardRef, Input } from '@angular/core';
import { FormControl, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-input-form',
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './input-form.component.html',
  styleUrl: './input-form.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputFormComponent),
      multi: true,
    },
  ],
})
export class InputFormComponent {
  @Input() labelName: string = '';
  @Input({ required: true }) type: 'text' | 'password' | 'email' | 'number' = 'text';
  @Input() placeholder: string = '';
  @Input({ required: true }) forId: string = '';
  @Input() inputValue = '';
  @Input() errorMessage: string = '';
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    this.inputValue = value ?? '';
  }
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.inputValue = input.value;
    this.onChange(this.inputValue);
  }

  onBlur(): void {
    this.onTouched();
  }
}
