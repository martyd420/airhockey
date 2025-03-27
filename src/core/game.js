import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../config/constants.js';
import { PlayerPaddle, AIPaddle } from '../entities/paddle.js';
import { Puck } from '../entities/puck.js';
import { BonusManager } from '../entities/bonus.js';
import { AISystem } from '../systems/ai.js';
import { CollisionSystem } from '../systems/collision.js';
import { EffectsSystem } from '../systems/effects.js';
import { ScoreSystem } from '../systems/scoreboard.js';
import { AudioSystem } from '../systems/audio.js';
import { Renderer } from '../rendering/renderer.js';
import { GameLoop } from './gameLoop.js';
import { AssetLoader } from './assetLoader.js';

export class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;
        this.ctx = this.canvas.getContext('2d');
        
        // Mouse tracking
        this.mouseX = 0;
        this.mouseY = 0;
        
        // Asset loader
        this.assetLoader = new AssetLoader();
        
        // Systems will be initialized after assets are loaded
        this.gameLoop = null;
        this.initialized = false;
    }

    init() {
        // Display loading message
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Loading assets...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        
        // Set up mouse tracking
        this.canvas.addEventListener('mousemove', this.trackMouse.bind(this));
        
        // Load assets and then initialize game systems
        this.assetLoader.loadAllImages(() => this.initializeGameSystems());
    }

    initializeGameSystems() {
        console.log("Initializing game systems...");
        console.log("Images loaded state:", this.assetLoader.isLoaded());
        console.log("Images object:", this.assetLoader.getImages());
        
        // Create entities
        this.playerPaddle = new PlayerPaddle();
        this.aiPaddle = new AIPaddle();
        this.puck = new Puck();
        this.bonusManager = new BonusManager();
        
        // Create systems
        this.audioSystem = new AudioSystem();
        this.scoreSystem = new ScoreSystem();
        this.collisionSystem = new CollisionSystem(
            this.playerPaddle,
            this.aiPaddle,
            this.puck,
            this.audioSystem,
            this.scoreSystem
        );
        this.effectsSystem = new EffectsSystem(this.playerPaddle, this.aiPaddle);
        this.aiSystem = new AISystem(this.aiPaddle, this.puck);
        
        // Get images and add the imagesLoaded flag directly
        const images = this.assetLoader.getImages();
        images.imagesLoaded = this.assetLoader.isLoaded();
        this.renderer = new Renderer(this.canvas, images);
        
        // Set up game loop
        this.gameLoop = new GameLoop(
            this.update.bind(this),
            this.render.bind(this)
        );
        
        // Set up restart button
        document.getElementById('restart-button').addEventListener('click', this.restartGame.bind(this));
        
        // Spawn initial bonus and reset puck
        this.puck.reset();
        this.spawnBonus();
        
        // Start the game loop
        this.gameLoop.start();
        this.initialized = true;
    }

    trackMouse(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
    }

    update() {
        if (!this.assetLoader.isLoaded() || this.scoreSystem.isGameOver()) {
            return;
        }
        
        // Update player paddle position based on mouse
        this.playerPaddle.move(this.mouseX, this.mouseY);
        
        // Update AI
        this.aiSystem.update(this.effectsSystem.getAISlowdownMultiplier());
        
        // Update puck physics
        this.puck.update();
        
        // Check collisions
        this.collisionSystem.checkCollisions();
        
        // Check for bonus collection
        if (this.collisionSystem.checkBonusCollision(this.bonusManager, this.effectsSystem)) {
            // Schedule a new bonus to spawn
            setTimeout(this.spawnBonus.bind(this), 3000);
        }
        
        // Update bonus-related systems
        this.bonusManager.removeExpiredBonuses();
        this.bonusManager.updateCollectionEffects();
        this.collisionSystem.updateGoalFlash();
    }

    render() {
        // Use the renderer to draw everything
        this.renderer.render({
            playerPaddle: this.playerPaddle,
            aiPaddle: this.aiPaddle,
            puck: this.puck,
            bonusManager: this.bonusManager,
            effectsSystem: this.effectsSystem,
            collisionSystem: this.collisionSystem
        });
    }

    spawnBonus() {
        if (!this.assetLoader.isLoaded() || this.scoreSystem.isGameOver()) {
            // Try again later if assets aren't loaded or game is over
            setTimeout(this.spawnBonus.bind(this), 500);
            return;
        }
        
        if (this.bonusManager.spawnBonus()) {
            // Schedule next bonus spawn after a random delay
            setTimeout(this.spawnBonus.bind(this), Math.random() * 8000 + 4000);
        } else {
            // Too many bonuses, try again later
            setTimeout(this.spawnBonus.bind(this), 5000);
        }
    }

    restartGame() {
        if (!this.assetLoader.isLoaded()) return;
        
        // Reset score
        this.scoreSystem.reset();
        
        // Clear effects
        this.effectsSystem.clearAllEffects();
        
        // Reset entities
        this.bonusManager = new BonusManager();
        this.puck.reset();
        
        // Spawn a new bonus
        this.spawnBonus();
    }
}