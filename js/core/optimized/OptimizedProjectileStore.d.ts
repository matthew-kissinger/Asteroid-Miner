export class OptimizedProjectileStore {
  capacity: number;
  count: number;
  pos: Float32Array;
  vel: Float32Array;
  alive: Uint8Array;
  idToIndex: Map<any, number>;
  indexToProjectile: any[];

  constructor(capacity?: number);

  register(projectile: any): number;
  unregisterByIndex(idx: number): void;
  unregister(projectile: any): void;
  update(dt: number): void;
}
