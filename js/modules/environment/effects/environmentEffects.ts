import * as THREE from 'three';
import { DustParticles } from './dustParticles.ts';
import { NebulaGlow } from './nebulaGlow.ts';
import { StarfieldEnhancement } from './starfieldEnhancement.ts';
import { debugLog } from '../../../globals/debug.ts';

/**
 * Orchestrator for environmental visual effects.
 * Manages dust particles, nebula glow, and starfield enhancements.
 */
export class EnvironmentEffects {
    private scene: THREE.Scene;
    private dustParticles: DustParticles | null = null;
    private nebulaGlow: NebulaGlow | null = null;
    private starfieldEnhancement: StarfieldEnhancement | null = null;
    private totalTime: number = 0;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        
        // Always present effects
        this.starfieldEnhancement = new StarfieldEnhancement(this.scene);
        this.nebulaGlow = new NebulaGlow(this.scene);
        
        debugLog("Environment effects manager initialized");
    }

    /**
     * Update all active environmental effects
     * @param deltaTime Time since last frame
     * @param playerPos Current player/camera position for particle recycling
     * @param hasAsteroidBelt Whether the current area has an asteroid belt (to enable dust)
     */
    update(deltaTime: number, playerPos: THREE.Vector3, hasAsteroidBelt: boolean): void {
        this.totalTime += deltaTime;

        // Dynamic dust particles: Only create/update when in asteroid-rich areas
        if (hasAsteroidBelt) {
            if (!this.dustParticles) {
                this.dustParticles = new DustParticles(this.scene);
            }
            this.dustParticles.update(deltaTime, playerPos);
        } else if (this.dustParticles) {
            // Clean up dust when leaving asteroid-rich areas to save performance
            this.dustParticles.dispose();
            this.dustParticles = null;
            debugLog("Dust particles disabled (no asteroid belt)");
        }

        // Update always-on effects
        if (this.nebulaGlow) {
            this.nebulaGlow.update(this.totalTime);
        }

        if (this.starfieldEnhancement) {
            this.starfieldEnhancement.update(this.totalTime);
        }
    }

    /**
     * Clean up all environmental effects
     */
    dispose(): void {
        if (this.dustParticles) {
            this.dustParticles.dispose();
            this.dustParticles = null;
        }
        if (this.nebulaGlow) {
            this.nebulaGlow.dispose();
            this.nebulaGlow = null;
        }
        if (this.starfieldEnhancement) {
            this.starfieldEnhancement.dispose();
            this.starfieldEnhancement = null;
        }
        debugLog("Environment effects manager disposed");
    }
}
