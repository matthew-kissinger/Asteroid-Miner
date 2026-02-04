export class CombatSystem {
  enabled?: boolean;
  constructor(world: any);
  update(deltaTime: number): void;
  setEnabled?(enabled: boolean): void;
}
