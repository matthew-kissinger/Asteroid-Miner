/**
 * Wave Progression - Difficulty scaling and parameter progression logic
 */

import { BASE_ENEMY_CONFIG, SPAWN_INTERVALS } from './definitions.js';

/**
 * Difficulty progression manager
 */
export class DifficultyProgression {
    constructor() {
        this.baseConfig = { ...BASE_ENEMY_CONFIG };
        this.currentConfig = { ...BASE_ENEMY_CONFIG };
        this.baseSpawnInterval = 3.0; // Default spawn interval
        this.currentSpawnInterval = 3.0;
    }

    /**
     * Update difficulty parameters based on external difficulty manager
     * @param {Object} world - The game world instance
     * @returns {boolean} Whether parameters were updated
     */
    updateParameters(world) {
        let updated = false;

        // Try to get difficulty parameters from global difficulty manager
        if (window.game && window.game.difficultyManager && window.game.difficultyManager.params) {
            const diffParams = window.game.difficultyManager.params;
            
            // Update enemy parameters if they exist in the difficulty manager
            if (diffParams.enemyHealth !== undefined && diffParams.enemyHealth !== this.currentConfig.health) {
                this.currentConfig.health = diffParams.enemyHealth;
                updated = true;
            }
            
            if (diffParams.enemyDamage !== undefined && diffParams.enemyDamage !== this.currentConfig.damage) {
                this.currentConfig.damage = diffParams.enemyDamage;
                updated = true;
            }
            
            if (diffParams.enemySpeed !== undefined && diffParams.enemySpeed !== this.currentConfig.speed) {
                this.currentConfig.speed = diffParams.enemySpeed;
                updated = true;
            }
            
            if (diffParams.spawnInterval !== undefined && diffParams.spawnInterval !== this.currentSpawnInterval) {
                this.currentSpawnInterval = diffParams.spawnInterval;
                updated = true;
            }

            // Log current parameters occasionally for debugging
            if (updated && Math.random() < 0.005) { // ~0.5% chance each frame to avoid spam
                console.log(`Updated enemy parameters: Health=${this.currentConfig.health}, Damage=${this.currentConfig.damage}, Speed=${this.currentConfig.speed}, SpawnInterval=${this.currentSpawnInterval}`);
            }
        }

        return updated;
    }

    /**
     * Get current enemy configuration with difficulty scaling
     * @returns {Object} Current enemy configuration
     */
    getCurrentConfig() {
        return { ...this.currentConfig };
    }

    /**
     * Get current spawn interval
     * @returns {number} Current spawn interval in seconds
     */
    getCurrentSpawnInterval() {
        return this.currentSpawnInterval;
    }

    /**
     * Apply random variations to enemy parameters
     * @param {Object} baseConfig - Base configuration to vary
     * @returns {Object} Configuration with applied variations
     */
    applyVariations(baseConfig) {
        return {
            health: baseConfig.health,
            damage: baseConfig.damage,
            speed: baseConfig.speed * (0.7 + Math.random() * 0.6), // 70-130% of base speed
            spiralAmplitude: baseConfig.spiralAmplitude * (0.8 + Math.random() * 0.4), // 80-120% of base
            spiralFrequency: baseConfig.spiralFrequency * (0.9 + Math.random() * 0.2) // 90-110% of base
        };
    }

    /**
     * Reset difficulty to base values
     */
    reset() {
        this.currentConfig = { ...this.baseConfig };
        this.currentSpawnInterval = this.baseSpawnInterval;
    }

    /**
     * Set manual difficulty multiplier (for testing or special events)
     * @param {number} multiplier - Difficulty multiplier (1.0 = normal)
     */
    setDifficultyMultiplier(multiplier) {
        this.currentConfig.health = Math.round(this.baseConfig.health * multiplier);
        this.currentConfig.damage = Math.round(this.baseConfig.damage * multiplier);
        this.currentConfig.speed = Math.round(this.baseConfig.speed * multiplier);
        this.currentSpawnInterval = Math.max(0.5, this.baseSpawnInterval / multiplier);
    }

    /**
     * Get difficulty statistics
     * @returns {Object} Current difficulty statistics
     */
    getStats() {
        const healthMultiplier = this.currentConfig.health / this.baseConfig.health;
        const damageMultiplier = this.currentConfig.damage / this.baseConfig.damage;
        const speedMultiplier = this.currentConfig.speed / this.baseConfig.speed;
        const spawnRateMultiplier = this.baseSpawnInterval / this.currentSpawnInterval;

        return {
            healthMultiplier: healthMultiplier.toFixed(2),
            damageMultiplier: damageMultiplier.toFixed(2),
            speedMultiplier: speedMultiplier.toFixed(2),
            spawnRateMultiplier: spawnRateMultiplier.toFixed(2),
            currentHealth: this.currentConfig.health,
            currentDamage: this.currentConfig.damage,
            currentSpeed: this.currentConfig.speed,
            currentSpawnInterval: this.currentSpawnInterval
        };
    }
}