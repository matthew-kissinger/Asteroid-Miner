/**
 * Enemy Spawner - Handles the generation of spawn points and enemy spawning
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EnemyAIComponent } from '../../components/combat/enemyAI.js';
import { TransformComponent } from '../../components/transform.js';
import { HealthComponent } from '../../components/combat/healthComponent.js';
import { RigidbodyComponent } from '../../components/physics/rigidbody.js';
import { MeshComponent } from '../../components/rendering/mesh.js';
import { TrailComponent } from '../../components/rendering/trail.js';

export class EnemySpawner {
    constructor(world) {
        this.world = world;
        this.spawnPoints = [];
        this.spawnTimer = 0;
        this.spawnInterval = 3; // Seconds between spawns
        this.lastSpawnTime = Date.now();
        this.modelCache = {};
        
        // Base enemy config (will be modified by difficulty scaling)
        this.baseEnemyConfig = {
            health: 20,
            damage: 15,
            speed: 700,
            spiralAmplitude: 150,
            spiralFrequency: 2.0
        };
        
        // Current enemy config (copy of base config initially)
        this.enemyConfig = { ...this.baseEnemyConfig };
        
        // Pre-load models
        this.loadModels();
        
        // Generate initial spawn points
        this.generateSpawnPoints();
    }
    
    /**
     * Pre-load all enemy models
     */
    loadModels() {
        const loader = new GLTFLoader();
        
        // Try multiple paths for the GLB file
        const modelPaths = [
            '/assets/enemy.glb',
            './assets/enemy.glb',
            'assets/enemy.glb',
            '/Asteroid-Miner/assets/enemy.glb'  // GitHub Pages path
        ];
        
        let loadAttempts = 0;
        const tryLoadModel = (index) => {
            if (index >= modelPaths.length) {
                console.warn('Could not load enemy model from any path, will use fallback meshes');
                // Don't set modelCache.enemyDrone so fallback will be used
                return;
            }
            
            const path = modelPaths[index];
            console.log(`Attempting to load enemy model from: ${path}`);
            
            loader.load(
                path,
                (gltf) => {
                    console.log(`Enemy model loaded successfully from ${path}`);
                    this.modelCache.enemyDrone = gltf.scene;
                    
                    // Apply any global transformations or material adjustments
                    this.modelCache.enemyDrone.traverse((child) => {
                        if (child.isMesh) {
                            // Make materials glow with emissive
                            if (child.material) {
                                child.material.emissive = new THREE.Color(0x0088ff);
                                child.material.emissiveIntensity = 2.0;
                            }
                        }
                    });
                },
                (xhr) => {
                    // Progress callback
                },
                (error) => {
                    console.log(`Failed to load from ${path}, trying next...`);
                    tryLoadModel(index + 1);
                }
            );
        };
        
        tryLoadModel(0);
    }
    
    /**
     * Generate spawn points for enemies based on player position
     */
    generateSpawnPoints() {
        // Clear existing spawn points
        this.spawnPoints = [];
        
        // Try multiple methods to find the player
        let players = [];
        let playerPosition = null;
        
        // Method 1: Try using entityManager
        try {
            if (this.world.entityManager && this.world.entityManager.getEntitiesByTag) {
                players = this.world.entityManager.getEntitiesByTag('player');
                if (players.length > 0) {
                    const transform = players[0].getComponent(TransformComponent);
                    if (transform && transform.position) {
                        playerPosition = transform.position;
                    }
                }
            }
        } catch (e) {
            console.log("Could not get player via entityManager:", e.message);
        }
        
        // Method 2: Try direct world method
        if (!playerPosition) {
            try {
                if (this.world.getEntitiesByTag) {
                    players = this.world.getEntitiesByTag('player');
                    if (players.length > 0) {
                        const transform = players[0].getComponent(TransformComponent);
                        if (transform && transform.position) {
                            playerPosition = transform.position;
                        }
                    }
                }
            } catch (e) {
                console.log("Could not get player via world.getEntitiesByTag:", e.message);
            }
        }
        
        // Method 3: Check window.game for spaceship position
        if (!playerPosition && window.game) {
            try {
                if (window.game.spaceship && window.game.spaceship.mesh && window.game.spaceship.mesh.position) {
                    playerPosition = window.game.spaceship.mesh.position;
                    console.log("Using spaceship mesh position for spawn points");
                }
            } catch (e) {
                console.log("Could not get player via window.game.spaceship:", e.message);
            }
        }
        
        // If still no player position found, use default spawn points
        if (!playerPosition) {
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
            
            console.log(`No player position found - generated ${this.spawnPoints.length} default spawn points around origin`);
            return;
        }
        
        // Generate spawn points in a sphere around player
        const center = playerPosition.clone ? playerPosition.clone() : new THREE.Vector3(playerPosition.x, playerPosition.y, playerPosition.z);
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
     * Check the spawn timer and spawn enemies if needed
     * @param {number} deltaTime The time since the last update
     * @param {Set} enemies Reference to the active enemies set for tracking
     * @param {number} maxEnemies Maximum number of enemies allowed
     * @param {function} spawnFunction The function to call to spawn an enemy
     * @returns {boolean} Whether an enemy was spawned
     */
    update(deltaTime, enemies, maxEnemies, spawnFunction) {
        // Update spawn timer
        this.spawnTimer += deltaTime;
        
        // Get difficulty-adjusted spawn interval if available
        let currentSpawnInterval = this.spawnInterval;
        
        // Apply difficulty scaling if available through parent system or game object
        this.updateDifficultyParameters();
        
        // Check if we should spawn new enemies
        if (this.spawnTimer >= currentSpawnInterval && enemies.size < maxEnemies) {
            // Get a spawn point
            const spawnPoint = this.getRandomSpawnPoint();
            if (!spawnPoint) {
                console.error("Failed to get spawn point! Generating new spawn points.");
                this.generateSpawnPoints();
                return false;
            }
            
            // Call the provided spawn function
            const result = spawnFunction(spawnPoint);
            
            // Reset spawn timer if successful
            if (result) {
                this.spawnTimer = 0;
                this.lastSpawnTime = Date.now();
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Update enemy parameters based on difficulty scaling
     */
    updateDifficultyParameters() {
        // Try to get difficulty parameters from parent or game
        
        // Check if there's a global difficulty manager
        if (window.game && window.game.difficultyManager && window.game.difficultyManager.params) {
            const diffParams = window.game.difficultyManager.params;
            
            // Update our parameters if they exist in the difficulty manager
            if (diffParams.enemyHealth !== undefined) {
                this.enemyConfig.health = diffParams.enemyHealth;
            }
            
            if (diffParams.enemyDamage !== undefined) {
                this.enemyConfig.damage = diffParams.enemyDamage;
            }
            
            if (diffParams.enemySpeed !== undefined) {
                this.enemyConfig.speed = diffParams.enemySpeed;
            }
            
            if (diffParams.spawnInterval !== undefined) {
                this.spawnInterval = diffParams.spawnInterval;
            }
            
            // Log current parameters occasionally for debugging
            if (Math.random() < 0.005) { // ~0.5% chance each frame to avoid spam
                console.log(`Current enemy parameters: Health=${this.enemyConfig.health}, Damage=${this.enemyConfig.damage}, Speed=${this.enemyConfig.speed}, SpawnInterval=${this.spawnInterval}`);
            }
        }
    }
    
    /**
     * Spawns a spectral drone at the given position
     * @param {THREE.Vector3} position The position to spawn at
     * @param {Object} poolManager The enemy pool manager
     * @param {Set} enemies Reference to the active enemies set for tracking
     * @param {number} maxEnemies Maximum number of enemies allowed
     * @returns {Entity} The created entity
     */
    spawnSpectralDrone(position, poolManager, enemies, maxEnemies) {
        console.log("Setting up spectral drone config...");
        
        // STRICT LIMIT CHECK: Do not spawn if already at or over capacity
        if (enemies.size >= maxEnemies) {
            console.warn(`SPAWN BLOCKED: Already at maximum enemies (${enemies.size}/${maxEnemies})`);
            return null;
        }
        
        // Update difficulty parameters before spawning
        this.updateDifficultyParameters();
        
        // Get a spectral drone from the pool
        const entity = poolManager.getEnemyFromPool();
        
        // Extra safety check - verify entity exists and isn't already tracked
        if (!entity) {
            console.error("Failed to get entity from pool or create new one");
            return null;
        }
        
        // VERIFY ENTITY STATE: Ensure entity isn't already in use
        if (enemies.has(entity.id)) {
            console.error(`Entity ${entity.id} is already in the active enemies list!`);
            return null;
        }
        
        // VERIFICATION: Double-check that entity is in a clean state before setting up
        // It should have no tags at this point
        if (entity.tags && entity.tags.size > 0) {
            console.warn(`Entity ${entity.id} from pool still has tags: [${[...entity.tags]}]. Clearing all tags.`);
            if (entity.clearTags && typeof entity.clearTags === 'function') {
                entity.clearTags();
            } else {
                entity.tags.clear();
                entity._isEnemy = false;
                entity._isPooled = false;
                entity._isPlayer = false;
                entity._isProjectile = false;
            }
        }
        
        // Add enemy tags that were not added during pooling
        entity.addTag('enemy');
        entity.addTag('spectrals');
        
        // Add some randomness to the drone properties for visual variety,
        // but now BASED ON THE DIFFICULTY-ADJUSTED VALUES
        const amplitude = this.enemyConfig.spiralAmplitude * (0.8 + Math.random() * 0.4); // 80-120% of base
        const frequency = this.enemyConfig.spiralFrequency * (0.9 + Math.random() * 0.2); // 90-110% of base
        const speed = this.enemyConfig.speed * (0.7 + Math.random() * 0.6); // 70-130% of base
        
        // Generate visual variation parameters
        const sizeVariation = 0.8 + Math.random() * 0.8; // 80% to 160% size variation
        const baseSize = 80; // Increased base size from 50 to 80
        const finalSize = baseSize * sizeVariation;
        
        // Add slight rotation offset for more natural appearance
        const rotationOffset = {
            x: (Math.random() - 0.5) * 0.2, // ±0.1 radians (~±5.7 degrees)
            y: (Math.random() - 0.5) * 0.2,
            z: (Math.random() - 0.5) * 0.2
        };
        
        // Choose a visual effect variant (0-3)
        // 0: Normal, 1: Damaged, 2: Elite, 3: Shielded
        const visualVariant = Math.floor(Math.random() * 4);
        entity.visualVariant = visualVariant;
        
        // Configure transform - reuse existing or create new
        let transform = entity.getComponent(TransformComponent);
        
        if (!transform) {
            // Create new transform if it doesn't exist
            transform = new TransformComponent(position.clone());
            entity.addComponent(transform);
            console.log(`Created new TransformComponent for entity ${entity.id}`);
        } else {
            // Update existing transform
            transform.position.copy(position);
            console.log(`Updated existing TransformComponent for entity ${entity.id}`);
        }
        
        // Set scale and rotation
        transform.scale.set(finalSize, finalSize, finalSize);
        transform.rotation.x = rotationOffset.x;
        transform.rotation.y = rotationOffset.y;
        transform.rotation.z = rotationOffset.z;
        transform.needsUpdate = true;
        
        console.log(`Configured TransformComponent for entity ${entity.id} at position (${position.x.toFixed(0)}, ${position.y.toFixed(0)}, ${position.z.toFixed(0)})`);
        
        // Add or update health component with difficulty-scaled health
        let health = entity.getComponent(HealthComponent);
        if (!health) {
            health = new HealthComponent(this.enemyConfig.health, 0);
            entity.addComponent(health);
        } else {
            health.maxHealth = this.enemyConfig.health;
            health.health = this.enemyConfig.health;
            health.isDestroyed = false;
        }
        
        // Configure AI component
        let enemyAI = entity.getComponent(EnemyAIComponent);
        if (!enemyAI) {
            const config = {
                faction: 'spectrals',
                type: 'drone',
                health: this.enemyConfig.health,
                damage: this.enemyConfig.damage,
                speed: speed,
                spiralAmplitude: amplitude,
                spiralFrequency: frequency,
                isDroneLike: true  // New flag for drone-like movement
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
            enemyAI.isDroneLike = true;  // New flag for drone-like movement
            enemyAI.enabled = true;
        }
        
        // Get the mesh from the GLB model
        // Store reference to current entity being processed
        this.currentEntity = entity;
        const spectralMesh = this.createSpectralDroneMesh();
        // Clear the reference after mesh creation
        this.currentEntity = null;
        
        // Get existing mesh component if any
        let meshComponent = entity.getComponent(MeshComponent);
        
        // Clean up old mesh component if exists
        if (meshComponent) {
            // Remove old mesh from scene if exists
            if (meshComponent.mesh && meshComponent.mesh.parent) {
                meshComponent.mesh.parent.remove(meshComponent.mesh);
            }
            
            // Dispose of old mesh resources
            if (meshComponent.mesh) {
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
            
            // Remove the old component
            entity.removeComponent(MeshComponent);
        }
        
        // Create new mesh component with the actual mesh
        if (spectralMesh.isGLTF) {
            // For GLTF models, pass the model directly
            meshComponent = new MeshComponent(spectralMesh.model);
        } else {
            // For placeholder geometry
            meshComponent = new MeshComponent(spectralMesh.geometry, spectralMesh.material);
        }
        
        // Add the new component to the entity
        entity.addComponent(meshComponent);
        
        // Ensure the mesh is visible
        meshComponent.setVisible(true);
        
        // Try to add to the scene immediately if it's available
        if (this.world && this.world.scene && meshComponent.mesh) {
            // Add to scene if not already added
            if (!meshComponent.mesh.parent) {
                // Set renderer guard to prevent warning
                const prevGuard = window.__rendererGuard;
                window.__rendererGuard = true;
                try {
                    this.world.scene.add(meshComponent.mesh);
                } finally {
                    window.__rendererGuard = prevGuard;
                }
            }
            
            // Get transform component to sync position - it should definitely exist
            const transformComp = entity.getComponent(TransformComponent);
            if (transformComp && transformComp.position) {
                // Ensure mesh position, rotation, and scale match entity transform
                meshComponent.mesh.position.copy(transformComp.position);
                meshComponent.mesh.rotation.x = transformComp.rotation.x || 0;
                meshComponent.mesh.rotation.y = transformComp.rotation.y || 0;
                meshComponent.mesh.rotation.z = transformComp.rotation.z || 0;
                meshComponent.mesh.scale.copy(transformComp.scale);
                
                console.log(`Synced mesh position to (${transformComp.position.x.toFixed(0)}, ${transformComp.position.y.toFixed(0)}, ${transformComp.position.z.toFixed(0)})`);
            } else {
                console.error(`CRITICAL: Entity ${entity.id} lost its TransformComponent! This should not happen.`);
                console.error(`Entity components: ${[...entity.components.keys()].join(', ')}`);
                // Don't re-add - this is a symptom of a bigger problem
            }
            
            console.log("Added enemy drone mesh to scene with visibility:", meshComponent.mesh.visible);
        }
        
        // Add physics if needed
        let rigidbody = entity.getComponent(RigidbodyComponent);
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
        
        // Sync rigidbody position with transform
        const currentTransform = entity.getComponent(TransformComponent);
        if (currentTransform && rigidbody) {
            rigidbody.position = currentTransform.position.clone();
        }
        
        // Add trail effect if not already present - thrusting effect
        if (!entity.getComponent(TrailComponent)) {
            // Temporarily disabled trail effect
            // this.addSpectralTrail(entity, transform);
        }
        
        // SYNCHRONIZATION FIX: Remove any existing references to this entity ID before adding
        // This prevents duplicate tracking if an entity with the same ID is already tracked
        enemies.delete(entity.id);
        
        // Track this enemy
        enemies.add(entity.id);
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
        
        console.log(`Spawned enemy drone at position: x=${position.x.toFixed(0)}, y=${position.y.toFixed(0)}, z=${position.z.toFixed(0)}`);
        console.log(`Properties: Speed=${enemyAI.speed}, Amplitude=${enemyAI.spiralAmplitude}, Frequency=${enemyAI.spiralFrequency}`);
        
        // ADDITIONAL LOGGING: Log the current state after spawn
        console.log(`Current enemy count after spawn: ${enemies.size}/${maxEnemies}`);
        
        return entity;
    }
    
    /**
     * Adds a spectral trail effect to an enemy entity
     * @param {Entity} entity The enemy entity
     * @param {TransformComponent} transform The entity's transform component
     */
    addSpectralTrail(entity, transform) {
        // Create a special trail component for the enemy drone with a thruster-like effect
        const trailComponent = new TrailComponent({
            maxPoints: 50,             // Trail length in points
            pointDistance: 5,          // Min distance to record a new point
            width: 15,                 // Trail width slightly narrower for thruster effect
            color: 0x00ccff,           // Cyan-blue color
            fadeTime: 1.5,             // Seconds to fade out
            transparent: true,
            alphaTest: 0.01,
            blending: THREE.AdditiveBlending, // Additive blending for glow effect
            pulse: true,               // Make the trail pulse
            pulseSpeed: 2.5,           // Faster pulsing for thruster effect
            tapering: true,            // Taper the end of the trail
            glow: true,                // Add glow effect
            thrusterMode: true         // New flag for thruster-like behavior
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
        
        console.log(`Added thruster trail component to entity ${entity.id} at position (${transform.position.x.toFixed(0)}, ${transform.position.y.toFixed(0)}, ${transform.position.z.toFixed(0)})`);
        
        return trailComponent;
    }
    
    /**
     * Creates a spectral drone mesh from loaded GLB
     * @returns {Object} Object containing model
     */
    createSpectralDroneMesh() {
        console.log("Creating spectral drone from GLB model...");
        
        // If model isn't loaded yet, create a stylized fallback mesh
        if (!this.modelCache.enemyDrone) {
            console.warn("Enemy model not loaded - creating stylized fallback enemy");
            
            // Create a more interesting fallback enemy shape
            const group = new THREE.Group();
            
            // Main body - octahedron for alien look
            const bodyGeometry = new THREE.OctahedronGeometry(2, 0);
            const bodyMaterial = new THREE.MeshPhongMaterial({ 
                color: 0x00ffff,
                emissive: 0x0088ff,
                emissiveIntensity: 1.5,
                transparent: true,
                opacity: 0.9
            });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            group.add(body);
            
            // Add some wings/fins for visual interest
            const wingGeometry = new THREE.BoxGeometry(4, 0.2, 1);
            const wingMaterial = new THREE.MeshPhongMaterial({
                color: 0x8888ff,
                emissive: 0x4444ff,
                emissiveIntensity: 1.0
            });
            const wing1 = new THREE.Mesh(wingGeometry, wingMaterial);
            wing1.position.set(0, 0, 0);
            wing1.rotation.z = Math.PI / 6;
            group.add(wing1);
            
            const wing2 = new THREE.Mesh(wingGeometry, wingMaterial);
            wing2.position.set(0, 0, 0);
            wing2.rotation.z = -Math.PI / 6;
            group.add(wing2);
            
            // Scale the group to appropriate size
            group.scale.set(1.5, 1.5, 1.5);
            
            return group;
        }
        
        // Clone the model to avoid shared instance issues
        const model = this.modelCache.enemyDrone.clone();
        
        // Get the visual variant if it exists on the entity being processed
        let visualVariant = 0;
        if (this.currentEntity && this.currentEntity.visualVariant !== undefined) {
            visualVariant = this.currentEntity.visualVariant;
        }
        
        // Extended color palette with 10 options instead of just 3
        const colorPalette = [
            { main: 0x00ccff, emissive: new THREE.Color(0x0088ff) }, // Blue/cyan
            { main: 0x8866ff, emissive: new THREE.Color(0x6633ff) }, // Purple/blue
            { main: 0x00ffcc, emissive: new THREE.Color(0x00bb99) }, // Teal/green
            { main: 0xff3366, emissive: new THREE.Color(0xcc1144) }, // Red/pink
            { main: 0xffaa00, emissive: new THREE.Color(0xcc8800) }, // Orange/gold
            { main: 0x66ff33, emissive: new THREE.Color(0x44cc11) }, // Lime/green
            { main: 0xff99ff, emissive: new THREE.Color(0xcc66cc) }, // Pink/magenta
            { main: 0xffff33, emissive: new THREE.Color(0xcccc11) }, // Yellow
            { main: 0x3366ff, emissive: new THREE.Color(0x1144cc) }, // Deep blue
            { main: 0xff3333, emissive: new THREE.Color(0xcc1111) }  // Deep red
        ];
        
        // Randomly choose from the extended color palette
        const colorIndex = Math.floor(Math.random() * colorPalette.length);
        const selectedColor = colorPalette[colorIndex];
        
        // Apply visual effects based on variant type
        let emissiveIntensity = 1.0;
        let opacity = 1.0;
        let additionalEffects = false;
        
        switch (visualVariant) {
            case 0: // Normal
                emissiveIntensity = 1.0 + (Math.random() * 0.5); // 1.0-1.5
                break;
                
            case 1: // Damaged - flickering effect, darker colors
                emissiveIntensity = 0.5 + (Math.sin(Date.now() * 0.01) * 0.3); // 0.2-0.8, flickering
                // Darken color
                selectedColor.emissive.multiplyScalar(0.7);
                // Add damage texturing (simulated with partial transparency)
                opacity = 0.85;
                break;
                
            case 2: // Elite - brighter, pulsing glow
                emissiveIntensity = 2.0 + (Math.sin(Date.now() * 0.003) * 0.5); // 1.5-2.5, slow pulse
                // Make more vibrant
                selectedColor.emissive.multiplyScalar(1.2);
                additionalEffects = true;
                break;
                
            case 3: // Shielded - shimmer effect with interference patterns
                emissiveIntensity = 1.5;
                // Shield shimmer effect (simulated with color modulation)
                const shieldPhase = Date.now() * 0.001;
                const shimmerValue = 0.8 + (Math.sin(shieldPhase) * 0.2);
                selectedColor.emissive.r *= shimmerValue;
                selectedColor.emissive.g *= 1 + (1 - shimmerValue);
                selectedColor.emissive.b *= 1 + (Math.cos(shieldPhase) * 0.2);
                break;
        }
        
        // Apply colors and effects to the model
        model.traverse((child) => {
            if (child.isMesh && child.material) {
                // Clone material to avoid shared materials affecting other drones
                child.material = child.material.clone(); 
                
                // Apply main color and emissive effect
                child.material.color = new THREE.Color(selectedColor.main);
                child.material.emissive = selectedColor.emissive;
                child.material.emissiveIntensity = emissiveIntensity;
                
                // Apply opacity if needed
                if (opacity < 1.0) {
                    child.material.transparent = true;
                    child.material.opacity = opacity;
                }
                
                // Apply additional effects for elite enemies
                if (additionalEffects) {
                    // Add higher shininess for elite enemies
                    if (child.material.shininess !== undefined) {
                        child.material.shininess = 100;
                    }
                    
                    // Add env map if supported by the material type
                    if (child.material.envMap !== undefined) {
                        // Not creating real env maps here since that would require additional resources
                        // In a full implementation, we'd add a cube texture
                        child.material.envMapIntensity = 0.8;
                    }
                }
            }
        });
        
        // Add any variant-specific visual enhancements to the model
        if (visualVariant === 2) { // Elite
            // For elites, we could add extra mesh elements to show their status
            // Here we'll add a simple halo effect using a ring geometry
            try {
                const haloGeometry = new THREE.RingGeometry(1.2, 1.5, 16);
                const haloMaterial = new THREE.MeshBasicMaterial({
                    color: selectedColor.main,
                    transparent: true,
                    opacity: 0.6,
                    side: THREE.DoubleSide,
                    blending: THREE.AdditiveBlending
                });
                
                const halo = new THREE.Mesh(haloGeometry, haloMaterial);
                halo.rotation.x = Math.PI / 2; // Make it horizontal
                model.add(halo);
                
                // Add animation update handler
                halo.userData.update = function(delta) {
                    halo.rotation.z += delta * 0.5; // Slow rotation
                    
                    // Pulse size
                    const pulseScale = 1 + 0.2 * Math.sin(Date.now() * 0.002);
                    halo.scale.set(pulseScale, pulseScale, pulseScale);
                };
            } catch (error) {
                console.error("Failed to create elite halo effect:", error);
            }
        } else if (visualVariant === 3) { // Shielded
            // For shielded enemies, add a translucent shield sphere
            try {
                const shieldGeometry = new THREE.SphereGeometry(1.1, 16, 12);
                const shieldMaterial = new THREE.MeshBasicMaterial({
                    color: 0xaaddff,
                    transparent: true,
                    opacity: 0.3,
                    side: THREE.DoubleSide,
                    blending: THREE.AdditiveBlending,
                    wireframe: false
                });
                
                const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
                model.add(shield);
                
                // Add animation update handler
                shield.userData.update = function(delta) {
                    // Subtle pulsing effect
                    const pulseScale = 1 + 0.05 * Math.sin(Date.now() * 0.003);
                    shield.scale.set(pulseScale, pulseScale, pulseScale);
                    
                    // Shimmer effect on opacity
                    shield.material.opacity = 0.2 + 0.1 * Math.sin(Date.now() * 0.002);
                };
            } catch (error) {
                console.error("Failed to create shield effect:", error);
            }
        }
        
        console.log(`Enemy drone model created with color #${selectedColor.main.toString(16)} and variant ${visualVariant}`);
        
        return { model, isGLTF: true };
    }
} 