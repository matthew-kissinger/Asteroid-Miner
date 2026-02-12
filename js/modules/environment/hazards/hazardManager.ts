// hazardManager.ts - Manages all environmental hazards in the current star system

import { Vector3, Scene } from 'three';
import { AsteroidStorm } from './asteroidStorm.ts';
import { RadiationZone } from './radiationZone.ts';
import { debugLog } from '../../../globals/debug.ts';

interface SpaceAnomaliesLike {
    createEnergyOrb: (rarity: string) => { mesh: import('three').Mesh; rarity: string; value: number; size: number; color: import('three').Color; pulsePhase: number; pulseSpeed: number; glow: import('three').Mesh };
    getRandomOrbRarity: () => string;
}

export class HazardManager {
    scene: Scene;
    asteroidStorms: AsteroidStorm[];
    radiationZones: RadiationZone[];
    spaceAnomalies: SpaceAnomaliesLike | null;

    constructor(scene: Scene) {
        this.scene = scene;
        this.asteroidStorms = [];
        this.radiationZones = [];
        this.spaceAnomalies = null;
    }

    setSpaceAnomalies(spaceAnomalies: SpaceAnomaliesLike | null): void {
        this.spaceAnomalies = spaceAnomalies;
    }

    /** Generate 1-2 hazard zones for a star system at random positions */
    generateHazards(): void {
        this.clearAll();

        const hazardCount = 1 + Math.floor(Math.random() * 2); // 1-2 hazards
        debugLog(`Generating ${hazardCount} environmental hazards`);

        for (let i = 0; i < hazardCount; i++) {
            const position = this._getRandomHazardPosition();
            const isStorm = Math.random() < 0.5;

            if (isStorm) {
                const radius = 500 + Math.random() * 300;
                const storm = new AsteroidStorm(this.scene, position, radius);
                this.asteroidStorms.push(storm);
                debugLog(`Spawned asteroid storm hazard at ${position.x.toFixed(0)}, ${position.y.toFixed(0)}, ${position.z.toFixed(0)}`);
            } else {
                const radius = 300 + Math.random() * 300;
                const zone = new RadiationZone(this.scene, position, radius, this.spaceAnomalies ?? undefined);
                this.radiationZones.push(zone);
                debugLog(`Spawned radiation zone hazard at ${position.x.toFixed(0)}, ${position.y.toFixed(0)}, ${position.z.toFixed(0)}`);
            }
        }
    }

    private _getRandomHazardPosition(): Vector3 {
        // Place hazards in the region between inner space and asteroid belt
        const minRadius = 10000;
        const maxRadius = 18000;
        const angle = Math.random() * Math.PI * 2;
        const radius = minRadius + Math.random() * (maxRadius - minRadius);
        const height = (Math.random() - 0.5) * 2000;

        return new Vector3(
            Math.cos(angle) * radius,
            height,
            Math.sin(angle) * radius,
        );
    }

    update(deltaTime: number): void {
        for (let i = 0; i < this.asteroidStorms.length; i++) {
            this.asteroidStorms[i].update(deltaTime);
        }
        for (let i = 0; i < this.radiationZones.length; i++) {
            this.radiationZones[i].update(deltaTime);
        }
    }

    /** Check if any radiation zone is suppressing shield regen */
    isShieldRegenSuppressed(): boolean {
        for (let i = 0; i < this.radiationZones.length; i++) {
            if (this.radiationZones[i].isPlayerInside()) {
                return true;
            }
        }
        return false;
    }

    /** Called when travelling to a new system */
    updateForSystem(_systemData: unknown): void {
        debugLog('Updating hazards for new star system');
        this.generateHazards();
    }

    clearAll(): void {
        for (const storm of this.asteroidStorms) {
            storm.dispose();
        }
        this.asteroidStorms = [];

        for (const zone of this.radiationZones) {
            zone.dispose();
        }
        this.radiationZones = [];

        debugLog('All environmental hazards cleared');
    }

    dispose(): void {
        this.clearAll();
    }
}
