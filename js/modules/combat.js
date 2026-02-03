/**
 * Combat module - Handles all combat-related functionality
 * 
 * This module manages particle cannon firing and combat logic.
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
import * as THREE from 'three';

export class Combat {
    constructor(scene, spaceship) {
        this.scene = scene;
        this.spaceship = spaceship;
        
        // Tuned these parameters for better gameplay
        this.fireRate = 3; // shots per second
        
        // Track the last time we fired for rate limiting
        this.lastFireTime = 0;
        
        // Reference size for spread calculation
        this.aimingSpread = 0.05;
        
        // Weapon properties
        this.isFiring = false;
        this.cooldown = 1000 / this.fireRate; // milliseconds between shots
        
        // Combat properties
        this.particleCannonDamage = 20; // Standard damage per particle cannon hit
        
        // Initialize submodules
        this.worldSetup = new WorldSetup();
        this.systemRegistrar = new SystemRegistrar();
        this.eventManager = new EventManager();
        this.effectsManager = new EffectsManager(scene);
        this.aiSpawnerManager = new AISpawnerManager();
        this.combatLogic = new CombatLogic(this.effectsManager, this.eventManager, this.aiSpawnerManager);
        
        // Pool manager removed - projectile system not in use
        
        // Initialize ECS world for advanced combat systems
        this.initializeECSWorld();
        
    }
    
    // Material and geometry initialization moved to EffectsManager
    
    /**
     * Initialize the ECS world asynchronously
     * This is called from the constructor and runs in the background
     */
    async initializeECSWorld() {
        try {
            
            // Use world setup module
            this.world = await this.worldSetup.initializeECSWorld(this.scene, this.spaceship);
            
            // Continue with full world setup
            await this.setupECSWorld();
            
        } catch (error) {
        }
    }
    
    /**
     * Set up the ECS world and register combat systems
     */
    async setupECSWorld() {
        // Skip if world was already set up
        if (this.worldSetup.isWorldInitialized()) {
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
            
        } catch (error) {
        }
    }
    
    // Player entity creation moved to WorldSetup module
    
    /**
     * Update combat systems and handle firing logic
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
        
        
        // Update active tracer beams
        this.effectsManager.updateTracers(deltaTime);
        
        // Pooled visual effects removed - using instant raycast only
        
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
                    const systemType = system.type || system.constructor.name;
                    if (systemType !== 'EnemySystem' &&
                        systemType !== 'EnemyAISystem') {
                        system.update(deltaTime);
                    }
                }
            }
        } else if (!this.world) {
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
     * Set firing state for the particle cannon
     * @param {boolean} isFiring Whether the cannon should be firing
     */
    setFiring(isFiring) {
        this.isFiring = isFiring;
    }
    
    /**
     * Create an explosion effect at the given position
     * @param {THREE.Vector3} position Position for the explosion
     * @param {number} duration Duration of the explosion in milliseconds
     * @param {boolean} isVisible Whether the explosion should be visible
     */
    createExplosionEffect(position, duration = 1000, isVisible = true) {
        return this.effectsManager.createExplosionEffect(position, duration, isVisible, null);
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
     * Fire the particle cannon with instant raycast damage
     */
    fireParticleCannon() {
        const result = this.combatLogic.fireParticleCannon(
            this.scene, 
            this.spaceship, 
            this.world, 
            this.playerEntity, 
            this.particleCannonDamage, 
            this.lastFireTime, 
            this.cooldown
        );
        
        // Update last fire time
        this.lastFireTime = result.newLastFireTime;
        
        return result.success;
    }
    
    
    /**
     * Enable or disable all combat systems
     * @param {boolean} enabled Whether combat systems should be enabled
     */
    setEnabled(enabled) {
        
        // Use system registrar to enable/disable systems
        this.systemRegistrar.setSystemsEnabled(enabled);
    }
    
    
    // Aiming tracer creation moved to EffectsManager
    createAimingTracer(startPosition, direction, distance = 3000) {
        return this.effectsManager.createAimingTracer(startPosition, direction, distance, null);
    }
    
    /**
     * Create a laser burst effect that travels forward with the projectile
     * @param {THREE.Vector3} position Position for the effect
     * @param {THREE.Vector3} direction Direction the effect should travel
     */
    createMuzzleFlash(position, direction) {
        return this.effectsManager.createMuzzleFlash(position, direction, null);
    }
    
    /**
     * Dispose Combat module resources
     * Clean up all pools, geometries, and other resources
     */
    dispose() {

        // Projectile system removed
        
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
;
// }