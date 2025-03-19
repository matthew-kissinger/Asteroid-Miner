/**
 * EnemySystem - Manages enemy entities and their AI behavior
 * 
 * Handles enemy spawning, AI updates, and combat interactions.
 * This is a simplified version that only implements spectral drones.
 */

import { System } from '../../core/system.js';
import { TransformComponent } from '../../components/transform.js';
import { EnemyAIComponent } from '../../components/combat/enemyAI.js';
import { HealthComponent } from '../../components/combat/healthComponent.js';
import { MeshComponent } from '../../components/rendering/mesh.js';
import { RigidbodyComponent } from '../../components/physics/rigidbody.js';
import { TrailComponent } from '../../components/rendering/trail.js';

export class EnemySystem extends System {
    constructor(world) {
        super(world);
        this.requiredComponents = ['EnemyAIComponent', 'TransformComponent'];
        this.priority = 40; // Run before combat but after input and physics
        
        // Initialize enemies set
        this.enemies = new Set();
        
        // Enemy spawn parameters - adjusted for more frequent spawning
        this.maxEnemies = 8;           // Allow more enemies to spawn
        this.spawnTimer = 0;           // Timer since last spawn
        this.spawnInterval = 3;        // Seconds between spawns (reduced from 10)
        this.spawnPoints = [];         // Will be populated with potential spawn points
        this.lastSpawnTime = Date.now(); // Track the last successful spawn time
        
        // Enemy object pool
        this.enemyPool = [];
        
        // Pool size configuration
        this.maxPoolSize = 20;
        
        // Enemy type configuration
        this.enemyConfig = {
            health: 20,
            damage: 15,
            speed: 700,
            spiralAmplitude: 150,
            spiralFrequency: 2.0
        };
        
        // Track player docked status
        this.playerIsDocked = false;
        
        // Destroyed enemies counter
        this.enemiesDestroyed = 0;
        
        // Set up recovery timer for spawn system problems
        this.lastSpawnCheckTime = Date.now();
        this.spawnCheckInterval = 10000; // 10 seconds
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Set up initial spawn points
        this.generateSpawnPoints();
        
        // Start continuous monitoring for spawn health
        this.startSpawnMonitoring();
        
        // Initialize with a clean enemy count
        this.clearAllEnemies();
        
        // Pre-allocate enemy pool
        this.preallocateEnemyPool();
        
        // Force validation to ensure we start with empty tracking
        this.validateEnemyReferences();
        
        console.log("Enemy system initialized with faster spawn rate and object pooling");
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
            const entity = this.enemyPool.pop();
            
            console.log(`Getting entity ${entity.id} from pool. Current tags: [${entity.tags ? [...entity.tags] : 'undefined'}]`);
            
            // CRITICAL FIX: Use the proper clearTags method first
            if (entity.clearTags && typeof entity.clearTags === 'function') {
                entity.clearTags();
                console.log(`Cleared all tags from entity ${entity.id}`);
            } else {
                console.warn(`Entity ${entity.id} missing clearTags method`);
                // Remove the pooled tag manually at minimum
                if (entity.hasTag && entity.hasTag('pooled')) {
                    entity.removeTag('pooled');
                }
            }
            
            // Reset any component states that might be problematic
            const enemyAI = entity.getComponent('EnemyAIComponent');
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
     */
    returnEnemyToPool(entity) {
        // Safeguard against null/undefined entities
        if (!entity) {
            console.warn("Attempt to return null/undefined entity to pool");
            return;
        }
        
        // Log entity state for debugging
        console.log(`Returning entity ${entity.id} to pool. Has tags: [${entity.tags ? [...entity.tags] : 'undefined'}]`);
        
        // ENHANCED CLEANUP: Multiple checks to ensure entity is removed from enemies tracking
        // 1. Direct check and remove
        if (this.enemies.has(entity.id)) {
            this.enemies.delete(entity.id);
            console.log(`Removed entity ${entity.id} from enemies tracking`);
        }
        
        // 2. Remove enemy tag FIRST, before adding pooled tag
        // This ensures consistent state before any other operations
        if (entity.hasTag && entity.hasTag('enemy')) {
            entity.removeTag('enemy');
            console.log(`Explicitly removed 'enemy' tag from entity ${entity.id}`);
        }
        
        // Only return to pool if it's not full
        if (this.enemyPool.length < this.maxPoolSize) {
            // TRAIL CLEANUP: Remove trail component and its visual elements first
            // This is critical to prevent the trail from persisting after enemy destruction
            const trailComponent = entity.getComponent('TrailComponent');
            if (trailComponent) {
                try {
                    // Call the onDetached method if it exists to clean up resources
                    if (typeof trailComponent.onDetached === 'function') {
                        trailComponent.onDetached();
                    }
                    
                    // Remove from trail system tracking if it exists
                    if (window.game && window.game.trailSystem) {
                        window.game.trailSystem.unregisterTrail && 
                        window.game.trailSystem.unregisterTrail(entity.id);
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
                    entity.removeComponent('TrailComponent');
                    console.log(`Removed and cleaned up TrailComponent from entity ${entity.id}`);
                } catch (error) {
                    console.error(`Error cleaning up trail for entity ${entity.id}:`, error);
                }
            }
            
            // Reset the entity's transform
            const transform = entity.getComponent('TransformComponent');
            if (transform) {
                transform.position.set(0, 0, 0);
                transform.rotation.set(0, 0, 0);
                transform.scale.set(1, 1, 1);
            }
            
            // Reset health if present
            const health = entity.getComponent('HealthComponent');
            if (health) {
                health.health = 0;
                health.isDestroyed = true;
            }
            
            // Disable AI component if present
            const enemyAI = entity.getComponent('EnemyAIComponent');
            if (enemyAI) {
                enemyAI.enabled = false;
            }
            
            // Clean up and hide mesh
            const meshComponent = entity.getComponent('MeshComponent');
            if (meshComponent && meshComponent.mesh) {
                // Remove from scene first
                if (meshComponent.mesh.parent) {
                    meshComponent.mesh.parent.remove(meshComponent.mesh);
                }
                
                // Make the mesh invisible
                meshComponent.mesh.visible = false;
            }
            
            // Disable rigidbody physics
            const rigidbody = entity.getComponent('RigidbodyComponent');
            if (rigidbody) {
                rigidbody.isFrozen = true;
                if (rigidbody.velocity) {
                    rigidbody.velocity.set(0, 0, 0);
                }
            }

            // IMPROVED TAG HANDLING:
            // Clear ALL tags first (this uses our new proper method)
            if (entity.clearTags && typeof entity.clearTags === 'function') {
                entity.clearTags();
                console.log(`Cleared all tags from entity ${entity.id}`);
            } else {
                // Fallback if clearTags is not available
                console.warn(`No clearTags method on entity ${entity.id}, using manual tag removal`);
                if (entity.hasTag && entity.removeTag) {
                    // Get a copy of all tags
                    const allTags = entity.tags ? [...entity.tags] : [];
                    
                    // Remove each tag
                    for (const tag of allTags) {
                        entity.removeTag(tag);
                    }
                }
            }
            
            // Only now, add the pooled tag when entity is in a clean state
            entity.addTag('pooled');
            console.log(`Entity ${entity.id} now has ONLY 'pooled' tag: [${entity.tags ? [...entity.tags] : 'undefined'}]`);
            
            // Double-check for any tag inconsistencies
            if (entity.hasTag && entity.hasTag('enemy')) {
                console.warn(`INCONSISTENCY DETECTED: Entity ${entity.id} still has 'enemy' tag after cleanup!`);
                entity.removeTag('enemy');
                console.log(`Fixed inconsistency by force removing 'enemy' tag`);
            }
            
            // Add to pool
            this.enemyPool.push(entity);
            
            console.log(`Entity ${entity.id} returned to pool. Pool size now ${this.enemyPool.length}`);
        } else {
            // If pool is full, destroy the entity
            console.log(`Pool is full (${this.maxPoolSize}), destroying entity ${entity.id} instead of pooling`);
            
            // CRITICAL FIX: Ensure entity is completely destroyed
            if (this.world && this.world.destroyEntity) {
                this.world.destroyEntity(entity.id);
                console.log(`Entity ${entity.id} fully destroyed`);
            } else {
                console.error(`Failed to destroy entity ${entity.id} - world or destroyEntity method not available`);
            }
        }
        
        // Always validate references after returning to pool
        // This is an additional safety check
        this.validateEnemyReferences();
    }
    
    /**
     * Set up event listeners for enemy-related events
     */
    setupEventListeners() {
        // Listen for entity.destroyed events to track destroyed enemies
        this.world.messageBus.subscribe('entity.destroyed', this.handleEntityDestroyed.bind(this));
        
        // Listen for player docking/undocking events
        // Make sure we properly bind 'this' to the handlers to maintain context
        this.world.messageBus.subscribe('player.docked', this.handlePlayerDocked.bind(this));
        this.world.messageBus.subscribe('player.undocked', this.handlePlayerUndocked.bind(this));
        
        // Log that we've set up the event listeners
        console.log("Enemy system: Event listeners set up for player docking/undocking");
    }
    
    /**
     * Handle player docked event
     * @param {object} message Event message
     */
    handlePlayerDocked(message) {
        console.log("Enemy system detected player docked - freezing enemies");
        
        // Set the docked state first
        this.playerIsDocked = true;
        
        // Then freeze all enemies
        this.freezeAllEnemies();
        
        // Additional logging for debug purposes
        console.log(`Froze ${this.enemies.size} enemies due to player docking`);
    }
    
    /**
     * Handle player undocked event
     * @param {object} message Event message
     */
    handlePlayerUndocked(message) {
        console.log("Enemy system detected player undocked - resuming enemy activities");
        
        // Set the docked state first
        this.playerIsDocked = false;
        
        // Then unfreeze all enemies
        this.unfreezeAllEnemies();
        
        // Additional logging for debug purposes
        console.log(`Unfroze ${this.enemies.size} enemies due to player undocking`);
    }
    
    /**
     * Update all enemy entities
     * @param {number} deltaTime Time since last update in seconds
     */
    update(deltaTime) {
        // First check if there's a global docked state from the game object
        // This ensures we capture docking state from other sources
        if (window.game && window.game.spaceship && window.game.spaceship.isDocked !== undefined) {
            // If global docking state has changed, update our internal state
            if (this.playerIsDocked !== window.game.spaceship.isDocked) {
                console.log(`Enemy system syncing docked state from global: ${window.game.spaceship.isDocked}`);
                this.playerIsDocked = window.game.spaceship.isDocked;
                
                // Apply the appropriate freeze/unfreeze based on the new state
                if (this.playerIsDocked) {
                    this.freezeAllEnemies();
                } else {
                    this.unfreezeAllEnemies();
                }
            }
        }
        
        // Skip normal processing if player is docked
        if (this.playerIsDocked) {
            // Don't call super.update() which would run processEntity on all entities
            // We just want to maintain the frozen state
            return;
        }
        
        // Process all enemy entities through processEntity
        super.update(deltaTime);
        
        // Update spawn timer
        this.spawnTimer += deltaTime;
        
        // Run diagnostics more frequently (every 3 seconds instead of 10)
        if (!this._lastDiagnosticTime) {
            this._lastDiagnosticTime = 0;
        }
        this._lastDiagnosticTime += deltaTime;
        
        if (this._lastDiagnosticTime >= 3) {
            this.runPoolDiagnostics();
            this._lastDiagnosticTime = 0;
        }
        
        // Validate enemy references before spawn decision to ensure accurate count
        this.validateEnemyReferences();
        
        // STRICT ENFORCEMENT: If we're over the limit, force destroy excess enemies
        if (this.enemies.size > this.maxEnemies) {
            console.warn(`ENFORCING ENEMY LIMIT: Current count ${this.enemies.size} exceeds limit of ${this.maxEnemies}`);
            this.enforceEnemyLimit();
        }
        
        // Debug logging - show current enemy count and spawn timer
        if (this.spawnTimer > this.spawnInterval * 0.9 || this.enemies.size === 0) {
            console.log(`Spawn status: ${this.enemies.size}/${this.maxEnemies} enemies, timer: ${this.spawnTimer.toFixed(1)}/${this.spawnInterval} seconds`);
        }
        
        // Check if we should spawn new enemies - STRICTER CHECK with >= instead of >
        if (this.spawnTimer >= this.spawnInterval && this.enemies.size < this.maxEnemies) {
            // Spawn spectral drone
            console.log("=== SPAWNING SPECTRAL DRONE ===");
            
            // Get a spawn point
            const spawnPoint = this.getRandomSpawnPoint();
            if (!spawnPoint) {
                console.error("Failed to get spawn point! Generating new spawn points.");
                this.generateSpawnPoints();
                return;
            }
            
            // Spawn the drone
            const drone = this.spawnSpectralDrone(spawnPoint);
            
            // Verify the drone was properly created and tracked
            if (drone) {
                console.log(`Successfully spawned drone with ID: ${drone.id}, current count: ${this.enemies.size}/${this.maxEnemies}`);
            } else {
                console.error("Failed to spawn drone!");
            }
            
            // Reset spawn timer
            this.spawnTimer = 0;
        }
        
        // FAILSAFE: If we have no enemies and it's been a while since spawning,
        // reset the enemy count and regenerate spawn points
        if (this.enemies.size === 0 && this.spawnTimer > this.spawnInterval * 2) {
            console.warn("FAILSAFE: No enemies detected for extended period. Resetting spawn system.");
            this.enemies.clear();
            this.generateSpawnPoints();
            this.spawnTimer = this.spawnInterval; // Force a spawn next frame
        }
    }
    
    /**
     * Validate enemy references to ensure all tracked enemies exist
     * This helps prevent "ghost" references that block new spawns
     */
    validateEnemyReferences() {
        // Store original size for logging
        const originalSize = this.enemies.size;
        
        // Create a new Set to hold valid enemy IDs
        const validEnemies = new Set();
        
        // Check each enemy ID in our tracking Set
        for (const enemyId of this.enemies) {
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
                    console.warn(`Removing invalid enemy reference: ${enemyId} - Entity missing 'enemy' tag. Tags: [${[...entity.tags]}]`);
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
        this.enemies = validEnemies;
        
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
                        // CRITICAL FIX: First check if enemy is pooled BEFORE adding to tracking
                        if (!enemy.hasTag('pooled')) {
                            if (!this.enemies.has(enemy.id)) {
                                console.log(`Found untracked enemy: ${enemy.id}, adding to tracking. Tags: [${[...enemy.tags]}]`);
                                this.enemies.add(enemy.id);
                            }
                        } else {
                            // Make sure pooled enemies are not in our tracking
                            if (this.enemies.has(enemy.id)) {
                                console.log(`Removing pooled enemy from tracking: ${enemy.id}`);
                                this.enemies.delete(enemy.id);
                            }
                            
                            // CRITICAL FIX: If an entity is pooled but still has the enemy tag, 
                            // remove the enemy tag to fix the inconsistency
                            if (enemy.hasTag('enemy')) {
                                console.log(`Fixing inconsistent tag state: pooled entity ${enemy.id} still has 'enemy' tag`);
                                enemy.removeTag('enemy');
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error during entity scan:", error);
        }
        
        // Log if we fixed any tracking issues
        if (originalSize !== this.enemies.size) {
            console.log(`Enemy tracking corrected: ${originalSize} -> ${this.enemies.size} enemies tracked. Scanned ${entitiesScanned} entities.`);
        }
    }
    
    /**
     * Freeze all enemy entities in place
     */
    freezeAllEnemies() {
        // Filter out pooled (inactive) enemies
        const activeEnemies = Array.from(this.enemies).filter(enemyId => {
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
            const rigidbody = enemy.getComponent('RigidbodyComponent');
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
            const enemyAI = enemy.getComponent('EnemyAIComponent');
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
     */
    unfreezeAllEnemies() {
        // Filter out pooled (inactive) enemies
        const activeEnemies = Array.from(this.enemies).filter(enemyId => {
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
            const rigidbody = enemy.getComponent('RigidbodyComponent');
            if (rigidbody) {
                // Un-mark as frozen
                rigidbody.isFrozen = false;
            }
            
            // Get the enemy AI component
            const enemyAI = enemy.getComponent('EnemyAIComponent');
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
     * Process a single enemy entity
     * @param {Entity} entity Entity to process
     * @param {number} deltaTime Time since last update in seconds
     */
    processEntity(entity, deltaTime) {
        // Get enemy AI component
        const enemyAI = entity.getComponent('EnemyAIComponent');
        
        // Skip if entity is missing an enemy AI component
        if (!enemyAI) return;
        
        // Get transform component
        const transform = entity.getComponent('TransformComponent');
        
        // Skip if entity is missing a transform component
        if (!transform) return;
        
        // Get mesh component
        const meshComponent = entity.getComponent('MeshComponent');
        
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
        }
        
        // Call the component's update method
        enemyAI.update(deltaTime);
        
        // Get health component to update shield regeneration
        const health = entity.getComponent('HealthComponent');
        if (health) {
            health.update(deltaTime);
        }
    }
    
    /**
     * Get a random spawn point for enemies
     * @returns {THREE.Vector3} Spawn position
     */
    getRandomSpawnPoint() {
        // Make sure spawn points are available
        if (this.spawnPoints.length === 0) {
            this.generateSpawnPoints();
        }
        
        // Choose a random spawn point
        if (this.spawnPoints.length > 0) {
            const index = Math.floor(Math.random() * this.spawnPoints.length);
            return this.spawnPoints[index].clone();
        } else {
            // Fallback - spawn at a fixed distance from origin
            console.warn("No spawn points available, using fallback position");
            const angle = Math.random() * Math.PI * 2;
            const distance = 2000;
            return new THREE.Vector3(
                Math.cos(angle) * distance,
                (Math.random() - 0.5) * 500,
                Math.sin(angle) * distance
            );
        }
    }
    
    /**
     * Generate spawn points for enemies based on player position
     */
    generateSpawnPoints() {
        // Clear existing spawn points
        this.spawnPoints = [];
        
        // Find player position
        const players = this.world.entityManager.getEntitiesByTag('player');
        if (players.length === 0) {
            // Default spawn points in a circle around origin if no player found
            const radius = 3000;
            const count = 10;
            
            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2;
                const x = Math.cos(angle) * radius;
                const y = (Math.random() - 0.5) * 1000;
                const z = Math.sin(angle) * radius;
                this.spawnPoints.push(new THREE.Vector3(x, y, z));
            }
            
            console.log(`Generated ${this.spawnPoints.length} default spawn points around origin`);
            return;
        }
        
        // Get player position
        const player = players[0];
        const transform = player.getComponent('TransformComponent');
        if (!transform) {
            console.warn("Player entity has no transform component, using default spawn points");
            return;
        }
        
        // Generate spawn points in a sphere around player
        const center = transform.position.clone();
        const radius = 2500; // Spawn at a reasonable distance
        const count = 12;
        
        for (let i = 0; i < count; i++) {
            // Generate random points on a sphere
            const phi = Math.acos(2 * Math.random() - 1);
            const theta = Math.random() * Math.PI * 2;
            
            const x = center.x + radius * Math.sin(phi) * Math.cos(theta);
            const y = center.y + radius * Math.sin(phi) * Math.sin(theta);
            const z = center.z + radius * Math.cos(phi);
            
            this.spawnPoints.push(new THREE.Vector3(x, y, z));
        }
        
        console.log(`Generated ${this.spawnPoints.length} spawn points around player at position ${center.x.toFixed(0)}, ${center.y.toFixed(0)}, ${center.z.toFixed(0)}`);
    }
    
    /**
     * Handle entity destroyed event
     * @param {object} message Event message
     */
    handleEntityDestroyed(message) {
        // Check if the destroyed entity is one of our enemies
        const entity = message.entity;
        if (!entity) {
            console.warn("Entity destroyed event received but no entity in message!");
            return;
        }
        
        // IMPROVED CHECK: Look for either entity.hasTag('enemy') OR entity.id in this.enemies
        // This ensures we catch all cases where an enemy is destroyed
        if ((entity.hasTag && entity.hasTag('enemy')) || this.enemies.has(entity.id)) {
            // IMPORTANT: Store entity ID locally before further processing
            const entityId = entity.id;
            
            console.log(`Enemy destroyed: ${entityId}`);
            
            // TRAIL CLEANUP: Ensure any trails are properly removed
            // This prevents the "line to center" visual bug
            const trailComponent = entity.getComponent('TrailComponent');
            if (trailComponent) {
                try {
                    // Call onDetached to clean up resources
                    if (typeof trailComponent.onDetached === 'function') {
                        trailComponent.onDetached();
                    }
                    
                    // Unregister from trail system if available
                    if (window.game && window.game.trailSystem) {
                        window.game.trailSystem.unregisterTrail && 
                        window.game.trailSystem.unregisterTrail(entityId);
                    }
                    
                    // If the trail has a mesh, remove it from the scene
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
                    entity.removeComponent('TrailComponent');
                    console.log(`Cleaned up trail component for destroyed enemy ${entityId}`);
                } catch (error) {
                    console.error(`Error cleaning up trail for entity ${entityId}:`, error);
                }
            }
            
            // Clean up mesh resources before returning to pool
            const meshComponent = entity.getComponent('MeshComponent');
            if (meshComponent && meshComponent.mesh) {
                try {
                    // Remove from scene if it has a parent
                    if (meshComponent.mesh.parent) {
                        meshComponent.mesh.parent.remove(meshComponent.mesh);
                    }
                } catch (error) {
                    console.error(`Error cleaning up mesh for entity ${entityId}:`, error);
                }
            }
            
            // Remove from tracked enemies - MORE AGGRESSIVE CHECK
            // Remove even if not explicitly in the set to ensure clean state
            this.enemies.delete(entityId);
            
            // Increment destroyed counter
            this.enemiesDestroyed++;
            
            // Log remaining enemies
            console.log(`Enemy ${entityId} removed from tracking. Enemies remaining: ${this.enemies.size}/${this.maxEnemies}`);
            
            // ENSURE PROPER CLEANUP: Make sure entity doesn't have enemy tag
            if (entity.hasTag && entity.hasTag('enemy')) {
                console.log(`Explicitly removing 'enemy' tag from destroyed entity ${entityId}`);
                entity.removeTag('enemy');
            }
            
            // Return the entity to the pool
            this.returnEnemyToPool(entity);
            console.log(`Returned enemy ${entityId} to pool`);
            
            // Force spawn point regeneration after several enemies have been destroyed
            if (this.enemiesDestroyed % 5 === 0) {
                console.log("Regenerating spawn points after multiple enemy destructions");
                this.generateSpawnPoints();
            }
            
            // CRITICAL: If this was the last enemy, make sure to reset the spawn timer
            // to avoid long waits for the next enemy
            if (this.enemies.size === 0) {
                console.log("All enemies destroyed - accelerating next spawn");
                // Set the timer to be almost at the spawn interval
                this.spawnTimer = Math.max(this.spawnTimer, this.spawnInterval * 0.8);
            }
            
            // Force validation to catch any remaining inconsistencies
            this.validateEnemyReferences();
        }
    }
    
    /**
     * Called when the system is disabled
     */
    onDisabled() {
        // Clear monitoring interval
        if (this.spawnMonitorInterval) {
            clearInterval(this.spawnMonitorInterval);
            this.spawnMonitorInterval = null;
            console.log("Spawn monitoring stopped");
        }
        
        // Clean up any tracked enemies
        this.enemies.clear();
        
        console.log("Enemy system disabled");
    }

    /**
     * Spawns a spectral drone at the given position
     * @param {THREE.Vector3} position The position to spawn at
     * @returns {Entity} The created entity
     */
    spawnSpectralDrone(position) {
        console.log("Setting up spectral drone config...");
        
        // STRICT LIMIT CHECK: Do not spawn if already at or over capacity
        if (this.enemies.size >= this.maxEnemies) {
            console.warn(`SPAWN BLOCKED: Already at maximum enemies (${this.enemies.size}/${this.maxEnemies})`);
            return null;
        }
        
        // Get a spectral drone from the pool
        const entity = this.getEnemyFromPool();
        
        // VERIFICATION: Double-check that entity is clean before using
        if (entity.hasTag('enemy')) {
            console.warn(`Entity from pool still has enemy tag! Clearing all tags...`);
            if (entity.clearTags && typeof entity.clearTags === 'function') {
                entity.clearTags();
            } else if (entity.hasTag && entity.removeTag) {
                entity.removeTag('enemy');
            }
        }
        
        // Add enemy tags that were not added during pooling
        entity.addTag('enemy');
        entity.addTag('spectrals');
        
        // Add some randomness to the drone properties for visual variety
        const amplitude = this.enemyConfig.spiralAmplitude * (0.8 + Math.random() * 0.4); // 80-120% of base
        const frequency = this.enemyConfig.spiralFrequency * (0.9 + Math.random() * 0.2); // 90-110% of base
        const speed = this.enemyConfig.speed * (0.7 + Math.random() * 0.6); // 70-130% of base
        
        // Configure transform
        const transform = entity.getComponent('TransformComponent');
        if (transform) {
            transform.position.copy(position);
            transform.scale.set(50, 50, 50);
            transform.needsUpdate = true;
        } else {
            const newTransform = new TransformComponent(position);
            newTransform.scale.set(50, 50, 50);
            entity.addComponent(newTransform);
        }
        
        // Add or update health component
        let health = entity.getComponent('HealthComponent');
        if (!health) {
            health = new HealthComponent(this.enemyConfig.health, 0);
            entity.addComponent(health);
        } else {
            health.maxHealth = this.enemyConfig.health;
            health.health = this.enemyConfig.health;
            health.isDestroyed = false;
        }
        
        // Configure AI component
        let enemyAI = entity.getComponent('EnemyAIComponent');
        if (!enemyAI) {
            const config = {
                faction: 'spectrals',
                type: 'drone',
                health: this.enemyConfig.health,
                damage: this.enemyConfig.damage,
                speed: speed,
                spiralAmplitude: amplitude,
                spiralFrequency: frequency
            };
            enemyAI = new EnemyAIComponent(config);
            entity.addComponent(enemyAI);
        } else {
            enemyAI.faction = 'spectrals';
            enemyAI.type = 'drone';
            enemyAI.damage = this.enemyConfig.damage;
            enemyAI.speed = speed;
            enemyAI.spiralAmplitude = amplitude;
            enemyAI.spiralFrequency = frequency;
            enemyAI.enabled = true;
        }
        
        // IMPORTANT: Completely recreate the mesh to ensure proper appearance
        const spectralMesh = this.createSpectralDroneMesh();
        
        // Get existing mesh component if any
        let meshComponent = entity.getComponent('MeshComponent');
        
        // If we don't have a mesh component, create one
        if (!meshComponent) {
            meshComponent = new MeshComponent(spectralMesh.geometry, spectralMesh.material);
            entity.addComponent(meshComponent);
        } else {
            // Create new mesh directly
            if (meshComponent.mesh) {
                // Remove from scene if it has a parent
                if (meshComponent.mesh.parent) {
                    meshComponent.mesh.parent.remove(meshComponent.mesh);
                }
                
                // Clean up old resources
                if (meshComponent.mesh.geometry) {
                    meshComponent.mesh.geometry.dispose();
                }
                
                if (meshComponent.mesh.material) {
                    if (Array.isArray(meshComponent.mesh.material)) {
                        meshComponent.mesh.material.forEach(mat => mat.dispose());
                    } else {
                        meshComponent.mesh.material.dispose();
                    }
                }
            }
            
            // Create a new Three.js mesh
            const newMesh = new THREE.Mesh(spectralMesh.geometry, spectralMesh.material);
            
            // Assign it to the component
            meshComponent.mesh = newMesh;
        }
        
        // Ensure the mesh will be added to the scene
        meshComponent.onAddedToScene = function(scene) {
            if (this.mesh && !this.mesh.parent && scene) {
                console.log("Adding spectral drone mesh to scene");
                scene.add(this.mesh);
            }
        };
        
        // Try to add to the scene immediately if it's available
        if (this.world && this.world.scene && meshComponent.mesh) {
            // Make the mesh visible
            meshComponent.mesh.visible = true;
            
            // Add to scene
            this.world.scene.add(meshComponent.mesh);
            
            // Ensure mesh position, rotation, and scale match entity transform
            meshComponent.mesh.position.copy(transform.position);
            meshComponent.mesh.quaternion.copy(transform.quaternion);
            meshComponent.mesh.scale.copy(transform.scale);
            
            console.log("Added spectral drone mesh to scene immediately");
        }
        
        // Add physics if needed
        let rigidbody = entity.getComponent('RigidbodyComponent');
        if (!rigidbody) {
            rigidbody = new RigidbodyComponent(1);
            rigidbody.useGravity = false;
            rigidbody.drag = 0.1;
            rigidbody.shape = 'sphere';
            rigidbody.collisionRadius = 50;
            entity.addComponent(rigidbody);
        } else {
            rigidbody.isFrozen = false;
            rigidbody.velocity.set(0, 0, 0);
            // Make sure collision radius is set correctly
            rigidbody.collisionRadius = 50;
        }
        
        // Add trail effect if not already present
        if (!entity.getComponent('TrailComponent')) {
            this.addSpectralTrail(entity, transform);
        }
        
        // SYNCHRONIZATION FIX: Remove any existing references to this entity ID before adding
        // This prevents duplicate tracking if an entity with the same ID is already tracked
        this.enemies.delete(entity.id);
        
        // Track this enemy
        this.enemies.add(entity.id);
        this.lastSpawnTime = Date.now();
        
        // VERIFICATION: Double-check that enemy has required tag after setup
        if (!entity.hasTag('enemy')) {
            console.warn(`CRITICAL ERROR: Entity ${entity.id} missing 'enemy' tag after setup!`);
            entity.addTag('enemy'); // Force re-add the tag
        }
        
        // GLOBAL SYNCHRONIZATION: Register this entity with combat module if available
        if (window.game && window.game.combat) {
            // Inform other systems about this enemy
            window.game.combat.registerEnemy && window.game.combat.registerEnemy(entity.id);
        }
        
        console.log(`Spawned spectral drone at position: x=${position.x.toFixed(0)}, y=${position.y.toFixed(0)}, z=${position.z.toFixed(0)}`);
        console.log(`Properties: Speed=${enemyAI.speed}, Amplitude=${enemyAI.spiralAmplitude}, Frequency=${enemyAI.spiralFrequency}`);
        
        // ADDITIONAL LOGGING: Log the current state after spawn
        console.log(`Current enemy count after spawn: ${this.enemies.size}/${this.maxEnemies}`);
        
        return entity;
    }

    /**
     * Start monitoring the spawn system health
     */
    startSpawnMonitoring() {
        // Set up an interval to check spawn system health
        this.spawnMonitorInterval = setInterval(() => {
            this.checkSpawnSystemHealth();
        }, 10000); // Check every 10 seconds
        
        console.log("Spawn system monitoring started");
    }
    
    /**
     * Check the health of the spawn system
     */
    checkSpawnSystemHealth() {
        const now = Date.now();
        const timeSinceLastSpawn = (now - this.lastSpawnTime) / 1000; // in seconds
        
        console.log(`Spawn system health check: ${this.enemies.size}/${this.maxEnemies} enemies, ${timeSinceLastSpawn.toFixed(1)}s since last spawn`);
        
        // If no spawns have happened in a while and we're below max enemies, something might be wrong
        if (timeSinceLastSpawn > this.spawnInterval * 3 && this.enemies.size < this.maxEnemies) {
            console.warn("Spawn system appears stuck! Performing recovery...");
            
            // Recover the spawn system
            this.enemies.clear(); // Reset tracked enemies
            this.generateSpawnPoints(); // Regenerate spawn points
            this.spawnTimer = this.spawnInterval; // Force spawn soon
            
            // Validate enemy references
            this.validateEnemyReferences();
            
            console.log("Spawn system recovery completed");
        }
    }

    /**
     * Clear all tracked enemies
     */
    clearAllEnemies() {
        // Log the current count
        console.log(`Clearing all enemies. Current count: ${this.enemies.size}`);
        
        // Clear the enemies Set
        this.enemies.clear();
        
        // Verify
        console.log(`After clearing, enemy count: ${this.enemies.size}`);
    }

    /**
     * Adds a spectral trail effect to an enemy entity
     * @param {Entity} entity The enemy entity
     * @param {TransformComponent} transform The entity's transform component
     */
    addSpectralTrail(entity, transform) {
        // Create a special trail component for the spectral drone
        const trailComponent = new TrailComponent({
            maxPoints: 50,           // Trail length in points
            pointDistance: 5,         // Min distance to record a new point
            width: 20,                // Trail width
            color: 0x00ccff,          // Cyan-blue color
            fadeTime: 2.0,            // Seconds to fade out
            transparent: true,
            alphaTest: 0.01,
            blending: THREE.AdditiveBlending, // Additive blending for glow effect
            pulse: true,              // Make the trail pulse
            pulseSpeed: 1.5,          // Speed of pulsing
            tapering: true,           // Taper the end of the trail
            glow: true                // Add glow effect
        });
        
        // IMPORTANT: Initialize the trail with the current entity position
        // This ensures the trail starts from the entity's current position 
        // and not from the origin (0,0,0)
        if (transform && transform.position) {
            // Initialize points array with current position to prevent "line to center" visual bug
            trailComponent.lastPosition = transform.position.clone();
            
            // If the trailComponent has a points array, initialize it with the current position
            if (trailComponent.points) {
                trailComponent.points = [transform.position.clone()];
            }
            
            // If the component has an initializeTrail method, call it
            if (typeof trailComponent.initializeTrail === 'function') {
                trailComponent.initializeTrail(transform.position);
            }
        }
        
        // Attach the trail component to the entity
        entity.addComponent(trailComponent);
        
        // Check if the world has a registered trail system
        let trailSystemRegistered = false;
        
        // Method 1: Check for a global trail system
        if (window.game && window.game.trailSystem) {
            window.game.trailSystem.registerTrail(entity.id, trailComponent);
            trailSystemRegistered = true;
        }
        
        // Method 2: Check if the world has a trail system in its system manager
        if (!trailSystemRegistered && this.world && this.world.systemManager) {
            const trailSystem = this.world.systemManager.getSystem('TrailSystem');
            if (trailSystem) {
                trailSystem.registerTrail(entity.id, trailComponent);
                trailSystemRegistered = true;
            }
        }
        
        // If no trail system is registered, we'll need to manually initialize the trail
        if (!trailSystemRegistered) {
            console.log("No trail system found - initializing trail component directly");
            // The trail component will self-initialize when attached to the entity
        }
        
        console.log(`Added trail component to entity ${entity.id} at position (${transform.position.x.toFixed(0)}, ${transform.position.y.toFixed(0)}, ${transform.position.z.toFixed(0)})`);
        
        return trailComponent;
    }

    /**
     * Creates a spectral drone mesh programmatically
     * @returns {Object} Object containing geometry and material
     */
    createSpectralDroneMesh() {
        console.log("Creating enhanced spectral drone mesh...");
        
        // We'll use a modified icosahedron with displacement for a more crystalline look
        // This still works with the physics system but looks more interesting
        const geometry = new THREE.IcosahedronGeometry(0.8, 2); // Higher detail
        
        // Create a random seed for this particular drone
        const randomSeed = Math.random() * 100;
        
        // Apply distortion to the geometry to create a crystalline form
        const positionAttribute = geometry.attributes.position;
        
        for (let i = 0; i < positionAttribute.count; i++) {
            const x = positionAttribute.getX(i);
            const y = positionAttribute.getY(i);
            const z = positionAttribute.getZ(i);
            
            // Apply noise-based displacement for a crystalline effect
            const noise = 0.2 * Math.sin(5 * x + randomSeed) * Math.cos(3 * y + randomSeed) * Math.sin(2 * z);
            
            // Keep the core shape but add the noise
            positionAttribute.setX(i, x * (1.0 + noise));
            positionAttribute.setY(i, y * (1.0 + noise));
            positionAttribute.setZ(i, z * (1.0 + noise));
        }
        
        // Apply the changes
        positionAttribute.needsUpdate = true;
        
        // Create a glowing, ethereal material with shimmering effect
        // Randomly choose one of three color schemes for variety
        const colorScheme = Math.floor(Math.random() * 3);
        let mainColor, emissiveColor, specularColor;
        
        switch (colorScheme) {
            case 0: // Blue/cyan
                mainColor = 0x00ccff;
                emissiveColor = 0x0088ff;
                specularColor = 0xaaffff;
                break;
            case 1: // Purple/blue
                mainColor = 0x8866ff;
                emissiveColor = 0x6633ff;
                specularColor = 0xccaaff;
                break;
            case 2: // Teal/green
                mainColor = 0x00ffcc;
                emissiveColor = 0x00bb99;
                specularColor = 0xaaffee;
                break;
        }
        
        // Create the material with the selected color scheme
        const material = new THREE.MeshPhongMaterial({
            color: mainColor,
            emissive: emissiveColor,
            emissiveIntensity: 2.0,
            specular: specularColor,
            shininess: 150,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide,
            flatShading: true
        });
        
        console.log(`Spectral drone mesh created with color scheme ${colorScheme}`);
        
        return {
            geometry: geometry,
            material: material
        };
    }

    /**
     * Run diagnostics on the enemy pool system to detect and fix inconsistencies
     */
    runPoolDiagnostics() {
        console.log("=== RUNNING ENEMY POOL DIAGNOSTICS ===");
        console.log(`Active enemies: ${this.enemies.size}, Pool size: ${this.enemyPool.length}`);
        
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
                    
                    // Fix by removing enemy tag - pooled entities shouldn't be active enemies
                    entity.removeTag('enemy');
                    console.log(`Fixed entity ${entity.id} by removing 'enemy' tag while keeping 'pooled' tag`);
                }
            }
            
            // Check for inconsistent state: pooled entities in active enemies set
            for (const entityId of this.enemies) {
                const entity = this.world.getEntity(entityId);
                if (entity && entity.hasTag('pooled')) {
                    console.warn(`INCONSISTENT TRACKING: Entity ${entityId} is in active enemies but has 'pooled' tag`);
                    this.enemies.delete(entityId);
                    console.log(`Fixed by removing entity ${entityId} from active enemies set`);
                    inconsistentEntities++;
                }
            }
            
            // Check enemy pool for issues
            for (let i = 0; i < this.enemyPool.length; i++) {
                const entity = this.enemyPool[i];
                if (!entity.hasTag('pooled')) {
                    console.warn(`INCONSISTENT POOL: Entity ${entity.id} in enemy pool but missing 'pooled' tag`);
                    entity.addTag('pooled');
                    console.log(`Fixed by adding 'pooled' tag to entity ${entity.id}`);
                    inconsistentEntities++;
                }
                if (entity.hasTag('enemy')) {
                    console.warn(`INCONSISTENT POOL: Entity ${entity.id} in enemy pool but has 'enemy' tag`);
                    entity.removeTag('enemy');
                    console.log(`Fixed by removing 'enemy' tag from entity ${entity.id}`);
                    inconsistentEntities++;
                }
            }
        }
        
        console.log(`Diagnostic results: ${enemyTaggedCount} entities with 'enemy' tag, ${pooledTaggedCount} entities with 'pooled' tag`);
        console.log(`Fixed ${inconsistentEntities} inconsistencies`);
        console.log("=== DIAGNOSTICS COMPLETE ===");
    }

    /**
     * Force destroy excess enemies to enforce the enemy limit
     */
    enforceEnemyLimit() {
        // Convert to array for easier manipulation
        const enemyIds = [...this.enemies];
        
        // Calculate how many enemies to remove
        const excessCount = this.enemies.size - this.maxEnemies;
        if (excessCount <= 0) return;
        
        console.log(`Enforcing enemy limit by removing ${excessCount} excess enemies`);
        
        // Remove the oldest enemies first (at the start of the array)
        for (let i = 0; i < excessCount && i < enemyIds.length; i++) {
            const entityId = enemyIds[i];
            const entity = this.world.getEntity(entityId);
            
            if (entity) {
                console.log(`Force destroying excess enemy ${entityId}`);
                
                // Remove from tracking first
                this.enemies.delete(entityId);
                
                // If entity has health component, mark as destroyed
                const health = entity.getComponent('HealthComponent');
                if (health) {
                    health.health = 0;
                    health.isDestroyed = true;
                }
                
                // Create explosion effect
                if (this.world && this.world.messageBus) {
                    const transform = entity.getComponent('TransformComponent');
                    if (transform) {
                        this.world.messageBus.publish('vfx.explosion', {
                            position: transform.position.clone(),
                            scale: 1.0,
                            duration: 1.0
                        });
                    }
                }
                
                // Return to pool or destroy completely
                this.returnEnemyToPool(entity);
            } else {
                // If entity doesn't exist, just remove from tracking
                this.enemies.delete(entityId);
            }
        }
        
        // Validate references after cleanup
        this.validateEnemyReferences();
    }
}