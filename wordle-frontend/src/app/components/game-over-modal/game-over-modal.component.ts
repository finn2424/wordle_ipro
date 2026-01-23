import { Component, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-game-over-modal',
    standalone: true,
    imports: [],
    templateUrl: './game-over-modal.component.html',
    styleUrl: './game-over-modal.component.scss'
})
export class GameOverModalComponent {
    activeModal = inject(NgbActiveModal);

    isWin = true; // logic will be hooked up later
    solution = 'WORLD'; // logic will be hooked up later
    guesses = 6; // logic will be hooked up later

    closeModal() {
        this.activeModal.dismiss('Cross click');
    }

    playAgain() {
        this.activeModal.close('Play Again');
    }
}
