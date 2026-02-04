import { getGlobalPoolRegistry } from '../modules/pooling/PoolRegistry.ts';
import { DEBUG_MODE } from './debug.js';

type PoolRegistry = {
    get: (type: string, ...args: unknown[]) => unknown;
    register: (type: string, config: { factory: () => unknown; reset?: (obj: unknown) => void; preallocate?: number; maxSize?: number }) => void;
    release: (type: string, obj: unknown) => void;
    clearAll?: () => void;
    typeToPool?: Map<string, { objects: unknown[]; maxSize: number }>;
    statsData?: { hits: number; misses: number };
};

type ObjectPoolFacade = {
    registry: PoolRegistry;
    get: (type: string, ...args: unknown[]) => unknown;
    release: (type: string, obj: unknown) => void;
    createPool: (type: string, factory: () => unknown, initialSize?: number, maxSize?: number) => void;
    getStats: (type: string) => { available: number; maxSize: number; hits: number; misses: number } | null;
    clearAllPools: () => void;
};

type GlobalWithObjectPool = { objectPool?: ObjectPoolFacade };

const globalWithObjectPool = globalThis as GlobalWithObjectPool;

export const objectPool: ObjectPoolFacade = globalWithObjectPool.objectPool ?? {
    registry: getGlobalPoolRegistry() as PoolRegistry,

    get(type, ...args) {
        try {
            return this.registry.get(type, ...args);
        } catch (e) {
            if (DEBUG_MODE.enabled) {
                console.log(`Creating on-demand pool: ${type}`);
            }
            this.registry.register(type, {
                factory: () => ({}),
                preallocate: 10,
                maxSize: 100
            });
            return this.registry.get(type, ...args);
        }
    },

    release(type, obj) {
        this.registry.release(type, obj);
    },

    createPool(type, factory, initialSize = 10, maxSize = 100) {
        this.registry.register(type, {
            factory,
            reset: (obj) => {
                if (obj && typeof obj === 'object' && 'reset' in obj && typeof (obj as { reset?: () => void }).reset === 'function') {
                    (obj as { reset: () => void }).reset();
                }
            },
            preallocate: initialSize,
            maxSize
        });
    },

    getStats(type) {
        if (this.registry.typeToPool && this.registry.typeToPool.has(type)) {
            const pool = this.registry.typeToPool.get(type);
            return {
                available: pool ? pool.objects.length : 0,
                maxSize: pool ? pool.maxSize : 0,
                hits: this.registry.statsData ? this.registry.statsData.hits : 0,
                misses: this.registry.statsData ? this.registry.statsData.misses : 0
            };
        }
        return null;
    },

    clearAllPools() {
        if (this.registry.clearAll) {
            this.registry.clearAll();
            return;
        }
        if (this.registry.typeToPool) {
            this.registry.typeToPool.forEach((pool) => {
                pool.objects = [];
            });
        }
    }
};

if (!globalWithObjectPool.objectPool) {
    globalWithObjectPool.objectPool = objectPool;
}
