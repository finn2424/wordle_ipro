import { TestBed } from '@angular/core/testing';
import { GameService } from './game.service';

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
        expect(service.currentGuess()).toBe('');
        expect(service.gameStatus()).toBe('playing');
    });

    it('should add letters to current guess', () => {
        service.addLetter('A');
        service.addLetter('B');
        expect(service.currentGuess()).toBe('AB');
    });

    it('should not add more than 5 letters', () => {
        service.addLetter('A');
        service.addLetter('B');
        service.addLetter('C');
        service.addLetter('D');
        service.addLetter('E');
        service.addLetter('F');
        expect(service.currentGuess()).toBe('ABCDE');
    });

    it('should remove letters', () => {
        service.addLetter('A');
        service.removeLetter();
        expect(service.currentGuess()).toBe('');
    });

    it('should submit a valid guess', () => {
        service.addLetter('H');
        service.addLetter('E');
        service.addLetter('L');
        service.addLetter('L');
        service.addLetter('O');
        service.submitGuess();
        expect(service.guesses()).toEqual(['HELLO']);
        expect(service.currentGuess()).toBe('');
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
        expect(service.gameStatus()).toBe('won');
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
                expect(service.gameStatus()).toBe('playing');
            }
        }
        expect(service.gameStatus()).toBe('lost');
    });

    describe('calculateValidation', () => {
        it('should return all correct (green) for exact match', () => {
            const result = service.calculateValidation('APPLE', 'APPLE');
            expect(result).toEqual(['correct', 'correct', 'correct', 'correct', 'correct']);
        });

        it('should return all absent (gray) for no matches', () => {
            const result = service.calculateValidation('ABCDE', 'FGHIJ');
            expect(result).toEqual(['absent', 'absent', 'absent', 'absent', 'absent']);
        });

        it('should handle simple present (yellow) cases', () => {
            // Answer: STEAL, Guess: LEAST
            // L: Present (4), E: Present (2), A: Present (3), S: Present (0), T: Present (1)
            // Wait, LEAST vs STEAL
            // L!=S, E!=T, A!=E, S!=A, T!=L. No greens.
            // All present.
            const result = service.calculateValidation('LEAST', 'STEAL');
            expect(result).toEqual(['present', 'present', 'present', 'present', 'present']);
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
            expect(result).toEqual(['correct', 'correct', 'absent', 'absent', 'absent']);
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
            expect(result).toEqual(['present', 'present', 'correct', 'correct', 'absent']);
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
            expect(result).toEqual(['present', 'present', 'absent', 'absent', 'absent']);
        });
    });
});
