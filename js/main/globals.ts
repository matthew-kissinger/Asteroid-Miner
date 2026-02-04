// globals.js - Initialize global objects and facades

import * as THREE from 'three';
import { MessageBus } from '../core/messageBus.js';
import { getGlobalPoolRegistry } from '../modules/pooling/PoolRegistry.ts';

type PoolRegistry = {
    get: (poolName: string, ...args: unknown[]) => unknown;
    register: (poolName: string, config: { factory: () => unknown; reset?: (obj: unknown) => void; preallocate?: number; maxSize?: number }) => void;
    release: (poolName: string, obj: unknown) => void;
    clearAll?: () => void;
    typeToPool?: Map<string, { objects: unknown[]; maxSize: number }>;
    statsData?: { hits: number; misses: number };
};

type ObjectPoolFacade = {
    registry: PoolRegistry;
    get: (poolName: string, ...args: unknown[]) => unknown;
    release: (poolName: string, obj: unknown) => void;
    createPool: (poolName: string, factory: () => unknown, initialSize?: number, maxSize?: number) => void;
    getStats: (poolName: string) => { available: number; maxSize: number; hits: number; misses: number } | null;
    clearAllPools: () => void;
};

type VectorPool = {
    pool: THREE.Vector3[];
    maxSize: number;
    get: (x?: number, y?: number, z?: number) => THREE.Vector3;
    release: (vector: THREE.Vector3) => void;
};

// Global debug flag - set to true for development
window.DEBUG_MODE = false;

export function initializeGlobals(): void {
    // Initialize Three.js global (already set by src/main.js, but ensure it's available)
    if (!window.THREE) {
        window.THREE = THREE as Window['THREE'];
    }
    
    // Set up global message bus for cross-system communication
    window.mainMessageBus = new MessageBus();
    
    // Initialize global object pool facade
    initializeObjectPoolFacade();
    
    // Initialize global vector pool for reusing vector objects
    initializeVectorPool();
}

function initializeVectorPool(): void {
    const vectorPool: VectorPool = {
        pool: [],
        maxSize: 100,
        
        get: function(x = 0, y = 0, z = 0) {
            if (this.pool.length > 0) {
                const vector = this.pool.pop();
                if (vector) {
                    return vector.set(x, y, z);
                }
            }
            return new THREE.Vector3(x, y, z);
        },
        
        release: function(vector) {
            if (this.pool.length < this.maxSize) {
                this.pool.push(vector);
            }
        }
    };
    window.vectorPool = vectorPool;
}

function initializeObjectPoolFacade(): void {
    // Bridge our global facade to the real PoolRegistry
    const objectPool: ObjectPoolFacade = {
        registry: getGlobalPoolRegistry() as PoolRegistry,
        
        // Get an object from a pool
        get(poolName, ...args) {
            try {
                return this.registry.get(poolName, ...args);
            } catch (e) {
                // Create pool on demand if it doesn't exist
                if (window.DEBUG_MODE) {
                    console.log(`Creating on-demand pool: ${poolName}`);
                }
                // Create pool with default factory
                this.registry.register(poolName, { 
                    factory: () => ({}),
                    preallocate: 10, 
                    maxSize: 100 
                });
                return this.registry.get(poolName, ...args);
            }
        },
        
        // Return an object to a pool
        release(poolName, obj) {
            this.registry.release(poolName, obj);
        },
        
        // Create or configure a pool
        createPool(poolName, factory, initialSize = 10, maxSize = 100) {
            this.registry.register(poolName, { 
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
        
        // Get pool statistics
        getStats(poolName) {
            // Check if pool exists by looking at the typeToPool map
            if (this.registry.typeToPool && this.registry.typeToPool.has(poolName)) {
                const pool = this.registry.typeToPool.get(poolName);
                return {
                    available: pool ? pool.objects.length : 0,
                    maxSize: pool ? pool.maxSize : 0,
                    hits: this.registry.statsData ? this.registry.statsData.hits : 0,
                    misses: this.registry.statsData ? this.registry.statsData.misses : 0
                };
            }
            return null;
        },
        
        // Clear all pools
        clearAllPools() {
            if (this.registry.clearAll) {
                this.registry.clearAll();
            } else if (this.registry.typeToPool) {
                // Manual clear if clearAll doesn't exist
                this.registry.typeToPool.forEach((pool) => {
                    pool.objects = [];
                });
            }
        }
    };

    window.objectPool = objectPool;
}
