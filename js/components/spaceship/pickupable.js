/**
 * PickupableComponent - Marks entities that can be picked up
 * 
 * Used for deployable items like laser turrets that can be deployed and picked up.
 */

import { Component } from '../../core/component.js';

export class PickupableComponent extends Component {
    constructor(type = 'deployableLaser', pickupRange = 500) {
        super();
        
        // Pickup properties
        this.type = type;                  // Type of pickupable item
        this.pickupRange = pickupRange;    // Range at which player can pick up the item
        this.canBePickedUp = true;         // Whether the item can currently be picked up
    }
} 