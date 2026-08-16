import { GameStatus } from '../store.js';

export class Modals {
    constructor(store, api) {
        this.store = store;
        this.api = api;
        this.element = document.createElement('div');
        this.element.className = 'modals-container';

        this.renderInstructionsModal();
        this.renderStatsModal();
        this.renderGameOverModal();

        this.store.subscribe((state) => this.checkGameOver(state));
    }

    renderInstructionsModal() {
        const modal = document.createElement('kol-dialog');
        modal.id = 'modal-instructions';
        modal.setAttribute('_variant', 'blank');
        modal.setAttribute('_width', '450px');
        modal.innerHTML = `
            <div class="modal-content-custom">
                <div class="modal-header-custom">
                    <h2 class="modal-title-custom">HOW TO PLAY</h2>
                    <button id="btn-instructions-close" class="modal-close-custom">✕</button>
                </div>
                <div class="modal-body-custom">
                    <p class="modal-subtitle-custom">Guess the word in 6 tries.</p>
                    <ul class="modal-list-custom">
                        <li>Each guess must be a valid 5-letter word.</li>
                        <li>The color of the tiles will change to show how close your guess was to the word.</li>
                    </ul>
                    
                    <h5 class="modal-examples-title">Examples</h5>
                    
                    <div class="modal-example">
                        <div class="modal-tiles">
                            <div class="modal-cell" data-state="correct">W</div>
                            <div class="modal-cell">E</div>
                            <div class="modal-cell">A</div>
                            <div class="modal-cell">R</div>
                            <div class="modal-cell">Y</div>
                        </div>
                        <p><strong>W</strong> is in the word and in the correct spot.</p>
                    </div>

                    <div class="modal-example">
                        <div class="modal-tiles">
                            <div class="modal-cell">P</div>
                            <div class="modal-cell" data-state="present">I</div>
                            <div class="modal-cell">L</div>
                            <div class="modal-cell">L</div>
                            <div class="modal-cell">S</div>
                        </div>
                        <p><strong>I</strong> is in the word but in the wrong spot.</p>
                    </div>

                    <div class="modal-example">
                        <div class="modal-tiles">
                            <div class="modal-cell">V</div>
                            <div class="modal-cell">A</div>
                            <div class="modal-cell">G</div>
                            <div class="modal-cell" data-state="absent">U</div>
                            <div class="modal-cell">E</div>
                        </div>
                        <p><strong>U</strong> is not in the word in any spot.</p>
                    </div>
                </div>
            </div>
        `;

        modal.querySelector('#btn-instructions-close').addEventListener('click', () => {
            modal.close();
        });

        this.element.appendChild(modal);
    }

    renderStatsModal() {
        const modal = document.createElement('kol-dialog');
        modal.id = 'modal-stats';
        modal.setAttribute('_variant', 'blank');
        modal.setAttribute('_width', '450px');
        modal.innerHTML = `
            <div class="modal-content-custom">
                <div class="modal-header-custom">
                    <h2 class="modal-title-custom" style="width: 100%; text-align: center;">STATISTICS</h2>
                    <button id="btn-stats-close" class="modal-close-custom" style="position: absolute; right: 1.5rem;">✕</button>
                </div>
                <div class="modal-body-custom" id="stats-content">
                    <div style="text-align: center; margin-top: 1rem;">Loading...</div>
                </div>
            </div>
        `;

        modal.querySelector('#btn-stats-close').addEventListener('click', () => {
            modal.close();
        });

        this.element.appendChild(modal);
    }

    renderGameOverModal() {
        const modal = document.createElement('kol-dialog');
        modal.id = 'modal-game-over';
        modal.setAttribute('_label', 'Game Over');
        modal.setAttribute('_variant', 'card');
        modal.setAttribute('_width', '400px');
        modal.innerHTML = `
            <div id="game-over-content">
            </div>
            <div style="margin-top: 1rem; text-align: right;">
                <kol-button id="btn-play-again" _label="Play Again" _variant="primary"></kol-button>
            </div>
        `;

        modal.querySelector('#btn-play-again').addEventListener('click', () => {
            modal.close();
            this.store.startNewGame();
        });

        this.element.appendChild(modal);
    }

    openInstructions() {
        document.getElementById('modal-instructions').showModal();
    }

    async openStats() {
        const modal = document.getElementById('modal-stats');
        modal.showModal();

        const content = modal.querySelector('#stats-content');
        content.innerHTML = '<div style="text-align: center; margin-top: 1rem;">Loading...</div>';

        try {
            const [statsRes, advancedRes] = await Promise.all([
                this.api.getStats().catch(() => ({ value: [{}] })),
                this.api.getAdvancedStats().catch(() => ({ value: [{}] }))
            ]);
            const data = statsRes.value[0] || {};
            const adv = advancedRes.value[0] || {};

            const distribution = [
                data.guess1 || 0, data.guess2 || 0, data.guess3 || 0,
                data.guess4 || 0, data.guess5 || 0, data.guess6 || 0
            ];
            const maxVal = Math.max(1, ...distribution);

            const globalDistribution = [
                adv.globalGuess1 || 0, adv.globalGuess2 || 0, adv.globalGuess3 || 0,
                adv.globalGuess4 || 0, adv.globalGuess5 || 0, adv.globalGuess6 || 0
            ];
            const maxGlobalVal = Math.max(1, ...globalDistribution);

            const topStartingWords = [];
            for (let i = 1; i <= 10; i++) {
                if (adv[`topWord${i}`]) topStartingWords.push({ word: adv[`topWord${i}`], count: adv[`topWordCount${i}`] || 0 });
            }
            const hardestWords = [];
            for (let i = 1; i <= 5; i++) {
                if (adv[`hardWord${i}`]) hardestWords.push({ word: adv[`hardWord${i}`], winRate: adv[`hardWordWinRate${i}`] || 0, games: adv[`hardWordGames${i}`] || 0 });
            }

            content.innerHTML = `
                <div style="display: flex; justify-content: center; margin-bottom: 2rem;">
                    <div style="display: inline-flex; border: 1px solid #d3d6da; border-radius: 20px; overflow: hidden; font-size: 0.75rem; font-weight: bold; cursor: pointer;">
                        <div id="tab-btn-personal" style="padding: 6px 16px; background: #fff; color: #000; border-right: 1px solid #d3d6da;">YOUR STATS</div>
                        <div id="tab-btn-global" style="padding: 6px 16px; background: #f8f9fa; color: #878a8c;">GLOBAL ANALYTICS</div>
                    </div>
                </div>

                <div id="tab-content-personal">
                    <div style="display: flex; gap: 1rem; justify-content: center; text-align: center; margin-bottom: 2rem;">
                        <div style="flex: 1;">
                            <div style="font-size: 2rem; font-weight: bold; line-height: 1;">${data.gamesPlayed || 0}</div>
                            <div style="font-size: 0.75rem; margin-top: 4px;">Played</div>
                        </div>
                        <div style="flex: 1;">
                            <div style="font-size: 2rem; font-weight: bold; line-height: 1;">${Math.round(data.winRate) || 0}</div>
                            <div style="font-size: 0.75rem; margin-top: 4px;">Win %</div>
                        </div>
                        <div style="flex: 1;">
                            <div style="font-size: 2rem; font-weight: bold; line-height: 1;">${data.currentStreak || 0}</div>
                            <div style="font-size: 0.75rem; margin-top: 4px; padding: 0 5px;">Current<br>Streak</div>
                        </div>
                        <div style="flex: 1;">
                            <div style="font-size: 2rem; font-weight: bold; line-height: 1;">${data.maxStreak || 0}</div>
                            <div style="font-size: 0.75rem; margin-top: 4px; padding: 0 5px;">Max<br>Streak</div>
                        </div>
                    </div>
                    
                    <h5 style="font-size: 0.9rem; font-weight: bold; margin-bottom: 1rem; text-transform: uppercase;">Guess Distribution</h5>
                    
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        ${distribution.map((val, i) => {
                const widthPct = Math.max(7, Math.round((val / maxVal) * 100));
                const bgColor = val > 0 ? '#198754' : '#787c7e';
                return `
                                <div style="display: flex; align-items: center; font-size: 0.85rem; font-weight: bold;">
                                    <div style="width: 15px; text-align: left;">${i + 1}</div>
                                    <div style="flex: 1; margin-left: 5px;">
                                        <div style="background-color: ${bgColor}; color: white; padding: 2px 8px; text-align: right; min-width: 1.5rem; width: ${widthPct}%;">
                                            ${val}
                                        </div>
                                    </div>
                                </div>
                            `;
            }).join('')}
                    </div>
                </div>

                <div id="tab-content-global" style="display: none;">
                    <div style="display: flex; gap: 1rem; justify-content: center; text-align: center; margin-bottom: 2rem;">
                        <div style="flex: 1;">
                            <div style="font-size: 2rem; font-weight: bold; line-height: 1;">${(adv.avgGuessesToWin || 0).toFixed(1)}</div>
                            <div style="font-size: 0.75rem; margin-top: 4px;">Avg. Guesses<br>to Win</div>
                        </div>
                        <div style="flex: 1;">
                            <div style="font-size: 2rem; font-weight: bold; line-height: 1;">${adv.totalGamesPlayed || 0}</div>
                            <div style="font-size: 0.75rem; margin-top: 4px;">Total<br>Games</div>
                        </div>
                        <div style="flex: 1;">
                            <div style="font-size: 2rem; font-weight: bold; line-height: 1;">${Math.round(adv.globalWinRate || 0)}</div>
                            <div style="font-size: 0.75rem; margin-top: 4px;">Global<br>Win %</div>
                        </div>
                    </div>

                    ${topStartingWords.length ? `
                    <h5 style="font-size: 0.9rem; font-weight: bold; margin-bottom: 1rem; text-transform: uppercase;">Top Starting Words</h5>
                    <div style="margin-bottom: 1.5rem;">
                        ${topStartingWords.map((item, i) => `
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-size: 0.85rem;">
                                <span style="width: 20px;">${i + 1}.</span>
                                <span style="font-weight: bold; text-transform: uppercase; width: 50px;">${item.word}</span>
                                <span style="flex: 1; background: #e9ecef; border-radius: 4px; overflow: hidden; height: 12px;">
                                    <div style="background: #6c757d; height: 100%; width: ${(item.count / topStartingWords[0].count) * 100}%;"></div>
                                </span>
                                <span style="color: #6c757d; font-size: 0.8rem; width: 30px; text-align: right;">${item.count}</span>
                            </div>
                        `).join('')}
                    </div>
                    ` : ''}

                    ${hardestWords.length ? `
                    <h5 style="font-size: 0.9rem; font-weight: bold; margin-bottom: 1rem; text-transform: uppercase;">Hardest Words</h5>
                    <div style="margin-bottom: 1.5rem;">
                        ${hardestWords.map((item, i) => `
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-size: 0.85rem;">
                                <span style="width: 20px;">${i + 1}.</span>
                                <span style="font-weight: bold; text-transform: uppercase; width: 50px;">${item.word}</span>
                                <span style="color: #6c757d; font-size: 0.8rem;">${Math.round(item.winRate)}% win &middot; ${item.games} games</span>
                            </div>
                        `).join('')}
                    </div>
                    ` : ''}

                    <h5 style="font-size: 0.9rem; font-weight: bold; margin-bottom: 1rem; text-transform: uppercase;">Global Guess Distribution</h5>
                    
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        ${globalDistribution.map((val, i) => {
                const widthPct = Math.max(7, Math.round((val / maxGlobalVal) * 100));
                const bgColor = val > 0 ? '#198754' : '#787c7e';
                return `
                                <div style="display: flex; align-items: center; font-size: 0.85rem; font-weight: bold;">
                                    <div style="width: 15px; text-align: left;">${i + 1}</div>
                                    <div style="flex: 1; margin-left: 5px;">
                                        <div style="background-color: ${bgColor}; color: white; padding: 2px 8px; text-align: right; min-width: 1.5rem; width: ${widthPct}%;">
                                            ${val}
                                        </div>
                                    </div>
                                </div>
                            `;
            }).join('')}
                    </div>
                </div>
            `;

            const btnPersonal = content.querySelector('#tab-btn-personal');
            const btnGlobal = content.querySelector('#tab-btn-global');
            const contentPersonal = content.querySelector('#tab-content-personal');
            const contentGlobal = content.querySelector('#tab-content-global');

            const setActiveTab = (tab) => {
                if (tab === 'personal') {
                    btnPersonal.style.background = '#fff';
                    btnPersonal.style.color = '#000';
                    btnGlobal.style.background = '#f8f9fa';
                    btnGlobal.style.color = '#878a8c';
                    contentPersonal.style.display = 'block';
                    contentGlobal.style.display = 'none';
                } else {
                    btnGlobal.style.background = '#fff';
                    btnGlobal.style.color = '#000';
                    btnPersonal.style.background = '#f8f9fa';
                    btnPersonal.style.color = '#878a8c';
                    contentGlobal.style.display = 'block';
                    contentPersonal.style.display = 'none';
                }
            };

            btnPersonal.addEventListener('click', () => setActiveTab('personal'));
            btnGlobal.addEventListener('click', () => setActiveTab('global'));

        } catch (e) {
            console.error(e);
            content.innerHTML = '<div style="text-align: center; color: red;">Error loading stats.</div>';
        }
    }

    renderGameOverModal() {
        const modal = document.createElement('kol-dialog');
        modal.id = 'modal-game-over';
        modal.setAttribute('_variant', 'blank');
        modal.setAttribute('_width', '450px');
        modal.innerHTML = `
            <div class="modal-content-custom" style="text-align: center; padding: 3rem 2rem; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
                <div id="game-over-content">
                </div>
            </div>
        `;
        this.element.appendChild(modal);
    }

    checkGameOver(state) {
        if (state.gameStatus === GameStatus.WON || state.gameStatus === GameStatus.LOST) {
            const modal = document.getElementById('modal-game-over');
            
            if (modal.dataset.gameId !== String(state.gameId)) {
                const content = modal.querySelector('#game-over-content');
                
                const heading = state.gameStatus === GameStatus.WON ? "YOU WON" : "GAME OVER";
                
                // Construct the green tiles for the answer
                const letters = state.answer.toUpperCase().split('');
                const tilesHtml = letters.map(letter => `
                    <div style="width: 45px; height: 45px; display: flex; justify-content: center; align-items: center; font-size: 1.75rem; font-weight: bold; background-color: #538d4e; border-radius: 4px; color: white;">
                        ${letter}
                    </div>
                `).join('');

                content.innerHTML = `
                    <h2 style="font-weight: 800; font-size: 2.25rem; margin-bottom: 1rem; color: #1a1a1b;">${heading}</h2>
                    <p style="margin-bottom: 1rem; font-size: 1.1rem; color: #3a3a3c;">The word was:</p>
                    <div style="display: flex; gap: 0.5rem; justify-content: center; margin-bottom: 2.5rem;">
                        ${tilesHtml}
                    </div>
                    <div style="display: flex; gap: 1rem; justify-content: center;">
                        <button id="btn-play-again-custom" style="border: 2px solid #1a1a1b; border-radius: 25px; padding: 12px 24px; background: #ffffff; color: #1a1a1b; font-weight: 900; font-size: 1rem; cursor: pointer; text-transform: uppercase; transition: all 0.2s;">
                            PLAY AGAIN
                        </button>
                        <button id="btn-show-stats-custom" style="border: 2px solid #1a1a1b; border-radius: 25px; padding: 12px 24px; background: #ffffff; color: #1a1a1b; font-weight: 900; font-size: 1rem; cursor: pointer; text-transform: uppercase; transition: all 0.2s;">
                            SHOW STATS
                        </button>
                    </div>
                `;

                // Add hover effects via JS since it's inline
                const btnPlayAgain = content.querySelector('#btn-play-again-custom');
                const btnShowStats = content.querySelector('#btn-show-stats-custom');

                btnPlayAgain.addEventListener('mouseover', () => { btnPlayAgain.style.background = '#f3f3f3'; });
                btnPlayAgain.addEventListener('mouseout', () => { btnPlayAgain.style.background = '#ffffff'; });
                btnShowStats.addEventListener('mouseover', () => { btnShowStats.style.background = '#f3f3f3'; });
                btnShowStats.addEventListener('mouseout', () => { btnShowStats.style.background = '#ffffff'; });

                // Event Listeners
                btnPlayAgain.addEventListener('click', () => {
                    modal.close();
                    this.store.startNewGame();
                });

                btnShowStats.addEventListener('click', () => {
                    modal.close();
                    this.openStats();
                });

                modal.showModal();
                modal.dataset.gameId = String(state.gameId);
            }
        }
    }

    render() {
        return this.element;
    }
}
