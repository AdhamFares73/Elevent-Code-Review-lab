import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-button',
  imports: [],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  @Input({ required: true }) type: 'button' | 'submit' | 'reset' = 'button';
  @Input({ required: true }) value: string = '';
  @Input() isDisabled: boolean = false;
  @Output() onClicked = new EventEmitter();

  clicked(event: any) {
    this.onClicked.emit(event);
  }
}
