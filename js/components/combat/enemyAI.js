/**
 * EnemyAIComponent - Handles enemy behavior and AI
 * 
 * Controls enemy behavior with simplified kamikaze attack pattern
 */

import { Component } from '../../core/component.js';

export class EnemyAIComponent extends Component {
    constructor(config = {}) {
        super();
        
        // Store the type of enemy
        this.faction = config.faction || 'spectrals';
        this.type = config.type || 'drone';
        
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
        
        console.log(`Created ${this.faction} ${this.type} enemy AI with detection range ${this.detectionRange}`);
    }
    
    /**
     * Update AI behavior - implements kamikaze attack pattern
     * @param {number} deltaTime Time since last update in seconds
     */
    update(deltaTime) {
        // SAFETY: Check if entity exists
        if (!this.entity) {
            console.warn("EnemyAI: No entity reference, skipping update");
            return;
        }
        
        // SAFETY: Check if world exists
        if (!this.entity.world) {
            console.warn(`EnemyAI: Entity ${this.entity.id} has no world reference, skipping update`);
            return;
        }
        
        // Get required components
        const transform = this.entity.getComponent('TransformComponent');
        if (!transform) {
            console.warn(`EnemyAI: Entity ${this.entity.id} has no transform component, skipping update`);
            return;
        }
        
        // Get health component to check status
        const health = this.entity.getComponent('HealthComponent');
        if (health && health.isDestroyed) {
            console.log(`EnemyAI: Entity ${this.entity.id} is already destroyed, skipping update`);
            return;
        }
        
        // Increment time alive for movement calculations
        this.timeAlive += deltaTime;
        
        // Find player entity
        let player = null;
        let playerTransform = null;
        
        // SAFETY: Check if entity manager exists
        if (!this.entity.world.entityManager) {
            console.warn(`EnemyAI: Entity ${this.entity.id} - world has no entityManager, skipping update`);
            return;
        }
        
        if (this.entity.world.entityManager && this.entity.world.entityManager.entitiesByTag) {
            // Try direct tag map access first
            const playerEntities = this.entity.world.entityManager.entitiesByTag.get('player');
            if (playerEntities && playerEntities.length > 0) {
                player = playerEntities[0];
                console.log("Found player via direct tag map access");
            }
        }
        
        // If that fails, try brute force search
        if (!player) {
            // Fallback: Check ALL entities for player tag
            const allEntities = Array.from(this.entity.world.entityManager.entities.values());
            for (const entity of allEntities) {
                if (entity.hasTag('player')) {
                    player = entity;
                    console.log("Found player via brute force entity search");
                    break;
                }
            }
        }
        
        // If still no player, we can't proceed
        if (!player) {
            console.error("No player entity found by any method!");
            return;
        }
        
        // Get player transform
        playerTransform = player.getComponent('TransformComponent');
        if (!playerTransform) {
            console.error("Player found but missing transform component!");
            return;
        }
        
        // Log that we found the player (only once)
        if (!this.playerFound) {
            console.log(`ENEMY FOUND PLAYER TARGET! Player position: ${playerTransform.position.x.toFixed(1)}, ${playerTransform.position.y.toFixed(1)}, ${playerTransform.position.z.toFixed(1)}`);
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
        
        // DIFFERENT MOVEMENT PATTERNS BASED ON FACTION/TYPE
        
        // Special movement for spectral drones - spiral pattern
        if (this.faction === 'spectrals' && this.type === 'drone') {
            this.applySpectralDroneMovement(transform, playerTransform, baseDirection, distanceToPlayer, deltaTime);
        } else {
            // Standard kamikaze movement for other enemies
            transform.position.add(baseDirection.multiplyScalar(this.speed * deltaTime));
            transform.lookAt(playerTransform.position);
        }
        
        // Check for kamikaze attack condition (same for all enemies)
        if (distanceToPlayer < 75) { // Collision distance
            console.log("ENEMY KAMIKAZE ATTACK!");
            
            // Get player health component
            const playerHealth = player.getComponent('HealthComponent');
            if (playerHealth) {
                // Use the configured damage value instead of calculating from player's health
                playerHealth.applyDamage(this.damage, 'collision', this.entity);
                console.log(`Enemy collided with player! Applied ${this.damage} damage to player entity health component`);
                
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
                    
                    console.log(`Applied ${this.damage} damage directly to spaceship: Hull=${spaceship.hull}, Shield=${spaceship.shield}`);
                    
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
                    window.game.audio.playSound('explosion');
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
                    console.log(`Enemy entity ${entityId} self-destructed after kamikaze attack`);
                }
            }
        }
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
}