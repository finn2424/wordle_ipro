function getDeviceId() {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
}

export const api = {
    async startGame() {
        const response = await fetch('/api/Game/Start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceId: getDeviceId() })
        });
        if (!response.ok) throw new Error('Failed to start game');
        return response.json();
    },
    async submitGuess(gameId, guessWord) {
        const response = await fetch('/api/Game/SubmitGuess', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceId: getDeviceId(), gameId, guessWord })
        });
        if (!response.ok) throw new Error('Failed to submit guess');
        return response.json();
    },
    async getStats() {
        const response = await fetch(`/api/Stats?deviceId=${getDeviceId()}`);
        if (!response.ok) throw new Error('Failed to fetch stats');
        return response.json();
    },
    async getAdvancedStats() {
        const response = await fetch(`/api/Stats/Advanced?deviceId=${getDeviceId()}`);
        if (!response.ok) throw new Error('Failed to fetch advanced stats');
        return response.json();
    }
};
