import * as THREE from 'three';

export class MineableComponent {
  resourceType: string;
  totalAmount: number;
  remainingAmount: number;
  miningDifficulty: number;
  miningEffectColor: number;
  miningParticles: THREE.Points | null;
  beingMined: boolean;
  lastMineTime: number;
  startingScale: number;
  minScale: number;
  entity?: any;

  constructor(resourceType?: string, amount?: number);

  initializeParticleEffects(scene: THREE.Scene): void;
  showMiningEffect(active: boolean): void;
  updateParticlePosition(position: THREE.Vector3): void;
  mine(amount: number): { type: string; amount: number; depleted: boolean };
  setStartingScale(scale: number): void;
  isDepleted(): boolean;
  getDepletionPercentage(): number;
  onDetached(): void;
}
