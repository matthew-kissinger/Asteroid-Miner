/**
 * Blackjack Event Handlers - User interactions, button clicks, game events
 */

import type { BlackjackSoundType } from './animations.js';

type ResourceType = 'iron' | 'gold' | 'platinum';
type BlackjackBet = {
    resource: ResourceType | null;
    amount: number;
};
type BlackjackSpaceship = {
    cargo?: {
        iron?: number;
        gold?: number;
        platinum?: number;
    };
};

type BlackjackGameLike = {
    hide: () => void;
    selectBetResource: (resource: ResourceType) => void;
    startGame: () => void;
    hit: () => void;
    stand: () => void;
    doubleDown: () => void;
    gameUI: HTMLDivElement | null;
    spaceship: BlackjackSpaceship;
    animations: {
        animateButtonPress: (buttonElement: HTMLElement | null) => void;
        animateResourceSelection: (buttonElement: HTMLElement | null) => void;
        removeResourceSelection: (buttonElement: HTMLElement | null) => void;
        animateBetChange: (betElement: HTMLElement | null, newAmount: string | number) => void;
        playCardSound: (type: BlackjackSoundType) => void;
    };
    betting: {
        getResourceColor: (resource: ResourceType) => string;
        getCurrentBet: () => BlackjackBet;
        decreaseBet: () => boolean;
        increaseBet: () => boolean;
        canAffordDoubleDown: () => boolean;
        hasValidBet: () => boolean;
    };
    gameLogic: {
        isGameActive: () => boolean;
        getPlayerHand: () => Array<unknown>;
    };
    view: {
        updateBetAmount: (amount: string | number) => void;
        updateResourceDisplay: (spaceship: BlackjackSpaceship) => void;
        styles: {
            getControlButtonHoverStyles: () => Record<string, string>;
            getActionButtonHoverStyles: (color: string) => Record<string, string>;
        };
        isMobile: boolean;
    };
};

type ListenerRecord = {
    element: EventTarget;
    event: string;
    handler: EventListenerOrEventListenerObject;
    options?: boolean | AddEventListenerOptions;
};

export class BlackjackEventHandlers {
    game: BlackjackGameLike;
    isMobile: boolean;
    eventListeners: Map<string, ListenerRecord[]>;

    constructor(game: BlackjackGameLike, isMobile: boolean = false) {
        this.game = game;
        this.isMobile = isMobile;
        this.eventListeners = new Map();
    }

    /**
     * Set up all event handlers for the game
     */
    setupEventHandlers(): void {
        this.setupCloseButtonHandler();
        this.setupResourceButtonHandlers();
        this.setupBetControlHandlers();
        this.setupActionButtonHandlers();
        this.setupMobileEventHandlers();
    }

    /**
     * Setup close button event handler
     */
    setupCloseButtonHandler(): void {
        const closeBtn = document.querySelector('#blackjack-game button') as HTMLButtonElement | null;
        if (closeBtn) {
            const handler = () => this.game.hide();
            this.addEventHandler(closeBtn, 'click', handler);
        }
    }

    /**
     * Setup resource button event handlers
     */
    setupResourceButtonHandlers(): void {
        const resourceButtons = document.querySelectorAll<HTMLButtonElement>('.resource-btn');
        
        resourceButtons.forEach(btn => {
            const resource = btn.dataset.resource;
            if (!resource) {
                return;
            }
            
            // Create hover effects
            const addHoverEffect = () => {
                if (this.game.gameLogic.isGameActive()) return;
                
                const color = this.game.betting.getResourceColor(resource as ResourceType);
                btn.style.backgroundColor = 'rgba(25, 60, 80, 0.8)';
                btn.style.boxShadow = `0 0 15px ${color}`;
            };
            
            const removeHoverEffect = () => {
                if (this.game.gameLogic.isGameActive()) return;
                
                const color = this.game.betting.getResourceColor(resource as ResourceType);
                btn.style.backgroundColor = 'rgba(15, 40, 55, 0.8)';
                btn.style.boxShadow = `0 0 10px rgba(${color.split('(')[1].split(')')[0]}, 0.3)`;
            };
            
            // Click/tap handler
            const clickHandler = () => {
                if (!this.game.gameLogic.isGameActive()) {
                    this.game.selectBetResource(resource as ResourceType);
                    this.game.animations.playCardSound('boink');
                    
                    // Update button styling
                    document.querySelectorAll<HTMLElement>('.resource-btn').forEach(button => {
                        this.game.animations.removeResourceSelection(button as HTMLElement);
                    });
                    
                    this.game.animations.animateResourceSelection(btn);
                }
            };
            
            // Add event listeners
            this.addEventHandler(btn, 'mouseover', addHoverEffect);
            this.addEventHandler(btn, 'mouseout', removeHoverEffect);
            this.addEventHandler(btn, 'click', clickHandler);
            
            // Touch events for mobile
            if (this.isMobile) {
                this.addEventHandler(btn, 'touchstart', addHoverEffect, {passive: true});
                this.addEventHandler(btn, 'touchend', (e: Event) => {
                    removeHoverEffect();
                    e.preventDefault();
                    clickHandler();
                });
            }
        });
    }

    /**
     * Setup bet control event handlers (+ and - buttons)
     */
    setupBetControlHandlers(): void {
        const decreaseBtn = document.getElementById('decrease-bet-btn') as HTMLButtonElement | null;
        const increaseBtn = document.getElementById('increase-bet-btn') as HTMLButtonElement | null;
        
        if (decreaseBtn) {
            const handler = () => {
                if (!this.game.gameLogic.isGameActive() && this.game.betting.getCurrentBet().resource) {
                    if (this.game.betting.decreaseBet()) {
                        this.game.view.updateBetAmount(this.game.betting.getCurrentBet().amount);
                        const betAmount = document.getElementById('bet-amount') as HTMLDivElement | null;
                        this.game.animations.animateBetChange(
                            betAmount,
                            this.game.betting.getCurrentBet().amount
                        );
                        this.game.animations.playCardSound('boink');
                    }
                }
            };
            
            this.setupControlButton(decreaseBtn, handler);
        }
        
        if (increaseBtn) {
            const handler = () => {
                if (!this.game.gameLogic.isGameActive() && this.game.betting.getCurrentBet().resource) {
                    if (this.game.betting.increaseBet()) {
                        this.game.view.updateBetAmount(this.game.betting.getCurrentBet().amount);
                        const betAmount = document.getElementById('bet-amount') as HTMLDivElement | null;
                        this.game.animations.animateBetChange(
                            betAmount,
                            this.game.betting.getCurrentBet().amount
                        );
                        this.game.animations.playCardSound('boink');
                    }
                }
            };
            
            this.setupControlButton(increaseBtn, handler);
        }
    }

    /**
     * Setup action button event handlers (Deal, Hit, Stand, Double)
     */
    setupActionButtonHandlers(): void {
        const actionButtons = [
            { id: 'deal-btn', handler: () => this.game.startGame() },
            { id: 'hit-btn', handler: () => this.game.hit() },
            { id: 'stand-btn', handler: () => this.game.stand() },
            { id: 'double-btn', handler: () => this.game.doubleDown() }
        ];
        
        actionButtons.forEach(action => {
            const button = document.getElementById(action.id) as HTMLButtonElement | null;
            if (button) {
                const clickHandler = () => {
                    if (!button.disabled) {
                        this.game.animations.animateButtonPress(button);
                        action.handler();
                        this.game.animations.playCardSound('boink');
                    }
                };
                
                this.setupActionButton(button, clickHandler);
            }
        });
    }

    /**
     * Setup mobile-specific event handlers
     */
    setupMobileEventHandlers(): void {
        if (!this.isMobile) return;
        
        // Prevent scrolling when touching the game area
        const gameUI = document.getElementById('blackjack-game') as HTMLDivElement | null;
        if (gameUI) {
            this.addEventHandler(gameUI, 'touchmove', (e: Event) => {
                e.preventDefault();
            }, {passive: false});
        }
        
        // Handle orientation changes
        this.addEventHandler(window, 'orientationchange', () => {
            setTimeout(() => {
                this.game.view.updateResourceDisplay(this.game.spaceship);
            }, 100);
        });
    }

    /**
     * Setup control button with hover and touch effects
     */
    setupControlButton(button: HTMLButtonElement, clickHandler: () => void): void {
        const addHoverEffect = () => {
            if (!button.disabled) {
                const hoverStyles = this.game.view.styles.getControlButtonHoverStyles();
                Object.assign(button.style, hoverStyles);
            }
        };
        
        const removeHoverEffect = () => {
            if (!button.disabled) {
                button.style.backgroundColor = 'rgba(15, 40, 55, 0.8)';
                button.style.boxShadow = 'none';
            }
        };
        
        // Mouse events
        this.addEventHandler(button, 'mouseover', addHoverEffect);
        this.addEventHandler(button, 'mouseout', removeHoverEffect);
        this.addEventHandler(button, 'click', clickHandler);
        
        // Touch events
        if (this.isMobile) {
            this.addEventHandler(button, 'touchstart', addHoverEffect, {passive: true});
            this.addEventHandler(button, 'touchend', (e: Event) => {
                removeHoverEffect();
                e.preventDefault();
                clickHandler();
            });
        }
    }

    /**
     * Setup action button with hover and touch effects
     */
    setupActionButton(button: HTMLButtonElement, clickHandler: () => void): void {
        const color = this.getButtonColor(button.id);
        
        const enableHoverEffects = () => {
            if (!button.disabled) {
                const hoverStyles = this.game.view.styles.getActionButtonHoverStyles(color);
                Object.assign(button.style, hoverStyles);
            }
        };
        
        const disableHoverEffects = () => {
            if (!button.disabled) {
                button.style.backgroundColor = 'rgba(15, 40, 55, 0.8)';
                button.style.boxShadow = `0 0 10px ${color}`;
            }
        };
        
        // Mouse events
        this.addEventHandler(button, 'mouseover', enableHoverEffects);
        this.addEventHandler(button, 'mouseout', disableHoverEffects);
        this.addEventHandler(button, 'click', clickHandler);
        
        // Touch events
        if (this.isMobile) {
            this.addEventHandler(button, 'touchstart', enableHoverEffects, {passive: true});
            this.addEventHandler(button, 'touchend', (e: Event) => {
                disableHoverEffects();
                e.preventDefault();
                clickHandler();
            });
        }
    }

    /**
     * Get button color based on button ID
     */
    getButtonColor(buttonId: string): string {
        switch (buttonId) {
            case 'deal-btn':
                return '#30cfd0';
            case 'hit-btn':
                return '#ff9e3d';
            case 'stand-btn':
                return '#e55c8a';
            case 'double-btn':
                return '#a281ff';
            default:
                return '#33aaff';
        }
    }

    /**
     * Add event listener and track it for cleanup
     */
    addEventHandler(
        element: EventTarget,
        event: string,
        handler: EventListenerOrEventListenerObject,
        options: boolean | AddEventListenerOptions = false
    ): void {
        element.addEventListener(event, handler, options);
        
        // Store for cleanup
        const elementAsHTMLElement = element as HTMLElement;
        const key = `${elementAsHTMLElement.id || elementAsHTMLElement.className}_${event}`;
        if (!this.eventListeners.has(key)) {
            this.eventListeners.set(key, []);
        }
        this.eventListeners.get(key)?.push({ element, event, handler, options });
    }

    /**
     * Remove all event listeners
     */
    removeAllEventListeners(): void {
        this.eventListeners.forEach((listeners) => {
            listeners.forEach(({ element, event, handler, options }) => {
                element.removeEventListener(event, handler, options);
            });
        });
        this.eventListeners.clear();
    }

    /**
     * Update button states based on game state
     */
    updateButtonStates(): void {
        const dealBtn = document.getElementById('deal-btn') as HTMLButtonElement | null;
        const hitBtn = document.getElementById('hit-btn') as HTMLButtonElement | null;
        const standBtn = document.getElementById('stand-btn') as HTMLButtonElement | null;
        const doubleBtn = document.getElementById('double-btn') as HTMLButtonElement | null;
        
        // Reset all buttons to disabled state
        [dealBtn, hitBtn, standBtn, doubleBtn].forEach(btn => {
            if (btn) {
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.style.cursor = 'default';
            }
        });
        
        if (!this.game.gameLogic.isGameActive()) {
            // Before game starts, only deal button may be active
            const canDeal = this.game.betting.hasValidBet();
            if (dealBtn) {
                dealBtn.disabled = !canDeal;
                dealBtn.style.opacity = canDeal ? '1' : '0.5';
                dealBtn.style.cursor = canDeal ? 'pointer' : 'default';
            }
        } else {
            // During game, hit/stand buttons are active
            if (hitBtn) {
                hitBtn.disabled = false;
                hitBtn.style.opacity = '1';
                hitBtn.style.cursor = 'pointer';
            }
            
            if (standBtn) {
                standBtn.disabled = false;
                standBtn.style.opacity = '1';
                standBtn.style.cursor = 'pointer';
            }
            
            // Double down only available on first move with 2 cards
            const playerHand = this.game.gameLogic.getPlayerHand();
            const canDouble = playerHand.length === 2 && this.game.betting.canAffordDoubleDown();
            if (doubleBtn) {
                doubleBtn.disabled = !canDouble;
                doubleBtn.style.opacity = canDouble ? '1' : '0.5';
                doubleBtn.style.cursor = canDouble ? 'pointer' : 'default';
            }
        }
    }

    /**
     * Handle keyboard events
     */
    setupKeyboardHandlers(): void {
        const keyHandler = (e: KeyboardEvent) => {
            if (!this.game.gameUI || this.game.gameUI.style.display === 'none') return;
            
            switch (e.key.toLowerCase()) {
                case 'escape':
                    this.game.hide();
                    break;
                case 'enter':
                case ' ':
                    if (!this.game.gameLogic.isGameActive() && this.game.betting.hasValidBet()) {
                        this.game.startGame();
                    }
                    break;
                case 'h':
                    if (this.game.gameLogic.isGameActive()) {
                        this.game.hit();
                    }
                    break;
                case 's':
                    if (this.game.gameLogic.isGameActive()) {
                        this.game.stand();
                    }
                    break;
                case 'd':
                    if (this.game.gameLogic.isGameActive()) {
                        this.game.doubleDown();
                    }
                    break;
                case '1':
                    this.selectResource('iron');
                    break;
                case '2':
                    this.selectResource('gold');
                    break;
                case '3':
                    this.selectResource('platinum');
                    break;
                case 'arrowup':
                case '+':
                    if (!this.game.gameLogic.isGameActive() && this.game.betting.getCurrentBet().resource) {
                        if (this.game.betting.increaseBet()) {
                            this.game.view.updateBetAmount(this.game.betting.getCurrentBet().amount);
                        }
                    }
                    e.preventDefault();
                    break;
                case 'arrowdown':
                case '-':
                    if (!this.game.gameLogic.isGameActive() && this.game.betting.getCurrentBet().resource) {
                        if (this.game.betting.decreaseBet()) {
                            this.game.view.updateBetAmount(this.game.betting.getCurrentBet().amount);
                        }
                    }
                    e.preventDefault();
                    break;
            }
        };
        
        this.addEventHandler(document, 'keydown', keyHandler as EventListener);
    }

    /**
     * Select resource by name (helper for keyboard events)
     */
    selectResource(resource: ResourceType): void {
        if (!this.game.gameLogic.isGameActive()) {
            const button = document.querySelector(`[data-resource="${resource}"]`) as HTMLButtonElement | null;
            if (button) {
                button.click();
            }
        }
    }

    /**
     * Handle window resize events
     */
    setupResizeHandler(): void {
        const resizeHandler = () => {
            // Update mobile detection in case window was resized
            this.isMobile = window.innerWidth <= 768 || window.innerHeight <= 600;
            
            // Update styles if needed
            if (this.game.view) {
                this.game.view.isMobile = this.isMobile;
            }
        };
        
        this.addEventHandler(window, 'resize', resizeHandler);
    }

    /**
     * Setup all handlers at once
     */
    initialize(): void {
        this.setupEventHandlers();
        this.setupKeyboardHandlers();
        this.setupResizeHandler();
    }

    /**
     * Cleanup method to remove all event listeners
     */
    destroy(): void {
        this.removeAllEventListeners();
    }
}
