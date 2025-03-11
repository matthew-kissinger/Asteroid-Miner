// physics.js - Handles physics calculations and movement

export class Physics {
    // Physics constants - significantly increased for super-fast movement
    static THRUST_FORCE = 0.5;      // 5x increase from previous 0.1
    static BOOST_MULTIPLIER = 4;    // Keep the same boost multiplier
    static MAX_VELOCITY = 25.0;     // Default maximum velocity (will use spaceship's value if available)
    static ROTATION_SPEED = 0.3;    // Increased for more responsive controls
    static COLLISION_DISTANCE = 15; // Reduced from 70 to match actual ship size
    static FRICTION = 0.01;         // Small friction to help with control (new)
    
    constructor(scene) {
        this.scene = scene;
        this.spaceship = null; // Will be set later
        this.camera = null; // Will be set later
        
        // Virtual rotation state for pointer lock
        this.rotationState = {
            x: 0,
            y: 0
        };
        
        // Collision state
        this.collided = false;
        
        // For collision detection
        this.raycaster = new THREE.Raycaster();
        this.direction = new THREE.Vector3(0, 0, -1);
        this.collisionDistance = Physics.COLLISION_DISTANCE; // Use the class constant for consistency
    }
    
    // Set spaceship reference
    setSpaceship(spaceship) {
        this.spaceship = spaceship;
    }
    
    // Set camera reference
    setCamera(camera) {
        this.camera = camera;
    }
    
    update(deltaTime) {
        if (!this.spaceship || this.spaceship.isDestroyed) return;
        
        // Check if ship is docked - skip physics if docked
        if (this.spaceship.isDocked) return;
        
        // Check if we have fuel
        const hasFuel = this.spaceship.consumeFuel();
        
        // Apply thrust based on controls - only if we have fuel
        let thrustVector = new THREE.Vector3(0, 0, 0);
        let isThrusting = false;
        
        // Get the ship's forward direction
        const shipForward = new THREE.Vector3(0, 0, -1);
        shipForward.applyQuaternion(this.spaceship.mesh.quaternion);
        
        // Calculate dot product to determine how much we're moving forward
        const forwardVelocity = shipForward.dot(this.spaceship.velocity);
        
        // Define thruster references outside the if blocks so they're in scope throughout
        const mainThrusterParticles = this.spaceship.particleSystems.find(ps => ps.type === 'main');
        const mainThruster = this.spaceship.thrusters.find(t => t.type === 'main');
        const reverseThrusterParticles = this.spaceship.particleSystems.find(ps => ps.type === 'reverse');
        const reverseThruster = this.spaceship.thrusters.find(t => t.type === 'reverse');
        const leftThrusterParticles = this.spaceship.particleSystems.find(ps => ps.type === 'left');
        const leftThruster = this.spaceship.thrusters.find(t => t.type === 'left');
        const rightThrusterParticles = this.spaceship.particleSystems.find(ps => ps.type === 'right');
        const rightThruster = this.spaceship.thrusters.find(t => t.type === 'right');
        
        if (hasFuel) {
            // Forward thrust handling
            if (this.spaceship.thrust.forward) {
                isThrusting = true;
                const forwardThrust = new THREE.Vector3(0, 0, -Physics.THRUST_FORCE);
                if (this.spaceship.thrust.boost) forwardThrust.multiplyScalar(Physics.BOOST_MULTIPLIER);
                thrustVector.add(forwardThrust);
                
                // Show main thruster particles based on actual forward motion
                if (mainThrusterParticles) {
                    mainThrusterParticles.system.visible = true;
                    
                    // Increase emissive intensity of thruster when active
                    if (mainThruster) {
                        mainThruster.mesh.material.emissiveIntensity = 
                            this.spaceship.thrust.boost ? 1.5 : 1.0;
                        // Make the thruster glow more in boost mode
                        if (this.spaceship.thrust.boost) {
                            mainThruster.mesh.material.emissive.setHex(0xff8800);
                        } else {
                            mainThruster.mesh.material.emissive.setHex(0xff5500);
                        }
                    }
                }
            } else {
                // If not thrusting forward but still moving forward, show the thruster with reduced intensity
                if (forwardVelocity > 5.0 && mainThrusterParticles) {
                    // Show thruster with intensity based on speed
                    const maxVelocity = this.getMaxVelocity();
                    const intensityFactor = Math.min(forwardVelocity / maxVelocity, 0.8);
                    mainThrusterParticles.system.visible = true;
                    
                    if (mainThruster) {
                        mainThruster.mesh.material.emissiveIntensity = intensityFactor * 0.8;
                        mainThruster.mesh.material.emissive.setHex(0xff3300);
                    }
                } else {
                    // Deactivate main thruster particles
                    if (mainThrusterParticles) {
                        mainThrusterParticles.system.visible = false;
                        
                        // Reset emissive intensity when inactive
                        if (mainThruster) {
                            mainThruster.mesh.material.emissiveIntensity = 0.5;
                            mainThruster.mesh.material.emissive.setHex(0xff5500);
                        }
                    }
                }
            }
            
            // Backward thrust handling
            if (this.spaceship.thrust.backward) {
                isThrusting = true;
                thrustVector.add(new THREE.Vector3(0, 0, Physics.THRUST_FORCE));
                
                // Activate reverse thruster particles
                if (reverseThrusterParticles) {
                    reverseThrusterParticles.system.visible = true;
                    // Increase emissive intensity of reverse thruster when active
                    if (reverseThruster) {
                        reverseThruster.mesh.material.emissiveIntensity = 1.0;
                        reverseThruster.mesh.material.emissive.setHex(0x33ccff);
                    }
                }
            } else {
                // If moving backward significantly, show reverse thrusters
                if (forwardVelocity < -5.0) {
                    if (reverseThrusterParticles) {
                        reverseThrusterParticles.system.visible = true;
                        
                        if (reverseThruster) {
                            const maxVelocity = this.getMaxVelocity();
                            const intensityFactor = Math.min(Math.abs(forwardVelocity) / maxVelocity, 0.8);
                            reverseThruster.mesh.material.emissiveIntensity = intensityFactor * 0.8;
                        }
                    }
                } else {
                    // Deactivate reverse thruster particles
                    if (reverseThrusterParticles) {
                        reverseThrusterParticles.system.visible = false;
                        // Reset emissive intensity when inactive
                        if (reverseThruster) {
                            reverseThruster.mesh.material.emissiveIntensity = 0.5;
                            reverseThruster.mesh.material.emissive.setHex(0x33ccff);
                        }
                    }
                }
            }
            
            // Left thrust handling - only activate when left key is pressed
            if (this.spaceship.thrust.left) {
                isThrusting = true;
                thrustVector.add(new THREE.Vector3(Physics.THRUST_FORCE, 0, 0));
                
                // Activate right thruster particles (for leftward movement)
                if (rightThrusterParticles) {
                    rightThrusterParticles.system.visible = true;
                    // Increase emissive intensity when active
                    if (rightThruster) {
                        rightThruster.mesh.material.emissiveIntensity = 0.8;
                    }
                }
            } else {
                // Always turn off right thrusters when not pressing left
                if (rightThrusterParticles) {
                    rightThrusterParticles.system.visible = false;
                    if (rightThruster) {
                        rightThruster.mesh.material.emissiveIntensity = 0.5;
                    }
                }
            }
            
            // Right thrust handling - only activate when right key is pressed
            if (this.spaceship.thrust.right) {
                isThrusting = true;
                thrustVector.add(new THREE.Vector3(-Physics.THRUST_FORCE, 0, 0));
                
                // Activate left thruster particles (for rightward movement)
                if (leftThrusterParticles) {
                    leftThrusterParticles.system.visible = true;
                    // Increase emissive intensity when active
                    if (leftThruster) {
                        leftThruster.mesh.material.emissiveIntensity = 0.8;
                    }
                }
            } else {
                // Always turn off left thrusters when not pressing right
                if (leftThrusterParticles) {
                    leftThrusterParticles.system.visible = false;
                    if (leftThruster) {
                        leftThruster.mesh.material.emissiveIntensity = 0.5;
                    }
                }
            }
            
            if (isThrusting) {
                // Apply thrust in world space (only if actively thrusting)
                thrustVector.applyQuaternion(this.spaceship.mesh.quaternion);
                this.spaceship.velocity.add(thrustVector);
                
                // Get the current max velocity from the spaceship
                const maxVelocity = this.getMaxVelocity();
                
                // Cap velocity at maximum speed
                if (this.spaceship.velocity.length() > maxVelocity) {
                    this.spaceship.velocity.normalize().multiplyScalar(maxVelocity);
                }
            }
        }
        
        // Add a small amount of "space friction" to make controls more manageable
        // This isn't realistic physics but makes the game more enjoyable to play
        if (!isThrusting && this.spaceship.velocity.length() > 0) {
            const friction = Physics.FRICTION;
            if (this.spaceship.velocity.length() > friction) {
                this.spaceship.velocity.multiplyScalar(1 - friction);
            } else {
                this.spaceship.velocity.set(0, 0, 0);
            }
        }
        
        // CRITICAL: Always update position based on current velocity (Newton's first law)
        // Objects in motion stay in motion unless acted upon by a force
        this.spaceship.mesh.position.add(this.spaceship.velocity);
        
        // Apply rotation based on rotationState
        this.updateShipRotation();
        
        // Update camera position
        this.updateCamera();
        
        // Update trail particles based on ship's current velocity
        // Only show trail when actively thrusting forward (W key pressed)
        if (this.spaceship.updateParticles) {
            // Enable trail visibility only when actively thrusting forward 
            const isThrusting = this.spaceship.thrust.forward;
            this.spaceship.updateTrailVisibility(isThrusting);
            this.spaceship.updateParticles();
        }
        
        // Check for collisions with asteroids and planets
        this.checkCollisions();
    }
    
    // Helper method to get the max velocity from the spaceship or use the default
    getMaxVelocity() {
        return this.spaceship && this.spaceship.maxVelocity 
            ? this.spaceship.maxVelocity 
            : Physics.MAX_VELOCITY;
    }
    
    updateShipRotation() {
        if (!this.spaceship) return;
        
        // Cap y rotation to prevent flipping over (optional, can be adjusted or removed)
        const maxY = Math.PI * 0.45; // Limit to ~45 degrees up/down
        this.rotationState.y = Math.max(Math.min(this.rotationState.y, maxY), -maxY);
        
        // Create a quaternion for rotation
        const euler = new THREE.Euler(this.rotationState.y, this.rotationState.x, 0, 'YXZ');
        const targetQuaternion = new THREE.Quaternion().setFromEuler(euler);
        
        // Apply the rotation to the spaceship - with light smoothing
        this.spaceship.mesh.quaternion.slerp(targetQuaternion, Physics.ROTATION_SPEED);
    }
    
    updateCamera() {
        if (!this.spaceship || !this.camera) return;
        
        // Update the camera to follow the spaceship with offset
        // Camera moved much closer to ship for a zoomed-in view
        const cameraOffset = new THREE.Vector3(0, 5, 25); // Brought much closer (was 0, 15, 75)
        
        // Apply spaceship rotation to camera offset
        const rotatedOffset = cameraOffset.clone();
        rotatedOffset.applyQuaternion(this.spaceship.mesh.quaternion);
        
        // Position camera behind and slightly above the spaceship
        this.camera.position.copy(this.spaceship.mesh.position).add(rotatedOffset);
        
        // Look ahead of the spaceship
        const lookAtPoint = new THREE.Vector3(0, 0, -60); // Adjusted lookAt point (was -200)
        lookAtPoint.applyQuaternion(this.spaceship.mesh.quaternion);
        lookAtPoint.add(this.spaceship.mesh.position);
        
        this.camera.lookAt(lookAtPoint);
        
        // Force visible frustum (debugging purposes)
        this.camera.far = 100000; // Ensure far clip plane is beyond skybox
        this.camera.updateProjectionMatrix();
    }
    
    // Update rotation based on mouse movement deltas
    updateRotation(deltaX, deltaY) {
        // Update the rotation directly
        this.rotationState.x -= deltaX;
        this.rotationState.y -= deltaY;
    }
    
    // Check for collisions with asteroids and planets
    checkCollisions() {
        if (!this.scene || !this.spaceship) return;
        
        // Set a smaller collision radius based on actual ship size
        // This was previously Physics.COLLISION_DISTANCE (70) which was too large
        const shipRadius = 15; // Reduced from 70 to match actual ship size
        const shipPosition = this.spaceship.mesh.position.clone();
        
        // First check if we're colliding with our own projectiles and skip those
        this.scene.traverse(object => {
            if (object.type === 'Mesh' && 
                object.geometry.type?.includes('SphereGeometry') && 
                object.userData.isPlayerProjectile &&
                object.userData.sourceId === 'player') {
                
                // Skip our own projectiles - don't even process them
                return;
            }
        });
        
        // 1. Check collisions with asteroids
        const asteroidMeshes = [];
        
        // Direct access to the asteroid belt if possible
        const asteroidBelt = this.scene.children.find(child => child.name === 'asteroidBelt');
        let asteroids = [];
        
        // If we can get direct access to asteroid belt object, use that for better performance
        if (asteroidBelt && asteroidBelt.userData && asteroidBelt.userData.asteroids) {
            asteroids = asteroidBelt.userData.asteroids;
            asteroidMeshes.push(...asteroids.map(a => a.mesh));
        } else {
            // Otherwise do the more expensive scene traversal
            this.scene.traverse(object => {
                // Check for asteroids using geometry type
                if (object.type === 'Mesh' && 
                    (object.geometry.type?.includes('IcosahedronGeometry') || 
                     object.geometry.type?.includes('TetrahedronGeometry') || 
                     object.geometry.type?.includes('OctahedronGeometry'))) {
                    
                    // Only consider objects within the asteroid belt range to avoid false positives
                    const distFromCenter = Math.sqrt(
                        object.position.x * object.position.x + 
                        object.position.z * object.position.z
                    );
                    
                    // Only include objects in the appropriate distance range from the center
                    // This helps avoid mistaking other geometric objects for asteroids
                    if (distFromCenter > 4000 && distFromCenter < 8000) {
                        asteroidMeshes.push(object);
                    }
                }
            });
        }
        
        // Check distance to each asteroid - precise collision detection
        for (const asteroid of asteroidMeshes) {
            // Skip null items
            if (!asteroid) continue;
            
            const distance = shipPosition.distanceTo(asteroid.position);
            
            // Use actual size from geometry if available - no artificial inflation
            let asteroidRadius = 0;
            
            if (asteroid.geometry && asteroid.geometry.parameters && asteroid.geometry.parameters.radius) {
                // Use the exact geometry radius without multiplication
                asteroidRadius = asteroid.geometry.parameters.radius;
            } else {
                // Fallback size - more accurate estimation
                asteroidRadius = 15;
            }
            
            // If collision detected - uses the sum of actual ship and asteroid radii
            if (distance < (shipRadius + asteroidRadius)) {
                // Only log collision in debug mode
                if (window.DEBUG_MODE) {
                    console.log("Asteroid collision detected!", 
                        "Ship position:", shipPosition,
                        "Asteroid position:", asteroid.position,
                        "Distance:", distance, 
                        "Detection threshold:", (shipRadius + asteroidRadius));
                }
                
                this.handleCollision(asteroid, "asteroid");
                return; // Exit after first collision
            }
        }
        
        // 2. Check collisions with planets
        this.scene.traverse(object => {
            // Check if this is a planet - they typically have larger scale
            if (object.type === 'Mesh' && 
                object.geometry.type.includes('SphereGeometry') && 
                object.scale.x >= 1 && // To filter out particles and small objects
                !object.userData.id?.startsWith('asteroid-') && // Not an asteroid
                !object.userData.isPlayerProjectile && // Not a player projectile
                object !== this.spaceship.mesh) { // Not the spaceship itself
                
                const distance = shipPosition.distanceTo(object.position);
                
                // For planets, we use the actual geometry radius without artificial inflation
                const planetRadius = object.geometry.parameters.radius * object.scale.x;
                
                // If the object is the sun
                if (object.material.emissive && 
                    object.material.emissive.r > 0.5 && 
                    object.material.emissive.g > 0.5) {
                    // Sun collision: if we're within the exact combined radius
                    if (distance < planetRadius + shipRadius) {
                        this.handleCollision(object, "sun");
                        return;
                    }
                } 
                // Regular planet collision
                else if (distance < planetRadius + shipRadius) {
                    this.handleCollision(object, "planet");
                    return;
                }
            }
        });
    }
    
    handleCollision(object, type) {
        if (this.collided || !this.scene) return; // Only handle the first collision
        
        this.collided = true;
        
        // Enhanced logging for collision diagnostics (only in debug mode)
        if (window.DEBUG_MODE) {
            console.log("=== COLLISION DETECTED ===");
            console.log(`Collision type: ${type}`);
            console.log(`Ship velocity at impact: ${this.spaceship.velocity.length().toFixed(2)} units/frame`);
            console.log(`Ship position: x=${this.spaceship.mesh.position.x.toFixed(0)}, y=${this.spaceship.mesh.position.y.toFixed(0)}, z=${this.spaceship.mesh.position.z.toFixed(0)}`);
            console.log(`${type} position: x=${object.position.x.toFixed(0)}, y=${object.position.y.toFixed(0)}, z=${object.position.z.toFixed(0)}`);
            console.log(`Hull resistance: ${this.spaceship.collisionResistance}`);
        }
        
        // Apply hull resistance to see if we survive the collision
        if (this.attemptCollisionRecovery(type)) {
            if (window.DEBUG_MODE) console.log("Hull absorbed collision damage!");
            this.createRecoveryEffect();
            
            // Bounce away from the collision point
            if (object && object.position) {
                const bounceDirection = new THREE.Vector3()
                    .subVectors(this.spaceship.mesh.position, object.position)
                    .normalize();
                
                // Apply a bounce force
                this.spaceship.velocity.copy(bounceDirection.multiplyScalar(5));
            }
            
            // Play the "boink" sound for minor collisions
            if (window.game && window.game.audio) {
                window.game.audio.playSound('boink');
            }
            
            // Reset collision state after a short delay
            setTimeout(() => {
                this.collided = false;
                if (window.DEBUG_MODE) console.log("Collision state reset - ship ready for new collisions");
            }, 1000);
            
            return;
        }
        
        // If we didn't recover, publish game over event instead of handling directly
        // Stop the ship
        this.spaceship.velocity.set(0, 0, 0);
        
        // Different explosion effects based on collision type
        let explosionColor, explosionSize, explosionMessage;
        
        if (type === "sun") {
            // Solar collision - big, bright yellow explosion
            explosionColor = 0xffff00;
            explosionSize = 15;
            explosionMessage = "Your ship was incinerated by the sun!";
        } else if (type === "planet") {
            // Planet collision - large blue-tinted explosion
            explosionColor = 0x33ccff;
            explosionSize = 10;
            explosionMessage = "Your ship crashed into a planet!";
        } else {
            // Default asteroid collision - smaller orange explosion
            explosionColor = 0xff6600;
            explosionSize = 5;
            explosionMessage = "Your ship was destroyed by an asteroid!";
        }
        
        // Create visual effect for the collision
        const explosionGeometry = new THREE.SphereGeometry(explosionSize, 32, 32);
        const explosionMaterial = new THREE.MeshBasicMaterial({
            color: explosionColor,
            transparent: true,
            opacity: 0.8
        });
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.copy(this.spaceship.mesh.position);
        this.scene.add(explosion);
        
        // Animate the explosion
        this.animateExplosion(explosion);
        
        // Mark the ship as destroyed internally
        if (this.spaceship) {
            this.spaceship.isDestroyed = true;
        }
        
        
        console.log("Physics: Initiating game over sequence for collision with", type);
        
        // Use window.mainMessageBus if available
        if (window.mainMessageBus) {
            console.log("Physics: Using window.mainMessageBus");
            window.mainMessageBus.publish('game.over', {
                reason: explosionMessage,
                source: "physics",
                collisionType: type
            });
        } else if (window.game && window.game.messageBus) {
            // Use game message bus if main message bus not available
            console.log("Physics: Using window.game.messageBus");
            window.game.messageBus.publish('game.over', {
                reason: explosionMessage,
                source: "physics",
                collisionType: type
            });
        } else {
            // Only use MessageBus.triggerGameOver if no direct access
            import('../core/messageBus.js').then(module => {
                const MessageBus = module.MessageBus;
                console.log("Physics: Using MessageBus.triggerGameOver");
                
                MessageBus.triggerGameOver(explosionMessage, "physics");
            }).catch(err => {
                console.error("Physics: Error importing MessageBus:", err);
            });
        }
    }
    
    // Method to attempt to recover from a collision based on hull resistance
    attemptCollisionRecovery(collisionType) {
        if (!this.spaceship || !this.spaceship.collisionResistance) 
            return false;
        
        // Get the hull resistance value
        const resistance = this.spaceship.collisionResistance;
        
        // Different collision types have different chances of recovery
        // Higher resistance increases chances
        let recoveryChance = 0;
        
        switch (collisionType) {
            case "asteroid":
                // 50% base chance + 8% per hull level as requested
                recoveryChance = 0.50 + (resistance - 1) * 0.08;
                if (window.DEBUG_MODE) console.log(`Asteroid collision recovery chance: ${(recoveryChance * 100).toFixed(1)}%`);
                break;
            case "planet":
                // Start with 10% chance, increased by hull resistance
                recoveryChance = 0.1 + (resistance - 1) * 0.2;
                if (window.DEBUG_MODE) console.log(`Planet collision recovery chance: ${(recoveryChance * 100).toFixed(1)}%`);
                break;
            case "sun":
                // Almost no chance to survive sun collision
                recoveryChance = (resistance - 1) * 0.05;
                if (window.DEBUG_MODE) console.log(`Sun collision recovery chance: ${(recoveryChance * 100).toFixed(1)}%`);
                break;
            default:
                recoveryChance = 0.2 + (resistance - 1) * 0.3;
                if (window.DEBUG_MODE) console.log(`Generic collision recovery chance: ${(recoveryChance * 100).toFixed(1)}%`);
        }
        
        // Random chance based on recovery probability
        const recoveryRoll = Math.random();
        const survived = recoveryRoll < recoveryChance;
        
        if (window.DEBUG_MODE) console.log(`Recovery roll: ${recoveryRoll.toFixed(3)}, needed ${recoveryChance.toFixed(3)} or lower to survive`);
        
        return survived;
    }
    
    // Create a visual effect when the ship survives a collision
    createRecoveryEffect() {
        if (!this.spaceship || !this.scene) return;
        
        // Create a shield-like effect around the ship
        const shieldGeometry = new THREE.SphereGeometry(15, 32, 32);
        const shieldMaterial = new THREE.MeshBasicMaterial({
            color: 0x30cfd0,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        
        const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
        shield.position.copy(this.spaceship.mesh.position);
        this.scene.add(shield);
        
        // Animate the shield (expand and fade out)
        let scale = 1;
        const expandSpeed = 0.05;
        const fadeSpeed = 0.02;
        
        const animateShield = () => {
            if (scale > 2 || shield.material.opacity <= 0) {
                this.scene.remove(shield);
                return;
            }
            
            scale += expandSpeed;
            shield.scale.set(scale, scale, scale);
            shield.material.opacity -= fadeSpeed;
            
            // Update shield position to follow ship
            if (this.spaceship && this.spaceship.mesh) {
                shield.position.copy(this.spaceship.mesh.position);
            }
            
            requestAnimationFrame(animateShield);
        };
        
        animateShield();
    }
    
    animateExplosion(explosion) {
        let scale = 1;
        const expandSpeed = 0.5;
        const fadeSpeed = 0.02;
        
        const animate = () => {
            if (scale > 20 || explosion.material.opacity <= 0) {
                this.scene.remove(explosion);
                return;
            }
            
            scale += expandSpeed;
            explosion.scale.set(scale, scale, scale);
            explosion.material.opacity -= fadeSpeed;
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
}