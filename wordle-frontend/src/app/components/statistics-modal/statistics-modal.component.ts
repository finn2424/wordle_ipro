import { Component, inject, signal, OnInit } from '@angular/core';
import { NgbActiveModal, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { DecimalPipe } from '@angular/common';
import { Api } from '../../api/api';
import { getStats } from '../../api/fn/stats/get-stats';
import { GetStats$Params } from '../../api/fn/stats/get-stats';
import { getAdvancedStats } from '../../api/fn/stats-advanced/get-advanced-stats';
import { SpStatsGetAdvancedResult } from '../../api/models/sp-stats-get-advanced-result';

interface UserStats {
    gamesPlayed: number;
    gamesWon: number;
    winRate: number;
    currentStreak: number;
    maxStreak: number;
    guessDistribution: { guessCount: number; total: number }[];
}

interface AdvancedStats {
    totalGamesPlayed: number;
    totalGamesWon: number;
    globalWinRate: number;
    avgGuessesToWin: number;
    globalGuessDistribution: { guessCount: number; total: number }[];
    topStartingWords: { word: string; count: number }[];
    hardestWords: { word: string; winRate: number; games: number }[];
}

/**
 * Modal displaying user statistics and global analytics.
 * Uses a tabbed layout (NgbNav) to switch between personal stats and global analytics.
 */
@Component({
    selector: 'app-statistics-modal',
    standalone: true,
    imports: [DecimalPipe, NgbNavModule],
    templateUrl: './statistics-modal.component.html',
    styleUrl: './statistics-modal.component.scss'
})
export class StatisticsModalComponent implements OnInit {
    activeModal = inject(NgbActiveModal);
    private api = inject(Api);

    activeTab = 1;

    // Personal stats
    stats = signal<UserStats | null>(null);
    loading = signal<boolean>(true);
    error = signal<string | null>(null);

    // Advanced analytics
    advancedStats = signal<AdvancedStats | null>(null);
    advancedLoading = signal<boolean>(false);
    advancedError = signal<string | null>(null);
    private advancedLoaded = false;

    ngOnInit(): void {
        this.loadStats();
    }

    async loadStats() {
        this.loading.set(true);
        this.error.set(null);
        try {
            let deviceId = localStorage.getItem('deviceId');
            if (!deviceId) {
                deviceId = crypto.randomUUID();
                localStorage.setItem('deviceId', deviceId);
            }

            const params: GetStats$Params = { deviceId };
            const response = await this.api.invoke(getStats, params);

            const generalStats = response.value ? response.value[0] : null;

            if (generalStats) {
                const guessDistribution = [
                    { guessCount: 1, total: generalStats.guess1 || 0 },
                    { guessCount: 2, total: generalStats.guess2 || 0 },
                    { guessCount: 3, total: generalStats.guess3 || 0 },
                    { guessCount: 4, total: generalStats.guess4 || 0 },
                    { guessCount: 5, total: generalStats.guess5 || 0 },
                    { guessCount: 6, total: generalStats.guess6 || 0 }
                ];

                this.stats.set({
                    gamesPlayed: generalStats.gamesPlayed || 0,
                    gamesWon: generalStats.gamesWon || 0,
                    winRate: generalStats.winRate || 0,
                    currentStreak: generalStats.currentStreak || 0,
                    maxStreak: generalStats.maxStreak || 0,
                    guessDistribution: guessDistribution
                });
            }
        } catch (err) {
            console.error('Failed to load stats', err);
            this.error.set('Failed to load statistics.');
        } finally {
            this.loading.set(false);
        }
    }

    /**
     * Lazy-loads advanced analytics when the user switches to the "Global Analytics" tab.
     * Only fetches once per modal open.
     */
    onTabChange(tabId: number) {
        this.activeTab = tabId;
        if (2 === tabId && !this.advancedLoaded) {
            this.loadAdvancedStats();
        }
    }

    async loadAdvancedStats() {
        this.advancedLoading.set(true);
        this.advancedError.set(null);
        try {
            const response = await this.api.invoke(getAdvancedStats);
            const raw: SpStatsGetAdvancedResult = response.value ? response.value[0] : null as any;

            if (raw) {
                // Parse top starting words from flat columns
                const topStartingWords: { word: string; count: number }[] = [];
                for (let i = 1; i <= 10; i++) {
                    const word = (raw as any)[`topWord${i}`];
                    const count = (raw as any)[`topWordCount${i}`];
                    if (word) {
                        topStartingWords.push({ word: word.trim(), count: count || 0 });
                    }
                }

                // Parse hardest words from flat columns
                const hardestWords: { word: string; winRate: number; games: number }[] = [];
                for (let i = 1; i <= 5; i++) {
                    const word = (raw as any)[`hardWord${i}`];
                    const winRate = (raw as any)[`hardWordWinRate${i}`];
                    const games = (raw as any)[`hardWordGames${i}`];
                    if (word) {
                        hardestWords.push({ word: word.trim(), winRate: winRate || 0, games: games || 0 });
                    }
                }

                this.advancedStats.set({
                    totalGamesPlayed: raw.totalGamesPlayed || 0,
                    totalGamesWon: raw.totalGamesWon || 0,
                    globalWinRate: raw.globalWinRate || 0,
                    avgGuessesToWin: raw.avgGuessesToWin || 0,
                    globalGuessDistribution: [
                        { guessCount: 1, total: raw.globalGuess1 || 0 },
                        { guessCount: 2, total: raw.globalGuess2 || 0 },
                        { guessCount: 3, total: raw.globalGuess3 || 0 },
                        { guessCount: 4, total: raw.globalGuess4 || 0 },
                        { guessCount: 5, total: raw.globalGuess5 || 0 },
                        { guessCount: 6, total: raw.globalGuess6 || 0 }
                    ],
                    topStartingWords,
                    hardestWords
                });

                this.advancedLoaded = true;
            }
        } catch (err) {
            console.error('Failed to load advanced stats', err);
            this.advancedError.set('Failed to load analytics.');
        } finally {
            this.advancedLoading.set(false);
        }
    }

    closeModal() {
        this.activeModal.dismiss('Cross click');
    }
}
