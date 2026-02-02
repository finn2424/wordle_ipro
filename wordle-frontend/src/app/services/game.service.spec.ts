import { TestBed } from '@angular/core/testing';
import { GameService } from './game.service';
import { GameStatus, LetterStatus } from '../models/game-types';

describe('GameService', () => {
    let service: GameService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(GameService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should initialize with default state', () => {
        expect(service.guesses()).toEqual([]);
        expect(service.currentGuess()).toEqual(['', '', '', '', '']);
        expect(service.gameStatus()).toBe(GameStatus.PLAYING);
        expect(service.focusedIndex()).toBe(0);
    });

    it('should add letters to current guess', () => {
        service.addLetter('A');
        service.addLetter('B');
        expect(service.currentGuess()).toEqual(['A', 'B', '', '', '']);
        expect(service.focusedIndex()).toBe(2);
    });

    it('should not add more than 5 letters', () => {
        service.addLetter('A');
        service.addLetter('B');
        service.addLetter('C');
        service.addLetter('D');
        service.addLetter('E');
        service.addLetter('F'); // Should just overwrite or do nothing depending on logic at index 4
        // Logic: stops advancing at 4. If at 4 and filled, overwrites?
        // Let's verify logic: min(4, index+1). 
        // 0->A->1->B->2->C->3->D->4->E->4 (clamped to 4).
        // Then add F at 4 -> 'F'.
        expect(service.currentGuess()).toEqual(['A', 'B', 'C', 'D', 'F']);
        expect(service.focusedIndex()).toBe(4);
    });

    it('should remove letters', () => {
        service.addLetter('A');
        // Index is 1. Slot 1 is empty. Backspace should move to 0 and clear it.
        service.removeLetter();
        expect(service.currentGuess()).toEqual(['', '', '', '', '']);
        expect(service.focusedIndex()).toBe(0);
    });

    it('should submit a valid guess', () => {
        service.addLetter('H');
        service.addLetter('E');
        service.addLetter('L');
        service.addLetter('L');
        service.addLetter('O');
        service.submitGuess();
        expect(service.guesses()).toEqual(['HELLO']);
        expect(service.currentGuess()).toEqual(['', '', '', '', '']);
    });

    it('should not submit an invalid guess (length < 5)', () => {
        service.addLetter('H');
        service.submitGuess();
        expect(service.guesses()).toEqual([]);
        expect(service.error()).toBe('Not enough letters');
    });

    it('should detect win condition', () => {
        // Answer is hardcoded to 'WORDL' in service for now
        service.addLetter('W');
        service.addLetter('O');
        service.addLetter('R');
        service.addLetter('D');
        service.addLetter('L');
        service.submitGuess();
        expect(service.gameStatus()).toBe(GameStatus.WON);
    });

    it('should detect loss condition after 6 guesses', () => {
        // Fill 6 wrong guesses
        for (let i = 0; i < 6; i++) {
            service.addLetter('F');
            service.addLetter('A');
            service.addLetter('I');
            service.addLetter('L');
            service.addLetter('S');
            service.submitGuess();
            if (i < 5) {
                expect(service.gameStatus()).toBe(GameStatus.PLAYING);
            }
        }
        expect(service.gameStatus()).toBe(GameStatus.LOST);
    });

    describe('calculateValidation', () => {
        it('should return all correct (green) for exact match', () => {
            const result = service.calculateValidation('APPLE', 'APPLE');
            expect(result).toEqual([LetterStatus.CORRECT, LetterStatus.CORRECT, LetterStatus.CORRECT, LetterStatus.CORRECT, LetterStatus.CORRECT]);
        });

        it('should return all absent (gray) for no matches', () => {
            const result = service.calculateValidation('ABCDE', 'FGHIJ');
            expect(result).toEqual([LetterStatus.ABSENT, LetterStatus.ABSENT, LetterStatus.ABSENT, LetterStatus.ABSENT, LetterStatus.ABSENT]);
        });

        it('should handle simple present (yellow) cases', () => {
            // Answer: STEAL, Guess: LEAST
            // L: Present (4), E: Present (2), A: Present (3), S: Present (0), T: Present (1)
            // Wait, LEAST vs STEAL
            // L!=S, E!=T, A!=E, S!=A, T!=L. No greens.
            // All present.
            const result = service.calculateValidation('LEAST', 'STEAL');
            expect(result).toEqual([LetterStatus.PRESENT, LetterStatus.PRESENT, LetterStatus.PRESENT, LetterStatus.PRESENT, LetterStatus.PRESENT]);
        });

        it('should handle mixed results', () => {
            // Answer: ALARM, Guess: ALLOY
            // A==A(G), L==L(G), L!=A, O!=R, Y!=M
            // Rem Ans: _, _, A, R, M
            // Rem Gue: _, _, L, O, Y
            // L(2): in A,R,M? No -> Gray.
            // O(3): No -> Gray.
            // Y(4): No -> Gray.
            const result = service.calculateValidation('ALLOY', 'ALARM');
            expect(result).toEqual([LetterStatus.CORRECT, LetterStatus.CORRECT, LetterStatus.ABSENT, LetterStatus.ABSENT, LetterStatus.ABSENT]);
        });

        it('should handle double letters correctly (only one present)', () => {
            // Answer: ABBEY, Guess: BABES
            // B(0)!=A, A(1)!=B, B(2)==B(G), E(3)==E(G), S(4)!=Y
            // Rem Ans: A, B, _, _, Y
            // Rem Gue: B, A, _, _, S
            // B(0) in A,B,Y? Yes -> Yellow. Consume B.
            // A(1) in A,Y? Yes -> Yellow. Consume A.
            // S(4) in Y? No -> Gray.
            const result = service.calculateValidation('BABES', 'ABBEY');
            expect(result).toEqual([LetterStatus.PRESENT, LetterStatus.PRESENT, LetterStatus.CORRECT, LetterStatus.CORRECT, LetterStatus.ABSENT]);
        });

        it('should handle double letters correctly (excess in guess)', () => {
            // Answer: ABORT, Guess: BOBBY
            // B!=A, O!=B, B!=O, B!=R, Y!=T. No greens.
            // Rem Ans: A, B, O, R, T
            // Rem Gue: B, O, B, B, Y
            // B(0) in A,B,O,R,T? Yes -> Yellow. Consume B.
            // O(1) in A,O,R,T? Yes -> Yellow. Consume O.
            // B(2) in A,R,T? No -> Gray.
            // B(3) in A,R,T? No -> Gray.
            // Y(4) in A,R,T? No -> Gray.
            const result = service.calculateValidation('BOBBY', 'ABORT');
            expect(result).toEqual([LetterStatus.PRESENT, LetterStatus.PRESENT, LetterStatus.ABSENT, LetterStatus.ABSENT, LetterStatus.ABSENT]);
        });
    });

    describe('Focus Management', () => {
        it('should allow setting focus index', () => {
            service.setFocusedIndex(3);
            expect(service.focusedIndex()).toBe(3);
        });

        it('should allow typing at specific index', () => {
            service.setFocusedIndex(2);
            service.addLetter('X');
            expect(service.currentGuess()).toEqual(['', '', 'X', '', '']);
            expect(service.focusedIndex()).toBe(3);
        });

        it('should clear specific slot on backspace if occupied', () => {
            service.setFocusedIndex(0);
            service.addLetter('A'); // index -> 1
            service.setFocusedIndex(0); // Focus back on 'A'
            service.removeLetter(); // Should clear 'A' and stay at 0
            expect(service.currentGuess()).toEqual(['', '', '', '', '']);
            expect(service.focusedIndex()).toBe(0);
        });
    });
});
