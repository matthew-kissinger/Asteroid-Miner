// controls.ts - Main controls module that integrates all control components

import { InputHandler } from './controls/inputHandler.js';
import { GamepadHandler } from './controls/gamepadHandler.js';
import { MiningSystem } from './controls/miningSystem.js';
import { TargetingSystem } from './controls/targetingSystem.js';
import { DockingSystem } from './controls/dockingSystem.js';
import { TouchControls } from './controls/touchControls.js';
import { MobileDetector } from '../utils/mobileDetector.js';
import * as THREE from 'three';

// Type definitions for dependencies
type SpaceshipType = {
    isDocked: boolean;
    mesh: {
        position: THREE.Vector3;
    };
    miningEfficiency?: number;
    world?: {
        messageBus?: {
            publish: (event: string, data?: any) => void;
        };
    };
};

type PhysicsType = {
    scene: THREE.Scene;
};

type EnvironmentType = {
    stargate: any;
    asteroidBelt?: {
        removeAsteroid: (asteroid: any) => void;
    };
    checkAnomalyCollision: (position: THREE.Vector3) => any;
    collectAnomalyOrb: (anomaly: any) => any;
};

type UIType = {
    setControls: (controls: Controls) => void;
};

type ResourcesType = {
    orbs: {
        [rarity: string]: number;
    };
    [key: string]: any;
};

type AnomalyType = {
    position: THREE.Vector3;
    orb?: {
        color: any;
        size: number;
    };
    orbCollected?: boolean;
};

type OrbData = {
    rarity: string;
    value: number;
};

interface MinimalInputHandler {
    isLocked: () => boolean;
    exitPointerLock: () => void;
}

export class Controls {
    spaceship: SpaceshipType;
    physics: PhysicsType;
    environment: EnvironmentType;
    ui: UIType;
    isMobile: boolean;
    _wasDocked: boolean;
    weaponSystem: any;
    scene: THREE.Scene;
    inputHandler: InputHandler | MinimalInputHandler;
    gamepadHandler?: GamepadHandler;
    touchControls?: TouchControls;
    miningSystem: MiningSystem;
    targetingSystem: TargetingSystem;
    dockingSystem: DockingSystem;
    resources: ResourcesType;
    lastAnomalyCheck: number;
    currentAnomaly: AnomalyType | null;
    showingAnomalyNotification: boolean;
    deploymentSystem?: any;

    constructor(spaceship: SpaceshipType, physics: PhysicsType, environment: EnvironmentType, ui: UIType) {
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
            
            // Initialize gamepad support for desktop
            console.log("Initializing gamepad support");
            this.gamepadHandler = new GamepadHandler(spaceship, physics, this);
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

        // Share the resources reference between components - use live reference, not a copy
        this.resources = this.miningSystem.resourceExtraction.resources;
        this.dockingSystem.setResources(this.resources);
        
        // Pass control systems to touch controls if on mobile
        if (this.isMobile && this.touchControls) {
            this.touchControls.setControlSystems(this);
        }
        
        // Connect upgrade systems - share references for easier updates
        this.connectUpgradeEffects();
        
        // Set up event handlers - different for mobile vs desktop
        this.setupEventHandlers();
        
        // Initialize anomaly orb collection state
        this.lastAnomalyCheck = 0;
        this.currentAnomaly = null;
        this.showingAnomalyNotification = false;
        
        console.log("Control systems initialized");
    }
    
    // New method to connect upgrade effects between systems
    connectUpgradeEffects(): void {
        // Give the docking system a way to update the mining system
        (this.dockingSystem as any).updateMiningSystem = () => {
            // Update mining speeds based on spaceship's mining efficiency
            if (this.miningSystem && this.spaceship) {
                const efficiency = this.spaceship.miningEfficiency || 1.0;
                
                // Update base mining speeds for each resource type
                Object.keys(this.miningSystem.miningSpeedByType).forEach((resourceType: string) => {
                    // Store original base speeds if not already stored
                    if (!(this.miningSystem as any)._originalMiningSpeedByType) {
                        (this.miningSystem as any)._originalMiningSpeedByType = { ...this.miningSystem.miningSpeedByType };
                    }
                    
                    // Apply efficiency to the original base speed
                    const originalSpeed = (this.miningSystem as any)._originalMiningSpeedByType[resourceType];
                    (this.miningSystem.miningSpeedByType as any)[resourceType] = originalSpeed * efficiency;
                });
                
                console.log("Mining speeds updated with efficiency:", efficiency);
                
                // Update current mining speed if mining is in progress
                if (this.miningSystem.targetAsteroid) {
                    this.miningSystem.setTargetAsteroid(this.miningSystem.targetAsteroid);
                }
            }
        };
    }
    
    setupEventHandlers(): void {
        // Skip adding keyboard controls if on mobile
        if (this.isMobile) {
            console.log("Mobile device detected, touch handlers are set in TouchControls class");
            return;
        }
        
        // Add key event handlers for targeting and mining
        document.addEventListener('keydown', (e: KeyboardEvent) => {
            switch (e.key.toLowerCase()) {
                case 'e': 
                    // Toggle targeting system (changed from 't' to 'e')
                    this.targetingSystem.toggleLockOn();
                    break;
                case 'f7':
                    // Decrease gamepad sensitivity
                    if (this.gamepadHandler) {
                        this.gamepadHandler.lookSensitivity = Math.max(0.2, this.gamepadHandler.lookSensitivity - 0.2);
                        console.log(`Gamepad sensitivity: ${this.gamepadHandler.lookSensitivity.toFixed(1)}`);
                        this.showSensitivityNotification(this.gamepadHandler.lookSensitivity);
                    }
                    e.preventDefault();
                    break;
                case 'f8':
                    // Increase gamepad sensitivity
                    if (this.gamepadHandler) {
                        this.gamepadHandler.lookSensitivity = Math.min(3.0, this.gamepadHandler.lookSensitivity + 0.2);
                        console.log(`Gamepad sensitivity: ${this.gamepadHandler.lookSensitivity.toFixed(1)}`);
                        this.showSensitivityNotification(this.gamepadHandler.lookSensitivity);
                    }
                    e.preventDefault();
                    break;
                case 'f9':
                    // Toggle gamepad debug display
                    if (this.gamepadHandler) {
                        this.gamepadHandler.toggleDebug();
                        console.log('Gamepad debug display toggled');
                    }
                    e.preventDefault();
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
                case 't': 
                    // Deploy a laser turret
                    console.log("Deploying laser turret");
                    if ((window as any).mainMessageBus) {
                        (window as any).mainMessageBus.publish('input.deployLaser', {});
                    }
                    break;
                case 'g': 
                    // Pick up an item
                    console.log("Attempting to pick up an item");
                    if ((window as any).mainMessageBus) {
                        (window as any).mainMessageBus.publish('input.pickupInteract', {});
                    }
                    break;
            }
        });
        
        // Add mouse click for mining
        document.addEventListener('mousedown', (e: MouseEvent) => {
            if (e.button === 0 && this.inputHandler.isLocked()) { // Left mouse button
                // Fire particle cannon
                if ((window as any).game && (window as any).game.combat) {
                    (window as any).game.combat.setFiring(true);
                }
            }
        });
        
        // Add mouseup to stop mining when button is released
        document.addEventListener('mouseup', (e: MouseEvent) => {
            if (e.button === 0) { // Left mouse button
                // Stop firing
                if ((window as any).game && (window as any).game.combat) {
                    (window as any).game.combat.setFiring(false);
                }
            }
        });
    }
    
    setupStargateUIControls(): void {
        if (this.dockingSystem) {
            this.dockingSystem.setupStargateUIControls();
        }
    }
    
    // Method to dock with stargate (called from main.js on game start)
    dockWithStargate(): void {
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
    
    // Collect energy orb from space anomaly
    collectEnergyOrb(): void {
        if (!this.environment || !this.spaceship) return;
        
        // Check if player is near an anomaly with an active orb
        const anomaly = this.environment.checkAnomalyCollision(this.spaceship.mesh.position);
        if (!anomaly) {
            return; // No anomaly in range, silently return
        }
        
        // Try to collect the orb
        const orbData = this.environment.collectAnomalyOrb(anomaly) as OrbData | null;
        if (!orbData) {
            // Orb already collected, notification handled in checkForAnomalyOrbs
            return;
        }

        // Add orb to inventory
        if (!this.resources.orbs) {
            this.resources.orbs = {};
        }
        if (!this.resources.orbs[orbData.rarity]) {
            this.resources.orbs[orbData.rarity] = 0;
        }
        this.resources.orbs[orbData.rarity]++;
        
        // Show notification with value and rarity
        let rarityColor: string;
        switch(orbData.rarity) {
            case 'legendary':
                rarityColor = "#ff0000"; // Red
                break;
            case 'epic':
                rarityColor = "#ff6600"; // Orange
                break;
            case 'rare':
                rarityColor = "#9900ff"; // Purple
                break;
            case 'uncommon':
                rarityColor = "#0066ff"; // Blue
                break;
            default: // common
                rarityColor = "#00ff66"; // Green
                break;
        }
        
        const capitalizedRarity = orbData.rarity.charAt(0).toUpperCase() + orbData.rarity.slice(1);
        
        // Show message with appropriate styling
        this.showAnomalyMessage(
            `Collected ${capitalizedRarity} Energy Orb (${orbData.value} CR)`,
            rarityColor
        );
        
        // Trigger collection effect
        this.triggerOrbCollectionEffect(anomaly);
        
        // Play sound if audio manager is available
        if ((window as any).game && (window as any).game.audio) {
            // Play different sounds based on rarity
            switch(orbData.rarity) {
                case 'legendary':
                    (window as any).game.audio.playSoundEffect('powerup_legendary', 0.8);
                    break;
                case 'epic':
                    (window as any).game.audio.playSoundEffect('powerup_epic', 0.7);
                    break;
                case 'rare':
                    (window as any).game.audio.playSoundEffect('powerup_rare', 0.6);
                    break;
                case 'uncommon':
                    (window as any).game.audio.playSoundEffect('powerup_uncommon', 0.5);
                    break;
                default: // common
                    (window as any).game.audio.playSoundEffect('powerup_common', 0.4);
                    break;
            }
        }
    }
    
    // Create a visual effect when collecting an orb
    triggerOrbCollectionEffect(anomaly: AnomalyType): void {
        // Check if we have access to the scene and visual effects
        if (!this.scene || !anomaly) return;
        
        // Create an explosion effect at the anomaly orb position
        if ((window as any).game && (window as any).game.combat) {
            const position = anomaly.position.clone();
            
            // Use explosion effect from combat system
            (window as any).game.combat.createExplosionEffect(position, 2000, true);
            
            // Also publish an event for additional effects
            if ((window as any).mainMessageBus) {
                (window as any).mainMessageBus.publish('vfx.explosion', {
                    position: position,
                    color: anomaly.orb?.color,
                    size: anomaly.orb ? anomaly.orb.size * 2 : 1,
                    duration: 2000
                });
            }
        }
    }
    
    // Show a notification when anomaly is found or orb is collected
    showAnomalyMessage(message: string, color: string): void {
        if (this.showingAnomalyNotification) return; // Don't stack notifications
        
        this.showingAnomalyNotification = true;
        
        // Create notification element
        const notification = document.createElement('div');
        notification.style.position = 'fixed';
        notification.style.top = '30%';
        notification.style.left = '50%';
        notification.style.transform = 'translate(-50%, -50%)';
        notification.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        notification.style.color = color || '#ffffff';
        notification.style.padding = '15px 30px';
        notification.style.borderRadius = '10px';
        notification.style.border = `2px solid ${color || '#ffffff'}`;
        notification.style.boxShadow = `0 0 15px ${color || '#ffffff'}`;
        notification.style.fontFamily = 'Courier New, monospace';
        notification.style.fontSize = '18px';
        notification.style.zIndex = '1000';
        notification.style.textAlign = 'center';
        notification.style.pointerEvents = 'none'; // Don't block mouse events
        
        // Set notification text
        notification.textContent = message;
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Remove after a few seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.8s';
            
            setTimeout(() => {
                notification.remove();
                this.showingAnomalyNotification = false;
            }, 800);
        }, 3000);
    }
    
    showSensitivityNotification(sensitivity: number): void {
        // Create notification element
        const notification = document.createElement('div');
        notification.textContent = `Gamepad Sensitivity: ${sensitivity.toFixed(1)}`;
        notification.style.position = 'fixed';
        notification.style.top = '100px';
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%)';
        notification.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        notification.style.color = '#30cfd0';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = '5px';
        notification.style.border = '1px solid #30cfd0';
        notification.style.fontFamily = 'monospace';
        notification.style.fontSize = '16px';
        notification.style.zIndex = '10000';
        notification.style.pointerEvents = 'none';
        
        document.body.appendChild(notification);
        
        // Fade out and remove after 2 seconds
        setTimeout(() => {
            notification.style.transition = 'opacity 0.5s';
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 500);
        }, 2000);
    }
    
    /**
     * Update control systems
     * @param deltaTime Time since last update in seconds
     */
    update(deltaTime: number = 1/60): void {
        // Skip ALL updates if intro sequence is active
        if ((window as any).game && (window as any).game.introSequenceActive) {
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
        
        // Update gamepad input if available
        if (this.gamepadHandler) {
            this.gamepadHandler.update(deltaTime);
        }
        
        // Update all control systems
        if (this.targetingSystem) {
            this.targetingSystem.update();
        }
        
        if (this.miningSystem) {
            // Pass deltaTime to ensure frame-rate independent mining
            this.miningSystem.update(deltaTime);
            
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
        
        if (this.deploymentSystem) {
            this.deploymentSystem.update();
        }
        
        // Check for and automatically collect anomaly orbs
        this.checkForAnomalyOrbs();
    }
    
    // Check if the player is near an anomaly orb and collect it if close enough
    checkForAnomalyOrbs(): void {
        if (!this.environment || !this.spaceship) return;
        
        // Limit check frequency to avoid performance impact
        const now = performance.now();
        if (now - this.lastAnomalyCheck < 500) return; // Check every 500ms
        this.lastAnomalyCheck = now;
        
        // Check if player is within an anomaly's orb collection radius
        const anomaly = this.environment.checkAnomalyCollision(this.spaceship.mesh.position);
        
        // If player is within collection radius of an anomaly with an uncollected orb
        if (anomaly && !anomaly.orbCollected) {
            // Automatically collect the orb
            this.collectEnergyOrb();
            
            // Reset current anomaly when orb is collected
            this.currentAnomaly = null;
        } else if (anomaly && anomaly !== this.currentAnomaly && anomaly.orbCollected) {
            // If player enters a depleted anomaly, show notification
            this.currentAnomaly = anomaly;
            this.showAnomalyMessage("Energy orb already collected", "#ff3333");
        } else if (!anomaly) {
            // Reset current anomaly when player leaves the collection radius
            this.currentAnomaly = null;
        }
    }
    
    // Getter for isMining status (used by UI)
    get isMining(): boolean {
        return this.miningSystem ? this.miningSystem.isMining : false;
    }
    
    // Getter for mining progress (used by UI)
    get miningProgress(): number {
        return this.miningSystem ? this.miningSystem.miningProgress : 0;
    }
}
