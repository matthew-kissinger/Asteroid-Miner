// lifecycle.ts - Game lifecycle methods (pause, resume, animate)
import { Game } from '../game';

export class GameLifecycleManager {
    private game: Game;

    constructor(game: Game) {
        this.game = game;
    }

    /**
     * Main animation loop
     */
    animate(): void {
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
        if (this.game.renderer && this.game.renderer.render) {
            this.game.renderer.render();
        }

        // Request next frame
        requestAnimationFrame(this.animate.bind(this));
    }

    /**
     * Pause the game
     */
    pause(): void {
        // Pause game logic here
        console.log('Game paused');
        
        // Mute audio when game is paused
        if (this.game.audio) {
            this.game.audio.muted = true;
            if (this.game.audio.sounds) {
                for (const sound of Object.values(this.game.audio.sounds)) {
                    (sound as any).muted = true;
                }
            }
            if ((this.game.audio as any).music) {
                for (const track of (this.game.audio as any).music) {
                    track.muted = true;
                }
            }
        }
    }

    /**
     * Resume the game
     */
    resume(): void {
        // Resume game logic here
        console.log('Game resumed');
        this.game.lastUpdateTime = performance.now(); // Reset timer to avoid large delta
        
        // Unmute audio when game is resumed (only if not globally muted)
        if (this.game.audio && !this.game.audio.muted) {
            if (this.game.audio.sounds) {
                for (const sound of Object.values(this.game.audio.sounds)) {
                    (sound as any).muted = false;
                }
            }
            if ((this.game.audio as any).music) {
                for (const track of (this.game.audio as any).music) {
                    track.muted = false;
                }
            }
        }
    }
}
