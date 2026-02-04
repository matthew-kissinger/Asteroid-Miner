import * as THREE from 'three';

export class ExplosionEffects {
  constructor();
  createExplosionEffect(
    position: THREE.Vector3,
    duration?: number,
    isVisible?: boolean,
    poolManager?: any,
    addToScene?: ((obj: THREE.Object3D) => void) | null
  ): any;
  createInstantTracer(
    startPos: THREE.Vector3,
    endPos: THREE.Vector3,
    isHit?: boolean,
    fadeTime?: number,
    addToScene?: ((obj: THREE.Object3D) => void) | null
  ): THREE.Group;
  updateTracers(
    deltaTime: number,
    removeFromScene?: ((obj: THREE.Object3D) => void) | null
  ): void;
  dispose(): void;
}
