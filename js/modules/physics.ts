// physics.ts - Handles physics calculations and movement

import {
  Vector3,
  Quaternion,
  Euler,
  Scene,
  Camera,
  Raycaster,
  Mesh,
  Object3D,
  SphereGeometry,
  MeshBasicMaterial,
  DoubleSide,
  PerspectiveCamera,
  OrthographicCamera,
} from 'three';
import { DEBUG_MODE } from '../globals/debug.ts';
import { mainMessageBus } from '../globals/messageBus.ts';

// Reusable temp objects - never allocate in update loop
const _tempVec3A = new Vector3();
const _tempVec3B = new Vector3();
const _tempVec3C = new Vector3();
const _tempVec3D = new Vector3();
const _tempVec3E = new Vector3();
const _tempVec3F = new Vector3();
const _tempQuat = new Quaternion();
const _tempEuler = new Euler();

// Type definitions for physics-related objects
interface RotationState {
    x: number;
    y: number;
}

interface ThrustState {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    boost: boolean;
}

interface TrailEffects {
    updateTrailVisibility(isMoving: boolean, thrust: ThrustState, velocity: Vector3): void;
    updateParticles(thrust: ThrustState, velocity: Vector3): void;
}

interface Spaceship {
    mesh: Object3D;
    velocity: Vector3;
    thrust: ThrustState;
    isDestroyed: boolean;
    isDocked: boolean;
    collisionResistance: number;
    maxVelocity?: number;
    trailEffects: TrailEffects | null;
    consumeFuel(): boolean;
}

type CollisionType = "asteroid" | "planet" | "sun";

interface AsteroidData {
    mesh: Mesh;
}

interface AsteroidBeltUserData {
    asteroids: AsteroidData[];
}

// Dependency injection interfaces
interface GameStateAccessor {
    isIntroSequenceActive(): boolean;
}

interface InputAccessor {
    getInputIntent(): number | undefined;
}

interface AudioSystem {
    playSound(sound: string): void;
}

export class Physics {
    // Physics constants - significantly increased for super-fast movement
    static THRUST_FORCE = 0.5;      // 5x increase from previous 0.1
    static BOOST_MULTIPLIER = 4;    // Keep the same boost multiplier
    static MAX_VELOCITY = 25.0;     // Default maximum velocity (will use spaceship's value if available)
    static ROTATION_SPEED = 0.3;    // Increased for more responsive controls
    static COLLISION_DISTANCE = 15; // Reduced from 70 to match actual ship size
    static FRICTION = 0.01;         // Small friction to help with control (new)

    // Camera constants for smooth following
    static CAMERA_LAG = 0.1;        // Smoothing factor (0.08-0.15, lower = smoother/slower)
    static CAMERA_BASE_OFFSET = new Vector3(0, 5, 25); // Base camera offset
    static CAMERA_VELOCITY_SCALE = 0.3; // How much velocity affects camera distance (0.3 = +30% at max speed)
    static CAMERA_LOOKAHEAD_SCALE = 20; // Max look-ahead distance based on velocity

    // Camera shake constants
    static SHAKE_DECAY = 0.95;      // How fast shake decays per frame (0.95 = 5% per frame)
    static SHAKE_FREQUENCY = 15.0;  // Frequency for shake oscillation

    // Camera recoil constants
    static RECOIL_DECAY = 0.85;      // How fast recoil decays per frame (0.85 = 15% per frame)
    static RECOIL_FREQUENCY = 20.0;  // Frequency for recoil oscillation
    static RECOIL_DURATION = 0.05;   // Duration of the initial recoil impulse in seconds
    static RECOIL_MAX_INTENSITY_PROJECTILE = 0.1; // Max recoil for projectile weapons
    static RECOIL_MAX_INTENSITY_LASER = 0.2;      // Max recoil for laser weapons
    static RECOIL_MAX_INTENSITY_HEAVY = 0.5;      // Max recoil for heavy weapons

    // Camera zoom constants
    static ZOOM_BOOST_MULTIPLIER = 1.3;  // Zoom out when boosting (1.3x = 30% zoom out)
    static ZOOM_LERP_SPEED = 0.05;       // Smooth transition speed for zoom (0.05 = moderate smoothness)

    scene: Scene;
    spaceship: Spaceship | null;
    camera: Camera | null;
    rotationState: RotationState;
    collided: boolean;
    raycaster: Raycaster;
    direction: Vector3;
    collisionDistance: number;
    normalizedDeltaTime: number = 0;

    // Camera shake state
    shakeIntensity: number = 0;     // Current shake strength (0-1)
    shakeTime: number = 0;          // Time accumulator for shake oscillation

    // Camera recoil state
    recoilIntensity: number = 0;    // Current recoil strength (0-1)
    recoilTime: number = 0;         // Time accumulator for recoil oscillation
    recoilDirection: Vector3 = new Vector3(); // Direction of recoil (opposite to firing)

    // Camera zoom state
    currentZoom: number = 1.0;      // Current zoom multiplier (1.0 = normal, 1.3 = zoomed out)
    targetZoom: number = 1.0;       // Target zoom multiplier for smooth interpolation

    // Injected dependencies (optional for backward compatibility)
    private gameState?: GameStateAccessor;
    private inputAccessor?: InputAccessor;
    private audioSystem?: AudioSystem;

    constructor(
        scene: Scene,
        options?: {
            gameState?: GameStateAccessor;
            inputAccessor?: InputAccessor;
            audioSystem?: AudioSystem;
        }
    ) {
        this.scene = scene;
        this.spaceship = null; // Will be set later
        this.camera = null; // Will be set later

        // Store injected dependencies
        this.gameState = options?.gameState;
        this.inputAccessor = options?.inputAccessor;
        this.audioSystem = options?.audioSystem;

        // Virtual rotation state for pointer lock
        this.rotationState = {
            x: 0,
            y: 0
        };

        // Collision state
        this.collided = false;

        // For collision detection
        this.raycaster = new Raycaster();
        this.direction = new Vector3(0, 0, -1);
        this.collisionDistance = Physics.COLLISION_DISTANCE; // Use the class constant for consistency

        // Subscribe to combat events for camera shake
        this.subscribeToEvents();
    }

    /**
     * Subscribe to combat events to trigger camera shake
     */
    private subscribeToEvents(): void {
        // Player damaged - medium shake
        mainMessageBus.subscribe('player.damaged', () => {
            this.triggerShake(0.5, 0.2);
        });

        // Entity destroyed - small shake (covers enemies and asteroids)
        mainMessageBus.subscribe('entity.destroyed', () => {
            this.triggerShake(0.3, 0.15);
        });

        // Explosion VFX - large shake
        mainMessageBus.subscribe('vfx.explosion', () => {
            this.triggerShake(0.8, 0.3);
        });

        // Weapon fire - trigger camera recoil
        mainMessageBus.subscribe('weapon.fire', (message: any) => {
            const { type, direction } = message.data || {};
            let intensity = 0;
            switch (type) {
                case 'projectile':
                    intensity = Physics.RECOIL_MAX_INTENSITY_PROJECTILE;
                    break;
                case 'laser':
                    intensity = Physics.RECOIL_MAX_INTENSITY_LASER;
                    break;
                case 'heavy':
                    intensity = Physics.RECOIL_MAX_INTENSITY_HEAVY;
                    break;
                default:
                    intensity = Physics.RECOIL_MAX_INTENSITY_PROJECTILE;
            }
            if (direction) {
                this.triggerRecoil(intensity, direction);
            }
        });
    }

    /**
     * Trigger camera shake effect
     * @param intensity Shake strength (0-1)
     * @param duration Duration in seconds
     */
    triggerShake(intensity: number, _duration: number): void {
        // Use maximum intensity if multiple shakes occur simultaneously
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
        // Don't reset time - let it continue for organic motion
    }

    /**
     * Trigger camera recoil effect
     * @param intensity Recoil strength (0-1)
     * @param direction Direction of the recoil (e.g., opposite to firing)
     */
    triggerRecoil(intensity: number, direction: Vector3): void {
        this.recoilIntensity = Math.max(this.recoilIntensity, intensity);
        this.recoilTime = 0; // Reset time to start recoil animation from beginning
        this.recoilDirection.copy(direction).negate(); // Store opposite of firing direction
    }
    
    // Set spaceship reference
    setSpaceship(spaceship: Spaceship): void {
        this.spaceship = spaceship;
    }
    
    // Set camera reference
    setCamera(camera: Camera): void {
        this.camera = camera;
    }
    
    update(deltaTime: number): void {
        if (!this.spaceship || this.spaceship.isDestroyed) return;

        // Check if ship is docked - skip physics if docked
        if (this.spaceship.isDocked) return;

        // Skip physics updates if intro sequence is active
        if (this.gameState?.isIntroSequenceActive()) {
            return;
        }
        
        // Use a normalized deltaTime to standardize physics at 60 FPS feel
        // This is the key to frame rate independence
        this.normalizedDeltaTime = deltaTime * 60;
        
        // Check if we have fuel
        const hasFuel = this.spaceship.consumeFuel();
        
        // Apply thrust based on controls - only if we have fuel
        const thrustVector = _tempVec3A.set(0, 0, 0);
        let isThrusting = false;
        
        // Get the ship's forward direction
        const shipForward = _tempVec3B.set(0, 0, -1);
        shipForward.applyQuaternion(this.spaceship.mesh.quaternion);
        
        // Calculate dot product to determine how much we're moving forward
        const forwardVelocity = shipForward.dot(this.spaceship.velocity);
        void forwardVelocity; // Suppress unused variable warning
        
        // Visual effects are now handled entirely by the trail module
        // Physics only handles movement calculations
        
        if (hasFuel) {
            // NOTE: Player authority migrating to ECS. Respect inputIntent when available.
            const intent = this.inputAccessor?.getInputIntent();

            // Determine input source and compute thrust state without circular dependency
            let forwardPressed: boolean;
            let backwardPressed: boolean;
            let leftPressed: boolean;
            let rightPressed: boolean;
            let boostPressed: boolean;

            if (intent !== undefined) {
                // Keyboard input system is active - use inputIntent exclusively (even if 0)
                forwardPressed = (intent & 1) !== 0;
                backwardPressed = (intent & 2) !== 0;
                leftPressed = (intent & 4) !== 0;
                rightPressed = (intent & 8) !== 0;
                boostPressed = (intent & 16) !== 0;
            } else {
                // Keyboard input not initialized - use gamepad/touch thrust values
                forwardPressed = this.spaceship.thrust.forward;
                backwardPressed = this.spaceship.thrust.backward;
                leftPressed = this.spaceship.thrust.left;
                rightPressed = this.spaceship.thrust.right;
                boostPressed = this.spaceship.thrust.boost;
            }

            // Synchronize spaceship.thrust with input state for audio system
            this.spaceship.thrust.forward = forwardPressed;
            this.spaceship.thrust.backward = backwardPressed;
            this.spaceship.thrust.left = leftPressed;
            this.spaceship.thrust.right = rightPressed;
            this.spaceship.thrust.boost = boostPressed;

            // Update zoom target based on boost state
            this.targetZoom = boostPressed ? Physics.ZOOM_BOOST_MULTIPLIER : 1.0;

            // Forward thrust handling
            if (forwardPressed) {
                isThrusting = true;
                const forwardThrust = _tempVec3C.set(0, 0, -Physics.THRUST_FORCE);
                if (boostPressed) forwardThrust.multiplyScalar(Physics.BOOST_MULTIPLIER);
                thrustVector.add(forwardThrust);
                
                // Visual effects handled by trail module
            }
            // Visual effects handled by trail module
            
            // Backward thrust handling
            if (backwardPressed) {
                isThrusting = true;
                thrustVector.add(_tempVec3C.set(0, 0, Physics.THRUST_FORCE));
                
                // Visual effects handled by trail module
            }
            // Visual effects handled by trail module
            
            // Left thrust handling - A key pressed, move LEFT (negative X)
            if (leftPressed) {
                isThrusting = true;
                thrustVector.add(_tempVec3C.set(-Physics.THRUST_FORCE, 0, 0));
                
                // Visual effects handled by trail module
            }
            // Visual effects handled by trail module
            
            // Right thrust handling - D key pressed, move RIGHT (positive X)
            if (rightPressed) {
                isThrusting = true;
                thrustVector.add(_tempVec3C.set(Physics.THRUST_FORCE, 0, 0));
                
                // Visual effects handled by trail module
            }
            // Visual effects handled by trail module
            
            if (isThrusting) {
                // Apply thrust in world space (only if actively thrusting)
                thrustVector.applyQuaternion(this.spaceship.mesh.quaternion);
                
                // Apply thrust scaled by normalized delta time
                thrustVector.multiplyScalar(this.normalizedDeltaTime);
                this.spaceship.velocity.add(thrustVector);
                
                // Get the current max velocity from the spaceship
                const maxVelocity = this.getMaxVelocity();
                
                // Cap velocity at maximum speed
                if (this.spaceship.velocity.length() > maxVelocity) {
                    this.spaceship.velocity.normalize().multiplyScalar(maxVelocity);
                }
            }
        } else {
            // No fuel - reset all thrust states for audio system
            this.spaceship.thrust.forward = false;
            this.spaceship.thrust.backward = false;
            this.spaceship.thrust.left = false;
            this.spaceship.thrust.right = false;
            this.spaceship.thrust.boost = false;
        }

        // Add a small amount of "space friction" to make controls more manageable
        // This isn't realistic physics but makes the game more enjoyable to play
        if (!isThrusting && this.spaceship.velocity.length() > 0) {
            const friction = Physics.FRICTION * this.normalizedDeltaTime;
            if (this.spaceship.velocity.length() > friction) {
                this.spaceship.velocity.multiplyScalar(1 - friction);
            } else {
                this.spaceship.velocity.set(0, 0, 0);
            }
        }
        
        // CRITICAL: Always update position based on current velocity (Newton's first law)
        // Objects in motion stay in motion unless acted upon by a force
        // Scale position update by normalized delta time
        const positionDelta = _tempVec3C.copy(this.spaceship.velocity).multiplyScalar(this.normalizedDeltaTime);
        this.spaceship.mesh.position.add(positionDelta);
        
        // Apply rotation based on rotationState
        this.updateShipRotation();
        
        // Update camera position
        this.updateCamera();
        
        // Update trail effects based on movement and thrust
        if (this.spaceship.trailEffects) {
            // Show effects based on ANY thrust or movement
            const isMoving = this.spaceship.velocity.length() > 0.1;
            
            // Update trail effects directly
            this.spaceship.trailEffects.updateTrailVisibility(isMoving, this.spaceship.thrust, this.spaceship.velocity);
            this.spaceship.trailEffects.updateParticles(this.spaceship.thrust, this.spaceship.velocity);
        }
        
        // Check for collisions with asteroids and planets
        this.checkCollisions();
    }
    
    // Helper method to get the max velocity from the spaceship or use the default
    getMaxVelocity(): number {
        return this.spaceship && this.spaceship.maxVelocity 
            ? this.spaceship.maxVelocity 
            : Physics.MAX_VELOCITY;
    }
    
    updateShipRotation(): void {
        if (!this.spaceship) return;
        
        // Cap y rotation to prevent flipping over (optional, can be adjusted or removed)
        const maxY = Math.PI * 0.45; // Limit to ~45 degrees up/down
        this.rotationState.y = Math.max(Math.min(this.rotationState.y, maxY), -maxY);
        
        // Create a quaternion for rotation
        _tempEuler.set(this.rotationState.y, this.rotationState.x, 0, 'YXZ');
        _tempQuat.setFromEuler(_tempEuler);
        
        // Smoothly interpolate current rotation to target rotation
        // Use rotation speed scaled by normalized delta time
        this.spaceship.mesh.quaternion.slerp(_tempQuat, Physics.ROTATION_SPEED * this.normalizedDeltaTime);
    }
    
    updateCamera(): void {
        if (!this.spaceship || !this.camera) return;

        // Skip camera updates if intro sequence is active
        if (this.gameState?.isIntroSequenceActive()) {
            console.log("Skipping camera update - intro sequence active");
            return;
        }

        // Update the camera to follow the spaceship with smooth damping and velocity-based offset

        // Smoothly interpolate current zoom toward target zoom
        this.currentZoom += (this.targetZoom - this.currentZoom) * Physics.ZOOM_LERP_SPEED;

        // Calculate velocity magnitude (0-1 normalized)
        const maxVelocity = this.spaceship.maxVelocity || Physics.MAX_VELOCITY;
        const velocityMagnitude = this.spaceship.velocity.length();
        const velocityNormalized = Math.min(velocityMagnitude / maxVelocity, 1.0);

        // Scale camera offset based on velocity (pull back when moving fast)
        const velocityScale = 1.0 + (velocityNormalized * Physics.CAMERA_VELOCITY_SCALE);
        const cameraOffset = Physics.CAMERA_BASE_OFFSET.clone()
            .multiplyScalar(velocityScale)
            .multiplyScalar(this.currentZoom);  // Apply zoom multiplier to increase distance when boosting

        // Apply spaceship rotation to camera offset
        const rotatedOffset = cameraOffset.clone();
        rotatedOffset.applyQuaternion(this.spaceship.mesh.quaternion);

        // Calculate target camera position
        const targetPosition = _tempVec3D.copy(this.spaceship.mesh.position).add(rotatedOffset);

        // Smoothly interpolate camera position (damping)
        this.camera.position.lerp(targetPosition, Physics.CAMERA_LAG);

        // Apply camera shake if active
        if (this.shakeIntensity > 0.01) {
            this.applyShake();
        }

        // Apply camera recoil if active
        if (this.recoilIntensity > 0.01) {
            this.applyRecoil();
        }

        // Calculate velocity-based look-ahead point
        const velocityDirection = _tempVec3D.copy(this.spaceship.velocity).normalize();
        const lookAheadOffset = velocityDirection.multiplyScalar(velocityNormalized * Physics.CAMERA_LOOKAHEAD_SCALE);

        // Look ahead of the spaceship in movement direction
        const baseLookAt = _tempVec3E.set(0, 0, -60); // Base forward look point
        baseLookAt.applyQuaternion(this.spaceship.mesh.quaternion);

        const lookAtPoint = _tempVec3F
            .copy(this.spaceship.mesh.position)
            .add(baseLookAt)
            .add(lookAheadOffset);

        this.camera.lookAt(lookAtPoint);

        // Force visible frustum (debugging purposes)
        if (this.camera instanceof PerspectiveCamera || this.camera instanceof OrthographicCamera) {
            this.camera.far = 400000; // Ensure far clip plane is beyond skybox
            this.camera.updateProjectionMatrix();
        }
    }

    /**
     * Apply camera shake offset
     * Uses dual-frequency sine waves for organic motion
     */
    private applyShake(): void {
        if (!this.camera || !this.spaceship) return;

        // Update shake time
        this.shakeTime += this.normalizedDeltaTime * 0.016; // Convert normalized time to seconds

        // Create organic shake using dual-frequency sine waves
        // Primary frequency
        const offsetX = Math.sin(this.shakeTime * Physics.SHAKE_FREQUENCY) * this.shakeIntensity * 0.5;
        const offsetY = Math.sin(this.shakeTime * Physics.SHAKE_FREQUENCY * 1.3) * this.shakeIntensity * 0.5;
        const offsetZ = Math.sin(this.shakeTime * Physics.SHAKE_FREQUENCY * 0.8) * this.shakeIntensity * 0.3;

        // Secondary frequency for more organic feel
        const offsetX2 = Math.sin(this.shakeTime * Physics.SHAKE_FREQUENCY * 2.5) * this.shakeIntensity * 0.25;
        const offsetY2 = Math.sin(this.shakeTime * Physics.SHAKE_FREQUENCY * 3.1) * this.shakeIntensity * 0.25;

        // Combine frequencies
        const shakeOffset = _tempVec3D.set(
            offsetX + offsetX2,
            offsetY + offsetY2,
            offsetZ
        );

        // Apply shake in camera's local space (relative to camera orientation)
        // This makes the shake feel more natural as it moves with the camera
        const cameraRight = _tempVec3A.set(1, 0, 0).applyQuaternion(this.camera.quaternion);
        const cameraUp = _tempVec3B.set(0, 1, 0).applyQuaternion(this.camera.quaternion);
        const cameraForward = _tempVec3C.set(0, 0, -1).applyQuaternion(this.camera.quaternion);

        const worldShakeOffset = _tempVec3E.set(0, 0, 0)
            .addScaledVector(cameraRight, shakeOffset.x)
            .addScaledVector(cameraUp, shakeOffset.y)
            .addScaledVector(cameraForward, shakeOffset.z);

        this.camera.position.add(worldShakeOffset);

        // Decay shake intensity
        this.shakeIntensity *= Physics.SHAKE_DECAY;

        // Stop shake when intensity is negligible
        if (this.shakeIntensity < 0.01) {
            this.shakeIntensity = 0;
        }
    }

    /**
     * Apply camera recoil offset
     * Applies a brief, decaying camera offset in the recoil direction.
     */
    private applyRecoil(): void {
        if (!this.camera || !this.spaceship || this.recoilIntensity <= 0) return;

        // Update recoil time
        this.recoilTime += this.normalizedDeltaTime * 0.016; // Convert normalized time to seconds

        // Calculate recoil offset using a decaying sine wave
        const recoilOffset = _tempVec3A
            .copy(this.recoilDirection)
            .multiplyScalar(
                this.recoilIntensity *
                Math.sin(this.recoilTime * Physics.RECOIL_FREQUENCY) *
                Math.exp(-this.recoilTime / Physics.RECOIL_DURATION)
            );

        // Apply recoil in world space
        this.camera.position.add(recoilOffset);

        // Decay recoil intensity over time for a quick return
        this.recoilIntensity *= Physics.RECOIL_DECAY;

        // Stop recoil when intensity is negligible
        if (this.recoilIntensity < 0.01) {
            this.recoilIntensity = 0;
            this.recoilTime = 0; // Reset time for next recoil
        }
    }
    
    // Update rotation based on mouse movement deltas
    updateRotation(deltaX: number, deltaY: number): void {
        // Update the rotation directly
        this.rotationState.x -= deltaX;
        this.rotationState.y -= deltaY;
    }
    
    // Check for collisions with asteroids and planets
    checkCollisions(): void {
        if (!this.scene || !this.spaceship || !this.spaceship.mesh) return;
        const shipMesh = this.spaceship.mesh;
        
        // Set a smaller collision radius based on actual ship size
        // This was previously Physics.COLLISION_DISTANCE (70) which was too large
        const shipRadius = 15; // Reduced from 70 to match actual ship size
        const shipPosition = shipMesh.position.clone();
        
        // First check if we're colliding with our own projectiles and skip those
        this.scene.traverse((object: Object3D) => {
            if (object.type === 'Mesh' && 
                'geometry' in object && 
                object.geometry && 
                typeof object.geometry === 'object' &&
                'type' in object.geometry &&
                typeof object.geometry.type === 'string' &&
                object.geometry.type.includes('SphereGeometry') && 
                'userData' in object &&
                typeof object.userData === 'object' &&
                object.userData !== null &&
                'isPlayerProjectile' in object.userData &&
                object.userData.isPlayerProjectile &&
                'sourceId' in object.userData &&
                object.userData.sourceId === 'player') {
                
                // Skip our own projectiles - don't even process them
                return;
            }
        });
        
        // 1. Check collisions with asteroids
        const asteroidMeshes: Mesh[] = [];
        
        // Direct access to the asteroid belt if possible
        const asteroidBelt = this.scene.children.find((child: Object3D) => child.name === 'asteroidBelt');
        let asteroids: AsteroidData[] = [];
        
        // If we can get direct access to asteroid belt object, use that for better performance
        if (asteroidBelt && 
            'userData' in asteroidBelt && 
            typeof asteroidBelt.userData === 'object' &&
            asteroidBelt.userData !== null &&
            'asteroids' in asteroidBelt.userData) {
            const userData = asteroidBelt.userData as AsteroidBeltUserData;
            asteroids = userData.asteroids;
            asteroidMeshes.push(...asteroids.map(a => a.mesh));
        } else {
            // Otherwise do the more expensive scene traversal
            this.scene.traverse((object: Object3D) => {
                // Check for asteroids using geometry type
                if (object.type === 'Mesh' && 
                    'geometry' in object && 
                    object.geometry && 
                    typeof object.geometry === 'object' &&
                    'type' in object.geometry &&
                    typeof object.geometry.type === 'string' &&
                    (object.geometry.type.includes('IcosahedronGeometry') || 
                     object.geometry.type.includes('TetrahedronGeometry') || 
                     object.geometry.type.includes('OctahedronGeometry'))) {
                    
                    // Only consider objects within the asteroid belt range to avoid false positives
                    const distFromCenter = Math.sqrt(
                        object.position.x * object.position.x + 
                        object.position.z * object.position.z
                    );
                    
                    // Only include objects in the appropriate distance range from the center
                    // This helps avoid mistaking other geometric objects for asteroids
                    if (distFromCenter > 16000 && distFromCenter < 32000) {
                        asteroidMeshes.push(object as Mesh);
                    }
                }
            });
        }
        
        // Check distance to each asteroid - precise collision detection
        for (const asteroid of asteroidMeshes) {
            // Skip null items or invisible asteroids
            if (!asteroid || !asteroid.visible) continue;
            
            const distance = shipPosition.distanceTo(asteroid.position);
            
            // Use actual size from geometry if available - no artificial inflation
            let asteroidRadius = 0;
            
            if (asteroid.geometry && 
                'parameters' in asteroid.geometry &&
                typeof asteroid.geometry.parameters === 'object' &&
                asteroid.geometry.parameters !== null &&
                'radius' in asteroid.geometry.parameters &&
                typeof asteroid.geometry.parameters.radius === 'number') {
                // Use the exact geometry radius without multiplication
                asteroidRadius = asteroid.geometry.parameters.radius;
            } else {
                // Fallback size - more accurate estimation
                asteroidRadius = 60; // 4x original value to match larger asteroids
            }
            
            // If collision detected - uses the sum of actual ship and asteroid radii
            if (distance < (shipRadius + asteroidRadius)) {
                // Only log collision in debug mode
                if (DEBUG_MODE.enabled) {
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
        this.scene.traverse((object: Object3D) => {
            // Check if this is a planet - they typically have larger scale
            if (object.type === 'Mesh' && 
                'geometry' in object &&
                object.geometry &&
                typeof object.geometry === 'object' &&
                'type' in object.geometry &&
                typeof object.geometry.type === 'string' &&
                object.geometry.type.includes('SphereGeometry') && 
                object.scale.x >= 1 && // To filter out particles and small objects
                'userData' in object &&
                typeof object.userData === 'object' &&
                object.userData !== null &&
                (!('id' in object.userData) || 
                 typeof object.userData.id !== 'string' || 
                 !object.userData.id.startsWith('asteroid-')) && // Not an asteroid
                (!('isPlayerProjectile' in object.userData) || !object.userData.isPlayerProjectile) && // Not a player projectile
                object !== shipMesh) { // Not the spaceship itself
                
                const distance = shipPosition.distanceTo(object.position);
                
                // For planets, we use the actual geometry radius without artificial inflation
                if ('parameters' in object.geometry &&
                    typeof object.geometry.parameters === 'object' &&
                    object.geometry.parameters !== null &&
                    'radius' in object.geometry.parameters &&
                    typeof object.geometry.parameters.radius === 'number') {
                    const planetRadius = object.geometry.parameters.radius * object.scale.x;
                    
                    // If the object is the sun
                    if ('material' in object &&
                        object.material &&
                        typeof object.material === 'object' &&
                        'emissive' in object.material &&
                        object.material.emissive &&
                        typeof object.material.emissive === 'object' &&
                        'r' in object.material.emissive &&
                        'g' in object.material.emissive &&
                        typeof object.material.emissive.r === 'number' &&
                        typeof object.material.emissive.g === 'number' &&
                        object.material.emissive.r > 0.5 && 
                        object.material.emissive.g > 0.5) {
                        // Sun collision: if we're within the exact combined radius
                        if (distance < planetRadius + shipRadius) {
                            this.handleCollision(object as Mesh, "sun");
                            return;
                        }
                    } 
                    // Regular planet collision
                    else if (distance < planetRadius + shipRadius) {
                        this.handleCollision(object as Mesh, "planet");
                        return;
                    }
                }
            }
        });
    }
    
    handleCollision(object: Mesh, type: CollisionType): void {
        if (this.collided || !this.scene || !this.spaceship) return; // Only handle the first collision
        
        this.collided = true;
        
        // Enhanced logging for collision diagnostics (only in debug mode)
        if (DEBUG_MODE.enabled) {
            console.log("=== COLLISION DETECTED ===");
            console.log(`Collision type: ${type}`);
            console.log(`Ship velocity at impact: ${this.spaceship.velocity.length().toFixed(2)} units/frame`);
            console.log(`Ship position: x=${this.spaceship.mesh.position.x.toFixed(0)}, y=${this.spaceship.mesh.position.y.toFixed(0)}, z=${this.spaceship.mesh.position.z.toFixed(0)}`);
            console.log(`${type} position: x=${object.position.x.toFixed(0)}, y=${object.position.y.toFixed(0)}, z=${object.position.z.toFixed(0)}`);
            console.log(`Hull resistance: ${this.spaceship.collisionResistance}`);
        }
        
        // Apply hull resistance to see if we survive the collision
        if (this.attemptCollisionRecovery(type)) {
            if (DEBUG_MODE.enabled) console.log("Hull absorbed collision damage!");
            this.createRecoveryEffect();
            
            // Bounce away from the collision point
            if (object && object.position) {
                const bounceDirection = _tempVec3A
                    .subVectors(this.spaceship.mesh.position, object.position)
                    .normalize();
                
                // Apply a bounce force
                this.spaceship.velocity.copy(bounceDirection.multiplyScalar(5));
            }
            
            // Play the "boink" sound for minor collisions
            if (this.audioSystem) {
                this.audioSystem.playSound('boink');
            }
            
            // Reset collision state after a short delay
            setTimeout(() => {
                this.collided = false;
                if (DEBUG_MODE.enabled) console.log("Collision state reset - ship ready for new collisions");
            }, 1000);
            
            return;
        }
        
        // If we didn't recover, publish game over event instead of handling directly
        // Stop the ship
        this.spaceship.velocity.set(0, 0, 0);
        
        // Different explosion effects based on collision type
        let explosionColor: number;
        let explosionSize: number;
        let explosionMessage: string;
        let collisionType: string;
        
        if (type === "sun") {
            // Solar collision - big, bright yellow explosion
            explosionColor = 0xffff00;
            explosionSize = 60; // 4x original size (was 15)
            explosionMessage = "Your ship was incinerated by the sun!";
            collisionType = "SUN_DEATH";
        } else if (type === "planet") {
            // Planet collision - large blue-tinted explosion
            explosionColor = 0x33ccff;
            explosionSize = 40; // 4x original size (was 10)
            explosionMessage = "Your ship crashed into a planet!";
            collisionType = "COLLISION_PLANET";
        } else {
            // Default asteroid collision - smaller orange explosion
            explosionColor = 0xff6600;
            explosionSize = 20; // 4x original size (was 5)
            explosionMessage = "Your ship was destroyed by an asteroid!";
            collisionType = "COLLISION_ASTEROID";
        }
        
        // Create visual effect for the collision
        const explosionGeometry = new SphereGeometry(explosionSize, 32, 32);
        const explosionMaterial = new MeshBasicMaterial({
            color: explosionColor,
            transparent: true,
            opacity: 0.8
        });
        const explosion = new Mesh(explosionGeometry, explosionMaterial);
        explosion.position.copy(this.spaceship.mesh.position);
        this.scene.add(explosion);
        
        // Animate the explosion
        this.animateExplosion(explosion);
        
        // Mark the ship as destroyed internally
        if (this.spaceship) {
            this.spaceship.isDestroyed = true;
        }
        
        
        console.log("Physics: Initiating game over sequence for collision with", type);
        
        // Use main message bus (always available via import)
        console.log("Physics: Publishing game over event");
        mainMessageBus.publish('game.over', {
            reason: explosionMessage,
            source: "physics",
            collisionType: type,
            type: collisionType
        });
    }
    
    // Method to attempt to recover from a collision based on hull resistance
    attemptCollisionRecovery(collisionType: CollisionType): boolean {
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
                if (DEBUG_MODE.enabled) console.log(`Asteroid collision recovery chance: ${(recoveryChance * 100).toFixed(1)}%`);
                break;
            case "planet":
                // Start with 10% chance, increased by hull resistance
                recoveryChance = 0.1 + (resistance - 1) * 0.2;
                if (DEBUG_MODE.enabled) console.log(`Planet collision recovery chance: ${(recoveryChance * 100).toFixed(1)}%`);
                break;
            case "sun":
                // Almost no chance to survive sun collision
                recoveryChance = (resistance - 1) * 0.05;
                if (DEBUG_MODE.enabled) console.log(`Sun collision recovery chance: ${(recoveryChance * 100).toFixed(1)}%`);
                break;
            default:
                recoveryChance = 0.2 + (resistance - 1) * 0.3;
                if (DEBUG_MODE.enabled) console.log(`Generic collision recovery chance: ${(recoveryChance * 100).toFixed(1)}%`);
        }
        
        // Random chance based on recovery probability
        const recoveryRoll = Math.random();
        const survived = recoveryRoll < recoveryChance;
        
        if (DEBUG_MODE.enabled) console.log(`Recovery roll: ${recoveryRoll.toFixed(3)}, needed ${recoveryChance.toFixed(3)} or lower to survive`);
        
        return survived;
    }
    
    // Create a visual effect when the ship survives a collision
    createRecoveryEffect(): void {
        if (!this.spaceship || !this.scene) return;
        
        // Create a shield-like effect around the ship
        const shieldGeometry = new SphereGeometry(60, 32, 32); // 4x original size (was 15)
        const shieldMaterial = new MeshBasicMaterial({
            color: 0x30cfd0,
            transparent: true,
            opacity: 0.6,
            side: DoubleSide
        });
        
        const shield = new Mesh(shieldGeometry, shieldMaterial);
        shield.position.copy(this.spaceship.mesh.position);
        this.scene.add(shield);
        
        // Animate the shield (expand and fade out)
        let scale = 1;
        const expandSpeed = 0.05;
        const fadeSpeed = 0.02;
        
        const animateShield = (): void => {
            if (scale > 2 || shield.material.opacity <= 0) {
                this.scene.remove(shield);
                return;
            }
            
            scale += expandSpeed;
            shield.scale.set(scale, scale, scale);
            if (shield.material instanceof MeshBasicMaterial) {
                shield.material.opacity -= fadeSpeed;
            }
            
            // Update shield position to follow ship
            if (this.spaceship && this.spaceship.mesh) {
                shield.position.copy(this.spaceship.mesh.position);
            }
            
            requestAnimationFrame(animateShield);
        };
        
        animateShield();
    }
    
    animateExplosion(explosion: Mesh): void {
        let scale = 1;
        const expandSpeed = 0.5;
        const fadeSpeed = 0.02;
        
        const animate = (): void => {
            if (scale > 20 || (explosion.material instanceof MeshBasicMaterial && explosion.material.opacity <= 0)) {
                this.scene.remove(explosion);
                return;
            }
            
            scale += expandSpeed;
            explosion.scale.set(scale, scale, scale);
            if (explosion.material instanceof MeshBasicMaterial) {
                explosion.material.opacity -= fadeSpeed;
            }
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
}
