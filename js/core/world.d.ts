export class World {
  messageBus: any;
  entityManager: any;
  systemManager: any;
  spatial: any;
  index: any;
  deltaTime: number;
  time: number;
  lastUpdateTime: number;
  scene?: any;
  optimizedProjectiles?: any;
  playerEntity?: any;

  constructor(messageBus?: any);

  initialize(): void;
  onEntityTransformUpdated(entity: any): void;
  update(): void;
  createEntity(name?: string): any;
  destroyEntity(entityOrId: any): void;
  registerSystem(system: any): any;
  getEntitiesWithComponents(componentTypes: any[]): any[];
  getEntitiesByTag(tag: string): any[];
  getEntity(id: string): any;
  getSystem(systemType: any): any;
}
