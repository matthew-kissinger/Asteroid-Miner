// gameLifecycle.ts - Game lifecycle management (game over, cleanup, destruction)

import { objectPool } from '../globals/objectPool.ts';

interface GameInstance {
    spaceship: any;
    isGameOver: boolean;
    boundAnimate: any;
    ui: any;
    hordeMode: any;
    audio: any;
    environment: any;
    gameLoop: any;
    gameOverCleanupTimeout?: ReturnType<typeof setTimeout>;
    renderer: any;
    physics: any;
    controls: any;
    combat: any;
}

export class GameLifecycle {
    private game: GameInstance;

    constructor(game: GameInstance) {
        this.game = game;
    }

    checkGameOver(): void {
        // Make sure spaceship exists
        if (!this.game.spaceship) return;

        // Don't check for game over conditions if the ship is docked
        if (this.game.spaceship.isDocked) return;

        // Check if out of fuel and not near stargate
        if (this.game.spaceship.fuel <= 0 && !this.game.environment.stargate.isNearby(this.game.spaceship.mesh.position)) {
            this.gameOver('Out of fuel! You drift endlessly through space...');
        }
    }

    gameOver(reason: string): void {
        if (this.game.isGameOver) return; // Prevent multiple game over triggers

        this.game.isGameOver = true;


        // Stop the game loop
        if (this.game.boundAnimate) {
            cancelAnimationFrame(this.game.boundAnimate);
        }

        // Show game over UI
        if (this.game.ui) {
            // Collect session stats if available
            const stats = (this.game as any).sessionStats ? (this.game as any).sessionStats.getStats() : null;
            
            // Check if it's a horde mode game over
            if (this.game.hordeMode && this.game.hordeMode.isActive) {
                const survivalTime = this.game.hordeMode.getFormattedSurvivalTime();
                this.game.ui.showGameOver(`HORDE MODE - Survived: ${survivalTime}\n${reason}`, null, stats);
            } else {
                this.game.ui.showGameOver(reason, null, stats);
            }
        }

        // Play game over sound
        if (this.game.audio) {
            this.game.audio.playSound('gameOver');
        }

        // Cleanup after a delay
        this.game.gameOverCleanupTimeout = setTimeout(() => {
            this.cleanup();
        }, 5000);
    }

    cleanup(): void {
        // Basic cleanup when game ends

        // Clear pools
        if (objectPool && objectPool.clearAllPools) {
            objectPool.clearAllPools();
        }

        // Stop all audio
        if (this.game.audio && this.game.audio.cleanup) {
            this.game.audio.cleanup();
        }
    }

    /**
     * Clean up all game resources, event listeners, and references
     * Call this when the game is no longer needed to prevent memory leaks
     */
    destroy(): void {

        // Destroy game loop
        if (this.game.gameLoop) {
            this.game.gameLoop.destroy();
            this.game.gameLoop = null;
        }

        // Clear any pending timeouts
        if (this.game.gameOverCleanupTimeout) {
            clearTimeout(this.game.gameOverCleanupTimeout);
            this.game.gameOverCleanupTimeout = undefined;
        }

        // Remove event listeners
        window.removeEventListener('resize', (this.game as any).handleResize);
        document.removeEventListener('visibilitychange', (this.game as any).handleVisibilityChange);
        document.removeEventListener('keydown', (this.game as any).handleKeyDown);

        // Clean up modules
        if (this.game.renderer) {
            this.game.renderer.dispose();
            this.game.renderer = null;
        }

        if (this.game.audio) {
            this.game.audio.dispose();
            this.game.audio = null;
        }

        if (this.game.physics) {
            this.game.physics.dispose();
            this.game.physics = null;
        }

        if (this.game.spaceship) {
            this.game.spaceship.dispose();
            this.game.spaceship = null;
        }

        if (this.game.environment) {
            this.game.environment.dispose();
            this.game.environment = null;
        }

        if (this.game.controls) {
            this.game.controls.dispose();
            this.game.controls = null;
        }

        if (this.game.ui) {
            this.game.ui.dispose();
            this.game.ui = null;
        }

        if (this.game.combat) {
            this.game.combat.dispose();
            this.game.combat = null;
        }

        // Clear global references
        window.game = null;

    }
}
