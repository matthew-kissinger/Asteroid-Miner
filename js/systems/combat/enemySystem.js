/**
 * EnemySystem - Manages enemy entities and their AI behavior
 * 
 * Handles enemy spawning, AI updates, and combat interactions.
 * This is a simplified version that only implements spectral drones.
 */

import * as THREE from 'three';
import { System } from '../../core/system.ts';
import { TrailComponent } from '../../components/rendering/trail.js';
import { MeshComponent } from '../../components/rendering/mesh.js';

// Import the existing modularized components
import { EnemyPoolManager } from './enemyPoolManager.js';
import { EnemySpawner } from './enemySpawner.js';
import { EnemyLifecycle } from './enemyLifecycle.js';

// Import the new extracted modules
import { SeparationBehavior } from './enemy/behaviors/separationBehavior.js';
import { DifficultyScaling } from './enemy/state/difficultyScaling.js';
import { DockingManager } from './enemy/state/dockingManager.js';
import { SpawnMonitoring } from './enemy/updates/spawnMonitoring.js';
// InitialSpawning removed - delay is now handled by SpawnScheduler

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
        
        // Initial spawn delay is now handled by the SpawnScheduler (60 seconds)
        // This ensures consistent timing across the enemy spawning system
        
        // Initialize the managers for different aspects of enemy handling
        this.poolManager = new EnemyPoolManager(world);
        this.spawner = new EnemySpawner(world);
        this.lifecycle = new EnemyLifecycle(world);
        
        // Initialize extracted modules
        this.separationBehavior = new SeparationBehavior();
        this.difficultyScaling = new DifficultyScaling();
        this.dockingManager = new DockingManager();
        this.spawnMonitoring = new SpawnMonitoring();
        // InitialSpawning removed - delay now handled by SpawnScheduler
        
        // Destroyed enemies counter
        this.enemiesDestroyed = 0;
        
        // Set up event listeners through docking manager
        this.setupEventListeners();
        
        // Initialize with a clean enemy count
        this.lifecycle.clearAllEnemies(this.enemies);
        
        // Force validation to ensure we start with empty tracking
        this.lifecycle.validateEnemyReferences(this.enemies);
        
        // Start continuous monitoring for spawn health
        this.spawnMonitoring.startSpawnMonitoring(this);
        
        
        // Make skip delay function globally available for testing
        if (typeof window !== 'undefined') {
            window.skipEnemyDelay = () => {
                this.spawner.skipInitialDelay();
            };
        }
    }
    
    /**
     * Set up event listeners for enemy-related events
     */
    setupEventListeners() {
        // Listen for entity.destroyed events to track destroyed enemies
        this.world.messageBus.subscribe('entity.destroyed', this.handleEntityDestroyed.bind(this));
        
        // Set up docking event listeners through docking manager
        this.dockingManager.setupEventListeners(
            this.world,
            () => this.lifecycle.freezeAllEnemies(this.enemies),
            () => this.lifecycle.unfreezeAllEnemies(this.enemies)
        );
    }
    
    
    /**
     * Update all enemy entities
     * @param {number} deltaTime Time since last update in seconds
     */
    update(deltaTime) {
        
        // Sync docking state and skip processing if docked
        this.dockingManager.syncGlobalDockingState(
            () => this.lifecycle.freezeAllEnemies(this.enemies),
            () => this.lifecycle.unfreezeAllEnemies(this.enemies)
        );
        
        if (this.dockingManager.isPlayerDocked()) {
            return;
        }
        
        // Check intro sequence state
        const introActive = window.game && window.game.introSequenceActive;
        if (introActive) {
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
        this.difficultyScaling.updateDifficultyScaling(this);
        
        // STRICT ENFORCEMENT: If we're over the limit, force destroy excess enemies
        if (this.enemies.size > this.maxEnemies) {
            this.lifecycle.enforceEnemyLimit(this.enemies, this.maxEnemies, 
                (entity) => this.poolManager.returnEnemyToPool(entity, this.enemies));
        }
        
        // Initial spawn delay is now handled by the SpawnScheduler in the spawner
        // This ensures consistent 60-second delay across the system
        
        // Debug logging - show current enemy count and spawn timer (disabled to reduce console spam)
        // if (this.spawnTimer > this.spawnInterval * 0.9 || this.enemies.size === 0) {
        // }
        
        // Update spawn timer and try to spawn new enemies
        const spawnResult = this.spawner.update(deltaTime, this.enemies, this.maxEnemies, (spawnPoint) => {
            return this.spawnSpectralDrone(spawnPoint);
        });
        
        if (spawnResult) {
        }
        
        // FAILSAFE: Check for spawn system problems
        this.spawnMonitoring.performFailsafeCheck(this);
    }
    
    
    /**
     * Process a single enemy entity
     * @param {Entity} entity Entity to process
     * @param {number} deltaTime Time since last update in seconds
     */
    processEntity(entity, deltaTime) {
        // Call the existing lifecycle processing
        this.lifecycle.processEntityUpdate(entity, deltaTime);
        
        // Apply separation behavior to avoid overlapping with other enemies
        this.separationBehavior.applySeparationBehavior(entity, deltaTime, this.enemies, this.world);
    }
    
    
    /**
     * Handle entity destroyed event
     * @param {object} message Event message
     */
    handleEntityDestroyed(message) {
        // Check if the destroyed entity is one of our enemies
        const entity = message.entity;
        if (!entity) {
            return;
        }
        
        // IMPROVED CHECK: Retrieve entity ID first to ensure consistent reference
        const entityId = entity.id;
        
        // VERIFICATION: Check if this is an entity we're tracking
        const isTrackedEnemy = this.enemies.has(entityId);
        
        // IMPROVED CHECK: Look for either entity.hasTag('enemy') OR entity.id in this.enemies
        // This ensures we catch all cases where an enemy is destroyed
        if ((entity.hasTag && entity.hasTag('enemy')) || isTrackedEnemy) {
            
            // FIRST: Remove from tracking immediately to prevent double-processing
            if (isTrackedEnemy) {
                this.enemies.delete(entityId);
            }
            
            // TRAIL CLEANUP: Ensure any trails are properly removed
            // This prevents the "line to center" visual bug
            const trailComponent = entity.getComponent(TrailComponent);
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
                } catch (error) {
                }
            }
            
            // Clean up mesh resources before returning to pool
            const meshComponent = entity.getComponent(MeshComponent);
            if (meshComponent && meshComponent.mesh) {
                try {
                    // Remove from scene if it has a parent
                    if (meshComponent.mesh.parent) {
                        meshComponent.mesh.parent.remove(meshComponent.mesh);
                    }
                } catch (error) {
                }
            }
            
            // Increment destroyed counter
            this.enemiesDestroyed++;
            
            // Log remaining enemies
            
            // ENSURE PROPER CLEANUP: Make sure entity doesn't have enemy tag
            if (entity.hasTag && entity.hasTag('enemy')) {
                entity.removeTag('enemy');
            }
            
            // Check if this entity is incorrectly in the pool already
            let isInPool = false;
            for (let i = 0; i < this.poolManager.enemyPool.length; i++) {
                if (this.poolManager.enemyPool[i] && this.poolManager.enemyPool[i].id === entityId) {
                    this.poolManager.enemyPool.splice(i, 1);
                    isInPool = true;
                    break;
                }
            }
            
            // Only return to pool if not already there
            if (!isInPool) {
                // Return the entity to the pool
                this.poolManager.returnEnemyToPool(entity, this.enemies);
            }
            
            // Force spawn point regeneration after several enemies have been destroyed
            if (this.enemiesDestroyed % 5 === 0) {
                this.spawner.generateSpawnPoints();
            }
            
            // CRITICAL: If this was the last enemy, make sure to reset the spawn timer
            // to avoid long waits for the next enemy
            if (this.enemies.size === 0) {
                // Set the timer to be almost at the spawn interval
                this.spawnTimer = Math.max(this.spawnTimer, this.spawnInterval * 0.8);
                // Update spawn monitoring
                this.spawnMonitoring.updateLastSpawnTime();
            }
            
            // Force validation to catch any remaining inconsistencies
            this.lifecycle.validateEnemyReferences(this.enemies);
        }
    }
    
    /**
     * Called when the system is disabled
     */
    onDisabled() {
        // Stop spawn monitoring
        this.spawnMonitoring.stopSpawnMonitoring();
        
        // Clean up any tracked enemies
        this.enemies.clear();
        
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