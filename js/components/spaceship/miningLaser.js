/**
 * MiningLaserComponent - Handles mining laser for resource extraction
 * 
 * Creates and manages the mining laser beam and mining operations.
 */

import { Component } from '../../core/component.js';

export class MiningLaserComponent extends Component {
    constructor(power = 1, range = 800) {
        super();
        
        // Mining properties
        this.power = power;
        this.range = range;
        this.active = false;
        this.targetEntityId = null;
        
        // Laser beam visual properties
        this.laserBeam = null;
        this.laserColor = 0x00FFFF;
        this.laserWidth = 0.4;
        
        // Mining progress visualization
        this.progressIndicator = null;
        
        // Mining rate stats
        this.miningRates = {
            iron: 2.0,    // Base units per second
            gold: 0.8,    // Base units per second
            platinum: 0.3 // Base units per second
        };
    }
    
    /**
     * Initialize mining laser visuals
     * @param {THREE.Scene} scene Scene to add laser to
     */
    initializeLaser(scene) {
        // Create laser beam geometry
        const laserGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1, 8);
        laserGeometry.rotateX(Math.PI / 2);
        laserGeometry.translate(0, 0, 0.5);
        
        // Create laser material with glow effect
        const laserMaterial = new THREE.MeshBasicMaterial({
            color: this.laserColor,
            transparent: true,
            opacity: 0.7,
            depthWrite: false
        });
        
        // Create laser mesh
        this.laserBeam = new THREE.Mesh(laserGeometry, laserMaterial);
        this.laserBeam.visible = false;
        scene.add(this.laserBeam);
        
        // Create mining progress indicator
        this._createProgressIndicator(scene);
    }
    
    /**
     * Create a mining progress indicator
     * @param {THREE.Scene} scene Scene to add indicator to
     * @private
     */
    _createProgressIndicator(scene) {
        // Create a ring geometry for the progress indicator
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
            color: 0x00FFFF,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        
        // Create the background ring
        const backgroundRing = new THREE.Mesh(ringGeometry, ringBackgroundMaterial);
        
        // Create the foreground ring (progress indicator)
        // We'll use a partial ring geometry that will be updated during mining
        const foregroundRingGeometry = new THREE.RingGeometry(2.4, 3.2, 32, 1, 0, 0);
        const foregroundRing = new THREE.Mesh(foregroundRingGeometry, ringForegroundMaterial);
        
        // Create a container for the progress indicator
        this.progressIndicator = new THREE.Group();
        this.progressIndicator.add(backgroundRing);
        this.progressIndicator.add(foregroundRing);
        
        // Always face the camera (billboard)
        this.progressIndicator.userData = {
            foregroundRing: foregroundRing,
            foregroundGeometry: foregroundRingGeometry
        };
        
        // Hide initially
        this.progressIndicator.visible = false;
        scene.add(this.progressIndicator);
    }
    
    /**
     * Update progress indicator
     * @param {number} progress Mining progress from 0 to 1
     */
    updateProgressIndicator(progress) {
        if (!this.progressIndicator || !this.active) return;
        
        // Ensure the indicator is visible
        this.progressIndicator.visible = true;
        
        // Update the foreground ring geometry to show progress
        const foregroundRing = this.progressIndicator.userData.foregroundRing;
        const progressAngle = Math.PI * 2 * progress;
        
        // Dispose old geometry and create new one with updated arc
        if (foregroundRing.geometry) {
            foregroundRing.geometry.dispose();
        }
        
        foregroundRing.geometry = new THREE.RingGeometry(2.4, 3.2, 32, 1, 0, progressAngle);
    }
    
    /**
     * Set mining target
     * @param {string} entityId Target entity ID
     */
    setTarget(entityId) {
        this.targetEntityId = entityId;
    }
    
    /**
     * Activate mining laser
     * @param {boolean} active Whether laser should be active
     */
    activate(active) {
        this.active = active;
        
        if (this.laserBeam) {
            this.laserBeam.visible = active;
        }
        
        // Hide progress indicator if deactivated
        if (!active && this.progressIndicator) {
            this.progressIndicator.visible = false;
        }
    }
    
    /**
     * Update laser beam between ship and target
     * @param {THREE.Vector3} sourcePosition Source position (ship)
     * @param {THREE.Vector3} targetPosition Target position (asteroid)
     */
    updateLaserBeam(sourcePosition, targetPosition) {
        // If the laser is not active or we're missing positions, don't show it
        if (!this.active || !sourcePosition || !targetPosition) {
            this.laserBeam.visible = false;
            return;
        }
        
        // Create a clone of the source position to work with
        const adjustedSource = sourcePosition.clone();
        
        // The ship's coordinate system has -Z as forward direction
        // Add offset to position the laser at the front of the ship
        if (this.entity) {
            const frontOffset = new THREE.Vector3(0, 0, -20);
            
            // If the entity has a transform component, use its rotation
            const transform = this.entity.getComponent('TransformComponent');
            if (transform) {
                frontOffset.applyQuaternion(transform.getQuaternion());
            }
            
            // Apply the offset to the source position
            adjustedSource.add(frontOffset);
        }
        
        // Calculate direction and length of the beam
        const direction = new THREE.Vector3().subVectors(targetPosition, adjustedSource);
        const distance = direction.length();
        
        // Set the laser beam position and scale
        this.laserBeam.position.copy(adjustedSource);
        this.laserBeam.lookAt(targetPosition);
        this.laserBeam.scale.set(1, 1, distance);
        
        // Show the beam
        this.laserBeam.visible = true;
        
        // Position progress indicator at target
        if (this.progressIndicator) {
            this.progressIndicator.position.copy(targetPosition);
            this.progressIndicator.visible = true;
        }
        
        // Update the impact effect position
        if (this.impactEffect) {
            this.impactEffect.position.copy(targetPosition);
            this.impactEffect.visible = true;
        }
        
        // Ensure the beam material is updated correctly
        if (this.laserBeam.material) {
            // Animate laser intensity
            const intensity = 0.8 + Math.sin(Date.now() * 0.01) * 0.2;
            this.laserBeam.material.opacity = intensity;
            
            // Make the color pulse slightly
            const hue = (Date.now() * 0.001) % 1;
            const saturation = 0.5 + Math.sin(Date.now() * 0.002) * 0.2;
            this.laserBeam.material.color.setHSL(hue, saturation, 0.5);
        }
    }
    
    /**
     * Calculate mining speed for a specific resource
     * @param {string} resourceType Resource type (iron, gold, platinum)
     * @returns {number} Mining speed in units per second
     */
    getMiningSpeed(resourceType) {
        if (!this.miningRates.hasOwnProperty(resourceType)) {
            console.warn(`Unknown resource type: ${resourceType}, using default mining rate`);
            return this.power;
        }
        
        return this.miningRates[resourceType] * this.power;
    }
    
    /**
     * Make the progress indicator face the camera
     * @param {THREE.Camera} camera Camera to face
     */
    faceCamera(camera) {
        if (this.progressIndicator && this.progressIndicator.visible) {
            this.progressIndicator.lookAt(camera.position);
        }
    }
    
    /**
     * Upgrade mining laser power
     * @param {number} multiplier Power multiplier
     */
    upgrade(multiplier = 1.5) {
        this.power *= multiplier;
        
        // Notify upgrade
        if (this.entity && this.entity.world) {
            this.entity.world.messageBus.publish('miningLaser.upgraded', {
                entity: this.entity,
                newPower: this.power
            });
        }
        
        return this;
    }
    
    /**
     * Clean up resources when component is detached
     */
    onDetached() {
        // Remove laser beam
        if (this.laserBeam && this.laserBeam.parent) {
            this.laserBeam.geometry.dispose();
            this.laserBeam.material.dispose();
            this.laserBeam.parent.remove(this.laserBeam);
        }
        
        // Remove progress indicator
        if (this.progressIndicator && this.progressIndicator.parent) {
            this.progressIndicator.children.forEach(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
            this.progressIndicator.parent.remove(this.progressIndicator);
        }
    }
}