/**
 * Trail Effects Pool
 *
 * Manages pooling of trail effects for projectiles:
 * - Trail containers for organizing particles
 * - Individual trail particles with size variations
 * - Efficient management of particle lifecycles
 * - Optimized rendering and cleanup
 */

import { ObjectPool } from '../../ObjectPool.ts';
import {
  BufferGeometry,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Vector3,
  Object3D,
  Mesh,
} from 'three';

type SharedAssets = {
    trailParticleGeometries: BufferGeometry[];
    trailParticleMaterial: MeshBasicMaterial;
};

type TrailParticleUserData = {
    isTrailParticle: true;
    active: boolean;
    pooled: boolean;
    sizeIndex: number;
    initialOffset: Vector3;
    birthTime: number;
    lifetime: number;
    velocity: Vector3;
    initialOpacity: number;
};

type TrailParticle = Mesh<BufferGeometry, MeshBasicMaterial> & {
    userData: TrailParticleUserData;
};

type TrailContainerUserData = {
    isTrail: true;
    active: boolean;
    pooled: boolean;
    particles: TrailParticle[];
    maxParticles: number;
    particleLifetime: number;
    emissionRate: number;
    parentProjectile?: ProjectileWithTrail | null;
    lastEmissionTime?: number;
    trailColor?: number;
    trailOpacity?: number;
};

type TrailContainer = Object3D & {
    userData: TrailContainerUserData;
};

type ProjectileWithTrail = Mesh<BufferGeometry, MeshStandardMaterial> & {
    userData: {
        projectileType?: string;
        active?: boolean;
        trail?: Object3D | null;
    } & Record<string, unknown>;
};

type RemoveFromParent = (object: Object3D) => void;

export class TrailEffectsPool {
    sharedAssets: SharedAssets;
    private _removeFromParent: RemoveFromParent;

    trailContainerPool!: ObjectPool<TrailContainer>;
    trailParticlePool!: ObjectPool<TrailParticle>;

    /**
     * Create a new TrailEffectsPool
     * @param sharedAssets - Shared geometries and materials
     * @param removeFromParent - Function to remove objects from parent
     */
    constructor(sharedAssets: SharedAssets, removeFromParent: RemoveFromParent) {
        this.sharedAssets = sharedAssets;
        this._removeFromParent = removeFromParent;

        this.initializePools();
    }

    /**
     * Initialize trail container and particle pools
     */
    initializePools(): void {
        // Initialize trail container pool
        this.trailContainerPool = new ObjectPool<TrailContainer>(
            // Create function
            () => this.createTrailContainer(),
            // Reset function
            (trailContainer) => this.resetTrailContainer(trailContainer),
            30, // Initial size
            10 // Expand size
        );

        // Initialize trail particle pool
        this.trailParticlePool = new ObjectPool<TrailParticle>(
            // Create function
            () => this.createTrailParticle(),
            // Reset function
            (particle) => this.resetTrailParticle(particle),
            600, // Initial size (20 trails * 30 particles per trail)
            100 // Expand size
        );
    }

    /**
     * Create a new trail container
     * @returns A trail container
     */
    createTrailContainer(): TrailContainer {
        const trailContainer = new Object3D() as TrailContainer;

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
     * @param trailContainer - The container to reset
     */
    resetTrailContainer(trailContainer: TrailContainer): void {
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
     * @returns A trail particle mesh
     */
    createTrailParticle(): TrailParticle {
        // Create a particle with default size (will be updated when used)
        const particle = new Mesh(
            this.sharedAssets.trailParticleGeometries[0],
            this.sharedAssets.trailParticleMaterial.clone()
        ) as TrailParticle;

        // Set up userData to track state
        particle.userData = {
            isTrailParticle: true,
            active: false,
            pooled: true,
            sizeIndex: 0,
            initialOffset: new Vector3(),
            birthTime: 0,
            lifetime: 1000,
            velocity: new Vector3(),
            initialOpacity: 0.9
        };

        return particle;
    }

    /**
     * Reset a trail particle to initial state
     * @param particle - The particle to reset
     */
    resetTrailParticle(particle: TrailParticle): void {
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
     * @returns A trail container
     */
    getTrailContainer(): TrailContainer {
        const trailContainer = this.trailContainerPool.get();
        trailContainer.visible = true;
        trailContainer.userData.active = true;
        trailContainer.userData.lastEmissionTime = performance.now();

        return trailContainer;
    }

    /**
     * Get a trail particle from the pool
     * @param sizeIndex - Index of the size to use
     * @returns A trail particle mesh
     */
    getTrailParticle(sizeIndex = 0): TrailParticle {
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
     * @param projectile - The projectile to attach trail to
     * @param options - Trail configuration options
     * @returns The trail container
     */
    createTrailForProjectile(projectile: ProjectileWithTrail, options: Record<string, unknown> = {}): TrailContainer {
        const trail = this.getTrailContainer();

        // Configure trail based on projectile type
        const defaultOptions = {
            maxParticles: 30,
            particleLifetime: 1000,
            emissionRate: 50,
            color: 0xffffff,
            opacity: 0.9
        };

        const config = { ...defaultOptions, ...options } as typeof defaultOptions;

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
                default:
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
     * @param deltaTime - Time since last update
     */
    updateTrails(deltaTime: number): void {
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
     * @param trail - The trail to update
     * @param deltaTime - Time since last update
     * @param currentTime - Current timestamp
     */
    updateTrailContainer(trail: TrailContainer, _deltaTime: number, currentTime: number): void {
        if (!trail.userData.active) return;

        // Emit new particles if projectile is still active
        const projectile = trail.userData.parentProjectile;
        if (projectile && projectile.userData.active) {
            const timeSinceLastEmission = currentTime - (trail.userData.lastEmissionTime || 0);
            const emissionInterval = 1000 / trail.userData.emissionRate;

            if (timeSinceLastEmission >= emissionInterval && trail.userData.particles.length < trail.userData.maxParticles) {
                this.emitTrailParticle(trail);
                trail.userData.lastEmissionTime = currentTime;
            }
        }
    }

    /**
     * Update a single trail particle
     * @param particle - The particle to update
     * @param deltaTime - Time since last update
     * @param currentTime - Current timestamp
     */
    updateTrailParticle(particle: TrailParticle, deltaTime: number, currentTime: number): void {
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
     * @param trail - The trail container
     */
    emitTrailParticle(trail: TrailContainer): void {
        const sizeIndex = Math.floor(Math.random() * this.sharedAssets.trailParticleGeometries.length);
        const particle = this.getTrailParticle(sizeIndex);

        // Position at trail origin with some randomness
        const randomOffset = new Vector3((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20);
        particle.position.copy(randomOffset);

        // Set particle properties based on trail configuration
        particle.material.color.setHex(trail.userData.trailColor || 0xffffff);
        particle.userData.initialOpacity = trail.userData.trailOpacity || 0.9;
        particle.userData.lifetime = trail.userData.particleLifetime || 1000;

        // Add slight random velocity for organic movement
        particle.userData.velocity.set((Math.random() - 0.5) * 50, (Math.random() - 0.5) * 50, (Math.random() - 0.5) * 50);

        // Add to trail container
        trail.add(particle);
        trail.userData.particles.push(particle);
    }

    /**
     * Release a trail container back to the pool
     * @param trail - The trail container to release
     */
    releaseTrail(trail: TrailContainer): void {
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
     * @param particle - The trail particle to release
     */
    releaseTrailParticle(particle: TrailParticle): void {
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
     * @returns Pool statistics
     */
    getStats(): {
        trailContainers: { available: number; active: number };
        trailParticles: { available: number; active: number };
    } {
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
     * @param disposeFn - Custom dispose function
     */
    dispose(disposeFn?: (obj: Object3D) => void): void {
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
