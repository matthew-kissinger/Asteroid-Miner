/**
 * DifficultyManager - Handles time-based progressive difficulty scaling
 * 
 * Controls enemy parameters based on survival time thresholds
 */

interface DifficultyThreshold {
    level: number;
    time: number;
    maxEnemies: number;
    enemyHealth: number;
    enemyDamage: number;
    enemySpeed: number;
    spawnInterval: number;
}

export class DifficultyManager {
    private game: any;
    private enemySystem: any;
    public gameTime: number;
    public currentLevel: number;
    private DIFFICULTY_THRESHOLDS: DifficultyThreshold[];
    public params: DifficultyThreshold;

    constructor(game: any, enemySystem: any) {
        this.game = game;
        this.enemySystem = enemySystem;
        
        // Current game time in seconds
        this.gameTime = 0;
        
        // Current difficulty level (1-based)
        this.currentLevel = 1;
        
        // Time thresholds for difficulty levels (in seconds)
        this.DIFFICULTY_THRESHOLDS = [
            { level: 1, time: 0, maxEnemies: 10, enemyHealth: 20, enemyDamage: 15, enemySpeed: 700, spawnInterval: 3.0 },
            { level: 2, time: 120, maxEnemies: 15, enemyHealth: 30, enemyDamage: 20, enemySpeed: 800, spawnInterval: 2.5 },
            { level: 3, time: 300, maxEnemies: 20, enemyHealth: 40, enemyDamage: 25, enemySpeed: 900, spawnInterval: 2.0 },
            { level: 4, time: 600, maxEnemies: 25, enemyHealth: 60, enemyDamage: 30, enemySpeed: 1000, spawnInterval: 1.5 },
            { level: 5, time: 900, maxEnemies: 30, enemyHealth: 80, enemyDamage: 40, enemySpeed: 1200, spawnInterval: 1.0 }
        ];
        
        // Current parameters (start with level 1)
        this.params = { ...this.DIFFICULTY_THRESHOLDS[0] };
        
        console.log("DifficultyManager initialized with time-based progressive scaling");
    }
    
    /**
     * Update game time and check for difficulty changes
     * @param {number} deltaTime Time since last update in seconds
     */
    update(deltaTime: number): void {
        // Update game time
        this.gameTime += deltaTime;
        
        // Update global game time reference
        if (this.game) {
            this.game.gameTime = this.gameTime;
        }
        
        // Check for difficulty level changes
        this.updateDifficultyLevel();
        
        // Apply current difficulty parameters to enemy system
        this.applyDifficultyParameters();
    }
    
    /**
     * Update the current difficulty level based on game time
     */
    updateDifficultyLevel(): void {
        // Find the highest difficulty level for the current game time
        let newLevel = 1;
        
        for (let i = this.DIFFICULTY_THRESHOLDS.length - 1; i >= 0; i--) {
            if (this.gameTime >= this.DIFFICULTY_THRESHOLDS[i].time) {
                newLevel = this.DIFFICULTY_THRESHOLDS[i].level;
                
                // Update parameters if we're changing levels
                if (newLevel !== this.currentLevel) {
                    this.params = { ...this.DIFFICULTY_THRESHOLDS[i] };
                    
                    // Log the difficulty increase
                    console.log(`Difficulty increased to Level ${newLevel} at ${Math.floor(this.gameTime)}s`);
                    
                    // Show notification about difficulty increase
                    if (this.game && this.game.ui && this.game.ui.showNotification) {
                        this.game.ui.showNotification(`Difficulty increased to Level ${newLevel}!`, 5000);
                    }
                }
                
                break;
            }
        }
        
        this.currentLevel = newLevel;
    }
    
    /**
     * Apply the current difficulty parameters to the enemy system
     */
    applyDifficultyParameters(): void {
        if (!this.enemySystem) return;
        
        // Update enemy system parameters
        this.enemySystem.maxEnemies = this.params.maxEnemies;
        this.enemySystem.spawnInterval = this.params.spawnInterval;
        
        // Update enemy config in the spawner if it exists
        if (this.enemySystem.spawner && this.enemySystem.spawner.enemyConfig) {
            this.enemySystem.spawner.enemyConfig.health = this.params.enemyHealth;
            this.enemySystem.spawner.enemyConfig.damage = this.params.enemyDamage;
            this.enemySystem.spawner.enemyConfig.speed = this.params.enemySpeed;
        }
    }
    
    /**
     * Get the current difficulty level (1-based)
     * @returns {number} Current difficulty level
     */
    getCurrentLevel(): number {
        return this.currentLevel;
    }
    
    /**
     * Get the time until next difficulty increase
     * @returns {number} Seconds until next level or -1 if at max level
     */
    getTimeUntilNextLevel(): number {
        if (this.currentLevel >= this.DIFFICULTY_THRESHOLDS.length) {
            return -1; // Already at max level
        }
        
        const nextLevelThreshold = this.DIFFICULTY_THRESHOLDS[this.currentLevel].time;
        return Math.max(0, nextLevelThreshold - this.gameTime);
    }
}
