import { Injectable, computed, signal } from '@angular/core';

export type LetterStatus = 'correct' | 'present' | 'absent' | 'empty';

export const WORD_LENGTH = 5;
export const MAX_GUESSES = 6;

/**
 * Represents the state of the Wordle game.
 */
export interface GameState {
    guesses: string[];
    currentGuess: string[];
    answer: string;
    gameStatus: 'playing' | 'won' | 'lost';
    error: string | null;
    focusedIndex: number;
}

/**
 * Service managing the core game logic, state, and rules of Wordle.
 */
@Injectable({
    providedIn: 'root'
})
export class GameService {
    private state = signal<GameState>({
        guesses: [],
        currentGuess: this.createEmptyGuess(),
        answer: 'WORDL', // hardcoded for now, will be dynamic later
        gameStatus: 'playing',
        error: null,
        focusedIndex: 0
    });

    readonly guesses = computed(() => this.state().guesses);
    readonly currentGuess = computed(() => this.state().currentGuess);
    readonly focusedIndex = computed(() => this.state().focusedIndex);
    readonly gameStatus = computed(() => this.state().gameStatus);
    readonly error = computed(() => this.state().error);
    readonly answer = computed(() => this.state().answer);

    /**
     * Computed signal that returns the validation status for every guess made so far.
     * Each guess is compared against the answer to determine letter correctness.
     */
    readonly evaluatedGuesses = computed(() => {
        const answer = this.state().answer;
        return this.state().guesses.map(guess => ({
            word: guess,
            validation: this.calculateValidation(guess, answer)
        }));
    });

    /**
     * Computed signal that aggregates the overall status of each letter on the keyboard.
     * Used to color-code the virtual keyboard keys.
     */
    readonly letterStatus = computed(() => {
        const statusMap: { [key: string]: LetterStatus } = {};
        const evaluated = this.evaluatedGuesses();

        for (const guess of evaluated) {
            for (let i = 0; i < guess.word.length; i++) {
                const char = guess.word[i];
                const currentStatus = statusMap[char];
                const newStatus = guess.validation[i];

                if (currentStatus === 'correct') {
                    continue;
                }

                if (newStatus === 'correct') {
                    statusMap[char] = 'correct';
                } else if (newStatus === 'present') {
                    statusMap[char] = 'present';
                } else if (newStatus === 'absent' && !currentStatus) {
                    statusMap[char] = 'absent';
                }
            }
        }
        return statusMap;
    });

    constructor() { }

    /**
     * Adds a letter to the current guess if the game is active and the current slot is available.
     * @param letter The single character letter to add.
     */
    addLetter(letter: string): void {
        if (this.state().gameStatus !== 'playing') return;

        this.state.update((currentState) => {
            const newGuess = [...currentState.currentGuess];
            const currentIndex = currentState.focusedIndex;

            newGuess[currentIndex] = letter.toUpperCase();

            // Advance index, clamping at the last position
            const nextIndex = Math.min(WORD_LENGTH - 1, currentIndex + 1);

            return {
                ...currentState,
                currentGuess: newGuess,
                focusedIndex: nextIndex,
                error: null
            };
        });
    }

    /**
     * Removes the last entered letter from the current guess.
     * Handles both clearing the current slot or moving back to clear the previous one.
     */
    removeLetter(): void {
        if (this.state().gameStatus !== 'playing') return;

        this.state.update((currentState) => {
            const newGuess = [...currentState.currentGuess];
            let newIndex = currentState.focusedIndex;

            if (newGuess[newIndex] !== '') {
                newGuess[newIndex] = '';
            } else {
                newIndex = Math.max(0, newIndex - 1);
                newGuess[newIndex] = '';
            }

            return {
                ...currentState,
                currentGuess: newGuess,
                focusedIndex: newIndex,
                error: null
            };
        });
    }

    /**
     * Validates and submits the current guess.
     * Updates the game state to 'won' or 'lost' based on the result.
     */
    submitGuess(): void {
        if (this.state().gameStatus !== 'playing') return;

        this.state.update((currentState) => {
            const guess = currentState.currentGuess.join('');

            if (guess.length !== WORD_LENGTH || currentState.currentGuess.some(char => char === '')) {
                return { ...currentState, error: 'Not enough letters' };
            }

            // TODO: Add dictionary validation here

            const newGuesses = [...currentState.guesses, guess];
            let newStatus: 'playing' | 'won' | 'lost' = 'playing';

            if (guess === currentState.answer) {
                newStatus = 'won';
            } else if (newGuesses.length >= MAX_GUESSES) {
                newStatus = 'lost';
            }

            return {
                ...currentState,
                guesses: newGuesses,
                currentGuess: this.createEmptyGuess(),
                focusedIndex: 0,
                gameStatus: newStatus,
                error: null,
            };
        });
    }

    /**
     * Resets the game state for a new round.
     */
    startNewGame(): void {
        this.state.set({
            guesses: [],
            currentGuess: this.createEmptyGuess(),
            answer: 'WORDL', // TODO: Pick random word
            gameStatus: 'playing',
            error: null,
            focusedIndex: 0
        });
    }

    /**
     * Determines the status (correct, present, absent) of each letter in a guess.
     * @param guess The word guessed by the player.
     * @param answer The target word.
     * @returns An array of LetterStatus corresponding to each letter in the guess.
     */
    calculateValidation(guess: string, answer: string): LetterStatus[] {
        const result: LetterStatus[] = Array(WORD_LENGTH).fill('absent');
        const answerArr = answer.split('');
        const guessArr = guess.split('');

        // First pass: Identify exact matches (Green)
        for (let i = 0; i < WORD_LENGTH; i++) {
            if (guessArr[i] === answerArr[i]) {
                result[i] = 'correct';
                answerArr[i] = ''; // Mark used in answer
                guessArr[i] = ''; // Mark used in guess
            }
        }

        // Second pass: Identify present but misplaced letters (Yellow)
        for (let i = 0; i < WORD_LENGTH; i++) {
            if (guessArr[i] !== '') {
                const indexInAnswer = answerArr.indexOf(guessArr[i]);
                if (indexInAnswer !== -1) {
                    result[i] = 'present';
                    answerArr[indexInAnswer] = ''; // Consumes the letter from the answer to prevent double counting
                }
            }
        }

        return result;
    }

    /**
     * Manually clears the error state.
     */
    clearError(): void {
        this.state.update((s) => ({ ...s, error: null }));
    }

    /**
     * Sets the focused index of the current guess input.
     * @param index The index to focus (0-4).
     */
    setFocusedIndex(index: number): void {
        if (index < 0 || index >= WORD_LENGTH) return;
        this.state.update(s => ({ ...s, focusedIndex: index }));
    }

    private createEmptyGuess(): string[] {
        return Array(WORD_LENGTH).fill('');
    }
}

