// Image paths for all game assets
export const IMAGE_PATHS = {
    playerPaddle: './images/paddle.png',
    aiPaddle: './images/paddle.png',
    puck: './images/puck.png',
    bonuses: { // Different image for each bonus type
        enlargePlayerPaddle: './images/bonus.png',
        shrinkAiPaddle: './images/bonus.png',
        speedUpPlayerPuck: './images/bonus_speedup_puck.png',
        slowDownAiPuck: './images/bonus.png',
        slowDownAi: './images/bonus_slowdown_ai.png',
        freezeAI: './images/bonus_freeze.png'
    }
};

// Bonus types
export const BONUS_TYPES = [
    'enlargePlayerPaddle',
    'shrinkAiPaddle',
    'speedUpPlayerPuck',
    'slowDownAiPuck',
    'slowDownAi',
    'freezeAI'
];

// Bonus colors (useful for glow effects and fallbacks)
export const BONUS_COLORS = {
    'enlargePlayerPaddle': '#2ecc71',
    'shrinkAiPaddle': '#9b59b6',
    'speedUpPlayerPuck': '#f39c12',
    'slowDownAiPuck': '#1abc9c',
    'slowDownAi': '#34495e',
    'freezeAI': '#aed6f1'
};