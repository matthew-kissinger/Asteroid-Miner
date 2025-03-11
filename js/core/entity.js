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
     * @param {Function} componentType The component class to remove
     * @returns {Entity} This entity for chaining
     */
    removeComponent(componentType) {
        const component = this.getComponent(componentType);
        if (component) {
            if (component.onDetached) {
                component.onDetached();
            }
            component.entity = null;
            
            // Get the component type name before deleting
            const componentTypeName = componentType.name;
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
     * Add a tag to this entity
     * @param {string} tag The tag to add
     * @returns {Entity} This entity for chaining
     */
    addTag(tag) {
        if (!this.tags.has(tag)) {
            this.tags.add(tag);
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
            this.tags.delete(tag);
            // Update the entity manager's tag index
            if (this.world && this.world.entityManager) {
                this.world.entityManager.onTagRemoved(this, tag);
            }
        }
        return this;
    }
    
    /**
     * Check if this entity has the specified tag
     * @param {string} tag The tag to check for
     * @returns {boolean} True if the entity has the tag
     */
    hasTag(tag) {
        // Add direct property access for critical tags for faster lookups
        if (tag === 'enemy' && this._isEnemy !== undefined) {
            return this._isEnemy;
        } else if (tag === 'player' && this._isPlayer !== undefined) {
            return this._isPlayer;
        } else if (tag === 'projectile' && this._isProjectile !== undefined) {
            return this._isProjectile;
        }
        
        // Normal tag lookup
        const hasTag = this.tags.has(tag);
        
        // Cache result for important tags
        if (tag === 'enemy') this._isEnemy = hasTag;
        else if (tag === 'player') this._isPlayer = hasTag;
        else if (tag === 'projectile') this._isProjectile = hasTag;
        
        return hasTag;
    }
}