/**
 * Entity Class - Base entity class for ECS architecture
 * 
 * The core building block of the Entity-Component-System pattern.
 * Each entity is essentially just an ID with a collection of components
 * that define its behavior and properties.
 */

export class Entity {
    constructor(id, world) {
        this.id = id;
        this.world = world;
        this.components = new Map();
        this.tags = new Set();
        
        // Cache flags for commonly checked tags (initialize as undefined)
        this._isEnemy = undefined;
        this._isPlayer = undefined;
        this._isProjectile = undefined;
        this._isPooled = undefined;
    }
    
    /**
     * Add a component to this entity
     * @param {Component} component The component to add
     * @returns {Entity} This entity for chaining
     */
    addComponent(component) {
        component.entity = this;
        this.components.set(component.constructor.name, component);
        
        // Call onAttached
        if (component.onAttached) {
            component.onAttached();
        }
        
        // Notify the world that a component was added
        if (this.world && this.world.messageBus) {
            this.world.messageBus.publish('component.added', {
                entity: this,
                componentType: component.constructor.name,
                component: component
            });
        }
        
        return this;
    }
    
    /**
     * Remove a component from this entity
     * @param {Function|string} componentType The component class or name to remove
     * @returns {Entity} This entity for chaining
     */
    removeComponent(componentType) {
        const component = this.getComponent(componentType);
        if (component) {
            if (component.onDetached) {
                component.onDetached();
            }
            component.entity = null;
            
            // Get the component type name - handle both string and class inputs
            const componentTypeName = typeof componentType === 'string' 
                ? componentType 
                : componentType.name;
            this.components.delete(componentTypeName);
            
            // Notify the world that a component was removed
            if (this.world && this.world.messageBus) {
                this.world.messageBus.publish('component.removed', {
                    entity: this,
                    componentType: componentTypeName,
                    component: component
                });
            }
        }
        return this;
    }
    
    /**
     * Get a component of the specified type
     * @param {Function|string} componentType The component class or name to get
     * @returns {Component|null} The component or null if not found
     */
    getComponent(componentType) {
        if (typeof componentType === 'string') {
            return this.components.get(componentType);
        }
        return this.components.get(componentType.name);
    }
    
    /**
     * Check if this entity has a component of the specified type
     * @param {Function|string} componentType The component class or name to check for
     * @returns {boolean} True if the entity has the component
     */
    hasComponent(componentType) {
        if (typeof componentType === 'string') {
            return this.components.has(componentType);
        }
        return this.components.has(componentType.name);
    }
    
    /**
     * Sync internal tag cache with actual tags
     * @private
     */
    _syncTagCache() {
        // Reset all cached flags to match actual tag state
        this._isEnemy = this.tags.has('enemy');
        this._isPlayer = this.tags.has('player');
        this._isProjectile = this.tags.has('projectile');
        this._isPooled = this.tags.has('pooled');
    }
    
    /**
     * Add a tag to this entity
     * @param {string} tag The tag to add
     * @returns {Entity} This entity for chaining
     */
    addTag(tag) {
        if (!this.tags.has(tag)) {
            // Add tag to local Set
            this.tags.add(tag);
            
            // Update cached flags immediately
            if (tag === 'enemy') this._isEnemy = true;
            else if (tag === 'player') this._isPlayer = true;
            else if (tag === 'projectile') this._isProjectile = true;
            else if (tag === 'pooled') this._isPooled = true;
            
            // Update the entity manager's tag index
            if (this.world && this.world.entityManager) {
                this.world.entityManager.onTagAdded(this, tag);
                
                // Verify tag was added to tag index map
                if (!this.world.entityManager.entitiesByTag.has(tag) || 
                    !this.world.entityManager.entitiesByTag.get(tag).includes(this)) {
                    console.error(`Failed to register entity ${this.id} with tag '${tag}' in entity manager!`);
                    
                    // Force add entity to tag map as fallback
                    if (!this.world.entityManager.entitiesByTag.has(tag)) {
                        this.world.entityManager.entitiesByTag.set(tag, []);
                    }
                    this.world.entityManager.entitiesByTag.get(tag).push(this);
                    console.log(`Manually fixed tag registration for entity ${this.id} with tag '${tag}'`);
                }
            }
        }
        return this;
    }
    
    /**
     * Remove a tag from this entity
     * @param {string} tag The tag to remove
     * @returns {Entity} This entity for chaining
     */
    removeTag(tag) {
        if (this.tags.has(tag)) {
            // Remove tag from local Set
            this.tags.delete(tag);
            
            // Update cached flags immediately
            if (tag === 'enemy') this._isEnemy = false;
            else if (tag === 'player') this._isPlayer = false;
            else if (tag === 'projectile') this._isProjectile = false;
            else if (tag === 'pooled') this._isPooled = false;
            
            // Update the entity manager's tag index
            if (this.world && this.world.entityManager) {
                this.world.entityManager.onTagRemoved(this, tag);
            }
        }
        return this;
    }
    
    /**
     * Clear all tags from this entity
     * @returns {Entity} This entity for chaining
     */
    clearTags() {
        // Make a copy of the tags to iterate over
        const allTags = [...this.tags];
        
        // Remove each tag properly
        for (const tag of allTags) {
            this.removeTag(tag);
        }
        
        // Reset ALL tag caches to ensure consistency
        this._isEnemy = false;
        this._isPlayer = false;
        this._isProjectile = false;
        this._isPooled = false;
        
        // Verify the local Set is empty
        this.tags.clear();
        
        return this;
    }
    
    /**
     * Check if this entity has the specified tag
     * @param {string} tag The tag to check for
     * @returns {boolean} True if the entity has the tag
     */
    hasTag(tag) {
        // Use direct Set lookup instead of potentially stale cached values
        const hasTag = this.tags.has(tag);
        
        // Check for inconsistency between cache and actual tags
        // This helps detect and fix cache issues
        let cacheInconsistent = false;
        
        if (tag === 'enemy' && this._isEnemy !== hasTag) {
            console.warn(`Tag cache inconsistency for entity ${this.id}: _isEnemy=${this._isEnemy}, actual=Set{${Array.from(this.tags)}}`);
            this._isEnemy = hasTag; // Fix the cache
            cacheInconsistent = true;
        } 
        else if (tag === 'player' && this._isPlayer !== hasTag) {
            console.warn(`Tag cache inconsistency for entity ${this.id}: _isPlayer=${this._isPlayer}, actual=Set{${Array.from(this.tags)}}`);
            this._isPlayer = hasTag; // Fix the cache
            cacheInconsistent = true;
        } 
        else if (tag === 'projectile' && this._isProjectile !== hasTag) {
            console.warn(`Tag cache inconsistency for entity ${this.id}: _isProjectile=${this._isProjectile}, actual=Set{${Array.from(this.tags)}}`);
            this._isProjectile = hasTag; // Fix the cache
            cacheInconsistent = true;
        }
        else if (tag === 'pooled' && this._isPooled !== hasTag) {
            console.warn(`Tag cache inconsistency for entity ${this.id}: _isPooled=${this._isPooled}, actual=Set{${Array.from(this.tags)}}`);
            this._isPooled = hasTag; // Fix the cache
            cacheInconsistent = true;
        }
        
        // If we detected an inconsistency, sync the entire cache
        if (cacheInconsistent) {
            this._syncTagCache();
        }
        
        return hasTag;
    }
}