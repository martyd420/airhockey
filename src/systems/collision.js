import { CANVAS_WIDTH, CANVAS_HEIGHT, GOAL_WIDTH, GOAL_HEIGHT } from '../config/constants.js';

export class CollisionSystem {
    constructor(playerPaddle, aiPaddle, puck, audioSystem, scoreSystem) {
        this.playerPaddle = playerPaddle;
        this.aiPaddle = aiPaddle;
        this.puck = puck;
        this.audioSystem = audioSystem;
        this.scoreSystem = scoreSystem;
        this.goalFlashAlpha = 0;
        this.goalSide = '';
    }

    checkCollisions() {
        this.playerPaddle.updateVelocity();
        this.aiPaddle.updateVelocity();

        this.checkWallCollisions();
        this.checkPaddleCollisions();
        this.checkGoals();
    }

    checkWallCollisions() {
        // Top and bottom walls
        if (this.puck.y - this.puck.radius < 0) {
            this.puck.velocityY = Math.abs(this.puck.velocityY) * 1.05;
            this.puck.y = this.puck.radius + 1;
            this.audioSystem.playSound('wall');
        } else if (this.puck.y + this.puck.radius > CANVAS_HEIGHT) {
            this.puck.velocityY = -Math.abs(this.puck.velocityY) * 1.05;
            this.puck.y = CANVAS_HEIGHT - this.puck.radius - 1;
            this.audioSystem.playSound('wall');
        }

        // Side walls (excluding goal areas)
        const goalTopY = (CANVAS_HEIGHT - GOAL_WIDTH) / 2;
        const goalBottomY = (CANVAS_HEIGHT + GOAL_WIDTH) / 2;

        if ((this.puck.x - this.puck.radius < 0 && (this.puck.y < goalTopY || this.puck.y > goalBottomY)) || 
            (this.puck.x + this.puck.radius > CANVAS_WIDTH && (this.puck.y < goalTopY || this.puck.y > goalBottomY))) {
            
            this.puck.velocityX = -this.puck.velocityX * 1.05;
            
            if (this.puck.x - this.puck.radius < 0) {
                this.puck.x = this.puck.radius + 1;
            } else if (this.puck.x + this.puck.radius > CANVAS_WIDTH) {
                this.puck.x = CANVAS_WIDTH - this.puck.radius - 1;
            }
            
            this.audioSystem.playSound('wall');
        }
    }

    checkPaddleCollisions() {
        // Player paddle collision
        const playerDx = this.puck.x - this.playerPaddle.x;
        const playerDy = this.puck.y - this.playerPaddle.y;
        const playerDistance = Math.sqrt(playerDx * playerDx + playerDy * playerDy);

        if (playerDistance < this.puck.radius + this.playerPaddle.radius) {
            const stretchedDx = playerDx * 1.5;
            const collisionAngle = Math.atan2(playerDy, stretchedDx);
            
            // Apply effective speed based on active effects
            const effectiveSpeed = this.puck.speed;
            
            this.puck.velocityX = Math.cos(collisionAngle) * effectiveSpeed + this.playerPaddle.velocityX * 0.7;
            this.puck.velocityY = Math.sin(collisionAngle) * effectiveSpeed + this.playerPaddle.velocityY * 0.4;
            
            // Prevent overlapping by pushing puck outside paddle
            const overlap = (this.puck.radius + this.playerPaddle.radius) - playerDistance;
            this.puck.x += (playerDx / playerDistance) * (overlap + 1);
            this.puck.y += (playerDy / playerDistance) * (overlap + 1);
            
            this.audioSystem.playSound('paddle');
        }

        // AI paddle collision
        const aiDx = this.puck.x - this.aiPaddle.x;
        const aiDy = this.puck.y - this.aiPaddle.y;
        const aiDistance = Math.sqrt(aiDx * aiDx + aiDy * aiDy);

        if (aiDistance < this.puck.radius + this.aiPaddle.radius) {
            const stretchedDx = aiDx * 1.5;
            const collisionAngle = Math.atan2(aiDy, stretchedDx);
            
            // Apply effective speed based on active effects
            const effectiveSpeed = this.puck.speed;
            
            this.puck.velocityX = Math.cos(collisionAngle) * effectiveSpeed + this.aiPaddle.velocityX * 0.7;
            this.puck.velocityY = Math.sin(collisionAngle) * effectiveSpeed + this.aiPaddle.velocityY * 0.4;
            
            // Prevent overlapping
            const overlap = (this.puck.radius + this.aiPaddle.radius) - aiDistance;
            this.puck.x += (aiDx / aiDistance) * (overlap + 1);
            this.puck.y += (aiDy / aiDistance) * (overlap + 1);
            
            this.audioSystem.playSound('paddle');
        }
    }

    checkGoals() {
        const goalTopY = (CANVAS_HEIGHT - GOAL_WIDTH) / 2;
        const goalBottomY = (CANVAS_HEIGHT + GOAL_WIDTH) / 2;

        // Check if puck entered right goal (player scores)
        if (this.puck.x + this.puck.radius > CANVAS_WIDTH) {
            if (this.puck.y > goalTopY && this.puck.y < goalBottomY) {
                this.scoreSystem.playerScores();
                this.audioSystem.playSound('goal');
                this.goalFlashAlpha = 1.0;
                this.goalSide = 'right';
                this.puck.reset();
            } else {
                this.puck.velocityX = -Math.abs(this.puck.velocityX) * 1.1;
                this.puck.x = CANVAS_WIDTH - this.puck.radius - 1;
                this.audioSystem.playSound('wall');
            }
        }

        // Check if puck entered left goal (AI scores)
        if (this.puck.x - this.puck.radius < 0) {
            if (this.puck.y > goalTopY && this.puck.y < goalBottomY) {
                this.scoreSystem.aiScores();
                this.audioSystem.playSound('goal');
                this.goalFlashAlpha = 1.0;
                this.goalSide = 'left';
                this.puck.reset();
            } else {
                this.puck.velocityX = Math.abs(this.puck.velocityX) * 1.1;
                this.puck.x = this.puck.radius + 1;
                this.audioSystem.playSound('wall');
            }
        }
    }

    getGoalFlashInfo() {
        return {
            alpha: this.goalFlashAlpha,
            side: this.goalSide
        };
    }

    updateGoalFlash() {
        if (this.goalFlashAlpha > 0) {
            this.goalFlashAlpha -= 0.02;
        }
    }

    checkBonusCollision(bonusManager, effectsSystem) {
        const bonuses = bonusManager.getBonuses();
        
        for (let i = bonuses.length - 1; i >= 0; i--) {
            const bonus = bonuses[i];
            const dx = this.puck.x - bonus.x;
            const dy = this.puck.y - bonus.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.puck.radius + bonus.radius) {
                effectsSystem.applyBonusEffect(bonus.type);
                this.audioSystem.playSound('bonus');
                
                bonusManager.addCollectionEffect(bonus.x, bonus.y, bonus.radius, bonus.color);
                bonusManager.removeBonus(i);
                
                return true; // Bonus collected
            }
        }
        
        return false; // No bonus collected
    }
}