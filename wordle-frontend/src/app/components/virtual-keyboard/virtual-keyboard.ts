import { ChangeDetectionStrategy, Component, input, output, signal, WritableSignal } from '@angular/core';
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

  protected pressedKeys: WritableSignal<Set<string>> = signal(new Set());

  readonly rows = [
    ['Q', 'W', 'E', 'R', 'T', 'Z', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Enter', 'Y', 'X', 'C', 'V', 'B', 'N', 'M', 'Backspace'],
  ];

  onKey(key: string): void {
    this.triggerAnimation(key);
    this.keyPress.emit(key);
  }

  triggerAnimation(key: string) {
    this.pressedKeys.update(keys => {
      const newKeys = new Set(keys);
      newKeys.add(key);
      return newKeys;
    });

    setTimeout(() => {
      this.pressedKeys.update(keys => {
        const newKeys = new Set(keys);
        newKeys.delete(key);
        return newKeys;
      });
    }, 150);
  }
}
