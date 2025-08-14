/**
 * Combat module - Handles all combat-related functionality
 * 
 * This module manages particle cannon firing, projectile creation, and combat logic.
 * 
 * REFACTORED: This module now uses submodules for better organization:
 * - worldSetup.js: ECS World construction and scene setup
 * - registerSystems.js: System registration in deterministic order
 * - events.js: Event subscriptions and MessageBus interactions
 * - effects.js: Visual effects, materials, and rendering helpers
 * - aiAndSpawners.js: Enemy pool/spawner management
 */

import { WorldSetup } from './combat/worldSetup.js';
import { SystemRegistrar } from './combat/registerSystems.js';
import { EventManager } from './combat/events.js';
import { EffectsManager } from './combat/effects.js';
import { AISpawnerManager } from './combat/aiAndSpawners.js';
import { CombatLogic } from './combat/combatLogic.js';
import { ProjectilePoolManager } from './pooling/ProjectilePoolManager.js';
import * as THREE from 'three';

export class Combat {
    constructor(scene, spaceship) {
        console.log("Initializing combat system");
        this.scene = scene;
        this.spaceship = spaceship;
        this.projectiles = [];
        this.projectileLifetime = 2000; // milliseconds
        
        // Tuned these parameters for better gameplay
        this.fireRate = 3; // shots per second
        this.projectileSpeed = 30000; // Base speed units per frame (will be normalized)
        
        // Track the last time we fired for rate limiting
        this.lastFireTime = 0;
        
        // Reference size for spread calculation
        this.aimingSpread = 0.05;
        
        // Weapon properties
        this.isFiring = false;
        this.cooldown = 1000 / this.fireRate; // milliseconds between shots
        
        // Combat properties
        this.projectileDamage = 20; // Standard damage per projectile hit
        
        // Initialize submodules
        this.worldSetup = new WorldSetup();
        this.systemRegistrar = new SystemRegistrar();
        this.eventManager = new EventManager();
        this.effectsManager = new EffectsManager(scene);
        this.aiSpawnerManager = new AISpawnerManager();
        this.combatLogic = new CombatLogic(this.effectsManager, this.eventManager, this.aiSpawnerManager);
        
        // Initialize object pooling system with materials from effects manager
        this.poolManager = new ProjectilePoolManager(scene, {
            projectileMaterial: this.effectsManager.getMaterial('projectile'),
            projectileGlowMaterial: this.effectsManager.getMaterial('projectileGlow'),
            trailParticleMaterial: this.effectsManager.getMaterial('trailParticle'),
            muzzleFlashMaterial: this.effectsManager.getMaterial('muzzleFlash'),
            tracerLineMaterial: this.effectsManager.getMaterial('tracerLine'),
            explosionParticleMaterial: this.effectsManager.getMaterial('explosionParticle'),
            
            projectileGeometry: window.game.projectileGeometry,
            projectileGlowGeometry: window.game.projectileGlowGeometry,
            muzzleFlashGeometry: window.game.muzzleFlashGeometry,
            trailParticleGeometries: window.game.trailParticleGeometries,
            tracerGeometry: window.game.tracerGeometry
        });
        console.log("Initialized ProjectilePoolManager for object pooling with pre-warmed assets");
        
        // Initialize ECS world for advanced combat systems
        this.initializeECSWorld();
        
        console.log("Combat systems initialized");
    }
    
    // Material and geometry initialization moved to EffectsManager
    
    /**
     * Initialize the ECS world asynchronously
     * This is called from the constructor and runs in the background
     */
    async initializeECSWorld() {
        try {
            console.log("[COMBAT] Starting ECS world initialization...");
            
            // Use world setup module
            this.world = await this.worldSetup.initializeECSWorld(this.scene, this.spaceship);
            
            // Continue with full world setup
            await this.setupECSWorld();
            
            console.log("[COMBAT] ECS world initialization complete");
        } catch (error) {
            console.error("[COMBAT] Error initializing ECS world:", error);
        }
    }
    
    /**
     * Set up the ECS world and register combat systems
     */
    async setupECSWorld() {
        // Skip if world was already set up
        if (this.worldSetup.isWorldInitialized()) {
            console.log("[COMBAT] World already initialized, skipping setup");
            return;
        }
        
        try {
            // Register all systems using the system registrar
            const systems = await this.systemRegistrar.registerAllSystems(this.world, this.scene);
            
            // Store system references for backwards compatibility
            Object.assign(this, systems);
            
            // Set up event handlers
            this.eventManager.setupEventHandlers(this.world, this.worldSetup.getPlayerEntity());
            
            // Set scene reference for cross-system access
            this.worldSetup.setSceneReference(this.scene);
            
            // Initialize the world
            this.worldSetup.initializeWorld();
            
            // Create/update player reference entity
            this.playerEntity = await this.worldSetup.createPlayerReferenceEntity(this.spaceship);
            
            // Configure enemy system
            if (this.enemySystem) {
                this.aiSpawnerManager.configureEnemySystem(this.enemySystem);
            }
            
            // Mark world as initialized
            this.worldSetup.setWorldInitialized();
            
            console.log("[COMBAT] ECS combat systems registered and initialization process completed");
        } catch (error) {
            console.error("[COMBAT] Error during world setup:", error);
            console.error("[COMBAT] Stack trace:", error.stack);
        }
    }
    
    // Player entity creation moved to WorldSetup module
    
    /**
     * Update all projectiles and handle firing logic
     * @param {number} deltaTime Time since last update in seconds
     */
    update(deltaTime) {
        // Skip if disabled
        if (!this.scene || !this.spaceship) return;
        
        // Skip enemy updates if intro sequence is active
        const introActive = window.game && window.game.introSequenceActive;
        
        // Update the player reference entity position
        this.updatePlayerReference();
        
        // Update the spaceship health from ECS
        this.updateSpaceshipHealth();
        
        // Update all active projectiles (if any from old system)
        this.updateProjectiles(deltaTime);
        
        // Update active tracer beams
        this.effectsManager.updateTracers(deltaTime);
        
        // Update pooled visual effects (muzzle flashes, tracers, etc.)
        if (this.poolManager) {
            this.poolManager.update(deltaTime);
        }
        
        // Handle firing weapons
        if (this.isFiring && !this.spaceship.isDocked) {
            this.fireParticleCannon();
        }
        
        // Update the ECS world with the current delta time
        if (this.world && !introActive) {
            this.world.update(deltaTime);
        } else if (this.world && introActive) {
            // During intro, only update non-enemy systems
            if (this.world.systems) {
                for (const system of this.world.systems) {
                    // Skip enemy systems when intro is active
                    if (system.constructor.name !== 'EnemySystem' && 
                        system.constructor.name !== 'EnemyAISystem') {
                        system.update(deltaTime);
                    }
                }
            }
        } else if (!this.world) {
            console.log(`[COMBAT] No ECS world available for update`);
        }
    }
    
    /**
     * Update the player reference entity with the current spaceship position
     */
    updatePlayerReference() {
        this.worldSetup.updatePlayerReference(this.spaceship);
    }
    
    /**
     * Sync the spaceship hull/shield with the player entity's HealthComponent
     */
    updateSpaceshipHealth() {
        this.worldSetup.updateSpaceshipHealth(this.spaceship);
    }
    
    /**
     * Update all projectile positions
     * @param {number} deltaTime Time since last update in seconds
     */
    updateProjectiles(deltaTime) {
        // Normalize deltaTime to 60 FPS for frame rate independence
        const normalizedDeltaTime = deltaTime * 60;
        
        // Update existing projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            // Move projectile forward along its direction using normalized delta time
            // For projectiles, we need to scale by deltaTime alone, not normalized,
            // because the projectile speed is already calibrated for the base frame rate
            projectile.position.add(projectile.velocity.clone().multiplyScalar(deltaTime));
            
            // Update associated entity in ECS world
            if (projectile.userData && projectile.userData.entityId && this.world) {
                const entity = this.world.getEntity(projectile.userData.entityId);
                if (entity) {
                    // If entity has custom update method, call it
                    if (typeof entity.update === 'function') {
                        entity.update(deltaTime);
                    }
                    
                    // Otherwise manually update transform to match projectile
                    else {
                        const transform = entity.getComponent('TransformComponent');
                        if (transform) {
                            transform.position.copy(projectile.position);
                            transform.needsUpdate = true;
                        }
                        
                        const rigidbody = entity.getComponent('RigidbodyComponent');
                        if (rigidbody) {
                            rigidbody.velocity.copy(projectile.velocity);
                        }
                    }
                }
            }
            
            // Check if projectile has expired
            if (performance.now() - projectile.userData.creationTime > this.projectileLifetime) {
                // Remove associated entity from ECS world
                if (projectile.userData && projectile.userData.entityId && this.world) {
                    try {
                        this.world.destroyEntity(projectile.userData.entityId);
                        console.log(`Removed expired projectile entity ${projectile.userData.entityId}`);
                    } catch (error) {
                        console.error("Error removing projectile entity:", error);
                    }
                }
                
                // Use pool manager to release the projectile back to the pool
                // This handles all the cleanup of materials, geometries, and trails
                this.poolManager.releaseProjectile(projectile);
                
                // Remove from tracking array
                this.projectiles.splice(i, 1);
            }
        }
    }
    
    /**
     * Set firing state for the particle cannon
     * @param {boolean} isFiring Whether the cannon should be firing
     */
    setFiring(isFiring) {
        this.isFiring = isFiring;
        console.log(`Particle cannon firing state changed: ${isFiring}`);
    }
    
    /**
     * Create an explosion effect at the given position
     * @param {THREE.Vector3} position Position for the explosion
     * @param {number} duration Duration of the explosion in milliseconds
     * @param {boolean} isVisible Whether the explosion should be visible
     */
    createExplosionEffect(position, duration = 1000, isVisible = true) {
        return this.effectsManager.createExplosionEffect(position, duration, isVisible, this.poolManager);
    }
    
    // Tracer update logic moved to EffectsManager
    
    /**
     * Register an enemy entity for synchronization with EnemySystem
     * @param {string} enemyId ID of the enemy entity
     */
    registerEnemy(enemyId) {
        this.aiSpawnerManager.registerEnemy(enemyId);
    }
    
    /**
     * Unregister an enemy entity
     * @param {string} enemyId ID of the enemy entity
     */
    unregisterEnemy(enemyId) {
        this.aiSpawnerManager.unregisterEnemy(enemyId);
    }
    
    /**
     * Fire the particle cannon, creating two projectiles
     */
    fireParticleCannon() {
        const result = this.combatLogic.fireParticleCannon(
            this.scene, 
            this.spaceship, 
            this.world, 
            this.playerEntity, 
            this.projectileDamage, 
            this.lastFireTime, 
            this.cooldown
        );
        
        // Update last fire time
        this.lastFireTime = result.newLastFireTime;
        
        return result.success;
    }
    
    /**
     * Create a single projectile
     * @param {THREE.Vector3} position Spawn position
     * @param {THREE.Vector3} direction Direction vector
     */
    createProjectile(position, direction) {
        // Get a projectile from the pool
        const projectile = this.poolManager.getProjectile();
        
        // Set position and make visible
        projectile.position.copy(position);
        projectile.visible = true;
        
        // IMPORTANT: Orient the cylinder along the direction of travel
        // By default cylinders are created along the Y axis, we need to rotate them
        
        // First, find the quaternion that rotates from the default cylinder orientation (Y-axis)
        // to our desired direction
        const cylinderDefaultDirection = new THREE.Vector3(0, 1, 0); // Y-axis
        const quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(cylinderDefaultDirection, direction);
        
        // Apply the rotation to the projectile
        projectile.quaternion.copy(quaternion);
        
        // Set velocity based on direction and speed
        projectile.velocity = direction.clone().multiplyScalar(this.projectileSpeed);
        
        // Mark projectile as player's to prevent self-damage
        projectile.userData.isPlayerProjectile = true;
        projectile.userData.sourceId = 'player';
        projectile.userData.damage = this.projectileDamage;
        
        // Add a dynamic trail
        this.effectsManager.addProjectileTrail(projectile, direction, this.poolManager); // REINSTATED for laser trails
        
        // Add to scene if not already there
        if (!projectile.parent) {
            this.scene.add(projectile);
        }
        
        // Store creation time for lifespan tracking
        projectile.userData.creationTime = performance.now();
        
        // Add to projectiles array to track active projectiles
        this.projectiles.push(projectile);

        // Register into optimized store if available
        if (this.world && this.world.optimizedProjectiles) {
            try { this.world.optimizedProjectiles.register(projectile); } catch {}
        }
        
        return projectile;
    }
    
    /**
     * Enable or disable all combat systems
     * @param {boolean} enabled Whether combat systems should be enabled
     */
    setEnabled(enabled) {
        // If disabling, clear all projectiles
        if (!enabled) {
            this.clearAllProjectiles();
        }
        
        // Use system registrar to enable/disable systems
        this.systemRegistrar.setSystemsEnabled(enabled);
    }
    
    // Instant tracer creation moved to EffectsManager
    
    // Projectile trail logic moved to EffectsManager
    
    /**
     * Clear all active projectiles
     */
    clearAllProjectiles() {
        // Release all projectiles back to the pool
        for (const projectile of this.projectiles) {
            if (this.world && this.world.optimizedProjectiles) {
                try { this.world.optimizedProjectiles.unregister(projectile); } catch {}
            }
            // Remove associated entity from ECS world
            if (projectile.userData && projectile.userData.entityId && this.world) {
                try {
                    this.world.destroyEntity(projectile.userData.entityId);
                } catch (error) {
                    console.error("Error removing projectile entity:", error);
                }
            }
            
            // Return projectile to the pool
            this.poolManager.releaseProjectile(projectile);
        }
        
        // Clear the tracking array
        this.projectiles = [];
        
        console.log("All projectiles cleared and returned to the pool");
    }
    
    // Aiming tracer creation moved to EffectsManager
    createAimingTracer(startPosition, direction, distance = 3000) {
        return this.effectsManager.createAimingTracer(startPosition, direction, distance, this.poolManager);
    }
    
    /**
     * Create a laser burst effect that travels forward with the projectile
     * @param {THREE.Vector3} position Position for the effect
     * @param {THREE.Vector3} direction Direction the effect should travel
     */
    createMuzzleFlash(position, direction) {
        return this.effectsManager.createMuzzleFlash(position, direction, this.poolManager);
    }
    
    /**
     * Dispose Combat module resources
     * Clean up all pools, geometries, and other resources
     */
    dispose() {
        console.log("Disposing Combat module resources...");
        
        // Clear all active projectiles
        this.clearAllProjectiles();
        
        // Dispose pool manager if it exists
        if (this.poolManager) {
            this.poolManager.dispose();
            this.poolManager = null;
        }
        
        // Dispose submodules
        if (this.effectsManager) {
            this.effectsManager.dispose();
        }
        
        if (this.eventManager) {
            this.eventManager.cleanup();
        }
        
        if (this.aiSpawnerManager) {
            this.aiSpawnerManager.emergencyCleanup();
        }
        
        // Mark as disposed
        this.disposed = true;
        
        console.log("Combat module resources disposed");
    }

    // Renderer facade helpers moved to EffectsManager
    
    /**
     * Import and register a system
     * @param {string} path The path to the system module
     * @param {string} className The name of the system class
     * @returns {Object} The system instance
     */
    async importAndRegisterSystem(path, className) {
        return this.systemRegistrar.importAndRegisterSystem(path, className, this.world, this.scene);
    }
}

// Helper to remove the addProjectileTrail method entirely if it exists as a standalone function in an unexpected way
// This is unlikely given typical class structure but added for robustness
// if (typeof Combat !== 'undefined' && Combat.prototype.addProjectileTrail) {
// delete Combat.prototype.addProjectileTrail;
//     console.log("Dynamically removed addProjectileTrail from Combat prototype if it existed.");
// }