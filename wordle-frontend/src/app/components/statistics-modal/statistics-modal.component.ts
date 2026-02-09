import { Component, inject, signal, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Api } from '../../api/api';
import { getStats } from '../../api/fn/stats/get-stats';
import { GetStats$Params } from '../../api/fn/stats/get-stats';

interface UserStats {
    gamesPlayed: number;
    gamesWon: number;
    winRate: number;
    currentStreak: number;
    maxStreak: number;
    guessDistribution: { guessCount: number; total: number }[];
}

import { DecimalPipe } from '@angular/common';

@Component({
    selector: 'app-statistics-modal',
    standalone: true,
    imports: [DecimalPipe],
    templateUrl: './statistics-modal.component.html',
    styleUrl: './statistics-modal.component.scss'
})
export class StatisticsModalComponent implements OnInit {
    activeModal = inject(NgbActiveModal);
    private api = inject(Api);

    stats = signal<UserStats | null>(null);
    loading = signal<boolean>(true);
    error = signal<string | null>(null);

    ngOnInit(): void {
        this.loadStats();
    }

    async loadStats() {
        this.loading.set(true);
        this.error.set(null);
        try {
            const deviceId = localStorage.getItem('deviceId');
            if (!deviceId) throw new Error('No User ID found');

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

    closeModal() {
        this.activeModal.dismiss('Cross click');
    }
}
