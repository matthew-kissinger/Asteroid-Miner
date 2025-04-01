/**
 * DeploymentSystem - Handles deployment and pickup of deployable items
 * 
 * This system manages the deployment of items like laser turrets and their pickup.
 */

import { System } from '../../core/system.js';
import * as THREE from 'three';

export class DeploymentSystem extends System {
    constructor(world) {
        super(world);
        
        // Required components for entities this system processes
        this.requiredComponents = ['PickupableComponent', 'TransformComponent'];
        
        // Reference to player entity
        this.player = null;
        
        // Pickup range (how close the player needs to be to pick up an item)
        this.pickupRange = 50;
        
        // Deployment state
        this.isDeploymentReady = false;
        this.deploymentType = null;
        
        // Subscribe to relevant events
        this.world.messageBus.subscribe('player.created', this.handlePlayerCreated.bind(this));
        this.world.messageBus.subscribe('input.deployLaser', this.handleDeployLaserRequest.bind(this));
        this.world.messageBus.subscribe('input.pickupInteract', this.handlePickupRequest.bind(this));
    }
    
    /**
     * Initialize the system
     */
    initialize() {
        console.log('Deployment System initialized');
        
        // Try to find the player entity if it wasn't set by the player.created event
        if (!this.player) {
            // Check if the player is available globally
            if (window.game && window.game.combat && window.game.combat.playerEntity) {
                console.log('Found player entity in window.game.combat.playerEntity');
                this.player = window.game.combat.playerEntity;
            } 
            // Check if the world has a direct reference to the player
            else if (this.world.playerEntity) {
                console.log('Found player entity in world.playerEntity');
                this.player = this.world.playerEntity;
            }
            // Try to find player by tag
            else {
                const playersWithTag = this.world.getEntitiesByTag('player');
                if (playersWithTag && playersWithTag.length > 0) {
                    console.log('Found player entity by tag');
                    this.player = playersWithTag[0];
                }
            }
        }
        
        if (this.player) {
            console.log(`Deployment System found player entity with ID: ${this.player.id}`);
        } else {
            console.warn('Deployment System could not find player entity during initialization');
        }
    }
    
    /**
     * Handle player creation
     * @param {Object} data Event data
     */
    handlePlayerCreated(data) {
        this.player = data.entity;
    }
    
    /**
     * Update the system
     * @param {number} deltaTime Time since last update in seconds
     */
    update(deltaTime) {
        // Try to find the player entity if it's not already set
        if (!this.player) {
            // Check several places where the player entity might be available
            if (window.game && window.game.combat && window.game.combat.playerEntity) {
                this.player = window.game.combat.playerEntity;
                console.log('Found player entity in window.game.combat.playerEntity');
            } else if (this.world.playerEntity) {
                this.player = this.world.playerEntity;
                console.log('Found player entity in world.playerEntity');
            } else {
                const playersWithTag = this.world.getEntitiesByTag('player');
                if (playersWithTag && playersWithTag.length > 0) {
                    this.player = playersWithTag[0];
                    console.log('Found player entity by tag');
                }
            }
        }
        
        // Get all pickupable entities
        const pickupables = this.world.getEntitiesWithComponents(this.requiredComponents);
        
        // Check for nearby pickupables to highlight or interact with
        if (this.player) {
            const playerTransform = this.player.getComponent('TransformComponent');
            if (playerTransform) {
                for (const entity of pickupables) {
                    // Initialize userData if it doesn't exist
                    if (!entity.userData) {
                        entity.userData = {};
                    }
                    
                    const pickupable = entity.getComponent('PickupableComponent');
                    const transform = entity.getComponent('TransformComponent');
                    
                    // Check if close enough to pick up
                    const distance = playerTransform.position.distanceTo(transform.position);
                    
                    // Add visual indicator if player is close enough to pick up
                    if (distance <= pickupable.pickupRange) {
                        // Visual indicator logic could go here
                        // For now, just set a flag that could be used by UI
                        if (!entity.userData.isHighlighted) {
                            entity.userData.isHighlighted = true;
                            // Could publish an event for UI to show pickup prompt
                            this.world.messageBus.publish('pickup.available', {
                                entity: entity,
                                type: pickupable.type
                            });
                        }
                    } else if (entity.userData.isHighlighted) {
                        // Remove highlight
                        entity.userData.isHighlighted = false;
                        // Could publish an event for UI to hide pickup prompt
                        this.world.messageBus.publish('pickup.unavailable', {
                            entity: entity
                        });
                    }
                }
            }
        }
    }
    
    /**
     * Handle request to deploy a laser turret
     * @param {Object} data Event data
     */
    handleDeployLaserRequest(data) {
        try {
            // Try to find the player entity if it's not already set
            if (!this.player) {
                // Check several places where the player entity might be available
                if (window.game && window.game.combat && window.game.combat.playerEntity) {
                    this.player = window.game.combat.playerEntity;
                    console.log('Found player entity in window.game.combat.playerEntity');
                } else if (this.world.playerEntity) {
                    this.player = this.world.playerEntity;
                    console.log('Found player entity in world.playerEntity');
                } else {
                    const playersWithTag = this.world.getEntitiesByTag('player');
                    if (playersWithTag && playersWithTag.length > 0) {
                        this.player = playersWithTag[0];
                        console.log('Found player entity by tag');
                    }
                }
                
                if (!this.player) {
                    console.error("Cannot deploy laser: player entity not found");
                    return;
                }
            }
            
            // Check if the player has deployable lasers
            // This requires checking the Spaceship object from window.game
            if (!window.game || !window.game.spaceship) {
                console.error("Cannot deploy laser: game or spaceship not found");
                return;
            }
            
            const spaceship = window.game.spaceship;
            if (!spaceship.deployableLaserCount || spaceship.deployableLaserCount <= 0) {
                console.log("No deployable lasers available");
                // Notify the player
                this.world.messageBus.publish('ui.notification', {
                    message: "No deployable lasers available",
                    type: "warning",
                    duration: 2
                });
                return;
            }
            
            // Get player position
            const playerTransform = this.player.getComponent('TransformComponent');
            if (!playerTransform) {
                console.error("Cannot deploy laser: player transform not found");
                return;
            }
            
            // Create deployable laser entity
            const laserEntity = this.createDeployableLaser(
                playerTransform.position.clone(),
                this.player.id
            );
            
            if (laserEntity) {
                // Decrement player's laser count
                spaceship.deployableLaserCount--;
                
                // Notify the player
                this.world.messageBus.publish('ui.notification', {
                    message: "Laser turret deployed",
                    type: "success",
                    duration: 2
                });
                
                // Publish deployment event
                this.world.messageBus.publish('laser.deployed', {
                    entity: laserEntity,
                    position: playerTransform.position.clone()
                });
                
                console.log(`Deployed laser turret at ${playerTransform.position.x}, ${playerTransform.position.y}, ${playerTransform.position.z}`);
            }
        } catch (error) {
            console.error("Error deploying laser turret:", error);
        }
    }
    
    /**
     * Handle request to pick up an item
     * @param {Object} data Event data
     */
    handlePickupRequest(data) {
        // Try to find the player entity if it's not already set
        if (!this.player) {
            // Check several places where the player entity might be available
            if (window.game && window.game.combat && window.game.combat.playerEntity) {
                this.player = window.game.combat.playerEntity;
                console.log('Found player entity in window.game.combat.playerEntity');
            } else if (this.world.playerEntity) {
                this.player = this.world.playerEntity;
                console.log('Found player entity in world.playerEntity');
            } else {
                const playersWithTag = this.world.getEntitiesByTag('player');
                if (playersWithTag && playersWithTag.length > 0) {
                    this.player = playersWithTag[0];
                    console.log('Found player entity by tag');
                }
            }
            
            if (!this.player) {
                console.error("Cannot pickup: player entity not found");
                return;
            }
        }
        
        // Get player position
        const playerTransform = this.player.getComponent('TransformComponent');
        if (!playerTransform) {
            console.error("Cannot pickup: player transform not found");
            return;
        }
        
        // Find the closest pickupable entity
        const pickupables = this.world.getEntitiesWithComponents(this.requiredComponents);
        let closestEntity = null;
        let closestDistance = Infinity;
        
        for (const entity of pickupables) {
            const pickupable = entity.getComponent('PickupableComponent');
            if (!pickupable.canBePickedUp) continue;
            
            const transform = entity.getComponent('TransformComponent');
            const distance = playerTransform.position.distanceTo(transform.position);
            
            if (distance <= pickupable.pickupRange && distance < closestDistance) {
                closestEntity = entity;
                closestDistance = distance;
            }
        }
        
        if (closestEntity) {
            this.pickupEntity(closestEntity);
        } else {
            // No entities in range
            console.log("No pickupable entities in range");
        }
    }
    
    /**
     * Pick up an entity
     * @param {Entity} entity The entity to pick up
     */
    pickupEntity(entity) {
        const pickupable = entity.getComponent('PickupableComponent');
        
        if (pickupable.type === 'deployableLaser') {
            // Add to player inventory
            if (window.game && window.game.spaceship) {
                // Initialize deployableLaserCount if it doesn't exist
                if (typeof window.game.spaceship.deployableLaserCount === 'undefined') {
                    window.game.spaceship.deployableLaserCount = 0;
                }
                
                window.game.spaceship.deployableLaserCount++;
                
                // Notify the player
                this.world.messageBus.publish('ui.notification', {
                    message: "Laser turret retrieved",
                    type: "success",
                    duration: 2
                });
                
                // Publish pickup event
                this.world.messageBus.publish('laser.pickedup', {
                    entity: entity
                });
                
                // Remove the entity from the world
                this.world.destroyEntity(entity);
                
                console.log("Picked up deployable laser");
            } else {
                console.error("Cannot pick up laser: game or spaceship not found");
            }
        } else {
            console.log(`Picked up ${pickupable.type} but no handler defined`);
        }
    }
    
    /**
     * Create a deployable laser entity
     * @param {THREE.Vector3} position The position to deploy at
     * @param {string} ownerId The ID of the owner entity
     * @returns {Entity} The created entity
     */
    createDeployableLaser(position, ownerId) {
        try {
            // Create the entity
            const entity = this.world.createEntity(`deployable_laser_${Date.now()}`);
            
            // Initialize userData with necessary flags
            entity.userData = { 
                isHighlighted: false, 
                _isEnemy: false, 
                isDeployableLaser: true 
            };
            
            // Add tags for identification
            entity.addTag('deployableLaser');
            entity.addTag('friendly'); // Add friendly tag to distinguish from enemies
            // Explicitly add a NOT_ENEMY tag to avoid any tag cache issues
            entity.addTag('NOT_ENEMY');
            
            // Directly create components - no async imports
            // Add transform component
            try {
                // Get TransformComponent constructor from a player entity
                const TransformComponent = this.player.getComponent('TransformComponent').constructor;
                const transform = new TransformComponent(position);
                entity.addComponent(transform);
            } catch (error) {
                console.error("Error adding transform component:", error);
                this.world.destroyEntity(entity);
                return null;
            }
            
            // Create the laser turret mesh - MUCH LARGER AND MORE FUTURISTIC
            const scale = 20; // Scale factor for larger turret
            
            // Create the main body as a sphere
            const coreGeometry = new THREE.SphereGeometry(4 * scale, 24, 24);
            const coreMaterial = new THREE.MeshPhongMaterial({ 
                color: 0x333340,
                specular: 0x3366FF,
                shininess: 50,
                emissive: 0x222233,
                emissiveIntensity: 0.3
            });
            const core = new THREE.Mesh(coreGeometry, coreMaterial);
            
            // Add glowing energy sphere in the center
            const energyGeometry = new THREE.SphereGeometry(2.5 * scale, 32, 32);
            const energyMaterial = new THREE.MeshPhongMaterial({ 
                color: 0xFF3333,
                specular: 0xFFFFFF,
                shininess: 30,
                emissive: 0xFF0000,
                emissiveIntensity: 0.8,
                transparent: true,
                opacity: 0.9
            });
            const energySphere = new THREE.Mesh(energyGeometry, energyMaterial);
            
            // Add multiple floating emitter nodes around the sphere
            const emitterGeometry = new THREE.SphereGeometry(0.8 * scale, 16, 16);
            const emitterMaterial = new THREE.MeshPhongMaterial({ 
                color: 0xFFCC00,
                specular: 0xFFFFFF, 
                shininess: 100,
                emissive: 0xFFAA00,
                emissiveIntensity: 0.7
            });
            
            // Create 4 floating emitters at different positions
            const emitters = [];
            const emitterPositions = [
                new THREE.Vector3(3.5 * scale, 3.5 * scale, 0),
                new THREE.Vector3(-3.5 * scale, 3.5 * scale, 0),
                new THREE.Vector3(0, -3.5 * scale, 3.5 * scale),
                new THREE.Vector3(0, 3.5 * scale, -3.5 * scale)
            ];
            
            for (let i = 0; i < emitterPositions.length; i++) {
                const emitter = new THREE.Mesh(emitterGeometry, emitterMaterial);
                emitter.position.copy(emitterPositions[i]);
                emitters.push(emitter);
            }
            
            // Add orbital rings
            const ring1Geometry = new THREE.TorusGeometry(5 * scale, 0.4 * scale, 16, 48);
            const ring2Geometry = new THREE.TorusGeometry(5.5 * scale, 0.4 * scale, 16, 48);
            const ringMaterial = new THREE.MeshPhongMaterial({
                color: 0x3366BB, 
                specular: 0x6699FF,
                shininess: 50,
                emissive: 0x3366FF,
                emissiveIntensity: 0.5,
                transparent: true,
                opacity: 0.8
            });
            
            const ring1 = new THREE.Mesh(ring1Geometry, ringMaterial);
            const ring2 = new THREE.Mesh(ring2Geometry, ringMaterial);
            
            // Position rings at different angles
            ring1.rotation.x = Math.PI / 2;
            ring2.rotation.y = Math.PI / 2;
            
            // Animate rings and emitters
            const animate = () => {
                if (ring1 && ring2) {
                    ring1.rotation.z += 0.005;
                    ring2.rotation.z -= 0.003;
                    
                    // Make emitters orbit around the core
                    for (let i = 0; i < emitters.length; i++) {
                        // Create different orbital animations for each emitter
                        const time = Date.now() * 0.001;
                        const radius = 3.5 * scale;
                        const speed = 0.5 + (i * 0.1);
                        
                        emitters[i].position.x = Math.cos(time * speed) * radius * (i % 2 ? 1 : 0.8);
                        emitters[i].position.y = Math.sin(time * speed) * radius * (i % 3 ? 0.9 : 1);
                        emitters[i].position.z = Math.cos(time * speed + Math.PI/2) * radius * (i % 2 ? 0.8 : 1);
                    }
                    
                    requestAnimationFrame(animate);
                }
            };
            requestAnimationFrame(animate);
            
            // Create group to combine all elements
            const group = new THREE.Group();
            group.add(core);
            group.add(energySphere);
            emitters.forEach(emitter => group.add(emitter));
            group.add(ring1);
            group.add(ring2);
            
            // No need to rotate as it's a spherical design that works in all directions
            
            // Add mesh component
            try {
                // Get MeshComponent from Combat module (via window.game)
                let MeshComponent;
                if (window.game && window.game.combat) {
                    // Try to get an entity with a mesh component
                    const entitiesWithMesh = this.world.getEntitiesWithComponents(['MeshComponent']);
                    if (entitiesWithMesh && entitiesWithMesh.length > 0) {
                        MeshComponent = entitiesWithMesh[0].getComponent('MeshComponent').constructor;
                    }
                }
                
                // Fallback if we couldn't find MeshComponent
                if (!MeshComponent) {
                    // Create a simple wrapper as fallback
                    MeshComponent = function(mesh) {
                        this.type = 'MeshComponent';
                        this.mesh = mesh;
                    };
                    MeshComponent.prototype.dispose = function() {
                        if (this.mesh) {
                            if (this.mesh.geometry) this.mesh.geometry.dispose();
                            if (this.mesh.material) this.mesh.material.dispose();
                        }
                    };
                }
                
                const mesh = new MeshComponent(group);
                entity.addComponent(mesh);
                
                // Add to scene
                this.world.scene.add(group);
            } catch (error) {
                console.error("Error adding mesh component:", error);
                this.world.destroyEntity(entity);
                return null;
            }
            
            // Add deployable laser component
            try {
                // Simple implementation of DeployableLaserComponent
                const DeployableLaserComponent = function(range, fireRate, accuracy) {
                    this.type = 'DeployableLaserComponent';
                    this.range = range || 1000;
                    this.fireRate = fireRate || 3;
                    this.accuracy = accuracy || 0.5;
                    this.fireCooldown = 0;
                    this.targetEntityId = null;
                    this.laserColor = 0xFF0033;
                    this.laserWidth = 0.5;
                    this.ownerId = null;
                    this.isDeployed = true;
                };
                
                DeployableLaserComponent.prototype.resetCooldown = function() {
                    this.fireCooldown = this.fireRate;
                };
                
                DeployableLaserComponent.prototype.canFire = function() {
                    return this.fireCooldown <= 0;
                };
                
                const laserComponent = new DeployableLaserComponent(1000, 3, 0.5);
                laserComponent.ownerId = ownerId;
                entity.addComponent(laserComponent);
            } catch (error) {
                console.error("Error adding deployable laser component:", error);
                this.world.destroyEntity(entity);
                return null;
            }
            
            // Add pickupable component
            try {
                // Simple implementation of PickupableComponent
                const PickupableComponent = function(type, pickupRange) {
                    this.type = 'PickupableComponent';
                    this.itemType = type || 'deployableLaser';
                    this.pickupRange = pickupRange || 50;
                    this.canBePickedUp = true;
                };
                
                const pickupable = new PickupableComponent('deployableLaser', 50);
                entity.addComponent(pickupable);
            } catch (error) {
                console.error("Error adding pickupable component:", error);
                this.world.destroyEntity(entity);
                return null;
            }
            
            console.log(`Created deployable laser entity: ${entity.id}`);
            return entity;
        } catch (error) {
            console.error("Error creating deployable laser entity:", error);
            return null;
        }
    }
} 