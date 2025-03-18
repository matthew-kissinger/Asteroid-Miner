/**
 * System Base Class - Base class for all ECS systems
 * 
 * Systems operate on entities that have specific components.
 * They contain the logic that processes entity data.
 */

export class System {
    constructor(world) {
        this.world = world;
        this.enabled = true;
        this.requiredComponents = []; // Component types required for processing
        this.priority = 0; // Execution order (lower = earlier)
    }
    
    /**
     * Check if entity has all required components for this system
     * @param {Entity} entity The entity to check
     * @returns {boolean} True if entity can be processed by this system
     */
    checkEntity(entity) {
        return this.requiredComponents.every(componentType => 
            entity.hasComponent(componentType));
    }
    
    /**
     * Get all entities that match this system's requirements
     * @returns {Entity[]} Array of compatible entities
     */
    getEntities() {
        return this.world.getEntitiesWithComponents(this.requiredComponents);
    }
    
    /**
     * Update method called each frame
     * @param {number} deltaTime Time since last update in seconds
     */
    update(deltaTime) {
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
    processEntity(entity, deltaTime) {
        // Override in derived systems
    }
    
    /**
     * Initialize the system
     * Called once when the system is first registered
     */
    initialize() {
        // Base implementation does nothing
        // Override in derived systems for initialization logic
    }
    
    /**
     * Enable this system
     */
    enable() {
        this.enabled = true;
    }
    
    /**
     * Disable this system
     */
    disable() {
        this.enabled = false;
    }
}