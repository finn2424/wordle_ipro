import { Component, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';

/**
 * Top navigation bar component.
 * Provides access to theme toggle, instructions, and statistics modals.
 */
@Component({
  selector: 'app-header',
  imports: [ThemeToggleComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private modalService = inject(NgbModal);

  /**
   * Lazily loads and opens the instructions modal dialog.
   */
  async openInstructions() {
    const { InstructionsModalComponent } = await import('../instructions-modal/instructions-modal.component');
    this.modalService.open(InstructionsModalComponent, { size: 'md' });
  }

  /**
   * Lazily loads and opens the statistics modal dialog.
   */
  async openStatistics() {
    const { StatisticsModalComponent } = await import('../statistics-modal/statistics-modal.component');
    this.modalService.open(StatisticsModalComponent, { size: 'md' });
  }
}


