// actionButtons.js - Action button creation and styling

export class ActionButtons {
    buttons: {
        fire: HTMLDivElement | null;
        mine: HTMLDivElement | null;
        target: HTMLDivElement | null;
        dock: HTMLDivElement | null;
        deployLaser: HTMLDivElement | null;
    };
    containers: {
        left: HTMLDivElement | null;
        right: HTMLDivElement | null;
    };

    constructor() {
        this.buttons = {
            fire: null,
            mine: null,
            target: null,
            dock: null,
            deployLaser: null
        };
        this.containers = {
            left: null,
            right: null
        };
    }

    createActionButtons(): {
        fire: HTMLDivElement | null;
        mine: HTMLDivElement | null;
        target: HTMLDivElement | null;
        dock: HTMLDivElement | null;
        deployLaser: HTMLDivElement | null;
    } {
        this.createButtonContainers();
        this.createFireButton();
        this.createMineButton();
        this.createTargetButton();
        this.createDockButton();
        this.createDeployLaserButton();
        
        return this.buttons;
    }

    createButtonContainers(): void {
        // Create a container for left side action buttons
        const leftActionButtonsContainer = document.createElement('div');
        leftActionButtonsContainer.id = 'mobile-action-buttons-left';
        leftActionButtonsContainer.classList.add('touch-action-buttons-left');
        document.body.appendChild(leftActionButtonsContainer);
        this.containers.left = leftActionButtonsContainer;
        
        // Create a container for right side action buttons
        const rightActionButtonsContainer = document.createElement('div');
        rightActionButtonsContainer.id = 'mobile-action-buttons-right';
        rightActionButtonsContainer.classList.add('touch-action-buttons-right');
        document.body.appendChild(rightActionButtonsContainer);
        this.containers.right = rightActionButtonsContainer;
    }

    createFireButton(): HTMLDivElement | null {
        this.buttons.fire = this.createActionButton(this.containers.left, 'FIRE', 'fire');
        return this.buttons.fire;
    }

    createMineButton(): HTMLDivElement | null {
        this.buttons.mine = this.createActionButton(this.containers.left, 'MINE', 'mine');
        return this.buttons.mine;
    }

    createTargetButton(): HTMLDivElement | null {
        this.buttons.target = this.createActionButton(this.containers.right, 'TARGET', 'target');
        return this.buttons.target;
    }

    createDockButton(): HTMLDivElement | null {
        // Create dock button (only shown when near stargate)
        this.buttons.dock = this.createActionButton(null, 'DOCK', 'dock');
        document.body.appendChild(this.buttons.dock);
        return this.buttons.dock;
    }

    createDeployLaserButton(): HTMLDivElement | null {
        this.buttons.deployLaser = this.createActionButton(this.containers.right, 'DEPLOY', 'deploy');
        return this.buttons.deployLaser;
    }

    createActionButton(parent: HTMLDivElement | null, text: string, variant: string): HTMLDivElement {
        const button = document.createElement('div');
        button.classList.add('touch-action-btn', `touch-action-btn--${variant}`);
        button.textContent = text;
        
        if (parent) {
            parent.appendChild(button);
        }
        
        return button;
    }

    showDockButton(): void {
        if (this.buttons.dock) {
            this.buttons.dock.classList.add('touch-action-btn--visible');
            console.log("Showing dock button - near stargate");
        }
    }

    hideDockButton(): void {
        if (this.buttons.dock) {
            this.buttons.dock.classList.remove('touch-action-btn--visible');
        }
    }

    hideButtons(): void {
        if (this.containers.left) this.containers.left.classList.add('touch-action-buttons-left--hidden');
        if (this.containers.right) this.containers.right.classList.add('touch-action-buttons-right--hidden');
        this.hideDockButton();
    }

    showButtons(): void {
        if (this.containers.left) this.containers.left.classList.remove('touch-action-buttons-left--hidden');
        if (this.containers.right) this.containers.right.classList.remove('touch-action-buttons-right--hidden');
    }

    // Helper method to add events to buttons
    addButtonEvents(button: HTMLElement | null, startHandler: () => void, endHandler: (() => void) | null = null): void {
        if (!button) {
            console.error("ActionButtons: Cannot add events to null button");
            return;
        }
        
        // For continuous actions (like firing and mining)
        if (endHandler) {
            // Touch events with passive: false to allow preventDefault
            button.addEventListener('touchstart', (e: TouchEvent) => {
                e.preventDefault();
                button.classList.add('touch-action-btn--pressed');
                startHandler();
            }, { passive: false });
            
            button.addEventListener('touchend', (e: TouchEvent) => {
                e.preventDefault();
                button.classList.remove('touch-action-btn--pressed');
                endHandler();
            }, { passive: false });
            
            // Add pointer events
            button.addEventListener('pointerdown', (e: PointerEvent) => {
                e.preventDefault();
                if (e.pointerType === 'touch') return; // Skip if touch (handled by touch events)
                button.classList.add('touch-action-btn--pressed');
                startHandler();
            });
            
            button.addEventListener('pointerup', (e: PointerEvent) => {
                e.preventDefault();
                if (e.pointerType === 'touch') return; // Skip if touch (handled by touch events)
                button.classList.remove('touch-action-btn--pressed');
                endHandler();
            });
            
            // Keep mouse events for backward compatibility
            button.addEventListener('mousedown', () => {
                button.classList.add('touch-action-btn--pressed');
                startHandler();
            });
            
            button.addEventListener('mouseup', () => {
                button.classList.remove('touch-action-btn--pressed');
                endHandler();
            });
        }
        // For single actions (like targeting and docking)
        else {
            // Touch events
            button.addEventListener('touchstart', (e: TouchEvent) => {
                e.preventDefault();
                button.classList.add('touch-action-btn--pressed');
                
                // For dock button specifically, add debug logging
                if (button === this.buttons.dock) {
                    console.log("Dock button touchstart event fired");
                }
            }, { passive: false });
            
            button.addEventListener('touchend', (e: TouchEvent) => {
                e.preventDefault();
                button.classList.remove('touch-action-btn--pressed');
                
                // For dock button specifically, add debug logging
                if (button === this.buttons.dock) {
                    console.log("Dock button touchend event fired, calling handler");
                }
                
                startHandler();
            }, { passive: false });
            
            // Add pointer events
            button.addEventListener('pointerdown', (e: PointerEvent) => {
                e.preventDefault();
                if (e.pointerType === 'touch') return; // Skip if touch (handled by touch events)
                button.classList.add('touch-action-btn--pressed');
                
                // For dock button specifically, add debug logging
                if (button === this.buttons.dock) {
                    console.log("Dock button pointerdown event fired");
                }
            });
            
            button.addEventListener('pointerup', (e: PointerEvent) => {
                e.preventDefault();
                if (e.pointerType === 'touch') return; // Skip if touch (handled by touch events)
                button.classList.remove('touch-action-btn--pressed');
                
                // For dock button specifically, add debug logging
                if (button === this.buttons.dock) {
                    console.log("Dock button pointerup event fired, calling handler");
                }
                
                startHandler();
            });
            
            // Keep mouse events for backward compatibility
            button.addEventListener('mousedown', () => {
                button.classList.add('touch-action-btn--pressed');
            });
            
            button.addEventListener('mouseup', () => {
                button.classList.remove('touch-action-btn--pressed');
                startHandler();
            });
        }
    }
}
