// touchControls.js - Touch controls for mobile devices using nipple.js
// This is a compatibility wrapper for the refactored touch controls

import { TouchControls as RefactoredTouchControls } from './touch/touchControls.js';

export class TouchControls extends RefactoredTouchControls {
    constructor(spaceship, physics) {
        super(spaceship, physics);
        
        // Maintain compatibility properties for legacy code
        this.leftJoystick = null;
        this.rightJoystick = null;
        this.dockButton = null;
        this.mineButton = null;
        this.fireButton = null;
        this.targetButton = null;
        this.threshold = 0.1;
        
        // Store references to systems we need to interact with
        this.miningSystem = null;
        this.targetingSystem = null;
        this.dockingSystem = null;
        this.weaponSystem = null;
    }
    
    // Override setControlSystems to maintain compatibility and store legacy references
    setControlSystems(controls) {
        // Call parent implementation
        const result = super.setControlSystems(controls);
        
        // Store legacy references for backward compatibility
        this.miningSystem = controls.miningSystem;
        this.targetingSystem = controls.targetingSystem;
        this.dockingSystem = controls.dockingSystem;
        this.weaponSystem = controls.weaponSystem;
        
        return result;
    }
} 