/**
 * HealthSystem - Manages entities with health components
 * 
 * This system handles health updates, death processing, and damage visualization.
 */

import { System } from '../../core/system.js';

export class HealthSystem extends System {
    constructor(world) {
        super(world);
        
        // Required components for entities this system processes
        this.requiredComponents = ['HealthComponent'];
        
        // Reference to UI for health displays
        this.ui = null;
        
        // Reference to player entity
        this.player = null;
        
        // Subscribe to relevant events
        this.world.messageBus.subscribe('player.created', this.handlePlayerCreated.bind(this));
        this.world.messageBus.subscribe('ui.created', this.handleUICreated.bind(this));
        this.world.messageBus.subscribe('entity.damaged', this.handleEntityDamaged.bind(this));
        this.world.messageBus.subscribe('entity.died', this.handleEntityDied.bind(this));
        this.world.messageBus.subscribe('entity.healed', this.handleEntityHealed.bind(this));
        this.world.messageBus.subscribe('entity.shieldRecharged', this.handleShieldRecharged.bind(this));
    }
    
    /**
     * Initialize the health system
     */
    initialize() {
        console.log('Health System initialized');
    }
    
    /**
     * Handle player entity creation
     * @param {Object} data Event data
     */
    handlePlayerCreated(data) {
        this.player = data.entity;
        this.updatePlayerUI();
    }
    
    /**
     * Handle UI creation
     * @param {Object} data Event data
     */
    handleUICreated(data) {
        this.ui = data.ui;
        this.updatePlayerUI();
    }
    
    /**
     * Update player UI with current health/shield values
     */
    updatePlayerUI() {
        if (!this.player || !this.ui) return;
        
        const health = this.player.getComponent('HealthComponent');
        if (!health) return;
        
        this.ui.updateHealthDisplay(
            health.health,
            health.maxHealth,
            health.shield,
            health.maxShield
        );
    }
    
    /**
     * Handle entity damaged event
     * @param {Object} data Event data
     */
    handleEntityDamaged(data) {
        const { entity, healthDamage, shieldDamage, remainingHealth, remainingShield } = data;
        
        // Check if this is the player
        if (entity === this.player && this.ui) {
            // Update player UI
            this.ui.updateHealthDisplay(
                remainingHealth,
                entity.getComponent('HealthComponent').maxHealth,
                remainingShield,
                entity.getComponent('HealthComponent').maxShield
            );
            
            // Show damage effect in UI
            if (healthDamage > 0) {
                this.ui.showDamageEffect();
            }
            
            // Show low health warning if health is low
            const healthComponent = entity.getComponent('HealthComponent');
            if (healthComponent && healthComponent.getHealthPercentage() < 25) {
                this.ui.showLowHealthWarning();
            }
        }
        
        // Visual effects for damaged entity
        this.applyDamageVisualEffects(entity, healthDamage + shieldDamage);
    }
    
    /**
     * Handle entity died event
     * @param {Object} data Event data
     */
    handleEntityDied(data) {
        const { entity } = data;
        
        // Player death handling
        if (entity === this.player) {
            console.log('Player died');
            
            // Show death UI
            if (this.ui) {
                this.ui.showDeathScreen();
            }
            
            // Disable controls
            this.world.messageBus.publish('controls.disable', {});
            
            // After a delay, respawn player
            setTimeout(() => {
                this.respawnPlayer();
            }, 3000);
        } else {
            // Handle non-player entity death
            this.handleNonPlayerDeath(entity);
        }
    }
    
    /**
     * Handle entity healed event
     * @param {Object} data Event data
     */
    handleEntityHealed(data) {
        const { entity, health, maxHealth } = data;
        
        // Update UI if player
        if (entity === this.player && this.ui) {
            const healthComponent = entity.getComponent('HealthComponent');
            if (healthComponent) {
                this.ui.updateHealthDisplay(
                    health,
                    maxHealth,
                    healthComponent.shield,
                    healthComponent.maxShield
                );
            }
        }
    }
    
    /**
     * Handle entity shield recharged event
     * @param {Object} data Event data
     */
    handleShieldRecharged(data) {
        const { entity, shield, maxShield } = data;
        
        // Update UI if player
        if (entity === this.player && this.ui) {
            const healthComponent = entity.getComponent('HealthComponent');
            if (healthComponent) {
                this.ui.updateHealthDisplay(
                    healthComponent.health,
                    healthComponent.maxHealth,
                    shield,
                    maxShield
                );
            }
        }
    }
    
    /**
     * Apply visual effects to damaged entity
     * @param {Entity} entity The damaged entity
     * @param {number} damageAmount Amount of damage taken
     */
    applyDamageVisualEffects(entity, damageAmount) {
        // Get model component if exists
        const modelComponent = entity.getComponent('ModelComponent');
        if (!modelComponent || !modelComponent.model) return;
        
        // Flash the model red
        const originalMaterials = [];
        const materials = Array.isArray(modelComponent.model.material) ? 
            modelComponent.model.material : [modelComponent.model.material];
        
        // Store original colors
        materials.forEach(material => {
            if (material) {
                originalMaterials.push({
                    material: material,
                    originalColor: material.color ? material.color.clone() : null,
                    originalEmissive: material.emissive ? material.emissive.clone() : null
                });
                
                // Set to red
                if (material.emissive) {
                    material.emissive.setRGB(0.5, 0, 0);
                }
            }
        });
        
        // Reset after a short delay
        setTimeout(() => {
            originalMaterials.forEach(item => {
                if (item.material) {
                    if (item.originalEmissive && item.material.emissive) {
                        item.material.emissive.copy(item.originalEmissive);
                    }
                }
            });
        }, 100);
    }
    
    /**
     * Handle non-player entity death
     * @param {Entity} entity The entity that died
     */
    handleNonPlayerDeath(entity) {
        // Get entity type from tags
        const isAsteroid = entity.hasTag('asteroid');
        const isEnemy = entity.hasTag('enemy');
        
        if (isAsteroid) {
            // Asteroid destruction effects
            this.createAsteroidDestructionEffects(entity);
        } else if (isEnemy) {
            // Enemy destruction effects
            this.createEnemyDestructionEffects(entity);
        }
        
        // Remove entity from world after a short delay
        setTimeout(() => {
            this.world.removeEntity(entity);
        }, 1000);
    }
    
    /**
     * Create asteroid destruction effects
     * @param {Entity} asteroid The destroyed asteroid
     */
    createAsteroidDestructionEffects(asteroid) {
        // Get asteroid position
        const transform = asteroid.getComponent('Transform');
        if (!transform) return;
        
        // Create explosion particle effect
        this.world.messageBus.publish('effects.explosion', {
            position: transform.position,
            scale: 1.0,
            color: 0xCCCCCC,
            duration: 1.0,
            count: 30
        });
        
        // Drop resources
        this.world.messageBus.publish('asteroid.destroyed', {
            entity: asteroid,
            position: transform.position
        });
    }
    
    /**
     * Create enemy destruction effects
     * @param {Entity} enemy The destroyed enemy
     */
    createEnemyDestructionEffects(enemy) {
        // Get enemy position
        const transform = enemy.getComponent('Transform');
        if (!transform) return;
        
        // Create explosion particle effect
        this.world.messageBus.publish('effects.explosion', {
            position: transform.position,
            scale: 1.5,
            color: 0xFF5500,
            duration: 1.5,
            count: 50
        });
        
        // Add score
        this.world.messageBus.publish('score.enemyDestroyed', {
            entity: enemy
        });
    }
    
    /**
     * Respawn the player
     */
    respawnPlayer() {
        if (!this.player) return;
        
        // Get health component
        const health = this.player.getComponent('HealthComponent');
        if (!health) return;
        
        // Resurrect player with partial health/shield
        health.resurrect(50, 25);
        
        // Reset player position
        const transform = this.player.getComponent('Transform');
        if (transform) {
            transform.position.set(0, 2000, 0);
            transform.rotation.set(0, 0, 0, 1);
        }
        
        // Re-enable player controls
        this.world.messageBus.publish('controls.enable', {});
        
        // Hide death screen
        if (this.ui) {
            this.ui.hideDeathScreen();
            this.ui.showRespawnMessage();
        }
        
        // Give temporary invulnerability
        health.isInvulnerable = true;
        setTimeout(() => {
            health.isInvulnerable = false;
        }, 3000);
        
        console.log('Player respawned');
    }
    
    /**
     * Process entity with health component
     * @param {Entity} entity Entity to process
     * @param {number} deltaTime Time since last update
     */
    processEntity(entity, deltaTime) {
        const health = entity.getComponent('HealthComponent');
        if (!health) return;
        
        // Update health component
        health.update(deltaTime);
    }
    
    /**
     * Update method called each frame
     * @param {number} deltaTime Time elapsed since last update
     */
    update(deltaTime) {
        // Process all entities with health components
        const entities = this.world.getEntitiesByComponents(this.requiredComponents);
        for (const entity of entities) {
            this.processEntity(entity, deltaTime);
        }
    }
} 