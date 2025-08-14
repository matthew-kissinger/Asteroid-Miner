// starDreadnought.js - Main class for the massive Star Dreadnought ship
// Refactored to delegate to specialized modules

import * as THREE from 'three';
import { DreadnoughtHull } from './structure/hull.js';
import { DreadnoughtBridge } from './structure/bridge.js';
import { DreadnoughtEngines } from './systems/engines.js';
import { DreadnoughtWeapons } from './systems/weapons.js';
import { TeleportBeam } from './teleporter/beam.js';
import { TeleportParticles } from './teleporter/particles.js';
import { TeleportController } from './teleporter/controller.js';

export class StarDreadnought {
    constructor(scene) {
        this.scene = scene;
        this.ship = null;
        
        // Initialize component systems
        this.engines = new DreadnoughtEngines();
        this.teleportController = new TeleportController();
        
        // Create ship model
        this.createShipModel();
        
        // Add to scene
        this.scene.add(this.ship);
        
        console.log("Star Dreadnought created");
    }
    
    createShipModel() {
        // Create a group for the entire ship
        this.ship = new THREE.Group();
        this.ship.name = 'starDreadnought';
        
        // Set scale - this is a massive ship
        const shipScale = 1200; // Overall scale factor
        
        // Delegate construction to specialized modules
        this.createStructure(shipScale);
        this.createSystems(shipScale);
        this.createTeleporter(shipScale);
    }
    
    createStructure(scale) {
        // Main hull - elongated wedge shape
        DreadnoughtHull.createMainHull(scale, this.ship);
        
        // Command bridge superstructure
        DreadnoughtBridge.createCommandBridge(scale, this.ship);
    }
    
    createSystems(scale) {
        // Engine array with particles and power control
        this.engines.createEngineArray(scale, this.ship);
        
        // Surface details: turrets, trenches, shield generators
        DreadnoughtWeapons.createSurfaceDetails(scale, this.ship);
    }
    
    createTeleporter(scale) {
        // Create teleport beam and impact ring
        const teleportBeam = TeleportBeam.createTeleportBeam(scale, this.ship);
        const impactRing = TeleportBeam.createBeamImpactRing(scale, this.ship);
        
        // Create teleport particles
        const teleportParticles = TeleportParticles.createTeleportParticles(scale, this.ship);
        
        // Set up teleport controller with components
        this.teleportController.setComponents(teleportBeam, teleportParticles, impactRing);
    }
    
    // Set engines power level (0-1)
    setEnginesPower(power) {
        this.engines.setEnginesPower(power);
    }
    
    // Activate teleport beam
    activateTeleportBeam() {
        this.teleportController.activateTeleportBeam();
    }
    
    // Deactivate teleport beam
    deactivateTeleportBeam() {
        this.teleportController.deactivateTeleportBeam();
    }
    
    // Update teleport beam effect
    updateTeleportBeam(progress) {
        this.teleportController.updateTeleportBeam(progress);
        this.engines.updateEngineTrails();
    }
    
    // Check if teleport beam is active
    get teleportBeamActive() {
        return this.teleportController.isBeamActive();
    }
    
    // Get ship group for external access
    getShip() {
        return this.ship;
    }
    
    // Get engine glows for external effects
    getEngineGlows() {
        return this.engines.engineGlows;
    }
    
    // Update method for any ongoing animations
    update(deltaTime) {
        // Update engine trail animations
        this.engines.updateEngineTrails();
        
        // Update teleport beam if active
        if (this.teleportController.isBeamActive()) {
            this.teleportController.updateTeleportBeam();
        }
    }
    
    // Cleanup method
    dispose() {
        if (this.ship) {
            this.scene.remove(this.ship);
            
            // Traverse and dispose of geometries and materials
            this.ship.traverse((child) => {
                if (child.geometry) {
                    child.geometry.dispose();
                }
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => material.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
            
            this.ship = null;
        }
    }
}