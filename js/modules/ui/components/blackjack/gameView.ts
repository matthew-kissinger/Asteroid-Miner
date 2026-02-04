/**
 * Blackjack Game View - DOM creation, card display, table layout
 */

import { BlackjackStyles } from './styles.js';

export class BlackjackGameView {
    constructor(isMobile = false) {
        this.isMobile = isMobile;
        this.styles = new BlackjackStyles(isMobile);
        this.cardSymbols = {
            spades: '♠', // Asteroid symbol
            hearts: '♥', // Planet symbol
            clubs: '♣', // Star symbol
            diamonds: '♦' // Nebula symbol
        };
    }

    /**
     * Create the main game UI container
     */
    createGameUI() {
        const gameUI = document.createElement('div');
        gameUI.id = 'blackjack-game';
        
        // Apply main UI styles
        this.styles.applyStyles(gameUI, this.styles.getGameUIStyles());
        this.styles.applyStyles(gameUI, this.styles.getMobileStyles());
        
        // Add scanline effect
        const scanlines = document.createElement('div');
        this.styles.applyStyles(scanlines, this.styles.getScanlineStyles());
        gameUI.appendChild(scanlines);
        
        // Create header
        const header = this.createHeader();
        gameUI.appendChild(header);
        
        // Create game area
        const gameArea = this.createGameArea();
        gameUI.appendChild(gameArea);
        
        document.body.appendChild(gameUI);
        return gameUI;
    }

    /**
     * Create the header section
     */
    createHeader() {
        const header = document.createElement('div');
        this.styles.applyStyles(header, this.styles.getHeaderStyles());
        
        // Title
        const title = document.createElement('h2');
        title.textContent = 'STELLAR BLACKJACK';
        this.styles.applyStyles(title, this.styles.getTitleStyles());
        header.appendChild(title);
        
        // Subtitle
        const subtitle = document.createElement('div');
        subtitle.textContent = 'WAGER RESOURCES • WIN BIG • BEAT THE DEALER';
        this.styles.applyStyles(subtitle, this.styles.getSubtitleStyles());
        header.appendChild(subtitle);
        
        // Close button
        const closeBtn = this.createCloseButton();
        header.appendChild(closeBtn);
        
        return header;
    }

    /**
     * Create the close button
     */
    createCloseButton() {
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        this.styles.applyStyles(closeBtn, this.styles.getCloseButtonStyles());
        return closeBtn;
    }

    /**
     * Create the main game area
     */
    createGameArea() {
        const gameArea = document.createElement('div');
        this.styles.applyStyles(gameArea, this.styles.getGameAreaStyles());
        
        // Dealer area
        const dealerArea = this.createDealerArea();
        gameArea.appendChild(dealerArea);
        
        // Status area
        const statusArea = this.createStatusArea();
        gameArea.appendChild(statusArea);
        
        // Player area
        const playerArea = this.createPlayerArea();
        gameArea.appendChild(playerArea);
        
        // Controls area
        const controlsArea = this.createControlsArea();
        gameArea.appendChild(controlsArea);
        
        return gameArea;
    }

    /**
     * Create the dealer area
     */
    createDealerArea() {
        const dealerArea = document.createElement('div');
        this.styles.applyStyles(dealerArea, this.styles.getDealerAreaStyles());
        
        // Dealer header
        const dealerHeader = this.createAreaHeader('DEALER', 'dealer-score', false);
        dealerArea.appendChild(dealerHeader);
        
        // Dealer cards container
        const dealerCards = document.createElement('div');
        dealerCards.id = 'dealer-cards';
        this.styles.applyStyles(dealerCards, this.styles.getCardsContainerStyles());
        dealerArea.appendChild(dealerCards);
        
        // Dealer speech bubble
        const speechBubble = document.createElement('div');
        speechBubble.id = 'dealer-speech';
        this.styles.applyStyles(speechBubble, this.styles.getSpeechBubbleStyles());
        dealerArea.appendChild(speechBubble);
        
        return dealerArea;
    }

    /**
     * Create the player area
     */
    createPlayerArea() {
        const playerArea = document.createElement('div');
        this.styles.applyStyles(playerArea, this.styles.getPlayerAreaStyles());
        
        // Player header
        const playerHeader = this.createAreaHeader('YOUR HAND', 'player-score', true);
        playerArea.appendChild(playerHeader);
        
        // Player cards container
        const playerCards = document.createElement('div');
        playerCards.id = 'player-cards';
        this.styles.applyStyles(playerCards, this.styles.getCardsContainerStyles());
        playerArea.appendChild(playerCards);
        
        return playerArea;
    }

    /**
     * Create area header (dealer/player)
     */
    createAreaHeader(title, scoreId, isPlayer) {
        const header = document.createElement('div');
        header.className = isPlayer ? 'player-header' : 'dealer-header';
        this.styles.applyStyles(header, this.styles.getAreaHeaderStyles());
        
        // Title
        const titleElement = document.createElement('div');
        titleElement.textContent = title;
        this.styles.applyStyles(titleElement, isPlayer ? this.styles.getPlayerTitleStyles() : this.styles.getDealerTitleStyles());
        header.appendChild(titleElement);
        
        // Score
        const score = document.createElement('div');
        score.id = scoreId;
        score.textContent = '0';
        this.styles.applyStyles(score, this.styles.getScoreStyles(isPlayer));
        header.appendChild(score);
        
        return header;
    }

    /**
     * Create the status area
     */
    createStatusArea() {
        const statusArea = document.createElement('div');
        this.styles.applyStyles(statusArea, this.styles.getStatusAreaStyles());
        
        const gameStatus = document.createElement('div');
        gameStatus.id = 'game-status';
        gameStatus.textContent = 'PLACE YOUR BET TO BEGIN';
        this.styles.applyStyles(gameStatus, this.styles.getGameStatusStyles());
        statusArea.appendChild(gameStatus);
        
        return statusArea;
    }

    /**
     * Create the controls area
     */
    createControlsArea() {
        const controlsArea = document.createElement('div');
        this.styles.applyStyles(controlsArea, this.styles.getControlsAreaStyles());
        
        // Betting controls
        const bettingControls = this.createBettingControls();
        controlsArea.appendChild(bettingControls);
        
        // Game actions
        const gameActions = this.createGameActions();
        controlsArea.appendChild(gameActions);
        
        return controlsArea;
    }

    /**
     * Create betting controls
     */
    createBettingControls() {
        const bettingControls = document.createElement('div');
        bettingControls.id = 'betting-controls';
        this.styles.applyStyles(bettingControls, this.styles.getBettingControlsStyles());
        
        // Betting title
        const bettingTitle = document.createElement('div');
        bettingTitle.textContent = 'PLACE YOUR BET';
        this.styles.applyStyles(bettingTitle, this.styles.getBettingTitleStyles());
        bettingControls.appendChild(bettingTitle);
        
        // Resource options
        const resourceOptions = this.createResourceOptions();
        bettingControls.appendChild(resourceOptions);
        
        // Bet amount controls
        const betAmountControls = this.createBetAmountControls();
        bettingControls.appendChild(betAmountControls);
        
        return bettingControls;
    }

    /**
     * Create resource selection buttons
     */
    createResourceOptions() {
        const resourceOptions = document.createElement('div');
        this.styles.applyStyles(resourceOptions, this.styles.getResourceOptionsStyles());
        
        const resources = [
            { name: 'iron', color: 'rgba(150, 150, 150, 1)' },
            { name: 'gold', color: 'rgba(255, 215, 0, 1)' },
            { name: 'platinum', color: 'rgba(229, 228, 226, 1)' }
        ];
        
        resources.forEach(resource => {
            const btn = this.createResourceButton(resource.name, resource.color);
            resourceOptions.appendChild(btn);
        });
        
        return resourceOptions;
    }

    /**
     * Create a resource button
     */
    createResourceButton(resource, color) {
        const btn = document.createElement('button');
        btn.className = 'resource-btn';
        btn.dataset.resource = resource;
        this.styles.applyStyles(btn, this.styles.getResourceButtonStyles(color));
        
        // Resource name
        const resourceName = document.createElement('span');
        resourceName.textContent = resource.toUpperCase();
        resourceName.style.fontWeight = 'bold';
        resourceName.style.fontSize = '12px';
        btn.appendChild(resourceName);
        
        // Resource amount
        const resourceAmount = document.createElement('span');
        resourceAmount.className = `${resource}-amount`;
        resourceAmount.textContent = '0 UNITS';
        resourceAmount.style.fontSize = '10px';
        resourceAmount.style.marginTop = '3px';
        resourceAmount.style.opacity = '0.7';
        btn.appendChild(resourceAmount);
        
        return btn;
    }

    /**
     * Create bet amount controls
     */
    createBetAmountControls() {
        const betAmountControls = document.createElement('div');
        this.styles.applyStyles(betAmountControls, this.styles.getBetAmountControlsStyles());
        
        // Bet amount display
        const betAmountDisplay = document.createElement('div');
        betAmountDisplay.id = 'bet-amount';
        betAmountDisplay.textContent = '0';
        this.styles.applyStyles(betAmountDisplay, this.styles.getBetAmountDisplayStyles());
        betAmountControls.appendChild(betAmountDisplay);
        
        // Decrease button
        const decreaseBtn = document.createElement('button');
        decreaseBtn.textContent = '-';
        decreaseBtn.id = 'decrease-bet-btn';
        this.styles.applyStyles(decreaseBtn, this.styles.getControlButtonStyles());
        betAmountControls.appendChild(decreaseBtn);
        
        // Increase button
        const increaseBtn = document.createElement('button');
        increaseBtn.textContent = '+';
        increaseBtn.id = 'increase-bet-btn';
        this.styles.applyStyles(increaseBtn, this.styles.getControlButtonStyles());
        betAmountControls.appendChild(increaseBtn);
        
        return betAmountControls;
    }

    /**
     * Create game action buttons
     */
    createGameActions() {
        const gameActions = document.createElement('div');
        this.styles.applyStyles(gameActions, this.styles.getGameActionsStyles());
        
        const actionButtons = [
            { id: 'deal-btn', text: 'DEAL', color: '#30cfd0' },
            { id: 'hit-btn', text: 'HIT', color: '#ff9e3d' },
            { id: 'stand-btn', text: 'STAND', color: '#e55c8a' },
            { id: 'double-btn', text: 'DOUBLE', color: '#a281ff' }
        ];
        
        actionButtons.forEach(btn => {
            const button = this.createActionButton(btn.id, btn.text, btn.color);
            gameActions.appendChild(button);
        });
        
        return gameActions;
    }

    /**
     * Create an action button
     */
    createActionButton(id, text, color) {
        const button = document.createElement('button');
        button.id = id;
        button.textContent = text;
        this.styles.applyStyles(button, this.styles.getActionButtonStyles(color));
        button.disabled = true;
        button.style.opacity = '0.5';
        return button;
    }

    /**
     * Create a visual card element
     */
    createCardElement(card, faceDown = false) {
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        this.styles.applyStyles(cardEl, this.styles.getCardStyles(faceDown));
        
        if (!faceDown) {
            this.createFaceUpCard(cardEl, card);
        } else {
            this.createFaceDownCard(cardEl);
        }
        
        return cardEl;
    }

    /**
     * Create face-up card content
     */
    createFaceUpCard(cardEl, card) {
        const color = this.styles.getCardColor(card.suit);
        
        // Card value at top-left
        const topValue = document.createElement('div');
        topValue.textContent = card.value;
        topValue.style.color = color;
        this.styles.applyStyles(topValue, this.styles.getCardValueStyles('top'));
        cardEl.appendChild(topValue);
        
        // Suit at top-right
        const topSuit = document.createElement('div');
        topSuit.textContent = this.cardSymbols[card.suit];
        topSuit.style.color = color;
        this.styles.applyStyles(topSuit, this.styles.getCardSuitStyles('top'));
        cardEl.appendChild(topSuit);
        
        // Center symbol
        const centerSymbol = document.createElement('div');
        centerSymbol.textContent = this.cardSymbols[card.suit];
        centerSymbol.style.color = color;
        this.styles.applyStyles(centerSymbol, this.styles.getCenterSymbolStyles());
        cardEl.appendChild(centerSymbol);
        
        // Value at bottom-right (rotated)
        const bottomValue = document.createElement('div');
        bottomValue.textContent = card.value;
        bottomValue.style.color = color;
        this.styles.applyStyles(bottomValue, this.styles.getCardValueStyles('bottom'));
        cardEl.appendChild(bottomValue);
        
        // Suit at bottom-left (rotated)
        const bottomSuit = document.createElement('div');
        bottomSuit.textContent = this.cardSymbols[card.suit];
        bottomSuit.style.color = color;
        this.styles.applyStyles(bottomSuit, this.styles.getCardSuitStyles('bottom'));
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
    }

    /**
     * Create face-down card content
     */
    createFaceDownCard(cardEl) {
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

    /**
     * Show the game UI
     */
    show(gameUI) {
        if (gameUI) {
            gameUI.style.display = 'block';
        }
    }

    /**
     * Hide the game UI
     */
    hide(gameUI) {
        if (gameUI) {
            gameUI.style.display = 'none';
        }
    }

    /**
     * Update resource display
     */
    updateResourceDisplay(spaceship) {
        if (spaceship && spaceship.cargo) {
            // Ensure cargo has all resources initialized
            if (spaceship.cargo.iron === undefined) spaceship.cargo.iron = 0;
            if (spaceship.cargo.gold === undefined) spaceship.cargo.gold = 0;
            if (spaceship.cargo.platinum === undefined) spaceship.cargo.platinum = 0;
            
            // Update resource amounts
            const ironElement = document.querySelector('.iron-amount');
            if (ironElement) {
                ironElement.textContent = `${spaceship.cargo.iron} UNITS`;
            }
            
            const goldElement = document.querySelector('.gold-amount');
            if (goldElement) {
                goldElement.textContent = `${spaceship.cargo.gold} UNITS`;
            }
            
            const platinumElement = document.querySelector('.platinum-amount');
            if (platinumElement) {
                platinumElement.textContent = `${spaceship.cargo.platinum} UNITS`;
            }
        }
    }

    /**
     * Update score display
     */
    updateScore(score, isPlayer = true) {
        const scoreElement = document.getElementById(isPlayer ? 'player-score' : 'dealer-score');
        if (scoreElement) {
            scoreElement.textContent = score;
        }
    }

    /**
     * Update game status
     */
    updateGameStatus(message) {
        const statusElement = document.getElementById('game-status');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }

    /**
     * Update bet amount display
     */
    updateBetAmount(amount) {
        const betElement = document.getElementById('bet-amount');
        if (betElement) {
            betElement.textContent = amount;
        }
    }

    /**
     * Clear cards from an area
     */
    clearCards(isPlayer = true) {
        const cardsContainer = document.getElementById(isPlayer ? 'player-cards' : 'dealer-cards');
        if (cardsContainer) {
            cardsContainer.innerHTML = '';
        }
    }

    /**
     * Add card to an area
     */
    addCard(card, faceDown = false, isPlayer = true) {
        const cardsContainer = document.getElementById(isPlayer ? 'player-cards' : 'dealer-cards');
        if (cardsContainer) {
            const cardEl = this.createCardElement(card, faceDown);
            if (faceDown) {
                cardEl.id = 'face-down-card';
            }
            cardsContainer.appendChild(cardEl);
            
            // Add animation delay
            setTimeout(() => {
                cardEl.style.transform = 'translateY(-5px)';
            }, 50);
            
            return cardEl;
        }
        return null;
    }

    /**
     * Show dealer speech
     */
    showDealerSpeech(message, duration = 4000) {
        const speechBubble = document.getElementById('dealer-speech');
        if (speechBubble) {
            speechBubble.textContent = message;
            speechBubble.style.display = 'block';
            
            setTimeout(() => {
                speechBubble.style.display = 'none';
            }, duration);
        }
    }

    /**
     * Reveal dealer's face-down card
     */
    revealDealerCard(card) {
        const faceDownEl = document.getElementById('face-down-card');
        if (faceDownEl) {
            faceDownEl.remove();
            
            // Create and add the face-up version
            const cardEl = this.createCardElement(card);
            const dealerCards = document.getElementById('dealer-cards');
            if (dealerCards) {
                dealerCards.appendChild(cardEl);
                
                // Add animation delay
                setTimeout(() => {
                    cardEl.style.transform = 'translateY(-5px)';
                }, 50);
                
                return cardEl;
            }
        }
        return null;
    }
}