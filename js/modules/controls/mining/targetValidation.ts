// targetValidation.js - Handles target validation and range checking

import type { Object3D } from 'three';

interface HasMesh {
    mesh: Object3D;
}

interface MiningStartResult {
    valid: boolean;
    reason?: string;
    distance?: number;
    maxRange?: number;
}

export class TargetValidation {
    spaceship: HasMesh | null;
    miningDistance: number;

    constructor(spaceship: HasMesh | null, miningDistance = 6000) {
        this.spaceship = spaceship;
        this.miningDistance = miningDistance;
    }

    /**
     * Validate asteroid target
     */
    validateAsteroid(asteroid: HasMesh | null): boolean {
        try {
            console.log("TargetValidation: validating asteroid", asteroid);
            
            // Validate asteroid before setting it as the target
            if (!asteroid || !asteroid.mesh || !asteroid.mesh.position) {
                console.error("TargetValidation: Invalid asteroid provided");
                return false;
            }

            return true;
        } catch (error) {
            console.error("TargetValidation: Error validating asteroid:", error);
            return false;
        }
    }

    /**
     * Check if target is in mining range
     */
    isInRange(asteroid: HasMesh | null): boolean {
        if (!asteroid || !asteroid.mesh || !this.spaceship || !this.spaceship.mesh) {
            return false;
        }

        const distance = this.spaceship.mesh.position.distanceTo(asteroid.mesh.position);
        return distance <= this.miningDistance;
    }

    /**
     * Get distance to target
     */
    getDistanceToTarget(asteroid: HasMesh | null): number {
        if (!asteroid || !asteroid.mesh || !this.spaceship || !this.spaceship.mesh) {
            return Infinity;
        }

        return this.spaceship.mesh.position.distanceTo(asteroid.mesh.position);
    }

    /**
     * Validate spaceship for mining
     */
    validateSpaceship(): boolean {
        if (!this.spaceship || !this.spaceship.mesh || !this.spaceship.mesh.position) {
            console.error("TargetValidation: Spaceship is missing mesh or position");
            return false;
        }
        return true;
    }

    /**
     * Check if asteroid is valid for mining start
     */
    canStartMining(asteroid: HasMesh | null): MiningStartResult {
        if (!this.validateAsteroid(asteroid)) {
            return { valid: false, reason: "Invalid asteroid" };
        }

        if (!this.validateSpaceship()) {
            return { valid: false, reason: "Invalid spaceship" };
        }

        const distance = this.getDistanceToTarget(asteroid);
        if (distance > this.miningDistance) {
            return { 
                valid: false, 
                reason: "Out of range",
                distance: distance,
                maxRange: this.miningDistance
            };
        }

        return { valid: true };
    }
}
