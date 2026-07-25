import { Component, computed, input, output } from '@angular/core';
import { WORD_LENGTH, MAX_GUESSES } from '../../services/game.service';
import { LetterStatus } from '../../models/game-types';

/**
 * Renders the 6x5 grid of guesses.
 * Displays past guesses with their validation colors and the current active guess.
 */
@Component({
  selector: 'app-game-grid',
  imports: [],
  templateUrl: './game-grid.html',
  styleUrl: './game-grid.scss'
})
export class GameGrid {
  protected readonly LetterStatus = LetterStatus;
  evaluatedGuesses = input<{ word: string; validation: LetterStatus[] }[]>([]);
  currentGuess = input<string[]>([]);
  focusedIndex = input<number>(0);
  error = input<string | null>(null);
  errorCleared = output<void>();
  focusRequest = output<number>();

  /**
   * Computed signal that transforms the game state into a complete 6x5 grid for rendering.
   */
  rows = computed(() => {
    const guesses = this.evaluatedGuesses();
    const current = this.currentGuess();
    const rows: { char: string; status: LetterStatus }[][] = [];

    // 1. Add completed attempts
    for (const guess of guesses) {
      const row: { char: string; status: LetterStatus }[] = [];
      for (let i = 0; i < WORD_LENGTH; i++) {
        row.push({
          char: guess.word[i] ?? '',
          status: guess.validation[i] ?? LetterStatus.EMPTY
        });
      }
      rows.push(row);
    }

    // 2. Add current attempt
    if (rows.length < MAX_GUESSES) {
      const currentRow: { char: string; status: LetterStatus }[] = [];
      for (let i = 0; i < WORD_LENGTH; i++) {
        const char = current[i] || '';
        currentRow.push({ char, status: LetterStatus.EMPTY });
      }
      rows.push(currentRow);
    }

    // 3. Fill remaining rows
    while (rows.length < MAX_GUESSES) {
      const emptyRow: { char: string; status: LetterStatus }[] = [];
      for (let i = 0; i < WORD_LENGTH; i++) {
        emptyRow.push({ char: '', status: LetterStatus.EMPTY });
      }
      rows.push(emptyRow);
    }

    return rows;
  });

  /**
   * Handles clicks on individual tiles to requests focus on that specific letter position.
   * Only allows interaction with the current active row.
   * @param rowIndex Index of the row clicked.
   * @param colIndex Index of the column/letter clicked.
   */
  onTileClick(rowIndex: number, colIndex: number) {
    if (this.evaluatedGuesses().length === rowIndex) {
      this.focusRequest.emit(colIndex);
    }
  }
}

