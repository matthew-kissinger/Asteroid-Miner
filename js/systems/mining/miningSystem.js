/**
 * MiningSystem - Handles resource mining and extraction
 * 
 * Manages mining operations between ships and asteroids.
 */

import * as THREE from 'three';
import { System } from '../../core/system.js';
import { BeamMechanics } from './core/beamMechanics.js';
import { TargetTracking } from './core/targetTracking.js';
import { ResourceCollection } from './core/resourceCollection.js';
import { StateManagement } from './core/stateManagement.js';

export class MiningSystem extends System {
    constructor(world) {
        super(world);
        this.requiredComponents = ['MiningLaserComponent', 'TransformComponent'];
        this.priority = 50; // Run mid-cycle after physics but before rendering
        
        // Scene reference (set in initialize)
        this.scene = null;
        this.camera = null;
        
        // Initialize component modules
        this.beamMechanics = new BeamMechanics(null, null); // Scene and camera set in initialize
        this.targetTracking = new TargetTracking(world);
        this.resourceCollection = new ResourceCollection(world);
        this.stateManagement = new StateManagement();
        
        // Listen for mining events
        this.world.messageBus.subscribe('mining.start', this.startMining.bind(this));
        this.world.messageBus.subscribe('mining.stop', this.stopMining.bind(this));
        this.world.messageBus.subscribe('mining.component.detached', message => {
            const entityId = message.data.entityId;
            if (entityId) {
                this.beamMechanics.cleanupLaserVisuals(entityId);
                this.stateManagement.cleanupEntity(entityId);
            }
        });
        this.world.messageBus.subscribe('camera.set', message => {
            this.camera = message.data.camera;
            this.beamMechanics.setCamera(this.camera);
        });
    }
    
    /**
     * Initialize system
     */
    initialize() {
        // Get scene reference from the world
        this.scene = this.world.scene;
        
        // Initialize beam mechanics with scene reference
        this.beamMechanics.scene = this.scene;
        
        // Request camera from renderer system if available
        this.world.messageBus.publish('camera.request', {});
    }
    
    /**
     * Start a mining operation
     * @param {object} message Mining start message data
     */
    startMining(message) {
        const { sourceEntity, targetEntity } = message.data;
        
        // Validate mining conditions using target tracking module
        const validation = this.targetTracking.validateMiningStart(sourceEntity, targetEntity);
        if (!validation.valid) {
            if (validation.publishEvent) {
                this.world.messageBus.publish(validation.publishEvent, {
                    sourceEntity,
                    targetEntity,
                    reason: validation.reason,
                    distance: validation.distance,
                    maxRange: validation.maxRange
                });
            }
            return;
        }
        
        // Get components
        const miningLaser = sourceEntity.getComponent('MiningLaserComponent');
        const mineable = targetEntity.getComponent('MineableComponent');
        
        // Ensure laser visuals are created
        this.beamMechanics.ensureLaserVisuals(sourceEntity);
        
        // Set target and activate laser
        miningLaser.setTarget(targetEntity.id);
        miningLaser.activate(true);
        
        // Start mining operation using state management
        this.stateManagement.startMiningOperation(sourceEntity.id, targetEntity.id);
        
        // Show mining laser visuals
        this.beamMechanics.showLaserVisuals(sourceEntity.id, true);
        
        // Update initial laser position
        this.beamMechanics.updateLaserBeam(sourceEntity, targetEntity);
        
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
        if (!this.stateManagement.hasActiveMining(sourceEntity.id)) {
            return;
        }
        
        // Get target entity ID
        const targetEntityId = this.stateManagement.getTargetEntityId(sourceEntity.id);
        const targetEntity = this.world.getEntity(targetEntityId);
        
        // Get components
        const miningLaser = sourceEntity.getComponent('MiningLaserComponent');
        
        // Deactivate mining laser
        miningLaser.setTarget(null);
        miningLaser.activate(false);
        
        // Hide mining laser visuals
        this.beamMechanics.showLaserVisuals(sourceEntity.id, false);
        
        // Deactivate mining effect on asteroid
        if (targetEntity) {
            const mineable = targetEntity.getComponent('MineableComponent');
            if (mineable) {
                mineable.showMiningEffect(false);
            }
        }
        
        // Remove mining operation using state management
        this.stateManagement.stopMiningOperation(sourceEntity.id);
        
        // Publish mining stopped event
        this.world.messageBus.publish('mining.stopped', {
            sourceEntity,
            targetEntity
        });
    }
    
    
    
    
    
    /**
     * Process active mining operations
     * @param {number} deltaTime Time since last update in seconds
     */
    update(deltaTime) {
        // Process all active mining operations
        for (const [sourceId, targetId] of this.stateManagement.getActiveMiningOperations().entries()) {
            const sourceEntity = this.world.getEntity(sourceId);
            const targetEntity = this.world.getEntity(targetId);
            
            // Skip if either entity is gone
            if (!sourceEntity || !targetEntity) {
                if (sourceEntity) {
                    this.stopMining({ data: { sourceEntity } });
                } else {
                    this.stateManagement.stopMiningOperation(sourceId);
                }
                continue;
            }
            
            // Validate continued mining using target tracking
            const validation = this.targetTracking.validateContinuedMining(sourceEntity, targetEntity);
            if (!validation.valid) {
                if (validation.publishEvent) {
                    this.world.messageBus.publish(validation.publishEvent, {
                        sourceEntity,
                        targetEntity,
                        distance: validation.distance,
                        maxRange: validation.maxRange
                    });
                }
                this.stopMining({ data: { sourceEntity } });
                continue;
            }
            
            // Get components
            const miningLaser = sourceEntity.getComponent('MiningLaserComponent');
            const mineable = targetEntity.getComponent('MineableComponent');
            
            // Update laser beam visual
            this.beamMechanics.updateLaserBeam(sourceEntity, targetEntity);
            
            // Update mining progress using resource collection module
            const progressIncrement = this.resourceCollection.calculateMiningProgress(miningLaser, mineable, deltaTime);
            let currentProgress = this.stateManagement.getMiningProgress(sourceId) + progressIncrement;
            
            // Update progress indicator
            this.beamMechanics.updateProgressIndicator(sourceId, currentProgress % 1);
            
            // Check if mining is complete
            if (this.resourceCollection.isMiningComplete(currentProgress)) {
                // Extract resources and handle completion
                const miningResult = this.resourceCollection.extractResources(mineable);
                const result = this.resourceCollection.processMiningCompletion(sourceEntity, targetEntity, miningResult);
                
                if (!result.success) {
                    this.stopMining({ data: { sourceEntity } });
                    continue;
                }
                
                // Stop mining
                this.stopMining({ data: { sourceEntity } });
                
                // Request asteroid destruction
                this.resourceCollection.requestEntityDestruction(targetEntity);
                
                continue;
            } else {
                // Update progress for partial completion
                this.stateManagement.updateMiningProgress(sourceId, currentProgress);
            }
            
            // Update mining progress event for UI
            this.resourceCollection.publishProgressUpdate(sourceEntity, targetEntity, currentProgress, mineable);
        }
    }
    
    
    /**
     * Clean up when system is destroyed
     */
    onDestroyed() {
        // Clean up all visual resources using beam mechanics
        this.beamMechanics.cleanup();
        
        // Clear state management
        this.stateManagement.clearAll();
        
        // Unsubscribe from events
        // (The messageBus handles this automatically when the system is removed)
    }
}