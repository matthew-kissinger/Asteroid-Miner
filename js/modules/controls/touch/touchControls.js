// touchControls.js - Main coordinator for touch controls on mobile devices

import { JoystickZones } from './ui/joystickZones.js';
import { ActionButtons } from './ui/actionButtons.js';
import { JoystickHandler } from './input/joystickHandler.js';
import { GestureDetector } from './input/gestureDetector.js';
import { MiningHandler } from './actions/miningHandler.js';
import { WeaponHandler } from './actions/weaponHandler.js';
import { SystemActions } from './actions/systemActions.js';

export class TouchControls {
    constructor(spaceship, physics) {
        this.spaceship = spaceship;
        this.physics = physics;
        this.isInitialized = false;
        
        // Initialize UI modules
        this.joystickZones = new JoystickZones();
        this.actionButtons = new ActionButtons();
        
        // Initialize input modules
        this.joystickHandler = new JoystickHandler(spaceship, physics);
        this.gestureDetector = new GestureDetector();
        
        // Initialize action modules
        this.miningHandler = new MiningHandler(spaceship);
        this.weaponHandler = new WeaponHandler();
        this.systemActions = new SystemActions();
        
        // Create crosshair and setup controls
        this.createCrosshair();
        this.initializeAsync();
    }
    
    async initializeAsync() {
        try {
            await this.joystickHandler.loadNippleJS();
            this.setupTouchControls();
        } catch (err) {
            console.error('Failed to load nipple.js:', err);
        }
    }
    
    // Method to set the systems we need to interact with
    setControlSystems(controls) {
        console.log("TouchControls: Setting control systems");
        
        if (!controls) {
            console.error("TouchControls: Controls object is null or undefined");
            return;
        }
        
        // Set systems for action handlers
        this.miningHandler.setMiningSystem(controls.miningSystem);
        this.miningHandler.setTargetingSystem(controls.targetingSystem);
        this.weaponHandler.setWeaponSystem(controls.weaponSystem);
        this.systemActions.setDockingSystem(controls.dockingSystem);
        this.systemActions.setTargetingSystem(controls.targetingSystem);
        
        // Log system connections
        const systemStatus = {
            hasMiningSystem: !!controls.miningSystem,
            hasTargetingSystem: !!controls.targetingSystem,
            hasDockingSystem: !!controls.dockingSystem,
            hasWeaponSystem: !!controls.weaponSystem
        };
        
        console.log("TouchControls: Systems connected", systemStatus);
        
        // Store reference to spaceship from controls if not already set
        if (!this.spaceship && controls.spaceship) {
            this.spaceship = controls.spaceship;
            console.log("TouchControls: Spaceship reference set from controls");
        }
        
        return this; // For method chaining
    }
    
    createCrosshair() {
        // Create a small crosshair in the center of the screen
        const crosshair = document.createElement('div');
        crosshair.id = 'mobile-crosshair';
        crosshair.style.position = 'absolute';
        crosshair.style.top = '50%';
        crosshair.style.left = '50%';
        crosshair.style.transform = 'translate(-50%, -50%)';
        crosshair.style.width = '10px';
        crosshair.style.height = '10px';
        crosshair.style.pointerEvents = 'none';
        crosshair.style.zIndex = '999';
        
        // Create crosshair shape with a plus sign
        crosshair.innerHTML = `
            <div style="position: absolute; top: 50%; left: 0; width: 100%; height: 1px; background-color: rgba(120, 220, 232, 0.8);"></div>
            <div style="position: absolute; top: 0; left: 50%; width: 1px; height: 100%; background-color: rgba(120, 220, 232, 0.8);"></div>
            <div style="position: absolute; top: 50%; left: 50%; width: 3px; height: 3px; background-color: rgba(120, 220, 232, 0.8); border-radius: 50%; transform: translate(-50%, -50%);"></div>
        `;
        
        document.body.appendChild(crosshair);
    }
    
    setupTouchControls() {
        // Create UI zones and buttons
        const zones = this.joystickZones.createJoystickZones();
        const buttons = this.actionButtons.createActionButtons();
        
        // Initialize joysticks after a short delay to ensure DOM is ready
        setTimeout(() => {
            const success = this.joystickHandler.initializeJoysticks(zones.leftZone, zones.rightZone);
            if (success) {
                this.setupButtonEvents(buttons);
                this.isInitialized = true;
            }
        }, 100);
    }
    
    setupButtonEvents(buttons) {
        // Setup fire button events
        this.actionButtons.addButtonEvents(
            buttons.fire,
            () => this.weaponHandler.handleFiringStart(),
            () => this.weaponHandler.handleFiringEnd()
        );
        
        // Setup mine button events
        this.actionButtons.addButtonEvents(
            buttons.mine,
            () => this.miningHandler.handleMiningStart(),
            () => this.miningHandler.handleMiningEnd()
        );
        
        // Setup target button events
        this.actionButtons.addButtonEvents(
            buttons.target,
            () => this.systemActions.handleTargeting()
        );
        
        // Setup dock button events
        this.actionButtons.addButtonEvents(
            buttons.dock,
            () => {
                this.systemActions.handleDocking();
                this.actionButtons.hideDockButton();
            }
        );
        
        // Setup deploy laser button events
        this.actionButtons.addButtonEvents(
            buttons.deployLaser,
            () => this.systemActions.handleDeployLaser()
        );
    }
    
    hide() {
        this.joystickZones.hideZones();
        this.actionButtons.hideButtons();
        this.gestureDetector.disable();
    }
    
    show() {
        // Only show controls when not docked and not in intro sequence
        if ((this.spaceship && this.spaceship.isDocked) || 
            (window.game && window.game.introSequenceActive)) {
            console.log("TouchControls: Not showing controls during docked state or intro sequence");
            return;
        }
        
        this.joystickZones.showZones();
        this.actionButtons.showButtons();
        this.gestureDetector.enable();
    }
    
    update() {
        // Update dock button visibility based on proximity to stargate
        if (this.systemActions.shouldShowDock(this.spaceship)) {
            this.actionButtons.showDockButton();
        } else {
            this.actionButtons.hideDockButton();
        }
    }
    
    // Compatibility methods for existing API
    showDockButton() {
        this.actionButtons.showDockButton();
    }
    
    hideDockButton() {
        this.actionButtons.hideDockButton();
    }
}