// lifecycle.js - Game lifecycle methods (pause, resume, animate)
export class GameLifecycleManager {
    constructor(game) {
        this.game = game;
    }

    /**
     * Main animation loop
     */
    animate() {
        // Calculate delta time
        const now = performance.now();
        const deltaTime = Math.min(now - this.game.lastUpdateTime, 100) / 1000; // Clamped to 100ms
        this.game.lastUpdateTime = now;

        // Update game state
        this.game.systemCoordinator.update(deltaTime);

        // Update horde survival time if active
        this.game.stateManager.updateHordeTime();

        // Check for game over conditions
        this.game.stateManager.checkGameOver();

        // Render scene
        this.game.renderer.render();

        // Request next frame
        requestAnimationFrame(this.animate.bind(this));
    }

    /**
     * Pause the game
     */
    pause() {
        // Pause game logic here
        console.log('Game paused');
        
        // Mute audio when game is paused
        if (this.game.audio) {
            this.game.audio.muted = true;
            for (const sound of Object.values(this.game.audio.sounds)) {
                sound.muted = true;
            }
            for (const track of this.game.audio.music) {
                track.muted = true;
            }
        }
    }

    /**
     * Resume the game
     */
    resume() {
        // Resume game logic here
        console.log('Game resumed');
        this.game.lastUpdateTime = performance.now(); // Reset timer to avoid large delta
        
        // Unmute audio when game is resumed (only if not globally muted)
        if (this.game.audio && !this.game.audio.muted) {
            for (const sound of Object.values(this.game.audio.sounds)) {
                sound.muted = false;
            }
            for (const track of this.game.audio.music) {
                track.muted = false;
            }
        }
    }
}