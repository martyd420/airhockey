import { EFFECT_DURATION, AI_FREEZE_DURATION, PADDLE_RADIUS } from '../config/constants.js';

export class EffectsSystem {
    constructor(playerPaddle, aiPaddle) {
        this.playerPaddle = playerPaddle;
        this.aiPaddle = aiPaddle;
        this.activeEffects = {
            playerPaddleSize: 1,
            aiPaddleSize: 1,
            playerPuckSpeed: 1,
            aiPuckSpeed: 1,
            aiSlowdown: 1
        };
        this.effectTimers = {};
    }

    applyBonusEffect(type) {
        if (this.effectTimers[type]) {
            clearTimeout(this.effectTimers[type]);
        }

        // Reset before applying, important for size
        this.playerPaddle.setRadius(PADDLE_RADIUS * this.activeEffects.playerPaddleSize);
        this.aiPaddle.setRadius(PADDLE_RADIUS * this.activeEffects.aiPaddleSize);

        switch (type) {
            case 'enlargePlayerPaddle':
                this.activeEffects.playerPaddleSize = 1.5;
                this.playerPaddle.setRadius(PADDLE_RADIUS * this.activeEffects.playerPaddleSize);
                this.effectTimers[type] = setTimeout(() => {
                    this.activeEffects.playerPaddleSize = 1;
                    this.playerPaddle.setRadius(PADDLE_RADIUS);
                }, EFFECT_DURATION);
                break;
                
            case 'shrinkAiPaddle':
                this.activeEffects.aiPaddleSize = 0.5;
                this.aiPaddle.setRadius(PADDLE_RADIUS * this.activeEffects.aiPaddleSize);
                this.effectTimers[type] = setTimeout(() => {
                    this.activeEffects.aiPaddleSize = 1;
                    this.aiPaddle.setRadius(PADDLE_RADIUS);
                }, EFFECT_DURATION);
                break;
                
            case 'speedUpPlayerPuck':
                this.activeEffects.playerPuckSpeed = 1.5;
                this.effectTimers[type] = setTimeout(() => {
                    this.activeEffects.playerPuckSpeed = 1;
                }, EFFECT_DURATION);
                break;
                
            case 'slowDownAiPuck':
                this.activeEffects.aiPuckSpeed = 0.7;
                this.effectTimers[type] = setTimeout(() => {
                    this.activeEffects.aiPuckSpeed = 1;
                }, EFFECT_DURATION);
                break;
                
            case 'slowDownAi':
                this.activeEffects.aiSlowdown = 0.5;
                this.effectTimers[type] = setTimeout(() => {
                    this.activeEffects.aiSlowdown = 1;
                }, EFFECT_DURATION);
                break;
                
            case 'freezeAI':
                this.aiPaddle.freeze(true);
                this.effectTimers[type] = setTimeout(() => {
                    this.aiPaddle.freeze(false);
                }, AI_FREEZE_DURATION);
                break;
        }
    }

    getPlayerPuckSpeedMultiplier() {
        return this.activeEffects.playerPuckSpeed;
    }

    getAIPuckSpeedMultiplier() {
        return this.activeEffects.aiPuckSpeed;
    }

    getAISlowdownMultiplier() {
        return this.activeEffects.aiSlowdown;
    }
    
    getActiveEffects() {
        return {
            ...this.activeEffects,
            aiFrozen: this.aiPaddle.isFrozen()
        };
    }

    formatEffectName(effect) {
        switch (effect) {
            case 'playerPaddleSize':
                return this.activeEffects[effect] > 1 ? 'Paddle Enlarged' : 'Paddle Shrunk';
            case 'aiPaddleSize':
                return this.activeEffects[effect] < 1 ? 'AI Paddle Shrunk' : 'AI Paddle Enlarged';
            case 'playerPuckSpeed':
                return this.activeEffects[effect] > 1 ? 'Player Hit Speed Up' : 'Player Hit Speed Down';
            case 'aiPuckSpeed':
                return this.activeEffects[effect] < 1 ? 'AI Hit Speed Slowed' : 'AI Hit Speed Sped Up';
            case 'aiSlowdown':
                return this.activeEffects[effect] < 1 ? 'AI Movement Slowed' : 'AI Movement Sped Up';
            default:
                return effect;
        }
    }

    // Clear all effects (useful for game reset)
    clearAllEffects() {
        // Clear all timeouts
        for (const timerKey in this.effectTimers) {
            clearTimeout(this.effectTimers[timerKey]);
        }
        
        // Reset all effect values
        this.effectTimers = {};
        this.activeEffects = {
            playerPaddleSize: 1,
            aiPaddleSize: 1,
            playerPuckSpeed: 1,
            aiPuckSpeed: 1,
            aiSlowdown: 1
        };
        
        // Reset paddle sizes
        this.playerPaddle.setRadius(PADDLE_RADIUS);
        this.aiPaddle.setRadius(PADDLE_RADIUS);
        this.aiPaddle.freeze(false);
    }
}