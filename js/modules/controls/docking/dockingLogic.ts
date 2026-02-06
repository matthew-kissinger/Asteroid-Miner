// dockingLogic.js - Core docking and undocking logic

import type { DockingSpaceship, DockingUI, MessageBus } from './types.ts';

type GameWindow = Window & {
    game?: {
        messageBus?: MessageBus;
        ui?: {
            starMap?: {
                hide?: () => void;
            };
            customSystemCreator?: {
                hide?: () => void;
            };
        };
    };
    mainMessageBus?: MessageBus;
};

export class DockingLogic {
    isDocked: boolean;
    dockingAvailable: boolean;
    autoPointerLockOnUndock: boolean;
    preUndockShieldValue: number;

    constructor() {
        this.isDocked = false;
        this.dockingAvailable = false;
        this.autoPointerLockOnUndock = true;
        this.preUndockShieldValue = 0;
    }

    // Method to detect mobile devices
    isMobileDevice(): boolean {
        return ('ontouchstart' in window) || 
               (navigator.maxTouchPoints > 0) || 
               (window.innerWidth < 900);
    }

    dockWithStargate(spaceship: DockingSpaceship, stargate: unknown, ui: DockingUI): void {
        console.log("Docking with stargate");
        
        // Only update ship state if it's not already docked
        if (!spaceship.isDocked) {
            // Dock the ship
            spaceship.dock();
            this.isDocked = true;
            
            // Publish the player.docked event for enemy system and other systems to respond
            if (spaceship.world && spaceship.world.messageBus) {
                spaceship.world.messageBus.publish('player.docked', {
                    playerPosition: spaceship.mesh.position.clone(),
                    stargate: stargate
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
            document.body.classList.add('undocked-body');
            
            // Reset any problematic styles that might prevent UI from showing
            document.body.style.overflow = 'auto';
        }
        
        // Show the stargate UI
        if (ui && ui.stargateInterface) {
            console.log("Showing stargate UI...");
            ui.stargateInterface.showStargateUI?.();
            
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
        if (ui) {
            ui.hideUI?.();
        }
        
        // Exit pointer lock so cursor is visible for UI interactions
        if (document.pointerLockElement) {
            document.exitPointerLock();
            console.log("Exited pointer lock for UI interaction");
        }
    }

    // Helper to wrap steps in requestAnimationFrame for smoother UI updates
    async performStep(stepFunction: () => void, stepName: string): Promise<void> {
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
    async yieldToBrowser(): Promise<void> {
        return new Promise(resolve => requestAnimationFrame(() => resolve()));
    }

    // Optimized method to reset mobile styles
    resetMobileStyles(): void {
        // Immediately remove problematic classes for Android
        if (this.isMobileDevice()) {
            document.body.classList.remove('undocking', 'modal-open');
        }
        
        // Batch style changes to minimize reflows
        requestAnimationFrame(() => {
            // FIX: More aggressive style clearing for Android
            document.body.style.cssText = '';
            document.body.classList.add('undocked-body');
            document.body.style.overflow = 'auto';
            document.body.style.setProperty('-webkit-overflow-scrolling', 'touch');
            
            // FIX: Ensure all restrictive classes are removed to prevent touch event issues
            document.body.classList.remove('modal-open', 'undocking');
            
            // Reset scrollable containers in a single pass
            document.querySelectorAll('.modal-content, #stargate-ui, #star-map').forEach(container => {
                const element = container as HTMLElement;
                if (element && element.style) {
                    element.style.cssText = 'overflow: auto; -webkit-overflow-scrolling: touch;';
                    element.scrollTop = 0;
                }
            });
        });
    }

    // Helper method to request pointer lock
    requestPointerLock(): void {
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

    async undockFromStargate(
        spaceship: DockingSpaceship,
        ui: DockingUI,
        closeAllModalsCallback: () => void,
        hideStargateUICallback: () => void,
        showGameUICallback: () => void
    ): Promise<void> {
        void ui;
        if (!spaceship.isDocked) {
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
            this.preUndockShieldValue = spaceship.shield;
            console.log(`Storing pre-undock shield value: ${this.preUndockShieldValue}`);

            // Step 1: Close all modals
            await this.performStep(() => closeAllModalsCallback(), "Closing modals");
            await this.yieldToBrowser();

            // Step 2: Handle mobile-specific cleanup
            if (this.isMobileDevice()) {
                await this.performStep(() => this.resetMobileStyles(), "Resetting mobile styles");
                await this.yieldToBrowser();
            }

            // Step 3: Hide stargate UI and show game UI
            await this.performStep(() => hideStargateUICallback(), "Hiding stargate UI");
            await this.yieldToBrowser();
            
            await this.performStep(() => showGameUICallback(), "Showing game UI");
            await this.yieldToBrowser();

            // Step 4: Perform core undock logic
            console.log("Performing core undock...");
            spaceship.undock();
            
            // Step 5: Sync health values immediately
            console.log("Syncing health values...");
            
            // Check for shield reset issue
            if (spaceship.shield === 0 && this.preUndockShieldValue > 0) {
                console.log(`Fixing shield reset: Restoring to ${this.preUndockShieldValue}`);
                spaceship.shield = this.preUndockShieldValue;
            }

            // Sync values immediately without setTimeout
            spaceship.syncValuesToHealthComponent();

            // Publish undocked event with correct state
            const healthData = {
                shield: spaceship.shield,
                maxShield: spaceship.maxShield,
                hull: spaceship.hull,
                maxHull: spaceship.maxHull
            };

            // Publish to appropriate message bus
            const windowWithGame = window as GameWindow;
            const messageBus = windowWithGame.game?.messageBus || windowWithGame.mainMessageBus;
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
}
