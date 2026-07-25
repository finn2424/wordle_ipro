import { TestBed, ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { App } from './app';
import { GameService } from './services/game.service';
import { describe, it, expect, beforeEach, vi, type MockInstance } from 'vitest';
import { signal, computed, WritableSignal, Signal } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { of } from 'rxjs';
import { ThemeService } from './services/theme.service';

// Define Mock Interfaces
interface GameServiceMock {
  gameStatus: WritableSignal<string>;
  answer: WritableSignal<string | null>;
  guesses: WritableSignal<string[]>;
  currentGuess: WritableSignal<string[]>;
  evaluatedGuesses: Signal<any[]>;
  letterStatus: Signal<any>;
  error: WritableSignal<string | null>;
  focusedIndex: WritableSignal<number>;
  addLetter: MockInstance;
  removeLetter: MockInstance;
  submitGuess: MockInstance;
  startNewGame: MockInstance;
  clearError: MockInstance;
  setFocusedIndex: MockInstance;
}

interface ModalServiceMock {
  open: MockInstance;
  hasOpenModals: MockInstance;
}

interface ThemeServiceMock {
  theme: WritableSignal<string>;
  set: MockInstance;
}

describe('App', () => {
  let component: App;
  let fixture: ComponentFixture<App>;
  let gameServiceMock: GameServiceMock;
  let modalServiceMock: ModalServiceMock;
  let themeServiceMock: ThemeServiceMock;

  beforeEach(async () => {
    gameServiceMock = {
      gameStatus: signal('playing'),
      answer: signal('WORDL'),
      guesses: signal([]),
      currentGuess: signal(['', '', '', '', '']),
      evaluatedGuesses: computed(() => []),
      letterStatus: computed(() => ({})),
      error: signal(null),
      focusedIndex: signal(0),
      addLetter: vi.fn(),
      removeLetter: vi.fn(),
      submitGuess: vi.fn(),
      startNewGame: vi.fn(),
      clearError: vi.fn(),
      setFocusedIndex: vi.fn(),
    };

    modalServiceMock = {
      open: vi.fn().mockReturnValue({
        componentInstance: { isWin: false, solution: '', guesses: 0 },
        closed: of('Play Again')
      }),
      hasOpenModals: vi.fn().mockReturnValue(false)
    };

    themeServiceMock = {
      theme: signal('light'),
      set: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: GameService, useValue: gameServiceMock },
        { provide: NgbModal, useValue: modalServiceMock },
        { provide: ThemeService, useValue: themeServiceMock }
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
    /**
     * Flushes the microtask queue so that fire-and-forget async calls
     * (like the dynamic import() inside the effect) have time to resolve.
     * Multiple ticks are needed because the effect -> async method -> await import() chain
     * creates multiple layers of microtasks.
     */
    const flushPromises = async () => {
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    };

    it('should open modal when game is won', async () => {
      // Simulate Win
      gameServiceMock.guesses.set(['A', 'B', 'C']); // 3 guesses
      gameServiceMock.gameStatus.set('won');
      fixture.detectChanges(); // Flush effects
      await flushPromises(); // Wait for dynamic import()

      expect(modalServiceMock.open).toHaveBeenCalledWith(expect.anything(), expect.anything());

      // Verify data passed to modal
      const modalRef = modalServiceMock.open.mock.results[0]?.value;
      expect(modalRef.componentInstance.isWin).toBe(true);
      expect(modalRef.componentInstance.solution).toBe('WORDL');
      expect(modalRef.componentInstance.guesses).toBe(3);
    });

    it('should open modal when game is lost', async () => {
      // Simulate Loss
      gameServiceMock.guesses.set(['A', 'B', 'C', 'D', 'E', 'F']);
      gameServiceMock.gameStatus.set('lost');
      fixture.detectChanges();
      await flushPromises(); // Wait for dynamic import()

      expect(modalServiceMock.open).toHaveBeenCalledWith(expect.anything(), expect.anything());

      // Verify data
      const modalRef = modalServiceMock.open.mock.results[0]?.value;
      expect(modalRef.componentInstance.isWin).toBe(false);
    });

    it('should start new game when "Play Again" is clicked', async () => {
      // Setup mock to return 'Play Again' on close (already done in beforeEach)

      // Trigger modal open
      gameServiceMock.gameStatus.set('won');
      fixture.detectChanges();
      await flushPromises(); // Wait for dynamic import() and subscription

      // The subscription happens immediately in this mock setup, so startNewGame should be called
      expect(gameServiceMock.startNewGame).toHaveBeenCalled();
    });

    it('should NOT open modal when playing', async () => {
      gameServiceMock.gameStatus.set('playing');
      fixture.detectChanges();
      expect(modalServiceMock.open).not.toHaveBeenCalled();
    });

    it('should call clearError when grid emits errorCleared', () => {
      // Simulate errorCleared event from app-game-grid
      const grid = fixture.debugElement.query(By.css('app-game-grid'));
      grid.triggerEventHandler('errorCleared', null);

      expect(gameServiceMock.clearError).toHaveBeenCalled();
    });

    it('should call setFocusedIndex when grid emits focusRequest', () => {
      const grid = fixture.debugElement.query(By.css('app-game-grid'));
      grid.triggerEventHandler('focusRequest', 2);
      expect(gameServiceMock.setFocusedIndex).toHaveBeenCalledWith(2);
    });
  });
});
