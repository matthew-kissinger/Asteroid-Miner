// uiIntegration.js - Handles UI integration for docking system

export class UIIntegration {
    constructor() {
        this.resources = null;
    }

    setupDockingControls(proximityDetector, dockingLogic, spaceship, ui) {
        // Add docking key handler (Q key)
        document.addEventListener('keydown', e => {
            if (e.key.toLowerCase() === 'q') {
                if (proximityDetector.isNearStargate() && !spaceship.isDocked) {
                    console.log("Q key pressed: Docking with stargate");
                    dockingLogic.dockWithStargate(spaceship, ui.stargate, ui);
                } else if (spaceship.isDocked) {
                    console.log("Q key pressed while docked: No action (use Undock button)");
                } else if (!proximityDetector.isNearStargate()) {
                    console.log("Q key pressed but not near stargate");
                }
            }
        });
        
        // Set up stargate UI button handlers
        this.setupStargateUIControls(spaceship, ui);
    }

    setupStargateUIControls(spaceship, ui) {
        // Set up refuel button
        const refuelBtn = document.getElementById('refuel-btn');
        if (refuelBtn) {
            refuelBtn.addEventListener('click', () => {
                if (spaceship.credits >= 100) {
                    spaceship.credits -= spaceship.refuel();
                    this.updateStargateUI(spaceship, ui);
                }
            });
        }
        
        // Set up shield repair button
        const repairShieldBtn = document.getElementById('repair-shield-btn');
        if (repairShieldBtn) {
            repairShieldBtn.addEventListener('click', () => {
                if (spaceship.credits >= 150) {
                    spaceship.credits -= spaceship.repairShield();
                    this.updateStargateUI(spaceship, ui);
                }
            });
        }
        
        // Set up hull repair button
        const repairHullBtn = document.getElementById('repair-hull-btn');
        if (repairHullBtn) {
            repairHullBtn.addEventListener('click', () => {
                if (spaceship.credits >= 200) {
                    spaceship.credits -= spaceship.repairHull();
                    this.updateStargateUI(spaceship, ui);
                }
            });
        }
        
        // Set up undock button - this will be handled by the main docking system
        this.setupUndockButton();
        
        // Set up resource selling buttons
        this.setupSellingButtons(spaceship, ui);
        
        // Set up upgrade buttons
        this.setupUpgradeButtons(spaceship, ui);
    }

    setupUndockButton() {
        const undockBtn = document.getElementById('undock-btn');
        if (undockBtn) {
            // The undock handler will be set up by the main docking system
            // This is just for mobile-specific touch handling
            undockBtn.addEventListener('touchstart', (e) => {
                console.log("Touch started on undock button");
                e.stopPropagation();
            }, { passive: false });
        }
    }

    setupSellingButtons(spaceship, ui) {
        const sellIronBtn = document.getElementById('sell-iron');
        if (sellIronBtn) {
            sellIronBtn.addEventListener('click', () => {
                if (this.resources.iron > 0) {
                    spaceship.credits += this.resources.iron * 10;
                    this.resources.iron = 0;
                    this.updateStargateUI(spaceship, ui);
                }
            });
        }
        
        const sellGoldBtn = document.getElementById('sell-gold');
        if (sellGoldBtn) {
            sellGoldBtn.addEventListener('click', () => {
                if (this.resources.gold > 0) {
                    spaceship.credits += this.resources.gold * 50;
                    this.resources.gold = 0;
                    this.updateStargateUI(spaceship, ui);
                }
            });
        }
        
        const sellPlatinumBtn = document.getElementById('sell-platinum');
        if (sellPlatinumBtn) {
            sellPlatinumBtn.addEventListener('click', () => {
                if (this.resources.platinum > 0) {
                    spaceship.credits += this.resources.platinum * 200;
                    this.resources.platinum = 0;
                    this.updateStargateUI(spaceship, ui);
                }
            });
        }
    }

    setupUpgradeButtons(spaceship, ui) {
        // Fuel tank upgrade button handler
        this.setupUpgradeButton('upgrade-fuel-tank', 
            () => spaceship.fuelUpgradeCost,
            () => spaceship.upgradeFuelTank(),
            spaceship, ui);
        
        // Engine upgrade button handler
        this.setupUpgradeButton('upgrade-engine', 
            () => spaceship.engineUpgradeCost,
            () => spaceship.upgradeEngine(),
            spaceship, ui);
        
        // Mining laser upgrade button handler
        this.setupUpgradeButton('upgrade-mining', 
            () => spaceship.miningUpgradeCost,
            () => spaceship.upgradeMiningLaser(),
            spaceship, ui);
        
        // Hull upgrade button handler
        this.setupUpgradeButton('upgrade-hull', 
            () => spaceship.hullUpgradeCost,
            () => spaceship.upgradeHull(),
            spaceship, ui);
        
        // Scanner upgrade button handler
        this.setupUpgradeButton('upgrade-scanner', 
            () => spaceship.scannerUpgradeCost,
            () => spaceship.upgradeScanner(),
            spaceship, ui);
    }

    // Helper method to set up an upgrade button with a given cost getter and upgrade function
    setupUpgradeButton(buttonId, costGetter, upgradeFunction, spaceship, ui) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', () => {
                const cost = costGetter();
                if (spaceship.credits >= cost) {
                    spaceship.credits -= cost;
                    upgradeFunction();
                    
                    // Update the mining system's efficiency if we upgraded the mining laser
                    if (buttonId === 'upgrade-mining' && this.updateMiningSystem) {
                        this.updateMiningSystem(spaceship, ui);
                    }
                    
                    // Update UI
                    this.updateStargateUI(spaceship, ui);
                }
            });
        }
    }

    // Method to update the mining system when mining efficiency is upgraded
    updateMiningSystem(spaceship, ui) {
        // Find the mining system through the Controls object to pass the new efficiency
        if (ui && ui.controls && ui.controls.miningSystem) {
            // Apply the mining efficiency to the mining speed
            const miningSystem = ui.controls.miningSystem;
            
            // Update mining speeds for each resource type based on the new efficiency
            Object.keys(miningSystem.miningSpeedByType).forEach(resourceType => {
                const baseSpeed = miningSystem.miningSpeedByType[resourceType];
                miningSystem.miningSpeedByType[resourceType] = 
                    baseSpeed * spaceship.miningEfficiency;
            });
            
            console.log("Mining system updated with new efficiency:", spaceship.miningEfficiency);
        }
    }

    updateStargateUI(spaceship, ui) {
        if (ui && ui.stargateInterface) {
            ui.stargateInterface.updateStargateUI(spaceship, this.resources);
        }
    }

    // Optimized method to hide UI elements using a single reflow
    hideStargateUI(ui) {
        if (ui && ui.stargateInterface) {
            // Use CSS class for better performance
            document.body.classList.add('undocking');
            ui.stargateInterface.hideStargateUI();
            console.log("Hiding stargate interface");
        }
    }

    // Optimized method to show game UI elements using a single reflow
    showGameUI(ui) {
        if (ui) {
            // Use CSS class for better performance
            document.body.classList.remove('undocking');
            ui.showUI();
            console.log("Showing game UI");
        }
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

    // Setter for resources to allow dependency injection
    setResources(resources) {
        this.resources = resources;
    }
}