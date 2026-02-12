/**
 * Blackjack Card Deck - Card deck management, shuffling, dealing logic
 */

export type CardSuit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type CardValue = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
export type BlackjackCard = {
    suit: CardSuit;
    value: CardValue;
};

export class BlackjackCardDeck {
    deck: BlackjackCard[];

    constructor() {
        this.deck = [];
        this.createDeck();
    }

    /**
     * Create a fresh deck of cards
     */
    createDeck(): void {
        const suits: CardSuit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
        const values: CardValue[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        
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
    shuffle(): void {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    /**
     * Draw a card from the deck
     * @returns {Object} A card object
     */
    deal(): BlackjackCard {
        if (this.deck.length === 0) {
            this.createDeck();
        }
        const card = this.deck.pop();
        if (!card) {
            this.createDeck();
            return this.deck.pop() as BlackjackCard;
        }
        return card;
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
     * Check if deck is empty
     * @returns {boolean} True if deck is empty
     */
    isEmpty(): boolean {
        return this.deck.length === 0;
    }

    /**
     * Get remaining cards count
     * @returns {number} Number of cards left in deck
     */
    getRemainingCards(): number {
        return this.deck.length;
    }

    /**
     * Reset deck (create new and shuffle)
     */
    reset(): void {
        this.createDeck();
    }
}
