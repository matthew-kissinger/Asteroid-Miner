import * as THREE from 'three';

export class MaterialManager {
  projectileMaterial: THREE.MeshStandardMaterial;
  projectileGlowMaterial: THREE.MeshBasicMaterial;
  trailParticleMaterial: THREE.MeshBasicMaterial;
  muzzleFlashMaterial: THREE.MeshBasicMaterial;
  tracerLineMaterial: THREE.LineBasicMaterial;
  pointLightMaterial: THREE.MeshBasicMaterial;
  explosionParticleMaterial: THREE.PointsMaterial;

  constructor(scene: THREE.Scene);
  getMaterial(type: string): THREE.Material | null;
  dispose(): void;
}
