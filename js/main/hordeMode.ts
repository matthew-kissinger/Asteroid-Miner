// hordeMode.js - Horde mode management

import { debugLog } from '../globals/debug.ts';
import { mainMessageBus } from '../globals/messageBus.ts';

type HordeAudio = {
    playSound: (soundId: string) => void;
};

type HordeUi = {
    showNotification?: (message: string, durationMs: number) => void;
    showUI?: () => void;
};

type HordeSpaceship = {
    isDocked: boolean;
    undock: () => void;
};

type HordeGameContext = {
    isHordeActive?: boolean;
    hordeStartTime?: number;
    hordeSurvivalTime?: number;
    audio?: HordeAudio;
    ui?: HordeUi;
    spaceship?: HordeSpaceship;
};

type HordeScore = {
    score: number;
    wave: number;
    survivalTime: number;
    date: string;
};

const STORAGE_KEY = 'asteroidMinerHordeScores';
const MAX_SCORES = 5;
const WAVE_INTERVAL = 30000; // 30 seconds between waves
const POINTS_PER_KILL = 100;
const POINTS_PER_WAVE = 500;

export class HordeMode {
    game: HordeGameContext;
    isActive: boolean;
    startTime: number;
    survivalTime: number;
    currentWave: number;
    enemiesInWave: number;
    enemiesRemainingInWave: number;
    waveStartTime: number;
    score: number;

    constructor(game: HordeGameContext) {
        this.game = game;
        this.isActive = false;
        this.startTime = 0;
        this.survivalTime = 0;
        this.currentWave = 0;
        this.enemiesInWave = 0;
        this.enemiesRemainingInWave = 0;
        this.waveStartTime = 0;
        this.score = 0;
        
        // Subscribe to enemy destroyed events
        mainMessageBus.subscribe('enemy.destroyed', () => {
            if (this.isActive) {
                this.onEnemyDestroyed();
            }
        });
    }
    
    /**
     * Activate horde mode (extreme survival challenge)
     */
    activate(): void {
        if (this.isActive) return; // Already active
        
        debugLog("ACTIVATING HORDE MODE - EXTREME SURVIVAL CHALLENGE");
        this.isActive = true;
        this.startTime = performance.now();
        this.survivalTime = 0;
        this.currentWave = 1;
        this.score = 0;
        this.waveStartTime = this.startTime;
        
        // Store horde state in game
        this.game.isHordeActive = true;
        this.game.hordeStartTime = this.startTime;
        this.game.hordeSurvivalTime = this.survivalTime;
        
        // Play an intense sound to signal the start of horde mode
        if (this.game.audio) {
            this.game.audio.playSound('boink');
        }
        
        // Start first wave
        this.startWave();
        
        // Notify UI to update
        mainMessageBus.publish('horde.activated', {
            startTime: this.startTime
        });
        
        // Notify the player
        if (this.game.ui && this.game.ui.showNotification) {
            this.game.ui.showNotification("HORDE MODE ACTIVATED - SURVIVE!", 5000);
        }
        
        // Force player to undock if currently docked
        if (this.game.spaceship && this.game.spaceship.isDocked) {
            debugLog("Horde mode forcing undock from stargate");
            
            // Undock the ship
            this.game.spaceship.undock();
            
            // Notify the docking system
            mainMessageBus.publish('player.requestUndock', {
                forced: true,
                reason: "horde_mode_activation"
            });
            
            // CRITICAL FIX: Explicitly show the HUD after forcing undock
            // Use a short delay to ensure undocking process is complete
            setTimeout(() => {
                debugLog("Horde mode ensuring HUD is visible");
                if (this.game.ui && this.game.ui.showUI) {
                    this.game.ui.showUI();
                }
            }, 200);
        }
    }
    
    /**
     * Start a new wave
     */
    startWave(): void {
        this.enemiesInWave = 3 + (this.currentWave * 2);
        this.enemiesRemainingInWave = this.enemiesInWave;
        this.waveStartTime = performance.now();
        
        debugLog(`Starting wave ${this.currentWave} with ${this.enemiesInWave} enemies`);
        
        // Publish wave start event
        mainMessageBus.publish('horde.waveStart', {
            wave: this.currentWave,
            enemyCount: this.enemiesInWave,
            healthMultiplier: 1 + (this.currentWave - 1) * 0.1,
            speedMultiplier: 1 + (this.currentWave - 1) * 0.05
        });
        
        // Show wave notification
        if (this.game.ui && this.game.ui.showNotification) {
            this.game.ui.showNotification(`WAVE ${this.currentWave} - ${this.enemiesInWave} ENEMIES`, 3000);
        }
        
        // Spawn boss on milestone waves
        this.checkBossSpawn();
    }
    
    /**
     * Check if a boss should spawn on this wave
     */
    checkBossSpawn(): void {
        let bossType = -1
        let bossName = ''
        
        // Dreadnought every 5th wave
        if (this.currentWave % 5 === 0 && this.currentWave % 10 !== 0) {
            bossType = 0
            bossName = 'DREADNOUGHT'
        }
        // Swarm Queen every 7th wave (but not on 10th)
        else if (this.currentWave % 7 === 0 && this.currentWave % 10 !== 0) {
            bossType = 2
            bossName = 'SWARM QUEEN'
        }
        // Phase Shifter every 10th wave
        else if (this.currentWave % 10 === 0) {
            bossType = 1
            bossName = 'PHASE SHIFTER'
        }
        
        if (bossType >= 0) {
            debugLog(`Spawning boss: ${bossName} on wave ${this.currentWave}`)
            
            // Publish boss spawn event
            mainMessageBus.publish('horde.bossSpawn', {
                wave: this.currentWave,
                bossType,
                bossName,
                healthMultiplier: 1 + (this.currentWave - 1) * 0.2,
                damageMultiplier: 1 + (this.currentWave - 1) * 0.1
            })
            
            // Show boss notification
            if (this.game.ui && this.game.ui.showNotification) {
                this.game.ui.showNotification(`⚠️ BOSS INCOMING: ${bossName} ⚠️`, 5000);
            }
        }
    }
    
    /**
     * Handle enemy destroyed event
     */
    onEnemyDestroyed(): void {
        this.score += POINTS_PER_KILL;
        this.enemiesRemainingInWave--;
        
        debugLog(`Enemy destroyed. Score: ${this.score}, Remaining: ${this.enemiesRemainingInWave}`);
        
        // Check if wave is complete
        if (this.enemiesRemainingInWave <= 0) {
            this.onWaveComplete();
        }
    }
    
    /**
     * Handle wave completion
     */
    onWaveComplete(): void {
        this.score += POINTS_PER_WAVE;
        
        debugLog(`Wave ${this.currentWave} complete! Bonus: ${POINTS_PER_WAVE} points`);
        
        // Show wave complete notification
        if (this.game.ui && this.game.ui.showNotification) {
            this.game.ui.showNotification(`WAVE ${this.currentWave} COMPLETE! +${POINTS_PER_WAVE} BONUS`, 3000);
        }
        
        // Start next wave
        this.currentWave++;
        this.startWave();
    }
    
    /**
     * Update horde mode survival time and wave timer
     */
    update(): void {
        if (this.isActive) {
            this.survivalTime = performance.now() - this.startTime;
            this.game.hordeSurvivalTime = this.survivalTime;
        }
    }
    
    /**
     * Get time until next wave
     */
    getTimeUntilNextWave(): number {
        const timeSinceWaveStart = performance.now() - this.waveStartTime;
        return Math.max(0, WAVE_INTERVAL - timeSinceWaveStart);
    }
    
    /**
     * Get difficulty multipliers for current wave
     */
    getDifficultyMultipliers(): { health: number; speed: number } {
        return {
            health: 1 + (this.currentWave - 1) * 0.1,
            speed: 1 + (this.currentWave - 1) * 0.05
        };
    }
    
    /**
     * Format horde survival time as MM:SS
     * @returns {string} Formatted time string
     */
    getFormattedSurvivalTime(): string {
        const totalSeconds = Math.floor(this.survivalTime / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    /**
     * Save high score to localStorage
     */
    saveHighScore(): void {
        try {
            const scores = this.getHighScores();
            const newScore: HordeScore = {
                score: this.score,
                wave: this.currentWave,
                survivalTime: Math.floor(this.survivalTime / 1000),
                date: new Date().toISOString()
            };
            
            scores.push(newScore);
            scores.sort((a, b) => b.score - a.score);
            scores.splice(MAX_SCORES);
            
            localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
            debugLog('High score saved:', newScore);
        } catch (error) {
            console.error('Failed to save high score:', error);
        }
    }
    
    /**
     * Get high scores from localStorage
     */
    getHighScores(): HordeScore[] {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Failed to load high scores:', error);
            return [];
        }
    }
    
    /**
     * Check if current score is a new high score
     */
    isNewHighScore(): boolean {
        const scores = this.getHighScores();
        return scores.length < MAX_SCORES || this.score > scores[scores.length - 1].score;
    }
}
