import type { World } from './world.js';
import { Component } from './component.js';

/**
 * Entity Class - Base entity class for ECS architecture
 * 
 * The core building block of the Entity-Component-System pattern.
 * Each entity is essentially just an ID with a collection of components
 * that define its behavior and properties.
 */
export class Entity {
    public id: string;
    public world: World;
    public components: Map<string, Component>;
    public tags: Set<string>;
    
    // Cache flags for commonly checked tags
    private _isEnemy: boolean | undefined = undefined;
    private _isPlayer: boolean | undefined = undefined;
    private _isProjectile: boolean | undefined = undefined;
    private _isPooled: boolean | undefined = undefined;

    // Optional properties used by some systems
    public collisionRadius?: number;

    constructor(id: string, world: World) {
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
    addComponent(component: Component): this {
        component.entity = this;
        const componentType = component.type || component.constructor.name;
        this.components.set(componentType, component);

        // Call onAttached
        if (component.onAttached) {
            component.onAttached();
        }

        // Notify the world that a component was added
        if (this.world && this.world.messageBus) {
            this.world.messageBus.publish('component.added', {
                entity: this,
                componentType: componentType,
                component: component
            });
        }

        return this;
    }
    
    /**
     * Remove a component from this entity
     * @param {any} componentType The component class or name to remove
     * @returns {Entity} This entity for chaining
     */
    removeComponent(componentType: any): this {
        const component = this.getComponent(componentType);
        if (component) {
            if (component.onDetached) {
                component.onDetached();
            }
            component.entity = null;

            // Get the component type name - handle both string and class inputs
            let componentTypeName: string;
            if (typeof componentType === 'string') {
                componentTypeName = componentType;
            } else if (componentType.type) {
                componentTypeName = componentType.type;
            } else {
                componentTypeName = componentType.name;
            }
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
     * @param {any} componentType The component class or name to get
     * @returns {any} The component or null if not found
     */
    getComponent<T extends Component>(componentType: any): T | null {
        if (typeof componentType === 'string') {
            return (this.components.get(componentType) as T) || null;
        }
        const typeName = componentType.type || componentType.name;
        return (this.components.get(typeName) as T) || null;
    }
    
    /**
     * Check if this entity has a component of the specified type
     * @param {any} componentType The component class or name to check for
     * @returns {boolean} True if the entity has the component
     */
    hasComponent(componentType: any): boolean {
        if (typeof componentType === 'string') {
            return this.components.has(componentType);
        }
        const typeName = componentType.type || componentType.name;
        return this.components.has(typeName);
    }
    
    /**
     * Sync internal tag cache with actual tags
     * @private
     */
    private _syncTagCache(): void {
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
    addTag(tag: string): this {
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
                    !this.world.entityManager.entitiesByTag.get(tag)!.includes(this)) {
                    // Force add entity to tag map as fallback
                    if (!this.world.entityManager.entitiesByTag.has(tag)) {
                        this.world.entityManager.entitiesByTag.set(tag, []);
                    }
                    this.world.entityManager.entitiesByTag.get(tag)!.push(this);
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
    removeTag(tag: string): this {
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
    clearTags(): this {
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
    hasTag(tag: string): boolean {
        // Use direct Set lookup instead of potentially stale cached values
        const hasTag = this.tags.has(tag);
        
        // Check for inconsistency between cache and actual tags
        // This helps detect and fix cache issues
        let cacheInconsistent = false;
        
        if (tag === 'enemy' && this._isEnemy !== hasTag) {
            this._isEnemy = hasTag; // Fix the cache
            cacheInconsistent = true;
        } 
        else if (tag === 'player' && this._isPlayer !== hasTag) {
            this._isPlayer = hasTag; // Fix the cache
            cacheInconsistent = true;
        } 
        else if (tag === 'projectile' && this._isProjectile !== hasTag) {
            this._isProjectile = hasTag; // Fix the cache
            cacheInconsistent = true;
        }
        else if (tag === 'pooled' && this._isPooled !== hasTag) {
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
