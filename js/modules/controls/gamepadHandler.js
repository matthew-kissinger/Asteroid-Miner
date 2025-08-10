// gamepadHandler.js - Handles gamepad/controller input
// Supports Xbox, PlayStation, and generic controllers

export class GamepadHandler {
    constructor(spaceship, physics, controls) {
        this.spaceship = spaceship;
        this.physics = physics;
        this.controls = controls; // Reference to main controls for mining/targeting/etc
        
        // Gamepad state
        this.gamepads = {};
        this.activeGamepadIndex = null;
        this.enabled = true;
        this.vibrationEnabled = true;
        
        // Dead zones for analog sticks (prevents drift)
        this.deadZone = 0.15;
        this.triggerDeadZone = 0.15; // Increased to prevent accidental activation
        
        // Sensitivity settings
        this.lookSensitivity = 1.0;  // Right stick look sensitivity (reduced from 2.0)
        this.movementSensitivity = 1.0;  // Left stick movement sensitivity
        
        // Smoothing for accurate aiming
        this.rotationSmoothing = {
            targetX: 0,
            targetY: 0,
            currentX: 0,
            currentY: 0,
            smoothingFactor: 0.15  // Lower = smoother, higher = more responsive
        }
        
        // Button mapping (Xbox layout as default)
        this.buttonMap = {
            // Face buttons
            A: 0,          // Jump/Accept
            B: 1,          // Cancel/Back
            X: 2,          // Reload/Interact
            Y: 3,          // Switch weapon
            
            // Bumpers and triggers
            LB: 4,         // Previous target
            RB: 5,         // Next target
            LT: 6,         // Mining laser
            RT: 7,         // Fire weapon
            
            // Special buttons
            BACK: 8,       // Menu/Settings
            START: 9,      // Pause
            L3: 10,        // Left stick click - boost
            R3: 11,        // Right stick click - toggle targeting
            
            // D-Pad
            DPAD_UP: 12,   // Deploy turret
            DPAD_DOWN: 13, // Deploy shield
            DPAD_LEFT: 14, // Previous weapon
            DPAD_RIGHT: 15 // Next weapon
        };
        
        // Axis mapping
        this.axisMap = {
            LEFT_STICK_X: 0,   // Strafe left/right
            LEFT_STICK_Y: 1,   // Move forward/backward
            RIGHT_STICK_X: 2,  // Look left/right (yaw)
            RIGHT_STICK_Y: 3,  // Look up/down (pitch)
            LT: 4,             // Left trigger (some controllers)
            RT: 5              // Right trigger (some controllers)
        };
        
        // Button state tracking (for press/release detection)
        this.buttonStates = {};
        this.previousButtonStates = {};
        
        // Trigger states for firing
        this.wasFiring = false;
        
        // Initialize controller support
        this.init();
        
        // Debug mode for testing
        this.debugMode = false; // Disabled now that we found the correct mapping
        this.debugDisplay = null;
    }
    
    init() {
        // Check for gamepad support
        if (!('getGamepads' in navigator)) {
            console.warn('Gamepad API not supported in this browser');
            return;
        }
        
        // Listen for gamepad connections
        window.addEventListener('gamepadconnected', (e) => {
            console.log(`Gamepad connected: ${e.gamepad.id} (index: ${e.gamepad.index})`);
            this.onGamepadConnected(e.gamepad);
        });
        
        // Listen for gamepad disconnections
        window.addEventListener('gamepaddisconnected', (e) => {
            console.log(`Gamepad disconnected: ${e.gamepad.id} (index: ${e.gamepad.index})`);
            this.onGamepadDisconnected(e.gamepad);
        });
        
        // Check for already connected gamepads
        this.scanForGamepads();
        
        console.log('Gamepad handler initialized - ready for controller input');
    }
    
    scanForGamepads() {
        const gamepads = navigator.getGamepads();
        for (let i = 0; i < gamepads.length; i++) {
            if (gamepads[i]) {
                this.onGamepadConnected(gamepads[i]);
            }
        }
    }
    
    onGamepadConnected(gamepad) {
        this.gamepads[gamepad.index] = gamepad;
        
        // Set as active if no active gamepad
        if (this.activeGamepadIndex === null) {
            this.activeGamepadIndex = gamepad.index;
            this.showNotification(`Controller connected: ${this.getGamepadName(gamepad)}`);
            
            // Vibrate to confirm connection
            this.vibrate(0.3, 200);
        }
    }
    
    onGamepadDisconnected(gamepad) {
        delete this.gamepads[gamepad.index];
        
        // If this was the active gamepad, find another
        if (this.activeGamepadIndex === gamepad.index) {
            this.activeGamepadIndex = null;
            this.showNotification('Controller disconnected');
            
            // Try to find another connected gamepad
            for (let index in this.gamepads) {
                this.activeGamepadIndex = parseInt(index);
                this.showNotification(`Switched to controller: ${this.getGamepadName(this.gamepads[index])}`);
                break;
            }
        }
    }
    
    getGamepadName(gamepad) {
        // Simplify gamepad names for display
        const name = gamepad.id.toLowerCase();
        if (name.includes('xbox')) return 'Xbox Controller';
        if (name.includes('playstation') || name.includes('dualshock')) return 'PlayStation Controller';
        if (name.includes('switch') || name.includes('pro controller')) return 'Switch Pro Controller';
        return 'Generic Controller';
    }
    
    update(deltaTime) {
        if (!this.enabled || this.activeGamepadIndex === null) return;
        
        // Get fresh gamepad state (must call this each frame)
        const gamepads = navigator.getGamepads();
        const gamepad = gamepads[this.activeGamepadIndex];
        
        if (!gamepad) return;
        
        // Update debug display if enabled
        if (this.debugMode) {
            this.updateDebugDisplay(gamepad);
        }
        
        // Skip input during intro sequence or when docked
        if ((window.game && window.game.introSequenceActive) || this.spaceship.isDocked) {
            // Reset all controls
            this.resetControls();
            return;
        }
        
        // Store previous button states for edge detection
        this.previousButtonStates = {...this.buttonStates};
        
        // Update current button states
        gamepad.buttons.forEach((button, index) => {
            this.buttonStates[index] = button.pressed;
        });
        
        // Handle movement (left stick)
        this.handleMovement(gamepad);
        
        // Handle camera look (right stick)
        this.handleCameraLook(gamepad, deltaTime);
        
        // Handle buttons
        this.handleButtons(gamepad);
        
        // Handle triggers
        this.handleTriggers(gamepad);
    }
    
    handleMovement(gamepad) {
        // Left stick - movement
        const leftX = this.applyDeadZone(gamepad.axes[this.axisMap.LEFT_STICK_X]);
        const leftY = this.applyDeadZone(gamepad.axes[this.axisMap.LEFT_STICK_Y]);
        
        // Reset movement
        this.spaceship.thrust.forward = false;
        this.spaceship.thrust.backward = false;
        this.spaceship.thrust.left = false;
        this.spaceship.thrust.right = false;
        
        // Apply movement based on stick position
        // Y-axis is inverted (up is negative)
        if (leftY < -0.1) {
            this.spaceship.thrust.forward = true;
            this.spaceship.thrustPower = Math.abs(leftY); // Variable thrust
        } else if (leftY > 0.1) {
            this.spaceship.thrust.backward = true;
            this.spaceship.thrustPower = Math.abs(leftY);
        }
        
        // X-axis strafing
        // FIXED: thrust.left actually moves RIGHT, thrust.right moves LEFT in physics
        // So we need to reverse the mapping
        if (leftX < -0.1) {
            this.spaceship.thrust.right = true; // Left stick left = move left (uses right thrust)
            this.spaceship.strafePower = Math.abs(leftX);
        } else if (leftX > 0.1) {
            this.spaceship.thrust.left = true; // Right stick right = move right (uses left thrust)
            this.spaceship.strafePower = Math.abs(leftX);
        }
        
        // Left stick click - boost
        if (gamepad.buttons[this.buttonMap.L3].pressed) {
            this.spaceship.thrust.boost = true;
        } else {
            this.spaceship.thrust.boost = false;
        }
    }
    
    handleCameraLook(gamepad, deltaTime) {
        // YOUR CONTROLLER: Right stick is on axes 3 (horizontal) and 4 (vertical)
        const rightStickX = this.applyDeadZone(gamepad.axes[3] || 0); // Horizontal movement
        const rightStickY = this.applyDeadZone(gamepad.axes[4] || 0); // Vertical movement
        
        // Apply response curve for finer control
        // This makes small movements even smaller (for precision aiming)
        // and keeps large movements responsive (for quick turns)
        const applyCurve = (value) => {
            const sign = Math.sign(value);
            const abs = Math.abs(value);
            // Quadratic curve for the first 50%, linear for the rest
            if (abs < 0.5) {
                return sign * abs * abs * 2; // Quadratic (slower near center)
            } else {
                return sign * (abs * 0.5 + 0.25); // Linear (faster at edges)
            }
        };
        
        const curvedX = applyCurve(rightStickX);
        const curvedY = applyCurve(rightStickY);
        
        // Update target rotation speeds
        const baseSpeed = 0.0015; // Reduced base speed for better control
        this.rotationSmoothing.targetX = curvedX * baseSpeed * this.lookSensitivity * 60;
        this.rotationSmoothing.targetY = curvedY * baseSpeed * this.lookSensitivity * 60;
        
        // Apply exponential smoothing for smoother rotation
        const smoothing = this.rotationSmoothing.smoothingFactor;
        this.rotationSmoothing.currentX += (this.rotationSmoothing.targetX - this.rotationSmoothing.currentX) * smoothing;
        this.rotationSmoothing.currentY += (this.rotationSmoothing.targetY - this.rotationSmoothing.currentY) * smoothing;
        
        // Only update rotation if there's meaningful input
        if (Math.abs(this.rotationSmoothing.currentX) > 0.0001 || Math.abs(this.rotationSmoothing.currentY) > 0.0001) {
            this.physics.updateRotation(this.rotationSmoothing.currentX, this.rotationSmoothing.currentY);
        } else {
            // Reset smoothing when stick is centered
            this.rotationSmoothing.currentX = 0;
            this.rotationSmoothing.currentY = 0;
        }
    }
    
    handleButtons(gamepad) {
        // A button - Toggle targeting system
        if (this.wasButtonPressed(this.buttonMap.A)) {
            if (this.controls && this.controls.targetingSystem) {
                this.controls.targetingSystem.toggleLockOn();
            }
        }
        
        // B button - Toggle mining (tap to start/stop)
        if (this.wasButtonPressed(this.buttonMap.B)) {
            if (this.controls && this.controls.miningSystem && this.controls.targetingSystem) {
                if (this.controls.miningSystem.isMining) {
                    // Currently mining - stop it
                    this.controls.miningSystem.stopMining();
                } else {
                    // Not mining - try to start
                    const target = this.controls.targetingSystem.getCurrentTarget();
                    if (target) {
                        this.controls.miningSystem.setTargetAsteroid(target);
                        this.controls.miningSystem.startMining();
                    }
                }
            }
        }
        
        // X button - Dock when near stargate
        if (this.wasButtonPressed(this.buttonMap.X)) {
            if (this.controls && this.controls.dockingSystem && this.controls.dockingSystem.canDock()) {
                this.controls.dockingSystem.initiateDocking();
            }
        }
        
        // Y button - Deploy turret
        if (this.wasButtonPressed(this.buttonMap.Y)) {
            if (window.game && window.game.deployTurret) {
                window.game.deployTurret();
            }
        }
        
        // Bumpers - Cycle targets
        if (this.wasButtonPressed(this.buttonMap.LB)) {
            // Previous target
            if (this.controls && this.controls.targetingSystem) {
                this.controls.targetingSystem.cycleLockOnTarget(-1);
            }
        }
        
        if (this.wasButtonPressed(this.buttonMap.RB)) {
            // Next target
            if (this.controls && this.controls.targetingSystem) {
                const target = this.controls.targetingSystem.cycleLockOnTarget(1);
                if (target && this.controls.miningSystem) {
                    this.controls.miningSystem.setTargetAsteroid(target);
                }
            }
        }
        
        // Right stick click - Could be used for something else later
        
        // D-Pad for quick actions
        if (this.wasButtonPressed(this.buttonMap.DPAD_UP)) {
            // Deploy turret
            if (window.game && window.game.deployTurret) {
                window.game.deployTurret();
            }
        }
        
        if (this.wasButtonPressed(this.buttonMap.DPAD_DOWN)) {
            // Deploy shield drone
            if (window.game && window.game.deployShieldDrone) {
                window.game.deployShieldDrone();
            }
        }
        
        // Start button - Pause/Menu
        if (this.wasButtonPressed(this.buttonMap.START)) {
            if (window.game && window.game.togglePause) {
                window.game.togglePause();
            }
        }
    }
    
    handleTriggers(gamepad) {
        // Check triggers - most controllers use buttons 6 and 7
        let rtValue = 0;
        let ltValue = 0;
        
        // Standard button mapping for triggers
        if (gamepad.buttons[7]) {
            rtValue = gamepad.buttons[7].value;
        }
        if (gamepad.buttons[6]) {
            ltValue = gamepad.buttons[6].value;
        }
        
        // Some controllers report triggers as axes 4 and 5
        const axis4 = gamepad.axes[4] || 0;
        const axis5 = gamepad.axes[5] || 0;
        if (rtValue < 0.01 && Math.abs(axis5) > 0.01) {
            rtValue = (axis5 + 1) / 2; // Convert from -1,1 to 0,1
        }
        if (ltValue < 0.01 && Math.abs(axis4) > 0.01) {
            ltValue = (axis4 + 1) / 2; // Convert from -1,1 to 0,1
        }
        
        // RIGHT TRIGGER - Fire weapons
        if (rtValue > this.triggerDeadZone) {
            if (!this.wasFiring) {
                // Start firing
                if (window.game && window.game.combat) {
                    window.game.combat.setFiring(true);
                    this.wasFiring = true;
                }
            }
        } else {
            if (this.wasFiring) {
                // Stop firing
                if (window.game && window.game.combat) {
                    window.game.combat.setFiring(false);
                    this.wasFiring = false;
                }
            }
        }
        
        // LEFT TRIGGER - Alternative mining button (optional)
        // Disabled for now to avoid conflicts - use B button instead
    }
    
    applyDeadZone(value) {
        if (Math.abs(value) < this.deadZone) {
            return 0;
        }
        // Scale the value to use full range after dead zone
        const sign = value > 0 ? 1 : -1;
        return sign * ((Math.abs(value) - this.deadZone) / (1 - this.deadZone));
    }
    
    wasButtonPressed(buttonIndex) {
        // Returns true only on the frame the button was pressed (not held)
        return this.buttonStates[buttonIndex] && !this.previousButtonStates[buttonIndex];
    }
    
    wasButtonReleased(buttonIndex) {
        // Returns true only on the frame the button was released
        return !this.buttonStates[buttonIndex] && this.previousButtonStates[buttonIndex];
    }
    
    vibrate(intensity = 0.5, duration = 100) {
        if (!this.vibrationEnabled || this.activeGamepadIndex === null) return;
        
        const gamepads = navigator.getGamepads();
        const gamepad = gamepads[this.activeGamepadIndex];
        
        if (gamepad && gamepad.vibrationActuator) {
            gamepad.vibrationActuator.playEffect('dual-rumble', {
                startDelay: 0,
                duration: duration,
                weakMagnitude: intensity * 0.5,
                strongMagnitude: intensity
            });
        }
    }
    
    resetControls() {
        // Reset all spaceship controls
        this.spaceship.thrust.forward = false;
        this.spaceship.thrust.backward = false;
        this.spaceship.thrust.left = false;
        this.spaceship.thrust.right = false;
        this.spaceship.thrust.boost = false;
        this.spaceship.thrustPower = 1.0;
        this.spaceship.strafePower = 1.0;
    }
    
    showNotification(message) {
        // Show a temporary notification for gamepad events
        const notification = document.createElement('div');
        notification.style.position = 'fixed';
        notification.style.bottom = '100px';
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%)';
        notification.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        notification.style.color = '#30cfd0';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = '5px';
        notification.style.border = '1px solid #30cfd0';
        notification.style.fontFamily = 'monospace';
        notification.style.fontSize = '14px';
        notification.style.zIndex = '10000';
        notification.textContent = '🎮 ' + message;
        
        document.body.appendChild(notification);
        
        // Fade out and remove after 3 seconds
        setTimeout(() => {
            notification.style.transition = 'opacity 0.5s';
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }
    
    // Settings methods
    setLookSensitivity(value) {
        this.lookSensitivity = Math.max(0.1, Math.min(5.0, value));
    }
    
    setMovementSensitivity(value) {
        this.movementSensitivity = Math.max(0.1, Math.min(2.0, value));
    }
    
    setDeadZone(value) {
        this.deadZone = Math.max(0.05, Math.min(0.3, value));
    }
    
    setVibration(enabled) {
        this.vibrationEnabled = enabled;
    }
    
    isConnected() {
        return this.activeGamepadIndex !== null;
    }
    
    // Debug methods for testing
    toggleDebug() {
        this.debugMode = !this.debugMode;
        
        if (this.debugMode) {
            this.createDebugDisplay();
        } else {
            this.removeDebugDisplay();
        }
    }
    
    createDebugDisplay() {
        if (this.debugDisplay) return;
        
        this.debugDisplay = document.createElement('div');
        this.debugDisplay.id = 'gamepad-debug';
        this.debugDisplay.style.position = 'fixed';
        this.debugDisplay.style.top = '10px';
        this.debugDisplay.style.right = '10px';
        this.debugDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.debugDisplay.style.color = '#0f0';
        this.debugDisplay.style.padding = '10px';
        this.debugDisplay.style.fontFamily = 'monospace';
        this.debugDisplay.style.fontSize = '12px';
        this.debugDisplay.style.borderRadius = '5px';
        this.debugDisplay.style.border = '1px solid #0f0';
        this.debugDisplay.style.zIndex = '10001';
        this.debugDisplay.style.maxWidth = '300px';
        this.debugDisplay.style.pointerEvents = 'none';
        
        document.body.appendChild(this.debugDisplay);
    }
    
    removeDebugDisplay() {
        if (this.debugDisplay) {
            this.debugDisplay.remove();
            this.debugDisplay = null;
        }
    }
    
    updateDebugDisplay(gamepad) {
        if (!this.debugDisplay) {
            this.createDebugDisplay();
        }
        
        // Show ALL axes to debug mapping issues
        let html = `<strong>🎮 Gamepad Debug</strong><br>`;
        html += `Controller: ${gamepad.id}<br>`;
        html += `Mapping: ${gamepad.mapping || 'non-standard'}<br>`;
        html += `<br><strong>All Axes (${gamepad.axes.length}):</strong><br>`;
        
        for (let i = 0; i < gamepad.axes.length; i++) {
            const value = gamepad.axes[i].toFixed(2);
            const isRightX = i === this.rightStickXAxis;
            const isRightY = i === this.rightStickYAxis;
            const label = isRightX ? ' (R-X)' : isRightY ? ' (R-Y)' : '';
            html += `[${i}]: ${value}${label} `;
            if (i % 2 === 1) html += '<br>';
        }
        
        html += `<br><strong>Detected Mapping:</strong><br>`;
        html += `Left Stick: axes[0,1]<br>`;
        html += `Right Stick: axes[${this.rightStickXAxis},${this.rightStickYAxis}]<br>`;
        
        const rightX = gamepad.axes[this.rightStickXAxis]?.toFixed(2) || '0';
        const rightY = gamepad.axes[this.rightStickYAxis]?.toFixed(2) || '0';
        html += `Right Values: X=${rightX} Y=${rightY}<br>`;
        
        const rt = gamepad.buttons[7]?.value.toFixed(2) || '0';
        const lt = gamepad.buttons[6]?.value.toFixed(2) || '0';
        html += `<br><strong>Triggers:</strong><br>`;
        html += `LT: ${lt} | RT: ${rt}<br>`;
        
        html += `<br><strong>Active:</strong><br>`;
        // Show active controls
        if (this.spaceship.thrust.forward) html += '↑ Forward ';
        if (this.spaceship.thrust.backward) html += '↓ Backward ';
        if (this.spaceship.thrust.left) html += '→ Right ';
        if (this.spaceship.thrust.right) html += '← Left ';
        if (this.spaceship.thrust.boost) html += '⚡ Boost ';
        
        html += `<br><small>Press F8 to swap X/Y axes</small>`;
        
        this.debugDisplay.innerHTML = html;
    }
    
    // Method to swap right stick axes if they're incorrect
    swapRightStickAxes() {
        const temp = this.rightStickXAxis;
        this.rightStickXAxis = this.rightStickYAxis;
        this.rightStickYAxis = temp;
        console.log(`Swapped right stick axes: X is now axis ${this.rightStickXAxis}, Y is now axis ${this.rightStickYAxis}`);
        this.axisDetectionMode = false; // Disable auto-detection after manual swap
    }
}