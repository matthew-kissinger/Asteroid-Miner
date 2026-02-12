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

import { MissionManager } from '../missions';
import type { MissionSaveData, MissionDefinition } from '../missions';
import { mainMessageBus } from '../../../globals/messageBus';

const mockSubscribe = vi.mocked(mainMessageBus.subscribe);
const mockPublish = vi.mocked(mainMessageBus.publish);

describe('MissionManager', () => {
    let manager: MissionManager;

    beforeEach(() => {
        vi.clearAllMocks();
        manager = new MissionManager();
    });

    // ── Generation ────────────────────────────────────────────────

    describe('mission generation', () => {
        it('should generate 3 available missions on construction', () => {
            const missions = manager.getAvailableMissions();
            expect(missions).toHaveLength(3);
        });

        it('should generate one mission per category', () => {
            const missions = manager.getAvailableMissions();
            const categories = missions.map(m => m.category);
            expect(categories).toContain('mining');
            expect(categories).toContain('combat');
            expect(categories).toContain('trade');
        });

        it('should generate missions with valid properties', () => {
            const missions = manager.getAvailableMissions();
            for (const m of missions) {
                expect(m.id).toBeTruthy();
                expect(m.title).toBeTruthy();
                expect(m.description).toBeTruthy();
                expect(m.targetAmount).toBeGreaterThan(0);
                expect(m.creditReward).toBeGreaterThan(0);
                expect(m.currentProgress).toBe(0);
                expect(m.status).toBe('available');
                expect(m.startedAt).toBeNull();
            }
        });

        it('should assign time limit to combat missions', () => {
            const missions = manager.getAvailableMissions();
            const combat = missions.find(m => m.category === 'combat');
            expect(combat?.timeLimit).toBe(600);
        });

        it('should not assign time limit to mining missions', () => {
            const missions = manager.getAvailableMissions();
            const mining = missions.find(m => m.category === 'mining');
            expect(mining?.timeLimit).toBeNull();
        });
    });

    // ── Accept / Cancel ───────────────────────────────────────────

    describe('accepting missions', () => {
        it('should accept an available mission', () => {
            const missions = manager.getAvailableMissions();
            const missionId = missions[0].id;

            const result = manager.acceptMission(missionId);
            expect(result).toBe(true);
            expect(manager.getActiveMission()).not.toBeNull();
            expect(manager.getActiveMission()?.id).toBe(missionId);
            expect(manager.getActiveMission()?.status).toBe('active');
        });

        it('should remove accepted mission from available list', () => {
            const missions = manager.getAvailableMissions();
            const missionId = missions[0].id;

            manager.acceptMission(missionId);
            expect(manager.getAvailableMissions()).toHaveLength(2);
        });

        it('should reject accepting when a mission is already active', () => {
            const missions = manager.getAvailableMissions();
            manager.acceptMission(missions[0].id);

            const result = manager.acceptMission(missions[1].id);
            expect(result).toBe(false);
            expect(manager.getActiveMission()?.id).toBe(missions[0].id);
        });

        it('should reject accepting a non-existent mission', () => {
            const result = manager.acceptMission('fake-id');
            expect(result).toBe(false);
        });

        it('should set startedAt when accepting', () => {
            const missions = manager.getAvailableMissions();
            const before = Date.now();
            manager.acceptMission(missions[0].id);
            const after = Date.now();

            const active = manager.getActiveMission();
            expect(active?.startedAt).toBeGreaterThanOrEqual(before);
            expect(active?.startedAt).toBeLessThanOrEqual(after);
        });
    });

    describe('cancelling missions', () => {
        it('should cancel the active mission', () => {
            const missions = manager.getAvailableMissions();
            manager.acceptMission(missions[0].id);

            manager.cancelMission();
            expect(manager.getActiveMission()).toBeNull();
        });

        it('should be safe to cancel when no mission is active', () => {
            expect(() => manager.cancelMission()).not.toThrow();
        });
    });

    // ── Progress tracking ─────────────────────────────────────────

    describe('progress tracking', () => {
        it('should track mining progress via event handler', () => {
            const missions = manager.getAvailableMissions();
            const mining = missions.find(m => m.category === 'mining')!;
            manager.acceptMission(mining.id);

            // Subscribe to events
            manager.subscribeToEvents();

            // Find the mining callback
            const miningCall = mockSubscribe.mock.calls.find(
                call => call[0] === 'mining.resourceCollected'
            );
            expect(miningCall).toBeDefined();

            const callback = miningCall![1];
            const resource = mining.targetResource ?? 'iron';

            // Simulate mining event
            callback({
                type: 'mining.resourceCollected',
                data: { amount: 1, resourceType: resource },
                timestamp: Date.now(),
            });

            expect(manager.getActiveMission()?.currentProgress).toBe(1);
        });

        it('should track combat progress via event handler', () => {
            const missions = manager.getAvailableMissions();
            const combat = missions.find(m => m.category === 'combat')!;
            manager.acceptMission(combat.id);

            manager.subscribeToEvents();

            const combatCall = mockSubscribe.mock.calls.find(
                call => call[0] === 'enemy.destroyed'
            );
            const callback = combatCall![1];

            callback({
                type: 'enemy.destroyed',
                data: { entityId: 1 },
                timestamp: Date.now(),
            });

            expect(manager.getActiveMission()?.currentProgress).toBe(1);
        });

        it('should track trade progress via event handler', () => {
            const missions = manager.getAvailableMissions();
            const trade = missions.find(m => m.category === 'trade')!;
            manager.acceptMission(trade.id);

            manager.subscribeToEvents();

            const tradeCall = mockSubscribe.mock.calls.find(
                call => call[0] === 'trading.resourceSold'
            );
            const callback = tradeCall![1];

            // Selling 5 gold = 250 credits
            callback({
                type: 'trading.resourceSold',
                data: { amount: 5, resourceType: 'gold' },
                timestamp: Date.now(),
            });

            expect(manager.getActiveMission()?.currentProgress).toBe(250);
        });

        it('should ignore mining events for wrong resource type', () => {
            const missions = manager.getAvailableMissions();
            const mining = missions.find(m => m.category === 'mining')!;
            manager.acceptMission(mining.id);

            manager.subscribeToEvents();

            const miningCall = mockSubscribe.mock.calls.find(
                call => call[0] === 'mining.resourceCollected'
            );
            const callback = miningCall![1];

            // Send wrong resource type
            const wrongResource = mining.targetResource === 'iron' ? 'gold' : 'iron';
            callback({
                type: 'mining.resourceCollected',
                data: { amount: 5, resourceType: wrongResource },
                timestamp: Date.now(),
            });

            expect(manager.getActiveMission()?.currentProgress).toBe(0);
        });

        it('should ignore events when no mission is active', () => {
            manager.subscribeToEvents();

            const combatCall = mockSubscribe.mock.calls.find(
                call => call[0] === 'enemy.destroyed'
            );
            const callback = combatCall![1];

            // Should not throw
            expect(() => {
                callback({
                    type: 'enemy.destroyed',
                    data: { entityId: 1 },
                    timestamp: Date.now(),
                });
            }).not.toThrow();
        });
    });

    // ── Completion ────────────────────────────────────────────────

    describe('mission completion', () => {
        it('should complete mission when target reached', () => {
            const missions = manager.getAvailableMissions();
            const combat = missions.find(m => m.category === 'combat')!;
            manager.acceptMission(combat.id);

            manager.subscribeToEvents();

            const combatCall = mockSubscribe.mock.calls.find(
                call => call[0] === 'enemy.destroyed'
            );
            const callback = combatCall![1];

            // Destroy enough enemies
            for (let i = 0; i < combat.targetAmount; i++) {
                callback({
                    type: 'enemy.destroyed',
                    data: { entityId: i },
                    timestamp: Date.now(),
                });
            }

            expect(manager.getActiveMission()).toBeNull();
            expect(manager.getCompletedCount()).toBe(1);
        });

        it('should award credits to spaceship on completion', () => {
            const spaceship = { credits: 1000 };
            manager.setSpaceship(spaceship);

            const missions = manager.getAvailableMissions();
            const combat = missions.find(m => m.category === 'combat')!;
            const expectedReward = combat.creditReward;
            manager.acceptMission(combat.id);

            manager.subscribeToEvents();

            const combatCall = mockSubscribe.mock.calls.find(
                call => call[0] === 'enemy.destroyed'
            );
            const callback = combatCall![1];

            for (let i = 0; i < combat.targetAmount; i++) {
                callback({
                    type: 'enemy.destroyed',
                    data: { entityId: i },
                    timestamp: Date.now(),
                });
            }

            expect(spaceship.credits).toBe(1000 + expectedReward);
        });

        it('should publish notification on completion', () => {
            const missions = manager.getAvailableMissions();
            const combat = missions.find(m => m.category === 'combat')!;
            manager.acceptMission(combat.id);

            manager.subscribeToEvents();

            const combatCall = mockSubscribe.mock.calls.find(
                call => call[0] === 'enemy.destroyed'
            );
            const callback = combatCall![1];

            for (let i = 0; i < combat.targetAmount; i++) {
                callback({
                    type: 'enemy.destroyed',
                    data: { entityId: i },
                    timestamp: Date.now(),
                });
            }

            expect(mockPublish).toHaveBeenCalledWith(
                'ui.notification',
                expect.objectContaining({ message: expect.stringContaining('Mission Complete') })
            );
        });

        it('should track totalCreditsEarned across completions', () => {
            const spaceship = { credits: 10000 };
            manager.setSpaceship(spaceship);

            manager.subscribeToEvents();
            const combatCall = mockSubscribe.mock.calls.find(
                call => call[0] === 'enemy.destroyed'
            );
            const callback = combatCall![1];

            const missions = manager.getAvailableMissions();
            const combat = missions.find(m => m.category === 'combat')!;
            manager.acceptMission(combat.id);

            const firstReward = combat.creditReward;
            for (let i = 0; i < combat.targetAmount; i++) {
                callback({
                    type: 'enemy.destroyed',
                    data: { entityId: i },
                    timestamp: Date.now(),
                });
            }

            expect(manager.getTotalCreditsEarned()).toBe(firstReward);
        });
    });

    // ── Expiry ────────────────────────────────────────────────────

    describe('mission expiry', () => {
        it('should expire timed missions', () => {
            const missions = manager.getAvailableMissions();
            const combat = missions.find(m => m.category === 'combat')!;
            manager.acceptMission(combat.id);

            // Manually set startedAt to the past
            const active = manager.getActiveMission()!;
            active.startedAt = Date.now() - (combat.timeLimit! + 1) * 1000;

            manager.checkExpiry();
            expect(manager.getActiveMission()).toBeNull();
        });

        it('should not expire missions without time limit', () => {
            const missions = manager.getAvailableMissions();
            const mining = missions.find(m => m.category === 'mining')!;
            manager.acceptMission(mining.id);

            manager.checkExpiry();
            expect(manager.getActiveMission()).not.toBeNull();
        });
    });

    // ── Dock behavior ─────────────────────────────────────────────

    describe('docking behavior', () => {
        it('should regenerate missions on dock when no active mission', () => {
            const originalIds = manager.getAvailableMissions().map(m => m.id);
            manager.onDock();
            const newIds = manager.getAvailableMissions().map(m => m.id);

            // New IDs should be generated (extremely unlikely to match)
            expect(newIds).not.toEqual(originalIds);
        });

        it('should not regenerate missions on dock when mission is active', () => {
            const missions = manager.getAvailableMissions();
            manager.acceptMission(missions[0].id);

            const remainingBefore = manager.getAvailableMissions().map(m => m.id);
            manager.onDock();
            const remainingAfter = manager.getAvailableMissions().map(m => m.id);

            expect(remainingAfter).toEqual(remainingBefore);
        });
    });

    // ── Update callback ───────────────────────────────────────────

    describe('update callback', () => {
        it('should call onMissionUpdate when missions change', () => {
            const callback = vi.fn();
            manager.setOnMissionUpdate(callback);

            const missions = manager.getAvailableMissions();
            manager.acceptMission(missions[0].id);

            expect(callback).toHaveBeenCalled();
        });
    });

    // ── Persistence ───────────────────────────────────────────────

    describe('save/load', () => {
        it('should export state', () => {
            const state = manager.exportState();
            expect(state.availableMissions).toHaveLength(3);
            expect(state.activeMission).toBeNull();
            expect(state.completedCount).toBe(0);
            expect(state.totalCreditsEarned).toBe(0);
        });

        it('should import state', () => {
            const missions = manager.getAvailableMissions();
            manager.acceptMission(missions[0].id);

            const exported = manager.exportState();

            const newManager = new MissionManager();
            newManager.importState(exported);

            expect(newManager.getActiveMission()?.id).toBe(missions[0].id);
            expect(newManager.getAvailableMissions()).toHaveLength(2);
        });

        it('should handle importing empty/partial state', () => {
            const emptyState: MissionSaveData = {
                availableMissions: [],
                activeMission: null,
                completedCount: 5,
                totalCreditsEarned: 2500,
            };

            manager.importState(emptyState);
            expect(manager.getAvailableMissions()).toHaveLength(0);
            expect(manager.getCompletedCount()).toBe(5);
            expect(manager.getTotalCreditsEarned()).toBe(2500);
        });
    });

    // ── Event subscriptions ───────────────────────────────────────

    describe('event subscriptions', () => {
        it('should subscribe to 4 events', () => {
            manager.subscribeToEvents();
            expect(mockSubscribe).toHaveBeenCalledTimes(4);
        });

        it('should subscribe to correct event types', () => {
            manager.subscribeToEvents();
            const eventNames = mockSubscribe.mock.calls.map(c => c[0]);
            expect(eventNames).toContain('mining.resourceCollected');
            expect(eventNames).toContain('enemy.destroyed');
            expect(eventNames).toContain('trading.resourceSold');
            expect(eventNames).toContain('player.docked');
        });
    });

    // ── Destroy ───────────────────────────────────────────────────

    describe('destroy', () => {
        it('should unsubscribe all event listeners', () => {
            const unsub1 = vi.fn();
            const unsub2 = vi.fn();
            const unsub3 = vi.fn();
            const unsub4 = vi.fn();
            mockSubscribe
                .mockReturnValueOnce(unsub1)
                .mockReturnValueOnce(unsub2)
                .mockReturnValueOnce(unsub3)
                .mockReturnValueOnce(unsub4);

            manager.subscribeToEvents();
            manager.destroy();

            expect(unsub1).toHaveBeenCalled();
            expect(unsub2).toHaveBeenCalled();
            expect(unsub3).toHaveBeenCalled();
            expect(unsub4).toHaveBeenCalled();
        });
    });
});
