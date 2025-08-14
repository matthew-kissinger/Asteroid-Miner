/**
 * Enemy Spawner - Main spawner system that coordinates all spawning subsystems
 * Refactored from 856 LOC to under 250 LOC by extracting functionality into modules
 */

import { DifficultyProgression } from './waves/progression.js';
import { FormationBuilder } from './formations/builder.js';
import { SpawnScheduler } from './timing/scheduler.js';
import { EnemyFactory } from './factory/enemyFactory.js';

export class EnemySpawner {
    constructor(world) {
        this.world = world;
        
        // Initialize subsystems
        this.difficultyProgression = new DifficultyProgression();
        this.formationBuilder = new FormationBuilder(world);
        this.spawnScheduler = new SpawnScheduler();
        this.enemyFactory = new EnemyFactory(world);
        
        // Legacy compatibility properties
        this.spawnPoints = []; // Maintained for backward compatibility
        this.spawnTimer = 0;   // Delegated to scheduler
        this.spawnInterval = 3; // Delegated to scheduler
        this.lastSpawnTime = Date.now();
        this.modelCache = {}; // Delegated to factory
        this.baseEnemyConfig = {}; // Delegated to progression
        this.enemyConfig = {}; // Delegated to progression
        
        console.log("EnemySpawner initialized with modular architecture");
        this.logInitializationStatus();
    }
    
    /**
     * Log initialization status of all subsystems
     */
    logInitializationStatus() {
        console.log("Spawner subsystems: Difficulty, Formation, Scheduler (60s delay), Factory ready");
    }
    
    /**
     * Generate spawn points for enemies based on player position
     * Legacy method - now delegates to FormationBuilder
     */
    generateSpawnPoints() {
        this.spawnPoints = this.formationBuilder.generateSpawnPoints();
        console.log(`Generated ${this.spawnPoints.length} spawn points via FormationBuilder`);
    }
    
    /**
     * Get a random spawn point for enemies
     * Legacy method - now delegates to FormationBuilder
     * @returns {THREE.Vector3} Spawn position
     */
    getRandomSpawnPoint() {
        const point = this.formationBuilder.getRandomSpawnPoint();
        
        // Update legacy spawnPoints array for compatibility
        if (this.spawnPoints.length === 0) {
            this.spawnPoints = this.formationBuilder.spawnPoints.slice();
        }
        
        return point;
    }
    
    /**
     * Update difficulty parameters
     * Legacy method - now delegates to DifficultyProgression
     */
    updateDifficultyParameters() {
        const updated = this.difficultyProgression.updateParameters(this.world);
        
        if (updated) {
            // Update legacy properties for compatibility
            const currentConfig = this.difficultyProgression.getCurrentConfig();
            this.enemyConfig = currentConfig;
            this.spawnInterval = this.difficultyProgression.getCurrentSpawnInterval();
        }
        
        return updated;
    }
    
    /**
     * Check the spawn timer and spawn enemies if needed
     * Main update method that coordinates all subsystems
     * @param {number} deltaTime - Time since last update
     * @param {Set} enemies - Reference to active enemies set
     * @param {number} maxEnemies - Maximum number of enemies allowed
     * @param {function} spawnFunction - Function to call to spawn an enemy
     * @returns {boolean} Whether an enemy was spawned
     */
    update(deltaTime, enemies, maxEnemies, spawnFunction) {
        console.log(`[ENEMY_SPAWNER] Update called with deltaTime: ${deltaTime.toFixed(3)}, enemies: ${enemies.size}/${maxEnemies}`);
        
        // Update difficulty parameters
        this.updateDifficultyParameters();
        
        // Get current difficulty-adjusted spawn interval
        const currentSpawnInterval = this.difficultyProgression.getCurrentSpawnInterval();
        
        // Update spawn scheduler
        console.log(`[ENEMY_SPAWNER] Calling scheduler.update with currentSpawnInterval: ${currentSpawnInterval}`);
        const shouldSpawn = this.spawnScheduler.update(
            deltaTime, 
            enemies.size, 
            maxEnemies, 
            currentSpawnInterval
        );
        
        console.log(`[ENEMY_SPAWNER] Scheduler returned shouldSpawn: ${shouldSpawn}`);
        
        // Update legacy properties for compatibility
        this.spawnTimer = this.spawnScheduler.spawnTimer;
        this.spawnInterval = currentSpawnInterval;
        
        if (shouldSpawn) {
            const spawnPoint = this.getRandomSpawnPoint();
            if (!spawnPoint) {
                console.error("Failed to get spawn point! Regenerating formation.");
                this.formationBuilder.generateSpawnPoints(true);
                this.spawnScheduler.recordSpawn(false);
                return false;
            }
            
            // Call the provided spawn function
            const result = spawnFunction(spawnPoint);
            
            // Record spawn result with scheduler
            this.spawnScheduler.recordSpawn(result);
            
            if (result) {
                this.lastSpawnTime = Date.now();
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Spawn a spectral drone at the given position
     * Main spawning method that delegates to EnemyFactory
     * @param {THREE.Vector3} position - Position to spawn at
     * @param {Object} poolManager - Enemy pool manager
     * @param {Set} enemies - Reference to active enemies set
     * @param {number} maxEnemies - Maximum number of enemies allowed
     * @returns {Entity} The created entity
     */
    spawnSpectralDrone(position, poolManager, enemies, maxEnemies) {
        console.log("Spawning spectral drone via EnemyFactory...");
        
        // Get current enemy configuration from difficulty progression
        const enemyConfig = this.difficultyProgression.getCurrentConfig();
        
        // Create the enemy using the factory
        const entity = this.enemyFactory.createSpectralDrone(
            position, 
            poolManager, 
            enemies, 
            maxEnemies, 
            enemyConfig
        );
        
        if (entity) {
            console.log(`Spectral drone spawned at (${position.x.toFixed(0)}, ${position.y.toFixed(0)}, ${position.z.toFixed(0)}). Count: ${enemies.size}/${maxEnemies}`);
        }
        
        return entity;
    }
    
    /**
     * Set formation pattern for spawn points
     * @param {string} patternName - Formation pattern name
     */
    setFormationPattern(patternName) {
        this.formationBuilder.setFormationPattern(patternName, true);
        this.spawnPoints = this.formationBuilder.spawnPoints.slice(); // Update legacy array
    }
    
    /**
     * Skip the initial spawn delay (for testing or special events)
     */
    skipInitialDelay() {
        console.log("[ENEMY_SPAWNER] Skipping initial spawn delay");
        this.spawnScheduler.skipInitialDelay();
    }
    
    /**
     * Pause or resume spawning
     * @param {boolean} paused - Whether to pause spawning
     */
    setSpawningPaused(paused) {
        if (paused) {
            this.spawnScheduler.pauseSpawning();
        } else {
            this.spawnScheduler.resumeSpawning();
        }
    }
    
    /**
     * Reset all spawner subsystems to initial state
     */
    reset() {
        this.difficultyProgression.reset();
        this.formationBuilder.clearSpawnPoints();
        this.spawnScheduler.reset();
        
        // Reset legacy properties
        this.spawnPoints = [];
        this.spawnTimer = 0;
        this.spawnInterval = 3;
        this.lastSpawnTime = Date.now();
        
        console.log("EnemySpawner reset to initial state");
    }
    
    /**
     * Get comprehensive statistics from all subsystems
     * @returns {Object} Combined statistics
     */
    getStatistics() {
        return {
            scheduler: this.spawnScheduler.getStatistics(),
            difficulty: this.difficultyProgression.getStats(),
            formation: this.formationBuilder.getSpawnPointStats(),
            factory: {
                modelCacheLoaded: !!this.enemyFactory.modelCache.enemyDrone
            }
        };
    }
    
    /**
     * Get current enemy configuration
     * @returns {Object} Current enemy configuration
     */
    getCurrentEnemyConfig() {
        return this.difficultyProgression.getCurrentConfig();
    }
    
    /**
     * Check if initial spawn delay has passed
     * @returns {boolean} Whether spawning can begin
     */
    canSpawn() {
        return this.spawnScheduler.isInitialDelayComplete();
    }
    
    /**
     * Get time remaining until spawning can begin
     * @returns {number} Remaining delay time in seconds
     */
    getRemainingDelay() {
        return this.spawnScheduler.getRemainingInitialDelay();
    }
}