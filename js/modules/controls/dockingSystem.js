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
            // Position between mothership and sun, but much closer to mothership
            this.spaceship.undockLocation.set(0, 1500, 0);
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
    
    undockFromMothership() {
        if (!this.spaceship.isDocked) {
            console.log("Not docked, can't undock");
            return;
        }
        
        // Log spaceship state before undocking
        console.log("Spaceship state BEFORE undock process:", {
            shield: this.spaceship.shield,
            maxShield: this.spaceship.maxShield,
            hull: this.spaceship.hull,
            maxHull: this.spaceship.maxHull,
            isDocked: this.spaceship.isDocked
        });
        
        // Store the shield value before undocking to handle potential resets
        this.preUndockShieldValue = this.spaceship.shield;
        console.log(`Storing pre-undock shield value: ${this.preUndockShieldValue}`);
        
        // Hide the mothership UI
        if (this.ui && this.ui.mothershipInterface) {
            this.ui.mothershipInterface.hideMothershipUI();
            console.log("Hiding mothership interface");
        } else {
            console.warn("Could not hide mothership interface: UI or mothershipInterface is null");
        }
        
        // Show the game UI
        if (this.ui) {
            this.ui.showUI();
            console.log("Showing game UI");
        }
        
        // Call spaceship's undock method to position it correctly
        console.log("Undocking spaceship");
        const newPosition = this.spaceship.undock();
        
        // Log spaceship state after undocking but before delayed sync
        console.log("Spaceship state AFTER undock but BEFORE delayed sync:", {
            shield: this.spaceship.shield,
            maxShield: this.spaceship.maxShield,
            hull: this.spaceship.hull,
            maxHull: this.spaceship.maxHull,
            isDocked: this.spaceship.isDocked
        });
        
        // Sync the values with a slight delay to ensure player entity is fully active
        setTimeout(() => {
            console.log("Delayed health sync - ensuring values are transferred");
            console.log("Spaceship state BEFORE delayed sync:", {
                shield: this.spaceship.shield,
                maxShield: this.spaceship.maxShield,
                hull: this.spaceship.hull,
                maxHull: this.spaceship.maxHull
            });
            
            // CRITICAL FIX: Check if shield value was reset to 0 unexpectedly 
            // If we see that shield is 0 now but wasn't 0 when we initiated the undock
            if (this.spaceship.shield === 0 && this.preUndockShieldValue && this.preUndockShieldValue > 0) {
                console.log(`CRITICAL FIX: Shield was reset to 0 during undocking! Restoring to previous value: ${this.preUndockShieldValue}`);
                this.spaceship.shield = this.preUndockShieldValue;
            }
            
            this.spaceship.syncValuesToHealthComponent();
            
            // Also publish a player.undocked event that the health component can listen for
            if (window.game && window.game.messageBus) {
                const healthData = {
                    shield: this.spaceship.shield,
                    maxShield: this.spaceship.maxShield,
                    hull: this.spaceship.hull,
                    maxHull: this.spaceship.maxHull
                };
                
                window.game.messageBus.publish('player.undocked', healthData);
                console.log("Published player.undocked event with health values:", healthData);
            } else if (window.mainMessageBus) {
                const healthData = {
                    shield: this.spaceship.shield,
                    maxShield: this.spaceship.maxShield,
                    hull: this.spaceship.hull,
                    maxHull: this.spaceship.maxHull
                };
                
                window.mainMessageBus.publish('player.undocked', healthData);
                console.log("Published player.undocked event with health values (via mainMessageBus):", healthData);
            }
        }, 500); // 500ms delay to ensure player entity is active
        
        // Log the undock position for debugging
        if (newPosition) {
            console.log(`Ship undocked, position: ${newPosition}`);
        } else {
            console.log("Ship undocked, but no position returned");
        }
        
        // Reset docking available status - need to move away to dock again
        this.dockingAvailable = false;
        
        // Request pointer lock if configured
        if (this.autoPointerLockOnUndock) {
            setTimeout(() => {
                this.requestPointerLock();
            }, 500); // Short delay to ensure UI updates are complete
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
        
        if (distance < 500) { // Within docking range
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