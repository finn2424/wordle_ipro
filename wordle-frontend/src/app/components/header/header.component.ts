import { Component, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { InstructionsModalComponent } from '../instructions-modal/instructions-modal.component';
import { StatisticsModalComponent } from '../statistics-modal/statistics-modal.component';

/**
 * Top navigation bar component.
 * Provides access to instructions and statistics modals.
 */
@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private modalService = inject(NgbModal);

  openInstructions() {
    this.modalService.open(InstructionsModalComponent, { size: 'md' });
  }

  openStatistics() {
    this.modalService.open(StatisticsModalComponent, { size: 'md' });
  }
}

