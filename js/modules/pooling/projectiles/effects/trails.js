/**
 * Trail Effects Pool
 * 
 * Manages pooling of trail effects for projectiles:
 * - Trail containers for organizing particles
 * - Individual trail particles with size variations
 * - Efficient management of particle lifecycles
 * - Optimized rendering and cleanup
 */

import { ObjectPool } from '../../ObjectPool.js';
import * as THREE from 'three';

export class TrailEffectsPool {
    /**
     * Create a new TrailEffectsPool
     * @param {object} sharedAssets - Shared geometries and materials
     * @param {function} addToScene - Function to add objects to scene
     * @param {function} removeFromParent - Function to remove objects from parent
     */
    constructor(sharedAssets, addToScene, removeFromParent) {
        this.sharedAssets = sharedAssets;
        this._addToScene = addToScene;
        this._removeFromParent = removeFromParent;
        
        this.initializePools();
    }
    
    /**
     * Initialize trail container and particle pools
     */
    initializePools() {
        // Initialize trail container pool
        this.trailContainerPool = new ObjectPool(
            // Create function
            () => this.createTrailContainer(),
            // Reset function
            (trailContainer) => this.resetTrailContainer(trailContainer),
            30, // Initial size
            10  // Expand size
        );
        
        // Initialize trail particle pool
        this.trailParticlePool = new ObjectPool(
            // Create function
            () => this.createTrailParticle(),
            // Reset function
            (particle) => this.resetTrailParticle(particle),
            600, // Initial size (20 trails * 30 particles per trail)
            100  // Expand size
        );
    }
    
    /**
     * Create a new trail container
     * @returns {THREE.Object3D} A trail container
     */
    createTrailContainer() {
        const trailContainer = new THREE.Object3D();
        
        // Set up userData to track state
        trailContainer.userData = {
            isTrail: true,
            active: false,
            pooled: true,
            particles: [],
            maxParticles: 30,
            particleLifetime: 1000, // 1 second
            emissionRate: 50 // particles per second
        };
        
        return trailContainer;
    }
    
    /**
     * Reset a trail container to initial state
     * @param {THREE.Object3D} trailContainer - The container to reset
     */
    resetTrailContainer(trailContainer) {
        // Reset position
        trailContainer.position.set(0, 0, 0);
        trailContainer.rotation.set(0, 0, 0);
        trailContainer.visible = false;
        
        // Reset state
        trailContainer.userData.active = false;
        trailContainer.userData.parentProjectile = null;
        trailContainer.userData.lastEmissionTime = 0;
        
        // Note: Trail particles are handled separately
        trailContainer.userData.particles = [];
    }
    
    /**
     * Create a new trail particle
     * @returns {THREE.Mesh} A trail particle mesh
     */
    createTrailParticle() {
        // Create a particle with default size (will be updated when used)
        const particle = new THREE.Mesh(
            this.sharedAssets.trailParticleGeometries[0],
            this.sharedAssets.trailParticleMaterial.clone()
        );
        
        // Set up userData to track state
        particle.userData = {
            isTrailParticle: true,
            active: false,
            pooled: true,
            sizeIndex: 0,
            initialOffset: new THREE.Vector3(),
            birthTime: 0,
            lifetime: 1000,
            velocity: new THREE.Vector3()
        };
        
        return particle;
    }
    
    /**
     * Reset a trail particle to initial state
     * @param {THREE.Mesh} particle - The particle to reset
     */
    resetTrailParticle(particle) {
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
        particle.userData.birthTime = 0;
        particle.userData.velocity.set(0, 0, 0);
    }
    
    /**
     * Get a trail container from the pool
     * @returns {THREE.Object3D} A trail container
     */
    getTrailContainer() {
        const trailContainer = this.trailContainerPool.get();
        trailContainer.visible = true;
        trailContainer.userData.active = true;
        trailContainer.userData.lastEmissionTime = performance.now();
        
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
        particle.userData.birthTime = performance.now();
        
        // Use the appropriate geometry for this particle size
        if (sizeIndex >= 0 && sizeIndex < this.sharedAssets.trailParticleGeometries.length) {
            particle.geometry = this.sharedAssets.trailParticleGeometries[sizeIndex];
        }
        
        return particle;
    }
    
    /**
     * Create a trail for a projectile
     * @param {THREE.Mesh} projectile - The projectile to attach trail to
     * @param {object} options - Trail configuration options
     * @returns {THREE.Object3D} The trail container
     */
    createTrailForProjectile(projectile, options = {}) {
        const trail = this.getTrailContainer();
        
        // Configure trail based on projectile type
        const defaultOptions = {
            maxParticles: 30,
            particleLifetime: 1000,
            emissionRate: 50,
            color: 0xffffff,
            opacity: 0.9
        };
        
        const config = { ...defaultOptions, ...options };
        
        // Adjust trail based on projectile type
        if (projectile.userData.projectileType) {
            switch (projectile.userData.projectileType) {
                case 'laser':
                    config.color = 0x00ffff;
                    config.particleLifetime = 500;
                    config.emissionRate = 80;
                    break;
                case 'missile':
                    config.color = 0xff6600;
                    config.particleLifetime = 1500;
                    config.emissionRate = 60;
                    config.maxParticles = 40;
                    break;
                case 'plasma':
                    config.color = 0xaa00ff;
                    config.particleLifetime = 800;
                    config.emissionRate = 70;
                    break;
                case 'bullet':
                    config.color = 0xffee44;
                    config.particleLifetime = 300;
                    config.emissionRate = 30;
                    config.maxParticles = 15;
                    break;
            }
        }
        
        // Apply configuration
        trail.userData.maxParticles = config.maxParticles;
        trail.userData.particleLifetime = config.particleLifetime;
        trail.userData.emissionRate = config.emissionRate;
        trail.userData.trailColor = config.color;
        trail.userData.trailOpacity = config.opacity;
        trail.userData.parentProjectile = projectile;
        
        // Attach trail to projectile
        projectile.add(trail);
        projectile.userData.trail = trail;
        
        return trail;
    }
    
    /**
     * Update all active trail effects
     * @param {number} deltaTime - Time since last update
     */
    updateTrails(deltaTime) {
        const currentTime = performance.now();
        
        // Update all active trail containers
        for (const trail of this.trailContainerPool.active) {
            this.updateTrailContainer(trail, deltaTime, currentTime);
        }
        
        // Update all active trail particles
        for (const particle of this.trailParticlePool.active) {
            this.updateTrailParticle(particle, deltaTime, currentTime);
        }
    }
    
    /**
     * Update a single trail container
     * @param {THREE.Object3D} trail - The trail to update
     * @param {number} deltaTime - Time since last update
     * @param {number} currentTime - Current timestamp
     */
    updateTrailContainer(trail, deltaTime, currentTime) {
        if (!trail.userData.active) return;
        
        // Emit new particles if projectile is still active
        const projectile = trail.userData.parentProjectile;
        if (projectile && projectile.userData.active) {
            const timeSinceLastEmission = currentTime - trail.userData.lastEmissionTime;
            const emissionInterval = 1000 / trail.userData.emissionRate;
            
            if (timeSinceLastEmission >= emissionInterval && 
                trail.userData.particles.length < trail.userData.maxParticles) {
                
                this.emitTrailParticle(trail);
                trail.userData.lastEmissionTime = currentTime;
            }
        }
    }
    
    /**
     * Update a single trail particle
     * @param {THREE.Mesh} particle - The particle to update
     * @param {number} deltaTime - Time since last update
     * @param {number} currentTime - Current timestamp
     */
    updateTrailParticle(particle, deltaTime, currentTime) {
        if (!particle.userData.active) return;
        
        const age = currentTime - particle.userData.birthTime;
        const lifeProgress = age / particle.userData.lifetime;
        
        if (lifeProgress >= 1.0) {
            // Particle has expired, release it
            this.releaseTrailParticle(particle);
            return;
        }
        
        // Fade out over lifetime
        const opacity = particle.userData.initialOpacity * (1 - lifeProgress);
        particle.material.opacity = opacity;
        
        // Scale down over lifetime
        const scale = 1 - lifeProgress * 0.5;
        particle.scale.set(scale, scale, scale);
        
        // Apply velocity if set
        if (particle.userData.velocity.length() > 0) {
            particle.position.add(particle.userData.velocity.clone().multiplyScalar(deltaTime * 0.001));
        }
    }
    
    /**
     * Emit a new trail particle
     * @param {THREE.Object3D} trail - The trail container
     */
    emitTrailParticle(trail) {
        const sizeIndex = Math.floor(Math.random() * this.sharedAssets.trailParticleGeometries.length);
        const particle = this.getTrailParticle(sizeIndex);
        
        // Position at trail origin with some randomness
        const randomOffset = new THREE.Vector3(
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20
        );
        particle.position.copy(randomOffset);
        
        // Set particle properties based on trail configuration
        particle.material.color.setHex(trail.userData.trailColor || 0xffffff);
        particle.userData.initialOpacity = trail.userData.trailOpacity || 0.9;
        particle.userData.lifetime = trail.userData.particleLifetime || 1000;
        
        // Add slight random velocity for organic movement
        particle.userData.velocity.set(
            (Math.random() - 0.5) * 50,
            (Math.random() - 0.5) * 50,
            (Math.random() - 0.5) * 50
        );
        
        // Add to trail container
        trail.add(particle);
        trail.userData.particles.push(particle);
    }
    
    /**
     * Release a trail container back to the pool
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
        
        // Remove from parent if still attached
        if (particle.parent) {
            particle.parent.remove(particle);
        }
        
        // Return to pool
        this.trailParticlePool.release(particle);
    }
    
    /**
     * Get count statistics for debugging
     * @returns {object} Pool statistics
     */
    getStats() {
        return {
            trailContainers: {
                available: this.trailContainerPool.availableCount(),
                active: this.trailContainerPool.activeCount()
            },
            trailParticles: {
                available: this.trailParticlePool.availableCount(),
                active: this.trailParticlePool.activeCount()
            }
        };
    }
    
    /**
     * Dispose the trail effects pools
     * @param {function} disposeFn - Custom dispose function
     */
    dispose(disposeFn) {
        this.trailContainerPool.dispose((trail) => {
            // Remove from scene or parent
            if (trail.parent) {
                this._removeFromParent(trail);
            }
            
            if (disposeFn) {
                disposeFn(trail);
            }
        });
        
        this.trailParticlePool.dispose((particle) => {
            // Remove from parent if still attached
            if (particle.parent) {
                this._removeFromParent(particle);
            }
            
            // Materials are cloned per particle
            if (particle.material) {
                particle.material.dispose();
            }
            
            if (disposeFn) {
                disposeFn(particle);
            }
        });
    }
}