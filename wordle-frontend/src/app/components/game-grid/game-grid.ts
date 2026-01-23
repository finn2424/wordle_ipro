import { Component, computed, input, output } from '@angular/core';
import { LetterStatus } from '../../services/game.service';

@Component({
  selector: 'app-game-grid',
  imports: [],
  templateUrl: './game-grid.html',
  styleUrl: './game-grid.scss'
})
export class GameGrid {
  evaluatedGuesses = input<{ word: string; validation: LetterStatus[] }[]>([]);
  currentGuess = input<string>('');
  error = input<string | null>(null);
  errorCleared = output<void>();

  rows = computed(() => {
    const guesses = this.evaluatedGuesses();
    const current = this.currentGuess();
    const rows: { char: string; status: LetterStatus }[][] = [];

    // Fill completed guesses
    for (const guess of guesses) {
      const row: { char: string; status: LetterStatus }[] = [];
      for (let i = 0; i < 5; i++) {
        row.push({ char: guess.word[i], status: guess.validation[i] });
      }
      rows.push(row);
    }

    // Fill current guess
    if (rows.length < 6) {
      const currentRow: { char: string; status: LetterStatus }[] = [];
      for (let i = 0; i < 5; i++) {
        const char = current[i] || '';
        currentRow.push({ char, status: 'empty' });
      }
      rows.push(currentRow);
    }

    // Fill remaining empty rows
    while (rows.length < 6) {
      const emptyRow: { char: string; status: LetterStatus }[] = [];
      for (let i = 0; i < 5; i++) {
        emptyRow.push({ char: '', status: 'empty' });
      }
      rows.push(emptyRow);
    }

    return rows;
  });
}
