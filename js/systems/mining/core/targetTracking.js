// targetTracking.js - Handles target validation and range checking for ECS systems

export class TargetTracking {
    constructor(world) {
        this.world = world;
    }

    /**
     * Validate mining start conditions
     */
    validateMiningStart(sourceEntity, targetEntity) {
        // Verify entity has required components
        if (!this.checkEntityComponents(sourceEntity, ['MiningLaserComponent', 'TransformComponent'])) {
            console.warn('Mining source entity missing required components');
            return { valid: false, reason: 'Source entity missing components' };
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
            return { valid: false, reason: 'Target entity missing components' };
        }
        
        // Check if target is visible
        if (meshComponent && !meshComponent.isVisible()) {
            console.warn('Cannot mine invisible target');
            return { 
                valid: false, 
                reason: 'Target is not visible',
                publishEvent: 'mining.invalidTarget'
            };
        }
        
        // Check if target is already depleted
        if (mineable.isDepleted()) {
            return { 
                valid: false, 
                reason: 'Target is depleted',
                publishEvent: 'mining.targetDepleted'
            };
        }
        
        // Check if in range - use an extended range for better usability
        const distance = transform.position.distanceTo(targetTransform.position);
        if (distance > miningLaser.range * 2) {
            return { 
                valid: false, 
                reason: 'Out of range',
                distance,
                maxRange: miningLaser.range * 2,
                publishEvent: 'mining.outOfRange'
            };
        }
        
        return { valid: true };
    }

    /**
     * Check if entities still meet mining conditions during operation
     */
    validateContinuedMining(sourceEntity, targetEntity) {
        // Get components
        const miningLaser = sourceEntity.getComponent('MiningLaserComponent');
        const sourceTransform = sourceEntity.getComponent('TransformComponent');
        const targetTransform = targetEntity.getComponent('TransformComponent');
        const mineable = targetEntity.getComponent('MineableComponent');
        
        // Check if any component is missing
        if (!miningLaser || !sourceTransform || !targetTransform || !mineable) {
            return { valid: false, reason: 'Missing components' };
        }
        
        // Check if still in range - use the extended range check
        const distance = sourceTransform.position.distanceTo(targetTransform.position);
        if (distance > miningLaser.range * 2) {
            return { 
                valid: false, 
                reason: 'Out of range',
                distance,
                maxRange: miningLaser.range * 2,
                publishEvent: 'mining.outOfRange'
            };
        }
        
        return { valid: true };
    }

    /**
     * Check if entity has required components
     */
    checkEntityComponents(entity, requiredComponents) {
        for (const componentName of requiredComponents) {
            if (!entity.getComponent(componentName)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Get distance between two entities
     */
    getDistance(entity1, entity2) {
        const transform1 = entity1.getComponent('TransformComponent');
        const transform2 = entity2.getComponent('TransformComponent');
        
        if (!transform1 || !transform2) {
            return Infinity;
        }
        
        return transform1.position.distanceTo(transform2.position);
    }

    /**
     * Check if target is in mining range
     */
    isInRange(sourceEntity, targetEntity, range) {
        const distance = this.getDistance(sourceEntity, targetEntity);
        return distance <= range * 2; // Use extended range for better gameplay
    }
}