/**
 * Initial Spawning - Handles initial spawn delay and first enemy notification
 */

export class InitialSpawning {
    constructor() {
        this.initialSpawnDelay = 60; // 60-second initial delay to match game requirements
        this.initialSpawnTimer = 0;
        this.initialSpawnComplete = false;
    }

    /**
     * Update initial spawn timer and check for completion
     * @param {number} deltaTime Time since last update in seconds
     * @returns {boolean} True if spawning should proceed, false if still in delay
     */
    updateInitialSpawn(deltaTime) {
        if (this.initialSpawnComplete) {
            return true;
        }

        this.initialSpawnTimer += deltaTime;
        
        // Log progress every 10 seconds
        if (Math.floor(this.initialSpawnTimer) % 10 === 0 && Math.floor(this.initialSpawnTimer) > 0) {
            const remainingTime = Math.ceil(this.initialSpawnDelay - this.initialSpawnTimer);
            console.log(`Initial spawn delay: ${remainingTime} seconds remaining`);
        }
        
        if (this.initialSpawnTimer >= this.initialSpawnDelay) {
            this.initialSpawnComplete = true;
            console.log(`Initial spawn delay complete. Spectral drones beginning to spawn.`);
            
            this.showSpawnNotification();
            return true;
        }
        
        return false;
    }

    /**
     * Show notification that spectral drones have been spotted
     */
    showSpawnNotification() {
        if (window.game && window.game.ui && window.game.ui.showNotification) {
            window.game.ui.showNotification('WARNING: Spectral drones have been spotted in the sector!', 5000);
        } else if (window.mainMessageBus) {
            window.mainMessageBus.publish('ui.notification', {
                message: 'WARNING: Spectral drones have been spotted in the sector!',
                duration: 5000
            });
        }
    }

    /**
     * Check if initial spawn delay is complete
     * @returns {boolean} True if initial spawn is complete
     */
    isInitialSpawnComplete() {
        return this.initialSpawnComplete;
    }

    /**
     * Reset initial spawn state
     */
    reset() {
        this.initialSpawnTimer = 0;
        this.initialSpawnComplete = false;
    }
}