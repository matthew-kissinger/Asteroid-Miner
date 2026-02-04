// globals.js - Initialize global objects and facades

import * as THREE from 'three';
import { mainMessageBus } from '../globals/messageBus.ts';
import { objectPool } from '../globals/objectPool.ts';
import { setDebugMode } from '../globals/debug.ts';

type VectorPool = {
    pool: THREE.Vector3[];
    maxSize: number;
    get: (x?: number, y?: number, z?: number) => THREE.Vector3;
    release: (vector: THREE.Vector3) => void;
};

export function initializeGlobals(): void {
    // Initialize Three.js global (already set by src/main.js, but ensure it's available)
    if (!window.THREE) {
        window.THREE = THREE as Window['THREE'];
    }

    setDebugMode(false);

    // Ensure global message bus and object pool singletons are initialized
    void mainMessageBus;
    void objectPool;

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
