/**
 * EnemySystem - Manages enemy entities and their AI behavior
 * 
 * Handles enemy spawning, AI updates, and combat interactions.
 * This is a simplified version that only implements spectral drones.
 */

import { System } from '../../core/system.js';
import { TransformComponent } from '../../components/transform.js';
import { EnemyAIComponent } from '../../components/combat/enemyAI.js';
import { HealthComponent } from '../../components/combat/healthComponent.js';
import { MeshComponent } from '../../components/rendering/mesh.js';
import { RigidbodyComponent } from '../../components/physics/rigidbody.js';
import { TrailComponent } from '../../components/rendering/trail.js';

// Import the new modularized components
import { EnemyPoolManager } from './enemyPoolManager.js';
import { EnemySpawner } from './enemySpawner.js';
import { EnemyLifecycle } from './enemyLifecycle.js';

export class EnemySystem extends System {
    constructor(world) {
        super(world);
        this.requiredComponents = ['EnemyAIComponent', 'TransformComponent'];
        this.priority = 40; // Run before combat but after input and physics
        
        // Initialize enemies set
        this.enemies = new Set();
        
        // Default enemy spawn parameters (will be modified by difficulty scaling)
        this.maxEnemies = 10;           // Allow more enemies to spawn
        this.spawnTimer = 0;           // Timer since last spawn
        this.spawnInterval = 3;        // Seconds between spawns (reduced from 10)
        this.lastSpawnTime = Date.now(); // Track the last successful spawn time
        
        // Initialize the managers for different aspects of enemy handling
        this.poolManager = new EnemyPoolManager(world);
        this.spawner = new EnemySpawner(world);
        this.lifecycle = new EnemyLifecycle(world);
        
        // Track player docked status
        this.playerIsDocked = false;
        
        // Destroyed enemies counter
        this.enemiesDestroyed = 0;
        
        // Set up recovery timer for spawn system problems
        this.lastSpawnCheckTime = Date.now();
        this.spawnCheckInterval = 10000; // 10 seconds
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize with a clean enemy count
        this.lifecycle.clearAllEnemies(this.enemies);
        
        // Force validation to ensure we start with empty tracking
        this.lifecycle.validateEnemyReferences(this.enemies);
        
        // Start continuous monitoring for spawn health
        this.startSpawnMonitoring();
        
        console.log("Enemy system initialized with faster spawn rate and object pooling");
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
        this.lifecycle.freezeAllEnemies(this.enemies);
        
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
        this.lifecycle.unfreezeAllEnemies(this.enemies);
        
        // Additional logging for debug purposes
        console.log(`Unfroze ${this.enemies.size} enemies due to player undocking`);
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
                    this.lifecycle.freezeAllEnemies(this.enemies);
                } else {
                    this.lifecycle.unfreezeAllEnemies(this.enemies);
                }
            }
        }
        
        // Skip normal processing if player is docked
        if (this.playerIsDocked) {
            // Don't call super.update() which would run processEntity on all entities
            // We just want to maintain the frozen state
            return;
        }
        
        // Process all enemy entities
        super.update(deltaTime);
        
        // Run diagnostics more frequently (every 3 seconds instead of 10)
        if (!this._lastDiagnosticTime) {
            this._lastDiagnosticTime = 0;
        }
        this._lastDiagnosticTime += deltaTime;
        
        if (this._lastDiagnosticTime >= 3) {
            this.poolManager.runPoolDiagnostics(this.enemies);
            this._lastDiagnosticTime = 0;
        }
        
        // Validate enemy references before spawn decision to ensure accurate count
        this.lifecycle.validateEnemyReferences(this.enemies);
        
        // Apply difficulty scaling from game object if available
        this.updateDifficultyScaling();
        
        // STRICT ENFORCEMENT: If we're over the limit, force destroy excess enemies
        if (this.enemies.size > this.maxEnemies) {
            console.warn(`ENFORCING ENEMY LIMIT: Current count ${this.enemies.size} exceeds limit of ${this.maxEnemies}`);
            this.lifecycle.enforceEnemyLimit(this.enemies, this.maxEnemies, 
                (entity) => this.poolManager.returnEnemyToPool(entity, this.enemies));
        }
        
        // Debug logging - show current enemy count and spawn timer
        if (this.spawnTimer > this.spawnInterval * 0.9 || this.enemies.size === 0) {
            console.log(`Spawn status: ${this.enemies.size}/${this.maxEnemies} enemies, timer: ${this.spawnTimer.toFixed(1)}/${this.spawnInterval} seconds`);
        }
        
        // Update spawn timer and try to spawn new enemies
        this.spawner.update(deltaTime, this.enemies, this.maxEnemies, (spawnPoint) => {
            return this.spawnSpectralDrone(spawnPoint);
        });
        
        // FAILSAFE: If we have no enemies and it's been a while since spawning,
        // reset the enemy count and regenerate spawn points
        if (this.enemies.size === 0 && this.spawnTimer > this.spawnInterval * 2) {
            console.warn("FAILSAFE: No enemies detected for extended period. Resetting spawn system.");
            this.enemies.clear();
            this.spawner.generateSpawnPoints();
            this.spawnTimer = this.spawnInterval; // Force a spawn next frame
        }
    }
    
    /**
     * Update enemy parameters based on difficulty scaling from game object
     */
    updateDifficultyScaling() {
        // Check for horde mode first - it overrides normal difficulty scaling
        if (window.game && window.game.isHordeActive) {
            this.applyHordeModeScaling();
            return; // Skip normal difficulty scaling
        }
        
        // Default difficulty scaling
        if (window.game && window.game.difficultyManager && window.game.difficultyManager.params) {
            const diffParams = window.game.difficultyManager.params;
            
            // Update our parameters if they exist in the difficulty manager
            if (diffParams.maxEnemies !== undefined && this.maxEnemies !== diffParams.maxEnemies) {
                console.log(`Updating max enemies from ${this.maxEnemies} to ${diffParams.maxEnemies}`);
                this.maxEnemies = diffParams.maxEnemies;
            }
            
            if (diffParams.spawnInterval !== undefined && this.spawnInterval !== diffParams.spawnInterval) {
                console.log(`Updating spawn interval from ${this.spawnInterval} to ${diffParams.spawnInterval}`);
                this.spawnInterval = diffParams.spawnInterval;
            }
        }
    }
    
    /**
     * Apply horde mode scaling based on survival time
     * Dramatically increases difficulty over time to infinity
     */
    applyHordeModeScaling() {
        if (!window.game || window.game.hordeSurvivalTime === undefined) return;
        
        // Get survival time in seconds
        const survivalTime = window.game.hordeSurvivalTime / 1000;
        
        // Log scaling every 10 seconds
        if (Math.floor(survivalTime) % 10 === 0 && Math.floor(survivalTime) !== this.lastLoggedHordeTime) {
            this.lastLoggedHordeTime = Math.floor(survivalTime);
            console.log(`HORDE MODE: Scaling at ${survivalTime.toFixed(1)}s survival time`);
        }
        
        // Calculate scaling factors based on survival time
        const minutesPassed = survivalTime / 60;
        
        // 1. Max enemies: Start at 50, add 10 per minute, exponential scaling after 5 minutes
        const baseMaxEnemies = 50;
        let maxEnemiesScale;
        
        if (minutesPassed < 5) {
            // Linear scaling for first 5 minutes
            maxEnemiesScale = baseMaxEnemies + (minutesPassed * 10);
        } else {
            // Exponential scaling after 5 minutes: 100 * (1.2^(minutes-5))
            maxEnemiesScale = (baseMaxEnemies + 50) * Math.pow(1.2, minutesPassed - 5);
        }
        
        // Cap at a reasonable maximum to prevent performance issues
        this.maxEnemies = Math.min(Math.floor(maxEnemiesScale), 300);
        
        // 2. Spawn interval: Start at 1s, decrease to minimum of 0.2s
        const minSpawnInterval = 0.2;
        const baseSpawnInterval = 1.0;
        this.spawnInterval = Math.max(
            baseSpawnInterval * Math.pow(0.95, minutesPassed * 2),
            minSpawnInterval
        );
        
        // 3. Update enemy config in spawner if available
        if (this.spawner) {
            // Base values
            const baseHealth = 20;
            const baseDamage = 15;
            const baseSpeed = 700;
            
            // Calculate scaling multipliers
            const healthMultiplier = 1 + (minutesPassed * 0.5); // +50% per minute
            const damageMultiplier = 1 + (minutesPassed * 0.3); // +30% per minute
            const speedMultiplier = 1 + (minutesPassed * 0.2); // +20% per minute
            
            // Apply multipliers
            this.spawner.enemyConfig.health = Math.floor(baseHealth * healthMultiplier);
            this.spawner.enemyConfig.damage = Math.floor(baseDamage * damageMultiplier);
            this.spawner.enemyConfig.speed = baseSpeed * speedMultiplier;
            
            // Log scaling on 30-second intervals for debugging
            if (Math.floor(survivalTime) % 30 === 0 && Math.floor(survivalTime) !== this.lastFullLoggedHordeTime) {
                this.lastFullLoggedHordeTime = Math.floor(survivalTime);
                console.log(`HORDE MODE SCALING at ${Math.floor(survivalTime)}s:`);
                console.log(`  Max Enemies: ${this.maxEnemies}`);
                console.log(`  Spawn Interval: ${this.spawnInterval.toFixed(2)}s`);
                console.log(`  Enemy Health: ${this.spawner.enemyConfig.health}`);
                console.log(`  Enemy Damage: ${this.spawner.enemyConfig.damage}`);
                console.log(`  Enemy Speed: ${this.spawner.enemyConfig.speed.toFixed(1)}`);
            }
        }
    }
    
    /**
     * Process a single enemy entity
     * @param {Entity} entity Entity to process
     * @param {number} deltaTime Time since last update in seconds
     */
    processEntity(entity, deltaTime) {
        this.lifecycle.processEntityUpdate(entity, deltaTime);
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
        
        // IMPROVED CHECK: Retrieve entity ID first to ensure consistent reference
        const entityId = entity.id;
        
        // VERIFICATION: Check if this is an entity we're tracking
        const isTrackedEnemy = this.enemies.has(entityId);
        
        // IMPROVED CHECK: Look for either entity.hasTag('enemy') OR entity.id in this.enemies
        // This ensures we catch all cases where an enemy is destroyed
        if ((entity.hasTag && entity.hasTag('enemy')) || isTrackedEnemy) {
            console.log(`Enemy destroyed: ${entityId}`);
            
            // FIRST: Remove from tracking immediately to prevent double-processing
            if (isTrackedEnemy) {
                this.enemies.delete(entityId);
                console.log(`Removed entity ${entityId} from enemies tracking`);
            }
            
            // TRAIL CLEANUP: Ensure any trails are properly removed
            // This prevents the "line to center" visual bug
            const trailComponent = entity.getComponent('TrailComponent');
            if (trailComponent) {
                try {
                    // Call onDetached to clean up resources
                    if (typeof trailComponent.onDetached === 'function') {
                        trailComponent.onDetached();
                    }
                    
                    // Unregister from trail system if available
                    if (window.game && window.game.trailSystem) {
                        window.game.trailSystem.unregisterTrail && 
                        window.game.trailSystem.unregisterTrail(entityId);
                    }
                    
                    // If the trail has a mesh, remove it from the scene
                    if (trailComponent.trailMesh && trailComponent.trailMesh.parent) {
                        trailComponent.trailMesh.parent.remove(trailComponent.trailMesh);
                    }
                    
                    // Dispose of geometry and material
                    if (trailComponent.trailMesh) {
                        if (trailComponent.trailMesh.geometry) {
                            trailComponent.trailMesh.geometry.dispose();
                        }
                        if (trailComponent.trailMesh.material) {
                            trailComponent.trailMesh.material.dispose();
                        }
                    }
                    
                    // Remove the component from the entity
                    entity.removeComponent('TrailComponent');
                    console.log(`Cleaned up trail component for destroyed enemy ${entityId}`);
                } catch (error) {
                    console.error(`Error cleaning up trail for entity ${entityId}:`, error);
                }
            }
            
            // Clean up mesh resources before returning to pool
            const meshComponent = entity.getComponent('MeshComponent');
            if (meshComponent && meshComponent.mesh) {
                try {
                    // Remove from scene if it has a parent
                    if (meshComponent.mesh.parent) {
                        meshComponent.mesh.parent.remove(meshComponent.mesh);
                    }
                } catch (error) {
                    console.error(`Error cleaning up mesh for entity ${entityId}:`, error);
                }
            }
            
            // Increment destroyed counter
            this.enemiesDestroyed++;
            
            // Log remaining enemies
            console.log(`Enemy ${entityId} destroyed. Enemies remaining: ${this.enemies.size}/${this.maxEnemies}`);
            
            // ENSURE PROPER CLEANUP: Make sure entity doesn't have enemy tag
            if (entity.hasTag && entity.hasTag('enemy')) {
                console.log(`Explicitly removing 'enemy' tag from destroyed entity ${entityId}`);
                entity.removeTag('enemy');
            }
            
            // Check if this entity is incorrectly in the pool already
            let isInPool = false;
            for (let i = 0; i < this.poolManager.enemyPool.length; i++) {
                if (this.poolManager.enemyPool[i] && this.poolManager.enemyPool[i].id === entityId) {
                    console.warn(`CRITICAL ERROR: Destroyed entity ${entityId} is already in the pool!`);
                    this.poolManager.enemyPool.splice(i, 1);
                    console.log(`Removed entity ${entityId} from pool to prevent double-pooling`);
                    isInPool = true;
                    break;
                }
            }
            
            // Only return to pool if not already there
            if (!isInPool) {
                // Return the entity to the pool
                this.poolManager.returnEnemyToPool(entity, this.enemies);
                console.log(`Returned enemy ${entityId} to pool`);
            }
            
            // Force spawn point regeneration after several enemies have been destroyed
            if (this.enemiesDestroyed % 5 === 0) {
                console.log("Regenerating spawn points after multiple enemy destructions");
                this.spawner.generateSpawnPoints();
            }
            
            // CRITICAL: If this was the last enemy, make sure to reset the spawn timer
            // to avoid long waits for the next enemy
            if (this.enemies.size === 0) {
                console.log("All enemies destroyed - accelerating next spawn");
                // Set the timer to be almost at the spawn interval
                this.spawnTimer = Math.max(this.spawnTimer, this.spawnInterval * 0.8);
            }
            
            // Force validation to catch any remaining inconsistencies
            this.lifecycle.validateEnemyReferences(this.enemies);
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
            this.spawner.generateSpawnPoints(); // Regenerate spawn points
            this.spawnTimer = this.spawnInterval; // Force spawn soon
            
            // Validate enemy references
            this.lifecycle.validateEnemyReferences(this.enemies);
            
            console.log("Spawn system recovery completed");
        }
    }
    
    /**
     * Spawns a spectral drone at the given position - convenience method
     * @param {THREE.Vector3} position The position to spawn at
     * @returns {Entity} The created entity
     */
    spawnSpectralDrone(position) {
        return this.spawner.spawnSpectralDrone(position, this.poolManager, this.enemies, this.maxEnemies);
    }
    
    /**
     * Freeze all enemy entities in place - wrapper for lifecycle method
     */
    freezeAllEnemies() {
        this.lifecycle.freezeAllEnemies(this.enemies);
    }
    
    /**
     * Unfreeze all enemy entities and re-enable their AI - wrapper for lifecycle method
     */
    unfreezeAllEnemies() {
        this.lifecycle.unfreezeAllEnemies(this.enemies);
    }
}