// dockingSystem.js - Handles stargate docking and trading

import { ProximityDetector } from './docking/proximityDetector.js';
import { DockingLogic } from './docking/dockingLogic.js';
import { UIIntegration } from './docking/uiIntegration.js';

export class DockingSystem {
    constructor(spaceship, stargate, ui) {
        this.spaceship = spaceship;
        this.stargate = stargate;
        this.ui = ui;
        
        // Initialize component modules
        this.proximityDetector = new ProximityDetector();
        this.dockingLogic = new DockingLogic();
        this.uiIntegration = new UIIntegration();
        
        this.isDocked = this.spaceship.isDocked; // Initialize with spaceship's docked state
        
        // Preemptively set a safe undocking position
        if (this.spaceship && this.spaceship.undockLocation && this.stargate) {
            // Position in the middle of the stargate
            this.spaceship.undockLocation.set(0, 10000, 0);
        }
        
        console.log("Initializing docking system, ship is " + (this.isDocked ? "docked" : "undocked"));
        this.setupDockingControls();
        
        // If we're starting docked, publish the player.docked event immediately
        if (this.isDocked && this.spaceship.world && this.spaceship.world.messageBus) {
            this.spaceship.world.messageBus.publish('player.docked', {
                playerPosition: this.spaceship.mesh ? this.spaceship.mesh.position.clone() : null,
                stargate: this.stargate
            });
            console.log("Published initial player.docked event");
        }
    }
    
    setupDockingControls() {
        // Delegate to UI integration module
        this.uiIntegration.setupDockingControls(
            this.proximityDetector, 
            this.dockingLogic, 
            this.spaceship, 
            this.ui
        );
        
        // Set up undock button handler specifically
        this.setupUndockButton();
    }
    
    setupStargateUIControls() {
        // Delegate to UI integration module
        this.uiIntegration.setupStargateUIControls(this.spaceship, this.ui);
    }
    
    setupUndockButton() {
        const undockBtn = document.getElementById('undock-btn');
        if (undockBtn) {
            // Use both click and touchend events for better Android compatibility
            const handleUndock = (e) => {
                // Prevent any default action that might interfere
                e.preventDefault();
                e.stopPropagation();
                
                // Log which event triggered the undock
                console.log(`Undock button ${e.type} event triggered`);

                // Add a small delay to ensure the event completes on Android
                if (this.dockingLogic.isMobileDevice()) {
                    // For Android, remove the overlay classes immediately
                    document.body.classList.remove('undocking', 'modal-open');
                    // Set a brief timeout to allow touch event to complete
                    setTimeout(() => {
                        this.undockFromStargate();
                    }, 50);
                } else {
                    this.undockFromStargate();
                }
            };
            
            // Add both event listeners for better compatibility
            undockBtn.addEventListener('click', handleUndock);
            undockBtn.addEventListener('touchend', handleUndock);
        }
    }
    
    dockWithStargate() {
        this.dockingLogic.dockWithStargate(this.spaceship, this.stargate, this.ui);
        this.isDocked = true;
        
        // Update the stargate UI with current values
        this.updateStargateUI();
    }
    
    async undockFromStargate() {
        await this.dockingLogic.undockFromStargate(
            this.spaceship, 
            this.ui,
            () => this.uiIntegration.closeAllModals(),
            () => this.uiIntegration.hideStargateUI(this.ui),
            () => this.uiIntegration.showGameUI(this.ui)
        );
        this.isDocked = false;
    }
    
    updateStargateUI() {
        this.uiIntegration.updateStargateUI(this.spaceship, this.ui);
    }
    
    checkStargateProximity() {
        this.proximityDetector.checkStargateProximity(this.spaceship, this.stargate, this.ui);
        this.nearStargate = this.proximityDetector.isNearStargate();
    }
    
    update() {
        // Check if near stargate for docking
        this.checkStargateProximity();
    }
    
    // Setter for resources to allow dependency injection
    setResources(resources) {
        this.resources = resources;
        this.uiIntegration.setResources(resources);
    }
}