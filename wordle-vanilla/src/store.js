import { api } from './api.js';

export const WORD_LENGTH = 5;
export const MAX_GUESSES = 6;

export const GameStatus = {
    PLAYING: 'playing',
    WON: 'won',
    LOST: 'lost'
};

export const LetterStatus = {
    CORRECT: 'correct',
    PRESENT: 'present',
    ABSENT: 'absent'
};

class Store {
    constructor() {
        this.listeners = [];
        this.state = this.getInitialState();
        
        // Restore from local storage if exists
        try {
            const saved = localStorage.getItem('wordle-current-guess');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && WORD_LENGTH === parsed.length) {
                    this.state.currentGuess = parsed;
                    const firstEmpty = parsed.findIndex(c => '' === c);
                    this.state.focusedIndex = -1 === firstEmpty ? WORD_LENGTH - 1 : firstEmpty;
                }
            }
        } catch (e) {
            console.warn('Failed to restore guess', e);
        }
    }

    getInitialState() {
        return {
            gameId: null,
            guesses: [],
            currentGuess: Array(WORD_LENGTH).fill(''),
            answer: null,
            gameStatus: GameStatus.PLAYING,
            error: null,
            focusedIndex: 0,
            results: [], // LetterStatus[][]
            attemptsUsed: 0,
            isSubmitting: false
        };
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notify() {
        this.listeners.forEach(listener => listener(this.state));
        localStorage.setItem('wordle-current-guess', JSON.stringify(this.state.currentGuess));
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.notify();
    }

    async startNewGame() {
        try {
            this.setState(this.getInitialState());
            const response = await api.startGame();
            const rows = response.value || [];
            if (!rows.length) throw new Error('Failed to start game');

            const gameState = rows[0];
            const reconstructedGuesses = [];
            const reconstructedResults = [];

            for (const row of rows) {
                if (row.attemptNumber) {
                    reconstructedGuesses.push(row.guessWord?.trim() || '');
                    const validation = (row.result || '').split('').map(char => {
                        switch (char) {
                            case 'C': return LetterStatus.CORRECT;
                            case 'P': return LetterStatus.PRESENT;
                            default: return LetterStatus.ABSENT;
                        }
                    });
                    reconstructedResults.push(validation);
                }
            }

            const status = ['playing', 'won', 'lost'].includes(gameState.gameStatus) 
                ? gameState.gameStatus 
                : GameStatus.PLAYING;

            let currentGuess = Array(WORD_LENGTH).fill('');
            let focusedIndex = 0;

            if (GameStatus.PLAYING === status) {
                try {
                    const saved = JSON.parse(localStorage.getItem('wordle-current-guess'));
                    if (Array.isArray(saved) && WORD_LENGTH === saved.length) {
                        currentGuess = saved;
                        const firstEmpty = currentGuess.findIndex(c => '' === c);
                        focusedIndex = -1 === firstEmpty ? WORD_LENGTH - 1 : firstEmpty;
                    }
                } catch (e) {}
            }

            this.setState({
                gameId: gameState.gameId,
                gameStatus: status,
                attemptsUsed: gameState.attemptsUsed || 0,
                answer: gameState.targetWord || null,
                guesses: reconstructedGuesses,
                results: reconstructedResults,
                currentGuess,
                focusedIndex
            });
        } catch (err) {
            console.error(err);
            this.setState({ error: 'Could not load game. Is backend running?' });
        }
    }

    addLetter(letter) {
        if (GameStatus.PLAYING !== this.state.gameStatus || this.state.isSubmitting || !/^[a-zA-Z]$/.test(letter)) return;
        
        const newGuess = [...this.state.currentGuess];
        const currentIndex = this.state.focusedIndex;
        newGuess[currentIndex] = letter.toUpperCase();
        
        const nextIndex = Math.min(WORD_LENGTH - 1, currentIndex + 1);
        this.setState({
            currentGuess: newGuess,
            focusedIndex: nextIndex,
            error: null
        });
    }

    removeLetter() {
        if (GameStatus.PLAYING !== this.state.gameStatus || this.state.isSubmitting) return;

        const newGuess = [...this.state.currentGuess];
        let newIndex = this.state.focusedIndex;

        if ('' !== newGuess[newIndex]) {
            newGuess[newIndex] = '';
        } else {
            newIndex = Math.max(0, newIndex - 1);
            newGuess[newIndex] = '';
        }

        this.setState({
            currentGuess: newGuess,
            focusedIndex: newIndex,
            error: null
        });
    }

    setFocusedIndex(index) {
        if (index >= 0 && index < WORD_LENGTH) {
            this.setState({ focusedIndex: index });
        }
    }

    async submitGuess() {
        if (GameStatus.PLAYING !== this.state.gameStatus || this.state.isSubmitting) return;

        const guess = this.state.currentGuess.join('');
        if (WORD_LENGTH !== guess.length || this.state.currentGuess.some(char => '' === char)) {
            this.setState({ error: 'Not enough letters' });
            return;
        }

        this.setState({ isSubmitting: true });
        
        try {
            const response = await api.submitGuess(this.state.gameId, guess);
            const resultData = response.value ? response.value[0] : null;

            if (!resultData) {
                this.setState({ error: 'Invalid response from server' });
                return;
            }

            if ('error' === resultData.status) {
                this.setState({ error: resultData.message || 'Unknown error' });
                return;
            }

            const validation = (resultData.result || '').split('').map(char => {
                switch (char) {
                    case 'C': return LetterStatus.CORRECT;
                    case 'P': return LetterStatus.PRESENT;
                    default: return LetterStatus.ABSENT;
                }
            });

            const status = ['playing', 'won', 'lost'].includes(resultData.gameStatus) 
                ? resultData.gameStatus 
                : GameStatus.PLAYING;

            this.setState({
                guesses: [...this.state.guesses, guess],
                results: [...this.state.results, validation],
                currentGuess: Array(WORD_LENGTH).fill(''),
                focusedIndex: 0,
                gameStatus: status,
                answer: resultData.targetWord || null,
                attemptsUsed: resultData.attemptsUsed || 0,
                error: null
            });
        } catch (err) {
            console.error(err);
            this.setState({ error: 'Failed to submit guess' });
        } finally {
            this.setState({ isSubmitting: false });
        }
    }

    clearError() {
        this.setState({ error: null });
    }

    getEvaluatedGuesses() {
        return this.state.guesses.map((guess, index) => ({
            word: guess,
            validation: this.state.results[index] || Array(WORD_LENGTH).fill(LetterStatus.ABSENT)
        }));
    }

    getLetterStatus() {
        const statusMap = {};
        const evaluated = this.getEvaluatedGuesses();
        for (const guess of evaluated) {
            for (let i = 0; i < guess.word.length; i++) {
                const char = guess.word[i];
                if (!char) continue;

                const currentStatus = statusMap[char];
                const newStatus = guess.validation[i];
                if (!newStatus) continue;

                if (LetterStatus.CORRECT === currentStatus) continue;

                if (LetterStatus.CORRECT === newStatus) {
                    statusMap[char] = LetterStatus.CORRECT;
                } else if (LetterStatus.PRESENT === newStatus) {
                    statusMap[char] = LetterStatus.PRESENT;
                } else if (LetterStatus.ABSENT === newStatus && !currentStatus) {
                    statusMap[char] = LetterStatus.ABSENT;
                }
            }
        }
        return statusMap;
    }
}

export const store = new Store();
