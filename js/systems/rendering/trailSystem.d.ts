export class TrailSystem {
  constructor(world: any);
  registerTrail(entityId: string, trailComponent: any): void;
  unregisterTrail(entityId: string): void;
  update(deltaTime: number): void;
}
