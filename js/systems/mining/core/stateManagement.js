// stateManagement.js - Handles mining operation state management

export class StateManagement {
    constructor() {
        // Active mining operations
        this.activeMiningOperations = new Map();
        
        // Mining tracking
        this.miningProgresses = new Map();
    }

    /**
     * Start a mining operation
     */
    startMiningOperation(sourceEntityId, targetEntityId) {
        this.activeMiningOperations.set(sourceEntityId, targetEntityId);
        this.miningProgresses.set(sourceEntityId, 0);
    }

    /**
     * Stop a mining operation
     */
    stopMiningOperation(sourceEntityId) {
        this.activeMiningOperations.delete(sourceEntityId);
        this.miningProgresses.delete(sourceEntityId);
    }

    /**
     * Check if entity has active mining operation
     */
    hasActiveMining(sourceEntityId) {
        return this.activeMiningOperations.has(sourceEntityId);
    }

    /**
     * Get target entity ID for source entity
     */
    getTargetEntityId(sourceEntityId) {
        return this.activeMiningOperations.get(sourceEntityId);
    }

    /**
     * Update mining progress
     */
    updateMiningProgress(sourceEntityId, progress) {
        this.miningProgresses.set(sourceEntityId, progress);
    }

    /**
     * Get mining progress
     */
    getMiningProgress(sourceEntityId) {
        return this.miningProgresses.get(sourceEntityId) || 0;
    }

    /**
     * Get all active mining operations
     */
    getActiveMiningOperations() {
        return this.activeMiningOperations;
    }

    /**
     * Clear all mining operations
     */
    clearAll() {
        this.activeMiningOperations.clear();
        this.miningProgresses.clear();
    }

    /**
     * Clean up entity when it's destroyed
     */
    cleanupEntity(entityId) {
        if (this.activeMiningOperations.has(entityId)) {
            this.stopMiningOperation(entityId);
        }
    }

    /**
     * Get mining operation count
     */
    getActiveOperationCount() {
        return this.activeMiningOperations.size;
    }
}