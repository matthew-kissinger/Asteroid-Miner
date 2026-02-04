// systemActions.js - System action handlers (docking, targeting, deployment) for touch controls

type DockingSystem = {
    dockWithStargate: () => void;
    nearStargate?: boolean;
};

type TargetingSystem = {
    toggleLockOn: () => void;
};

type GameWindow = Window & {
    mainMessageBus?: {
        publish: (event: string, data?: unknown) => void;
    };
    game?: {
        controls?: {
            dockingSystem?: DockingSystem;
        };
    };
    gameInstance?: {
        controls?: {
            dockingSystem?: DockingSystem;
        };
    };
};

export class SystemActions {
    dockingSystem: DockingSystem | null;
    targetingSystem: TargetingSystem | null;

    constructor() {
        this.dockingSystem = null;
        this.targetingSystem = null;
    }

    setDockingSystem(dockingSystem: DockingSystem | null): void {
        this.dockingSystem = dockingSystem;
    }

    setTargetingSystem(targetingSystem: TargetingSystem | null): void {
        this.targetingSystem = targetingSystem;
    }

    handleDocking(): void {
        if (!this.dockingSystem) {
            console.error("SystemActions: Docking system not available");
            return;
        }
        
        console.log("SystemActions: Dock button pressed, attempting to dock with stargate");
        
        // Call docking method
        this.dockingSystem.dockWithStargate();
    }

    handleTargeting(): void {
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
    handleDeployLaser(): void {
        console.log("SystemActions: Deploying laser turret");
        
        // Publish deploy laser event
        const windowWithGame = window as GameWindow;
        if (windowWithGame.mainMessageBus) {
            windowWithGame.mainMessageBus.publish('input.deployLaser', {});
        }
    }

    // Helper method to check if dock should be visible
    shouldShowDock(spaceship: { isDocked?: boolean } | null): boolean {
        if (!this.dockingSystem || !spaceship) {
            // Fallback to window.game if the direct reference isn't set yet
            const windowWithGame = window as GameWindow;
            const game = windowWithGame.gameInstance || windowWithGame.game;
            if (game && game.controls && game.controls.dockingSystem && spaceship) {
                const dockingSystem = game.controls.dockingSystem;
                return dockingSystem.nearStargate && !spaceship.isDocked;
            }
            return false;
        }
        
        return this.dockingSystem.nearStargate && !spaceship.isDocked;
    }
}
