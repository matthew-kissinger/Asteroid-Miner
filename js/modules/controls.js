// controls.js - Main controls module that integrates all control components

import { InputHandler } from './controls/inputHandler.js';
import { MiningSystem } from './controls/miningSystem.js';
import { TargetingSystem } from './controls/targetingSystem.js';
import { DockingSystem } from './controls/dockingSystem.js';
import { TouchControls } from './controls/touchControls.js';
import { MobileDetector } from '../utils/mobileDetector.js';

export class Controls {
    constructor(spaceship, physics, environment, ui) {
        console.log("Initializing controls systems...");
        
        this.spaceship = spaceship;
        this.physics = physics;
        this.environment = environment;
        this.ui = ui;
        this.isMobile = MobileDetector.isMobile();
        this._wasDocked = spaceship ? spaceship.isDocked : false;
        this.weaponSystem = null; // Initialize weaponSystem reference
        
        // Set scene reference for components that need it
        this.scene = physics.scene;
        
        // Initialize controls components
        if (!this.isMobile) {
            console.log("Initializing keyboard/mouse controls");
            this.inputHandler = new InputHandler(spaceship, physics);
        } else {
            console.log("Initializing touch controls for mobile");
            this.touchControls = new TouchControls(spaceship, physics);
            // Create a placeholder input handler with minimal functionality
            // This prevents errors where other systems expect inputHandler to exist
            this.inputHandler = {
                isLocked: () => false,
                exitPointerLock: () => {}
            };
        }
        
        this.miningSystem = new MiningSystem(spaceship, this.scene);
        this.targetingSystem = new TargetingSystem(spaceship, this.scene, environment);
        
        // Initialize docking system with all needed references
        this.dockingSystem = new DockingSystem(spaceship, environment.stargate, ui);
        
        // Share the resources reference between components
        this.resources = this.miningSystem.resources;
        this.dockingSystem.setResources(this.resources);
        
        // Pass control systems to touch controls if on mobile
        if (this.isMobile && this.touchControls) {
            this.touchControls.setControlSystems(this);
        }
        
        // Connect upgrade systems - share references for easier updates
        this.connectUpgradeEffects();
        
        // Set up event handlers - different for mobile vs desktop
        this.setupEventHandlers();
        
        console.log("Control systems initialized");
    }
    
    // New method to connect upgrade effects between systems
    connectUpgradeEffects() {
        // Give the docking system a way to update the mining system
        this.dockingSystem.updateMiningSystem = () => {
            // Update mining speeds based on spaceship's mining efficiency
            if (this.miningSystem && this.spaceship) {
                const efficiency = this.spaceship.miningEfficiency;
                
                // Update base mining speeds for each resource type
                Object.keys(this.miningSystem.miningSpeedByType).forEach(resourceType => {
                    // Store original base speeds if not already stored
                    if (!this.miningSystem._originalMiningSpeedByType) {
                        this.miningSystem._originalMiningSpeedByType = { ...this.miningSystem.miningSpeedByType };
                    }
                    
                    // Apply efficiency to the original base speed
                    const originalSpeed = this.miningSystem._originalMiningSpeedByType[resourceType];
                    this.miningSystem.miningSpeedByType[resourceType] = originalSpeed * efficiency;
                });
                
                console.log("Mining speeds updated with efficiency:", efficiency);
                
                // Update current mining speed if mining is in progress
                if (this.miningSystem.targetAsteroid) {
                    this.miningSystem.setTargetAsteroid(this.miningSystem.targetAsteroid);
                }
            }
        };
    }
    
    setupEventHandlers() {
        // Skip adding keyboard controls if on mobile
        if (this.isMobile) {
            console.log("Mobile device detected, touch handlers are set in TouchControls class");
            return;
        }
        
        // Add key event handlers for targeting and mining
        document.addEventListener('keydown', e => {
            switch (e.key.toLowerCase()) {
                case 'e': 
                    // Toggle targeting system (changed from 't' to 'e')
                    this.targetingSystem.toggleLockOn();
                    break;
                case 'tab': 
                    // Cycle through targets if targeting is enabled
                    if (this.targetingSystem.isLockOnEnabled()) {
                        const target = this.targetingSystem.cycleLockOnTarget();
                        if (target) {
                            this.miningSystem.setTargetAsteroid(target);
                        }
                    }
                    e.preventDefault(); // Prevent tab from changing focus
                    break;
                case 'r': // Changed from 'e' to 'r' (an unused key)
                    // Toggle mining if targeting is enabled and we have a target
                    if (this.targetingSystem.isLockOnEnabled()) {
                        const target = this.targetingSystem.getCurrentTarget();
                        if (target) {
                            this.miningSystem.setTargetAsteroid(target);
                            if (this.miningSystem.isMining) {
                                this.miningSystem.stopMining();
                            } else {
                                this.miningSystem.startMining();
                            }
                        }
                    }
                    break;
            }
        });
        
        // Add mouse click for mining
        document.addEventListener('mousedown', e => {
            if (e.button === 0 && this.inputHandler.isLocked()) { // Left mouse button
                // Fire particle cannon
                if (window.game && window.game.combat) {
                    window.game.combat.setFiring(true);
                }
            }
        });
        
        // Add mouseup to stop mining when button is released
        document.addEventListener('mouseup', e => {
            if (e.button === 0) { // Left mouse button
                // Stop firing
                if (window.game && window.game.combat) {
                    window.game.combat.setFiring(false);
                }
            }
        });
    }
    
    setupStargateUIControls() {
        if (this.dockingSystem) {
            this.dockingSystem.setupStargateUIControls();
        }
    }
    
    // Method to dock with stargate (called from main.js on game start)
    dockWithStargate() {
        if (this.dockingSystem) {
            this.dockingSystem.dockWithStargate();
            
            // Hide touch controls when docked
            if (this.isMobile && this.touchControls) {
                this.touchControls.hide();
            }
        } else {
            console.error("Docking system not initialized");
        }
    }
    
    update() {
        // Skip ALL updates if intro sequence is active
        if (window.game && window.game.introSequenceActive) {
            return;
        }
        
        // Check if docking status changed
        if (this.spaceship) {
            const wasDocked = this._wasDocked;
            const isDocked = this.spaceship.isDocked;
            
            // If docking status changed, update touch controls visibility
            if (this.isMobile && this.touchControls && wasDocked !== isDocked) {
                if (isDocked) {
                    this.touchControls.hide();
                } else {
                    this.touchControls.show();
                }
                this._wasDocked = isDocked;
            }
        }
        
        // Skip updates if docked
        if (this.spaceship && this.spaceship.isDocked) {
            // Only update the docking system when docked
            if (this.dockingSystem) {
                this.dockingSystem.update();
            }
            return;
        }
        
        // Update all control systems
        if (this.targetingSystem) {
            this.targetingSystem.update();
        }
        
        if (this.miningSystem) {
            this.miningSystem.update();
            
            // Check if mining has destroyed an asteroid
            const destroyedAsteroid = this.miningSystem.getLastDestroyedAsteroid();
            if (destroyedAsteroid && this.environment && this.environment.asteroidBelt) {
                // Remove the asteroid from the environment
                this.environment.asteroidBelt.removeAsteroid(destroyedAsteroid);
            }
        }
        
        if (this.dockingSystem) {
            this.dockingSystem.update();
        }
        
        // Update touch controls if on mobile
        if (this.isMobile && this.touchControls) {
            this.touchControls.update();
        }
    }
    
    // Getter for isMining status (used by UI)
    get isMining() {
        return this.miningSystem ? this.miningSystem.isMining : false;
    }
    
    // Getter for mining progress (used by UI)
    get miningProgress() {
        return this.miningSystem ? this.miningSystem.miningProgress : 0;
    }
} 