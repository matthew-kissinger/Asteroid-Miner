/**
 * Memory Management Utilities
 * Provides tools for optimizing memory usage and reducing garbage collection
 */

// Typed Array Pools
const typedArrayPools = {
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
 * @param {number} size - Length of the array
 * @returns {Float32Array} - A Float32Array of the specified size
 */
export function getFloat32Array(size) {
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
 * @param {Float32Array} array - The array to release
 */
export function releaseFloat32Array(array) {
    if (typedArrayPools.float32.length < MAX_POOL_SIZE) {
        // Zero out the array to prevent data leaks
        array.fill(0);
        typedArrayPools.float32.push(array);
    }
}

/**
 * Get an Int32Array from the pool or create a new one
 * @param {number} size - Length of the array
 * @returns {Int32Array} - An Int32Array of the specified size
 */
export function getInt32Array(size) {
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
 * @param {Int32Array} array - The array to release
 */
export function releaseInt32Array(array) {
    if (typedArrayPools.int32.length < MAX_POOL_SIZE) {
        array.fill(0);
        typedArrayPools.int32.push(array);
    }
}

/**
 * Get a Uint32Array from the pool or create a new one
 * @param {number} size - Length of the array
 * @returns {Uint32Array} - A Uint32Array of the specified size
 */
export function getUint32Array(size) {
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
 * @param {Uint32Array} array - The array to release
 */
export function releaseUint32Array(array) {
    if (typedArrayPools.uint32.length < MAX_POOL_SIZE) {
        array.fill(0);
        typedArrayPools.uint32.push(array);
    }
}

/**
 * Get a Uint16Array from the pool or create a new one
 * @param {number} size - Length of the array
 * @returns {Uint16Array} - A Uint16Array of the specified size
 */
export function getUint16Array(size) {
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
 * @param {Uint16Array} array - The array to release
 */
export function releaseUint16Array(array) {
    if (typedArrayPools.uint16.length < MAX_POOL_SIZE) {
        array.fill(0);
        typedArrayPools.uint16.push(array);
    }
}

/**
 * Get a Uint8Array from the pool or create a new one
 * @param {number} size - Length of the array
 * @returns {Uint8Array} - A Uint8Array of the specified size
 */
export function getUint8Array(size) {
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
 * @param {Uint8Array} array - The array to release
 */
export function releaseUint8Array(array) {
    if (typedArrayPools.uint8.length < MAX_POOL_SIZE) {
        array.fill(0);
        typedArrayPools.uint8.push(array);
    }
}

/**
 * Creates a pooled THREE.js BufferAttribute
 * @param {number} size - Number of vertices
 * @param {number} itemSize - Number of values per vertex (e.g. 3 for position, 2 for UV)
 * @returns {THREE.BufferAttribute} - A buffer attribute backed by a pooled typed array
 */
export function createPooledBufferAttribute(size, itemSize) {
    const array = getFloat32Array(size * itemSize);
    return new THREE.BufferAttribute(array, itemSize);
}

/**
 * Releases a pooled buffer attribute back to the pool
 * @param {THREE.BufferAttribute} attribute - The buffer attribute to release
 */
export function releasePooledBufferAttribute(attribute) {
    if (attribute && attribute.array instanceof Float32Array) {
        releaseFloat32Array(attribute.array);
        attribute.array = null;
    }
}

/**
 * Fixed-size array implementation to avoid dynamic array resizing
 */
export class FixedArray {
    /**
     * @param {number} size - Maximum size of the array
     */
    constructor(size) {
        this.data = new Array(size);
        this.length = 0;
        this.capacity = size;
    }
    
    /**
     * Add an item to the array
     * @param {*} item - Item to add
     * @returns {boolean} - True if item was added, false if array is full
     */
    push(item) {
        if (this.length < this.capacity) {
            this.data[this.length++] = item;
            return true;
        }
        return false;
    }
    
    /**
     * Remove and return the last item
     * @returns {*} - The last item or undefined if empty
     */
    pop() {
        if (this.length === 0) return undefined;
        const item = this.data[--this.length];
        this.data[this.length] = undefined; // Avoid memory leaks
        return item;
    }
    
    /**
     * Get item at index
     * @param {number} index - Index to retrieve
     * @returns {*} - Item at that index
     */
    get(index) {
        if (index < 0 || index >= this.length) return undefined;
        return this.data[index];
    }
    
    /**
     * Set item at index
     * @param {number} index - Index to set
     * @param {*} value - Value to set
     */
    set(index, value) {
        if (index < 0 || index >= this.capacity) return;
        if (index >= this.length) this.length = index + 1;
        this.data[index] = value;
    }
    
    /**
     * Remove item at index
     * @param {number} index - Index to remove
     * @returns {boolean} - True if removal was successful
     */
    removeAt(index) {
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
    clear() {
        for (let i = 0; i < this.length; i++) {
            this.data[i] = undefined;
        }
        this.length = 0;
    }
    
    /**
     * Iterate over each item
     * @param {Function} callback - Function to call for each item
     */
    forEach(callback) {
        for (let i = 0; i < this.length; i++) {
            callback(this.data[i], i, this);
        }
    }
    
    /**
     * Map array items to a new array
     * @param {Function} callback - Function to transform each item
     * @returns {Array} - New array with transformed items
     */
    map(callback) {
        const result = new Array(this.length);
        for (let i = 0; i < this.length; i++) {
            result[i] = callback(this.data[i], i, this);
        }
        return result;
    }
    
    /**
     * Filter items into a new array
     * @param {Function} callback - Predicate function to test each item
     * @returns {Array} - New array with items that passed the test
     */
    filter(callback) {
        const result = [];
        for (let i = 0; i < this.length; i++) {
            if (callback(this.data[i], i, this)) {
                result.push(this.data[i]);
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
    objectPoolSizes: {},
    typedArrayPoolSizes: {},
    
    /**
     * Update memory statistics
     */
    update() {
        // Vector pool stats
        if (window.vectorPool) {
            this.vectorPoolSize = window.vectorPool.pool.length;
        }
        
        // Object pool stats
        if (window.objectPool) {
            for (const type in window.objectPool.pools) {
                this.objectPoolSizes[type] = window.objectPool.pools[type].objects.length;
            }
        }
        
        // Typed array pool stats
        for (const type in typedArrayPools) {
            this.typedArrayPoolSizes[type] = typedArrayPools[type].length;
        }
    },
    
    /**
     * Get a formatted report of memory usage
     * @returns {string} - Formatted memory stats
     */
    getReport() {
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
        report += "Typed Array Pools:\n";
        for (const type in this.typedArrayPoolSizes) {
            report += `  ${type}: ${this.typedArrayPoolSizes[type]} arrays\n`;
        }
        
        return report;
    },
    
    /**
     * Print memory stats to console
     */
    logReport() {
        console.log(this.getReport());
    }
};

// Make MemoryStats globally available for debug purposes
window.MemoryStats = MemoryStats;

// Export a no-op function that can replace often-created objects
// to help identify memory hot spots
export function createNoOpVector() {
    if (window.DEBUG_MODE) {
        console.trace("Vector created at:");
    }
    return window.vectorPool ? window.vectorPool.get() : { x: 0, y: 0, z: 0 };
} 