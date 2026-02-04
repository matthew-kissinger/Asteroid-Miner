/**
 * MiningLaserComponent - Data container for mining laser properties
 * 
 * Stores mining laser configuration and state.
 */

import { Component } from '../../core/component.ts';
import { mainMessageBus } from '../../globals/messageBus.ts';

export class MiningLaserComponent extends Component {
    constructor(power = 1, range = 800) {
        super();
        
        // Mining properties
        this.power = power;        // Mining power multiplier
        this.range = range;        // Maximum mining range
        this.active = false;       // Whether laser is currently active
        this.targetEntityId = null; // Entity ID of current mining target
        
        // Mining rate configuration for single-action mining
        // Values are in progress per second (1 / seconds_required to complete mining)
        this.miningRates = {
            iron: 0.133,     // 7.5 seconds to complete (1/7.5)
            gold: 0.044,     // 22.5 seconds to complete (1/22.5) 
            platinum: 0.022  // 45 seconds to complete (1/45)
        };
        
        // Visual properties (for reference by systems)
        this.laserColor = 0x00FFFF;
        this.laserWidth = 0.4;
        
        // References to visual elements (managed by MiningSystem)
        this.visualsCreated = false;
    }
    
    /**
     * Set mining target
     * @param {string} entityId Target entity ID
     */
    setTarget(entityId) {
        this.targetEntityId = entityId;
    }
    
    /**
     * Activate mining laser
     * @param {boolean} active Whether laser should be active
     */
    activate(active) {
        this.active = active;
    }
    
    /**
     * Calculate mining speed for a specific resource
     * @param {string} resourceType Resource type (iron, gold, platinum)
     * @returns {number} Mining speed in progress per second
     */
    getMiningSpeed(resourceType) {
        if (!this.miningRates.hasOwnProperty(resourceType)) {
            console.warn(`Unknown resource type: ${resourceType}, using default mining rate`);
            return this.miningRates.iron * this.power;
        }
        
        return this.miningRates[resourceType] * this.power;
    }
    
    /**
     * Upgrade mining laser power
     * @param {number} multiplier Power multiplier
     * @returns {number} New power level
     */
    upgrade(multiplier = 1.5) {
        this.power *= multiplier;
        
        // Round to 2 decimal places for cleaner display
        this.power = Math.round(this.power * 100) / 100;
        
        // Publish upgrade event
        if (mainMessageBus) {
            mainMessageBus.publish('mining.laserUpgraded', {
                component: this,
                newPower: this.power
            });
        }
        
        return this.power;
    }
    
    /**
     * Called when component is detached from an entity
     */
    onDetached() {
        // Clear references
        this.targetEntityId = null;
        this.active = false;
        
        // Notify MiningSystem about component detachment to clean up visuals
        if (mainMessageBus) {
            mainMessageBus.publish('mining.component.detached', {
                entityId: this.entity.id
            });
        }
    }
}
