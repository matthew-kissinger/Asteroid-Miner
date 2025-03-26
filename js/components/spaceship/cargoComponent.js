/**
 * CargoComponent - Stores the player's cargo (collected resources)
 * 
 * Manages inventory for mined resources and cargo capacity
 */

import { Component } from '../../core/component.js';

export class CargoComponent extends Component {
    constructor(capacity = 1000) {
        super();
        
        // Cargo capacity
        this.maxCapacity = capacity;
        this.currentCapacity = 0;
        
        // Resources stored in cargo
        this.resources = {
            iron: 0,
            copper: 0,
            gold: 0,
            platinum: 0,
            diamond: 0,
            uranium: 0,
            titanium: 0,
            helium: 0,
            palladium: 0,
            rhodium: 0
        };
    }
    
    /**
     * Add a resource to cargo
     * @param {string} resourceType Type of resource to add
     * @param {number} amount Amount to add
     * @returns {boolean} True if resource was added, false if cargo is full
     */
    addResource(resourceType, amount) {
        // Verify resource type exists
        if (!this.resources.hasOwnProperty(resourceType)) {
            console.warn(`Unknown resource type: ${resourceType}`);
            return false;
        }
        
        // Check if there's enough cargo space
        if (this.currentCapacity + amount > this.maxCapacity) {
            // Add as much as possible
            const availableSpace = this.maxCapacity - this.currentCapacity;
            if (availableSpace <= 0) {
                // No space at all
                if (this.entity && this.entity.world) {
                    this.entity.world.messageBus.publish('cargo.full', {
                        entity: this.entity,
                        resourceType: resourceType,
                        amount: amount,
                        availableSpace: 0
                    });
                }
                return false;
            }
            
            // Add partial amount
            this.resources[resourceType] += availableSpace;
            this.currentCapacity = this.maxCapacity;
            
            // Notify about partial addition
            if (this.entity && this.entity.world) {
                this.entity.world.messageBus.publish('cargo.resourceAdded', {
                    entity: this.entity,
                    resourceType: resourceType,
                    amount: availableSpace,
                    total: this.resources[resourceType],
                    currentCapacity: this.currentCapacity,
                    maxCapacity: this.maxCapacity,
                    isFull: true
                });
            }
            
            return true;
        }
        
        // Add resource
        this.resources[resourceType] += amount;
        this.currentCapacity += amount;
        
        // Notify about addition
        if (this.entity && this.entity.world) {
            this.entity.world.messageBus.publish('cargo.resourceAdded', {
                entity: this.entity,
                resourceType: resourceType,
                amount: amount,
                total: this.resources[resourceType],
                currentCapacity: this.currentCapacity,
                maxCapacity: this.maxCapacity,
                isFull: this.currentCapacity >= this.maxCapacity
            });
        }
        
        return true;
    }
    
    /**
     * Remove a resource from cargo
     * @param {string} resourceType Type of resource to remove
     * @param {number} amount Amount to remove
     * @returns {boolean} True if resource was removed, false if not enough resource
     */
    removeResource(resourceType, amount) {
        // Verify resource type exists
        if (!this.resources.hasOwnProperty(resourceType)) {
            console.warn(`Unknown resource type: ${resourceType}`);
            return false;
        }
        
        // Check if there's enough of the resource
        if (this.resources[resourceType] < amount) {
            return false;
        }
        
        // Remove resource
        this.resources[resourceType] -= amount;
        this.currentCapacity -= amount;
        
        // Notify about removal
        if (this.entity && this.entity.world) {
            this.entity.world.messageBus.publish('cargo.resourceRemoved', {
                entity: this.entity,
                resourceType: resourceType,
                amount: amount,
                total: this.resources[resourceType],
                currentCapacity: this.currentCapacity,
                maxCapacity: this.maxCapacity
            });
        }
        
        return true;
    }
    
    /**
     * Upgrade cargo capacity
     * @param {number} additionalCapacity Additional capacity to add
     */
    upgradeCapacity(additionalCapacity) {
        this.maxCapacity += additionalCapacity;
        
        // Notify about upgrade
        if (this.entity && this.entity.world) {
            this.entity.world.messageBus.publish('cargo.capacityUpgraded', {
                entity: this.entity,
                additionalCapacity: additionalCapacity,
                currentCapacity: this.currentCapacity,
                maxCapacity: this.maxCapacity
            });
        }
    }
    
    /**
     * Check if cargo is full
     * @returns {boolean} True if cargo is full
     */
    isFull() {
        return this.currentCapacity >= this.maxCapacity;
    }
    
    /**
     * Check available cargo space
     * @returns {number} Available cargo space
     */
    getAvailableSpace() {
        return this.maxCapacity - this.currentCapacity;
    }
    
    /**
     * Get cargo fill percentage
     * @returns {number} Percentage of cargo filled (0-100)
     */
    getFillPercentage() {
        return (this.currentCapacity / this.maxCapacity) * 100;
    }
    
    /**
     * Get total amount of a specific resource
     * @param {string} resourceType Type of resource to check
     * @returns {number} Amount of resource in cargo
     */
    getResourceAmount(resourceType) {
        if (!this.resources.hasOwnProperty(resourceType)) {
            return 0;
        }
        return this.resources[resourceType];
    }
    
    /**
     * Get total value of cargo based on resource prices
     * @param {Object} prices Price list for resources
     * @returns {number} Total value of cargo
     */
    getTotalValue(prices) {
        let totalValue = 0;
        
        for (const resourceType in this.resources) {
            const amount = this.resources[resourceType];
            const price = prices[resourceType] || 0;
            totalValue += amount * price;
        }
        
        return totalValue;
    }
    
    /**
     * Clear all cargo
     */
    clearCargo() {
        for (const resourceType in this.resources) {
            this.resources[resourceType] = 0;
        }
        this.currentCapacity = 0;
        
        // Notify about cleared cargo
        if (this.entity && this.entity.world) {
            this.entity.world.messageBus.publish('cargo.cleared', {
                entity: this.entity
            });
        }
    }
} 