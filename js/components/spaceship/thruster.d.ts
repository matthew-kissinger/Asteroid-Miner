import * as THREE from 'three';

export class ThrusterComponent {
  thrust: number;
  maxVelocity: number;
  boostMultiplier: number;
  rotationSpeed: number;
  thrusting: {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
    boost: boolean;
  };
  particleSystems: {
    main: THREE.Points | null;
    left: THREE.Points | null;
    right: THREE.Points | null;
    reverse: THREE.Points | null;
  };
  fuelConsumptionRate: number;
  boostConsumptionMultiplier: number;
  entity?: any;

  constructor(thrust?: number, maxVelocity?: number);

  initializeParticleEffects(scene: THREE.Scene): void;
  calculateFuelConsumption(deltaTime: number): number;
  applyThrust(deltaTime: number): void;
}
