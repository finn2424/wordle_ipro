import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VirtualKeyboard } from './virtual-keyboard';

describe('VirtualKeyboard', () => {
  let component: VirtualKeyboard;
  let fixture: ComponentFixture<VirtualKeyboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VirtualKeyboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VirtualKeyboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
