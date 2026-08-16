import { register } from '@public-ui/components';
import { defineCustomElements } from '@public-ui/components/loader';
import { DEFAULT } from '@public-ui/theme-default';

import { api } from './src/api.js';
import { store } from './src/store.js';
import { Header } from './src/components/Header.js';
import { GameGrid } from './src/components/GameGrid.js';
import { Keyboard } from './src/components/Keyboard.js';
import { Modals } from './src/components/Modals.js';

// Initialize KoliBri
register(DEFAULT, defineCustomElements)
  .then(() => {
    console.log("KoliBri registered!");
  });

const appEl = document.getElementById('app');

const modals = new Modals(store, api);

const header = new Header(
    () => modals.openInstructions(),
    () => modals.openStats()
);

const grid = new GameGrid(store);
const keyboard = new Keyboard(store);

// Build DOM layout
appEl.appendChild(header.render());

const gameContainer = document.createElement('main');
gameContainer.className = 'game-container';
gameContainer.appendChild(grid.render());
gameContainer.appendChild(keyboard.render());

appEl.appendChild(gameContainer);
appEl.appendChild(modals.render());

// Handle Error Toast
let errorToastTimeout;
const errorToast = document.createElement('div');
errorToast.className = 'error-toast';
errorToast.style.display = 'none';
appEl.appendChild(errorToast);

store.subscribe((state) => {
    if (state.error) {
        errorToast.textContent = state.error;
        errorToast.style.display = 'block';
        clearTimeout(errorToastTimeout);
        errorToastTimeout = setTimeout(() => {
            errorToast.style.display = 'none';
            store.clearError();
        }, 3000);
    }
});

// Setup Physical Keyboard Support
document.addEventListener('keydown', (e) => {
    // Ignore if modals are open (basic check, Kolibri might use native dialog internally)
    if (document.querySelector('dialog[open]') || document.activeElement.closest('kol-dialog')) return;

    if (e.key === 'Enter') {
        store.submitGuess();
    } else if (e.key === 'Backspace') {
        store.removeLetter();
    } else if (/^[a-zA-Z]$/.test(e.key)) {
        store.addLetter(e.key);
    }
});

// Init Game
store.startNewGame();
