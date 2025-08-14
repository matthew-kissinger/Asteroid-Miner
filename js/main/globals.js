// globals.js - Initialize global objects and facades

import * as THREE from 'three';
import { MessageBus } from '../core/messageBus.js';
import { getGlobalPoolRegistry } from '../modules/pooling/PoolRegistry.js';

// Global debug flag - set to true for development
window.DEBUG_MODE = false;

export function initializeGlobals() {
    // Initialize Three.js global (already set by src/main.js, but ensure it's available)
    if (!window.THREE) {
        window.THREE = THREE;
    }
    
    // Set up global message bus for cross-system communication
    window.mainMessageBus = new MessageBus();
    
    // Initialize global object pool facade
    initializeObjectPoolFacade();
    
    // Initialize global vector pool for reusing vector objects
    initializeVectorPool();
}

function initializeVectorPool() {
    window.vectorPool = {
        pool: [],
        maxSize: 100,
        
        get: function(x = 0, y = 0, z = 0) {
            if (this.pool.length > 0) {
                return this.pool.pop().set(x, y, z);
            }
            return new THREE.Vector3(x, y, z);
        },
        
        release: function(vector) {
            if (this.pool.length < this.maxSize) {
                this.pool.push(vector);
            }
        }
    };
}

function initializeObjectPoolFacade() {
    // Bridge our global facade to the real PoolRegistry
    window.objectPool = {
        registry: getGlobalPoolRegistry(),
        
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
                    if (obj && typeof obj.reset === 'function') {
                        obj.reset();
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
                    available: pool.objects.length,
                    maxSize: pool.maxSize,
                    hits: this.registry.statsData.hits,
                    misses: this.registry.statsData.misses
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
                this.registry.typeToPool.forEach((pool, type) => {
                    pool.objects = [];
                });
            }
        }
    };
}