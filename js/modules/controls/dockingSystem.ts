// dockingSystem.js - Handles stargate docking and trading

import { ProximityDetector } from './docking/proximityDetector.ts';
import { DockingLogic } from './docking/dockingLogic.ts';
import { UIIntegration } from './docking/uiIntegration.ts';

type DockingSpaceship = {
    isDocked: boolean;
    undockLocation?: {
        set: (x: number, y: number, z: number) => void;
    };
    world?: {
        messageBus?: {
            publish: (event: string, data?: unknown) => void;
        };
    };
    mesh?: {
        position: {
            clone: () => unknown;
        };
    };
};

type DockingUI = {
    stargateInterface?: {
        showStargateUI?: () => void;
        updateStargateUI?: (spaceship: DockingSpaceship, resources: unknown) => void;
        hideStargateUI?: () => void;
        showDockingPrompt?: () => void;
        hideDockingPrompt?: () => void;
    };
    hideUI?: () => void;
    showUI?: () => void;
    controls?: {
        isMobile?: boolean;
        touchControls?: {
            showDockButton?: () => void;
            hideDockButton?: () => void;
        };
        miningSystem?: unknown;
    };
    stargate?: unknown;
};

export class DockingSystem {
    spaceship: DockingSpaceship;
    stargate: unknown;
    ui: DockingUI;
    proximityDetector: ProximityDetector;
    dockingLogic: DockingLogic;
    uiIntegration: UIIntegration;
    isDocked: boolean;
    nearStargate?: boolean;
    resources?: unknown;

    constructor(spaceship: DockingSpaceship, stargate: unknown, ui: DockingUI) {
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
    
    setupDockingControls(): void {
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
    
    setupStargateUIControls(): void {
        // Delegate to UI integration module
        this.uiIntegration.setupStargateUIControls(this.spaceship, this.ui);
    }
    
    setupUndockButton(): void {
        const undockBtn = document.getElementById('undock-btn');
        if (undockBtn) {
            // Use both click and touchend events for better Android compatibility
            const handleUndock = (e: Event) => {
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
    
    dockWithStargate(): void {
        this.dockingLogic.dockWithStargate(this.spaceship, this.stargate, this.ui);
        this.isDocked = true;
        
        // Update the stargate UI with current values
        this.updateStargateUI();
    }
    
    async undockFromStargate(): Promise<void> {
        await this.dockingLogic.undockFromStargate(
            this.spaceship, 
            this.ui,
            () => this.uiIntegration.closeAllModals(),
            () => this.uiIntegration.hideStargateUI(this.ui),
            () => this.uiIntegration.showGameUI(this.ui)
        );
        this.isDocked = false;
    }
    
    updateStargateUI(): void {
        this.uiIntegration.updateStargateUI(this.spaceship, this.ui);
    }
    
    checkStargateProximity(): void {
        this.proximityDetector.checkStargateProximity(this.spaceship, this.stargate, this.ui);
        this.nearStargate = this.proximityDetector.isNearStargate();
    }
    
    update(): void {
        // Check if near stargate for docking
        this.checkStargateProximity();
    }
    
    // Setter for resources to allow dependency injection
    setResources(resources: unknown): void {
        this.resources = resources;
        this.uiIntegration.setResources(resources);
    }
}
