// PoolRegistry.ts - unified pool manager with stats and preallocation

type PoolConfig<T> = {
    factory: () => T;
    reset?: (obj: T, ...args: unknown[]) => void;
    preallocate?: number;
    maxSize?: number;
};

type PoolEntry<T> = {
    objects: T[];
    factory: () => T;
    reset?: (obj: T, ...args: unknown[]) => void;
    maxSize: number;
};

type Resettable = {
    reset?: (...args: unknown[]) => void;
    clear?: () => void;
};

function isResettable(obj: unknown): obj is Resettable {
    return typeof obj === 'object' && obj !== null;
}

type PerfPools = {
    hits: number;
    misses: number;
};

type PerfState = {
    pools?: PerfPools;
};

export class PoolRegistry {
    typeToPool: Map<string, PoolEntry<unknown>>;
    statsData: { hits: number; misses: number };

    constructor() {
        this.typeToPool = new Map();
        this.statsData = { hits: 0, misses: 0 };
    }

    register<T>(type: string, { factory, reset, preallocate = 0, maxSize = Infinity }: PoolConfig<T>): PoolEntry<T> {
        if (!type) throw new Error('PoolRegistry.register requires a type');
        const existing = this.typeToPool.get(type) as PoolEntry<T> | undefined;
        if (existing) return existing;
        const pool: PoolEntry<T> = {
            objects: [],
            factory: factory || (() => ({} as T)),
            reset: reset || function noop() {},
            maxSize
        };
        for (let i = 0; i < preallocate; i++) {
            try {
                pool.objects.push(pool.factory());
            } catch {
                // Ignore failed allocations
            }
        }
        this.statsData.misses += preallocate;
        this.typeToPool.set(type, pool as PoolEntry<unknown>);
        return pool;
    }

    get<T>(type: string, ...args: unknown[]): T {
        const pool = this.typeToPool.get(type) as PoolEntry<T> | undefined;
        if (!pool) throw new Error(`PoolRegistry.get: unknown type '${type}'`);
        let obj: T;
        if (pool.objects.length > 0) {
            obj = pool.objects.pop() as T;
            this.statsData.hits += 1;
        } else {
            obj = pool.factory();
            this.statsData.misses += 1;
        }
        if (isResettable(obj) && typeof obj.reset === 'function') {
            obj.reset(...args);
        } else if (pool.reset) {
            try {
                pool.reset(obj, ...args);
            } catch {
                // Ignore reset errors
            }
        }
        this._flushPerf();
        return obj;
    }

    release<T>(type: string, obj: T): void {
        const pool = this.typeToPool.get(type) as PoolEntry<T> | undefined;
        if (!pool) return;
        if (isResettable(obj) && typeof obj.clear === 'function') {
            try {
                obj.clear();
            } catch {
                // Ignore clear errors
            }
        } else if (pool.reset) {
            try {
                pool.reset(obj);
            } catch {
                // Ignore reset errors
            }
        }
        if (pool.objects.length < pool.maxSize) {
            pool.objects.push(obj);
        }
    }

    clear(type: string): void {
        const pool = this.typeToPool.get(type);
        if (!pool) return;
        pool.objects.length = 0;
    }

    clearAll(): void {
        for (const [type] of this.typeToPool) this.clear(type);
    }

    stats(): { hits: number; misses: number } {
        return { hits: this.statsData.hits, misses: this.statsData.misses };
    }

    private _flushPerf(): void {
        if (window.__perf) {
            (window.__perf as PerfState).pools = { ...this.statsData };
        }
    }
}

// Create a global-friendly singleton when desired
export function getGlobalPoolRegistry(): PoolRegistry {
    const win = window as Window & { poolRegistry?: PoolRegistry };
    if (!win.poolRegistry) {
        win.poolRegistry = new PoolRegistry();
    }
    return win.poolRegistry;
}
