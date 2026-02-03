/**
 * Geometry Manager Module
 * 
 * Handles pre-creation and management of geometries for combat effects
 */

import * as THREE from 'three';

export class GeometryManager {
    constructor() {
        this.precreateGeometries();
    }

    /**
     * Pre-create geometries that will be reused across projectiles and effects
     * This prevents geometry creation during combat which can cause stutters
     */
    precreateGeometries(): void {
        console.log("Pre-creating geometries for combat effects");
        
        // Create geometries and store them on window.game for global access
        const game = (window as any).game || ((window as any).game = {});
        
        // Projectile geometries - Changed to a thin cylinder for laser bolt
        game.projectileGeometry = new THREE.CylinderGeometry(0.15, 0.15, 10, 8); // Thin, 10 units long cylinder
        game.projectileGlowGeometry = new THREE.SphereGeometry(0.8, 12, 12); // Glow radius around the bolt
        
        // Pre-create standard muzzle flash geometry
        game.muzzleFlashGeometry = new THREE.CylinderGeometry(0.5, 2, 15, 12, 1, true);
        game.muzzleFlashGeometry.rotateX(Math.PI / 2);
        game.muzzleFlashGeometry.translate(0, 0, 15 / 2);
        
        // Pre-create trail particle geometries with different sizes
        game.trailParticleGeometries = [];
        const numPoints = 20; // Same as in addProjectileTrail
        for (let i = 0; i < numPoints; i++) {
            const ratio = i / numPoints;
            const size = 0.5 * (1 - ratio); // These might be unused or repurposed for simple impact sparks
            game.trailParticleGeometries[i] = new THREE.SphereGeometry(size, 8, 8);
        }
        
        // Pre-create line geometry for tracers
        game.tracerGeometry = new THREE.BufferGeometry();
        const points = [0, 0, 0, 0, 0, 1]; // Will be updated at runtime
        game.tracerGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
        
        console.log("Combat geometries pre-created successfully");
    }

    /**
     * Store references to template materials on window.game
     * @param {any} materialManager - The material manager instance
     */
    storeMaterialReferences(materialManager: any): void {
        // Store references to template materials (which should now be pre-warmed)
        // These materials are created and warmed in MaterialManager
        const game = (window as any).game || ((window as any).game = {});
        game.projectileMaterial = materialManager.projectileMaterial;
        game.projectileGlowMaterial = materialManager.projectileGlowMaterial;
        game.trailParticleMaterial = materialManager.trailParticleMaterial; // Will be red
        game.muzzleFlashMaterial = materialManager.muzzleFlashMaterial;
        game.tracerLineMaterial = materialManager.tracerLineMaterial;
        game.explosionParticleMaterial = materialManager.explosionParticleMaterial; // Added for consistency
    }

    /**
     * Clean up geometry resources
     */
    dispose(): void {
        const game = (window as any).game;
        if (game) {
            if (game.projectileGeometry) game.projectileGeometry.dispose();
            if (game.projectileGlowGeometry) game.projectileGlowGeometry.dispose();
            if (game.muzzleFlashGeometry) game.muzzleFlashGeometry.dispose();
            if (game.trailParticleGeometries) {
                game.trailParticleGeometries.forEach((geom: THREE.BufferGeometry) => geom.dispose());
            }
            if (game.tracerGeometry) game.tracerGeometry.dispose();
        }
        console.log("Geometry resources disposed");
    }
}
