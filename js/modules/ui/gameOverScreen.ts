// gameOverScreen.js - Handles the game over UI

import { getAbsolutePath } from '../../utils/pathUtils.ts';

type GameOverAudio = {
    playSound?: (sound: string) => void;
};

type HordeModeData = {
    active: boolean;
    survivalTime?: string;
    rawSurvivalTime?: number;
    wave?: number;
    score?: number;
    isNewHighScore?: boolean;
    topScores?: Array<{ score: number; wave: number; survivalTime: number; date: string }>;
};

type GameOverResources = {
    iron?: number;
    gold?: number;
    platinum?: number;
    resources?: GameOverResources;
    hordeMode?: HordeModeData;
};

type GameOverMessage = {
    data?: {
        type?: string;
        reason?: string;
    };
};

export type RespawnCallback = () => void;

export class GameOverScreen {
    isVisible: boolean;
    audio?: GameOverAudio;
    private gameRef: { difficultyManager?: { gameTime: number; currentLevel: number }; gameTime?: number } | null;
    private onRespawnCallback: RespawnCallback | null = null;
    private isHordeMode: boolean = false;
    private playerCredits: number = 0;
    private playerCargo: { iron: number; gold: number; platinum: number } = { iron: 0, gold: 0, platinum: 0 };

    constructor() {
        this.isVisible = false;
        this.gameRef = null;
        this.setupGameOverScreen();
    }
    
    setGameReference(gameRef: { difficultyManager?: { gameTime: number; currentLevel: number }; gameTime?: number }): void {
        this.gameRef = gameRef;
    }
    
    setRespawnCallback(callback: RespawnCallback): void {
        this.onRespawnCallback = callback;
    }

    setRespawnState(isHordeMode: boolean, credits: number, cargo: { iron: number; gold: number; platinum: number }): void {
        this.isHordeMode = isHordeMode;
        this.playerCredits = credits;
        this.playerCargo = cargo;
    }
    
    // Helper method to handle paths for GitHub Pages and local development
    getPath(relativePath: string): string {
        return getAbsolutePath(relativePath);
    }
    
    setupGameOverScreen(): void {
        // Add game over container (hidden initially)
        const gameOverContainer = document.createElement('div');
        gameOverContainer.id = 'game-over-container';
        gameOverContainer.classList.add('game-over-container', 'game-over-container--hidden');
        document.body.appendChild(gameOverContainer);
        
        // Game over title
        const gameOverTitle = document.createElement('h1');
        gameOverTitle.textContent = 'GAME OVER';
        gameOverTitle.classList.add('game-over-title');
        gameOverContainer.appendChild(gameOverTitle);
        
        // Game over message
        const gameOverMessage = document.createElement('p');
        gameOverMessage.id = 'game-over-message';
        gameOverMessage.textContent = 'Your ship was destroyed by asteroid collision';
        gameOverMessage.classList.add('game-over-message');
        gameOverContainer.appendChild(gameOverMessage);
        
        // Button container for respawn + restart
        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add('game-over-button-container');
        gameOverContainer.appendChild(buttonContainer);
        
        // Respawn at Stargate button
        this.setupRespawnButton(buttonContainer);
        
        // Restart button
        this.setupRestartButton(buttonContainer);
        
        // Resources collected summary (for game over screen)
        const resourcesSummary = document.createElement('div');
        resourcesSummary.id = 'resources-summary';
        resourcesSummary.classList.add('game-over-resources-summary');
        gameOverContainer.appendChild(resourcesSummary);
        
        // Session stats container
        const statsContainer = document.createElement('div');
        statsContainer.id = 'game-over-stats';
        statsContainer.classList.add('game-over-stats-container');
        statsContainer.style.display = 'none'; // Hidden until populated
        gameOverContainer.appendChild(statsContainer);
    }
    
    setupRespawnButton(container: HTMLElement): void {
        const respawnButton = document.createElement('button');
        respawnButton.id = 'respawn-stargate-button';
        respawnButton.textContent = 'RESPAWN AT STARGATE';
        respawnButton.classList.add('game-over-respawn-button');
        
        respawnButton.addEventListener('click', () => {
            if (!this.onRespawnCallback) return;
            
            this.audio?.playSound?.('uiClick');
            
            // Disable buttons during respawn
            respawnButton.disabled = true;
            const restartBtn = document.getElementById('restart-game-button') as HTMLButtonElement | null;
            if (restartBtn) restartBtn.disabled = true;
            
            this.onRespawnCallback();
        });
        
        container.appendChild(respawnButton);
    }

    setupRestartButton(container: HTMLElement): void {
        const restartButton = document.createElement('button');
        restartButton.id = 'restart-game-button';
        restartButton.textContent = 'RESTART MISSION';
        restartButton.classList.add('game-over-restart-button');
        
        restartButton.addEventListener('click', () => {
            // Play the click sound
            this.audio?.playSound?.('uiClick');
            
            // Show loading status
            const loadingStatus = document.createElement('div');
            loadingStatus.textContent = 'Restarting mission...';
            loadingStatus.classList.add('game-over-loading-status');
            container.appendChild(loadingStatus);
            
            // Disable the button during reload
            restartButton.disabled = true;
            
            // Reset game state before reloading
            // This is critical to ensure difficulty level resets properly
            if (this.gameRef) {
                // Reset time-based difficulty scaling
                if (this.gameRef.difficultyManager) {
                    this.gameRef.difficultyManager.gameTime = 0;
                    this.gameRef.difficultyManager.currentLevel = 1;
                    console.log("Reset difficulty level to 1");
                }
                
                // Reset game time counter
                if (typeof this.gameRef.gameTime !== 'undefined') {
                    this.gameRef.gameTime = 0;
                }
            }
            
            // Reload the page with a small delay to allow the UI update to be seen
            setTimeout(() => {
                location.reload();
            }, 500);
        });
        
        container.appendChild(restartButton);
    }
    
    show(resources: unknown, message: unknown, stats?: any): void {
        console.log("GameOverScreen: Showing game over screen");
        
        // Update respawn button state
        this.updateRespawnButton();
        
        // Show game over screen
        const gameOverContainer = document.getElementById('game-over-container') as HTMLDivElement | null;
        if (gameOverContainer) {
            gameOverContainer.classList.remove('game-over-container--hidden');
            gameOverContainer.classList.add('game-over-container--visible');
        }
        
        // Set message based on reason
        const gameOverMessage = document.getElementById('game-over-message') as HTMLParagraphElement | null;
        const typedMessage = message as string | GameOverMessage | null;
        if (gameOverMessage) {
            // Default message
            let displayMessage = 'Your journey has ended.';
            
            // Check if we received a reason type or just a string message
            if (typeof typedMessage === 'object' && typedMessage?.data && typedMessage.data.type) {
                // Use the type field for more reliable message categorization
                const reasonType = typedMessage.data.type;
                
                switch (reasonType) {
                    case 'FUEL_DEPLETED':
                        displayMessage = 'Your ship drifted into the void after running out of fuel.';
                        break;
                    case 'COLLISION_ASTEROID':
                        displayMessage = 'Your ship was destroyed by an asteroid collision.';
                        break;
                    case 'COLLISION_PLANET':
                        displayMessage = 'Your ship crashed into a planet!';
                        break;
                    case 'COMBAT_DEATH':
                        displayMessage = 'Your ship was destroyed in combat.';
                        break;
                    case 'SUN_DEATH':
                        displayMessage = "Your ship was incinerated by the sun's heat!";
                        break;
                    default:
                        // If we have a reason string but don't recognize the type
                        if (typedMessage.data.reason) {
                            displayMessage = typedMessage.data.reason;
                        }
                }
            } else if (typeof typedMessage === 'string' && typedMessage.length > 0) {
                // Fallback to string content checking for backward compatibility
                if (typedMessage.includes("fuel")) {
                    displayMessage = 'Your ship drifted into the void after running out of fuel.';
                } else if (typedMessage.includes("asteroid")) {
                    displayMessage = 'Your ship was destroyed by an asteroid collision.';
                } else if (typedMessage.includes("combat")) {
                    displayMessage = 'Your ship was destroyed in combat.';
                } else if (typedMessage.includes("sun")) {
                    displayMessage = "Your ship was incinerated by the sun's heat!";
                } else if (typedMessage.includes("planet")) {
                    displayMessage = "Your ship crashed into a planet!";
                } else {
                    // Use the provided message if none of our standardized reasons match
                    displayMessage = typedMessage;
                }
            }
            
            gameOverMessage.textContent = displayMessage;
        }
        
        // Check if game was in horde mode
        let wasHordeMode = false;
        let hordeSurvivalTime = "00:00";
        let rawSurvivalTime = 0;
        let hordeWave = 1;
        let hordeScore = 0;
        let isNewHighScore = false;
        let topScores: Array<{ score: number; wave: number; survivalTime: number; date: string }> = [];
        
        const typedResources = resources as GameOverResources | null;
        if (typedResources && typedResources.hordeMode) {
            wasHordeMode = typedResources.hordeMode.active;
            hordeSurvivalTime = typedResources.hordeMode.survivalTime || "00:00";
            rawSurvivalTime = typedResources.hordeMode.rawSurvivalTime || 0;
            hordeWave = typedResources.hordeMode.wave || 1;
            hordeScore = typedResources.hordeMode.score || 0;
            isNewHighScore = typedResources.hordeMode.isNewHighScore || false;
            topScores = typedResources.hordeMode.topScores || [];
        }
        
        // Handle different resource data formats
        // It might be wrapped in a gameStats structure or come directly
        let resourceData = typedResources;
        
        // Check if resources has a nested resources property (from gameOver method in game.js)
        if (typedResources && typedResources.resources) {
            console.log("GameOverScreen: Using nested resources data structure");
            resourceData = typedResources.resources;
        }
        
        // Ensure we have valid resource values with defaults
        const iron = resourceData && resourceData.iron ? resourceData.iron : 0;
        const gold = resourceData && resourceData.gold ? resourceData.gold : 0;
        const platinum = resourceData && resourceData.platinum ? resourceData.platinum : 0;
        
        // Update resources summary with guaranteed safe values
        const resourcesSummary = document.getElementById('resources-summary') as HTMLDivElement | null;
        if (resourcesSummary) {
            // Create horde mode section if applicable
            if (wasHordeMode) {
                // Get minutes for special messages
                const minutes = Math.floor(rawSurvivalTime / 1000 / 60);
                
                // Determine message based on survival time
                let hordeMessage = "You fought valiantly against overwhelming odds.";
                if (minutes >= 10) {
                    hordeMessage = "LEGENDARY! Few have survived the horde this long!";
                } else if (minutes >= 5) {
                    hordeMessage = "IMPRESSIVE! You showed exceptional combat skills!";
                } else if (minutes >= 3) {
                    hordeMessage = "Well done! You held back the horde longer than most!";
                }
                
                // Build high score display
                let highScoreHTML = '';
                if (isNewHighScore) {
                    highScoreHTML = '<p class="game-over-new-high-score">🏆 NEW HIGH SCORE! 🏆</p>';
                }
                
                // Build top scores list
                let topScoresHTML = '';
                if (topScores.length > 0) {
                    topScoresHTML = '<div class="game-over-high-scores"><h4>TOP SCORES</h4><ol>';
                    topScores.slice(0, 3).forEach((s, i) => {
                        const timeStr = `${Math.floor(s.survivalTime / 60)}:${(s.survivalTime % 60).toString().padStart(2, '0')}`;
                        const highlight = i === 0 && isNewHighScore ? ' class="highlight"' : '';
                        topScoresHTML += `<li${highlight}>${s.score} pts - Wave ${s.wave} - ${timeStr}</li>`;
                    });
                    topScoresHTML += '</ol></div>';
                }
                
                resourcesSummary.innerHTML = `
                    <div class="game-over-horde-section">
                        <h3 class="game-over-horde-title">HORDE MODE</h3>
                        ${highScoreHTML}
                        <p class="game-over-horde-stats">
                            <span>SCORE: <strong>${hordeScore}</strong></span><br>
                            <span>WAVE: <strong>${hordeWave}</strong></span><br>
                            <span>SURVIVED: <strong>${hordeSurvivalTime}</strong></span>
                        </p>
                        <p>${hordeMessage}</p>
                        ${topScoresHTML}
                    </div>
                    <div class="game-over-resources-list">
                        <p>Resources collected:</p>
                        <p>IRON: ${iron} | GOLD: ${gold} | PLATINUM: ${platinum}</p>
                    </div>
                `;
            } else {
                resourcesSummary.innerHTML = `
                    <div class="game-over-resources-list">
                        <p>Resources collected:</p>
                        <p>IRON: ${iron} | GOLD: ${gold} | PLATINUM: ${platinum}</p>
                    </div>
                `;
            }
        }
        
        // Display session stats
        this.displaySessionStats(stats);
        
        // Simpler approach to play explosion sound as a backup
        try {
            console.log("GameOverScreen: Attempting simple audio playback");
            
            // Create a direct audio element without attaching to DOM
            const boinkSound = new Audio(this.getPath('sounds/effects/boink.wav'));
            boinkSound.volume = 0.8;
            
            // Play with a slight delay to avoid conflict with other sounds
            setTimeout(() => {
                boinkSound.play().catch(err => {
                    console.warn("GameOverScreen: Simple sound failed:", err);
                });
            }, 100);
            
        } catch (err) {
            console.error("GameOverScreen: Error with simple sound approach:", err);
        }
        
        // Lock pointer to prevent camera movement after game over
        if (document.exitPointerLock) {
            document.exitPointerLock();
        }
    }

    private displaySessionStats(stats: any): void {
        const statsContainer = document.getElementById('game-over-stats');
        if (!statsContainer || !stats) return;

        statsContainer.style.display = 'block';
        
        // Format duration
        const durationSeconds = Math.floor(stats.sessionDuration / 1000);
        const mins = Math.floor(durationSeconds / 60);
        const secs = durationSeconds % 60;
        const durationStr = `${mins}:${secs.toString().padStart(2, '0')}`;
        
        // Format distance
        const distanceStr = stats.distanceTraveled > 1000 ? 
            `${(stats.distanceTraveled / 1000).toFixed(1)}km` : 
            `${Math.floor(stats.distanceTraveled)}m`;

        statsContainer.innerHTML = `
            <h3 class="game-over-stats-title">MISSION STATISTICS</h3>
            <div class="game-over-stats-grid">
                <div class="game-over-stat-item" style="animation-delay: 0.1s">
                    <span class="game-over-stat-label">Duration</span>
                    <span class="game-over-stat-value">${durationStr}</span>
                </div>
                <div class="game-over-stat-item" style="animation-delay: 0.2s">
                    <span class="game-over-stat-label">Enemies Destroyed</span>
                    <span class="game-over-stat-value highlight">${stats.enemiesDestroyed}</span>
                </div>
                <div class="game-over-stat-item" style="animation-delay: 0.3s">
                    <span class="game-over-stat-label">Distance Traveled</span>
                    <span class="game-over-stat-value">${distanceStr}</span>
                </div>
                <div class="game-over-stat-item" style="animation-delay: 0.4s">
                    <span class="game-over-stat-label">Credits Earned</span>
                    <span class="game-over-stat-value gold">${stats.creditsEarned}</span>
                </div>
                <div class="game-over-stat-item" style="animation-delay: 0.5s">
                    <span class="game-over-stat-label">Systems Visited</span>
                    <span class="game-over-stat-value">${stats.systemsVisited}</span>
                </div>
                <div class="game-over-stat-item" style="animation-delay: 0.6s">
                    <span class="game-over-stat-label">Min Hull HP</span>
                    <span class="game-over-stat-value ${stats.lowestHullHP < 20 ? 'critical' : ''}">${stats.lowestHullHP}%</span>
                </div>
                <div class="game-over-stat-item" style="animation-delay: 0.7s">
                    <span class="game-over-stat-label">Damage Dealt</span>
                    <span class="game-over-stat-value">${stats.damageDealt}</span>
                </div>
                <div class="game-over-stat-item" style="animation-delay: 0.8s">
                    <span class="game-over-stat-label">Damage Taken</span>
                    <span class="game-over-stat-value">${stats.damageTaken}</span>
                </div>
                <div class="game-over-stat-item" style="animation-delay: 0.9s">
                    <span class="game-over-stat-label">Resources Mined</span>
                    <span class="game-over-stat-value">${stats.ironMined + stats.goldMined + stats.platinumMined}</span>
                </div>
            </div>
        `;
    }

    private updateRespawnButton(): void {
        const respawnButton = document.getElementById('respawn-stargate-button') as HTMLButtonElement | null;
        if (!respawnButton) return;

        // Hide respawn in horde mode (permadeath)
        if (this.isHordeMode) {
            respawnButton.style.display = 'none';
            return;
        }

        respawnButton.style.display = '';

        // No callback means respawn not available
        if (!this.onRespawnCallback) {
            respawnButton.disabled = true;
            respawnButton.textContent = 'RESPAWN UNAVAILABLE';
            return;
        }

        respawnButton.disabled = false;
        const hasCargo = this.playerCargo.iron > 0 || this.playerCargo.gold > 0 || this.playerCargo.platinum > 0;

        if (this.playerCredits > 0) {
            const penalty = Math.max(100, Math.floor(this.playerCredits * 0.25));
            respawnButton.textContent = `RESPAWN AT STARGATE (-${penalty} credits)`;
        } else if (hasCargo) {
            respawnButton.textContent = 'RESPAWN AT STARGATE (lose cargo)';
        } else {
            // Free respawn - player has nothing to lose
            respawnButton.textContent = 'RESPAWN AT STARGATE (free)';
        }
    }

    hide(): void {
        const gameOverContainer = document.getElementById('game-over-container') as HTMLDivElement | null;
        if (gameOverContainer) {
            gameOverContainer.classList.remove('game-over-container--visible');
            gameOverContainer.classList.add('game-over-container--hidden');
        }
        this.isVisible = false;
    }
}
