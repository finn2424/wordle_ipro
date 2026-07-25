import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { DecimalPipe } from '@angular/common';
import { StatisticsModalComponent } from './statistics-modal.component';
import { Api } from '../../api/api';

describe('StatisticsModalComponent', () => {
    let component: StatisticsModalComponent;
    let fixture: ComponentFixture<StatisticsModalComponent>;
    let mockActiveModal: { dismiss: ReturnType<typeof vi.fn>; close: ReturnType<typeof vi.fn> };
    let mockApi: { invoke: ReturnType<typeof vi.fn> };

    const statsResponse = {
        value: [{
            gamesPlayed: 10,
            gamesWon: 8,
            winRate: 80,
            currentStreak: 3,
            maxStreak: 5,
            guess1: 1,
            guess2: 2,
            guess3: 3,
            guess4: 2,
            guess5: 1,
            guess6: 1,
        }],
    };

    const advancedStatsResponse = {
        value: [{
            totalGamesPlayed: 100,
            totalGamesWon: 80,
            globalWinRate: 80,
            avgGuessesToWin: 3.5,
            globalGuess1: 5,
            globalGuess2: 10,
            globalGuess3: 20,
            globalGuess4: 25,
            globalGuess5: 15,
            globalGuess6: 5,
            topWord1: 'CRANE',
            topWordCount1: 15,
            topWord2: 'SLATE',
            topWordCount2: 10,
            hardWord1: 'JAZZY',
            hardWordWinRate1: 30,
            hardWordGames1: 20,
        }],
    };

    beforeEach(async () => {
        mockActiveModal = {
            dismiss: vi.fn(),
            close: vi.fn(),
        };

        mockApi = {
            invoke: vi.fn().mockResolvedValue(statsResponse),
        };

        vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('test-device-id');

        await TestBed.configureTestingModule({
            imports: [StatisticsModalComponent],
            providers: [
                { provide: NgbActiveModal, useValue: mockActiveModal },
                { provide: Api, useValue: mockApi },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(StatisticsModalComponent);
        component = fixture.componentInstance;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load stats on init and populate stats signal', async () => {
        // ngOnInit triggers loadStats()
        fixture.detectChanges();

        // Wait for the async loadStats call to resolve
        await fixture.whenStable();

        const stats = component.stats();
        expect(stats).toBeTruthy();
        expect(stats!.gamesPlayed).toBe(10);
        expect(stats!.gamesWon).toBe(8);
        expect(stats!.winRate).toBe(80);
        expect(stats!.currentStreak).toBe(3);
        expect(stats!.maxStreak).toBe(5);
        expect(stats!.guessDistribution.length).toBe(6);
        expect(stats!.guessDistribution[0]).toEqual({ guessCount: 1, total: 1 });
        expect(stats!.guessDistribution[2]).toEqual({ guessCount: 3, total: 3 });
    });

    it('should set error signal when stats API fails', async () => {
        mockApi.invoke.mockRejectedValue(new Error('Network error'));

        fixture.detectChanges();
        await fixture.whenStable();

        expect(component.error()).toBe('Failed to load statistics.');
        expect(component.stats()).toBeNull();
    });

    it('should set loading to false after stats load completes', async () => {
        fixture.detectChanges();
        await fixture.whenStable();

        expect(component.loading()).toBe(false);
    });

    it('should set activeTab without loading advanced stats when switching to tab 1', () => {
        component.onTabChange(1);

        expect(component.activeTab).toBe(1);
        // invoke was only called for the initial loadStats, not for advanced
        expect(mockApi.invoke).toHaveBeenCalledTimes(0); // not yet triggered because ngOnInit hasn't run
    });

    it('should trigger loadAdvancedStats when switching to tab 2', async () => {
        mockApi.invoke.mockResolvedValue(advancedStatsResponse);

        component.onTabChange(2);
        await new Promise(resolve => setTimeout(resolve, 20));

        const advanced = component.advancedStats();
        expect(advanced).toBeTruthy();
        expect(advanced!.totalGamesPlayed).toBe(100);
        expect(advanced!.avgGuessesToWin).toBe(3.5);
        expect(advanced!.topStartingWords.length).toBe(2);
        expect(advanced!.topStartingWords[0]).toEqual({ word: 'CRANE', count: 15 });
        expect(advanced!.hardestWords.length).toBe(1);
        expect(advanced!.hardestWords[0]).toEqual({ word: 'JAZZY', winRate: 30, games: 20 });
    });

    it('should only load advanced stats once when switching to tab 2 multiple times', async () => {
        mockApi.invoke.mockResolvedValue(advancedStatsResponse);
        await new Promise(resolve => setTimeout(resolve, 20));
        mockApi.invoke.mockClear();

        component.onTabChange(2);
        await new Promise(resolve => setTimeout(resolve, 20));

        expect(mockApi.invoke).toHaveBeenCalledTimes(1);

        // Switch to tab 2 again
        component.onTabChange(2);
        await new Promise(resolve => setTimeout(resolve, 20));

        // Should NOT have made another API call
        expect(mockApi.invoke).toHaveBeenCalledTimes(1);
    });

    it('should call activeModal.dismiss when closeModal is called', () => {
        component.closeModal();

        expect(mockActiveModal.dismiss).toHaveBeenCalledWith('Cross click');
    });
});
