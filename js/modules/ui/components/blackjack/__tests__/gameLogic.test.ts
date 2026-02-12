import { describe, it, expect, beforeEach } from 'vitest';
import { BlackjackGameLogic } from '../gameLogic';
import { BlackjackCardDeck } from '../cardDeck';
import type { BlackjackCard } from '../cardDeck';

describe('BlackjackCardDeck', () => {
    let deck: BlackjackCardDeck;

    beforeEach(() => {
        deck = new BlackjackCardDeck();
    });

    it('createDeck produces 52 cards with correct suits/values', () => {
        expect(deck.getRemainingCards()).toBe(52);
        
        const cards = (deck as any).deck as BlackjackCard[];
        const suits = new Set(cards.map(c => c.suit));
        const values = new Set(cards.map(c => c.value));
        
        expect(suits.size).toBe(4);
        expect(values.size).toBe(13);
        
        // Check for specific distribution
        const heartCards = cards.filter(c => c.suit === 'hearts');
        expect(heartCards.length).toBe(13);
        
        const aceCards = cards.filter(c => c.value === 'A');
        expect(aceCards.length).toBe(4);
    });

    it('shuffle changes card order', () => {
        const deck1 = new BlackjackCardDeck();
        const cards1 = [...(deck1 as any).deck] as BlackjackCard[];
        
        const deck2 = new BlackjackCardDeck();
        const cards2 = [...(deck2 as any).deck] as BlackjackCard[];
        
        let identical = true;
        for (let i = 0; i < cards1.length; i++) {
            if (cards1[i].suit !== cards2[i].suit || cards1[i].value !== cards2[i].value) {
                identical = false;
                break;
            }
        }
        
        expect(identical).toBe(false);
    });

    it('deal removes and returns top card', () => {
        const initialCount = deck.getRemainingCards();
        const topCard = (deck as any).deck[(deck as any).deck.length - 1];
        
        const drawnCard = deck.deal();
        
        expect(drawnCard).toEqual(topCard);
        expect(deck.getRemainingCards()).toBe(initialCount - 1);
    });

    it('deal from empty deck handles edge case by refilling', () => {
        // Draw all cards
        for (let i = 0; i < 52; i++) {
            deck.deal();
        }
        
        expect(deck.isEmpty()).toBe(true);
        expect(deck.getRemainingCards()).toBe(0);
        
        // Drawing from empty deck should refill it
        const card = deck.deal();
        expect(card).toBeDefined();
        expect(deck.getRemainingCards()).toBe(51); // 52 - 1
    });
});

describe('BlackjackGameLogic', () => {
    let gameLogic: BlackjackGameLogic;

    beforeEach(() => {
        gameLogic = new BlackjackGameLogic();
    });

    describe('calculateHandValue', () => {
        it('calculates value for number cards (2-10)', () => {
            const hand: BlackjackCard[] = [
                { suit: 'hearts', value: '2' },
                { suit: 'clubs', value: '7' }
            ];
            expect(gameLogic.calculateHandValue(hand)).toBe(9);
        });

        it('calculates value for face cards (J, Q, K = 10)', () => {
            const hand: BlackjackCard[] = [
                { suit: 'hearts', value: 'J' },
                { suit: 'clubs', value: 'Q' },
                { suit: 'spades', value: 'K' }
            ];
            expect(gameLogic.calculateHandValue(hand)).toBe(30);
        });

        it('calculates Ace as 11 when it does not cause bust', () => {
            const hand: BlackjackCard[] = [
                { suit: 'hearts', value: 'A' },
                { suit: 'clubs', value: '9' }
            ];
            expect(gameLogic.calculateHandValue(hand)).toBe(20);
        });

        it('calculates Ace as 1 when 11 would cause bust', () => {
            const hand: BlackjackCard[] = [
                { suit: 'hearts', value: 'A' },
                { suit: 'clubs', value: '9' },
                { suit: 'spades', value: '5' }
            ];
            expect(gameLogic.calculateHandValue(hand)).toBe(15);
        });

        it('handles multiple Aces correctly', () => {
            const hand: BlackjackCard[] = [
                { suit: 'hearts', value: 'A' },
                { suit: 'clubs', value: 'A' }
            ];
            expect(gameLogic.calculateHandValue(hand)).toBe(12);
        });
    });

    describe('isSoftHand', () => {
        it('returns true for Ace and 6', () => {
            const hand: BlackjackCard[] = [
                { suit: 'hearts', value: 'A' },
                { suit: 'clubs', value: '6' }
            ];
            expect(gameLogic.isSoftHand(hand)).toBe(true);
        });

        it('returns false for Ace, 6, and 10', () => {
            const hand: BlackjackCard[] = [
                { suit: 'hearts', value: 'A' },
                { suit: 'clubs', value: '6' },
                { suit: 'spades', value: '10' }
            ];
            // Score is 17 (Ace is 1), so not soft
            expect(gameLogic.isSoftHand(hand)).toBe(false);
        });

        it('returns false for no Aces', () => {
            const hand: BlackjackCard[] = [
                { suit: 'hearts', value: '10' },
                { suit: 'clubs', value: '7' }
            ];
            expect(gameLogic.isSoftHand(hand)).toBe(false);
        });
    });

    describe('isBust', () => {
        it('returns false for hand at 21', () => {
            const hand: BlackjackCard[] = [
                { suit: 'hearts', value: '10' },
                { suit: 'clubs', value: 'J' },
                { suit: 'spades', value: 'A' }
            ];
            expect(gameLogic.isBust(hand)).toBe(false);
        });

        it('returns true for hand at 22', () => {
            const hand: BlackjackCard[] = [
                { suit: 'hearts', value: '10' },
                { suit: 'clubs', value: 'J' },
                { suit: 'spades', value: '2' }
            ];
            expect(gameLogic.isBust(hand)).toBe(true);
        });
    });

    describe('shouldDealerHit', () => {
        it('returns true when dealer score is 16', () => {
            gameLogic.addCardToDealer({ suit: 'hearts', value: '10' });
            gameLogic.addCardToDealer({ suit: 'clubs', value: '6' });
            expect(gameLogic.shouldDealerHit()).toBe(true);
        });

        it('returns false when dealer score is 18', () => {
            gameLogic.addCardToDealer({ suit: 'hearts', value: '10' });
            gameLogic.addCardToDealer({ suit: 'clubs', value: '8' });
            expect(gameLogic.shouldDealerHit()).toBe(false);
        });

        it('returns true on soft 17', () => {
            gameLogic.addCardToDealer({ suit: 'hearts', value: 'A' });
            gameLogic.addCardToDealer({ suit: 'clubs', value: '6' });
            expect(gameLogic.shouldDealerHit()).toBe(true);
        });

        it('returns false on hard 17', () => {
            gameLogic.addCardToDealer({ suit: 'hearts', value: '10' });
            gameLogic.addCardToDealer({ suit: 'clubs', value: '7' });
            expect(gameLogic.shouldDealerHit()).toBe(false);
        });
    });

    describe('dealerPlay', () => {
        it('dealer draws until standing or busting', () => {
            const deck = new BlackjackCardDeck();
            gameLogic.addCardToDealer({ suit: 'hearts', value: '2' });
            gameLogic.addCardToDealer({ suit: 'clubs', value: '3' }); // Dealer 5
            
            gameLogic.dealerPlay(deck);
            
            const score = gameLogic.getDealerScore();
            if (score <= 21) {
                // Should stand on 17+ (and not soft 17)
                expect(score).toBeGreaterThanOrEqual(17);
                if (score === 17) {
                    expect(gameLogic.isSoftHand(gameLogic.getDealerHand())).toBe(false);
                }
            } else {
                expect(gameLogic.isBust(gameLogic.getDealerHand())).toBe(true);
            }
            
            expect(gameLogic.getGameResult()).not.toBeNull();
        });

        it('dealer stops and wins if player already busted', () => {
             // This scenario is usually handled by the game manager, 
             // but let's see how dealerPlay behaves.
             gameLogic.addCardToPlayer({ suit: 'hearts', value: '10' });
             gameLogic.addCardToPlayer({ suit: 'clubs', value: '10' });
             gameLogic.addCardToPlayer({ suit: 'spades', value: '5' }); // Player 25
             
             gameLogic.addCardToDealer({ suit: 'hearts', value: '10' });
             gameLogic.addCardToDealer({ suit: 'clubs', value: '7' }); // Dealer 17
             
             const deck = new BlackjackCardDeck();
             gameLogic.dealerPlay(deck);
             
             // Dealer shouldn't hit on 17
             expect(gameLogic.getDealerScore()).toBe(17);
             expect(gameLogic.getGameResult()).toBe('lose'); // Player loses because they busted
        });
    });

    describe('determineWinner', () => {
        it('returns win when dealer busts', () => {
            gameLogic.addCardToPlayer({ suit: 'hearts', value: '10' });
            gameLogic.addCardToDealer({ suit: 'hearts', value: '10' });
            gameLogic.addCardToDealer({ suit: 'clubs', value: '10' });
            gameLogic.addCardToDealer({ suit: 'spades', value: '5' }); // Dealer 25
            expect(gameLogic.determineWinner()).toBe('win');
        });

        it('returns win when player score higher than dealer', () => {
            gameLogic.addCardToPlayer({ suit: 'hearts', value: '10' });
            gameLogic.addCardToPlayer({ suit: 'clubs', value: '9' }); // Player 19
            gameLogic.addCardToDealer({ suit: 'hearts', value: '10' });
            gameLogic.addCardToDealer({ suit: 'clubs', value: '8' }); // Dealer 18
            expect(gameLogic.determineWinner()).toBe('win');
        });

        it('returns lose when dealer score higher than player', () => {
            gameLogic.addCardToPlayer({ suit: 'hearts', value: '10' });
            gameLogic.addCardToPlayer({ suit: 'clubs', value: '8' }); // Player 18
            gameLogic.addCardToDealer({ suit: 'hearts', value: '10' });
            gameLogic.addCardToDealer({ suit: 'clubs', value: '9' }); // Dealer 19
            expect(gameLogic.determineWinner()).toBe('lose');
        });

        it('returns push when scores are equal', () => {
            gameLogic.addCardToPlayer({ suit: 'hearts', value: '10' });
            gameLogic.addCardToPlayer({ suit: 'clubs', value: '9' }); // Player 19
            gameLogic.addCardToDealer({ suit: 'hearts', value: '10' });
            gameLogic.addCardToDealer({ suit: 'clubs', value: '9' }); // Dealer 19
            expect(gameLogic.determineWinner()).toBe('push');
        });
    });

    describe('checkForNaturalBlackjack', () => {
        it('returns blackjack when player has 21 and dealer does not', () => {
            gameLogic.addCardToPlayer({ suit: 'hearts', value: 'A' });
            gameLogic.addCardToPlayer({ suit: 'clubs', value: '10' });
            gameLogic.addCardToDealer({ suit: 'hearts', value: '10' });
            gameLogic.addCardToDealer({ suit: 'clubs', value: '7' });
            expect(gameLogic.checkForNaturalBlackjack()).toBe('blackjack');
        });

        it('returns lose when dealer has 21 and player does not', () => {
            gameLogic.addCardToPlayer({ suit: 'hearts', value: '10' });
            gameLogic.addCardToPlayer({ suit: 'clubs', value: '7' });
            gameLogic.addCardToDealer({ suit: 'hearts', value: 'A' });
            gameLogic.addCardToDealer({ suit: 'clubs', value: '10' });
            expect(gameLogic.checkForNaturalBlackjack()).toBe('lose');
        });

        it('returns push when both have 21', () => {
            gameLogic.addCardToPlayer({ suit: 'hearts', value: 'A' });
            gameLogic.addCardToPlayer({ suit: 'clubs', value: '10' });
            gameLogic.addCardToDealer({ suit: 'hearts', value: 'A' });
            gameLogic.addCardToDealer({ suit: 'clubs', value: '10' });
            expect(gameLogic.checkForNaturalBlackjack()).toBe('push');
        });

        it('returns null when neither has 21', () => {
            gameLogic.addCardToPlayer({ suit: 'hearts', value: '10' });
            gameLogic.addCardToPlayer({ suit: 'clubs', value: '7' });
            gameLogic.addCardToDealer({ suit: 'hearts', value: '10' });
            gameLogic.addCardToDealer({ suit: 'clubs', value: '7' });
            expect(gameLogic.checkForNaturalBlackjack()).toBeNull();
        });
    });

    describe('canDoubleDown', () => {
        it('returns true when player has 2 cards and can afford it', () => {
            gameLogic.addCardToPlayer({ suit: 'hearts', value: '10' });
            gameLogic.addCardToPlayer({ suit: 'clubs', value: '7' });
            expect(gameLogic.canDoubleDown(100, 200)).toBe(true);
        });

        it('returns false when player has more than 2 cards', () => {
            gameLogic.addCardToPlayer({ suit: 'hearts', value: '5' });
            gameLogic.addCardToPlayer({ suit: 'clubs', value: '5' });
            gameLogic.addCardToPlayer({ suit: 'spades', value: '5' });
            expect(gameLogic.canDoubleDown(100, 300)).toBe(false);
        });

        it('returns false when player cannot afford it', () => {
            gameLogic.addCardToPlayer({ suit: 'hearts', value: '10' });
            gameLogic.addCardToPlayer({ suit: 'clubs', value: '7' });
            expect(gameLogic.canDoubleDown(100, 150)).toBe(false);
        });
    });
});
