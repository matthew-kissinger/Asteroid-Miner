// dockingSystem.js - Handles mothership docking and trading

export class DockingSystem {
    constructor(spaceship, mothership, ui) {
        this.spaceship = spaceship;
        this.mothership = mothership;
        this.ui = ui;
        
        this.nearMothership = false;
        this.isDocked = this.spaceship.isDocked; // Initialize with spaceship's docked state
        
        // Preemptively set a safe undocking position
        if (this.spaceship && this.spaceship.undockLocation && this.mothership) {
            // Position in the middle of the mothership
            this.spaceship.undockLocation.set(0, 10000, 0);
        }
        
        console.log("Initializing docking system, ship is " + (this.isDocked ? "docked" : "undocked"));
        this.setupDockingControls();
        
        // If we're starting docked, publish the player.docked event immediately
        if (this.isDocked && this.spaceship.world && this.spaceship.world.messageBus) {
            this.spaceship.world.messageBus.publish('player.docked', {
                playerPosition: this.spaceship.mesh ? this.spaceship.mesh.position.clone() : null,
                mothership: this.mothership
            });
            console.log("Published initial player.docked event");
        }
    }
    
    setupDockingControls() {
        // Add docking key handler (Q key)
        document.addEventListener('keydown', e => {
            if (e.key.toLowerCase() === 'q') {
                if (this.nearMothership && !this.spaceship.isDocked) {
                    console.log("Q key pressed: Docking with mothership");
                    this.dockWithMothership();
                } else if (this.spaceship.isDocked) {
                    console.log("Q key pressed while docked: No action (use Undock button)");
                } else if (!this.nearMothership) {
                    console.log("Q key pressed but not near mothership");
                }
            }
        });
        
        // Set up mothership UI button handlers
        this.setupMothershipUIControls();
    }
    
    setupMothershipUIControls() {
        // Set up refuel button
        const refuelBtn = document.getElementById('refuel-btn');
        if (refuelBtn) {
            refuelBtn.addEventListener('click', () => {
                if (this.spaceship.credits >= 100) {
                    this.spaceship.credits -= this.spaceship.refuel();
                    this.updateMothershipUI();
                }
            });
        }
        
        // Set up shield repair button
        const repairShieldBtn = document.getElementById('repair-shield-btn');
        if (repairShieldBtn) {
            repairShieldBtn.addEventListener('click', () => {
                if (this.spaceship.credits >= 150) {
                    this.spaceship.credits -= this.spaceship.repairShield();
                    this.updateMothershipUI();
                }
            });
        }
        
        // Set up hull repair button
        const repairHullBtn = document.getElementById('repair-hull-btn');
        if (repairHullBtn) {
            repairHullBtn.addEventListener('click', () => {
                if (this.spaceship.credits >= 200) {
                    this.spaceship.credits -= this.spaceship.repairHull();
                    this.updateMothershipUI();
                }
            });
        }
        
        // Set up undock button
        const undockBtn = document.getElementById('undock-btn');
        if (undockBtn) {
            undockBtn.addEventListener('click', () => {
                console.log("Undock button clicked");
                this.undockFromMothership();
            });
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
                    this.updateMothershipUI();
                }
            });
        }
        
        const sellGoldBtn = document.getElementById('sell-gold');
        if (sellGoldBtn) {
            sellGoldBtn.addEventListener('click', () => {
                if (this.resources.gold > 0) {
                    this.spaceship.credits += this.resources.gold * 50;
                    this.resources.gold = 0;
                    this.updateMothershipUI();
                }
            });
        }
        
        const sellPlatinumBtn = document.getElementById('sell-platinum');
        if (sellPlatinumBtn) {
            sellPlatinumBtn.addEventListener('click', () => {
                if (this.resources.platinum > 0) {
                    this.spaceship.credits += this.resources.platinum * 200;
                    this.resources.platinum = 0;
                    this.updateMothershipUI();
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
                    this.updateMothershipUI();
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
    
    dockWithMothership() {
        console.log("Docking with mothership");
        
        // Only update ship state if it's not already docked
        if (!this.spaceship.isDocked) {
            // Dock the ship
            this.spaceship.dock();
            this.isDocked = true;
            
            // Publish the player.docked event for enemy system and other systems to respond
            if (this.spaceship.world && this.spaceship.world.messageBus) {
                this.spaceship.world.messageBus.publish('player.docked', {
                    playerPosition: this.spaceship.mesh.position.clone(),
                    mothership: this.mothership
                });
                console.log("Published player.docked event");
            }
        } else {
            console.log("Ship is already docked, just showing UI");
        }
        
        // Show the mothership UI
        if (this.ui && this.ui.mothershipInterface) {
            this.ui.mothershipInterface.showMothershipUI();
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
        
        // Update the mothership UI with current values
        this.updateMothershipUI();
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
    hideMothershipUI() {
        if (this.ui && this.ui.mothershipInterface) {
            // Use CSS class for better performance
            document.body.classList.add('undocking');
            this.ui.mothershipInterface.hideMothershipUI();
            console.log("Hiding mothership interface");
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
        // Batch style changes to minimize reflows
        requestAnimationFrame(() => {
            document.body.style.cssText = 'overflow: auto; position: static; height: auto; width: auto;';
            document.body.classList.remove('modal-open');
            
            // Reset scrollable containers in a single pass
            document.querySelectorAll('.modal-content').forEach(container => {
                if (container.style) {
                    container.style.cssText = 'overflow: auto;';
                    container.scrollTop = 0;
                }
            });
        });
    }

    async undockFromMothership() {
        if (!this.spaceship.isDocked) {
            console.log("Not docked, can't undock");
            return;
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

            // Step 1: Close all modals - this is a blocker on mobile
            await this.performStep(() => this.closeAllModals(), "Closing modals");
            await this.yieldToBrowser();

            // Step 2: Handle mobile-specific cleanup
            const isMobile = this.isMobileDevice();
            if (isMobile) {
                console.log("Handling mobile-specific undocking cleanup");
                await this.performStep(() => this.resetMobileStyles(), "Resetting mobile styles");
                await this.yieldToBrowser();
                
                // Fix for touch event issues - ensure touch events are properly reset
                await this.performStep(() => {
                    document.documentElement.style.touchAction = "none";
                    const touchControls = this.getTouchControls();
                    if (touchControls) {
                        console.log("Preparing touch controls for undocking");
                        // Ensure touch controls are properly initialized
                        touchControls.show();
                    }
                }, "Preparing touch controls");
                await this.yieldToBrowser();
            }

            // Step 3: Hide mothership UI and show game UI
            await this.performStep(() => this.hideMothershipUI(), "Hiding mothership UI");
            await this.yieldToBrowser();
            
            await this.performStep(() => this.showGameUI(), "Showing game UI");
            await this.yieldToBrowser();

            // Step 4: Perform core undock logic - THIS MUST HAPPEN AFTER UI CHANGES
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

            // Step 6: Extra mobile-specific post-undock steps
            if (isMobile) {
                await this.performStep(() => {
                    // Ensure the touch controls are visible and working
                    const touchControls = this.getTouchControls();
                    if (touchControls) {
                        console.log("Showing touch controls post-undock");
                        touchControls.show();
                    }
                    
                    // Set this flag explicitly for mobile to prevent conflicts
                    this.isDocked = false;
                    this.spaceship.isDocked = false;
                }, "Finalizing mobile undock");
                await this.yieldToBrowser();
            } else {
                // Request pointer lock if needed (non-mobile only)
                if (this.autoPointerLockOnUndock) {
                    await this.performStep(() => this.requestPointerLock(), "Requesting pointer lock");
                }
            }

            console.log("Undock sequence complete");
            
        } catch (error) {
            console.error("Error during undocking:", error);
        } finally {
            // Clean up loading indicator
            document.body.removeChild(loadingIndicator);
        }
    }
    
    // Helper method to get touch controls instance
    getTouchControls() {
        // Try through various possible paths
        if (window.game && window.game.controls && window.game.controls.touchControls) {
            return window.game.controls.touchControls;
        }
        
        if (this.ui && this.ui.controls && this.ui.controls.touchControls) {
            return this.ui.controls.touchControls;
        }
        
        return null;
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
    
    updateMothershipUI() {
        if (this.ui && this.ui.mothershipInterface) {
            this.ui.mothershipInterface.updateMothershipUI(this.spaceship, this.resources);
        }
    }
    
    checkMothershipProximity() {
        if (this.spaceship.isDocked) return;
        
        if (!this.mothership || !this.spaceship || !this.spaceship.mesh) return;
        
        const mothershipPosition = this.mothership.getPosition();
        if (!mothershipPosition) return;
        
        const distance = this.spaceship.mesh.position.distanceTo(mothershipPosition);
        
        if (distance < 2000) { // Within docking range (4x the original 500)
            this.nearMothership = true;
            if (this.ui && this.ui.mothershipInterface) {
                this.ui.mothershipInterface.showDockingPrompt();
            }
            // Also show the dock button in touch controls for mobile
            if (this.ui && this.ui.controls && this.ui.controls.isMobile && 
                this.ui.controls.touchControls) {
                this.ui.controls.touchControls.showDockButton();
            }
        } else {
            this.nearMothership = false;
            if (this.ui && this.ui.mothershipInterface) {
                this.ui.mothershipInterface.hideDockingPrompt();
            }
            // Also hide the dock button in touch controls for mobile
            if (this.ui && this.ui.controls && this.ui.controls.isMobile && 
                this.ui.controls.touchControls) {
                this.ui.controls.touchControls.hideDockButton();
            }
        }
    }
    
    update() {
        // Check if near mothership for docking
        this.checkMothershipProximity();
    }
    
    // Setter for resources to allow dependency injection
    setResources(resources) {
        this.resources = resources;
    }
}