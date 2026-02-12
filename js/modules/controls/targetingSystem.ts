// targetingSystem.js - Handles asteroid targeting and lock-on

import {
  Object3D,
  Vector3,
  Vector2,
  Scene,
  Camera,
  Mesh,
  RingGeometry,
  MeshBasicMaterial,
  DoubleSide,
  Raycaster,
} from 'three';

type Asteroid = {
    minable: boolean;
    resourceType?: string;
    mesh: Object3D & {
        position: Vector3;
        visible: boolean;
        parent?: Object3D | null;
    };
};

type Environment = {
    asteroids: Asteroid[];
};

type NearbyAsteroid = {
    asteroid: Asteroid;
    distance: number;
};

type SceneWithCamera = Scene & {
    camera: Camera;
};

type GameWindow = Window & {
    game?: {
        environment?: Environment;
    };
    gameInstance?: {
        environment?: Environment;
    };
};

export class TargetingSystem {
    spaceship: {
        mesh: {
            position: Vector3;
        };
        scanRange?: number;
    };
    scene: SceneWithCamera;
    environment: Environment;
    lockOnEnabled: boolean;
    nearbyAsteroids: Asteroid[];
    currentLockOnIndex: number;
    targetAsteroid: Asteroid | null;
    scanRadius: number;
    targetReticle!: Mesh;
    offScreenContainer: HTMLDivElement | null = null;
    offScreenIndicator: HTMLDivElement | null = null;
    targetDisplay: HTMLElement | null = null;
    targetInfoElement: HTMLElement | null = null;
    scanRadiusCounter?: number;
    rescanCounter?: number;
    lookAtCounter?: number;
    pulseTime?: number;
    uiUpdateCounter?: number;

    constructor(spaceship: TargetingSystem['spaceship'], scene: SceneWithCamera, environment: Environment) {
        this.spaceship = spaceship;
        this.scene = scene;
        this.environment = environment;
        
        this.lockOnEnabled = false;
        this.nearbyAsteroids = [];
        this.currentLockOnIndex = -1;
        this.targetAsteroid = null;
        this.scanRadius = this.getScanRadius(); // Get initial scan radius from spaceship
        this.targetDisplay = document.getElementById('target-display');
        this.targetInfoElement = document.getElementById('target-info');
        
        this.createTargetReticle();
        // Create off-screen indicators
        this.createOffScreenIndicators();
    }
    
    createTargetReticle(): void {
        // Create the target indicator geometry (outer ring)
        const ringGeometry = new RingGeometry(150, 180, 32);
        const ringMaterial = new MeshBasicMaterial({
            color: 0xff3030,
            side: DoubleSide,
            transparent: true,
            opacity: 0.7
        });
        
        this.targetReticle = new Mesh(ringGeometry, ringMaterial);
        this.targetReticle.visible = false;
        this.scene.add(this.targetReticle);
        
        // Add inner ring for additional visual interest
        const innerRingGeometry = new RingGeometry(75, 90, 32);
        const innerRingMaterial = new MeshBasicMaterial({
            color: 0xff6060,
            side: DoubleSide,
            transparent: true,
            opacity: 0.5
        });
        
        const innerRing = new Mesh(innerRingGeometry, innerRingMaterial);
        this.targetReticle.add(innerRing);
    }
    
    // Helper method to get the current scan radius from the spaceship
    getScanRadius(): number {
        // Increase default scan radius by 5x (from 1000 to 5000)
        return this.spaceship && this.spaceship.scanRange 
            ? this.spaceship.scanRange * 5 
            : 5000; // Default value increased by 5x
    }
    
    toggleLockOn(): boolean {
        this.lockOnEnabled = !this.lockOnEnabled;
        
        if (this.lockOnEnabled) {
            // Update scan radius before scanning
            this.scanRadius = this.getScanRadius();
            
            // Scan for nearby asteroids
            this.scanForAsteroids();
            
            // Only show targeting UI if we're actually enabling targeting
            const targetInfoElement = document.getElementById('target-info');
            if (targetInfoElement) {
                targetInfoElement.style.display = 'block';
                targetInfoElement.style.color = '#30cfd0';
                
                // Update the content to show we're scanning
                const targetName = document.getElementById('target-name');
                if (targetName) {
                    targetName.textContent = 'Scanning for targets...';
                }
            }
            
            // Automatically select the closest target
            if (this.nearbyAsteroids.length > 0) {
                this.findNearestTarget();
            }
        } else {
            // Clear target and hide UI
            this.nearbyAsteroids = [];
            this.currentLockOnIndex = -1;
            this.targetAsteroid = null;
            this.targetReticle.visible = false;
            
            // Hide off-screen indicators
            this.hideOffScreenIndicators();
            
            // Hide targeting UI
            const targetInfoElement = document.getElementById('target-info');
            if (targetInfoElement) {
                targetInfoElement.style.display = 'none';
            }
        }
        
        return this.lockOnEnabled;
    }
    
    scanForAsteroids(): boolean {
        this.nearbyAsteroids = [];
        const shipPosition = this.spaceship.mesh.position;
        
        // Create raycaster for line-of-sight validation
        const raycaster = new Raycaster();
        const nearby: NearbyAsteroid[] = [];
        
        // Find all asteroids within scan radius
        const asteroids = this.environment.asteroids;
        asteroids.forEach(asteroid => {
            // Skip asteroids that aren't minable or visible
            if (!asteroid.minable || !asteroid.mesh.visible) return;
            
            const distance = shipPosition.distanceTo(asteroid.mesh.position);
            if (distance <= this.scanRadius) {
                // Perform raycasting to verify line of sight
                const direction = new Vector3()
                    .subVectors(asteroid.mesh.position, shipPosition)
                    .normalize();
                
                raycaster.set(shipPosition, direction);
                raycaster.far = distance;
                
                // Check for intersections with all asteroids
                const intersects = raycaster.intersectObjects(
                    asteroids.filter(a => a.mesh && a.mesh.visible).map(a => a.mesh)
                );
                
                // If the first intersection is our target asteroid, it's visible
                if (intersects.length > 0 && intersects[0].object === asteroid.mesh) {
                    nearby.push({
                        asteroid: asteroid,
                        distance: distance
                    });
                }
            }
        });
        
        // Sort by distance
        nearby.sort((a, b) => a.distance - b.distance);
        
        // Extract just the asteroid objects after sorting
        this.nearbyAsteroids = nearby.map(item => item.asteroid);
        
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
    
    cycleLockOnTarget(_direction?: number): Asteroid | null {
        if (!this.lockOnEnabled || this.nearbyAsteroids.length === 0) return null;
        
        // Move to next target
        this.currentLockOnIndex = (this.currentLockOnIndex + 1) % this.nearbyAsteroids.length;
        return this.updateLockedOnTarget();
    }
    
    updateLockedOnTarget(): Asteroid | null {
        this.targetAsteroid = this.nearbyAsteroids[this.currentLockOnIndex];
        
        if (this.targetAsteroid) {
            // Don't update UI here - let the mining system handle it
            // This prevents overwriting the mining system's detailed info
            console.log(`Target locked: ${this.targetAsteroid.resourceType} asteroid`);
            
            // Position the targeting indicator
            this.targetReticle.position.copy(this.targetAsteroid.mesh.position);
            this.targetReticle.visible = true;
            
            // Make the indicator look at the camera
            const lookAtPos = new Vector3().copy(this.scene.camera.position);
            this.targetReticle.lookAt(lookAtPos);
            
            // Ensure proper scale and visibility
            this.targetReticle.scale.set(1, 1, 1);
            (this.targetReticle.material as MeshBasicMaterial).opacity = 0.8;
            if (this.targetReticle.children.length > 0) {
                const child = this.targetReticle.children[0] as Mesh;
                if (child.material && 'opacity' in child.material) {
                    (child.material as MeshBasicMaterial).opacity = 0.8;
                }
            }
        }
        
        return this.targetAsteroid;
    }
    
    getCurrentTarget(): Asteroid | null {
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
    
    isLockOnEnabled(): boolean {
        return this.lockOnEnabled === true;
    }
    
    findNearestTarget(): Asteroid | null {
        try {
            if (!this.spaceship || !this.spaceship.mesh || !this.spaceship.mesh.position) {
                return null;
            }
            
            // Get all asteroids
            let asteroids = [];
            
            // Try to get asteroids from the game environment
            const windowWithGame = window as GameWindow;
            const game = windowWithGame.gameInstance || windowWithGame.game;
            if (game && game.environment && Array.isArray(game.environment.asteroids)) {
                asteroids = game.environment.asteroids;
            } else {
                return null;
            }
            
            if (asteroids.length === 0) {
                return null;
            }
            
            // Find the closest asteroid with proper validation
            let closestAsteroid = null;
            let closestDistance = Infinity;
            
            for (const asteroid of asteroids) {
                // Validate asteroid has required properties and is visible and minable
                if (!asteroid || !asteroid.mesh || !asteroid.mesh.position || !asteroid.mesh.visible || !asteroid.minable) {
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
    
    update(): void {
        // Only update scan radius every 30 frames for performance
        if (!this.scanRadiusCounter) this.scanRadiusCounter = 0;
        this.scanRadiusCounter++;
        if (this.scanRadiusCounter >= 30) {
            this.scanRadiusCounter = 0;
            this.scanRadius = this.getScanRadius();
        }
        
        // If targeting is enabled, periodically rescan for new asteroids
        if (this.lockOnEnabled) {
            // Rescan every 120 frames (about every 2 seconds at 60fps) for better performance
            if (!this.rescanCounter) this.rescanCounter = 0;
            this.rescanCounter++;
            
            if (this.rescanCounter >= 120) {
                this.rescanCounter = 0;
                this.scanForAsteroids();
                
                // If we found new asteroids and don't have a target, auto-select one
                if (this.nearbyAsteroids.length > 0 && !this.targetAsteroid) {
                    this.findNearestTarget();
                }
            }
        }
        
        // Update lock-on targeting visuals (optimized)
        if (this.lockOnEnabled && this.targetAsteroid) {
            // Update target indicator position
            this.targetReticle.position.copy(this.targetAsteroid.mesh.position);
            
            // Make indicator face the camera (less frequently)
            if (!this.lookAtCounter) this.lookAtCounter = 0;
            this.lookAtCounter++;
            if (this.lookAtCounter >= 10) {  // Every 10 frames instead of every frame
                this.lookAtCounter = 0;
                this.targetReticle.lookAt(this.scene.camera.position);
            }
            
            // Simple rotation animation (more efficient)
            this.targetReticle.rotation.z += 0.005;  // Reduced rotation speed
            if (this.targetReticle.children.length > 0) {
                this.targetReticle.children[0].rotation.z -= 0.01;
            }
            
            // Simplified pulsing (no Date.now() calls)
            if (!this.pulseTime) this.pulseTime = 0;
            this.pulseTime += 0.02;  // Fixed time step
            const pulseValue = Math.sin(this.pulseTime);
            const opacity = 0.7 + 0.2 * pulseValue;  // Less dramatic pulsing
            (this.targetReticle.material as MeshBasicMaterial).opacity = opacity;
            
            // Update UI less frequently for performance
            if (!this.uiUpdateCounter) this.uiUpdateCounter = 0;
            this.uiUpdateCounter++;
            if (this.uiUpdateCounter >= 30) {  // Update UI every 30 frames (~0.5 seconds)
                this.uiUpdateCounter = 0;
                
                // Update distance in UI
                const targetDistanceElement = document.getElementById('target-distance');
                if (targetDistanceElement) {
                    const distance = Math.round(this.spaceship.mesh.position.distanceTo(this.targetAsteroid.mesh.position));
                    targetDistanceElement.textContent = `Distance: ${distance} units`;
                }
                
                // Check if target is destroyed or too far away
                if (!this.targetAsteroid.mesh.parent || 
                    this.spaceship.mesh.position.distanceTo(this.targetAsteroid.mesh.position) > this.scanRadius) {
                    this.scanForAsteroids();
                }
            }
            
            // Always show the reticle when targeting
            this.targetReticle.visible = true;
            
            // Simplified off-screen indicator (check less frequently)
            if (this.uiUpdateCounter === 15) {  // Check half-way through UI update cycle
                const isOnScreen = this.isTargetOnScreen();
                if (!isOnScreen) {
                    const targetDirection = this.getTargetDirection();
                    this.showOffScreenIndicator(targetDirection);
                } else {
                    this.hideOffScreenIndicators();
                }
            }
        }
    }
    
    setTarget(target: Asteroid): boolean | void {
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
    
    calculateDistanceToTarget(): number {
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
    
    // Add methods for off-screen indicators
    createOffScreenIndicators(): void {
        // Create container for off-screen indicators
        this.offScreenContainer = document.createElement('div');
        this.offScreenContainer.id = 'off-screen-indicators';
        this.offScreenContainer.className = 'offscreen-indicator-container';
        this.offScreenContainer.style.display = 'none';
        document.body.appendChild(this.offScreenContainer);
        
        // Create the arrow indicator
        this.offScreenIndicator = document.createElement('div');
        this.offScreenIndicator.className = 'offscreen-indicator-arrow';
        this.offScreenIndicator.innerHTML = `
            <svg width="30" height="30" viewBox="0 0 30 30">
                <polygon points="15,0 30,30 15,22 0,30" fill="#ff3030" />
            </svg>
        `;
        this.offScreenIndicator.style.display = 'none';
        this.offScreenContainer.appendChild(this.offScreenIndicator);
    }
    
    hideOffScreenIndicators(): void {
        if (this.offScreenContainer) {
            this.offScreenContainer.style.display = 'none';
        }
        if (this.offScreenIndicator) {
            this.offScreenIndicator.style.display = 'none';
        }
    }
    
    showOffScreenIndicator(targetDirection: Vector2): void {
        if (!this.offScreenContainer || !this.offScreenIndicator) return;
        
        // Show container
        this.offScreenContainer.style.display = 'block';
        this.offScreenIndicator.style.display = 'block';
        
        // Calculate angle for the arrow to point at target
        const angle = Math.atan2(targetDirection.y, targetDirection.x) * (180 / Math.PI);
        
        // Position at the edge of screen
        const margin = 50; // Margin from the screen edge
        const halfWidth = window.innerWidth / 2;
        const halfHeight = window.innerHeight / 2;
        
        // Normalize direction vector
        const normalizedDir = new Vector2(targetDirection.x, targetDirection.y).normalize();
        
        // Calculate intersection with screen edge
        let edgeX, edgeY;
        
        // Check if we're intersecting with the vertical or horizontal edge
        const slopeRatio = Math.abs(normalizedDir.y / normalizedDir.x);
        const screenRatio = halfHeight / halfWidth;
        
        if (slopeRatio > screenRatio) {
            // Intersect with top/bottom edge
            edgeY = normalizedDir.y > 0 ? halfHeight - margin : -halfHeight + margin;
            edgeX = edgeY / normalizedDir.y * normalizedDir.x;
        } else {
            // Intersect with left/right edge
            edgeX = normalizedDir.x > 0 ? halfWidth - margin : -halfWidth + margin;
            edgeY = edgeX / normalizedDir.x * normalizedDir.y;
        }
        
        // Position the indicator at the edge of the screen
        this.offScreenIndicator.style.left = (halfWidth + edgeX) + 'px';
        this.offScreenIndicator.style.top = (halfHeight + edgeY) + 'px';
        this.offScreenIndicator.style.transform = `rotate(${angle}deg)`;
    }
    
    // Helper methods for screen position calculations
    isTargetOnScreen(): boolean {
        if (!this.targetAsteroid || !this.targetAsteroid.mesh) return false;
        
        const screenPosition = this.getScreenPosition(this.targetAsteroid.mesh.position);
        
        // Check if position is within screen bounds with some margin
        const margin = 0.1; // 10% margin
        return screenPosition.x >= -1 + margin && 
               screenPosition.x <= 1 - margin && 
               screenPosition.y >= -1 + margin && 
               screenPosition.y <= 1 - margin;
    }
    
    getScreenPosition(worldPosition: Vector3): Vector2 {
        // Create a copy of the position
        const tempVector = new Vector3().copy(worldPosition);
        
        // Project to screen space
        tempVector.project(this.scene.camera);
        
        return new Vector2(tempVector.x, tempVector.y);
    }
    
    getTargetDirection(): Vector2 {
        // Get normalized direction vector from screen center to target
        if (!this.targetAsteroid) {
            return new Vector2(0, 0);
        }
        const screenPosition = this.getScreenPosition(this.targetAsteroid.mesh.position);
        
        // Create a direction vector from screen center to target position
        return new Vector2(screenPosition.x, screenPosition.y);
    }
} 
