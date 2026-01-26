# Feedback

- [ ] Secure endpoints (user should not be able to cheat by accessing an endpoint)
- [ ] Individual field input with field highlighting (user should not be forced to input from left to right)
- [ ] Rewrite this if/else more clean:
     ```typescript
     if (key === 'Enter') {
          this.gameService.submitGuess();
          virtualKey = 'Enter';
        } else if (key === 'Backspace') {
          this.gameService.removeLetter();
          virtualKey = 'Backspace';
        } else if (/^[a-zA-Z]$/.test(key)) {
          this.gameService.addLetter(key);
          virtualKey = key.toUpperCase();
        }
    ```
- [ ] Document code with comments, like GameService
- [ ] Don't check for strings when using types, do it like this instead:
    ```typescript
    export const LetterStatus = {CORRECT: 'correct', PRESENT: 'present', ABSENT: 'absent', EMPTY: 'empty'} as const;
    export type LetterStatus = typeof LetterStatus[keyof typeof LetterStatus];
    ```
- [ ] Reformat code: for example when declaring multiple vars, get start of all words to the same col
- [ ] Make code more typesafe
- [ ] Use `light-dark()` CSS function for dark-mode support
- [ ] Research design patterns and document usage or rewrite to use design-pattern
