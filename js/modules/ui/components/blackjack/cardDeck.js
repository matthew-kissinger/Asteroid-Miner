/**
 * Blackjack Card Deck - Card deck management, shuffling, dealing logic
 */

export class BlackjackCardDeck {
    constructor() {
        this.deck = [];
        this.createDeck();
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
        
        this.shuffle();
    }

    /**
     * Shuffle the deck using Fisher-Yates algorithm
     */
    shuffle() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
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
     * Check if deck is empty
     * @returns {boolean} True if deck is empty
     */
    isEmpty() {
        return this.deck.length === 0;
    }

    /**
     * Get remaining cards count
     * @returns {number} Number of cards left in deck
     */
    getRemainingCards() {
        return this.deck.length;
    }

    /**
     * Reset deck (create new and shuffle)
     */
    reset() {
        this.createDeck();
    }
}