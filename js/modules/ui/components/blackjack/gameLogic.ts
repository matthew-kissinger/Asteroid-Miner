/**
 * Blackjack Game Logic - Blackjack rules, hand evaluation, win conditions
 */

import type { BlackjackCard } from './cardDeck.js';

type GameResult = 'win' | 'blackjack' | 'lose' | 'bust' | 'push';
type DealerPhraseType = 'win' | 'lose' | 'blackjack' | 'push';

export class BlackjackGameLogic {
    gameActive: boolean;
    playerHand: BlackjackCard[];
    dealerHand: BlackjackCard[];
    gameResult: GameResult | null;
    dealerPhrases: Record<DealerPhraseType, string[]>;

    constructor() {
        // Game state
        this.gameActive = false;
        this.playerHand = [];
        this.dealerHand = [];
        this.gameResult = null;
        
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
    }

    /**
     * Calculate the score of a hand, adjusting for aces
     * @param {Array} hand - Array of card objects
     * @returns {number} The total score of the hand
     */
    calculateScore(hand: BlackjackCard[]): number {
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
     * Calculate the dealer's visible score (excluding face-down card)
     * @returns {number} The visible score
     */
    calculateVisibleDealerScore(): number {
        if (this.dealerHand.length <= 1) {
            return this.dealerHand.length ? this.getCardValue(this.dealerHand[0]) : 0;
        }
        
        // Calculate score excluding the last card (which is face down)
        return this.calculateScore(this.dealerHand.slice(0, -1));
    }

    /**
     * Get the value of a card
     * @param {Object} card - The card object
     * @returns {number} The value of the card in Blackjack
     */
    getCardValue(card: BlackjackCard): number {
        if (card.value === 'A') {
            return 11;
        } else if (['J', 'Q', 'K'].includes(card.value)) {
            return 10;
        } else {
            return parseInt(card.value);
        }
    }

    /**
     * Check if a hand is a blackjack (21 with 2 cards)
     * @param {Array} hand - Array of card objects
     * @returns {boolean} True if hand is blackjack
     */
    isBlackjack(hand: BlackjackCard[]): boolean {
        return hand.length === 2 && this.calculateScore(hand) === 21;
    }

    /**
     * Check if a hand is bust (over 21)
     * @param {Array} hand - Array of card objects
     * @returns {boolean} True if hand is bust
     */
    isBust(hand: BlackjackCard[]): boolean {
        return this.calculateScore(hand) > 21;
    }

    /**
     * Check for natural blackjack
     * @returns {string|null} Game result or null if game continues
     */
    checkForNaturalBlackjack(): GameResult | null {
        const playerScore = this.calculateScore(this.playerHand);
        const dealerScore = this.calculateScore(this.dealerHand);
        
        if (playerScore === 21 || dealerScore === 21) {
            if (playerScore === 21 && dealerScore === 21) {
                // Both have blackjack - push
                return 'push';
            } else if (playerScore === 21) {
                // Player has blackjack - win with 3:2 payout
                return 'blackjack';
            } else {
                // Dealer has blackjack - player loses
                return 'lose';
            }
        }
        
        return null;
    }

    /**
     * Determine if dealer should hit (dealer hits on soft 17)
     * @returns {boolean} True if dealer should hit
     */
    shouldDealerHit(): boolean {
        const dealerScore = this.calculateScore(this.dealerHand);
        return dealerScore < 17;
    }

    /**
     * Determine the outcome of the game
     * @returns {string} Game result
     */
    determineOutcome(): GameResult {
        const playerScore = this.calculateScore(this.playerHand);
        const dealerScore = this.calculateScore(this.dealerHand);
        
        if (dealerScore > 21) {
            // Dealer busts - player wins
            return 'win';
        } else if (playerScore > dealerScore) {
            // Player score higher - player wins
            return 'win';
        } else if (dealerScore > playerScore) {
            // Dealer score higher - player loses
            return 'lose';
        } else {
            // Scores are equal - push
            return 'push';
        }
    }

    /**
     * Check if player can double down
     * @param {number} currentBetAmount - Current bet amount
     * @param {number} maxBetAmount - Maximum possible bet amount
     * @returns {boolean} True if can double down
     */
    canDoubleDown(currentBetAmount: number, maxBetAmount: number): boolean {
        return this.playerHand.length === 2 && currentBetAmount * 2 <= maxBetAmount;
    }

    /**
     * Get a random dealer phrase
     * @param {string} type - Type of phrase (win, lose, blackjack, push)
     * @returns {string} Random phrase
     */
    getDealerPhrase(type: DealerPhraseType): string {
        const phrases = this.dealerPhrases[type];
        if (phrases && phrases.length > 0) {
            return phrases[Math.floor(Math.random() * phrases.length)];
        }
        return '';
    }

    /**
     * Reset game state
     */
    reset(): void {
        this.gameActive = false;
        this.playerHand = [];
        this.dealerHand = [];
        this.gameResult = null;
    }

    /**
     * Start a new game
     */
    startGame(): void {
        this.gameActive = true;
        this.playerHand = [];
        this.dealerHand = [];
        this.gameResult = null;
    }

    /**
     * Add card to player hand
     * @param {Object} card - Card object
     */
    addCardToPlayer(card: BlackjackCard): void {
        this.playerHand.push(card);
    }

    /**
     * Add card to dealer hand
     * @param {Object} card - Card object
     */
    addCardToDealer(card: BlackjackCard): void {
        this.dealerHand.push(card);
    }

    /**
     * End the game
     * @param {string} result - Game result
     */
    endGame(result: GameResult): void {
        this.gameActive = false;
        this.gameResult = result;
    }

    /**
     * Get player score
     * @returns {number} Player's current score
     */
    getPlayerScore(): number {
        return this.calculateScore(this.playerHand);
    }

    /**
     * Get dealer score
     * @returns {number} Dealer's current score
     */
    getDealerScore(): number {
        return this.calculateScore(this.dealerHand);
    }

    /**
     * Get player hand
     * @returns {Array} Player's hand
     */
    getPlayerHand(): BlackjackCard[] {
        return [...this.playerHand];
    }

    /**
     * Get dealer hand
     * @returns {Array} Dealer's hand
     */
    getDealerHand(): BlackjackCard[] {
        return [...this.dealerHand];
    }

    /**
     * Get last card in dealer hand (usually the face-down card)
     * @returns {Object|null} Last dealer card
     */
    getLastDealerCard(): BlackjackCard | null {
        return this.dealerHand.length > 0 ? this.dealerHand[this.dealerHand.length - 1] : null;
    }

    /**
     * Check if game is active
     * @returns {boolean} True if game is active
     */
    isGameActive(): boolean {
        return this.gameActive;
    }

    /**
     * Get game result
     * @returns {string|null} Game result
     */
    getGameResult(): GameResult | null {
        return this.gameResult;
    }
}
