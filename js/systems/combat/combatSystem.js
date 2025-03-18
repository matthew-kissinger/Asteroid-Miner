/**
 * CombatSystem - Manages combat interactions between entities
 * 
 * Handles projectile collisions, damage application, and combat effects
 */

import { System } from '../../core/system.js';
import { HealthComponent } from '../../components/combat/healthComponent.js';
import { TransformComponent } from '../../components/transform.js';
import { RigidbodyComponent } from '../../components/physics/rigidbody.js';
import { FixedArray } from '../../utils/memoryManager.js';

export class CombatSystem extends System {
    constructor(world) {
        super(world);
        this.requiredComponents = ['TransformComponent', 'RigidbodyComponent'];
        this.priority = 50; // Run after enemy AI and player input
        
        // Projectile tracking
        this.projectiles = new Set();
        
        // Combat statistics
        this.damageDealt = 0;
        this.damageReceived = 0;
        
        // Pre-allocated arrays for entity filtering
        this.cachedProjectiles = new FixedArray(100);
        this.cachedEnemies = new FixedArray(50);
        this.cachedPlayers = new FixedArray(5);
        
        // Reusable vectors for calculations
        this.hitPosition = new THREE.Vector3();
        this.effectPosition = new THREE.Vector3();
        
        // Setup event listeners
        this.setupEventListeners();
    }
    
    /**
     * Set up event listeners for combat-related events
     */
    setupEventListeners() {
        // Listen for projectile creation events
        this.world.messageBus.subscribe('weapon.fired', this.handleProjectileCreated.bind(this));
        this.world.messageBus.subscribe('turret.fire', this.handleProjectileCreated.bind(this));
        this.world.messageBus.subscribe('missile.fired', this.handleProjectileCreated.bind(this));
        
        // Listen for entity damaged events to track stats
        this.world.messageBus.subscribe('entity.damaged', this.handleEntityDamaged.bind(this));
    }
    
    /**
     * Update all entities relevant to combat
     * @param {number} deltaTime Time since last update in seconds
     */
    update(deltaTime) {
        // Get all entities with transforms (potential targets)
        // Use the correct method to get entities - entityManager.getEntities()
        const entities = this.world.entityManager.getEntities();
        
        // Check for projectile collisions
        this.checkProjectileCollisions(entities);
        
        // Remove any tracked projectiles that no longer exist
        this.cleanupInvalidProjectiles();
    }
    
    /**
     * Remove projectiles that are no longer valid (missing components or destroyed)
     */
    cleanupInvalidProjectiles() {
        // Get all current projectile entities
        const validProjectileIds = new Set();
        const projectiles = this.world.entityManager.getEntitiesByTag('projectile');
        const enemyProjectiles = this.world.entityManager.getEntitiesByTag('enemyProjectile');
        
        // Add all valid projectile IDs to the set
        [...projectiles, ...enemyProjectiles].forEach(p => {
            if (p && p.id) { // Add null check for safety
                validProjectileIds.add(p.id);
            }
        });
        
        // Remove any tracked projectiles that aren't in the valid set
        for (const projectileId of this.projectiles) {
            if (!validProjectileIds.has(projectileId)) {
                console.log(`Removing invalid projectile ${projectileId} from tracking`);
                this.projectiles.delete(projectileId);
            }
        }
    }
    
    /**
     * Check projectiles for collision with entities
     * @param {Array} entities All entities in the world
     */
    checkProjectileCollisions(entities) {
        const projectiles = this.world.entityManager.getEntitiesByTag('projectile');
        const enemyProjectiles = this.world.entityManager.getEntitiesByTag('enemyProjectile');
        
        // Clear our cached arrays
        this.cachedProjectiles.clear();
        this.cachedEnemies.clear();
        this.cachedPlayers.clear();
        
        // Filter entities only once and store in cached arrays
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            if (entity.hasTag('enemy') || entity.hasComponent('EnemyAIComponent')) {
                this.cachedEnemies.push(entity);
            } else if (entity.hasTag('player')) {
                this.cachedPlayers.push(entity);
            }
        }
        
        // Combine projectiles into our cached array
        for (let i = 0; i < projectiles.length; i++) {
            this.cachedProjectiles.push(projectiles[i]);
        }
        
        for (let i = 0; i < enemyProjectiles.length; i++) {
            this.cachedProjectiles.push(enemyProjectiles[i]);
        }
        
        // Log number of projectiles if any are found
        if (this.cachedProjectiles.length > 0) {
            console.log(`CombatSystem: Checking ${this.cachedProjectiles.length} projectiles for collisions`);
        }
        
        // Check each projectile against potential targets
        for (let i = 0; i < this.cachedProjectiles.length; i++) {
            const projectile = this.cachedProjectiles.get(i);
            
            try {
                // Track this projectile if not already tracked
                if (!this.projectiles.has(projectile.id)) {
                    this.projectiles.add(projectile.id);
                }
                
                const projectileTransform = projectile.getComponent('TransformComponent');
                const projectileRigidbody = projectile.getComponent('RigidbodyComponent');
                
                if (!projectileTransform || !projectileRigidbody) {
                    console.log(`Projectile ${projectile.id} missing transform or rigidbody component`);
                    
                    // Skip this iteration but don't destroy the projectile yet,
                    // as components might be added asynchronously
                    continue;
                }
                
                // Determine if this is a player projectile or enemy projectile
                // Use direct flag checking for better performance if available
                const isPlayerProjectile = projectile._isPlayerProjectile || 
                                          projectile.hasTag('projectile') || 
                                          projectile.hasTag('playerProjectile');
                                          
                const isEnemyProjectile = projectile._isEnemyProjectile || 
                                         projectile.hasTag('enemyProjectile');
                
                // Skip projectile if it has no velocity (inactive)
                if (projectileRigidbody.velocity.lengthSq() < 0.1) continue;
                
                // Use our cached arrays for better performance
                const targets = isPlayerProjectile ? this.cachedEnemies : 
                               (isEnemyProjectile ? this.cachedPlayers : entities);
                
                // Check for collisions with targets
                let targetHit = false;
                
                for (let j = 0; j < targets.length; j++) {
                    const target = targets.get ? targets.get(j) : targets[j];
                    
                    // Skip if target is destroyed
                    if (target.destroyed) continue;
                    
                    // Skip self-collision
                    if (target.id === projectile.id) continue;
                    
                    // Get target transform
                    const targetTransform = target.getComponent('TransformComponent');
                    if (!targetTransform) continue;
                    
                    // Get target rigidbody for collision radius
                    let collisionRadius = 5; // Default radius
                    const targetRigidbody = target.getComponent('RigidbodyComponent');
                    if (targetRigidbody && targetRigidbody.collisionRadius) {
                        collisionRadius = targetRigidbody.collisionRadius;
                    }
                    
                    // Calculate distance using squared distance for better performance
                    const dx = targetTransform.position.x - projectileTransform.position.x;
                    const dy = targetTransform.position.y - projectileTransform.position.y;
                    const dz = targetTransform.position.z - projectileTransform.position.z;
                    const distanceSquared = dx * dx + dy * dy + dz * dz;
                    
                    // Sum of collision radii
                    const radiusSum = collisionRadius + projectileRigidbody.collisionRadius;
                    
                    // If distance is less than sum of collision radii, we have a hit
                    if (distanceSquared < (radiusSum * radiusSum)) {
                        console.log(`Projectile hit! Distance: ${Math.sqrt(distanceSquared).toFixed(2)}`);
                        this.handleProjectileCollision(projectile, target);
                        
                        // Destroy projectile after hit
                        try {
                            this.world.destroyEntity(projectile.id);
                            this.projectiles.delete(projectile.id);
                            targetHit = true;
                        } catch (e) {
                            console.error("Failed to destroy projectile after hit:", e);
                        }
                        
                        // Break out of target loop - projectile hits only one target
                        break;
                    }
                }
                
                // If we hit a target, skip to the next projectile
                if (targetHit) continue;
                
            } catch (error) {
                console.error(`Error processing projectile ${projectile.id}:`, error);
            }
        }
    }
    
    /**
     * Handle a projectile collision with a target
     * @param {Entity} projectile Projectile entity
     * @param {Entity} target Target entity
     */
    handleProjectileCollision(projectile, target) {
        // Determine damage amount
        let damage = 10; // Default damage
        const source = projectile.userData?.source;
        
        // Get damage from userData if available
        if (projectile.userData && projectile.userData.damage) {
            damage = projectile.userData.damage;
        } else if (projectile.sourceComponent) {
            // Alternative: get damage from source component
            damage = projectile.sourceComponent.damage;
        }
        
        // Apply damage to target
        const targetHealth = target.getComponent('HealthComponent');
        if (targetHealth) {
            const damageType = projectile.userData?.attackType || 'projectile';
            const damageResult = targetHealth.applyDamage(damage, damageType, source);
            
            // Create hit effect
            this.createHitEffect(projectile, target, damageResult);
            
            // Track statistics based on hit entity type
            if (target.hasTag('player')) {
                this.damageReceived += damageResult.damageApplied;
            } else if (target.hasTag('enemy')) {
                this.damageDealt += damageResult.damageApplied;
            }
            
            // Get position using our reusable vector
            const projectileTransform = projectile.getComponent('TransformComponent');
            if (projectileTransform) {
                this.hitPosition.copy(projectileTransform.position);
            } else {
                this.hitPosition.set(0, 0, 0);
            }
            
            // Publish hit event
            this.world.messageBus.publish('combat.hit', {
                projectile: projectile,
                target: target,
                damage: damageResult.damageApplied,
                shieldDamage: damageResult.shieldDamage,
                healthDamage: damageResult.healthDamage,
                destroyed: damageResult.destroyed,
                position: this.hitPosition // Pass direct reference for better performance
            });
        }
    }
    
    /**
     * Create a visual effect for a projectile hit
     * @param {Entity} projectile Projectile entity
     * @param {Entity} target Target entity
     * @param {object} damageResult Result of damage application
     */
    createHitEffect(projectile, target, damageResult) {
        // Get projectile information
        const projectileTransform = projectile.getComponent('TransformComponent');
        if (!projectileTransform) return;
        
        // Determine hit effect based on damage type and result
        let effectColor = 0xff5500; // Default orange hit
        let effectSize = 1;
        
        // Shield hit has blue color
        if (damageResult.shieldDamage > 0) {
            effectColor = 0x3399ff; // Blue for shield hit
            effectSize = 1.5;
        }
        
        // Critical hit has red color and larger size
        if (damageResult.healthDamage > 20) {
            effectColor = 0xff0000; // Red for critical hit
            effectSize = 2;
        }
        
        // Use our cached effect position
        this.effectPosition.copy(projectileTransform.position);
        
        // Create hit effect
        // Try to use an object from the pool if available
        let hitEffect;
        if (window.objectPool && window.objectPool.pools['hitEffect']) {
            hitEffect = window.objectPool.get('hitEffect', effectColor, effectSize);
        } else {
            // Create new effect if no pool exists
            hitEffect = this.createNewHitEffect(effectColor, effectSize);
        }
        
        if (hitEffect && hitEffect.mesh) {
            // Position the effect
            hitEffect.mesh.position.copy(this.effectPosition);
            
            // Start the animation
            this.animateHitEffect(hitEffect, hitEffect.mesh);
        }
    }
    
    // Helper method to create a new hit effect
    createNewHitEffect(effectColor, effectSize) {
        // Create geometry only once and reuse
        if (!this.hitEffectGeometry) {
            this.hitEffectGeometry = new THREE.SphereGeometry(1, 8, 8);
        }
        
        // Create the hit effect mesh
        const material = new THREE.MeshBasicMaterial({
            color: effectColor,
            transparent: true,
            opacity: 0.8
        });
        
        const mesh = new THREE.Mesh(this.hitEffectGeometry, material);
        mesh.scale.set(effectSize, effectSize, effectSize);
        
        // Add to scene
        this.world.scene.add(mesh);
        
        return { mesh, material };
    }
    
    /**
     * Animate a hit effect
     * @param {object} hitEffect The hit effect object
     * @param {THREE.Mesh} effectMesh The effect mesh
     */
    animateHitEffect(hitEffect, effectMesh) {
        let scale = 1.0;
        let opacity = 0.8;
        
        const animate = () => {
            // Increase scale
            scale += 0.1;
            opacity -= 0.05;
            
            // Update mesh
            if (effectMesh && effectMesh.scale) {
                effectMesh.scale.set(scale, scale, scale);
                
                if (hitEffect.material) {
                    hitEffect.material.opacity = opacity;
                }
                
                // Continue animation until opacity reaches 0
                if (opacity > 0) {
                    requestAnimationFrame(animate);
                } else {
                    // Clean up effect when animation is done
                    if (effectMesh.parent) {
                        effectMesh.parent.remove(effectMesh);
                    }
                    
                    // Return to pool if available
                    if (window.objectPool && window.objectPool.pools['hitEffect']) {
                        window.objectPool.release('hitEffect', hitEffect);
                    } else {
                        // Dispose of geometry and material if not using object pooling
                        if (hitEffect.material) {
                            hitEffect.material.dispose();
                        }
                    }
                }
            }
        };
        
        // Start animation
        animate();
    }
    
    /**
     * Handle projectile creation event
     * @param {object} message Event message
     */
    handleProjectileCreated(message) {
        // Track the projectile if it has a valid entity
        if (message.entity && message.entity.id) {
            this.projectiles.add(message.entity.id);
        }
    }
    
    /**
     * Handle entity damaged event
     * @param {object} message Event message
     */
    handleEntityDamaged(message) {
        // Update damage statistics
        if (message.target) {
            if (message.target.hasTag('player')) {
                this.damageReceived += message.damage || 0;
            } else if (message.target.hasTag('enemy')) {
                this.damageDealt += message.damage || 0;
            }
        }
    }
    
    /**
     * Clean up when system is disabled
     */
    onDisabled() {
        // Remove all event listeners
        this.world.messageBus.unsubscribe('weapon.fired', this.handleProjectileCreated);
        this.world.messageBus.unsubscribe('turret.fire', this.handleProjectileCreated);
        this.world.messageBus.unsubscribe('missile.fired', this.handleProjectileCreated);
        this.world.messageBus.unsubscribe('entity.damaged', this.handleEntityDamaged);
    }
}