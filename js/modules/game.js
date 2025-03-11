// game.js - Enhanced game logic with combat systems
import { Renderer } from './renderer.js';
import { Spaceship } from './spaceship.js';
import { Physics } from './physics.js';
import { Environment } from './environment.js';
import { Controls } from './controls.js';
import { UI } from './ui.js';
import { CombatManager } from './combat/combatManager.js';
import { WeaponSystem } from './combat/weaponSystem.js';
import { AudioManager } from './audio.js';
import { MessageBus } from '../core/messageBus.js';
export class Game {
    constructor() {
        console.log("Initializing enhanced game with combat systems...");
        // Create message bus for events
        this.messageBus = new MessageBus();
        try {
            // Initialize audio manager first
            console.log("Creating audio manager...");
            this.audio = new AudioManager();
            // Initialize renderer first
            console.log("Creating renderer...");
            this.renderer = new Renderer();
            console.log("Renderer created, getting scene...");
            // Access scene and camera directly rather than through getters
            this.scene = this.renderer.scene;
            this.camera = this.renderer.camera;
            console.log("Scene and camera references obtained");
            // Share camera reference with scene for easy access by other components
            this.scene.camera = this.camera;
            // Initialize physics
            this.physics = new Physics(this.scene);
            // Set camera reference in physics
            this.physics.setCamera(this.camera);
            // Initialize environment
            this.environment = new Environment(this.scene);
            // Initialize spaceship
            console.log("Creating spaceship...");
            this.spaceship = new Spaceship(this.scene);
            // Set spaceship reference in physics
            this.physics.setSpaceship(this.spaceship);
            // Initialize UI
            this.ui = new UI(this.spaceship, this.environment);
            // Initialize combat systems
            console.log("Initializing combat systems...");
            // Create weapon system for player's ship
            this.weaponSystem = new WeaponSystem(this.scene, this.spaceship);
            // Create combat manager for handling enemy ships
            this.combatManager = new CombatManager(this.scene, this.spaceship, this.environment);
            // Initialize controls last, as it depends on other components
            this.controls = new Controls(this.spaceship, this.physics, this.environment, this.ui);
            // Add weapon system to controls
            this.controls.weaponSystem = this.weaponSystem;
            // Share controls reference with UI for bidirectional communication
            this.ui.setControls(this.controls);
            // Initial camera positioning
            this.camera.position.set(0, 1500, 0);
            // Game state
            this.isGameOver = false;
            this.lastUpdateTime = performance.now();
            this.frameCount = 0;
            // Combat stats
            this.enemiesDestroyed = 0;
            this.damageDealt = 0;
            this.damageReceived = 0;
            // Start with docked state for initial tutorial/intro
            this.startDocked();
            // Register event handlers
            this.setupEventHandlers();
            // Subscribe to game over events with enhanced logging
            console.log("Game: Setting up game.over event subscription");
            const boundHandleGameOver = this.handleGameOverEvent.bind(this);
            // Use a direct bound method reference for reliability
            this.gameOverUnsubscribe = this.messageBus.subscribe('game.over', boundHandleGameOver);
            // Verify subscription was successful
            if (this.messageBus.listeners.has('game.over')) {
                const listeners = this.messageBus.listeners.get('game.over');
                console.log(`Game: Successfully registered ${listeners.length} game.over listener(s)`);
            } else {
                console.error("Game: Failed to register game.over listener - critical error!");
                // Attempt emergency re-registration
                setTimeout(() => {
                    this.gameOverUnsubscribe = this.messageBus.subscribe('game.over', boundHandleGameOver);
                    console.log("Game: Attempted emergency re-registration of game.over event");
                }, 500);
            }
            console.log("Game: Registered event types after subscription:", 
                        Array.from(this.messageBus.listeners.keys()));
            window.game = this;
            window.mainMessageBus = this.messageBus;

            // Ensure message bus is correctly shared
            console.log(`Game: Current mainMessageBus has ${window.mainMessageBus.listeners.has("game.over") ? "game.over listeners" : "NO game.over listeners"}`);

            window.mainMessageBus = this.messageBus;
            // Initialize audio after everything else is set up
            this.audio.initialize().then(() => {
                console.log("Audio system initialized");
            });
            console.log("Game initialization complete with combat systems");
            // Make instance globally available to help with debugging
            window.gameInstance = this;
            // Start game loop
            this.animate();
        } catch (error) {
            console.error("Error in game initialization:", error);
            throw error; // Re-throw to show in the UI
        }
    }
    startDocked() {
        // Start the game docked with the mothership for tutorial/intro
        // Make sure the ship is already docked
        if (this.spaceship) {
            // Ensure the ship is docked
            if (!this.spaceship.isDocked) {
                this.spaceship.dock();
            }
        }
        // Show mothership UI after a short delay
        setTimeout(() => {
            if (this.controls && this.controls.dockingSystem) {
                // Just show mothership UI without changing state
                this.controls.dockingSystem.dockWithMothership();
                console.log("Mothership UI shown");
            } else {
                console.error("Controls or dockingSystem not available");
            }
        }, 500);
    }
    setupEventHandlers() {
        // Handle window resize
        window.addEventListener('resize', () => {
            this.renderer.handleResize();
        });
        // Handle visibility change to pause/resume game
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });
        // Handle ESC key to exit pointer lock
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.pointerLockElement) {
                document.exitPointerLock();
            }
            // Add audio mute toggle (M key)
            if (e.key.toLowerCase() === 'm' && this.audio) {
                const isMuted = this.audio.toggleMute();
                console.log(`Audio ${isMuted ? 'muted' : 'unmuted'}`);
            }
        });
        // Add weapon firing to mouse inputs - Changed to RIGHT mouse button
        document.addEventListener('mousedown', (e) => {
            if (e.button === 2 && this.controls.inputHandler && this.controls.inputHandler.isLocked()) {
                // Handle weapon firing with right button
                if (!this.spaceship.isDocked && this.weaponSystem) {
                    // Start firing weapons
                    this.weaponSystem.isWeaponActive = true;
                    // Play laser sound for weapons too, since they're also energy weapons
                    if (this.audio) {
                        this.audio.playSound('laser');
                    }
                }
            }
            // Note: Left button (button 0) is already handled by controls for mining
        });
        document.addEventListener('mouseup', (e) => {
            if (e.button === 2) {
                if (this.weaponSystem) {
                    // Stop firing weapons
                    this.weaponSystem.isWeaponActive = false;
                    // Stop laser sound
                    if (this.audio) {
                        this.audio.stopSound('laser');
                    }
                }
            }
        });
        // Prevent right-click menu from appearing
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
        // Add weapon mode switching (F key)
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'f' && !this.spaceship.isDocked) {
                if (this.weaponSystem) {
                    const newMode = this.weaponSystem.cycleWeaponMode();
                    // Display weapon switch notification in UI
                    if (this.ui && this.ui.showNotification) {
                        this.ui.showNotification(`Weapon Mode: ${newMode}`, 2000);
                    }
                }
            }
        });
    }
    update(deltaTime) {
        if (this.isGameOver) return;
        // Update physics
        this.physics.update(deltaTime);
        // Update spaceship
        if (this.spaceship.update) {
            this.spaceship.update(deltaTime);
        }
        // Update controls
        if (this.controls.update) {
            this.controls.update();
        }
        // Update environment
        if (this.environment.update) {
            this.environment.update();
        }
        // Update weapon system
        if (this.weaponSystem) {
            // Update weapon systems
            this.weaponSystem.update(deltaTime);
            // Handle continuous firing if weapon is active
            if (this.weaponSystem.isWeaponActive && !this.spaceship.isDocked) {
                // Fire weapon (sound is handled directly in the particle cannon firing method)
                this.weaponSystem.fireWeapon();
            }
        }
        // Update combat manager
        if (this.combatManager) {
            this.combatManager.update(deltaTime);
            // Check for player projectile hits on enemies
            if (this.weaponSystem) {
                for (const enemy of this.combatManager.enemies) {
                    if (!enemy.isDestroyed) {
                        const didHit = this.weaponSystem.checkHit(enemy);
                        // Track stats and play hit sound
                        if (didHit) {
                            this.damageDealt += 1;
                            // Play boink sound for hit
                            if (this.audio) {
                                this.audio.playSound('boink');
                            }
                        }
                    }
                }
                // Explicitly reset any projectiles getting too close to player to prevent self-damage
                const minSafeDistance = 30; // Safe distance from player to prevent self-hits
                for (let i = this.weaponSystem.projectiles.length - 1; i >= 0; i--) {
                    const projectile = this.weaponSystem.projectiles[i];
                    if (projectile.mesh.position.distanceTo(this.spaceship.mesh.position) < minSafeDistance) {
                        console.log("Removing projectile too close to player");
                        // Clean up projectile
                        if (projectile.mesh.userData.trail && projectile.mesh.userData.trail.mesh) {
                            this.scene.remove(projectile.mesh.userData.trail.mesh);
                        }
                        this.scene.remove(projectile.mesh);
                        this.weaponSystem.projectiles.splice(i, 1);
                    }
                }
            }
        }
        // Update location info
        const locationName = this.environment.getPlayerLocation(this.spaceship.mesh.position);
        if (this.ui.updateLocation) {
            this.ui.updateLocation(locationName);
        }
        // Update UI
        if (this.ui.update) {
            this.ui.update();
        }
        // Update audio - play thruster sound when moving
        if (this.audio) {
            this.updateAudio();
        }
        // Check for game over conditions
        this.checkGameOver();
        // Performance metrics (every 100 frames)
        this.frameCount++;
        if (this.frameCount % 100 === 0) {
            console.log(`FPS: ${Math.round(1000 / deltaTime)}`);
        }
    }
    // Update game sounds based on current game state
    updateAudio() {
        if (!this.audio || !this.spaceship) return;
        // Handle thruster sounds based on current thrust state
        if (this.spaceship.isDocked) {
            // No thruster sounds when docked
            this.audio.stopSound('thrust');
        } else {
            const isThrusting = this.spaceship.thrust.forward || 
                              this.spaceship.thrust.backward || 
                              this.spaceship.thrust.left || 
                              this.spaceship.thrust.right;
            if (isThrusting) {
                // Play thrust sound if not already playing
                this.audio.playSound('thrust');
                // Calculate thrust intensity for volume
                let thrustIntensity = 0.5; // Base level
                if (this.spaceship.thrust.forward) thrustIntensity += 0.2;
                if (this.spaceship.thrust.backward) thrustIntensity += 0.1;
                if (this.spaceship.thrust.left) thrustIntensity += 0.1;
                if (this.spaceship.thrust.right) thrustIntensity += 0.1;
                // Boost increases volume
                if (this.spaceship.thrust.boost) thrustIntensity *= 1.5;
                // Set thrust volume
                this.audio.setThrustVolume(thrustIntensity);
            } else {
                // Stop thrust sound if no thrusters active
                this.audio.stopSound('thrust');
            }
        }
    }
    checkGameOver() {
        // Make sure spaceship exists
        if (!this.spaceship) return;
        // Don't check for game over conditions if the ship is docked
        if (this.spaceship.isDocked) return;
        // Check if ship is destroyed
        if (this.spaceship.isDestroyed) {
            // Use message bus to publish game over event rather than direct call
            this.messageBus.publish('game.over', {
                reason: "Your ship was destroyed in combat",
                source: "game.checkGameOver"
            });
            return;
        }
        // Check if out of fuel and not near mothership
        if (this.spaceship.fuel <= 0 && 
            this.controls.dockingSystem && 
            !this.controls.dockingSystem.nearMothership) {
            // Use message bus to publish game over event rather than direct call
            this.messageBus.publish('game.over', {
                reason: "Your ship ran out of fuel",
                source: "game.checkGameOver"
            });
            return;
        }
        // Check for collision with sun
        const sunPosition = new THREE.Vector3(0, 0, 0);
        const distanceToSun = this.spaceship.mesh.position.distanceTo(sunPosition);
        if (distanceToSun < 400) { // Sun collision radius
            // Use message bus to publish game over event rather than direct call
            this.messageBus.publish('game.over', {
                reason: "Your ship was destroyed by the sun's heat",
                source: "game.checkGameOver"
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
        if (this.isGameOver) {
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
     * @param {string} message The reason for game over
     */
    gameOver(message) {
        if (this.isGameOver) {
            console.log("Game over already triggered, ignoring duplicate call");
            return;
        }
        console.log("Game over:", message);
        this.isGameOver = true;
        // Play explosion sound if available
        if (this.audio) {
            console.log("Game: Playing explosion sound");
            this.audio.playSound('explosion');
        }
        // Show game over screen with resources collected and combat stats
        const gameStats = {
            resources: this.controls && this.controls.resources ? this.controls.resources : {},
            combatStats: {
                enemiesDestroyed: this.combatManager && this.combatManager.stats ? this.combatManager.stats.enemiesDestroyed : 0,
                damageDealt: this.damageDealt || 0,
                damageReceived: this.damageReceived || 0
            }
        };
        // Show game over UI
        console.log("Game: Showing game over UI");
        if (this.ui && this.ui.showGameOver) {
            this.ui.showGameOver(gameStats, message);
        } else {
            console.log("Game: UI not available, using fallback");
            this.showFallbackGameOver(message);
        }
        // Stop spaceship movement
        if (this.spaceship && this.spaceship.thrust) {
            this.spaceship.thrust.forward = false;
            this.spaceship.thrust.backward = false;
            this.spaceship.thrust.left = false;
            this.spaceship.thrust.right = false;
            this.spaceship.thrust.boost = false;
        }
        // Stop all control inputs
        if (this.controls && this.controls.inputHandler) {
            this.controls.inputHandler.exitPointerLock();
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
    animate() {
        // Calculate delta time
        const now = performance.now();
        const deltaTime = Math.min(now - this.lastUpdateTime, 100) / 1000; // Clamped to 100ms
        this.lastUpdateTime = now;
        // Update game state
        this.update(deltaTime);
        // Render scene
        this.renderer.render();
        // Request next frame
        requestAnimationFrame(this.animate.bind(this));
    }
    pause() {
        // Pause game logic here
        console.log('Game paused');
        // Mute audio when game is paused
        if (this.audio) {
            this.audio.muted = true;
            for (const sound of Object.values(this.audio.sounds)) {
                sound.muted = true;
            }
            for (const track of this.audio.music) {
                track.muted = true;
            }
        }
    }
    resume() {
        // Resume game logic here
        console.log('Game resumed');
        this.lastUpdateTime = performance.now(); // Reset timer to avoid large delta
        // Unmute audio when game is resumed (only if not globally muted)
        if (this.audio && !this.audio.muted) {
            for (const sound of Object.values(this.audio.sounds)) {
                sound.muted = false;
            }
            for (const track of this.audio.music) {
                track.muted = false;
            }
        }
    }
}