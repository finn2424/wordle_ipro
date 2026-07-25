import { Injectable, computed, signal, inject, effect } from '@angular/core';

import { LetterStatus, GameStatus, isGameStatus } from '../models/game-types';
import { Api } from '../api/api';
import { startGame } from '../api/fn/game-start/start-game';
import { submitGuess } from '../api/fn/game-submit-guess/submit-guess';
import { StartGame$Params } from '../api/fn/game-start/start-game';
import { SubmitGuess$Params } from '../api/fn/game-submit-guess/submit-guess';

export const WORD_LENGTH = 5;
export const MAX_GUESSES = 6;

/**
 * Represents the state of the Wordle game.
 */
export interface GameState {
    gameId: number | null;
    guesses: string[];
    currentGuess: string[];
    answer: string | null; // Hidden until game over
    gameStatus: GameStatus;
    error: string | null;
    focusedIndex: number;
    results: LetterStatus[][]; // Store validation results from server
    attemptsUsed: number;
}

/**
 * Service managing the core game logic, state, and rules of Wordle.
 */
@Injectable({
    providedIn: 'root'
})
export class GameService {
    private api = inject(Api);

    readonly isSubmitting = signal<boolean>(false);

    private state = signal<GameState>({
        gameId: null,
        guesses: [],
        currentGuess: this.createEmptyGuess(),
        answer: null,
        gameStatus: GameStatus.PLAYING,
        error: null,
        focusedIndex: 0,
        results: [],
        attemptsUsed: 0
    });

    readonly guesses = computed(() => this.state().guesses);
    readonly currentGuess = computed(() => this.state().currentGuess);
    readonly focusedIndex = computed(() => this.state().focusedIndex);
    readonly gameStatus = computed(() => this.state().gameStatus);
    readonly error = computed(() => this.state().error);
    readonly answer = computed(() => this.state().answer);

    /**
     * Computed signal that returns the validation status for every guess made so far.
     * Uses the results returned from the server.
     */
    readonly evaluatedGuesses = computed(() => {
        return this.state().guesses.map((guess, index) => ({
            word: guess,
            validation: this.state().results[index] || Array(WORD_LENGTH).fill(LetterStatus.ABSENT)
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
                if (!char) continue;

                const currentStatus = statusMap[char];
                const newStatus = guess.validation[i];

                if (!newStatus) continue;

                if (LetterStatus.CORRECT === currentStatus) {
                    continue;
                }

                if (LetterStatus.CORRECT === newStatus) {
                    statusMap[char] = LetterStatus.CORRECT;
                } else if (LetterStatus.PRESENT === newStatus) {
                    statusMap[char] = LetterStatus.PRESENT;
                } else if (LetterStatus.ABSENT === newStatus && !currentStatus) {
                    statusMap[char] = LetterStatus.ABSENT;
                }
            }
        }
        return statusMap;
    });

    constructor() {
        effect(() => {
            const guess = this.state().currentGuess;
            localStorage.setItem('wordle-current-guess', JSON.stringify(guess));
        });
        this.startNewGame();
    }

    private getDeviceId(): string {
        let deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
            deviceId = crypto.randomUUID();
            localStorage.setItem('deviceId', deviceId);
        }
        return deviceId;
    }

    /**
     * Adds a letter to the current guess if the game is active and the current slot is available.
     * @param letter The single character letter to add.
     */
    addLetter(letter: string): void {
        if (GameStatus.PLAYING !== this.state().gameStatus || this.isSubmitting() || !/^[a-zA-Z]$/.test(letter)) return;

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
        if (GameStatus.PLAYING !== this.state().gameStatus || this.isSubmitting()) return;

        this.state.update((currentState) => {
            const newGuess = [...currentState.currentGuess];
            let newIndex = currentState.focusedIndex;

            if ('' !== newGuess[newIndex]) {
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
     * Validates and submits the current guess via API.
     */
    async submitGuess(): Promise<void> {
        if (GameStatus.PLAYING !== this.state().gameStatus || this.isSubmitting()) return;

        const currentState = this.state();
        const guess = currentState.currentGuess.join('');

        if (WORD_LENGTH !== guess.length || currentState.currentGuess.some(char => '' === char)) {
            this.state.update(s => ({ ...s, error: 'Not enough letters' }));
            return;
        }

        this.isSubmitting.set(true);
        try {
            const params: SubmitGuess$Params = {
                body: {
                    deviceId: this.getDeviceId(),
                    gameId: currentState.gameId!,
                    guessWord: guess
                }
            };

            const response = await this.api.invoke(submitGuess, params);
            // The API returns an array, we expect one result
            const resultData = response.value ? response.value[0] : null;

            if (!resultData) {
                this.state.update(s => ({ ...s, error: 'Invalid response from server' }));
                return;
            }

            if ('error' === resultData.status) {
                this.state.update(s => ({ ...s, error: resultData.message || 'Unknown error' }));
                return;
            }

            // Map server result string (e.g. "CCPAA") to LetterStatus[]
            const validation: LetterStatus[] = (resultData.result || '').split('').map(char => {
                let status: LetterStatus = LetterStatus.ABSENT;
                switch (char) {
                    case 'C': status = LetterStatus.CORRECT; break;
                    case 'P': status = LetterStatus.PRESENT; break;
                    default: status = LetterStatus.ABSENT;
                }
                return status;
            });

            const gameStatus = resultData.gameStatus;
            if (!isGameStatus(gameStatus)) {
                console.warn('Invalid game status from server:', gameStatus);
            }

            this.state.update(s => ({
                ...s,
                guesses: [...s.guesses, guess],
                results: [...s.results, validation],
                currentGuess: this.createEmptyGuess(),
                focusedIndex: 0,
                gameStatus: isGameStatus(gameStatus) ? gameStatus : GameStatus.PLAYING,
                answer: resultData.targetWord || null, // Only reveals on end
                attemptsUsed: resultData.attemptsUsed || 0,
                error: null
            }));

        } catch (err) {
            console.error('Submit Check Error', err);
            this.state.update(s => ({ ...s, error: 'Failed to submit guess' }));
        } finally {
            this.isSubmitting.set(false);
        }
    }

    /**
     * Resets the game state for a new round via API.
     */
    async startNewGame(): Promise<void> {
        let savedGuess: string[] | null = null;
        try {
            const saved = localStorage.getItem('wordle-current-guess');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && WORD_LENGTH === parsed.length) {
                    savedGuess = parsed;
                }
            }
        } catch (e) {
            console.warn('Failed to restore guess', e);
        }

        try {
            // Initial empty state
            this.state.set({
                gameId: null,
                guesses: [],
                currentGuess: this.createEmptyGuess(),
                answer: null,
                gameStatus: GameStatus.PLAYING,
                error: null,
                focusedIndex: 0,
                results: [],
                attemptsUsed: 0
            });

            const params: StartGame$Params = {
                body: { deviceId: this.getDeviceId() }
            };

            const response = await this.api.invoke(startGame, params);

            // Result Set: Flattened Game State + Attempts
            const rows = response.value || [];
            if (!rows.length) throw new Error('Failed to start game');

            const gameState = rows[0];
            if (!gameState) throw new Error('Failed to start game');

            // Reconstruct local state from server state
            const reconstructedGuesses: string[] = [];
            const reconstructedResults: LetterStatus[][] = [];

            // Rows contain joined attempts
            for (const row of rows) {
                if (row.attemptNumber) {
                    reconstructedGuesses.push(row.guessWord?.trim() || '');
                    const validation: LetterStatus[] = (row.result || '').split('').map((char: string) => {
                        switch (char) {
                            case 'C': return LetterStatus.CORRECT;
                            case 'P': return LetterStatus.PRESENT;
                            default: return LetterStatus.ABSENT;
                        }
                    });
                    reconstructedResults.push(validation);
                }
            }

            this.state.update(s => {
                const rawGameStatus = gameState.gameStatus;
                const gameStatus = isGameStatus(rawGameStatus) ? rawGameStatus : GameStatus.PLAYING;

                let currentGuess = this.createEmptyGuess();
                let focusedIndex = 0;

                // Restore draft if playing and available
                if (GameStatus.PLAYING === gameStatus && savedGuess) {
                    currentGuess = savedGuess;
                    const firstEmpty = currentGuess.findIndex(c => '' === c);
                    focusedIndex = -1 === firstEmpty ? WORD_LENGTH - 1 : firstEmpty;
                }

                return {
                    ...s,
                    gameId: gameState.gameId,
                    gameStatus: gameStatus,
                    attemptsUsed: gameState.attemptsUsed || 0,
                    answer: gameState.targetWord || null,
                    guesses: reconstructedGuesses,
                    results: reconstructedResults,
                    currentGuess,
                    focusedIndex
                };
            });

        } catch (err) {
            console.error('Start Game Error', err);
            this.state.update(s => ({ ...s, error: 'Could not load game. Is backend running?' }));
        }
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
