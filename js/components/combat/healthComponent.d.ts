export class HealthComponent {
  maxHealth: number;
  health: number;
  maxShield: number;
  shield: number;
  shieldRegenRate: number;
  shieldRegenDelay: number;
  timeSinceLastDamage: number;
  damageResistance: number;
  isDestroyed: boolean;
  isInvulnerable: boolean;
  entity?: any;

  constructor(maxHealth?: number, maxShield?: number);

  onAttached(): void;
  handleSyncHealth(message: any): void;
  applyDamage(
    amount: number,
    type?: string,
    source?: any
  ): { damageApplied: number; shieldDamage: number; healthDamage: number; destroyed: boolean };
}
