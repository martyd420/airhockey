import { BONUS_RADIUS, BONUS_LIFETIME, BONUS_BLINK_TIME, CANVAS_WIDTH, CANVAS_HEIGHT } from '../config/constants.js';
import { BONUS_TYPES, BONUS_COLORS } from '../config/assetPaths.js';

export class Bonus {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.radius = BONUS_RADIUS;
        this.type = type;
        this.color = BONUS_COLORS[type];
        this.spawnTime = Date.now();
    }

    isExpired() {
        return Date.now() - this.spawnTime > BONUS_LIFETIME;
    }

    shouldBlink() {
        const remainingTime = BONUS_LIFETIME - (Date.now() - this.spawnTime);
        return remainingTime < BONUS_BLINK_TIME;
    }

    getBlinkAlpha() {
        const remainingTime = BONUS_LIFETIME - (Date.now() - this.spawnTime);
        return 0.6 + (remainingTime / BONUS_BLINK_TIME) * 0.4;
    }

    getBlinkRate() {
        const remainingTime = BONUS_LIFETIME - (Date.now() - this.spawnTime);
        return 150 + (remainingTime / BONUS_BLINK_TIME) * 200;
    }
}

export class BonusManager {
    constructor() {
        this.bonuses = [];
        this.collectionEffects = [];
    }

    spawnBonus() {
        if (this.bonuses.length >= 3) return false;

        const randomType = BONUS_TYPES[Math.floor(Math.random() * BONUS_TYPES.length)];
        const margin = BONUS_RADIUS * 3;
        const x = Math.random() * (CANVAS_WIDTH - margin * 2 - CANVAS_WIDTH * 0.2) + margin + CANVAS_WIDTH * 0.1;
        const y = Math.random() * (CANVAS_HEIGHT - margin * 2) + margin;
        
        this.bonuses.push(new Bonus(x, y, randomType));
        return true;
    }

    addCollectionEffect(x, y, radius, color) {
        this.collectionEffects.push({
            x: x,
            y: y,
            radius: radius,
            color: color,
            alpha: 0.8
        });
    }

    updateCollectionEffects() {
        for (let i = this.collectionEffects.length - 1; i >= 0; i--) {
            this.collectionEffects[i].alpha -= 0.05;
            this.collectionEffects[i].radius += 1;
            if (this.collectionEffects[i].alpha <= 0) {
                this.collectionEffects.splice(i, 1);
            }
        }
    }

    removeExpiredBonuses() {
        for (let i = this.bonuses.length - 1; i >= 0; i--) {
            if (this.bonuses[i].isExpired()) {
                this.bonuses.splice(i, 1);
            }
        }
    }

    getBonuses() {
        return this.bonuses;
    }

    getCollectionEffects() {
        return this.collectionEffects;
    }

    removeBonus(index) {
        if (index >= 0 && index < this.bonuses.length) {
            this.bonuses.splice(index, 1);
            return true;
        }
        return false;
    }
}