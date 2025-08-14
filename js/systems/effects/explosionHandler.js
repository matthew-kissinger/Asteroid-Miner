/**
 * ExplosionHandler - Manages explosion effects for combat events
 * 
 * Listens for entity destruction and projectile hits to create explosion effects
 */

import { System } from '../../core/system.js';
import * as THREE from 'three';

export class ExplosionHandler extends System {
    constructor(world) {
        super(world);
        this.requiredComponents = []; // No specific components required
        this.priority = 80; // Run after combat systems
        
        // Subscribe to combat events
        this.setupEventListeners();
        
        console.log("ExplosionHandler initialized - listening for combat events");
    }
    
    /**
     * Set up event listeners for combat events
     */
    setupEventListeners() {
        // Listen for entity destruction
        this.world.messageBus.subscribe('entity.destroyed', this.handleEntityDestroyed.bind(this));
        
        // Listen for projectile hits
        this.world.messageBus.subscribe('projectile.hit', this.handleProjectileHit.bind(this));
        
        // Listen for combat hits
        this.world.messageBus.subscribe('combat.hit', this.handleCombatHit.bind(this));
    }
    
    /**
     * Handle entity destroyed event
     * @param {object} message Event message
     */
    handleEntityDestroyed(message) {
        const entity = message.entity;
        if (!entity) return;
        
        // Only create explosions for enemies and player
        const isEnemy = entity.hasTag && entity.hasTag('enemy');
        const isPlayer = entity.hasTag && entity.hasTag('player');
        
        if (!isEnemy && !isPlayer) return;
        
        // Get position from entity's transform
        const transform = entity.getComponent && entity.getComponent('TransformComponent');
        if (!transform || !transform.position) return;
        
        const position = transform.position.clone();
        
        // Create BIG explosion effect when enemy is destroyed by player
        // Enemies destroyed by player get bigger explosion (2.5 scale, 2000ms duration)
        this.createExplosion(position, isEnemy ? 2000 : 2500, isEnemy ? 2.5 : 3.0);
    }
    
    /**
     * Handle projectile hit event
     * @param {object} message Event message
     */
    handleProjectileHit(message) {
        const { projectile, target, position } = message;
        
        if (!position) return;
        
        // Create smaller impact effect for projectile hits (not destroyed)
        this.createExplosion(position, 800, 0.8);
    }
    
    /**
     * Handle combat hit event
     * @param {object} message Event message
     */
    handleCombatHit(message) {
        const { target, position, destroyed } = message;
        
        // Only create big explosion if target was destroyed
        if (!destroyed) return;
        
        if (!position) return;
        
        // Create HUGE explosion for combat destruction (when player destroys enemy)
        this.createExplosion(position, 2500, 3.0);
    }
    
    /**
     * Create an explosion effect at the given position
     * @param {THREE.Vector3} position Position for the explosion
     * @param {number} duration Duration in milliseconds
     * @param {number} scale Scale of the explosion
     */
    createExplosion(position, duration = 1000, scale = 1.0) {
        try {
            // Try to use the game's combat system explosion effect (which has poolManager)
            if (window.game && window.game.combat && window.game.combat.createExplosionEffect) {
                const explosion = window.game.combat.createExplosionEffect(position, duration, true);
                // Scale the explosion if it was created
                if (explosion && explosion.scale) {
                    explosion.scale.setScalar(scale);
                }
                return;
            }
            
            // Try combat manager's effects manager
            if (window.game && window.game.combatManager && window.game.combatManager.effectsManager) {
                const effectsManager = window.game.combatManager.effectsManager;
                if (effectsManager.createExplosionEffect) {
                    // Pass the poolManager from combatManager
                    const poolManager = window.game.combatManager.poolManager;
                    const explosion = effectsManager.explosionEffects.createExplosionEffect(
                        position, 
                        duration, 
                        true, 
                        poolManager,
                        (obj) => {
                            if (window.game && window.game.scene) {
                                window.game.scene.add(obj);
                            }
                        }
                    );
                    if (explosion && explosion.scale) {
                        explosion.scale.setScalar(scale);
                    }
                    return;
                }
            }
            
            // Fallback: Use object pool
            if (window.objectPool && window.objectPool.getExplosion) {
                const explosion = window.objectPool.getExplosion();
                if (explosion) {
                    explosion.position.copy(position);
                    explosion.scale.setScalar(scale);
                    explosion.visible = true;
                    
                    // Add to scene
                    if (window.game && window.game.scene) {
                        window.game.scene.add(explosion);
                        console.log("Created explosion via object pool");
                        
                        // Remove after duration
                        setTimeout(() => {
                            if (explosion.parent) {
                                explosion.parent.remove(explosion);
                            }
                            if (window.objectPool && window.objectPool.releaseExplosion) {
                                window.objectPool.releaseExplosion(explosion);
                            }
                        }, duration);
                    }
                }
                return;
            }
            
            // Final fallback: Create simple particle effect
            this.createSimpleExplosion(position, duration, scale);
            
        } catch (error) {
            console.error("Error creating explosion effect:", error);
        }
    }
    
    /**
     * Create a simple explosion effect as fallback
     * @param {THREE.Vector3} position Position for the explosion
     * @param {number} duration Duration in milliseconds
     * @param {number} scale Scale of the explosion
     */
    createSimpleExplosion(position, duration = 1000, scale = 1.0) {
        if (!window.game || !window.game.scene) return;
        
        // Create a simple expanding sphere as explosion
        const geometry = new THREE.SphereGeometry(10 * scale, 16, 16);
        const material = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0.8,
            emissive: 0xff6600,
            emissiveIntensity: 2
        });
        
        const explosion = new THREE.Mesh(geometry, material);
        explosion.position.copy(position);
        window.game.scene.add(explosion);
        
        console.log("Created simple fallback explosion");
        
        // Animate the explosion
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress >= 1) {
                // Remove explosion
                if (explosion.parent) {
                    explosion.parent.remove(explosion);
                }
                geometry.dispose();
                material.dispose();
                return;
            }
            
            // Expand and fade
            const expansionScale = 1 + progress * 4;
            explosion.scale.setScalar(expansionScale * scale);
            material.opacity = 0.8 * (1 - progress);
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    /**
     * Update method (required by System base class)
     * @param {number} deltaTime Time since last update
     */
    update(deltaTime) {
        // No per-frame updates needed - we only respond to events
    }
    
    /**
     * Clean up when system is disabled
     */
    onDisabled() {
        // Unsubscribe from events
        this.world.messageBus.unsubscribe('entity.destroyed', this.handleEntityDestroyed.bind(this));
        this.world.messageBus.unsubscribe('projectile.hit', this.handleProjectileHit.bind(this));
        this.world.messageBus.unsubscribe('combat.hit', this.handleCombatHit.bind(this));
        
        console.log("ExplosionHandler disabled");
    }
}