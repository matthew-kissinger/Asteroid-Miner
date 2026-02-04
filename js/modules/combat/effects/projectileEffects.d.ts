import * as THREE from 'three';

export class ProjectileEffects {
  constructor();
  createMuzzleFlash(position: THREE.Vector3, direction: THREE.Vector3, poolManager: any): any;
  addProjectileTrail(projectile: THREE.Mesh, direction: THREE.Vector3, poolManager: any): void;
  createAimingTracer(
    startPosition: THREE.Vector3,
    direction: THREE.Vector3,
    distance: number,
    poolManager: any
  ): any;
}
