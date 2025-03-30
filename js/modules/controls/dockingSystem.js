// dockingSystem.js - Handles stargate docking and trading

export class DockingSystem {
    constructor(spaceship, stargate, ui) {
        this.spaceship = spaceship;
        this.stargate = stargate;
        this.ui = ui;
        
        this.nearStargate = false;
        this.isDocked = this.spaceship.isDocked; // Initialize with spaceship's docked state
        
        // Preemptively set a safe undocking position
        if (this.spaceship && this.spaceship.undockLocation && this.stargate) {
            // Position in the middle of the stargate
            this.spaceship.undockLocation.set(0, 10000, 0);
        }
        
        console.log("Initializing docking system, ship is " + (this.isDocked ? "docked" : "undocked"));
        this.setupDockingControls();
        
        // If we're starting docked, publish the player.docked event immediately
        if (this.isDocked && this.spaceship.world && this.spaceship.world.messageBus) {
            this.spaceship.world.messageBus.publish('player.docked', {
                playerPosition: this.spaceship.mesh ? this.spaceship.mesh.position.clone() : null,
                stargate: this.stargate
            });
            console.log("Published initial player.docked event");
        }
    }
    
    setupDockingControls() {
        // Add docking key handler (Q key)
        document.addEventListener('keydown', e => {
            if (e.key.toLowerCase() === 'q') {
                if (this.nearStargate && !this.spaceship.isDocked) {
                    console.log("Q key pressed: Docking with stargate");
                    this.dockWithStargate();
                } else if (this.spaceship.isDocked) {
                    console.log("Q key pressed while docked: No action (use Undock button)");
                } else if (!this.nearStargate) {
                    console.log("Q key pressed but not near stargate");
                }
            }
        });
        
        // Set up stargate UI button handlers
        this.setupStargateUIControls();
    }
    
    setupStargateUIControls() {
        // Set up refuel button
        const refuelBtn = document.getElementById('refuel-btn');
        if (refuelBtn) {
            refuelBtn.addEventListener('click', () => {
                if (this.spaceship.credits >= 100) {
                    this.spaceship.credits -= this.spaceship.refuel();
                    this.updateStargateUI();
                }
            });
        }
        
        // Set up shield repair button
        const repairShieldBtn = document.getElementById('repair-shield-btn');
        if (repairShieldBtn) {
            repairShieldBtn.addEventListener('click', () => {
                if (this.spaceship.credits >= 150) {
                    this.spaceship.credits -= this.spaceship.repairShield();
                    this.updateStargateUI();
                }
            });
        }
        
        // Set up hull repair button
        const repairHullBtn = document.getElementById('repair-hull-btn');
        if (repairHullBtn) {
            repairHullBtn.addEventListener('click', () => {
                if (this.spaceship.credits >= 200) {
                    this.spaceship.credits -= this.spaceship.repairHull();
                    this.updateStargateUI();
                }
            });
        }
        
        // Set up undock button
        const undockBtn = document.getElementById('undock-btn');
        if (undockBtn) {
            // Use both click and touchend events for better Android compatibility
            const handleUndock = (e) => {
                // Prevent any default action that might interfere
                e.preventDefault();
                e.stopPropagation();
                
                // Log which event triggered the undock
                console.log(`Undock button ${e.type} event triggered`);

                // Add a small delay to ensure the event completes on Android
                if (this.isMobileDevice()) {
                    // For Android, remove the overlay classes immediately
                    document.body.classList.remove('undocking', 'modal-open');
                    // Set a brief timeout to allow touch event to complete
                    setTimeout(() => {
                        this.undockFromStargate();
                    }, 50);
                } else {
                    this.undockFromStargate();
                }
            };
            
            // Add both event listeners for better compatibility
            undockBtn.addEventListener('click', handleUndock);
            undockBtn.addEventListener('touchend', handleUndock);
            
            // Prevent any touch events from being captured or blocked
            undockBtn.addEventListener('touchstart', (e) => {
                console.log("Touch started on undock button");
                e.stopPropagation();
            }, { passive: false });
        }
        
        // Set up resource selling buttons
        this.setupSellingButtons();
        
        // Set up upgrade buttons
        this.setupUpgradeButtons();
    }
    
    setupSellingButtons() {
        const sellIronBtn = document.getElementById('sell-iron');
        if (sellIronBtn) {
            sellIronBtn.addEventListener('click', () => {
                if (this.resources.iron > 0) {
                    this.spaceship.credits += this.resources.iron * 10;
                    this.resources.iron = 0;
                    this.updateStargateUI();
                }
            });
        }
        
        const sellGoldBtn = document.getElementById('sell-gold');
        if (sellGoldBtn) {
            sellGoldBtn.addEventListener('click', () => {
                if (this.resources.gold > 0) {
                    this.spaceship.credits += this.resources.gold * 50;
                    this.resources.gold = 0;
                    this.updateStargateUI();
                }
            });
        }
        
        const sellPlatinumBtn = document.getElementById('sell-platinum');
        if (sellPlatinumBtn) {
            sellPlatinumBtn.addEventListener('click', () => {
                if (this.resources.platinum > 0) {
                    this.spaceship.credits += this.resources.platinum * 200;
                    this.resources.platinum = 0;
                    this.updateStargateUI();
                }
            });
        }
    }
    
    setupUpgradeButtons() {
        // Fuel tank upgrade button handler
        this.setupUpgradeButton('upgrade-fuel-tank', 
            () => this.spaceship.fuelUpgradeCost,
            () => this.spaceship.upgradeFuelTank());
        
        // Engine upgrade button handler
        this.setupUpgradeButton('upgrade-engine', 
            () => this.spaceship.engineUpgradeCost,
            () => this.spaceship.upgradeEngine());
        
        // Mining laser upgrade button handler
        this.setupUpgradeButton('upgrade-mining', 
            () => this.spaceship.miningUpgradeCost,
            () => this.spaceship.upgradeMiningLaser());
        
        // Hull upgrade button handler
        this.setupUpgradeButton('upgrade-hull', 
            () => this.spaceship.hullUpgradeCost,
            () => this.spaceship.upgradeHull());
        
        // Scanner upgrade button handler
        this.setupUpgradeButton('upgrade-scanner', 
            () => this.spaceship.scannerUpgradeCost,
            () => this.spaceship.upgradeScanner());
    }
    
    // Helper method to set up an upgrade button with a given cost getter and upgrade function
    setupUpgradeButton(buttonId, costGetter, upgradeFunction) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', () => {
                const cost = costGetter();
                if (this.spaceship.credits >= cost) {
                    this.spaceship.credits -= cost;
                    upgradeFunction();
                    
                    // Update the mining system's efficiency if we upgraded the mining laser
                    if (buttonId === 'upgrade-mining' && this.updateMiningSystem) {
                        this.updateMiningSystem();
                    }
                    
                    // Update UI
                    this.updateStargateUI();
                }
            });
        }
    }
    
    // Method to update the mining system when mining efficiency is upgraded
    updateMiningSystem() {
        // Find the mining system through the Controls object to pass the new efficiency
        if (this.ui && this.ui.controls && this.ui.controls.miningSystem) {
            // Apply the mining efficiency to the mining speed
            const miningSystem = this.ui.controls.miningSystem;
            
            // Update mining speeds for each resource type based on the new efficiency
            Object.keys(miningSystem.miningSpeedByType).forEach(resourceType => {
                const baseSpeed = miningSystem.miningSpeedByType[resourceType];
                miningSystem.miningSpeedByType[resourceType] = 
                    baseSpeed * this.spaceship.miningEfficiency;
            });
            
            console.log("Mining system updated with new efficiency:", this.spaceship.miningEfficiency);
        }
    }
    
    dockWithStargate() {
        console.log("Docking with stargate");
        
        // Only update ship state if it's not already docked
        if (!this.spaceship.isDocked) {
            // Dock the ship
            this.spaceship.dock();
            this.isDocked = true;
            
            // Publish the player.docked event for enemy system and other systems to respond
            if (this.spaceship.world && this.spaceship.world.messageBus) {
                this.spaceship.world.messageBus.publish('player.docked', {
                    playerPosition: this.spaceship.mesh.position.clone(),
                    stargate: this.stargate
                });
                console.log("Published player.docked event");
            }
        } else {
            console.log("Ship is already docked, just showing UI");
        }
        
        // Mobile-specific preparation - ensure all classes that might block UI visibility are removed
        if (this.isMobileDevice()) {
            console.log("Mobile device detected - preparing for stargate UI");
            document.body.classList.remove('undocking', 'modal-open');
            
            // Reset any problematic styles that might prevent UI from showing
            document.body.style.position = 'static';
            document.body.style.touchAction = 'auto';
            document.body.style.pointerEvents = 'auto';
            document.body.style.overflow = 'auto';
        }
        
        // Show the stargate UI
        if (this.ui && this.ui.stargateInterface) {
            console.log("Showing stargate UI...");
            this.ui.stargateInterface.showStargateUI();
            
            // Double-check visibility on mobile with a small delay
            if (this.isMobileDevice()) {
                setTimeout(() => {
                    const stargateUI = document.getElementById('stargate-ui');
                    if (stargateUI && stargateUI.style.display !== 'block') {
                        console.log("Forcing stargate UI display");
                        stargateUI.style.display = 'block';
                    }
                }, 100);
            }
        }
        
        // Hide game UI elements
        if (this.ui) {
            this.ui.hideUI();
        }
        
        // Exit pointer lock so cursor is visible for UI interactions
        if (document.pointerLockElement) {
            document.exitPointerLock();
            console.log("Exited pointer lock for UI interaction");
        }
        
        // Update the stargate UI with current values
        this.updateStargateUI();
    }
    
    // Helper to wrap steps in requestAnimationFrame for smoother UI updates
    async performStep(stepFunction, stepName) {
        return new Promise(resolve => {
            requestAnimationFrame(() => {
                try {
                    stepFunction();
                    console.log(`Completed step: ${stepName}`);
                } catch (err) {
                    console.error(`Error during step ${stepName}:`, err);
                }
                resolve();
            });
        });
    }

    // Helper to yield control to the browser
    async yieldToBrowser() {
        return new Promise(resolve => requestAnimationFrame(resolve));
    }

    // Optimized method to hide UI elements using a single reflow
    hideStargateUI() {
        if (this.ui && this.ui.stargateInterface) {
            // Use CSS class for better performance
            document.body.classList.add('undocking');
            this.ui.stargateInterface.hideStargateUI();
            console.log("Hiding stargate interface");
        }
    }

    // Optimized method to show game UI elements using a single reflow
    showGameUI() {
        if (this.ui) {
            // Use CSS class for better performance
            document.body.classList.remove('undocking');
            this.ui.showUI();
            console.log("Showing game UI");
        }
    }

    // Optimized method to reset mobile styles
    resetMobileStyles() {
        // Immediately remove problematic classes for Android
        if (this.isMobileDevice()) {
            document.body.classList.remove('undocking', 'modal-open');
        }
        
        // Batch style changes to minimize reflows
        requestAnimationFrame(() => {
            // FIX: More aggressive style clearing for Android
            document.body.style.cssText = '';
            document.body.style.overflow = 'auto';
            document.body.style.position = 'static';
            document.body.style.height = 'auto';
            document.body.style.width = 'auto';
            document.body.style.touchAction = 'auto';
            document.body.style.pointerEvents = 'auto';
            document.body.style.webkitOverflowScrolling = 'touch';
            
            // FIX: Ensure all restrictive classes are removed to prevent touch event issues
            document.body.classList.remove('modal-open', 'undocking');
            
            // Reset scrollable containers in a single pass
            document.querySelectorAll('.modal-content, #stargate-ui, #star-map').forEach(container => {
                if (container && container.style) {
                    container.style.cssText = 'overflow: auto; -webkit-overflow-scrolling: touch;';
                    container.scrollTop = 0;
                }
            });
        });
    }

    async undockFromStargate() {
        if (!this.spaceship.isDocked) {
            console.log("Not docked, can't undock");
            return;
        }

        // FIX: For Android, immediately remove any classes that might block touch events
        if (this.isMobileDevice()) {
            document.body.classList.remove('undocking');
            this.resetMobileStyles();
        }

        // Show loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'undocking-indicator';
        loadingIndicator.textContent = 'Undocking...';
        document.body.appendChild(loadingIndicator);

        try {
            console.log("Starting undock sequence...");
            
            // Store shield value before any changes
            this.preUndockShieldValue = this.spaceship.shield;
            console.log(`Storing pre-undock shield value: ${this.preUndockShieldValue}`);

            // Step 1: Close all modals
            await this.performStep(() => this.closeAllModals(), "Closing modals");
            await this.yieldToBrowser();

            // Step 2: Handle mobile-specific cleanup
            if (this.isMobileDevice()) {
                await this.performStep(() => this.resetMobileStyles(), "Resetting mobile styles");
                await this.yieldToBrowser();
            }

            // Step 3: Hide stargate UI and show game UI
            await this.performStep(() => this.hideStargateUI(), "Hiding stargate UI");
            await this.yieldToBrowser();
            
            await this.performStep(() => this.showGameUI(), "Showing game UI");
            await this.yieldToBrowser();

            // Step 4: Perform core undock logic
            console.log("Performing core undock...");
            const newPosition = this.spaceship.undock();
            
            // Step 5: Sync health values immediately
            console.log("Syncing health values...");
            
            // Check for shield reset issue
            if (this.spaceship.shield === 0 && this.preUndockShieldValue > 0) {
                console.log(`Fixing shield reset: Restoring to ${this.preUndockShieldValue}`);
                this.spaceship.shield = this.preUndockShieldValue;
            }

            // Sync values immediately without setTimeout
            this.spaceship.syncValuesToHealthComponent();

            // Publish undocked event with correct state
            const healthData = {
                shield: this.spaceship.shield,
                maxShield: this.spaceship.maxShield,
                hull: this.spaceship.hull,
                maxHull: this.spaceship.maxHull
            };

            // Publish to appropriate message bus
            const messageBus = window.game?.messageBus || window.mainMessageBus;
            if (messageBus) {
                messageBus.publish('player.undocked', healthData);
                console.log("Published player.undocked event with health values:", healthData);
            }

            // Reset docking status
            this.dockingAvailable = false;

            // Request pointer lock if needed (non-mobile only)
            if (this.autoPointerLockOnUndock && !this.isMobileDevice()) {
                await this.performStep(() => this.requestPointerLock(), "Requesting pointer lock");
            }

            console.log("Undock sequence complete");
            
        } catch (error) {
            console.error("Error during undocking:", error);
        } finally {
            // Clean up loading indicator
            if (document.body.contains(loadingIndicator)) {
                document.body.removeChild(loadingIndicator);
            }
            
            // FIX: More aggressive cleanup for Android devices
            if (this.isMobileDevice()) {
                // Clear all restrictive classes
                document.body.classList.remove('undocking', 'modal-open');
                
                // Force resetMobileStyles again to ensure all touch restrictions are removed
                this.resetMobileStyles();
                
                // Ensure specific problematic styles are cleared
                document.body.style.pointerEvents = '';
                document.body.style.touchAction = '';
                document.body.style.overflowY = '';
                document.body.style.position = '';
            } else {
                document.body.classList.remove('undocking');
            }
        }
    }
    
    // Method to detect mobile devices
    isMobileDevice() {
        return ('ontouchstart' in window) || 
               (navigator.maxTouchPoints > 0) || 
               (navigator.msMaxTouchPoints > 0) ||
               (window.innerWidth < 900);
    }
    
    // Method to close any open modal UI that might conflict with undocking
    closeAllModals() {
        try {
            // Close custom system creator if it's open
            const customSystemCreator = document.getElementById('custom-system-creator');
            if (customSystemCreator && window.getComputedStyle(customSystemCreator).display !== 'none') {
                console.log("Closing custom system creator before undocking");
                // See if we can find the close button and simulate a click
                const closeBtn = customSystemCreator.querySelector('#close-system-creator');
                if (closeBtn) {
                    closeBtn.click();
                } else {
                    // Otherwise just hide it directly
                    customSystemCreator.style.display = 'none';
                }
                
                // Force game objects to clean up their modal state
                if (window.game && window.game.ui) {
                    // Check for star map
                    if (window.game.ui.starMap && typeof window.game.ui.starMap.hide === 'function') {
                        window.game.ui.starMap.hide();
                    }
                    
                    // Check for custom system creator
                    if (window.game.ui.customSystemCreator && typeof window.game.ui.customSystemCreator.hide === 'function') {
                        window.game.ui.customSystemCreator.hide();
                    }
                    
                    // Cleanup any modal state on the body
                    document.body.classList.remove('modal-open');
                }
            }
            
            // Close star map if open
            const starMap = document.getElementById('star-map');
            if (starMap && window.getComputedStyle(starMap).display !== 'none') {
                console.log("Closing star map before undocking");
                const closeStarMapBtn = starMap.querySelector('#close-star-map');
                if (closeStarMapBtn) {
                    closeStarMapBtn.click();
                } else {
                    starMap.style.display = 'none';
                }
            }
            
            // Close any other modals
            const allModals = document.querySelectorAll('.modal-container');
            allModals.forEach(modal => {
                if (window.getComputedStyle(modal).display !== 'none') {
                    console.log("Closing modal before undocking:", modal.id || 'unnamed modal');
                    modal.style.display = 'none';
                }
            });
        } catch (err) {
            console.warn("Error while closing modals:", err);
        }
    }
    
    // Helper method to request pointer lock
    requestPointerLock() {
        // Find the canvas element (it should be the first one in the document)
        const canvas = document.querySelector('canvas');
        if (canvas && !document.pointerLockElement) {
            // Request pointer lock with a slight delay to ensure UI transitions are complete
            setTimeout(() => {
                canvas.requestPointerLock();
                console.log("Requested pointer lock for ship control");
            }, 200);
        }
    }
    
    updateStargateUI() {
        if (this.ui && this.ui.stargateInterface) {
            this.ui.stargateInterface.updateStargateUI(this.spaceship, this.resources);
        }
    }
    
    checkStargateProximity() {
        if (this.spaceship.isDocked) return;
        
        if (!this.stargate || !this.spaceship || !this.spaceship.mesh) return;
        
        const stargatePosition = this.stargate.getPosition();
        if (!stargatePosition) return;
        
        const distance = this.spaceship.mesh.position.distanceTo(stargatePosition);
        
        if (distance < 2000) { // Within docking range (4x the original 500)
            this.nearStargate = true;
            if (this.ui && this.ui.stargateInterface) {
                this.ui.stargateInterface.showDockingPrompt();
            }
            // Also show the dock button in touch controls for mobile
            if (this.ui && this.ui.controls && this.ui.controls.isMobile && 
                this.ui.controls.touchControls) {
                this.ui.controls.touchControls.showDockButton();
            }
        } else {
            this.nearStargate = false;
            if (this.ui && this.ui.stargateInterface) {
                this.ui.stargateInterface.hideDockingPrompt();
            }
            // Also hide the dock button in touch controls for mobile
            if (this.ui && this.ui.controls && this.ui.controls.isMobile && 
                this.ui.controls.touchControls) {
                this.ui.controls.touchControls.hideDockButton();
            }
        }
    }
    
    update() {
        // Check if near stargate for docking
        this.checkStargateProximity();
    }
    
    // Setter for resources to allow dependency injection
    setResources(resources) {
        this.resources = resources;
    }
}