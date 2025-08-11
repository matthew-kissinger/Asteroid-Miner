/**
 * Enemy Lifecycle Manager - Handles the lifecycle of enemy entities
 */

import { TransformComponent } from '../../components/transform.js';
import { EnemyAIComponent } from '../../components/combat/enemyAI.js';
import { HealthComponent } from '../../components/combat/healthComponent.js';
import { MeshComponent } from '../../components/rendering/mesh.js';
import { RigidbodyComponent } from '../../components/physics/rigidbody.js';

export class EnemyLifecycle {
    constructor(world) {
        this.world = world;
    }
    
    /**
     * Validate enemy references to ensure all tracked enemies exist
     * This helps prevent "ghost" references that block new spawns
     * @param {Set} enemies Reference to the active enemies set for tracking
     */
    validateEnemyReferences(enemies) {
        // Store original size for logging
        const originalSize = enemies.size;
        
        // Create a new Set to hold valid enemy IDs
        const validEnemies = new Set();
        
        // Check each enemy ID in our tracking Set
        for (const enemyId of enemies) {
            // Get the entity from the world
            const entity = this.world.getEntity(enemyId);
            
            // If entity exists, is an enemy, and is NOT pooled, keep tracking it
            if (entity && entity.hasTag && entity.hasTag('enemy') && !entity.hasTag('pooled')) {
                validEnemies.add(enemyId);
            } else {
                if (!entity) {
                    console.warn(`Removing invalid enemy reference: ${enemyId} - Entity does not exist`);
                } else if (!entity.hasTag) {
                    console.warn(`Removing invalid enemy reference: ${enemyId} - Entity missing hasTag method`);
                } else if (!entity.hasTag('enemy')) {
                    // Check for tag inconsistency - entity might have the tag in its Set but the cache is wrong
                    if (entity.tags && entity.tags.has && entity.tags.has('enemy')) {
                        console.warn(`Entity ${enemyId} has inconsistent tag state: hasTag('enemy')=false but tag exists in Set`);
                        
                        // Force sync the entity's tag cache if possible
                        if (entity._syncTagCache && typeof entity._syncTagCache === 'function') {
                            entity._syncTagCache();
                            console.log(`Fixed tag cache for entity ${enemyId}`);
                            
                            // Check again if the tag is now recognized
                            if (entity.hasTag('enemy')) {
                                console.log(`Entity ${enemyId} now properly recognizes 'enemy' tag, keeping in tracking`);
                                validEnemies.add(enemyId);
                                continue;
                            }
                        }
                    }
                    
                    // If entity truly doesn't have the enemy tag, log and remove
                    console.warn(`Removing invalid enemy reference: ${enemyId} - Entity missing 'enemy' tag. Tags: [${Array.from(entity.tags)}]`);
                } else if (entity.hasTag('pooled')) {
                    console.warn(`Removing invalid enemy reference: ${enemyId} - Entity is pooled but still has 'enemy' tag`);
                    // Critical fix: Ensure pooled entities don't retain 'enemy' tag
                    if (entity.hasTag('enemy')) {
                        console.log(`Fixing inconsistent tag state: entity ${enemyId} is pooled but still has 'enemy' tag`);
                        entity.removeTag('enemy');
                    }
                }
            }
        }
        
        // Replace our tracking Set with the validated Set
        enemies.clear();
        for (const id of validEnemies) {
            enemies.add(id);
        }
        
        // Double-check: also scan for any enemies that might not be in our tracking
        let entitiesScanned = 0;
        try {
            if (this.world && this.world.entityManager) {
                // Try to get entities with the 'enemy' tag first
                let enemyEntities = [];
                
                if (this.world.entityManager.entitiesByTag && 
                    this.world.entityManager.entitiesByTag.get) {
                    enemyEntities = this.world.entityManager.entitiesByTag.get('enemy') || [];
                    entitiesScanned = enemyEntities.length;
                    
                    // Add any enemy entities that aren't in our tracking Set
                    // BUT make sure they're not pooled (inactive) entities
                    for (const enemy of enemyEntities) {
                        // Skip undefined/null entities
                        if (!enemy) continue;
                        
                        // Fix any cache inconsistencies before checking pooled status
                        if (enemy._syncTagCache && typeof enemy._syncTagCache === 'function') {
                            enemy._syncTagCache();
                        }
                        
                        // CRITICAL FIX: First check if enemy is pooled BEFORE adding to tracking
                        if (!enemy.hasTag('pooled')) {
                            if (!enemies.has(enemy.id)) {
                                console.log(`Found untracked enemy: ${enemy.id}, adding to tracking. Tags: [${[...enemy.tags]}]`);
                                enemies.add(enemy.id);
                            }
                        } else {
                            // Make sure pooled enemies are not in our tracking
                            if (enemies.has(enemy.id)) {
                                console.log(`Removing pooled enemy from tracking: ${enemy.id}`);
                                enemies.delete(enemy.id);
                            }
                            
                            // CRITICAL FIX: If an entity is pooled but still has the enemy tag, 
                            // remove the enemy tag to fix the inconsistency
                            if (enemy.hasTag('enemy')) {
                                console.log(`Fixing inconsistent tag state: pooled entity ${enemy.id} still has 'enemy' tag`);
                                // Directly call removeTag to ensure proper cleanup
                                enemy.removeTag('enemy');
                            }
                        }
                    }
                    
                    // Another check: verify if the EntityManager tag maps are consistent with entity tags
                    this.validateEntityManagerTagMaps(enemies);
                }
            }
        } catch (error) {
            console.error("Error during entity scan:", error);
        }
        
        // Log if we fixed any tracking issues
        if (originalSize !== enemies.size) {
            console.log(`Enemy tracking corrected: ${originalSize} -> ${enemies.size} enemies tracked. Scanned ${entitiesScanned} entities.`);
        }
    }
    
    /**
     * Additional method to validate and fix EntityManager tag maps
     * This helps ensure entity tags are consistent with the EntityManager's tracking
     * @param {Set} enemies Reference to the active enemies set for tracking
     */
    validateEntityManagerTagMaps(enemies) {
        if (!this.world || !this.world.entityManager || !this.world.entityManager.entitiesByTag) {
            return;
        }
        
        try {
            const entitiesByTag = this.world.entityManager.entitiesByTag;
            
            // Check the enemy tag map specifically
            if (entitiesByTag.has('enemy')) {
                const enemyMap = entitiesByTag.get('enemy');
                const invalidEntities = [];
                
                // Check each entity in the enemy map
                for (let i = 0; i < enemyMap.length; i++) {
                    const entity = enemyMap[i];
                    
                    // Skip invalid entities
                    if (!entity) {
                        invalidEntities.push(i);
                        continue;
                    }
                    
                    // If entity doesn't actually have the enemy tag in its tag Set, fix it
                    if (!entity.tags || !entity.tags.has('enemy')) {
                        console.warn(`Entity ${entity.id} is in 'enemy' tag map but doesn't have the tag in its Set`);
                        
                        // Add the tag properly through the entity's method
                        if (entity.addTag) {
                            entity.addTag('enemy');
                            console.log(`Added missing 'enemy' tag to entity ${entity.id}`);
                        } else {
                            // If can't fix, mark for removal
                            invalidEntities.push(i);
                        }
                    }
                    
                    // If entity has both enemy and pooled tags, that's an inconsistency
                    if (entity.hasTag && entity.hasTag('pooled') && entity.hasTag('enemy')) {
                        console.warn(`Entity ${entity.id} has both 'pooled' and 'enemy' tags - removing 'enemy' tag`);
                        entity.removeTag('enemy');
                        invalidEntities.push(i);
                    }
                }
                
                // Remove invalid entities from the map (in reverse order to avoid index issues)
                for (let i = invalidEntities.length - 1; i >= 0; i--) {
                    const index = invalidEntities[i];
                    enemyMap.splice(index, 1);
                }
                
                // Log changes if any were made
                if (invalidEntities.length > 0) {
                    console.log(`Fixed ${invalidEntities.length} inconsistencies in EntityManager 'enemy' tag map`);
                }
            }
        } catch (error) {
            console.error("Error validating EntityManager tag maps:", error);
        }
    }
    
    /**
     * Freeze all enemy entities in place
     * @param {Set} enemies Reference to the active enemies set for tracking
     */
    freezeAllEnemies(enemies) {
        // Filter out pooled (inactive) enemies
        const activeEnemies = Array.from(enemies).filter(enemyId => {
            const enemy = this.world.getEntity(enemyId);
            return enemy && !enemy.hasTag('pooled');
        });
        
        console.log(`Freezing all ${activeEnemies.length} active enemies...`);
        
        // Iterate through all active enemies and stop their movement
        for (const enemyId of activeEnemies) {
            const enemy = this.world.getEntity(enemyId);
            if (!enemy) {
                // Skip if entity doesn't exist
                console.warn(`Enemy ${enemyId} not found when freezing - may have been destroyed`);
                continue;
            }
            
            // Get the rigidbody component if it exists
            const rigidbody = enemy.getComponent(RigidbodyComponent);
            if (rigidbody) {
                // Set velocity to zero
                rigidbody.velocity.set(0, 0, 0);
                
                // Set angular velocity to zero if it exists
                if (rigidbody.angularVelocity) {
                    rigidbody.angularVelocity.set(0, 0, 0);
                }
                
                // Mark as frozen
                rigidbody.isFrozen = true;
            }
            
            // Get the enemy AI component
            const enemyAI = enemy.getComponent(EnemyAIComponent);
            if (enemyAI) {
                // Store original enabled state if not already stored
                if (enemyAI.originalEnabledState === undefined) {
                    enemyAI.originalEnabledState = enemyAI.enabled;
                }
                
                // Disable the AI component
                enemyAI.enabled = false;
            }
            
            // Mark the entity as frozen for other systems to recognize
            enemy.addTag('frozen');
        }
        
        console.log("All enemies frozen successfully");
    }
    
    /**
     * Unfreeze all enemy entities and re-enable their AI
     * @param {Set} enemies Reference to the active enemies set for tracking
     */
    unfreezeAllEnemies(enemies) {
        // Filter out pooled (inactive) enemies
        const activeEnemies = Array.from(enemies).filter(enemyId => {
            const enemy = this.world.getEntity(enemyId);
            return enemy && !enemy.hasTag('pooled');
        });
        
        console.log(`Unfreezing all ${activeEnemies.length} active enemies...`);
        
        // Iterate through all active enemies and re-enable their AI
        for (const enemyId of activeEnemies) {
            const enemy = this.world.getEntity(enemyId);
            if (!enemy) {
                // Skip if entity doesn't exist
                console.warn(`Enemy ${enemyId} not found when unfreezing - may have been destroyed`);
                continue;
            }
            
            // Get the rigidbody component if it exists
            const rigidbody = enemy.getComponent(RigidbodyComponent);
            if (rigidbody) {
                // Un-mark as frozen
                rigidbody.isFrozen = false;
            }
            
            // Get the enemy AI component
            const enemyAI = enemy.getComponent(EnemyAIComponent);
            if (enemyAI) {
                // Restore original enabled state or default to enabled
                enemyAI.enabled = (enemyAI.originalEnabledState !== undefined) ? 
                    enemyAI.originalEnabledState : true;
            }
            
            // Remove the frozen tag
            if (enemy.hasTag && enemy.hasTag('frozen')) {
                enemy.removeTag('frozen');
            }
        }
        
        console.log("All enemies unfrozen successfully");
    }
    
    /**
     * Force destroy excess enemies to enforce the enemy limit
     * @param {Set} enemies Reference to the active enemies set for tracking
     * @param {number} maxEnemies Maximum number of enemies allowed
     * @param {Function} returnEnemyToPool Function to return an enemy to the pool
     */
    enforceEnemyLimit(enemies, maxEnemies, returnEnemyToPool) {
        // Convert to array for easier manipulation
        const enemyIds = [...enemies];
        
        // Calculate how many enemies to remove
        const excessCount = enemies.size - maxEnemies;
        if (excessCount <= 0) return;
        
        console.log(`Enforcing enemy limit by removing ${excessCount} excess enemies`);
        
        // Remove the oldest enemies first (at the start of the array)
        for (let i = 0; i < excessCount && i < enemyIds.length; i++) {
            const entityId = enemyIds[i];
            const entity = this.world.getEntity(entityId);
            
            if (entity) {
                console.log(`Force destroying excess enemy ${entityId}`);
                
                // Remove from tracking first
                enemies.delete(entityId);
                
                // If entity has health component, mark as destroyed
                const health = entity.getComponent(HealthComponent);
                if (health) {
                    health.health = 0;
                    health.isDestroyed = true;
                }
                
                // Create explosion effect
                if (this.world && this.world.messageBus) {
                    const transform = entity.getComponent(TransformComponent);
                    if (transform) {
                        this.world.messageBus.publish('vfx.explosion', {
                            position: transform.position.clone(),
                            scale: 1.0,
                            duration: 1.0
                        });
                    }
                }
                
                // Return to pool or destroy completely
                returnEnemyToPool(entity);
            } else {
                // If entity doesn't exist, just remove from tracking
                enemies.delete(entityId);
            }
        }
        
        // Validate references after cleanup
        this.validateEnemyReferences(enemies);
    }
    
    /**
     * Clear all tracking Set
     * @param {Set} enemies Reference to the active enemies set for tracking
     */
    clearAllEnemies(enemies) {
        // Log the current count
        console.log(`Clearing all enemies. Current count: ${enemies.size}`);
        
        // Clear the enemies Set
        enemies.clear();
        
        // Verify
        console.log(`After clearing, enemy count: ${enemies.size}`);
    }
    
    /**
     * Process a single enemy entity's update
     * @param {Entity} entity Entity to process
     * @param {number} deltaTime Time since last update in seconds
     */
    processEntityUpdate(entity, deltaTime) {
        // Get enemy AI component
        const enemyAI = entity.getComponent(EnemyAIComponent);
        
        // Skip if entity is missing an enemy AI component
        if (!enemyAI) return;
        
        // Get transform component
        const transform = entity.getComponent(TransformComponent);
        
        // Skip if entity is missing a transform component
        if (!transform) return;
        
        // Get mesh component
        const meshComponent = entity.getComponent(MeshComponent);
        
        // Check if mesh component exists and has been added to scene
        if (meshComponent && meshComponent.mesh) {
            // Ensure mesh visibility
            meshComponent.mesh.visible = true;
            
            // Check if mesh has been added to scene
            if (!meshComponent.mesh.parent && this.world.scene) {
                console.log(`Adding enemy mesh to scene`);
                this.world.scene.add(meshComponent.mesh);
                
                // Call the onAddedToScene method if it exists
                if (meshComponent.onAddedToScene) {
                    meshComponent.onAddedToScene(this.world.scene);
                }
            }
            
            // Update mesh position to match entity transform
            meshComponent.mesh.position.copy(transform.position);
            meshComponent.mesh.quaternion.copy(transform.quaternion);
            meshComponent.mesh.scale.copy(transform.scale);
            
            // Process special visual effects if this is an enhanced enemy
            if (entity.visualVariant === 2 || entity.visualVariant === 3) {
                // Update any special effects attached to the model
                meshComponent.mesh.traverse((child) => {
                    if (child.userData && typeof child.userData.update === 'function') {
                        child.userData.update(deltaTime);
                    }
                });
                
                // Add additional visual effects for elite enemies (variant 2)
                if (entity.visualVariant === 2 && entity.eliteParticleTime === undefined) {
                    // Occasionally emit a small particle effect for elites
                    entity.eliteParticleTime = 0;
                } else if (entity.visualVariant === 2) {
                    // Update elite particle timer
                    entity.eliteParticleTime += deltaTime;
                    
                    // Every 1.5 seconds, emit a particle
                    if (entity.eliteParticleTime > 1.5) {
                        entity.eliteParticleTime = 0;
                        
                        // Emit a particle effect using the global VFX system if available
                        if (this.world && this.world.messageBus) {
                            this.world.messageBus.publish('vfx.pulse', {
                                position: transform.position.clone(),
                                color: 0xaaffff,
                                scale: 0.7,
                                duration: 0.8
                            });
                        }
                    }
                }
            }
            
            // Special flickering effect for damaged enemies (variant 1)
            if (entity.visualVariant === 1 && meshComponent.mesh.material) {
                // Apply a flickering effect to the material
                if (Array.isArray(meshComponent.mesh.material)) {
                    for (const material of meshComponent.mesh.material) {
                        material.emissiveIntensity = 0.5 + (Math.sin(Date.now() * 0.01) * 0.3);
                    }
                } else if (meshComponent.mesh.material.emissiveIntensity !== undefined) {
                    meshComponent.mesh.material.emissiveIntensity = 0.5 + (Math.sin(Date.now() * 0.01) * 0.3);
                }
            }
        }
        
        // Call the component's update method
        enemyAI.update(deltaTime);
        
        // Get health component to update shield regeneration
        const health = entity.getComponent(HealthComponent);
        if (health) {
            health.update(deltaTime);
        }
    }
} 