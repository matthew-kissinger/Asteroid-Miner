// miningSystem.js - Handles asteroid mining functionality

import * as THREE from 'three';
import { LaserControl } from './mining/laserControl.ts';
import { TargetValidation } from './mining/targetValidation.ts';
import { ResourceExtraction } from './mining/resourceExtraction.ts';
import { UIUpdates } from './mining/uiUpdates.ts';
import { VisualEffects } from './mining/visualEffects.ts';

export class MiningSystem {
    constructor(spaceship, scene) {
        this.spaceship = spaceship;
        this.scene = scene;
        this.isMining = false;
        this.targetAsteroid = null;
        this.miningProgress = 0;
        this.lastDestroyedAsteroid = null;
        
        // Mining speeds for single-action mining that takes 7.5, 22.5, and 45 seconds respectively
        // Values are in progress per second (1 / seconds_required)
        this.miningSpeedByType = {
            iron: 0.133,     // 1/7.5 seconds to complete
            gold: 0.044,     // 1/22.5 seconds to complete
            platinum: 0.022  // 1/45 seconds to complete
        };
        this.miningSpeed = 0.133; // Default speed, will be set based on asteroid type
        this.miningDistance = 6000; // Maximum mining distance
        this.miningCooldown = 0;
        
        // Initialize component modules
        this.laserControl = new LaserControl(scene, spaceship);
        this.targetValidation = new TargetValidation(spaceship, this.miningDistance);
        this.resourceExtraction = new ResourceExtraction();
        this.uiUpdates = new UIUpdates();
        this.visualEffects = new VisualEffects(scene);
    }
    
    // Helper method to get the mining efficiency from the spaceship
    getMiningEfficiency() {
        return this.spaceship && this.spaceship.miningEfficiency 
            ? this.spaceship.miningEfficiency 
            : 1.0; // Default value if spaceship property not available
    }
    
    // Expose resources from the resource extraction module
    get resources() {
        return this.resourceExtraction.getResources();
    }
    
    setTargetAsteroid(asteroid) {
        try {
            console.log("MiningSystem: setTargetAsteroid called", asteroid);
            
            // Validate asteroid using validation module
            if (!this.targetValidation.validateAsteroid(asteroid)) {
                return false;
            }
            
            this.targetAsteroid = asteroid;
            
            // Set mining speed based on asteroid resource type and apply efficiency modifier
            if (asteroid && asteroid.resourceType) {
                const resourceType = asteroid.resourceType.toLowerCase();
                const baseSpeed = this.miningSpeedByType[resourceType] || this.miningSpeedByType.iron;
                const efficiency = this.getMiningEfficiency();
                
                this.miningSpeed = baseSpeed * efficiency;
                console.log(`Mining ${resourceType} asteroid with speed: ${this.miningSpeed} (efficiency: ${efficiency}x)`);
                
                // Update UI using UI module
                this.uiUpdates.updateTargetInfo(asteroid, this.spaceship, this.miningDistance);
            } else {
                // Default to iron speed if no resource type is specified
                this.miningSpeed = this.miningSpeedByType.iron * this.getMiningEfficiency();
            }
            
            return true;
        } catch (error) {
            console.error("MiningSystem: Error in setTargetAsteroid:", error);
            return false;
        }
    }
    
    startMining() {
        try {
            console.log("MiningSystem: startMining called");
            
            // Don't allow mining if no asteroid is targeted
            if (!this.targetAsteroid) {
                console.error("MiningSystem: Cannot start mining - no target asteroid set");
                return;
            }

            // Validate mining conditions using validation module
            const canMine = this.targetValidation.canStartMining(this.targetAsteroid);
            if (!canMine.valid) {
                if (canMine.reason === "Out of range") {
                    this.uiUpdates.showOutOfRangeMessage();
                }
                console.log(`MiningSystem: ${canMine.reason}`);
                return;
            }
            
            // Set mining state to active
            this.isMining = true;
            this.miningProgress = 0;
            console.log("MiningSystem: Mining state activated");
            
            // Setup laser beam using laser control module
            this.laserControl.setupLaserBeam(this.targetAsteroid);
            
            // Show mining particles using visual effects module
            this.visualEffects.showMiningParticles(this.targetAsteroid, this.getMiningEfficiency());
            
            // Setup mining progress bar using UI module
            this.uiUpdates.setupMiningProgressBar();
            
            // Activate the spaceship's laser emitter
            this.laserControl.activateSpaceshipLaser();
            
            // Update mining status display with timing info
            this.updateMiningStatusWithTime();
            
            // Trigger laser sound
            if (window.game && window.game.audio) {
                window.game.audio.playSound('mining-laser');
            } else if (window.game && window.game.audio) {
                window.game.audio.playSound('laser');
            }
            
            console.log("MiningSystem: Mining successfully started");
        } catch (error) {
            console.error("MiningSystem: Error in startMining:", error);
            this.isMining = false;
        }
    }
    
    // Update the mining status with time estimate
    updateMiningStatusWithTime() {
        this.uiUpdates.updateMiningStatusWithTime(
            this.targetAsteroid, 
            this.miningSpeed, 
            this.getMiningEfficiency()
        );
    }
    
    stopMining() {
        if (!this.isMining) return;
        
        this.isMining = false;
        this.miningProgress = 0;
        
        // Hide laser beam using laser control module
        this.laserControl.hideLaserBeam();
        
        // Hide mining particles using visual effects module
        this.visualEffects.hideMiningParticles();
        
        // Hide mining progress bar using UI module
        this.uiUpdates.hideMiningProgressBar();
        
        // Deactivate the spaceship's laser emitter
        this.laserControl.deactivateSpaceshipLaser();
        
        // Reset mining status display
        this.uiUpdates.resetMiningStatus();
        
        // Stop laser sound
        if (window.game && window.game.audio) {
            window.game.audio.stopSound('mining-laser');
        }
    }
    
    update(deltaTime = 1/60) {
        // Update mining cooldown
        if (this.miningCooldown > 0) {
            this.miningCooldown--;
        }
        
        // Update mining if active
        if (this.isMining) {
            this.updateMining(deltaTime);
        }
        
        // Update mining particles if visible
        this.visualEffects.updateMiningParticles(this.getMiningEfficiency());
        
        // Update target info if we have a target but aren't mining
        if (this.targetAsteroid && !this.isMining) {
            this.uiUpdates.updateTargetInfo(this.targetAsteroid, this.spaceship, this.miningDistance);
        }
    }
    
    updateMining(deltaTime = 1/60) {
        // Make sure we have a target asteroid
        if (!this.targetAsteroid || !this.isMining) {
            this.stopMining();
            return;
        }
        
        // Check if asteroid is in range - if not, stop mining and require new click
        const distance = this.spaceship.mesh.position.distanceTo(this.targetAsteroid.mesh.position);
        if (distance > this.miningDistance) {
            this.stopMining();
            return;
        }
        
        // Update mining progress using deltaTime for frame-rate independence
        this.miningProgress += this.miningSpeed * deltaTime;
        
        // Update laser beam position
        this.laserControl.updateLaserBeam(this.targetAsteroid);
        
        // Update mining particles position
        this.visualEffects.setParticlesPosition(this.targetAsteroid.mesh.position);
        
        // Complete mining when progress reaches 1.0
        if (this.miningProgress >= 1.0) {
            // Add resources from asteroid in one batch
            this.resourceExtraction.addAsteroidResources(this.targetAsteroid, this.getMiningEfficiency());
            
            // Create asteroid break effect
            this.visualEffects.createAsteroidBreakEffect(this.targetAsteroid.mesh.position);
            
            // Store reference to the destroyed asteroid
            this.lastDestroyedAsteroid = this.targetAsteroid;
            
            // Remove asteroid from scene
            this.scene.remove(this.targetAsteroid.mesh);
            
            // Stop mining
            this.stopMining();
            this.targetAsteroid = null;
        }
        
        // Update the progress bar
        this.uiUpdates.updateMiningProgress(this.miningProgress);
    }
    
    
    
    
    
    
    // New method to retrieve the last destroyed asteroid and reset the property
    getLastDestroyedAsteroid() {
        const destroyedAsteroid = this.lastDestroyedAsteroid;
        this.lastDestroyedAsteroid = null; // Reset after getting it
        return destroyedAsteroid;
    }
    
} 
