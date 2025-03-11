/**
 * HealthComponent - Handles health, shield, and damage for entities
 * 
 * Manages health, shields, and damage application for both players and enemies
 */

import { Component } from '../../core/component.js';

export class HealthComponent extends Component {
    constructor(maxHealth = 100, maxShield = 0) {
        super();
        
        // Health properties
        this.maxHealth = maxHealth;
        this.health = maxHealth;
        
        // Shield properties
        this.maxShield = maxShield;
        this.shield = maxShield;
        this.shieldRegenRate = 5; // Shield points per second
        this.shieldRegenDelay = 3; // Seconds after damage before regeneration starts
        this.timeSinceLastDamage = this.shieldRegenDelay; // Start regenerating immediately
        
        // Resistance properties (damage reduction percentage)
        this.damageResistance = 0; // 0-1 range, 0.5 = 50% damage reduction
        
        // Status
        this.isDestroyed = false;
        this.isInvulnerable = false;
        
        console.log(`Created health component with ${maxHealth} max health and ${maxShield} max shield`);
    }
    
    // Add an onAttached method to subscribe to health sync events
    onAttached() {
        // Only subscribe for player entities
        if (this.entity && this.entity.hasTag && this.entity.hasTag('player')) {
            console.log("HealthComponent attached to player entity - subscribing to sync events");
            
            // Subscribe to health sync events on the message bus
            if (this.entity.world && this.entity.world.messageBus) {
                this.entity.world.messageBus.subscribe('player.syncHealth', this.handleSyncHealth.bind(this));
                this.entity.world.messageBus.subscribe('player.undocked', this.handleSyncHealth.bind(this));
                console.log("Subscribed to player.syncHealth and player.undocked events");
            } else if (window.mainMessageBus) {
                window.mainMessageBus.subscribe('player.syncHealth', this.handleSyncHealth.bind(this));
                window.mainMessageBus.subscribe('player.undocked', this.handleSyncHealth.bind(this));
                console.log("Subscribed to player.syncHealth and player.undocked events via mainMessageBus");
            }
        }
    }
    
    // Handle the sync health event
    handleSyncHealth(message) {
        // Only apply if this component is attached to a player entity
        if (!this.entity || !this.entity.hasTag || !this.entity.hasTag('player')) {
            return;
        }
        
        console.log("HealthComponent received syncHealth event:", message);
        
        // CRITICAL FIX: The message from MessageBus has a nested data property
        // Extract the actual sync data from the message
        const data = message.data || message;
        
        console.log("Extracted sync data:", data);
        
        // Update shield values if provided
        if (data.shield !== undefined) {
            const oldShield = this.shield;
            
            // SHIELD SYNC: Add additional logging to debug shield sync issues
            console.log(`SHIELD SYNC: HealthComponent shield was ${oldShield}, spaceship shield is ${data.shield}`);
            
            // Set shield value from spaceship
            this.shield = data.shield;
            
            console.log(`Updated shield: ${oldShield} → ${this.shield}`);
        } else {
            console.warn("Shield value not provided in sync data");
        }
        
        if (data.maxShield !== undefined) {
            const oldMaxShield = this.maxShield;
            this.maxShield = data.maxShield;
            console.log(`Updated maxShield: ${oldMaxShield} → ${this.maxShield}`);
        } else {
            console.warn("MaxShield value not provided in sync data");
        }
        
        // Update health values if provided
        if (data.hull !== undefined) {
            const oldHealth = this.health;
            this.health = data.hull;
            console.log(`Updated health: ${oldHealth} → ${this.health}`);
        } else {
            console.warn("Hull value not provided in sync data");
        }
        
        if (data.maxHull !== undefined) {
            const oldMaxHealth = this.maxHealth;
            this.maxHealth = data.maxHull;
            console.log(`Updated maxHealth: ${oldMaxHealth} → ${this.maxHealth}`);
        } else {
            console.warn("MaxHull value not provided in sync data");
        }
        
        console.log(`HealthComponent synced: Health ${this.health}/${this.maxHealth}, Shield ${this.shield}/${this.maxShield}`);
    }
    
    /**
     * Apply damage to this entity
     * @param {number} amount Amount of damage to apply
     * @param {string} type Type of damage (e.g., 'projectile', 'collision', 'emp')
     * @param {object} source Source entity of the damage
     * @returns {object} Damage result with actual damage dealt
     */
    applyDamage(amount, type = 'projectile', source = null) {
        // Debug logging
        console.log(`HealthComponent: Applying ${amount} damage of type ${type} to entity ${this.entity ? this.entity.id : 'unknown'}`);
        console.log(`Current health: ${this.health}/${this.maxHealth}, Shield: ${this.shield}/${this.maxShield}`);
        
        // Check if entity can be damaged
        if (this.isDestroyed || this.isInvulnerable) {
            console.log("Entity is destroyed or invulnerable, damage not applied");
            return { damageApplied: 0, shieldDamage: 0, healthDamage: 0, destroyed: false };
        }
        
        // Apply damage resistance
        const resistedAmount = amount * (1 - this.damageResistance);
        
        // Track how much damage was applied to shields vs health
        let shieldDamage = 0;
        let healthDamage = 0;
        
        // Reset shield regeneration timer
        this.timeSinceLastDamage = 0;
        
        // Apply damage to shield first if available
        if (this.shield > 0) {
            if (resistedAmount <= this.shield) {
                // Shield absorbs all damage
                this.shield -= resistedAmount;
                shieldDamage = resistedAmount;
            } else {
                // Damage breaks through shield
                shieldDamage = this.shield;
                healthDamage = resistedAmount - this.shield;
                this.shield = 0;
                this.health -= healthDamage;
            }
        } else {
            // No shield, apply damage directly to health
            this.health -= resistedAmount;
            healthDamage = resistedAmount;
        }
        
        // Ensure health doesn't go below 0
        if (this.health < 0) {
            this.health = 0;
        }
        
        // Check if entity is destroyed
        if (this.health <= 0 && !this.isDestroyed) {
            this.isDestroyed = true;
            
            // Notify entity destruction
            if (this.entity && this.entity.world) {
                this.entity.world.messageBus.publish('entity.destroyed', {
                    entity: this.entity,
                    source: source,
                    damageType: type
                });
                
                // Additional check for player entity - publish game over event
                if (this.entity.hasTag && this.entity.hasTag('player')) {
                    console.log("PLAYER HEALTH COMPONENT DESTROYED - TRIGGERING GAME OVER");
                    
                    console.log("HealthComponent: Initiating game over sequence");
                    
                    // Use direct world message bus
                    if (this.entity && this.entity.world && this.entity.world.messageBus) {
                        console.log("HealthComponent: Publishing game.over via world.messageBus");
                        this.entity.world.messageBus.publish('game.over', {
                            reason: "You were pwned by a space alien!",
                            source: "health"
                        });
                    } else {
                        // Import MessageBus to use the static method if needed
                        import('../../core/messageBus.js').then(module => {
                            const MessageBus = module.MessageBus;
                            console.log("HealthComponent: Using MessageBus.triggerGameOver");
                            
                            // Use the static method for handling
                            MessageBus.triggerGameOver("You were pwned by a space alien!", "health");
                        }).catch(err => {
                            console.error("Error importing MessageBus:", err);
                        });
                    }
                }
            }
        }
        
        // Notify about damage
        if (this.entity && this.entity.world) {
            this.entity.world.messageBus.publish('entity.damaged', {
                entity: this.entity,
                source: source,
                damageType: type,
                amount: resistedAmount,
                shieldDamage: shieldDamage,
                healthDamage: healthDamage
            });
        }
        
        // More debug logging 
        console.log(`After damage: Health: ${this.health}/${this.maxHealth}, Shield: ${this.shield}/${this.maxShield}`);
        console.log(`Entity destroyed: ${this.isDestroyed}`);
        
        return {
            damageApplied: resistedAmount,
            shieldDamage: shieldDamage,
            healthDamage: healthDamage,
            destroyed: this.isDestroyed
        };
    }
    
    /**
     * Heal the entity
     * @param {number} amount Amount to heal
     * @returns {number} Actual amount healed
     */
    heal(amount) {
        if (this.isDestroyed) return 0;
        
        const startHealth = this.health;
        this.health = Math.min(this.health + amount, this.maxHealth);
        
        const healedAmount = this.health - startHealth;
        
        if (healedAmount > 0 && this.entity && this.entity.world) {
            this.entity.world.messageBus.publish('entity.healed', {
                entity: this.entity,
                amount: healedAmount
            });
        }
        
        return healedAmount;
    }
    
    /**
     * Recharge the shield
     * @param {number} amount Amount to recharge
     * @returns {number} Actual amount recharged
     */
    rechargeShield(amount) {
        if (this.isDestroyed) return 0;
        
        const startShield = this.shield;
        this.shield = Math.min(this.shield + amount, this.maxShield);
        
        const rechargedAmount = this.shield - startShield;
        
        if (rechargedAmount > 0 && this.entity && this.entity.world) {
            this.entity.world.messageBus.publish('entity.shieldRecharged', {
                entity: this.entity,
                amount: rechargedAmount
            });
        }
        
        return rechargedAmount;
    }
    
    /**
     * Update shield and health regeneration
     * @param {number} deltaTime Time since last update in seconds
     */
    update(deltaTime) {
        if (this.isDestroyed) return;
        
        // Update timer since last damage
        this.timeSinceLastDamage += deltaTime;
        
        // Regenerate shields if enough time has passed since last damage
        if (this.timeSinceLastDamage >= this.shieldRegenDelay && this.shield < this.maxShield) {
            const regenAmount = this.shieldRegenRate * deltaTime;
            this.rechargeShield(regenAmount);
        }
        
        // Regenerate hull health slowly (only for player)
        if (this.entity && this.entity.hasTag('player') && this.health < this.maxHealth) {
            // Regenerate 5% of max health per second
            const healthRegenRate = this.maxHealth * 0.05;
            const healthRegenAmount = healthRegenRate * deltaTime;
            this.heal(healthRegenAmount);
        }
    }
    
    /**
     * Get health as a percentage (0-100)
     * @returns {number} Health percentage
     */
    getHealthPercentage() {
        return (this.health / this.maxHealth) * 100;
    }
    
    /**
     * Get shield as a percentage (0-100)
     * @returns {number} Shield percentage
     */
    getShieldPercentage() {
        return this.maxShield > 0 ? (this.shield / this.maxShield) * 100 : 0;
    }
    
    /**
     * Upgrade health capacity and fully heal
     * @param {number} multiplier Multiplier for health increase
     * @returns {object} New health stats
     */
    upgradeHealth(multiplier = 1.25) {
        const oldMax = this.maxHealth;
        this.maxHealth *= multiplier;
        this.health = this.maxHealth; // Full heal on upgrade
        
        console.log(`Upgraded health from ${oldMax.toFixed(1)} to ${this.maxHealth.toFixed(1)}`);
        
        // Notify upgrade
        if (this.entity && this.entity.world) {
            this.entity.world.messageBus.publish('health.upgraded', {
                entity: this.entity,
                oldMax: oldMax,
                newMax: this.maxHealth
            });
        }
        
        return {
            maxHealth: this.maxHealth,
            healthBoost: this.maxHealth - oldMax
        };
    }
    
    /**
     * Upgrade shield capacity
     * @param {number} multiplier Multiplier for shield increase
     * @returns {object} New shield stats
     */
    upgradeShield(multiplier = 1.5) {
        console.log(`===== SHIELD UPGRADE INITIATED =====`);
        console.log(`Current shield values - Max: ${this.maxShield}, Current: ${this.shield}`);
        
        const oldMax = this.maxShield;
        const oldShield = this.shield;
        
        // Increase max shield
        this.maxShield = Math.ceil(this.maxShield * multiplier);
        
        // Full recharge on upgrade - this is the original behavior
        this.shield = this.maxShield;
        
        console.log(`Upgraded shield from ${oldMax.toFixed(1)} to ${this.maxShield.toFixed(1)}`);
        console.log(`Current shield value changed from ${oldShield.toFixed(1)} to ${this.shield.toFixed(1)}`);
        console.log(`===== SHIELD UPGRADE COMPLETED =====`);
        
        // Notify upgrade
        if (this.entity && this.entity.world) {
            this.entity.world.messageBus.publish('shield.upgraded', {
                entity: this.entity,
                oldMax: oldMax,
                newMax: this.maxShield
            });
        }
        
        return {
            maxShield: this.maxShield,
            shieldBoost: this.maxShield - oldMax
        };
    }
}