export class CargoComponent {
  maxCapacity: number;
  usedCapacity: number;
  resources: Record<string, number>;
  resourceValues: Record<string, number>;
  resourceVolumes: Record<string, number>;
  entity?: any;

  constructor(maxCapacity?: number);

  addResource(type: string, amount: number): number;
  removeResource(type: string, amount: number): number;
  getTotalValue(): number;
  getResourceValue(type: string): number;
  getFillPercentage(): number;
  clearCargo(): Record<string, number>;
  upgrade(multiplier?: number): void;
}
