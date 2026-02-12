// autopilot.ts - Automatic navigation to stargate

import { Vector3, Quaternion } from 'three';

interface AutopilotSpaceship {
    mesh: {
        position: Vector3;
        quaternion: Quaternion;
        getWorldDirection: (target: Vector3) => Vector3;
    };
    thrust: {
        forward: boolean;
        backward: boolean;
        left: boolean;
        right: boolean;
        boost: boolean;
    };
    velocity: Vector3;
}

interface AutopilotStargate {
    getPosition: () => Vector3;
}

export class Autopilot {
    private spaceship: AutopilotSpaceship;
    private stargate: AutopilotStargate;
    private active: boolean = false;
    private readonly BRAKE_DISTANCE = 500;
    private readonly ARRIVAL_DISTANCE = 100;
    private readonly ROTATION_SPEED = 0.02;
    
    // Reusable temp objects
    private _tempDirection = new Vector3();
    private _tempForward = new Vector3();
    private _tempTargetQuat = new Quaternion();

    constructor(spaceship: AutopilotSpaceship, stargate: AutopilotStargate) {
        this.spaceship = spaceship;
        this.stargate = stargate;
    }

    enable(): void {
        this.active = true;
    }

    disable(): void {
        this.active = false;
        // Stop all thrust
        this.spaceship.thrust.forward = false;
        this.spaceship.thrust.backward = false;
        this.spaceship.thrust.boost = false;
    }

    isActive(): boolean {
        return this.active;
    }

    getDistanceToStargate(): number {
        const stargatePos = this.stargate.getPosition();
        return this.spaceship.mesh.position.distanceTo(stargatePos);
    }

    update(_delta: number): void {
        if (!this.active) return;

        const stargatePos = this.stargate.getPosition();
        const distance = this.getDistanceToStargate();

        // Auto-disengage if arrived
        if (distance < this.ARRIVAL_DISTANCE) {
            this.disable();
            return;
        }

        // Calculate direction to stargate
        this._tempDirection.copy(stargatePos).sub(this.spaceship.mesh.position).normalize();

        // Get current forward direction
        this.spaceship.mesh.getWorldDirection(this._tempForward);

        // Calculate target quaternion
        this._tempTargetQuat.setFromUnitVectors(
            new Vector3(0, 0, -1),
            this._tempDirection
        );

        // Smoothly rotate toward target
        this.spaceship.mesh.quaternion.slerp(this._tempTargetQuat, this.ROTATION_SPEED);

        // Apply thrust based on distance
        if (distance > this.BRAKE_DISTANCE) {
            // Full thrust when far
            this.spaceship.thrust.forward = true;
            this.spaceship.thrust.backward = false;
            this.spaceship.thrust.boost = distance > 1000;
        } else {
            // Brake when close
            const speed = this.spaceship.velocity.length();
            if (speed > 2) {
                this.spaceship.thrust.forward = false;
                this.spaceship.thrust.backward = true;
                this.spaceship.thrust.boost = false;
            } else {
                // Gentle approach
                this.spaceship.thrust.forward = true;
                this.spaceship.thrust.backward = false;
                this.spaceship.thrust.boost = false;
            }
        }
    }
}
