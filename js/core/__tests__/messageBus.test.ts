import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MessageBus } from '../messageBus';
import type { GameEventMap } from '../events';

describe('MessageBus', () => {
    let messageBus: MessageBus<GameEventMap>;

    beforeEach(() => {
        // Clear global registries before each test
        delete (globalThis as any).mainMessageBus;
        delete (globalThis as any).messageRegistry;
        
        // Mock window if it doesn't exist (node environment)
        if (typeof (globalThis as any).window === 'undefined') {
            (globalThis as any).window = {};
        }
        delete (globalThis as any).window.game;

        messageBus = new MessageBus<GameEventMap>();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should initialize and register itself globally', () => {
        expect((globalThis as any).mainMessageBus).toBe(messageBus);
        expect((globalThis as any).messageRegistry.has(messageBus)).toBe(true);
    });

    it('should subscribe to and publish events', () => {
        const callback = vi.fn();
        messageBus.subscribe('ui.notification', callback);

        const data = { message: 'Test message', type: 'info' as const };
        messageBus.publish('ui.notification', data);

        expect(callback).toHaveBeenCalledTimes(1);
        const call = callback.mock.calls[0][0];
        expect(call.type).toBe('ui.notification');
        expect(call.data).toEqual(data);
        expect(call.timestamp).toBeDefined();
    });

    it('should support multiple subscribers for the same event', () => {
        const callback1 = vi.fn();
        const callback2 = vi.fn();
        
        messageBus.subscribe('world.initialized', callback1);
        messageBus.subscribe('world.initialized', callback2);

        messageBus.publish('world.initialized', {});

        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('should unsubscribe correctly', () => {
        const callback = vi.fn();
        const unsubscribe = messageBus.subscribe('player.levelup', callback);

        messageBus.publish('player.levelup', {});
        expect(callback).toHaveBeenCalledTimes(1);

        unsubscribe();
        messageBus.publish('player.levelup', {});
        expect(callback).toHaveBeenCalledTimes(1); // Still 1
    });

    it('should unsubscribe via unsubscribe method', () => {
        const callback = vi.fn();
        messageBus.subscribe('player.levelup', callback);

        messageBus.publish('player.levelup', {});
        expect(callback).toHaveBeenCalledTimes(1);

        messageBus.unsubscribe('player.levelup', callback);
        messageBus.publish('player.levelup', {});
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should isolate events', () => {
        const callbackA = vi.fn();
        const callbackB = vi.fn();

        messageBus.subscribe('intro.completed', callbackA);
        messageBus.subscribe('world.initialized', callbackB);

        messageBus.publish('intro.completed', {});

        expect(callbackA).toHaveBeenCalled();
        expect(callbackB).not.toHaveBeenCalled();
    });

    it('should handle unsubscription during handler execution', () => {
        const callback1 = vi.fn(() => {
            messageBus.unsubscribe('world.initialized', callback1);
        });
        const callback2 = vi.fn();

        messageBus.subscribe('world.initialized', callback1);
        messageBus.subscribe('world.initialized', callback2);

        messageBus.publish('world.initialized', {});

        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback2).toHaveBeenCalledTimes(1);

        messageBus.publish('world.initialized', {});
        expect(callback1).toHaveBeenCalledTimes(1); // Not called again
        expect(callback2).toHaveBeenCalledTimes(2);
    });

    it('should not throw when publishing with no subscribers', () => {
        expect(() => {
            messageBus.publish('world.initialized', {});
        }).not.toThrow();
    });

    it('should handle subscribing the same handler twice', () => {
        const callback = vi.fn();
        messageBus.subscribe('world.initialized', callback);
        messageBus.subscribe('world.initialized', callback);

        messageBus.publish('world.initialized', {});
        expect(callback).toHaveBeenCalledTimes(2);

        messageBus.unsubscribe('world.initialized', callback);
        messageBus.publish('world.initialized', {});
        expect(callback).toHaveBeenCalledTimes(3); // One listener remains
    });

    it('should prevent other handlers from being blocked by an error', () => {
        const errorCallback = vi.fn(() => {
            throw new Error('Test error');
        });
        const normalCallback = vi.fn();

        messageBus.subscribe('world.initialized', errorCallback);
        messageBus.subscribe('world.initialized', normalCallback);

        // Should not throw
        messageBus.publish('world.initialized', {});

        expect(errorCallback).toHaveBeenCalled();
        expect(normalCallback).toHaveBeenCalled();
    });

    it('should queue messages if published during dispatch', () => {
        const results: string[] = [];
        
        messageBus.subscribe('world.initialized', () => {
            results.push('first');
            messageBus.publish('intro.completed', {});
            results.push('after-inner-publish');
        });

        messageBus.subscribe('intro.completed', () => {
            results.push('second');
        });

        messageBus.publish('world.initialized', {});

        // Because of the queuing mechanism, 'second' should come AFTER 'after-inner-publish'
        expect(results).toEqual(['first', 'after-inner-publish', 'second']);
    });

    it('should use fastPublish for high-frequency events', () => {
        const callback = vi.fn();
        // 'transform.updated' is in highFrequencyTypes
        messageBus.subscribe('transform.updated', callback);
        
        const spy = vi.spyOn(messageBus, 'fastPublish');
        
        messageBus.publish('transform.updated', { entity: 1 });
        
        expect(spy).toHaveBeenCalled();
        expect(callback).toHaveBeenCalled();
    });

    it('should handle game.over event special logic', () => {
        const callback = vi.fn();
        messageBus.subscribe('game.over', callback);

        // Mock window.game.gameOver
        const gameOverMock = vi.fn();
        (globalThis as any).window.game = {
            gameOver: gameOverMock
        };

        const gameOverData = { reason: 'Test game over', source: 'test' };
        messageBus.publish('game.over', gameOverData);

        expect(callback).toHaveBeenCalledTimes(1);
        expect(gameOverMock).not.toHaveBeenCalled(); // Should not call if listeners exist
    });

    it('should call window.game.gameOver as fallback if no listeners for game.over', () => {
        // Mock window.game.gameOver
        const gameOverMock = vi.fn();
        (globalThis as any).window.game = {
            gameOver: gameOverMock
        };

        const gameOverData = { reason: 'Test game over', source: 'test' };
        messageBus.publish('game.over', gameOverData);

        expect(gameOverMock).toHaveBeenCalledWith('Test game over');
    });

    it('should trigger game over via static method', () => {
        const callback = vi.fn();
        messageBus.subscribe('game.over', callback);

        MessageBus.triggerGameOver('static reason', 'static source');

        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith(expect.objectContaining({
            data: { reason: 'static reason', source: 'static source' }
        }));
    });
});
