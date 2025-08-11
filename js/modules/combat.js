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
import { ProjectilePoolManager } from './pooling/ProjectilePoolManager.js'; // Import our new pooling system
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
        
        // 1. Initialize and pre-compile template materials
        this.initializeTemplateMaterials();
        
        // 2. Pre-create and cache geometries (and link materials to window.game)
        this.precreateGeometries();
        
        // 3. Initialize object pooling system with pre-warmed assets
        this.poolManager = new ProjectilePoolManager(scene, {
            projectileMaterial: this.projectileMaterial,
            projectileGlowMaterial: this.projectileGlowMaterial,
            trailParticleMaterial: this.trailParticleMaterial, // Will be red, but trail system is removed
            muzzleFlashMaterial: this.muzzleFlashMaterial,
            tracerLineMaterial: this.tracerLineMaterial, // For aiming line
            explosionParticleMaterial: this.explosionParticleMaterial, // For impacts
            
            projectileGeometry: window.game.projectileGeometry,
            projectileGlowGeometry: window.game.projectileGlowGeometry,
            muzzleFlashGeometry: window.game.muzzleFlashGeometry,
            trailParticleGeometries: window.game.trailParticleGeometries,
            tracerGeometry: window.game.tracerGeometry
        });
        console.log("Initialized ProjectilePoolManager for object pooling with pre-warmed assets");
        
        // Initialize ECS world for advanced combat systems
        // This needs to be initialized asynchronously, but constructors can't be async
        // So we'll just kick off the initialization and let it complete in the background
        this.initializeECSWorld();
        
        console.log("Combat systems initialized");
    }
    
    /**
     * Initialize template materials to prevent shader compilation stutter during first fire
     */
    initializeTemplateMaterials() {
        console.log("Initializing template materials for combat effects");
        
        // Template for projectile material (MeshStandardMaterial) - Red Laser Bolt
        this.projectileMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 10, // Vibrant laser
            metalness: 0.5,
            roughness: 0.5
        });
        
        // Template for projectile glow material (MeshBasicMaterial) - Red Glow
        this.projectileGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.5, // Softer glow
            blending: THREE.AdditiveBlending
        });
        
        // Template for trail particle material (MeshBasicMaterial) - Red (Though complex trail is removed)
        this.trailParticleMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });
        
        // Template for muzzle flash material (MeshBasicMaterial) - Red Muzzle Flash
        this.muzzleFlashMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.8, // Brighter flash
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false,
            wireframe: false
        });
        
        // Template for tracer line material (LineBasicMaterial) - Red Aiming Line
        this.tracerLineMaterial = new THREE.LineBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.8, // More visible aiming line
            blending: THREE.AdditiveBlending
        });
        
        // Template material for light-halo meshes (basic unlit glow)
        this.pointLightMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        // Template for explosion particles - Red/Orange Impact
        this.explosionParticleMaterial = new THREE.PointsMaterial({
            color: 0xff3300, // Red-orange for impact
            size: 15, // Slightly larger impact particles
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending
        });
        
        // Force material compilation by creating a small invisible mesh
        // This ensures shaders are compiled immediately rather than at first fire
        const dummyGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        const sphereGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const cylinderGeometry = new THREE.CylinderGeometry(0.1, 0.2, 1, 8, 1);
        const pointsPositions = new Float32Array(30); // 10 points x 3 coordinates
        for (let i = 0; i < 30; i++) {
            pointsPositions[i] = Math.random() - 0.5;
        }
        const pointsGeometry = new THREE.BufferGeometry();
        pointsGeometry.setAttribute('position', new THREE.BufferAttribute(pointsPositions, 3));
        
        // Create dummy objects using all materials that will be used in projectiles
        // IMPORTANT: Use the original material instances, not clones, for pre-compilation.
        const dummyProjectile = new THREE.Mesh(sphereGeometry, this.projectileMaterial);
        const dummyGlow = new THREE.Mesh(sphereGeometry, this.projectileGlowMaterial);
        const dummyTrail = new THREE.Mesh(sphereGeometry, this.trailParticleMaterial);
        const dummyFlash = new THREE.Mesh(cylinderGeometry, this.muzzleFlashMaterial);
        const dummyTracer = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0, 1)
            ]),
            this.tracerLineMaterial
        );
        const dummyExplosion = new THREE.Points(pointsGeometry, this.explosionParticleMaterial);
        
        // Create a dummy trail system with multiple particles
        const dummyTrailContainer = new THREE.Object3D();
        for (let i = 0; i < 5; i++) {
            const trailParticle = new THREE.Mesh(sphereGeometry, this.trailParticleMaterial.clone());
            trailParticle.position.z = -i * 0.2;
            dummyTrailContainer.add(trailParticle);
        }
        
        // Create a temporary scene for shader compilation
        const tempScene = new THREE.Scene();
        
        // Add all dummy objects to the temporary scene
        tempScene.add(dummyProjectile);
        tempScene.add(dummyGlow);
        tempScene.add(dummyTrail);
        tempScene.add(dummyFlash);
        tempScene.add(dummyTracer);
        tempScene.add(dummyTrailContainer);
        tempScene.add(dummyExplosion);
        
        // Add to main scene temporarily for visibility checking via renderer facade
        this._addToScene(dummyProjectile);
        this._addToScene(dummyGlow);
        this._addToScene(dummyTrail);
        this._addToScene(dummyFlash);
        this._addToScene(dummyTracer);
        this._addToScene(dummyTrailContainer);
        this._addToScene(dummyExplosion);
        
        // Force shader compilation using renderer.compile if available
        if (window.renderer) {
            console.log("Forcing shader compilation with renderer.compile()");
            window.renderer.compile(tempScene, this.scene.camera || { isCamera: true, matrixWorldInverse: new THREE.Matrix4() });
            window.renderer.compile(this.scene, this.scene.camera || { isCamera: true, matrixWorldInverse: new THREE.Matrix4() });
        } else if (window.game && window.game.renderer && window.game.renderer.renderer) {
            console.log("Forcing shader compilation with game.renderer.renderer.compile()");
            window.game.renderer.renderer.compile(tempScene, this.scene.camera || window.game.camera || { isCamera: true, matrixWorldInverse: new THREE.Matrix4() });
            window.game.renderer.renderer.compile(this.scene, this.scene.camera || window.game.camera || { isCamera: true, matrixWorldInverse: new THREE.Matrix4() });
        } else {
            console.warn("No renderer available for shader pre-compilation");
        }
        
        // Keep dummy objects in scene longer to ensure compilation completes
        setTimeout(() => {
            // Remove from scene after shader compilation is complete via renderer facade
            this._removeFromScene(dummyProjectile);
            this._removeFromScene(dummyGlow);
            this._removeFromScene(dummyTrail);
            this._removeFromScene(dummyFlash);
            this._removeFromScene(dummyTracer);
            this._removeFromScene(dummyTrailContainer);
            this._removeFromScene(dummyExplosion);
            
            // Clean up temporary objects
            dummyGeometry.dispose();
            sphereGeometry.dispose();
            cylinderGeometry.dispose();
            pointsGeometry.dispose();
            
            // Clean up trail particles
            dummyTrailContainer.children.forEach(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose(); // Material here is a clone, original is on this.trailParticleMaterial
            });
            
            // Store precomputed geometries in window.game for reuse
            // This part is removed as precreateGeometries() will handle setting window.game assets
            // if (window.game) {
            //     window.game.projectileGeometry = new THREE.SphereGeometry(1.8, 12, 12);
            //     window.game.projectileGlowGeometry = new THREE.SphereGeometry(2.4, 16, 16);
                
            //     // Precompute trail particle geometries
            //     window.game.trailParticleGeometries = [];
            //     const numPoints = 20; // Same as in addProjectileTrail
            //     for (let i = 0; i < numPoints; i++) {
            //         const ratio = i / numPoints;
            //         const size = 0.5 * (1 - ratio);
            //         window.game.trailParticleGeometries[i] = new THREE.SphereGeometry(size, 8, 8);
            //     }
                
            //     console.log("Stored precomputed geometries in window.game");
            // }
            
            console.log("Template materials initialized and dummy objects removed");
        }, 500); // Increased timeout to 500ms to ensure shader compilation completes
    }
    
    /**
     * Pre-create geometries that will be reused across projectiles and effects
     * This prevents geometry creation during combat which can cause stutters
     */
    precreateGeometries() {
        console.log("Pre-creating geometries for combat effects");
        
        // Create geometries and store them on window.game for global access
        if (!window.game) window.game = {};
        
        // Projectile geometries - Changed to a thin cylinder for laser bolt
        window.game.projectileGeometry = new THREE.CylinderGeometry(0.15, 0.15, 10, 8); // Thin, 10 units long cylinder
        window.game.projectileGlowGeometry = new THREE.SphereGeometry(0.8, 12, 12); // Glow radius around the bolt
        
        // Pre-create standard muzzle flash geometry
        window.game.muzzleFlashGeometry = new THREE.CylinderGeometry(0.5, 2, 15, 12, 1, true);
        window.game.muzzleFlashGeometry.rotateX(Math.PI / 2);
        window.game.muzzleFlashGeometry.translate(0, 0, 15 / 2);
        
        // Pre-create trail particle geometries with different sizes
        window.game.trailParticleGeometries = [];
        const numPoints = 20; // Same as in addProjectileTrail
        for (let i = 0; i < numPoints; i++) {
            const ratio = i / numPoints;
            const size = 0.5 * (1 - ratio); // These might be unused or repurposed for simple impact sparks
            window.game.trailParticleGeometries[i] = new THREE.SphereGeometry(size, 8, 8);
        }
        
        // Pre-create line geometry for tracers
        window.game.tracerGeometry = new THREE.BufferGeometry();
        const points = [0, 0, 0, 0, 0, 1]; // Will be updated at runtime
        window.game.tracerGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
        
        // Store references to template materials (which should now be pre-warmed)
        // These materials are created and warmed in initializeTemplateMaterials()
        window.game.projectileMaterial = this.projectileMaterial;
        window.game.projectileGlowMaterial = this.projectileGlowMaterial;
        window.game.trailParticleMaterial = this.trailParticleMaterial; // Will be red
        window.game.muzzleFlashMaterial = this.muzzleFlashMaterial;
        window.game.tracerLineMaterial = this.tracerLineMaterial;
        window.game.explosionParticleMaterial = this.explosionParticleMaterial; // Added for consistency
        
        console.log("Combat geometries pre-created successfully");
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

            // Create optimized projectile store
            if (!this.world.optimizedProjectiles) {
                try {
                    const { OptimizedProjectileStore } = await import('../core/optimized/OptimizedProjectileStore.js');
                    this.world.optimizedProjectiles = new OptimizedProjectileStore(4096);
                    console.log('[COMBAT] OptimizedProjectileStore created');
                } catch (e) {
                    console.warn('[COMBAT] OptimizedProjectileStore unavailable:', e);
                }
            }
            
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
            // Use the already imported TrailSystem class instead of dynamic import
            this.trailSystem = new TrailSystem(this.world);
            this.world.registerSystem(this.trailSystem);
            
            // Register deployable laser systems
            this.deployableLaserSystem = await this.importAndRegisterSystem('../systems/weapons/deployableLaserSystem.js', 'DeployableLaserSystem');
            this.world.registerSystem(this.deployableLaserSystem);

            this.deploymentSystem = await this.importAndRegisterSystem('../systems/deployables/deploymentSystem.js', 'DeploymentSystem');
            this.world.registerSystem(this.deploymentSystem);
            
            // Add trail system to window.game for global access if game object exists
            if (window.game) {
                window.game.trailSystem = this.trailSystem;
                console.log("[COMBAT] Registered trail system with window.game for global access");
            }
            
            // Register the instanced renderer first
            try {
                const { InstancedRenderer } = await import('../systems/rendering/InstancedRenderer.js');
                this.instancedRenderer = new InstancedRenderer(this.world, this.scene);
                this.world.registerSystem(this.instancedRenderer);
                console.log('[COMBAT] InstancedRenderer registered');
            } catch (e) {
                console.warn('[COMBAT] InstancedRenderer not available:', e);
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

            // Subscribe to transform updates to refresh spatial hash
            if (this.world && this.world.messageBus) {
                this.world.messageBus.subscribe('transform.updated', (msg) => {
                    const entity = msg.data && msg.data.entity;
                    if (entity && this.world.onEntityTransformUpdated) {
                        this.world.onEntityTransformUpdated(entity);
                    }
                });
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
                this.enemySystem.lifecycle.validateEnemyReferences(this.enemySystem.enemies);
                
                // IMPORTANT: Ensure any lingering enemies over the limit are cleaned up
                if (this.enemySystem.enemies.size > this.enemySystem.maxEnemies) {
                    console.warn(`[COMBAT] Found ${this.enemySystem.enemies.size} enemies exceeding limit of ${this.enemySystem.maxEnemies} during setup`);
                    this.enemySystem.enforceEnemyLimit();
                }
                
                // Force enemy system to generate spawn points based on player position
                this.enemySystem.spawner.generateSpawnPoints();
                
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
        
        // Update all active projectiles (if any from old system)
        this.updateProjectiles(deltaTime);
        
        // Update active tracer beams
        this.updateTracers(deltaTime);
        
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
        try {
            // Get explosion from pool
            const explosion = this.poolManager.getExplosion(position, duration);
            
            // Play explosion sound
            if (window.game && window.game.audio) {
                window.game.audio.playSound('boink');
            }
            
            console.log("Created explosion effect at:", position.x.toFixed(0), position.y.toFixed(0), position.z.toFixed(0));
            
            return explosion;
        } catch (error) {
            console.error("Error creating explosion effect:", error);
            return null;
        }
    }
    
    /**
     * Update active tracer beams - fade them out from start to end
     * @param {number} deltaTime Time since last update
     */
    updateTracers(deltaTime) {
        if (!this.activeTracers || this.activeTracers.length === 0) return;
        
        const currentTime = performance.now();
        const tracersToRemove = [];
        
        for (let i = this.activeTracers.length - 1; i >= 0; i--) {
            const beamGroup = this.activeTracers[i];
            const userData = beamGroup.userData;
            
            if (!userData) continue;
            
            const elapsed = currentTime - userData.startTime;
            const fadeProgress = Math.min(elapsed / userData.fadeTime, 1.0);
            
            if (fadeProgress >= 1.0) {
                // Remove entire beam group
                    this._removeFromScene(beamGroup);
                tracersToRemove.push(i);
            } else {
                // Progressive dissolve from start to end
                // The beam shortens from the start point toward the end point
                const dissolveDistance = userData.beamLength * fadeProgress;
                
                // Calculate new start position (moves toward end as it dissolves)
                const newStartOffset = userData.direction.clone().multiplyScalar(dissolveDistance);
                const newStartPos = userData.startPos.clone().add(newStartOffset);
                
                // Calculate new beam length
                const newLength = userData.beamLength * (1.0 - fadeProgress);
                
                if (newLength > 0.1) {
                    // Update beam geometry to be shorter
                    // We need to recreate the cylinders with new height
                    userData.coreMesh.geometry.dispose();
                    userData.innerGlowMesh.geometry.dispose();
                    userData.outerGlowMesh.geometry.dispose();
                    
                    userData.coreMesh.geometry = new THREE.CylinderGeometry(1.5, 1.5, newLength, 12);
                    userData.innerGlowMesh.geometry = new THREE.CylinderGeometry(3, 3, newLength, 8);
                    userData.outerGlowMesh.geometry = new THREE.CylinderGeometry(5, 5, newLength, 6);
                    
                    // Update position to new midpoint
                    const newMidpoint = new THREE.Vector3().addVectors(newStartPos, userData.endPos).multiplyScalar(0.5);
                    beamGroup.position.copy(newMidpoint);
                    
                    // Also fade opacity slightly as it dissolves
                    const opacityFactor = Math.pow(1.0 - fadeProgress, 0.3); // Slower opacity fade
                    userData.coreMesh.material.opacity = userData.initialCoreOpacity * opacityFactor;
                    userData.innerGlowMesh.material.opacity = userData.initialInnerOpacity * opacityFactor;
                    userData.outerGlowMesh.material.opacity = userData.initialOuterOpacity * opacityFactor;
                }
            }
        }
        
        // Remove completed tracers from the array
        for (const index of tracersToRemove) {
            this.activeTracers.splice(index, 1);
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
        
        console.log("*** COMBAT MODULE: Firing pulse cannon with railgun effect ***");
        
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
        
        // Maximum range for weapon
        const maxRange = 5000;
        
        // Log the new direction approach
        console.log(`Projectile direction (using camera ray): ${direction.x.toFixed(2)}, ${direction.y.toFixed(2)}, ${direction.z.toFixed(2)}`);
        
        // Calculate right vector for offset
        const right = new THREE.Vector3().crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize();
        
        // Position offsets for dual projectiles
        const leftOffset = new THREE.Vector3().copy(right).multiplyScalar(-1.5);
        const rightOffset = new THREE.Vector3().copy(right).multiplyScalar(1.5);
        
        // Add larger forward offset so projectiles spawn further in front of ship (increased from 7 to 15)
        const forwardOffset = new THREE.Vector3().copy(direction).multiplyScalar(15);
        
        // Calculate weapon port positions (where the beams originate)
        // Start beams 25 units in front of ship to avoid self-intersection when moving forward
        const weaponForwardOffset = new THREE.Vector3().copy(direction).multiplyScalar(25);
        
        const leftWeaponPosition = new THREE.Vector3().copy(shipPosition)
            .add(leftOffset)
            .add(weaponForwardOffset);
            
        const rightWeaponPosition = new THREE.Vector3().copy(shipPosition)
            .add(rightOffset)
            .add(weaponForwardOffset);
        
        // REMOVED: Old projectile creation - replaced with instant tracers below
        // const leftProjectile = this.createProjectile(leftPosition, direction);
        // const rightProjectile = this.createProjectile(rightPosition, direction);
        
        // Create flash effects at the weapon port positions
        // REMOVED: No longer using muzzle flashes for Star Wars laser effect
        // this.createMuzzleFlash(leftWeaponPosition, direction);
        // this.createMuzzleFlash(rightWeaponPosition, direction);
        
        // Play projectile sound
        if (window.game && window.game.audio) {
            console.log("Playing ASMR projectile sound for particle cannon");
            window.game.audio.playSound('projectile');
        }
        
        // Variables to track hits for tracer visualization
        let leftHitPoint = null;
        let rightHitPoint = null;
        let leftHitEnemy = false;
        let rightHitEnemy = false;
        
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
                    // Get enemy position for debugging
                    let enemyPosition = null;
                    const enemyTransform = enemy.getComponent('TransformComponent');
                    if (enemyTransform) {
                        enemyPosition = enemyTransform.position;
                    } else {
                        console.log("Enemy missing transform component");
                        continue;
                    }
                    
                    // Get enemy mesh component for collision detection
                    const enemyMeshComponent = enemy.getComponent('MeshComponent');
                    if (!enemyMeshComponent || !enemyMeshComponent.mesh) {
                        console.log(`Enemy ${enemy.id} has no mesh component or mesh`);
                        continue;
                    }
                    
                    // Debug mesh properties
                    console.log(`Testing ray intersection with enemy ${enemy.id}:`);
                    console.log(`- Position: (${enemyPosition.x.toFixed(1)}, ${enemyPosition.y.toFixed(1)}, ${enemyPosition.z.toFixed(1)})`);
                    console.log(`- Mesh visible: ${enemyMeshComponent.mesh.visible}`);
                    console.log(`- Mesh children: ${enemyMeshComponent.mesh.children ? enemyMeshComponent.mesh.children.length : 0}`);
                    
                    // Calculate distance from ship to enemy (for debugging)
                    const distanceToEnemy = shipPosition.distanceTo(enemyPosition);
                    console.log(`- Distance to enemy: ${distanceToEnemy.toFixed(1)}`);
                    
                    // Skip if mesh is not visible
                    if (!enemyMeshComponent.mesh.visible) {
                        console.log(`Mesh for enemy ${enemy.id} is not visible, skipping`);
                        continue;
                    }
                    
                    // Perform the precise mesh intersection test
                    const intersections = raycaster.intersectObject(enemyMeshComponent.mesh, true);
                    
                    if (intersections.length > 0) {
                        // We have a mesh intersection!
                        const intersection = intersections[0]; // closest intersection
                        
                        // Debug the hit
                        console.log(`*** MESH HIT on enemy ${enemy.id}! ***`);
                        console.log(`- Hit distance: ${intersection.distance.toFixed(2)}`);
                        console.log(`- Hit point: (${intersection.point.x.toFixed(1)}, ${intersection.point.y.toFixed(1)}, ${intersection.point.z.toFixed(1)})`);
                        
                        if (intersection.object) {
                            console.log(`- Hit specific object: ${intersection.object.name || 'unnamed'}`);
                        }
                        
                        if (intersection.face) {
                            console.log(`- Hit face normal: (${intersection.face.normal.x.toFixed(2)}, ${intersection.face.normal.y.toFixed(2)}, ${intersection.face.normal.z.toFixed(2)})`);
                        }
                        
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
                    } else {
                        // Debug the miss
                        console.log(`Ray missed enemy ${enemy.id} - no mesh intersection`);
                        
                        // Check if any debug visuals are needed
                        if (window.debugMode) {
                            // Debug visualization - create a temporary red line showing the ray
                            const rayLine = new THREE.Line(
                                new THREE.BufferGeometry().setFromPoints([
                                    raycaster.ray.origin.clone(),
                                    raycaster.ray.origin.clone().add(raycaster.ray.direction.clone().multiplyScalar(1000))
                                ]),
                                new THREE.LineBasicMaterial({ color: 0xff0000 })
                            );
            this._addToScene(rayLine);
            setTimeout(() => this._removeFromScene(rayLine), 1000); // Remove after 1 second
                        }
                    }
                } catch (error) {
                    console.error("Error checking enemy collision:", error);
                }
            }
        } else {
            console.log("No world or entityManager available for enemy check");
        }
        
        // Create instant tracer beams from weapon ports
        // Left cannon tracer
        const leftEndPoint = leftHitPoint || leftWeaponPosition.clone().add(direction.clone().multiplyScalar(maxRange));
        this.createInstantTracer(leftWeaponPosition, leftEndPoint, leftHitEnemy, 0.4);
        
        // Right cannon tracer
        const rightEndPoint = rightHitPoint || rightWeaponPosition.clone().add(direction.clone().multiplyScalar(maxRange));
        this.createInstantTracer(rightWeaponPosition, rightEndPoint, rightHitEnemy, 0.4);
        
        // Create impact effects if we hit something
        if (leftHitPoint && leftHitEnemy) {
            this.createExplosionEffect(leftHitPoint, 0.5);
        }
        if (rightHitPoint && rightHitEnemy && rightHitPoint.distanceTo(leftHitPoint || rightHitPoint) > 10) {
            // Only create second explosion if hit points are far enough apart
            this.createExplosionEffect(rightHitPoint, 0.5);
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
        this.addProjectileTrail(projectile, direction); // REINSTATED for laser trails
        
        // Add to scene if not already there via renderer facade
        if (!projectile.parent) {
            this._addToScene(projectile);
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
            
            // Disable ECS systems
            if (this.world) {
                if (this.enemySystem && typeof this.enemySystem.setEnabled === 'function') { // Check if setEnabled exists
                    this.enemySystem.setEnabled(false);
                } else if (this.enemySystem) {
                    this.enemySystem.enabled = false;
                }
                if (this.combatSystem && typeof this.combatSystem.setEnabled === 'function') { // Check if setEnabled exists
                    this.combatSystem.setEnabled(false);
                } else if (this.combatSystem) {
                    this.combatSystem.enabled = false;
                }
            }
        } else {
            // Enable ECS systems
            if (this.world) {
                if (this.enemySystem && typeof this.enemySystem.setEnabled === 'function') { // Check if setEnabled exists
                    this.enemySystem.setEnabled(true);
                } else if (this.enemySystem) {
                    this.enemySystem.enabled = true;
                }
                if (this.combatSystem && typeof this.combatSystem.setEnabled === 'function') { // Check if setEnabled exists
                    this.combatSystem.setEnabled(true);
                } else if (this.combatSystem) {
                    this.combatSystem.enabled = true;
                }
            }
        }
        
        console.log(`Combat systems ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Create an instant plasma beam with hot glow
     * @param {THREE.Vector3} startPos Starting position of the beam
     * @param {THREE.Vector3} endPos End position of the beam (hit point or max range)
     * @param {boolean} isHit Whether this beam hit a target
     * @param {number} fadeTime Time in seconds for the beam to fade
     */
    createInstantTracer(startPos, endPos, isHit = false, fadeTime = 0.5) {
        const distance = startPos.distanceTo(endPos);
        
        // Create multiple cylinders for a layered plasma effect
        const beamGroup = new THREE.Group();
        
        // Core beam - bright white/yellow hot plasma
        const coreGeometry = new THREE.CylinderGeometry(1.5, 1.5, distance, 12);
        const coreMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffaa, // Hot yellow-white
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending
        });
        const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
        
        // Inner glow - orange-white plasma
        const innerGlowGeometry = new THREE.CylinderGeometry(3, 3, distance, 8);
        const innerGlowMaterial = new THREE.MeshBasicMaterial({
            color: isHit ? 0xffaa00 : 0xff8800, // Orange for hits, red-orange for misses
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        const innerGlowMesh = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
        
        // Outer glow - cooler blue-cyan edge
        const outerGlowGeometry = new THREE.CylinderGeometry(5, 5, distance, 6);
        const outerGlowMaterial = new THREE.MeshBasicMaterial({
            color: isHit ? 0x00ffff : 0x0088ff, // Cyan for hits, blue for misses
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });
        const outerGlowMesh = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
        
        // Add all layers to the group
        beamGroup.add(coreMesh);
        beamGroup.add(innerGlowMesh);
        beamGroup.add(outerGlowMesh);
        
        // Position and orient the entire beam group
        const midpoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
        beamGroup.position.copy(midpoint);
        
        // Orient the cylinders along the beam direction
        const direction = new THREE.Vector3().subVectors(endPos, startPos).normalize();
        const quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
        beamGroup.quaternion.copy(quaternion);
        
        this._addToScene(beamGroup);
        
        // Store beam data for progressive fade animation
        beamGroup.userData = {
            startTime: performance.now(),
            fadeTime: fadeTime * 1000,
            beamLength: distance,
            startPos: startPos.clone(),
            endPos: endPos.clone(),
            direction: direction.clone(),
            coreMesh: coreMesh,
            innerGlowMesh: innerGlowMesh,
            outerGlowMesh: outerGlowMesh,
            initialCoreOpacity: 1.0,
            initialInnerOpacity: 0.6,
            initialOuterOpacity: 0.3,
            isDissolving: false
        };
        
        // Add to active tracers list for update loop
        if (!this.activeTracers) {
            this.activeTracers = [];
        }
        this.activeTracers.push(beamGroup);
        
        return beamGroup;
    }
    
    /**
     * Add a dynamic particle trail to a projectile (Simplified for Lasers)
     * @param {THREE.Mesh} projectile The projectile mesh
     * @param {THREE.Vector3} direction Direction of travel
     */
    addProjectileTrail(projectile, direction) {
        // Parameters for a subtle, short trail
        const numPoints = 4; // Number of particles in the trail
        const trailLength = 4.0; // Total length of the trail (shorter than laser bolt length for subtlety)
        const particleLifetime = 150; // milliseconds

        if (!this.poolManager) {
            console.warn("PoolManager not available for projectile trail.");
            return;
        }

        const trailContainer = this.poolManager.getTrailContainer();
        if (!trailContainer) {
            console.warn("Failed to get trail container from pool.");
            return;
        }
        projectile.add(trailContainer);

        const trailParticles = [];
        trailContainer.userData.particles = trailParticles; // Store for release by PoolManager if needed
        trailContainer.userData.isTrailActive = true; // Flag for animation loop

        for (let i = 0; i < numPoints; i++) {
            const ratio = i / (numPoints -1); // Distribute particles along the trail length
            const particle = this.poolManager.getTrailParticle(i % window.game.trailParticleGeometries.length); // Cycle through available geometries
            
            if (!particle) {
                console.warn(`Failed to get trail particle ${i} from pool.`);
                continue;
            }

            const offset = direction.clone().multiplyScalar(-ratio * trailLength - 2.0); // Start trail slightly behind the projectile tip
            particle.position.copy(offset);
            
            particle.userData.creationTime = performance.now();
            particle.userData.initialOpacity = particle.material.opacity; // Should be from pre-warmed red material
            particle.userData.initialScale = particle.scale.x; // Assuming uniform scale
            
            trailContainer.add(particle);
            trailParticles.push(particle);
        }
        
        projectile.userData.trail = trailContainer; // For cleanup by PoolManager

        const animateTrail = () => {
            if (!projectile.parent || !trailContainer.userData.isTrailActive) {
                // Projectile removed or trail explicitly deactivated, stop animation and ensure cleanup
                trailContainer.userData.isTrailActive = false;
                // Particles will be cleaned up by releaseProjectile -> releaseTrail if not already done
                return;
            }

            for (let i = trailParticles.length - 1; i >= 0; i--) {
                const particle = trailParticles[i];
                const elapsed = performance.now() - particle.userData.creationTime;
                const progress = Math.min(elapsed / particleLifetime, 1.0);

                if (progress >= 1.0) {
                    this.poolManager.releaseTrailParticle(particle);
                    trailParticles.splice(i, 1);
                    if (particle.parent) particle.parent.remove(particle); // Ensure removal from container
                } else {
                    particle.material.opacity = particle.userData.initialOpacity * (1 - progress);
                    const currentScale = particle.userData.initialScale * (1 - progress);
                    particle.scale.set(currentScale, currentScale, currentScale);
                }
            }

            if (trailParticles.length === 0) {
                trailContainer.userData.isTrailActive = false; // All particles expired
                // The container itself will be released when the projectile is released.
                return;
            }
            
            requestAnimationFrame(animateTrail);
        };
        
        animateTrail();
    }
    
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
    
    // New method to visualize projectile trajectory
    createAimingTracer(startPosition, direction, distance = 3000) {
        // Get a tracer from the pool
        const tracer = this.poolManager.getTracer();
        
        // Calculate end position
        const endPosition = startPosition.clone().add(direction.clone().multiplyScalar(distance));
        
        // Update the positions in the geometry
        const positions = tracer.geometry.attributes.position.array;
        positions[0] = startPosition.x;
        positions[1] = startPosition.y;
        positions[2] = startPosition.z;
        positions[3] = endPosition.x;
        positions[4] = endPosition.y;
        positions[5] = endPosition.z;
        
        // Mark the position attribute as needing update
        tracer.geometry.attributes.position.needsUpdate = true;
        
        // The pool manager will automatically handle animation and cleanup
        
        return tracer;
    }
    
    /**
     * Create a laser burst effect that travels forward with the projectile
     * @param {THREE.Vector3} position Position for the effect
     * @param {THREE.Vector3} direction Direction the effect should travel
     */
    createMuzzleFlash(position, direction) {
        // Get a muzzle flash from the pool
        const muzzleFlash = this.poolManager.getMuzzleFlash();
        
        // Position and orient the flash
        muzzleFlash.position.copy(position);
        // Orient the flash to point away from the ship, along the direction of fire
        const lookAtPosition = position.clone().add(direction.clone().normalize().multiplyScalar(10)); // Look 10 units along direction
        muzzleFlash.lookAt(lookAtPosition);
        
        // Store reference to initial position and direction for animation
        muzzleFlash.userData.initialPosition = position.clone();
        muzzleFlash.userData.direction = direction.clone();
        
        // Set up the flash light
        const flashLight = muzzleFlash.userData.flashLight;
        if (flashLight) {
            flashLight.position.copy(position);
            flashLight.intensity = 200;
        }
        
        // The pool manager will automatically handle animation and cleanup via its update method
        // which checks the progress and releases back to the pool when complete
        
        return muzzleFlash;
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
        
        // Mark as disposed
        this.disposed = true;
        
        console.log("Combat module resources disposed");
    }

    // --- Renderer facade helpers to centralize scene mutations ---
    _addToScene(object) {
        const renderer = window.game && window.game.renderer ? window.game.renderer : null;
        if (renderer && typeof renderer._withGuard === 'function') {
            renderer._withGuard(() => renderer.add(object));
        } else if (this.scene && typeof this.scene.add === 'function') {
            // Fallback for safety; may warn in dev via guard wrapper
            this.scene.add(object);
        }
    }

    _removeFromScene(object) {
        const renderer = window.game && window.game.renderer ? window.game.renderer : null;
        if (renderer && typeof renderer._withGuard === 'function') {
            renderer._withGuard(() => this.scene.remove(object));
        } else if (this.scene && typeof this.scene.remove === 'function') {
            // Fallback for safety
            this.scene.remove(object);
        }
    }
    
    /**
     * Import and register a system
     * @param {string} path The path to the system module
     * @param {string} className The name of the system class
     * @returns {Object} The system instance
     */
    async importAndRegisterSystem(path, className) {
        try {
            // Add vite-ignore to allow dynamic imports
            // @ts-ignore
            const module = await import(/* @vite-ignore */ path);
            if (!module[className]) {
                console.error(`[COMBAT] System class ${className} not found in module ${path}`);
                return null;
            }
            
            const SystemClass = module[className];
            // Pass world and scene to systems that might need them for rendering or context
            let system;
            if (className === 'TrailSystem' || className === 'VisualEffectsSystem' || className === 'RenderSystem') {
                 // These systems might specifically need the scene
                system = new SystemClass(this.world, this.scene);
            } else {
                system = new SystemClass(this.world);
            }
            return system;
        } catch (error) {
            console.error(`[COMBAT] Error importing system ${className} from ${path}:`, error);
            return null;
        }
    }
}

// Helper to remove the addProjectileTrail method entirely if it exists as a standalone function in an unexpected way
// This is unlikely given typical class structure but added for robustness
// if (typeof Combat !== 'undefined' && Combat.prototype.addProjectileTrail) {
// delete Combat.prototype.addProjectileTrail;
//     console.log("Dynamically removed addProjectileTrail from Combat prototype if it existed.");
// }