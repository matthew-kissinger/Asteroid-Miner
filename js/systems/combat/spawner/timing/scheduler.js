/**
 * Spawn Scheduler - Manages timing, delays, and spawn rate control
 */

/**
 * Spawn scheduler for managing enemy spawn timing
 */
export class SpawnScheduler {
    constructor() {
        this.spawnTimer = 0;
        this.baseSpawnInterval = 3; // Base seconds between spawns
        this.currentSpawnInterval = 3;
        this.lastSpawnTime = Date.now();
        this.initialDelay = 10; // Reduced to 10 seconds for testing (was 60)
        this.initialDelayRemaining = this.initialDelay;
        this.hasInitialDelayPassed = false;
        
        // Spawn rate modifiers
        this.spawnRateModifier = 1.0;
        this.minSpawnInterval = 0.5; // Minimum time between spawns
        this.maxSpawnInterval = 10.0; // Maximum time between spawns
        
        // Statistics
        this.totalSpawnsRequested = 0;
        this.totalSpawnsSuccessful = 0;
        this.lastSpawnRequestTime = 0;
        this.averageSpawnInterval = this.baseSpawnInterval;
        this._lastProgressLogged = 0; // Track progress logging to avoid spam
        
        console.log(`SpawnScheduler initialized with ${this.initialDelay}s initial delay`);
    }

    /**
     * Update the spawn timer and check if spawning is allowed
     * @param {number} deltaTime - Time since last update in seconds
     * @param {number} currentEnemyCount - Current number of active enemies
     * @param {number} maxEnemies - Maximum allowed enemies
     * @param {number} difficultySpawnInterval - Spawn interval from difficulty system
     * @returns {boolean} Whether spawning should occur
     */
    update(deltaTime, currentEnemyCount, maxEnemies, difficultySpawnInterval = null) {
        console.log(`[SPAWN_SCHEDULER] Update called with deltaTime: ${deltaTime.toFixed(3)}, enemies: ${currentEnemyCount}/${maxEnemies}`);
        
        // Handle initial delay
        if (!this.hasInitialDelayPassed) {
            this.initialDelayRemaining -= deltaTime;
            
            console.log(`[SPAWN_SCHEDULER] Initial delay active: ${this.initialDelayRemaining.toFixed(1)}s remaining`);
            
            // Log progress every 5 seconds to help with debugging (reduced from 10 for better visibility)
            const progress = Math.floor(this.initialDelay - this.initialDelayRemaining);
            if (progress > 0 && progress % 5 === 0 && progress !== this._lastProgressLogged) {
                const remainingTime = Math.ceil(this.initialDelayRemaining);
                console.log(`[SPAWN_SCHEDULER] Enemy spawn delay: ${remainingTime} seconds remaining (${progress}/${this.initialDelay}s elapsed)`);
                this._lastProgressLogged = progress;
            }
            
            if (this.initialDelayRemaining <= 0) {
                this.hasInitialDelayPassed = true;
                this.showSpawnNotification();
            } else {
                return false; // Block all spawning during initial delay
            }
        }

        // Update current spawn interval from difficulty if provided
        if (difficultySpawnInterval !== null && difficultySpawnInterval !== this.currentSpawnInterval) {
            this.setSpawnInterval(difficultySpawnInterval);
        }

        // Update spawn timer
        this.spawnTimer += deltaTime;
        
        // Calculate effective spawn interval with modifiers
        const effectiveInterval = this.getEffectiveSpawnInterval();
        
        // Check if we should spawn
        const shouldSpawn = this.spawnTimer >= effectiveInterval && currentEnemyCount < maxEnemies;
        
        if (shouldSpawn) {
            this.recordSpawnRequest();
        }
        
        return shouldSpawn;
    }

    /**
     * Record a spawn request for statistics
     */
    recordSpawnRequest() {
        this.totalSpawnsRequested++;
        this.lastSpawnRequestTime = Date.now();
    }

    /**
     * Record a successful spawn and reset timer
     * @param {boolean} wasSuccessful - Whether the spawn was successful
     */
    recordSpawn(wasSuccessful = true) {
        if (wasSuccessful) {
            this.totalSpawnsSuccessful++;
            this.lastSpawnTime = Date.now();
            
            // Update running average of spawn intervals
            const actualInterval = this.spawnTimer;
            this.averageSpawnInterval = (this.averageSpawnInterval * 0.9) + (actualInterval * 0.1);
        }
        
        // Reset timer regardless of success
        this.spawnTimer = 0;
    }

    /**
     * Get effective spawn interval with all modifiers applied
     * @returns {number} Effective spawn interval in seconds
     */
    getEffectiveSpawnInterval() {
        let interval = this.currentSpawnInterval * this.spawnRateModifier;
        
        // Clamp to min/max values
        interval = Math.max(this.minSpawnInterval, Math.min(this.maxSpawnInterval, interval));
        
        return interval;
    }

    /**
     * Set the base spawn interval
     * @param {number} interval - New spawn interval in seconds
     */
    setSpawnInterval(interval) {
        this.currentSpawnInterval = Math.max(this.minSpawnInterval, Math.min(this.maxSpawnInterval, interval));
    }

    /**
     * Set spawn rate modifier (1.0 = normal, 0.5 = half rate, 2.0 = double rate)
     * @param {number} modifier - Spawn rate modifier
     */
    setSpawnRateModifier(modifier) {
        this.spawnRateModifier = Math.max(0.1, modifier); // Minimum 10% rate
    }

    /**
     * Get time remaining until next spawn opportunity
     * @returns {number} Time in seconds until next spawn check
     */
    getTimeUntilNextSpawn() {
        if (!this.hasInitialDelayPassed) {
            return this.initialDelayRemaining;
        }
        
        const effectiveInterval = this.getEffectiveSpawnInterval();
        return Math.max(0, effectiveInterval - this.spawnTimer);
    }

    /**
     * Check if initial delay has passed
     * @returns {boolean} Whether initial delay has completed
     */
    isInitialDelayComplete() {
        return this.hasInitialDelayPassed;
    }

    /**
     * Get remaining initial delay time
     * @returns {number} Remaining initial delay in seconds
     */
    getRemainingInitialDelay() {
        return Math.max(0, this.initialDelayRemaining);
    }

    /**
     * Skip remaining initial delay (for testing or special events)
     */
    skipInitialDelay() {
        this.hasInitialDelayPassed = true;
        this.initialDelayRemaining = 0;
        console.log("Initial spawn delay skipped");
    }

    /**
     * Reset the scheduler to initial state
     */
    reset() {
        this.spawnTimer = 0;
        this.currentSpawnInterval = this.baseSpawnInterval;
        this.initialDelayRemaining = this.initialDelay;
        this.hasInitialDelayPassed = false;
        this.spawnRateModifier = 1.0;
        this.totalSpawnsRequested = 0;
        this.totalSpawnsSuccessful = 0;
        this.lastSpawnTime = Date.now();
        this.averageSpawnInterval = this.baseSpawnInterval;
        this._lastProgressLogged = 0;
        console.log("SpawnScheduler reset to initial state");
    }

    /**
     * Set new initial delay duration
     * @param {number} delaySeconds - Initial delay in seconds
     */
    setInitialDelay(delaySeconds) {
        this.initialDelay = Math.max(0, delaySeconds);
        if (!this.hasInitialDelayPassed) {
            this.initialDelayRemaining = this.initialDelay;
        }
    }

    /**
     * Get current scheduler statistics
     * @returns {Object} Scheduler statistics
     */
    getStatistics() {
        const now = Date.now();
        const timeSinceLastSpawn = (now - this.lastSpawnTime) / 1000;
        const successRate = this.totalSpawnsRequested > 0 ? 
            (this.totalSpawnsSuccessful / this.totalSpawnsRequested * 100).toFixed(1) : 0;

        return {
            currentSpawnInterval: this.currentSpawnInterval.toFixed(2),
            effectiveSpawnInterval: this.getEffectiveSpawnInterval().toFixed(2),
            spawnRateModifier: this.spawnRateModifier.toFixed(2),
            timeUntilNextSpawn: this.getTimeUntilNextSpawn().toFixed(1),
            timeSinceLastSpawn: timeSinceLastSpawn.toFixed(1),
            totalSpawnsRequested: this.totalSpawnsRequested,
            totalSpawnsSuccessful: this.totalSpawnsSuccessful,
            successRate: `${successRate}%`,
            averageSpawnInterval: this.averageSpawnInterval.toFixed(2),
            initialDelayComplete: this.hasInitialDelayPassed,
            remainingInitialDelay: this.hasInitialDelayPassed ? 0 : this.getRemainingInitialDelay().toFixed(1)
        };
    }

    /**
     * Pause spawning (sets spawn rate modifier to 0)
     */
    pauseSpawning() {
        this.spawnRateModifier = 0;
        console.log("Spawning paused");
    }

    /**
     * Resume spawning (resets spawn rate modifier to 1)
     */
    resumeSpawning() {
        this.spawnRateModifier = 1.0;
        console.log("Spawning resumed");
    }

    /**
     * Check if spawning is currently paused
     * @returns {boolean} Whether spawning is paused
     */
    isSpawningPaused() {
        return this.spawnRateModifier === 0;
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
}