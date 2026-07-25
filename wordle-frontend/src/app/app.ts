import { Component, inject, effect, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { HeaderComponent } from './components/header/header.component';
import { GameGrid } from './components/game-grid/game-grid';
import { VirtualKeyboard } from './components/virtual-keyboard/virtual-keyboard';
import { GameService } from './services/game.service';


import { GameStatus } from './models/game-types';

/**
 * Root component of the Wordle application.
 * Manages high-level game flow, keyboard events, and modal dialogs.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, GameGrid, VirtualKeyboard],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  host: {
    '(document:keydown)': 'handleKeyboardEvent($event)'
  }
})
export class App {
  protected gameService = inject(GameService);
  private modalService = inject(NgbModal);

  @ViewChild(VirtualKeyboard) virtualKeyboard!: VirtualKeyboard;

  constructor() {
    // Effect to monitor game status and show the game over modal when appropriate
    effect(() => {
      const status = this.gameService.gameStatus();

      if (GameStatus.WON === status || GameStatus.LOST === status) {
        this.showGameOverModal(status);
      }
    });
  }

  /**
   * Handles global keyboard events from the document.
   * Delegates valid inputs (letters, Enter, Backspace) to the GameService
   * and triggers visual feedback on the virtual keyboard.
   * @param event The native KeyboardEvent.
   */
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    if (this.modalService.hasOpenModals()) return;
    if (GameStatus.PLAYING !== this.gameService.gameStatus()) return;

    const target = event.target as HTMLElement | null;
    if (target && ('INPUT' === target.tagName || 'TEXTAREA' === target.tagName || target.isContentEditable)) return;

    const key = event.key;
    let virtualKey = '';

    switch (key) {
      case 'Enter':
        this.gameService.submitGuess();
        virtualKey = 'Enter';
        break;
      case 'Backspace':
        this.gameService.removeLetter();
        virtualKey = 'Backspace';
        break;
      default:
        if (/^[a-zA-Z]$/.test(key)) {
          this.gameService.addLetter(key);
          virtualKey = key.toUpperCase();
        }
        break;
    }

    if (virtualKey && this.virtualKeyboard) {
      this.virtualKeyboard.triggerAnimation(virtualKey);
    }
  }

  /**
   * Handles input from the virtual on-screen keyboard.
   * @param key The key string emitted by the virtual keyboard.
   */
  handleVirtualKey(key: string) {
    if (this.modalService.hasOpenModals() || GameStatus.PLAYING !== this.gameService.gameStatus()) return;

    if ('Enter' === key) {
      this.gameService.submitGuess();
    } else if ('Backspace' === key) {
      this.gameService.removeLetter();
    } else {
      this.gameService.addLetter(key);
    }
  }

  /**
   * Lazily loads and opens the game-over modal.
   * Both GameOverModalComponent and StatisticsModalComponent are loaded on demand
   * to reduce the initial bundle size.
   */
  private async showGameOverModal(status: GameStatus) {
    const { GameOverModalComponent } = await import('./components/game-over-modal/game-over-modal.component');
    const modalRef = this.modalService.open(GameOverModalComponent, { centered: true, backdrop: 'static' });
    modalRef.componentInstance.isWin = GameStatus.WON === status;
    modalRef.componentInstance.solution = this.gameService.answer();
    modalRef.componentInstance.guesses = this.gameService.guesses().length;

    modalRef.closed.subscribe(async (result) => {
      if ('Play Again' === result) {
        this.gameService.startNewGame();
      } else if ('Show Stats' === result) {
        const { StatisticsModalComponent } = await import('./components/statistics-modal/statistics-modal.component');
        const statsRef = this.modalService.open(StatisticsModalComponent, { centered: true });
        statsRef.hidden.subscribe(() => {
          this.gameService.startNewGame();
        });
      }
    });
  }
}

