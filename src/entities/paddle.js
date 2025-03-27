import { PADDLE_RADIUS, PADDLE_SPEED, AI_PADDLE_SPEED, CANVAS_WIDTH, CANVAS_HEIGHT } from '../config/constants.js';

export class Paddle {
    constructor(x, y, isPlayer = true) {
        this.x = x;
        this.y = y;
        this.radius = PADDLE_RADIUS;
        this.speed = isPlayer ? PADDLE_SPEED : AI_PADDLE_SPEED;
        this.color = isPlayer ? '#3498db' : '#e74c3c'; // Color for glow effect or fallback
        this.isPlayer = isPlayer;
    }

    move(x, y) {
        this.x = x;
        this.y = y;
        this.constrainPosition();
    }

    constrainPosition() {
        // Keep paddle within canvas boundaries
        if (this.y - this.radius < 0) this.y = this.radius;
        else if (this.y + this.radius > CANVAS_HEIGHT) this.y = CANVAS_HEIGHT - this.radius;
        
        if (this.isPlayer) {
            // Player can only move in left half
            if (this.x - this.radius < 0) this.x = this.radius;
            else if (this.x + this.radius > CANVAS_WIDTH / 2) this.x = CANVAS_WIDTH / 2 - this.radius;
        } else {
            // AI can only move in right half
            if (this.x - this.radius < CANVAS_WIDTH / 2) this.x = CANVAS_WIDTH / 2 + this.radius;
            else if (this.x + this.radius > CANVAS_WIDTH) this.x = CANVAS_WIDTH - this.radius;
        }
    }

    setRadius(radius) {
        this.radius = radius;
        this.constrainPosition();
    }

    setSpeed(speed) {
        this.speed = speed;
    }
}

export class PlayerPaddle extends Paddle {
    constructor() {
        super(50, CANVAS_HEIGHT / 2, true);
        this.prevX = 0;
        this.prevY = 0;
        this.velocityX = 0;
        this.velocityY = 0;
    }

    updateVelocity() {
        this.velocityX = this.x - this.prevX;
        this.velocityY = this.y - this.prevY;
        this.prevX = this.x;
        this.prevY = this.y;
    }
}

export class AIPaddle extends Paddle {
    constructor() {
        super(CANVAS_WIDTH - 50, CANVAS_HEIGHT / 2, false);
        this.prevX = 0;
        this.prevY = 0;
        this.velocityX = 0;
        this.velocityY = 0;
        this.frozen = false;
    }

    updateVelocity() {
        this.velocityX = this.x - this.prevX;
        this.velocityY = this.y - this.prevY;
        this.prevX = this.x;
        this.prevY = this.y;
    }

    freeze(isFrozen) {
        this.frozen = isFrozen;
    }

    isFrozen() {
        return this.frozen;
    }
}