/**
 * Material Manager Module
 * 
 * Handles initialization and management of combat effect materials
 */

import * as THREE from 'three';

export class MaterialManager {
    constructor(scene) {
        this.scene = scene;
        this.initializeTemplateMaterials();
    }

    /**
     * Initialize template materials to prevent shader compilation stutter during first fire
     */
    initializeTemplateMaterials() {
        console.log("Initializing template materials for combat effects");
        
        // Template for projectile material (MeshStandardMaterial) - Red Laser Bolt
        this.projectileMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 10, // Vibrant laser
            metalness: 0.5,
            roughness: 0.5
        });
        
        // Template for projectile glow material (MeshBasicMaterial) - Red Glow
        this.projectileGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.5, // Softer glow
            blending: THREE.AdditiveBlending
        });
        
        // Template for trail particle material (MeshBasicMaterial) - Red (Though complex trail is removed)
        this.trailParticleMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });
        
        // Template for muzzle flash material (MeshBasicMaterial) - Red Muzzle Flash
        this.muzzleFlashMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.8, // Brighter flash
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false,
            wireframe: false
        });
        
        // Template for tracer line material (LineBasicMaterial) - Red Aiming Line
        this.tracerLineMaterial = new THREE.LineBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.8, // More visible aiming line
            blending: THREE.AdditiveBlending
        });
        
        // Template material for light-halo meshes (basic unlit glow)
        this.pointLightMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        // Template for explosion particles - Red/Orange Impact
        this.explosionParticleMaterial = new THREE.PointsMaterial({
            color: 0xff3300, // Red-orange for impact
            size: 15, // Slightly larger impact particles
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending
        });
        
        // Force material compilation by creating a small invisible mesh
        this.precompileShaders();
    }

    /**
     * Pre-compile shaders to prevent stutter during combat
     */
    precompileShaders() {
        // Force material compilation by creating a small invisible mesh
        // This ensures shaders are compiled immediately rather than at first fire
        const dummyGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        const sphereGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const cylinderGeometry = new THREE.CylinderGeometry(0.1, 0.2, 1, 8, 1);
        const pointsPositions = new Float32Array(30); // 10 points x 3 coordinates
        for (let i = 0; i < 30; i++) {
            pointsPositions[i] = Math.random() - 0.5;
        }
        const pointsGeometry = new THREE.BufferGeometry();
        pointsGeometry.setAttribute('position', new THREE.BufferAttribute(pointsPositions, 3));
        
        // Create dummy objects using all materials that will be used in projectiles
        // IMPORTANT: Use the original material instances, not clones, for pre-compilation.
        const dummyProjectile = new THREE.Mesh(sphereGeometry, this.projectileMaterial);
        const dummyGlow = new THREE.Mesh(sphereGeometry, this.projectileGlowMaterial);
        const dummyTrail = new THREE.Mesh(sphereGeometry, this.trailParticleMaterial);
        const dummyFlash = new THREE.Mesh(cylinderGeometry, this.muzzleFlashMaterial);
        const dummyTracer = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0, 1)
            ]),
            this.tracerLineMaterial
        );
        const dummyExplosion = new THREE.Points(pointsGeometry, this.explosionParticleMaterial);
        
        // Create a dummy trail system with multiple particles
        const dummyTrailContainer = new THREE.Object3D();
        for (let i = 0; i < 5; i++) {
            const trailParticle = new THREE.Mesh(sphereGeometry, this.trailParticleMaterial.clone());
            trailParticle.position.z = -i * 0.2;
            dummyTrailContainer.add(trailParticle);
        }
        
        // Create a temporary scene for shader compilation
        const tempScene = new THREE.Scene();
        
        // Add all dummy objects to the temporary scene
        tempScene.add(dummyProjectile);
        tempScene.add(dummyGlow);
        tempScene.add(dummyTrail);
        tempScene.add(dummyFlash);
        tempScene.add(dummyTracer);
        tempScene.add(dummyTrailContainer);
        tempScene.add(dummyExplosion);
        
        // Add to main scene temporarily for visibility checking via renderer facade
        const addToScene = this._getAddToSceneFunction();
        const removeFromScene = this._getRemoveFromSceneFunction();
        
        addToScene(dummyProjectile);
        addToScene(dummyGlow);
        addToScene(dummyTrail);
        addToScene(dummyFlash);
        addToScene(dummyTracer);
        addToScene(dummyTrailContainer);
        addToScene(dummyExplosion);
        
        // Force shader compilation using renderer.compile if available
        if (window.renderer) {
            console.log("Forcing shader compilation with renderer.compile()");
            window.renderer.compile(tempScene, this.scene.camera || { isCamera: true, matrixWorldInverse: new THREE.Matrix4() });
            window.renderer.compile(this.scene, this.scene.camera || { isCamera: true, matrixWorldInverse: new THREE.Matrix4() });
        } else if (window.game && window.game.renderer && window.game.renderer.renderer) {
            console.log("Forcing shader compilation with game.renderer.renderer.compile()");
            window.game.renderer.renderer.compile(tempScene, this.scene.camera || window.game.camera || { isCamera: true, matrixWorldInverse: new THREE.Matrix4() });
            window.game.renderer.renderer.compile(this.scene, this.scene.camera || window.game.camera || { isCamera: true, matrixWorldInverse: new THREE.Matrix4() });
        } else {
            console.warn("No renderer available for shader pre-compilation");
        }
        
        // Keep dummy objects in scene longer to ensure compilation completes
        setTimeout(() => {
            // Remove from scene after shader compilation is complete via renderer facade
            removeFromScene(dummyProjectile);
            removeFromScene(dummyGlow);
            removeFromScene(dummyTrail);
            removeFromScene(dummyFlash);
            removeFromScene(dummyTracer);
            removeFromScene(dummyTrailContainer);
            removeFromScene(dummyExplosion);
            
            // Clean up temporary objects
            dummyGeometry.dispose();
            sphereGeometry.dispose();
            cylinderGeometry.dispose();
            pointsGeometry.dispose();
            
            // Clean up trail particles
            dummyTrailContainer.children.forEach(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose(); // Material here is a clone, original is on this.trailParticleMaterial
            });
            
            console.log("Template materials initialized and dummy objects removed");
        }, 500); // Increased timeout to 500ms to ensure shader compilation completes
    }

    /**
     * Get material by type
     */
    getMaterial(type) {
        switch (type) {
            case 'projectile': return this.projectileMaterial;
            case 'projectileGlow': return this.projectileGlowMaterial;
            case 'trailParticle': return this.trailParticleMaterial;
            case 'muzzleFlash': return this.muzzleFlashMaterial;
            case 'tracerLine': return this.tracerLineMaterial;
            case 'pointLight': return this.pointLightMaterial;
            case 'explosionParticle': return this.explosionParticleMaterial;
            default: return null;
        }
    }

    /**
     * Helper to get add to scene function
     */
    _getAddToSceneFunction() {
        const renderer = window.game && window.game.renderer ? window.game.renderer : null;
        if (renderer && typeof renderer._withGuard === 'function') {
            return (object) => renderer._withGuard(() => renderer.add(object));
        } else if (this.scene && typeof this.scene.add === 'function') {
            return (object) => this.scene.add(object);
        }
        return () => {};
    }

    /**
     * Helper to get remove from scene function
     */
    _getRemoveFromSceneFunction() {
        const renderer = window.game && window.game.renderer ? window.game.renderer : null;
        if (renderer && typeof renderer._withGuard === 'function') {
            return (object) => renderer._withGuard(() => this.scene.remove(object));
        } else if (this.scene && typeof this.scene.remove === 'function') {
            return (object) => this.scene.remove(object);
        }
        return () => {};
    }

    /**
     * Clean up material resources
     */
    dispose() {
        // Dispose materials
        if (this.projectileMaterial) this.projectileMaterial.dispose();
        if (this.projectileGlowMaterial) this.projectileGlowMaterial.dispose();
        if (this.trailParticleMaterial) this.trailParticleMaterial.dispose();
        if (this.muzzleFlashMaterial) this.muzzleFlashMaterial.dispose();
        if (this.tracerLineMaterial) this.tracerLineMaterial.dispose();
        if (this.pointLightMaterial) this.pointLightMaterial.dispose();
        if (this.explosionParticleMaterial) this.explosionParticleMaterial.dispose();

        console.log("Material resources disposed");
    }
}