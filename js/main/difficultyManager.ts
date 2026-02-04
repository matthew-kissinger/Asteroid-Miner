// difficultyManager.js - Dynamic difficulty scaling

import { DEBUG_MODE } from '../globals/debug.ts';

type DifficultyParams = {
    maxEnemies: number;
    spawnInterval: number;
    enemyHealth: number;
    enemyDamage: number;
    enemySpeed: number;
};

export class DifficultyManager {
    params: DifficultyParams;
    gameTime: number;
    currentLevel: number;

    constructor() {
        this.params = {
            maxEnemies: 10,
            spawnInterval: 3,
            enemyHealth: 20,
            enemyDamage: 15,
            enemySpeed: 700
        };
        this.gameTime = 0;
        this.currentLevel = 1;
    }
    
    update(deltaTime: number): void {
        // Update game time in minutes
        this.gameTime += deltaTime;
        const minutes = this.gameTime / 60;
        
        // Calculate level based on minutes played
        // Level increases every 3 minutes
        const newLevel = Math.floor(minutes / 3) + 1;
        
        // Only update if level changed
        if (newLevel !== this.currentLevel) {
            this.currentLevel = newLevel;
            
            // Get difficulty multiplier: 1x at level 1, 1.5x at level 2, 2x at level 3, etc.
            // Cap at level 5 (3x difficulty) for fairness
            const difficultyMultiplier = 1 + (Math.min(this.currentLevel - 1, 4) * 0.5);
            
            // Update parameters
            this.params.maxEnemies = Math.min(10 * difficultyMultiplier, 30);
            this.params.spawnInterval = Math.max(3 / difficultyMultiplier, 1);
            this.params.enemyHealth = Math.floor(20 * difficultyMultiplier);
            this.params.enemyDamage = Math.floor(15 * difficultyMultiplier);
            this.params.enemySpeed = Math.min(700 * (1 + (0.2 * (this.currentLevel - 1))), 1400);
            
            if (DEBUG_MODE.enabled) {
                console.log(`Difficulty increased to level ${this.currentLevel} (${difficultyMultiplier}x)`);
                console.log(`Parameters: maxEnemies=${this.params.maxEnemies}, spawnInterval=${this.params.spawnInterval}`);
                console.log(`Health=${this.params.enemyHealth}, Damage=${this.params.enemyDamage}, Speed=${this.params.enemySpeed}`);
            }
        }
    }
}
