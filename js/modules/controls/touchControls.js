// touchControls.js - Touch controls for mobile devices using nipple.js

export class TouchControls {
    constructor(spaceship, physics) {
        this.spaceship = spaceship;
        this.physics = physics;
        this.leftJoystick = null;
        this.rightJoystick = null;
        this.dockButton = null;
        this.mineButton = null;
        this.fireButton = null;
        this.targetButton = null;
        this.isInitialized = false;
        
        // Store references to systems we need to interact with
        this.miningSystem = null;
        this.targetingSystem = null;
        this.dockingSystem = null;
        this.weaponSystem = null;
        
        // Thresholds for joystick input
        this.threshold = 0.1;
        
        // Add crosshair
        this.createCrosshair();
        
        // Load nipple.js script
        this.loadNippleJS().then(() => {
            this.setupTouchControls();
        }).catch(err => {
            console.error('Failed to load nipple.js:', err);
        });
    }
    
    // Method to set the systems we need to interact with
    setControlSystems(controls) {
        console.log("TouchControls: Setting control systems");
        
        if (!controls) {
            console.error("TouchControls: Controls object is null or undefined");
            return;
        }
        
        // Store references to systems
        this.miningSystem = controls.miningSystem;
        this.targetingSystem = controls.targetingSystem;
        this.dockingSystem = controls.dockingSystem;
        this.weaponSystem = controls.weaponSystem;
        
        // Extra check for weapon system that might be Combat instance
        if (this.weaponSystem && !this.weaponSystem.setFiring && this.weaponSystem.isFiring !== undefined) {
            console.log("TouchControls: weaponSystem is likely a Combat instance, adapting interface");
            // Create adapter functions if needed
        }
        
        // Log all connections with details
        const systemStatus = {
            hasMiningSystem: !!this.miningSystem,
            miningSystemType: this.miningSystem ? this.miningSystem.constructor.name : "Not set",
            hasTargetingSystem: !!this.targetingSystem,
            targetingSystemType: this.targetingSystem ? this.targetingSystem.constructor.name : "Not set",
            hasDockingSystem: !!this.dockingSystem,
            dockingSystemType: this.dockingSystem ? this.dockingSystem.constructor.name : "Not set",
            hasWeaponSystem: !!this.weaponSystem,
            weaponSystemType: this.weaponSystem ? this.weaponSystem.constructor.name : "Not set"
        };
        
        console.log("TouchControls: Systems connected", systemStatus);
        
        if (!this.miningSystem) {
            console.error("TouchControls: Mining system is not connected - mining won't work!");
        }
        
        if (!this.targetingSystem) {
            console.error("TouchControls: Targeting system is not connected - targeting won't work!");
        }
        
        // Store reference to spaceship from controls if not already set
        if (!this.spaceship && controls.spaceship) {
            this.spaceship = controls.spaceship;
            console.log("TouchControls: Spaceship reference set from controls");
        }
        
        return this; // For method chaining
    }
    
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
    }
    
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
    
    setupTouchControls() {
        // Create container elements for joysticks
        this.createJoystickZones();
        
        // Create action buttons
        this.createActionButtons();
        
        // Initialize joysticks after a short delay to ensure DOM is ready
        setTimeout(() => {
            this.initializeJoysticks();
            this.isInitialized = true;
        }, 100);
    }
    
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
        
        // Prevent default browser behavior to avoid scrolling when using joysticks
        leftJoystickZone.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
        leftJoystickZone.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
        leftJoystickZone.addEventListener('touchend', (e) => e.preventDefault(), { passive: false });
        
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
        
        // Prevent default browser behavior to avoid scrolling when using joysticks
        rightJoystickZone.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
        rightJoystickZone.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
        rightJoystickZone.addEventListener('touchend', (e) => e.preventDefault(), { passive: false });
        
        document.body.appendChild(rightJoystickZone);
    }
    
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
        this.dockButton.style.zIndex = '10000'; 
        this.dockButton.style.display = 'none';
        this.addButtonEvents(this.dockButton, this.handleDocking.bind(this));
        document.body.appendChild(this.dockButton);
        
        // Create deploy laser button (on right side)
        this.deployLaserButton = this.createActionButton(rightActionButtonsContainer, 'DEPLOY', 'rgba(255, 100, 100, 0.8)');
        this.addButtonEvents(this.deployLaserButton, this.handleDeployLaser.bind(this));
    }
    
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
    
    initializeJoysticks() {
        if (!window.nipplejs) {
            console.error('nipplejs is not loaded');
            return;
        }
        
        // Initialize left joystick (thrust control)
        this.leftJoystick = window.nipplejs.create({
            zone: document.getElementById('leftJoystickZone'),
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
        this.rightJoystick = window.nipplejs.create({
            zone: document.getElementById('rightJoystickZone'),
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
    }
    
    setupJoystickEvents() {
        // Left joystick events (thrust)
        this.leftJoystick.on('move', (evt, data) => {
            this.handleThrustJoystick(data);
        }).on('end', () => {
            this.resetThrust();
        });
        
        // Right joystick events (rotation)
        this.rightJoystick.on('move', (evt, data) => {
            this.handleRotationJoystick(data);
        }).on('end', () => {
            // Do nothing on end - rotation is not continuous
        });
    }
    
    handleThrustJoystick(data) {
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
            this.spaceship.thrust.right = true;
        }
        // Right/East - Right (around 0 or 2π radians)
        else if ((angle >= 0 && angle < 1.0) || angle > 5.5) {
            this.spaceship.thrust.left = true;
        }
        
        // Enable boost if force is high
        this.spaceship.thrust.boost = force > 1.5;
    }
    
    handleRotationJoystick(data) {
        if (this.spaceship.isDocked) return;
        
        // Extract the X and Y components of the joystick vector
        // Reduce sensitivity by lowering the multiplier from 0.05 to 0.015
        const xMove = data.vector.x * data.force * 0.015;
        // Invert the Y value to fix up/down control direction
        const yMove = -data.vector.y * data.force * 0.015;
        
        // Update rotation via physics
        this.physics.updateRotation(xMove, yMove);
    }
    
    resetThrust() {
        if (!this.spaceship) return;
        
        this.spaceship.thrust.forward = false;
        this.spaceship.thrust.backward = false;
        this.spaceship.thrust.left = false;
        this.spaceship.thrust.right = false;
        this.spaceship.thrust.boost = false;
    }
    
    handleMiningStart() {
        try {
            console.log("TouchControls: handleMiningStart called");
            
            // First ensure we have targeting and mining systems
            if (!this.targetingSystem) {
                console.error("TouchControls: Targeting system not available");
                return;
            }
            
            if (!this.miningSystem) {
                console.error("TouchControls: Mining system not available");
                return;
            }
            
            // First, get the current target
            let targetAsteroid = this.targetingSystem.getCurrentTarget();
            console.log("TouchControls: Initial target:", targetAsteroid);
            
            // If no target is selected, enable targeting and find nearest
            if (!targetAsteroid) {
                console.log("TouchControls: No target selected, enabling targeting and finding nearest target");
                
                // Enable targeting if not already enabled
                if (!this.targetingSystem.isLockOnEnabled()) {
                    this.targetingSystem.toggleLockOn();
                }
                
                // Find nearest target
                targetAsteroid = this.targetingSystem.findNearestTarget();
                console.log("TouchControls: Found nearest target:", targetAsteroid);
                
                if (!targetAsteroid) {
                    console.log("TouchControls: No targets in range after scan");
                    return;
                }
            }
            
            // Essential validation: make sure we have a valid target asteroid with required properties
            if (!targetAsteroid || !targetAsteroid.mesh || !targetAsteroid.mesh.position) {
                console.error("TouchControls: Target asteroid is missing required properties", targetAsteroid);
                
                // Try a different approach - get all asteroids from environment
                const game = window.gameInstance || window.game;
                if (game && game.environment && game.environment.asteroids && game.environment.asteroids.length > 0) {
                    console.log("TouchControls: Attempting to get asteroid directly from environment");
                    // Find closest asteroid
                    let closestDist = Infinity;
                    let closestAsteroid = null;
                    
                    for (const asteroid of game.environment.asteroids) {
                        if (asteroid && asteroid.mesh && asteroid.mesh.position && this.spaceship && this.spaceship.mesh) {
                            const dist = asteroid.mesh.position.distanceTo(this.spaceship.mesh.position);
                            if (dist < closestDist) {
                                closestDist = dist;
                                closestAsteroid = asteroid;
                            }
                        }
                    }
                    
                    if (closestAsteroid) {
                        console.log("TouchControls: Found closest asteroid from environment:", closestAsteroid);
                        targetAsteroid = closestAsteroid;
                    } else {
                        console.error("TouchControls: Could not find any valid asteroids in environment");
                        return;
                    }
                } else {
                    console.error("TouchControls: Could not access environment to find asteroids");
                    return;
                }
            }
            
            console.log("TouchControls: Target asteroid found:", targetAsteroid);
            
            // Extra validation to make absolutely sure we have a valid targetAsteroid
            if (!targetAsteroid || !targetAsteroid.mesh || !targetAsteroid.mesh.position) {
                console.error("TouchControls: Target asteroid is still invalid after fallback attempts");
                return;
            }
            
            // Explicitly set the target asteroid for mining
            this.miningSystem.setTargetAsteroid(targetAsteroid);
            
            // Log asteroid details
            console.log("TouchControls: Target set for mining:", {
                resourceType: targetAsteroid.resourceType || "unknown",
                position: targetAsteroid.mesh ? targetAsteroid.mesh.position.toArray() : "no mesh",
                distance: targetAsteroid.mesh && this.spaceship && this.spaceship.mesh ? 
                    targetAsteroid.mesh.position.distanceTo(this.spaceship.mesh.position) : "unknown"
            });
            
            // Start mining
            console.log("TouchControls: Starting mining operation");
            this.miningSystem.startMining();
            
            // Check if mining actually started
            console.log("TouchControls: Mining started:", this.miningSystem.isMining);
            
        } catch (error) {
            console.error("TouchControls: Error in handleMiningStart:", error);
        }
    }
    
    handleMiningEnd() {
        try {
            console.log("TouchControls: handleMiningEnd called");
            
            // Make sure we have the mining system
            if (!this.miningSystem) {
                console.error("TouchControls: Mining system not available for stopping");
                return;
            }
            
            // Stop mining
            this.miningSystem.stopMining();
            console.log("TouchControls: Mining stopped");
            
        } catch (e) {
            console.error("TouchControls: Error stopping mining:", e);
        }
    }
    
    handleFiringStart() {
        try {
            // First try local reference to weapon system (which is actually the Combat class)
            if (this.weaponSystem) {
                // Attempt to use the setFiring method from the Combat class
                if (typeof this.weaponSystem.setFiring === 'function') {
                    this.weaponSystem.setFiring(true);
                } else {
                    // Fallback to the older isWeaponActive property
                    this.weaponSystem.isWeaponActive = true;
                }
                
                // Try to play sound if available
                const game = window.gameInstance || window.game;
                if (game && game.audio) {
                    game.audio.playSound('laser');
                }
                return;
            }
            
            // Fallback to global game reference
            const game = window.gameInstance || window.game;
            if (!game) {
                console.error("No game reference found");
                return;
            }
            
            // Try direct combat object on game first (preferred)
            if (game.combat) {
                game.combat.setFiring(true);
                
                // Play laser sound if available
                if (game.audio) {
                    game.audio.playSound('laser');
                }
                return;
            }
            
            // Legacy fallbacks
            if (game.weaponSystem) {
                if (typeof game.weaponSystem.setFiring === 'function') {
                    game.weaponSystem.setFiring(true);
                } else {
                    game.weaponSystem.isWeaponActive = true;
                }
                
                // Play laser sound if available
                if (game.audio) {
                    game.audio.playSound('laser');
                }
                return;
            }
            
            // Try through controls
            if (game.controls && game.controls.weaponSystem) {
                if (typeof game.controls.weaponSystem.setFiring === 'function') {
                    game.controls.weaponSystem.setFiring(true);
                } else {
                    game.controls.weaponSystem.isWeaponActive = true;
                }
                
                // Play laser sound if available
                if (game.audio) {
                    game.audio.playSound('laser');
                }
                return;
            }
            
            console.error("No weapon system or combat system found");
        } catch (e) {
            console.error("Error in handleFiringStart:", e);
        }
    }
    
    handleFiringEnd() {
        try {
            // First try local reference to weapon system (which is actually the Combat class)
            if (this.weaponSystem) {
                // Attempt to use the setFiring method from the Combat class
                if (typeof this.weaponSystem.setFiring === 'function') {
                    this.weaponSystem.setFiring(false);
                } else {
                    // Fallback to the older isWeaponActive property
                    this.weaponSystem.isWeaponActive = false;
                }
                
                // Try to stop sound if available
                const game = window.gameInstance || window.game;
                if (game && game.audio) {
                    game.audio.stopSound('laser');
                }
                return;
            }
            
            // Fallback to global game reference
            const game = window.gameInstance || window.game;
            if (!game) {
                console.error("No game reference found");
                return;
            }
            
            // Try direct combat object on game first (preferred)
            if (game.combat) {
                game.combat.setFiring(false);
                
                // Stop laser sound if available
                if (game.audio) {
                    game.audio.stopSound('laser');
                }
                return;
            }
            
            // Legacy fallbacks
            if (game.weaponSystem) {
                if (typeof game.weaponSystem.setFiring === 'function') {
                    game.weaponSystem.setFiring(false);
                } else {
                    game.weaponSystem.isWeaponActive = false;
                }
                
                // Stop laser sound if available
                if (game.audio) {
                    game.audio.stopSound('laser');
                }
                return;
            }
            
            // Try through controls
            if (game.controls && game.controls.weaponSystem) {
                if (typeof game.controls.weaponSystem.setFiring === 'function') {
                    game.controls.weaponSystem.setFiring(false);
                } else {
                    game.controls.weaponSystem.isWeaponActive = false;
                }
                
                // Stop laser sound if available
                if (game.audio) {
                    game.audio.stopSound('laser');
                }
                return;
            }
            
            console.error("No weapon system or combat system found");
        } catch (e) {
            console.error("Error in handleFiringEnd:", e);
        }
    }
    
    handleDocking() {
        if (!this.dockingSystem) {
            console.error("Docking system not available");
            return;
        }
        
        console.log("TouchControls: Dock button pressed, attempting to dock with stargate");
        
        // Call docking method
        this.dockingSystem.dockWithStargate();
        
        // Hide the dock button after pressing it
        this.hideDockButton();
    }
    
    handleTargeting() {
        if (!this.targetingSystem) {
            console.error("Targeting system not available");
            return;
        }
        
        // Toggle targeting system
        this.targetingSystem.toggleLockOn();
    }
    
    showDockButton() {
        if (this.dockButton) {
            // FIX: Make sure display is set before other properties
            this.dockButton.style.display = 'flex';
            
            // FIX: Ensure critical styles are explicitly set
            this.dockButton.style.zIndex = '10000'; // Very high z-index
            this.dockButton.style.position = 'absolute';
            this.dockButton.style.top = '50%';
            this.dockButton.style.left = '50%';
            
            console.log("Showing dock button - near stargate");
            
            // Add pulsing animation to make it more noticeable
            if (!this.dockButton.style.animation) {
                this.dockButton.style.animation = 'pulse 1.5s infinite';
                
                // Add the pulse keyframes if they don't exist
                if (!document.getElementById('mobile-pulse-animation')) {
                    const style = document.createElement('style');
                    style.id = 'mobile-pulse-animation';
                    style.textContent = `
                        @keyframes pulse {
                            0% { transform: translate(-50%, -50%) scale(1); }
                            50% { transform: translate(-50%, -50%) scale(1.1); }
                            100% { transform: translate(-50%, -50%) scale(1); }
                        }
                    `;
                    document.head.appendChild(style);
                }
            }
            
            // FIX: Log dock button visibility for debugging
            console.log("Dock button shown with styles:", {
                display: this.dockButton.style.display,
                zIndex: this.dockButton.style.zIndex,
                position: this.dockButton.style.position,
                width: this.dockButton.style.width,
                height: this.dockButton.style.height
            });
        }
    }
    
    hideDockButton() {
        if (this.dockButton) {
            this.dockButton.style.display = 'none';
        }
    }
    
    hide() {
        // Hide joystick zones
        const leftZone = document.getElementById('leftJoystickZone');
        const rightZone = document.getElementById('rightJoystickZone');
        if (leftZone) leftZone.style.display = 'none';
        if (rightZone) rightZone.style.display = 'none';
        
        // Hide action buttons
        const leftActionButtons = document.getElementById('mobile-action-buttons-left');
        const rightActionButtons = document.getElementById('mobile-action-buttons-right');
        if (leftActionButtons) leftActionButtons.style.display = 'none';
        if (rightActionButtons) rightActionButtons.style.display = 'none';
        
        // Hide dock button
        this.hideDockButton();
        
        // Keep crosshair visible
    }
    
    show() {
        // Only show controls when not docked and not in intro sequence
        if ((this.spaceship && this.spaceship.isDocked) || 
            (window.game && window.game.introSequenceActive)) {
            console.log("TouchControls: Not showing controls during docked state or intro sequence");
            return;
        }
        
        // Show joystick zones
        const leftZone = document.getElementById('leftJoystickZone');
        const rightZone = document.getElementById('rightJoystickZone');
        if (leftZone) leftZone.style.display = 'block';
        if (rightZone) rightZone.style.display = 'block';
        
        // Show action buttons
        const leftActionButtons = document.getElementById('mobile-action-buttons-left');
        const rightActionButtons = document.getElementById('mobile-action-buttons-right');
        if (leftActionButtons) leftActionButtons.style.display = 'flex';
        if (rightActionButtons) rightActionButtons.style.display = 'flex';
    }
    
    update() {
        // Update dock button visibility based on proximity to stargate
        if (this.dockingSystem && this.spaceship) {
            if (this.dockingSystem.nearStargate && !this.spaceship.isDocked) {
                this.showDockButton();
            } else {
                this.hideDockButton();
            }
        } else {
            // Fallback to window.game if the direct reference isn't set yet
            const game = window.gameInstance || window.game;
            if (game && game.controls && game.controls.dockingSystem) {
                const dockingSystem = game.controls.dockingSystem;
                
                if (dockingSystem.nearStargate && !this.spaceship.isDocked) {
                    this.showDockButton();
                } else {
                    this.hideDockButton();
                }
            }
        }
    }
    
    // Helper method to add events to buttons
    addButtonEvents(button, startHandler, endHandler = null) {
        if (!button) {
            console.error("TouchControls: Cannot add events to null button");
            return;
        }
        
        // For continuous actions (like firing and mining)
        if (endHandler) {
            // Touch events with passive: false to allow preventDefault
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                button.style.transform = 'scale(0.95) translateZ(0)';
                startHandler();
            }, { passive: false });
            
            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                button.style.transform = 'scale(1) translateZ(0)';
                endHandler();
            }, { passive: false });
            
            // Add pointer events
            button.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                if (e.pointerType === 'touch') return; // Skip if touch (handled by touch events)
                button.style.transform = 'scale(0.95) translateZ(0)';
                startHandler();
            });
            
            button.addEventListener('pointerup', (e) => {
                e.preventDefault();
                if (e.pointerType === 'touch') return; // Skip if touch (handled by touch events)
                button.style.transform = 'scale(1) translateZ(0)';
                endHandler();
            });
            
            // Keep mouse events for backward compatibility
            button.addEventListener('mousedown', (e) => {
                button.style.transform = 'scale(0.95) translateZ(0)';
                startHandler();
            });
            
            button.addEventListener('mouseup', (e) => {
                button.style.transform = 'scale(1) translateZ(0)';
                endHandler();
            });
        }
        // For single actions (like targeting and docking)
        else {
            // Touch events
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                button.style.transform = 'scale(0.95) translateZ(0)';
                
                // For dock button specifically, add debug logging
                if (button === this.dockButton) {
                    console.log("Dock button touchstart event fired");
                }
            }, { passive: false });
            
            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                button.style.transform = 'scale(1) translateZ(0)';
                
                // For dock button specifically, add debug logging
                if (button === this.dockButton) {
                    console.log("Dock button touchend event fired, calling handler");
                }
                
                startHandler();
            }, { passive: false });
            
            // Add pointer events
            button.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                if (e.pointerType === 'touch') return; // Skip if touch (handled by touch events)
                button.style.transform = 'scale(0.95) translateZ(0)';
                
                // For dock button specifically, add debug logging
                if (button === this.dockButton) {
                    console.log("Dock button pointerdown event fired");
                }
            });
            
            button.addEventListener('pointerup', (e) => {
                e.preventDefault();
                if (e.pointerType === 'touch') return; // Skip if touch (handled by touch events)
                button.style.transform = 'scale(1) translateZ(0)';
                
                // For dock button specifically, add debug logging
                if (button === this.dockButton) {
                    console.log("Dock button pointerup event fired, calling handler");
                }
                
                startHandler();
            });
            
            // Keep mouse events for backward compatibility
            button.addEventListener('mousedown', (e) => {
                button.style.transform = 'scale(0.95) translateZ(0)';
            });
            
            button.addEventListener('mouseup', (e) => {
                button.style.transform = 'scale(1) translateZ(0)';
                startHandler();
            });
        }
    }
    
    /**
     * Handle deploying a laser turret
     */
    handleDeployLaser() {
        console.log("TouchControls: Deploying laser turret");
        
        // Publish deploy laser event
        if (window.mainMessageBus) {
            window.mainMessageBus.publish('input.deployLaser', {});
        }
    }
} 