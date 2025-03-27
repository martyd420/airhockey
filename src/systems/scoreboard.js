import { MAX_SCORE } from '../config/constants.js';

export class ScoreSystem {
    constructor() {
        this.playerScore = 0;
        this.aiScore = 0;
        this.gameOver = false;
        this.winner = '';
    }

    playerScores() {
        this.playerScore++;
        this.updateScoreboard();
        this.checkWinCondition();
    }

    aiScores() {
        this.aiScore++;
        this.updateScoreboard();
        this.checkWinCondition();
    }

    updateScoreboard() {
        document.getElementById('player-score').textContent = this.playerScore;
        document.getElementById('ai-score').textContent = this.aiScore;
    }

    checkWinCondition() {
        if (this.playerScore >= MAX_SCORE || this.aiScore >= MAX_SCORE) {
            this.gameOver = true;
            this.winner = this.playerScore >= MAX_SCORE ? 'Player' : 'AI';
            this.showGameOver();
        }
    }

    showGameOver() {
        document.getElementById('winner-message').textContent = this.winner + ' wins!';
        document.getElementById('game-over').classList.remove('hidden');
    }

    hideGameOver() {
        document.getElementById('game-over').classList.add('hidden');
    }

    reset() {
        this.playerScore = 0;
        this.aiScore = 0;
        this.gameOver = false;
        this.winner = '';
        this.updateScoreboard();
        this.hideGameOver();
    }

    isGameOver() {
        return this.gameOver;
    }

    getScores() {
        return {
            player: this.playerScore,
            ai: this.aiScore
        };
    }

    getWinner() {
        return this.winner;
    }
}