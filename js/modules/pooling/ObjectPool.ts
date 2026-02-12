import { debugLog } from '../../globals/debug.ts';
/**
 * Generic object pool for managing reusable objects
 *
 * This class provides a way to reuse objects instead of creating and destroying them,
 * which improves performance by reducing garbage collection.
 */

type PerfPools = {
    hits: number;
    misses: number;
};

type PerfState = {
    pools?: PerfPools;
};

function updatePerf(deltaHits: number, deltaMisses: number): void {
    if (!window.__perf) return;
    const prev = (window.__perf as PerfState).pools || { hits: 0, misses: 0 };
    (window.__perf as PerfState).pools = {
        hits: prev.hits + deltaHits,
        misses: prev.misses + deltaMisses
    };
}

export class ObjectPool<T> {
    private createFn: () => T;
    private resetFn: (object: T) => void;
    private expandSize: number;
    pool: T[];
    active: Set<T>;

    /**
     * Create a new ObjectPool
     * @param createFn - Factory function to create new instances
     * @param resetFn - Function to reset an object to its initial state
     * @param initialSize - Initial size of the pool
     * @param expandSize - Number of objects to add when the pool is empty
     */
    constructor(createFn: () => T, resetFn: (object: T) => void, initialSize = 20, expandSize = 10) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.expandSize = expandSize;
        this.pool = [];
        this.active = new Set();

        // Pre-populate the pool with initial objects
        this.expand(initialSize);

        debugLog(`ObjectPool created with ${initialSize} objects`);
    }

    /**
     * Get an object from the pool or create a new one if the pool is empty
     * @returns An object from the pool
     */
    get(): T {
        if (this.pool.length === 0) {
            debugLog(`Pool empty, expanding by ${this.expandSize} objects`);
            this.expand(this.expandSize);
        }

        const object = this.pool.pop() ?? this.createFn();

        // Add to active set
        this.active.add(object);

        updatePerf(1, 0);

        return object;
    }

    /**
     * Return an object to the pool
     * @param object - Object to return to the pool
     */
    release(object: T): void {
        // Skip if object is not in active set
        if (!this.active.has(object)) {
            return;
        }

        // Reset the object
        this.resetFn(object);

        // Remove from active set
        this.active.delete(object);

        // Add back to pool
        this.pool.push(object);
    }

    /**
     * Expand the pool by creating new objects
     * @param count - Number of objects to add to the pool
     */
    expand(count: number): void {
        for (let i = 0; i < count; i++) {
            const object = this.createFn();
            this.pool.push(object);
        }
        updatePerf(0, count);
    }

    /**
     * Get the number of available objects in the pool
     * @returns Count of available objects
     */
    availableCount(): number {
        return this.pool.length;
    }

    /**
     * Get the number of active objects from this pool
     * @returns Count of active objects
     */
    activeCount(): number {
        return this.active.size;
    }

    /**
     * Release all active objects back to the pool
     */
    releaseAll(): void {
        // Create a copy of the active set to avoid modification during iteration
        const activeObjects = Array.from(this.active);

        // Release each active object
        for (const object of activeObjects) {
            this.release(object);
        }
    }

    /**
     * Clear the pool and dispose all objects
     * @param disposeFn - Function to dispose an object
     */
    dispose(disposeFn?: (object: T) => void): void {
        // Dispose all objects in the pool
        if (disposeFn) {
            // Dispose active objects first
            for (const object of this.active) {
                disposeFn(object);
            }

            // Then dispose pooled objects
            for (const object of this.pool) {
                disposeFn(object);
            }
        }

        // Clear the pool and active set
        this.active.clear();
        this.pool = [];
    }
}
