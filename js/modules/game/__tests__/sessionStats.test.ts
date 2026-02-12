import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SessionStats } from '../sessionStats';
import { mainMessageBus } from '../../../globals/messageBus';

// Mock mainMessageBus
vi.mock('../../../globals/messageBus', () => ({
    mainMessageBus: {
        subscribe: vi.fn(() => vi.fn()),
        publish: vi.fn(),
    }
}));

describe('SessionStats', () => {
    let sessionStats: SessionStats;

    beforeEach(() => {
        vi.clearAllMocks();
        sessionStats = new SessionStats();
    });

    it('should initialize with default values', () => {
        const stats = sessionStats.getStats();
        expect(stats.enemiesDestroyed).toBe(0);
        expect(stats.distanceTraveled).toBe(0);
        expect(stats.creditsEarned).toBe(0);
        expect(stats.lowestHullHP).toBe(100);
    });

    it('should track enemies destroyed via events', () => {
        // Find the callback for enemy.destroyed
        const subscribeCalls = (mainMessageBus.subscribe as any).mock.calls;
        const enemyDestroyedSub = subscribeCalls.find((call: any) => call[0] === 'enemy.destroyed');
        const callback = enemyDestroyedSub[1];

        callback({ type: 'enemy.destroyed', data: { entityId: '123' } });
        callback({ type: 'enemy.destroyed', data: { entityId: '456' } });

        const stats = sessionStats.getStats();
        expect(stats.enemiesDestroyed).toBe(2);
    });

    it('should track damage dealt via events', () => {
        const subscribeCalls = (mainMessageBus.subscribe as any).mock.calls;
        const enemyDamagedSub = subscribeCalls.find((call: any) => call[0] === 'enemy.damaged');
        const callback = enemyDamagedSub[1];

        callback({ type: 'enemy.damaged', data: { entityId: 1, amount: 50, source: 'player' } });
        callback({ type: 'enemy.damaged', data: { entityId: 2, amount: 30, source: 'player' } });
        // Should ignore non-player damage
        callback({ type: 'enemy.damaged', data: { entityId: 1, amount: 10, source: 'other' } });

        const stats = sessionStats.getStats();
        expect(stats.damageDealt).toBe(80);
    });

    it('should track distance traveled when spaceship moves', () => {
        const mockSpaceship = {
            position: { x: 0, y: 0, z: 0 },
            credits: 1000,
            cargo: { iron: 0, gold: 0, platinum: 0 },
            hull: 100,
            isDocked: false
        } as any;

        sessionStats.setSpaceship(mockSpaceship);
        
        // Move spaceship
        mockSpaceship.position = { x: 10, y: 0, z: 0 };
        sessionStats.update();

        mockSpaceship.position = { x: 10, y: 20, z: 0 };
        sessionStats.update();

        const stats = sessionStats.getStats();
        expect(stats.distanceTraveled).toBe(30);
    });

    it('should track lowest hull HP', () => {
        const mockSpaceship = {
            position: { x: 0, y: 0, z: 0 },
            credits: 1000,
            cargo: { iron: 0, gold: 0, platinum: 0 },
            hull: 100,
            isDocked: false
        } as any;

        sessionStats.setSpaceship(mockSpaceship);
        
        mockSpaceship.hull = 80;
        sessionStats.update();

        mockSpaceship.hull = 40;
        sessionStats.update();

        mockSpaceship.hull = 60; // Should stay at 40
        sessionStats.update();

        const stats = sessionStats.getStats();
        expect(stats.lowestHullHP).toBe(40);
    });

    it('should track credits earned', () => {
        const mockSpaceship = {
            position: { x: 0, y: 0, z: 0 },
            credits: 1000,
            cargo: { iron: 0, gold: 0, platinum: 0 },
            hull: 100,
            isDocked: false
        } as any;

        sessionStats.setSpaceship(mockSpaceship);
        
        mockSpaceship.credits = 1200; // +200
        sessionStats.update();

        mockSpaceship.credits = 1100; // -100 (spent, not earned)
        sessionStats.update();

        mockSpaceship.credits = 1400; // +300
        sessionStats.update();

        const stats = sessionStats.getStats();
        expect(stats.creditsEarned).toBe(500);
    });
});
