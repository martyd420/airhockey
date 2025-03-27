import { PUCK_RADIUS, CANVAS_WIDTH, CANVAS_HEIGHT, FRICTION } from '../config/constants.js';

export class Puck {
    constructor() {
        this.x = CANVAS_WIDTH / 2;
        this.y = CANVAS_HEIGHT / 2;
        this.radius = PUCK_RADIUS;
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 5;
        this.color = '#f1c40f'; // Color for glow effect or fallback
    }

    update() {
        // Apply velocity to position
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        // Apply friction
        this.velocityX *= FRICTION;
        this.velocityY *= FRICTION;
    }

    reset() {
        // Reset position to center
        this.x = CANVAS_WIDTH / 2;
        this.y = CANVAS_HEIGHT / 2;
        
        // Set random velocity
        const angle = (Math.random() * 90 - 45) * Math.PI / 180;
        const direction = Math.random() < 0.5 ? 1 : -1;
        this.velocityX = Math.cos(angle) * this.speed * direction;
        this.velocityY = Math.sin(angle) * this.speed;
    }

    reverseX() {
        this.velocityX = -this.velocityX;
    }

    reverseY() {
        this.velocityY = -this.velocityY;
    }
}