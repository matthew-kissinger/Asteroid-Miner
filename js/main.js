// main.js - Main entry point for the game

// Global debug flag - set to true for development
window.DEBUG_MODE = false;

import { Renderer } from './modules/renderer.js';
import { Spaceship } from './modules/spaceship.js';
import { Physics } from './modules/physics.js';
import { Environment } from './modules/environment.js';
import { Controls } from './modules/controls.js';
import { UI } from './modules/ui.js';
import { AudioManager } from './modules/audio.js';
import { Combat } from './modules/combat.js';
import { MessageBus } from './core/messageBus.js';

// Global vector pool for reusing vector objects
window.vectorPool = {
    pool: [],
    maxSize: 100,
    
    get: function(x = 0, y = 0, z = 0) {
        if (this.pool.length > 0) {
            return this.pool.pop().set(x, y, z);
        }
        return new THREE.Vector3(x, y, z);
    },
    
    release: function(vector) {
        if (this.pool.length < this.maxSize) {
            this.pool.push(vector);
        }
    }
};

class Game {
    constructor() {
        console.log("Initializing game...");
        
        // Make game instance globally accessible for emergency access
        window.game = this;
        
        // Set up global message bus for cross-system communication
        window.mainMessageBus = new MessageBus();
        window.mainMessageBus.subscribe('game.over', this.gameOver.bind(this));
        
        try {
            // Initialize audio manager first to start loading sounds
            console.log("Creating audio manager...");
            this.audio = new AudioManager();
            
            // Initialize renderer first
            console.log("Creating renderer...");
            this.renderer = new Renderer();
            console.log("Renderer created, getting scene...");
            
            // Access scene and camera directly rather than through getters
            this.scene = this.renderer.scene;
            this.camera = this.renderer.camera;
            
            console.log("Scene and camera references obtained");
            
            // Share camera reference with scene for easy access by other components
            this.scene.camera = this.camera;
            
            // Initialize physics
            this.physics = new Physics(this.scene);
            
            // Set camera reference in physics
            this.physics.setCamera(this.camera);
            
            // Initialize environment
            this.environment = new Environment(this.scene);
            
            // Initialize spaceship
            console.log("Creating spaceship...");
            this.spaceship = new Spaceship(this.scene);
            
            // Set spaceship reference in physics
            this.physics.setSpaceship(this.spaceship);
            
            // Initialize combat systems
            console.log("Creating combat module...");
            this.combat = new Combat(this.scene, this.spaceship);
            
            // Ensure the ECS world in combat is properly initialized
            if (this.combat.world) {
                console.log("Combat ECS world successfully created");
            } else {
                console.log("Waiting for combat ECS world to initialize...");
                // Add a check to ensure the player entity exists
                setTimeout(() => {
                    if (this.combat.world && this.combat.playerEntity) {
                        console.log("Combat ECS world and player entity initialized after delay");
                    } else {
                        console.warn("Combat ECS world or player entity not available after delay, recreating...");
                        if (this.combat.createPlayerReferenceEntity) {
                            this.combat.createPlayerReferenceEntity();
                        }
                    }
                }, 1000);
            }
            
            // Initialize UI
            this.ui = new UI(this.spaceship, this.environment);
            
            // Share audio reference with UI for sound-based components
            this.ui.setAudio(this.audio);
            
            // Initialize controls last, as it depends on other components
            this.controls = new Controls(this.spaceship, this.physics, this.environment, this.ui);
            
            // Share controls reference with UI for bidirectional communication
            this.ui.setControls(this.controls);
            
            // Initialize settings
            console.log("Initializing settings...");
            this.ui.initializeSettings(this);
            
            // Initial camera positioning
            this.camera.position.set(0, 1500, 0);
        
        // Game state
            this.isGameOver = false;
            this.lastUpdateTime = performance.now();
            this.frameCount = 0;
            this.currentFPS = 0;
            
            // Frame rate cap (can be overridden by settings)
            this.frameRateCap = 0; // 0 means unlimited
            
            // Apply settings if available
            if (this.ui.settings) {
                this.frameRateCap = this.ui.settings.settings.frameRateCap;
                console.log(`Applied frame rate cap from settings: ${this.frameRateCap}`);
            }
            
            // Start with docked state for initial tutorial/intro
            this.startDocked();
            
            // Register event handlers
            this.setupEventHandlers();
            
            // Initialize audio after everything else is set up
            this.audio.initialize().then(() => {
                console.log("Audio system initialized");
            });
            
            console.log("Game initialization complete");
            
            // Initialize common object pools
            this.initializeObjectPools();
            
            // Pre-bind animate method to avoid creating a new function every frame
            this.boundAnimate = this.animate.bind(this);
            
            // Reusable deltaTime variable to avoid creating new variables in hot path
            this.deltaTime = 0;
            
            // Time tracking for frame rate cap and FPS calculation
            this.lastFrameTime = 0;
            this.actualFrameTime = 0;
            this.frameStartTime = 0;
            
            // FPS averaging for smoother display
            this.fpsBuffer = [];
            this.fpsBufferSize = 15; // Smaller buffer for more responsive updates
            
            // Start game loop
            this.boundAnimate();
            
        } catch (error) {
            console.error("Error in game initialization:", error);
            throw error; // Re-throw to show in the UI
        }
    }
    
    /**
     * Initialize object pools for commonly created objects
     */
    initializeObjectPools() {
        console.log("Initializing object pools...");
        
        // Hit effect pool
        window.objectPool.createPool('hitEffect', () => {
            // Create geometry only once
            if (!this.hitEffectGeometry) {
                this.hitEffectGeometry = new THREE.SphereGeometry(1, 8, 8);
            }
            
            // Create a default material that will be customized on get()
            const material = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.8
            });
            
            // Create the mesh
            const mesh = new THREE.Mesh(this.hitEffectGeometry, material);
            
            // Return an object with reset and clear methods
            return {
                mesh: mesh,
                material: material,
                
                // Reset function for when the object is retrieved from the pool
                reset: function(color = 0xff5500, size = 1) {
                    this.material.color.set(color);
                    this.material.opacity = 0.8;
                    this.mesh.scale.set(size, size, size);
                    this.mesh.visible = true;
                },
                
                // Clear function for when the object is returned to the pool
                clear: function() {
                    if (this.mesh.parent) {
                        this.mesh.parent.remove(this.mesh);
                    }
                    this.mesh.visible = false;
                }
            };
        }, 20, 100); // Pre-create 20, max 100
        
        // Projectile pool
        window.objectPool.createPool('projectile', () => {
            // Create projectile geometry only once
            if (!this.projectileGeometry) {
                this.projectileGeometry = new THREE.SphereGeometry(2, 8, 8);
            }
            
            // Create a default material that will be customized on get()
            const material = new THREE.MeshStandardMaterial({
                color: 0x00ffff,
                emissive: 0x00ffff,
                emissiveIntensity: 1,
                metalness: 0.3,
                roughness: 0.2
            });
            
            // Create the mesh
            const mesh = new THREE.Mesh(this.projectileGeometry, material);
            
            // Return an object with reset and clear methods
            return {
                mesh: mesh,
                material: material,
                velocity: new THREE.Vector3(),
                
                // Reset function for when the object is retrieved from the pool
                reset: function(position, direction, speed = 500, color = 0x00ffff) {
                    // Set position
                    this.mesh.position.copy(position);
                    
                    // Set velocity based on direction and speed
                    this.velocity.copy(direction).normalize().multiplyScalar(speed);
                    
                    // Set color
                    this.material.color.set(color);
                    this.material.emissive.set(color);
                    
                    // Make visible
                    this.mesh.visible = true;
                },
                
                // Clear function for when the object is returned to the pool
                clear: function() {
                    if (this.mesh.parent) {
                        this.mesh.parent.remove(this.mesh);
                    }
                    this.mesh.visible = false;
                    this.velocity.set(0, 0, 0);
                }
            };
        }, 50, 200); // Pre-create 50, max 200
        
        // Particle effect pool
        window.objectPool.createPool('particleEffect', () => {
            // Create particles
            const particleCount = 20;
            const particles = new THREE.BufferGeometry();
            
            // Use typed arrays for better performance
            const positions = new Float32Array(particleCount * 3);
            const colors = new Float32Array(particleCount * 3);
            
            // Initialize particle positions and colors
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                // All particles start at origin
                positions[i3] = 0;
                positions[i3 + 1] = 0;
                positions[i3 + 2] = 0;
                
                // Default white color
                colors[i3] = 1;
                colors[i3 + 1] = 1;
                colors[i3 + 2] = 1;
            }
            
            // Set particle attributes
            particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            
            // Create particle material
            const particleMaterial = new THREE.PointsMaterial({
                size: 3,
                transparent: true,
                opacity: 0.8,
                vertexColors: true,
                blending: THREE.AdditiveBlending
            });
            
            // Create particle system
            const particleSystem = new THREE.Points(particles, particleMaterial);
            
            // Return an object with reset and clear methods
            return {
                system: particleSystem,
                velocities: new Float32Array(particleCount * 3),
                lifetime: new Float32Array(particleCount),
                maxLifetime: new Float32Array(particleCount),
                
                // Reset function for when the object is retrieved from the pool
                reset: function(position, color = new THREE.Color(1, 1, 1), size = 3, particleSpeed = 20) {
                    // Set particle system position
                    this.system.position.copy(position);
                    
                    // Get position and color arrays
                    const positions = this.system.geometry.attributes.position.array;
                    const colors = this.system.geometry.attributes.color.array;
                    
                    // Set material size
                    this.system.material.size = size;
                    
                    // Initialize particles
                    for (let i = 0; i < particleCount; i++) {
                        const i3 = i * 3;
                        
                        // Reset particle position to center
                        positions[i3] = 0;
                        positions[i3 + 1] = 0;
                        positions[i3 + 2] = 0;
                        
                        // Set particle color
                        colors[i3] = color.r;
                        colors[i3 + 1] = color.g;
                        colors[i3 + 2] = color.b;
                        
                        // Random velocity in all directions
                        const theta = Math.random() * Math.PI * 2;
                        const phi = Math.random() * Math.PI;
                        
                        this.velocities[i3] = Math.sin(phi) * Math.cos(theta) * (Math.random() * particleSpeed);
                        this.velocities[i3 + 1] = Math.sin(phi) * Math.sin(theta) * (Math.random() * particleSpeed);
                        this.velocities[i3 + 2] = Math.cos(phi) * (Math.random() * particleSpeed);
                        
                        // Random lifetime
                        this.maxLifetime[i] = 0.5 + Math.random() * 1.5; // 0.5 to 2 seconds
                        this.lifetime[i] = this.maxLifetime[i];
                    }
                    
                    // Update attributes
                    this.system.geometry.attributes.position.needsUpdate = true;
                    this.system.geometry.attributes.color.needsUpdate = true;
                    
                    // Make visible and add to scene
                    this.system.visible = true;
                    if (!this.system.parent) {
                        window.game.scene.add(this.system);
                    }
                    
                    // Start the animation
                    this.animate();
                },
                
                // Animation function
                animate: function() {
                    if (!this.system.visible) return;
                    
                    // Get position and color arrays
                    const positions = this.system.geometry.attributes.position.array;
                    const colors = this.system.geometry.attributes.color.array;
                    
                    // Track if any particles are still alive
                    let anyAlive = false;
                    
                    // Update particles
                    for (let i = 0; i < particleCount; i++) {
                        const i3 = i * 3;
                        
                        // Update lifetime
                        this.lifetime[i] -= 0.016; // Approximate 60fps
                        
                        // Skip dead particles
                        if (this.lifetime[i] <= 0) continue;
                        
                        anyAlive = true;
                        
                        // Move particle based on velocity
                        positions[i3] += this.velocities[i3] * 0.016;
                        positions[i3 + 1] += this.velocities[i3 + 1] * 0.016;
                        positions[i3 + 2] += this.velocities[i3 + 2] * 0.016;
                        
                        // Update alpha based on lifetime
                        const lifeRatio = this.lifetime[i] / this.maxLifetime[i];
                        this.system.material.opacity = lifeRatio;
                    }
                    
                    // Update attributes
                    this.system.geometry.attributes.position.needsUpdate = true;
                    
                    // Continue animation if particles are still alive
                    if (anyAlive) {
                        requestAnimationFrame(this.animate.bind(this));
                    } else {
                        this.clear();
                    }
                },
                
                // Clear function for when the object is returned to the pool
                clear: function() {
                    if (this.system.parent) {
                        this.system.parent.remove(this.system);
                    }
                    this.system.visible = false;
                }
            };
        }, 10, 50); // Pre-create 10, max 50
        
        console.log("Object pools initialized");
    }
    
    startDocked() {
        // Start the game docked with the mothership for tutorial/intro
        // Make sure the ship is already docked
        if (this.spaceship) {
            // Ensure the ship is docked
            if (!this.spaceship.isDocked) {
        this.spaceship.dock();
            }
        }
        
        // Show mothership UI after a short delay
        setTimeout(() => {
            if (this.controls && this.controls.dockingSystem) {
                // Just show mothership UI without changing state
                this.controls.dockingSystem.dockWithMothership();
                console.log("Mothership UI shown");
            } else {
                console.error("Controls or dockingSystem not available");
            }
        }, 500);
    }
    
    setupEventHandlers() {
        // Handle window resize
        window.addEventListener('resize', () => {
            this.renderer.handleResize();
        });
        
        // Handle visibility change to pause/resume game
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });
        
        // Handle ESC key to exit pointer lock
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.pointerLockElement) {
                document.exitPointerLock();
            }
            
            // Add audio mute toggle (M key)
            if (e.key.toLowerCase() === 'm' && this.audio) {
                const isMuted = this.audio.toggleMute();
                console.log(`Audio ${isMuted ? 'muted' : 'unmuted'}`);
            }
            
            // Add debug mode toggle (D key + Shift)
            if (e.key.toLowerCase() === 'd' && e.shiftKey) {
                this.toggleDebugMode();
            }
        });
    }
    
    update(deltaTime) {
        if (this.isGameOver) return;
        
        // Update physics
        this.physics.update(deltaTime);
        
        // Update spaceship
        if (this.spaceship.update) {
            this.spaceship.update(deltaTime);
        }
        
        // Update coordinates in HUD after physics update
        if (this.ui && this.ui.updateCoordinates && this.spaceship && this.spaceship.mesh) {
            // Use direct position reference instead of creating a new object
            const position = this.spaceship.mesh.position;
            this.ui.updateCoordinates(position.x, position.y, position.z);
        }
        
        // Calculate instantaneous FPS based on frame time
        const now = performance.now();
        const instantFPS = this.actualFrameTime ? 1000 / this.actualFrameTime : 60;
        
        // Add to FPS buffer with weighted preference to more recent readings
        // This helps the FPS display stabilize faster when frame rate changes
        this.fpsBuffer.push(instantFPS);
        if (this.fpsBuffer.length > this.fpsBufferSize) {
            this.fpsBuffer.shift(); // Remove oldest value
        }
        
        // Use weighted average to more accurately represent current FPS
        // Gives more importance to recent frames
        let totalWeight = 0;
        let weightedSum = 0;
        
        for (let i = 0; i < this.fpsBuffer.length; i++) {
            // Weight increases linearly with frame index (newer frames get higher weight)
            const weight = i + 1;
            weightedSum += this.fpsBuffer[i] * weight;
            totalWeight += weight;
        }
        
        // Calculate weighted average for smoother display
        this.currentFPS = Math.round(weightedSum / totalWeight);
        
        // Only update FPS display every few frames to reduce DOM operations
        if (this.frameCount % 5 === 0 && this.ui && this.ui.updateFPS) {
            // If capped, show cap information along with actual FPS
            if (this.frameRateCap > 0) {
                this.ui.updateFPS(this.currentFPS, this.frameRateCap);
            } else {
                this.ui.updateFPS(this.currentFPS);
            }
        }
        
        // Update controls
        if (this.controls.update) {
            this.controls.update();
        }
        
        // Ensure the combat system's player entity is always up to date
        if (this.combat && this.combat.updatePlayerReference) {
            try {
                this.combat.updatePlayerReference();
            } catch (error) {
                console.warn("Error updating player reference:", error);
            }
        } else if (this.combat && !this.combat.updatePlayerReference) {
            console.warn("Combat module does not have updatePlayerReference method");
            
            // Try to initialize player entity directly if method is missing
            if (this.combat.createPlayerReferenceEntity && !this.combat.playerEntity) {
                console.log("Creating player entity directly since updatePlayerReference is not available");
                this.combat.createPlayerReferenceEntity();
            }
        }
        
        // Update combat systems - this will update the ECS world
        if (this.combat && this.combat.update) {
            this.combat.update(deltaTime);
        }
        
        // Update environment
        if (this.environment.update) {
            this.environment.update();
        }
        
        // Update UI
        if (this.ui.update) {
            this.ui.update();
        }
        
        // Update audio
        this.updateAudio();
        
        // Check for game over conditions
        this.checkGameOver();
        
        // Count frames for performance monitoring
        this.frameCount++;
    }
    
    // Update game sounds based on current game state
    updateAudio() {
        if (!this.audio || !this.spaceship) return;
        
        // Handle thruster sounds based on current thrust state
        if (this.spaceship.isDocked) {
            // No thruster sounds when docked
            this.audio.stopSound('thrust');
        } else {
            const isThrusting = this.spaceship.thrust.forward || 
                              this.spaceship.thrust.backward || 
                              this.spaceship.thrust.left || 
                              this.spaceship.thrust.right;
                              
            if (isThrusting) {
                // Play thrust sound if not already playing
                this.audio.playSound('thrust');
                
                // Calculate thrust intensity for volume
                let thrustIntensity = 0.5; // Base level
                
                if (this.spaceship.thrust.forward) thrustIntensity += 0.2;
                if (this.spaceship.thrust.backward) thrustIntensity += 0.1;
                if (this.spaceship.thrust.left) thrustIntensity += 0.1;
                if (this.spaceship.thrust.right) thrustIntensity += 0.1;
                
                // Boost increases volume
                if (this.spaceship.thrust.boost) thrustIntensity *= 1.5;
                
                // Set thrust volume
                this.audio.setThrustVolume(thrustIntensity);
            } else {
                // Stop thrust sound if no thrusters active
                this.audio.stopSound('thrust');
            }
        }
        
        // Mining sound is handled by the mining system integration
    }
    
    checkGameOver() {
        // Make sure spaceship exists
        if (!this.spaceship) return;
        
        // Don't check for game over conditions if the ship is docked
        if (this.spaceship.isDocked) return;
        
        // Check if out of fuel and not near mothership
        if (this.spaceship.fuel <= 0 && 
            this.controls.dockingSystem && 
            !this.controls.dockingSystem.nearMothership) {
            this.gameOver("Your ship ran out of fuel");
            return;
        }
        
        // Check for collision with sun
        // Reuse a single vector for calculation instead of creating a new one
        const sunPosition = window.vectorPool.get(0, 0, 0);
        const distanceToSun = this.spaceship.mesh.position.distanceTo(sunPosition);
        window.vectorPool.release(sunPosition);
        
        if (distanceToSun < 400) { // Sun collision radius
            this.gameOver("Your ship was destroyed by the sun's heat");
            return;
        }
    }
    
    gameOver(message) {
        if (this.isGameOver) return;
        
        console.log("Game over:", message);
        this.isGameOver = true;
        
        // Play explosion sound
        if (this.audio) {
            this.audio.playSound('explosion');
        }
        
        // Show game over screen with resources collected
        if (this.ui.showGameOver && this.controls.resources) {
            this.ui.showGameOver(this.controls.resources, message);
        }
        
        // Stop spaceship movement if it exists
        if (this.spaceship && this.spaceship.thrust) {
            this.spaceship.thrust.forward = false;
            this.spaceship.thrust.backward = false;
            this.spaceship.thrust.left = false;
            this.spaceship.thrust.right = false;
            this.spaceship.thrust.boost = false;
        }
        
        // Stop all control inputs
        if (this.controls && this.controls.inputHandler) {
            this.controls.inputHandler.exitPointerLock();
        }
    }
    
    animate(timestamp) {
        // Request next frame early to ensure consistent frame scheduling
        requestAnimationFrame(this.boundAnimate);
        
        // Initialize frame timing if needed
        if (!this.lastFrameTime) {
            this.lastFrameTime = timestamp;
            this.frameStartTime = performance.now();
            return; // Skip first frame to establish baseline
        }
        
        // Track actual frame time for FPS calculation
        this.actualFrameTime = timestamp - this.lastFrameTime;
        
        // Frame rate cap handling
        if (this.frameRateCap > 0) {
            // Calculate target frame duration in milliseconds
            const targetFrameTime = 1000 / this.frameRateCap;
            
            // Calculate elapsed time since last rendered frame
            const elapsedSinceLastFrame = timestamp - this.lastFrameTime;
            
            // If we haven't reached the target frame time yet, skip this frame
            if (elapsedSinceLastFrame < targetFrameTime - 0.5) { // Subtract small amount to account for timing imprecision
                return;
            }
            
            // Update timing for next frame - use the exact target time
            // This helps maintain a more consistent frame rate
            this.lastFrameTime += targetFrameTime;
            
            // If we're more than one frame behind, catch up to avoid spiraling
            if (timestamp - this.lastFrameTime > targetFrameTime) {
                this.lastFrameTime = timestamp;
            }
        } else {
            // No cap, just update the frame time
            this.lastFrameTime = timestamp;
        }
        
        // Calculate delta time
        const now = performance.now();
        this.deltaTime = Math.min(now - this.lastUpdateTime, 100) / 1000; // Clamped to 100ms
        this.lastUpdateTime = now;
        
        // Update game state
        this.update(this.deltaTime);
        
        // Render scene
        this.renderer.render();
        
        // Update frame counter
        this.frameCount++;
    }
    
    pause() {
        // Pause game logic here
        console.log('Game paused');
        
        // Mute audio when game is paused
        if (this.audio) {
            this.audio.muted = true;
            for (const sound of Object.values(this.audio.sounds)) {
                sound.muted = true;
            }
            for (const track of this.audio.music) {
                track.muted = true;
            }
        }
    }
    
    resume() {
        // Resume game logic here
        console.log('Game resumed');
        this.lastUpdateTime = performance.now(); // Reset timer to avoid large delta
        
        // Unmute audio when game is resumed
        if (this.audio && !this.audio.muted) {
            for (const sound of Object.values(this.audio.sounds)) {
                sound.muted = false;
            }
            for (const track of this.audio.music) {
                track.muted = false;
            }
        }
    }
    
    // Create a fallback for the initOptimizedECS method that is causing errors
    initOptimizedECS() {
        // This is a placeholder to prevent errors when this method is called
        console.log("initOptimizedECS called - This is a placeholder implementation");
        
        // Check if we need to initialize optimized systems
        if (this.world && typeof this.world.getSystem !== 'function') {
            console.log("Adding getSystem method to World class to fix compatibility issues");
            // Add getSystem method to World prototype if it doesn't exist
            this.world.getSystem = function(systemType) {
                if (this.systemManager && typeof this.systemManager.getSystem === 'function') {
                    return this.systemManager.getSystem(systemType);
                }
                return null;
            };
        }
        
        return true;
    }
    
    /**
     * Toggle debug mode
     */
    toggleDebugMode() {
        window.DEBUG_MODE = !window.DEBUG_MODE;
        console.log(`Debug mode ${window.DEBUG_MODE ? 'enabled' : 'disabled'}`);
        
        // Initialize or remove performance monitor
        if (window.DEBUG_MODE) {
            if (this.ui && !document.getElementById('performance-stats')) {
                this.ui.initializePerformanceMonitor();
            }
            
            // Force memory stats update
            if (window.MemoryStats) {
                window.MemoryStats.update();
                window.MemoryStats.logReport();
            }
        } else {
            // Remove performance monitor if it exists
            const statsElement = document.getElementById('performance-stats');
            if (statsElement) {
                statsElement.remove();
            }
            
            // Clear interval if it exists
            if (this.ui && this.ui.statsInterval) {
                clearInterval(this.ui.statsInterval);
                this.ui.statsInterval = null;
            }
        }
    }
}

// Object pooling manager for frequently created objects
window.objectPool = {
    pools: {},
    
    // Initialize a pool for a specific object type
    createPool: function(type, factory, initialSize = 10, maxSize = 100) {
        if (!this.pools[type]) {
            this.pools[type] = {
                objects: [],
                factory: factory,
                maxSize: maxSize
            };
            
            // Pre-populate the pool
            for (let i = 0; i < initialSize; i++) {
                this.pools[type].objects.push(factory());
            }
        }
    },
    
    // Get an object from the pool or create a new one
    get: function(type, ...args) {
        const pool = this.pools[type];
        if (!pool) {
            console.warn(`No pool exists for type: ${type}`);
            return null;
        }
        
        let obj;
        if (pool.objects.length > 0) {
            obj = pool.objects.pop();
        } else {
            obj = pool.factory();
        }
        
        // Call reset method if it exists
        if (typeof obj.reset === 'function') {
            obj.reset(...args);
        }
        
        return obj;
    },
    
    // Return an object to the pool
    release: function(type, obj) {
        const pool = this.pools[type];
        if (!pool) {
            console.warn(`No pool exists for type: ${type}`);
            return;
        }
        
        // Prevent pool overflow
        if (pool.objects.length < pool.maxSize) {
            // Clear any references the object might have
            if (typeof obj.clear === 'function') {
                obj.clear();
            }
            
            pool.objects.push(obj);
        }
    }
};

// Start the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create loading screen
    const loadingScreen = document.createElement('div');
    loadingScreen.id = 'loading-screen';
    loadingScreen.style.position = 'fixed';
    loadingScreen.style.top = '0';
    loadingScreen.style.left = '0';
    loadingScreen.style.width = '100%';
    loadingScreen.style.height = '100%';
    loadingScreen.style.backgroundColor = '#000';
    loadingScreen.style.display = 'flex';
    loadingScreen.style.flexDirection = 'column';
    loadingScreen.style.alignItems = 'center';
    loadingScreen.style.justifyContent = 'center';
    loadingScreen.style.zIndex = '9999';
    loadingScreen.style.color = '#fff';
    loadingScreen.style.fontFamily = 'Courier New, monospace';
    
    const title = document.createElement('h1');
    title.textContent = 'ASTEROID MINER';
    title.style.fontSize = '48px';
    title.style.marginBottom = '30px';
    title.style.color = '#30cfd0';
    title.style.textShadow = '0 0 10px #30cfd0';
    
    const loadingText = document.createElement('p');
    loadingText.textContent = 'Initializing systems...';
    loadingText.style.fontSize = '18px';
    loadingText.style.marginBottom = '20px';
    
    const progressContainer = document.createElement('div');
    progressContainer.style.width = '300px';
    progressContainer.style.height = '10px';
    progressContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
    progressContainer.style.borderRadius = '5px';
    progressContainer.style.overflow = 'hidden';
    
    const progressBar = document.createElement('div');
    progressBar.id = 'loading-progress';
    progressBar.style.width = '0%';
    progressBar.style.height = '100%';
    progressBar.style.backgroundColor = '#30cfd0';
    progressBar.style.transition = 'width 0.3s';
    
    progressContainer.appendChild(progressBar);
    loadingScreen.appendChild(title);
    loadingScreen.appendChild(loadingText);
    loadingScreen.appendChild(progressContainer);
    document.body.appendChild(loadingScreen);
    
    // Add a console message to help debug loading issues
    console.log("DOM loaded, preparing to start game...");
    
    // Simulate loading progress
    let progress = 0;
    const loadingInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
            progress = 100;
            clearInterval(loadingInterval);
            
            console.log("Loading progress complete, starting game...");
            
            // Start game after a short delay
            setTimeout(() => {
                loadingScreen.style.opacity = '0';
                loadingScreen.style.transition = 'opacity 1s';
                
                setTimeout(() => {
                    loadingScreen.remove();
                    
                    // Force a small garbage collection delay
                    console.log("Starting garbage collection delay...");
                    setTimeout(() => {
                        console.log("Creating game instance...");
                        
                        // Initialize the game with error handling
                        try {
                            console.log("Checking for shader availability...");
                            // Log shader availability for debugging
                            console.log("LuminosityHighPassShader:", typeof THREE.LuminosityHighPassShader !== 'undefined');
                            console.log("FXAAShader:", typeof THREE.FXAAShader !== 'undefined');
                            console.log("FilmShader:", typeof THREE.FilmShader !== 'undefined');
                            console.log("ColorCorrectionShader:", typeof THREE.ColorCorrectionShader !== 'undefined');
                            console.log("VignetteShader:", typeof THREE.VignetteShader !== 'undefined');
                            console.log("UnrealBloomPass:", typeof THREE.UnrealBloomPass !== 'undefined');
                            
                            window.game = new Game(); // Initialize the game
                            console.log("Game started successfully");
                        } catch (error) {
                            console.error("Error starting game:", error);
                            
                            // Show error message to user
                            const errorMessage = document.createElement('div');
                            errorMessage.style.position = 'fixed';
                            errorMessage.style.top = '50%';
                            errorMessage.style.left = '50%';
                            errorMessage.style.transform = 'translate(-50%, -50%)';
                            errorMessage.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                            errorMessage.style.color = '#ff3030';
                            errorMessage.style.padding = '20px';
                            errorMessage.style.borderRadius = '10px';
                            errorMessage.style.border = '1px solid #ff3030';
                            errorMessage.style.zIndex = '9999';
                            errorMessage.style.textAlign = 'center';
                            errorMessage.style.fontFamily = 'Courier New, monospace';
                            errorMessage.style.maxWidth = '80%';
                            
                            errorMessage.innerHTML = `
                                <h2>Error Starting Game</h2>
                                <p>${error.message}</p>
                                <p>Check the console for more details (F12).</p>
                                <p>You can try refreshing the page or clearing your browser cache.</p>
                                <button id="reload-button" style="background: #ff3030; color: white; border: none; padding: 10px; margin-top: 20px; cursor: pointer;">Reload Page</button>
                            `;
                            
                            document.body.appendChild(errorMessage);
                            
                            // Add event listener to reload button
                            document.getElementById('reload-button').addEventListener('click', () => {
                                // Add cache-busting parameter to the URL
                                const cacheBuster = Date.now();
                                window.location.href = window.location.pathname + '?cache=' + cacheBuster;
                            });
                        }
                    }, 200);
                }, 1000);
            }, 500);
        }
        
        progressBar.style.width = `${progress}%`;
        loadingText.textContent = `Initializing systems... ${Math.floor(progress)}%`;
    }, 100);
}); 