import * as THREE from 'three';

export class TransformComponent {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  quaternion: THREE.Quaternion;
  matrix: THREE.Matrix4;
  needsUpdate: boolean;
  prevPosition: THREE.Vector3;
  prevQuaternion: THREE.Quaternion;

  constructor(position?: THREE.Vector3, rotation?: THREE.Euler, scale?: THREE.Vector3);

  setPosition(x: number, y: number, z: number): this;
  setRotation(x: number, y: number, z: number): this;
  setQuaternion(quaternion: THREE.Quaternion): this;
  setScale(x: number, y: number, z: number): this;
  lookAt(target: THREE.Vector3): this;
  updateMatrix(): THREE.Matrix4;
  snapshotPrevious(): void;
  getWorldPosition(): THREE.Vector3;
  getForwardVector(): THREE.Vector3;
  getRightVector(): THREE.Vector3;
  getUpVector(): THREE.Vector3;
}
