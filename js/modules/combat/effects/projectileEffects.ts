/**
 * Projectile Effects Module
 * 
 * Handles muzzle flashes, trails, and aiming tracers for projectiles
 */

import * as THREE from 'three';

export class ProjectileEffects {
    constructor() {
        // No state needed - all effects are pooled
    }

    /**
     * Create a laser burst effect that travels forward with the projectile
     * @param {THREE.Vector3} position Position for the effect
     * @param {THREE.Vector3} direction Direction the effect should travel
     * @param {Object} poolManager Pool manager for getting muzzle flash objects
     */
    createMuzzleFlash(position: THREE.Vector3, direction: THREE.Vector3, poolManager: any) {
        if (!poolManager) {
            console.warn("No pool manager available for muzzle flash");
            return null;
        }

        // Get a muzzle flash from the pool
        const muzzleFlash = poolManager.getMuzzleFlash();
        
        // Position and orient the flash
        muzzleFlash.position.copy(position);
        // Orient the flash to point away from the ship, along the direction of fire
        const lookAtPosition = position.clone().add(direction.clone().normalize().multiplyScalar(10)); // Look 10 units along direction
        muzzleFlash.lookAt(lookAtPosition);
        
        // Store reference to initial position and direction for animation
        muzzleFlash.userData.initialPosition = position.clone();
        muzzleFlash.userData.direction = direction.clone();
        
        // Set up the flash light
        const flashLight = muzzleFlash.userData.flashLight;
        if (flashLight) {
            flashLight.position.copy(position);
            flashLight.intensity = 200;
        }
        
        // The pool manager will automatically handle animation and cleanup via its update method
        // which checks the progress and releases back to the pool when complete
        
        return muzzleFlash;
    }

    /**
     * Add a dynamic particle trail to a projectile (Simplified for Lasers)
     * @param {THREE.Mesh} projectile The projectile mesh
     * @param {THREE.Vector3} direction Direction of travel
     * @param {Object} poolManager Pool manager for getting trail components
     */
    addProjectileTrail(projectile: THREE.Mesh, direction: THREE.Vector3, poolManager: any): void {
        // Parameters for a subtle, short trail
        const numPoints = 4; // Number of particles in the trail
        const trailLength = 4.0; // Total length of the trail (shorter than laser bolt length for subtlety)
        const particleLifetime = 150; // milliseconds

        if (!poolManager) {
            console.warn("PoolManager not available for projectile trail.");
            return;
        }

        const trailContainer = poolManager.getTrailContainer();
        if (!trailContainer) {
            console.warn("Failed to get trail container from pool.");
            return;
        }
        projectile.add(trailContainer);

        const trailParticles: THREE.Mesh[] = [];
        trailContainer.userData.particles = trailParticles; // Store for release by PoolManager if needed
        trailContainer.userData.isTrailActive = true; // Flag for animation loop

        for (let i = 0; i < numPoints; i++) {
            const ratio = i / (numPoints -1); // Distribute particles along the trail length
            // @ts-ignore
            const particle = poolManager.getTrailParticle(i % (window as any).game.trailParticleGeometries.length); // Cycle through available geometries
            
            if (!particle) {
                console.warn(`Failed to get trail particle ${i} from pool.`);
                continue;
            }

            const offset = direction.clone().multiplyScalar(-ratio * trailLength - 2.0); // Start trail slightly behind the projectile tip
            particle.position.copy(offset);
            
            particle.userData.creationTime = performance.now();
            particle.userData.initialOpacity = particle.material.opacity; // Should be from pre-warmed red material
            particle.userData.initialScale = particle.scale.x; // Assuming uniform scale
            
            trailContainer.add(particle);
            trailParticles.push(particle);
        }
        
        projectile.userData.trail = trailContainer; // For cleanup by PoolManager

        const animateTrail = () => {
            if (!projectile.parent || !trailContainer.userData.isTrailActive) {
                // Projectile removed or trail explicitly deactivated, stop animation and ensure cleanup
                trailContainer.userData.isTrailActive = false;
                // Particles will be cleaned up by releaseProjectile -> releaseTrail if not already done
                return;
            }

            for (let i = trailParticles.length - 1; i >= 0; i--) {
                const particle = trailParticles[i];
                const elapsed = performance.now() - particle.userData.creationTime;
                const progress = Math.min(elapsed / particleLifetime, 1.0);

                if (progress >= 1.0) {
                    poolManager.releaseTrailParticle(particle);
                    trailParticles.splice(i, 1);
                    if (particle.parent) particle.parent.remove(particle); // Ensure removal from container
                } else {
                    (particle.material as THREE.Material).opacity = particle.userData.initialOpacity * (1 - progress);
                    const currentScale = particle.userData.initialScale * (1 - progress);
                    particle.scale.set(currentScale, currentScale, currentScale);
                }
            }

            if (trailParticles.length === 0) {
                trailContainer.userData.isTrailActive = false; // All particles expired
                // The container itself will be released when the projectile is released.
                return;
            }
            
            requestAnimationFrame(animateTrail);
        };
        
        animateTrail();
    }

    /**
     * New method to visualize projectile trajectory
     * @param {THREE.Vector3} startPosition Starting position of the aiming line
     * @param {THREE.Vector3} direction Direction the line should point
     * @param {number} distance Distance of the aiming line
     * @param {Object} poolManager Pool manager for getting tracer objects
     */
    createAimingTracer(startPosition: THREE.Vector3, direction: THREE.Vector3, distance: number = 3000, poolManager: any) {
        if (!poolManager) {
            console.warn("No pool manager available for aiming tracer");
            return null;
        }

        // Get a tracer from the pool
        const tracer = poolManager.getTracer();
        
        // Calculate end position
        const endPosition = startPosition.clone().add(direction.clone().multiplyScalar(distance));
        
        // Update the positions in the geometry
        const positions = (tracer.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
        positions[0] = startPosition.x;
        positions[1] = startPosition.y;
        positions[2] = startPosition.z;
        positions[3] = endPosition.x;
        positions[4] = endPosition.y;
        positions[5] = endPosition.z;
        
        // Mark the position attribute as needing update
        tracer.geometry.attributes.position.needsUpdate = true;
        
        // The pool manager will automatically handle animation and cleanup
        
        return tracer;
    }
}
