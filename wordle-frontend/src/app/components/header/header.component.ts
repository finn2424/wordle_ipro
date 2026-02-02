import { Component, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { InstructionsModalComponent } from '../instructions-modal/instructions-modal.component';
import { StatisticsModalComponent } from '../statistics-modal/statistics-modal.component';
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
   * Opens the instructions modal dialog.
   */
  openInstructions() {
    this.modalService.open(InstructionsModalComponent, { size: 'md' });
  }

  /**
   * Opens the statistics modal dialog.
   */
  openStatistics() {
    this.modalService.open(StatisticsModalComponent, { size: 'md' });
  }
}


