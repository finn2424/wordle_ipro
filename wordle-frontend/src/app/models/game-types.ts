/**
 * Type-safe game state types for the Wordle application.
 * Uses const assertion pattern to create enum-like types with string values.
 */

/**
 * Represents the validation status of a single letter in a guess.
 * - CORRECT: Letter is in the correct position (green)
 * - PRESENT: Letter is in the word but wrong position (yellow)
 * - ABSENT: Letter is not in the word (gray)
 * - EMPTY: Tile has no letter yet
 */
export const LetterStatus = {
    CORRECT: 'correct',
    PRESENT: 'present',
    ABSENT: 'absent',
    EMPTY: 'empty'
} as const;
export type LetterStatus = typeof LetterStatus[keyof typeof LetterStatus];

/**
 * Represents the current state of the game.
 * - PLAYING: Game is in progress
 * - WON: Player guessed the word correctly
 * - LOST: Player ran out of guesses
 */
export const GameStatus = {
    PLAYING: 'playing',
    WON: 'won',
    LOST: 'lost'
} as const;
export type GameStatus = typeof GameStatus[keyof typeof GameStatus];

export function isGameStatus(value: unknown): value is GameStatus {
    return typeof value === 'string' && Object.values(GameStatus).includes(value as GameStatus);
}
