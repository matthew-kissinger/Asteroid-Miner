/**
 * World - Main container class for the ECS architecture
 * 
 * The World manages the entire ECS setup, including entities,
 * components, systems, and messaging.
 */

import { EntityManager } from './entityManager.js';
import { SystemManager } from './systemManager.js';
import { MessageBus } from './messageBus.js';
import { SpatialHash } from './spatial/SpatialHash.js';
import { EntityIndex } from './EntityIndex.js';
import { DEBUG_MODE } from '../globals/debug.ts';
import type { Entity } from './entity.js';
import type { System } from './system.ts';

export class World {
    public messageBus: MessageBus;
    public entityManager: EntityManager;
    public systemManager: SystemManager;
    public spatial: SpatialHash;
    public index: EntityIndex;
    public deltaTime: number;
    public time: number;
    public lastUpdateTime: number;
    
    // Optional properties used by systems/game
    public scene?: any;
    public optimizedProjectiles?: any;
    public playerEntity?: Entity;

    constructor(messageBus: MessageBus | null = null) {
        // Use provided message bus or create a new one
        // This allows sharing the message bus between World and Game
        this.messageBus = messageBus || new MessageBus();
        
        // If we created a new message bus, make it accessible globally
        if (!messageBus && !(globalThis as any).mainMessageBus) {
            (globalThis as any).mainMessageBus = this.messageBus;
        }
        
        // Create managers
        this.entityManager = new EntityManager(this);
        this.systemManager = new SystemManager(this);
        this.spatial = new SpatialHash(400); // cell size tuned later
        this.index = new EntityIndex();
        
        // Time tracking
        this.deltaTime = 0;
        this.time = 0;
        this.lastUpdateTime = 0;
    }
    
    /**
     * Initialize the world and all systems
     */
    initialize(): void {
        this.lastUpdateTime = performance.now();
        this.systemManager.initialize();
        this.messageBus.publish('world.initialized', {});
    }

    /**
     * Hook for systems to notify when entity moved
     * @param {Entity} entity The entity that moved
     */
    onEntityTransformUpdated(entity: any): void {
        const t = entity.getComponent && entity.getComponent('TransformComponent');
        if (t) {
            this.spatial.update(entity.id, t.position, entity.collisionRadius || 1);
        }
    }
    
    /**
     * Update all systems
     */
    update(): void {
        // Calculate delta time
        const now = performance.now();
        this.deltaTime = Math.min((now - this.lastUpdateTime) / 1000, 0.1); // Cap at 100ms
        this.lastUpdateTime = now;
        this.time += this.deltaTime;
        
        // Publish pre-update message
        this.messageBus.publish('world.preUpdate', { deltaTime: this.deltaTime, time: this.time });
        
        // Update all systems
        this.systemManager.update(this.deltaTime);
        
        // Publish post-update message
        this.messageBus.publish('world.postUpdate', { deltaTime: this.deltaTime, time: this.time });
        
        // For debugging - log active entities in dev console
        if (DEBUG_MODE.enabled && this.time % 5 < this.deltaTime) {
            // Get all entities from entity manager using values from the map
            // const entities = Array.from(this.entityManager.entities.values());
            // const entitiesWithMesh = this.getEntitiesWithComponents(['MeshComponent']);
        }
    }
    
    /**
     * Create a new entity
     * @param {string} name Optional name for the entity
     * @returns {Entity} The created entity
     */
    createEntity(name: string = ''): Entity {
        return this.entityManager.createEntity(name);
    }
    
    /**
     * Destroy an entity
     * @param {Entity|string} entityOrId The entity or entity ID to destroy
     */
    destroyEntity(entityOrId: Entity | string): void {
        this.entityManager.destroyEntity(entityOrId);
    }
    
    /**
     * Register a system
     * @param {System} system The system to register
     * @returns {System} The registered system
     */
    registerSystem(system: System): System {
        return this.systemManager.registerSystem(system);
    }
    
    /**
     * Get entities with specific components
     * @param {any[]} componentTypes Array of component types
     * @returns {Entity[]} Array of entities with all components
     */
    getEntitiesWithComponents(componentTypes: any[]): Entity[] {
        return this.entityManager.getEntitiesWithComponents(componentTypes);
    }
    
    /**
     * Get entities with a specific tag
     * @param {string} tag The tag to filter by
     * @returns {Entity[]} Array of entities with the tag
     */
    getEntitiesByTag(tag: string): Entity[] {
        return this.entityManager.getEntitiesByTag(tag);
    }
    
    /**
     * Get a specific entity by ID
     * @param {string} id The entity ID
     * @returns {Entity|undefined} The entity or undefined if not found
     */
    getEntity(id: string): Entity | undefined {
        return this.entityManager.getEntity(id);
    }
    
    /**
     * Get a system by type
     * @param {any} systemType The system class type
     * @returns {System|undefined} The system instance or undefined if not found
     */
    getSystem(systemType: any): System | undefined {
        return this.systemManager.getSystem(systemType);
    }
}
