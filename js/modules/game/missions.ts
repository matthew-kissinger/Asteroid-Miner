// missions.ts - Procedural mission/contract system for stargate terminal

import { debugLog } from '../../globals/debug.ts';
import { mainMessageBus } from '../../globals/messageBus.ts';
import type { Message } from '../../core/messageBus.ts';

// ── Types ────────────────────────────────────────────────────────────

export type MissionCategory = 'mining' | 'combat' | 'trade';
export type MissionStatus = 'available' | 'active' | 'completed' | 'expired';

export interface MissionDefinition {
    id: string;
    title: string;
    description: string;
    category: MissionCategory;
    targetAmount: number;
    currentProgress: number;
    creditReward: number;
    timeLimit: number | null; // seconds, null = no limit
    status: MissionStatus;
    startedAt: number | null;
    targetResource?: string; // for mining: 'iron' | 'gold' | 'platinum'
}

export interface MissionSaveData {
    availableMissions: MissionDefinition[];
    activeMission: MissionDefinition | null;
    completedCount: number;
    totalCreditsEarned: number;
}

// ── Mission Templates ────────────────────────────────────────────────

interface MiningTemplate {
    resource: string;
    name: string;
    minAmount: number;
    maxAmount: number;
    baseReward: number;
}

const MINING_TEMPLATES: ReadonlyArray<MiningTemplate> = [
    { resource: 'iron', name: 'Iron', minAmount: 5, maxAmount: 30, baseReward: 15 },
    { resource: 'gold', name: 'Gold', minAmount: 3, maxAmount: 15, baseReward: 75 },
    { resource: 'platinum', name: 'Platinum', minAmount: 1, maxAmount: 8, baseReward: 300 },
];

const COMBAT_BASE_REWARD = 100;
const COMBAT_MIN_KILLS = 3;
const COMBAT_MAX_KILLS = 15;
const COMBAT_TIME_LIMIT = 600; // 10 minutes

const TRADE_MIN_CREDITS = 500;
const TRADE_MAX_CREDITS = 5000;
const TRADE_REWARD_RATIO = 0.2;

const RESOURCE_PRICES: Record<string, number> = { iron: 10, gold: 50, platinum: 200 };

// ── Helpers ──────────────────────────────────────────────────────────

let missionIdCounter = 0;

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateMissionId(): string {
    return `mission_${Date.now()}_${missionIdCounter++}`;
}

function generateMiningMission(): MissionDefinition {
    const template = MINING_TEMPLATES[Math.floor(Math.random() * MINING_TEMPLATES.length)];
    const amount = randomInt(template.minAmount, template.maxAmount);
    const reward = amount * template.baseReward;

    return {
        id: generateMissionId(),
        title: `${template.name} Collection`,
        description: `Collect ${amount} units of ${template.name} ore`,
        category: 'mining',
        targetAmount: amount,
        currentProgress: 0,
        creditReward: reward,
        timeLimit: null,
        status: 'available',
        startedAt: null,
        targetResource: template.resource,
    };
}

function generateCombatMission(): MissionDefinition {
    const amount = randomInt(COMBAT_MIN_KILLS, COMBAT_MAX_KILLS);
    const reward = amount * COMBAT_BASE_REWARD;

    return {
        id: generateMissionId(),
        title: 'Combat Bounty',
        description: `Destroy ${amount} spectral drones`,
        category: 'combat',
        targetAmount: amount,
        currentProgress: 0,
        creditReward: reward,
        timeLimit: COMBAT_TIME_LIMIT,
        status: 'available',
        startedAt: null,
    };
}

function generateTradeMission(): MissionDefinition {
    const rawAmount = randomInt(TRADE_MIN_CREDITS, TRADE_MAX_CREDITS);
    const amount = Math.round(rawAmount / 100) * 100;
    const reward = Math.round(amount * TRADE_REWARD_RATIO);

    return {
        id: generateMissionId(),
        title: 'Trade Contract',
        description: `Sell ${amount.toLocaleString()} credits worth of resources`,
        category: 'trade',
        targetAmount: amount,
        currentProgress: 0,
        creditReward: reward,
        timeLimit: null,
        status: 'available',
        startedAt: null,
    };
}

// ── MissionManager ───────────────────────────────────────────────────

export class MissionManager {
    private availableMissions: MissionDefinition[] = [];
    private activeMission: MissionDefinition | null = null;
    private completedCount = 0;
    private totalCreditsEarned = 0;
    private unsubscribers: Array<() => void> = [];
    private onMissionUpdate: (() => void) | null = null;
    private spaceship: { credits: number } | null = null;

    constructor() {
        this.generateMissions();
    }

    // ── Callbacks ─────────────────────────────────────────────────────

    setOnMissionUpdate(callback: () => void): void {
        this.onMissionUpdate = callback;
    }

    setSpaceship(spaceship: { credits: number }): void {
        this.spaceship = spaceship;
    }

    // ── Mission generation ────────────────────────────────────────────

    generateMissions(): void {
        this.availableMissions = [
            generateMiningMission(),
            generateCombatMission(),
            generateTradeMission(),
        ];
        debugLog('MissionManager: Generated 3 new missions');
    }

    /** Called when player docks at stargate - refresh available missions if none active */
    onDock(): void {
        if (!this.activeMission) {
            this.generateMissions();
        }
        this.checkExpiry();
        this.notifyUpdate();
    }

    // ── Mission lifecycle ─────────────────────────────────────────────

    acceptMission(missionId: string): boolean {
        if (this.activeMission) {
            debugLog('MissionManager: Cannot accept - already have active mission');
            return false;
        }

        const index = this.availableMissions.findIndex(m => m.id === missionId);
        if (index === -1) return false;

        const mission = this.availableMissions[index];
        mission.status = 'active';
        mission.startedAt = Date.now();
        mission.currentProgress = 0;
        this.activeMission = mission;
        this.availableMissions.splice(index, 1);

        debugLog(`MissionManager: Accepted mission "${mission.title}"`);
        this.notifyUpdate();
        return true;
    }

    cancelMission(): void {
        if (!this.activeMission) return;
        debugLog(`MissionManager: Cancelled mission "${this.activeMission.title}"`);
        this.activeMission = null;
        this.notifyUpdate();
    }

    private completeMission(): void {
        if (!this.activeMission) return;

        const reward = this.activeMission.creditReward;
        this.activeMission.status = 'completed';

        if (this.spaceship) {
            this.spaceship.credits += reward;
        }

        this.completedCount++;
        this.totalCreditsEarned += reward;

        debugLog(`MissionManager: Completed "${this.activeMission.title}" - Reward: ${reward} CR`);
        mainMessageBus.publish(
            'ui.notification' as keyof import('../../core/events.ts').GameEventMap,
            { message: `Mission Complete! +${reward} CR`, type: 'info' } as never
        );

        this.activeMission = null;
        this.notifyUpdate();
    }

    checkExpiry(): void {
        if (!this.activeMission || !this.activeMission.timeLimit || !this.activeMission.startedAt) return;

        const elapsed = (Date.now() - this.activeMission.startedAt) / 1000;
        if (elapsed >= this.activeMission.timeLimit) {
            debugLog(`MissionManager: Mission "${this.activeMission.title}" expired`);
            this.activeMission.status = 'expired';
            this.activeMission = null;
            this.notifyUpdate();
        }
    }

    // ── Event handlers ────────────────────────────────────────────────

    private handleMiningEvent(data: { amount: number; resourceType: string }): void {
        if (!this.activeMission || this.activeMission.category !== 'mining') return;

        if (this.activeMission.targetResource &&
            data.resourceType !== this.activeMission.targetResource) return;

        this.activeMission.currentProgress += data.amount;
        if (this.activeMission.currentProgress >= this.activeMission.targetAmount) {
            this.completeMission();
        } else {
            this.notifyUpdate();
        }
    }

    private handleCombatEvent(): void {
        if (!this.activeMission || this.activeMission.category !== 'combat') return;

        this.activeMission.currentProgress++;
        if (this.activeMission.currentProgress >= this.activeMission.targetAmount) {
            this.completeMission();
        } else {
            this.notifyUpdate();
        }
    }

    private handleTradeEvent(data: { amount: number; resourceType: string }): void {
        if (!this.activeMission || this.activeMission.category !== 'trade') return;

        const creditValue = (RESOURCE_PRICES[data.resourceType] ?? 10) * data.amount;
        this.activeMission.currentProgress += creditValue;

        if (this.activeMission.currentProgress >= this.activeMission.targetAmount) {
            this.completeMission();
        } else {
            this.notifyUpdate();
        }
    }

    // ── Event subscriptions ───────────────────────────────────────────

    subscribeToEvents(): void {
        this.unsubscribers.push(
            mainMessageBus.subscribe('mining.resourceCollected', (msg: Message) => {
                const data = msg.data as { amount: number; resourceType: string };
                this.handleMiningEvent(data);
            })
        );

        this.unsubscribers.push(
            mainMessageBus.subscribe('enemy.destroyed', () => {
                this.handleCombatEvent();
            })
        );

        this.unsubscribers.push(
            mainMessageBus.subscribe('trading.resourceSold', (msg: Message) => {
                const data = msg.data as { amount: number; resourceType: string };
                this.handleTradeEvent(data);
            })
        );

        this.unsubscribers.push(
            mainMessageBus.subscribe('player.docked', () => {
                this.onDock();
            })
        );

        debugLog('MissionManager: Event listeners registered');
    }

    // ── Queries ───────────────────────────────────────────────────────

    getAvailableMissions(): MissionDefinition[] {
        return [...this.availableMissions];
    }

    getActiveMission(): MissionDefinition | null {
        return this.activeMission;
    }

    getCompletedCount(): number {
        return this.completedCount;
    }

    getTotalCreditsEarned(): number {
        return this.totalCreditsEarned;
    }

    // ── Persistence ───────────────────────────────────────────────────

    exportState(): MissionSaveData {
        return {
            availableMissions: this.availableMissions.map(m => ({ ...m })),
            activeMission: this.activeMission ? { ...this.activeMission } : null,
            completedCount: this.completedCount,
            totalCreditsEarned: this.totalCreditsEarned,
        };
    }

    importState(saved: MissionSaveData): void {
        this.availableMissions = saved.availableMissions ?? [];
        this.activeMission = saved.activeMission ?? null;
        this.completedCount = saved.completedCount ?? 0;
        this.totalCreditsEarned = saved.totalCreditsEarned ?? 0;
        debugLog(`MissionManager: Imported state - ${this.completedCount} completed, ${this.availableMissions.length} available`);
    }

    // ── Internal ──────────────────────────────────────────────────────

    private notifyUpdate(): void {
        if (this.onMissionUpdate) {
            this.onMissionUpdate();
        }
    }

    destroy(): void {
        for (const unsub of this.unsubscribers) {
            unsub();
        }
        this.unsubscribers = [];
        debugLog('MissionManager: Destroyed');
    }
}
