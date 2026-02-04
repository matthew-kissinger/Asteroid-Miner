import * as THREE from 'three';

export class RigidbodyComponent {
  velocity: THREE.Vector3;
  angularVelocity: THREE.Vector3;
  mass: number;
  drag: number;
  angularDrag: number;
  useGravity: boolean;
  isKinematic: boolean;
  freezeRotation: boolean;
  forces: THREE.Vector3;
  torque: THREE.Vector3;
  collisionRadius: number;
  isTrigger: boolean;
  entity?: any;

  constructor(mass?: number);

  resetForces(): void;
  applyForce(force: THREE.Vector3, point?: THREE.Vector3 | null): void;
  applyImpulse(impulse: THREE.Vector3): void;
  applyTorque(torque: THREE.Vector3): void;
  setVelocity(velocity: THREE.Vector3): void;
  setAngularVelocity(angularVelocity: THREE.Vector3): void;
}
