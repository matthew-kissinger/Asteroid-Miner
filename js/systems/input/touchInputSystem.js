/**
 * TouchInputSystem - Handles touch input for mobile devices
 * 
 * Provides touchscreen controls for movement, rotation, and game actions.
 */

import { System } from '../../core/system.js';
import { MobileDetector } from '../../utils/mobileDetector.js';

export class TouchInputSystem extends System {
    constructor(world) {
        super(world);
        this.requiredComponents = []; // Doesn't require components on entities
        this.priority = 6; // Run just after InputSystem
        
        // Only initialize if we're on a mobile device
        this.isMobile = MobileDetector.isMobile();
        if (!this.isMobile) {
            console.log("TouchInputSystem: Not a mobile device, disabling system");
            this.enabled = false;
            return;
        }
        
        // Joystick instances
        this.leftJoystick = null;
        this.rightJoystick = null;
        
        // UI elements
        this.dockButton = null;
        this.mineButton = null;
        this.fireButton = null;
        this.targetButton = null;
        this.crosshair = null;
        
        // Control state
        this.thrustState = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            up: false,
            down: false,
            boost: false
        };
        
        // Environment state
        this.playerIsDocked = false;
        this.introActive = false;
        this.nearStargate = false;
        
        // Joystick thresholds
        this.threshold = 0.1;
        
        // Scene reference (set in initialize)
        this.scene = null;
        
        // Subscribe to game state events
        this.world.messageBus.subscribe('player.docked', this.handlePlayerDocked.bind(this));
        this.world.messageBus.subscribe('player.undocked', this.handlePlayerUndocked.bind(this));
        this.world.messageBus.subscribe('game.introStart', this.handleIntroStart.bind(this));
        this.world.messageBus.subscribe('game.introEnd', this.handleIntroEnd.bind(this));
        this.world.messageBus.subscribe('player.nearStargate', this.handleNearStargate.bind(this));
        this.world.messageBus.subscribe('player.leftStargate', this.handleLeftStargate.bind(this));
    }
    
    /**
     * Initialize the touch input system
     */
    initialize() {
        if (!this.isMobile || !this.enabled) return;
        
        console.log("TouchInputSystem: Initializing mobile touch controls");
        
        // Get scene reference from the world
        this.scene = this.world.scene;
        
        // Create UI elements
        this.createCrosshair();
        this.createJoystickZones();
        this.createActionButtons();
        
        // Load nipple.js library
        this.loadNippleJS().then(() => {
            console.log("TouchInputSystem: nipple.js loaded, initializing joysticks");
            this.initializeJoysticks();
        }).catch(err => {
            console.error('TouchInputSystem: Failed to load nipple.js:', err);
            this.world.messageBus.publish('system.error', {
                system: this,
                message: 'Failed to load touch controls library',
                error: err
            });
        });
    }
    
    /**
     * Handle player docked state
     */
    handlePlayerDocked() {
        this.playerIsDocked = true;
        this.hide();
    }
    
    /**
     * Handle player undocked state
     */
    handlePlayerUndocked() {
        this.playerIsDocked = false;
        this.show();
    }
    
    /**
     * Handle intro sequence start
     */
    handleIntroStart() {
        this.introActive = true;
        this.hide();
    }
    
    /**
     * Handle intro sequence end
     */
    handleIntroEnd() {
        this.introActive = false;
        if (!this.playerIsDocked) {
            this.show();
        }
    }
    
    /**
     * Handle player near stargate
     */
    handleNearStargate() {
        this.nearStargate = true;
        this.showDockButton();
    }
    
    /**
     * Handle player left stargate
     */
    handleLeftStargate() {
        this.nearStargate = false;
        this.hideDockButton();
    }
    
    /**
     * Create a crosshair in the center of the screen
     */
    createCrosshair() {
        // Create a small crosshair in the center of the screen
        const crosshair = document.createElement('div');
        crosshair.id = 'mobile-crosshair';
        crosshair.style.position = 'absolute';
        crosshair.style.top = '50%';
        crosshair.style.left = '50%';
        crosshair.style.transform = 'translate(-50%, -50%)';
        crosshair.style.width = '10px';
        crosshair.style.height = '10px';
        crosshair.style.pointerEvents = 'none';
        crosshair.style.zIndex = '999';
        
        // Create crosshair shape with a plus sign
        crosshair.innerHTML = `
            <div style="position: absolute; top: 50%; left: 0; width: 100%; height: 1px; background-color: rgba(120, 220, 232, 0.8);"></div>
            <div style="position: absolute; top: 0; left: 50%; width: 1px; height: 100%; background-color: rgba(120, 220, 232, 0.8);"></div>
            <div style="position: absolute; top: 50%; left: 50%; width: 3px; height: 3px; background-color: rgba(120, 220, 232, 0.8); border-radius: 50%; transform: translate(-50%, -50%);"></div>
        `;
        
        document.body.appendChild(crosshair);
        this.crosshair = crosshair;
    }
    
    /**
     * Load the nipple.js library
     * @returns {Promise} Promise that resolves when library is loaded
     */
    loadNippleJS() {
        return new Promise((resolve, reject) => {
            // Check if nipple.js is already loaded
            if (window.nipplejs) {
                resolve();
                return;
            }
            
            // Create script element
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/nipplejs/0.10.1/nipplejs.min.js';
            script.async = true;
            
            // Set up event handlers
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load nipple.js'));
            
            // Add script to document
            document.head.appendChild(script);
        });
    }
    
    /**
     * Create joystick zones
     */
    createJoystickZones() {
        // Create left joystick zone (thrust control)
        const leftJoystickZone = document.createElement('div');
        leftJoystickZone.id = 'leftJoystickZone';
        leftJoystickZone.style.position = 'absolute';
        leftJoystickZone.style.bottom = '50px';
        leftJoystickZone.style.left = '50px';
        leftJoystickZone.style.width = '100px';
        leftJoystickZone.style.height = '100px';
        leftJoystickZone.style.zIndex = '1000';
        document.body.appendChild(leftJoystickZone);
        
        // Create right joystick zone (rotation control)
        const rightJoystickZone = document.createElement('div');
        rightJoystickZone.id = 'rightJoystickZone';
        rightJoystickZone.style.position = 'absolute';
        rightJoystickZone.style.bottom = '50px';
        rightJoystickZone.style.right = '50px';
        rightJoystickZone.style.width = '100px';
        rightJoystickZone.style.height = '100px';
        rightJoystickZone.style.zIndex = '1000';
        document.body.appendChild(rightJoystickZone);
    }
    
    /**
     * Create action buttons
     */
    createActionButtons() {
        // Create a container for left side action buttons
        const leftActionButtonsContainer = document.createElement('div');
        leftActionButtonsContainer.id = 'mobile-action-buttons-left';
        leftActionButtonsContainer.style.position = 'absolute';
        leftActionButtonsContainer.style.bottom = '170px';
        leftActionButtonsContainer.style.left = '20px';
        leftActionButtonsContainer.style.display = 'flex';
        leftActionButtonsContainer.style.flexDirection = 'column';
        leftActionButtonsContainer.style.gap = '15px';
        leftActionButtonsContainer.style.zIndex = '1000';
        document.body.appendChild(leftActionButtonsContainer);
        
        // Create a container for right side action buttons
        const rightActionButtonsContainer = document.createElement('div');
        rightActionButtonsContainer.id = 'mobile-action-buttons-right';
        rightActionButtonsContainer.style.position = 'absolute';
        rightActionButtonsContainer.style.bottom = '170px';
        rightActionButtonsContainer.style.right = '20px';
        rightActionButtonsContainer.style.display = 'flex';
        rightActionButtonsContainer.style.flexDirection = 'column';
        rightActionButtonsContainer.style.gap = '15px';
        rightActionButtonsContainer.style.zIndex = '1000';
        document.body.appendChild(rightActionButtonsContainer);
        
        // Create fire button (on left side)
        this.fireButton = this.createActionButton(leftActionButtonsContainer, 'FIRE', 'rgba(255, 80, 80, 0.8)');
        this.addButtonEvents(this.fireButton, this.handleFiringStart.bind(this), this.handleFiringEnd.bind(this));
        
        // Create mine button (on left side)
        this.mineButton = this.createActionButton(leftActionButtonsContainer, 'MINE', 'rgba(120, 220, 232, 0.8)');
        this.addButtonEvents(this.mineButton, this.handleMiningStart.bind(this), this.handleMiningEnd.bind(this));
        
        // Create target button (on right side)
        this.targetButton = this.createActionButton(rightActionButtonsContainer, 'TARGET', 'rgba(255, 215, 0, 0.8)');
        this.addButtonEvents(this.targetButton, this.handleTargeting.bind(this));
        
        // Create dock button (only shown when near stargate)
        this.dockButton = this.createActionButton(null, 'DOCK', 'rgba(51, 153, 255, 0.8)');
        this.dockButton.style.position = 'absolute';
        this.dockButton.style.top = '50%';
        this.dockButton.style.left = '50%';
        this.dockButton.style.transform = 'translate(-50%, -50%)';
        this.dockButton.style.width = '100px';  // Make dock button larger
        this.dockButton.style.height = '100px'; // Make dock button larger
        this.dockButton.style.fontSize = '20px'; // Larger text
        this.dockButton.style.boxShadow = '0 0 25px rgba(51, 153, 255, 0.8)'; // Stronger glow
        this.dockButton.style.display = 'none';
        this.addButtonEvents(this.dockButton, this.handleDocking.bind(this));
        document.body.appendChild(this.dockButton);
    }
    
    /**
     * Create an action button
     * @param {HTMLElement} parent Parent element
     * @param {string} text Button text
     * @param {string} color Button color
     * @returns {HTMLElement} Button element
     */
    createActionButton(parent, text, color) {
        const button = document.createElement('div');
        button.className = 'mobile-action-button';
        button.textContent = text;
        button.style.width = '60px';
        button.style.height = '60px'; 
        button.style.borderRadius = '50%';
        button.style.backgroundColor = 'rgba(10, 20, 30, 0.7)';
        button.style.border = `2px solid ${color}`;
        button.style.color = color;
        button.style.display = 'flex';
        button.style.justifyContent = 'center';
        button.style.alignItems = 'center';
        button.style.fontFamily = '"Rajdhani", sans-serif';
        button.style.fontSize = '16px';
        button.style.fontWeight = 'bold';
        button.style.boxShadow = `0 0 10px ${color}`;
        button.style.userSelect = 'none';
        button.style.touchAction = 'manipulation';
        button.style.cursor = 'pointer';
        
        // Add hardware acceleration for better performance on mobile
        button.style.transform = 'translateZ(0)';
        button.style.webkitTapHighlightColor = 'transparent';
        button.style.backfaceVisibility = 'hidden';
        
        if (parent) {
            parent.appendChild(button);
        }
        
        return button;
    }
    
    /**
     * Add event handlers to a button
     * @param {HTMLElement} button The button element
     * @param {Function} startHandler Handler for press start
     * @param {Function} endHandler Handler for press end
     */
    addButtonEvents(button, startHandler, endHandler = null) {
        let isPressed = false;
        let longPressTimer = null;
        const LONG_PRESS_DURATION = 500; // ms

        // Use pointer events instead of touch events
        button.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            isPressed = true;
            button.classList.add('pressed');
            
            if (startHandler) {
                startHandler();
            }

            // Start long press timer
            longPressTimer = setTimeout(() => {
                if (isPressed) {
                    this.world.messageBus.publish('input.longPress', {
                        buttonId: button.id,
                        duration: LONG_PRESS_DURATION
                    });
                }
            }, LONG_PRESS_DURATION);
        });

        button.addEventListener('pointerup', (e) => {
            e.preventDefault();
            isPressed = false;
            button.classList.remove('pressed');
            
            if (endHandler) {
                endHandler();
            }

            // Clear long press timer
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        });

        button.addEventListener('pointercancel', (e) => {
            e.preventDefault();
            isPressed = false;
            button.classList.remove('pressed');
            
            if (endHandler) {
                endHandler();
            }

            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        });

        // Prevent context menu on long press
        button.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    
    /**
     * Initialize joysticks using nipple.js
     */
    initializeJoysticks() {
        if (!window.nipplejs) {
            console.error("TouchInputSystem: nipple.js not loaded");
            return;
        }
        
        // Create left joystick (movement)
        this.leftJoystick = window.nipplejs.create({
            zone: document.getElementById('leftJoystickZone'),
            mode: 'static',
            position: { left: '50%', top: '50%' },
            color: 'rgba(86, 182, 194, 0.5)',
            size: 100
        });
        
        // Create right joystick (rotation)
        this.rightJoystick = window.nipplejs.create({
            zone: document.getElementById('rightJoystickZone'),
            mode: 'static',
            position: { left: '50%', top: '50%' },
            color: 'rgba(86, 182, 194, 0.5)',
            size: 100
        });
        
        // Setup event handlers
        this.setupJoystickEvents();
    }
    
    /**
     * Setup joystick event handlers
     */
    setupJoystickEvents() {
        // Left joystick (movement)
        this.leftJoystick.on('move', (evt, data) => {
            this.handleThrustJoystick(data);
        });
        
        this.leftJoystick.on('end', () => {
            this.resetThrust();
        });
        
        // Right joystick (rotation)
        this.rightJoystick.on('move', (evt, data) => {
            this.handleRotationJoystick(data);
        });
    }
    
    /**
     * Handle thrust joystick input
     * @param {Object} data Joystick data from nipplejs
     */
    handleThrustJoystick(data) {
        if (!this.enabled) return;

        const angle = data.angle.radian;
        const force = Math.min(data.force / 50.0, 1.0); // Normalize force to 0-1

        // Calculate thrust vector components
        const thrustX = Math.cos(angle) * force;
        const thrustY = Math.sin(angle) * force;

        // Update thrust state
        this.thrustState = {
            forward: thrustY > this.threshold,
            backward: thrustY < -this.threshold,
            left: thrustX < -this.threshold,
            right: thrustX > this.threshold,
            boost: force > 0.8 // Enable boost if force is >80%
        };

        // Publish thrust state
        this.world.messageBus.publish('input.thrust', this.thrustState);
    }
    
    /**
     * Handle rotation joystick input
     * @param {Object} data Joystick data from nipplejs
     */
    handleRotationJoystick(data) {
        if (!this.enabled) return;

        const angle = data.angle.radian;
        const force = Math.min(data.force / 50.0, 1.0);

        // Calculate rotation amount
        const rotationAmount = force * Math.sign(Math.sin(angle));

        // Publish rotation input
        this.world.messageBus.publish('input.rotate', {
            amount: rotationAmount,
            source: 'touch'
        });
    }
    
    /**
     * Reset thrust state when joystick is released
     */
    resetThrust() {
        this.thrustState = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            up: false,
            down: false,
            boost: false
        };

        // Publish reset state
        this.world.messageBus.publish('input.thrust', this.thrustState);
    }
    
    /**
     * Handle mining button press
     */
    handleMiningStart() {
        if (!this.enabled) return;
        
        this.world.messageBus.publish('mining.start', {
            source: 'touch'
        });
        
        // Add visual feedback
        this.mineButton.classList.add('active');
    }
    
    /**
     * Handle mining button release
     */
    handleMiningEnd() {
        if (!this.enabled) return;
        
        this.world.messageBus.publish('mining.stop', {
            source: 'touch'
        });
        
        // Remove visual feedback
        this.mineButton.classList.remove('active');
    }
    
    /**
     * Handle weapon firing button press
     */
    handleFiringStart() {
        if (!this.enabled) return;
        
        this.world.messageBus.publish('weapon.startFiring', {
            source: 'touch',
            primary: true
        });
        
        // Add visual feedback
        this.fireButton.classList.add('active');
    }
    
    /**
     * Handle weapon firing button release
     */
    handleFiringEnd() {
        if (!this.enabled) return;
        
        this.world.messageBus.publish('weapon.stopFiring', {
            source: 'touch',
            primary: true
        });
        
        // Remove visual feedback
        this.fireButton.classList.remove('active');
    }
    
    /**
     * Handle docking button press
     */
    handleDocking() {
        if (this.introActive) return;
        
        // Flash the button
        if (this.dockButton) {
            this.dockButton.style.backgroundColor = 'rgba(51, 153, 255, 0.3)';
            setTimeout(() => {
                if (this.dockButton) {
                    this.dockButton.style.backgroundColor = 'rgba(10, 20, 30, 0.7)';
                }
            }, 100);
        }
        
        // Publish docking request event
        this.world.messageBus.publish('player.requestDock', {});
    }
    
    /**
     * Handle targeting button press
     */
    handleTargeting() {
        if (this.playerIsDocked || this.introActive) return;
        
        // Flash the button
        if (this.targetButton) {
            this.targetButton.style.backgroundColor = 'rgba(255, 215, 0, 0.3)';
            setTimeout(() => {
                if (this.targetButton) {
                    this.targetButton.style.backgroundColor = 'rgba(10, 20, 30, 0.7)';
                }
            }, 100);
        }
        
        // Publish targeting toggle event
        this.world.messageBus.publish('input.keyDown', {
            action: 'targeting.toggle',
            key: 't'
        });
    }
    
    /**
     * Show dock button
     */
    showDockButton() {
        if (this.dockButton && !this.playerIsDocked && !this.introActive) {
            this.dockButton.style.display = 'flex';
            
            // Add a pulsing animation
            this.dockButton.style.animation = 'pulseDockButton 2s infinite';
            
            // Add keyframe animation if it doesn't exist
            if (!document.getElementById('dock-button-animation')) {
                const style = document.createElement('style');
                style.id = 'dock-button-animation';
                style.innerHTML = `
                    @keyframes pulseDockButton {
                        0% { transform: translate(-50%, -50%) scale(1); box-shadow: 0 0 25px rgba(51, 153, 255, 0.8); }
                        50% { transform: translate(-50%, -50%) scale(1.1); box-shadow: 0 0 40px rgba(51, 153, 255, 0.9); }
                        100% { transform: translate(-50%, -50%) scale(1); box-shadow: 0 0 25px rgba(51, 153, 255, 0.8); }
                    }
                `;
                document.head.appendChild(style);
            }
        }
    }
    
    /**
     * Hide dock button
     */
    hideDockButton() {
        if (this.dockButton) {
            this.dockButton.style.display = 'none';
        }
    }
    
    /**
     * Hide all touch controls
     */
    hide() {
        // Hide joystick zones
        const leftJoystickZone = document.getElementById('leftJoystickZone');
        const rightJoystickZone = document.getElementById('rightJoystickZone');
        
        if (leftJoystickZone) leftJoystickZone.style.display = 'none';
        if (rightJoystickZone) rightJoystickZone.style.display = 'none';
        
        // Hide action buttons
        const leftActionButtons = document.getElementById('mobile-action-buttons-left');
        const rightActionButtons = document.getElementById('mobile-action-buttons-right');
        
        if (leftActionButtons) leftActionButtons.style.display = 'none';
        if (rightActionButtons) rightActionButtons.style.display = 'none';
        
        // Hide dock button
        this.hideDockButton();
    }
    
    /**
     * Show all touch controls
     */
    show() {
        if (this.playerIsDocked || this.introActive) return;
        
        // Show joystick zones
        const leftJoystickZone = document.getElementById('leftJoystickZone');
        const rightJoystickZone = document.getElementById('rightJoystickZone');
        
        if (leftJoystickZone) leftJoystickZone.style.display = 'block';
        if (rightJoystickZone) rightJoystickZone.style.display = 'block';
        
        // Show action buttons
        const leftActionButtons = document.getElementById('mobile-action-buttons-left');
        const rightActionButtons = document.getElementById('mobile-action-buttons-right');
        
        if (leftActionButtons) leftActionButtons.style.display = 'flex';
        if (rightActionButtons) rightActionButtons.style.display = 'flex';
        
        // Show dock button if near stargate
        if (this.nearStargate) {
            this.showDockButton();
        }
    }
    
    /**
     * Update system
     * @param {number} deltaTime Time since last update in seconds
     */
    update(deltaTime) {
        // Skip updates if not mobile or system disabled
        if (!this.isMobile || !this.enabled) return;
        
        // Skip most updates during intro or when docked
        if (this.introActive || this.playerIsDocked) return;
        
        // Update doesn't need to do much since joysticks are event-driven
        // However, we could add periodic checks here if needed
    }
    
    /**
     * Clean up resources when system is destroyed
     */
    onDestroyed() {
        // Clean up joysticks
        if (this.leftJoystick) {
            this.leftJoystick.destroy();
        }
        
        if (this.rightJoystick) {
            this.rightJoystick.destroy();
        }
        
        // Remove DOM elements
        const elements = [
            document.getElementById('leftJoystickZone'),
            document.getElementById('rightJoystickZone'),
            document.getElementById('mobile-action-buttons-left'),
            document.getElementById('mobile-action-buttons-right'),
            this.dockButton,
            this.crosshair
        ];
        
        elements.forEach(element => {
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
        
        // Remove animation style
        const animStyle = document.getElementById('dock-button-animation');
        if (animStyle && animStyle.parentNode) {
            animStyle.parentNode.removeChild(animStyle);
        }
    }
} 