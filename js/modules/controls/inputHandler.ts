// inputHandler.js - Handles keyboard and mouse input

type SpaceshipInput = {
    isDocked: boolean;
    thrust: {
        forward: boolean;
        backward: boolean;
        right: boolean;
        left: boolean;
        boost: boolean;
    };
};

type PhysicsInput = {
    updateRotation: (deltaX: number, deltaY: number) => void;
};

type GameWindow = Window & {
    game?: {
        introSequenceActive?: boolean;
    };
    inputIntent?: number;
};

export class InputHandler {
    spaceship: SpaceshipInput;
    physics: PhysicsInput;
    isPointerLocked: boolean;
    mouseSensitivity: number;

    constructor(spaceship: SpaceshipInput, physics: PhysicsInput) {
        this.spaceship = spaceship;
        this.physics = physics;
        this.isPointerLocked = false;
        this.mouseSensitivity = 0.001; // Lower sensitivity for more precise control
        
        this.setupKeyboardControls();
        this.setupPointerLock();
    }
    
    setupKeyboardControls(): void {
        // Keyboard controls
        document.addEventListener('keydown', (e: KeyboardEvent) => {
            const windowWithGame = window as GameWindow;
            // Ignore inputs when docked or intro sequence is active
            if (this.spaceship.isDocked || (windowWithGame.game && windowWithGame.game.introSequenceActive)) return;
            
            switch (e.key.toLowerCase()) {
                case 'w': windowWithGame.inputIntent = (windowWithGame.inputIntent || 0) | 1; break;
                case 's': windowWithGame.inputIntent = (windowWithGame.inputIntent || 0) | 2; break;
                case 'a': windowWithGame.inputIntent = (windowWithGame.inputIntent || 0) | 4; break;
                case 'd': windowWithGame.inputIntent = (windowWithGame.inputIntent || 0) | 8; break;
                case 'shift': windowWithGame.inputIntent = (windowWithGame.inputIntent || 0) | 16; break;
            }
        });
        
        document.addEventListener('keyup', (e: KeyboardEvent) => {
            const windowWithGame = window as GameWindow;
            // Still process key up events when intro is active to prevent stuck keys
            if (windowWithGame.game && windowWithGame.game.introSequenceActive) {
                // Force reset all thrusters during intro sequence
                this.spaceship.thrust.forward = false;
                this.spaceship.thrust.backward = false;
                this.spaceship.thrust.right = false;
                this.spaceship.thrust.left = false;
                this.spaceship.thrust.boost = false;
                return;
            }
            
            const clearBit = (bit: number) => { windowWithGame.inputIntent = (windowWithGame.inputIntent || 0) & ~bit; };
            switch (e.key.toLowerCase()) {
                case 'w': clearBit(1); break;
                case 's': clearBit(2); break;
                case 'a': clearBit(4); break;
                case 'd': clearBit(8); break;
                case 'shift': clearBit(16); break;
            }
        });
    }
    
    setupPointerLock(): void {
        // Get the canvas element (it's the first canvas in the document)
        const canvas = document.querySelector('canvas') as HTMLCanvasElement;
        
        // Request pointer lock when clicking on the canvas
        canvas.addEventListener('pointerdown', (e: PointerEvent) => {
            e.preventDefault(); // Prevent default to avoid unwanted behavior
            if (!this.isPointerLocked && !this.spaceship.isDocked) {
                canvas.requestPointerLock();
            }
        });
        
        // Set up pointer lock change event
        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement === canvas) {
                // Pointer is locked
                this.isPointerLocked = true;
                document.addEventListener('pointermove', this.handlePointerMove.bind(this));
            } else {
                // Pointer is unlocked
                this.isPointerLocked = false;
                document.removeEventListener('pointermove', this.handlePointerMove.bind(this));
            }
        });
        
        // Add instructions for pointer lock
        const instructionsElement = document.createElement('div');
        instructionsElement.id = 'pointer-lock-instructions';
        instructionsElement.innerHTML = `
            Click on the game to enable mouse rotation
        `;
        instructionsElement.style.position = 'absolute';
        instructionsElement.style.top = '60px';
        instructionsElement.style.left = '50%';
        instructionsElement.style.transform = 'translateX(-50%)';
        instructionsElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        instructionsElement.style.padding = '10px 20px';
        instructionsElement.style.borderRadius = '20px';
        instructionsElement.style.border = '1px solid #30cfd0';
        instructionsElement.style.boxShadow = '0 0 10px #30cfd0';
        instructionsElement.style.color = '#fff';
        instructionsElement.style.fontFamily = 'Courier New, monospace';
        instructionsElement.style.zIndex = '999';
        instructionsElement.style.textAlign = 'center';
        document.body.appendChild(instructionsElement);
        
        // Hide instructions when pointer is locked
        document.addEventListener('pointerlockchange', () => {
            instructionsElement.style.display = document.pointerLockElement ? 'none' : 'block';
        });
    }
    
    handlePointerMove(e: PointerEvent): void {
        const windowWithGame = window as GameWindow;
        // Skip mouse movement handling during intro sequence
        if (windowWithGame.game && windowWithGame.game.introSequenceActive) return;
        
        if (!this.isPointerLocked) return;
        
        // Use movementX and movementY for rotation
        // These values represent the mouse movement since the last event
        const movementX = e.movementX || 0;
        const movementY = e.movementY || 0;
        
        // Update the physics rotation based on these movements
        this.physics.updateRotation(
            movementX * this.mouseSensitivity, 
            movementY * this.mouseSensitivity
        );
    }
    
    isLocked(): boolean {
        return this.isPointerLocked;
    }
    
    exitPointerLock(): void {
        if (document.exitPointerLock) {
            document.exitPointerLock();
        }
    }
}
