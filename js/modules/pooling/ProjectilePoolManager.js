/**
 * Projectile Pool Manager
 * 
 * Manages pools of projectiles, muzzle flashes, and trails for the combat system.
 * This reduces garbage collection by reusing objects instead of creating new ones.
 */

import { ObjectPool } from './ObjectPool.js';
import * as THREE from 'three';

export class ProjectilePoolManager {
    /**
     * Create a new ProjectilePoolManager
     * @param {THREE.Scene} scene - The scene to add projectiles to
     */
    constructor(scene) {
        this.scene = scene;
        
        // Create shared geometries and materials
        this.createSharedAssets();
        
        // Create object pools
        this.initializePools();
        
        console.log("ProjectilePoolManager initialized with shared assets and pools");
    }
    
    /**
     * Create shared geometries and materials to be used by all projectiles
     */
    createSharedAssets() {
        // Projectile geometry
        this.projectileGeometry = new THREE.SphereGeometry(1.8, 12, 12);
        this.projectileGlowGeometry = new THREE.SphereGeometry(2.4, 16, 16);
        
        // Muzzle flash geometry
        this.muzzleFlashGeometry = new THREE.CylinderGeometry(0.5, 2, 15, 12, 1, true);
        this.muzzleFlashGeometry.rotateX(Math.PI / 2);
        this.muzzleFlashGeometry.translate(0, 0, 15 / 2);
        
        // Trail particle geometry (different sizes)
        this.trailParticleGeometries = [];
        const numTrailPoints = 20;
        for (let i = 0; i < numTrailPoints; i++) {
            const ratio = i / numTrailPoints;
            const size = 0.5 * (1 - ratio);
            this.trailParticleGeometries.push(new THREE.SphereGeometry(size, 8, 8));
        }
        
        // Tracer line geometry
        this.tracerGeometry = new THREE.BufferGeometry();
        const points = [0, 0, 0, 0, 0, 1];
        this.tracerGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
        
        // Materials
        this.projectileMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 5,
            metalness: 0.7,
            roughness: 0.3
        });
        
        this.projectileGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending
        });
        
        this.trailParticleMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });
        
        this.muzzleFlashMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        
        this.tracerLineMaterial = new THREE.LineBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        
        // Store references in window.game for legacy code
        if (!window.game) window.game = {};
        
        window.game.projectileGeometry = this.projectileGeometry;
        window.game.projectileGlowGeometry = this.projectileGlowGeometry;
        window.game.muzzleFlashGeometry = this.muzzleFlashGeometry;
        window.game.trailParticleGeometries = this.trailParticleGeometries;
        window.game.tracerGeometry = this.tracerGeometry;
        
        window.game.projectileMaterial = this.projectileMaterial;
        window.game.projectileGlowMaterial = this.projectileGlowMaterial;
        window.game.trailParticleMaterial = this.trailParticleMaterial;
        window.game.muzzleFlashMaterial = this.muzzleFlashMaterial;
        window.game.tracerLineMaterial = this.tracerLineMaterial;
    }
    
    /**
     * Initialize the object pools
     */
    initializePools() {
        // Initialize projectile pool
        this.projectilePool = new ObjectPool(
            // Create function
            () => {
                // Create projectile mesh with glow as child
                const projectile = new THREE.Mesh(this.projectileGeometry, this.projectileMaterial.clone());
                const glowMesh = new THREE.Mesh(this.projectileGlowGeometry, this.projectileGlowMaterial.clone());
                projectile.add(glowMesh);
                
                // Set up userData to track state
                projectile.userData = {
                    isProjectile: true,
                    active: false,
                    pooled: true,
                    glowMesh: glowMesh
                };
                
                return projectile;
            },
            // Reset function
            (projectile) => {
                // Reset position, velocity and visibility
                projectile.position.set(0, 0, 0);
                projectile.rotation.set(0, 0, 0);
                projectile.scale.set(1, 1, 1);
                projectile.visible = false;
                
                // Clean up any lingering references
                projectile.userData.active = false;
                projectile.userData.creationTime = 0;
                projectile.userData.entityId = null;
                
                // If there's a trail, it will be released separately
                projectile.userData.trail = null;
                projectile.userData.trailParticles = null;
            },
            30, // Initial size
            10  // Expand size
        );
        
        // Initialize explosion pool
        this.explosionPool = new ObjectPool(
            // Create function
            () => {
                // Create particle geometry for explosion
                const particleCount = 200;
                const geometry = new THREE.BufferGeometry();
                const positions = new Float32Array(particleCount * 3);
                
                // Randomize particle positions in a sphere
                for (let i = 0; i < particleCount; i++) {
                    const i3 = i * 3;
                    positions[i3] = (Math.random() - 0.5) * 100;
                    positions[i3 + 1] = (Math.random() - 0.5) * 100;
                    positions[i3 + 2] = (Math.random() - 0.5) * 100;
                }
                
                geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                
                // Create bright material with additive blending for glow effect
                const material = new THREE.PointsMaterial({
                    color: 0xff9900,
                    size: 10,
                    transparent: true,
                    opacity: 1,
                    blending: THREE.AdditiveBlending
                });
                
                // Create particle system
                const explosion = new THREE.Points(geometry, material);
                
                // Set up userData to track state
                explosion.userData = {
                    isExplosion: true,
                    active: false,
                    pooled: true,
                    startTime: 0,
                    duration: 1000, // Default duration
                    particleCount: particleCount
                };
                
                return explosion;
            },
            // Reset function
            (explosion) => {
                // Reset position and visibility
                explosion.position.set(0, 0, 0);
                explosion.visible = false;
                
                // Reset material opacity
                explosion.material.opacity = 1.0;
                
                // Reset animation state
                explosion.userData.active = false;
                explosion.userData.startTime = 0;
                
                // Reset particle positions to initial random state
                const positions = explosion.geometry.attributes.position.array;
                const particleCount = explosion.userData.particleCount;
                for (let i = 0; i < particleCount; i++) {
                    const i3 = i * 3;
                    positions[i3] = (Math.random() - 0.5) * 100;
                    positions[i3 + 1] = (Math.random() - 0.5) * 100;
                    positions[i3 + 2] = (Math.random() - 0.5) * 100;
                }
                explosion.geometry.attributes.position.needsUpdate = true;
            },
            10, // Initial size
            5   // Expand size
        );
        
        // Initialize muzzle flash pool
        this.muzzleFlashPool = new ObjectPool(
            // Create function
            () => {
                // Create cone mesh for muzzle flash
                const muzzleFlash = new THREE.Mesh(this.muzzleFlashGeometry, this.muzzleFlashMaterial.clone());
                
                // Set up userData to track state
                muzzleFlash.userData = {
                    isMuzzleFlash: true,
                    active: false,
                    pooled: true,
                    startTime: 0,
                    flashLight: null
                };
                
                // Create a point light that will be attached to the flash
                const flashLight = new THREE.PointLight(0x00ffff, 200, 10, 2);
                flashLight.visible = false;
                this.scene.add(flashLight);
                
                // Store reference to light
                muzzleFlash.userData.flashLight = flashLight;
                
                return muzzleFlash;
            },
            // Reset function
            (muzzleFlash) => {
                // Reset position, scale and visibility
                muzzleFlash.position.set(0, 0, 0);
                muzzleFlash.rotation.set(0, 0, 0);
                muzzleFlash.scale.set(1, 1, 1);
                muzzleFlash.visible = false;
                
                // Reset material opacity
                muzzleFlash.material.opacity = 0.7;
                
                // Reset flash light
                const flashLight = muzzleFlash.userData.flashLight;
                if (flashLight) {
                    flashLight.position.set(0, 0, 0);
                    flashLight.intensity = 200;
                    flashLight.visible = false;
                }
                
                // Reset state
                muzzleFlash.userData.active = false;
                muzzleFlash.userData.startTime = 0;
            },
            20, // Initial size
            5   // Expand size
        );
        
        // Initialize trail container pool
        this.trailContainerPool = new ObjectPool(
            // Create function
            () => {
                // Create container for trail particles
                const trailContainer = new THREE.Object3D();
                
                // Set up userData to track state
                trailContainer.userData = {
                    isTrail: true,
                    active: false,
                    pooled: true,
                    particles: []
                };
                
                return trailContainer;
            },
            // Reset function
            (trailContainer) => {
                // Reset position
                trailContainer.position.set(0, 0, 0);
                trailContainer.rotation.set(0, 0, 0);
                trailContainer.visible = false;
                
                // Reset state
                trailContainer.userData.active = false;
                trailContainer.userData.parentProjectile = null;
                
                // Note: Trail particles are handled separately
            },
            30, // Initial size
            10  // Expand size
        );
        
        // Initialize trail particle pool
        this.trailParticlePool = new ObjectPool(
            // Create function
            () => {
                // Create a particle with default size (will be updated when used)
                const particle = new THREE.Mesh(
                    this.trailParticleGeometries[0],
                    this.trailParticleMaterial.clone()
                );
                
                // Set up userData to track state
                particle.userData = {
                    isTrailParticle: true,
                    active: false,
                    pooled: true,
                    sizeIndex: 0,
                    initialOffset: new THREE.Vector3()
                };
                
                return particle;
            },
            // Reset function
            (particle) => {
                // Reset position and visibility
                particle.position.set(0, 0, 0);
                particle.visible = false;
                
                // Reset material
                particle.material.opacity = 0.9;
                
                // Reset state
                particle.userData.active = false;
                particle.userData.sizeIndex = 0;
                particle.userData.initialOffset.set(0, 0, 0);
                particle.userData.initialOpacity = 0.9;
            },
            600, // Initial size (20 trails * 30 particles per trail)
            100  // Expand size
        );
        
        // Initialize tracer pool
        this.tracerPool = new ObjectPool(
            // Create function
            () => {
                // Create tracer line
                const tracer = new THREE.Line(
                    this.tracerGeometry.clone(),
                    this.tracerLineMaterial.clone()
                );
                
                // Set up userData to track state
                tracer.userData = {
                    isTracer: true,
                    active: false,
                    pooled: true,
                    startTime: 0
                };
                
                return tracer;
            },
            // Reset function
            (tracer) => {
                // Reset position and visibility
                tracer.position.set(0, 0, 0);
                tracer.visible = false;
                
                // Reset material
                tracer.material.opacity = 0.6;
                
                // Reset state
                tracer.userData.active = false;
                tracer.userData.startTime = 0;
            },
            20, // Initial size
            5   // Expand size
        );
    }
    
    /**
     * Get a projectile from the pool
     * @returns {THREE.Mesh} A projectile mesh
     */
    getProjectile() {
        const projectile = this.projectilePool.get();
        projectile.visible = true;
        projectile.userData.active = true;
        projectile.userData.creationTime = performance.now();
        
        // Add to scene if not already there
        if (!projectile.parent) {
            this.scene.add(projectile);
        }
        
        return projectile;
    }
    
    /**
     * Get a muzzle flash from the pool
     * @returns {THREE.Mesh} A muzzle flash mesh
     */
    getMuzzleFlash() {
        const muzzleFlash = this.muzzleFlashPool.get();
        muzzleFlash.visible = true;
        muzzleFlash.userData.active = true;
        muzzleFlash.userData.startTime = performance.now();
        
        // Set up flash light
        const flashLight = muzzleFlash.userData.flashLight;
        if (flashLight) {
            flashLight.visible = true;
            flashLight.intensity = 200;
        }
        
        // Add to scene if not already there
        if (!muzzleFlash.parent) {
            this.scene.add(muzzleFlash);
        }
        
        return muzzleFlash;
    }
    
    /**
     * Get a trail container from the pool
     * @returns {THREE.Object3D} A trail container
     */
    getTrailContainer() {
        const trailContainer = this.trailContainerPool.get();
        trailContainer.visible = true;
        trailContainer.userData.active = true;
        
        return trailContainer;
    }
    
    /**
     * Get a trail particle from the pool
     * @param {number} sizeIndex - Index of the size to use
     * @returns {THREE.Mesh} A trail particle mesh
     */
    getTrailParticle(sizeIndex = 0) {
        const particle = this.trailParticlePool.get();
        particle.visible = true;
        particle.userData.active = true;
        particle.userData.sizeIndex = sizeIndex;
        
        // Use the appropriate geometry for this particle size
        if (sizeIndex >= 0 && sizeIndex < this.trailParticleGeometries.length) {
            particle.geometry = this.trailParticleGeometries[sizeIndex];
        }
        
        return particle;
    }
    
    /**
     * Get a tracer from the pool
     * @returns {THREE.Line} A tracer line
     */
    getTracer() {
        const tracer = this.tracerPool.get();
        tracer.visible = true;
        tracer.userData.active = true;
        tracer.userData.startTime = performance.now();
        
        // Add to scene if not already there
        if (!tracer.parent) {
            this.scene.add(tracer);
        }
        
        return tracer;
    }
    
    /**
     * Get an explosion effect from the pool
     * @param {THREE.Vector3} position Position for the explosion
     * @param {number} duration Duration of the explosion in milliseconds
     * @returns {THREE.Points} An explosion effect
     */
    getExplosion(position, duration = 1000) {
        const explosion = this.explosionPool.get();
        explosion.position.copy(position);
        explosion.visible = true;
        explosion.userData.active = true;
        explosion.userData.startTime = Date.now();
        explosion.userData.duration = duration;
        
        // Add to scene if not already there
        if (!explosion.parent) {
            this.scene.add(explosion);
        }
        
        return explosion;
    }
    
    /**
     * Release a projectile back to the pool
     * @param {THREE.Mesh} projectile - The projectile to release
     */
    releaseProjectile(projectile) {
        // Skip if not a valid projectile
        if (!projectile || !projectile.userData || !projectile.userData.isProjectile) {
            return;
        }
        
        // Release the trail if it exists
        if (projectile.userData.trail) {
            this.releaseTrail(projectile.userData.trail);
            projectile.remove(projectile.userData.trail);
            projectile.userData.trail = null;
            projectile.userData.trailParticles = null;
        }
        
        // Remove from scene to ensure it's not rendered
        if (projectile.parent) {
            projectile.parent.remove(projectile);
        }
        
        // Return to pool
        this.projectilePool.release(projectile);
    }
    
    /**
     * Release a muzzle flash back to the pool
     * @param {THREE.Mesh} muzzleFlash - The muzzle flash to release
     */
    releaseMuzzleFlash(muzzleFlash) {
        // Skip if not a valid muzzle flash
        if (!muzzleFlash || !muzzleFlash.userData || !muzzleFlash.userData.isMuzzleFlash) {
            return;
        }
        
        // Hide the flash light
        const flashLight = muzzleFlash.userData.flashLight;
        if (flashLight) {
            flashLight.visible = false;
        }
        
        // Remove from scene
        if (muzzleFlash.parent) {
            muzzleFlash.parent.remove(muzzleFlash);
        }
        
        // Return to pool
        this.muzzleFlashPool.release(muzzleFlash);
    }
    
    /**
     * Release a trail back to the pool
     * @param {THREE.Object3D} trail - The trail container to release
     */
    releaseTrail(trail) {
        // Skip if not a valid trail
        if (!trail || !trail.userData || !trail.userData.isTrail) {
            return;
        }
        
        // Release all particles
        if (trail.userData.particles) {
            for (const particle of trail.userData.particles) {
                if (particle) {
                    // Remove from trail container
                    trail.remove(particle);
                    // Release back to particle pool
                    this.releaseTrailParticle(particle);
                }
            }
        }
        
        // Clear particles array
        trail.userData.particles = [];
        
        // Return to pool
        this.trailContainerPool.release(trail);
    }
    
    /**
     * Release a trail particle back to the pool
     * @param {THREE.Mesh} particle - The trail particle to release
     */
    releaseTrailParticle(particle) {
        // Skip if not a valid trail particle
        if (!particle || !particle.userData || !particle.userData.isTrailParticle) {
            return;
        }
        
        // Return to pool
        this.trailParticlePool.release(particle);
    }
    
    /**
     * Release a tracer back to the pool
     * @param {THREE.Line} tracer - The tracer to release
     */
    releaseTracer(tracer) {
        // Skip if not a valid tracer
        if (!tracer || !tracer.userData || !tracer.userData.isTracer) {
            return;
        }
        
        // Remove from scene
        if (tracer.parent) {
            tracer.parent.remove(tracer);
        }
        
        // Return to pool
        this.tracerPool.release(tracer);
    }
    
    /**
     * Release an explosion back to the pool
     * @param {THREE.Points} explosion - The explosion to release
     */
    releaseExplosion(explosion) {
        // Skip if not a valid explosion
        if (!explosion || !explosion.userData || !explosion.userData.isExplosion) {
            return;
        }
        
        // Remove from scene
        if (explosion.parent) {
            explosion.parent.remove(explosion);
        }
        
        // Return to pool
        this.explosionPool.release(explosion);
    }
    
    /**
     * Update all active objects from the pools
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
        this.updateMuzzleFlashes(deltaTime);
        this.updateTracers(deltaTime);
        this.updateExplosions(deltaTime);
    }
    
    /**
     * Update all active muzzle flashes
     * @param {number} deltaTime - Time since last update
     */
    updateMuzzleFlashes(deltaTime) {
        // Check all active muzzle flashes
        for (const muzzleFlash of this.muzzleFlashPool.active) {
            const elapsed = performance.now() - muzzleFlash.userData.startTime;
            const burstDuration = 70; // Same as in the original code
            const progress = elapsed / burstDuration;
            
            if (progress >= 1) {
                // Animation complete, release back to pool
                this.releaseMuzzleFlash(muzzleFlash);
            } else {
                // Continue animation
                const travelProgress = Math.min(progress * 2.5, 1);
                const travelDistance = 300;
                
                // Update position if initialPosition is set
                if (muzzleFlash.userData.initialPosition && muzzleFlash.userData.direction) {
                    const newPosition = muzzleFlash.userData.initialPosition.clone().add(
                        muzzleFlash.userData.direction.clone().multiplyScalar(travelDistance * travelProgress)
                    );
                    muzzleFlash.position.copy(newPosition);
                    
                    // Update the flash light position too
                    if (muzzleFlash.userData.flashLight) {
                        muzzleFlash.userData.flashLight.position.copy(newPosition);
                    }
                }
                
                // Fade out
                muzzleFlash.material.opacity = 0.7 * (1 - progress);
                
                // Fade light
                if (muzzleFlash.userData.flashLight) {
                    muzzleFlash.userData.flashLight.intensity = 200 * (1 - progress * 3);
                }
                
                // Stretch effect
                const stretchFactor = 1 + progress * 1.5;
                muzzleFlash.scale.set(1, 1, stretchFactor);
            }
        }
    }
    
    /**
     * Update all active tracers
     * @param {number} deltaTime - Time since last update
     */
    updateTracers(deltaTime) {
        // Check all active tracers
        for (const tracer of this.tracerPool.active) {
            const elapsed = performance.now() - tracer.userData.startTime;
            const fadeSpeed = 1.5; // From original code
            const opacity = Math.max(0, tracer.material.opacity - fadeSpeed * 0.016);
            
            if (opacity <= 0) {
                // Fully faded, release back to pool
                this.releaseTracer(tracer);
            } else {
                // Update opacity
                tracer.material.opacity = opacity;
            }
        }
    }
    
    /**
     * Update all active explosions
     * @param {number} deltaTime - Time since last update
     */
    updateExplosions(deltaTime) {
        // Check all active explosions
        for (const explosion of this.explosionPool.active) {
            const elapsed = Date.now() - explosion.userData.startTime;
            const duration = explosion.userData.duration;
            const progress = elapsed / duration;
            
            if (progress >= 1) {
                // Animation complete, release back to pool
                this.releaseExplosion(explosion);
            } else {
                // Continue animation - expand particles
                const positions = explosion.geometry.attributes.position.array;
                const particleCount = explosion.userData.particleCount;
                
                for (let i = 0; i < particleCount; i++) {
                    const i3 = i * 3;
                    const x = positions[i3] * (1 + progress * 5);
                    const y = positions[i3 + 1] * (1 + progress * 5);
                    const z = positions[i3 + 2] * (1 + progress * 5);
                    
                    explosion.geometry.attributes.position.array[i3] = x;
                    explosion.geometry.attributes.position.array[i3 + 1] = y;
                    explosion.geometry.attributes.position.array[i3 + 2] = z;
                }
                
                explosion.geometry.attributes.position.needsUpdate = true;
                
                // Fade out
                explosion.material.opacity = 1 - progress;
            }
        }
    }
    
    /**
     * Dispose all pools and shared assets
     */
    dispose() {
        // Dispose shared geometries
        this.projectileGeometry.dispose();
        this.projectileGlowGeometry.dispose();
        this.muzzleFlashGeometry.dispose();
        this.tracerGeometry.dispose();
        
        this.trailParticleGeometries.forEach(geometry => geometry.dispose());
        
        // Dispose shared materials
        this.projectileMaterial.dispose();
        this.projectileGlowMaterial.dispose();
        this.trailParticleMaterial.dispose();
        this.muzzleFlashMaterial.dispose();
        this.tracerLineMaterial.dispose();
        
        // Dispose pools with custom dispose functions
        this.projectilePool.dispose(projectile => {
            // Remove from scene
            if (projectile.parent) projectile.parent.remove(projectile);
            
            // Clean up materials
            if (projectile.userData.glowMesh && projectile.userData.glowMesh.material) {
                projectile.userData.glowMesh.material.dispose();
            }
            
            // Materials are cloned per projectile
            if (projectile.material) projectile.material.dispose();
        });
        
        this.muzzleFlashPool.dispose(muzzleFlash => {
            // Remove from scene
            if (muzzleFlash.parent) muzzleFlash.parent.remove(muzzleFlash);
            
            // Remove flash light
            if (muzzleFlash.userData.flashLight) {
                if (muzzleFlash.userData.flashLight.parent) {
                    muzzleFlash.userData.flashLight.parent.remove(muzzleFlash.userData.flashLight);
                }
            }
            
            // Materials are cloned per muzzle flash
            if (muzzleFlash.material) muzzleFlash.material.dispose();
        });
        
        this.trailContainerPool.dispose(trail => {
            // Remove from scene or parent
            if (trail.parent) trail.parent.remove(trail);
        });
        
        this.trailParticlePool.dispose(particle => {
            // Remove from parent if still attached
            if (particle.parent) particle.parent.remove(particle);
            
            // Materials are cloned per particle
            if (particle.material) particle.material.dispose();
        });
        
        this.tracerPool.dispose(tracer => {
            // Remove from scene
            if (tracer.parent) tracer.parent.remove(tracer);
            
            // Materials are cloned per tracer
            if (tracer.material) tracer.material.dispose();
        });
        
        console.log("ProjectilePoolManager disposed all pools and shared assets");
    }
} 