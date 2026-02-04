// visualEffects.ts - Ship visual effects (mining laser, trails)
// Extracted from spaceship.js to improve maintainability

import * as THREE from 'three';
import { TrailEffects } from '../../trail';

// Accept any object with optional leftEmitter and rightEmitter
interface VisualEffectsComponents {
  leftEmitter?: THREE.Mesh | null;
  rightEmitter?: THREE.Mesh | null;
  [key: string]: any;
}

interface ThrustState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  boost: boolean;
}

export class ShipVisualEffects {
  components: VisualEffectsComponents;

  constructor(shipComponents: VisualEffectsComponents) {
    this.components = shipComponents; // { leftEmitter, rightEmitter }
  }

  /**
   * Activate mining laser visual effects
   */
  activateMiningLaser(): void {
    // Activate both emitters for a more powerful effect
    if (this.components.leftEmitter && this.components.rightEmitter) {
      // Left emitter
      const leftMaterial = this.components.leftEmitter.material as THREE.MeshPhongMaterial;
      if (leftMaterial) {
        leftMaterial.emissiveIntensity = 1.5;
      }
      this.components.leftEmitter.scale.set(1.2, 1.2, 1.2);

      // Right emitter
      const rightMaterial = this.components.rightEmitter.material as THREE.MeshPhongMaterial;
      if (rightMaterial) {
        rightMaterial.emissiveIntensity = 1.5;
      }
      this.components.rightEmitter.scale.set(1.2, 1.2, 1.2);
    }
  }

  /**
   * Deactivate mining laser visual effects
   */
  deactivateMiningLaser(): void {
    // Deactivate both emitters
    if (this.components.leftEmitter && this.components.rightEmitter) {
      // Left emitter
      const leftMaterial = this.components.leftEmitter.material as THREE.MeshPhongMaterial;
      if (leftMaterial) {
        leftMaterial.emissiveIntensity = 1;
      }
      this.components.leftEmitter.scale.set(1, 1, 1);

      // Right emitter
      const rightMaterial = this.components.rightEmitter.material as THREE.MeshPhongMaterial;
      if (rightMaterial) {
        rightMaterial.emissiveIntensity = 1;
      }
      this.components.rightEmitter.scale.set(1, 1, 1);
    }
  }

  /**
   * Update trail visibility based on movement
   * @param {boolean} isMoving Whether the ship is currently moving
   * @param {object} thrustState Current thrust state
   * @param {THREE.Vector3} velocity Current velocity
   * @param {object} trailEffects Trail effects instance
   */
  updateTrailVisibility(isMoving: boolean, thrustState: ThrustState, velocity: THREE.Vector3, trailEffects: TrailEffects | null): void {
    // Delegate to trail effects module
    if (trailEffects) {
      trailEffects.updateTrailVisibility(isMoving, thrustState, velocity);
    }
  }

  /**
   * Update particle effects
   * @param {object} thrustState Current thrust state
   * @param {THREE.Vector3} velocity Current velocity
   * @param {object} trailEffects Trail effects instance
   */
  updateParticles(thrustState: ThrustState, velocity: THREE.Vector3, trailEffects: TrailEffects | null): void {
    // Delegate to trail effects module
    if (trailEffects) {
      trailEffects.updateParticles(thrustState, velocity);
    }
  }
}
