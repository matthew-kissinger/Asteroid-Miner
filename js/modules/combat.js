/**
 * Combat module - Handles all combat-related functionality
 * 
 * This module manages particle cannon firing, projectile creation, and combat logic.
 * 
 * IMPORTANT: As of the latest update, this module directly handles all enemy destruction
 * when projectiles are fired. The collision detection and enemy destruction functionality
 * previously handled by CollisionSystem and ParticleCannonSystem has been moved here for
 * reliability, as there were issues with the event-based approach.
 */

import { World } from '../core/world.js';
import { CombatSystem } from '../systems/combat/combatSystem.js';
import { EnemySystem } from '../systems/combat/enemySystem.js';
import { RenderSystem } from '../systems/rendering/renderSystem.js';
import { CollisionSystem } from '../systems/physics/collisionSystem.js'; // Import CollisionSystem
import { VisualEffectsSystem } from '../systems/rendering/visualEffectsSystem.js'; // Import VisualEffectsSystem
import { TrailSystem } from '../systems/rendering/trailSystem.js';

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
        
        // Initialize ECS world for advanced combat systems
        // This needs to be initialized asynchronously, but constructors can't be async
        // So we'll just kick off the initialization and let it complete in the background
        this.initializeECSWorld();
        
        console.log("Combat systems initialized");
    }
    
    /**
     * Initialize the ECS world asynchronously
     * This is called from the constructor and runs in the background
     */
    async initializeECSWorld() {
        try {
            console.log("[COMBAT] Starting ECS world initialization...");
            
            // Create a new World instance immediately to allow references
            this.world = new World(window.mainMessageBus);
            console.log("[COMBAT] Created world with messageBus: ", 
                        this.world.messageBus === window.mainMessageBus ? "Using shared messageBus" : "Created new messageBus");
            
            // Make world globally available immediately
            if (window.game) {
                window.game.ecsWorld = this.world;
                console.log("[COMBAT] Made ECS world globally available via window.game.ecsWorld");
            }
            
            // Create player entity immediately - don't wait for full setup
            await this.createPlayerReferenceEntity();
            
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
        if (this.worldInitialized) {
            console.log("[COMBAT] World already initialized, skipping setup");
            return;
        }
        
        // Store scene reference in world for systems that need it
        this.world.scene = this.scene;
        
        // Log scene reference for debugging
        console.log(`[COMBAT] Set scene reference in ECS world for enemy rendering:`, 
                   this.scene ? "Scene available" : "No scene available");
        
        // Register combat systems
        console.log("[COMBAT] Registering combat systems with ECS world...");
        
        try {
            // Register the combat system
            this.combatSystem = new CombatSystem(this.world);
            this.world.registerSystem(this.combatSystem);
            
            // Register the enemy system
            this.enemySystem = new EnemySystem(this.world);
            this.world.registerSystem(this.enemySystem);
            
            // GLOBAL ACCESS: Make the enemy system accessible to other modules
            if (window.game) {
                window.game.ecsWorld = window.game.ecsWorld || {};
                window.game.ecsWorld.enemySystem = this.enemySystem;
                console.log("[COMBAT] Made enemy system globally available via window.game.ecsWorld.enemySystem");
            }
            
            // Register the trail system for visual effects
            this.trailSystem = new TrailSystem(this.world);
            this.world.registerSystem(this.trailSystem);
            
            // Add trail system to window.game for global access if game object exists
            if (window.game) {
                window.game.trailSystem = this.trailSystem;
                console.log("[COMBAT] Registered trail system with window.game for global access");
            }
            
            // Register the render system - this is critical for making meshes visible
            // Use the scene's camera reference if available
            const camera = this.scene.camera;
            
            if (!camera) {
                console.error("[COMBAT] No camera found on scene, enemies may not be visible");
            }
            
            // Log camera reference for debugging
            console.log(`[COMBAT] Camera reference for RenderSystem: ${camera ? "Available" : "Missing"}`);
            
            // Note: We're only passing the scene and camera, not the renderer
            // This avoids the issues with trying to call render() from the RenderSystem
            this.renderSystem = new RenderSystem(this.world, this.scene, camera);
            this.world.registerSystem(this.renderSystem);
            
            // Register the CollisionSystem
            console.log("[COMBAT] Registering CollisionSystem with the world...");
            this.collisionSystem = new CollisionSystem(this.world);
            this.world.registerSystem(this.collisionSystem);
            console.log("[COMBAT] CollisionSystem registered");
            
            // Register the VisualEffectsSystem
            console.log("[COMBAT] Registering VisualEffectsSystem with the world...");
            this.visualEffectsSystem = new VisualEffectsSystem(this.world);
            this.world.registerSystem(this.visualEffectsSystem);
            console.log("[COMBAT] VisualEffectsSystem registered");
            
            // Set reference to this world in the scene for cross-component access
            if (this.scene) {
                this.scene.ecsWorld = this.world;
                console.log("[COMBAT] Set ECS world reference in scene for cross-system access");
            }
            
            // Initialize the world
            try {
                console.log("[COMBAT] Calling world.initialize()...");
                this.world.initialize();
                console.log("[COMBAT] World initialization completed successfully");
            } catch (error) {
                console.error("[COMBAT] Error during world.initialize():", error);
                console.error("[COMBAT] Stack trace:", error.stack);
                
                // Continue execution - don't let this error stop us
                console.log("[COMBAT] Continuing despite initialization error");
            }
            
            // Create player reference entity again to ensure it exists
            await this.createPlayerReferenceEntity();
            
            // Configure enemy system 
            if (this.enemySystem) {
                // Force enemy verification after world is set up
                this.enemySystem.validateEnemyReferences();
                
                // IMPORTANT: Ensure any lingering enemies over the limit are cleaned up
                if (this.enemySystem.enemies.size > this.enemySystem.maxEnemies) {
                    console.warn(`[COMBAT] Found ${this.enemySystem.enemies.size} enemies exceeding limit of ${this.enemySystem.maxEnemies} during setup`);
                    this.enemySystem.enforceEnemyLimit();
                }
                
                // Force enemy system to generate spawn points based on player position
                this.enemySystem.generateSpawnPoints();
                
                console.log(`[COMBAT] Configured enemy system: Max enemies ${this.enemySystem.maxEnemies}`);
            }
            
            // Mark world as initialized
            this.worldInitialized = true;
            
            console.log("[COMBAT] ECS combat systems registered and initialization process completed");
        } catch (error) {
            console.error("[COMBAT] Error during world setup:", error);
            console.error("[COMBAT] Stack trace:", error.stack);
        }
    }
    
    /**
     * Create a player reference entity in the ECS world
     * This allows enemies and other systems to interact with the player
     */
    async createPlayerReferenceEntity() {
        if (!this.world) {
            console.error("[COMBAT] Cannot create player entity - world not available");
            return null;
        }
        
        if (!this.spaceship) {
            console.error("[COMBAT] Cannot create player entity - spaceship not available");
            return null;
        }
        
        try {
            console.log("[COMBAT] Creating player reference entity...");
            
            // If player entity already exists, check if it's valid
            if (this.playerEntity) {
                const existingEntity = this.world.getEntity(this.playerEntity.id);
                if (existingEntity) {
                    console.log(`[COMBAT] Player entity already exists with ID: ${this.playerEntity.id}`);
                    
                    // Make sure it has the player tag (re-add if missing)
                    if (!existingEntity.hasTag('player')) {
                        console.log("[COMBAT] Re-adding 'player' tag to existing entity");
                        existingEntity.addTag('player');
                    }
                    
                    // Update its position
                    const transform = existingEntity.getComponent('TransformComponent');
                    if (transform && this.spaceship.mesh) {
                        transform.position.copy(this.spaceship.mesh.position);
                        transform.rotation.copy(this.spaceship.mesh.rotation);
                        transform.quaternion.copy(this.spaceship.mesh.quaternion);
                        if (typeof transform.setUpdated === 'function') {
                            transform.setUpdated();
                        }
                    }
                    
                    // Make it globally accessible
                    if (window.game) {
                        window.game.combat = window.game.combat || {};
                        window.game.combat.playerEntity = existingEntity;
                    }
                    
                    return existingEntity;
                } else {
                    console.log("[COMBAT] Previous player entity no longer exists, creating new one");
                }
            }
            
            // Create player entity with a clear unique name
            const playerEntity = this.world.createEntity('player_' + Date.now());
            
            // Add player tag and log it
            playerEntity.addTag('player');
            console.log(`[COMBAT] Added 'player' tag to entity ${playerEntity.id}`);
            
            // Import needed components
            let TransformComponent, HealthComponent;
            
            try {
                const transformModule = await import('../components/transform.js');
                TransformComponent = transformModule.TransformComponent;
                console.log("[COMBAT] Successfully imported TransformComponent");
            } catch (error) {
                console.error("[COMBAT] Failed to import TransformComponent:", error);
                // Create a minimal fallback if import fails
                TransformComponent = class FallbackTransform extends Component {
                    constructor(position) { 
                        super();
                        this.position = position || new THREE.Vector3();
                        this.rotation = new THREE.Euler();
                        this.quaternion = new THREE.Quaternion();
                    }
                };
            }
            
            try {
                const healthModule = await import('../components/combat/healthComponent.js');
                HealthComponent = healthModule.HealthComponent;
                console.log("[COMBAT] Successfully imported HealthComponent");
            } catch (error) {
                console.error("[COMBAT] Failed to import HealthComponent:", error);
                // Create a minimal fallback if import fails
                HealthComponent = class FallbackHealth extends Component {
                    constructor(health, shield) {
                        super();
                        this.health = health || 100;
                        this.shield = shield || 50;
                        this.maxHealth = health || 100;
                        this.maxShield = shield || 50;
                    }
                };
            }
            
            // Add transform component linked to spaceship position
            try {
                const position = this.spaceship.mesh ? this.spaceship.mesh.position.clone() : new THREE.Vector3();
                const transform = new TransformComponent(position);
                playerEntity.addComponent(transform);
                console.log(`[COMBAT] Added TransformComponent to player entity with position: ${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)}`);
            } catch (error) {
                console.error("[COMBAT] Error adding TransformComponent to player entity:", error);
            }
            
            // Add health component
            try {
                const health = new HealthComponent(100, 50); // 100 health, 50 shield
                playerEntity.addComponent(health);
                console.log("[COMBAT] Added HealthComponent to player entity");
            } catch (error) {
                console.error("[COMBAT] Error adding HealthComponent to player entity:", error);
            }
            
            // Store reference to player entity
            this.playerEntity = playerEntity;
            
            // Make the player entity globally accessible for emergency access
            if (window.game) {
                window.game.combat = window.game.combat || {};
                window.game.combat.playerEntity = playerEntity;
                console.log("[COMBAT] Made player entity globally accessible via window.game.combat.playerEntity");
            }
            
            // Add direct player entity reference to the world
            this.world.playerEntity = playerEntity;
            console.log("[COMBAT] Made player entity available directly via world.playerEntity");
            
            // Explicitly publish an event for player entity creation
            if (this.world && this.world.messageBus) {
                this.world.messageBus.publish('player.created', { entity: playerEntity });
                console.log("[COMBAT] Published player.created event");
            }
            
            console.log("[COMBAT] Successfully created player reference entity with ID:", playerEntity.id);
            
            // Return the entity for chaining
            return playerEntity;
        } catch (error) {
            console.error("[COMBAT] Error creating player reference entity:", error);
            console.error("[COMBAT] Stack trace:", error.stack);
            return null;
        }
    }
    
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
        
        // Update all active projectiles
        this.updateProjectiles(deltaTime);
        
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
        }
    }
    
    /**
     * Update the player reference entity with the current spaceship position
     */
    updatePlayerReference() {
        // Skip if missing references
        if (!this.world || !this.spaceship || !this.playerEntity) {
            // If we don't have a player entity, try to create one now if world is ready
            if (this.world && this.spaceship && !this.playerEntity) {
                console.log("No player entity found, creating one...");
                this.createPlayerReferenceEntity();
                return;
            }
            return;
        }
        
        // Get the player entity
        const playerEntity = this.world.getEntity(this.playerEntity.id);
        
        // If entity was somehow lost, recreate it
        if (!playerEntity) {
            console.warn("Player entity lost, recreating...");
            this.createPlayerReferenceEntity();
            return;
        }
        
        // Update transform component with current spaceship position
        const transform = playerEntity.getComponent('TransformComponent');
        if (transform && this.spaceship.mesh) {
            // Update position
            transform.position.copy(this.spaceship.mesh.position);
            
            // Update rotation
            transform.rotation.copy(this.spaceship.mesh.rotation);
            transform.quaternion.copy(this.spaceship.mesh.quaternion);
            
            // Mark transform as updated to trigger any listening systems
            if (typeof transform.setUpdated === 'function') {
                transform.setUpdated();
            }
        }
        
        // Update health component if spaceship has relevant health info
        const health = playerEntity.getComponent('HealthComponent');
        if (health && this.spaceship.health !== undefined) {
            // Only update health if it would be higher - don't override damage
            if (this.spaceship.health > health.health) {
                health.health = this.spaceship.health;
            }
            
            // Only update shield if it would be higher - don't override damage
            if (this.spaceship.shield !== undefined && this.spaceship.shield > health.shield) {
                health.shield = this.spaceship.shield;
            }
        }
    }
    
    /**
     * Sync the spaceship hull/shield with the player entity's HealthComponent
     */
    updateSpaceshipHealth() {
        if (!this.playerEntity || !this.spaceship) return;
        
        // Get health component
        const health = this.playerEntity.getComponent('HealthComponent');
        if (health) {
            // IMPORTANT: Only update spaceship health if the health component shows MORE damage
            // (less health) than the spaceship currently has - this means damage was applied to the component
            if (health.health < this.spaceship.hull) {
                console.log(`Damage detected in health component: ${health.health} (was ${this.spaceship.hull})`);
                this.spaceship.hull = health.health;
            }
            
            // Similarly for shield
            if (health.shield < this.spaceship.shield) {
                console.log(`Shield damage detected in health component: ${health.shield} (was ${this.spaceship.shield})`);
                this.spaceship.shield = health.shield;
            }
            
            // Check if health indicates the ship is destroyed
            if (health.isDestroyed && !this.spaceship.isDestroyed) {
                console.log("Health component indicates player is destroyed - updating spaceship state");
                this.spaceship.isDestroyed = true;
                
                // Call handle destruction for visual effects
                if (typeof this.spaceship.handleDestruction === 'function') {
                    this.spaceship.handleDestruction();
                }
            }
            
            // Check for low health and update spaceship directly
            if (health.health <= 0 && !this.spaceship.isDestroyed) {
                console.log("Player health is zero - marking spaceship as destroyed");
                this.spaceship.isDestroyed = true;
                
                // Call handle destruction for visual effects
                if (typeof this.spaceship.handleDestruction === 'function') {
                    this.spaceship.handleDestruction();
                }
                
                // Force game over with a "pwned by space alien" message
                if (window.game) {
                    console.log("FORCING GAME OVER FROM COMBAT MODULE!");
                    window.game.gameOver("You were pwned by a space alien!");
                }
            }
        }
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
            if (performance.now() - projectile.creationTime > this.projectileLifetime) {
                // Proper cleanup for our new trail system
                if (projectile.userData.trail) {
                    // Remove all trail particles to prevent memory leaks
                    if (projectile.userData.trailParticles) {
                        for (const particle of projectile.userData.trailParticles) {
                            if (particle.material) {
                                particle.material.dispose();
                            }
                            if (particle.geometry) {
                                particle.geometry.dispose();
                            }
                            projectile.userData.trail.remove(particle);
                        }
                    }
                    projectile.remove(projectile.userData.trail);
                }
                
                // Dispose of projectile resources
                if (projectile.material) {
                    projectile.material.dispose();
                }
                if (projectile.geometry) {
                    projectile.geometry.dispose();
                }
                
                // Clean up glow effect if it exists
                if (projectile.children.length > 0) {
                    for (const child of projectile.children) {
                        if (child.material) {
                            child.material.dispose();
                        }
                        if (child.geometry) {
                            child.geometry.dispose();
                        }
                        projectile.remove(child);
                    }
                }
                
                // Remove associated entity from ECS world
                if (projectile.userData && projectile.userData.entityId && this.world) {
                    try {
                        this.world.destroyEntity(projectile.userData.entityId);
                        console.log(`Removed expired projectile entity ${projectile.userData.entityId}`);
                    } catch (error) {
                        console.error("Error removing projectile entity:", error);
                    }
                }
                
                // Remove from scene and list
                this.scene.remove(projectile);
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
        try {
            // Create particle geometry for explosion
            const particleCount = 200;
            const geometry = new THREE.BufferGeometry();
            const positions = new Float32Array(particleCount * 3);
            
            // Randomize particle positions in a sphere
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                positions[i3] = (Math.random() - 0.5) * 100;
                positions[i3 + 1] = (Math.random() - 0.5) * 100;
                positions[i3 + 2] = (Math.random() - 0.5) * 100;
            }
            
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            
            // Create bright material with additive blending for glow effect
            const material = new THREE.PointsMaterial({
                color: 0xff9900,
                size: 10,
                transparent: true,
                opacity: 1,
                blending: THREE.AdditiveBlending
            });
            
            // Create particle system
            const explosion = new THREE.Points(geometry, material);
            explosion.position.copy(position);
            this.scene.add(explosion);
            
            console.log("Created explosion effect at:", position.x.toFixed(0), position.y.toFixed(0), position.z.toFixed(0));
            
            // Automatically remove after animation
            const startTime = Date.now();
            
            // Animation function
            const animateExplosion = () => {
                const elapsed = Date.now() - startTime;
                const progress = elapsed / duration;
                
                if (elapsed < duration) {
                    // Calculate animation progress (0-1)
                    const progress = elapsed / duration;
                    
                    // Expand particles outward
                    for (let i = 0; i < particleCount; i++) {
                        const i3 = i * 3;
                        const x = positions[i3] * (1 + progress * 5);
                        const y = positions[i3 + 1] * (1 + progress * 5);
                        const z = positions[i3 + 2] * (1 + progress * 5);
                        
                        explosion.geometry.attributes.position.array[i3] = x;
                        explosion.geometry.attributes.position.array[i3 + 1] = y;
                        explosion.geometry.attributes.position.array[i3 + 2] = z;
                    }
                    
                    explosion.geometry.attributes.position.needsUpdate = true;
                    
                    // Fade out
                    material.opacity = 1 - progress;
                    
                    // Continue animation
                    requestAnimationFrame(animateExplosion);
                } else {
                    // Remove from scene when done
                    this.scene.remove(explosion);
                    console.log("Explosion animation complete");
                }
            };
            
            // Start animation
            animateExplosion();
            
            // Play explosion sound
            if (window.game && window.game.audio) {
                window.game.audio.playSound('boink');
            }
        } catch (error) {
            console.error("Error creating explosion effect:", error);
        }
    }
    
    /**
     * Register an enemy entity for synchronization with EnemySystem
     * @param {string} enemyId ID of the enemy entity
     */
    registerEnemy(enemyId) {
        // Add hook to track enemy entities for external systems
        if (!this._registeredEnemyIds) {
            this._registeredEnemyIds = new Set();
        }
        
        // Add enemy to our tracking set
        this._registeredEnemyIds.add(enemyId);
        console.log(`Combat module: Registered enemy ${enemyId} for tracking (total: ${this._registeredEnemyIds.size})`);
    }
    
    /**
     * Unregister an enemy entity
     * @param {string} enemyId ID of the enemy entity
     */
    unregisterEnemy(enemyId) {
        if (this._registeredEnemyIds && this._registeredEnemyIds.has(enemyId)) {
            this._registeredEnemyIds.delete(enemyId);
            console.log(`Combat module: Unregistered enemy ${enemyId} (remaining: ${this._registeredEnemyIds.size})`);
        }
    }
    
    /**
     * Fire the particle cannon, creating two projectiles
     */
    fireParticleCannon() {
        if (!this.spaceship || !this.spaceship.mesh) return false;
        
        // Check cooldown - prevent firing too rapidly
        const currentTime = performance.now();
        if (currentTime - this.lastFireTime < this.cooldown) {
            // Still in cooldown period
            return false;
        }
        
        console.log("*** COMBAT MODULE: Firing particle cannon ***");
        
        // Update last shot time for cooldown tracking
        this.lastFireTime = currentTime;
        
        // Get ship transform data
        const shipPosition = this.spaceship.mesh.position.clone();
        
        // IMPROVED AIMING: Use raycasting from camera through crosshair
        // Create a ray from the camera through the center of the screen (crosshair)
        const camera = this.scene.camera;
        if (!camera) {
            console.error("Camera not available for aiming");
            return false;
        }
        
        // Create a raycaster from camera center (crosshair position)
        const raycaster = new THREE.Raycaster();
        // Vector representing center of the screen (crosshair)
        const screenCenter = new THREE.Vector2(0, 0);
        
        // Set the raycaster from camera through crosshair
        raycaster.setFromCamera(screenCenter, camera);
        
        // Get the ray direction in world space
        const direction = raycaster.ray.direction.clone().normalize();
        
        // Log the new direction approach
        console.log(`Projectile direction (using camera ray): ${direction.x.toFixed(2)}, ${direction.y.toFixed(2)}, ${direction.z.toFixed(2)}`);
        
        // Calculate right vector for offset
        const right = new THREE.Vector3().crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize();
        
        // Position offsets for dual projectiles
        const leftOffset = new THREE.Vector3().copy(right).multiplyScalar(-1.5);
        const rightOffset = new THREE.Vector3().copy(right).multiplyScalar(1.5);
        
        // Add slight forward offset so projectiles spawn in front of ship
        const forwardOffset = new THREE.Vector3().copy(direction).multiplyScalar(7);
        
        // Calculate weapon port positions (where the flash should originate)
        // Use smaller forward offset for weapon ports to place them closer to the ship
        const weaponForwardOffset = new THREE.Vector3().copy(direction).multiplyScalar(4);
        
        const leftWeaponPosition = new THREE.Vector3().copy(shipPosition)
            .add(leftOffset)
            .add(weaponForwardOffset);
            
        const rightWeaponPosition = new THREE.Vector3().copy(shipPosition)
            .add(rightOffset)
            .add(weaponForwardOffset);
        
        // Create left projectile (still uses original forward offset)
        const leftPosition = new THREE.Vector3().copy(shipPosition)
            .add(leftOffset)
            .add(forwardOffset);
        const leftProjectile = this.createProjectile(leftPosition, direction);
        
        // Create right projectile (still uses original forward offset)
        const rightPosition = new THREE.Vector3().copy(shipPosition)
            .add(rightOffset)
            .add(forwardOffset);
        const rightProjectile = this.createProjectile(rightPosition, direction);
        
        // Create flash effects at the weapon port positions
        this.createMuzzleFlash(leftWeaponPosition, direction);
        this.createMuzzleFlash(rightWeaponPosition, direction);
        
        // Play projectile sound
        if (window.game && window.game.audio) {
            console.log("Playing ASMR projectile sound for particle cannon");
            window.game.audio.playSound('projectile');
        }
        
        // DIRECT ENEMY CHECK - Find any enemies in the scene and check for direct hits
        console.log("DIRECT ENEMY CHECK: Searching for enemies to destroy");
        if (this.world && this.world.entityManager) {
            let enemies = [];
            
            // Try to get enemies from tag map
            try {
                if (this.world.entityManager.entitiesByTag && this.world.entityManager.entitiesByTag.get('enemy')) {
                    enemies = this.world.entityManager.entitiesByTag.get('enemy');
                    console.log(`Found ${enemies.length} enemies via tag map`);
                } else {
                    // Fallback to checking all entities
                    console.log("No enemy tag map, checking all entities");
                    const allEntities = Array.from(this.world.entityManager.entities.values());
                    for (const entity of allEntities) {
                        if (entity.hasTag && entity.hasTag('enemy')) {
                            enemies.push(entity);
                        } else if (entity.hasComponent && entity.hasComponent('EnemyAIComponent')) {
                            enemies.push(entity);
                        }
                    }
                    console.log(`Found ${enemies.length} enemies by checking all entities`);
                }
            } catch (error) {
                console.error("Error finding enemies:", error);
            }
            
            // Check for collision with each enemy - using raycasting for better precision
            for (const enemy of enemies) {
                if (!enemy) continue;
                
                try {
                    // Get enemy position
                    let enemyPosition = null;
                    const enemyTransform = enemy.getComponent('TransformComponent');
                    if (enemyTransform) {
                        enemyPosition = enemyTransform.position;
                    } else {
                        console.log("Enemy missing transform component");
                        continue;
                    }
                    
                    // Get enemy collision radius
                    let enemyRadius = 20; // Default radius
                    const enemyRigidbody = enemy.getComponent('RigidbodyComponent');
                    if (enemyRigidbody && enemyRigidbody.collisionRadius) {
                        enemyRadius = enemyRigidbody.collisionRadius;
                    }
                    
                    // Calculate distance from ship to enemy
                    const distanceToEnemy = shipPosition.distanceTo(enemyPosition);
                    console.log(`Enemy ${enemy.id} at distance: ${distanceToEnemy.toFixed(0)}`);
                    
                    // IMPROVED HIT DETECTION: Check if ray intersects enemy sphere
                    // Calculate distance from ray to enemy center
                    const rayToEnemyDistance = raycaster.ray.distanceToPoint(enemyPosition);
                    
                    // If distance is less than enemy radius, we have a hit
                    if (rayToEnemyDistance < enemyRadius) {
                        console.log(`*** RAY HIT on enemy ${enemy.id}! Ray distance: ${rayToEnemyDistance.toFixed(2)}, Enemy radius: ${enemyRadius.toFixed(2)} ***`);
                        
                        // Force destroy enemy via all possible methods
                        // Method 1: Apply damage via health component
                        const health = enemy.getComponent('HealthComponent');
                        if (health) {
                            console.log("Applying damage to enemy");
                            // Use the standardized projectile damage value
                            const damageResult = health.applyDamage(this.projectileDamage, 'particle', this.playerEntity);
                            
                            // Check if the damage was enough to destroy the enemy
                            if (health.health <= 0) {
                                console.log("Enemy health depleted, destroying entity");
                                health.isDestroyed = true;
                                
                                // Create explosion effect for destroyed enemy
                                const enemyTransform = enemy.getComponent('TransformComponent');
                                if (enemyTransform) {
                                    this.createExplosionEffect(enemyTransform.position.clone());
                                    
                                    // Play explosion sound if available
                                    if (window.game && window.game.audio) {
                                        window.game.audio.playSound('boink');
                                    }
                                }
                                
                                // SYNCHRONIZATION FIX: Unregister enemy from our registry
                                this.unregisterEnemy(enemy.id);
                                
                                // SYNC WITH ENEMY SYSTEM: Force EnemySystem to handle this destruction properly
                                if (window.game && window.game.ecsWorld && window.game.ecsWorld.enemySystem) {
                                    console.log(`Notifying EnemySystem directly about enemy ${enemy.id} destruction`);
                                    try {
                                        const enemySystem = window.game.ecsWorld.enemySystem;
                                        if (typeof enemySystem.handleEntityDestroyed === 'function') {
                                            enemySystem.handleEntityDestroyed({
                                                entity: enemy,
                                                reason: 'projectile'
                                            });
                                        }
                                    } catch (syncError) {
                                        console.error("Error syncing with EnemySystem:", syncError);
                                    }
                                }
                                
                                // Method 2: Direct entity destruction only if health is depleted
                                try {
                                    // Use system-specific methods if available
                                    if (window.game && window.game.ecsWorld && window.game.ecsWorld.enemySystem) {
                                        const enemySystem = window.game.ecsWorld.enemySystem;
                                        // Try returnEnemyToPool first which properly handles cleanup
                                        if (typeof enemySystem.returnEnemyToPool === 'function') {
                                            console.log(`Using EnemySystem.returnEnemyToPool for enemy ${enemy.id}`);
                                            enemySystem.returnEnemyToPool(enemy);
                                        }
                                        // Force validation of references in EnemySystem
                                        if (typeof enemySystem.validateEnemyReferences === 'function') {
                                            enemySystem.validateEnemyReferences();
                                        }
                                    } else {
                                        // Fallback to direct destruction
                                        this.world.destroyEntity(enemy.id);
                                        console.log("Enemy destroyed via world.destroyEntity");
                                    }
                                } catch (e) {
                                    console.error("Failed to destroy enemy:", e);
                                }
                                
                                // ADDITIONAL SYNC: Publish explicit event about destruction
                                if (this.world && this.world.messageBus) {
                                    this.world.messageBus.publish('enemy.destroyed', {
                                        entityId: enemy.id,
                                        source: 'playerProjectile',
                                        position: enemyPosition.clone()
                                    });
                                }
                            } else {
                                console.log(`Enemy hit but survived with ${health.health}/${health.maxHealth} health remaining`);
                                // Non-lethal hit - no visual effect
                            }
                        }
                    }
                } catch (error) {
                    console.error("Error checking enemy collision:", error);
                }
            }
        } else {
            console.log("No world or entityManager available for enemy check");
        }
        
        // Return true to indicate successful firing
        return true;
    }
    
    /**
     * Create a single projectile
     * @param {THREE.Vector3} position Spawn position
     * @param {THREE.Vector3} direction Direction vector
     */
    createProjectile(position, direction) {
        // Create projectile geometry and material with improved visuals
        const geometry = new THREE.SphereGeometry(1.8, 12, 12); // Better quality sphere, 3x size
        const material = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 5,
            metalness: 0.7,
            roughness: 0.3
        });
        
        // Add glow effect
        const glowGeometry = new THREE.SphereGeometry(2.4, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending
        });
        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        
        // Create mesh
        const projectile = new THREE.Mesh(geometry, material);
        projectile.position.copy(position);
        projectile.add(glowMesh); // Add glow as child
        
        // Set velocity based on direction and speed
        projectile.velocity = direction.clone().multiplyScalar(this.projectileSpeed);
        
        // Mark projectile as player's to prevent self-damage
        projectile.userData.isPlayerProjectile = true;
        projectile.userData.sourceId = 'player';
        projectile.userData.damage = this.projectileDamage;
        
        // Add a dynamic trail
        this.addProjectileTrail(projectile, direction);
        
        // Add to scene
        this.scene.add(projectile);
        
        // Store creation time for lifespan tracking
        projectile.creationTime = performance.now();
        
        // Add to projectiles array
        this.projectiles.push(projectile);
        
        // IMPORTANT: Register the projectile in the ECS world
        // This is critical for collision detection
        if (this.world) {
            try {
                // Create projectile entity
                const projectileEntity = this.world.createEntity('projectile_' + Date.now() + '_' + Math.floor(Math.random() * 1000));
                
                // Add tags for identification
                projectileEntity.addTag('projectile');
                projectileEntity.addTag('playerProjectile');
                projectileEntity.addTag('particleProjectile');
                
                // Store damage information
                projectileEntity.userData = { 
                    mesh: projectile,
                    damage: this.projectileDamage,
                    source: 'player',
                    attackType: 'particle'
                };
                
                // Link mesh to entity for reference
                projectile.userData.entityId = projectileEntity.id;
                
                // Add required components directly with proper imports
                try {
                    // First option: Use component registry
                    if (this.world.componentRegistry) {
                        const TransformComponent = this.world.componentRegistry.getComponentClass('TransformComponent');
                        const RigidbodyComponent = this.world.componentRegistry.getComponentClass('RigidbodyComponent');
                        
                        // Add transform component
                        if (TransformComponent) {
                            const transform = new TransformComponent(position.clone());
                            transform.needsUpdate = true;
                            projectileEntity.addComponent(transform);
                            console.log(`Added TransformComponent to projectile ${projectileEntity.id}`);
                        } else {
                            console.error("TransformComponent class not available in registry");
                        }
                        
                        // Add rigidbody component
                        if (RigidbodyComponent) {
                            const rigidbody = new RigidbodyComponent(1); // 1 = mass
                            rigidbody.velocity = direction.clone().multiplyScalar(this.projectileSpeed);
                            rigidbody.collisionRadius = 5; // Increased collision radius
                            rigidbody.useGravity = false;
                            rigidbody.drag = 0;
                            projectileEntity.addComponent(rigidbody);
                            console.log(`Added RigidbodyComponent to projectile ${projectileEntity.id}`);
                        } else {
                            console.error("RigidbodyComponent class not available in registry");
                        }
                    } 
                    // Second option: Direct dynamic imports
                    else {
                        console.log("Attempting direct component imports for projectile");
                        
                        // Dynamic imports as fallback
                        Promise.all([
                            import('../components/transform.js'),
                            import('../components/physics/rigidbody.js')
                        ]).then(([transformModule, rigidbodyModule]) => {
                            // Add transform
                            const transform = new transformModule.TransformComponent(position.clone());
                            transform.needsUpdate = true;
                            projectileEntity.addComponent(transform);
                            
                            // Add rigidbody
                            const rigidbody = new rigidbodyModule.RigidbodyComponent(1);
                            rigidbody.velocity = direction.clone().multiplyScalar(this.projectileSpeed);
                            rigidbody.collisionRadius = 5;
                            rigidbody.useGravity = false;
                            rigidbody.drag = 0;
                            projectileEntity.addComponent(rigidbody);
                            
                            console.log(`Added components to projectile ${projectileEntity.id} via dynamic imports`);
                        }).catch(error => {
                            console.error("Failed to import component modules:", error);
                        });
                    }
                    
                    // Verify components were added
                    setTimeout(() => {
                        const hasTransform = projectileEntity.hasComponent('TransformComponent');
                        const hasRigidbody = projectileEntity.hasComponent('RigidbodyComponent');
                        console.log(`Projectile component verification: Transform=${hasTransform}, Rigidbody=${hasRigidbody}`);
                    }, 50);
                    
                } catch (componentError) {
                    console.error("Error adding components to projectile:", componentError);
                }
                
                // Custom update function for this entity to sync with mesh
                projectileEntity.update = (deltaTime) => {
                    // Update transform to match mesh position
                    const transform = projectileEntity.getComponent('TransformComponent');
                    if (transform && projectile) {
                        transform.position.copy(projectile.position);
                        transform.needsUpdate = true;
                    }
                    
                    // Update rigidbody to match mesh velocity
                    const rigidbody = projectileEntity.getComponent('RigidbodyComponent');
                    if (rigidbody && projectile && projectile.velocity) {
                        rigidbody.velocity.copy(projectile.velocity);
                    }
                };
                
                console.log(`Created projectile entity ${projectileEntity.id} with proper components`);
                
                // Signal projectile creation to combat system
                this.world.messageBus.publish('combat.projectileCreated', {
                    projectile: projectileEntity,
                    position: position.clone(),
                    direction: direction.clone(),
                    speed: this.projectileSpeed
                });
                
            } catch (error) {
                console.error("Error creating projectile entity:", error);
            }
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
            
            // Disable ECS systems
            if (this.world) {
                if (this.enemySystem) {
                    this.enemySystem.enabled = false;
                }
                if (this.combatSystem) {
                    this.combatSystem.enabled = false;
                }
            }
        } else {
            // Enable ECS systems
            if (this.world) {
                if (this.enemySystem) {
                    this.enemySystem.enabled = true;
                }
                if (this.combatSystem) {
                    this.combatSystem.enabled = true;
                }
            }
        }
        
        console.log(`Combat systems ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Add a dynamic particle trail to a projectile
     * @param {THREE.Mesh} projectile The projectile mesh
     * @param {THREE.Vector3} direction Direction of travel
     */
    addProjectileTrail(projectile, direction) {
        // Create a more dynamic and visually appealing trail
        
        // Create trail points
        const numPoints = 20; // Number of particles in the trail
        const trailLength = 6.0; // Total length of the trail
        
        // Create trail container
        const trailContainer = new THREE.Object3D();
        projectile.add(trailContainer);
        
        // Create individual trail particles
        const trailParticles = [];
        
        for (let i = 0; i < numPoints; i++) {
            // Calculate size and position
            const ratio = i / numPoints;
            const size = 0.5 * (1 - ratio); // Smaller as we get further from projectile
            
            // Create particle geometry
            const particleGeometry = new THREE.SphereGeometry(size, 8, 8);
            
            // Create particle material with glow
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ffff,
                transparent: true,
                opacity: 0.9 * (1 - ratio), // More transparent further from projectile
                blending: THREE.AdditiveBlending
            });
            
            // Create particle mesh
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Position particle along trail
            const offset = direction.clone().multiplyScalar(-ratio * trailLength);
            particle.position.copy(offset);
            
            // Store initial values for animation
            particle.userData.initialOffset = offset.clone();
            particle.userData.initialSize = size;
            particle.userData.initialOpacity = particleMaterial.opacity;
            
            // Add to trail
            trailContainer.add(particle);
            trailParticles.push(particle);
        }
        
        // Store trail reference
        projectile.userData.trail = trailContainer;
        projectile.userData.trailParticles = trailParticles;
        
        // Set up animation for trail particles
        const animateTrail = () => {
            if (!projectile.parent) return; // Stop if projectile is removed
            
            // Update each particle
            for (let i = 0; i < trailParticles.length; i++) {
                const particle = trailParticles[i];
                const ratio = i / numPoints;
                
                // Create wake effect by slightly moving particles
                const time = performance.now() * 0.001;
                const wakeFactor = Math.sin(time * 10 + i) * 0.03;
                
                // Calculate perpendicular vectors for movement
                const perpVector = new THREE.Vector3(-direction.z, 0, direction.x).normalize();
                perpVector.multiplyScalar(wakeFactor);
                
                // Set position with wake effect
                particle.position.copy(particle.userData.initialOffset).add(perpVector);
                
                // Pulse opacity for energy effect
                const opacityPulse = 0.2 * Math.sin(time * 5 + i * 0.5) + 0.8;
                particle.material.opacity = particle.userData.initialOpacity * opacityPulse;
            }
            
            // Continue animation
            requestAnimationFrame(animateTrail);
        };
        
        // Start trail animation
        animateTrail();
    }
    
    /**
     * Clear all active projectiles
     */
    clearAllProjectiles() {
        for (const projectile of this.projectiles) {
            // Clean up all resources for each projectile
            if (projectile.userData.trail) {
                // Remove all trail particles
                if (projectile.userData.trailParticles) {
                    for (const particle of projectile.userData.trailParticles) {
                        if (particle.material) {
                            particle.material.dispose();
                        }
                        if (particle.geometry) {
                            particle.geometry.dispose();
                        }
                        projectile.userData.trail.remove(particle);
                    }
                }
                projectile.remove(projectile.userData.trail);
            }
            
            // Dispose of projectile resources
            if (projectile.material) {
                projectile.material.dispose();
            }
            if (projectile.geometry) {
                projectile.geometry.dispose();
            }
            
            // Clean up any child objects (like glow effect)
            if (projectile.children.length > 0) {
                for (const child of projectile.children) {
                    if (child.material) {
                        child.material.dispose();
                    }
                    if (child.geometry) {
                        child.geometry.dispose();
                    }
                    projectile.remove(child);
                }
            }
            
            this.scene.remove(projectile);
        }
        this.projectiles = [];
    }
    
    // New method to visualize projectile trajectory
    createAimingTracer(startPosition, direction, distance = 3000) {
        // Create a line geometry for the tracer
        const lineGeometry = new THREE.BufferGeometry();
        const endPosition = startPosition.clone().add(direction.clone().multiplyScalar(distance));
        
        // Create points array to define the line
        const points = [
            startPosition.x, startPosition.y, startPosition.z,
            endPosition.x, endPosition.y, endPosition.z
        ];
        
        // Set the line vertices
        lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
        
        // Create a bright, pulsing material for the tracer
        const tracerMaterial = new THREE.LineBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        
        // Create the line
        const tracerLine = new THREE.Line(lineGeometry, tracerMaterial);
        
        // Add tracer to scene
        this.scene.add(tracerLine);
        
        // Animate tracer fade-out
        let opacity = 0.6;
        const fadeSpeed = 1.5; // Faster fade-out
        
        const animateTracer = () => {
            opacity -= fadeSpeed * 0.016; // Assume 60fps
            
            if (opacity <= 0) {
                // Remove tracer when fully faded
                this.scene.remove(tracerLine);
                return;
            }
            
            // Update opacity
            tracerMaterial.opacity = opacity;
            
            // Continue animation
            requestAnimationFrame(animateTracer);
        };
        
        // Start animation
        animateTracer();
        
        return tracerLine;
    }
    
    /**
     * Create a laser burst effect that travels forward with the projectile
     * @param {THREE.Vector3} position Position for the effect
     * @param {THREE.Vector3} direction Direction the effect should travel
     */
    createMuzzleFlash(position, direction) {
        // Create conical beam that travels forward
        const segments = 12;
        const coneLength = 15; // Slightly longer cone
        
        // Create a custom geometry for the energy cone
        const coneGeometry = new THREE.CylinderGeometry(0.5, 2, coneLength, 12, 1, true);
        // Rotate it to point forward (cylinder's default axis is Y)
        coneGeometry.rotateX(Math.PI / 2);
        // Shift it forward so the starting point is at position
        coneGeometry.translate(0, 0, coneLength / 2);
        
        // Create material with additive blending for energy-like effect
        const coneMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff, // Cyan color to match projectiles
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false,
            wireframe: false
        });
        
        // Create the cone mesh
        const cone = new THREE.Mesh(coneGeometry, coneMaterial);
        cone.position.copy(position);
        
        // Orient the cone along the firing direction
        cone.lookAt(position.clone().add(direction));
        
        // Add to scene
        this.scene.add(cone);
        
        // Create a small point light at the firing position
        const flashLight = new THREE.PointLight(0x00ffff, 2, 10);
        flashLight.position.copy(position);
        this.scene.add(flashLight);
        
        // Animate the laser burst - travel forward and fade out MUCH faster
        const startTime = performance.now();
        const burstDuration = 70; // Much shorter duration (was 200ms)
        const travelDistance = 300; // Much greater distance (was 30)
        
        // Store initial position to calculate travel
        const initialPosition = position.clone();
        
        const animateBurst = () => {
            const elapsed = performance.now() - startTime;
            const progress = elapsed / burstDuration;
            
            if (progress < 1) {
                // Move forward along direction vector at high speed
                const travelProgress = Math.min(progress * 2.5, 1); // Even faster travel speed
                const newPosition = initialPosition.clone().add(
                    direction.clone().multiplyScalar(travelDistance * travelProgress)
                );
                cone.position.copy(newPosition);
                
                // Fade out as it travels
                cone.material.opacity = 0.7 * (1 - progress);
                flashLight.intensity = 2 * (1 - progress * 3); // Light fades very quickly
                
                // Stretch the cone as it travels
                const stretchFactor = 1 + progress * 1.5; // More stretching for higher speed sensation
                cone.scale.set(1, 1, stretchFactor);
                
                // Continue animation
                requestAnimationFrame(animateBurst);
            } else {
                // Remove effects when animation is complete
                this.scene.remove(cone);
                this.scene.remove(flashLight);
                
                // Dispose resources
                cone.geometry.dispose();
                cone.material.dispose();
            }
        };
        
        // Start animation
        animateBurst();
    }
}