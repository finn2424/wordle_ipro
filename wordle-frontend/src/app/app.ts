import { Component, inject, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { HeaderComponent } from './components/header/header.component';
import { GameGrid } from './components/game-grid/game-grid';
import { VirtualKeyboard } from './components/virtual-keyboard/virtual-keyboard';
import { GameService } from './services/game.service';
import { GameOverModalComponent } from './components/game-over-modal/game-over-modal.component';

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

  constructor() {
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

  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.ctrlKey || event.altKey || event.metaKey) return;

    const key = event.key;
    if (key === 'Enter') {
      this.gameService.submitGuess();
    } else if (key === 'Backspace') {
      this.gameService.removeLetter();
    } else if (/^[a-zA-Z]$/.test(key)) {
      this.gameService.addLetter(key);
    }
  }

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
