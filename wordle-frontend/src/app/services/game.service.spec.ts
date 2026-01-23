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
});
