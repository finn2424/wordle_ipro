
export const LetterStatus = {
    CORRECT: 'correct',
    PRESENT: 'present',
    ABSENT: 'absent',
    EMPTY: 'empty'
} as const;
export type LetterStatus = typeof LetterStatus[keyof typeof LetterStatus];

export const GameStatus = {
    PLAYING: 'playing',
    WON: 'won',
    LOST: 'lost'
} as const;
export type GameStatus = typeof GameStatus[keyof typeof GameStatus];
