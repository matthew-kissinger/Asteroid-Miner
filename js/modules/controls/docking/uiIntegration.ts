// uiIntegration.js - Handles UI integration for docking system

import type { DockingSpaceship, DockingUI, ResourceInventory } from './types.ts';
import { debugLog } from '../../../globals/debug.js';
import { mainMessageBus } from '../../../globals/messageBus.ts';

type GameWindow = Window & {
    game?: {
        ui?: {
            starMap?: {
                hide?: () => void;
            };
            customSystemCreator?: {
                hide?: () => void;
            };
        };
    };
};

interface ListenerBinding {
    element: EventTarget;
    event: string;
    handler: EventListenerOrEventListenerObject;
    options?: AddEventListenerOptions;
}

export class UIIntegration {
    resources: ResourceInventory | null;
    private bindings: ListenerBinding[] = [];

    constructor() {
        this.resources = null;
    }

    private addBinding(
        element: EventTarget,
        event: string,
        handler: EventListenerOrEventListenerObject,
        options?: AddEventListenerOptions
    ): void {
        element.addEventListener(event, handler, options);
        this.bindings.push({ element, event, handler, options });
    }

    /** Removes all event listeners. Call when tearing down the docking UI. */
    cleanup(): void {
        for (const { element, event, handler, options } of this.bindings) {
            element.removeEventListener(event, handler, options);
        }
        this.bindings.length = 0;
    }

    setupDockingControls(proximityDetector: { isNearStargate: () => boolean }, dockingLogic: { dockWithStargate: (spaceship: DockingSpaceship, stargate: unknown, ui: DockingUI) => void }, spaceship: DockingSpaceship, ui: DockingUI): void {
        const onKeydown = (e: KeyboardEvent): void => {
            if (e.key.toLowerCase() === 'q') {
                if (proximityDetector.isNearStargate() && !spaceship.isDocked) {
                    debugLog("Q key pressed: Docking with stargate");
                    dockingLogic.dockWithStargate(spaceship, ui.stargate, ui);
                } else if (spaceship.isDocked) {
                    debugLog("Q key pressed while docked: No action (use Undock button)");
                } else if (!proximityDetector.isNearStargate()) {
                    debugLog("Q key pressed but not near stargate");
                }
            }
        };
        this.addBinding(document, 'keydown', onKeydown as EventListener);

        this.setupStargateUIControls(spaceship, ui);
    }

    setupStargateUIControls(spaceship: DockingSpaceship, ui: DockingUI): void {
        const refuelBtn = document.getElementById('refuel-btn');
        if (refuelBtn) {
            const handler = (): void => {
                if (spaceship.credits >= 100) {
                    spaceship.credits -= spaceship.refuel();
                    this.updateStargateUI(spaceship, ui);
                }
            };
            this.addBinding(refuelBtn, 'click', handler);
        }

        const repairShieldBtn = document.getElementById('repair-shield-btn');
        if (repairShieldBtn) {
            const handler = (): void => {
                if (spaceship.credits >= 150) {
                    spaceship.credits -= spaceship.repairShield();
                    this.updateStargateUI(spaceship, ui);
                }
            };
            this.addBinding(repairShieldBtn, 'click', handler);
        }

        const repairHullBtn = document.getElementById('repair-hull-btn');
        if (repairHullBtn) {
            const handler = (): void => {
                if (spaceship.credits >= 200) {
                    spaceship.credits -= spaceship.repairHull();
                    this.updateStargateUI(spaceship, ui);
                }
            };
            this.addBinding(repairHullBtn, 'click', handler);
        }

        this.setupUndockButton();
        this.setupSellingButtons(spaceship, ui);
        this.setupUpgradeButtons(spaceship, ui);
    }

    setupUndockButton(): void {
        const undockBtn = document.getElementById('undock-btn');
        if (undockBtn) {
            const handler = (e: TouchEvent): void => {
                debugLog("Touch started on undock button");
                e.stopPropagation();
            };
            this.addBinding(undockBtn, 'touchstart', handler as EventListener, { passive: false });
        }
    }

    setupSellingButtons(spaceship: DockingSpaceship, ui: DockingUI): void {
        const sellIronBtn = document.getElementById('sell-iron');
        if (sellIronBtn) {
            const handler = (): void => {
                if (this.resources && this.resources.iron > 0) {
                    const amount = this.resources.iron;
                    spaceship.credits += amount * 10;
                    this.resources.iron = 0;
                    mainMessageBus.publish('trading.resourceSold', { amount, resourceType: 'iron' });
                    this.updateStargateUI(spaceship, ui);
                }
            };
            this.addBinding(sellIronBtn, 'click', handler);
        }

        const sellGoldBtn = document.getElementById('sell-gold');
        if (sellGoldBtn) {
            const handler = (): void => {
                if (this.resources && this.resources.gold > 0) {
                    const amount = this.resources.gold;
                    spaceship.credits += amount * 50;
                    this.resources.gold = 0;
                    mainMessageBus.publish('trading.resourceSold', { amount, resourceType: 'gold' });
                    this.updateStargateUI(spaceship, ui);
                }
            };
            this.addBinding(sellGoldBtn, 'click', handler);
        }

        const sellPlatinumBtn = document.getElementById('sell-platinum');
        if (sellPlatinumBtn) {
            const handler = (): void => {
                if (this.resources && this.resources.platinum > 0) {
                    const amount = this.resources.platinum;
                    spaceship.credits += amount * 200;
                    this.resources.platinum = 0;
                    mainMessageBus.publish('trading.resourceSold', { amount, resourceType: 'platinum' });
                    this.updateStargateUI(spaceship, ui);
                }
            };
            this.addBinding(sellPlatinumBtn, 'click', handler);
        }
    }

    setupUpgradeButtons(spaceship: DockingSpaceship, ui: DockingUI): void {
        this.setupUpgradeButton('upgrade-fuel-tank',
            () => spaceship.fuelUpgradeCost,
            () => spaceship.upgradeFuelTank(),
            spaceship, ui);
        this.setupUpgradeButton('upgrade-engine',
            () => spaceship.engineUpgradeCost,
            () => spaceship.upgradeEngine(),
            spaceship, ui);
        this.setupUpgradeButton('upgrade-mining',
            () => spaceship.miningUpgradeCost,
            () => spaceship.upgradeMiningLaser(),
            spaceship, ui);
        this.setupUpgradeButton('upgrade-hull',
            () => spaceship.hullUpgradeCost,
            () => spaceship.upgradeHull(),
            spaceship, ui);
        this.setupUpgradeButton('upgrade-scanner',
            () => spaceship.scannerUpgradeCost,
            () => spaceship.upgradeScanner(),
            spaceship, ui);
    }

    setupUpgradeButton(
        buttonId: string,
        costGetter: () => number,
        upgradeFunction: () => void,
        spaceship: DockingSpaceship,
        ui: DockingUI
    ): void {
        const button = document.getElementById(buttonId);
        if (button) {
            const handler = (): void => {
                const cost = costGetter();
                if (spaceship.credits >= cost) {
                    spaceship.credits -= cost;
                    upgradeFunction();
                    if (buttonId === 'upgrade-mining' && this.updateMiningSystem) {
                        this.updateMiningSystem(spaceship, ui);
                    }
                    this.updateStargateUI(spaceship, ui);
                }
            };
            this.addBinding(button, 'click', handler);
        }
    }

    // Method to update the mining system when mining efficiency is upgraded
    updateMiningSystem(spaceship: DockingSpaceship, ui: DockingUI): void {
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
            
            debugLog("Mining system updated with new efficiency:", spaceship.miningEfficiency);
        }
    }

    updateStargateUI(spaceship: DockingSpaceship, ui: DockingUI): void {
        if (ui && ui.stargateInterface) {
            ui.stargateInterface.updateStargateUI?.(spaceship, this.resources);
        }
    }

    // Optimized method to hide UI elements using a single reflow
    hideStargateUI(ui: DockingUI): void {
        if (ui && ui.stargateInterface) {
            // Use CSS class for better performance
            document.body.classList.add('undocking');
            ui.stargateInterface.hideStargateUI?.();
            debugLog("Hiding stargate interface");
        }
    }

    // Optimized method to show game UI elements using a single reflow
    showGameUI(ui: DockingUI): void {
        if (ui) {
            // Use CSS class for better performance
            document.body.classList.remove('undocking');
            ui.showUI?.();
            debugLog("Showing game UI");
        }
    }

    // Method to close any open modal UI that might conflict with undocking
    closeAllModals(): void {
        try {
            // Close custom system creator if it's open
            const customSystemCreator = document.getElementById('custom-system-creator');
            if (customSystemCreator && window.getComputedStyle(customSystemCreator).display !== 'none') {
                debugLog("Closing custom system creator before undocking");
                // See if we can find the close button and simulate a click
                const closeBtn = customSystemCreator.querySelector('#close-system-creator') as HTMLElement | null;
                if (closeBtn) {
                    closeBtn.click();
                } else {
                    // Otherwise just hide it directly
                    customSystemCreator.style.display = 'none';
                }
                
                // Force game objects to clean up their modal state
                const windowWithGame = window as GameWindow;
                if (windowWithGame.game && windowWithGame.game.ui) {
                    // Check for star map
                    if (windowWithGame.game.ui.starMap && typeof windowWithGame.game.ui.starMap.hide === 'function') {
                        windowWithGame.game.ui.starMap.hide();
                    }
                    
                    // Check for custom system creator
                    if (windowWithGame.game.ui.customSystemCreator && typeof windowWithGame.game.ui.customSystemCreator.hide === 'function') {
                        windowWithGame.game.ui.customSystemCreator.hide();
                    }
                    
                    // Cleanup any modal state on the body
                    document.body.classList.remove('modal-open');
                }
            }
            
            // Close star map if open
            const starMap = document.getElementById('star-map');
            if (starMap && window.getComputedStyle(starMap).display !== 'none') {
                debugLog("Closing star map before undocking");
                const closeStarMapBtn = starMap.querySelector('#close-star-map') as HTMLElement | null;
                if (closeStarMapBtn) {
                    closeStarMapBtn.click();
                } else {
                    starMap.style.display = 'none';
                }
            }
            
            // Close any other modals
            const allModals = document.querySelectorAll('.modal-container');
            allModals.forEach(modal => {
                const modalElement = modal as HTMLElement;
                if (window.getComputedStyle(modalElement).display !== 'none') {
                    debugLog("Closing modal before undocking:", modalElement.id || 'unnamed modal');
                    modalElement.style.display = 'none';
                }
            });
        } catch (err) {
            console.warn("Error while closing modals:", err);
        }
    }

    // Setter for resources to allow dependency injection
    setResources(resources: ResourceInventory): void {
        this.resources = resources;
    }
}
