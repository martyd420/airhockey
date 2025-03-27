import { CANVAS_WIDTH, CANVAS_HEIGHT, GOAL_WIDTH, GOAL_HEIGHT } from '../config/constants.js';
import { BONUS_COLORS } from '../config/assetPaths.js';

export class Renderer {
    constructor(canvas, images) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.images = images;
    }

    render(gameState) {
        const { playerPaddle, aiPaddle, puck, bonusManager, effectsSystem, collisionSystem } = gameState;
        
        this.clearCanvas();
        this.drawField();
        this.drawGoalFlash(collisionSystem.getGoalFlashInfo());
        
        // If images aren't loaded, show loading message
        if (!this.images || !this.images.imagesLoaded) {
            this.drawLoadingMessage();
            return;
        }
        
        this.drawBonuses(bonusManager.getBonuses());
        this.drawCollectionEffects(bonusManager.getCollectionEffects());
        this.drawPaddles(playerPaddle, aiPaddle, effectsSystem.getActiveEffects());
        this.drawPuck(puck, effectsSystem.getActiveEffects());
        this.drawActiveEffects(effectsSystem.getActiveEffects(), effectsSystem);
    }

    clearCanvas() {
        this.ctx.fillStyle = '#444';
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    drawField() {
        // Center line
        this.ctx.beginPath();
        this.ctx.setLineDash([10, 15]);
        this.ctx.moveTo(CANVAS_WIDTH / 2, 0);
        this.ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
        this.ctx.strokeStyle = '#555';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Goals
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.fillRect(0, (CANVAS_HEIGHT - GOAL_WIDTH) / 2, GOAL_HEIGHT, GOAL_WIDTH);
        
        this.ctx.fillStyle = '#3498db';
        this.ctx.fillRect(CANVAS_WIDTH - GOAL_HEIGHT, (CANVAS_HEIGHT - GOAL_WIDTH) / 2, GOAL_HEIGHT, GOAL_WIDTH);
    }

    drawGoalFlash(goalFlashInfo) {
        if (goalFlashInfo.alpha > 0) {
            const color = goalFlashInfo.side === 'left' ? 'rgba(231, 76, 60, ' : 'rgba(52, 152, 219, ';
            this.ctx.fillStyle = color + goalFlashInfo.alpha + ')';
            this.ctx.fillRect(
                goalFlashInfo.side === 'left' ? 0 : CANVAS_WIDTH / 2,
                0,
                CANVAS_WIDTH / 2,
                CANVAS_HEIGHT
            );
        }
    }

    drawLoadingMessage() {
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Loading assets...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }

    drawBonuses(bonuses) {
        const now = Date.now();
        
        bonuses.forEach(bonus => {
            let drawBonus = true;
            let alpha = 1.0;
            
            if (bonus.shouldBlink()) {
                const blinkRate = bonus.getBlinkRate();
                if (Math.floor(now / blinkRate) % 2 === 0) {
                    drawBonus = false;
                }
                alpha = bonus.getBlinkAlpha();
            }
            
            if (drawBonus) {
                // Get the right image for this bonus type
                const bonusImage = this.images.bonuses[bonus.type] || this.images.bonuses['generic'];
                
                if (bonusImage) {
                    // Calculate dimensions and position for drawImage
                    const drawWidth = bonus.radius * 2;
                    const drawHeight = bonus.radius * 2;
                    const drawX = bonus.x - bonus.radius;
                    const drawY = bonus.y - bonus.radius;
                    
                    this.ctx.save();
                    this.ctx.globalAlpha = alpha;
                    this.ctx.drawImage(bonusImage, drawX, drawY, drawWidth, drawHeight);
                    this.ctx.restore();
                } else {
                    // Fallback: If image isn't loaded, draw the original shape
                    this.ctx.save();
                    this.ctx.globalAlpha = alpha;
                    this.ctx.beginPath();
                    this.ctx.arc(bonus.x, bonus.y, bonus.radius, 0, Math.PI * 2);
                    this.ctx.fillStyle = bonus.color;
                    this.ctx.fill();
                    
                    // Star shape
                    const spikes = 5;
                    const outerRadius = bonus.radius * 0.8;
                    const innerRadius = bonus.radius * 0.4;
                    
                    this.ctx.beginPath();
                    for (let i = 0; i < spikes * 2; i++) {
                        const radius = i % 2 === 0 ? outerRadius : innerRadius;
                        const angle = (i * Math.PI) / spikes - Math.PI / 2;
                        const bx = bonus.x + Math.cos(angle) * radius;
                        const by = bonus.y + Math.sin(angle) * radius;
                        
                        if (i === 0) this.ctx.moveTo(bx, by);
                        else this.ctx.lineTo(bx, by);
                    }
                    this.ctx.closePath();
                    this.ctx.fillStyle = '#fff';
                    this.ctx.fill();
                    this.ctx.restore();
                }
            }
        });
    }

    drawCollectionEffects(effects) {
        effects.forEach(effect => {
            this.ctx.save();
            this.ctx.globalAlpha = effect.alpha;
            this.ctx.beginPath();
            this.ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
            this.ctx.strokeStyle = effect.color;
            this.ctx.lineWidth = 3;
            this.ctx.shadowColor = effect.color;
            this.ctx.shadowBlur = 10;
            this.ctx.stroke();
            this.ctx.restore();
        });
    }

    drawGlow(x, y, radius, baseColor, overrideColor = null) {
        const glowColor = overrideColor || baseColor;
        this.ctx.save();
        this.ctx.globalAlpha = 0.25 + Math.abs(Math.sin(Date.now() / 300)) * 0.25;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius * 1.5, 0, Math.PI * 2);
        this.ctx.fillStyle = glowColor;
        this.ctx.shadowColor = glowColor;
        this.ctx.shadowBlur = 20;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        this.ctx.restore();
    }

    drawPaddles(playerPaddle, aiPaddle, activeEffects) {
        // Player paddle
        if (this.images.playerPaddle) {
            const drawWidth = playerPaddle.radius * 2;
            const drawHeight = playerPaddle.radius * 2;
            const drawX = playerPaddle.x - playerPaddle.radius;
            const drawY = playerPaddle.y - playerPaddle.radius;
            
            // Optional glow effect
            if (activeEffects.playerPaddleSize !== 1) {
                this.drawGlow(playerPaddle.x, playerPaddle.y, playerPaddle.radius, playerPaddle.color);
            }
            
            this.ctx.drawImage(this.images.playerPaddle, drawX, drawY, drawWidth, drawHeight);
        } else {
            // Fallback
            this.ctx.beginPath();
            this.ctx.arc(playerPaddle.x, playerPaddle.y, playerPaddle.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = playerPaddle.color;
            this.ctx.fill();
        }
        
        // AI paddle
        if (this.images.aiPaddle) {
            const drawWidth = aiPaddle.radius * 2;
            const drawHeight = aiPaddle.radius * 2;
            const drawX = aiPaddle.x - aiPaddle.radius;
            const drawY = aiPaddle.y - aiPaddle.radius;
            
            // Optional glow
            if (activeEffects.aiPaddleSize !== 1 || activeEffects.aiFrozen) {
                this.drawGlow(
                    aiPaddle.x,
                    aiPaddle.y,
                    aiPaddle.radius,
                    aiPaddle.color,
                    activeEffects.aiFrozen ? BONUS_COLORS['freezeAI'] : null
                );
            }
            
            this.ctx.drawImage(this.images.aiPaddle, drawX, drawY, drawWidth, drawHeight);
        } else {
            // Fallback
            this.ctx.beginPath();
            this.ctx.arc(aiPaddle.x, aiPaddle.y, aiPaddle.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = aiPaddle.color;
            this.ctx.fill();
        }
    }

    drawPuck(puck, activeEffects) {
        if (this.images.puck) {
            const drawWidth = puck.radius * 2;
            const drawHeight = puck.radius * 2;
            const drawX = puck.x - puck.radius;
            const drawY = puck.y - puck.radius;
            
            // Optional glow
            if (activeEffects.playerPuckSpeed !== 1 || activeEffects.aiPuckSpeed !== 1) {
                this.drawGlow(puck.x, puck.y, puck.radius, puck.color);
            }
            
            this.ctx.drawImage(this.images.puck, drawX, drawY, drawWidth, drawHeight);
        } else {
            // Fallback
            // Shadow
            this.ctx.beginPath();
            this.ctx.arc(puck.x + 3, puck.y + 3, puck.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.fill();
            
            // Puck
            this.ctx.beginPath();
            this.ctx.arc(puck.x, puck.y, puck.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = puck.color;
            this.ctx.fill();
        }
    }

    drawActiveEffects(activeEffects, effectsSystem) {
        let effectY = 10;
        const effectHeight = 20;
        
        if (activeEffects.aiFrozen) {
            this.ctx.fillStyle = BONUS_COLORS['freezeAI'];
            this.ctx.fillRect(10, effectY, 5, effectHeight);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '12px Arial';
            this.ctx.fillText("AI Frozen", 20, effectY + 15);
            effectY += effectHeight + 5;
        }
        
        for (const effect in activeEffects) {
            if (activeEffects[effect] !== 1 && effect !== 'aiFrozen') {
                // Color bar
                this.ctx.fillStyle = activeEffects[effect] > 1 ? '#2ecc71' : '#e74c3c';
                this.ctx.fillRect(10, effectY, 5, effectHeight);
                
                // Effect text
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '12px Arial';
                this.ctx.fillText(effectsSystem.formatEffectName(effect), 20, effectY + 15);
                effectY += effectHeight + 5;
            }
        }
    }
}