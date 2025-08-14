// beamMechanics.js - Handles laser beam mechanics and visual effects

import * as THREE from 'three';

export class BeamMechanics {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.laserVisuals = new Map(); // Maps entityId to laser visual elements
    }

    /**
     * Create laser visuals for an entity
     */
    ensureLaserVisuals(entity) {
        if (!this.scene) {
            console.warn('Cannot create laser visuals: scene reference not set');
            return;
        }
        
        const miningLaser = entity.getComponent('MiningLaserComponent');
        if (!miningLaser) return;
        
        // Skip if already created
        if (miningLaser.visualsCreated || this.laserVisuals.has(entity.id)) {
            return;
        }
        
        // Create laser beam geometry
        const laserGeometry = new THREE.CylinderGeometry(miningLaser.laserWidth / 2, miningLaser.laserWidth / 2, 1, 8);
        laserGeometry.rotateX(Math.PI / 2);
        laserGeometry.translate(0, 0, 0.5);
        
        // Create laser material with glow effect
        const laserMaterial = new THREE.MeshBasicMaterial({
            color: miningLaser.laserColor,
            transparent: true,
            opacity: 0.7,
            depthWrite: false
        });
        
        // Create laser mesh
        const laserBeam = new THREE.Mesh(laserGeometry, laserMaterial);
        laserBeam.visible = false;
        this.scene.add(laserBeam);
        
        // Create progress indicator (ring)
        const ringGeometry = new THREE.RingGeometry(2.4, 3.2, 32);
        
        // Material for the progress background
        const ringBackgroundMaterial = new THREE.MeshBasicMaterial({
            color: 0x333333,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        
        // Material for the progress foreground
        const ringForegroundMaterial = new THREE.MeshBasicMaterial({
            color: miningLaser.laserColor,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        
        // Create the background ring
        const backgroundRing = new THREE.Mesh(ringGeometry, ringBackgroundMaterial);
        
        // Create the foreground ring (progress indicator)
        const foregroundRingGeometry = new THREE.RingGeometry(2.4, 3.2, 32, 1, 0, 0);
        const foregroundRing = new THREE.Mesh(foregroundRingGeometry, ringForegroundMaterial);
        
        // Create a container for the progress indicator
        const progressIndicator = new THREE.Group();
        progressIndicator.add(backgroundRing);
        progressIndicator.add(foregroundRing);
        
        // Store reference to the foreground ring for updating
        progressIndicator.userData = {
            foregroundRing: foregroundRing,
            foregroundGeometry: foregroundRingGeometry
        };
        
        // Hide initially
        progressIndicator.visible = false;
        this.scene.add(progressIndicator);
        
        // Create impact effect
        const impactGeometry = new THREE.BufferGeometry();
        const particleCount = 40;
        const positions = new Float32Array(particleCount * 3);
        
        // Initial positions at center
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = 0;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = 0;
        }
        
        impactGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const impactMaterial = new THREE.PointsMaterial({
            color: miningLaser.laserColor,
            size: 1.5,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        const impactEffect = new THREE.Points(impactGeometry, impactMaterial);
        impactEffect.visible = false;
        this.scene.add(impactEffect);
        
        // Store visual elements
        this.laserVisuals.set(entity.id, {
            laserBeam,
            progressIndicator,
            impactEffect
        });
        
        // Mark visuals as created
        miningLaser.visualsCreated = true;
    }

    /**
     * Show or hide laser visuals
     */
    showLaserVisuals(entityId, visible) {
        const visuals = this.laserVisuals.get(entityId);
        if (!visuals) return;
        
        visuals.laserBeam.visible = visible;
        visuals.progressIndicator.visible = visible;
        visuals.impactEffect.visible = visible;
    }

    /**
     * Update laser beam position and appearance
     */
    updateLaserBeam(sourceEntity, targetEntity) {
        const visuals = this.laserVisuals.get(sourceEntity.id);
        if (!visuals) return;
        
        const transform = sourceEntity.getComponent('TransformComponent');
        const targetTransform = targetEntity.getComponent('TransformComponent');
        const miningLaser = sourceEntity.getComponent('MiningLaserComponent');
        
        if (!transform || !targetTransform || !miningLaser) return;
        
        // Create a clone of the source position to work with
        const adjustedSource = transform.position.clone();
        
        // The ship's coordinate system has -Z as forward direction
        // Add offset to position the laser at the front of the ship
        const frontOffset = new THREE.Vector3(0, 0, -20);
        frontOffset.applyQuaternion(transform.quaternion);
        
        // Apply the offset to the source position
        adjustedSource.add(frontOffset);
        
        // Calculate direction and length of the beam
        const direction = new THREE.Vector3().subVectors(targetTransform.position, adjustedSource);
        const distance = direction.length();
        
        // Set the laser beam position and scale
        visuals.laserBeam.position.copy(adjustedSource);
        visuals.laserBeam.lookAt(targetTransform.position);
        visuals.laserBeam.scale.set(1, 1, distance);
        
        // Position progress indicator at target
        visuals.progressIndicator.position.copy(targetTransform.position);
        
        // Update impact effect position
        visuals.impactEffect.position.copy(targetTransform.position);
        
        // Make the progress indicator face the camera
        if (this.camera) {
            visuals.progressIndicator.lookAt(this.camera.position);
        }
        
        // Update the laser material animation
        if (visuals.laserBeam.material) {
            // Animate laser intensity
            const intensity = 0.8 + Math.sin(Date.now() * 0.01) * 0.2;
            visuals.laserBeam.material.opacity = intensity;
            
            // Make the color pulse slightly
            const hue = (Date.now() * 0.001) % 1;
            const saturation = 0.5 + Math.sin(Date.now() * 0.002) * 0.2;
            visuals.laserBeam.material.color.setHSL(hue, saturation, 0.5);
        }
        
        // Animate particles around impact point
        if (visuals.impactEffect.geometry) {
            const positions = visuals.impactEffect.geometry.attributes.position.array;
            const particleCount = positions.length / 3;
            
            for (let i = 0; i < particleCount; i++) {
                // Update particle position with random motion
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * 2;
                
                positions[i * 3] = Math.cos(angle) * radius;
                positions[i * 3 + 1] = Math.sin(angle) * radius;
                positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
            }
            
            visuals.impactEffect.geometry.attributes.position.needsUpdate = true;
        }
    }

    /**
     * Update progress indicator
     */
    updateProgressIndicator(entityId, progress) {
        const visuals = this.laserVisuals.get(entityId);
        if (!visuals || !visuals.progressIndicator) return;
        
        const progressAngle = Math.PI * 2 * progress;
        const foregroundRing = visuals.progressIndicator.userData.foregroundRing;
        
        if (foregroundRing && foregroundRing.geometry) {
            foregroundRing.geometry.dispose();
            foregroundRing.geometry = new THREE.RingGeometry(2.4, 3.2, 32, 1, 0, progressAngle);
        }
    }

    /**
     * Clean up resources when entity is destroyed
     */
    cleanupLaserVisuals(entityId) {
        const visuals = this.laserVisuals.get(entityId);
        if (!visuals) return;
        
        // Dispose of Three.js resources
        if (visuals.laserBeam) {
            if (visuals.laserBeam.geometry) visuals.laserBeam.geometry.dispose();
            if (visuals.laserBeam.material) visuals.laserBeam.material.dispose();
            this.scene.remove(visuals.laserBeam);
        }
        
        if (visuals.progressIndicator) {
            visuals.progressIndicator.children.forEach(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
            this.scene.remove(visuals.progressIndicator);
        }
        
        if (visuals.impactEffect) {
            if (visuals.impactEffect.geometry) visuals.impactEffect.geometry.dispose();
            if (visuals.impactEffect.material) visuals.impactEffect.material.dispose();
            this.scene.remove(visuals.impactEffect);
        }
        
        // Remove from map
        this.laserVisuals.delete(entityId);
    }

    /**
     * Clean up all visual resources
     */
    cleanup() {
        for (const entityId of this.laserVisuals.keys()) {
            this.cleanupLaserVisuals(entityId);
        }
        this.laserVisuals.clear();
    }

    /**
     * Set camera reference
     */
    setCamera(camera) {
        this.camera = camera;
    }
}