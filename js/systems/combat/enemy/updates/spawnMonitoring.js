/**
 * Spawn Monitoring - Monitors spawn system health and performs recovery
 */

export class SpawnMonitoring {
    constructor() {
        this.spawnMonitorInterval = null;
        this.lastSpawnTime = Date.now();
    }

    /**
     * Start monitoring the spawn system health
     * @param {Object} enemySystem Enemy system instance
     */
    startSpawnMonitoring(enemySystem) {
        this.spawnMonitorInterval = setInterval(() => {
            this.checkSpawnSystemHealth(enemySystem);
        }, 10000);
        
        console.log("Spawn system monitoring started");
    }

    /**
     * Stop spawn monitoring
     */
    stopSpawnMonitoring() {
        if (this.spawnMonitorInterval) {
            clearInterval(this.spawnMonitorInterval);
            this.spawnMonitorInterval = null;
            console.log("Spawn monitoring stopped");
        }
    }

    /**
     * Check the health of the spawn system
     * @param {Object} enemySystem Enemy system instance
     */
    checkSpawnSystemHealth(enemySystem) {
        const now = Date.now();
        const timeSinceLastSpawn = (now - this.lastSpawnTime) / 1000;
        
        console.log(`Spawn system health check: ${enemySystem.enemies.size}/${enemySystem.maxEnemies} enemies, ${timeSinceLastSpawn.toFixed(1)}s since last spawn`);
        
        if (timeSinceLastSpawn > enemySystem.spawnInterval * 3 && enemySystem.enemies.size < enemySystem.maxEnemies) {
            console.warn("Spawn system appears stuck! Performing recovery...");
            
            enemySystem.enemies.clear();
            enemySystem.spawner.generateSpawnPoints();
            enemySystem.spawnTimer = enemySystem.spawnInterval;
            enemySystem.lifecycle.validateEnemyReferences(enemySystem.enemies);
            
            console.log("Spawn system recovery completed");
        }
    }

    /**
     * Update last spawn time
     */
    updateLastSpawnTime() {
        this.lastSpawnTime = Date.now();
    }

    /**
     * Perform failsafe checks and recovery
     * @param {Object} enemySystem Enemy system instance
     */
    performFailsafeCheck(enemySystem) {
        if (enemySystem.enemies.size === 0 && enemySystem.spawnTimer > enemySystem.spawnInterval * 2) {
            console.warn("FAILSAFE: No enemies detected for extended period. Resetting spawn system.");
            enemySystem.enemies.clear();
            enemySystem.spawner.generateSpawnPoints();
            enemySystem.spawnTimer = enemySystem.spawnInterval;
        }
    }
}