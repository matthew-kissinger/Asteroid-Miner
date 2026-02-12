// missionSystem.ts - Procedural mission/contract generation and management

import { debugLog } from '../../globals/debug.ts';

// ── Mission Types ────────────────────────────────────────────────────

export type MissionType = 'mining' | 'combat' | 'delivery';

export type MissionStatus = 'available' | 'active' | 'completed' | 'failed';

export interface MissionObjective {
  description: string;
  current: number;
  target: number;
  type: 'collect' | 'destroy' | 'survive' | 'travel';
  resourceType?: string; // For mining missions
  systemName?: string; // For delivery missions
}

export interface MissionRewards {
  credits: number;
  xp: number;
}

export interface Mission {
  id: string;
  type: MissionType;
  title: string;
  description: string;
  objectives: MissionObjective[];
  rewards: MissionRewards;
  timeLimit?: number; // seconds, optional
  status: MissionStatus;
  acceptedAt?: number; // timestamp
}

// ── Mission Templates ────────────────────────────────────────────────

const MINING_TEMPLATES = [
  { ore: 'iron', min: 10, max: 30, creditMultiplier: 50, xpMultiplier: 20 },
  { ore: 'gold', min: 5, max: 15, creditMultiplier: 150, xpMultiplier: 50 },
  { ore: 'platinum', min: 3, max: 10, creditMultiplier: 300, xpMultiplier: 100 },
];

const COMBAT_TEMPLATES = [
  { type: 'destroy', min: 5, max: 15, creditMultiplier: 100, xpMultiplier: 50 },
  { type: 'survive', minTime: 60, maxTime: 180, creditMultiplier: 200, xpMultiplier: 100 },
];

const DELIVERY_SYSTEMS = ['Alpha Centauri', 'Proxima', 'Sirius', 'Vega', 'Betelgeuse'];

// ── Mission Generator ────────────────────────────────────────────────

export class MissionSystem {
  private availableMissions: Mission[] = [];
  private activeMission: Mission | null = null;
  private completedMissionCount = 0;
  private missionIdCounter = 0;

  constructor() {
    this.generateMissions();
  }

  // ── Mission Generation ───────────────────────────────────────────

  generateMissions(): void {
    this.availableMissions = [];
    const missionCount = 3 + Math.floor(Math.random() * 3); // 3-5 missions

    for (let i = 0; i < missionCount; i++) {
      const missionType = this.randomMissionType();
      const mission = this.generateMission(missionType);
      this.availableMissions.push(mission);
    }

    debugLog(`Generated ${this.availableMissions.length} missions`);
  }

  private randomMissionType(): MissionType {
    const types: MissionType[] = ['mining', 'combat', 'delivery'];
    return types[Math.floor(Math.random() * types.length)];
  }

  private generateMission(type: MissionType): Mission {
    const id = `mission-${++this.missionIdCounter}`;

    switch (type) {
      case 'mining':
        return this.generateMiningMission(id);
      case 'combat':
        return this.generateCombatMission(id);
      case 'delivery':
        return this.generateDeliveryMission(id);
    }
  }

  private generateMiningMission(id: string): Mission {
    const template = MINING_TEMPLATES[Math.floor(Math.random() * MINING_TEMPLATES.length)];
    const amount = template.min + Math.floor(Math.random() * (template.max - template.min + 1));
    const credits = amount * template.creditMultiplier;
    const xp = amount * template.xpMultiplier;

    return {
      id,
      type: 'mining',
      title: `Mine ${amount} ${template.ore.toUpperCase()}`,
      description: `Extract ${amount} units of ${template.ore} from asteroids in this sector.`,
      objectives: [
        {
          description: `Collect ${amount} ${template.ore}`,
          current: 0,
          target: amount,
          type: 'collect',
          resourceType: template.ore,
        },
      ],
      rewards: { credits, xp },
      status: 'available',
    };
  }

  private generateCombatMission(id: string): Mission {
    const template = COMBAT_TEMPLATES[Math.floor(Math.random() * COMBAT_TEMPLATES.length)];

    if (template.type === 'destroy') {
      const min = template.min ?? 5;
      const max = template.max ?? 15;
      const count = min + Math.floor(Math.random() * (max - min + 1));
      const credits = count * template.creditMultiplier;
      const xp = count * template.xpMultiplier;

      return {
        id,
        type: 'combat',
        title: `Destroy ${count} Enemies`,
        description: `Eliminate ${count} hostile ships in this sector.`,
        objectives: [
          {
            description: `Destroy ${count} enemies`,
            current: 0,
            target: count,
            type: 'destroy',
          },
        ],
        rewards: { credits, xp },
        status: 'available',
      };
    } else {
      const minTime = template.minTime ?? 60;
      const maxTime = template.maxTime ?? 180;
      const time = minTime + Math.floor(Math.random() * (maxTime - minTime + 1));
      const credits = Math.floor((time / 60) * template.creditMultiplier);
      const xp = Math.floor((time / 60) * template.xpMultiplier);

      return {
        id,
        type: 'combat',
        title: `Survive ${time}s in Combat`,
        description: `Stay alive for ${time} seconds while under attack.`,
        objectives: [
          {
            description: `Survive ${time} seconds`,
            current: 0,
            target: time,
            type: 'survive',
          },
        ],
        rewards: { credits, xp },
        timeLimit: time,
        status: 'available',
      };
    }
  }

  private generateDeliveryMission(id: string): Mission {
    const system = DELIVERY_SYSTEMS[Math.floor(Math.random() * DELIVERY_SYSTEMS.length)];
    const cargoAmount = 5 + Math.floor(Math.random() * 16); // 5-20 units
    const credits = cargoAmount * 100;
    const xp = cargoAmount * 30;

    return {
      id,
      type: 'delivery',
      title: `Deliver to ${system}`,
      description: `Transport ${cargoAmount} units of cargo to ${system} system.`,
      objectives: [
        {
          description: `Travel to ${system}`,
          current: 0,
          target: 1,
          type: 'travel',
          systemName: system,
        },
      ],
      rewards: { credits, xp },
      status: 'available',
    };
  }

  // ── Mission Management ───────────────────────────────────────────

  getAvailableMissions(): Mission[] {
    return this.availableMissions.filter(m => m.status === 'available');
  }

  getActiveMission(): Mission | null {
    return this.activeMission;
  }

  acceptMission(missionId: string): boolean {
    if (this.activeMission) {
      debugLog('Cannot accept mission: already have an active mission');
      return false;
    }

    const mission = this.availableMissions.find(m => m.id === missionId);
    if (!mission || mission.status !== 'available') {
      debugLog(`Cannot accept mission ${missionId}: not found or not available`);
      return false;
    }

    mission.status = 'active';
    mission.acceptedAt = Date.now();
    this.activeMission = mission;

    debugLog(`Accepted mission: ${mission.title}`);
    return true;
  }

  abandonMission(): boolean {
    if (!this.activeMission) {
      return false;
    }

    debugLog(`Abandoned mission: ${this.activeMission.title}`);
    this.activeMission.status = 'failed';
    this.activeMission = null;
    return true;
  }

  completeMission(): boolean {
    if (!this.activeMission) {
      return false;
    }

    this.activeMission.status = 'completed';
    this.completedMissionCount++;
    debugLog(`Completed mission: ${this.activeMission.title}`);

    this.activeMission = null;

    return true;
  }

  // ── Progress Tracking ────────────────────────────────────────────

  updateProgress(objectiveType: string, value: number, metadata?: Record<string, unknown>): void {
    if (!this.activeMission) return;

    for (const objective of this.activeMission.objectives) {
      if (objective.type === objectiveType) {
        // Check metadata matches if needed
        if (objective.resourceType && metadata?.resourceType !== objective.resourceType) {
          continue;
        }
        if (objective.systemName && metadata?.systemName !== objective.systemName) {
          continue;
        }

        objective.current = Math.min(objective.current + value, objective.target);
        debugLog(`Mission progress: ${objective.description} - ${objective.current}/${objective.target}`);

        // Check if mission is complete
        if (this.isMissionComplete()) {
          this.completeMission();
        }
      }
    }
  }

  private isMissionComplete(): boolean {
    if (!this.activeMission) return false;

    return this.activeMission.objectives.every(obj => obj.current >= obj.target);
  }

  // ── Save/Load Support ────────────────────────────────────────────

  getSaveData(): { activeMission: Mission | null; completedMissionCount: number } {
    return {
      activeMission: this.activeMission,
      completedMissionCount: this.completedMissionCount,
    };
  }

  loadSaveData(data: { activeMission: Mission | null; completedMissionCount: number }): void {
    this.activeMission = data.activeMission;
    this.completedMissionCount = data.completedMissionCount;
    debugLog(`Loaded mission data: ${this.completedMissionCount} completed, active: ${this.activeMission?.title ?? 'none'}`);
  }
}
