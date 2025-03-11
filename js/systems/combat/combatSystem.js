/**
 * CombatSystem - Manages combat interactions between entities
 * 
 * Handles projectile collisions, damage application, and combat effects
 */

import { System } from '../../core/system.js';
import { HealthComponent } from '../../components/combat/healthComponent.js';
import { TransformComponent } from '../../components/transform.js';
import { RigidbodyComponent } from '../../components/physics/rigidbody.js';

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
        
        // Combine both types of projectiles
        const allProjectiles = [...projectiles, ...enemyProjectiles];
        
        // Log number of projectiles if any are found
        if (allProjectiles.length > 0) {
            console.log(`CombatSystem: Checking ${allProjectiles.length} projectiles for collisions`);
        }
        
        // Filter enemy entities for faster iteration
        const enemies = entities.filter(entity => 
            entity.hasTag('enemy') || entity.hasComponent('EnemyAIComponent'));
        
        const players = entities.filter(entity => entity.hasTag('player'));
        
        // Check each projectile against potential targets
        for (const projectile of allProjectiles) {
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
                const isPlayerProjectile = projectile.hasTag('projectile') || projectile.hasTag('playerProjectile');
                const isEnemyProjectile = projectile.hasTag('enemyProjectile');
                
                // Skip projectile if it has no velocity (inactive)
                if (projectileRigidbody.velocity.lengthSq() < 0.1) continue;
                
                // Check against appropriate targets based on projectile type
                const targets = isPlayerProjectile ? enemies : (isEnemyProjectile ? players : entities);
                
                // Check for collisions with targets
                for (const target of targets) {
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
                    
                    // Calculate distance
                    const distance = targetTransform.position.distanceTo(projectileTransform.position);
                    
                    // If distance is less than sum of collision radii, we have a hit
                    if (distance < (collisionRadius + projectileRigidbody.collisionRadius)) {
                        console.log(`Projectile hit! Distance: ${distance.toFixed(2)}`);
                        this.handleProjectileCollision(projectile, target);
                        
                        // Destroy projectile after hit
                        try {
                            this.world.destroyEntity(projectile.id);
                            this.projectiles.delete(projectile.id);
                        } catch (e) {
                            console.error("Failed to destroy projectile after hit:", e);
                        }
                        
                        // Break out of target loop - projectile hits only one target
                        break;
                    }
                }
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
            
            // Publish hit event
            this.world.messageBus.publish('combat.hit', {
                projectile: projectile,
                target: target,
                damage: damageResult.damageApplied,
                shieldDamage: damageResult.shieldDamage,
                healthDamage: damageResult.healthDamage,
                destroyed: damageResult.destroyed,
                position: projectile.getComponent('TransformComponent').position.clone()
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
        
        // Create hit effect entity
        const hitEffect = this.world.createEntity('hit_effect');
        
        // Add transform at projectile's position
        const effectTransform = new TransformComponent(projectileTransform.position.clone());
        hitEffect.addComponent(effectTransform);
        
        // Create material with glow effect
        const effectMaterial = new THREE.MeshBasicMaterial({
            color: effectColor,
            transparent: true,
            opacity: 0.8
        });
        
        // Create mesh with sphere geometry
        const effectGeometry = new THREE.SphereGeometry(effectSize, 8, 8);
        const effectMesh = new THREE.Mesh(effectGeometry, effectMaterial);
        
        // Add mesh to scene
        this.world.scene.add(effectMesh);
        
        // Position at hit location
        effectMesh.position.copy(projectileTransform.position);
        
        // Store mesh reference in entity
        hitEffect.userData = { mesh: effectMesh };
        
        // Animate and remove after short duration
        this.animateHitEffect(hitEffect, effectMesh);
    }
    
    /**
     * Animate a hit effect and then remove it
     * @param {Entity} hitEffect Hit effect entity
     * @param {THREE.Mesh} effectMesh Effect mesh
     */
    animateHitEffect(hitEffect, effectMesh) {
        // Expand and fade out
        let scale = 1;
        const expandSpeed = 3;
        const fadeSpeed = 0.1;
        
        const animate = () => {
            // Stop if entity removed or fully faded
            if (!this.world.getEntity(hitEffect.id) || effectMesh.material.opacity <= 0) {
                // Remove mesh from scene
                this.world.scene.remove(effectMesh);
                
                // Remove entity if it still exists
                if (this.world.getEntity(hitEffect.id)) {
                    this.world.destroyEntity(hitEffect.id);
                }
                return;
            }
            
            // Expand
            scale += expandSpeed * 0.1;
            effectMesh.scale.set(scale, scale, scale);
            
            // Fade
            effectMesh.material.opacity -= fadeSpeed;
            
            // Continue animation
            requestAnimationFrame(animate);
        };
        
        // Start animation
        animate();
    }
    
    /**
     * Handle projectile created event
     * @param {object} message Event message
     */
    handleProjectileCreated(message) {
        // Track all created projectiles
        const projectile = message.data.projectile;
        if (projectile && !this.projectiles.has(projectile.id)) {
            this.projectiles.add(projectile.id);
        }
    }
    
    /**
     * Handle entity damaged event
     * @param {object} message Event message
     */
    handleEntityDamaged(message) {
        const { entity, amount, shieldDamage, healthDamage, source } = message.data;
        
        // Track damage statistics
        if (entity && entity.hasTag('player')) {
            this.damageReceived += amount;
        } else if (source && source.hasTag('player')) {
            this.damageDealt += amount;
        }
    }
    
    /**
     * Clean up when system is disabled
     */
    onDisabled() {
        // Destroy all active projectiles
        this.projectiles.forEach(projectileId => {
            if (this.world.getEntity(projectileId)) {
                this.world.destroyEntity(projectileId);
            }
        });
        
        this.projectiles.clear();
    }
}