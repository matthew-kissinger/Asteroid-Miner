/**
 * EnemyAIComponent - Handles enemy behavior and AI
 * 
 * Controls enemy behavior with simplified kamikaze attack pattern
 */

import * as THREE from 'three';
import { Component } from '../../core/component.ts';
import { TransformComponent } from '../transform.js';
import { HealthComponent } from './healthComponent.js';

export class EnemyAIComponent extends Component {
    constructor(config = {}) {
        super();
        
        // Store the type of enemy
        this.faction = config.faction || 'spectrals';
        this.type = config.type || 'drone';
        this.subtype = config.subtype || 'standard'; // standard, heavy, or swift
        
        // Detection and engagement ranges
        this.detectionRange = config.detectionRange || 2500;
        
        // Combat properties
        this.damage = config.damage || 25;
        
        // Movement properties
        this.speed = config.speed || 1000;
        
        // State tracking
        this.playerFound = false;
        
        // Special movement parameters for spiraling pattern
        this.spiralAmplitude = config.spiralAmplitude || 150; // Radius of spiral
        this.spiralFrequency = config.spiralFrequency || 2.0; // How tight the spiral is
        this.spiralPhase = Math.random() * Math.PI * 2; // Random starting phase
        this.timeAlive = 0; // Track time for movement calculation
        
        // Direction vector caching
        this.lastDirection = new THREE.Vector3(0, 0, 1);
        
        // New flag for drone-like movement
        this.isDroneLike = config.isDroneLike || false;
        
        // Separation force response
        this.separationInfluence = config.separationInfluence || 0.3; // How much separation affects movement (0-1)
        this.separationForce = new THREE.Vector3(); // Store the last calculated separation force
        
    }
    
    /**
     * Sets the separation force to influence movement behavior
     * @param {THREE.Vector3} force The separation force vector
     */
    setSeparationForce(force) {
        // Store the separation force for use in movement calculations
        this.separationForce.copy(force);
    }
    
    /**
     * Update AI behavior - implements kamikaze attack pattern
     * @param {number} deltaTime Time since last update in seconds
     */
    update(deltaTime) {
        if (!this.entity || !this.entity.world) return;
        
        // Track how long this enemy has been alive
        this.timeAlive += deltaTime;
        
        // ===== ENHANCED PLAYER DETECTION =====
        let player = null;
        
        // METHOD 1: Check direct reference in world
        try {
            if (this.entity.world.playerEntity) {
                player = this.entity.world.playerEntity;
                //console.log("Found player via direct world.playerEntity reference");
            }
        } catch (error) {}
        
        // METHOD 2: Try global window reference
        if (!player && window.game && window.game.combat && window.game.combat.playerEntity) {
            player = window.game.combat.playerEntity;
            //console.log("Found player via window.game.combat.playerEntity");
        }
        
        // METHOD 3: Use getEntitiesByTag
        if (!player) {
            try {
                const playerEntities = this.entity.world.getEntitiesByTag('player');
                if (playerEntities && playerEntities.length > 0) {
                    player = playerEntities[0];
                    //console.log("Found player via world.getEntitiesByTag");
                }
            } catch (error) {}
        }
        
        // METHOD 4: Check entitiesByTag map
        if (!player && this.entity.world.entityManager && this.entity.world.entityManager.entitiesByTag) {
            try {
                const playerEntities = this.entity.world.entityManager.entitiesByTag.get('player');
                if (playerEntities && (playerEntities.size > 0 || playerEntities.length > 0)) {
                    player = Array.from(playerEntities)[0];
                    //console.log("Found player via entityManager.entitiesByTag map");
                }
            } catch (error) {}
        }
        
        // METHOD 5: Bruteforce search all entities
        if (!player && this.entity.world.entityManager && this.entity.world.entityManager.entities) {
            try {
                const allEntities = Array.from(this.entity.world.entityManager.entities.values());
                for (const entity of allEntities) {
                    if ((entity.hasTag && entity.hasTag('player')) || 
                        entity.name === 'player' || 
                        (entity.id && entity.id.includes('player'))) {
                        player = entity;
                        //console.log("Found player via brute force entity search");
                        break;
                    }
                }
            } catch (error) {}
        }
        
        // METHOD 6: Check for spaceship in scene
        if (!player && window.game && window.game.spaceship && window.game.spaceship.mesh) {
            // Create a temporary entity if needed
            
            // Use the spaceship as the target without an actual entity
            // We'll create a minimal object with the necessary properties
            player = {
                getComponent: (type) => {
                    if (type === TransformComponent) {
                        return {
                            position: window.game.spaceship.mesh.position,
                            rotation: window.game.spaceship.mesh.rotation,
                            quaternion: window.game.spaceship.mesh.quaternion
                        };
                    }
                    return null;
                }
            };
        }
        
        // If still no player, we can't proceed
        if (!player) {
            // Only show error message occasionally to avoid console spam
            return;
        }
        
        // Get required components
        const transform = this.entity.getComponent(TransformComponent);
        if (!transform) {
            return;
        }
        
        // Get health component to check status
        const health = this.entity.getComponent(HealthComponent);
        if (health && health.isDestroyed) {
            return;
        }
        
        // Get player transform
        let playerTransform = player.getComponent ? player.getComponent(TransformComponent) : null;
        if (!playerTransform) {
            // If using spaceship directly, playerTransform is already correctly set up
            if (player.position) {
                playerTransform = player;
            } else {
                return;
            }
        }
        
        // Log that we found the player (only once)
        if (!this.playerFound) {
            this.playerFound = true;
        }
        
        // Calculate distance to player for decision-making
        const distanceToPlayer = transform.position.distanceTo(playerTransform.position);
        
        // Calculate base direction to player
        const baseDirection = new THREE.Vector3().subVectors(
            playerTransform.position,
            transform.position
        ).normalize();
        
        // Cache this direction for calculations
        this.lastDirection.copy(baseDirection);
        
        // DIFFERENT MOVEMENT PATTERNS BASED ON SUBTYPE
        
        // Special movement for spectral drones based on subtype
        if (this.faction === 'spectrals' && this.type === 'drone') {
            // Choose movement pattern based on subtype
            switch (this.subtype) {
                case 'heavy':
                    this.applyHeavyDroneMovement(transform, playerTransform, baseDirection, distanceToPlayer, deltaTime);
                    break;
                case 'swift':
                    this.applySwiftDroneMovement(transform, playerTransform, baseDirection, distanceToPlayer, deltaTime);
                    break;
                case 'standard':
                default:
                    // Standard drones use existing movement patterns
                    if (this.isDroneLike) {
                        this.applyDroneLikeMovement(transform, playerTransform, baseDirection, distanceToPlayer, deltaTime);
                    } else {
                        this.applySpectralDroneMovement(transform, playerTransform, baseDirection, distanceToPlayer, deltaTime);
                    }
                    break;
            }
        } else {
            // Standard kamikaze movement for other enemies
            transform.position.add(baseDirection.multiplyScalar(this.speed * deltaTime));
            transform.lookAt(playerTransform.position);
        }
        
        // Check for kamikaze attack condition (same for all enemies)
        if (distanceToPlayer < 75) { // Collision distance
            
            // Get player health component
            const playerHealth = player.getComponent(HealthComponent);
            if (playerHealth) {
                // Use the configured damage value instead of calculating from player's health
                playerHealth.applyDamage(this.damage, 'collision', this.entity);
                
                // CRITICAL FIX: Also update the spaceship object directly to ensure damage is reflected
                if (window.game && window.game.spaceship) {
                    const spaceship = window.game.spaceship;
                    
                    // Apply damage to shields first, then hull
                    if (spaceship.shield > 0) {
                        if (spaceship.shield >= this.damage) {
                            spaceship.shield -= this.damage;
                        } else {
                            const remainingDamage = this.damage - spaceship.shield;
                            spaceship.shield = 0;
                            spaceship.hull -= remainingDamage;
                        }
                    } else {
                        spaceship.hull -= this.damage;
                    }
                    
                    
                    // Check for game over condition
                    if (spaceship.hull <= 0 && !spaceship.isDestroyed) {
                        spaceship.hull = 0;
                        spaceship.isDestroyed = true;
                        
                        // Force game over
                        if (window.game && window.game.gameOver) {
                            window.game.gameOver("Your ship was destroyed by a kamikaze attack!");
                        }
                    }
                }
                
                // Create explosion effect using the visual effects system
                if (this.entity.world && this.entity.world.messageBus) {
                    this.entity.world.messageBus.publish('vfx.explosion', {
                        position: transform.position.clone(),
                        scale: 1.5, // Larger explosion for impact
                        duration: 2.0
                    });
                    
                    // Also create damage flash for player
                    this.entity.world.messageBus.publish('vfx.damageFlash', {
                        intensity: 0.3
                    });
                }
                
                // Play explosion sound if available
                if (window.game && window.game.audio) {
                    window.game.audio.playSound('boink');
                }
                
                // Properly destroy this enemy entity
                // Don't manually set health.isDestroyed, just let the entity system handle it
                if (this.entity && this.entity.world) {
                    // IMPORTANT FIX: Store entity ID locally before destruction
                    const entityId = this.entity.id;
                    const entityWorld = this.entity.world;
                    
                    // Publish a destroy event before actually destroying
                    entityWorld.messageBus.publish('entity.aboutToBeDestroyed', {
                        entity: this.entity,
                        reason: 'kamikaze'
                    });
                    
                    // Actually destroy the entity via world
                    entityWorld.destroyEntity(entityId);
                }
            }
        }
    }
    
    /**
     * Apply drone-like movement pattern - more realistic drone behavior
     * @param {TransformComponent} transform This entity's transform
     * @param {TransformComponent} playerTransform Player's transform
     * @param {THREE.Vector3} baseDirection Base direction to player
     * @param {number} distanceToPlayer Distance to player
     * @param {number} deltaTime Delta time for frame
     */
    applyDroneLikeMovement(transform, playerTransform, baseDirection, distanceToPlayer, deltaTime) {
        // Create an orthogonal basis for movement
        const up = new THREE.Vector3(0, 1, 0);
        const right = new THREE.Vector3().crossVectors(baseDirection, up).normalize();
        
        // In case the direction is parallel to up, we need a fallback
        if (right.lengthSq() < 0.1) {
            right.set(1, 0, 0); // Fallback right vector
        }
        
        // Now get a proper up vector that's perpendicular to both
        const properUp = new THREE.Vector3().crossVectors(right, baseDirection).normalize();
        
        // Calculate movement based on distance to player
        let moveSpeed = this.speed;
        let finalDirection = new THREE.Vector3();
        
        // Different behavior based on distance from player
        if (distanceToPlayer > 1000) {
            // Far away - approach rapidly with slight variations
            moveSpeed = this.speed * 1.2; // Move faster when far away
            
            // Add slight zigzag for interesting approach
            const zigzag = Math.sin(this.timeAlive * 1.5) * 30;
            finalDirection.copy(baseDirection)
                .multiplyScalar(moveSpeed)
                .add(right.clone().multiplyScalar(zigzag));
                
        } else if (distanceToPlayer > 400) {
            // Medium distance - circle and approach
            const approachWeight = 0.6; // 60% approach, 40% circling
            const circleSpeed = this.speed * (1 - approachWeight);
            
            // Determine circling direction (clockwise or counterclockwise)
            // Use entity ID to make it consistent for this drone
            const entityIdSum = this.entity.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
            const circleDir = (entityIdSum % 2 === 0) ? 1 : -1;
            
            // Calculate strafing component (perpendicular to player direction)
            const strafeDir = right.clone().multiplyScalar(circleDir * circleSpeed);
            
            // Calculate approach component
            const approachDir = baseDirection.clone().multiplyScalar(this.speed * approachWeight);
            
            // Combine for final movement
            finalDirection.copy(approachDir).add(strafeDir);
            
            // Add slight up/down bobbing
            const bobAmount = Math.sin(this.timeAlive * 2.0) * 15;
            finalDirection.add(properUp.clone().multiplyScalar(bobAmount));
            
        } else {
            // Close range - erratic evasive movements with approach
            
            // Generate pseudo-random evasive pattern
            const evasiveTime = this.timeAlive * 3.0; // Faster pattern changes
            
            // Horizontal evasion
            const horizontalEvasion = Math.sin(evasiveTime) * Math.cos(evasiveTime * 1.3) * 80;
            
            // Vertical evasion
            const verticalEvasion = Math.cos(evasiveTime * 0.7) * Math.sin(evasiveTime * 1.1) * 60;
            
            // Forward thrust varies with a pulsing pattern (0.5 to 1.0 of base speed)
            const thrustPulse = 0.5 + (0.5 * (0.5 + 0.5 * Math.sin(evasiveTime * 0.5)));
            
            // Combine all movements
            finalDirection.copy(baseDirection)
                .multiplyScalar(this.speed * thrustPulse)
                .add(right.clone().multiplyScalar(horizontalEvasion))
                .add(properUp.clone().multiplyScalar(verticalEvasion));
        }
        
        // Apply separation force influence to final direction
        if (this.separationForce && this.separationForce.lengthSq() > 0) {
            // Scale the separation force by influence factor
            const separationDirection = this.separationForce.clone().normalize();
            const separationStrength = this.separationForce.length();
            
            // Add scaled separation force to final direction
            // Use higher influence when separation force is stronger
            const dynamicInfluence = this.separationInfluence * 
                (0.5 + 0.5 * Math.min(1.0, separationStrength / 100));
                
            finalDirection.lerp(
                separationDirection.multiplyScalar(this.speed), 
                dynamicInfluence
            );
        }
        
        // Apply the final movement
        transform.position.add(finalDirection.multiplyScalar(deltaTime));
        
        // Create a look target that leads slightly in the direction of movement
        // This creates a more natural flight pattern where the drone looks ahead of its movement
        const lookAheadTime = 0.1; // Look 0.1 seconds ahead
        const lookTarget = new THREE.Vector3()
            .copy(transform.position)
            .add(finalDirection.clone().normalize().multiplyScalar(100)); // Look 100 units ahead
            
        // Look at the calculated target point
        transform.lookAt(lookTarget);
        
        // Add realistic banking effect based on lateral movement
        // Extract the lateral (right) component of our movement
        const lateralMovement = new THREE.Vector3();
        lateralMovement.copy(finalDirection).projectOnVector(right);
        
        // Calculate bank angle based on lateral movement (max ±25 degrees)
        const lateralSpeed = lateralMovement.length() * (lateralMovement.dot(right) > 0 ? -1 : 1);
        const bankAngle = (lateralSpeed / this.speed) * 0.4; // Max ~25 degrees
        
        // Apply banking rotation around the forward axis
        const forward = transform.getForwardVector();
        const bankQuaternion = new THREE.Quaternion().setFromAxisAngle(forward, bankAngle);
        transform.quaternion.multiply(bankQuaternion);
        
        // Update Euler angles to match quaternion
        transform.rotation.setFromQuaternion(transform.quaternion);
    }
    
    /**
     * Apply spectral drone movement pattern - spiral toward player
     * @param {TransformComponent} transform This entity's transform
     * @param {TransformComponent} playerTransform Player's transform
     * @param {THREE.Vector3} baseDirection Base direction to player
     * @param {number} distanceToPlayer Distance to player
     * @param {number} deltaTime Delta time for frame
     */
    applySpectralDroneMovement(transform, playerTransform, baseDirection, distanceToPlayer, deltaTime) {
        // Create an orthogonal basis for spiral movement
        // We need a right vector that's perpendicular to the direction to the player
        const up = new THREE.Vector3(0, 1, 0);
        const right = new THREE.Vector3().crossVectors(baseDirection, up).normalize();
        
        // In case the direction is parallel to up, we need a fallback
        if (right.lengthSq() < 0.1) {
            right.set(1, 0, 0); // Fallback right vector
        }
        
        // Now get a proper up vector that's perpendicular to both
        const properUp = new THREE.Vector3().crossVectors(right, baseDirection).normalize();
        
        // Calculate spiral movement
        // We use sine and cosine to create a circular pattern around the direct path
        const time = this.timeAlive * this.spiralFrequency;
        
        // Adjust spiral amplitude based on distance to player (tighter spirals when closer)
        let amplitude = this.spiralAmplitude;
        if (distanceToPlayer < 500) {
            // Gradually reduce spiral size as we get closer to the player
            amplitude = this.spiralAmplitude * (distanceToPlayer / 500);
        }
        
        // Calculate offsets using sine and cosine for a circular pattern
        const offsetX = Math.sin(time) * amplitude;
        const offsetY = Math.cos(time) * amplitude;
        
        // Apply the offsets to the base direction
        const finalDirection = new THREE.Vector3()
            .copy(baseDirection)
            .multiplyScalar(this.speed) // Base forward speed
            .add(right.multiplyScalar(offsetX)) // Add right/left offset
            .add(properUp.multiplyScalar(offsetY)); // Add up/down offset
        
        // Apply separation force influence to final direction
        if (this.separationForce && this.separationForce.lengthSq() > 0) {
            // Scale the separation force by influence factor
            const separationDirection = this.separationForce.clone().normalize();
            const separationStrength = this.separationForce.length();
            
            // Calculate dynamic influence - more influence when separation force is stronger
            const dynamicInfluence = this.separationInfluence * 
                (0.5 + 0.5 * Math.min(1.0, separationStrength / 100));
            
            // Blend the final direction with the separation direction
            finalDirection.lerp(
                separationDirection.multiplyScalar(this.speed),
                dynamicInfluence
            );
        }
        
        // Apply the final movement
        transform.position.add(finalDirection.multiplyScalar(deltaTime));
        
        // Create a look target that's ahead of us in the spiral path
        // This makes the drone look in the direction it's moving, not just at the player
        const lookAheadTime = 0.2; // Look 0.2 seconds ahead
        const nextSpiral = time + (this.spiralFrequency * lookAheadTime);
        
        const lookAheadOffsetX = Math.sin(nextSpiral) * amplitude;
        const lookAheadOffsetY = Math.cos(nextSpiral) * amplitude;
        
        // Calculate look target position
        const lookTarget = new THREE.Vector3()
            .copy(transform.position)
            .add(baseDirection.multiplyScalar(100)) // Look ahead along base path
            .add(right.multiplyScalar(lookAheadOffsetX)) // Add spiral offset X
            .add(properUp.multiplyScalar(lookAheadOffsetY)); // Add spiral offset Y
        
        // Look at the calculated target point
        transform.lookAt(lookTarget);
        
        // Optional: Add a slight tilt to the drone to make it look like it's banking in the turns
        const tiltAngle = Math.atan2(offsetX, this.speed) * 0.5; // Scale down the bank angle
        
        // Apply tilt by modifying the quaternion directly
        // We need to apply a rotation around the local forward axis
        // Since we've already looked at the target, we're working in local space
        
        // Get the forward vector (from the lookAt we just did)
        const forward = transform.getForwardVector();
        
        // Create quaternion for the tilt rotation around the forward vector (local Z)
        const tiltQuaternion = new THREE.Quaternion().setFromAxisAngle(forward, tiltAngle);
        
        // Apply the tilt rotation to the current rotation
        transform.quaternion.multiply(tiltQuaternion);
        
        // Update the Euler angles to match the quaternion
        transform.rotation.setFromQuaternion(transform.quaternion);
    }
    
    /**
     * Apply heavy drone movement - Direct approach with tank-like behavior
     * @param {TransformComponent} transform This entity's transform
     * @param {TransformComponent} playerTransform Player's transform
     * @param {THREE.Vector3} baseDirection Base direction to player
     * @param {number} distanceToPlayer Distance to player
     * @param {number} deltaTime Delta time for frame
     */
    applyHeavyDroneMovement(transform, playerTransform, baseDirection, distanceToPlayer, deltaTime) {
        // Heavy drones move slowly but steadily
        const movement = baseDirection.clone();
        
        // Minimal evasion - just slight wobble
        const wobbleAmount = Math.sin(this.timeAlive * 1.5) * 0.1;
        const perpendicular = new THREE.Vector3(-baseDirection.z, 0, baseDirection.x);
        perpendicular.multiplyScalar(wobbleAmount);
        movement.add(perpendicular);
        
        // Apply separation force with reduced influence for heavy drones
        const separationInfluence = 0.2; // Less responsive to separation
        movement.add(this.separationForce.clone().multiplyScalar(separationInfluence));
        movement.normalize();
        
        // Update position
        const speed = this.speed * deltaTime;
        transform.position.add(movement.multiplyScalar(speed));
        
        // Look at player with slight anticipation
        const lookTarget = playerTransform.position.clone();
        transform.lookAt(lookTarget);
        
        // Store direction for other systems
        this.lastDirection.copy(movement);
    }
    
    /**
     * Apply swift drone movement - Evasive zigzag with hit-and-run tactics
     * @param {TransformComponent} transform This entity's transform
     * @param {TransformComponent} playerTransform Player's transform
     * @param {THREE.Vector3} baseDirection Base direction to player
     * @param {number} distanceToPlayer Distance to player
     * @param {number} deltaTime Delta time for frame
     */
    applySwiftDroneMovement(transform, playerTransform, baseDirection, distanceToPlayer, deltaTime) {
        // Swift drones move very fast with erratic patterns
        const movement = baseDirection.clone();
        
        // Extreme evasive maneuvers
        const zigzagAmplitude = 0.5;
        const zigzagFrequency = 8.0;
        const zigzag = Math.sin(this.timeAlive * zigzagFrequency) * zigzagAmplitude;
        const perpendicular = new THREE.Vector3(-baseDirection.z, 0, baseDirection.x);
        perpendicular.multiplyScalar(zigzag);
        
        // Add vertical evasion
        const verticalDodge = Math.cos(this.timeAlive * 10) * 0.3;
        perpendicular.y = verticalDodge;
        
        movement.add(perpendicular);
        
        // High separation influence for nimble avoidance
        const separationInfluence = 0.8;
        movement.add(this.separationForce.clone().multiplyScalar(separationInfluence));
        movement.normalize();
        
        // Hit-and-run behavior
        if (distanceToPlayer < 200) {
            // When close, strafe around the player
            const strafeAngle = this.timeAlive * 5;
            const strafeDirection = new THREE.Vector3(
                Math.cos(strafeAngle),
                0,
                Math.sin(strafeAngle)
            );
            movement.lerp(strafeDirection, 0.3);
        }
        
        // Update position
        const speed = this.speed * deltaTime;
        transform.position.add(movement.multiplyScalar(speed));
        
        // Rapid rotation changes with banking effect
        const lookTarget = playerTransform.position.clone();
        lookTarget.add(perpendicular.multiplyScalar(10)); // Look ahead of zigzag
        transform.lookAt(lookTarget);
        
        // Add banking effect
        transform.rotation.z = zigzag * 0.5;
        
        // Store direction
        this.lastDirection.copy(movement);
    }
}