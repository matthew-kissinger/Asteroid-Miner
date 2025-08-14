// visualEffects.js - Ship visual effects (mining laser, trails)
// Extracted from spaceship.js to improve maintainability

export class ShipVisualEffects {
    constructor(shipComponents) {
        this.components = shipComponents; // { leftEmitter, rightEmitter }
    }

    /**
     * Activate mining laser visual effects
     */
    activateMiningLaser() {
        // Activate both emitters for a more powerful effect
        if (this.components.leftEmitter && this.components.rightEmitter) {
            // Left emitter
            this.components.leftEmitter.material.emissiveIntensity = 1.5;
            this.components.leftEmitter.scale.set(1.2, 1.2, 1.2);
            
            // Right emitter
            this.components.rightEmitter.material.emissiveIntensity = 1.5;
            this.components.rightEmitter.scale.set(1.2, 1.2, 1.2);
        }
    }

    /**
     * Deactivate mining laser visual effects
     */
    deactivateMiningLaser() {
        // Deactivate both emitters
        if (this.components.leftEmitter && this.components.rightEmitter) {
            // Left emitter
            this.components.leftEmitter.material.emissiveIntensity = 1;
            this.components.leftEmitter.scale.set(1, 1, 1);
            
            // Right emitter
            this.components.rightEmitter.material.emissiveIntensity = 1;
            this.components.rightEmitter.scale.set(1, 1, 1);
        }
    }

    /**
     * Update trail visibility based on movement
     * @param {boolean} isMoving Whether the ship is currently moving
     * @param {object} thrustState Current thrust state
     * @param {THREE.Vector3} velocity Current velocity
     * @param {object} trailEffects Trail effects instance
     */
    updateTrailVisibility(isMoving, thrustState, velocity, trailEffects) {
        // Delegate to trail effects module
        if (trailEffects) {
            trailEffects.updateTrailVisibility(isMoving, thrustState, velocity);
        }
    }

    /**
     * Update particle effects
     * @param {object} thrustState Current thrust state
     * @param {THREE.Vector3} velocity Current velocity
     * @param {object} trailEffects Trail effects instance
     */
    updateParticles(thrustState, velocity, trailEffects) {
        // Delegate to trail effects module
        if (trailEffects) {
            trailEffects.updateParticles(thrustState, velocity);
        }
    }
}