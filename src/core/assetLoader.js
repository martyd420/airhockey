import { IMAGE_PATHS } from '../config/assetPaths.js';

export class AssetLoader {
    constructor() {
        this.images = {
            playerPaddle: null,
            aiPaddle: null,
            puck: null,
            bonuses: {}
        };
        this.imagesLoaded = false;
        this.imagesToLoad = 0;
        this.imagesLoadedCount = 0;
        this.onAllLoaded = null;
    }

    loadImage(key, path) {
        this.imagesToLoad++;
        const img = new Image();
        img.onload = () => {
            this.imagesLoadedCount++;
            console.log(`Image loaded: ${path}`);
            if (this.imagesLoadedCount === this.imagesToLoad) {
                this.imagesLoaded = true;
                console.log("All images loaded successfully.");
                if (this.onAllLoaded) {
                    this.onAllLoaded();
                }
            }
        };
        img.onerror = () => {
            console.error(`Failed to load image: ${path}`);
            // Could add fallback or stop the game
        };
        img.src = path;
        return img;
    }

    loadAllImages(callback) {
        console.log("Loading images...");
        this.onAllLoaded = callback;

        this.images.playerPaddle = this.loadImage('playerPaddle', IMAGE_PATHS.playerPaddle);
        this.images.aiPaddle = this.loadImage('aiPaddle', IMAGE_PATHS.aiPaddle);
        this.images.puck = this.loadImage('puck', IMAGE_PATHS.puck);

        for (const type in IMAGE_PATHS.bonuses) {
            this.images.bonuses[type] = this.loadImage(`bonus_${type}`, IMAGE_PATHS.bonuses[type]);
        }
    }

    isLoaded() {
        return this.imagesLoaded;
    }

    getImages() {
        return this.images;
    }
}