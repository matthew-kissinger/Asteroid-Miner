// gameLifecycle.js - Game lifecycle management (game over, cleanup, destruction)

export class GameLifecycle {
    constructor(game) {
        this.game = game;
    }
    
    checkGameOver() {
        // Make sure spaceship exists
        if (!this.game.spaceship) return;
        
        // Don't check for game over conditions if the ship is docked
        if (this.game.spaceship.isDocked) return;
        
        // Check if out of fuel and not near stargate
        if (this.game.spaceship.fuel <= 0 && !this.game.environment.stargate.isNearby(this.game.spaceship.mesh.position)) {
            this.gameOver('Out of fuel! You drift endlessly through space...');
        }
    }
    
    gameOver(reason) {
        if (this.game.isGameOver) return; // Prevent multiple game over triggers
        
        this.game.isGameOver = true;
        
        
        // Stop the game loop
        if (this.game.boundAnimate) {
            cancelAnimationFrame(this.game.boundAnimate);
        }
        
        // Show game over UI
        if (this.game.ui) {
            // Check if it's a horde mode game over
            if (this.game.hordeMode && this.game.hordeMode.isActive) {
                const survivalTime = this.game.hordeMode.getFormattedSurvivalTime();
                this.game.ui.showGameOver(`HORDE MODE - Survived: ${survivalTime}\\n${reason}`);
            } else {
                this.game.ui.showGameOver(reason);
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
    
    cleanup() {
        // Basic cleanup when game ends
        
        // Clear pools
        if (window.objectPool && window.objectPool.clearAllPools) {
            window.objectPool.clearAllPools();
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
    destroy() {
        
        // Destroy game loop
        if (this.game.gameLoop) {
            this.game.gameLoop.destroy();
            this.game.gameLoop = null;
        }
        
        // Clear any pending timeouts
        if (this.game.gameOverCleanupTimeout) {
            clearTimeout(this.game.gameOverCleanupTimeout);
            this.game.gameOverCleanupTimeout = null;
        }
        
        // Remove event listeners
        window.removeEventListener('resize', this.game.handleResize);
        document.removeEventListener('visibilitychange', this.game.handleVisibilityChange);
        document.removeEventListener('keydown', this.game.handleKeyDown);
        
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