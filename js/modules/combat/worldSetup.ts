/**
 * World Setup Module - Handles ECS World construction and scene setup
 * 
 * This module contains all the logic for creating and initializing the ECS world,
 * including the player reference entity and basic world configuration.
 */

import { World } from '../../core/world.ts';
import * as THREE from 'three';

export class WorldSetup {
    world: any = null;
    playerEntity: any = null;
    worldInitialized: boolean = false;

    constructor() {
    }

    /**
     * Initialize the ECS world asynchronously
     * This is called from the constructor and runs in the background
     */
    async initializeECSWorld(scene: THREE.Scene, spaceship: any): Promise<any> {
        try {
            console.log("[COMBAT] Starting ECS world initialization...");
            
            // Create a new World instance immediately to allow references
            this.world = new World((window as any).mainMessageBus);
            console.log("[COMBAT] Created world with messageBus: ", 
                        this.world.messageBus === (window as any).mainMessageBus ? "Using shared messageBus" : "Created new messageBus");
            
            // Make world globally available immediately
            if ((window as any).game) {
                (window as any).game.ecsWorld = this.world;
                console.log("[COMBAT] Made ECS world globally available via window.game.ecsWorld");
            }
            
            // Store scene reference in world for systems that need it
            this.world.scene = scene;
            
            // Log scene reference for debugging
            console.log(`[COMBAT] Set scene reference in ECS world for enemy rendering:`, 
                       scene ? "Scene available" : "No scene available");
            
            // Create player entity immediately - don't wait for full setup
            await this.createPlayerReferenceEntity(spaceship);
            
            // Create optimized projectile store
            if (!this.world.optimizedProjectiles) {
                try {
                    const { OptimizedProjectileStore } = await import('../../core/optimized/OptimizedProjectileStore.ts');
                    this.world.optimizedProjectiles = new OptimizedProjectileStore(4096);
                    console.log('[COMBAT] OptimizedProjectileStore created');
                } catch (e) {
                    console.warn('[COMBAT] OptimizedProjectileStore unavailable:', e);
                }
            }
            
            console.log("[COMBAT] ECS world initialization complete");
            return this.world;
        } catch (error) {
            console.error("[COMBAT] Error initializing ECS world:", error);
            throw error;
        }
    }

    /**
     * Create a player reference entity in the ECS world
     * This allows enemies and other systems to interact with the player
     */
    async createPlayerReferenceEntity(spaceship: any): Promise<any> {
        if (!this.world) {
            console.error("[COMBAT] Cannot create player entity - world not available");
            return null;
        }
        
        if (!spaceship) {
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
                    if (transform && spaceship.mesh) {
                        transform.position.copy(spaceship.mesh.position);
                        transform.rotation.copy(spaceship.mesh.rotation);
                        transform.quaternion.copy(spaceship.mesh.quaternion);
                        if (typeof transform.setUpdated === 'function') {
                            transform.setUpdated();
                        }
                    }
                    
                    // Make it globally accessible
                    if ((window as any).game) {
                        (window as any).game.combat = (window as any).game.combat || {};
                        (window as any).game.combat.playerEntity = existingEntity;
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
            let TransformComponent: any, HealthComponent: any;
            
            try {
                const transformModule = await import('../../components/transform.js');
                TransformComponent = transformModule.TransformComponent;
                console.log("[COMBAT] Successfully imported TransformComponent");
            } catch (error) {
                console.error("[COMBAT] Failed to import TransformComponent:", error);
                // Create a minimal fallback if import fails
                TransformComponent = class FallbackTransform {
                    position: THREE.Vector3;
                    rotation: THREE.Euler;
                    quaternion: THREE.Quaternion;
                    constructor(position?: THREE.Vector3) { 
                        this.position = position || new THREE.Vector3();
                        this.rotation = new THREE.Euler();
                        this.quaternion = new THREE.Quaternion();
                    }
                };
            }
            
            try {
                const healthModule = await import('../../components/combat/healthComponent.js');
                HealthComponent = healthModule.HealthComponent;
                console.log("[COMBAT] Successfully imported HealthComponent");
            } catch (error) {
                console.error("[COMBAT] Failed to import HealthComponent:", error);
                // Create a minimal fallback if import fails
                HealthComponent = class FallbackHealth {
                    health: number;
                    shield: number;
                    maxHealth: number;
                    maxShield: number;
                    constructor(health?: number, shield?: number) {
                        this.health = health || 100;
                        this.shield = shield || 50;
                        this.maxHealth = health || 100;
                        this.maxShield = shield || 50;
                    }
                };
            }
            
            // Add transform component linked to spaceship position
            try {
                const position = spaceship.mesh ? spaceship.mesh.position.clone() : new THREE.Vector3();
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
            if ((window as any).game) {
                (window as any).game.combat = (window as any).game.combat || {};
                (window as any).game.combat.playerEntity = playerEntity;
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
            console.error("[COMBAT] Stack trace:", (error as Error).stack);
            return null;
        }
    }

    /**
     * Update the player reference entity with the current spaceship position
     */
    updatePlayerReference(spaceship: any): void {
        // Skip if missing references
        if (!this.world || !spaceship || !this.playerEntity) {
            // If we don't have a player entity, try to create one now if world is ready
            if (this.world && spaceship && !this.playerEntity) {
                console.log("No player entity found, creating one...");
                this.createPlayerReferenceEntity(spaceship);
                return;
            }
            return;
        }
        
        // Get the player entity
        const playerEntity = this.world.getEntity(this.playerEntity.id);
        
        // If entity was somehow lost, recreate it
        if (!playerEntity) {
            console.warn("Player entity lost, recreating...");
            this.createPlayerReferenceEntity(spaceship);
            return;
        }
        
        // Update transform component with current spaceship position
        const transform = playerEntity.getComponent('TransformComponent');
        if (transform && spaceship.mesh) {
            // Update position
            transform.position.copy(spaceship.mesh.position);
            
            // Update rotation
            transform.rotation.copy(spaceship.mesh.rotation);
            transform.quaternion.copy(spaceship.mesh.quaternion);
            
            // Mark transform as updated to trigger any listening systems
            if (typeof transform.setUpdated === 'function') {
                transform.setUpdated();
            }
        }
        
        // Update health component if spaceship has relevant health info
        const health = playerEntity.getComponent('HealthComponent');
        if (health && spaceship.health !== undefined) {
            // Only update health if it would be higher - don't override damage
            if (spaceship.health > health.health) {
                health.health = spaceship.health;
            }
            
            // Only update shield if it would be higher - don't override damage
            if (spaceship.shield !== undefined && spaceship.shield > health.shield) {
                health.shield = spaceship.shield;
            }
        }
    }

    /**
     * Sync the spaceship hull/shield with the player entity's HealthComponent
     */
    updateSpaceshipHealth(spaceship: any): void {
        if (!this.playerEntity || !spaceship) return;
        
        // Get health component
        const health = this.playerEntity.getComponent('HealthComponent');
        if (health) {
            // IMPORTANT: Only update spaceship health if the health component shows MORE damage
            // (less health) than the spaceship currently has - this means damage was applied to the component
            if (health.health < spaceship.hull) {
                console.log(`Damage detected in health component: ${health.health} (was ${spaceship.hull})`);
                spaceship.hull = health.health;
            }
            
            // Similarly for shield
            if (health.shield < spaceship.shield) {
                console.log(`Shield damage detected in health component: ${health.shield} (was ${spaceship.shield})`);
                spaceship.shield = health.shield;
            }
            
            // Check if health indicates the ship is destroyed
            if (health.isDestroyed && !spaceship.isDestroyed) {
                console.log("Health component indicates player is destroyed - updating spaceship state");
                spaceship.isDestroyed = true;
                
                // Call handle destruction for visual effects
                if (typeof spaceship.handleDestruction === 'function') {
                    spaceship.handleDestruction();
                }
            }
            
            // Check for low health and update spaceship directly
            if (health.health <= 0 && !spaceship.isDestroyed) {
                console.log("Player health is zero - marking spaceship as destroyed");
                spaceship.isDestroyed = true;
                
                // Call handle destruction for visual effects
                if (typeof spaceship.handleDestruction === 'function') {
                    spaceship.handleDestruction();
                }
                
                // Force game over with a "pwned by space alien" message
                if ((window as any).game) {
                    console.log("FORCING GAME OVER FROM COMBAT MODULE!");
                    (window as any).game.gameOver("You were pwned by a space alien!");
                }
            }
        }
    }

    /**
     * Initialize the world
     */
    initializeWorld(): void {
        try {
            console.log("[COMBAT] Calling world.initialize()...");
            this.world.initialize();
            console.log("[COMBAT] World initialization completed successfully");
        } catch (error) {
            console.error("[COMBAT] Error during world.initialize():", error);
            console.error("[COMBAT] Stack trace:", (error as Error).stack);
            
            // Continue execution - don't let this error stop us
            console.log("[COMBAT] Continuing despite initialization error");
        }
    }

    /**
     * Mark world as initialized
     */
    setWorldInitialized(): void {
        this.worldInitialized = true;
    }

    /**
     * Set reference to this world in the scene for cross-component access
     */
    setSceneReference(scene: THREE.Scene): void {
        if (scene) {
            (scene as any).ecsWorld = this.world;
            console.log("[COMBAT] Set ECS world reference in scene for cross-system access");
        }
    }

    /**
     * Get the world instance
     */
    getWorld(): any {
        return this.world;
    }

    /**
     * Get the player entity
     */
    getPlayerEntity(): any {
        return this.playerEntity;
    }

    /**
     * Check if world is initialized
     */
    isWorldInitialized(): boolean {
        return this.worldInitialized;
    }
}
