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
    precreateGeometries() {
        console.log("Pre-creating geometries for combat effects");
        
        // Create geometries and store them on window.game for global access
        if (!window.game) window.game = {};
        
        // Projectile geometries - Changed to a thin cylinder for laser bolt
        window.game.projectileGeometry = new THREE.CylinderGeometry(0.15, 0.15, 10, 8); // Thin, 10 units long cylinder
        window.game.projectileGlowGeometry = new THREE.SphereGeometry(0.8, 12, 12); // Glow radius around the bolt
        
        // Pre-create standard muzzle flash geometry
        window.game.muzzleFlashGeometry = new THREE.CylinderGeometry(0.5, 2, 15, 12, 1, true);
        window.game.muzzleFlashGeometry.rotateX(Math.PI / 2);
        window.game.muzzleFlashGeometry.translate(0, 0, 15 / 2);
        
        // Pre-create trail particle geometries with different sizes
        window.game.trailParticleGeometries = [];
        const numPoints = 20; // Same as in addProjectileTrail
        for (let i = 0; i < numPoints; i++) {
            const ratio = i / numPoints;
            const size = 0.5 * (1 - ratio); // These might be unused or repurposed for simple impact sparks
            window.game.trailParticleGeometries[i] = new THREE.SphereGeometry(size, 8, 8);
        }
        
        // Pre-create line geometry for tracers
        window.game.tracerGeometry = new THREE.BufferGeometry();
        const points = [0, 0, 0, 0, 0, 1]; // Will be updated at runtime
        window.game.tracerGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
        
        console.log("Combat geometries pre-created successfully");
    }

    /**
     * Store references to template materials on window.game
     * @param {Object} materialManager - The material manager instance
     */
    storeMaterialReferences(materialManager) {
        // Store references to template materials (which should now be pre-warmed)
        // These materials are created and warmed in MaterialManager
        window.game.projectileMaterial = materialManager.projectileMaterial;
        window.game.projectileGlowMaterial = materialManager.projectileGlowMaterial;
        window.game.trailParticleMaterial = materialManager.trailParticleMaterial; // Will be red
        window.game.muzzleFlashMaterial = materialManager.muzzleFlashMaterial;
        window.game.tracerLineMaterial = materialManager.tracerLineMaterial;
        window.game.explosionParticleMaterial = materialManager.explosionParticleMaterial; // Added for consistency
    }

    /**
     * Clean up geometry resources
     */
    dispose() {
        if (window.game) {
            if (window.game.projectileGeometry) window.game.projectileGeometry.dispose();
            if (window.game.projectileGlowGeometry) window.game.projectileGlowGeometry.dispose();
            if (window.game.muzzleFlashGeometry) window.game.muzzleFlashGeometry.dispose();
            if (window.game.trailParticleGeometries) {
                window.game.trailParticleGeometries.forEach(geom => geom.dispose());
            }
            if (window.game.tracerGeometry) window.game.tracerGeometry.dispose();
        }
        console.log("Geometry resources disposed");
    }
}