// Game constants
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 500;
export const PADDLE_RADIUS = 30; // Still used for collisions and size calculations
export const PUCK_RADIUS = 15;   // Still used for collisions and size calculations
export const BONUS_RADIUS = 20;  // Still used for collisions and size calculations
export const GOAL_WIDTH = 120;
export const GOAL_HEIGHT = 10;
export const MAX_SCORE = 10;
export const PADDLE_SPEED = 8;
export const AI_PADDLE_SPEED = 5;
export const FRICTION = 0.98;
export const BONUS_LIFETIME = 10000; // Bonus lifetime in ms (10 seconds)
export const BONUS_BLINK_TIME = 1256; // Start blinking N ms before expiring
export const AI_FREEZE_DURATION = 3000; // AI freeze duration in ms
export const EFFECT_DURATION = 5000; // Duration for most bonus effects