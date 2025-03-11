/**
 * EnemySystem - Manages enemy entities and their AI behavior
 * 
 * Handles enemy spawning, AI updates, and combat interactions.
 * This is a simplified version that only implements the basic kamikaze enemy type.
 */

import { System } from '../../core/system.js';
import { TransformComponent } from '../../components/transform.js';
import { EnemyAIComponent } from '../../components/combat/enemyAI.js';
import { HealthComponent } from '../../components/combat/healthComponent.js';
import { MeshComponent } from '../../components/rendering/mesh.js';
import { RigidbodyComponent } from '../../components/physics/rigidbody.js';
import { TrailComponent } from '../../components/rendering/trail.js';

export class EnemySystem extends System {
    constructor(world) {
        super(world);
        this.requiredComponents = ['EnemyAIComponent', 'TransformComponent'];
        this.priority = 40; // Run before combat but after input and physics
        
        // Initialize enemies set
        this.enemies = new Set();
        
        // Enemy spawn parameters - adjusted for more frequent spawning
        this.maxEnemies = 8;           // Allow more enemies to spawn
        this.spawnTimer = 0;           // Timer since last spawn
        this.spawnInterval = 3;        // Seconds between spawns (reduced from 10)
        this.spawnPoints = [];         // Will be populated with potential spawn points
        this.lastSpawnTime = Date.now(); // Track the last successful spawn time
        
        // Enemy type configuration - default is pirate
        this.enemyTypes = {
            pirate: {
                health: 30,
                damage: 25,
                speed: 500
            },
            spectrals: {
                health: 20,
                damage: 15,
                speed: 700,
                spiralAmplitude: 150,
                spiralFrequency: 2.0
            }
        };
        
        // Track player docked status
        this.playerIsDocked = false;
        
        // Destroyed enemies counter
        this.enemiesDestroyed = 0;
        
        // Set up recovery timer for spawn system problems
        this.lastSpawnCheckTime = Date.now();
        this.spawnCheckInterval = 10000; // 10 seconds
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Set up initial spawn points
        this.generateSpawnPoints();
        
        // Start continuous monitoring for spawn health
        this.startSpawnMonitoring();
        
        console.log("Enemy system initialized with faster spawn rate");
    }
    
    /**
     * Set up event listeners for enemy-related events
     */
    setupEventListeners() {
        // Listen for entity.destroyed events to track destroyed enemies
        this.world.messageBus.subscribe('entity.destroyed', this.handleEntityDestroyed.bind(this));
        
        // Listen for player docking/undocking events
        // Make sure we properly bind 'this' to the handlers to maintain context
        this.world.messageBus.subscribe('player.docked', this.handlePlayerDocked.bind(this));
        this.world.messageBus.subscribe('player.undocked', this.handlePlayerUndocked.bind(this));
        
        // Log that we've set up the event listeners
        console.log("Enemy system: Event listeners set up for player docking/undocking");
    }
    
    /**
     * Handle player docked event
     * @param {object} message Event message
     */
    handlePlayerDocked(message) {
        console.log("Enemy system detected player docked - freezing enemies");
        
        // Set the docked state first
        this.playerIsDocked = true;
        
        // Then freeze all enemies
        this.freezeAllEnemies();
        
        // Additional logging for debug purposes
        console.log(`Froze ${this.enemies.size} enemies due to player docking`);
    }
    
    /**
     * Handle player undocked event
     * @param {object} message Event message
     */
    handlePlayerUndocked(message) {
        console.log("Enemy system detected player undocked - resuming enemy activities");
        
        // Set the docked state first
        this.playerIsDocked = false;
        
        // Then unfreeze all enemies
        this.unfreezeAllEnemies();
        
        // Additional logging for debug purposes
        console.log(`Unfroze ${this.enemies.size} enemies due to player undocking`);
    }
    
    /**
     * Initialize the system and generate spawn points
     */
    initialize() {
        console.log('Initializing enemy system and generating initial spawn points');
        
        // Generate initial spawn points
        this.generateSpawnPoints();
        
        // Debug logging for player entity availability
        const players = this.world.getEntitiesByTag('player');
        if (players.length > 0) {
            console.log(`Found ${players.length} player entity/entities during enemy system initialization`);
            
            // Log the first player entity's ID and transform
            const player = players[0];
            const transform = player.getComponent('TransformComponent');
            if (transform) {
                console.log(`Player entity position: ${transform.position.x.toFixed(0)}, ${transform.position.y.toFixed(0)}, ${transform.position.z.toFixed(0)}`);
            }
        } else {
            console.warn('No player entities found during enemy system initialization - enemies may not spawn correctly');
            console.log('Will wait for player entity to be created');
        }
        
        // Just subscribe to events for now
        this.world.messageBus.subscribe('world.zoneChanged', () => this.generateSpawnPoints());
    }
    
    /**
     * Update all enemy entities
     * @param {number} deltaTime Time since last update in seconds
     */
    update(deltaTime) {
        // First check if there's a global docked state from the game object
        // This ensures we capture docking state from other sources
        if (window.game && window.game.spaceship && window.game.spaceship.isDocked !== undefined) {
            // If global docking state has changed, update our internal state
            if (this.playerIsDocked !== window.game.spaceship.isDocked) {
                console.log(`Enemy system syncing docked state from global: ${window.game.spaceship.isDocked}`);
                this.playerIsDocked = window.game.spaceship.isDocked;
                
                // Apply the appropriate freeze/unfreeze based on the new state
                if (this.playerIsDocked) {
                    this.freezeAllEnemies();
                } else {
                    this.unfreezeAllEnemies();
                }
            }
        }
        
        // Skip normal processing if player is docked
        if (this.playerIsDocked) {
            // Don't call super.update() which would run processEntity on all entities
            // We just want to maintain the frozen state
            return;
        }
        
        // Process all enemy entities through processEntity
        super.update(deltaTime);
        
        // Update spawn timer
        this.spawnTimer += deltaTime;
        
        // Debug logging - show current enemy count and spawn timer
        if (this.spawnTimer > this.spawnInterval * 0.9 || this.enemies.size === 0) {
            console.log(`Spawn status: ${this.enemies.size}/${this.maxEnemies} enemies, timer: ${this.spawnTimer.toFixed(1)}/${this.spawnInterval} seconds`);
        }
        
        // Validate enemy references periodically to ensure accurate count
        this.validateEnemyReferences();
        
        // Check if we should spawn new enemies
        if (this.spawnTimer >= this.spawnInterval && this.enemies.size < this.maxEnemies) {
            // ONLY spawn spectral drones, as requested
            console.log("=== SPAWNING SPECTRAL DRONE ===");
            
            // Get a spawn point
            const spawnPoint = this.getRandomSpawnPoint();
            if (!spawnPoint) {
                console.error("Failed to get spawn point! Generating new spawn points.");
                this.generateSpawnPoints();
                return;
            }
            
            // Spawn the drone
            const drone = this.spawnSpectralDrone(spawnPoint);
            
            // Verify the drone was properly created and tracked
            if (drone) {
                console.log(`Successfully spawned drone with ID: ${drone.id}, current count: ${this.enemies.size}/${this.maxEnemies}`);
            } else {
                console.error("Failed to spawn drone!");
            }
            
            // Reset spawn timer
            this.spawnTimer = 0;
        }
        
        // FAILSAFE: If we have no enemies and it's been a while since spawning,
        // reset the enemy count and regenerate spawn points
        if (this.enemies.size === 0 && this.spawnTimer > this.spawnInterval * 2) {
            console.warn("FAILSAFE: No enemies detected for extended period. Resetting spawn system.");
            this.enemies.clear();
            this.generateSpawnPoints();
            this.spawnTimer = this.spawnInterval; // Force a spawn next frame
        }
    }
    
    /**
     * Validate enemy references to ensure all tracked enemies exist
     * This helps prevent "ghost" references that block new spawns
     */
    validateEnemyReferences() {
        // Store original size for logging
        const originalSize = this.enemies.size;
        
        // Create a new Set to hold valid enemy IDs
        const validEnemies = new Set();
        
        // Check each enemy ID in our tracking Set
        for (const enemyId of this.enemies) {
            // Get the entity from the world
            const entity = this.world.getEntity(enemyId);
            
            // If entity exists and is an enemy, keep tracking it
            if (entity && entity.hasTag && entity.hasTag('enemy')) {
                validEnemies.add(enemyId);
            } else {
                console.warn(`Removing invalid enemy reference: ${enemyId}`);
            }
        }
        
        // Replace our tracking Set with the validated Set
        this.enemies = validEnemies;
        
        // Double-check: also scan for any enemies that might not be in our tracking
        let entitiesScanned = 0;
        try {
            if (this.world && this.world.entityManager) {
                // Try to get entities with the 'enemy' tag first
                let enemyEntities = [];
                
                if (this.world.entityManager.entitiesByTag && 
                    this.world.entityManager.entitiesByTag.get) {
                    enemyEntities = this.world.entityManager.entitiesByTag.get('enemy') || [];
                    entitiesScanned = enemyEntities.length;
                    
                    // Add any enemy entities that aren't in our tracking Set
                    for (const enemy of enemyEntities) {
                        if (!this.enemies.has(enemy.id)) {
                            console.log(`Found untracked enemy: ${enemy.id}, adding to tracking`);
                            this.enemies.add(enemy.id);
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error during entity scan:", error);
        }
        
        // Log if we fixed any tracking issues
        if (originalSize !== this.enemies.size) {
            console.log(`Enemy tracking corrected: ${originalSize} -> ${this.enemies.size} enemies tracked. Scanned ${entitiesScanned} entities.`);
        }
    }
    
    /**
     * Freeze all enemy entities in place
     */
    freezeAllEnemies() {
        console.log(`Freezing all ${this.enemies.size} enemies...`);
        
        // Iterate through all enemies and stop their movement
        for (const enemyId of this.enemies) {
            const enemy = this.world.getEntity(enemyId);
            if (!enemy) {
                // Skip if entity doesn't exist
                console.warn(`Enemy ${enemyId} not found when freezing - may have been destroyed`);
                continue;
            }
            
            // Get the rigidbody component if it exists
            const rigidbody = enemy.getComponent('RigidbodyComponent');
            if (rigidbody) {
                // Set velocity to zero
                rigidbody.velocity.set(0, 0, 0);
                
                // Set angular velocity to zero if it exists
                if (rigidbody.angularVelocity) {
                    rigidbody.angularVelocity.set(0, 0, 0);
                }
                
                // Mark as frozen
                rigidbody.isFrozen = true;
            }
            
            // Get the enemy AI component
            const enemyAI = enemy.getComponent('EnemyAIComponent');
            if (enemyAI) {
                // Store original enabled state if not already stored
                if (enemyAI.originalEnabledState === undefined) {
                    enemyAI.originalEnabledState = enemyAI.enabled;
                }
                
                // Disable the AI component
                enemyAI.enabled = false;
            }
            
            // Mark the entity as frozen for other systems to recognize
            enemy.addTag('frozen');
        }
        
        console.log("All enemies frozen successfully");
    }
    
    /**
     * Unfreeze all enemy entities and re-enable their AI
     */
    unfreezeAllEnemies() {
        console.log(`Unfreezing all ${this.enemies.size} enemies...`);
        
        // Iterate through all enemies and re-enable their AI
        for (const enemyId of this.enemies) {
            const enemy = this.world.getEntity(enemyId);
            if (!enemy) {
                // Skip if entity doesn't exist
                console.warn(`Enemy ${enemyId} not found when unfreezing - may have been destroyed`);
                continue;
            }
            
            // Get the rigidbody component if it exists
            const rigidbody = enemy.getComponent('RigidbodyComponent');
            if (rigidbody) {
                // Un-mark as frozen
                rigidbody.isFrozen = false;
            }
            
            // Get the enemy AI component
            const enemyAI = enemy.getComponent('EnemyAIComponent');
            if (enemyAI) {
                // Restore original enabled state or default to enabled
                enemyAI.enabled = (enemyAI.originalEnabledState !== undefined) ? 
                    enemyAI.originalEnabledState : true;
            }
            
            // Remove the frozen tag
            if (enemy.hasTag && enemy.hasTag('frozen')) {
                enemy.removeTag('frozen');
            }
        }
        
        console.log("All enemies unfrozen successfully");
    }
    
    /**
     * Process a single enemy entity
     * @param {Entity} entity Entity to process
     * @param {number} deltaTime Time since last update in seconds
     */
    processEntity(entity, deltaTime) {
        // Get enemy AI component
        const enemyAI = entity.getComponent('EnemyAIComponent');
        
        // Skip if entity is missing an enemy AI component
        if (!enemyAI) return;
        
        // Get transform component
        const transform = entity.getComponent('TransformComponent');
        
        // Skip if entity is missing a transform component
        if (!transform) return;
        
        // Get mesh component
        const meshComponent = entity.getComponent('MeshComponent');
        
        // Check if mesh component exists and has been added to scene
        if (meshComponent && meshComponent.mesh) {
            // Ensure mesh visibility
            meshComponent.mesh.visible = true;
            
            // Check if mesh has been added to scene
            if (!meshComponent.mesh.parent && this.world.scene) {
                console.log(`Adding enemy mesh to scene`);
                this.world.scene.add(meshComponent.mesh);
                
                // Call the onAddedToScene method if it exists
                if (meshComponent.onAddedToScene) {
                    meshComponent.onAddedToScene(this.world.scene);
                }
            }
            
            // Update mesh position to match entity transform
            meshComponent.mesh.position.copy(transform.position);
            meshComponent.mesh.quaternion.copy(transform.quaternion);
            meshComponent.mesh.scale.copy(transform.scale);
        }
        
        // Call the component's update method
        enemyAI.update(deltaTime);
        
        // Get health component to update shield regeneration
        const health = entity.getComponent('HealthComponent');
        if (health) {
            health.update(deltaTime);
        }
    }
    
    /**
     * Spawn a new enemy entity at the given position
     * @param {THREE.Vector3} position Spawn position
     * @param {Object} config Optional configuration for the enemy
     * @returns {Entity} The created enemy entity
     */
    spawnEnemy(position, config = {}) {
        // Debug: Log the config object
        console.log("Spawning enemy with config:", config);
        
        // Create enemy entity with proper tagging
        const enemy = this.world.createEntity('enemy');
        
        // Add 'enemy' tag for detection
        enemy.addTag('enemy');
        
        // Add transform component
        const transform = new TransformComponent(position);
        // Make it large to be visible from far away
        transform.scale.set(50, 50, 50);
        enemy.addComponent(transform);
        
        // Add health component
        const health = new HealthComponent(config.health || 50, config.shields || 0);
        enemy.addComponent(health);
        
        // Create mesh based on faction and type
        let mesh;
        
        // Check if this is a spectral drone - create a special mesh
        if (config.faction === 'spectrals' && config.type === 'drone') {
            console.log("Creating spectral drone mesh");
            // Create a more complex, ethereal-looking drone for spectrals
            const spectralMesh = this.createSpectralDroneMesh();
            mesh = new MeshComponent(spectralMesh.geometry, spectralMesh.material);
            
            // Ensure the mesh will be updated and rendered properly
            mesh.onAddedToScene = function(scene) {
                if (this.mesh && !this.mesh.parent && scene) {
                    console.log("Adding spectral drone mesh to scene");
                    scene.add(this.mesh);
                }
            };
            
            console.log("Adding spectral trail");
            // Add the trail effect for spectral drones
            this.addSpectralTrail(enemy, transform);
        } else {
            console.log(`Creating standard enemy mesh for ${config.faction} ${config.type}`);
            // Default enemy mesh (simple box) for other enemies
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshBasicMaterial({ 
                color: 0xff0000,
                emissive: 0xff0000,
                emissiveIntensity: 3.0 // Glow effect for visibility
            });
            mesh = new MeshComponent(geometry, material);
        }
        
        enemy.addComponent(mesh);
        
        // Add physics for collision
        const rigidbody = new RigidbodyComponent(1);
        rigidbody.useGravity = false;
        rigidbody.drag = 0.1;
        rigidbody.shape = 'sphere';
        rigidbody.collisionRadius = 50; // Large collision radius
        enemy.addComponent(rigidbody);
        
        // Add AI component - pass config directly to use defaults from EnemyAIComponent
        const enemyAI = new EnemyAIComponent(config);
        enemy.addComponent(enemyAI);
        
        // Track this enemy in our system
        this.enemies.add(enemy.id);
        
        // Record the spawn time for monitoring
        this.lastSpawnTime = Date.now();
        
        console.log(`Spawned ${enemyAI.faction} ${enemyAI.type} at position: x=${position.x.toFixed(0)}, y=${position.y.toFixed(0)}, z=${position.z.toFixed(0)}`);
        console.log(`Enemy properties: Speed=${enemyAI.speed}, Damage=${enemyAI.damage}, Health=${health.health}`);
        
        return enemy;
    }
    
    /**
     * Creates a spectral drone mesh programmatically
     * @returns {Object} Object containing geometry and material
     */
    createSpectralDroneMesh() {
        console.log("Creating enhanced spectral drone mesh...");
        
        // We'll use a modified icosahedron with displacement for a more crystalline look
        // This still works with the physics system but looks more interesting
        const geometry = new THREE.IcosahedronGeometry(0.8, 2); // Higher detail
        
        // Create a random seed for this particular drone
        const randomSeed = Math.random() * 100;
        
        // Apply distortion to the geometry to create a crystalline form
        const positionAttribute = geometry.attributes.position;
        
        for (let i = 0; i < positionAttribute.count; i++) {
            const x = positionAttribute.getX(i);
            const y = positionAttribute.getY(i);
            const z = positionAttribute.getZ(i);
            
            // Apply noise-based displacement for a crystalline effect
            const noise = 0.2 * Math.sin(5 * x + randomSeed) * Math.cos(3 * y + randomSeed) * Math.sin(2 * z);
            
            // Keep the core shape but add the noise
            positionAttribute.setX(i, x * (1.0 + noise));
            positionAttribute.setY(i, y * (1.0 + noise));
            positionAttribute.setZ(i, z * (1.0 + noise));
        }
        
        // Apply the changes
        positionAttribute.needsUpdate = true;
        
        // Create a glowing, ethereal material with shimmering effect
        // Randomly choose one of three color schemes for variety
        const colorScheme = Math.floor(Math.random() * 3);
        let mainColor, emissiveColor, specularColor;
        
        switch (colorScheme) {
            case 0: // Blue/cyan
                mainColor = 0x00ccff;
                emissiveColor = 0x0088ff;
                specularColor = 0xaaffff;
                break;
            case 1: // Purple/blue
                mainColor = 0x8866ff;
                emissiveColor = 0x6633ff;
                specularColor = 0xccaaff;
                break;
            case 2: // Teal/green
                mainColor = 0x00ffcc;
                emissiveColor = 0x00bb99;
                specularColor = 0xaaffee;
                break;
        }
        
        // Create the material with the selected color scheme
        const material = new THREE.MeshPhongMaterial({
            color: mainColor,
            emissive: emissiveColor,
            emissiveIntensity: 2.0,
            specular: specularColor,
            shininess: 150,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide,
            flatShading: true
        });
        
        console.log(`Spectral drone mesh created with color scheme ${colorScheme}`);
        
        return {
            geometry: geometry,
            material: material
        };
    }
    
    /**
     * Adds a spectral trail effect to an enemy entity
     * @param {Entity} entity The enemy entity
     * @param {TransformComponent} transform The entity's transform component
     */
    addSpectralTrail(entity, transform) {
        // Create a special trail component for the spectral drone
        const trailComponent = new TrailComponent({
            maxPoints: 50,           // Trail length in points
            pointDistance: 5,         // Min distance to record a new point
            width: 20,                // Trail width
            color: 0x00ccff,          // Cyan-blue color
            fadeTime: 2.0,            // Seconds to fade out
            transparent: true,
            alphaTest: 0.01,
            blending: THREE.AdditiveBlending, // Additive blending for glow effect
            pulse: true,              // Make the trail pulse
            pulseSpeed: 1.5,          // Speed of pulsing
            tapering: true,           // Taper the end of the trail
            glow: true                // Add glow effect
        });
        
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
     * Generate spawn points for enemies based on player position
     */
    generateSpawnPoints() {
        // Clear existing spawn points
        this.spawnPoints = [];
        
        // Find player position
        const players = this.world.entityManager.getEntitiesByTag('player');
        if (players.length === 0) {
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
            
            console.log(`Generated ${this.spawnPoints.length} default spawn points around origin`);
            return;
        }
        
        // Get player position
        const player = players[0];
        const transform = player.getComponent('TransformComponent');
        if (!transform) {
            console.warn("Player entity has no transform component, using default spawn points");
            return;
        }
        
        // Generate spawn points in a sphere around player
        const center = transform.position.clone();
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
     * Handle entity destroyed event
     * @param {object} message Event message
     */
    handleEntityDestroyed(message) {
        // Check if the destroyed entity is one of our enemies
        const entity = message.entity;
        if (!entity) {
            console.warn("Entity destroyed event received but no entity in message!");
            return;
        }
        
        // Make sure it's an enemy
        if (entity.hasTag && entity.hasTag('enemy')) {
            // IMPORTANT: Store entity ID locally before further processing
            const entityId = entity.id;
            
            console.log(`Enemy destroyed: ${entityId}`);
            
            // Clean up mesh resources
            const meshComponent = entity.getComponent('MeshComponent');
            if (meshComponent && meshComponent.mesh) {
                try {
                    // Remove from scene if it has a parent
                    if (meshComponent.mesh.parent) {
                        meshComponent.mesh.parent.remove(meshComponent.mesh);
                    }
                    
                    // Dispose of geometry and material to prevent memory leaks
                    if (meshComponent.mesh.geometry) {
                        meshComponent.mesh.geometry.dispose();
                    }
                    if (meshComponent.mesh.material) {
                        if (Array.isArray(meshComponent.mesh.material)) {
                            meshComponent.mesh.material.forEach(material => material.dispose());
                        } else {
                            meshComponent.mesh.material.dispose();
                        }
                    }
                } catch (error) {
                    console.error(`Error cleaning up mesh for entity ${entityId}:`, error);
                }
            }
            
            // Remove from tracked enemies
            if (this.enemies.has(entityId)) {
                this.enemies.delete(entityId);
                
                // Increment destroyed counter
                this.enemiesDestroyed++;
                
                // Log remaining enemies
                console.log(`Enemy ${entityId} removed from tracking. Enemies remaining: ${this.enemies.size}/${this.maxEnemies}`);
            } else {
                console.warn(`Warning: Enemy ${entityId} was destroyed but wasn't in the tracked enemies set!`);
                // Force validation of enemy references
                this.validateEnemyReferences();
            }
            
            // Force spawn point regeneration after several enemies have been destroyed
            if (this.enemiesDestroyed % 5 === 0) {
                console.log("Regenerating spawn points after multiple enemy destructions");
                this.generateSpawnPoints();
            }
            
            // CRITICAL: If this was the last enemy, make sure to reset the spawn timer
            // to avoid long waits for the next enemy
            if (this.enemies.size === 0) {
                console.log("All enemies destroyed - accelerating next spawn");
                // Set the timer to be almost at the spawn interval
                this.spawnTimer = Math.max(this.spawnTimer, this.spawnInterval * 0.8);
            }
        }
    }
    
    /**
     * Called when the system is disabled
     */
    onDisabled() {
        // Clear monitoring interval
        if (this.spawnMonitorInterval) {
            clearInterval(this.spawnMonitorInterval);
            this.spawnMonitorInterval = null;
            console.log("Spawn monitoring stopped");
        }
        
        // Clean up any tracked enemies
        this.enemies.clear();
        
        console.log("Enemy system disabled");
    }

    /**
     * Spawns a spectral drone at the given position
     * @param {THREE.Vector3} position The position to spawn at
     * @returns {Entity} The created entity
     */
    spawnSpectralDrone(position) {
        console.log("Setting up spectral drone config...");
        
        // Add some randomness to the drone properties for visual variety
        const amplitude = this.enemyTypes.spectrals.spiralAmplitude * (0.8 + Math.random() * 0.4); // 80-120% of base
        const frequency = this.enemyTypes.spectrals.spiralFrequency * (0.9 + Math.random() * 0.2); // 90-110% of base
        const speed = this.enemyTypes.spectrals.speed * (0.7 + Math.random() * 0.6); // 70-130% of base
        
        // Use the faction and type with our custom config
        const config = {
            faction: 'spectrals',
            type: 'drone',
            health: this.enemyTypes.spectrals.health,
            damage: this.enemyTypes.spectrals.damage,
            speed: speed,
            spiralAmplitude: amplitude,
            spiralFrequency: frequency
        };
        
        console.log("Spectral drone config created:", config);
        
        // Call the general spawnEnemy method with our specific config
        const drone = this.spawnEnemy(position, config);
        
        // Update spawn monitoring
        if (drone) {
            this.lastSpawnTime = Date.now();
            
            // Extra verification of the entity setup
            const transform = drone.getComponent('TransformComponent');
            const enemyAI = drone.getComponent('EnemyAIComponent');
            const meshComponent = drone.getComponent('MeshComponent');
            
            if (!transform || !enemyAI || !meshComponent) {
                console.error("Spectral drone missing critical components!");
            } else {
                console.log("Spectral drone created successfully with all required components");
            }
        }
        
        return drone;
    }

    /**
     * Start monitoring the spawn system health
     */
    startSpawnMonitoring() {
        // Set up an interval to check spawn system health
        this.spawnMonitorInterval = setInterval(() => {
            this.checkSpawnSystemHealth();
        }, 10000); // Check every 10 seconds
        
        console.log("Spawn system monitoring started");
    }
    
    /**
     * Check the health of the spawn system
     */
    checkSpawnSystemHealth() {
        const now = Date.now();
        const timeSinceLastSpawn = (now - this.lastSpawnTime) / 1000; // in seconds
        
        console.log(`Spawn system health check: ${this.enemies.size}/${this.maxEnemies} enemies, ${timeSinceLastSpawn.toFixed(1)}s since last spawn`);
        
        // If no spawns have happened in a while and we're below max enemies, something might be wrong
        if (timeSinceLastSpawn > this.spawnInterval * 3 && this.enemies.size < this.maxEnemies) {
            console.warn("Spawn system appears stuck! Performing recovery...");
            
            // Recover the spawn system
            this.enemies.clear(); // Reset tracked enemies
            this.generateSpawnPoints(); // Regenerate spawn points
            this.spawnTimer = this.spawnInterval; // Force spawn soon
            
            // Validate enemy references
            this.validateEnemyReferences();
            
            console.log("Spawn system recovery completed");
        }
    }
}