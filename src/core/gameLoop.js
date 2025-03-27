export class GameLoop {
    constructor(updateFn, renderFn) {
        this.update = updateFn;
        this.render = renderFn;
        this.isRunning = false;
        this.animationFrameId = null;
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.loop();
        }
    }

    stop() {
        if (this.isRunning) {
            this.isRunning = false;
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
        }
    }

    loop() {
        if (!this.isRunning) return;

        this.update();
        this.render();
        
        this.animationFrameId = requestAnimationFrame(() => this.loop());
    }
}