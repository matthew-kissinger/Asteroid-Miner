// starDreadnought.ts - Main class for the massive Star Dreadnought ship
// Refactored to delegate to specialized modules

import * as THREE from 'three';
import { DreadnoughtHull } from './structure/hull.ts';
import { DreadnoughtBridge } from './structure/bridge.ts';
import { DreadnoughtEngines } from './systems/engines.ts';
import { DreadnoughtWeapons } from './systems/weapons.ts';
import { TeleportBeam } from './teleporter/beam.ts';
import { TeleportParticles } from './teleporter/particles.ts';
import { TeleportController } from './teleporter/controller.ts';

export class StarDreadnought {
    scene: THREE.Scene;
    ship: THREE.Group | null;
    engines: DreadnoughtEngines;
    teleportController: TeleportController;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.ship = null;

        // Initialize component systems
        this.engines = new DreadnoughtEngines();
        this.teleportController = new TeleportController();

        // Create ship model
        this.createShipModel();

        // Add to scene
        this.scene.add(this.ship!);

        console.log("Star Dreadnought created");
    }

    createShipModel(): void {
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

    createStructure(scale: number): void {
        // Main hull - elongated wedge shape
        DreadnoughtHull.createMainHull(scale, this.ship!);

        // Command bridge superstructure
        DreadnoughtBridge.createCommandBridge(scale, this.ship!);
    }

    createSystems(scale: number): void {
        // Engine array with particles and power control
        this.engines.createEngineArray(scale, this.ship!);

        // Surface details: turrets, trenches, shield generators
        DreadnoughtWeapons.createSurfaceDetails(scale, this.ship!);
    }

    createTeleporter(scale: number): void {
        // Create teleport beam and impact ring
        const teleportBeam = TeleportBeam.createTeleportBeam(scale, this.ship!);
        const impactRing = TeleportBeam.createBeamImpactRing(scale, this.ship!);

        // Create teleport particles
        const teleportParticles = TeleportParticles.createTeleportParticles(scale, this.ship!);

        // Set up teleport controller with components
        this.teleportController.setComponents(teleportBeam, teleportParticles, impactRing);
    }

    // Set engines power level (0-1)
    setEnginesPower(power: number): void {
        this.engines.setEnginesPower(power);
    }

    // Activate teleport beam
    activateTeleportBeam(): void {
        this.teleportController.activateTeleportBeam();
    }

    // Deactivate teleport beam
    deactivateTeleportBeam(): void {
        this.teleportController.deactivateTeleportBeam();
    }

    // Update teleport beam effect
    updateTeleportBeam(progress?: number): void {
        this.teleportController.updateTeleportBeam(progress);
        this.engines.updateEngineTrails();
    }

    // Check if teleport beam is active
    get teleportBeamActive(): boolean {
        return this.teleportController.isBeamActive();
    }

    // Get ship group for external access
    getShip(): THREE.Group | null {
        return this.ship;
    }

    // Get engine glows for external effects
    getEngineGlows(): THREE.Mesh[] {
        return this.engines.engineGlows;
    }

    // Update method for any ongoing animations
    update(_deltaTime: number): void {
        // Update engine trail animations
        this.engines.updateEngineTrails();

        // Update teleport beam if active
        if (this.teleportController.isBeamActive()) {
            this.teleportController.updateTeleportBeam();
        }
    }

    // Cleanup method
    dispose(): void {
        if (this.ship) {
            this.scene.remove(this.ship);

            // Traverse and dispose of geometries and materials
            this.ship.traverse((child: THREE.Object3D) => {
                const mesh = child as THREE.Mesh;
                if (mesh.geometry) {
                    mesh.geometry.dispose();
                }
                if (mesh.material) {
                    if (Array.isArray(mesh.material)) {
                        mesh.material.forEach((material: THREE.Material) => material.dispose());
                    } else {
                        mesh.material.dispose();
                    }
                }
            });

            this.ship = null;
        }
    }
}