import { Injectable, computed, signal } from '@angular/core';

export type LetterStatus = 'correct' | 'present' | 'absent' | 'empty';

export interface GameState {
    guesses: string[];
    currentGuess: string;
    answer: string;
    gameStatus: 'playing' | 'won' | 'lost';
    error: string | null;
}

@Injectable({
    providedIn: 'root'
})
export class GameService {
    // Private writable signal for internal state
    private state = signal<GameState>({
        guesses: [],
        currentGuess: '',
        answer: 'WORDL', // hardcoded for now, will be dynamic later
        gameStatus: 'playing',
        error: null,
    });

    // Public readonly signals for components to consume
    readonly guesses = computed(() => this.state().guesses);
    readonly currentGuess = computed(() => this.state().currentGuess);
    readonly gameStatus = computed(() => this.state().gameStatus);
    readonly error = computed(() => this.state().error);
    readonly answer = computed(() => this.state().answer);

    readonly evaluatedGuesses = computed(() => {
        const answer = this.state().answer;
        return this.state().guesses.map(guess => ({
            word: guess,
            validation: this.calculateValidation(guess, answer)
        }));
    });

    constructor() { }

    /**
     * Adds a letter to the current guess if possible.
     * @param letter The letter to add (should be a single character).
     */
    addLetter(letter: string): void {
        if (this.state().gameStatus !== 'playing') return;

        this.state.update((currentState) => {
            if (currentState.currentGuess.length < 5) {
                return {
                    ...currentState,
                    currentGuess: currentState.currentGuess + letter.toUpperCase(),
                    error: null
                };
            }
            return currentState;
        });
    }

    /**
     * Removes the last letter from the current guess.
     */
    removeLetter(): void {
        if (this.state().gameStatus !== 'playing') return;

        this.state.update((currentState) => {
            if (currentState.currentGuess.length > 0) {
                return {
                    ...currentState,
                    currentGuess: currentState.currentGuess.slice(0, -1),
                    error: null
                };
            }
            return currentState;
        });
    }

    /**
     * Submits the current guess.
     */
    submitGuess(): void {
        if (this.state().gameStatus !== 'playing') return;

        this.state.update((currentState) => {
            const guess = currentState.currentGuess;

            // Basic validation: must be 5 letters
            if (guess.length !== 5) {
                return { ...currentState, error: 'Not enough letters' };
            }

            // TODO: Add dictionary validation here

            const newGuesses = [...currentState.guesses, guess];
            let newStatus: 'playing' | 'won' | 'lost' = 'playing';

            if (guess === currentState.answer) {
                newStatus = 'won';
            } else if (newGuesses.length >= 6) {
                newStatus = 'lost';
            }

            return {
                ...currentState,
                guesses: newGuesses,
                currentGuess: '',
                gameStatus: newStatus,
                error: null,
            };
        });
    }

    /**
     * Resets the game to its initial state.
     */
    startNewGame(): void {
        this.state.set({
            guesses: [],
            currentGuess: '',
            answer: 'WORDL', // TODO: Pick random word
            gameStatus: 'playing',
            error: null,
        });
    }

    /**
     * Calculates the validation state for each letter in a guess against an answer.
     */
    calculateValidation(guess: string, answer: string): LetterStatus[] {
        const result: LetterStatus[] = Array(5).fill('absent');
        const answerArr = answer.split('');
        const guessArr = guess.split('');

        // First pass: Find correct matches (Green)
        for (let i = 0; i < 5; i++) {
            if (guessArr[i] === answerArr[i]) {
                result[i] = 'correct';
                answerArr[i] = ''; // Mark as handled
                guessArr[i] = ''; // Mark as handled
            }
        }

        // Second pass: Find present matches (Yellow)
        for (let i = 0; i < 5; i++) {
            if (guessArr[i] !== '') { // If not already handled (matched)
                const indexInAnswer = answerArr.indexOf(guessArr[i]);
                if (indexInAnswer !== -1) {
                    result[i] = 'present';
                    answerArr[indexInAnswer] = ''; // Mark as handled to handle duplicates correctly
                }
            }
        }

        return result;
    }
}
