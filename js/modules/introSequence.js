// introSequence.js - Manages the cinematic Star Dreadnought intro sequence

import * as THREE from 'three';
import { StarDreadnought } from './environment/starDreadnought.js';
import { createIntroSoundEffects } from './intro/audio/soundEffects.js';
import { loadDialogueWavs } from './intro/audio/dialogueManager.js';
import { PortalEffect } from './intro/effects/portalEffect.js';
import { DialogueSystem } from './intro/ui/dialogueSystem.js';
import { updateArrivalPhase } from './intro/animation/arrivalPhase.js';
import { updateDeparturePhase } from './intro/animation/departurePhase.js';

export class IntroSequence {
    constructor(scene, camera, spaceship, audioManager) {
        this.scene = scene;
        this.camera = camera;
        this.spaceship = spaceship;
        this.audio = audioManager;
        this.isPlaying = false;
        this.sequenceTime = 0;
        this.onComplete = null;
        this.skipEnabled = false; // Only enable skip after first playthrough
        
        // Save initial camera position
        this.initialCameraPosition = null;
        this.initialCameraRotation = null;
        
        // Create StarDreadnought instance
        this.starDreadnought = new StarDreadnought(scene);
        
        // Setup portal effect
        this.portalEffect = new PortalEffect();
        
        // Overlay for flash effects
        this.setupOverlay();
        
        // Setup dialogue system
        this.dialogueSystem = new DialogueSystem();
        
        // Custom sound effects
        this.introSounds = {};
        
        // Dialogue WAV files
        this.dialogueWavs = [];
        
        
        console.log("Intro sequence initialized");
        
        // Load dialogue WAV files
        this.dialogueWavs = loadDialogueWavs();
        
        // Create custom Tone.js sound effects
        this.introSounds = createIntroSoundEffects(this.audio);
        
        // Initialize dialogue system
        this.dialogueSystem.initialize(this.dialogueWavs, this.audio);
    }
    
    
    
    
    
    
    
    
    
    setupOverlay() {
        // Create a DOM overlay for the flash effect
        this.overlay = document.createElement('div');
        this.overlay.id = 'intro-overlay';
        this.overlay.style.position = 'fixed';
        this.overlay.style.top = '0';
        this.overlay.style.left = '0';
        this.overlay.style.width = '100%';
        this.overlay.style.height = '100%';
        this.overlay.style.backgroundColor = '#aa33ff'; // Match portal color
        this.overlay.style.opacity = '0';
        this.overlay.style.transition = 'opacity 0.5s';
        this.overlay.style.pointerEvents = 'none';
        this.overlay.style.zIndex = '9999';
        
        // Add to DOM but hide initially
        document.body.appendChild(this.overlay);
    }
    
    startSequence(onComplete) {
        if (this.isPlaying) return;
        
        console.log("Starting intro sequence...");
        this.isPlaying = true;
        this.sequenceTime = 0;
        this.onComplete = onComplete;
        
        // Store initial camera state to restore player camera after sequence
        this.initialCameraPosition = this.camera.position.clone();
        this.initialCameraRotation = this.camera.rotation.clone();
        
        // Position camera for initial view of portal forming
        this.camera.position.set(0, 6000, 12000);
        this.camera.lookAt(30000, 5000, 0); // Look at where portal will appear
        
        // Hide player ship during sequence
        if (this.spaceship && this.spaceship.mesh) {
            this.spaceship.mesh.visible = false;
            
            // Disable ship thrusters to prevent any movement
            if (this.spaceship.thrust) {
                this.spaceship.thrust.forward = false;
                this.spaceship.thrust.backward = false;
                this.spaceship.thrust.left = false;
                this.spaceship.thrust.right = false;
                this.spaceship.thrust.boost = false;
            }
            
            // Make sure velocity is zero
            if (this.spaceship.velocity) {
                this.spaceship.velocity.set(0, 0, 0);
            }
        }
        
        // Add portal to scene
        this.scene.add(this.portalEffect.getPortalGroup());
        
        // Position the star dreadnought initially outside the scene
        this.starDreadnought.ship.position.set(35000, 5000, 0); // Off-screen
        this.starDreadnought.ship.rotation.y = Math.PI/2; // Face toward center
        this.starDreadnought.ship.visible = false;
        
        // Start sequence animation
        this.animate = this.animate.bind(this);
        this.lastTime = performance.now();
        requestAnimationFrame(this.animate);
        
        // Setup skip functionality
        this.setupSkipHandler();
        
        // Setup dialogue UI
        this.dialogueSystem.setupDialogueUI();
        
        // Start first dialogue line
        setTimeout(() => {
            this.dialogueSystem.typeNextDialogue(this.sequenceTime, this.isPlaying);
        }, 2000);
        
        // Play warp sound
        if (this.introSounds.warp) {
            this.introSounds.warp.play();
        }
    }
    
    animate(currentTime) {
        if (!this.isPlaying) return;
        
        // Slower pace for more sublime experience
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1) * 0.4; // 60% slower
        this.lastTime = currentTime;
        
        // Update sequence timer
        this.sequenceTime += deltaTime;
        
        // Just TWO phases - arrival and departure
        if (this.sequenceTime < 14.0) {
            // Phase 1: Portal, ship arrival and player deployment (0-14s)
            const context = this.createAnimationContext();
            updateArrivalPhase(this.sequenceTime / 14.0, context);
        } else if (this.sequenceTime < 24.0) {
            // Phase 2: Ship departure (14-24s)
            const context = this.createAnimationContext();
            updateDeparturePhase((this.sequenceTime - 14.0) / 10.0, context);
        } else {
            // Sequence complete
            this.completeSequence();
            return;
        }
        
        requestAnimationFrame(this.animate);
    }
    
    /**
     * Create context object for animation phases
     * @returns {Object} Context containing all necessary references
     */
    createAnimationContext() {
        return {
            portalEffect: this.portalEffect,
            starDreadnought: this.starDreadnought,
            camera: this.camera,
            spaceship: this.spaceship,
            introSounds: this.introSounds,
            flashOverlay: this.flashOverlay.bind(this),
            finalPlayerPosition: this.finalPlayerPosition,
            playerShieldEffect: this.playerShieldEffect,
            shieldPulseTime: this.shieldPulseTime
        };
    }
    
    
    
    
    
    flashOverlay(maxOpacity = 0.6) {
        if (!this.overlay) return;
        
        // Flash overlay effect
        this.overlay.style.opacity = maxOpacity.toString();
        
        // Fade out after flash
        setTimeout(() => {
            this.overlay.style.opacity = '0';
        }, 300);
    }
    
    setupSkipHandler() {
        // Add skip button
        const skipButton = document.createElement('div');
        skipButton.id = 'skip-intro-button';
        skipButton.textContent = 'SKIP INTRO';
        skipButton.style.position = 'fixed';
        skipButton.style.bottom = '10px';
        skipButton.style.left = '50%';
        skipButton.style.transform = 'translateX(-50%)';
        skipButton.style.padding = '10px 15px';
        skipButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        skipButton.style.color = '#30f0c0';
        skipButton.style.border = '1px solid #30f0c0';
        skipButton.style.borderRadius = '5px';
        skipButton.style.cursor = 'pointer';
        skipButton.style.zIndex = '10000';
        skipButton.style.fontFamily = 'Courier New, monospace';
        skipButton.style.boxShadow = '0 0 10px rgba(48, 240, 192, 0.3)';
        
        skipButton.addEventListener('click', () => {
            this.skipSequence();
        });
        
        document.body.appendChild(skipButton);
        this.skipButton = skipButton;
    }
    
    skipSequence() {
        console.log("Skipping intro sequence");
        
        // Position ship exactly where the intro would have positioned it
        if (this.spaceship && this.spaceship.mesh) {
            // Position where the dreadnought would have deployed the ship
            // Dreadnought ends at (22000, 5000, 0), ship is 2000 units below
            this.spaceship.mesh.position.set(22000, 3000, 0);
            this.spaceship.mesh.rotation.set(0, 0, 0);
            
            // Make sure ship is NOT docked
            this.spaceship.isDocked = false;
            this.spaceship.mesh.visible = true;
            
            // Ensure ship has proper health and fuel values
            if (this.spaceship.hull <= 0) {
                console.log("Fixing spaceship hull from", this.spaceship.hull, "to 100");
                this.spaceship.hull = 100;
            }
            if (this.spaceship.shield <= 0) {
                console.log("Fixing spaceship shield from", this.spaceship.shield, "to 50");
                this.spaceship.shield = 50;
            }
            if (this.spaceship.fuel <= 0) {
                console.log("Fixing spaceship fuel from", this.spaceship.fuel, "to 100");
                this.spaceship.fuel = 100;
            }
        }
        
        // End the sequence immediately
        this.completeSequence();
        
        // Don't show stargate UI - player should be in space after skipping
        // Just ensure the ship is properly set to undocked state
        if (window.gameInstance && window.gameInstance.spaceship) {
            window.gameInstance.spaceship.isDocked = false;
            console.log("Ship set to undocked state after skip");
            
            // Double-check health values on the global instance too
            if (window.gameInstance.spaceship.hull <= 0) {
                console.log("Fixing global spaceship hull to 100");
                window.gameInstance.spaceship.hull = 100;
            }
            if (window.gameInstance.spaceship.fuel <= 0) {
                console.log("Fixing global spaceship fuel to 100");
                window.gameInstance.spaceship.fuel = 100;
            }
        }
    }
    
    completeSequence() {
        console.log("Intro sequence complete");
        this.isPlaying = false;
        
        // Remove warp tunnel from scene
        this.scene.remove(this.portalEffect.getPortalGroup());
        
        // Hide dreadnought
        this.starDreadnought.ship.visible = false;
        
        // Enable skip button for next time
        this.skipEnabled = true;
        
        // Remove shield effect from player
        if (this.playerShieldEffect) {
            this.spaceship.mesh.remove(this.playerShieldEffect);
            this.playerShieldEffect = null;
        }
        
        // Remove skip button if it exists
        if (this.skipButton) {
            document.body.removeChild(this.skipButton);
            this.skipButton = null;
        }
        
        // Remove overlay from DOM completely
        if (this.overlay) {
            document.body.removeChild(this.overlay);
            this.overlay = null;
        }
        
        // Clean up dialogue system
        this.dialogueSystem.cleanup();
        
        // Make sure player ship is visible but DO NOT reset position
        if (this.spaceship && this.spaceship.mesh) {
            this.spaceship.mesh.visible = true;
            
            // IMPORTANT: Make sure ship is properly undocked
            if (this.spaceship.isDocked) {
                console.log("Forcing ship to undocked state after intro sequence");
                this.spaceship.isDocked = false;
            }
            
            // Log the final player position for debugging
            console.log("Player final position:", 
                this.spaceship.mesh.position.x, 
                this.spaceship.mesh.position.y, 
                this.spaceship.mesh.position.z
            );
        }
        
        // Call completion callback if provided
        if (this.onComplete && typeof this.onComplete === 'function') {
            // Use setTimeout to make sure this executes after the animation frame
            setTimeout(() => {
                console.log("Executing intro sequence completion callback");
                this.onComplete();
            }, 100);
        }
    }

    /**
     * Clean up resources when intro sequence is no longer needed
     */
    destroy() {
        // Cancel animation frame if running
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Clean up dialogue system
        this.dialogueSystem.cleanup();
        
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
        
        // Remove skip handler
        document.removeEventListener('keydown', this.skipHandler);
        
        // Clean up portal effect
        if (this.portalEffect) {
            this.portalEffect.dispose();
        }
        
        // Dispose of star dreadnought resources
        if (this.starDreadnought && typeof this.starDreadnought.destroy === 'function') {
            this.starDreadnought.destroy();
        }
        
        // Dispose of Tone.js sound effects
        if (this.introSounds) {
            Object.values(this.introSounds).forEach(sound => {
                if (sound.dispose && typeof sound.dispose === 'function') {
                    sound.dispose();
                }
            });
            this.introSounds = {};
        }
        
        // Clear references to help GC
        this.scene = null;
        this.camera = null;
        this.spaceship = null;
        this.audio = null;
        this.starDreadnought = null;
        this.portalEffect = null;
        this.dialogueSystem = null;
        this.dialogueWavs = [];
    }
} 