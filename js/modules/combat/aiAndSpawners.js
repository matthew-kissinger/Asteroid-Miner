/**
 * AI and Spawners Module - Handles enemy pool/spawner wiring
 * 
 * This module contains all logic related to enemy system configuration,
 * AI behavior, spawning mechanics, and enemy lifecycle management.
 */

export class AISpawnerManager {
    constructor() {
        this.registeredEnemyIds = new Set();
    }

    /**
     * Configure enemy system after world is set up
     */
    configureEnemySystem(enemySystem) {
        if (!enemySystem) {
            console.warn("[AI_SPAWNER] No enemy system provided for configuration");
            return;
        }

        // Force enemy verification after world is set up
        if (typeof enemySystem.lifecycle?.validateEnemyReferences === 'function') {
            enemySystem.lifecycle.validateEnemyReferences(enemySystem.enemies);
        }
        
        // IMPORTANT: Ensure any lingering enemies over the limit are cleaned up
        if (enemySystem.enemies && enemySystem.enemies.size > enemySystem.maxEnemies) {
            console.warn(`[AI_SPAWNER] Found ${enemySystem.enemies.size} enemies exceeding limit of ${enemySystem.maxEnemies} during setup`);
            if (typeof enemySystem.enforceEnemyLimit === 'function') {
                enemySystem.enforceEnemyLimit();
            }
        }
        
        // Force enemy system to generate spawn points based on player position
        if (enemySystem.spawner && typeof enemySystem.spawner.generateSpawnPoints === 'function') {
            enemySystem.spawner.generateSpawnPoints();
        }
        
        console.log(`[AI_SPAWNER] Configured enemy system: Max enemies ${enemySystem.maxEnemies || 'unknown'}`);
    }

    /**
     * Register an enemy entity for synchronization with EnemySystem
     * @param {string} enemyId ID of the enemy entity
     */
    registerEnemy(enemyId) {
        // Add enemy to our tracking set
        this.registeredEnemyIds.add(enemyId);
        console.log(`AI_SPAWNER: Registered enemy ${enemyId} for tracking (total: ${this.registeredEnemyIds.size})`);
    }

    /**
     * Unregister an enemy entity
     * @param {string} enemyId ID of the enemy entity
     */
    unregisterEnemy(enemyId) {
        if (this.registeredEnemyIds.has(enemyId)) {
            this.registeredEnemyIds.delete(enemyId);
            console.log(`AI_SPAWNER: Unregistered enemy ${enemyId} (remaining: ${this.registeredEnemyIds.size})`);
        }
    }

    /**
     * Handle enemy destruction with proper cleanup
     * @param {Object} enemy The enemy entity
     * @param {string} reason Reason for destruction
     */
    handleEnemyDestruction(enemy, reason = 'combat') {
        if (!enemy) return;

        console.log(`[AI_SPAWNER] Handling enemy ${enemy.id} destruction (reason: ${reason})`);

        // Unregister from our tracking
        this.unregisterEnemy(enemy.id);

        // Use system-specific methods if available
        if (window.game && window.game.ecsWorld && window.game.ecsWorld.enemySystem) {
            const enemySystem = window.game.ecsWorld.enemySystem;
            
            // Try returnEnemyToPool first which properly handles cleanup
            if (typeof enemySystem.returnEnemyToPool === 'function') {
                console.log(`[AI_SPAWNER] Using EnemySystem.returnEnemyToPool for enemy ${enemy.id}`);
                enemySystem.returnEnemyToPool(enemy);
            }
            
            // Force validation of references in EnemySystem
            if (typeof enemySystem.validateEnemyReferences === 'function') {
                enemySystem.validateEnemyReferences();
            }
        }
    }

    /**
     * Get the count of registered enemies
     */
    getEnemyCount() {
        return this.registeredEnemyIds.size;
    }

    /**
     * Get all registered enemy IDs
     */
    getRegisteredEnemyIds() {
        return Array.from(this.registeredEnemyIds);
    }

    /**
     * Clear all registered enemies
     */
    clearAllEnemies() {
        const enemyCount = this.registeredEnemyIds.size;
        this.registeredEnemyIds.clear();
        console.log(`[AI_SPAWNER] Cleared ${enemyCount} registered enemies`);
    }

    /**
     * Set up spawner parameters
     */
    configureSpawner(spawnerConfig = {}) {
        const defaultConfig = {
            maxEnemies: 10,
            spawnRate: 0.1,
            spawnDistance: 1000,
            despawnDistance: 2000
        };

        const config = { ...defaultConfig, ...spawnerConfig };
        
        console.log(`[AI_SPAWNER] Spawner configured with:`, config);
        
        return config;
    }

    /**
     * Handle AI behavior updates
     */
    updateAI(deltaTime, playerPosition) {
        // This can be extended to handle custom AI logic
        // For now, it serves as a placeholder for AI-specific updates
        
        // Update any custom AI behaviors here
        // Example: pathfinding, decision making, behavior trees, etc.
        
        // The actual AI logic is typically handled by the EnemySystem
        // but this method can coordinate high-level AI decisions
    }

    /**
     * Handle spawning logic
     */
    updateSpawning(deltaTime, playerPosition, enemySystem) {
        if (!enemySystem) return;

        // Check if we need to spawn more enemies
        const currentEnemyCount = this.registeredEnemyIds.size;
        const maxEnemies = enemySystem.maxEnemies || 10;

        if (currentEnemyCount < maxEnemies) {
            // Let the enemy system handle the actual spawning
            // This is just monitoring and coordination
            console.log(`[AI_SPAWNER] Current enemies: ${currentEnemyCount}/${maxEnemies}`);
        }
    }

    /**
     * Validate enemy states and clean up orphaned entities
     */
    validateEnemyStates(world) {
        if (!world) return;

        const orphanedIds = [];
        
        for (const enemyId of this.registeredEnemyIds) {
            const entity = world.getEntity(enemyId);
            if (!entity) {
                orphanedIds.push(enemyId);
            }
        }

        // Clean up orphaned IDs
        for (const orphanedId of orphanedIds) {
            console.log(`[AI_SPAWNER] Cleaning up orphaned enemy ID: ${orphanedId}`);
            this.registeredEnemyIds.delete(orphanedId);
        }

        if (orphanedIds.length > 0) {
            console.log(`[AI_SPAWNER] Cleaned up ${orphanedIds.length} orphaned enemy references`);
        }
    }

    /**
     * Emergency cleanup of all AI and spawner resources
     */
    emergencyCleanup() {
        console.log(`[AI_SPAWNER] Emergency cleanup initiated for ${this.registeredEnemyIds.size} enemies`);
        
        // Force cleanup through enemy system if available
        if (window.game && window.game.ecsWorld && window.game.ecsWorld.enemySystem) {
            const enemySystem = window.game.ecsWorld.enemySystem;
            
            for (const enemyId of this.registeredEnemyIds) {
                try {
                    const entity = enemySystem.world?.getEntity(enemyId);
                    if (entity && typeof enemySystem.returnEnemyToPool === 'function') {
                        enemySystem.returnEnemyToPool(entity);
                    }
                } catch (error) {
                    console.error(`[AI_SPAWNER] Error during emergency cleanup of enemy ${enemyId}:`, error);
                }
            }
        }
        
        // Clear our tracking
        this.clearAllEnemies();
        
        console.log("[AI_SPAWNER] Emergency cleanup completed");
    }

    /**
     * Get spawner statistics
     */
    getSpawnerStats() {
        return {
            registeredEnemies: this.registeredEnemyIds.size,
            enemyIds: Array.from(this.registeredEnemyIds)
        };
    }

    /**
     * Set spawner enabled state
     */
    setSpawnerEnabled(enabled) {
        if (window.game && window.game.ecsWorld && window.game.ecsWorld.enemySystem) {
            const enemySystem = window.game.ecsWorld.enemySystem;
            
            if (typeof enemySystem.setEnabled === 'function') {
                enemySystem.setEnabled(enabled);
            } else {
                enemySystem.enabled = enabled;
            }
            
            console.log(`[AI_SPAWNER] Enemy spawner ${enabled ? 'enabled' : 'disabled'}`);
        }
    }

    /**
     * Force spawn point regeneration
     */
    regenerateSpawnPoints() {
        if (window.game && window.game.ecsWorld && window.game.ecsWorld.enemySystem) {
            const enemySystem = window.game.ecsWorld.enemySystem;
            
            if (enemySystem.spawner && typeof enemySystem.spawner.generateSpawnPoints === 'function') {
                enemySystem.spawner.generateSpawnPoints();
                console.log("[AI_SPAWNER] Forced spawn point regeneration");
            }
        }
    }
}