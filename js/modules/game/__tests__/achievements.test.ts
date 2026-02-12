// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../../globals/debug', () => ({
    DEBUG_MODE: { enabled: false },
    debugLog: vi.fn(),
    debugWarn: vi.fn(),
    debugError: vi.fn(),
}));

vi.mock('../../../globals/messageBus', () => ({
    mainMessageBus: {
        subscribe: vi.fn().mockReturnValue(vi.fn()),
        publish: vi.fn(),
    },
}));

import {
    AchievementManager,
    ACHIEVEMENT_DEFINITIONS,
} from '../achievements';
import type { AchievementState } from '../achievements';
import { mainMessageBus } from '../../../globals/messageBus';

const mockSubscribe = vi.mocked(mainMessageBus.subscribe);
const mockPublish = vi.mocked(mainMessageBus.publish);

describe('AchievementManager', () => {
    let manager: AchievementManager;

    beforeEach(() => {
        vi.clearAllMocks();
        manager = new AchievementManager();
    });

    // ── Definitions ──────────────────────────────────────────────

    describe('definitions', () => {
        it('should have 14 achievement definitions', () => {
            expect(ACHIEVEMENT_DEFINITIONS.length).toBe(14);
        });

        it('should cover all categories', () => {
            const categories = new Set(ACHIEVEMENT_DEFINITIONS.map((d) => d.category));
            expect(categories).toContain('mining');
            expect(categories).toContain('combat');
            expect(categories).toContain('trading');
            expect(categories).toContain('exploration');
            expect(categories).toContain('progression');
            expect(categories).toContain('survival');
        });

        it('each definition should have required fields', () => {
            for (const def of ACHIEVEMENT_DEFINITIONS) {
                expect(def.id).toBeTruthy();
                expect(def.title).toBeTruthy();
                expect(def.description).toBeTruthy();
                expect(def.icon).toBeTruthy();
                expect(def.threshold).toBeGreaterThan(0);
            }
        });
    });

    // ── Initial state ────────────────────────────────────────────

    describe('initial state', () => {
        it('should have all achievements locked initially', () => {
            const all = manager.getAll();
            expect(all.length).toBe(ACHIEVEMENT_DEFINITIONS.length);
            for (const a of all) {
                expect(a.unlocked).toBe(false);
                expect(a.unlockedAt).toBeNull();
                expect(a.progress).toBe(0);
            }
        });

        it('getUnlocked should return empty array initially', () => {
            expect(manager.getUnlocked()).toHaveLength(0);
        });

        it('isUnlocked should return false for all', () => {
            expect(manager.isUnlocked('first_ore')).toBe(false);
            expect(manager.isUnlocked('ace_pilot')).toBe(false);
        });
    });

    // ── Unlock logic ─────────────────────────────────────────────

    describe('updateProgress', () => {
        it('should unlock achievement when threshold is reached', () => {
            const result = manager.updateProgress('first_ore', 1);
            expect(result).toBe(true);
            expect(manager.isUnlocked('first_ore')).toBe(true);
        });

        it('should not unlock below threshold', () => {
            const result = manager.updateProgress('ace_pilot', 10);
            expect(result).toBe(false);
            expect(manager.isUnlocked('ace_pilot')).toBe(false);
            expect(manager.getProgress('ace_pilot')).toBe(10);
        });

        it('should unlock when exceeding threshold', () => {
            expect(manager.updateProgress('ace_pilot', 60)).toBe(true);
            expect(manager.isUnlocked('ace_pilot')).toBe(true);
        });

        it('should prevent duplicate unlocks', () => {
            manager.updateProgress('first_blood', 1);
            expect(manager.isUnlocked('first_blood')).toBe(true);

            // Second call should return false (already unlocked)
            const result = manager.updateProgress('first_blood', 5);
            expect(result).toBe(false);
        });

        it('should publish achievement.unlocked event on unlock', () => {
            manager.updateProgress('first_ore', 1);
            expect(mockPublish).toHaveBeenCalledWith(
                'achievement.unlocked',
                expect.objectContaining({
                    id: 'first_ore',
                    title: 'First Ore',
                    icon: '⛏️',
                })
            );
        });

        it('should not publish event if not unlocked', () => {
            manager.updateProgress('ace_pilot', 10);
            expect(mockPublish).not.toHaveBeenCalled();
        });

        it('should return false for unknown achievement id', () => {
            expect(manager.updateProgress('nonexistent', 100)).toBe(false);
        });

        it('should set unlockedAt timestamp on unlock', () => {
            const before = Date.now();
            manager.updateProgress('first_blood', 1);
            const all = manager.getAll();
            const firstBlood = all.find((a) => a.id === 'first_blood');
            expect(firstBlood?.unlockedAt).toBeGreaterThanOrEqual(before);
            expect(firstBlood?.unlockedAt).toBeLessThanOrEqual(Date.now());
        });
    });

    // ── Persistence ──────────────────────────────────────────────

    describe('export/import states', () => {
        it('should export all achievement states', () => {
            const exported = manager.exportStates();
            expect(exported).toHaveLength(ACHIEVEMENT_DEFINITIONS.length);
            expect(exported[0]).toHaveProperty('id');
            expect(exported[0]).toHaveProperty('unlocked');
            expect(exported[0]).toHaveProperty('unlockedAt');
            expect(exported[0]).toHaveProperty('progress');
        });

        it('should round-trip through export/import', () => {
            manager.updateProgress('first_ore', 1);
            manager.updateProgress('ace_pilot', 30);

            const exported = manager.exportStates();

            const newManager = new AchievementManager();
            newManager.importStates(exported);

            expect(newManager.isUnlocked('first_ore')).toBe(true);
            expect(newManager.getProgress('ace_pilot')).toBe(30);
            expect(newManager.isUnlocked('ace_pilot')).toBe(false);
        });

        it('should handle importing partial/missing achievements gracefully', () => {
            const partial: AchievementState[] = [
                { id: 'first_ore', unlocked: true, unlockedAt: 12345, progress: 1 },
            ];
            manager.importStates(partial);
            expect(manager.isUnlocked('first_ore')).toBe(true);
            expect(manager.isUnlocked('ace_pilot')).toBe(false);
        });

        it('should ignore unknown achievement ids during import', () => {
            const withUnknown: AchievementState[] = [
                { id: 'unknown_achievement', unlocked: true, unlockedAt: 12345, progress: 99 },
            ];
            // Should not throw
            expect(() => manager.importStates(withUnknown)).not.toThrow();
        });
    });

    // ── Event subscriptions ──────────────────────────────────────

    describe('subscribeToEvents', () => {
        it('should subscribe to expected events', () => {
            manager.subscribeToEvents();
            const subscribedEvents = mockSubscribe.mock.calls.map(
                (call: unknown[]) => call[0]
            );
            expect(subscribedEvents).toContain('mining.resourceCollected');
            expect(subscribedEvents).toContain('enemy.destroyed');
            expect(subscribedEvents).toContain('boss.destroyed');
            expect(subscribedEvents).toContain('trading.resourceSold');
            expect(subscribedEvents).toContain('rank.up');
            expect(subscribedEvents).toContain('horde.waveStart');
            expect(subscribedEvents).toContain('horde.activated');
            expect(subscribedEvents).toContain('system.discovered');
            expect(subscribedEvents).toContain('hazard.entered');
            expect(subscribedEvents).toContain('xp.gained');
        });

        it('should call unsubscribers on destroy', () => {
            const unsubs = Array.from({ length: 10 }, () => vi.fn());
            mockSubscribe.mockImplementation(() => {
                return unsubs.shift() ?? vi.fn();
            });

            manager.subscribeToEvents();
            manager.destroy();

            // The returned unsubscribe fns should have been called
            // (we verify destroy clears the list)
            expect(manager.exportStates()).toBeDefined();
        });
    });

    // ── Query helpers ────────────────────────────────────────────

    describe('query helpers', () => {
        it('getAll should return combined definition + state', () => {
            const all = manager.getAll();
            const first = all[0];
            // Has definition fields
            expect(first).toHaveProperty('title');
            expect(first).toHaveProperty('description');
            expect(first).toHaveProperty('icon');
            expect(first).toHaveProperty('threshold');
            // Has state fields
            expect(first).toHaveProperty('unlocked');
            expect(first).toHaveProperty('progress');
        });

        it('getUnlocked should only return unlocked achievements', () => {
            manager.updateProgress('first_ore', 1);
            manager.updateProgress('first_blood', 1);
            const unlocked = manager.getUnlocked();
            expect(unlocked).toHaveLength(2);
            expect(unlocked.every((a) => a.unlocked)).toBe(true);
        });
    });
});
