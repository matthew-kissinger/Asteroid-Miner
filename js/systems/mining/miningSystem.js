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
        
        // Listen for mining events
        this.world.messageBus.subscribe('mining.start', this.startMining.bind(this));
        this.world.messageBus.subscribe('mining.stop', this.stopMining.bind(this));
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
        
        if (!targetTransform || !mineable) {
            console.warn('Mining target entity missing required components');
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
        
        // Check if in range
        const distance = transform.position.distanceTo(targetTransform.position);
        if (distance > miningLaser.range) {
            this.world.messageBus.publish('mining.outOfRange', {
                sourceEntity,
                targetEntity,
                distance,
                maxRange: miningLaser.range
            });
            return;
        }
        
        // Set target and activate laser
        miningLaser.setTarget(targetEntity.id);
        miningLaser.activate(true);
        
        // Start mining operation
        this.activeMiningOperations.set(sourceEntity.id, targetEntity.id);
        this.miningProgresses.set(sourceEntity.id, 0);
        
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
            
            // Check if still in range
            const distance = sourceTransform.position.distanceTo(targetTransform.position);
            if (distance > miningLaser.range) {
                this.world.messageBus.publish('mining.outOfRange', {
                    sourceEntity,
                    targetEntity,
                    distance,
                    maxRange: miningLaser.range
                });
                this.stopMining({ data: { sourceEntity } });
                continue;
            }
            
            // Update laser beam visual
            miningLaser.updateLaserBeam(sourceTransform.position, targetTransform.position);
            
            // Update mining progress
            const miningRate = miningLaser.getMiningSpeed(mineable.resourceType);
            let currentProgress = this.miningProgresses.get(sourceId) || 0;
            currentProgress += miningRate * deltaTime;
            
            // Update progress indicator
            miningLaser.updateProgressIndicator(currentProgress % 1);
            
            // Check if a resource unit has been mined
            if (currentProgress >= 1) {
                // Reset progress
                currentProgress = 0;
                
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
            }
            
            // Update progress tracker
            this.miningProgresses.set(sourceId, currentProgress);
            
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
}