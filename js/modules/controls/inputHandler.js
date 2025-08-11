// inputHandler.js - Handles keyboard and mouse input

export class InputHandler {
    constructor(spaceship, physics) {
        this.spaceship = spaceship;
        this.physics = physics;
        this.isPointerLocked = false;
        this.mouseSensitivity = 0.001; // Lower sensitivity for more precise control
        
        this.setupKeyboardControls();
        this.setupPointerLock();
    }
    
    setupKeyboardControls() {
        // Keyboard controls
        document.addEventListener('keydown', e => {
            // Ignore inputs when docked or intro sequence is active
            if (this.spaceship.isDocked || (window.game && window.game.introSequenceActive)) return;
            
            switch (e.key.toLowerCase()) {
                case 'w': window.inputIntent = (window.inputIntent||0) | 1; break;
                case 's': window.inputIntent = (window.inputIntent||0) | 2; break;
                case 'a': window.inputIntent = (window.inputIntent||0) | 4; break;
                case 'd': window.inputIntent = (window.inputIntent||0) | 8; break;
                case 'shift': window.inputIntent = (window.inputIntent||0) | 16; break;
            }
        });
        
        document.addEventListener('keyup', e => {
            // Still process key up events when intro is active to prevent stuck keys
            if (window.game && window.game.introSequenceActive) {
                // Force reset all thrusters during intro sequence
                this.spaceship.thrust.forward = false;
                this.spaceship.thrust.backward = false;
                this.spaceship.thrust.right = false;
                this.spaceship.thrust.left = false;
                this.spaceship.thrust.boost = false;
                return;
            }
            
            const clearBit = (bit) => { window.inputIntent = (window.inputIntent||0) & ~bit; };
            switch (e.key.toLowerCase()) {
                case 'w': clearBit(1); break;
                case 's': clearBit(2); break;
                case 'a': clearBit(4); break;
                case 'd': clearBit(8); break;
                case 'shift': clearBit(16); break;
            }
        });
    }
    
    setupPointerLock() {
        // Get the canvas element (it's the first canvas in the document)
        const canvas = document.querySelector('canvas');
        
        // Request pointer lock when clicking on the canvas
        canvas.addEventListener('pointerdown', (e) => {
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
    
    handlePointerMove(e) {
        // Skip mouse movement handling during intro sequence
        if (window.game && window.game.introSequenceActive) return;
        
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
    
    isLocked() {
        return this.isPointerLocked;
    }
    
    exitPointerLock() {
        if (document.exitPointerLock) {
            document.exitPointerLock();
        }
    }
}