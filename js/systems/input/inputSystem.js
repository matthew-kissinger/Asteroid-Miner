/**
 * InputSystem - Handles keyboard and mouse input
 * 
 * Translates user input into game actions via the message bus.
 */

import { System } from '../../core/system.js';

export class InputSystem extends System {
    constructor(world) {
        super(world);
        this.requiredComponents = []; // Doesn't require components on entities
        this.priority = 5; // Run first before other systems
        
        // Input state
        this.keys = {};
        this.mouseMovement = { x: 0, y: 0 };
        this.mouseButtons = { left: false, middle: false, right: false };
        
        // Pointer lock state
        this.pointerLocked = false;
        
        // Key mappings
        this.keyMappings = {
            'w': 'thrust.forward',
            's': 'thrust.backward',
            'a': 'thrust.left',
            'd': 'thrust.right',
            'q': 'thrust.up',
            'e': 'thrust.down',
            'shift': 'thrust.boost',
            't': 'mining.toggle',
            'tab': 'targeting.cycle',
            'escape': 'ui.menu'
        };
        
        // Setup input handlers
        this.setupKeyboardHandlers();
        this.setupMouseHandlers();
        this.setupPointerLock();
    }
    
    /**
     * Set up keyboard event handlers
     */
    setupKeyboardHandlers() {
        // Key down event
        document.addEventListener('keydown', (event) => {
            // Get the key name
            let key = event.key.toLowerCase();
            
            // Handle special keys
            if (key === ' ') key = 'space';
            if (key === 'control') key = 'ctrl';
            if (key === 'shift') key = 'shift';
            if (key === 'alt') key = 'alt';
            
            // Set key state
            this.keys[key] = true;
            
            // Check if we have a mapping for this key
            if (this.keyMappings[key]) {
                // Publish input event
                this.world.messageBus.publish('input.keyDown', {
                    action: this.keyMappings[key],
                    key: key
                });
            }
        });
        
        // Key up event
        document.addEventListener('keyup', (event) => {
            // Get the key name
            let key = event.key.toLowerCase();
            
            // Handle special keys
            if (key === ' ') key = 'space';
            if (key === 'control') key = 'ctrl';
            if (key === 'shift') key = 'shift';
            if (key === 'alt') key = 'alt';
            
            // Set key state
            this.keys[key] = false;
            
            // Check if we have a mapping for this key
            if (this.keyMappings[key]) {
                // Publish input event
                this.world.messageBus.publish('input.keyUp', {
                    action: this.keyMappings[key],
                    key: key
                });
            }
        });
    }
    
    /**
     * Set up mouse event handlers
     */
    setupMouseHandlers() {
        // Mouse move event
        document.addEventListener('mousemove', (event) => {
            // Only track movement if pointer is locked
            if (this.pointerLocked) {
                this.mouseMovement.x += event.movementX || 0;
                this.mouseMovement.y += event.movementY || 0;
            }
        });
        
        // Mouse down event
        document.addEventListener('mousedown', (event) => {
            // Set button state
            switch (event.button) {
                case 0: // Left button
                    this.mouseButtons.left = true;
                    break;
                case 1: // Middle button
                    this.mouseButtons.middle = true;
                    break;
                case 2: // Right button
                    this.mouseButtons.right = true;
                    break;
            }
            
            // Publish input event
            this.world.messageBus.publish('input.mouseDown', {
                button: event.button,
                x: event.clientX,
                y: event.clientY
            });
        });
        
        // Mouse up event
        document.addEventListener('mouseup', (event) => {
            // Set button state
            switch (event.button) {
                case 0: // Left button
                    this.mouseButtons.left = false;
                    break;
                case 1: // Middle button
                    this.mouseButtons.middle = false;
                    break;
                case 2: // Right button
                    this.mouseButtons.right = false;
                    break;
            }
            
            // Publish input event
            this.world.messageBus.publish('input.mouseUp', {
                button: event.button,
                x: event.clientX,
                y: event.clientY
            });
        });
        
        // Prevent context menu
        document.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
    }
    
    /**
     * Set up pointer lock for first-person camera control
     */
    setupPointerLock() {
        // Handle pointer lock events
        document.addEventListener('pointerlockchange', () => {
            this.pointerLocked = document.pointerLockElement !== null;
            
            // Publish pointer lock state change
            this.world.messageBus.publish('input.pointerLockChange', {
                locked: this.pointerLocked
            });
        });
        
        // Handle pointer lock errors
        document.addEventListener('pointerlockerror', () => {
            console.error('Pointer lock error');
            this.pointerLocked = false;
            
            // Publish pointer lock error
            this.world.messageBus.publish('input.pointerLockError', {});
        });
        
        // Click event to request pointer lock
        document.addEventListener('click', () => {
            if (!this.pointerLocked) {
                document.body.requestPointerLock();
            }
        });
    }
    
    /**
     * Request pointer lock
     */
    requestPointerLock() {
        if (!this.pointerLocked) {
            document.body.requestPointerLock();
        }
    }
    
    /**
     * Exit pointer lock
     */
    exitPointerLock() {
        if (this.pointerLocked) {
            document.exitPointerLock();
        }
    }
    
    /**
     * Update system (process input)
     * @param {number} deltaTime Time since last update in seconds
     */
    update(deltaTime) {
        // Process mouse movement if pointer is locked
        if (this.pointerLocked && (this.mouseMovement.x !== 0 || this.mouseMovement.y !== 0)) {
            // Publish mouse movement event
            this.world.messageBus.publish('input.mouseMove', {
                movementX: this.mouseMovement.x,
                movementY: this.mouseMovement.y,
                deltaTime: deltaTime
            });
            
            // Reset movement
            this.mouseMovement.x = 0;
            this.mouseMovement.y = 0;
        }
        
        // Process key states
        this.processKeyStates();
    }
    
    /**
     * Process continuous key states (for held keys)
     */
    processKeyStates() {
        // Thrust control
        const thrust = {
            forward: this.keys['w'] || false,
            backward: this.keys['s'] || false,
            left: this.keys['a'] || false,
            right: this.keys['d'] || false,
            up: this.keys['q'] || false,
            down: this.keys['e'] || false,
            boost: this.keys['shift'] || false
        };
        
        // Publish thrust state
        this.world.messageBus.publish('input.thrust', thrust);
    }
}