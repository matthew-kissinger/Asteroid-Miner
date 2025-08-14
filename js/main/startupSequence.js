// startupSequence.js - Asset preloads and intro flow management

import { IntroSequence } from '../modules/introSequence.js';

export class StartupSequence {
    constructor(game) {
        this.game = game;
        this.introSequence = null;
        this.introSequenceActive = false;
    }
    
    // Initialize game in sequence, showing start screen first and loading non-essentials after
    async initializeGameSequence() {
        try {
            if (window.DEBUG_MODE) console.log("Starting game initialization sequence...");
            
            // Add a small delay to let browser stabilize after page load
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Resume audio context if needed (browser autoplay policy)
            if (this.game.audio && this.game.audio.audioContext && this.game.audio.audioContext.state === 'suspended') {
                try {
                    this.game.audio.resumeAudioContext();
                } catch (e) {
                    if (window.DEBUG_MODE) console.log("Audio context couldn't be resumed yet, will try again after user interaction");
                }
            }
            
            // Show the start screen immediately
            if (this.game.ui && this.game.ui.startScreen) {
                if (window.DEBUG_MODE) console.log("Showing start screen");
                this.game.ui.startScreen.show();
            } else {
                console.error("Start screen not found, falling back to default behavior");
                this.fallbackToDefaultBehavior();
            }
            
            // Start game loop with warm-up frames
            if (window.DEBUG_MODE) console.log("Starting game loop with warm-up frames");
            requestAnimationFrame(this.game.boundAnimate);
            
            // Initialize remaining systems in the background after start screen is shown
            this.initializeRemainingSystemsAsync();
            
            if (window.DEBUG_MODE) console.log("Game initialization sequence completed successfully");
        } catch (error) {
            console.error("Error during game initialization sequence:", error);
            
            // Show error in UI if possible
            if (this.game.ui && this.game.ui.showError) {
                this.game.ui.showError("Failed to initialize game: " + error.message);
            } else {
                alert("Failed to initialize game: " + error.message);
            }
        }
    }
    
    // Initialize remaining systems asynchronously after showing the start screen
    async initializeRemainingSystemsAsync() {
        try {
            // Start loading audio in the background
            this.loadAudioAsync();
            
            // Initialize combat systems asynchronously
            if (window.DEBUG_MODE) console.log("Initializing combat module asynchronously...");
            if (!this.game.combat) {
                const { Combat } = await import('../modules/combat.js');
                this.game.combat = new Combat(this.game.scene, this.game.spaceship);
                
                // Ensure the ECS world in combat is properly initialized
                if (this.game.combat.world) {
                    if (window.DEBUG_MODE) console.log("Combat ECS world successfully created");
                } else {
                    if (window.DEBUG_MODE) console.log("Waiting for combat ECS world to initialize...");
                    // Add a check to ensure the player entity exists
                    setTimeout(() => {
                        if (this.game.combat.world && this.game.combat.playerEntity) {
                            if (window.DEBUG_MODE) console.log("Combat ECS world and player entity initialized after delay");
                        } else {
                            console.warn("Combat ECS world or player entity not available after delay, recreating...");
                            if (this.game.combat.createPlayerReferenceEntity) {
                                this.game.combat.createPlayerReferenceEntity();
                            }
                        }
                    }, 1000);
                }
            }
            
            // Initialize common object pools after start screen is shown
            setTimeout(() => {
                this.game.initializeObjectPools();
                
                // Pre-warm essential shaders and projectile assets after start screen is shown
                this.game.preWarmBasicShaders();
            }, 100);
        } catch (error) {
            console.error("Error initializing remaining systems:", error);
        }
    }
    
    // Load audio asynchronously after showing the start screen
    async loadAudioAsync() {
        try {
            if (this.game.audio) {
                // Initialize audio in the background
                if (window.DEBUG_MODE) console.log("Initializing audio system asynchronously...");
                this.game.audio.initialize().then(() => {
                    if (window.DEBUG_MODE) console.log("Audio system initialization complete");
                }).catch(error => {
                    console.error("Error initializing audio:", error);
                });
            }
        } catch (error) {
            console.error("Error loading audio:", error);
        }
    }
    
    fallbackToDefaultBehavior() {
        // Start the game immediately with default settings
        this.game.startDocked();
    }
    
    initIntroSequence() {
        // Initialize the intro sequence module
        if (window.DEBUG_MODE) console.log("Initializing intro sequence module...");
        this.introSequence = new IntroSequence(
            this.game.scene,
            this.game.camera,
            this.game.spaceship,
            this.game.audio  // Pass audio manager as 4th parameter
        );
        
        // Set the completion callback
        this.introSequence.onComplete = () => {
            this.completeIntroSequence();
        };
    }
    
    startIntroSequence() {
        if (!this.introSequence) {
            this.initIntroSequence();
        }
        
        if (window.DEBUG_MODE) console.log("Starting intro sequence");
        this.introSequenceActive = true;
        this.game.introSequenceActive = true;
        
        // Disable all enemies during intro sequence
        if (this.game.combat && this.game.combat.world && this.game.combat.world.enemySystem) {
            if (window.DEBUG_MODE) console.log("Freezing all enemies for intro sequence");
            this.game.combat.world.enemySystem.freezeAllEnemies();
        }
        
        // Hide UI elements during intro
        if (this.game.ui && this.game.ui.combatDisplay) {
            this.game.ui.combatDisplay.hide();
        }
        
        // Player controls are automatically disabled during intro via introSequenceActive flag
        // The InputHandler checks window.game.introSequenceActive
        
        // Hide the stargate UI immediately when intro starts
        if (this.game.ui && this.game.ui.stargateInterface) {
            this.game.ui.stargateInterface.hide();
        }
        
        // Also hide the entire UI during intro
        if (this.game.ui) {
            this.game.ui.hideUI();
        }
        
        // Position spaceship for intro
        if (this.game.spaceship && this.game.spaceship.mesh) {
            this.game.spaceship.mesh.position.set(0, 0, 50);
            this.game.spaceship.mesh.rotation.set(0, 0, 0);
        }
        
        // Start the intro sequence
        this.introSequence.startSequence(() => {
            this.completeIntroSequence();
        });
    }
    
    completeIntroSequence() {
        if (window.DEBUG_MODE) console.log("Completing intro sequence");
        this.introSequenceActive = false;
        this.game.introSequenceActive = false;
        
        // Mark intro as played so it doesn't play again
        localStorage.setItem('introPlayed', 'true');
        
        // Re-enable enemies after intro
        if (this.game.combat && this.game.combat.world && this.game.combat.world.enemySystem) {
            if (window.DEBUG_MODE) console.log("Unfreezing enemies after intro sequence");
            this.game.combat.world.enemySystem.unfreezeAllEnemies();
        }
        
        // Ensure stargate UI is hidden after intro
        if (this.game.ui && this.game.ui.stargateInterface) {
            this.game.ui.stargateInterface.hide();
        }
        
        // Start game based on whether player wants to be docked or not
        // Always start undocked after intro
        if (this.game.ui) {
            this.game.ui.showUI();
        }
        
        // After intro, player should stay where they were deployed
        // Only ensure the spaceship is undocked, don't reset position
        if (this.game.spaceship) {
            // Make sure spaceship is undocked
            if (this.game.spaceship.isDocked) {
                this.game.spaceship.undock();
            }
            // Log current position for debugging
            if (this.game.spaceship.mesh) {
                console.log("Player position after intro:", 
                    this.game.spaceship.mesh.position.x,
                    this.game.spaceship.mesh.position.y,
                    this.game.spaceship.mesh.position.z
                );
            }
        }
        
        // Player controls are automatically re-enabled when introSequenceActive is set to false
        // The InputHandler checks window.game.introSequenceActive
        
        // Show combat display after intro
        if (this.game.ui && this.game.ui.combatDisplay) {
            this.game.ui.combatDisplay.show();
        }
        
        // Emit event for other systems
        if (window.mainMessageBus) {
            window.mainMessageBus.publish('intro.completed', {});
        }
        
        if (window.DEBUG_MODE) console.log("Game starting after intro sequence");
    }
}