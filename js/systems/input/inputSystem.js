/**
 * InputSystem - Handles keyboard and mouse input
 * 
 * Translates user input into game actions via the message bus.
 */

import { System } from '../../core/system.js';
import { MobileDetector } from '../../utils/mobileDetector.js';

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
        this.isMobile = MobileDetector.isMobile();
        
        // Environment state
        this.playerIsDocked = false;
        this.introActive = false;
        
        // Key mappings
        this.keyMappings = {
            'w': 'thrust.forward',
            's': 'thrust.backward',
            'a': 'thrust.left',
            'd': 'thrust.right',
            'q': 'thrust.up',
            'e': 'thrust.down',
            'shift': 'thrust.boost',
            'r': 'mining.toggle',
            'tab': 'targeting.cycle',
            'escape': 'ui.menu',
            'f': 'weapon.cycle',
            't': 'targeting.toggle',
            'm': 'audio.toggleMute'
        };
        
        // Setup input handlers based on device type
        if (!this.isMobile) {
            this.setupKeyboardHandlers();
            this.setupMouseHandlers();
            this.setupPointerLock();
        } else {
            // Mobile will use a different input system (TouchInputSystem)
            console.log("Mobile device detected, using touch input system");
        }
        
        // Subscribe to game state events
        this.world.messageBus.subscribe('player.docked', this.handlePlayerDocked.bind(this));
        this.world.messageBus.subscribe('player.undocked', this.handlePlayerUndocked.bind(this));
        this.world.messageBus.subscribe('game.introStart', this.handleIntroStart.bind(this));
        this.world.messageBus.subscribe('game.introEnd', this.handleIntroEnd.bind(this));
    }
    
    /**
     * Handle player docked state
     */
    handlePlayerDocked() {
        this.playerIsDocked = true;
        this.exitPointerLock();
    }
    
    /**
     * Handle player undocked state
     */
    handlePlayerUndocked() {
        this.playerIsDocked = false;
    }
    
    /**
     * Handle intro sequence start
     */
    handleIntroStart() {
        this.introActive = true;
        this.exitPointerLock();
    }
    
    /**
     * Handle intro sequence end
     */
    handleIntroEnd() {
        this.introActive = false;
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
            
            // Skip most inputs when docked or during intro
            if (this.playerIsDocked || this.introActive) {
                // Only allow UI-related keys when docked
                if (key === 'escape' || key === 'tab' || key === 'm') {
                    if (this.keyMappings[key]) {
                        this.world.messageBus.publish('input.keyDown', {
                            action: this.keyMappings[key],
                            key: key
                        });
                    }
                }
                
                // Force reset all thruster keys during intro
                if (this.introActive) {
                    this.resetThrustKeys();
                }
                
                return;
            }
            
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
     * Reset all thrust-related keys
     * Used during intro sequence to prevent stuck keys
     */
    resetThrustKeys() {
        const thrustKeys = ['w', 's', 'a', 'd', 'q', 'e', 'shift'];
        for (const key of thrustKeys) {
            this.keys[key] = false;
        }
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
            // Skip when docked or intro
            if (this.playerIsDocked || this.introActive) return;
            
            // Set button state
            switch (event.button) {
                case 0: // Left button
                    this.mouseButtons.left = true;
                    this.world.messageBus.publish('weapon.startFiring', { primary: true });
                    break;
                case 1: // Middle button
                    this.mouseButtons.middle = true;
                    break;
                case 2: // Right button
                    this.mouseButtons.right = true;
                    this.world.messageBus.publish('weapon.startFiring', { secondary: true });
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
                    this.world.messageBus.publish('weapon.stopFiring', { primary: true });
                    break;
                case 1: // Middle button
                    this.mouseButtons.middle = false;
                    break;
                case 2: // Right button
                    this.mouseButtons.right = false;
                    this.world.messageBus.publish('weapon.stopFiring', { secondary: true });
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
        // Get the canvas element
        const canvas = document.querySelector('canvas');
        if (!canvas) {
            console.error("InputSystem: Could not find canvas element for pointer lock");
            return;
        }
        
        // Add instructions for pointer lock
        this.addPointerLockInstructions();
        
        // Request pointer lock when clicking on the canvas
        canvas.addEventListener('click', () => {
            if (!this.pointerLocked && !this.playerIsDocked && !this.introActive) {
                canvas.requestPointerLock();
            }
        });
        
        // Handle pointer lock events
        document.addEventListener('pointerlockchange', () => {
            this.pointerLocked = document.pointerLockElement === canvas;
            
            // Hide/show instructions
            const instructions = document.getElementById('pointer-lock-instructions');
            if (instructions) {
                instructions.style.display = this.pointerLocked ? 'none' : 'block';
            }
            
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
    }
    
    /**
     * Add instructions for pointer lock to the DOM
     */
    addPointerLockInstructions() {
        // Add instructions for pointer lock if not already present
        if (!document.getElementById('pointer-lock-instructions')) {
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
        }
    }
    
    /**
     * Request pointer lock
     */
    requestPointerLock() {
        if (!this.pointerLocked && !this.playerIsDocked && !this.introActive) {
            const canvas = document.querySelector('canvas');
            if (canvas) {
                canvas.requestPointerLock();
            }
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
     * Check if pointer is locked
     */
    isLocked() {
        return this.pointerLocked;
    }
    
    /**
     * Update system (process input)
     * @param {number} deltaTime Time since last update in seconds
     */
    update(deltaTime) {
        // Skip most updates during intro or when docked
        if (this.introActive) {
            // Force reset thrust values during intro
            const thrust = {
                forward: false,
                backward: false,
                left: false,
                right: false,
                up: false,
                down: false,
                boost: false
            };
            this.world.messageBus.publish('input.thrust', thrust);
            return;
        }
        
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
        
        // Skip thrust processing when docked
        if (!this.playerIsDocked) {
            // Process key states
            this.processKeyStates();
        }
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