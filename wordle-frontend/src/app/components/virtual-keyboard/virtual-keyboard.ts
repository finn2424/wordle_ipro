import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LetterStatus } from '../../services/game.service';

@Component({
  selector: 'app-virtual-keyboard',
  imports: [],
  templateUrl: './virtual-keyboard.html',
  styleUrl: './virtual-keyboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VirtualKeyboard {
  keyPress = output<string>();
  letterStatus = input<{ [key: string]: LetterStatus }>({});

  readonly rows = [
    ['Q', 'W', 'E', 'R', 'T', 'Z', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Enter', 'Y', 'X', 'C', 'V', 'B', 'N', 'M', 'Backspace'],
  ];

  onKey(key: string): void {
    this.keyPress.emit(key);
  }
}
