// main.js - Main entry point for the game

// Global debug flag - set to true for development
window.DEBUG_MODE = false;

import * as THREE from 'three';
import { Renderer } from './modules/renderer.js';
import { Spaceship } from './modules/spaceship.js';
import { Physics } from './modules/physics.js';
import { Environment } from './modules/environment.js';
import { Controls } from './modules/controls.js';
import { UI } from './modules/ui.js';
import { AudioManager } from './modules/audio.js';
import { Combat } from './modules/combat.js';
import { MessageBus } from './core/messageBus.js';
import { IntroSequence } from './modules/introSequence.js';
import { DifficultyManager } from './core/difficultyManager.js';
import { getGlobalPoolRegistry } from './modules/pooling/PoolRegistry.js';
import { initPerfOverlay } from './modules/debug/perfOverlay.js';

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
            // Create audio manager first but don't initialize yet
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
            
            // Initialize essential components needed for the start screen
            console.log("Initializing essential components...");
            
            // Initialize physics
            this.physics = new Physics(this.scene);
            
            // Set camera reference in physics
            this.physics.setCamera(this.camera);
            
            // Initialize environment (essential components only)
            this.environment = new Environment(this.scene);
            
            // Initialize spaceship
            console.log("Creating spaceship...");
            this.spaceship = new Spaceship(this.scene);
            
            // Set spaceship reference in physics
            this.physics.setSpaceship(this.spaceship);
            
            // Set spaceship reference in environment (for VibeVerse portals)
            this.environment.setSpaceship(this.spaceship);
            
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
            
            // Game state
            this.isGameOver = false;
            this.lastUpdateTime = performance.now();
            this.frameCount = 0;
            this.currentFPS = 0;
            this.introSequenceActive = false; // Flag to prevent player control during intro
            this.gameTime = 0; // Track total game time in seconds

            // Perf overlay & sink
            initPerfOverlay();
            if (!window.__perf) window.__perf = {};
            window.__perf.enabled = false;
            
            // Detect mobile device
            this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                           (window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
            
            // Frame rate cap (defaults to auto/monitor refresh rate)
            this.frameRateCap = 0; // Will be updated by settings or refresh rate detection
            
            // Apply settings if available (restored block)
            if (this.ui && this.ui.settings) {
                // If using 'auto' setting, apply refresh rate detection
                if (this.ui.settings.settings.frameRateCap === 'auto') {
                    const refreshRate = this.ui.settings.monitorRefreshRate || 60;
                    
                    // Mobile devices: cap at 60fps for battery life
                    if (this.isMobile) {
                        this.frameRateCap = 60;
                        console.log(`Mobile device detected: capping at 60fps for battery life`);
                    }
                    // High refresh displays: use fixed timestep with interpolation
                    else if (refreshRate > 65) {
                        this.frameRateCap = 0; // Unlimited with fixed timestep
                        console.log(`High refresh display (${refreshRate}Hz): using fixed timestep with interpolation`);
                    } else {
                        this.frameRateCap = refreshRate;
                        console.log(`Standard display: matching refresh rate at ${refreshRate}Hz`);
                    }
                } else {
                    // Otherwise use the specific setting value
                    this.frameRateCap = parseInt(this.ui.settings.settings.frameRateCap) || 0;
                    
                    // Override for mobile if unlimited is selected
                    if (this.isMobile && this.frameRateCap === 0) {
                        this.frameRateCap = 60;
                        console.log(`Mobile device: overriding unlimited to 60fps`);
                    }
                }
                console.log(`Applied frame rate cap: ${this.frameRateCap}`);
            }
            
            // Time tracking for frame rate cap and FPS calculation
            this.lastFrameTime = 0;
            this.actualFrameTime = 0;
            this.frameStartTime = 0;
            this.accumulator = 0;
            this.fixedDeltaTime = 1/60; // Fixed 60 Hz update rate
            
            // FPS averaging for smoother display
            this.fpsBuffer = [];
            this.fpsBufferSize = 15; // Smaller buffer for more responsive updates
            
            // Initialize difficulty manager 
            console.log("Initializing difficulty manager...");
            this.initializeDifficultyManager();
            
            // Register event handlers
            this.setupEventHandlers();
            
            // Pre-bind animate method to avoid creating a new function every frame
            this.boundAnimate = this.animate.bind(this);
            
            // Reusable deltaTime variable to avoid creating new variables in hot path
            this.deltaTime = 0;
            
            // Start the initialization sequence
            this.initializeGameSequence();
            
        } catch (error) {
            console.error("Error in game initialization:", error);
            throw error; // Re-throw to show in the UI
        }
    }
    
    // Initialize game in sequence, showing start screen first and loading non-essentials after
    async initializeGameSequence() {
        try {
            console.log("Starting game initialization sequence...");
            
            // Resume audio context if needed (browser autoplay policy)
            if (this.audio && this.audio.audioContext && this.audio.audioContext.state === 'suspended') {
                try {
                    this.audio.resumeAudioContext();
                } catch (e) {
                    console.log("Audio context couldn't be resumed yet, will try again after user interaction");
                }
            }
            
            // Show the start screen immediately
            if (this.ui && this.ui.startScreen) {
                console.log("Showing start screen");
                this.ui.startScreen.show();
            } else {
                console.error("Start screen not found, falling back to default behavior");
                this.fallbackToDefaultBehavior();
            }
            
            // Start game loop (even though we're on start screen)
            requestAnimationFrame(this.boundAnimate);
            
            // Initialize remaining systems in the background after start screen is shown
            this.initializeRemainingSystemsAsync();
            
            console.log("Game initialization sequence completed successfully");
        } catch (error) {
            console.error("Error during game initialization sequence:", error);
            
            // Show error in UI if possible
            if (this.ui && this.ui.showError) {
                this.ui.showError("Failed to initialize game: " + error.message);
            } else {
                alert("Failed to initialize game: " + error.message);
            }
        }
    }
    
    // Initialize remaining systems asynchronously after showing the start screen
    async initializeRemainingSystemsAsync() {
        try {
            // Start loading audio in the background
            this.loadAudioAsync();
            
            // Initialize combat systems asynchronously
            console.log("Initializing combat module asynchronously...");
            if (!this.combat) {
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
            }
            
            // Initialize common object pools after start screen is shown
            setTimeout(() => {
                this.initializeObjectPools();
                
                // Pre-warm essential shaders and projectile assets after start screen is shown
                this.preWarmBasicShaders();
            }, 100);
        } catch (error) {
            console.error("Error initializing remaining systems:", error);
        }
    }
    
    // Load audio asynchronously after showing the start screen
    async loadAudioAsync() {
        try {
            if (this.audio) {
                // Initialize audio in the background
                console.log("Initializing audio system asynchronously...");
                this.audio.initialize().then(() => {
                    console.log("Audio system initialization complete");
                }).catch(error => {
                    console.error("Error initializing audio:", error);
                });
            }
        } catch (error) {
            console.error("Error loading audio:", error);
        }
    }
    
    // Pre-warm only the most essential shaders needed for immediate gameplay
    preWarmBasicShaders() {
        console.log("Pre-warming essential shaders...");
        
        // Create template projectile geometry and materials
        this.projectileGeometry = new THREE.SphereGeometry(1.8, 12, 12);
        this.projectileMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 5,
            metalness: 0.7,
            roughness: 0.3
        });
        
        // Create simple dummy objects to warm up the renderer
        const dummyProjectile = new THREE.Mesh(this.projectileGeometry, this.projectileMaterial);
        
        // Add to scene temporarily
        this.scene.add(dummyProjectile);
        
        // Force shader compilation for better performance
            this.renderer.renderer.compile(this.scene, this.camera);
        
        // Remove dummy object after compilation
            this.renderer._withGuard(() => this.scene.remove(dummyProjectile));
        
        console.log("Essential shaders pre-warmed");
    }
    
    // Initialize object pools for commonly created objects
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
        // Start the game docked with the stargate for tutorial/intro
        // Make sure the ship is already docked
        if (this.spaceship) {
            // Ensure the ship is docked
            if (!this.spaceship.isDocked) {
        this.spaceship.dock();
            }
        }
        
        // Show stargate UI after a short delay
        setTimeout(() => {
            if (this.controls && this.controls.dockingSystem) {
                // Just show stargate UI without changing state
                this.controls.dockingSystem.dockWithStargate();
                console.log("Stargate UI shown");
            } else {
                console.error("Controls or dockingSystem not available");
            }
        }, 500);
    }
    
    /**
     * Initialize the intro sequence
     */
    initIntroSequence() {
        console.log("Initializing intro sequence...");
        
        // Create intro sequence instance
        this.introSequence = new IntroSequence(
            this.scene,
            this.camera,
            this.spaceship,
            this.audio
        );
        
        // Store original camera and player positions
        this.originalCameraPosition = this.camera.position.clone();
        this.originalCameraRotation = this.camera.rotation.clone();
        
        console.log("Intro sequence initialized");
    }
    
    /**
     * Start the intro sequence
     */
    startIntroSequence() {
        if (!this.introSequence) {
            this.initIntroSequence();
        }
        
        console.log("Starting intro sequence...");
        this.introSequenceActive = true; // Mark intro as active to prevent player control
        
        // Freeze all enemies during intro sequence
        if (this.combat && this.combat.world && this.combat.enemySystem) {
            console.log("Freezing all enemies for intro sequence");
            this.combat.enemySystem.freezeAllEnemies();
        } else if (window.game && window.game.ecsWorld && window.game.ecsWorld.enemySystem) {
            console.log("Freezing all enemies via global reference for intro sequence");
            window.game.ecsWorld.enemySystem.freezeAllEnemies();
        }
        
        // Set initial camera position to match intro sequence starting position
        // This prevents any camera flash from being visible
        this.camera.position.set(0, 6000, 12000);
        this.camera.lookAt(30000, 5000, 0);
        
        // Disable player controls
        if (this.controls && this.controls.inputHandler) {
            this.controls.inputHandler.enabled = false;
        }
        
        // Explicitly hide stargate UI
        if (this.ui && this.ui.stargateInterface) {
            console.log("Explicitly hiding stargate UI before intro sequence");
            this.ui.stargateInterface.hideStargateUI();
        }
        
        // Hide all UI elements
        if (this.ui) {
            this.ui.hideUI();
        }
        
        // Make sure player ship is initially hidden
        if (this.spaceship && this.spaceship.mesh) {
            this.spaceship.mesh.visible = false;
        }
        
        // Start the sequence with a completion callback
        this.introSequence.startSequence(() => {
            this.completeIntroSequence();
        });
    }
    
    /**
     * Handle completion of the intro sequence
     */
    completeIntroSequence() {
        console.log("Intro sequence completed - final phase");
        
        // Unfreeze all enemies after intro sequence
        if (this.combat && this.combat.world && this.combat.enemySystem) {
            console.log("Unfreezing all enemies after intro sequence");
            this.combat.enemySystem.unfreezeAllEnemies();
        } else if (window.game && window.game.ecsWorld && window.game.ecsWorld.enemySystem) {
            console.log("Unfreezing all enemies via global reference after intro sequence");
            window.game.ecsWorld.enemySystem.unfreezeAllEnemies();
        }
        
        // Explicitly hide stargate UI if it's visible
        if (this.ui && this.ui.stargateInterface) {
            console.log("Explicitly hiding stargate UI after intro sequence");
            this.ui.stargateInterface.hideStargateUI();
        }
        
        // Mark intro as complete - now the player can control the ship/camera
        this.introSequenceActive = false;
        
        // Show all UI elements AFTER marking intro inactive
        if (this.ui) {
            console.log("Showing game UI elements after intro completion");
            this.ui.showUI();
        }
        
        // Make sure the player ship is visible and UNDOCKED
        if (this.spaceship && this.spaceship.mesh) {
            this.spaceship.mesh.visible = true;
            
            // Force undocked state
            if (this.spaceship.isDocked) {
                console.log("Forcing undocked state in completeIntroSequence");
                this.spaceship.isDocked = false;
            }
        }
        
        // NOW is when we re-enable player controls (at the very end)
        if (this.controls && this.controls.inputHandler) {
            console.log("Re-enabling player controls");
            this.controls.inputHandler.enabled = true;
        }
        
        // Mark intro as played in local storage
        localStorage.setItem('introPlayed', 'true');
        
        // Emit event for other systems
        if (window.mainMessageBus) {
            window.mainMessageBus.publish('intro.completed', {});
        }
        
        console.log("Game starting after intro sequence");
    }
    
    setupEventHandlers() {
        // Handle window resize
        window.addEventListener('resize', this.handleResize);
        
        // Handle visibility change to pause/resume game
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        
        // Handle keyboard events
        document.addEventListener('keydown', this.handleKeyDown);
    }
    
    update(deltaTime) {
        if (this.isGameOver) return;
        
        // Update horde mode survival time if active
        if (this.isHordeActive) {
            this.hordeSurvivalTime = performance.now() - this.hordeStartTime;
        }
        
            // Update physics
            this.physics.update(deltaTime);
        
        // Update spaceship
        if (this.spaceship.update) {
            this.spaceship.update(deltaTime);
        }
        
        // Update difficulty manager (but not during intro sequence)
        if (this.difficultyManager && !this.introSequenceActive && !this.spaceship.isDocked) {
            this.difficultyManager.update(deltaTime);
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
        
            // Update the ECS world with the current delta time - skip during intro sequence
            if (this.world && !this.introSequenceActive) {
                // Fixed-step for ECS using same delta to keep in lockstep
                this.world.messageBus && this.world.messageBus.fastPublish && this.world.messageBus.fastPublish('world.preUpdate', { deltaTime });
                this.world.systemManager.update(deltaTime);
                this.world.messageBus && this.world.messageBus.fastPublish && this.world.messageBus.fastPublish('world.postUpdate', { deltaTime });
            } else if (this.world && this.introSequenceActive) {
            // If intro is active, only update essential systems but not enemy systems
            // This is a fallback in case freezeAllEnemies() wasn't called or doesn't work
            if (this.world.entityManager && this.world.systemManager) {
                for (const system of this.world.systemManager.systems) {
                    // Skip enemy-related systems during intro
                    if (system.constructor.name !== 'EnemySystem' && 
                        system.constructor.name !== 'EnemyAISystem' && 
                        system.constructor.name !== 'CombatSystem') {
                        system.update(deltaTime);
                    }
                }
            }
        }
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
        
        // Check if out of fuel and not near stargate
        if (this.spaceship.fuel <= 0 && 
            this.controls.dockingSystem && 
            !this.controls.dockingSystem.nearStargate) {
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
            // Add horde mode information to the game stats
            const gameStats = {
                resources: this.controls.resources,
                hordeMode: {
                    active: this.isHordeActive,
                    survivalTime: this.isHordeActive ? this.getFormattedHordeSurvivalTime() : "00:00",
                    rawSurvivalTime: this.hordeSurvivalTime || 0
                }
            };
            
            this.ui.showGameOver(gameStats, message);
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
        
        // Set a timeout to clean up resources after the game over screen has been shown
        // This ensures all final animations and sounds can play before cleanup
        this.gameOverCleanupTimeout = setTimeout(() => {
            // Keep references to the UI and audio for the game over screen
            const ui = this.ui;
            const audio = this.audio;
            
            // Prevent these specific modules from being cleaned up
            this.ui = null;
            this.audio = null;
            
            // Clean up other resources
            this.destroy();
            
            // Restore references for the game over screen
            this.ui = ui;
            this.audio = audio;
        }, 5000); // 5 seconds delay
    }
    
    animate(timestamp) {
        // Initialize frame timing if needed
        if (!this.lastFrameTime) {
            this.lastFrameTime = timestamp;
            this.frameStartTime = performance.now();
            // Request next frame and return
            requestAnimationFrame(this.boundAnimate);
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
                // Request next frame and return early
                requestAnimationFrame(this.boundAnimate);
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
        let frameDelta = Math.min(now - this.lastUpdateTime, 100) / 1000; // Clamped to 100ms
        
        // For high refresh rates (>90Hz), use fixed timestep with interpolation
        // This ensures consistent physics regardless of display refresh rate
        if (!this.frameRateCap || this.frameRateCap > 90) {
            // Accumulate time for fixed timestep
            this.accumulator += frameDelta;
            
            // Fixed timestep updates (60Hz physics)
            const fixedTimestep = 1/60;
            let updates = 0;
            const maxUpdates = 3; // Prevent spiral of death
            
            const simStart = performance.now();
            while (this.accumulator >= fixedTimestep && updates < maxUpdates) {
                // Snapshot transforms before step for interpolation
                if (this.combat && this.combat.world) {
                    const ents = this.combat.world.getEntitiesWithComponents(['TransformComponent']);
                    for (const e of ents) {
                        const t = e.getComponent('TransformComponent');
                        t && t.snapshotPrevious && t.snapshotPrevious();
                    }
                }
                this.update(fixedTimestep);
                this.accumulator -= fixedTimestep;
                updates++;
            }
            const simEnd = performance.now();
            
            // If we're behind, catch up without spiraling
            if (this.accumulator > fixedTimestep * maxUpdates) {
                this.accumulator = fixedTimestep;
            }
            
            // Interpolation factor for smooth rendering
            const alpha = this.accumulator / fixedTimestep;
            
            // Render with interpolation (could be used for smoother visuals)
            const renderStart = performance.now();
            // Interpolate visuals
            if (this.renderer.interpolateMeshes) this.renderer.interpolateMeshes(alpha);
            this.renderer.render();
            const renderEnd = performance.now();

            // Update perf sink
            if (window.__perf) {
                const frameFps = this.actualFrameTime ? (1000 / this.actualFrameTime) : 60;
                window.__perf.fps = Math.round(frameFps);
                window.__perf.simMs = (simEnd - simStart) || 0;
                window.__perf.renderMs = (renderEnd - renderStart) || 0;
            }
        } else {
            // For locked frame rates, use simple delta time
            this.deltaTime = frameDelta;
            const simStart = performance.now();
            // Snapshot transforms before variable step (still provide some interpolation)
            if (this.combat && this.combat.world) {
                const ents = this.combat.world.getEntitiesWithComponents(['TransformComponent']);
                for (const e of ents) {
                    const t = e.getComponent('TransformComponent');
                    t && t.snapshotPrevious && t.snapshotPrevious();
                }
            }
            this.update(this.deltaTime);
            const simEnd = performance.now();
            const renderStart = performance.now();
            if (this.renderer.interpolateMeshes) this.renderer.interpolateMeshes(1);
            this.renderer.render();
            const renderEnd = performance.now();
            if (window.__perf) {
                window.__perf.fps = Math.round(1 / (this.deltaTime||0.016));
                window.__perf.simMs = (simEnd - simStart) || 0;
                window.__perf.renderMs = (renderEnd - renderStart) || 0;
            }
        }
        
        this.lastUpdateTime = now;
        
        // Update frame counter
        this.frameCount++;
        
        // Request next frame at the END of the animation cycle
        requestAnimationFrame(this.boundAnimate);
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
        // [PRESERVED FOR FUTURE SCALING]
        // This method is a placeholder for a potential future implementation
        // of the optimized ECS system using TypedArrays and Data-Oriented Design.
        // 
        // The optimized components, systems and DataStore code are preserved 
        // in the codebase for future performance scaling needs, such as:
        // - Massive asteroid fields (1000+ asteroids)
        // - Large-scale space battles
        // - Advanced particle systems
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
        
        // Add global debug command to trigger intro sequence
        window.playIntro = () => {
            if (this.startIntroSequence) {
                console.log("Manually triggering intro sequence");
                this.startIntroSequence();
                return "Playing intro sequence...";
            }
            return "Intro sequence not available";
        };
    }
    
    /**
     * Initialize difficulty manager when combat system is ready
     */
    initializeDifficultyManager() {
        // Initialize difficulty manager for dynamic difficulty scaling
        this.difficultyManager = {
            params: {
                maxEnemies: 10,
                spawnInterval: 3,
                enemyHealth: 20,
                enemyDamage: 15,
                enemySpeed: 700
            },
            gameTime: 0,
            currentLevel: 1,
            
            update: function(deltaTime) {
                // Update game time in minutes
                this.gameTime += deltaTime;
                const minutes = this.gameTime / 60;
                
                // Calculate level based on minutes played
                // Level increases every 3 minutes
                const newLevel = Math.floor(minutes / 3) + 1;
                
                // Only update if level changed
                if (newLevel !== this.currentLevel) {
                    this.currentLevel = newLevel;
                    
                    // Get difficulty multiplier: 1x at level 1, 1.5x at level 2, 2x at level 3, etc.
                    // Cap at level 5 (3x difficulty) for fairness
                    const difficultyMultiplier = 1 + (Math.min(this.currentLevel - 1, 4) * 0.5);
                    
                    // Update parameters
                    this.params.maxEnemies = Math.min(10 * difficultyMultiplier, 30);
                    this.params.spawnInterval = Math.max(3 / difficultyMultiplier, 1);
                    this.params.enemyHealth = Math.floor(20 * difficultyMultiplier);
                    this.params.enemyDamage = Math.floor(15 * difficultyMultiplier);
                    this.params.enemySpeed = Math.min(700 * (1 + (0.2 * (this.currentLevel - 1))), 1400);
                    
                    console.log(`Difficulty increased to level ${this.currentLevel} (${difficultyMultiplier}x)`);
                    console.log(`Parameters: maxEnemies=${this.params.maxEnemies}, spawnInterval=${this.params.spawnInterval}`);
                    console.log(`Health=${this.params.enemyHealth}, Damage=${this.params.enemyDamage}, Speed=${this.params.enemySpeed}`);
                }
            }
        };
    }
    
    /**
     * Activate horde mode (extreme survival challenge)
     */
    activateHordeMode() {
        if (this.isHordeActive) return; // Already active
        
        console.log("ACTIVATING HORDE MODE - EXTREME SURVIVAL CHALLENGE");
        this.isHordeActive = true;
        this.hordeStartTime = performance.now();
        this.hordeSurvivalTime = 0;
        
        // Play an intense sound to signal the start of horde mode
        if (this.audio) {
            this.audio.playSound('boink');
        }
        
        // Notify UI to update
        window.mainMessageBus.publish('horde.activated', {
            startTime: this.hordeStartTime
        });
        
        // Notify the player
        if (this.ui && this.ui.showNotification) {
            this.ui.showNotification("HORDE MODE ACTIVATED - SURVIVE!", 5000);
        }
        
        // Force player to undock if currently docked
        if (this.spaceship && this.spaceship.isDocked) {
            console.log("Horde mode forcing undock from stargate");
            
            // Undock the ship
            this.spaceship.undock();
            
            // Notify the docking system
            window.mainMessageBus.publish('player.requestUndock', {
                forced: true,
                reason: "horde_mode_activation"
            });
            
            // CRITICAL FIX: Explicitly show the HUD after forcing undock
            // Use a short delay to ensure undocking process is complete
            setTimeout(() => {
                console.log("Horde mode ensuring HUD is visible");
                if (this.ui && this.ui.showUI) {
                    this.ui.showUI();
                }
            }, 200);
        }
    }
    
    /**
     * Format horde survival time as MM:SS
     * @returns {string} Formatted time string
     */
    getFormattedHordeSurvivalTime() {
        const totalSeconds = Math.floor(this.hordeSurvivalTime / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    /**
     * Clean up all game resources, event listeners, and references
     * Call this when the game is no longer needed to prevent memory leaks
     */
    destroy() {
        console.log("Cleaning up game resources...");
        
        // Cancel animation frame
        if (this.boundAnimate) {
            cancelAnimationFrame(this.boundAnimate);
            this.boundAnimate = null;
        }
        
        // Clear any pending timeouts
        if (this.gameOverCleanupTimeout) {
            clearTimeout(this.gameOverCleanupTimeout);
            this.gameOverCleanupTimeout = null;
        }
        
        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        document.removeEventListener('keydown', this.handleKeyDown);
        
        // Clean up modules
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer = null;
        }
        
        if (this.audio) {
            this.audio.dispose();
            this.audio = null;
        }
        
        if (this.physics) {
            this.physics.dispose();
            this.physics = null;
        }
        
        if (this.spaceship) {
            this.spaceship.dispose();
            this.spaceship = null;
        }
        
        if (this.environment) {
            this.environment.dispose();
            this.environment = null;
        }
        
        if (this.controls) {
            this.controls.dispose();
            this.controls = null;
        }
        
        if (this.ui) {
            this.ui.dispose();
            this.ui = null;
        }
        
        if (this.combat) {
            this.combat.dispose();
            this.combat = null;
        }
        
        if (this.introSequence) {
            this.introSequence.destroy();
            this.introSequence = null;
        }
        
        // Clean up ECS world
        if (this.world) {
            // Destroy all entities
            if (this.world.entityManager) {
                const entityIds = [...this.world.entityManager.entities.keys()];
                for (const entityId of entityIds) {
                    this.world.destroyEntity(entityId);
                }
            }
            
            // Destroy all systems
            if (this.world.systemManager) {
                for (const system of this.world.systemManager.systems) {
                    if (system.onDestroyed && typeof system.onDestroyed === 'function') {
                        system.onDestroyed();
                    }
                }
            }
            
            this.world = null;
        }
        
        // Unsubscribe from MessageBus
        if (window.mainMessageBus) {
            window.mainMessageBus.unsubscribe('game.over', this.gameOver.bind(this));
        }
        
        // Clear global references
        window.game = null;
        
        // Clear object pools
        if (window.vectorPool) {
            window.vectorPool.pool = [];
        }
        
        if (window.objectPool) {
            window.objectPool.clearAllPools();
        }
        
        // Clear references
        this.scene = null;
        this.camera = null;
        this.fpsBuffer = [];
        
        console.log("Game resources cleaned up successfully");
    }
    
    /**
     * Handle window resize event
     * @private
     */
    handleResize = () => {
        if (this.renderer) {
            this.renderer.handleResize();
        }
    }
    
    /**
     * Handle visibility change event
     * @private
     */
    handleVisibilityChange = () => {
        if (document.hidden) {
            this.pause();
        } else {
            this.resume();
        }
    }
    
    /**
     * Handle key down event
     * @param {KeyboardEvent} e Key event
     * @private
     */
    handleKeyDown = (e) => {
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
    }
    
    // Fallback to old behavior if start screen is not available
    fallbackToDefaultBehavior() {
        // Check if intro has been played before
        const introPlayed = localStorage.getItem('introPlayed') === 'true';
        
        if (introPlayed) {
            console.log("Intro already played, starting in docked state");
            // Only set initial camera position if we're not doing the intro
            this.camera.position.set(0, 1500, 0);
            // Only start docked if we've already seen the intro
            this.startDocked();
        } else {
            console.log("First time playing, preparing for intro sequence");
            // Make sure ship is docked but DON'T show the UI
            if (this.spaceship && !this.spaceship.isDocked) {
                this.spaceship.dock();
            }
            // Start intro with a small delay to ensure everything is loaded
            setTimeout(() => {
                this.startIntroSequence();
            }, 500);
        }
    }
}

// Bridge legacy window.objectPool to unified PoolRegistry (no-alloc facade)
(() => {
    const registry = getGlobalPoolRegistry();
    window.objectPool = {
        createPool: function(type, factory, initialSize = 10, maxSize = 100) {
            registry.register(type, { factory, reset: (o)=>{}, preallocate: initialSize, maxSize });
        },
        get: function(type, ...args) {
            try { return registry.get(type, ...args); } catch (e) { console.warn(e.message); return null; }
        },
        release: function(type, obj) { registry.release(type, obj); },
        clearAllPools: function() { registry.clearAll(); },
        clearPool: function(type) { registry.clear(type); }
    };
})();

function startGameMainModule() {
    // Add a console message to help debug loading issues
    console.log("DOM ready, starting game initialization...");
    
    // Initialize the game directly instead of using a loading screen
    console.log("Creating game instance...");
    
    // Initialize the game with error handling
    try {
        console.log("Checking for THREE module availability...");
        // Log THREE availability for debugging
        console.log("THREE available:", typeof THREE !== 'undefined');
        
        window.game = new Game(); // Initialize the game
        
        // Preload projectile assets to prevent stutter
        console.log("Precomputing projectile assets and warming shaders...");
        
        // Create template projectile geometry and materials
        window.game.projectileGeometry = new THREE.SphereGeometry(1.8, 12, 12);
        window.game.projectileMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 5,
            metalness: 0.7,
            roughness: 0.3
        });
        
        // Create template glow geometry and material
        window.game.projectileGlowGeometry = new THREE.SphereGeometry(2.4, 16, 16);
        window.game.projectileGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending
        });
        
        // Precompute trail particle geometries for different sizes
        console.log("Precomputing trail particle geometries...");
        window.game.trailParticleGeometries = [];
        const numPoints = 20; // Match the number in addProjectileTrail
        
        for (let i = 0; i < numPoints; i++) {
            const ratio = i / numPoints;
            const size = 0.5 * (1 - ratio); // Match the size calculation in addProjectileTrail
            const particleGeometry = new THREE.SphereGeometry(size, 8, 8);
            window.game.trailParticleGeometries.push(particleGeometry);
        }
        
        // Force shader compilation for better performance
        console.log("Warming shaders...");
        const dummyProjectile = new THREE.Mesh(window.game.projectileGeometry, window.game.projectileMaterial);
        const dummyGlow = new THREE.Mesh(window.game.projectileGlowGeometry, window.game.projectileGlowMaterial);
        dummyProjectile.add(dummyGlow);
        
        // Add to scene temporarily
        if (window.game && window.game.renderer && typeof window.game.renderer._withGuard === 'function') {
            window.game.renderer._withGuard(() => window.game.scene.add(dummyProjectile));
        } else {
            window.game.scene.add(dummyProjectile);
        }
        
        // Precompute and warm shaders for explosion and hit effects
        console.log("Precomputing explosion effect assets...");
        
        // Create template explosion particle geometry and materials
        window.game.explosionGeometry = new THREE.SphereGeometry(1, 8, 8);
        window.game.explosionMaterial = new THREE.MeshBasicMaterial({
            color: 0xff5500,
            transparent: true,
            opacity: 0.8
        });
        
        // Create template hit effect geometry
        window.game.hitEffectGeometry = new THREE.SphereGeometry(1, 8, 8);
        
        // Create dummy explosion particles for shader warming
        const dummyExplosionContainer = new THREE.Group();
        if (window.game && window.game.renderer && typeof window.game.renderer._withGuard === 'function') {
            window.game.renderer._withGuard(() => window.game.scene.add(dummyExplosionContainer));
        } else {
            window.game.scene.add(dummyExplosionContainer);
        }
        
        // Create a sample of explosion particles with various sizes
        const explosionParticleCount = 20;
        const dummyExplosionParticles = [];
        
        for (let i = 0; i < explosionParticleCount; i++) {
            const size = Math.random() * 2 + 1;
            const particle = new THREE.Mesh(
                window.game.explosionGeometry,
                window.game.explosionMaterial.clone() // Clone material for individual control
            );
            
            // Position out of view but still rendered
            particle.position.set(
                Math.random() * 10 - 5,
                Math.random() * 10 - 5,
                Math.random() * 10 - 5
            );
            particle.position.multiplyScalar(10).add(new THREE.Vector3(0, -10000, 0));
            
            // Add to container
            dummyExplosionContainer.add(particle);
            dummyExplosionParticles.push(particle);
        }
        
        // Create explosion particle effect pool
        window.objectPool.createPool('explosionParticle', () => {
            // Reuse the geometry and create a cloned material
            const material = window.game.explosionMaterial.clone();
            const mesh = new THREE.Mesh(window.game.explosionGeometry, material);
            
            return {
                mesh: mesh,
                material: material,
                velocity: new THREE.Vector3(),
                
                // Reset function when retrieved from pool
                reset: function(position, size = 1.0, color = 0xff5500) {
                    // Check if position is defined, use default if not
                    if (!position) {
                        position = new THREE.Vector3(0, 0, 0);
                    }
                    
                    // Set position
                    this.mesh.position.copy(position);
                    
                    // Set size
                    this.mesh.scale.set(size, size, size);
                    
                    // Set color and opacity
                    this.material.color.set(color);
                    this.material.opacity = 0.8;
                    
                    // Make visible
                    this.mesh.visible = true;
                },
                
                // Clear function when returned to pool
                clear: function() {
                    if (this.mesh.parent) {
                        this.mesh.parent.remove(this.mesh);
                    }
                    this.mesh.visible = false;
                    this.velocity.set(0, 0, 0);
                }
            };
        }, 50, 200); // Pre-create 50, max 200
        
        // Ensure hitEffect pool exists before using it during warming
        try {
            let testHit = window.objectPool.get('hitEffect');
            if (!testHit) {
                // Minimal factory mirroring initializeObjectPools behavior
                window.objectPool.createPool('hitEffect', () => {
                    const geo = window.game.hitEffectGeometry || new THREE.SphereGeometry(1, 8, 8);
                    const material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
                    const mesh = new THREE.Mesh(geo, material);
                    return {
                        mesh,
                        material,
                        reset(color = 0xff5500, size = 1) {
                            this.material.color.set(color);
                            this.material.opacity = 0.8;
                            this.mesh.scale.set(size, size, size);
                            this.mesh.visible = true;
                        },
                        clear() {
                            if (this.mesh.parent) { this.mesh.parent.remove(this.mesh); }
                            this.mesh.visible = false;
                        }
                    };
                }, 10, 100);
            } else {
                // Put back the test object since we just probed
                window.objectPool.release('hitEffect', testHit);
            }
        } catch {}

        // Create variation of hit effects with different colors for shader warming
        const hitEffectColors = [0xff5500, 0x3399ff, 0xff0000, 0xffff00];
        const dummyHitEffects = [];
        
        for (const color of hitEffectColors) {
            const hitEffect = window.objectPool.get('hitEffect', color, 1.5);
            if (hitEffect && hitEffect.mesh) {
                // Position far away but still rendered
                hitEffect.mesh.position.set(0, -10100, 0);
                if (window.game && window.game.renderer && typeof window.game.renderer._withGuard === 'function') {
                    window.game.renderer._withGuard(() => window.game.scene.add(hitEffect.mesh));
                } else {
                    window.game.scene.add(hitEffect.mesh);
                }
                dummyHitEffects.push(hitEffect);
            }
        }
        
        // Force shader compilation for all new objects
        window.game.renderer.renderer.compile(window.game.scene, window.game.camera);
        
        console.log("Cleaning up dummy objects after warming...");
        
        // Remove dummy explosion container after compilation
        if (window.game && window.game.renderer && typeof window.game.renderer._withGuard === 'function') {
            window.game.renderer._withGuard(() => window.game.scene.remove(dummyExplosionContainer));
        } else {
            window.game.scene.remove(dummyExplosionContainer);
        }
        for (const particle of dummyExplosionParticles) {
            dummyExplosionContainer.remove(particle);
        }
        
        // Return hit effects to pool
        for (const hitEffect of dummyHitEffects) {
            window.objectPool.release('hitEffect', hitEffect);
        }
        
        console.log("Precomputed assets and shaders warmed successfully");
        
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
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startGameMainModule);
} else {
    // DOM is already ready (e.g., module imported after DOMContentLoaded)
    startGameMainModule();
} 