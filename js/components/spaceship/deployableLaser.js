/**
 * DeployableLaserComponent - Component for deployable laser turrets
 * 
 * Defines the properties and state of a deployable space laser turret.
 */

import { Component } from '../../core/component.js';

export class DeployableLaserComponent extends Component {
    constructor(range = 1000, fireRate = 3, accuracy = 0.5) {
        super();
        
        // Laser properties
        this.range = range;          // Maximum targeting range in meters
        this.fireRate = fireRate;    // Fire rate in seconds
        this.accuracy = accuracy;    // Accuracy as a percentage (0.5 = 50%)
        
        // Firing state
        this.fireCooldown = 0;       // Current cooldown timer
        this.targetEntityId = null;  // Current target entity ID
        
        // Visual properties
        this.laserColor = 0xFF0033;  // Red color for the laser beam
        this.laserWidth = 0.5;       // Width of the laser beam
        
        // Ownership tracking
        this.ownerId = null;         // ID of the owning entity (usually player)
        this.isDeployed = true;      // Whether the laser is deployed
    }
    
    /**
     * Reset the cooldown timer to allow firing
     */
    resetCooldown() {
        this.fireCooldown = this.fireRate;
    }
    
    /**
     * Check if the turret can fire
     * @returns {boolean} Whether the turret can fire
     */
    canFire() {
        return this.fireCooldown <= 0;
    }
} 