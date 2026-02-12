// joystickHandler.ts - Nipple.js integration and joystick input handling

import nipplejs from 'nipplejs';
import type { JoystickManager, JoystickOutputData } from 'nipplejs';

type TouchSpaceship = {
    isDocked: boolean;
    thrust: {
        forward: boolean;
        backward: boolean;
        left: boolean;
        right: boolean;
        boost: boolean;
    };
};

type TouchPhysics = {
    updateRotation: (deltaX: number, deltaY: number) => void;
};

export class JoystickHandler {
    spaceship: TouchSpaceship;
    physics: TouchPhysics;
    leftJoystick: JoystickManager | null;
    rightJoystick: JoystickManager | null;
    threshold: number;

    constructor(spaceship: TouchSpaceship, physics: TouchPhysics) {
        this.spaceship = spaceship;
        this.physics = physics;
        this.leftJoystick = null;
        this.rightJoystick = null;
        this.threshold = 0.1;
    }

    initializeJoysticks(leftZone: HTMLElement | null, rightZone: HTMLElement | null): boolean {
        if (!leftZone || !rightZone) {
            console.error('Joystick zones not provided');
            return false;
        }
        
        // Initialize left joystick (thrust control)
        this.leftJoystick = nipplejs.create({
            zone: leftZone,
            mode: 'static',
            position: { left: '50%', top: '50%' },
            color: 'rgba(120, 220, 232, 0.8)',
            size: 100,
            threshold: this.threshold,
            dynamicPage: true,
            fadeTime: 100
        });
        
        // Initialize right joystick (rotation control)
        this.rightJoystick = nipplejs.create({
            zone: rightZone,
            mode: 'static',
            position: { left: '50%', top: '50%' },
            color: 'rgba(120, 220, 232, 0.8)',
            size: 100,
            threshold: this.threshold,
            dynamicPage: true,
            fadeTime: 100
        });
        
        // Set up event handlers for joysticks
        this.setupJoystickEvents();
        return true;
    }

    setupJoystickEvents(): void {
        if (!this.leftJoystick || !this.rightJoystick) {
            console.error('Joysticks not initialized');
            return;
        }

        // Left joystick events (thrust)
        this.leftJoystick.on('move', (evt, data) => {
            void evt;
            this.handleThrustJoystick(data);
        });
        
        this.leftJoystick.on('end', () => {
            this.resetThrust();
        });
        
        // Right joystick events (rotation)
        this.rightJoystick.on('move', (evt, data) => {
            void evt;
            this.handleRotationJoystick(data);
        });
    }

    handleThrustJoystick(data: JoystickOutputData): void {
        if (this.spaceship.isDocked) return;
        
        // Reset thrust directions
        this.resetThrust();
        
        const force = data.force > 2 ? 2 : data.force; // Normalize force between 0-2
        const angle = data.angle.radian;
        
        // Correct direction mapping based on standard joystick angles:
        // In nipple.js, 0 radians = right, π/2 = up, π = left, 3π/2 = down
        
        // Up/North - Forward (around π/2 or 1.57 radians)
        if (angle > 1.0 && angle < 2.0) {
            this.spaceship.thrust.forward = true;
        }
        // Down/South - Backward (around 3π/2 or 4.71 radians)
        else if (angle > 4.0 && angle < 5.5) {
            this.spaceship.thrust.backward = true;
        }
        
        // Left/West - Left (around π or 3.14 radians)
        if (angle > 2.5 && angle < 4.0) {
            this.spaceship.thrust.left = true;  // Fixed: left joystick should trigger left thrust
        }
        // Right/East - Right (around 0 or 2π radians)
        else if ((angle >= 0 && angle < 1.0) || angle > 5.5) {
            this.spaceship.thrust.right = true;  // Fixed: right joystick should trigger right thrust
        }
        
        // Enable boost if force is high
        this.spaceship.thrust.boost = force > 1.5;
    }

    handleRotationJoystick(data: JoystickOutputData): void {
        if (this.spaceship.isDocked) return;
        
        // Extract the X and Y components of the joystick vector
        // Reduce sensitivity by lowering the multiplier from 0.05 to 0.015
        const xMove = data.vector.x * data.force * 0.015;
        // Invert the Y value to fix up/down control direction
        const yMove = -data.vector.y * data.force * 0.015;
        
        // Update rotation via physics
        this.physics.updateRotation(xMove, yMove);
    }

    resetThrust(): void {
        if (!this.spaceship) return;
        
        this.spaceship.thrust.forward = false;
        this.spaceship.thrust.backward = false;
        this.spaceship.thrust.left = false;
        this.spaceship.thrust.right = false;
        this.spaceship.thrust.boost = false;
    }

    destroy(): void {
        if (this.leftJoystick) {
            this.leftJoystick.destroy();
            this.leftJoystick = null;
        }
        if (this.rightJoystick) {
            this.rightJoystick.destroy();
            this.rightJoystick = null;
        }
    }
}
