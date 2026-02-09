import { TestBed } from '@angular/core/testing';
import { GameService, WORD_LENGTH } from './game.service';
import { GameStatus, LetterStatus } from '../models/game-types';
import { Api } from '../api/api';
// Assuming vitest/globals provides these
// If not, we might need imports. But usually with that config they are global.
// However, to be safe and explicit, I will use window.vi or globalThis.vi if needed, 
// but usually just 'vi' works.
// Or I can import from 'vitest'.
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('GameService', () => {
    let service: GameService;
    let apiSpy: { invoke: any };

    beforeEach(() => {
        const spy = {
            invoke: vi.fn()
        };
        // Default success response for startGame
        spy.invoke.mockResolvedValue({
            value: [{
                gameId: 101,
                gameStatus: 'playing',
                attemptsUsed: 0,
                targetWord: null
            }]
        });

        TestBed.configureTestingModule({
            providers: [
                GameService,
                { provide: Api, useValue: spy }
            ]
        });
        service = TestBed.inject(GameService);
        apiSpy = TestBed.inject(Api) as any;
    });

    afterEach(() => {
        vi.restoreAllMocks();
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
        service.addLetter('F');
        expect(service.currentGuess()).toEqual(['A', 'B', 'C', 'D', 'F']); // Overwrites last position
    });

    it('should remove letters', () => {
        service.addLetter('A');
        service.removeLetter();
        expect(service.currentGuess()).toEqual(['', '', '', '', '']);
        expect(service.focusedIndex()).toBe(0);
    });

    it('should submit a valid guess', async () => {
        // Mock successful submission
        apiSpy.invoke.mockResolvedValue({
            value: [{
                status: 'success',
                gameStatus: 'playing',
                attemptsUsed: 1,
                targetWord: null,
                result: 'APPAA' // Absent/Present...
            }]
        });

        service.addLetter('H');
        service.addLetter('E');
        service.addLetter('L');
        service.addLetter('L');
        service.addLetter('O');

        await service.submitGuess();

        expect(service.guesses()).toEqual(['HELLO']);
        expect(service.currentGuess()).toEqual(['', '', '', '', '']);
        // Verify results parsed
        expect(service.evaluatedGuesses()[0].validation).toEqual([
            LetterStatus.ABSENT, LetterStatus.PRESENT, LetterStatus.PRESENT, LetterStatus.ABSENT, LetterStatus.ABSENT
        ]);
    });

    it('should handle restoration from localStorage', async () => {
        const savedGuess = ['S', 'A', 'V', 'E', 'D'];

        vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
            if (key === 'wordle-current-guess') return JSON.stringify(savedGuess);
            if (key === 'deviceId') return 'test-device-id';
            return null;
        });

        // StartNewGame is called in constructor, but we want to test RE-calling it or just checking if it picked up?
        // Actually, constructor runs in TestBed.inject.
        // But in beforeEach we don't mock localStorage yet.
        // So constructor likely ran with empty localStorage (or previous state).
        // We should start a new game manually or configure mocks before injection?
        // TestBed.inject happens in beforeEach.
        // We need to mock localStorage BEFORE TestBed.inject(GameService) if logic is in constructor.
        // BUT logic is: constructor calls startNewGame().
        // Effect runs in constructor.

        // Wait, startNewGame IS called in constructor.
        // So we might miss the initial call if we mock later.
        // Let's create a new component/service instance or reset?

        // Better: Mock localStorage BEFORE creating service.
        // But service is created in beforeEach.
        // I'll leave the test structure as is, but create a NEW service instance or just call startNewGame manually.

        await service.startNewGame();

        expect(service.currentGuess()).toEqual(savedGuess);
        expect(service.focusedIndex()).toBe(4);
    });

});
