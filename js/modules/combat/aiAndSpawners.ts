/**
 * AI and Spawners Module - Handles enemy pool and spawner management
 * 
 * This module contains all logic for configuring the enemy system,
 * registering/unregistering enemies, and handling spawner state.
 */

export class AISpawnerManager {
    enemySystem: any = null;

    constructor() {
    }

    /**
     * Configure the enemy system with pool sizes and other settings
     */
    configureEnemySystem(enemySystem: any): void {
        this.enemySystem = enemySystem;
        
        // Settings could be passed from a config module in the future
        if (enemySystem && typeof enemySystem.configure === 'function') {
            enemySystem.configure({
                maxEnemies: 50,
                spawnRate: 0.5, // enemies per second
                poolEnabled: true
            });
            console.log("[COMBAT] Enemy system configured with maxEnemies: 50");
        }
    }

    /**
     * Register an enemy entity for synchronization with EnemySystem
     */
    registerEnemy(enemyId: string): void {
        if (!this.enemySystem) return;
        
        if (typeof this.enemySystem.registerEnemy === 'function') {
            this.enemySystem.registerEnemy(enemyId);
        }
    }

    /**
     * Unregister an enemy entity
     */
    unregisterEnemy(enemyId: string): void {
        if (!this.enemySystem) return;
        
        if (typeof this.enemySystem.unregisterEnemy === 'function') {
            this.enemySystem.unregisterEnemy(enemyId);
        }
    }

    /**
     * Emergency cleanup for all spawners and enemies
     */
    emergencyCleanup(): void {
        if (!this.enemySystem) return;
        
        if (typeof this.enemySystem.cleanupAll === 'function') {
            this.enemySystem.cleanupAll();
        }
    }
}
