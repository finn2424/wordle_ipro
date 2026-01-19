import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameGrid } from './game-grid';

describe('GameGrid', () => {
  let component: GameGrid;
  let fixture: ComponentFixture<GameGrid>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameGrid]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GameGrid);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
