/**
 * Laser Projectile Pool
 *
 * Manages pooling of laser projectiles with their unique characteristics:
 * - High-energy beam appearance
 * - Bright glow effects
 * - Fast travel speed
 * - Energy discharge visual effects
 */

import { ObjectPool } from '../../ObjectPool.ts';
import * as THREE from 'three';

type SharedAssets = {
    projectileGeometry: THREE.BufferGeometry;
    projectileGlowGeometry: THREE.BufferGeometry;
    projectileMaterial: THREE.MeshStandardMaterial;
    projectileGlowMaterial: THREE.MeshBasicMaterial;
};

type LaserUserData = {
    isProjectile: true;
    projectileType: 'laser';
    active: boolean;
    pooled: boolean;
    glowMesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
    speed: number;
    damage: number;
    penetration: boolean;
    energyDrain: number;
    creationTime?: number;
    entityId?: number | string | null;
    trail?: THREE.Object3D | null;
    trailParticles?: unknown;
    target?: unknown;
    firedBy?: unknown;
};

type LaserProjectile = THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial> & {
    userData: LaserUserData;
};

type AddToScene = (object: THREE.Object3D) => void;

type RemoveFromParent = (object: THREE.Object3D) => void;

export class LaserProjectilePool {
    sharedAssets: SharedAssets;
    private _addToScene: AddToScene;
    private _removeFromParent: RemoveFromParent;

    pool!: ObjectPool<LaserProjectile>;

    /**
     * Create a new LaserProjectilePool
     * @param sharedAssets - Shared geometries and materials
     * @param addToScene - Function to add objects to scene
     * @param removeFromParent - Function to remove objects from parent
     */
    constructor(sharedAssets: SharedAssets, addToScene: AddToScene, removeFromParent: RemoveFromParent) {
        this.sharedAssets = sharedAssets;
        this._addToScene = addToScene;
        this._removeFromParent = removeFromParent;

        this.initializePool();
    }

    /**
     * Initialize the laser projectile pool
     */
    initializePool(): void {
        this.pool = new ObjectPool<LaserProjectile>(
            // Create function
            () => this.createLaserProjectile(),
            // Reset function
            (projectile) => this.resetLaserProjectile(projectile),
            30, // Initial size - lasers are common
            10 // Expand size
        );
    }

    /**
     * Create a new laser projectile
     * @returns A laser projectile mesh
     */
    createLaserProjectile(): LaserProjectile {
        // Create main projectile mesh
        const projectile = new THREE.Mesh(this.sharedAssets.projectileGeometry, this.sharedAssets.projectileMaterial.clone()) as LaserProjectile;

        // Create enhanced glow for laser
        const glowMesh = new THREE.Mesh(this.sharedAssets.projectileGlowGeometry, this.sharedAssets.projectileGlowMaterial.clone()) as THREE.Mesh<
            THREE.BufferGeometry,
            THREE.MeshBasicMaterial
        >;

        // Laser-specific material modifications
        projectile.material.color.setHex(0x00ffff); // Cyan laser color
        projectile.material.emissive.setHex(0x004444); // Subtle emissive

        // Enhanced glow for laser
        glowMesh.material.color.setHex(0x00ffff);
        glowMesh.material.opacity = 0.8;
        glowMesh.scale.set(1.5, 1.5, 1.5); // Larger glow for lasers

        projectile.add(glowMesh);

        // Set up userData with laser-specific properties
        projectile.userData = {
            isProjectile: true,
            projectileType: 'laser',
            active: false,
            pooled: true,
            glowMesh,
            speed: 2000, // High speed for lasers
            damage: 25,
            penetration: true, // Lasers can penetrate
            energyDrain: 15
        };

        return projectile;
    }

    /**
     * Reset a laser projectile to initial state
     * @param projectile - The projectile to reset
     */
    resetLaserProjectile(projectile: LaserProjectile): void {
        // Reset position, velocity and visibility
        projectile.position.set(0, 0, 0);
        projectile.rotation.set(0, 0, 0);
        projectile.scale.set(1, 1, 1);
        projectile.visible = false;

        // Reset material properties to laser defaults
        projectile.material.color.setHex(0x00ffff);
        projectile.material.emissive.setHex(0x004444);
        projectile.material.opacity = 1.0;

        // Reset glow properties
        if (projectile.userData.glowMesh) {
            projectile.userData.glowMesh.material.opacity = 0.8;
            projectile.userData.glowMesh.scale.set(1.5, 1.5, 1.5);
        }

        // Clean up any lingering references
        projectile.userData.active = false;
        projectile.userData.creationTime = 0;
        projectile.userData.entityId = null;
        projectile.userData.trail = null;
        projectile.userData.trailParticles = null;
        projectile.userData.target = null;
        projectile.userData.firedBy = null;
    }

    /**
     * Get a laser projectile from the pool
     * @returns A laser projectile mesh
     */
    get(): LaserProjectile {
        const projectile = this.pool.get();
        projectile.visible = true;
        projectile.userData.active = true;
        projectile.userData.creationTime = performance.now();

        // Add to scene if not already there
        if (!projectile.parent) {
            this._addToScene(projectile);
        }

        return projectile;
    }

    /**
     * Release a laser projectile back to the pool
     * @param projectile - The projectile to release
     */
    release(projectile: LaserProjectile): void {
        // Skip if not a valid laser projectile
        if (!projectile || !projectile.userData || !projectile.userData.isProjectile || projectile.userData.projectileType !== 'laser') {
            return;
        }

        // Remove from scene
        if (projectile.parent) {
            this._removeFromParent(projectile);
        }

        // Return to pool
        this.pool.release(projectile);
    }

    /**
     * Get count of available projectiles in pool
     * @returns Available count
     */
    availableCount(): number {
        return this.pool.availableCount();
    }

    /**
     * Get count of active projectiles
     * @returns Active count
     */
    activeCount(): number {
        return this.pool.activeCount();
    }

    /**
     * Get all active laser projectiles
     * @returns Set of active projectiles
     */
    getActive(): Set<LaserProjectile> {
        return this.pool.active;
    }

    /**
     * Dispose the laser projectile pool
     * @param disposeFn - Custom dispose function
     */
    dispose(disposeFn?: (obj: THREE.Object3D) => void): void {
        this.pool.dispose((projectile) => {
            // Remove from scene
            if (projectile.parent) {
                this._removeFromParent(projectile);
            }

            // Clean up materials (cloned per projectile)
            if (projectile.material) {
                projectile.material.dispose();
            }

            if (projectile.userData.glowMesh && projectile.userData.glowMesh.material) {
                projectile.userData.glowMesh.material.dispose();
            }

            // Call custom dispose if provided
            if (disposeFn) {
                disposeFn(projectile);
            }
        });
    }
}
