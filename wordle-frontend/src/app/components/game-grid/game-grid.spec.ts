import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { GameGrid } from './game-grid';
import { LetterStatus } from '../../models/game-types';
import { WORD_LENGTH, MAX_GUESSES } from '../../services/game.service';

describe('GameGrid', () => {
    let component: GameGrid;
    let fixture: ComponentFixture<GameGrid>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GameGrid],
        }).compileComponents();

        fixture = TestBed.createComponent(GameGrid);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('rows computed signal', () => {
        it('should return MAX_GUESSES rows with WORD_LENGTH columns in empty state', () => {
            const rows = component.rows();
            expect(rows.length).toBe(MAX_GUESSES);

            for (const row of rows) {
                expect(row.length).toBe(WORD_LENGTH);
            }
        });

        it('should have all EMPTY status tiles with empty chars in initial state', () => {
            const rows = component.rows();
            // First row is the current guess row — should have empty chars
            for (const tile of rows[0]!) {
                expect(tile.char).toBe('');
                expect(tile.status).toBe(LetterStatus.EMPTY);
            }
        });

        it('should correctly render evaluated guesses with validation statuses', () => {
            const guesses = [
                {
                    word: 'HELLO',
                    validation: [
                        LetterStatus.CORRECT,
                        LetterStatus.PRESENT,
                        LetterStatus.ABSENT,
                        LetterStatus.ABSENT,
                        LetterStatus.CORRECT,
                    ],
                },
            ];

            fixture.componentRef.setInput('evaluatedGuesses', guesses);
            fixture.detectChanges();

            const rows = component.rows();
            // First row should be the evaluated guess
            expect(rows[0]![0]!).toEqual({ char: 'H', status: LetterStatus.CORRECT });
            expect(rows[0]![1]!).toEqual({ char: 'E', status: LetterStatus.PRESENT });
            expect(rows[0]![2]!).toEqual({ char: 'L', status: LetterStatus.ABSENT });
            expect(rows[0]![3]!).toEqual({ char: 'L', status: LetterStatus.ABSENT });
            expect(rows[0]![4]!).toEqual({ char: 'O', status: LetterStatus.CORRECT });

            // Second row should be the current guess (empty)
            for (const tile of rows[1]!) {
                expect(tile.status).toBe(LetterStatus.EMPTY);
            }
        });

        it('should show current guess in the active row', () => {
            fixture.componentRef.setInput('currentGuess', ['A', 'B', '', '', '']);
            fixture.detectChanges();

            const rows = component.rows();
            // No evaluated guesses, so row 0 is the current guess
            expect(rows[0]![0]!.char).toBe('A');
            expect(rows[0]![1]!.char).toBe('B');
            expect(rows[0]![2]!.char).toBe('');
        });

        it('should fill remaining rows as empty after guesses', () => {
            const guesses = [
                { word: 'ABCDE', validation: Array(WORD_LENGTH).fill(LetterStatus.ABSENT) },
                { word: 'FGHIJ', validation: Array(WORD_LENGTH).fill(LetterStatus.ABSENT) },
            ];

            fixture.componentRef.setInput('evaluatedGuesses', guesses);
            fixture.detectChanges();

            const rows = component.rows();
            expect(rows.length).toBe(MAX_GUESSES);

            // Rows 0-1: evaluated guesses
            expect(rows[0]![0]!.char).toBe('A');
            expect(rows[1]![0]!.char).toBe('F');

            // Row 2: current guess (empty)
            expect(rows[2]![0]!.status).toBe(LetterStatus.EMPTY);

            // Rows 3-5: empty filler rows
            for (let i = 3; i < MAX_GUESSES; i++) {
                for (const tile of rows[i]!) {
                    expect(tile.char).toBe('');
                    expect(tile.status).toBe(LetterStatus.EMPTY);
                }
            }
        });
    });

    describe('onTileClick', () => {
        it('should emit focusRequest when clicking on the current active row', () => {
            const emitSpy = vi.spyOn(component.focusRequest, 'emit');

            // No evaluated guesses, so current row is index 0
            component.onTileClick(0, 2);

            expect(emitSpy).toHaveBeenCalledWith(2);
        });

        it('should NOT emit when clicking on a past guess row', () => {
            const guesses = [
                { word: 'ABCDE', validation: Array(WORD_LENGTH).fill(LetterStatus.ABSENT) },
            ];
            fixture.componentRef.setInput('evaluatedGuesses', guesses);
            fixture.detectChanges();

            const emitSpy = vi.spyOn(component.focusRequest, 'emit');

            // Row 0 is a past guess, current row is now index 1
            component.onTileClick(0, 2);

            expect(emitSpy).not.toHaveBeenCalled();
        });

        it('should NOT emit when clicking on a future empty row', () => {
            const emitSpy = vi.spyOn(component.focusRequest, 'emit');

            // No guesses, current row is 0. Row 3 is a future empty row
            component.onTileClick(3, 1);

            expect(emitSpy).not.toHaveBeenCalled();
        });
    });
});
