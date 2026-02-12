// achievements.ts - Achievement/badge system for tracking player milestones

import { debugLog } from '../../globals/debug.ts';
import { mainMessageBus } from '../../globals/messageBus.ts';
import type { Message } from '../../core/messageBus.ts';

// ── Types ────────────────────────────────────────────────────────────

export type AchievementCategory =
    | 'mining'
    | 'combat'
    | 'trading'
    | 'exploration'
    | 'progression'
    | 'survival';

export interface AchievementDefinition {
    id: string;
    title: string;
    description: string;
    icon: string;
    category: AchievementCategory;
    threshold: number;
}

export interface AchievementState {
    id: string;
    unlocked: boolean;
    unlockedAt: number | null;
    progress: number;
}

export interface AchievementUnlockedPayload {
    id: string;
    title: string;
    description: string;
    icon: string;
    category: AchievementCategory;
}

// ── Achievement Definitions ──────────────────────────────────────────

export const ACHIEVEMENT_DEFINITIONS: ReadonlyArray<AchievementDefinition> = [
    // Mining
    {
        id: 'first_ore',
        title: 'First Ore',
        description: 'Mine your first asteroid',
        icon: '⛏️',
        category: 'mining',
        threshold: 1,
    },
    {
        id: 'gold_rush',
        title: 'Gold Rush',
        description: 'Collect 100 gold ore',
        icon: '🥇',
        category: 'mining',
        threshold: 100,
    },
    {
        id: 'platinum_baron',
        title: 'Platinum Baron',
        description: 'Collect 50 platinum ore',
        icon: '💎',
        category: 'mining',
        threshold: 50,
    },
    // Combat
    {
        id: 'first_blood',
        title: 'First Blood',
        description: 'Destroy your first enemy',
        icon: '🎯',
        category: 'combat',
        threshold: 1,
    },
    {
        id: 'ace_pilot',
        title: 'Ace Pilot',
        description: 'Destroy 50 enemies',
        icon: '✈️',
        category: 'combat',
        threshold: 50,
    },
    {
        id: 'boss_slayer',
        title: 'Boss Slayer',
        description: 'Defeat a boss',
        icon: '👑',
        category: 'combat',
        threshold: 1,
    },
    // Trading
    {
        id: 'first_trade',
        title: 'First Trade',
        description: 'Sell cargo for the first time',
        icon: '💰',
        category: 'trading',
        threshold: 1,
    },
    {
        id: 'millionaire',
        title: 'Millionaire',
        description: 'Accumulate 1,000,000 credits total',
        icon: '🤑',
        category: 'trading',
        threshold: 1000000,
    },
    // Exploration
    {
        id: 'star_hopper',
        title: 'Star Hopper',
        description: 'Visit 3 different systems',
        icon: '🌟',
        category: 'exploration',
        threshold: 3,
    },
    {
        id: 'anomaly_hunter',
        title: 'Anomaly Hunter',
        description: 'Discover 5 anomalies',
        icon: '🔮',
        category: 'exploration',
        threshold: 5,
    },
    // Progression
    {
        id: 'rank_up',
        title: 'Rank Up',
        description: 'Reach rank 2',
        icon: '⭐',
        category: 'progression',
        threshold: 2,
    },
    {
        id: 'commander',
        title: 'Commander',
        description: 'Reach rank 5',
        icon: '🎖️',
        category: 'progression',
        threshold: 5,
    },
    // Survival
    {
        id: 'survivor',
        title: 'Survivor',
        description: 'Survive 5 minutes in horde mode',
        icon: '🛡️',
        category: 'survival',
        threshold: 300,
    },
    {
        id: 'horde_master',
        title: 'Horde Master',
        description: 'Reach wave 10 in horde mode',
        icon: '🏆',
        category: 'survival',
        threshold: 10,
    },
];

// ── AchievementManager ───────────────────────────────────────────────

export class AchievementManager {
    private states: Map<string, AchievementState>;
    private definitions: Map<string, AchievementDefinition>;
    private unsubscribers: Array<() => void> = [];

    // Tracked counters for cumulative achievements
    private totalGold = 0;
    private totalPlatinum = 0;
    private totalMined = 0;
    private totalKills = 0;
    private totalTradesSold = 0;
    private totalCreditsEarned = 0;
    private discoveredSystems = new Set<string>();
    private discoveredAnomalies = 0;
    private hordeStartTime = 0;
    private highestRank = 1;
    private highestHordeWave = 0;

    constructor() {
        this.states = new Map();
        this.definitions = new Map();

        for (const def of ACHIEVEMENT_DEFINITIONS) {
            this.definitions.set(def.id, def);
            this.states.set(def.id, {
                id: def.id,
                unlocked: false,
                unlockedAt: null,
                progress: 0,
            });
        }
    }

    // ── Persistence ──────────────────────────────────────────────────

    /** Export achievement states for saving */
    exportStates(): AchievementState[] {
        return Array.from(this.states.values());
    }

    /** Import achievement states from a save */
    importStates(saved: AchievementState[]): void {
        for (const s of saved) {
            if (this.states.has(s.id)) {
                this.states.set(s.id, {
                    id: s.id,
                    unlocked: s.unlocked,
                    unlockedAt: s.unlockedAt,
                    progress: s.progress,
                });
            }
        }
        // Restore counters from progress values
        this.totalMined = this.getProgress('first_ore');
        this.totalGold = this.getProgress('gold_rush');
        this.totalPlatinum = this.getProgress('platinum_baron');
        this.totalKills = this.getProgress('ace_pilot');
        this.totalTradesSold = this.getProgress('first_trade');
        this.totalCreditsEarned = this.getProgress('millionaire');
        this.discoveredAnomalies = this.getProgress('anomaly_hunter');
        this.highestRank = Math.max(1, this.getProgress('commander'));
        this.highestHordeWave = this.getProgress('horde_master');

        // Reconstruct discovered systems count from progress
        const starHopperProgress = this.getProgress('star_hopper');
        // We can't recover the actual set, but we set size-equivalent placeholder
        for (let i = 0; i < starHopperProgress; i++) {
            this.discoveredSystems.add(`__restored_${i}`);
        }

        debugLog(`AchievementManager: Imported ${saved.length} achievement states`);
    }

    // ── Queries ──────────────────────────────────────────────────────

    getAll(): Array<AchievementDefinition & AchievementState> {
        const result: Array<AchievementDefinition & AchievementState> = [];
        for (const def of ACHIEVEMENT_DEFINITIONS) {
            const state = this.states.get(def.id);
            if (state) {
                result.push({ ...def, ...state });
            }
        }
        return result;
    }

    getUnlocked(): Array<AchievementDefinition & AchievementState> {
        return this.getAll().filter((a) => a.unlocked);
    }

    isUnlocked(id: string): boolean {
        return this.states.get(id)?.unlocked ?? false;
    }

    getProgress(id: string): number {
        return this.states.get(id)?.progress ?? 0;
    }

    // ── Core unlock logic ────────────────────────────────────────────

    /**
     * Update progress for an achievement and unlock if threshold is reached.
     * Returns true if the achievement was newly unlocked.
     */
    updateProgress(id: string, newProgress: number): boolean {
        const state = this.states.get(id);
        const def = this.definitions.get(id);
        if (!state || !def) return false;
        if (state.unlocked) return false;

        state.progress = newProgress;

        if (newProgress >= def.threshold) {
            state.unlocked = true;
            state.unlockedAt = Date.now();
            debugLog(`Achievement unlocked: ${def.title}`);

            const payload: AchievementUnlockedPayload = {
                id: def.id,
                title: def.title,
                description: def.description,
                icon: def.icon,
                category: def.category,
            };
            mainMessageBus.publish(
                'achievement.unlocked' as keyof import('../../core/events.ts').GameEventMap,
                payload as never
            );
            return true;
        }
        return false;
    }

    // ── Event wiring ─────────────────────────────────────────────────

    /** Subscribe to game events to track achievement progress */
    subscribeToEvents(): void {
        this.unsubscribers.push(
            mainMessageBus.subscribe('mining.resourceCollected', (msg: Message) => {
                const data = msg.data as { amount: number; resourceType: string };
                this.totalMined += data.amount;
                this.updateProgress('first_ore', this.totalMined);

                if (data.resourceType === 'gold') {
                    this.totalGold += data.amount;
                    this.updateProgress('gold_rush', this.totalGold);
                } else if (data.resourceType === 'platinum') {
                    this.totalPlatinum += data.amount;
                    this.updateProgress('platinum_baron', this.totalPlatinum);
                }
            })
        );

        this.unsubscribers.push(
            mainMessageBus.subscribe('enemy.destroyed', () => {
                this.totalKills++;
                this.updateProgress('first_blood', this.totalKills);
                this.updateProgress('ace_pilot', this.totalKills);
            })
        );

        this.unsubscribers.push(
            mainMessageBus.subscribe('boss.destroyed', () => {
                this.updateProgress('boss_slayer', 1);
            })
        );

        this.unsubscribers.push(
            mainMessageBus.subscribe('trading.resourceSold', () => {
                this.totalTradesSold++;
                this.updateProgress('first_trade', this.totalTradesSold);
            })
        );

        this.unsubscribers.push(
            mainMessageBus.subscribe('xp.gained', (msg: Message) => {
                const data = msg.data as { amount: number; newTotal: number; rank: number };
                this.totalCreditsEarned = data.newTotal;
                this.updateProgress('millionaire', this.totalCreditsEarned);
            })
        );

        this.unsubscribers.push(
            mainMessageBus.subscribe('system.discovered', (msg: Message) => {
                const data = msg.data as { systemId: string };
                this.discoveredSystems.add(data.systemId);
                this.updateProgress('star_hopper', this.discoveredSystems.size);
            })
        );

        this.unsubscribers.push(
            mainMessageBus.subscribe('hazard.entered', (msg: Message) => {
                const data = msg.data as { hazardType: string };
                if (data.hazardType === 'anomaly') {
                    this.discoveredAnomalies++;
                    this.updateProgress('anomaly_hunter', this.discoveredAnomalies);
                }
            })
        );

        this.unsubscribers.push(
            mainMessageBus.subscribe('rank.up', (msg: Message) => {
                const data = msg.data as { rank: number };
                this.highestRank = Math.max(this.highestRank, data.rank);
                this.updateProgress('rank_up', this.highestRank);
                this.updateProgress('commander', this.highestRank);
            })
        );

        this.unsubscribers.push(
            mainMessageBus.subscribe('horde.activated', () => {
                this.hordeStartTime = Date.now();
            })
        );

        this.unsubscribers.push(
            mainMessageBus.subscribe('horde.waveStart', (msg: Message) => {
                const data = msg.data as { wave: number };
                this.highestHordeWave = Math.max(this.highestHordeWave, data.wave);
                this.updateProgress('horde_master', this.highestHordeWave);

                // Check survival time
                if (this.hordeStartTime > 0) {
                    const elapsed = (Date.now() - this.hordeStartTime) / 1000;
                    this.updateProgress('survivor', elapsed);
                }
            })
        );

        debugLog('AchievementManager: Event listeners registered');
    }

    /** Unsubscribe from all events */
    destroy(): void {
        for (const unsub of this.unsubscribers) {
            unsub();
        }
        this.unsubscribers = [];
        debugLog('AchievementManager: Destroyed');
    }
}
