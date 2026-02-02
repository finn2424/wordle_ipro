import { ChangeDetectionStrategy, Component, input, output, signal, WritableSignal } from '@angular/core';
import { LetterStatus } from '../../models/game-types';

/**
 * Renders the on-screen virtual keyboard.
 * Handles key presses and displays the validation status of each letter.
 */
@Component({
  selector: 'app-virtual-keyboard',
  imports: [],
  templateUrl: './virtual-keyboard.html',
  styleUrl: './virtual-keyboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VirtualKeyboard {
  protected readonly LetterStatus = LetterStatus;
  keyPress = output<string>();
  letterStatus = input<{ [key: string]: LetterStatus }>({});

  protected pressedKeys: WritableSignal<Set<string>> = signal(new Set());

  readonly rows = [
    ['Q', 'W', 'E', 'R', 'T', 'Z', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Enter', 'Y', 'X', 'C', 'V', 'B', 'N', 'M', 'Backspace'],
  ];

  /**
   * Emits the key press event and triggers visual feedback.
   * @param key The key string that was pressed.
   */
  onKey(key: string): void {
    this.triggerAnimation(key);
    this.keyPress.emit(key);
  }

  /**
   * Temporarily adds the key to the set of pressed keys to trigger CSS animations.
   * Removes the key after a short delay.
   * @param key The key to animate.
   */
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

