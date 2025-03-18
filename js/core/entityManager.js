/**
 * EntityManager - Manages entity creation, tracking and destruction
 * 
 * Handles entity lifecycle and provides methods to query entities
 * based on components or tags.
 */

import { Entity } from './entity.js';

export class EntityManager {
    constructor(world) {
        this.world = world;
        this.entities = new Map();
        // Use WeakMap for entity tracking to allow garbage collection
        this.entitiesByComponent = new Map();
        this.entitiesByTag = new Map();
        this.lastEntityId = 0;
        
        // Entity recycle pool for faster instantiation
        this.recycledEntities = [];
        this.maxRecycledEntities = 100;
    }
    
    /**
     * Create a new entity
     * @param {string} name Optional name for the entity
     * @returns {Entity} The created entity
     */
    createEntity(name = '') {
        // Try to reuse a recycled entity first
        let entity;
        
        if (this.recycledEntities.length > 0) {
            entity = this.recycledEntities.pop();
            entity.components.clear();
            entity.tags.clear();
            entity._isEnemy = undefined;
            entity._isPlayer = undefined;
            entity._isProjectile = undefined;
        } else {
            const id = this._generateEntityId();
            entity = new Entity(id, this.world);
        }
        
        // Add to entities map first
        this.entities.set(entity.id.toString(), entity);
        
        // Add name as tag using the fixed addTag method which will register with entityManager
        if (name) {
            entity.addTag(name);
        }
        
        // Notify systems that an entity was created
        this.world.messageBus.publish('entity.created', { entity });
        
        return entity;
    }
    
    /**
     * Destroy an entity and remove all its components
     * @param {Entity|string} entityOrId The entity or entity ID to destroy
     */
    destroyEntity(entityOrId) {
        const id = typeof entityOrId === 'string' ? entityOrId : entityOrId.id;
        const entity = this.entities.get(id.toString());
        
        if (!entity) return;
        
        // Notify systems that this entity will be destroyed
        this.world.messageBus.publish('entity.destroyed', { entity });
        
        // Remove from tag maps
        entity.tags.forEach(tag => {
            if (this.entitiesByTag.has(tag)) {
                const entities = this.entitiesByTag.get(tag);
                const index = entities.indexOf(entity);
                if (index !== -1) {
                    entities.splice(index, 1);
                }
                
                if (entities.length === 0) {
                    this.entitiesByTag.delete(tag);
                }
            }
        });
        
        // Remove all components
        for (const [componentType, component] of entity.components.entries()) {
            entity.removeComponent(component.constructor);
        }
        
        // Remove from entities map
        this.entities.delete(id.toString());
        
        // Add to recycled entities pool if not full
        if (this.recycledEntities.length < this.maxRecycledEntities) {
            this.recycledEntities.push(entity);
        }
    }
    
    /**
     * Get an entity by ID
     * @param {string} id The entity ID
     * @returns {Entity|undefined} The entity or undefined if not found
     */
    getEntity(id) {
        return this.entities.get(id.toString());
    }
    
    /**
     * Get all entities with the specified tag
     * @param {string} tag The tag to filter by
     * @returns {Entity[]} Array of entities with the tag
     */
    getEntitiesByTag(tag) {
        return this.entitiesByTag.get(tag) || [];
    }
    
    /**
     * Get all entities that have all the specified components
     * @param {Function[]} componentTypes Array of component types
     * @returns {Entity[]} Array of entities with all components
     */
    getEntitiesWithComponents(componentTypes) {
        if (!componentTypes || componentTypes.length === 0) {
            return Array.from(this.entities.values());
        }
        
        return Array.from(this.entities.values()).filter(entity => {
            return componentTypes.every(type => entity.hasComponent(type));
        });
    }
    
    /**
     * Get all entities in the manager
     * @returns {Entity[]} Array of all entities
     */
    getEntities() {
        return Array.from(this.entities.values());
    }
    
    /**
     * Update entity tag index when a tag is added
     * @param {Entity} entity The entity
     * @param {string} tag The tag
     */
    onTagAdded(entity, tag) {
        if (!this.entitiesByTag.has(tag)) {
            this.entitiesByTag.set(tag, []);
        }
        
        this.entitiesByTag.get(tag).push(entity);
    }
    
    /**
     * Update entity tag index when a tag is removed
     * @param {Entity} entity The entity
     * @param {string} tag The tag
     */
    onTagRemoved(entity, tag) {
        if (this.entitiesByTag.has(tag)) {
            const entities = this.entitiesByTag.get(tag);
            const index = entities.indexOf(entity);
            
            if (index !== -1) {
                entities.splice(index, 1);
            }
            
            if (entities.length === 0) {
                this.entitiesByTag.delete(tag);
            }
        }
    }
    
    /**
     * Generate a unique entity ID
     * @returns {string} A unique entity ID
     * @private
     */
    _generateEntityId() {
        return (++this.lastEntityId).toString();
    }
}