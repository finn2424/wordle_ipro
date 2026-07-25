import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ThemeService } from '../../services/theme.service';
import { signal } from '@angular/core';
import { vi, type MockInstance } from 'vitest';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { InstructionsModalComponent } from '../instructions-modal/instructions-modal.component';
import { StatisticsModalComponent } from '../statistics-modal/statistics-modal.component';

import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let modalServiceMock: { open: MockInstance };

  beforeEach(async () => {
    modalServiceMock = {
      open: vi.fn().mockReturnValue({
        componentInstance: {},
        closed: { subscribe: vi.fn() }
      })
    };

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        {
          provide: ThemeService,
          useValue: {
            theme: signal('light'),
            set: vi.fn()
          }
        },
        {
          provide: NgbModal,
          useValue: modalServiceMock
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

  it('should open InstructionsModalComponent when openInstructions is called', async () => {
    await component.openInstructions();
    expect(modalServiceMock.open).toHaveBeenCalledWith(InstructionsModalComponent, { size: 'md' });
  });

  it('should open StatisticsModalComponent when openStatistics is called', async () => {
    await component.openStatistics();
    expect(modalServiceMock.open).toHaveBeenCalledWith(StatisticsModalComponent, { size: 'md' });
  });

  it('should call modalService.open exactly once per method call', async () => {
    await component.openInstructions();
    expect(modalServiceMock.open).toHaveBeenCalledTimes(1);

    modalServiceMock.open.mockClear();

    await component.openStatistics();
    expect(modalServiceMock.open).toHaveBeenCalledTimes(1);
  });
});
