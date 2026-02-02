import { Component, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

/**
 * Modal displaying player statistics.
 * (Currently a placeholder implementation).
 */
@Component({
    selector: 'app-statistics-modal',
    standalone: true,
    imports: [],
    templateUrl: './statistics-modal.component.html',
    styleUrl: './statistics-modal.component.scss'
})
export class StatisticsModalComponent {
    activeModal = inject(NgbActiveModal);

    closeModal() {
        this.activeModal.dismiss('Cross click');
    }
}

