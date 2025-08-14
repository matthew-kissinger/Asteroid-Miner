// resourceCollection.js - Handles resource extraction and collection logic

export class ResourceCollection {
    constructor(world) {
        this.world = world;
    }

    /**
     * Process mining completion and resource extraction
     */
    processMiningCompletion(sourceEntity, targetEntity, miningResult) {
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
                return { success: false, reason: 'cargo_full' };
            }
        }
        
        // Publish resource mined event with total amount
        this.world.messageBus.publish('mining.resourceMined', {
            sourceEntity,
            targetEntity,
            resourceType: miningResult.type,
            amount: miningResult.amount
        });
        
        // Publish target depleted event
        this.world.messageBus.publish('mining.targetDepleted', {
            sourceEntity,
            targetEntity
        });
        
        return { success: true, amount: miningResult.amount };
    }

    /**
     * Calculate mining progress for an operation
     */
    calculateMiningProgress(miningLaser, mineable, deltaTime) {
        const miningRate = miningLaser.getMiningSpeed(mineable.resourceType);
        return miningRate * deltaTime;
    }

    /**
     * Check if mining is complete
     */
    isMiningComplete(progress) {
        return progress >= 1;
    }

    /**
     * Extract resources from mineable component
     */
    extractResources(mineable) {
        return mineable.mine();
    }

    /**
     * Request entity destruction after mining completion
     */
    requestEntityDestruction(entity) {
        this.world.messageBus.publish('entity.requestDestroy', {
            entity: entity
        });
    }

    /**
     * Publish mining progress events for UI updates
     */
    publishProgressUpdate(sourceEntity, targetEntity, progress, mineable) {
        this.world.messageBus.publish('mining.progress', {
            sourceEntity,
            targetEntity,
            progress: progress % 1,
            resourceType: mineable.resourceType,
            remainingAmount: mineable.remainingAmount
        });
    }
}