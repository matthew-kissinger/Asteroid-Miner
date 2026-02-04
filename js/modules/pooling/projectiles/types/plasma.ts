/**
 * Plasma Projectile Pool
 *
 * Manages pooling of plasma projectiles with their unique characteristics:
 * - Ionized energy bolts
 * - Pulsing energy effects
 * - Medium speed and damage
 * - Electromagnetic interference
 */

import { ObjectPool } from '../../ObjectPool.ts';
import * as THREE from 'three';

type SharedAssets = {
    projectileGeometry: THREE.BufferGeometry;
    projectileGlowGeometry: THREE.BufferGeometry;
    projectileMaterial: THREE.MeshStandardMaterial;
    projectileGlowMaterial: THREE.MeshBasicMaterial;
};

type PlasmaUserData = {
    isProjectile: true;
    projectileType: 'plasma';
    active: boolean;
    pooled: boolean;
    glowMesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
    speed: number;
    damage: number;
    empEffect: boolean;
    energyDrain: number;
    pulsePhase: number;
    chargeLevel: number;
    creationTime?: number;
    entityId?: number | string | null;
    trail?: THREE.Object3D | null;
    trailParticles?: unknown;
    target?: unknown;
    firedBy?: unknown;
};

type PlasmaProjectile = THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial> & {
    userData: PlasmaUserData;
};

type AddToScene = (object: THREE.Object3D) => void;

type RemoveFromParent = (object: THREE.Object3D) => void;

export class PlasmaProjectilePool {
    sharedAssets: SharedAssets;
    private _addToScene: AddToScene;
    private _removeFromParent: RemoveFromParent;

    pool!: ObjectPool<PlasmaProjectile>;

    /**
     * Create a new PlasmaProjectilePool
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
     * Initialize the plasma projectile pool
     */
    initializePool(): void {
        this.pool = new ObjectPool<PlasmaProjectile>(
            // Create function
            () => this.createPlasmaProjectile(),
            // Reset function
            (projectile) => this.resetPlasmaProjectile(projectile),
            25, // Initial size - medium usage
            8 // Expand size
        );
    }

    /**
     * Create a new plasma projectile
     * @returns A plasma projectile mesh
     */
    createPlasmaProjectile(): PlasmaProjectile {
        // Create main projectile mesh
        const projectile = new THREE.Mesh(this.sharedAssets.projectileGeometry, this.sharedAssets.projectileMaterial.clone()) as PlasmaProjectile;

        // Create plasma glow effect
        const glowMesh = new THREE.Mesh(this.sharedAssets.projectileGlowGeometry, this.sharedAssets.projectileGlowMaterial.clone()) as THREE.Mesh<
            THREE.BufferGeometry,
            THREE.MeshBasicMaterial
        >;

        // Plasma-specific material modifications
        projectile.material.color.setHex(0x8800ff); // Purple plasma color
        projectile.material.emissive.setHex(0x440088); // Purple emissive

        // Pulsing glow for plasma
        glowMesh.material.color.setHex(0xaa00ff);
        glowMesh.material.opacity = 0.9;
        glowMesh.scale.set(1.3, 1.3, 1.3); // Medium glow size

        // Slightly enlarge plasma bolt
        projectile.scale.set(1.1, 1.1, 1.2);

        projectile.add(glowMesh);

        // Set up userData with plasma-specific properties
        projectile.userData = {
            isProjectile: true,
            projectileType: 'plasma',
            active: false,
            pooled: true,
            glowMesh,
            speed: 1200, // Medium speed
            damage: 40,
            empEffect: true, // Electromagnetic pulse
            energyDrain: 20,
            pulsePhase: 0, // For pulsing animation
            chargeLevel: 1.0
        };

        return projectile;
    }

    /**
     * Reset a plasma projectile to initial state
     * @param projectile - The projectile to reset
     */
    resetPlasmaProjectile(projectile: PlasmaProjectile): void {
        // Reset position, velocity and visibility
        projectile.position.set(0, 0, 0);
        projectile.rotation.set(0, 0, 0);
        projectile.scale.set(1.1, 1.1, 1.2); // Restore plasma scale
        projectile.visible = false;

        // Reset material properties to plasma defaults
        projectile.material.color.setHex(0x8800ff);
        projectile.material.emissive.setHex(0x440088);
        projectile.material.opacity = 1.0;

        // Reset glow properties
        if (projectile.userData.glowMesh) {
            projectile.userData.glowMesh.material.opacity = 0.9;
            projectile.userData.glowMesh.scale.set(1.3, 1.3, 1.3);
        }

        // Clean up any lingering references
        projectile.userData.active = false;
        projectile.userData.creationTime = 0;
        projectile.userData.entityId = null;
        projectile.userData.trail = null;
        projectile.userData.trailParticles = null;
        projectile.userData.target = null;
        projectile.userData.firedBy = null;
        projectile.userData.pulsePhase = 0;
        projectile.userData.chargeLevel = 1.0;
    }

    /**
     * Get a plasma projectile from the pool
     * @returns A plasma projectile mesh
     */
    get(): PlasmaProjectile {
        const projectile = this.pool.get();
        projectile.visible = true;
        projectile.userData.active = true;
        projectile.userData.creationTime = performance.now();
        projectile.userData.pulsePhase = 0;
        projectile.userData.chargeLevel = 1.0;

        // Add to scene if not already there
        if (!projectile.parent) {
            this._addToScene(projectile);
        }

        return projectile;
    }

    /**
     * Release a plasma projectile back to the pool
     * @param projectile - The projectile to release
     */
    release(projectile: PlasmaProjectile): void {
        // Skip if not a valid plasma projectile
        if (!projectile || !projectile.userData || !projectile.userData.isProjectile || projectile.userData.projectileType !== 'plasma') {
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
     * Update plasma-specific behavior (pulsing, charge decay)
     * @param projectile - The plasma to update
     * @param deltaTime - Time since last update
     */
    updatePlasma(projectile: PlasmaProjectile, _deltaTime: number): void {
        if (!projectile.userData.active) return;

        const time = performance.now() * 0.001; // Convert to seconds

        // Update pulse phase for pulsing effect
        projectile.userData.pulsePhase = time * 4; // 4 Hz pulsing

        // Plasma charge decay over time
        const age = time * 1000 - (projectile.userData.creationTime || 0);
        const maxAge = 3000; // 3 seconds max lifetime
        projectile.userData.chargeLevel = Math.max(0, 1 - age / maxAge);

        // Apply pulsing glow effect
        if (projectile.userData.glowMesh) {
            const pulse = 0.5 + 0.5 * Math.sin(projectile.userData.pulsePhase);
            const chargeModifier = projectile.userData.chargeLevel;

            projectile.userData.glowMesh.material.opacity = 0.9 * pulse * chargeModifier;

            // Scale pulsing
            const scale = 1.3 + 0.2 * pulse * chargeModifier;
            projectile.userData.glowMesh.scale.set(scale, scale, scale);
        }

        // Fade core as charge depletes
        if (projectile.material) {
            const fadeIntensity = 0.5 + 0.5 * projectile.userData.chargeLevel;
            projectile.material.opacity = fadeIntensity;
        }
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
     * Get all active plasma projectiles
     * @returns Set of active projectiles
     */
    getActive(): Set<PlasmaProjectile> {
        return this.pool.active;
    }

    /**
     * Dispose the plasma projectile pool
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
