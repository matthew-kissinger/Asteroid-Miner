// stateManager.js - Game state management and stats tracking
export class GameStateManager {
    constructor(game) {
        this.game = game;
        this.initializeState();
    }

    /**
     * Initialize game state variables
     */
    initializeState() {
        // Game state
        this.game.isGameOver = false;
        this.game.lastUpdateTime = performance.now();
        this.game.frameCount = 0;
        this.game.currentFPS = 0;

        // Combat stats
        this.game.enemiesDestroyed = 0;
        this.game.damageDealt = 0;
        this.game.damageReceived = 0;
        
        // Horde mode properties
        this.game.isHordeActive = false;
        this.game.hordeStartTime = 0;
        this.game.hordeSurvivalTime = 0;
    }

    /**
     * Check for game over conditions
     */
    checkGameOver() {
        // Make sure spaceship exists
        if (!this.game.spaceship) return;

        // Don't check for game over conditions if the ship is docked
        if (this.game.spaceship.isDocked) return;

        // Check if ship is destroyed
        if (this.game.spaceship.isDestroyed) {
            // Use message bus to publish game over event rather than direct call
            this.game.messageBus.publish('game.over', {
                reason: "Your ship was destroyed in combat",
                source: "game.checkGameOver",
                type: "COMBAT_DEATH"
            });
            return;
        }

        // Check if out of fuel and not near stargate
        if (this.game.spaceship.fuel <= 0 && 
            this.game.controls.dockingSystem && 
            !this.game.controls.dockingSystem.nearStargate) {
            // Use message bus to publish game over event rather than direct call
            this.game.messageBus.publish('game.over', {
                reason: "Your ship ran out of fuel",
                source: "game.checkGameOver",
                type: "FUEL_DEPLETED"
            });
            return;
        }

        // Check for collision with sun
        const sunPosition = new THREE.Vector3(0, 0, 0);
        const distanceToSun = this.game.spaceship.mesh.position.distanceTo(sunPosition);
        if (distanceToSun < 400) { // Sun collision radius
            // Use message bus to publish game over event rather than direct call
            this.game.messageBus.publish('game.over', {
                reason: "Your ship was destroyed by the sun's heat",
                source: "game.checkGameOver",
                type: "SUN_DEATH"
            });
            return;
        }
    }

    /**
     * Handle game over events from message bus
     * @param {Object} message The game over event message
     */
    handleGameOverEvent(message) {
        // Check if game is already in game over state to prevent duplicate handling
        if (this.game.isGameOver) {
            console.log("Game: Already in game over state, ignoring duplicate event");
            return;
        }

        console.log("Game: handleGameOverEvent called with message:", message);

        // Validate message format
        if (!message || !message.data) {
            console.error("Game: Invalid game.over message format - missing data property");
            this.gameOver("Unknown game over reason");
            return;
        }

        // Extract reason from message data
        const reason = message.data.reason || "Unknown reason";
        console.log("Game: Game over event received:", reason, "from source:", message.data.source);

        // Call the actual game over method with the reason
        try {
            console.log("Game: Calling gameOver method with reason:", reason);
            this.gameOver(reason);
        } catch (err) {
            console.error("Game: Error in gameOver method:", err);
        }
    }

    /**
     * Trigger game over state and show UI
     * @param {string|Object} message The reason for game over
     */
    gameOver(message) {
        if (this.game.isGameOver) {
            console.log("Game over already triggered, ignoring duplicate call");
            return;
        }

        console.log("Game over:", message);
        this.game.isGameOver = true;

        // Play explosion sound if available
        if (this.game.audio) {
            console.log("Game: Playing boink sound");
            this.game.audio.playSound('boink');
        }

        // Show game over screen with resources collected and combat stats
        const gameStats = {
            resources: this.game.controls && this.game.controls.resources ? this.game.controls.resources : {},
            combatStats: {
                enemiesDestroyed: this.game.combatManager && this.game.combatManager.stats ? this.game.combatManager.stats.enemiesDestroyed : 0,
                damageDealt: this.game.damageDealt || 0,
                damageReceived: this.game.damageReceived || 0
            },
            hordeMode: {
                active: this.game.isHordeActive,
                survivalTime: this.getFormattedHordeSurvivalTime(),
                rawSurvivalTime: this.game.hordeSurvivalTime
            }
        };

        // Show game over UI
        console.log("Game: Showing game over UI");
        if (this.game.ui && this.game.ui.showGameOver) {
            // Pass the entire message object to the UI so it can access both reason and type
            this.game.ui.showGameOver(gameStats, typeof message === 'string' ? message : message);
        } else {
            console.log("Game: UI not available, using fallback");
            // For fallback, extract the reason string if message is an object
            const reasonText = typeof message === 'string' ? message : 
                              (message && message.reason ? message.reason : "Unknown reason");
            this.showFallbackGameOver(reasonText);
        }

        // Stop spaceship movement
        if (this.game.spaceship && this.game.spaceship.thrust) {
            this.game.spaceship.thrust.forward = false;
            this.game.spaceship.thrust.backward = false;
            this.game.spaceship.thrust.left = false;
            this.game.spaceship.thrust.right = false;
            this.game.spaceship.thrust.boost = false;
        }

        // Stop all control inputs
        if (this.game.controls && this.game.controls.inputHandler) {
            this.game.controls.inputHandler.exitPointerLock();
        }

        console.log("Game: Game over handling complete");
    }

    /**
     * Fallback method to show game over screen if the UI system fails
     * @param {string} message The reason for game over
     */
    showFallbackGameOver(message) {
        console.log("Creating fallback game over screen");

        // Check if game over screen already exists
        if (document.getElementById('fallback-game-over')) {
            console.log("Fallback game over screen already exists");
            return;
        }

        // Create a simple game over overlay
        const gameOverContainer = document.createElement('div');
        gameOverContainer.id = 'fallback-game-over';
        gameOverContainer.style.position = 'fixed';
        gameOverContainer.style.top = '0';
        gameOverContainer.style.left = '0';
        gameOverContainer.style.width = '100%';
        gameOverContainer.style.height = '100%';
        gameOverContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        gameOverContainer.style.display = 'flex';
        gameOverContainer.style.flexDirection = 'column';
        gameOverContainer.style.alignItems = 'center';
        gameOverContainer.style.justifyContent = 'center';
        gameOverContainer.style.zIndex = '9999';

        // Game over title
        const title = document.createElement('h1');
        title.textContent = 'GAME OVER';
        title.style.color = '#ff3030';
        title.style.fontSize = '48px';
        title.style.marginBottom = '20px';
        title.style.fontFamily = 'Arial, sans-serif';
        gameOverContainer.appendChild(title);

        // Game over message
        const messageElem = document.createElement('p');
        messageElem.textContent = message || 'Your ship was destroyed!';
        messageElem.style.color = '#ffffff';
        messageElem.style.fontSize = '24px';
        messageElem.style.marginBottom = '40px';
        messageElem.style.fontFamily = 'Arial, sans-serif';
        gameOverContainer.appendChild(messageElem);

        // Restart button
        const restartButton = document.createElement('button');
        restartButton.textContent = 'RESTART GAME';
        restartButton.style.padding = '16px 32px';
        restartButton.style.fontSize = '24px';
        restartButton.style.backgroundColor = '#ff3030';
        restartButton.style.color = '#ffffff';
        restartButton.style.border = 'none';
        restartButton.style.borderRadius = '8px';
        restartButton.style.cursor = 'pointer';
        restartButton.style.fontFamily = 'Arial, sans-serif';
        restartButton.addEventListener('click', () => {
            location.reload();
        });
        gameOverContainer.appendChild(restartButton);

        // Add to document
        document.body.appendChild(gameOverContainer);
    }

    /**
     * Activate horde mode (extreme survival challenge)
     */
    activateHordeMode() {
        if (this.game.isHordeActive) return; // Already active
        
        console.log("ACTIVATING HORDE MODE - EXTREME SURVIVAL CHALLENGE");
        this.game.isHordeActive = true;
        this.game.hordeStartTime = performance.now();
        this.game.hordeSurvivalTime = 0;
        
        // Play an intense sound to signal the start of horde mode
        if (this.game.audio) {
            this.game.audio.playSound('boink');
        }
        
        // Notify UI to update
        this.game.messageBus.publish('horde.activated', {
            startTime: this.game.hordeStartTime
        });
        
        // Notify the player
        if (this.game.ui && this.game.ui.showNotification) {
            this.game.ui.showNotification("HORDE MODE ACTIVATED - SURVIVE!", 5000);
        }
        
        // Force player to undock if currently docked
        if (this.game.spaceship && this.game.spaceship.isDocked) {
            // Undock the ship
            this.game.spaceship.undock();
            
            // Notify the docking system
            this.game.messageBus.publish('player.requestUndock', {
                forced: true,
                reason: "horde_mode_activation"
            });
        }
    }
    
    /**
     * Format horde survival time as MM:SS
     * @returns {string} Formatted time string
     */
    getFormattedHordeSurvivalTime() {
        const totalSeconds = Math.floor(this.game.hordeSurvivalTime / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * Update horde survival time if active
     */
    updateHordeTime() {
        if (this.game.isHordeActive) {
            this.game.hordeSurvivalTime = performance.now() - this.game.hordeStartTime;
        }
    }
}