/**
 * Difficulty Scaling - Handles enemy parameter scaling based on game difficulty
 */

export class DifficultyScaling {
    constructor() {
        this.lastLoggedHordeTime = 0;
        this.lastFullLoggedHordeTime = 0;
    }

    /**
     * Update enemy parameters based on difficulty scaling from game object
     * @param {Object} enemySystem Enemy system instance
     */
    updateDifficultyScaling(enemySystem) {
        if (window.game && window.game.isHordeActive) {
            this.applyHordeModeScaling(enemySystem);
            return;
        }
        
        if (window.game && window.game.difficultyManager && window.game.difficultyManager.params) {
            const diffParams = window.game.difficultyManager.params;
            
            if (diffParams.maxEnemies !== undefined && enemySystem.maxEnemies !== diffParams.maxEnemies) {
                console.log(`Updating max enemies from ${enemySystem.maxEnemies} to ${diffParams.maxEnemies}`);
                enemySystem.maxEnemies = diffParams.maxEnemies;
            }
            
            if (diffParams.spawnInterval !== undefined && enemySystem.spawnInterval !== diffParams.spawnInterval) {
                console.log(`Updating spawn interval from ${enemySystem.spawnInterval} to ${diffParams.spawnInterval}`);
                enemySystem.spawnInterval = diffParams.spawnInterval;
            }
        }
    }

    /**
     * Apply horde mode scaling based on survival time
     * @param {Object} enemySystem Enemy system instance
     */
    applyHordeModeScaling(enemySystem) {
        if (!window.game || window.game.hordeSurvivalTime === undefined) return;
        
        const survivalTime = window.game.hordeSurvivalTime / 1000;
        
        if (Math.floor(survivalTime) % 10 === 0 && Math.floor(survivalTime) !== this.lastLoggedHordeTime) {
            this.lastLoggedHordeTime = Math.floor(survivalTime);
            console.log(`HORDE MODE: Scaling at ${survivalTime.toFixed(1)}s survival time`);
        }
        
        const minutesPassed = survivalTime / 60;
        
        // Max enemies scaling
        const baseMaxEnemies = 50;
        let maxEnemiesScale;
        
        if (minutesPassed < 5) {
            maxEnemiesScale = baseMaxEnemies + (minutesPassed * 10);
        } else {
            maxEnemiesScale = (baseMaxEnemies + 50) * Math.pow(1.2, minutesPassed - 5);
        }
        
        enemySystem.maxEnemies = Math.min(Math.floor(maxEnemiesScale), 300);
        
        // Spawn interval scaling
        const maxSpawnInterval = 6.0;
        const baseSpawnInterval = 1.0;
        enemySystem.spawnInterval = Math.min(
            baseSpawnInterval * Math.pow(1.05, minutesPassed * 2),
            maxSpawnInterval
        );
        
        // Update enemy config in spawner
        if (enemySystem.spawner) {
            const baseHealth = 20;
            const baseDamage = 15;
            const baseSpeed = 700;
            
            const healthMultiplier = 1 + (minutesPassed * 0.5);
            const damageMultiplier = 1 + (minutesPassed * 0.3);
            const speedMultiplier = 1 + (minutesPassed * 0.2);
            
            enemySystem.spawner.enemyConfig.health = Math.floor(baseHealth * healthMultiplier);
            enemySystem.spawner.enemyConfig.damage = Math.floor(baseDamage * damageMultiplier);
            enemySystem.spawner.enemyConfig.speed = baseSpeed * speedMultiplier;
            
            if (Math.floor(survivalTime) % 30 === 0 && Math.floor(survivalTime) !== this.lastFullLoggedHordeTime) {
                this.lastFullLoggedHordeTime = Math.floor(survivalTime);
                console.log(`HORDE MODE SCALING at ${Math.floor(survivalTime)}s:`);
                console.log(`  Max Enemies: ${enemySystem.maxEnemies}`);
                console.log(`  Spawn Interval: ${enemySystem.spawnInterval.toFixed(2)}s`);
                console.log(`  Enemy Health: ${enemySystem.spawner.enemyConfig.health}`);
                console.log(`  Enemy Damage: ${enemySystem.spawner.enemyConfig.damage}`);
                console.log(`  Enemy Speed: ${enemySystem.spawner.enemyConfig.speed.toFixed(1)}`);
            }
        }
    }
}