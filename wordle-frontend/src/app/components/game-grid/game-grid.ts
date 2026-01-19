import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-game-grid',
  imports: [],
  templateUrl: './game-grid.html',
  styleUrl: './game-grid.scss'
})
export class GameGrid {
  guesses = input<string[]>([]);
  currentGuess = input<string>('');

  rows = computed(() => {
    const guesses = this.guesses();
    const current = this.currentGuess();
    const rows = Array(6).fill('');

    // Fill completed guesses
    for (let i = 0; i < guesses.length; i++) {
      rows[i] = guesses[i];
    }

    // Fill current guess if not already 6 guesses
    if (guesses.length < 6) {
      rows[guesses.length] = current;
    }

    return rows;
  });
}
