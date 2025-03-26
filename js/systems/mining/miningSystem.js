/**
 * MiningSystem - Handles resource mining and extraction
 * 
 * Manages mining operations between ships and asteroids.
 */

import { System } from '../../core/system.js';

export class MiningSystem extends System {
    constructor(world) {
        super(world);
        this.requiredComponents = ['MiningLaserComponent', 'TransformComponent'];
        this.priority = 50; // Run mid-cycle after physics but before rendering
        
        // Active mining operations
        this.activeMiningOperations = new Map();
        
        // Mining tracking
        this.miningProgresses = new Map();
        
        // Visual elements storage
        this.laserVisuals = new Map(); // Maps entityId to laser visual elements
        
        // Scene reference (set in initialize)
        this.scene = null;
        this.camera = null;
        
        // Listen for mining events
        this.world.messageBus.subscribe('mining.start', this.startMining.bind(this));
        this.world.messageBus.subscribe('mining.stop', this.stopMining.bind(this));
        this.world.messageBus.subscribe('mining.component.detached', message => {
            const entityId = message.data.entityId;
            if (entityId) {
                this.cleanupLaserVisuals(entityId);
            }
        });
        this.world.messageBus.subscribe('camera.set', message => {
            this.camera = message.data.camera;
        });
    }
    
    /**
     * Initialize system
     */
    initialize() {
        // Get scene reference from the world
        this.scene = this.world.scene;
        
        // Request camera from renderer system if available
        this.world.messageBus.publish('camera.request', {});
    }
    
    /**
     * Start a mining operation
     * @param {object} message Mining start message data
     */
    startMining(message) {
        const { sourceEntity, targetEntity } = message.data;
        
        // Verify entity has required components
        if (!this.checkEntity(sourceEntity)) {
            console.warn('Mining source entity missing required components');
            return;
        }
        
        // Get components
        const miningLaser = sourceEntity.getComponent('MiningLaserComponent');
        const transform = sourceEntity.getComponent('TransformComponent');
        
        // Verify target entity has required components
        const targetTransform = targetEntity.getComponent('TransformComponent');
        const mineable = targetEntity.getComponent('MineableComponent');
        const meshComponent = targetEntity.getComponent('MeshComponent');
        
        if (!targetTransform || !mineable) {
            console.warn('Mining target entity missing required components');
            return;
        }
        
        // Check if target is visible
        if (meshComponent && !meshComponent.isVisible()) {
            console.warn('Cannot mine invisible target');
            this.world.messageBus.publish('mining.invalidTarget', {
                sourceEntity,
                targetEntity,
                reason: 'Target is not visible'
            });
            return;
        }
        
        // Check if target is already depleted
        if (mineable.isDepleted()) {
            this.world.messageBus.publish('mining.targetDepleted', {
                sourceEntity,
                targetEntity
            });
            return;
        }
        
        // Check if in range - use an extended range for better usability in the larger solar system
        const distance = transform.position.distanceTo(targetTransform.position);
        // Allow mining from 2x the defined range for better gameplay experience
        if (distance > miningLaser.range * 2) {
            this.world.messageBus.publish('mining.outOfRange', {
                sourceEntity,
                targetEntity,
                distance,
                maxRange: miningLaser.range * 2
            });
            return;
        }
        
        // Ensure laser visuals are created
        this.ensureLaserVisuals(sourceEntity);
        
        // Set target and activate laser
        miningLaser.setTarget(targetEntity.id);
        miningLaser.activate(true);
        
        // Start mining operation
        this.activeMiningOperations.set(sourceEntity.id, targetEntity.id);
        this.miningProgresses.set(sourceEntity.id, 0);
        
        // Show mining laser visuals
        this.showLaserVisuals(sourceEntity.id, true);
        
        // Update initial laser position
        this.updateLaserBeam(sourceEntity, targetEntity);
        
        // Activate mining effect on asteroid
        mineable.showMiningEffect(true);
        
        // Publish mining started event
        this.world.messageBus.publish('mining.started', {
            sourceEntity,
            targetEntity,
            resourceType: mineable.resourceType
        });
    }
    
    /**
     * Stop a mining operation
     * @param {object} message Mining stop message data
     */
    stopMining(message) {
        const { sourceEntity } = message.data;
        
        // Check if there's an active mining operation
        if (!this.activeMiningOperations.has(sourceEntity.id)) {
            return;
        }
        
        // Get target entity ID
        const targetEntityId = this.activeMiningOperations.get(sourceEntity.id);
        const targetEntity = this.world.getEntity(targetEntityId);
        
        // Get components
        const miningLaser = sourceEntity.getComponent('MiningLaserComponent');
        
        // Deactivate mining laser
        miningLaser.setTarget(null);
        miningLaser.activate(false);
        
        // Hide mining laser visuals
        this.showLaserVisuals(sourceEntity.id, false);
        
        // Deactivate mining effect on asteroid
        if (targetEntity) {
            const mineable = targetEntity.getComponent('MineableComponent');
            if (mineable) {
                mineable.showMiningEffect(false);
            }
        }
        
        // Remove mining operation
        this.activeMiningOperations.delete(sourceEntity.id);
        this.miningProgresses.delete(sourceEntity.id);
        
        // Publish mining stopped event
        this.world.messageBus.publish('mining.stopped', {
            sourceEntity,
            targetEntity
        });
    }
    
    /**
     * Create laser visuals for an entity
     * @param {Entity} entity The entity to create visuals for
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
     * @param {string} entityId Entity ID
     * @param {boolean} visible Whether visuals should be visible
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
     * @param {Entity} sourceEntity Source entity (ship)
     * @param {Entity} targetEntity Target entity (asteroid)
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
     * @param {string} entityId Entity ID
     * @param {number} progress Mining progress from 0 to 1
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
     * Process active mining operations
     * @param {number} deltaTime Time since last update in seconds
     */
    update(deltaTime) {
        // Process all active mining operations
        for (const [sourceId, targetId] of this.activeMiningOperations.entries()) {
            const sourceEntity = this.world.getEntity(sourceId);
            const targetEntity = this.world.getEntity(targetId);
            
            // Skip if either entity is gone
            if (!sourceEntity || !targetEntity) {
                if (sourceEntity) {
                    this.stopMining({ data: { sourceEntity } });
                } else {
                    this.activeMiningOperations.delete(sourceId);
                    this.miningProgresses.delete(sourceId);
                }
                continue;
            }
            
            // Get components
            const miningLaser = sourceEntity.getComponent('MiningLaserComponent');
            const sourceTransform = sourceEntity.getComponent('TransformComponent');
            const targetTransform = targetEntity.getComponent('TransformComponent');
            const mineable = targetEntity.getComponent('MineableComponent');
            
            // Skip if any component is missing
            if (!miningLaser || !sourceTransform || !targetTransform || !mineable) {
                this.stopMining({ data: { sourceEntity } });
                continue;
            }
            
            // Check if still in range - use the extended range check here too
            const distance = sourceTransform.position.distanceTo(targetTransform.position);
            // Allow mining from 2x the defined range for better gameplay experience
            if (distance > miningLaser.range * 2) {
                this.world.messageBus.publish('mining.outOfRange', {
                    sourceEntity,
                    targetEntity,
                    distance,
                    maxRange: miningLaser.range * 2
                });
                this.stopMining({ data: { sourceEntity } });
                continue;
            }
            
            // Update laser beam visual
            this.updateLaserBeam(sourceEntity, targetEntity);
            
            // Update mining progress
            const miningRate = miningLaser.getMiningSpeed(mineable.resourceType);
            let currentProgress = this.miningProgresses.get(sourceId) || 0;
            currentProgress += miningRate * deltaTime;
            
            // Update progress indicator
            this.updateProgressIndicator(sourceId, currentProgress % 1);
            
            // Check if a resource unit has been mined
            if (currentProgress >= 1) {
                // Reset progress for next resource unit
                this.miningProgresses.set(sourceId, currentProgress % 1);
                
                // Extract resources
                const miningResult = mineable.mine(1);
                
                // Add to cargo if possible
                const cargoComponent = sourceEntity.getComponent('CargoComponent');
                if (cargoComponent) {
                    const added = cargoComponent.addResource(miningResult.type, miningResult.amount);
                    
                    // Check if anything was added (might be full)
                    if (added <= 0) {
                        this.world.messageBus.publish('mining.cargoFull', {
                            sourceEntity,
                            targetEntity,
                            resourceType: miningResult.type
                        });
                        this.stopMining({ data: { sourceEntity } });
                        continue;
                    }
                }
                
                // Publish resource mined event
                this.world.messageBus.publish('mining.resourceMined', {
                    sourceEntity,
                    targetEntity,
                    resourceType: miningResult.type,
                    amount: miningResult.amount
                });
                
                // Check if asteroid is depleted
                if (miningResult.depleted) {
                    this.world.messageBus.publish('mining.targetDepleted', {
                        sourceEntity,
                        targetEntity
                    });
                    this.stopMining({ data: { sourceEntity } });
                    
                    // Request asteroid destruction
                    this.world.messageBus.publish('entity.requestDestroy', {
                        entity: targetEntity
                    });
                    continue;
                }
            } else {
                // Update progress for partial completion
                this.miningProgresses.set(sourceId, currentProgress);
            }
            
            // Update mining progress event for UI
            this.world.messageBus.publish('mining.progress', {
                sourceEntity,
                targetEntity,
                progress: currentProgress % 1,
                resourceType: mineable.resourceType,
                remainingAmount: mineable.remainingAmount
            });
        }
    }
    
    /**
     * Clean up resources when entity is destroyed
     * @param {string} entityId Entity ID
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
     * Clean up when system is destroyed
     */
    onDestroyed() {
        // Clean up all visual resources
        for (const entityId of this.laserVisuals.keys()) {
            this.cleanupLaserVisuals(entityId);
        }
        
        // Clear maps
        this.laserVisuals.clear();
        this.activeMiningOperations.clear();
        this.miningProgresses.clear();
        
        // Unsubscribe from events
        // (The messageBus handles this automatically when the system is removed)
    }
}