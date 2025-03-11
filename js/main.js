// main.js - Main entry point for the game

// Global debug flag - set to true for development
window.DEBUG_MODE = true;

import { Renderer } from './modules/renderer.js';
import { Spaceship } from './modules/spaceship.js';
import { Physics } from './modules/physics.js';
import { Environment } from './modules/environment.js';
import { Controls } from './modules/controls.js';
import { UI } from './modules/ui.js';
import { AudioManager } from './modules/audio.js';
import { Combat } from './modules/combat.js';

class Game {
    constructor() {
        console.log("Initializing game...");
        
        try {
            // Initialize audio manager first to start loading sounds
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
            
            // Initialize combat systems
            console.log("Creating combat module...");
            this.combat = new Combat(this.scene, this.spaceship);
            
            // Ensure the ECS world in combat is properly initialized
            if (this.combat.world) {
                console.log("Combat ECS world successfully created");
            } else {
                console.log("Waiting for combat ECS world to initialize...");
                // Add a check to ensure the player entity exists
                setTimeout(() => {
                    if (this.combat.world && this.combat.playerEntity) {
                        console.log("Combat ECS world and player entity initialized after delay");
                    } else {
                        console.warn("Combat ECS world or player entity not available after delay, recreating...");
                        if (this.combat.createPlayerReferenceEntity) {
                            this.combat.createPlayerReferenceEntity();
                        }
                    }
                }, 1000);
            }
            
            // Initialize UI
            this.ui = new UI(this.spaceship, this.environment);
            
            // Share audio reference with UI for sound-based components
            this.ui.setAudio(this.audio);
            
            // Initialize controls last, as it depends on other components
            this.controls = new Controls(this.spaceship, this.physics, this.environment, this.ui);
            
            // Share controls reference with UI for bidirectional communication
            this.ui.setControls(this.controls);
            
            // Initial camera positioning
            this.camera.position.set(0, 1500, 0);
        
        // Game state
            this.isGameOver = false;
            this.lastUpdateTime = performance.now();
            this.frameCount = 0;
            
            // Start with docked state for initial tutorial/intro
            this.startDocked();
            
            // Register event handlers
            this.setupEventHandlers();
            
            // Initialize audio after everything else is set up
            this.audio.initialize().then(() => {
                console.log("Audio system initialized");
            });
            
            console.log("Game initialization complete");
            
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
        
        // Ensure the combat system's player entity is always up to date
        if (this.combat && this.combat.updatePlayerReference) {
            this.combat.updatePlayerReference();
        }
        
        // Update combat systems - this will update the ECS world
        if (this.combat && this.combat.update) {
            this.combat.update(deltaTime);
        }
        
        // Update environment
        if (this.environment.update) {
            this.environment.update();
        }
        
        // Update UI
        if (this.ui.update) {
            this.ui.update();
        }
        
        // Update audio
        this.updateAudio();
        
        // Check for game over conditions
        this.checkGameOver();
        
        // Count frames for performance monitoring
        this.frameCount++;
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
        
        // Mining sound is handled by the mining system integration
    }
    
    checkGameOver() {
        // Make sure spaceship exists
        if (!this.spaceship) return;
        
        // Don't check for game over conditions if the ship is docked
        if (this.spaceship.isDocked) return;
        
        // Check if out of fuel and not near mothership
        if (this.spaceship.fuel <= 0 && 
            this.controls.dockingSystem && 
            !this.controls.dockingSystem.nearMothership) {
            this.gameOver("Your ship ran out of fuel");
            return;
        }
        
        // Check for collision with sun
        const sunPosition = new THREE.Vector3(0, 0, 0);
        const distanceToSun = this.spaceship.mesh.position.distanceTo(sunPosition);
        if (distanceToSun < 400) { // Sun collision radius
            this.gameOver("Your ship was destroyed by the sun's heat");
            return;
        }
    }
    
    gameOver(message) {
        if (this.isGameOver) return;
        
        console.log("Game over:", message);
        this.isGameOver = true;
        
        // Play explosion sound
        if (this.audio) {
            this.audio.playSound('explosion');
        }
        
        // Show game over screen with resources collected
        if (this.ui.showGameOver && this.controls.resources) {
            this.ui.showGameOver(this.controls.resources, message);
        }
        
        // Stop spaceship movement if it exists
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
        
        // Unmute audio when game is resumed
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

// Start the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create loading screen
    const loadingScreen = document.createElement('div');
    loadingScreen.id = 'loading-screen';
    loadingScreen.style.position = 'fixed';
    loadingScreen.style.top = '0';
    loadingScreen.style.left = '0';
    loadingScreen.style.width = '100%';
    loadingScreen.style.height = '100%';
    loadingScreen.style.backgroundColor = '#000';
    loadingScreen.style.display = 'flex';
    loadingScreen.style.flexDirection = 'column';
    loadingScreen.style.alignItems = 'center';
    loadingScreen.style.justifyContent = 'center';
    loadingScreen.style.zIndex = '9999';
    loadingScreen.style.color = '#fff';
    loadingScreen.style.fontFamily = 'Courier New, monospace';
    
    const title = document.createElement('h1');
    title.textContent = 'ASTEROID MINER';
    title.style.fontSize = '48px';
    title.style.marginBottom = '30px';
    title.style.color = '#30cfd0';
    title.style.textShadow = '0 0 10px #30cfd0';
    
    const loadingText = document.createElement('p');
    loadingText.textContent = 'Initializing systems...';
    loadingText.style.fontSize = '18px';
    loadingText.style.marginBottom = '20px';
    
    const progressContainer = document.createElement('div');
    progressContainer.style.width = '300px';
    progressContainer.style.height = '10px';
    progressContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
    progressContainer.style.borderRadius = '5px';
    progressContainer.style.overflow = 'hidden';
    
    const progressBar = document.createElement('div');
    progressBar.id = 'loading-progress';
    progressBar.style.width = '0%';
    progressBar.style.height = '100%';
    progressBar.style.backgroundColor = '#30cfd0';
    progressBar.style.transition = 'width 0.3s';
    
    progressContainer.appendChild(progressBar);
    loadingScreen.appendChild(title);
    loadingScreen.appendChild(loadingText);
    loadingScreen.appendChild(progressContainer);
    document.body.appendChild(loadingScreen);
    
    // Add a console message to help debug loading issues
    console.log("DOM loaded, preparing to start game...");
    
    // Simulate loading progress
    let progress = 0;
    const loadingInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
            progress = 100;
            clearInterval(loadingInterval);
            
            console.log("Loading progress complete, starting game...");
            
            // Start game after a short delay
            setTimeout(() => {
                loadingScreen.style.opacity = '0';
                loadingScreen.style.transition = 'opacity 1s';
                
                setTimeout(() => {
                    loadingScreen.remove();
                    
                    // Force a small garbage collection delay
                    console.log("Starting garbage collection delay...");
                    setTimeout(() => {
                        console.log("Creating game instance...");
                        
                        // Initialize the game with error handling
                        try {
                            console.log("Checking for shader availability...");
                            // Log shader availability for debugging
                            console.log("LuminosityHighPassShader:", typeof THREE.LuminosityHighPassShader !== 'undefined');
                            console.log("FXAAShader:", typeof THREE.FXAAShader !== 'undefined');
                            console.log("FilmShader:", typeof THREE.FilmShader !== 'undefined');
                            console.log("ColorCorrectionShader:", typeof THREE.ColorCorrectionShader !== 'undefined');
                            console.log("VignetteShader:", typeof THREE.VignetteShader !== 'undefined');
                            console.log("UnrealBloomPass:", typeof THREE.UnrealBloomPass !== 'undefined');
                            
                            window.game = new Game(); // Initialize the game
                            console.log("Game started successfully");
                        } catch (error) {
                            console.error("Error starting game:", error);
                            
                            // Show error message to user
                            const errorMessage = document.createElement('div');
                            errorMessage.style.position = 'fixed';
                            errorMessage.style.top = '50%';
                            errorMessage.style.left = '50%';
                            errorMessage.style.transform = 'translate(-50%, -50%)';
                            errorMessage.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                            errorMessage.style.color = '#ff3030';
                            errorMessage.style.padding = '20px';
                            errorMessage.style.borderRadius = '10px';
                            errorMessage.style.border = '1px solid #ff3030';
                            errorMessage.style.zIndex = '9999';
                            errorMessage.style.textAlign = 'center';
                            errorMessage.style.fontFamily = 'Courier New, monospace';
                            errorMessage.style.maxWidth = '80%';
                            
                            errorMessage.innerHTML = `
                                <h2>Error Starting Game</h2>
                                <p>${error.message}</p>
                                <p>Check the console for more details (F12).</p>
                                <p>You can try refreshing the page or clearing your browser cache.</p>
                                <button id="reload-button" style="background: #ff3030; color: white; border: none; padding: 10px; margin-top: 20px; cursor: pointer;">Reload Page</button>
                            `;
                            
                            document.body.appendChild(errorMessage);
                            
                            // Add event listener to reload button
                            document.getElementById('reload-button').addEventListener('click', () => {
                                // Add cache-busting parameter to the URL
                                const cacheBuster = Date.now();
                                window.location.href = window.location.pathname + '?cache=' + cacheBuster;
                            });
                        }
                    }, 200);
                }, 1000);
            }, 500);
        }
        
        progressBar.style.width = `${progress}%`;
        loadingText.textContent = `Initializing systems... ${Math.floor(progress)}%`;
    }, 100);
}); 