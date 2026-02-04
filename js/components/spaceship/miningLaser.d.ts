export class MiningLaserComponent {
  power: number;
  range: number;
  active: boolean;
  targetEntityId: string | null;
  miningRates: Record<string, number>;
  laserColor: number;
  laserWidth: number;
  visualsCreated: boolean;
  entity?: any;

  constructor(power?: number, range?: number);

  setTarget(entityId: string): void;
  activate(active: boolean): void;
  getMiningSpeed(resourceType: string): number;
  upgrade(multiplier?: number): number;
  onDetached(): void;
}
