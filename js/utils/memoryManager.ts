/**
 * Memory Management Utilities
 * Provides tools for optimizing memory usage and reducing garbage collection
 */

import * as THREE from 'three';
import { DEBUG_MODE } from '../globals/debug.ts';
import { objectPool } from '../globals/objectPool.ts';

// Define the structure for typed array pools
interface TypedArrayPools {
    float32: Float32Array[];
    int32: Int32Array[];
    uint32: Uint32Array[];
    uint16: Uint16Array[];
    uint8: Uint8Array[];
}

const typedArrayPools: TypedArrayPools = {
    float32: [],
    int32: [],
    uint32: [],
    uint16: [],
    uint8: []
};

// Maximum pool sizes to prevent memory leaks
const MAX_POOL_SIZE = 100;

/**
 * Get a Float32Array from the pool or create a new one
 * @param size - Length of the array
 * @returns - A Float32Array of the specified size
 */
export function getFloat32Array(size: number): Float32Array {
    const pool = typedArrayPools.float32;
    
    // Find an array of appropriate size in the pool
    for (let i = 0; i < pool.length; i++) {
        if (pool[i].length >= size) {
            const array = pool.splice(i, 1)[0];
            return array;
        }
    }
    
    // Create a new array if none found in pool
    return new Float32Array(size);
}

/**
 * Release a Float32Array back to the pool
 * @param array - The array to release
 */
export function releaseFloat32Array(array: Float32Array): void {
    if (typedArrayPools.float32.length < MAX_POOL_SIZE) {
        // Zero out the array to prevent data leaks
        array.fill(0);
        typedArrayPools.float32.push(array);
    }
}

/**
 * Get an Int32Array from the pool or create a new one
 * @param size - Length of the array
 * @returns - An Int32Array of the specified size
 */
export function getInt32Array(size: number): Int32Array {
    const pool = typedArrayPools.int32;
    
    for (let i = 0; i < pool.length; i++) {
        if (pool[i].length >= size) {
            const array = pool.splice(i, 1)[0];
            return array;
        }
    }
    
    return new Int32Array(size);
}

/**
 * Release an Int32Array back to the pool
 * @param array - The array to release
 */
export function releaseInt32Array(array: Int32Array): void {
    if (typedArrayPools.int32.length < MAX_POOL_SIZE) {
        array.fill(0);
        typedArrayPools.int32.push(array);
    }
}

/**
 * Get a Uint32Array from the pool or create a new one
 * @param size - Length of the array
 * @returns - A Uint32Array of the specified size
 */
export function getUint32Array(size: number): Uint32Array {
    const pool = typedArrayPools.uint32;
    
    for (let i = 0; i < pool.length; i++) {
        if (pool[i].length >= size) {
            const array = pool.splice(i, 1)[0];
            return array;
        }
    }
    
    return new Uint32Array(size);
}

/**
 * Release a Uint32Array back to the pool
 * @param array - The array to release
 */
export function releaseUint32Array(array: Uint32Array): void {
    if (typedArrayPools.uint32.length < MAX_POOL_SIZE) {
        array.fill(0);
        typedArrayPools.uint32.push(array);
    }
}

/**
 * Get a Uint16Array from the pool or create a new one
 * @param size - Length of the array
 * @returns - A Uint16Array of the specified size
 */
export function getUint16Array(size: number): Uint16Array {
    const pool = typedArrayPools.uint16;
    
    for (let i = 0; i < pool.length; i++) {
        if (pool[i].length >= size) {
            const array = pool.splice(i, 1)[0];
            return array;
        }
    }
    
    return new Uint16Array(size);
}

/**
 * Release a Uint16Array back to the pool
 * @param array - The array to release
 */
export function releaseUint16Array(array: Uint16Array): void {
    if (typedArrayPools.uint16.length < MAX_POOL_SIZE) {
        array.fill(0);
        typedArrayPools.uint16.push(array);
    }
}

/**
 * Get a Uint8Array from the pool or create a new one
 * @param size - Length of the array
 * @returns - A Uint8Array of the specified size
 */
export function getUint8Array(size: number): Uint8Array {
    const pool = typedArrayPools.uint8;
    
    for (let i = 0; i < pool.length; i++) {
        if (pool[i].length >= size) {
            const array = pool.splice(i, 1)[0];
            return array;
        }
    }
    
    return new Uint8Array(size);
}

/**
 * Release a Uint8Array back to the pool
 * @param array - The array to release
 */
export function releaseUint8Array(array: Uint8Array): void {
    if (typedArrayPools.uint8.length < MAX_POOL_SIZE) {
        array.fill(0);
        typedArrayPools.uint8.push(array);
    }
}

/**
 * Creates a pooled THREE.js BufferAttribute
 * @param size - Number of vertices
 * @param itemSize - Number of values per vertex (e.g. 3 for position, 2 for UV) 
 * @returns - A buffer attribute backed by a pooled typed array
 */
export function createPooledBufferAttribute(size: number, itemSize: number): THREE.BufferAttribute {
    const array = getFloat32Array(size * itemSize);
    return new THREE.BufferAttribute(array, itemSize);
}

/**
 * Releases a pooled buffer attribute back to the pool
 * @param attribute - The buffer attribute to release
 */
export function releasePooledBufferAttribute(attribute: THREE.BufferAttribute | null): void {
    if (attribute && attribute.array instanceof Float32Array) {
        releaseFloat32Array(attribute.array);
        // Ensure that the reference to the array is cleared from the attribute
        // This might be tricky as `BufferAttribute` expects `array` to be a TypedArray.
        // Setting it to `null` might cause issues if not handled carefully downstream.
        // For now, we'll keep the existing behavior, but note this potential area.
        (attribute.array as any) = null; // Type assertion to allow setting to null
    }
}

/**
 * Fixed-size array implementation to avoid dynamic array resizing
 */
export class FixedArray<T> {
    private data: (T | undefined)[];
    public length: number;
    public capacity: number;
    
    /**
     * @param size - Maximum size of the array
     */
    constructor(size: number) {
        this.data = new Array<T | undefined>(size);
        this.length = 0;
        this.capacity = size;
    }
    
    /**
     * Add an item to the array
     * @param item - Item to add
     * @returns - True if item was added, false if array is full
     */
    push(item: T): boolean {
        if (this.length < this.capacity) {
            this.data[this.length++] = item;
            return true;
        }
        return false;
    }
    
    /**
     * Remove and return the last item
     * @returns - The last item or undefined if empty
     */
    pop(): T | undefined {
        if (this.length === 0) return undefined;
        const item = this.data[--this.length];
        this.data[this.length] = undefined; // Avoid memory leaks
        return item;
    }
    
    /**
     * Get item at index
     * @param index - Index to retrieve
     * @returns - Item at that index
     */
    get(index: number): T | undefined {
        if (index < 0 || index >= this.length) return undefined;
        return this.data[index];
    }
    
    /**
     * Set item at index
     * @param index - Index to set
     * @param value - Value to set
     */
    set(index: number, value: T): void {
        if (index < 0 || index >= this.capacity) return;
        if (index >= this.length) this.length = index + 1;
        this.data[index] = value;
    }
    
    /**
     * Remove item at index
     * @param index - Index to remove
     * @returns - True if removal was successful
     */
    removeAt(index: number): boolean {
        if (index < 0 || index >= this.length) return false;
        
        // Shift all elements after index
        for (let i = index; i < this.length - 1; i++) {
            this.data[i] = this.data[i + 1];
        }
        
        // Clear the last element to avoid memory leaks
        this.data[--this.length] = undefined;
        return true;
    }
    
    /**
     * Clear the array
     */
    clear(): void {
        for (let i = 0; i < this.length; i++) {
            this.data[i] = undefined;
        }
        this.length = 0;
    }
    
    /**
     * Iterate over each item
     * @param callback - Function to call for each item
     */
    forEach(callback: (item: T, index: number, array: FixedArray<T>) => void): void {
        for (let i = 0; i < this.length; i++) {
            const item = this.data[i];
            if (item !== undefined) {
                callback(item, i, this);
            }
        }
    }
    
    /**
     * Map array items to a new array
     * @param callback - Function to transform each item
     * @returns - New array with transformed items
     */
    map<U>(callback: (item: T, index: number, array: FixedArray<T>) => U): U[] {
        const result: U[] = [];
        for (let i = 0; i < this.length; i++) {
            const item = this.data[i];
            if (item !== undefined) {
                result.push(callback(item, i, this));
            }
        }
        return result;
    }
    
    /**
     * Filter items into a new array
     * @param callback - Predicate function to test each item
     * @returns - New array with items that passed the test
     */
    filter(callback: (item: T, index: number, array: FixedArray<T>) => boolean): T[] {
        const result: T[] = [];
        for (let i = 0; i < this.length; i++) {
            const item = this.data[i];
            if (item !== undefined && callback(item, i, this)) {
                result.push(item);
            }
        }
        return result;
    }
}

/**
 * Memory usage statistics tracking
 */
export const MemoryStats = {
    vectorPoolSize: 0,
    objectPoolSizes: {} as { [key: string]: number },
    typedArrayPoolSizes: {} as { [key: string]: number },
    
    /**
     * Update memory statistics
     */
    update(): void {
        // Vector pool stats
        if (window.vectorPool) {
            this.vectorPoolSize = window.vectorPool.pool.length;
        }
        
        // Object pool stats
        if (objectPool?.registry?.typeToPool) { // Check for .registry and .typeToPool property
            for (const type of Array.from(objectPool.registry.typeToPool.keys())) {
                const pool = objectPool.registry.typeToPool.get(type);
                if (pool) {
                    this.objectPoolSizes[type] = pool.objects.length;
                }
            }
        }
        
        // Typed array pool stats
        for (const type in typedArrayPools) {
            this.typedArrayPoolSizes[type] = (typedArrayPools as any)[type].length;
        }
    },
    
    /**
     * Get a formatted report of memory usage
     * @returns - Formatted memory stats
     */
    getReport(): string {
        this.update();
        
        let report = "Memory Pool Stats:\n";
        
        // Vector pool
        report += `Vector Pool: ${this.vectorPoolSize} vectors\n`;
        
        // Object pools
        report += "Object Pools:\n";
        for (const type in this.objectPoolSizes) {
            report += `  ${type}: ${this.objectPoolSizes[type]} objects\n`;
        }
        
        // Typed array pools
        for (const type in this.typedArrayPoolSizes) {
            report += `  ${type}: ${this.typedArrayPoolSizes[type]} arrays\n`;
        }
        
        return report;
    },
    
    /**
     * Print memory stats to console
     */
    logReport(): void {
        console.log(this.getReport());
    }
};

// Make MemoryStats globally available for debug purposes
if (typeof window !== 'undefined') { // Check if window is defined (e.g., not in Node.js environment)
  window.MemoryStats = MemoryStats;
}

// Export a no-op function that can replace often-created objects
// to help identify memory hot spots
export function createNoOpVector(): { x: number; y: number; z: number } {
    if (DEBUG_MODE.enabled) {
        console.trace("Vector created at:");
    }
    return window.vectorPool ? window.vectorPool.get() : { x: 0, y: 0, z: 0 };
}
