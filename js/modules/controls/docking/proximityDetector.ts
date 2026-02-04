// proximityDetector.js - Handles stargate proximity detection

type ProximitySpaceship = {
    isDocked: boolean;
    mesh?: {
        position: {
            distanceTo: (pos: unknown) => number;
        };
    };
};

type ProximityStargate = {
    getPosition: () => unknown;
};

type ProximityUI = {
    stargateInterface?: {
        showDockingPrompt?: () => void;
        hideDockingPrompt?: () => void;
    };
    controls?: {
        isMobile?: boolean;
        touchControls?: {
            showDockButton?: () => void;
            hideDockButton?: () => void;
        };
    };
};

export class ProximityDetector {
    nearStargate: boolean;

    constructor() {
        this.nearStargate = false;
    }

    // Check if spaceship is within docking range of stargate
    checkStargateProximity(spaceship: ProximitySpaceship, stargate: ProximityStargate, ui: ProximityUI): void {
        if (spaceship.isDocked) return;
        
        if (!stargate || !spaceship || !spaceship.mesh) return;
        
        const stargatePosition = stargate.getPosition();
        if (!stargatePosition) return;
        
        const distance = spaceship.mesh.position.distanceTo(stargatePosition);
        
        if (distance < 2000) { // Within docking range (4x the original 500)
            this.nearStargate = true;
            if (ui && ui.stargateInterface) {
                ui.stargateInterface.showDockingPrompt();
            }
            // Also show the dock button in touch controls for mobile
            if (ui && ui.controls && ui.controls.isMobile && 
                ui.controls.touchControls) {
                ui.controls.touchControls.showDockButton();
            }
        } else {
            this.nearStargate = false;
            if (ui && ui.stargateInterface) {
                ui.stargateInterface.hideDockingPrompt();
            }
            // Also hide the dock button in touch controls for mobile
            if (ui && ui.controls && ui.controls.isMobile && 
                ui.controls.touchControls) {
                ui.controls.touchControls.hideDockButton();
            }
        }
    }

    isNearStargate() {
        return this.nearStargate;
    }
}
