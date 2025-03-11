/**
 * TrailSystem - Manages trail components for entities
 * 
 * Handles updating all trail components and their rendering.
 */

import { System } from '../../core/system.js';

export class TrailSystem extends System {
    /**
     * Create a new trail system
     */
    constructor(world) {
        super(world);
        this.requiredComponents = ['TrailComponent', 'TransformComponent'];
        this.priority = 60; // Run after movement but before rendering
        
        // Track trail components by entity ID
        this.trails = new Map();
        
        // Debug
        console.log("Trail system initialized");
    }
    
    /**
     * Register a trail with the system
     * @param {string} entityId ID of the entity
     * @param {TrailComponent} trailComponent Trail component to register
     */
    registerTrail(entityId, trailComponent) {
        this.trails.set(entityId, trailComponent);
        console.log(`Registered trail for entity ${entityId}`);
    }
    
    /**
     * Unregister a trail from the system
     * @param {string} entityId ID of the entity
     */
    unregisterTrail(entityId) {
        this.trails.delete(entityId);
    }
    
    /**
     * Process a single entity with a trail component
     * @param {Entity} entity Entity to process
     * @param {number} deltaTime Time since last update in seconds
     */
    processEntity(entity, deltaTime) {
        // Get trail component
        const trail = entity.getComponent('TrailComponent');
        if (!trail) return;
        
        // Update trail
        trail.update(deltaTime);
    }
    
    /**
     * Update all trails
     * @param {number} deltaTime Time since last update in seconds
     */
    update(deltaTime) {
        // Process all entities with trail components through the standard system method
        super.update(deltaTime);
        
        // Extra manual processing for any trails registered manually
        // This handles trails that might not be properly set up as components
        for (const [entityId, trail] of this.trails.entries()) {
            if (trail && !trail.entity) {
                // This is a manually registered trail without an entity
                // Try to get the entity from the world
                const entity = this.world.getEntity(entityId);
                if (entity) {
                    // Manually update the trail with the entity's transform
                    const transform = entity.getComponent('TransformComponent');
                    if (transform) {
                        trail.update(deltaTime);
                    }
                }
            }
        }
    }
    
    /**
     * Clean up when system is disabled
     */
    onDisabled() {
        // Clean up all trails (best effort)
        for (const trail of this.trails.values()) {
            if (trail && trail.onDetached) {
                trail.onDetached();
            }
        }
        
        // Clear trails map
        this.trails.clear();
    }
} 