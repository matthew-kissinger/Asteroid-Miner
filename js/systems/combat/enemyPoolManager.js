/**
 * Enemy Pool Manager - Handles the object pooling system for enemy entities
 */

import { TransformComponent } from '../../components/transform.js';
import { EnemyAIComponent } from '../../components/combat/enemyAI.js';
import { HealthComponent } from '../../components/combat/healthComponent.js';
import { MeshComponent } from '../../components/rendering/mesh.js';
import { RigidbodyComponent } from '../../components/physics/rigidbody.js';
import { TrailComponent } from '../../components/rendering/trail.js';

export class EnemyPoolManager {
    constructor(world, maxPoolSize = 20) {
        this.world = world;
        this.maxPoolSize = maxPoolSize;
        this.enemyPool = [];
        
        // Pre-allocate the pool
        this.preallocateEnemyPool();
    }
    
    /**
     * Pre-allocate enemy pool to avoid runtime allocations
     */
    preallocateEnemyPool() {
        // Pre-allocate spectral drones
        for (let i = 0; i < 10; i++) {
            const spectralEntity = this.createEnemyEntity();
            // IMPORTANT: Don't add pooled entities to tracking
            // The entity will be tracked only when spawned
            this.enemyPool.push(spectralEntity);
        }
        
        console.log(`Pre-allocated enemy pool with ${this.enemyPool.length} spectral drones`);
    }
    
    /**
     * Create a basic enemy entity (for pooling)
     * @returns {Entity} The created enemy entity
     */
    createEnemyEntity() {
        const entity = this.world.createEntity('enemy_spectral');
        // Add tags but ensure they aren't tracked until spawned
        entity.addTag('pooled'); // Add 'pooled' tag to mark as inactive
        
        // Add basic components
        entity.addComponent(new TransformComponent());
        entity.addComponent(new MeshComponent());
        
        return entity;
    }
    
    /**
     * Get an enemy from the pool or create a new one if the pool is empty
     * @returns {Entity} An enemy entity
     */
    getEnemyFromPool() {
        // Get from pool if available
        if (this.enemyPool.length > 0) {
            // Get entity from pool
            const entity = this.enemyPool.pop();
            
            // Double-check this entity isn't already in the active enemies list
            // (This should never happen, but let's be defensive)
            if (this.enemies && this.enemies.has(entity.id)) {
                console.warn(`CRITICAL ERROR: Entity ${entity.id} is in both the pool and active enemies!`);
                
                // Remove from active enemies to avoid duplicates
                this.enemies.delete(entity.id);
                console.log(`Fixed inconsistency: Removed entity ${entity.id} from active enemies`);
            }
            
            // Verify all pooled entities in enemyPool don't include this entity
            // This ensures no duplicate references exist in the pool
            for (let i = 0; i < this.enemyPool.length; i++) {
                if (this.enemyPool[i].id === entity.id) {
                    console.warn(`CRITICAL ERROR: Duplicate of entity ${entity.id} found in enemy pool!`);
                    this.enemyPool.splice(i, 1);
                    console.log(`Fixed inconsistency: Removed duplicate entity ${entity.id} from enemy pool`);
                    i--; // Adjust index since we removed an element
                }
            }
            
            console.log(`Getting entity ${entity.id} from pool. Current tags: [${entity.tags ? [...entity.tags] : 'undefined'}]`);
            
            // CRITICAL FIX: Use the proper clearTags method first to completely reset tag state
            if (entity.clearTags && typeof entity.clearTags === 'function') {
                entity.clearTags();
                console.log(`Cleared all tags from entity ${entity.id}`);
            } else {
                console.warn(`Entity ${entity.id} missing clearTags method`);
                // Remove the pooled tag manually at minimum
                if (entity.hasTag && entity.removeTag) {
                    if (entity.hasTag('pooled')) {
                        entity.removeTag('pooled');
                    }
                    // Clear any other possible tags
                    if (entity.hasTag('enemy')) entity.removeTag('enemy');
                    if (entity.hasTag('spectrals')) entity.removeTag('spectrals');
                }
            }
            
            // Explicitly reset the tag cache flags
            if (entity._syncTagCache && typeof entity._syncTagCache === 'function') {
                entity._syncTagCache();
                console.log(`Reset tag cache for entity ${entity.id}`);
            } else {
                // Direct reset of cache variables
                if (entity._isEnemy !== undefined) entity._isEnemy = false;
                if (entity._isPooled !== undefined) entity._isPooled = false;
            }
            
            // Reset any component states that might be problematic
            const enemyAI = entity.getComponent(EnemyAIComponent);
            if (enemyAI) {
                // Reset internal state
                enemyAI.playerFound = false;
                enemyAI.timeAlive = 0;
                enemyAI.spiralPhase = Math.random() * Math.PI * 2; // New random starting phase
                enemyAI.enabled = true; // Ensure it's enabled
            }
            
            // Verify the entity is clean
            console.log(`Entity ${entity.id} prepared for reuse. Current tags: [${entity.tags ? [...entity.tags] : 'undefined'}]`);
            
            return entity;
        }
        
        // Otherwise create a new one
        const newEntity = this.createEnemyEntity();
        console.log(`Created new entity ${newEntity.id} because pool was empty`);
        return newEntity;
    }
    
    /**
     * Return an enemy to the pool
     * @param {Entity} entity Enemy entity
     * @param {Set} enemies Reference to the active enemies set for tracking
     */
    returnEnemyToPool(entity, enemies) {
        // Safeguard against null/undefined entities
        if (!entity) {
            console.warn("Attempt to return null/undefined entity to pool");
            return;
        }
        
        // Get entity ID for consistent logging
        const entityId = entity.id;
        
        // Log entity state for debugging
        console.log(`Returning entity ${entityId} to pool. Has tags: [${entity.tags ? [...entity.tags] : 'undefined'}]`);
        
        // ENHANCED CLEANUP: Multiple checks to ensure entity is removed from enemies tracking
        // 1. Direct check and remove from tracking Set
        if (enemies && enemies.has(entityId)) {
            enemies.delete(entityId);
            console.log(`Removed entity ${entityId} from enemies tracking`);
        }
        
        // 2. FIRST: Clear ALL tags using the improved clearTags method
        // This will properly update both the tags Set and the cached flags
        if (entity.clearTags && typeof entity.clearTags === 'function') {
            entity.clearTags();
            console.log(`Cleared all tags from entity ${entityId}`);
        } else {
            // Fallback if clearTags is not available
            console.warn(`No clearTags method on entity ${entityId}, using manual tag removal`);
            
            // Manually remove known tags
            if (entity.hasTag && entity.removeTag) {
                if (entity.hasTag('enemy')) entity.removeTag('enemy');
                if (entity.hasTag('spectrals')) entity.removeTag('spectrals');
                if (entity.hasTag('drone')) entity.removeTag('drone');
                if (entity.hasTag('frozen')) entity.removeTag('frozen');
            }
        }
        
        // Only return to pool if it's not full
        if (this.enemyPool.length < this.maxPoolSize) {
            // TRAIL CLEANUP: Remove trail component and its visual elements first
            // This is critical to prevent the trail from persisting after enemy destruction
            const trailComponent = entity.getComponent(TrailComponent);
            if (trailComponent) {
                try {
                    // Call the onDetached method if it exists to clean up resources
                    if (typeof trailComponent.onDetached === 'function') {
                        trailComponent.onDetached();
                    }
                    
                    // Remove from trail system tracking if it exists
                    if (window.game && window.game.trailSystem) {
                        window.game.trailSystem.unregisterTrail && 
                        window.game.trailSystem.unregisterTrail(entityId);
                    }
                    
                    // If the trail has a mesh or points object, remove it from scene
                    if (trailComponent.trailMesh && trailComponent.trailMesh.parent) {
                        trailComponent.trailMesh.parent.remove(trailComponent.trailMesh);
                    }
                    
                    // Dispose of geometry and material
                    if (trailComponent.trailMesh) {
                        if (trailComponent.trailMesh.geometry) {
                            trailComponent.trailMesh.geometry.dispose();
                        }
                        if (trailComponent.trailMesh.material) {
                            trailComponent.trailMesh.material.dispose();
                        }
                    }
                    
                    // Remove the component from the entity
                    entity.removeComponent(TrailComponent);
                    console.log(`Removed and cleaned up TrailComponent from entity ${entityId}`);
                } catch (error) {
                    console.error(`Error cleaning up trail for entity ${entityId}:`, error);
                }
            }
            
            // Reset the entity's transform
            const transform = entity.getComponent(TransformComponent);
            if (transform) {
                transform.position.set(0, 0, 0);
                transform.rotation.set(0, 0, 0);
                transform.scale.set(1, 1, 1);
            }
            
            // Reset health if present
            const health = entity.getComponent(HealthComponent);
            if (health) {
                health.health = 0;
                health.isDestroyed = true;
            }
            
            // Disable AI component if present
            const enemyAI = entity.getComponent(EnemyAIComponent);
            if (enemyAI) {
                enemyAI.enabled = false;
                // Reset internal state variables to prevent stale behavior
                enemyAI.playerFound = false;
                enemyAI.timeAlive = 0;
                enemyAI.spiralPhase = Math.random() * Math.PI * 2; // New random starting phase
            }
            
            // Clean up and hide mesh
            const meshComponent = entity.getComponent(MeshComponent);
            if (meshComponent && meshComponent.mesh) {
                try {
                    // Remove from scene if it has a parent
                    if (meshComponent.mesh.parent) {
                        meshComponent.mesh.parent.remove(meshComponent.mesh);
                    }
                    
                    // Make the mesh invisible
                    meshComponent.mesh.visible = false;
                } catch (error) {
                    console.error(`Error cleaning up mesh for entity ${entityId}:`, error);
                }
            }
            
            // Disable rigidbody physics
            const rigidbody = entity.getComponent(RigidbodyComponent);
            if (rigidbody) {
                rigidbody.isFrozen = true;
                if (rigidbody.velocity) {
                    rigidbody.velocity.set(0, 0, 0);
                }
            }

            // Now, add the pooled tag after all cleanup is done
            entity.addTag('pooled');
            console.log(`Entity ${entityId} marked as pooled`);
            
            // Verify entity state after pooling
            console.log(`Final entity ${entityId} state - Tags: [${entity.tags ? [...entity.tags] : 'none'}]`);
            
            // Add to pool
            this.enemyPool.push(entity);
            
            console.log(`Entity ${entityId} returned to pool. Pool size now ${this.enemyPool.length}`);
        } else {
            // If pool is full, destroy the entity
            console.log(`Pool is full (${this.maxPoolSize}), destroying entity ${entityId} instead of pooling`);
            
            // CRITICAL FIX: Ensure entity is completely destroyed
            if (this.world && this.world.destroyEntity) {
                this.world.destroyEntity(entityId);
                console.log(`Entity ${entityId} fully destroyed`);
            } else {
                console.error(`Failed to destroy entity ${entityId} - world or destroyEntity method not available`);
            }
        }
    }
    
    /**
     * Run diagnostics on the enemy pool system to detect and fix inconsistencies
     * @param {Set} enemies Reference to the active enemies set for tracking
     */
    runPoolDiagnostics(enemies) {
        console.log("=== RUNNING ENEMY POOL DIAGNOSTICS ===");
        console.log(`Active enemies: ${enemies.size}, Pool size: ${this.enemyPool.length}`);
        
        // Track number of fixes made
        let inconsistenciesFixed = 0;
        
        // POOL INTEGRITY CHECK: Check for duplicate entities in the pool
        const poolEntityIds = new Set();
        const duplicateIndices = [];
        
        for (let i = 0; i < this.enemyPool.length; i++) {
            const entity = this.enemyPool[i];
            
            // Skip invalid entities
            if (!entity || !entity.id) {
                console.warn(`Invalid entity at index ${i} in enemy pool - removing`);
                duplicateIndices.push(i);
                inconsistenciesFixed++;
                continue;
            }
            
            // Check if this entity ID is already in the pool
            if (poolEntityIds.has(entity.id)) {
                console.warn(`Duplicate entity ${entity.id} found in enemy pool at index ${i} - removing`);
                duplicateIndices.push(i);
                inconsistenciesFixed++;
            } else {
                poolEntityIds.add(entity.id);
            }
        }
        
        // Remove duplicates from the pool (in reverse order to avoid index issues)
        for (let i = duplicateIndices.length - 1; i >= 0; i--) {
            this.enemyPool.splice(duplicateIndices[i], 1);
        }
        
        // ACTIVE-POOLED CHECK: No entity should be both active and in the pool
        const activePooledEntities = [];
        
        for (let i = 0; i < this.enemyPool.length; i++) {
            const entity = this.enemyPool[i];
            
            // If entity is also in active enemies, that's a critical error
            if (enemies.has(entity.id)) {
                console.error(`CRITICAL ERROR: Entity ${entity.id} is both active and in the pool!`);
                activePooledEntities.push(i);
                inconsistenciesFixed++;
            }
        }
        
        // Remove entities that are both active and pooled from the pool
        for (let i = activePooledEntities.length - 1; i >= 0; i--) {
            const index = activePooledEntities[i];
            const entityId = this.enemyPool[index].id;
            this.enemyPool.splice(index, 1);
            console.log(`Fixed critical inconsistency: Removed entity ${entityId} from pool since it's active`);
        }
        
        // Check the enemy tag map
        let enemyTaggedCount = 0;
        let pooledTaggedCount = 0;
        let inconsistentEntities = 0;
        
        if (this.world && this.world.entityManager && this.world.entityManager.entitiesByTag) {
            // Count entities with enemy tag
            const enemyTaggedEntities = this.world.entityManager.entitiesByTag.get('enemy') || [];
            enemyTaggedCount = enemyTaggedEntities.length;
            
            // Count entities with pooled tag
            const pooledTaggedEntities = this.world.entityManager.entitiesByTag.get('pooled') || [];
            pooledTaggedCount = pooledTaggedEntities.length;
            
            // Check for inconsistent state: entities with both 'enemy' and 'pooled' tags
            for (const entity of enemyTaggedEntities) {
                if (entity.hasTag('pooled')) {
                    console.warn(`INCONSISTENT ENTITY ${entity.id}: Has both 'enemy' and 'pooled' tags`);
                    inconsistentEntities++;
                    
                    // POOL STATUS CHECK: If entity has pooled tag, it MUST be in the pool
                    const isInPool = this.enemyPool.some(e => e.id === entity.id);
                    
                    if (isInPool) {
                        // Entity is in pool with enemy tag - remove enemy tag
                        entity.removeTag('enemy');
                        console.log(`Fixed entity ${entity.id} by removing 'enemy' tag since it's in the pool`);
                    } else {
                        // Entity has pooled tag but not in pool - remove pooled tag
                        entity.removeTag('pooled');
                        console.log(`Fixed entity ${entity.id} by removing 'pooled' tag since it's not in the pool`);
                    }
                    
                    inconsistenciesFixed++;
                }
            }
            
            // Check for inconsistent state: pooled entities in active enemies set
            for (const entityId of enemies) {
                const entity = this.world.getEntity(entityId);
                if (entity && entity.hasTag('pooled')) {
                    console.warn(`INCONSISTENT TRACKING: Entity ${entityId} is in active enemies but has 'pooled' tag`);
                    
                    // Check if entity is actually in the pool
                    const isInPool = this.enemyPool.some(e => e.id === entityId);
                    
                    if (isInPool) {
                        // Entity is in pool and active list - remove from active list
                        enemies.delete(entityId);
                        console.log(`Fixed by removing entity ${entityId} from active enemies set since it's in the pool`);
                    } else {
                        // Entity has pooled tag but not in pool - remove pooled tag
                        entity.removeTag('pooled');
                        console.log(`Fixed entity ${entityId} by removing 'pooled' tag since it's not in the pool`);
                    }
                    
                    inconsistentEntities++;
                    inconsistenciesFixed++;
                }
            }
            
            // Check enemy pool for tag issues
            for (let i = 0; i < this.enemyPool.length; i++) {
                const entity = this.enemyPool[i];
                
                if (!entity) continue;
                
                let entityFixed = false;
                
                // Entities in the pool MUST have the pooled tag
                if (!entity.hasTag('pooled')) {
                    console.warn(`INCONSISTENT POOL: Entity ${entity.id} in enemy pool but missing 'pooled' tag`);
                    entity.addTag('pooled');
                    console.log(`Fixed by adding 'pooled' tag to entity ${entity.id}`);
                    entityFixed = true;
                    inconsistenciesFixed++;
                }
                
                // Entities in the pool MUST NOT have the enemy tag
                if (entity.hasTag('enemy')) {
                    console.warn(`INCONSISTENT POOL: Entity ${entity.id} in enemy pool but has 'enemy' tag`);
                    entity.removeTag('enemy');
                    console.log(`Fixed by removing 'enemy' tag from entity ${entity.id}`);
                    entityFixed = true;
                    inconsistenciesFixed++;
                }
                
                if (entityFixed) {
                    inconsistentEntities++;
                }
            }
        }
        
        console.log(`Diagnostic results: ${enemyTaggedCount} entities with 'enemy' tag, ${pooledTaggedCount} entities with 'pooled' tag`);
        console.log(`Fixed ${inconsistenciesFixed} inconsistencies across ${inconsistentEntities} entities`);
        console.log("=== DIAGNOSTICS COMPLETE ===");
    }
} 