import { Game } from './core/game.js';

// Create and initialize the game when the page loads
window.addEventListener('load', () => {
    const game = new Game('gameCanvas');
    game.init();
});