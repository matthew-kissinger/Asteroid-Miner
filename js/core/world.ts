/**
 * World - Minimal container for ECS compatibility
 * 
 * This is a simplified World class that provides basic ECS world functionality
 * while the project migrates to bitECS. Most legacy ECS functionality has been
 * removed.
 */

import { MessageBus } from './messageBus.ts';
import { DEBUG_MODE } from '../globals/debug.ts';

export class World {
    public messageBus: MessageBus;
    public deltaTime: number;
    public time: number;
    public lastUpdateTime: number;
    
    // Optional properties used by systems/game
    public scene?: any;
    public optimizedProjectiles?: any;
    public playerEntity?: any;

    constructor(messageBus: MessageBus | null = null) {
        // Use provided message bus or create a new one
        // This allows sharing the message bus between World and Game
        this.messageBus = messageBus || new MessageBus();
        
        // If we created a new message bus, make it accessible globally
        if (!messageBus && !(globalThis as any).mainMessageBus) {
            (globalThis as any).mainMessageBus = this.messageBus;
        }
        
        // Time tracking
        this.deltaTime = 0;
        this.time = 0;
        this.lastUpdateTime = 0;
    }
    
    /**
     * Initialize the world
     */
    initialize(): void {
        this.lastUpdateTime = performance.now();
        this.messageBus.publish('world.initialized', {});
    }

    /**
     * Hook for systems to notify when entity moved
     * @param {any} _entity The entity that moved
     */
    onEntityTransformUpdated(_entity: any): void {
        // No-op - legacy spatial indexing removed
    }
    
    /**
     * Update world
     */
    update(): void {
        // Calculate delta time
        const now = performance.now();
        this.deltaTime = Math.min((now - this.lastUpdateTime) / 1000, 0.1); // Cap at 100ms
        this.lastUpdateTime = now;
        this.time += this.deltaTime;
        
        // Publish pre-update message
        this.messageBus.publish('world.preUpdate', { deltaTime: this.deltaTime, time: this.time });
        
        // Publish post-update message
        this.messageBus.publish('world.postUpdate', { deltaTime: this.deltaTime, time: this.time });
        
        // For debugging - log active entities in dev console
        if (DEBUG_MODE.enabled && this.time % 5 < this.deltaTime) {
            // Legacy entity logging removed
        }
    }
    
    /**
     * Create a new entity - stub for compatibility
     * @param {string} name Optional name for the entity
     * @returns {any} The created entity stub
     */
    createEntity(name: string = ''): any {
        // Return a minimal entity stub for compatibility
        const entity = {
            id: 'entity_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            name,
            components: new Map(),
            tags: new Set(),
            addComponent: function(component: any) {
                const componentName = component.constructor?.name || 'unknown';
                this.components.set(componentName, component);
                return this;
            },
            getComponent: function(componentName: string) {
                return this.components.get(componentName);
            },
            hasTag: function(tag: string) {
                return this.tags.has(tag);
            },
            addTag: function(tag: string) {
                this.tags.add(tag);
                return this;
            }
        };
        return entity;
    }
    
    /**
     * Destroy an entity - stub for compatibility
     * @param {any} _entityOrId The entity or entity ID to destroy
     */
    destroyEntity(_entityOrId: any): void {
        // No-op - legacy entity management removed
    }
    
    /**
     * Register a system - stub for compatibility
     * @param {any} system The system to register
     * @returns {any} The registered system
     */
    registerSystem(system: any): any {
        return system;
    }
    
    /**
     * Get entities with specific components - stub for compatibility
     * @param {any[]} _componentTypes Array of component types
     * @returns {any[]} Array of entities with all components
     */
    getEntitiesWithComponents(_componentTypes: any[]): any[] {
        return [];
    }
    
    /**
     * Get entities with a specific tag - stub for compatibility
     * @param {string} _tag The tag to filter by
     * @returns {any[]} Array of entities with the tag
     */
    getEntitiesByTag(_tag: string): any[] {
        return [];
    }
    
    /**
     * Get a specific entity by ID - stub for compatibility
     * @param {string} _id The entity ID
     * @returns {any|undefined} The entity or undefined if not found
     */
    getEntity(_id: string): any | undefined {
        return undefined;
    }
    
    /**
     * Get a system by type - stub for compatibility
     * @param {any} _systemType The system class type
     * @returns {any|undefined} The system instance or undefined if not found
     */
    getSystem(_systemType: any): any | undefined {
        return undefined;
    }
}
