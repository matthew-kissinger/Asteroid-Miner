import type { World } from './world.js';
import type { Entity } from './entity.js';

/**
 * System Base Class - Base class for all ECS systems
 * 
 * Systems operate on entities that have specific components.
 * They contain the logic that processes entity data.
 */
export class System {
    public world: World;
    public enabled: boolean = true;
    public requiredComponents: any[] = []; // Component types required for processing
    public priority: number = 0; // Execution order (lower = earlier)

    constructor(world: World) {
        this.world = world;
        this.enabled = true;
        this.requiredComponents = [];
        this.priority = 0;
    }
    
    /**
     * Check if entity has all required components for this system
     * @param {Entity} entity The entity to check
     * @returns {boolean} True if entity can be processed by this system
     */
    checkEntity(entity: Entity): boolean {
        return this.requiredComponents.every(componentType => 
            entity.hasComponent(componentType));
    }
    
    /**
     * Get all entities that match this system's requirements
     * @returns {Entity[]} Array of compatible entities
     */
    getEntities(): Entity[] {
        return this.world.getEntitiesWithComponents(this.requiredComponents);
    }
    
    /**
     * Update method called each frame
     * @param {number} deltaTime Time since last update in seconds
     */
    update(deltaTime: number): void {
        if (!this.enabled) return;
        
        const entities = this.getEntities();
        entities.forEach(entity => {
            this.processEntity(entity, deltaTime);
        });
    }
    
    /**
     * Process a single entity
     * @param {Entity} entity The entity to process
     * @param {number} deltaTime Time since last update in seconds
     */
    processEntity(_entity: Entity, _deltaTime: number): void {
        // Override in derived systems
    }
    
    /**
     * Initialize the system
     * Called once when the system is first registered
     */
    initialize(): void {
        // Base implementation does nothing
        // Override in derived systems for initialization logic
    }
    
    /**
     * Enable this system
     */
    enable(): void {
        this.enabled = true;
    }
    
    /**
     * Disable this system
     */
    disable(): void {
        this.enabled = false;
    }
}
