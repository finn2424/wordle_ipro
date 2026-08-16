export class Keyboard {
    constructor(store) {
        this.store = store;
        this.element = document.createElement('div');
        this.element.className = 'virtual-keyboard';
        
        this.rows = [
            ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
            ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
            ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
        ];

        this.renderKeyboard();
        this.store.subscribe(() => this.updateColors());
    }

    renderKeyboard() {
        this.element.innerHTML = '';
        this.rows.forEach(rowKeys => {
            const rowEl = document.createElement('div');
            rowEl.className = 'keyboard-row';
            
            rowKeys.forEach(key => {
                const btn = document.createElement('button');
                btn.className = 'key-btn';
                btn.dataset.key = key;
                btn.textContent = key === 'BACKSPACE' ? '⌫' : key;
                
                if (key === 'ENTER' || key === 'BACKSPACE') {
                    btn.classList.add('key-wide');
                }

                btn.addEventListener('click', () => this.handleKeyPress(key));
                rowEl.appendChild(btn);
            });
            this.element.appendChild(rowEl);
        });
    }

    handleKeyPress(key) {
        if (key === 'ENTER') {
            this.store.submitGuess();
        } else if (key === 'BACKSPACE') {
            this.store.removeLetter();
        } else {
            this.store.addLetter(key);
        }
    }

    updateColors() {
        const letterStatus = this.store.getLetterStatus();
        const keys = this.element.querySelectorAll('.key-btn');
        
        keys.forEach(keyEl => {
            const key = keyEl.dataset.key;
            if (letterStatus[key]) {
                keyEl.className = 'key-btn ' + letterStatus[key];
                if (key === 'ENTER' || key === 'BACKSPACE') {
                    keyEl.classList.add('key-wide');
                }
            } else {
                keyEl.className = 'key-btn';
                if (key === 'ENTER' || key === 'BACKSPACE') {
                    keyEl.classList.add('key-wide');
                }
            }
        });
    }

    render() {
        return this.element;
    }
}
