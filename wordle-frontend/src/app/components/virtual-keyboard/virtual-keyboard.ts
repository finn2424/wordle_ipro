import { ChangeDetectionStrategy, Component, output } from '@angular/core';

@Component({
  selector: 'app-virtual-keyboard',
  imports: [],
  templateUrl: './virtual-keyboard.html',
  styleUrl: './virtual-keyboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VirtualKeyboard {
  keyPress = output<string>();

  readonly rows = [
    ['Q', 'W', 'E', 'R', 'T', 'Z', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Enter', 'Y', 'X', 'C', 'V', 'B', 'N', 'M', 'Backspace'],
  ];

  onKey(key: string): void {
    this.keyPress.emit(key);
  }
}
