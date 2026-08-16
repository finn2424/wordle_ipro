import { WORD_LENGTH, MAX_GUESSES, LetterStatus } from '../store.js';

export class GameGrid {
    constructor(store) {
        this.store = store;
        this.element = document.createElement('div');
        this.element.className = 'game-grid';
        
        this.renderGrid();

        // Subscribe to store updates
        this.store.subscribe((state) => this.update(state));
    }

    renderGrid() {
        this.element.innerHTML = '';
        for (let i = 0; i < MAX_GUESSES; i++) {
            const row = document.createElement('div');
            row.className = 'grid-row';
            for (let j = 0; j < WORD_LENGTH; j++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                
                // Add click event for focusing
                cell.addEventListener('click', () => {
                    // Only allow focus on the active row
                    if (i === this.store.state.guesses.length) {
                        this.store.setFocusedIndex(j);
                    }
                });

                row.appendChild(cell);
            }
            this.element.appendChild(row);
        }
    }

    update(state) {
        const rows = this.element.querySelectorAll('.grid-row');
        const evaluated = this.store.getEvaluatedGuesses();
        const activeRowIndex = state.guesses.length;

        rows.forEach((row, i) => {
            const cells = row.querySelectorAll('.grid-cell');
            
            // Previous guesses
            if (i < activeRowIndex) {
                const guessObj = evaluated[i];
                cells.forEach((cell, j) => {
                    cell.textContent = guessObj.word[j] || '';
                    cell.className = 'grid-cell evaluated ' + guessObj.validation[j];
                });
            } 
            // Current active guess
            else if (i === activeRowIndex) {
                cells.forEach((cell, j) => {
                    cell.textContent = state.currentGuess[j] || '';
                    cell.className = 'grid-cell active';
                    if (state.focusedIndex === j) {
                        cell.classList.add('focused');
                    }
                });
            } 
            // Future empty rows
            else {
                cells.forEach((cell, j) => {
                    cell.textContent = '';
                    cell.className = 'grid-cell empty';
                });
            }
        });
    }

    render() {
        return this.element;
    }
}
