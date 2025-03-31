/**
 * Generic object pool for managing reusable objects
 * 
 * This class provides a way to reuse objects instead of creating and destroying them,
 * which improves performance by reducing garbage collection.
 */
export class ObjectPool {
    /**
     * Create a new ObjectPool
     * @param {Function} createFn - Factory function to create new instances
     * @param {Function} resetFn - Function to reset an object to its initial state
     * @param {number} initialSize - Initial size of the pool
     * @param {number} expandSize - Number of objects to add when the pool is empty
     */
    constructor(createFn, resetFn, initialSize = 20, expandSize = 10) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.expandSize = expandSize;
        this.pool = [];
        this.active = new Set();
        
        // Pre-populate the pool with initial objects
        this.expand(initialSize);
        
        console.log(`ObjectPool created with ${initialSize} objects`);
    }
    
    /**
     * Get an object from the pool or create a new one if the pool is empty
     * @returns {Object} An object from the pool
     */
    get() {
        let object;
        
        // If pool is empty, expand it
        if (this.pool.length === 0) {
            console.log(`Pool empty, expanding by ${this.expandSize} objects`);
            this.expand(this.expandSize);
        }
        
        // Get an object from the pool
        object = this.pool.pop();
        
        // Add to active set
        this.active.add(object);
        
        return object;
    }
    
    /**
     * Return an object to the pool
     * @param {Object} object - Object to return to the pool
     */
    release(object) {
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
     * @param {number} count - Number of objects to add to the pool
     */
    expand(count) {
        for (let i = 0; i < count; i++) {
            const object = this.createFn();
            this.pool.push(object);
        }
    }
    
    /**
     * Get the number of available objects in the pool
     * @returns {number} Count of available objects
     */
    availableCount() {
        return this.pool.length;
    }
    
    /**
     * Get the number of active objects from this pool
     * @returns {number} Count of active objects
     */
    activeCount() {
        return this.active.size;
    }
    
    /**
     * Release all active objects back to the pool
     */
    releaseAll() {
        // Create a copy of the active set to avoid modification during iteration
        const activeObjects = Array.from(this.active);
        
        // Release each active object
        for (const object of activeObjects) {
            this.release(object);
        }
    }
    
    /**
     * Clear the pool and dispose all objects
     * @param {Function} disposeFn - Function to dispose an object
     */
    dispose(disposeFn) {
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