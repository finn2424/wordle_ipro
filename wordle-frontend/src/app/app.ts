import { Component, inject, effect, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { HeaderComponent } from './components/header/header.component';
import { GameGrid } from './components/game-grid/game-grid';
import { VirtualKeyboard } from './components/virtual-keyboard/virtual-keyboard';
import { GameService } from './services/game.service';
import { GameOverModalComponent } from './components/game-over-modal/game-over-modal.component';

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

      if (status === 'won' || status === 'lost') {
        const modalRef = this.modalService.open(GameOverModalComponent, { centered: true, backdrop: 'static' });
        modalRef.componentInstance.isWin = status === 'won';
        modalRef.componentInstance.solution = this.gameService.answer();
        modalRef.componentInstance.guesses = this.gameService.guesses().length;

        modalRef.closed.subscribe((result) => {
          if (result === 'Play Again') {
            this.gameService.startNewGame();
          }
        });
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
    if (key === 'Enter') {
      this.gameService.submitGuess();
    } else if (key === 'Backspace') {
      this.gameService.removeLetter();
    } else {
      this.gameService.addLetter(key);
    }
  }
}

