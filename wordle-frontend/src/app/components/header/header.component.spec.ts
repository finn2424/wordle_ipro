import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ThemeService } from '../../services/theme.service';
import { signal } from '@angular/core';
import { vi } from 'vitest';

import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        {
          provide: ThemeService,
          useValue: {
            theme: signal('light'),
            set: vi.fn()
          }
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
