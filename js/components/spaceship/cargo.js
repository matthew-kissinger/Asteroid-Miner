/**
 * CargoComponent - Manages spaceship resources and cargo capacity
 * 
 * Handles storage and management of mined resources.
 */

import { Component } from '../../core/component.js';

export class CargoComponent extends Component {
    constructor(maxCapacity = 100) {
        super();
        
        // Cargo capacity
        this.maxCapacity = maxCapacity;
        this.usedCapacity = 0;
        
        // Resource storage
        this.resources = {
            iron: 0,
            gold: 0,
            platinum: 0
        };
        
        // Resource values (credits per unit)
        this.resourceValues = {
            iron: 10,
            gold: 50,
            platinum: 200
        };
        
        // Resource volumes (capacity units per resource unit)
        this.resourceVolumes = {
            iron: 1.0,
            gold: 0.8,
            platinum: 0.5
        };
    }
    
    /**
     * Add resource to cargo hold
     * @param {string} type Resource type (iron, gold, platinum)
     * @param {number} amount Amount to add
     * @returns {number} Actual amount added (limited by capacity)
     */
    addResource(type, amount) {
        if (!this.resources.hasOwnProperty(type)) {
            console.warn(`Unknown resource type: ${type}`);
            return 0;
        }
        
        // Calculate volume required for this resource
        const volumeRequired = amount * this.resourceVolumes[type];
        
        // Check if we have enough cargo space
        const availableCapacity = this.maxCapacity - this.usedCapacity;
        
        if (volumeRequired > availableCapacity) {
            // Partial add - only what fits
            const fittingAmount = Math.floor(availableCapacity / this.resourceVolumes[type]);
            if (fittingAmount <= 0) return 0;
            
            this.resources[type] += fittingAmount;
            this.usedCapacity += fittingAmount * this.resourceVolumes[type];
            
            // Notify cargo is full
            if (this.entity && this.entity.world) {
                this.entity.world.messageBus.publish('cargo.full', {
                    entity: this.entity,
                    resourceType: type,
                    resourcesAccepted: fittingAmount,
                    resourcesRejected: amount - fittingAmount
                });
            }
            
            return fittingAmount;
        } else {
            // Full add - everything fits
            this.resources[type] += amount;
            this.usedCapacity += volumeRequired;
            
            // Notify resource added
            if (this.entity && this.entity.world) {
                this.entity.world.messageBus.publish('cargo.resourceAdded', {
                    entity: this.entity,
                    resourceType: type,
                    amount: amount
                });
            }
            
            return amount;
        }
    }
    
    /**
     * Remove resource from cargo hold
     * @param {string} type Resource type (iron, gold, platinum)
     * @param {number} amount Amount to remove
     * @returns {number} Actual amount removed (limited by available resources)
     */
    removeResource(type, amount) {
        if (!this.resources.hasOwnProperty(type)) {
            console.warn(`Unknown resource type: ${type}`);
            return 0;
        }
        
        // Calculate how much can be removed
        const availableAmount = this.resources[type];
        const amountToRemove = Math.min(amount, availableAmount);
        
        if (amountToRemove <= 0) return 0;
        
        // Remove the resource
        this.resources[type] -= amountToRemove;
        this.usedCapacity -= amountToRemove * this.resourceVolumes[type];
        
        // Ensure we don't go below zero due to floating point errors
        if (this.usedCapacity < 0) this.usedCapacity = 0;
        
        // Notify resource removed
        if (this.entity && this.entity.world) {
            this.entity.world.messageBus.publish('cargo.resourceRemoved', {
                entity: this.entity,
                resourceType: type,
                amount: amountToRemove
            });
        }
        
        return amountToRemove;
    }
    
    /**
     * Get total value of all resources in cargo
     * @returns {number} Total cargo value in credits
     */
    getTotalValue() {
        let totalValue = 0;
        
        for (const [resourceType, amount] of Object.entries(this.resources)) {
            totalValue += amount * this.resourceValues[resourceType];
        }
        
        return totalValue;
    }
    
    /**
     * Get value of a specific resource type in cargo
     * @param {string} type Resource type
     * @returns {number} Resource value in credits
     */
    getResourceValue(type) {
        if (!this.resources.hasOwnProperty(type)) {
            console.warn(`Unknown resource type: ${type}`);
            return 0;
        }
        
        return this.resources[type] * this.resourceValues[type];
    }
    
    /**
     * Get cargo fill percentage
     * @returns {number} Percentage of cargo capacity used (0-100)
     */
    getFillPercentage() {
        return (this.usedCapacity / this.maxCapacity) * 100;
    }
    
    /**
     * Clear all resources from cargo
     * @returns {object} Resources that were in cargo
     */
    clearCargo() {
        const previousResources = {...this.resources};
        
        for (const type in this.resources) {
            if (this.resources.hasOwnProperty(type)) {
                this.resources[type] = 0;
            }
        }
        
        this.usedCapacity = 0;
        
        // Notify cargo cleared
        if (this.entity && this.entity.world) {
            this.entity.world.messageBus.publish('cargo.cleared', {
                entity: this.entity,
                previousResources: previousResources
            });
        }
        
        return previousResources;
    }
    
    /**
     * Upgrade cargo capacity
     * @param {number} multiplier Capacity multiplier
     */
    upgrade(multiplier = 1.5) {
        this.maxCapacity *= multiplier;
        
        // Notify cargo upgraded
        if (this.entity && this.entity.world) {
            this.entity.world.messageBus.publish('cargo.upgraded', {
                entity: this.entity,
                newCapacity: this.maxCapacity
            });
        }
        
        return this;
    }
}