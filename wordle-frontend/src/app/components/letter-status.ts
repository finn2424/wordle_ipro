
export const LetterStatus = {CORRECT: 'correct', PRESENT: 'present', ABSENT: 'absent', EMPTY: 'empty'} as const;

export type LetterStatus = typeof LetterStatus[keyof typeof LetterStatus];