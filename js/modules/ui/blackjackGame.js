/**
 * Blackjack Minigame - A futuristic card game for the stargate terminal
 * 
 * Features:
 * - Space-themed card designs with futuristic symbols
 * - Wager ship resources (Iron, Gold, Platinum)
 * - Play against an AI dealer with pirate personality
 * - Holographic UI with neon effects
 */

import { MobileDetector } from '../../utils/mobileDetector.ts';
import { BlackjackGameView } from './components/blackjack/gameView.js';
import { BlackjackCardDeck } from './components/blackjack/cardDeck.js';
import { BlackjackGameLogic } from './components/blackjack/gameLogic.js';
import { BlackjackAnimations } from './components/blackjack/animations.js';
import { BlackjackBetting } from './components/blackjack/betting.js';
import { BlackjackEventHandlers } from './components/blackjack/eventHandlers.js';

export class BlackjackGame {
    constructor(scene, spaceship, audio) {
        this.scene = scene;
        this.spaceship = spaceship;
        this.audio = audio;
        this.isMobile = MobileDetector.isMobile();

        console.log("BlackjackGame constructor - spaceship:", this.spaceship);
        console.log("BlackjackGame constructor - cargo:", this.spaceship ? this.spaceship.cargo : null);
        console.log("BlackjackGame constructor - isMobile:", this.isMobile);
        
        // Initialize components
        this.view = new BlackjackGameView(this.isMobile);
        this.deck = new BlackjackCardDeck();
        this.gameLogic = new BlackjackGameLogic();
        this.animations = new BlackjackAnimations(this.audio);
        this.betting = new BlackjackBetting(this.spaceship);
        this.eventHandlers = new BlackjackEventHandlers(this, this.isMobile);
        
        // UI elements
        this.gameUI = null;
    }
    
    /**
     * Initialize the game UI
     */
    init() {
        if (!this.gameUI) {
            this.createGameUI();
        }
    }
    
    /**
     * Create the game UI elements
     */
    createGameUI() {
        this.gameUI = this.view.createGameUI();
        this.eventHandlers.initialize();
        this.updateControls();
    }
    
    /**
     * Show the game UI and sync with current game resources
     */
    show() {
        // Don't show during intro sequence
        if (window.game && window.game.introSequenceActive) {
            console.log("BlackjackGame: Not showing game UI during intro sequence");
            return;
        }
        
        if (this.gameUI) {
            this.view.show(this.gameUI);
            this.reset();
            
            // Force audio context resumption for mobile
            if (this.audio && this.isMobile) {
                setTimeout(() => {
                    console.log("Mobile: Attempting to play initial sound in BlackjackGame");
                    this.audio.playSound('boink');
                }, 100);
            }
            
            // Sync with game resources
            this.betting.syncWithGameResources();
            this.view.updateResourceDisplay(this.spaceship);
            this.animations.playCardSound('boink');
        } else {
            this.init();
            this.show();
        }
    }
    
    /**
     * Hide the game UI and return to the stargate interface
     */
    hide() {
        if (this.gameUI) {
            this.view.hide(this.gameUI);
            this.animations.playCardSound('boink');
            
            // Show the stargate interface when exiting blackjack
            const stargateUI = document.getElementById('stargate-ui');
            if (stargateUI) {
                stargateUI.style.display = 'block';
            }
        }
    }
    
    /**
     * Reset the game state
     */
    reset() {
        this.gameLogic.reset();
        this.betting.reset();
        
        // Reset UI elements
        this.view.clearCards(true);  // Player cards
        this.view.clearCards(false); // Dealer cards
        this.view.updateScore(0, true);  // Player score
        this.view.updateScore(0, false); // Dealer score
        this.view.updateGameStatus('PLACE YOUR BET TO BEGIN');
        this.view.updateBetAmount('0');
        
        // Hide dealer speech
        const speechBubble = document.getElementById('dealer-speech');
        if (speechBubble) {
            speechBubble.style.display = 'none';
        }
        
        // Reset resource selection
        document.querySelectorAll('.resource-btn').forEach(btn => {
            this.animations.removeResourceSelection(btn);
        });
        
        this.updateControls();
    }
    
    /**
     * Select a resource for betting
     */
    selectBetResource(resource) {
        this.betting.selectBetResource(resource);
        this.view.updateBetAmount(this.betting.getCurrentBet().amount);
        this.updateControls();
    }
    
    /**
     * Update the game controls based on the current state
     */
    updateControls() {
        this.eventHandlers.updateButtonStates();
    }
    
    /**
     * Start a new game
     */
    startGame() {
        console.log("Starting game with bet:", this.betting.getCurrentBet());
        
        if (!this.betting.hasValidBet()) {
            console.log("No valid bet selected");
            return;
        }
        
        // Initialize cargo if needed
        if (!this.betting.initializeCargo()) {
            this.view.updateGameStatus('ERROR: GAME DATA MISSING');
            return;
        }
        
        // Check if player has enough resources
        if (!this.betting.canAffordBet()) {
            this.view.updateGameStatus('NOT ENOUGH RESOURCES');
            return;
        }
        
        // Place the bet
        if (!this.betting.placeBet()) {
            this.view.updateGameStatus('BET FAILED');
            return;
        }
        
        this.view.updateResourceDisplay(this.spaceship);
        
        // Create and shuffle deck
        this.deck.reset();
        
        // Clear previous hands and start game
        this.gameLogic.startGame();
        this.view.clearCards(true);
        this.view.clearCards(false);
        
        // Deal initial cards
        this.dealCardToPlayer();
        this.dealCardToPlayer();
        this.dealCardToDealer();
        this.dealCardToDealer(true); // Face down
        
        // Check for natural blackjack
        const naturalResult = this.gameLogic.checkForNaturalBlackjack();
        if (naturalResult) {
            this.handleGameEnd(naturalResult);
        } else {
            this.view.updateGameStatus('YOUR MOVE');
        }
        
        this.updateControls();
        this.animations.playCardSound('deal');
    }
    
    /**
     * Deal a card to the player
     */
    dealCardToPlayer() {
        const card = this.deck.drawCard();
        this.gameLogic.addCardToPlayer(card);
        
        const cardEl = this.view.addCard(card, false, true);
        this.animations.animateCardDeal(cardEl);
        
        const score = this.gameLogic.getPlayerScore();
        this.view.updateScore(score, true);
        
        if (this.gameLogic.isBust(this.gameLogic.getPlayerHand())) {
            this.handleGameEnd('bust');
        }
    }
    
    /**
     * Deal a card to the dealer
     */
    dealCardToDealer(faceDown = false) {
        const card = this.deck.drawCard();
        this.gameLogic.addCardToDealer(card);
        
        const cardEl = this.view.addCard(card, faceDown, false);
        this.animations.animateCardDeal(cardEl);
        
        if (!faceDown) {
            const visibleScore = this.gameLogic.calculateVisibleDealerScore();
            this.view.updateScore(visibleScore, false);
        }
    }
    
    /**
     * Player action: Hit (take another card)
     */
    hit() {
        if (this.gameLogic.isGameActive()) {
            this.dealCardToPlayer();
            this.animations.playCardSound('hit');
            this.updateControls();
        }
    }
    
    /**
     * Player action: Stand (end turn)
     */
    stand() {
        if (this.gameLogic.isGameActive()) {
            this.animations.playCardSound('stand');
            this.dealerPlay();
        }
    }
    
    /**
     * Player action: Double Down
     */
    doubleDown() {
        if (this.gameLogic.isGameActive() && this.gameLogic.getPlayerHand().length === 2) {
            if (!this.betting.canAffordDoubleDown()) {
                this.view.updateGameStatus('NOT ENOUGH RESOURCES FOR DOUBLE DOWN');
                return;
            }
            
            // Double the bet
            this.betting.doubleDown();
            this.view.updateResourceDisplay(this.spaceship);
            
            // Deal one more card
            this.dealCardToPlayer();
            
            // If not bust, dealer plays
            if (!this.gameLogic.isBust(this.gameLogic.getPlayerHand())) {
                this.dealerPlay();
            }
            
            this.animations.playCardSound('double');
        }
    }
    
    /**
     * Dealer's turn to play
     */
    dealerPlay() {
        // Reveal dealer's face-down card
        const lastCard = this.gameLogic.getLastDealerCard();
        if (lastCard) {
            this.animations.animateCardFlip(
                document.getElementById('face-down-card'),
                () => {
                    this.view.revealDealerCard(lastCard);
                    this.view.updateScore(this.gameLogic.getDealerScore(), false);
                }
            );
        }
        
        // Dealer hits until score is 17 or higher
        const dealerPlayNextCard = () => {
            if (this.gameLogic.shouldDealerHit()) {
                this.dealCardToDealer();
                this.animations.playCardSound('hit');
                
                setTimeout(() => {
                    dealerPlayNextCard();
                }, 800);
            } else {
                const result = this.gameLogic.determineOutcome();
                this.handleGameEnd(result);
            }
        };
        
        setTimeout(dealerPlayNextCard, 800);
    }
    
    /**
     * Handle game end with result
     */
    handleGameEnd(result) {
        this.gameLogic.endGame(result);
        
        let payout = 0;
        let statusMessage = '';
        let speechType = result;
        
        switch (result) {
            case 'win':
                payout = this.betting.handleWin();
                statusMessage = 'YOU WIN!';
                this.animations.animateWinCelebration(this.gameUI);
                this.animations.playCardSound('win');
                break;
                
            case 'blackjack':
                payout = this.betting.handleBlackjack();
                statusMessage = 'BLACKJACK! TRIPLE PAYOUT!';
                this.animations.animateBlackjackCelebration(this.gameUI);
                this.animations.playCardSound('blackjack');
                break;
                
            case 'lose':
            case 'bust':
                statusMessage = result === 'bust' ? 'BUST! YOU LOSE' : 'DEALER WINS';
                this.animations.animateLoseEffect(this.gameUI);
                this.animations.playCardSound(result);
                speechType = 'lose';
                break;
                
            case 'push':
                payout = this.betting.handlePush();
                statusMessage = 'PUSH - BETS RETURNED';
                this.animations.playCardSound('push');
                break;
        }
        
        this.view.updateGameStatus(statusMessage);
        this.view.updateResourceDisplay(this.spaceship);
        
        // Show dealer speech
        const phrase = this.gameLogic.getDealerPhrase(speechType);
        if (phrase) {
            this.view.showDealerSpeech(phrase);
        }
        
        this.updateControls();
    }
    
    /**
     * Cleanup method for destroying the game
     */
    destroy() {
        if (this.eventHandlers) {
            this.eventHandlers.destroy();
        }
        
        if (this.gameUI && this.gameUI.parentNode) {
            this.gameUI.parentNode.removeChild(this.gameUI);
        }
        
        this.gameUI = null;
    }
}