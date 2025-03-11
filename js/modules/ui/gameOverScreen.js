// gameOverScreen.js - Handles the game over UI

export class GameOverScreen {
    constructor() {
        this.setupGameOverScreen();
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
        const restartButton = document.createElement('button');
        restartButton.textContent = 'RESTART MISSION';
        restartButton.style.padding = '15px 30px';
        restartButton.style.backgroundColor = '#30cfd0';
        restartButton.style.color = '#000';
        restartButton.style.border = 'none';
        restartButton.style.borderRadius = '30px';
        restartButton.style.fontSize = '18px';
        restartButton.style.cursor = 'pointer';
        restartButton.style.fontFamily = 'Courier New, monospace';
        restartButton.style.fontWeight = 'bold';
        restartButton.style.transition = 'all 0.2s';
        restartButton.style.pointerEvents = 'all';
        restartButton.addEventListener('mouseover', () => {
            restartButton.style.backgroundColor = '#ffffff';
            restartButton.style.boxShadow = '0 0 20px #ffffff';
        });
        restartButton.addEventListener('mouseout', () => {
            restartButton.style.backgroundColor = '#30cfd0';
            restartButton.style.boxShadow = 'none';
        });
        restartButton.addEventListener('click', () => {
            location.reload();
        });
        gameOverContainer.appendChild(restartButton);
        
        // Resources collected summary (for game over screen)
        const resourcesSummary = document.createElement('div');
        resourcesSummary.id = 'resources-summary';
        resourcesSummary.style.marginTop = '30px';
        resourcesSummary.style.fontSize = '16px';
        resourcesSummary.style.textAlign = 'center';
        gameOverContainer.appendChild(resourcesSummary);
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
            resourcesSummary.innerHTML = `
                <p>Resources collected:</p>
                <p>IRON: ${iron} | GOLD: ${gold} | PLATINUM: ${platinum}</p>
            `;
        }
        
        // Simpler approach to play explosion sound as a backup
        try {
            console.log("GameOverScreen: Attempting simple audio playback");
            
            // Create a direct audio element without attaching to DOM
            const explosionSound = new Audio('sounds/game/explosion.wav');
            explosionSound.volume = 0.8;
            
            // Play with a slight delay to avoid conflict with other sounds
            setTimeout(() => {
                explosionSound.play().catch(err => {
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