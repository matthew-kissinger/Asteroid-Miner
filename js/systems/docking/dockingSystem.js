/**
 * DockingSystem - Handles docking operations between player and stargate
 * 
 * This system manages docking and undocking of the player with the stargate,
 * and handles proximity detection and UI notifications.
 */

import { System } from '../../core/system.js';

export class DockingSystem extends System {
    constructor(world) {
        super(world);
        
        // Required components for entities this system processes
        this.requiredComponents = [];
        
        // References to entities
        this.player = null;
        this.stargate = null;
        
        // Reference to UI
        this.ui = null;
        
        // Docking parameters
        this.dockingDistance = 300; // Distance at which player can dock with stargate
        this.isNearStargate = false;
        this.dockingKey = 'q'; // Key to press for docking
        
        // Subscribe to relevant events
        this.world.messageBus.subscribe('player.created', this.handlePlayerCreated.bind(this));
        this.world.messageBus.subscribe('stargate.created', this.handleStargateCreated.bind(this));
        this.world.messageBus.subscribe('ui.created', this.handleUICreated.bind(this));
        this.world.messageBus.subscribe('player.requestDock', this.handleDockRequest.bind(this));
        this.world.messageBus.subscribe('player.requestUndock', this.handleUndockRequest.bind(this));
        this.world.messageBus.subscribe('input.keydown', this.handleKeyDown.bind(this));
    }
    
    /**
     * Initialize the docking system
     */
    initialize() {
        console.log('Docking System initialized');
    }
    
    /**
     * Handle player entity creation
     * @param {Object} data Event data
     */
    handlePlayerCreated(data) {
        this.player = data.entity;
    }
    
    /**
     * Handle stargate entity creation
     * @param {Object} data Event data
     */
    handleStargateCreated(data) {
        this.stargate = data.entity;
    }
    
    /**
     * Handle UI creation
     * @param {Object} data Event data
     */
    handleUICreated(data) {
        this.ui = data.ui;
    }
    
    /**
     * Handle request to dock
     */
    handleDockRequest() {
        if (!this.player || !this.stargate) return;
        
        // Check if player is in docking range
        if (this.isPlayerNearStargate()) {
            this.dockPlayer();
        } else {
            if (this.ui) {
                this.ui.showMessage('Too far from stargate to dock');
            }
        }
    }
    
    /**
     * Handle request to undock
     */
    handleUndockRequest() {
        if (!this.player) return;
        
        const shipState = this.player.getComponent('ShipStateComponent');
        if (!shipState || !shipState.isDocked) return;
        
        this.undockPlayer();
    }
    
    /**
     * Handle keyboard input for docking/undocking
     * @param {Object} data Event data
     */
    handleKeyDown(data) {
        const { key } = data;
        
        if (key.toLowerCase() === this.dockingKey.toLowerCase()) {
            if (!this.player) return;
            
            const shipState = this.player.getComponent('ShipStateComponent');
            if (!shipState) return;
            
            if (shipState.isDocked) {
                this.world.messageBus.publish('player.requestUndock', {});
            } else if (this.isNearStargate) {
                this.world.messageBus.publish('player.requestDock', {});
            }
        }
    }
    
    /**
     * Check if player is near stargate
     * @returns {boolean} True if player is within docking range
     */
    isPlayerNearStargate() {
        if (!this.player || !this.stargate) return false;
        
        const playerTransform = this.player.getComponent('Transform');
        const stargateTransform = this.stargate.getComponent('Transform');
        
        if (!playerTransform || !stargateTransform) return false;
        
        const distance = playerTransform.position.distanceTo(stargateTransform.position);
        return distance <= this.dockingDistance;
    }
    
    /**
     * Dock the player with the stargate
     */
    dockPlayer() {
        if (!this.player || !this.stargate) return;
        
        const shipState = this.player.getComponent('ShipStateComponent');
        const physics = this.player.getComponent('PhysicsComponent');
        const transform = this.player.getComponent('Transform');
        
        if (!shipState || !physics || !transform) return;
        
        // Store undock position
        shipState.undockPosition.copy(transform.position);
        shipState.undockQuaternion.copy(transform.rotation);
        
        // Set docked state
        shipState.isDocked = true;
        
        // Stop movement
        if (physics) {
            physics.velocity.set(0, 0, 0);
            physics.angularVelocity.set(0, 0, 0);
            physics.enabled = false;
        }
        
        // Move player to docking position
        const stargateTransform = this.stargate.getComponent('Transform');
        if (stargateTransform) {
            // Hide player ship when docked
            const modelComponent = this.player.getComponent('ModelComponent');
            if (modelComponent && modelComponent.model) {
                modelComponent.model.visible = false;
            }
        }
        
        // Disable player controls
        this.world.messageBus.publish('controls.disable', {});
        
        // Show stargate UI
        this.world.messageBus.publish('player.docked', {
            entity: this.player
        });
        
        if (this.ui) {
            this.ui.showMessage('Docked with stargate');
        }
        
        console.log('Player docked with stargate');
    }
    
    /**
     * Undock the player from the stargate
     */
    undockPlayer() {
        if (!this.player) return;
        
        const shipState = this.player.getComponent('ShipStateComponent');
        const physics = this.player.getComponent('PhysicsComponent');
        const transform = this.player.getComponent('Transform');
        
        if (!shipState || !transform) return;
        
        // Reset position to undock position
        transform.position.copy(shipState.undockPosition);
        transform.rotation.copy(shipState.undockQuaternion);
        
        // Set undocked state
        shipState.isDocked = false;
        
        // Enable physics
        if (physics) {
            physics.enabled = true;
        }
        
        // Show player ship
        const modelComponent = this.player.getComponent('ModelComponent');
        if (modelComponent && modelComponent.model) {
            modelComponent.model.visible = true;
        }
        
        // Enable player controls
        this.world.messageBus.publish('controls.enable', {});
        
        // Hide stargate UI
        this.world.messageBus.publish('player.undocked', {
            entity: this.player
        });
        
        if (this.ui) {
            this.ui.showMessage('Undocked from stargate');
        }
        
        console.log('Player undocked from stargate');
    }
    
    /**
     * Update proximity status
     */
    updateProximityStatus() {
        if (!this.player || !this.stargate) return;
        
        const shipState = this.player.getComponent('ShipStateComponent');
        if (!shipState || shipState.isDocked) return;
        
        const wasNear = this.isNearStargate;
        this.isNearStargate = this.isPlayerNearStargate();
        
        // If proximity status changed
        if (wasNear !== this.isNearStargate) {
            // Notify UI
            if (this.ui) {
                if (this.isNearStargate) {
                    this.ui.showDockPrompt(this.dockingKey);
                } else {
                    this.ui.hideDockPrompt();
                }
            }
            
            // Publish event
            this.world.messageBus.publish('player.stargateProximity', {
                isNear: this.isNearStargate,
                entity: this.player
            });
        }
    }
    
    /**
     * Update method called each frame
     * @param {number} deltaTime Time elapsed since last update
     */
    update(deltaTime) {
        this.updateProximityStatus();
    }
} 