import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ObjectPool } from '../ObjectPool';
import { PoolRegistry, getGlobalPoolRegistry } from '../PoolRegistry';

describe('ObjectPool', () => {
    let pool: ObjectPool<any>;
    const createFn = vi.fn(() => ({ id: Math.random(), val: 0 }));
    const resetFn = vi.fn((obj) => { obj.val = 0; });

    beforeEach(() => {
        (globalThis as any).window = globalThis;
        (globalThis as any).__perf = {};
        createFn.mockClear();
        resetFn.mockClear();
        pool = new ObjectPool(createFn, resetFn, 5, 3);
    });

    afterEach(() => {
        delete (globalThis as any).__perf;
    });

    it('should pre-populate the pool in constructor', () => {
        expect(createFn).toHaveBeenCalledTimes(5);
        expect(pool.availableCount()).toBe(5);
        expect(pool.activeCount()).toBe(0);
    });

    it('should return an object from the pool when get() is called', () => {
        const obj = pool.get();
        expect(obj).toBeDefined();
        expect(pool.availableCount()).toBe(4);
        expect(pool.activeCount()).toBe(1);
        expect(pool.active.has(obj)).toBe(true);
    });

    it('should expand the pool when get() is called and pool is empty', () => {
        // Exhaust initial pool
        for (let i = 0; i < 5; i++) pool.get();
        
        expect(pool.availableCount()).toBe(0);
        
        pool.get(); // Should trigger expand(3)
        expect(createFn).toHaveBeenCalledTimes(5 + 3);
        expect(pool.availableCount()).toBe(2); // 3 created - 1 returned
        expect(pool.activeCount()).toBe(6);
    });

    it('should reset and return object to pool when release() is called', () => {
        const obj = pool.get();
        obj.val = 10;
        
        pool.release(obj);
        
        expect(resetFn).toHaveBeenCalledWith(obj);
        expect(obj.val).toBe(0);
        expect(pool.availableCount()).toBe(5);
        expect(pool.activeCount()).toBe(0);
        expect(pool.pool).toContain(obj);
    });

    it('should ignore objects not in active set when release() is called', () => {
        const externalObj = { id: 'external' };
        pool.release(externalObj);
        
        expect(resetFn).not.toHaveBeenCalled();
        expect(pool.availableCount()).toBe(5);
        expect(pool.activeCount()).toBe(0);
    });

    it('should release all active objects back to pool when releaseAll() is called', () => {
        pool.get();
        pool.get();
        pool.get();
        expect(pool.activeCount()).toBe(3);
        
        pool.releaseAll();
        
        expect(pool.activeCount()).toBe(0);
        expect(pool.availableCount()).toBe(5);
        expect(resetFn).toHaveBeenCalledTimes(3);
    });

    it('should add objects to pool when expand() is called', () => {
        pool.expand(10);
        expect(pool.availableCount()).toBe(15); // 5 + 10
        expect(createFn).toHaveBeenCalledTimes(15);
    });

    it('should clear pool and active set when dispose() is called', () => {
        pool.get();
        pool.dispose();
        
        expect(pool.availableCount()).toBe(0);
        expect(pool.activeCount()).toBe(0);
    });

    it('should call disposeFn for all objects when dispose(fn) is called', () => {
        const disposeFn = vi.fn();
        const activeObj = pool.get();
        const pooledObjs = [...pool.pool];
        
        pool.dispose(disposeFn);
        
        expect(disposeFn).toHaveBeenCalledTimes(5);
        expect(disposeFn).toHaveBeenCalledWith(activeObj);
        pooledObjs.forEach(obj => expect(disposeFn).toHaveBeenCalledWith(obj));
    });

    it('should update performance stats on get and expand', () => {
        // constructor calls expand(5) -> misses +5
        expect((globalThis as any).__perf.pools.misses).toBe(5);
        
        pool.get(); // hits +1
        expect((globalThis as any).__perf.pools.hits).toBe(1);
        
        pool.expand(2); // misses +2
        expect((globalThis as any).__perf.pools.misses).toBe(7);
    });
});

describe('PoolRegistry', () => {
    let registry: PoolRegistry;

    beforeEach(() => {
        (globalThis as any).window = globalThis;
        (globalThis as any).__perf = {};
        registry = new PoolRegistry();
    });

    afterEach(() => {
        delete (globalThis as any).__perf;
        delete (globalThis as any).poolRegistry;
    });

    it('should register a new pool', () => {
        const factory = vi.fn(() => ({}));
        registry.register('test', { factory, preallocate: 2 });
        
        expect(factory).toHaveBeenCalledTimes(2);
        expect(registry.typeToPool.has('test')).toBe(true);
        expect(registry.stats().misses).toBe(2);
    });

    it('should return existing pool if already registered', () => {
        const factory = vi.fn(() => ({}));
        const p1 = registry.register('test', { factory });
        const p2 = registry.register('test', { factory });
        
        expect(p1).toBe(p2);
        expect(factory).toHaveBeenCalledTimes(0); // preallocate defaults to 0
    });

    it('should get an object from pool', () => {
        registry.register('test', { factory: () => ({ name: 'item' }), preallocate: 1 });
        
        const obj = registry.get<any>('test');
        expect(obj.name).toBe('item');
        expect(registry.stats().hits).toBe(1);
    });

    it('should create new object if pool is empty', () => {
        registry.register('test', { factory: () => ({ name: 'new' }) });
        
        const obj = registry.get<any>('test');
        expect(obj.name).toBe('new');
        expect(registry.stats().misses).toBe(1);
    });

    it('should throw error when getting unknown type', () => {
        expect(() => registry.get('unknown')).toThrow(/unknown type/);
    });

    it('should reset object on get if it has a reset method', () => {
        const reset = vi.fn();
        registry.register('test', { factory: () => ({ reset }) });
        
        registry.get('test', 'arg1', 123);
        expect(reset).toHaveBeenCalledWith('arg1', 123);
    });

    it('should call pool reset function on get if object has no reset method', () => {
        const reset = vi.fn();
        const obj = { id: 1 };
        registry.register('test', { factory: () => obj, reset });
        
        registry.get('test', 'arg1');
        expect(reset).toHaveBeenCalledWith(obj, 'arg1');
    });

    it('should release object back to pool', () => {
        registry.register('test', { factory: () => ({}) });
        const obj = registry.get('test');
        
        registry.release('test', obj);
        
        const pool = registry.typeToPool.get('test') as any;
        expect(pool.objects).toContain(obj);
    });

    it('should call clear on object when released', () => {
        const clear = vi.fn();
        const obj = { clear };
        registry.register('test', { factory: () => obj });
        
        registry.release('test', obj);
        expect(clear).toHaveBeenCalled();
    });

    it('should not exceed maxSize when releasing', () => {
        registry.register('test', { factory: () => ({}), maxSize: 1 });
        const obj1 = registry.get('test');
        const obj2 = registry.get('test');
        
        registry.release('test', obj1);
        registry.release('test', obj2);
        
        const pool = registry.typeToPool.get('test') as any;
        expect(pool.objects.length).toBe(1);
    });

    it('should clear a specific pool', () => {
        registry.register('test', { factory: () => ({}), preallocate: 5 });
        registry.clear('test');
        
        const pool = registry.typeToPool.get('test') as any;
        expect(pool.objects.length).toBe(0);
    });

    it('should clear all pools', () => {
        registry.register('a', { factory: () => ({}), preallocate: 2 });
        registry.register('b', { factory: () => ({}), preallocate: 2 });
        
        registry.clearAll();
        
        expect((registry.typeToPool.get('a') as any).objects.length).toBe(0);
        expect((registry.typeToPool.get('b') as any).objects.length).toBe(0);
    });

    it('should provide global registry singleton', () => {
        const r1 = getGlobalPoolRegistry();
        const r2 = getGlobalPoolRegistry();
        expect(r1).toBe(r2);
        expect((globalThis as any).poolRegistry).toBe(r1);
    });

    it('should update performance stats', () => {
        registry.register('test', { factory: () => ({}) });
        registry.get('test');
        
        expect((globalThis as any).__perf.pools.misses).toBe(1);
    });
});
