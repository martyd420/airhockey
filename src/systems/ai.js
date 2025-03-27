import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../config/constants.js';

export class AISystem {
    constructor(aiPaddle, puck) {
        this.aiPaddle = aiPaddle;
        this.puck = puck;
    }

    update(effectiveSlowdown = 1) {
        if (this.aiPaddle.isFrozen()) {
            return; // AI is frozen, don't move
        }

        const effectiveSpeed = this.aiPaddle.speed * effectiveSlowdown;
        const dx = this.puck.x - this.aiPaddle.x;
        const dy = this.puck.y - this.aiPaddle.y;
        const distanceToPuck = Math.sqrt(dx * dx + dy * dy);
        
        const goalX = 0;
        const goalY = CANVAS_HEIGHT / 2;
        const goalAngle = Math.atan2(goalY - this.puck.y, goalX - this.puck.x);
        const randomOffset = Math.random() * 30 - 15;
        
        const puckOnAISide = this.puck.x > CANVAS_WIDTH / 2;
        const puckBehindAI = this.puck.x > this.aiPaddle.x;
        
        let targetX, targetY;
        let speedMultiplier = 1;
        let isEscapingCorner = false;
        
        const cornerDetectMarginX = this.aiPaddle.radius + this.puck.radius + 20;
        const cornerDetectMarginY = this.aiPaddle.radius + this.puck.radius + 20;
        const escapeTargetX = CANVAS_WIDTH - (this.aiPaddle.radius + this.puck.radius) * 2.5;
        const escapeTargetYOffset = (this.aiPaddle.radius + this.puck.radius) * 2.5;
        
        // Top-right corner detection and escape
        if (puckOnAISide && this.puck.x > CANVAS_WIDTH - cornerDetectMarginX && this.puck.y < cornerDetectMarginY) {
            if (this.aiPaddle.x > CANVAS_WIDTH - cornerDetectMarginX * 1.2 && this.aiPaddle.y < cornerDetectMarginY * 1.2) {
                if (distanceToPuck < this.aiPaddle.radius + this.puck.radius + 15 || 
                    (Math.abs(this.puck.velocityX) < 0.5 && Math.abs(this.puck.velocityY) < 0.5)) {
                    isEscapingCorner = true;
                    targetX = escapeTargetX;
                    targetY = escapeTargetYOffset;
                    speedMultiplier = 2.2;
                }
            }
        }
        // Bottom-right corner detection and escape
        else if (puckOnAISide && this.puck.x > CANVAS_WIDTH - cornerDetectMarginX && 
                 this.puck.y > CANVAS_HEIGHT - cornerDetectMarginY) {
            if (this.aiPaddle.x > CANVAS_WIDTH - cornerDetectMarginX * 1.2 && 
                this.aiPaddle.y > CANVAS_HEIGHT - cornerDetectMarginY * 1.2) {
                if (distanceToPuck < this.aiPaddle.radius + this.puck.radius + 15 || 
                    (Math.abs(this.puck.velocityX) < 0.5 && Math.abs(this.puck.velocityY) < 0.5)) {
                    isEscapingCorner = true;
                    targetX = escapeTargetX;
                    targetY = CANVAS_HEIGHT - escapeTargetYOffset;
                    speedMultiplier = 2.2;
                }
            }
        }
        
        // If not escaping a corner
        if (!isEscapingCorner) {
            if (puckBehindAI && puckOnAISide) {
                // Puck behind AI, move quickly to block
                targetX = CANVAS_WIDTH - this.aiPaddle.radius - 5;
                targetY = this.puck.y;
                speedMultiplier = 2.5;
                targetY = Math.max(this.aiPaddle.radius, Math.min(CANVAS_HEIGHT - this.aiPaddle.radius, targetY));
            }
            else if (puckOnAISide) {
                let isDefending = false;
                // Defending goal when puck is close and moving towards goal
                if (this.puck.x > CANVAS_WIDTH - 180 && 
                    (this.puck.velocityX > 0.05 || this.puck.x > CANVAS_WIDTH - 100)) {
                    isDefending = true;
                    targetX = Math.max(this.puck.x + this.puck.radius, CANVAS_WIDTH - 100);
                    targetX = Math.min(CANVAS_WIDTH - this.aiPaddle.radius, targetX);
                    
                    const timeToGoal = (this.puck.velocityX > 0.1) ? 
                                    (CANVAS_WIDTH - this.puck.x) / this.puck.velocityX : 1000;
                    let interceptY = this.puck.y + this.puck.velocityY * Math.min(timeToGoal, 1.0);
                    interceptY = (interceptY + CANVAS_HEIGHT/2) / 2;
                    targetY = interceptY;
                    targetY = Math.max(this.aiPaddle.radius, Math.min(CANVAS_HEIGHT - this.aiPaddle.radius, targetY));
                    speedMultiplier = 1.9;
                }
                
                if (!isDefending) {
                    // Offensive positioning
                    const desiredOffsetX = Math.cos(goalAngle) * this.aiPaddle.radius * 1.2;
                    const desiredOffsetY = Math.sin(goalAngle) * this.aiPaddle.radius * 1.2;
                    const alignedBehind = (this.aiPaddle.x > this.puck.x - 10);
                    const aggressionThreshold = this.aiPaddle.radius + this.puck.radius + 35;
                    
                    targetX = this.puck.x - desiredOffsetX;
                    targetY = this.puck.y - desiredOffsetY + randomOffset;
                    speedMultiplier = 1.2;
                    
                    if (distanceToPuck < aggressionThreshold) {
                        if (alignedBehind) {
                            // Hit toward goal
                            targetX = this.puck.x + desiredOffsetX * 1.8;
                            targetY = this.puck.y + desiredOffsetY * 1.8;
                            targetX = Math.max(CANVAS_WIDTH / 2 + this.aiPaddle.radius, 
                                       Math.min(CANVAS_WIDTH - this.aiPaddle.radius, targetX));
                            targetY = Math.max(this.aiPaddle.radius, 
                                       Math.min(CANVAS_HEIGHT - this.aiPaddle.radius, targetY));
                            speedMultiplier = 2.1;
                        } else {
                            speedMultiplier = 1.7;
                        }
                    }
                }
            }
            else { // Puck on player's side
                targetX = CANVAS_WIDTH * 0.70;
                const isPuckMovingTowardsAI = this.puck.velocityX > 0.1;
                const isPuckGenerallyMoving = Math.abs(this.puck.velocityX) > 0.05 || Math.abs(this.puck.velocityY) > 0.05;
                
                if (isPuckMovingTowardsAI) {
                    // Intercept puck coming toward AI side
                    const timeToCenter = Math.max(0, (CANVAS_WIDTH / 2 - this.puck.x) / (this.puck.velocityX + 0.01));
                    const maxPredictTime = 1.5 * CANVAS_HEIGHT / (Math.abs(this.puck.velocityY) + 1);
                    const effectiveTimeToCenter = Math.min(timeToCenter, maxPredictTime);
                    let crossY = this.puck.y + this.puck.velocityY * effectiveTimeToCenter;
                    let interceptX = CANVAS_WIDTH / 2 + this.aiPaddle.radius * 1.5;
                    const puckFutureY = this.puck.y + this.puck.velocityY * effectiveTimeToCenter;
                    
                    // Wall bounce prediction
                    if ((puckFutureY < this.puck.radius && this.puck.velocityY < 0) || 
                        (puckFutureY > CANVAS_HEIGHT - this.puck.radius && this.puck.velocityY > 0)) {
                        
                        const timeToWall = (this.puck.velocityY < 0 ? 
                                        (this.puck.y - this.puck.radius) : 
                                        (CANVAS_HEIGHT - this.puck.radius - this.puck.y)) / 
                                        Math.abs(this.puck.velocityY + 0.01);
                        
                        if (timeToWall >= 0 && timeToWall < effectiveTimeToCenter) {
                            const xAtWall = this.puck.x + this.puck.velocityX * timeToWall;
                            const remainingTime = effectiveTimeToCenter - timeToWall;
                            crossY = (this.puck.velocityY < 0 ? this.puck.radius : CANVAS_HEIGHT - this.puck.radius);
                            crossY -= this.puck.velocityY * remainingTime;
                            interceptX = xAtWall + this.puck.velocityX * remainingTime;
                            interceptX = Math.max(CANVAS_WIDTH / 2 + this.aiPaddle.radius, interceptX);
                        }
                    }
                    
                    targetX = interceptX;
                    targetY = crossY;
                    speedMultiplier = 1.7;
                } else if (isPuckGenerallyMoving) {
                    targetY = CANVAS_HEIGHT / 2 + randomOffset / 3;
                    speedMultiplier = 1.0;
                } else {
                    targetY = CANVAS_HEIGHT / 2;
                    speedMultiplier = 0.8;
                }
            }
        }
        
        // Final position constraints
        targetY = Math.max(this.aiPaddle.radius, Math.min(CANVAS_HEIGHT - this.aiPaddle.radius, targetY));
        targetX = Math.max(CANVAS_WIDTH / 2 + this.aiPaddle.radius, 
                   Math.min(CANVAS_WIDTH - this.aiPaddle.radius, targetX));
        
        // Movement
        const moveDx = targetX - this.aiPaddle.x;
        const moveDy = targetY - this.aiPaddle.y;
        const distanceToTarget = Math.sqrt(moveDx * moveDx + moveDy * moveDy);
        const movementThreshold = 2;
        
        if (distanceToTarget > movementThreshold) {
            let moveSpeed = effectiveSpeed * speedMultiplier;
            if (distanceToTarget < this.aiPaddle.radius * 0.5) {
                moveSpeed *= 0.6;
            }
            
            const normDx = moveDx / distanceToTarget;
            const normDy = moveDy / distanceToTarget;
            const step = Math.min(moveSpeed, distanceToTarget);
            
            this.aiPaddle.x += normDx * step;
            this.aiPaddle.y += normDy * step;
        }
        
        // Ensure paddle stays within bounds
        this.aiPaddle.constrainPosition();
    }
}