/**
 * Combat Stats Tracker - Tracks player combat performance statistics
 *
 * Maintains running stats for:
 * - Total kills (enemies destroyed)
 * - DPS (rolling 10-second average)
 * - Accuracy (hits / shots fired)
 *
 * Subscribes to combat events via messageBus and provides getter methods
 * for HUD display.
 */

import type { MessageBus } from '../../core/messageBus.ts';
import type { GameEventMap } from '../../core/events.ts';
import { debugLog } from '../../globals/debug.ts';

interface DamageEntry {
    damage: number;
    timestamp: number;
}

export class CombatStats {
    private totalKills: number = 0;
    private totalDamageDealt: number = 0;
    private totalShotsFired: number = 0;
    private totalHits: number = 0;

    // Rolling damage window for DPS calculation (10 seconds)
    private damageWindow: DamageEntry[] = [];
    private readonly DPS_WINDOW_MS = 10000; // 10 seconds

    private messageBus: MessageBus<GameEventMap> | null = null;
    private subscriptions: Array<() => void> = [];

    constructor() {
        debugLog('[COMBAT STATS] Combat stats tracker initialized');
    }

    /**
     * Initialize and subscribe to combat events
     */
    initialize(messageBus: MessageBus<GameEventMap>): void {
        if (this.messageBus) {
            debugLog('[COMBAT STATS] Already initialized');
            return;
        }

        this.messageBus = messageBus;

        // Subscribe to enemy destroyed events
        const unsubKills = messageBus.subscribe('enemy.destroyed', () => {
            this.totalKills++;
            debugLog(`[COMBAT STATS] Kill count: ${this.totalKills}`);
        });
        this.subscriptions.push(unsubKills);

        // Subscribe to damage events (entity.damage for player attacks)
        const unsubDamage = messageBus.subscribe('entity.damage', (message) => {
            if (message.data.source === 'player') {
                const damage = message.data.amount || message.data.damage || 0;
                this.recordDamage(damage);
                this.totalHits++;
                debugLog(`[COMBAT STATS] Damage dealt: ${damage}, Total: ${this.totalDamageDealt}`);
            }
        });
        this.subscriptions.push(unsubDamage);

        // Subscribe to weapon fire events
        const unsubFire = messageBus.subscribe('weapon.fire', () => {
            this.totalShotsFired++;
            debugLog(`[COMBAT STATS] Shot fired, Total: ${this.totalShotsFired}`);
        });
        this.subscriptions.push(unsubFire);

        debugLog('[COMBAT STATS] Event subscriptions active');
    }

    /**
     * Record damage for DPS calculation
     */
    private recordDamage(damage: number): void {
        const now = performance.now();
        this.totalDamageDealt += damage;
        this.damageWindow.push({ damage, timestamp: now });

        // Clean up old entries outside the window
        this.cleanupDamageWindow(now);
    }

    /**
     * Remove damage entries older than DPS window
     */
    private cleanupDamageWindow(currentTime: number): void {
        const cutoff = currentTime - this.DPS_WINDOW_MS;
        this.damageWindow = this.damageWindow.filter(entry => entry.timestamp > cutoff);
    }

    /**
     * Get current kills
     */
    getKills(): number {
        return this.totalKills;
    }

    /**
     * Get current DPS (rolling 10-second average)
     */
    getDPS(): number {
        const now = performance.now();
        this.cleanupDamageWindow(now);

        if (this.damageWindow.length === 0) return 0;

        // Calculate time span of the window
        const oldestTimestamp = this.damageWindow[0].timestamp;
        const timeSpan = (now - oldestTimestamp) / 1000; // Convert to seconds

        // Sum damage in window
        const totalDamage = this.damageWindow.reduce((sum, entry) => sum + entry.damage, 0);

        // Calculate DPS
        return timeSpan > 0 ? totalDamage / timeSpan : 0;
    }

    /**
     * Get accuracy percentage (hits / shots * 100)
     */
    getAccuracy(): number {
        if (this.totalShotsFired === 0) return 0;
        return (this.totalHits / this.totalShotsFired) * 100;
    }

    /**
     * Check if player has engaged in combat (fired at least once)
     */
    hasEngagedCombat(): boolean {
        return this.totalShotsFired > 0;
    }

    /**
     * Reset all stats (for new game session)
     */
    reset(): void {
        this.totalKills = 0;
        this.totalDamageDealt = 0;
        this.totalShotsFired = 0;
        this.totalHits = 0;
        this.damageWindow = [];
        debugLog('[COMBAT STATS] Stats reset');
    }

    /**
     * Clean up subscriptions
     */
    dispose(): void {
        this.subscriptions.forEach(unsub => unsub());
        this.subscriptions = [];
        this.messageBus = null;
        debugLog('[COMBAT STATS] Disposed');
    }
}
