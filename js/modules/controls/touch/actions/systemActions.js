// systemActions.js - System action handlers (docking, targeting, deployment) for touch controls

export class SystemActions {
    constructor() {
        this.dockingSystem = null;
        this.targetingSystem = null;
    }

    setDockingSystem(dockingSystem) {
        this.dockingSystem = dockingSystem;
    }

    setTargetingSystem(targetingSystem) {
        this.targetingSystem = targetingSystem;
    }

    handleDocking() {
        if (!this.dockingSystem) {
            console.error("SystemActions: Docking system not available");
            return;
        }
        
        console.log("SystemActions: Dock button pressed, attempting to dock with stargate");
        
        // Call docking method
        this.dockingSystem.dockWithStargate();
    }

    handleTargeting() {
        if (!this.targetingSystem) {
            console.error("SystemActions: Targeting system not available");
            return;
        }
        
        // Toggle targeting system
        this.targetingSystem.toggleLockOn();
    }

    /**
     * Handle deploying a laser turret
     */
    handleDeployLaser() {
        console.log("SystemActions: Deploying laser turret");
        
        // Publish deploy laser event
        if (window.mainMessageBus) {
            window.mainMessageBus.publish('input.deployLaser', {});
        }
    }

    // Helper method to check if dock should be visible
    shouldShowDock(spaceship) {
        if (!this.dockingSystem || !spaceship) {
            // Fallback to window.game if the direct reference isn't set yet
            const game = window.gameInstance || window.game;
            if (game && game.controls && game.controls.dockingSystem && spaceship) {
                const dockingSystem = game.controls.dockingSystem;
                return dockingSystem.nearStargate && !spaceship.isDocked;
            }
            return false;
        }
        
        return this.dockingSystem.nearStargate && !spaceship.isDocked;
    }
}