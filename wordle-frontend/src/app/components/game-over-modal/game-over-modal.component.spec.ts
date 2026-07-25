import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { GameOverModalComponent } from './game-over-modal.component';

describe('GameOverModalComponent', () => {
  let component: GameOverModalComponent;
  let fixture: ComponentFixture<GameOverModalComponent>;
  let mockActiveModal: { close: ReturnType<typeof vi.fn>; dismiss: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockActiveModal = {
      close: vi.fn(),
      dismiss: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [GameOverModalComponent],
      providers: [{ provide: NgbActiveModal, useValue: mockActiveModal }],
    }).compileComponents();

    fixture = TestBed.createComponent(GameOverModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call activeModal.close with "Play Again" when playAgain() is called', () => {
    component.playAgain();

    expect(mockActiveModal.close).toHaveBeenCalledWith('Play Again');
  });

  it('should call activeModal.close with "Show Stats" when showStats() is called', () => {
    component.showStats();

    expect(mockActiveModal.close).toHaveBeenCalledWith('Show Stats');
  });

  it('should call activeModal.dismiss with "Cross click" when closeModal() is called', () => {
    component.closeModal();

    expect(mockActiveModal.dismiss).toHaveBeenCalledWith('Cross click');
  });

  it('should allow setting isWin property', () => {
    component.isWin = true;
    expect(component.isWin).toBe(true);

    component.isWin = false;
    expect(component.isWin).toBe(false);
  });

  it('should allow setting solution property', () => {
    component.solution = 'HELLO';
    expect(component.solution).toBe('HELLO');
  });

  it('should allow setting guesses property', () => {
    component.guesses = 4;
    expect(component.guesses).toBe(4);
  });
});
