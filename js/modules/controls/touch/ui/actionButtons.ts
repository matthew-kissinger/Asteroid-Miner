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
        leftActionButtonsContainer.style.position = 'absolute';
        leftActionButtonsContainer.style.bottom = '170px';
        leftActionButtonsContainer.style.left = '20px';
        leftActionButtonsContainer.style.display = 'flex';
        leftActionButtonsContainer.style.flexDirection = 'column';
        leftActionButtonsContainer.style.gap = '15px';
        leftActionButtonsContainer.style.zIndex = '1000';
        document.body.appendChild(leftActionButtonsContainer);
        this.containers.left = leftActionButtonsContainer;
        
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
        this.containers.right = rightActionButtonsContainer;
    }

    createFireButton(): HTMLDivElement | null {
        this.buttons.fire = this.createActionButton(this.containers.left, 'FIRE', 'rgba(255, 80, 80, 0.8)');
        return this.buttons.fire;
    }

    createMineButton(): HTMLDivElement | null {
        this.buttons.mine = this.createActionButton(this.containers.left, 'MINE', 'rgba(120, 220, 232, 0.8)');
        return this.buttons.mine;
    }

    createTargetButton(): HTMLDivElement | null {
        this.buttons.target = this.createActionButton(this.containers.right, 'TARGET', 'rgba(255, 215, 0, 0.8)');
        return this.buttons.target;
    }

    createDockButton(): HTMLDivElement | null {
        // Create dock button (only shown when near stargate)
        this.buttons.dock = this.createActionButton(null, 'DOCK', 'rgba(51, 153, 255, 0.8)');
        this.buttons.dock.style.position = 'absolute';
        this.buttons.dock.style.top = '50%';
        this.buttons.dock.style.left = '50%';
        this.buttons.dock.style.transform = 'translate(-50%, -50%)';
        this.buttons.dock.style.width = '100px';  // Make dock button larger
        this.buttons.dock.style.height = '100px'; // Make dock button larger
        this.buttons.dock.style.fontSize = '20px'; // Larger text
        this.buttons.dock.style.boxShadow = '0 0 25px rgba(51, 153, 255, 0.8)'; // Stronger glow
        this.buttons.dock.style.zIndex = '10000'; 
        this.buttons.dock.style.display = 'none';
        document.body.appendChild(this.buttons.dock);
        return this.buttons.dock;
    }

    createDeployLaserButton(): HTMLDivElement | null {
        this.buttons.deployLaser = this.createActionButton(this.containers.right, 'DEPLOY', 'rgba(255, 100, 100, 0.8)');
        return this.buttons.deployLaser;
    }

    createActionButton(parent: HTMLDivElement | null, text: string, color: string): HTMLDivElement {
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

    showDockButton(): void {
        if (this.buttons.dock) {
            // FIX: Make sure display is set before other properties
            this.buttons.dock.style.display = 'flex';
            
            // FIX: Ensure critical styles are explicitly set
            this.buttons.dock.style.zIndex = '10000'; // Very high z-index
            this.buttons.dock.style.position = 'absolute';
            this.buttons.dock.style.top = '50%';
            this.buttons.dock.style.left = '50%';
            
            console.log("Showing dock button - near stargate");
            
            // Add pulsing animation to make it more noticeable
            if (!this.buttons.dock.style.animation) {
                this.buttons.dock.style.animation = 'pulse 1.5s infinite';
                
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
                display: this.buttons.dock.style.display,
                zIndex: this.buttons.dock.style.zIndex,
                position: this.buttons.dock.style.position,
                width: this.buttons.dock.style.width,
                height: this.buttons.dock.style.height
            });
        }
    }

    hideDockButton(): void {
        if (this.buttons.dock) {
            this.buttons.dock.style.display = 'none';
        }
    }

    hideButtons(): void {
        if (this.containers.left) this.containers.left.style.display = 'none';
        if (this.containers.right) this.containers.right.style.display = 'none';
        this.hideDockButton();
    }

    showButtons(): void {
        if (this.containers.left) this.containers.left.style.display = 'flex';
        if (this.containers.right) this.containers.right.style.display = 'flex';
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
                button.style.transform = 'scale(0.95) translateZ(0)';
                startHandler();
            }, { passive: false });
            
            button.addEventListener('touchend', (e: TouchEvent) => {
                e.preventDefault();
                button.style.transform = 'scale(1) translateZ(0)';
                endHandler();
            }, { passive: false });
            
            // Add pointer events
            button.addEventListener('pointerdown', (e: PointerEvent) => {
                e.preventDefault();
                if (e.pointerType === 'touch') return; // Skip if touch (handled by touch events)
                button.style.transform = 'scale(0.95) translateZ(0)';
                startHandler();
            });
            
            button.addEventListener('pointerup', (e: PointerEvent) => {
                e.preventDefault();
                if (e.pointerType === 'touch') return; // Skip if touch (handled by touch events)
                button.style.transform = 'scale(1) translateZ(0)';
                endHandler();
            });
            
            // Keep mouse events for backward compatibility
            button.addEventListener('mousedown', () => {
                button.style.transform = 'scale(0.95) translateZ(0)';
                startHandler();
            });
            
            button.addEventListener('mouseup', () => {
                button.style.transform = 'scale(1) translateZ(0)';
                endHandler();
            });
        }
        // For single actions (like targeting and docking)
        else {
            // Touch events
            button.addEventListener('touchstart', (e: TouchEvent) => {
                e.preventDefault();
                button.style.transform = 'scale(0.95) translateZ(0)';
                
                // For dock button specifically, add debug logging
                if (button === this.buttons.dock) {
                    console.log("Dock button touchstart event fired");
                }
            }, { passive: false });
            
            button.addEventListener('touchend', (e: TouchEvent) => {
                e.preventDefault();
                button.style.transform = 'scale(1) translateZ(0)';
                
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
                button.style.transform = 'scale(0.95) translateZ(0)';
                
                // For dock button specifically, add debug logging
                if (button === this.buttons.dock) {
                    console.log("Dock button pointerdown event fired");
                }
            });
            
            button.addEventListener('pointerup', (e: PointerEvent) => {
                e.preventDefault();
                if (e.pointerType === 'touch') return; // Skip if touch (handled by touch events)
                button.style.transform = 'scale(1) translateZ(0)';
                
                // For dock button specifically, add debug logging
                if (button === this.buttons.dock) {
                    console.log("Dock button pointerup event fired, calling handler");
                }
                
                startHandler();
            });
            
            // Keep mouse events for backward compatibility
            button.addEventListener('mousedown', () => {
                button.style.transform = 'scale(0.95) translateZ(0)';
            });
            
            button.addEventListener('mouseup', () => {
                button.style.transform = 'scale(1) translateZ(0)';
                startHandler();
            });
        }
    }
}
