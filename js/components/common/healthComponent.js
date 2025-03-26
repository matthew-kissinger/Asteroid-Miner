/**
 * HealthComponent - Handles health, shields, and damage for entities
 * 
 * This component manages health state, shields, damage reception, and death handling.
 */

import { Component } from '../../core/component.js';

export class HealthComponent extends Component {
    constructor(health = 100, shield = 100) {
        super();
        
        // Health properties
        this.health = health;
        this.maxHealth = health;
        
        // Shield properties
        this.shield = shield;
        this.maxShield = shield;
        this.shieldRechargeRate = 5; // Points per second
        this.shieldRechargeDelay = 3; // Seconds after damage before recharge starts
        this.timeSinceLastDamage = this.shieldRechargeDelay; // Start able to recharge
        
        // Status flags
        this.isInvulnerable = false;
        this.isDead = false;
        
        // Damage flash effect properties
        this.damageFlashDuration = 0.2; // Duration of damage flash in seconds
        this.damageFlashIntensity = 0; // Current flash intensity (0-1)
        this.isFlashing = false;
    }
    
    /**
     * Take damage
     * @param {number} amount Amount of damage to take
     * @param {string} damageType Type of damage (useful for resistances)
     * @param {Entity} source Entity that caused the damage (if any)
     * @returns {Object} Damage report with health/shield values and whether entity died
     */
    takeDamage(amount, damageType = 'default', source = null) {
        if (this.isInvulnerable || this.isDead) {
            return {
                damageAbsorbed: 0,
                shieldDamage: 0,
                healthDamage: 0,
                remainingHealth: this.health,
                remainingShield: this.shield,
                died: false
            };
        }
        
        // Reset shield recharge timer
        this.timeSinceLastDamage = 0;
        
        // Calculate actual damage based on type (could implement resistances here)
        let actualDamage = amount;
        let shieldDamage = 0;
        let healthDamage = 0;
        
        // Apply damage to shield first
        if (this.shield > 0) {
            shieldDamage = Math.min(this.shield, actualDamage);
            this.shield -= shieldDamage;
            actualDamage -= shieldDamage;
        }
        
        // Apply remaining damage to health
        if (actualDamage > 0) {
            healthDamage = actualDamage;
            this.health -= healthDamage;
        }
        
        // Start damage flash effect
        this.startDamageFlash();
        
        // Check if entity died
        const died = this.health <= 0;
        if (died) {
            this.health = 0;
            this.die();
        }
        
        // Publish damage event
        if (this.entity && this.entity.world) {
            this.entity.world.messageBus.publish('entity.damaged', {
                entity: this.entity,
                damageAmount: amount,
                shieldDamage: shieldDamage,
                healthDamage: healthDamage,
                remainingHealth: this.health,
                remainingShield: this.shield,
                damageType: damageType,
                source: source,
                died: died
            });
        }
        
        return {
            damageAbsorbed: shieldDamage + healthDamage,
            shieldDamage: shieldDamage,
            healthDamage: healthDamage,
            remainingHealth: this.health,
            remainingShield: this.shield,
            died: died
        };
    }
    
    /**
     * Heal the entity
     * @param {number} amount Amount to heal
     * @param {boolean} overHeal Whether to allow healing above max health
     * @returns {number} Amount of health restored
     */
    heal(amount, overHeal = false) {
        if (this.isDead) return 0;
        
        const oldHealth = this.health;
        
        if (overHeal) {
            this.health += amount;
        } else {
            this.health = Math.min(this.health + amount, this.maxHealth);
        }
        
        const healedAmount = this.health - oldHealth;
        
        // Publish heal event
        if (healedAmount > 0 && this.entity && this.entity.world) {
            this.entity.world.messageBus.publish('entity.healed', {
                entity: this.entity,
                healAmount: healedAmount,
                health: this.health,
                maxHealth: this.maxHealth
            });
        }
        
        return healedAmount;
    }
    
    /**
     * Recharge the shield
     * @param {number} amount Amount to recharge
     * @param {boolean} overCharge Whether to allow charging above max shield
     * @returns {number} Amount of shield restored
     */
    rechargeShield(amount, overCharge = false) {
        if (this.isDead) return 0;
        
        const oldShield = this.shield;
        
        if (overCharge) {
            this.shield += amount;
        } else {
            this.shield = Math.min(this.shield + amount, this.maxShield);
        }
        
        const rechargedAmount = this.shield - oldShield;
        
        // Publish recharge event
        if (rechargedAmount > 0 && this.entity && this.entity.world) {
            this.entity.world.messageBus.publish('entity.shieldRecharged', {
                entity: this.entity,
                rechargeAmount: rechargedAmount,
                shield: this.shield,
                maxShield: this.maxShield
            });
        }
        
        return rechargedAmount;
    }
    
    /**
     * Handle entity death
     */
    die() {
        if (this.isDead) return; // Prevent double-death
        
        this.isDead = true;
        this.health = 0;
        this.shield = 0;
        
        // Publish death event
        if (this.entity && this.entity.world) {
            this.entity.world.messageBus.publish('entity.died', {
                entity: this.entity
            });
        }
    }
    
    /**
     * Resurrect the entity
     * @param {number} healthPercentage Percentage of max health to restore (0-100)
     * @param {number} shieldPercentage Percentage of max shield to restore (0-100)
     */
    resurrect(healthPercentage = 100, shieldPercentage = 100) {
        if (!this.isDead) return;
        
        this.isDead = false;
        this.health = this.maxHealth * (healthPercentage / 100);
        this.shield = this.maxShield * (shieldPercentage / 100);
        
        // Publish resurrect event
        if (this.entity && this.entity.world) {
            this.entity.world.messageBus.publish('entity.resurrected', {
                entity: this.entity,
                health: this.health,
                shield: this.shield
            });
        }
    }
    
    /**
     * Start damage flash effect
     */
    startDamageFlash() {
        this.isFlashing = true;
        this.damageFlashIntensity = 1.0;
    }
    
    /**
     * Update damage flash effect
     * @param {number} deltaTime Time elapsed since last update
     */
    updateDamageFlash(deltaTime) {
        if (!this.isFlashing) return;
        
        // Reduce flash intensity over time
        this.damageFlashIntensity -= (deltaTime / this.damageFlashDuration);
        
        if (this.damageFlashIntensity <= 0) {
            this.isFlashing = false;
            this.damageFlashIntensity = 0;
        }
    }
    
    /**
     * Get health as percentage
     * @returns {number} Health percentage (0-100)
     */
    getHealthPercentage() {
        return (this.health / this.maxHealth) * 100;
    }
    
    /**
     * Get shield as percentage
     * @returns {number} Shield percentage (0-100)
     */
    getShieldPercentage() {
        return (this.shield / this.maxShield) * 100;
    }
    
    /**
     * Update method called each frame
     * @param {number} deltaTime Time elapsed since last update
     */
    update(deltaTime) {
        // Update shield recharge timer
        if (!this.isDead && this.shield < this.maxShield) {
            this.timeSinceLastDamage += deltaTime;
            
            // Recharge shield after delay
            if (this.timeSinceLastDamage >= this.shieldRechargeDelay) {
                const rechargeAmount = this.shieldRechargeRate * deltaTime;
                this.rechargeShield(rechargeAmount);
            }
        }
        
        // Update damage flash effect
        this.updateDamageFlash(deltaTime);
    }
} 