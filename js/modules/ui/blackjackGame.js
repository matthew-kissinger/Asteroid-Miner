/**
 * Blackjack Minigame - A futuristic card game for the mothership terminal
 * 
 * Features:
 * - Space-themed card designs with futuristic symbols
 * - Wager ship resources (Iron, Gold, Platinum)
 * - Play against an AI dealer with pirate personality
 * - Holographic UI with neon effects
 */

import { MobileDetector } from '../../utils/mobileDetector.js';

export class BlackjackGame {
    constructor(scene, spaceship, audio) {
        this.scene = scene;
        this.spaceship = spaceship;
        this.audio = audio;
        this.isMobile = MobileDetector.isMobile();

        console.log("BlackjackGame constructor - spaceship:", this.spaceship);
        console.log("BlackjackGame constructor - cargo:", this.spaceship ? this.spaceship.cargo : null);
        console.log("BlackjackGame constructor - isMobile:", this.isMobile);
        
        // Game state
        this.gameActive = false;
        this.currentBet = {
            resource: null,
            amount: 0
        };
        this.playerHand = [];
        this.dealerHand = [];
        this.deck = [];
        this.gameResult = null;
        
        // Card symbols
        this.cardSymbols = {
            spades: '♠', // Asteroid symbol
            hearts: '♥', // Planet symbol
            clubs: '♣', // Star symbol
            diamonds: '♦' // Nebula symbol
        };
        
        // Dealer personality phrases
        this.dealerPhrases = {
            win: [
                "Yarr! The cosmos favors ye today!",
                "By the stars! Ye've bested me!",
                "Void take me! Ye've got luck in yer tanks!",
                "Stellar victory, spacer!",
                "Blast me thrusters! Ye win this round!"
            ],
            lose: [
                "The black hole claims another victim!",
                "Better luck in the next galaxy, rookie!",
                "Space is cold, and so is defeat!",
                "Yarr! The dealer always wins, spacer!",
                "Back to the asteroid mines with ye!"
            ],
            blackjack: [
                "SUPERNOVA! A cosmic blackjack!",
                "By the void! A perfect 21!",
                "The stars aligned for ye today!",
                "Quantum perfection! A blackjack!"
            ],
            push: [
                "A cosmic stalemate, eh?",
                "The universe remains in balance.",
                "Neither winner nor loser in the void.",
                "We split the cosmic dust this time."
            ]
        };
        
        // UI elements
        this.gameUI = null;
    }
    
    /**
     * Initialize the game UI
     */
    init() {
        // Create game UI if it doesn't exist
        if (!this.gameUI) {
            this.createGameUI();
        }
    }
    
    /**
     * Create the game UI elements
     */
    createGameUI() {
        // Create main container
        this.gameUI = document.createElement('div');
        this.gameUI.id = 'blackjack-game';
        this.gameUI.style.position = 'absolute';
        this.gameUI.style.top = '50%';
        this.gameUI.style.left = '50%';
        this.gameUI.style.transform = 'translate(-50%, -50%)';
        
        // Adjust width for mobile
        if (this.isMobile) {
            this.gameUI.style.width = '95%';
            this.gameUI.style.maxWidth = '600px';
            this.gameUI.style.height = 'auto';
            this.gameUI.style.maxHeight = '85vh'; // Slightly reduced to ensure buttons are visible
            this.gameUI.style.paddingBottom = '70px'; // Add padding for the return button
        } else {
            this.gameUI.style.width = '900px';
            this.gameUI.style.height = '650px';
        }
        
        this.gameUI.style.backgroundColor = 'rgba(6, 22, 31, 0.85)';
        this.gameUI.style.backdropFilter = 'blur(10px)';
        this.gameUI.style.border = '2px solid #33aaff';
        this.gameUI.style.borderRadius = '15px';
        this.gameUI.style.boxShadow = '0 0 30px rgba(51, 170, 255, 0.5)';
        this.gameUI.style.padding = this.isMobile ? '15px' : '25px';
        this.gameUI.style.zIndex = '1000';
        this.gameUI.style.display = 'none';
        this.gameUI.style.fontFamily = 'Courier New, monospace';
        this.gameUI.style.color = '#fff';
        this.gameUI.style.userSelect = 'none';
        this.gameUI.style.overflowY = this.isMobile ? 'auto' : 'hidden';
        
        // Add mobile scroll handling
        if (this.isMobile) {
            this.gameUI.style.webkitOverflowScrolling = 'touch';
            this.gameUI.style.touchAction = 'pan-y';
            this.gameUI.style.overscrollBehavior = 'contain';
        }
        
        // Add scanline effect
        const scanlines = document.createElement('div');
        scanlines.style.position = 'absolute';
        scanlines.style.top = '0';
        scanlines.style.left = '0';
        scanlines.style.width = '100%';
        scanlines.style.height = '100%';
        scanlines.style.backgroundImage = 'linear-gradient(transparent 50%, rgba(0, 0, 0, 0.1) 50%)';
        scanlines.style.backgroundSize = '100% 4px';
        scanlines.style.pointerEvents = 'none';
        scanlines.style.zIndex = '1001';
        scanlines.style.opacity = '0.15';
        this.gameUI.appendChild(scanlines);
        
        // Header
        const header = document.createElement('div');
        header.style.textAlign = 'center';
        header.style.marginBottom = '20px';
        header.style.position = 'relative';
        
        const title = document.createElement('h2');
        title.textContent = 'STELLAR BLACKJACK';
        title.style.color = '#30cfd0';
        title.style.textShadow = '0 0 10px rgba(48, 207, 208, 0.7)';
        title.style.margin = '0 0 5px 0';
        title.style.fontSize = this.isMobile ? '24px' : '32px';
        header.appendChild(title);
        
        const subtitle = document.createElement('div');
        subtitle.textContent = 'WAGER RESOURCES • WIN BIG • BEAT THE DEALER';
        subtitle.style.color = 'rgba(255, 255, 255, 0.6)';
        subtitle.style.fontSize = this.isMobile ? '12px' : '14px';
        subtitle.style.letterSpacing = '2px';
        header.appendChild(subtitle);
        
        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '0';
        closeBtn.style.right = '0';
        closeBtn.style.backgroundColor = 'transparent';
        closeBtn.style.border = 'none';
        closeBtn.style.color = '#33aaff';
        closeBtn.style.fontSize = '32px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.outline = 'none';
        closeBtn.style.padding = '0 10px';
        closeBtn.style.lineHeight = '1';
        closeBtn.onclick = () => this.hide();
        
        // Make close button larger and more visible for touch on mobile
        if (this.isMobile) {
            closeBtn.style.fontSize = '42px';
            closeBtn.style.padding = '5px 15px';
            closeBtn.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
            closeBtn.style.borderRadius = '50%';
            closeBtn.style.width = '50px';
            closeBtn.style.height = '50px';
            closeBtn.style.display = 'flex';
            closeBtn.style.justifyContent = 'center';
            closeBtn.style.alignItems = 'center';
            closeBtn.style.boxShadow = '0 0 10px rgba(51, 170, 255, 0.5)';
            closeBtn.style.right = '5px';
            closeBtn.style.top = '5px';
        }
        
        header.appendChild(closeBtn);
        
        this.gameUI.appendChild(header);
        
        // Game area container
        const gameArea = document.createElement('div');
        gameArea.style.display = 'flex';
        gameArea.style.flexDirection = 'column';
        gameArea.style.height = this.isMobile ? 'auto' : 'calc(100% - 80px)';
        
        // Dealer area
        const dealerArea = document.createElement('div');
        dealerArea.style.flex = '1';
        dealerArea.style.border = '1px solid rgba(51, 170, 255, 0.3)';
        dealerArea.style.borderRadius = '8px';
        dealerArea.style.padding = '15px';
        dealerArea.style.marginBottom = '15px';
        dealerArea.style.position = 'relative';
        dealerArea.style.background = 'linear-gradient(to bottom, rgba(9, 30, 42, 0.6), rgba(9, 30, 42, 0.4))';
        
        // Dealer header
        const dealerHeader = document.createElement('div');
        dealerHeader.className = 'dealer-header';
        dealerHeader.style.display = 'flex';
        dealerHeader.style.justifyContent = 'space-between';
        dealerHeader.style.marginBottom = '10px';
        
        const dealerTitle = document.createElement('div');
        dealerTitle.textContent = 'DEALER';
        dealerTitle.style.color = '#33aaff';
        dealerTitle.style.fontWeight = 'bold';
        dealerHeader.appendChild(dealerTitle);
        
        const dealerScore = document.createElement('div');
        dealerScore.id = 'dealer-score';
        dealerScore.textContent = '0';
        dealerScore.style.color = '#fff';
        dealerScore.style.fontWeight = 'bold';
        dealerScore.style.backgroundColor = 'rgba(51, 170, 255, 0.2)';
        dealerScore.style.padding = '0 10px';
        dealerScore.style.borderRadius = '4px';
        dealerHeader.appendChild(dealerScore);
        
        dealerArea.appendChild(dealerHeader);
        
        // Dealer cards container
        const dealerCards = document.createElement('div');
        dealerCards.id = 'dealer-cards';
        dealerCards.style.display = 'flex';
        dealerCards.style.gap = '15px';
        dealerCards.style.flexWrap = 'wrap';
        dealerCards.style.height = this.isMobile ? 'auto' : '130px';
        dealerCards.style.minHeight = this.isMobile ? '120px' : '130px';
        dealerArea.appendChild(dealerCards);
        
        // Dealer speech bubble
        const speechBubble = document.createElement('div');
        speechBubble.id = 'dealer-speech';
        speechBubble.style.position = this.isMobile ? 'relative' : 'absolute';
        speechBubble.style.bottom = this.isMobile ? 'auto' : '15px';
        speechBubble.style.right = this.isMobile ? 'auto' : '15px';
        speechBubble.style.marginTop = this.isMobile ? '10px' : '0';
        speechBubble.style.backgroundColor = 'rgba(15, 40, 55, 0.9)';
        speechBubble.style.border = '1px solid #33aaff';
        speechBubble.style.borderRadius = '8px';
        speechBubble.style.padding = '10px 15px';
        speechBubble.style.maxWidth = this.isMobile ? '100%' : '300px';
        speechBubble.style.fontStyle = 'italic';
        speechBubble.style.color = '#fff';
        speechBubble.style.boxShadow = '0 0 10px rgba(51, 170, 255, 0.3)';
        speechBubble.style.display = 'none';
        dealerArea.appendChild(speechBubble);
        
        gameArea.appendChild(dealerArea);
        
        // Middle area - Game status
        const statusArea = document.createElement('div');
        statusArea.style.height = '60px';
        statusArea.style.display = 'flex';
        statusArea.style.justifyContent = 'center';
        statusArea.style.alignItems = 'center';
        statusArea.style.marginBottom = '15px';
        
        const gameStatus = document.createElement('div');
        gameStatus.id = 'game-status';
        gameStatus.style.padding = '8px 20px';
        gameStatus.style.borderRadius = '20px';
        gameStatus.style.backgroundColor = 'rgba(51, 170, 255, 0.2)';
        gameStatus.style.border = '1px solid rgba(51, 170, 255, 0.4)';
        gameStatus.style.color = '#fff';
        gameStatus.style.textAlign = 'center';
        gameStatus.style.fontWeight = 'bold';
        gameStatus.style.letterSpacing = '1px';
        gameStatus.style.fontSize = this.isMobile ? '12px' : '14px';
        gameStatus.style.width = this.isMobile ? '100%' : 'auto';
        gameStatus.textContent = 'PLACE YOUR BET TO BEGIN';
        statusArea.appendChild(gameStatus);
        
        gameArea.appendChild(statusArea);
        
        // Player area
        const playerArea = document.createElement('div');
        playerArea.style.flex = '1';
        playerArea.style.border = '1px solid rgba(51, 170, 255, 0.3)';
        playerArea.style.borderRadius = '8px';
        playerArea.style.padding = '15px';
        playerArea.style.marginBottom = '15px';
        playerArea.style.background = 'linear-gradient(to bottom, rgba(9, 30, 42, 0.4), rgba(9, 30, 42, 0.6))';
        
        // Player header
        const playerHeader = document.createElement('div');
        playerHeader.className = 'player-header';
        playerHeader.style.display = 'flex';
        playerHeader.style.justifyContent = 'space-between';
        playerHeader.style.marginBottom = '10px';
        
        const playerTitle = document.createElement('div');
        playerTitle.textContent = 'YOUR HAND';
        playerTitle.style.color = '#30cfd0';
        playerTitle.style.fontWeight = 'bold';
        playerHeader.appendChild(playerTitle);
        
        const playerScore = document.createElement('div');
        playerScore.id = 'player-score';
        playerScore.textContent = '0';
        playerScore.style.color = '#fff';
        playerScore.style.fontWeight = 'bold';
        playerScore.style.backgroundColor = 'rgba(48, 207, 208, 0.2)';
        playerScore.style.padding = '0 10px';
        playerScore.style.borderRadius = '4px';
        playerHeader.appendChild(playerScore);
        
        playerArea.appendChild(playerHeader);
        
        // Player cards container
        const playerCards = document.createElement('div');
        playerCards.id = 'player-cards';
        playerCards.style.display = 'flex';
        playerCards.style.gap = '15px';
        playerCards.style.flexWrap = 'wrap';
        playerCards.style.height = this.isMobile ? 'auto' : '130px';
        playerCards.style.minHeight = this.isMobile ? '120px' : '130px';
        playerArea.appendChild(playerCards);
        
        gameArea.appendChild(playerArea);
        
        // Controls area
        const controlsArea = document.createElement('div');
        controlsArea.style.display = 'flex';
        controlsArea.style.justifyContent = 'space-between';
        controlsArea.style.alignItems = 'center';
        controlsArea.style.height = 'auto';
        controlsArea.style.flexDirection = this.isMobile ? 'column' : 'row';
        controlsArea.style.gap = this.isMobile ? '15px' : '0';
        
        // Betting controls
        const bettingControls = document.createElement('div');
        bettingControls.id = 'betting-controls';
        bettingControls.style.display = 'flex';
        bettingControls.style.flexDirection = 'column';
        bettingControls.style.width = this.isMobile ? '100%' : '250px';
        
        const bettingTitle = document.createElement('div');
        bettingTitle.textContent = 'PLACE YOUR BET';
        bettingTitle.style.marginBottom = '10px';
        bettingTitle.style.color = 'rgba(255, 255, 255, 0.8)';
        bettingTitle.style.fontWeight = 'bold';
        bettingControls.appendChild(bettingTitle);
        
        const resourceOptions = document.createElement('div');
        resourceOptions.style.display = 'flex';
        resourceOptions.style.gap = '10px';
        
        const createResourceButton = (resource, color) => {
            const btn = document.createElement('button');
            btn.className = 'resource-btn';
            btn.dataset.resource = resource;
            btn.style.flex = '1';
            btn.style.padding = this.isMobile ? '10px 5px' : '8px 5px';
            btn.style.backgroundColor = 'rgba(15, 40, 55, 0.8)';
            btn.style.border = `1px solid ${color}`;
            btn.style.borderRadius = '5px';
            btn.style.color = '#fff';
            btn.style.boxShadow = `0 0 10px rgba(${color.split('(')[1].split(')')[0]}, 0.3)`;
            btn.style.cursor = 'pointer';
            btn.style.display = 'flex';
            btn.style.flexDirection = 'column';
            btn.style.alignItems = 'center';
            btn.style.transition = 'background-color 0.2s, box-shadow 0.2s';
            
            const resourceName = document.createElement('span');
            resourceName.textContent = resource.toUpperCase();
            resourceName.style.fontWeight = 'bold';
            resourceName.style.fontSize = '12px';
            btn.appendChild(resourceName);
            
            const resourceAmount = document.createElement('span');
            resourceAmount.className = `${resource}-amount`;
            resourceAmount.textContent = `0 UNITS`;
            resourceAmount.style.fontSize = '10px';
            resourceAmount.style.marginTop = '3px';
            resourceAmount.style.opacity = '0.7';
            btn.appendChild(resourceAmount);
            
            // Add event handlers for both mouse and touch
            const addHoverEffect = () => {
                btn.style.backgroundColor = 'rgba(25, 60, 80, 0.8)';
                btn.style.boxShadow = `0 0 15px ${color}`;
            };
            
            const removeHoverEffect = () => {
                btn.style.backgroundColor = 'rgba(15, 40, 55, 0.8)';
                btn.style.boxShadow = `0 0 10px rgba(${color.split('(')[1].split(')')[0]}, 0.3)`;
            };
            
            // Mouse events
            btn.addEventListener('mouseover', addHoverEffect);
            btn.addEventListener('mouseout', removeHoverEffect);
            
            // Touch events
            btn.addEventListener('touchstart', addHoverEffect, {passive: true});
            btn.addEventListener('touchend', removeHoverEffect, {passive: true});
            
            // Click/tap handler
            const clickHandler = () => {
                if (!this.gameActive) {
                    this.selectBetResource(resource);
                    this.audio.playSound('boink');
                    
                    // Update button styling
                    document.querySelectorAll('.resource-btn').forEach(button => {
                        button.style.borderWidth = '1px';
                        button.style.transform = 'scale(1)';
                    });
                    
                    btn.style.borderWidth = '2px';
                    btn.style.transform = 'scale(1.05)';
                }
            };
            
            btn.addEventListener('click', clickHandler);
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                clickHandler();
            });
            
            return btn;
        };
        
        resourceOptions.appendChild(createResourceButton('iron', 'rgba(150, 150, 150, 1)'));
        resourceOptions.appendChild(createResourceButton('gold', 'rgba(255, 215, 0, 1)'));
        resourceOptions.appendChild(createResourceButton('platinum', 'rgba(229, 228, 226, 1)'));
        
        bettingControls.appendChild(resourceOptions);
        
        // Bet amount controls
        const betAmountControls = document.createElement('div');
        betAmountControls.style.display = 'flex';
        betAmountControls.style.marginTop = '10px';
        betAmountControls.style.gap = '10px';
        
        const betAmountDisplay = document.createElement('div');
        betAmountDisplay.id = 'bet-amount';
        betAmountDisplay.textContent = '0';
        betAmountDisplay.style.flex = '1';
        betAmountDisplay.style.backgroundColor = 'rgba(15, 40, 55, 0.8)';
        betAmountDisplay.style.border = '1px solid rgba(51, 170, 255, 0.5)';
        betAmountDisplay.style.borderRadius = '5px';
        betAmountDisplay.style.padding = '8px 10px';
        betAmountDisplay.style.textAlign = 'center';
        betAmountDisplay.style.fontWeight = 'bold';
        betAmountControls.appendChild(betAmountDisplay);
        
        // Create a button with both mouse and touch support
        const createControlButton = (text, handler) => {
            const btn = document.createElement('button');
            btn.textContent = text;
            btn.style.width = this.isMobile ? '50px' : '40px';
            btn.style.height = this.isMobile ? '40px' : 'auto';
            btn.style.backgroundColor = 'rgba(15, 40, 55, 0.8)';
            btn.style.border = '1px solid rgba(51, 170, 255, 0.5)';
            btn.style.borderRadius = '5px';
            btn.style.color = '#fff';
            btn.style.cursor = 'pointer';
            btn.style.fontSize = this.isMobile ? '20px' : '16px';
            
            // Hover effects
            const addHoverEffect = () => {
                btn.style.backgroundColor = 'rgba(25, 60, 80, 0.8)';
                btn.style.boxShadow = '0 0 10px rgba(51, 170, 255, 0.3)';
            };
            
            const removeHoverEffect = () => {
                btn.style.backgroundColor = 'rgba(15, 40, 55, 0.8)';
                btn.style.boxShadow = 'none';
            };
            
            // Mouse events
            btn.addEventListener('mouseover', addHoverEffect);
            btn.addEventListener('mouseout', removeHoverEffect);
            
            // Touch events
            btn.addEventListener('touchstart', addHoverEffect, {passive: true});
            btn.addEventListener('touchend', removeHoverEffect, {passive: true});
            
            // Click handler
            btn.addEventListener('click', handler);
            
            // Separate touch handler to prevent click delay
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                handler();
            });
            
            return btn;
        };
        
        const decreaseBtn = createControlButton('-', () => {
            if (!this.gameActive && this.currentBet.resource) {
                this.decreaseBet();
                this.audio.playSound('boink');
            }
        });
        betAmountControls.appendChild(decreaseBtn);
        
        const increaseBtn = createControlButton('+', () => {
            if (!this.gameActive && this.currentBet.resource) {
                this.increaseBet();
                this.audio.playSound('boink');
            }
        });
        betAmountControls.appendChild(increaseBtn);
        
        bettingControls.appendChild(betAmountControls);
        controlsArea.appendChild(bettingControls);
        
        // Game actions
        const gameActions = document.createElement('div');
        gameActions.style.display = 'flex';
        gameActions.style.gap = '15px';
        gameActions.style.flexWrap = this.isMobile ? 'wrap' : 'nowrap';
        gameActions.style.justifyContent = this.isMobile ? 'center' : 'flex-end';
        gameActions.style.width = this.isMobile ? '100%' : 'auto';
        
        const actionButtons = [
            { id: 'deal-btn', text: 'DEAL', color: '#30cfd0', handler: () => this.startGame() },
            { id: 'hit-btn', text: 'HIT', color: '#ff9e3d', handler: () => this.hit() },
            { id: 'stand-btn', text: 'STAND', color: '#e55c8a', handler: () => this.stand() },
            { id: 'double-btn', text: 'DOUBLE', color: '#a281ff', handler: () => this.doubleDown() }
        ];
        
        actionButtons.forEach(btn => {
            const button = document.createElement('button');
            button.id = btn.id;
            button.textContent = btn.text;
            button.style.padding = this.isMobile ? '15px 20px' : '12px 18px';
            button.style.backgroundColor = 'rgba(15, 40, 55, 0.8)';
            button.style.border = `2px solid ${btn.color}`;
            button.style.borderRadius = '5px';
            button.style.color = '#fff';
            button.style.fontWeight = 'bold';
            button.style.cursor = 'pointer';
            button.style.boxShadow = `0 0 10px ${btn.color}`;
            button.style.transition = 'all 0.2s';
            button.style.minWidth = this.isMobile ? '80px' : 'auto';
            button.style.flex = this.isMobile ? '1' : 'none';
            button.disabled = true;
            button.style.opacity = '0.5';
            
            // Hover/touch effects
            const enableHoverEffects = () => {
                if (!button.disabled) {
                    button.style.backgroundColor = 'rgba(25, 60, 80, 0.8)';
                    button.style.boxShadow = `0 0 15px ${btn.color}`;
                }
            };
            
            const disableHoverEffects = () => {
                if (!button.disabled) {
                    button.style.backgroundColor = 'rgba(15, 40, 55, 0.8)';
                    button.style.boxShadow = `0 0 10px ${btn.color}`;
                }
            };
            
            // Mouse events
            button.addEventListener('mouseover', enableHoverEffects);
            button.addEventListener('mouseout', disableHoverEffects);
            
            // Touch events
            button.addEventListener('touchstart', enableHoverEffects, {passive: true});
            button.addEventListener('touchend', disableHoverEffects, {passive: true});
            
            // Click handler
            button.addEventListener('click', () => {
                if (!button.disabled) {
                    btn.handler();
                    this.audio.playSound('boink');
                }
            });
            
            // Touch handler to prevent delay
            button.addEventListener('touchend', (e) => {
                if (!button.disabled) {
                    e.preventDefault();
                    btn.handler();
                    this.audio.playSound('boink');
                }
            });
            
            gameActions.appendChild(button);
        });
        
        controlsArea.appendChild(gameActions);
        gameArea.appendChild(controlsArea);
        
        this.gameUI.appendChild(gameArea);
        
        // Setup event listeners
        this.setupEventListeners();
    }
    
    /**
     * Show the game UI and sync with current game resources
     */
    show() {
        if (this.gameUI) {
            this.gameUI.style.display = 'block';
            this.reset();
            
            // Force audio context resumption for mobile
            if (this.audio && this.isMobile) {
                // Play a sound to kickstart the audio context
                setTimeout(() => {
                    console.log("Mobile: Attempting to play initial sound in BlackjackGame");
                    this.audio.playSound('boink');
                }, 100);
            }
            
            // Check if we need to synchronize with the game's resource system
            if (window.game && window.game.controls && window.game.controls.resources) {
                // Sync with the real game resources
                console.log("Syncing blackjack with game resources");
                const gameResources = window.game.controls.resources;
                
                if (!this.spaceship.cargo) {
                    this.spaceship.cargo = {};
                }
                
                // Update cargo with current game resources
                this.spaceship.cargo.iron = gameResources.iron || 0;
                this.spaceship.cargo.gold = gameResources.gold || 0;
                this.spaceship.cargo.platinum = gameResources.platinum || 0;
                
                console.log("Synced resources:", this.spaceship.cargo);
            } else {
                console.log("Game resources not available, using stored values");
            }
            
            // Update display with current resources
            this.updateResourceDisplay();
            this.audio.playSound('boink');
        } else {
            this.init();
            this.show();
        }
    }
    
    /**
     * Hide the game UI and return to the mothership interface
     */
    hide() {
        if (this.gameUI) {
            this.gameUI.style.display = 'none';
        }
        
        this.audio.playSound('boink');
        // Show the mothership interface when exiting blackjack
        const mothershipUI = document.getElementById('mothership-ui');
        if (mothershipUI) {
            mothershipUI.style.display = 'block';
        }
    }
    
    /**
     * Reset the game state
     */
    reset() {
        this.gameActive = false;
        this.playerHand = [];
        this.dealerHand = [];
        this.currentBet = {
            resource: null,
            amount: 0
        };
        this.gameResult = null;
        
        // Reset UI elements
        document.getElementById('player-cards').innerHTML = '';
        document.getElementById('dealer-cards').innerHTML = '';
        document.getElementById('player-score').textContent = '0';
        document.getElementById('dealer-score').textContent = '0';
        document.getElementById('game-status').textContent = 'PLACE YOUR BET TO BEGIN';
        document.getElementById('dealer-speech').style.display = 'none';
        document.getElementById('bet-amount').textContent = '0';
        
        // Reset resource selection
        document.querySelectorAll('.resource-btn').forEach(btn => {
            btn.style.borderWidth = '1px';
            btn.style.transform = 'scale(1)';
        });
        
        this.updateControls();
    }
    
    /**
     * Create a fresh deck of cards
     */
    createDeck() {
        const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
        const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        
        this.deck = [];
        
        for (let suit of suits) {
            for (let value of values) {
                this.deck.push({
                    suit: suit,
                    value: value
                });
            }
        }
        
        // Shuffle deck
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }
    
    /**
     * Get the value of a card
     * @param {Object} card - The card object
     * @returns {number} The value of the card in Blackjack
     */
    getCardValue(card) {
        if (card.value === 'A') {
            return 11;
        } else if (['J', 'Q', 'K'].includes(card.value)) {
            return 10;
        } else {
            return parseInt(card.value);
        }
    }
    
    /**
     * Calculate the score of a hand, adjusting for aces
     * @param {Array} hand - Array of card objects
     * @returns {number} The total score of the hand
     */
    calculateScore(hand) {
        let score = 0;
        let aces = 0;
        
        for (let card of hand) {
            if (card.value === 'A') {
                aces++;
                score += 11;
            } else if (['J', 'Q', 'K'].includes(card.value)) {
                score += 10;
            } else {
                score += parseInt(card.value);
            }
        }
        
        // Adjust for aces if over 21
        while (score > 21 && aces > 0) {
            score -= 10;
            aces--;
        }
        
        return score;
    }
    
    /**
     * Draw a card from the deck
     * @returns {Object} A card object
     */
    drawCard() {
        if (this.deck.length === 0) {
            this.createDeck();
        }
        return this.deck.pop();
    }
    
    /**
     * Create a visual card element
     * @param {Object} card - The card object
     * @param {boolean} faceDown - Whether the card is face down
     * @returns {HTMLElement} The card element
     */
    createCardElement(card, faceDown = false) {
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        
        // Adjust card size for mobile
        if (this.isMobile) {
            cardEl.style.width = '70px';
            cardEl.style.height = '105px';
            cardEl.style.fontSize = '80%';
        } else {
            cardEl.style.width = '100px';
            cardEl.style.height = '150px';
        }
        
        cardEl.style.backgroundColor = faceDown ? 'rgba(9, 30, 42, 0.8)' : 'rgba(15, 35, 50, 0.9)';
        cardEl.style.border = faceDown ? 
            '2px solid rgba(51, 170, 255, 0.3)' : 
            '2px solid rgba(51, 170, 255, 0.7)';
        cardEl.style.borderRadius = '10px';
        cardEl.style.boxShadow = faceDown ?
            '0 0 5px rgba(51, 170, 255, 0.3)' :
            '0 0 10px rgba(51, 170, 255, 0.5)';
        cardEl.style.position = 'relative';
        cardEl.style.display = 'flex';
        cardEl.style.justifyContent = 'center';
        cardEl.style.alignItems = 'center';
        cardEl.style.overflow = 'hidden';
        cardEl.style.transition = 'transform 0.3s ease';
        
        if (!faceDown) {
            // Card value at top-left
            const topValue = document.createElement('div');
            topValue.style.position = 'absolute';
            topValue.style.top = '8px';
            topValue.style.left = '8px';
            topValue.style.fontSize = this.isMobile ? '14px' : '20px';
            topValue.style.fontWeight = 'bold';
            topValue.textContent = card.value;
            topValue.style.color = ['hearts', 'diamonds'].includes(card.suit) ? '#e55c8a' : '#30cfd0';
            cardEl.appendChild(topValue);
            
            // Suit at top-right
            const topSuit = document.createElement('div');
            topSuit.style.position = 'absolute';
            topSuit.style.top = '8px';
            topSuit.style.right = '8px';
            topSuit.style.fontSize = this.isMobile ? '12px' : '16px';
            topSuit.textContent = this.cardSymbols[card.suit];
            topSuit.style.color = ['hearts', 'diamonds'].includes(card.suit) ? '#e55c8a' : '#30cfd0';
            cardEl.appendChild(topSuit);
            
            // Center symbol
            const centerSymbol = document.createElement('div');
            centerSymbol.style.fontSize = this.isMobile ? '28px' : '40px';
            centerSymbol.style.lineHeight = '1';
            centerSymbol.style.opacity = '0.9';
            centerSymbol.textContent = this.cardSymbols[card.suit];
            centerSymbol.style.color = ['hearts', 'diamonds'].includes(card.suit) ? '#e55c8a' : '#30cfd0';
            cardEl.appendChild(centerSymbol);
            
            // Value at bottom-right (rotated)
            const bottomValue = document.createElement('div');
            bottomValue.style.position = 'absolute';
            bottomValue.style.bottom = '8px';
            bottomValue.style.right = '8px';
            bottomValue.style.fontSize = this.isMobile ? '14px' : '20px';
            bottomValue.style.fontWeight = 'bold';
            bottomValue.style.transform = 'rotate(180deg)';
            bottomValue.textContent = card.value;
            bottomValue.style.color = ['hearts', 'diamonds'].includes(card.suit) ? '#e55c8a' : '#30cfd0';
            cardEl.appendChild(bottomValue);
            
            // Suit at bottom-left (rotated)
            const bottomSuit = document.createElement('div');
            bottomSuit.style.position = 'absolute';
            bottomSuit.style.bottom = '8px';
            bottomSuit.style.left = '8px';
            bottomSuit.style.fontSize = this.isMobile ? '12px' : '16px';
            bottomSuit.style.transform = 'rotate(180deg)';
            bottomSuit.textContent = this.cardSymbols[card.suit];
            bottomSuit.style.color = ['hearts', 'diamonds'].includes(card.suit) ? '#e55c8a' : '#30cfd0';
            cardEl.appendChild(bottomSuit);
            
            // Card background pattern
            const pattern = document.createElement('div');
            pattern.style.position = 'absolute';
            pattern.style.inset = '0';
            pattern.style.opacity = '0.05';
            pattern.style.backgroundImage = 'radial-gradient(circle, #fff 1px, transparent 1px)';
            pattern.style.backgroundSize = '10px 10px';
            pattern.style.pointerEvents = 'none';
            cardEl.appendChild(pattern);
            
            // Holographic effect
            const holoEffect = document.createElement('div');
            holoEffect.style.position = 'absolute';
            holoEffect.style.inset = '0';
            holoEffect.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.1) 100%)';
            holoEffect.style.pointerEvents = 'none';
            cardEl.appendChild(holoEffect);
        } else {
            // Back design for face-down card
            const backDesign = document.createElement('div');
            backDesign.style.width = '80%';
            backDesign.style.height = '80%';
            backDesign.style.border = '2px solid rgba(51, 170, 255, 0.4)';
            backDesign.style.borderRadius = '5px';
            backDesign.style.backgroundImage = 'radial-gradient(circle, rgba(51, 170, 255, 0.2) 10%, transparent 10%)';
            backDesign.style.backgroundSize = '10px 10px';
            cardEl.appendChild(backDesign);
            
            // Logo in center of back
            const logo = document.createElement('div');
            logo.style.position = 'absolute';
            logo.style.fontWeight = 'bold';
            logo.style.fontSize = this.isMobile ? '12px' : '14px';
            logo.style.color = 'rgba(51, 170, 255, 0.7)';
            logo.textContent = 'BJ';
            cardEl.appendChild(logo);
        }
        
        return cardEl;
    }
    
    /**
     * Select a resource for betting
     * @param {string} resource - The resource type
     */
    selectBetResource(resource) {
        this.currentBet.resource = resource;
        this.currentBet.amount = 1;
        document.getElementById('bet-amount').textContent = this.currentBet.amount;
        this.updateControls();
    }
    
    /**
     * Increase the bet amount
     */
    increaseBet() {
        const maxAmount = this.getMaxBet();
        if (this.currentBet.amount < maxAmount) {
            this.currentBet.amount++;
            document.getElementById('bet-amount').textContent = this.currentBet.amount;
        }
    }
    
    /**
     * Decrease the bet amount
     */
    decreaseBet() {
        if (this.currentBet.amount > 1) {
            this.currentBet.amount--;
            document.getElementById('bet-amount').textContent = this.currentBet.amount;
        }
    }
    
    /**
     * Get the maximum possible bet amount for the selected resource
     * @returns {number} The maximum bet amount
     */
    getMaxBet() {
        if (!this.currentBet.resource || !this.spaceship.cargo) {
            return 0;
        }
        
        return this.spaceship.cargo[this.currentBet.resource] || 0;
    }
    
    /**
     * Update the game controls based on the current state
     */
    updateControls() {
        const dealBtn = document.getElementById('deal-btn');
        const hitBtn = document.getElementById('hit-btn');
        const standBtn = document.getElementById('stand-btn');
        const doubleBtn = document.getElementById('double-btn');
        
        // Reset all buttons to disabled state
        [dealBtn, hitBtn, standBtn, doubleBtn].forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'default';
        });
        
        if (!this.gameActive) {
            // Before game starts, only deal button may be active
            const canDeal = this.currentBet.resource && this.currentBet.amount > 0;
            dealBtn.disabled = !canDeal;
            dealBtn.style.opacity = canDeal ? '1' : '0.5';
            dealBtn.style.cursor = canDeal ? 'pointer' : 'default';
        } else {
            // During game, hit/stand buttons are active
            hitBtn.disabled = false;
            hitBtn.style.opacity = '1';
            hitBtn.style.cursor = 'pointer';
            
            standBtn.disabled = false;
            standBtn.style.opacity = '1';
            standBtn.style.cursor = 'pointer';
            
            // Double down only available on first move with 2 cards
            const canDouble = this.playerHand.length === 2 && 
                            this.currentBet.amount * 2 <= this.getMaxBet();
            doubleBtn.disabled = !canDouble;
            doubleBtn.style.opacity = canDouble ? '1' : '0.5';
            doubleBtn.style.cursor = canDouble ? 'pointer' : 'default';
        }
    }
    
    /**
     * Update the resource display
     */
    updateResourceDisplay() {
        console.log("Updating resource display, spaceship:", this.spaceship);
        console.log("Cargo:", this.spaceship ? this.spaceship.cargo : null);
        
        if (this.spaceship && this.spaceship.cargo) {
            // Ensure cargo has all resources initialized
            if (this.spaceship.cargo.iron === undefined) this.spaceship.cargo.iron = 0;
            if (this.spaceship.cargo.gold === undefined) this.spaceship.cargo.gold = 0;
            if (this.spaceship.cargo.platinum === undefined) this.spaceship.cargo.platinum = 0;
            
            // Update resource amounts
            const ironElement = document.querySelector('.iron-amount');
            if (ironElement) {
                ironElement.textContent = `${this.spaceship.cargo.iron} UNITS`;
            }
            
            const goldElement = document.querySelector('.gold-amount');
            if (goldElement) {
                goldElement.textContent = `${this.spaceship.cargo.gold} UNITS`;
            }
            
            const platinumElement = document.querySelector('.platinum-amount');
            if (platinumElement) {
                platinumElement.textContent = `${this.spaceship.cargo.platinum} UNITS`;
            }
        } else {
            console.error("Cannot update resource display: spaceship or cargo is undefined");
        }
    }
    
    /**
     * Start a new game
     */
    startGame() {
        console.log("Starting game with bet:", this.currentBet);
        console.log("Spaceship:", this.spaceship);
        console.log("Cargo:", this.spaceship ? this.spaceship.cargo : null);
        
        if (!this.currentBet.resource || this.currentBet.amount <= 0) {
            console.log("No bet resource or amount selected");
            return;
        }
        
        // Initialize cargo if needed
        if (!this.spaceship) {
            console.error("No spaceship object available");
            document.getElementById('game-status').textContent = 'ERROR: GAME DATA MISSING';
            return;
        }
        
        if (!this.spaceship.cargo) {
            console.warn("Creating cargo object for spaceship");
            this.spaceship.cargo = { iron: 0, gold: 0, platinum: 0 };
        }
        
        // Make sure the resource exists in cargo
        if (this.spaceship.cargo[this.currentBet.resource] === undefined) {
            this.spaceship.cargo[this.currentBet.resource] = 0;
        }
        
        // Check if player has enough resources
        if (this.spaceship.cargo[this.currentBet.resource] < this.currentBet.amount) {
            document.getElementById('game-status').textContent = 'NOT ENOUGH RESOURCES';
            return;
        }
        
        // Deduct bet from player's resources
        this.spaceship.cargo[this.currentBet.resource] -= this.currentBet.amount;
        this.updateResourceDisplay();
        
        // Sync with the game's resource system if available
        if (window.game && window.game.controls && window.game.controls.resources) {
            window.game.controls.resources[this.currentBet.resource] = this.spaceship.cargo[this.currentBet.resource];
            console.log("Updated game resources after bet:", window.game.controls.resources);
        }
        
        // Create and shuffle deck
        this.createDeck();
        
        // Clear previous hands
        this.playerHand = [];
        this.dealerHand = [];
        document.getElementById('player-cards').innerHTML = '';
        document.getElementById('dealer-cards').innerHTML = '';
        
        // Deal initial cards
        this.gameActive = true;
        
        // Deal two cards to player
        this.dealCardToPlayer();
        this.dealCardToPlayer();
        
        // Deal one face up card to dealer
        this.dealCardToDealer();
        
        // Deal one face down card to dealer
        this.dealCardToDealer(true);
        
        // Check for natural blackjack
        this.checkForNaturalBlackjack();
        
        // Update game state
        document.getElementById('game-status').textContent = 'YOUR MOVE';
        
        // Update controls
        this.updateControls();
        
        // Play deal sound
        this.playCardSound('deal');
    }
    
    /**
     * Deal a card to the player
     */
    dealCardToPlayer() {
        const card = this.drawCard();
        this.playerHand.push(card);
        
        // Create and add card element
        const cardEl = this.createCardElement(card);
        document.getElementById('player-cards').appendChild(cardEl);
        
        // Add a slight animation delay
        setTimeout(() => {
            cardEl.style.transform = 'translateY(-5px)';
        }, 50);
        
        // Update score
        const score = this.calculateScore(this.playerHand);
        document.getElementById('player-score').textContent = score;
        
        // Check for bust
        if (score > 21) {
            this.playerBust();
        }
    }
    
    /**
     * Deal a card to the dealer
     * @param {boolean} faceDown - Whether the card should be face down
     */
    dealCardToDealer(faceDown = false) {
        const card = this.drawCard();
        this.dealerHand.push(card);
        
        // Create and add card element
        const cardEl = this.createCardElement(card, faceDown);
        cardEl.id = faceDown ? 'face-down-card' : '';
        document.getElementById('dealer-cards').appendChild(cardEl);
        
        // Add a slight animation delay
        setTimeout(() => {
            cardEl.style.transform = 'translateY(-5px)';
        }, 50);
        
        // Update score (only counting face-up cards)
        if (!faceDown) {
            const visibleScore = this.calculateVisibleDealerScore();
            document.getElementById('dealer-score').textContent = visibleScore;
        }
    }
    
    /**
     * Calculate the dealer's visible score (excluding face-down card)
     * @returns {number} The visible score
     */
    calculateVisibleDealerScore() {
        if (this.dealerHand.length <= 1) {
            return this.dealerHand.length ? this.getCardValue(this.dealerHand[0]) : 0;
        }
        
        // Calculate score excluding the last card (which is face down)
        return this.calculateScore(this.dealerHand.slice(0, -1));
    }
    
    /**
     * Check for natural blackjack
     */
    checkForNaturalBlackjack() {
        const playerScore = this.calculateScore(this.playerHand);
        const dealerScore = this.calculateScore(this.dealerHand);
        
        if (playerScore === 21 || dealerScore === 21) {
            // Reveal dealer's face-down card
            this.revealDealerCard();
            
            if (playerScore === 21 && dealerScore === 21) {
                // Both have blackjack - push
                this.push();
            } else if (playerScore === 21) {
                // Player has blackjack - win with 3:2 payout
                this.blackjackWin();
            } else {
                // Dealer has blackjack - player loses
                this.playerLose();
            }
        }
    }
    
    /**
     * Player action: Hit (take another card)
     */
    hit() {
        if (this.gameActive) {
            this.dealCardToPlayer();
            this.playCardSound('hit');
            this.updateControls();
        }
    }
    
    /**
     * Player action: Stand (end turn)
     */
    stand() {
        if (this.gameActive) {
            this.playCardSound('stand');
            this.dealerPlay();
        }
    }
    
    /**
     * Player action: Double Down (double bet, take one card, then stand)
     */
    doubleDown() {
        if (this.gameActive && this.playerHand.length === 2) {
            // Check if player has enough resources
            if (this.spaceship.cargo[this.currentBet.resource] < this.currentBet.amount) {
                document.getElementById('game-status').textContent = 'NOT ENOUGH RESOURCES FOR DOUBLE DOWN';
                return;
            }
            
            // Double the bet
            this.spaceship.cargo[this.currentBet.resource] -= this.currentBet.amount;
            this.currentBet.amount *= 2;
            this.updateResourceDisplay();
            
            // Sync with the game's resource system if available
            if (window.game && window.game.controls && window.game.controls.resources) {
                window.game.controls.resources[this.currentBet.resource] = this.spaceship.cargo[this.currentBet.resource];
                console.log("Updated game resources after double down:", window.game.controls.resources);
            }
            
            // Deal one more card
            this.dealCardToPlayer();
            
            // If not bust, dealer plays
            if (this.calculateScore(this.playerHand) <= 21) {
                this.dealerPlay();
            }
            
            this.playCardSound('double');
        }
    }
    
    /**
     * Dealer's turn to play
     */
    dealerPlay() {
        // Reveal dealer's face-down card
        this.revealDealerCard();
        
        // Dealer hits until score is 17 or higher
        let dealerScore = this.calculateScore(this.dealerHand);
        
        const dealerPlayNextCard = () => {
            if (dealerScore < 17) {
                // Deal a new card to dealer
                this.dealCardToDealer();
                
                // Update dealer score
                dealerScore = this.calculateScore(this.dealerHand);
                
                // Play sound
                this.playCardSound('hit');
                
                // Continue with a small delay
                setTimeout(() => {
                    dealerPlayNextCard();
                }, 800);
            } else {
                // Dealer is done - determine outcome
                this.determineOutcome();
            }
        };
        
        // Start dealer's play with a delay
        setTimeout(dealerPlayNextCard, 800);
    }
    
    /**
     * Reveal the dealer's face-down card
     */
    revealDealerCard() {
        // Remove the face-down card element
        const faceDownEl = document.getElementById('face-down-card');
        if (faceDownEl) {
            faceDownEl.remove();
            
            // Create and add the face-up version of the last card
            const lastCard = this.dealerHand[this.dealerHand.length - 1];
            const cardEl = this.createCardElement(lastCard);
            document.getElementById('dealer-cards').appendChild(cardEl);
            
            // Add a slight animation delay
            setTimeout(() => {
                cardEl.style.transform = 'translateY(-5px)';
            }, 50);
            
            // Update dealer score
            const dealerScore = this.calculateScore(this.dealerHand);
            document.getElementById('dealer-score').textContent = dealerScore;
            
            // Play flip sound
            this.playCardSound('flip');
        }
    }
    
    /**
     * Determine the outcome of the game
     */
    determineOutcome() {
        const playerScore = this.calculateScore(this.playerHand);
        const dealerScore = this.calculateScore(this.dealerHand);
        
        if (dealerScore > 21) {
            // Dealer busts - player wins
            this.playerWin();
        } else if (playerScore > dealerScore) {
            // Player score higher - player wins
            this.playerWin();
        } else if (dealerScore > playerScore) {
            // Dealer score higher - player loses
            this.playerLose();
        } else {
            // Scores are equal - push
            this.push();
        }
    }
    
    /**
     * Player busts (score over 21)
     */
    playerBust() {
        this.gameActive = false;
        this.gameResult = 'bust';
        
        document.getElementById('game-status').textContent = 'BUST! YOU LOSE';
        this.showDealerSpeech('lose');
        
        // Play bust sound
        this.playCardSound('bust');
        
        // Update controls
        this.updateControls();
    }
    
    /**
     * Player wins
     */
    playerWin() {
        this.gameActive = false;
        this.gameResult = 'win';
        
        document.getElementById('game-status').textContent = 'YOU WIN!';
        this.showDealerSpeech('win');
        
        // Calculate winnings (2x bet)
        const winAmount = this.currentBet.amount * 2;
        this.spaceship.cargo[this.currentBet.resource] += winAmount;
        this.updateResourceDisplay();
        
        // Sync with the game's resource system if available
        if (window.game && window.game.controls && window.game.controls.resources) {
            window.game.controls.resources[this.currentBet.resource] = this.spaceship.cargo[this.currentBet.resource];
            console.log("Updated game resources after win:", window.game.controls.resources);
        }
        
        // Play win sound
        this.playCardSound('win');
        
        // Update controls
        this.updateControls();
    }
    
    /**
     * Player gets a blackjack (natural 21)
     */
    blackjackWin() {
        this.gameActive = false;
        this.gameResult = 'blackjack';
        
        document.getElementById('game-status').textContent = 'BLACKJACK! TRIPLE PAYOUT!';
        this.showDealerSpeech('blackjack');
        
        // Calculate winnings (3x bet)
        const winAmount = this.currentBet.amount * 3;
        this.spaceship.cargo[this.currentBet.resource] += winAmount;
        this.updateResourceDisplay();
        
        // Sync with the game's resource system if available
        if (window.game && window.game.controls && window.game.controls.resources) {
            window.game.controls.resources[this.currentBet.resource] = this.spaceship.cargo[this.currentBet.resource];
            console.log("Updated game resources after blackjack:", window.game.controls.resources);
        }
        
        // Play win sound
        this.playCardSound('blackjack');
        
        // Update controls
        this.updateControls();
    }
    
    /**
     * Player loses
     */
    playerLose() {
        this.gameActive = false;
        this.gameResult = 'lose';
        
        document.getElementById('game-status').textContent = 'DEALER WINS';
        this.showDealerSpeech('lose');
        
        // Play lose sound
        this.playCardSound('lose');
        
        // Update controls
        this.updateControls();
    }
    
    /**
     * Push (tie)
     */
    push() {
        this.gameActive = false;
        this.gameResult = 'push';
        
        document.getElementById('game-status').textContent = 'PUSH - BETS RETURNED';
        this.showDealerSpeech('push');
        
        // Return bet to player
        this.spaceship.cargo[this.currentBet.resource] += this.currentBet.amount;
        this.updateResourceDisplay();
        
        // Sync with the game's resource system if available
        if (window.game && window.game.controls && window.game.controls.resources) {
            window.game.controls.resources[this.currentBet.resource] = this.spaceship.cargo[this.currentBet.resource];
            console.log("Updated game resources after push:", window.game.controls.resources);
        }
        
        // Play push sound
        this.playCardSound('push');
        
        // Update controls
        this.updateControls();
    }
    
    /**
     * Show dealer speech bubble with a random phrase
     * @param {string} type - The type of phrase to show
     */
    showDealerSpeech(type) {
        const speechBubble = document.getElementById('dealer-speech');
        const phrases = this.dealerPhrases[type];
        
        if (phrases && phrases.length > 0) {
            const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
            speechBubble.textContent = randomPhrase;
            speechBubble.style.display = 'block';
            
            // Remove after a few seconds
            setTimeout(() => {
                speechBubble.style.display = 'none';
            }, 4000);
        }
    }
    
    /**
     * Play a card game sound
     * @param {string} type - The type of sound to play
     */
    playCardSound(type) {
        if (!this.audio) return;
        
        switch (type) {
            case 'deal':
                this.audio.playSound('boink');
                break;
            case 'hit':
                this.audio.playSound('boink');
                break;
            case 'stand':
                this.audio.playSound('boink');
                break;
            case 'double':
                // Play two sounds in quick succession
                this.audio.playSound('boink');
                setTimeout(() => this.audio.playSound('boink'), 150);
                break;
            case 'flip':
                this.audio.playSound('boink');
                break;
            case 'win':
                this.audio.playSound('phaserUp');
                break;
            case 'blackjack':
                // Play multiple sounds for celebration
                this.audio.playSound('phaserUp');
                setTimeout(() => this.audio.playSound('phaserUp'), 300);
                break;
            case 'lose':
                this.audio.playSound('phaserDown');
                break;
            case 'bust':
                this.audio.playSound('phaserDown');
                break;
            case 'push':
                this.audio.playSound('boink');
                break;
        }
    }
}