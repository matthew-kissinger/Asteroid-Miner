/**
 * ShipControlSystem - Handles ship movement and control
 * 
 * Processes input events and controls the player's ship.
 */

import * as THREE from 'three';
import { System } from '../../core/system.js';

export class ShipControlSystem extends System {
    constructor(world) {
        super(world);
        this.requiredComponents = ['ThrusterComponent', 'TransformComponent'];
        this.priority = 15; // Run after input system but before physics
        
        // Mouse sensitivity
        this.mouseSensitivity = 0.002;
        
        // Set up message listeners
        this.setupMessageListeners();
    }
    
    /**
     * Set up message listeners
     */
    setupMessageListeners() {
        // Listen for thrust input
        this.world.messageBus.subscribe('input.thrust', this.onThrustInput.bind(this));
        
        // Listen for mouse movement
        this.world.messageBus.subscribe('input.mouseMove', this.onMouseMove.bind(this));
        
        // Listen for mining toggle
        this.world.messageBus.subscribe('input.keyDown', (message) => {
            if (message.data.action === 'mining.toggle') {
                this.onMiningToggle();
            }
        });
    }
    
    /**
     * Handle thrust input
     * @param {object} message Thrust message data
     */
    onThrustInput(message) {
        const thrustState = message.data;
        
        // Find player ship entity
        const playerShips = this.world.getEntitiesByTag('player');
        
        // Skip if no player ship found
        if (playerShips.length === 0) return;
        
        // Set thruster state on ship
        playerShips.forEach(shipEntity => {
            const thruster = shipEntity.getComponent('ThrusterComponent');
            if (thruster) {
                thruster.thrusting = thrustState;
            }
        });
    }
    
    /**
     * Handle mouse movement
     * @param {object} message Mouse movement message data
     */
    onMouseMove(message) {
        const movementX = message.data.movementX;
        const movementY = message.data.movementY;
        
        // Find player ship entity
        const playerShips = this.world.getEntitiesByTag('player');
        
        // Skip if no player ship found
        if (playerShips.length === 0) return;
        
        // Rotate ship based on mouse movement
        playerShips.forEach(shipEntity => {
            const transform = shipEntity.getComponent('TransformComponent');
            if (transform) {
                // Calculate rotation changes
                // Horizontal movement (yaw) - rotate around Y axis
                const yawChange = -movementX * this.mouseSensitivity;
                
                // Vertical movement (pitch) - rotate around X axis
                const pitchChange = -movementY * this.mouseSensitivity;
                
                // Apply rotation changes using quaternions for smooth rotation
                const yawQuat = new THREE.Quaternion().setFromAxisAngle(
                    new THREE.Vector3(0, 1, 0), yawChange
                );
                
                const pitchQuat = new THREE.Quaternion().setFromAxisAngle(
                    new THREE.Vector3(1, 0, 0), pitchChange
                );
                
                // Combine rotations
                const rotationQuat = new THREE.Quaternion()
                    .multiplyQuaternions(yawQuat, pitchQuat);
                
                // Apply rotation to ship
                transform.quaternion.multiplyQuaternions(rotationQuat, transform.quaternion);
                
                // Update Euler angles from quaternion
                transform.rotation.setFromQuaternion(transform.quaternion);
                transform.needsUpdate = true;
            }
        });
    }
    
    /**
     * Toggle mining laser
     */
    onMiningToggle() {
        // Find player ship entity
        const playerShips = this.world.getEntitiesByTag('player');
        
        // Skip if no player ship found
        if (playerShips.length === 0) return;
        
        // Toggle mining laser
        playerShips.forEach(shipEntity => {
            const miningLaser = shipEntity.getComponent('MiningLaserComponent');
            if (miningLaser) {
                const newState = !miningLaser.active;
                
                if (newState) {
                    // Find nearest asteroid for mining
                    const nearestAsteroid = this.findNearestAsteroid(shipEntity);
                    
                    if (nearestAsteroid) {
                        // Start mining
                        this.world.messageBus.publish('mining.start', {
                            sourceEntity: shipEntity,
                            targetEntity: nearestAsteroid
                        });
                    } else {
                        // No asteroid found
                        console.log("No minable asteroid found in range");
                    }
                } else {
                    // Stop mining
                    this.world.messageBus.publish('mining.stop', {
                        sourceEntity: shipEntity
                    });
                }
            }
        });
    }
    
    /**
     * Find the nearest asteroid to the given ship
     * @param {Entity} shipEntity The ship entity
     * @returns {Entity|null} The nearest asteroid or null if none found
     */
    findNearestAsteroid(shipEntity) {
        // Get ship transform
        const shipTransform = shipEntity.getComponent('TransformComponent');
        if (!shipTransform) return null;
        
        // Get mining laser
        const miningLaser = shipEntity.getComponent('MiningLaserComponent');
        if (!miningLaser) return null;
        
        // Get maximum mining range
        const maxRange = miningLaser.range;
        
        // Get all asteroids
        const asteroids = this.world.getEntitiesByTag('asteroid');
        
        // Find the nearest asteroid within range
        let nearestAsteroid = null;
        let nearestDistance = Infinity;
        
        for (const asteroid of asteroids) {
            // Get asteroid transform
            const asteroidTransform = asteroid.getComponent('TransformComponent');
            
            // Skip if asteroid has no transform
            if (!asteroidTransform) continue;
            
            // Check if asteroid has a mineable component
            if (!asteroid.hasComponent('MineableComponent')) continue;
            
            // Calculate distance to asteroid
            const distance = shipTransform.position.distanceTo(asteroidTransform.position);
            
            // Check if in range and closer than current nearest
            if (distance <= maxRange && distance < nearestDistance) {
                nearestAsteroid = asteroid;
                nearestDistance = distance;
            }
        }
        
        return nearestAsteroid;
    }
    
    /**
     * Process entities with thrusters
     * @param {Entity} entity The entity to process
     * @param {number} deltaTime Time since last update in seconds
     */
    processEntity(entity, deltaTime) {
        // Skip for non-player entities
        if (!entity.hasTag('player')) return;
        
        // Get components
        const thruster = entity.getComponent('ThrusterComponent');
        const transformComponent = entity.getComponent('TransformComponent');
        
        // Skip if any component is missing
        if (!thruster || !transformComponent) return;
        
        // Apply thrust if active
        if (Object.values(thruster.thrusting).some(Boolean)) {
            thruster.applyThrust(deltaTime);
        }
    }
}