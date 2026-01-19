import { Component, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-instructions-modal',
    standalone: true,
    imports: [],
    templateUrl: './instructions-modal.component.html',
    styleUrl: './instructions-modal.component.scss'
})
export class InstructionsModalComponent {
    activeModal = inject(NgbActiveModal);

    closeModal() {
        this.activeModal.dismiss('Cross click');
    }
}
