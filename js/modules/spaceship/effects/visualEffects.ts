// visualEffects.ts - Ship visual effects (mining laser, trails, shield recharge)
// Extracted from spaceship.js to improve maintainability

import * as THREE from 'three';
import { TrailEffects } from '../../trail';

// Accept any object with optional leftEmitter and rightEmitter
interface VisualEffectsComponents {
  leftEmitter?: THREE.Mesh | null;
  rightEmitter?: THREE.Mesh | null;
  [key: string]: unknown;
}

interface ThrustState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  boost: boolean;
}

interface ShieldEffectState {
  mesh: THREE.Mesh;
  material: THREE.MeshBasicMaterial;
  startTime: number;
  duration: number;
}

export class ShipVisualEffects {
  components: VisualEffectsComponents;
  private activeShieldEffect: ShieldEffectState | null = null;
  private scene: THREE.Scene | null = null;

  constructor(shipComponents: VisualEffectsComponents) {
    this.components = shipComponents; // { leftEmitter, rightEmitter }
  }

  /**
   * Set the scene reference for adding/removing visual effects
   * @param scene The Three.js scene
   */
  setScene(scene: THREE.Scene): void {
    this.scene = scene;
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
   * @param thrustState Current thrust state
   * @param velocity Current velocity
   * @param trailEffects Trail effects instance
   */
  updateParticles(thrustState: ThrustState, velocity: { x: number; y: number; z: number }, trailEffects: TrailEffects | null): void {
    // Delegate to trail effects module
    if (trailEffects) {
      trailEffects.updateParticles(thrustState, velocity);
    }
  }

  /**
   * Trigger shield recharge visual effect
   * Shows a pulsing cyan sphere around the ship that fades over 1.5 seconds
   * @param shipMesh The ship mesh to attach the effect to
   */
  showShieldRechargeEffect(shipMesh: THREE.Object3D): void {
    if (!this.scene) {
      console.warn('Cannot show shield effect: scene not set');
      return;
    }

    // Clean up any existing effect
    this.cleanupShieldEffect();

    // Create shield effect sphere
    const geometry = new THREE.SphereGeometry(8, 32, 32); // Slightly larger than ship
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0x00ffff), // Cyan
      transparent: true,
      opacity: 0.6,
      wireframe: false
    });

    const shieldMesh = new THREE.Mesh(geometry, material);
    shieldMesh.position.copy(shipMesh.position);

    this.scene.add(shieldMesh);

    this.activeShieldEffect = {
      mesh: shieldMesh,
      material: material,
      startTime: Date.now(),
      duration: 1500 // 1.5 seconds
    };
  }

  /**
   * Update shield recharge effect animation
   * Should be called in the game update loop
   */
  updateShieldEffect(shipPosition: { x: number; y: number; z: number }): void {
    if (!this.activeShieldEffect) return;

    const elapsed = Date.now() - this.activeShieldEffect.startTime;
    const progress = elapsed / this.activeShieldEffect.duration;

    if (progress >= 1.0) {
      // Effect complete, clean up
      this.cleanupShieldEffect();
      return;
    }

    // Update position to follow ship
    this.activeShieldEffect.mesh.position.set(shipPosition.x, shipPosition.y, shipPosition.z);

    // Pulse effect: 3 pulses over the duration
    const pulsePhase = (progress * Math.PI * 6); // 3 full cycles
    const pulse = Math.sin(pulsePhase) * 0.5 + 0.5; // 0 to 1

    // Fade out over time
    const fadeOut = 1.0 - progress;

    // Combine pulse and fadeout
    this.activeShieldEffect.material.opacity = pulse * fadeOut * 0.6;

    // Scale up slightly during animation
    const scale = 1.0 + (progress * 0.2); // Grow 20%
    this.activeShieldEffect.mesh.scale.set(scale, scale, scale);
  }

  /**
   * Clean up the active shield effect
   */
  private cleanupShieldEffect(): void {
    if (!this.activeShieldEffect) return;

    if (this.scene) {
      this.scene.remove(this.activeShieldEffect.mesh);
    }

    this.activeShieldEffect.mesh.geometry.dispose();
    this.activeShieldEffect.material.dispose();
    this.activeShieldEffect = null;
  }
}
