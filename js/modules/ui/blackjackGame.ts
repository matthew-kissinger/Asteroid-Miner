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
import { BlackjackGameView } from './components/blackjack/gameView.ts';
import { BlackjackCardDeck } from './components/blackjack/cardDeck.ts';
import { BlackjackGameLogic } from './components/blackjack/gameLogic.ts';
import { BlackjackAnimations } from './components/blackjack/animations.ts';
import { BlackjackBetting } from './components/blackjack/betting.ts';
import { BlackjackEventHandlers } from './components/blackjack/eventHandlers.ts';

type BlackjackAudio = {
    playSound?: (sound: string) => void;
};

type BlackjackSpaceship = {
    cargo?: {
        iron?: number;
        gold?: number;
        platinum?: number;
    };
};

type ResourceType = 'iron' | 'gold' | 'platinum';
type BlackjackGameResult = 'win' | 'blackjack' | 'lose' | 'bust' | 'push';
type BlackjackBet = {
    amount: number;
    resource?: ResourceType | null;
};
type DealerPhraseType = 'win' | 'lose' | 'blackjack' | 'push';

export class BlackjackGame {
    scene: unknown;
    spaceship: BlackjackSpaceship;
    audio: BlackjackAudio | null;
    isMobile: boolean;
    view: BlackjackGameView;
    deck: BlackjackCardDeck;
    gameLogic: BlackjackGameLogic;
    animations: BlackjackAnimations;
    betting: BlackjackBetting;
    eventHandlers: BlackjackEventHandlers;
    gameUI: HTMLDivElement | null;

    constructor(scene: unknown, spaceship: BlackjackSpaceship, audio: BlackjackAudio | null) {
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
        this.animations = new BlackjackAnimations(this.audio as unknown as null);
        this.betting = new BlackjackBetting(this.spaceship as unknown as null);
        this.eventHandlers = new BlackjackEventHandlers(this, this.isMobile);
        
        // UI elements
        this.gameUI = null;
    }
    
    /**
     * Set game resources reference for betting system
     */
    setGameResourcesRef(gameRef: any): void {
        this.betting.setGameResourcesRef(gameRef);
    }
    
    /**
     * Initialize the game UI
     */
    init(): void {
        if (!this.gameUI) {
            this.createGameUI();
        }
    }
    
    /**
     * Create the game UI elements
     */
    createGameUI(): void {
        this.gameUI = this.view.createGameUI();
        this.eventHandlers.initialize();
        this.updateControls();
    }
    
    /**
     * Show the game UI and sync with current game resources
     */
    show(): void {
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
                const audio = this.audio;
                setTimeout(() => {
                    console.log("Mobile: Attempting to play initial sound in BlackjackGame");
                    audio.playSound?.('boink');
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
    hide(): void {
        if (this.gameUI) {
            this.view.hide(this.gameUI);
            this.animations.playCardSound('boink');
            
            // Show the stargate interface when exiting blackjack
            const stargateUI = document.getElementById('stargate-ui') as HTMLDivElement | null;
            if (stargateUI) {
                stargateUI.style.display = 'block';
            }
        }
    }
    
    /**
     * Reset the game state
     */
    reset(): void {
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
        const speechBubble = document.getElementById('dealer-speech') as HTMLDivElement | null;
        if (speechBubble) {
            speechBubble.style.display = 'none';
        }
        
        // Reset resource selection
        document.querySelectorAll<HTMLElement>('.resource-btn').forEach(btn => {
            this.animations.removeResourceSelection(btn);
        });
        
        this.updateControls();
    }
    
    /**
     * Select a resource for betting
     */
    selectBetResource(resource: ResourceType): void {
        this.betting.selectBetResource(resource);
        const currentBet = this.betting.getCurrentBet() as BlackjackBet;
        this.view.updateBetAmount(currentBet.amount);
        this.updateControls();
    }
    
    /**
     * Update the game controls based on the current state
     */
    updateControls(): void {
        this.eventHandlers.updateButtonStates();
    }
    
    /**
     * Start a new game
     */
    startGame(): void {
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
        const naturalResult = this.gameLogic.checkForNaturalBlackjack() as BlackjackGameResult | null;
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
    dealCardToPlayer(): void {
        const card = this.deck.deal();
        this.gameLogic.addCardToPlayer(card);
        
        const cardEl = this.view.addCard(card, false, true);
        if (cardEl) {
            this.animations.animateCardDeal(cardEl);
        }
        
        const score = this.gameLogic.getPlayerScore();
        this.view.updateScore(score, true);
        
        if (this.gameLogic.isBust(this.gameLogic.getPlayerHand())) {
            this.handleGameEnd('bust');
        }
    }
    
    /**
     * Deal a card to the dealer
     */
    dealCardToDealer(faceDown = false): void {
        const card = this.deck.deal();
        this.gameLogic.addCardToDealer(card);
        
        const cardEl = this.view.addCard(card, faceDown, false);
        if (cardEl) {
            this.animations.animateCardDeal(cardEl);
        }
        
        if (!faceDown) {
            const visibleScore = this.gameLogic.calculateVisibleDealerScore();
            this.view.updateScore(visibleScore, false);
        }
    }
    
    /**
     * Player action: Hit (take another card)
     */
    hit(): void {
        if (this.gameLogic.isGameActive()) {
            this.dealCardToPlayer();
            this.animations.playCardSound('hit');
            this.updateControls();
        }
    }
    
    /**
     * Player action: Stand (end turn)
     */
    stand(): void {
        if (this.gameLogic.isGameActive()) {
            this.animations.playCardSound('stand');
            this.dealerPlay();
        }
    }
    
    /**
     * Player action: Double Down
     */
    doubleDown(): void {
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
    dealerPlay(): void {
        // Reveal dealer's face-down card
        const lastCard = this.gameLogic.getLastDealerCard();
        if (lastCard) {
            const faceDownCard = document.getElementById('face-down-card') as HTMLDivElement | null;
            if (faceDownCard) {
                this.animations.animateCardFlip(faceDownCard, () => {
                    this.view.revealDealerCard(lastCard);
                    this.view.updateScore(this.gameLogic.getDealerScore(), false);
                });
            } else {
                this.view.revealDealerCard(lastCard);
                this.view.updateScore(this.gameLogic.getDealerScore(), false);
            }
        }
        
        // Dealer hits until score is 17 or higher
        const dealerPlayNextCard = (): void => {
            if (this.gameLogic.shouldDealerHit()) {
                this.dealCardToDealer();
                this.animations.playCardSound('hit');
                
                setTimeout(() => {
                    dealerPlayNextCard();
                }, 800);
            } else {
                const result = this.gameLogic.determineWinner() as BlackjackGameResult;
                this.handleGameEnd(result);
            }
        };
        
        setTimeout(dealerPlayNextCard, 800);
    }
    
    /**
     * Handle game end with result
     */
    handleGameEnd(result: BlackjackGameResult): void {
        this.gameLogic.endGame(result);
        
        let statusMessage = '';
        let speechType: DealerPhraseType = result === 'bust' ? 'lose' : result;
        
        switch (result) {
            case 'win':
                this.betting.handleWin();
                statusMessage = 'YOU WIN!';
                if (this.gameUI) {
                    this.animations.animateWinCelebration(this.gameUI);
                }
                this.animations.playCardSound('win');
                break;
                
            case 'blackjack':
                this.betting.handleBlackjack();
                statusMessage = 'BLACKJACK! TRIPLE PAYOUT!';
                if (this.gameUI) {
                    this.animations.animateBlackjackCelebration(this.gameUI);
                }
                this.animations.playCardSound('blackjack');
                break;
                
            case 'lose':
            case 'bust':
                statusMessage = result === 'bust' ? 'BUST! YOU LOSE' : 'DEALER WINS';
                if (this.gameUI) {
                    this.animations.animateLoseEffect(this.gameUI);
                }
                this.animations.playCardSound(result);
                speechType = 'lose';
                break;
                
            case 'push':
                this.betting.handlePush();
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
    destroy(): void {
        if (this.eventHandlers) {
            this.eventHandlers.destroy();
        }
        
        if (this.gameUI && this.gameUI.parentNode) {
            this.gameUI.parentNode.removeChild(this.gameUI);
        }
        
        this.gameUI = null;
    }
}
