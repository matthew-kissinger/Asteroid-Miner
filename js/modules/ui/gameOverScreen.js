// gameOverScreen.js - Handles the game over UI

import { getAbsolutePath } from '../../utils/pathUtils.js';

export class GameOverScreen {
    constructor() {
        this.isVisible = false;
        this.setupGameOverScreen();
    }
    
    // Helper method to handle paths for GitHub Pages and local development
    getPath(relativePath) {
        return getAbsolutePath(relativePath);
    }
    
    setupGameOverScreen() {
        // Add game over container (hidden initially)
        const gameOverContainer = document.createElement('div');
        gameOverContainer.id = 'game-over-container';
        gameOverContainer.style.position = 'absolute';
        gameOverContainer.style.top = '0';
        gameOverContainer.style.left = '0';
        gameOverContainer.style.width = '100%';
        gameOverContainer.style.height = '100%';
        gameOverContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        gameOverContainer.style.display = 'flex';
        gameOverContainer.style.flexDirection = 'column';
        gameOverContainer.style.alignItems = 'center';
        gameOverContainer.style.justifyContent = 'center';
        gameOverContainer.style.color = '#fff';
        gameOverContainer.style.fontFamily = 'Courier New, monospace';
        gameOverContainer.style.zIndex = '1000';
        gameOverContainer.style.display = 'none';
        document.body.appendChild(gameOverContainer);
        
        // Game over title
        const gameOverTitle = document.createElement('h1');
        gameOverTitle.textContent = 'GAME OVER';
        gameOverTitle.style.fontSize = '50px';
        gameOverTitle.style.color = '#ff0000';
        gameOverTitle.style.textShadow = '0 0 10px #ff0000';
        gameOverTitle.style.marginBottom = '20px';
        gameOverContainer.appendChild(gameOverTitle);
        
        // Game over message
        const gameOverMessage = document.createElement('p');
        gameOverMessage.id = 'game-over-message';
        gameOverMessage.textContent = 'Your ship was destroyed by asteroid collision';
        gameOverMessage.style.fontSize = '18px';
        gameOverMessage.style.marginBottom = '40px';
        gameOverContainer.appendChild(gameOverMessage);
        
        // Restart button
        this.setupRestartButton(gameOverContainer);
        
        // Resources collected summary (for game over screen)
        const resourcesSummary = document.createElement('div');
        resourcesSummary.id = 'resources-summary';
        resourcesSummary.style.marginTop = '30px';
        resourcesSummary.style.fontSize = '16px';
        resourcesSummary.style.textAlign = 'center';
        gameOverContainer.appendChild(resourcesSummary);
    }
    
    setupRestartButton(container) {
        const restartButton = document.createElement('button');
        restartButton.id = 'restart-game-button';
        restartButton.textContent = 'RESTART MISSION';
        restartButton.style.backgroundColor = 'rgba(120, 220, 232, 0.2)';
        restartButton.style.color = '#fff';
        restartButton.style.border = '1px solid rgba(120, 220, 232, 0.5)';
        restartButton.style.borderRadius = '5px';
        restartButton.style.padding = '15px 30px';
        restartButton.style.fontSize = '20px';
        restartButton.style.fontFamily = '"Rajdhani", sans-serif';
        restartButton.style.cursor = 'pointer';
        restartButton.style.marginTop = '30px';
        restartButton.style.transition = 'all 0.2s ease';
        
        restartButton.addEventListener('mouseover', () => {
            restartButton.style.backgroundColor = 'rgba(120, 220, 232, 0.4)';
            restartButton.style.boxShadow = '0 0 15px rgba(120, 220, 232, 0.5)';
        });
        
        restartButton.addEventListener('mouseout', () => {
            restartButton.style.backgroundColor = 'rgba(120, 220, 232, 0.2)';
            restartButton.style.boxShadow = 'none';
        });
        
        restartButton.addEventListener('click', () => {
            // Play the click sound
            if (this.audio) {
                this.audio.playSound('uiClick');
            }
            
            // Show loading status
            const loadingStatus = document.createElement('div');
            loadingStatus.textContent = 'Restarting mission...';
            loadingStatus.style.color = 'rgba(120, 220, 232, 0.9)';
            loadingStatus.style.marginTop = '10px';
            container.appendChild(loadingStatus);
            
            // Disable the button during reload
            restartButton.disabled = true;
            restartButton.style.opacity = '0.5';
            restartButton.style.cursor = 'default';
            
            // Reset game state before reloading
            // This is critical to ensure difficulty level resets properly
            if (window.game) {
                // Reset time-based difficulty scaling
                if (window.game.difficultyManager) {
                    window.game.difficultyManager.gameTime = 0;
                    window.game.difficultyManager.currentLevel = 1;
                    console.log("Reset difficulty level to 1");
                }
                
                // Reset game time counter
                window.game.gameTime = 0;
            }
            
            // Reload the page with a small delay to allow the UI update to be seen
            setTimeout(() => {
                location.reload();
            }, 500);
        });
        
        container.appendChild(restartButton);
    }
    
    show(resources, message) {
        console.log("GameOverScreen: Showing game over screen");
        
        // Show game over screen
        const gameOverContainer = document.getElementById('game-over-container');
        gameOverContainer.style.display = 'flex';
        
        // Set custom message if provided
        if (message) {
            const gameOverMessage = document.getElementById('game-over-message');
            if (gameOverMessage) {
                gameOverMessage.textContent = message;
            }
        }
        
        // Check if game was in horde mode
        let wasHordeMode = false;
        let hordeSurvivalTime = "00:00";
        let rawSurvivalTime = 0;
        
        if (resources && resources.hordeMode) {
            wasHordeMode = resources.hordeMode.active;
            hordeSurvivalTime = resources.hordeMode.survivalTime || "00:00";
            rawSurvivalTime = resources.hordeMode.rawSurvivalTime || 0;
        }
        
        // Handle different resource data formats
        // It might be wrapped in a gameStats structure or come directly
        let resourceData = resources;
        
        // Check if resources has a nested resources property (from gameOver method in game.js)
        if (resources && resources.resources) {
            console.log("GameOverScreen: Using nested resources data structure");
            resourceData = resources.resources;
        }
        
        // Ensure we have valid resource values with defaults
        const iron = resourceData && resourceData.iron ? resourceData.iron : 0;
        const gold = resourceData && resourceData.gold ? resourceData.gold : 0;
        const platinum = resourceData && resourceData.platinum ? resourceData.platinum : 0;
        
        // Update resources summary with guaranteed safe values
        const resourcesSummary = document.getElementById('resources-summary');
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
                
                resourcesSummary.innerHTML = `
                    <div style="margin-bottom:20px; padding:15px; background-color:rgba(255,48,48,0.2); border:1px solid #ff3030; border-radius:5px;">
                        <h3 style="color:#ff3030; margin-top:0; text-shadow:0 0 5px rgba(255,48,48,0.5);">HORDE MODE</h3>
                        <p style="font-size:18px; font-weight:bold;">SURVIVED: <span style="color:#ff9999; text-shadow:0 0 5px rgba(255,48,48,0.3);">${hordeSurvivalTime}</span></p>
                        <p>${hordeMessage}</p>
                    </div>
                    <p>Resources collected:</p>
                    <p>IRON: ${iron} | GOLD: ${gold} | PLATINUM: ${platinum}</p>
                `;
            } else {
                resourcesSummary.innerHTML = `
                    <p>Resources collected:</p>
                    <p>IRON: ${iron} | GOLD: ${gold} | PLATINUM: ${platinum}</p>
                `;
            }
        }
        
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
} 