// targetingSystem.js - Handles asteroid targeting and lock-on

export class TargetingSystem {
    constructor(spaceship, scene, environment) {
        this.spaceship = spaceship;
        this.scene = scene;
        this.environment = environment;
        
        this.lockOnEnabled = false;
        this.nearbyAsteroids = [];
        this.currentLockOnIndex = -1;
        this.targetAsteroid = null;
        this.scanRadius = this.getScanRadius(); // Get initial scan radius from spaceship
        
        this.createTargetReticle();
    }
    
    createTargetReticle() {
        // Create the target indicator geometry (outer ring)
        const ringGeometry = new THREE.RingGeometry(30, 36, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xff3030,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7
        });
        
        this.targetReticle = new THREE.Mesh(ringGeometry, ringMaterial);
        this.targetReticle.visible = false;
        this.scene.add(this.targetReticle);
        
        // Add inner ring for additional visual interest
        const innerRingGeometry = new THREE.RingGeometry(15, 18, 32);
        const innerRingMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6060,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.5
        });
        
        const innerRing = new THREE.Mesh(innerRingGeometry, innerRingMaterial);
        this.targetReticle.add(innerRing);
    }
    
    // Helper method to get the current scan radius from the spaceship
    getScanRadius() {
        return this.spaceship && this.spaceship.scanRange 
            ? this.spaceship.scanRange 
            : 1000; // Default value if spaceship property not available
    }
    
    toggleLockOn() {
        this.lockOnEnabled = !this.lockOnEnabled;
        
        if (this.lockOnEnabled) {
            // Update scan radius before scanning
            this.scanRadius = this.getScanRadius();
            
            // Scan for nearby asteroids
            this.scanForAsteroids();
            
            // Show targeting UI
            const targetInfoElement = document.getElementById('target-info');
            if (targetInfoElement) {
                targetInfoElement.textContent = 'Lock-On Targeting: ACTIVE';
                targetInfoElement.style.display = 'block';
                targetInfoElement.style.color = '#30cfd0';
            }
        } else {
            // Clear target and hide UI
            this.nearbyAsteroids = [];
            this.currentLockOnIndex = -1;
            this.targetAsteroid = null;
            this.targetReticle.visible = false;
            
            // Hide targeting UI
            const targetInfoElement = document.getElementById('target-info');
            if (targetInfoElement) {
                targetInfoElement.style.display = 'none';
            }
        }
        
        return this.lockOnEnabled;
    }
    
    scanForAsteroids() {
        this.nearbyAsteroids = [];
        const shipPosition = this.spaceship.mesh.position;
        
        // Find all asteroids within scan radius
        const asteroids = this.environment.asteroids;
        asteroids.forEach(asteroid => {
            if (!asteroid.minable) return;
            
            const distance = shipPosition.distanceTo(asteroid.mesh.position);
            if (distance <= this.scanRadius) {
                this.nearbyAsteroids.push({
                    asteroid: asteroid,
                    distance: distance
                });
            }
        });
        
        // Sort by distance
        this.nearbyAsteroids.sort((a, b) => a.distance - b.distance);
        
        // Extract just the asteroid objects after sorting
        this.nearbyAsteroids = this.nearbyAsteroids.map(item => item.asteroid);
        
        // Set current target if we found asteroids
        if (this.nearbyAsteroids.length > 0) {
            this.currentLockOnIndex = 0;
            this.updateLockedOnTarget();
            
            // Update UI to show number of detected asteroids
            const targetNameElement = document.getElementById('target-name');
            if (targetNameElement) {
                targetNameElement.textContent = 
                    `Target 1/${this.nearbyAsteroids.length} (${Math.round(this.nearbyAsteroids[0].mesh.position.distanceTo(shipPosition))} units)`;
            }
            
            return true;
        } else {
            // No targets found
            const targetNameElement = document.getElementById('target-name');
            if (targetNameElement) {
                targetNameElement.textContent = 'No targets in range';
            }
            this.targetReticle.visible = false;
            this.targetAsteroid = null;
            
            return false;
        }
    }
    
    cycleLockOnTarget() {
        if (!this.lockOnEnabled || this.nearbyAsteroids.length === 0) return null;
        
        // Move to next target
        this.currentLockOnIndex = (this.currentLockOnIndex + 1) % this.nearbyAsteroids.length;
        return this.updateLockedOnTarget();
    }
    
    updateLockedOnTarget() {
        this.targetAsteroid = this.nearbyAsteroids[this.currentLockOnIndex];
        
        if (this.targetAsteroid) {
            // Update target info
            const targetNameElement = document.getElementById('target-name');
            if (targetNameElement) {
                targetNameElement.textContent = 
                    `Asteroid (${this.targetAsteroid.resourceType}) - ${this.currentLockOnIndex + 1}/${this.nearbyAsteroids.length}`;
            }
            
            const targetResourcesElement = document.getElementById('target-resources');
            if (targetResourcesElement) {
                targetResourcesElement.textContent = 
                    `Health: ${this.targetAsteroid.mesh.userData.health}`;
            }
            
            // Position the targeting indicator
            this.targetReticle.position.copy(this.targetAsteroid.mesh.position);
            this.targetReticle.visible = true;
            
            // Make the indicator look at the camera
            const lookAtPos = new THREE.Vector3().copy(this.scene.camera.position);
            this.targetReticle.lookAt(lookAtPos);
        }
        
        return this.targetAsteroid;
    }
    
    getCurrentTarget() {
        try {
            console.log("TargetingSystem: getCurrentTarget called");
            
            // Check if we have a valid target
            if (!this.targetAsteroid) {
                console.log("TargetingSystem: No current target");
                return null;
            }
            
            // Validate the target is still valid
            if (!this.targetAsteroid.mesh || !this.targetAsteroid.mesh.position) {
                console.error("TargetingSystem: Current target is invalid, clearing target");
                this.targetAsteroid = null;
                return null;
            }
            
            console.log("TargetingSystem: Returning current target:", this.targetAsteroid);
            return this.targetAsteroid;
        } catch (error) {
            console.error("TargetingSystem: Error in getCurrentTarget:", error);
            return null;
        }
    }
    
    isLockOnEnabled() {
        return this.lockOnEnabled === true;
    }
    
    findNearestTarget() {
        try {
            console.log("TargetingSystem: findNearestTarget called");
            
            if (!this.spaceship || !this.spaceship.mesh || !this.spaceship.mesh.position) {
                console.error("TargetingSystem: Cannot find nearest target - spaceship missing or invalid");
                return null;
            }
            
            // Get all asteroids
            let asteroids = [];
            
            // Try to get asteroids from the game environment
            const game = window.gameInstance || window.game;
            if (game && game.environment && Array.isArray(game.environment.asteroids)) {
                console.log(`TargetingSystem: Found ${game.environment.asteroids.length} asteroids in environment`);
                asteroids = game.environment.asteroids;
            } else {
                console.error("TargetingSystem: Could not access asteroids from game environment");
                return null;
            }
            
            if (asteroids.length === 0) {
                console.log("TargetingSystem: No asteroids found in environment");
                return null;
            }
            
            // Find the closest asteroid with proper validation
            let closestAsteroid = null;
            let closestDistance = Infinity;
            
            for (const asteroid of asteroids) {
                // Validate asteroid has required properties
                if (!asteroid || !asteroid.mesh || !asteroid.mesh.position) {
                    console.log("TargetingSystem: Skipping invalid asteroid", asteroid);
                    continue;
                }
                
                const distance = this.spaceship.mesh.position.distanceTo(asteroid.mesh.position);
                
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestAsteroid = asteroid;
                }
            }
            
            if (closestAsteroid) {
                console.log("TargetingSystem: Found nearest target:", closestAsteroid);
                
                // Select this target
                this.setTarget(closestAsteroid);
                
                return closestAsteroid;
            } else {
                console.log("TargetingSystem: No valid asteroid found after checking all asteroids");
                return null;
            }
        } catch (error) {
            console.error("TargetingSystem: Error in findNearestTarget:", error);
            return null;
        }
    }
    
    update() {
        // Update scan radius in case it has changed (from upgrades)
        this.scanRadius = this.getScanRadius();
        
        // Update lock-on targeting visuals
        if (this.lockOnEnabled && this.targetAsteroid) {
            // Update target indicator position
            this.targetReticle.position.copy(this.targetAsteroid.mesh.position);
            
            // Make indicator face the camera
            const lookAtPos = new THREE.Vector3().copy(this.scene.camera.position);
            this.targetReticle.lookAt(lookAtPos);
            
            // Rotate the inner rings in opposite directions for dynamic effect
            this.targetReticle.rotation.z += 0.01;
            if (this.targetReticle.children.length > 0) {
                this.targetReticle.children[0].rotation.z -= 0.02;
            }
            
            // Pulse the opacity and size for visual effect
            const pulseValue = Math.sin(Date.now() * 0.005);
            const opacity = 0.6 + 0.4 * pulseValue;
            const scale = 1 + 0.1 * pulseValue;
            
            this.targetReticle.material.opacity = opacity;
            this.targetReticle.scale.set(scale, scale, scale);
            
            // Update distance in UI
            const targetDistanceElement = document.getElementById('target-distance');
            if (targetDistanceElement) {
                const distance = Math.round(this.spaceship.mesh.position.distanceTo(this.targetAsteroid.mesh.position));
                targetDistanceElement.textContent = `Distance: ${distance} units`;
            }
            
            // If target is destroyed or too far away, find a new one
            if (!this.targetAsteroid.mesh.parent || 
                this.spaceship.mesh.position.distanceTo(this.targetAsteroid.mesh.position) > this.scanRadius) {
                this.scanForAsteroids();
            }
        }
        
        // Rescan for asteroids periodically in lock-on mode
        if (this.lockOnEnabled && Date.now() % 50 === 0) {
            this.scanForAsteroids();
        }
    }
    
    setTarget(target) {
        try {
            console.log("TargetingSystem: setTarget called", target);
            
            // Validate the target
            if (!target) {
                console.error("TargetingSystem: Cannot set null target");
                return;
            }
            
            if (!target.mesh || !target.mesh.position) {
                console.error("TargetingSystem: Target is missing mesh or position properties", target);
                return;
            }
            
            // Set the target
            this.targetAsteroid = target;
            
            // Update UI elements
            if (this.targetDisplay) {
                this.targetDisplay.style.display = 'block';
            }
            
            if (this.targetInfoElement) {
                // Format target info
                const distance = this.calculateDistanceToTarget();
                let resourceType = target.resourceType || 'Unknown';
                
                // Capitalize first letter
                resourceType = resourceType.charAt(0).toUpperCase() + resourceType.slice(1);
                
                // Update target info text
                this.targetInfoElement.textContent = `${resourceType} Asteroid - ${distance.toFixed(0)}m`;
                this.targetInfoElement.style.color = '#30cfd0';
                this.targetInfoElement.style.display = 'block';
            }
            
            console.log("TargetingSystem: Target successfully set", this.targetAsteroid);
            
            // Enable lock-on
            this.lockOnEnabled = true;
            
            return true;
        } catch (error) {
            console.error("TargetingSystem: Error in setTarget:", error);
            return false;
        }
    }
    
    calculateDistanceToTarget() {
        try {
            if (!this.targetAsteroid || !this.targetAsteroid.mesh || !this.targetAsteroid.mesh.position) {
                console.error("TargetingSystem: Cannot calculate distance - invalid target asteroid");
                return Infinity;
            }
            
            if (!this.spaceship || !this.spaceship.mesh || !this.spaceship.mesh.position) {
                console.error("TargetingSystem: Cannot calculate distance - invalid spaceship");
                return Infinity;
            }
            
            const distance = this.spaceship.mesh.position.distanceTo(this.targetAsteroid.mesh.position);
            return distance;
        } catch (error) {
            console.error("TargetingSystem: Error calculating distance to target:", error);
            return Infinity;
        }
    }
} 