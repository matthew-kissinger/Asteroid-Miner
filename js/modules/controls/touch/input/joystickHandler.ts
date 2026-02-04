// joystickHandler.js - Nipple.js integration and joystick input handling

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

type NippleOptions = {
    zone: HTMLElement | null;
    mode: string;
    position: { left: string; top: string };
    color: string;
    size: number;
    threshold: number;
    dynamicPage: boolean;
    fadeTime: number;
    lockX: boolean;
    lockY: boolean;
};

type NippleData = {
    force: number;
    angle: { radian: number };
    vector: { x: number; y: number };
};

type NippleManager = {
    on: (event: string, handler: (evt: unknown, data: NippleData) => void) => NippleManager;
    destroy: () => void;
};

type NippleWindow = Window & {
    nipplejs?: {
        create: (options: NippleOptions) => NippleManager;
    };
};

export class JoystickHandler {
    spaceship: TouchSpaceship;
    physics: TouchPhysics;
    leftJoystick: NippleManager | null;
    rightJoystick: NippleManager | null;
    threshold: number;
    isNippleLoaded: boolean;

    constructor(spaceship: TouchSpaceship, physics: TouchPhysics) {
        this.spaceship = spaceship;
        this.physics = physics;
        this.leftJoystick = null;
        this.rightJoystick = null;
        this.threshold = 0.1;
        this.isNippleLoaded = false;
    }

    async loadNippleJS(): Promise<void> {
        return new Promise((resolve, reject) => {
            // Check if nipple.js is already loaded
            const windowWithNipple = window as NippleWindow;
            if (windowWithNipple.nipplejs) {
                this.isNippleLoaded = true;
                resolve();
                return;
            }
            
            // Create script element
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/nipplejs/0.10.1/nipplejs.min.js';
            script.async = true;
            
            // Set up event handlers
            script.onload = () => {
                this.isNippleLoaded = true;
                resolve();
            };
            script.onerror = () => reject(new Error('Failed to load nipple.js'));
            
            // Add script to document
            document.head.appendChild(script);
        });
    }

    initializeJoysticks(leftZone: HTMLElement | null, rightZone: HTMLElement | null): boolean {
        const windowWithNipple = window as NippleWindow;
        if (!windowWithNipple.nipplejs || !this.isNippleLoaded) {
            console.error('nipplejs is not loaded');
            return false;
        }
        
        // Initialize left joystick (thrust control)
        this.leftJoystick = windowWithNipple.nipplejs.create({
            zone: leftZone,
            mode: 'static',
            position: { left: '50%', top: '50%' },
            color: 'rgba(120, 220, 232, 0.8)',
            size: 100,
            threshold: this.threshold,
            dynamicPage: true, // Better performance for scrolling
            fadeTime: 100, // Faster fade for better performance
            lockX: false, // Allow X-axis movement
            lockY: false  // Allow Y-axis movement
        });
        
        // Initialize right joystick (rotation control)
        this.rightJoystick = windowWithNipple.nipplejs.create({
            zone: rightZone,
            mode: 'static',
            position: { left: '50%', top: '50%' },
            color: 'rgba(120, 220, 232, 0.8)',
            size: 100,
            threshold: this.threshold,
            dynamicPage: true, // Better performance for scrolling
            fadeTime: 100, // Faster fade for better performance
            lockX: false, // Allow X-axis movement
            lockY: false  // Allow Y-axis movement
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
        }).on('end', () => {
            this.resetThrust();
        });
        
        // Right joystick events (rotation)
        this.rightJoystick.on('move', (evt, data) => {
            void evt;
            this.handleRotationJoystick(data);
        }).on('end', () => {
            // Do nothing on end - rotation is not continuous
        });
    }

    handleThrustJoystick(data: NippleData): void {
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

    handleRotationJoystick(data: NippleData): void {
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
