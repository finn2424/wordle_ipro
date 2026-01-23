import { TestBed, ComponentFixture } from '@angular/core/testing';
import { App } from './app';
import { GameService } from './services/game.service';
import { describe, it, expect, beforeEach, vi, type MockInstance } from 'vitest';
import { signal, computed, WritableSignal } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { of } from 'rxjs';
import { GameOverModalComponent } from './components/game-over-modal/game-over-modal.component';

describe('App', () => {
  let component: App;
  let fixture: ComponentFixture<App>;
  let gameServiceMock: any;
  let modalServiceMock: any;

  beforeEach(async () => {
    gameServiceMock = {
      gameStatus: signal('playing'),
      answer: signal('WORDL'),
      guesses: signal([]),
      currentGuess: signal(''),
      evaluatedGuesses: computed(() => []),
      addLetter: vi.fn(),
      removeLetter: vi.fn(),
      submitGuess: vi.fn(),
      startNewGame: vi.fn(),
    };

    modalServiceMock = {
      open: vi.fn().mockReturnValue({
        componentInstance: { isWin: false, solution: '', guesses: 0 },
        closed: of('Play Again')
      })
    };

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: GameService, useValue: gameServiceMock },
        { provide: NgbModal, useValue: modalServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  describe('Keyboard handling', () => {
    it('should handle alphabetic keys', () => {
      const event = new KeyboardEvent('keydown', { key: 'a' });
      document.dispatchEvent(event);
      expect(gameServiceMock.addLetter).toHaveBeenCalledWith('a');
    });

    it('should ignore non-alphabetic keys', () => {
      const event = new KeyboardEvent('keydown', { key: '1' });
      document.dispatchEvent(event);
      expect(gameServiceMock.addLetter).not.toHaveBeenCalled();
    });

    it('should handle Enter key', () => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      document.dispatchEvent(event);
      expect(gameServiceMock.submitGuess).toHaveBeenCalled();
    });

    it('should handle Backspace key', () => {
      const event = new KeyboardEvent('keydown', { key: 'Backspace' });
      document.dispatchEvent(event);
      expect(gameServiceMock.removeLetter).toHaveBeenCalled();
    });

    it('should ignore keys with modifiers', () => {
      const event = new KeyboardEvent('keydown', { key: 'a', ctrlKey: true });
      document.dispatchEvent(event);
      expect(gameServiceMock.addLetter).not.toHaveBeenCalled();
    });

    it('should handle virtual keyboard input', () => {
      component.handleVirtualKey('B');
      expect(gameServiceMock.addLetter).toHaveBeenCalledWith('B');

      component.handleVirtualKey('Enter');
      expect(gameServiceMock.submitGuess).toHaveBeenCalled();

      component.handleVirtualKey('Backspace');
      expect(gameServiceMock.removeLetter).toHaveBeenCalled();
    });
  });

  describe('Game Over Logic', () => {
    it('should open modal when game is won', async () => {
      // Simulate Win
      gameServiceMock.guesses.set(['A', 'B', 'C']); // 3 guesses
      gameServiceMock.gameStatus.set('won');
      fixture.detectChanges(); // Flush effects

      expect(modalServiceMock.open).toHaveBeenCalledWith(GameOverModalComponent, expect.anything());

      // Verify data passed to modal
      const modalRef = modalServiceMock.open.mock.results[0].value;
      expect(modalRef.componentInstance.isWin).toBe(true);
      expect(modalRef.componentInstance.solution).toBe('WORDL');
      expect(modalRef.componentInstance.guesses).toBe(3);
    });

    it('should open modal when game is lost', async () => {
      // Simulate Loss
      gameServiceMock.guesses.set(['A', 'B', 'C', 'D', 'E', 'F']);
      gameServiceMock.gameStatus.set('lost');
      fixture.detectChanges();

      expect(modalServiceMock.open).toHaveBeenCalledWith(GameOverModalComponent, expect.anything());

      // Verify data
      const modalRef = modalServiceMock.open.mock.results[0].value;
      expect(modalRef.componentInstance.isWin).toBe(false);
    });

    it('should start new game when "Play Again" is clicked', async () => {
      // Setup mock to return 'Play Again' on close (already done in beforeEach)

      // Trigger modal open
      gameServiceMock.gameStatus.set('won');
      fixture.detectChanges();

      // The subscription happens immediately in this mock setup, so startNewGame should be called
      expect(gameServiceMock.startNewGame).toHaveBeenCalled();
    });

    it('should NOT open modal when playing', async () => {
      gameServiceMock.gameStatus.set('playing');
      fixture.detectChanges();
      expect(modalServiceMock.open).not.toHaveBeenCalled();
    });
  });
});
