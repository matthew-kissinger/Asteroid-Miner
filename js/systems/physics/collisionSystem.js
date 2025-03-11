/**
 * CollisionSystem - Handles collision detection and resolution
 * 
 * Manages spatial partitioning and collision responses.
 */

import { System } from '../../core/system.js';

export class CollisionSystem extends System {
    constructor(world) {
        super(world);
        this.requiredComponents = ['TransformComponent', 'RigidbodyComponent'];
        this.priority = 20; // Run after movement system
        
        // Spatial partitioning grid
        this.cells = new Map();
        this.cellSize = 500; // Size of each spatial cell
        
        // Collision tracking to prevent duplicates
        this.processedCollisions = new Set();
        
        // Temporary arrays for collision processing
        this.potentialColliders = [];
    }
    
    /**
     * Process all entities for collisions
     * @param {number} deltaTime Time since last update in seconds
     */
    update(deltaTime) {
        // IMPORTANT: Re-enabling full collision system for projectile-enemy collisions
        // Remove the deprecated comment as we're now making this the primary method
        
        // Clear spatial grid and tracking sets
        this.cells.clear();
        this.processedCollisions.clear();
        
        // Get all entities with required components
        const entities = this.getEntities();
        
        // First pass: populate spatial partitioning grid
        entities.forEach(entity => {
            this._insertIntoGrid(entity);
        });
        
        // Second pass: check for collisions
        entities.forEach(entity => {
            this._checkCollisions(entity, deltaTime);
        });
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
        
        // IMPORTANT: Log when inserting projectiles into grid
        if (entity.hasTag('playerProjectile') || entity.hasTag('particleProjectile')) {
            console.log(`Inserting projectile ${entity.id} into spatial grid at position: ${transform.position.x.toFixed(1)}, ${transform.position.y.toFixed(1)}, ${transform.position.z.toFixed(1)}`);
        }
        
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
        
        // IMPORTANT: For fast-moving projectiles, we need to add them to a larger area
        // of cells to ensure they don't skip collision detection
        const radius = rigidbody.collisionRadius;
        const isProjectile = entity.hasTag('playerProjectile') || entity.hasTag('particleProjectile');
        
        // For projectiles, use a more aggressive cell assignment strategy
        const overlapFactor = isProjectile ? 5 : 1;
        
        // Check if entity overlaps with neighboring cells
        const overlapsCellX = transform.position.x - radius * overlapFactor < cellX * this.cellSize ||
                              transform.position.x + radius * overlapFactor >= (cellX + 1) * this.cellSize;
        const overlapsCellY = transform.position.y - radius * overlapFactor < cellY * this.cellSize ||
                              transform.position.y + radius * overlapFactor >= (cellY + 1) * this.cellSize;
        const overlapsCellZ = transform.position.z - radius * overlapFactor < cellZ * this.cellSize ||
                              transform.position.z + radius * overlapFactor >= (cellZ + 1) * this.cellSize;
        
        // Add to neighboring cells as needed
        if (overlapsCellX) {
            const neighborX = transform.position.x - radius < cellX * this.cellSize ? cellX - 1 : cellX + 1;
            const neighborKey = `${neighborX},${cellY},${cellZ}`;
            if (!this.cells.has(neighborKey)) {
                this.cells.set(neighborKey, []);
            }
            this.cells.get(neighborKey).push(entity);
        }
        
        if (overlapsCellY) {
            const neighborY = transform.position.y - radius < cellY * this.cellSize ? cellY - 1 : cellY + 1;
            const neighborKey = `${cellX},${neighborY},${cellZ}`;
            if (!this.cells.has(neighborKey)) {
                this.cells.set(neighborKey, []);
            }
            this.cells.get(neighborKey).push(entity);
        }
        
        if (overlapsCellZ) {
            const neighborZ = transform.position.z - radius < cellZ * this.cellSize ? cellZ - 1 : cellZ + 1;
            const neighborKey = `${cellX},${cellY},${neighborZ}`;
            if (!this.cells.has(neighborKey)) {
                this.cells.set(neighborKey, []);
            }
            this.cells.get(neighborKey).push(entity);
        }
        
        // For projectiles, add to even more neighboring cells
        if (isProjectile) {
            // Add to diagonal cells too for extra coverage
            for (let dx = -1; dx <= 1; dx += 2) {
                for (let dy = -1; dy <= 1; dy += 2) {
                    for (let dz = -1; dz <= 1; dz += 2) {
                        const diagKey = `${cellX + dx},${cellY + dy},${cellZ + dz}`;
                        if (!this.cells.has(diagKey)) {
                            this.cells.set(diagKey, []);
                        }
                        this.cells.get(diagKey).push(entity);
                    }
                }
            }
        }
    }
    
    /**
     * Check for collisions with other entities
     * @param {Entity} entity Entity to check
     * @param {number} deltaTime Time since last update in seconds
     * @private
     */
    _checkCollisions(entity, deltaTime) {
        const transform = entity.getComponent('TransformComponent');
        const rigidbody = entity.getComponent('RigidbodyComponent');
        
        // Calculate cell coordinates
        const cellX = Math.floor(transform.position.x / this.cellSize);
        const cellY = Math.floor(transform.position.y / this.cellSize);
        const cellZ = Math.floor(transform.position.z / this.cellSize);
        const cellKey = `${cellX},${cellY},${cellZ}`;
        
        // Get potential colliders from same cell and neighboring cells
        this.potentialColliders.length = 0;
        
        // Check current cell
        if (this.cells.has(cellKey)) {
            this.potentialColliders.push(...this.cells.get(cellKey));
        }
        
        // CRITICAL FIX: Check neighboring cells as well to ensure we catch all potential collisions
        // This is especially important for fast-moving projectiles that might skip cells
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dz = -1; dz <= 1; dz++) {
                    // Skip the current cell (already added)
                    if (dx === 0 && dy === 0 && dz === 0) continue;
                    
                    const neighborKey = `${cellX + dx},${cellY + dy},${cellZ + dz}`;
                    if (this.cells.has(neighborKey)) {
                        this.potentialColliders.push(...this.cells.get(neighborKey));
                    }
                }
            }
        }
        
        // Check each potential collider
        for (const otherEntity of this.potentialColliders) {
            // Skip self
            if (entity === otherEntity) continue;
            
            // Skip if we've already processed this collision pair
            const collisionPairKey = `${entity.id},${otherEntity.id}`;
            const reversePairKey = `${otherEntity.id},${entity.id}`;
            
            if (this.processedCollisions.has(collisionPairKey) || 
                this.processedCollisions.has(reversePairKey)) {
                continue;
            }
            
            // Mark this collision as processed
            this.processedCollisions.add(collisionPairKey);
            
            // Get other entity components
            const otherTransform = otherEntity.getComponent('TransformComponent');
            const otherRigidbody = otherEntity.getComponent('RigidbodyComponent');
            
            // Skip if other entity doesn't have the required components
            if (!otherTransform || !otherRigidbody) continue;
            
            // IMPORTANT: Special logging for projectile-enemy pairs
            const isEntityProjectile = entity.hasTag('playerProjectile') || entity.hasTag('particleProjectile');
            const isOtherEntityEnemy = otherEntity.hasTag('enemy') || otherEntity.hasComponent('EnemyAIComponent');
            
            const isEntityEnemy = entity.hasTag('enemy') || entity.hasComponent('EnemyAIComponent');
            const isOtherEntityProjectile = otherEntity.hasTag('playerProjectile') || otherEntity.hasTag('particleProjectile');
            
            // Check for potential projectile-enemy collision pair
            if ((isEntityProjectile && isOtherEntityEnemy) || (isEntityEnemy && isOtherEntityProjectile)) {
                if (Math.random() < 0.1) {
                    const dist = transform.position.distanceTo(otherTransform.position);
                    const minDist = rigidbody.collisionRadius + otherRigidbody.collisionRadius;
                    
                    console.log(`PROJECTILE-ENEMY PAIR: ${isEntityProjectile ? entity.id : otherEntity.id} -> ${isOtherEntityEnemy ? otherEntity.id : entity.id}`);
                    console.log(`Entity A: position=${transform.position.x.toFixed(1)},${transform.position.y.toFixed(1)},${transform.position.z.toFixed(1)}, radius=${rigidbody.collisionRadius}`);
                    console.log(`Entity B: position=${otherTransform.position.x.toFixed(1)},${otherTransform.position.y.toFixed(1)},${otherTransform.position.z.toFixed(1)}, radius=${otherRigidbody.collisionRadius}`);
                    console.log(`Distance: ${dist.toFixed(1)}, Min Distance: ${minDist.toFixed(1)}, Collision expected: ${dist < minDist}`);
                }
            }
            
            // Check if collision occurs
            if (this._checkSphereCollision(
                transform.position, rigidbody.collisionRadius,
                otherTransform.position, otherRigidbody.collisionRadius
            )) {
                // Log collision detection for projectile-enemy collisions
                if (entity.hasTag('playerProjectile') && (otherEntity.hasTag('enemy') || 
                    otherEntity.hasComponent('EnemyAIComponent'))) {
                    console.log(`COLLISION DETECTED: Player projectile ${entity.id} hit enemy ${otherEntity.id} at distance ${transform.position.distanceTo(otherTransform.position).toFixed(1)}`);
                } else if (otherEntity.hasTag('playerProjectile') && (entity.hasTag('enemy') ||
                    entity.hasComponent('EnemyAIComponent'))) {
                    console.log(`COLLISION DETECTED: Player projectile ${otherEntity.id} hit enemy ${entity.id} at distance ${transform.position.distanceTo(otherTransform.position).toFixed(1)}`);
                }
                
                // Collision detected - call appropriate handlers
                if (rigidbody.isTrigger || otherRigidbody.isTrigger) {
                    this._handleTrigger(entity, otherEntity);
                } else {
                    this._resolveCollision(entity, otherEntity, transform, rigidbody, otherTransform, otherRigidbody);
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
        // IMPROVED: Special case for projectile-enemy collision
        // Get the squared distance between centers
        const dx = posA.x - posB.x;
        const dy = posA.y - posB.y;
        const dz = posA.z - posB.z;
        const distanceSquared = dx * dx + dy * dy + dz * dz;
        
        // Compare with squared sum of radii (more efficient than using square root)
        const radiusSum = radiusA + radiusB;
        const collisionDetected = distanceSquared <= (radiusSum * radiusSum);
        
        return collisionDetected;
    }
    
    /**
     * Handle a trigger collision (no physics response)
     * @param {Entity} entity Entity A
     * @param {Entity} otherEntity Entity B
     * @private
     */
    _handleTrigger(entity, otherEntity) {
        // Identify player projectile and enemy
        let playerProjectile = null;
        let enemyEntity = null;
        
        // Determine which entity is the projectile and which is the enemy
        if ((entity.hasTag('playerProjectile') || entity.hasTag('particleProjectile')) &&
            (otherEntity.hasTag('enemy') || otherEntity.hasComponent('EnemyComponent') || otherEntity.hasComponent('EnemyAIComponent'))) {
            playerProjectile = entity;
            enemyEntity = otherEntity;
        } else if ((otherEntity.hasTag('playerProjectile') || otherEntity.hasTag('particleProjectile')) &&
                  (entity.hasTag('enemy') || entity.hasComponent('EnemyComponent') || entity.hasComponent('EnemyAIComponent'))) {
            playerProjectile = otherEntity;
            enemyEntity = entity;
        }
        
        // If this is a player projectile hitting an enemy, handle the hit
        if (playerProjectile && enemyEntity) {
            console.log(`DIRECT HIT: Player projectile ${playerProjectile.id} hit enemy ${enemyEntity.id}`);
            
            // Apply damage to enemy
            const health = enemyEntity.getComponent('HealthComponent');
            if (health) {
                // Apply significant damage - guaranteed to kill in one hit
                const damage = 1000; // Massive damage to guarantee instant death
                console.log(`CRITICAL HIT: Applying ${damage} damage to enemy ${enemyEntity.id}`);
                health.applyDamage(damage, 'particle', playerProjectile);
                
                // Double-check if enemy was destroyed 
                if (!health.isDestroyed) {
                    console.error("ERROR: Enemy not destroyed after particle hit! Forcing destruction...");
                    // Force destruction as a backup measure
                    health.isDestroyed = true;
                    health.health = 0;
                    
                    // Force publish destruction event
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
            
            // Destroy the projectile
            this.world.destroyEntity(playerProjectile.id);
        } else {
            // Generic trigger event for non-projectile collisions
            this.world.messageBus.publish('collision.trigger', {
                entityA: entity,
                entityB: otherEntity
            });
        }
    }
    
    /**
     * Resolve a physical collision between two entities
     * @param {Entity} entityA Entity A
     * @param {Entity} entityB Entity B
     * @param {TransformComponent} transformA Transform A
     * @param {RigidbodyComponent} rigidbodyA Rigidbody A
     * @param {TransformComponent} transformB Transform B
     * @param {RigidbodyComponent} rigidbodyB Rigidbody B
     * @private
     */
    _resolveCollision(entityA, entityB, transformA, rigidbodyA, transformB, rigidbodyB) {
        // Calculate collision normal
        const direction = new THREE.Vector3().subVectors(transformB.position, transformA.position);
        const distance = direction.length();
        direction.normalize();
        
        // Calculate overlap
        const overlap = rigidbodyA.collisionRadius + rigidbodyB.collisionRadius - distance;
        
        // Skip if no overlap (shouldn't happen due to earlier check)
        if (overlap <= 0) return;
        
        // Position correction
        const totalMass = rigidbodyA.mass + rigidbodyB.mass;
        const massRatioA = rigidbodyB.mass / totalMass;
        const massRatioB = rigidbodyA.mass / totalMass;
        
        // Adjust positions to resolve overlap
        if (!rigidbodyA.isKinematic) {
            transformA.position.sub(direction.clone().multiplyScalar(overlap * massRatioA));
            transformA.needsUpdate = true;
        }
        
        if (!rigidbodyB.isKinematic) {
            transformB.position.add(direction.clone().multiplyScalar(overlap * massRatioB));
            transformB.needsUpdate = true;
        }
        
        // Calculate relative velocity for collision response
        const relativeVelocity = new THREE.Vector3().subVectors(rigidbodyB.velocity, rigidbodyA.velocity);
        const velocityAlongNormal = relativeVelocity.dot(direction);
        
        // Skip collision response if objects are separating
        if (velocityAlongNormal > 0) return;
        
        // Calculate restitution (bounciness)
        const restitution = 0.3; // Could be derived from material properties
        
        // Calculate impulse scalar
        let j = -(1 + restitution) * velocityAlongNormal;
        j /= (1 / rigidbodyA.mass) + (1 / rigidbodyB.mass);
        
        // Apply impulse
        const impulse = direction.clone().multiplyScalar(j);
        
        if (!rigidbodyA.isKinematic) {
            rigidbodyA.velocity.sub(impulse.clone().multiplyScalar(1 / rigidbodyA.mass));
        }
        
        if (!rigidbodyB.isKinematic) {
            rigidbodyB.velocity.add(impulse.clone().multiplyScalar(1 / rigidbodyB.mass));
        }
        
        // Publish collision event
        this.world.messageBus.publish('collision.physical', {
            entityA: entityA,
            entityB: entityB,
            impulse: impulse.length(),
            contactPoint: new THREE.Vector3().copy(transformA.position).add(
                direction.clone().multiplyScalar(rigidbodyA.collisionRadius)
            ),
            contactNormal: direction
        });
    }
}