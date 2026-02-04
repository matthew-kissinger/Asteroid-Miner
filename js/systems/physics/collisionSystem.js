/**
 * CollisionSystem - Handles collision detection and resolution
 * 
 * Manages spatial partitioning and collision responses.
 */

import * as THREE from 'three';
import { System } from '../../core/system.ts';
import { FixedArray } from '../../utils/memoryManager.ts';

export class CollisionSystem extends System {
    constructor(world) {
        super(world);
        this.requiredComponents = ['TransformComponent', 'RigidbodyComponent'];
        this.priority = 20; // Run after movement system
        
        // Spatial partitioning grid
        this.cells = new Map();
        this.cellSize = 2000; // Size of each spatial cell (4x the original 500)
        
        // Collision tracking to prevent duplicates
        this.processedCollisions = new Set();
        
        // Keep track of entities per cell for quick lookup
        this.entityCells = new Map();
        
        // Pre-allocated arrays to avoid garbage collection
        this.potentialColliders = new FixedArray(200); // Pre-allocate for 200 potential colliders
        this.cellsToCheck = new FixedArray(27); // 3^3 neighboring cells
        
        // Reusable vectors for collision calculations
        this.tempVec1 = new THREE.Vector3();
        this.tempVec2 = new THREE.Vector3();
        this.collisionNormal = new THREE.Vector3();
        this.relativeVelocity = new THREE.Vector3();
    }
    
    /**
     * Process all entities for collisions
     * @param {number} deltaTime Time since last update in seconds
     */
    update(deltaTime) {
        // Clear spatial grid and tracking sets
        this.cells.clear();
        this.processedCollisions.clear();
        this.entityCells.clear();
        
        // Get all entities with required components
        const entities = this.getEntities();
        
        // First pass: populate spatial partitioning grid
        for (let i = 0; i < entities.length; i++) {
            this._insertIntoGrid(entities[i]);
        }
        
        // Second pass: check for collisions using spatial partitioning
        for (let i = 0; i < entities.length; i++) {
            this._checkCollisionsOptimized(entities[i], deltaTime);
        }
    }
    
    /**
     * Insert entity into spatial partitioning grid
     * @param {Entity} entity Entity to insert
     * @private
     */
    _insertIntoGrid(entity) {
        const transform = entity.getComponent('TransformComponent');
        const rigidbody = entity.getComponent('RigidbodyComponent');
        
        if (!transform || !rigidbody) return;
        
        // Calculate cell coordinates
        const cellX = Math.floor(transform.position.x / this.cellSize);
        const cellY = Math.floor(transform.position.y / this.cellSize);
        const cellZ = Math.floor(transform.position.z / this.cellSize);
        
        // Create cell key
        const cellKey = `${cellX},${cellY},${cellZ}`;
        
        // Add entity to cell
        if (!this.cells.has(cellKey)) {
            this.cells.set(cellKey, []);
        }
        this.cells.get(cellKey).push(entity);
        
        // Track which cells this entity is in
        if (!this.entityCells.has(entity.id)) {
            this.entityCells.set(entity.id, new Set());
        }
        this.entityCells.get(entity.id).add(cellKey);
        
        // For special entities like projectiles, add to neighboring cells too
        const radius = rigidbody.collisionRadius;
        const isProjectile = entity.hasTag('playerProjectile') || entity.hasTag('particleProjectile');
        
        // Fast-moving objects need to be in more cells
        const overlapFactor = isProjectile ? 5 : 1;
        
        // Calculate neighboring cells based on entity size and velocity
        const cellRadius = Math.ceil((radius * overlapFactor) / this.cellSize);
        
        if (isProjectile || cellRadius > 0) {
            // Get velocity for high-speed projectiles
            const velocity = rigidbody.velocity || { length: () => 0 };
            const speedFactor = velocity.length ? Math.min(3, Math.ceil(velocity.length() / 1000)) : 1;
            
            // Add to more cells in the direction of movement for fast projectiles
            for (let dx = -cellRadius; dx <= cellRadius; dx++) {
                for (let dy = -cellRadius; dy <= cellRadius; dy++) {
                    for (let dz = -cellRadius; dz <= cellRadius; dz++) {
                        // Skip the center cell (already added)
                        if (dx === 0 && dy === 0 && dz === 0) continue;
                        
                        // For projectiles, extend further in the direction of movement
                        if (isProjectile && speedFactor > 1) {
                            // Skip cells that are not in the direction of movement
                            const dotProduct = dx * Math.sign(velocity.x || 0) + 
                                               dy * Math.sign(velocity.y || 0) + 
                                               dz * Math.sign(velocity.z || 0);
                            if (dotProduct < 0) continue;
                        }
                        
                        const neighborKey = `${cellX + dx},${cellY + dy},${cellZ + dz}`;
                        if (!this.cells.has(neighborKey)) {
                            this.cells.set(neighborKey, []);
                        }
                        this.cells.get(neighborKey).push(entity);
                        this.entityCells.get(entity.id).add(neighborKey);
                    }
                }
            }
        }
    }
    
    /**
     * Check for collisions with optimized spatial partitioning
     * @param {Entity} entity Entity to check
     * @param {number} deltaTime Time since last update in seconds
     * @private
     */
    _checkCollisionsOptimized(entity, deltaTime) {
        const transform = entity.getComponent('TransformComponent');
        const rigidbody = entity.getComponent('RigidbodyComponent');
        
        if (!transform || !rigidbody || !this.entityCells.has(entity.id)) {
            return;
        }
        
        // Get all cells this entity is in
        const entityCellKeys = this.entityCells.get(entity.id);
        
        // Reset potential colliders array (reuse to avoid GC)
        this.potentialColliders.clear();
        
        // Collect all potential colliders from all cells this entity is in
        entityCellKeys.forEach(cellKey => {
            const cellEntities = this.cells.get(cellKey);
            if (!cellEntities) return;
            
            // Add all entities from this cell to potential colliders
            for (let i = 0; i < cellEntities.length; i++) {
                const otherEntity = cellEntities[i];
                
                // Skip self
                if (otherEntity === entity) continue;
                
                // Skip if already processed this pair
                const pairId = entity.id < otherEntity.id ? 
                    `${entity.id}:${otherEntity.id}` : 
                    `${otherEntity.id}:${entity.id}`;
                
                if (this.processedCollisions.has(pairId)) continue;
                
                // Add to potential colliders
                this.potentialColliders.push(otherEntity);
                
                // Mark this pair as processed
                this.processedCollisions.add(pairId);
            }
        });
        
        // Now check collisions with all potential colliders
        for (let i = 0; i < this.potentialColliders.length; i++) {
            const otherEntity = this.potentialColliders.get(i);
            const otherTransform = otherEntity.getComponent('TransformComponent');
            const otherRigidbody = otherEntity.getComponent('RigidbodyComponent');
            
            if (!otherTransform || !otherRigidbody) continue;
            
            // Check for collision
            if (this._checkSphereCollision(
                transform.position, rigidbody.collisionRadius,
                otherTransform.position, otherRigidbody.collisionRadius
            )) {
                // Process the collision
                if (rigidbody.isTrigger || otherRigidbody.isTrigger) {
                    this._handleTrigger(entity, otherEntity);
                } else {
                    this._resolveCollision(
                        entity, otherEntity,
                        transform, rigidbody,
                        otherTransform, otherRigidbody
                    );
                }
            }
        }
    }
    
    /**
     * Check for sphere-sphere collision
     * @param {THREE.Vector3} posA Position A
     * @param {number} radiusA Radius A
     * @param {THREE.Vector3} posB Position B
     * @param {number} radiusB Radius B
     * @returns {boolean} True if collision detected
     * @private
     */
    _checkSphereCollision(posA, radiusA, posB, radiusB) {
        // Optimized: Use squared distance for better performance
        const dx = posA.x - posB.x;
        const dy = posA.y - posB.y;
        const dz = posA.z - posB.z;
        const distanceSquared = dx * dx + dy * dy + dz * dz;
        
        // Compare with squared sum of radii (more efficient than using square root)
        const radiusSum = radiusA + radiusB;
        return distanceSquared <= (radiusSum * radiusSum);
    }
    
    /**
     * Handle a trigger collision (no physics response)
     * @param {Entity} entity Entity A
     * @param {Entity} otherEntity Entity B
     * @private
     */
    _handleTrigger(entity, otherEntity) {
        // Identify projectile types and targets
        let playerProjectile = null;
        let enemyProjectile = null;
        let enemyEntity = null;
        let playerEntity = null;
        
        // Check for player projectiles hitting enemies
        const entityIsPlayerProjectile = entity._isPlayerProjectile || 
                                         entity.hasTag('playerProjectile') || 
                                         entity.hasTag('particleProjectile');
                                   
        const otherIsEnemy = otherEntity._isEnemy || 
                            otherEntity.hasTag('enemy') || 
                            otherEntity.hasComponent('EnemyComponent') || 
                            otherEntity.hasComponent('EnemyAIComponent');
        
        if (entityIsPlayerProjectile && otherIsEnemy) {
            playerProjectile = entity;
            enemyEntity = otherEntity;
        } else {
            const otherIsPlayerProjectile = otherEntity._isPlayerProjectile || 
                                           otherEntity.hasTag('playerProjectile') || 
                                           otherEntity.hasTag('particleProjectile');
                                     
            const entityIsEnemy = entity._isEnemy || 
                                 entity.hasTag('enemy') || 
                                 entity.hasComponent('EnemyComponent') || 
                                 entity.hasComponent('EnemyAIComponent');
            
            if (otherIsPlayerProjectile && entityIsEnemy) {
                playerProjectile = otherEntity;
                enemyEntity = entity;
            }
        }
        
        // Check for enemy projectiles hitting the player
        const entityIsEnemyProjectile = entity._isEnemyProjectile || 
                                        entity.hasTag('enemyProjectile');
                                        
        const otherIsPlayer = otherEntity._isPlayer || 
                             otherEntity.hasTag('player');
        
        if (entityIsEnemyProjectile && otherIsPlayer) {
            enemyProjectile = entity;
            playerEntity = otherEntity;
        } else {
            const otherIsEnemyProjectile = otherEntity._isEnemyProjectile || 
                                           otherEntity.hasTag('enemyProjectile');
                                           
            const entityIsPlayer = entity._isPlayer || 
                                  entity.hasTag('player');
            
            if (otherIsEnemyProjectile && entityIsPlayer) {
                enemyProjectile = otherEntity;
                playerEntity = entity;
            }
        }
        
        // If this is a player projectile hitting an enemy, handle the hit
        if (playerProjectile && enemyEntity) {
            console.log(`DIRECT HIT: Player projectile ${playerProjectile.id} hit enemy ${enemyEntity.id}`);
            
            // Ignore pooled entities
            if (enemyEntity.hasTag('pooled')) {
                console.warn(`Skipping hit on pooled enemy ${enemyEntity.id}`);
                return;
            }
            
            // Log detailed collision info
            const projectileTransform = playerProjectile.getComponent('TransformComponent');
            const enemyTransform = enemyEntity.getComponent('TransformComponent');
            
            if (projectileTransform && enemyTransform) {
                const distance = projectileTransform.position.distanceTo(enemyTransform.position);
                console.log(`Hit details: Distance=${distance.toFixed(1)}, ProjectilePos=${projectileTransform.position.x.toFixed(0)},${projectileTransform.position.y.toFixed(0)},${projectileTransform.position.z.toFixed(0)}, EnemyPos=${enemyTransform.position.x.toFixed(0)},${enemyTransform.position.y.toFixed(0)},${enemyTransform.position.z.toFixed(0)}`);
            }
            
            // Apply damage to enemy
            const health = enemyEntity.getComponent('HealthComponent');
            if (health) {
                // Apply significant damage - guaranteed to kill in one hit
                const damage = 1000; // Massive damage to guarantee instant death
                console.log(`CRITICAL HIT: Applying ${damage} damage to enemy ${enemyEntity.id}`);
                health.applyDamage(damage, 'particle', playerProjectile);
                
                // Double-check if enemy was destroyed 
                if (!health.isDestroyed) {
                    console.error("ERROR: Enemy not destroyed after particle hit! Sending entity.destroyed event...");
                    // Instead of forcing destruction, trigger the entity.destroyed event
                    health.isDestroyed = true;
                    health.health = 0;
                    
                    // Force publish destruction event - this will trigger the proper pool handling
                    this.world.messageBus.publish('entity.destroyed', {
                        entity: enemyEntity,
                        source: playerProjectile,
                        damageType: 'particle'
                    });
                } else {
                    console.log("ENEMY DESTROYED CONFIRMED! Health reached zero and isDestroyed=true");
                }
            }
            
            // Get position for effects
            let position = null;
            try {
                position = playerProjectile.getComponent('TransformComponent').position.clone();
            } catch (error) {
                // Fallback to enemy position if needed
                try {
                    position = enemyEntity.getComponent('TransformComponent').position.clone();
                } catch (innerError) {
                    // Use zero as last resort
                    position = new THREE.Vector3(0, 0, 0);
                }
            }
            
            // Publish events for the hit
            this.world.messageBus.publish('collision.trigger', {
                entityA: playerProjectile,
                entityB: enemyEntity,
                projectileHit: true
            });
            
            this.world.messageBus.publish('projectile.hit', {
                projectile: playerProjectile,
                target: enemyEntity,
                position: position
            });
            
            // Destroy the projectile only - the enemy will be handled by its health component
            this.world.destroyEntity(playerProjectile.id);
        } 
        // Handle enemy projectile hitting player
        else if (enemyProjectile && playerEntity) {
            console.log(`ENEMY HIT: Enemy projectile ${enemyProjectile.id} hit player ${playerEntity.id}`);
            
            // Apply damage to player
            const health = playerEntity.getComponent('HealthComponent');
            if (health) {
                const damage = 10; // Standard enemy projectile damage
                console.log(`Applying ${damage} damage to player`);
                health.applyDamage(damage, 'enemyProjectile', enemyProjectile);
            }
            
            // Get position for effects
            let position = null;
            try {
                position = enemyProjectile.getComponent('TransformComponent').position.clone();
            } catch (error) {
                try {
                    position = playerEntity.getComponent('TransformComponent').position.clone();
                } catch (innerError) {
                    position = new THREE.Vector3(0, 0, 0);
                }
            }
            
            // Publish events for the hit
            this.world.messageBus.publish('collision.trigger', {
                entityA: enemyProjectile,
                entityB: playerEntity,
                projectileHit: true
            });
            
            this.world.messageBus.publish('projectile.hit', {
                projectile: enemyProjectile,
                target: playerEntity,
                position: position
            });
            
            // Destroy the enemy projectile
            this.world.destroyEntity(enemyProjectile.id);
        } else {
            // Generic trigger event for non-projectile collisions
            this.world.messageBus.publish('collision.trigger', {
                entityA: entity,
                entityB: otherEntity
            });
        }
    }
    
    /**
     * Resolve a physical collision with impulse-based physics
     * @private
     */
    _resolveCollision(entityA, entityB, transformA, rigidbodyA, transformB, rigidbodyB) {
        // Use reusable vectors instead of creating new ones
        
        // Calculate collision normal
        this.collisionNormal.copy(transformA.position).sub(transformB.position).normalize();
        
        // Calculate relative velocity
        this.relativeVelocity.copy(rigidbodyA.velocity).sub(rigidbodyB.velocity);
        
        // Calculate relative velocity along the normal
        const velocityAlongNormal = this.relativeVelocity.dot(this.collisionNormal);
        
        // Only resolve if objects are moving toward each other
        if (velocityAlongNormal > 0) return;
        
        // Calculate restitution (bounciness)
        const restitution = 0.3;
        
        // Calculate inverse masses (handle infinite mass objects for immovable objects)
        const invMassA = rigidbodyA.isKinematic ? 0 : 1 / rigidbodyA.mass;
        const invMassB = rigidbodyB.isKinematic ? 0 : 1 / rigidbodyB.mass;
        
        // Calculate impulse scalar
        const impulseScalar = -(1 + restitution) * velocityAlongNormal / (invMassA + invMassB);
        
        // Apply impulse
        // Using our reusable vector and scaling it
        this.tempVec1.copy(this.collisionNormal).multiplyScalar(impulseScalar * invMassA);
        this.tempVec2.copy(this.collisionNormal).multiplyScalar(impulseScalar * invMassB);
        
        rigidbodyA.velocity.sub(this.tempVec1);
        rigidbodyB.velocity.add(this.tempVec2);
        
        // Position correction to prevent sinking
        const percent = 0.2; // penetration percentage to correct
        const slop = 0.01; // penetration allowance
        
        // Calculate penetration depth
        const distanceSquared = transformA.position.distanceToSquared(transformB.position);
        const radiusSum = rigidbodyA.collisionRadius + rigidbodyB.collisionRadius;
        const penetration = radiusSum - Math.sqrt(distanceSquared);
        
        if (penetration > slop) {
            const correction = Math.max(penetration - slop, 0) / (invMassA + invMassB) * percent;
            
            // Apply correction
            this.tempVec1.copy(this.collisionNormal).multiplyScalar(correction * invMassA);
            this.tempVec2.copy(this.collisionNormal).multiplyScalar(correction * invMassB);
            
            transformA.position.sub(this.tempVec1);
            transformB.position.add(this.tempVec2);
        }
    }
}