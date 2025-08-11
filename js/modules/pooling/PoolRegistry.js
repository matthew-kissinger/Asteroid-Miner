// PoolRegistry.js - unified pool manager with stats and preallocation

export class PoolRegistry {
  constructor() {
    this.typeToPool = new Map();
    this.statsData = { hits: 0, misses: 0 };
  }

  register(type, { factory, reset, preallocate = 0, maxSize = Infinity } = {}) {
    if (!type) throw new Error('PoolRegistry.register requires a type');
    if (this.typeToPool.has(type)) return this.typeToPool.get(type);
    const pool = {
      objects: [],
      factory: factory || (() => ({})),
      reset: reset || function noop() {},
      maxSize,
    };
    for (let i = 0; i < preallocate; i++) {
      try {
        pool.objects.push(pool.factory());
      } catch {}
    }
    this.statsData.misses += preallocate;
    this.typeToPool.set(type, pool);
    return pool;
  }

  get(type, ...args) {
    const pool = this.typeToPool.get(type);
    if (!pool) throw new Error(`PoolRegistry.get: unknown type '${type}'`);
    let obj;
    if (pool.objects.length > 0) {
      obj = pool.objects.pop();
      this.statsData.hits += 1;
    } else {
      obj = pool.factory();
      this.statsData.misses += 1;
    }
    if (obj && typeof obj.reset === 'function') {
      obj.reset(...args);
    } else if (pool.reset) {
      try { pool.reset(obj, ...args); } catch {}
    }
    this._flushPerf();
    return obj;
  }

  release(type, obj) {
    const pool = this.typeToPool.get(type);
    if (!pool) return;
    if (obj && typeof obj.clear === 'function') {
      try { obj.clear(); } catch {}
    } else if (pool.reset) {
      try { pool.reset(obj); } catch {}
    }
    if (pool.objects.length < pool.maxSize) {
      pool.objects.push(obj);
    }
  }

  clear(type) {
    const pool = this.typeToPool.get(type);
    if (!pool) return;
    pool.objects.length = 0;
  }

  clearAll() {
    for (const [type] of this.typeToPool) this.clear(type);
  }

  stats() {
    return { hits: this.statsData.hits, misses: this.statsData.misses };
  }

  _flushPerf() {
    if (window.__perf) {
      window.__perf.pools = { ...this.statsData };
    }
  }
}

// Create a global-friendly singleton when desired
export function getGlobalPoolRegistry() {
  if (!window.poolRegistry) {
    window.poolRegistry = new PoolRegistry();
  }
  return window.poolRegistry;
}


