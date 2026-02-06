/**
 * Blackjack Animations - Card animations, chip movements, visual effects
 */

type BlackjackAudio = {
    playSound?: (sound: string) => void;
};

export type BlackjackSoundType =
    | 'deal'
    | 'hit'
    | 'stand'
    | 'double'
    | 'flip'
    | 'win'
    | 'blackjack'
    | 'lose'
    | 'bust'
    | 'push'
    | 'boink';

export class BlackjackAnimations {
    audio: BlackjackAudio | null;

    constructor(audio: BlackjackAudio | null = null) {
        this.audio = audio;
    }

    /**
     * Animate card being dealt
     * @param {HTMLElement} cardElement - The card element to animate
     * @param {number} delay - Animation delay in ms
     */
    animateCardDeal(cardElement: HTMLElement | null, delay: number = 50): void {
        if (!cardElement) return;
        
        // Initial state
        cardElement.classList.add('bj-card', 'bj-card-deal-initial');
        
        // Animate to final position
        setTimeout(() => {
            cardElement.classList.remove('bj-card-deal-initial');
            cardElement.classList.add('bj-card-deal-final');
        }, delay);
    }

    /**
     * Animate card flip (for revealing dealer's face-down card)
     * @param {HTMLElement} cardElement - The card element to animate
     * @param {Function} callback - Callback to execute at flip midpoint
     */
    animateCardFlip(cardElement: HTMLElement | null, callback: (() => void) | null = null): void {
        if (!cardElement) return;
        
        // First half of flip
        cardElement.classList.add('bj-card-flip', 'bj-card-flip-midpoint');
        
        // At midpoint, execute callback and complete flip
        setTimeout(() => {
            if (callback) callback();
            cardElement.classList.remove('bj-card-flip-midpoint');
            cardElement.classList.add('bj-card-flip-complete');
        }, 200);
    }

    /**
     * Animate button press
     * @param {HTMLElement} buttonElement - The button element to animate
     */
    animateButtonPress(buttonElement: HTMLElement | null): void {
        if (!buttonElement) return;
        
        // Scale down slightly
        buttonElement.classList.add('bj-button-press');
        
        // Return to normal size
        setTimeout(() => {
            buttonElement.classList.remove('bj-button-press');
            buttonElement.classList.add('bj-button-normal');
        }, 100);
    }

    /**
     * Animate resource button selection
     * @param {HTMLElement} buttonElement - The button element to animate
     */
    animateResourceSelection(buttonElement: HTMLElement | null): void {
        if (!buttonElement) return;
        
        // Pulse effect
        buttonElement.classList.remove('bj-resource-normal');
        buttonElement.classList.add('bj-resource-selected');
    }

    /**
     * Remove resource button selection animation
     * @param {HTMLElement} buttonElement - The button element to reset
     */
    removeResourceSelection(buttonElement: HTMLElement | null): void {
        if (!buttonElement) return;
        
        buttonElement.classList.remove('bj-resource-selected');
        buttonElement.classList.add('bj-resource-normal');
    }

    /**
     * Animate bet amount change
     * @param {HTMLElement} betElement - The bet display element
     * @param {string} newAmount - The new amount to display
     */
    animateBetChange(betElement: HTMLElement | null, newAmount: string | number): void {
        if (!betElement) return;
        
        // Scale up briefly
        betElement.classList.add('bj-bet-change');
        
        // Update text and scale back
        setTimeout(() => {
            betElement.textContent = String(newAmount);
            betElement.classList.remove('bj-bet-change');
            betElement.classList.add('bj-bet-normal');
        }, 75);
    }

    /**
     * Animate score update
     * @param {HTMLElement} scoreElement - The score display element
     * @param {string} newScore - The new score to display
     * @param {boolean} isBust - Whether this score is a bust
     */
    animateScoreUpdate(scoreElement: HTMLElement | null, newScore: string, isBust: boolean = false): void {
        if (!scoreElement) return;
        
        // Color flash effect
        scoreElement.classList.add('bj-score-update');
        if (isBust) {
            scoreElement.classList.add('bj-score-bust');
        } else {
            scoreElement.classList.add('bj-score-flash');
        }
        scoreElement.textContent = newScore;
        
        // Return to normal
        setTimeout(() => {
            scoreElement.classList.remove('bj-score-update', 'bj-score-bust', 'bj-score-flash');
            scoreElement.classList.add('bj-score-normal');
        }, 200);
    }

    /**
     * Animate game status message
     * @param {HTMLElement} statusElement - The status display element
     * @param {string} message - The new status message
     * @param {string} type - Type of message (win, lose, push, etc.)
     */
    animateStatusUpdate(
        statusElement: HTMLElement | null,
        message: string,
        type: 'win' | 'blackjack' | 'lose' | 'bust' | 'push' | 'normal' = 'normal'
    ): void {
        if (!statusElement) return;
        
        // Remove all status classes
        statusElement.classList.remove(
            'bj-status-normal', 'bj-status-win', 'bj-status-blackjack',
            'bj-status-lose', 'bj-status-bust', 'bj-status-push'
        );
        
        // Add appropriate status class based on type
        switch (type) {
            case 'win':
                statusElement.classList.add('bj-status-win');
                break;
            case 'blackjack':
                statusElement.classList.add('bj-status-blackjack');
                break;
            case 'lose':
                statusElement.classList.add('bj-status-lose');
                break;
            case 'bust':
                statusElement.classList.add('bj-status-bust');
                break;
            case 'push':
                statusElement.classList.add('bj-status-push');
                break;
            default:
                statusElement.classList.add('bj-status-normal');
        }
        
        statusElement.classList.add('bj-status-scaled');
        statusElement.textContent = message;
        
        // Return to normal size
        setTimeout(() => {
            statusElement.classList.remove('bj-status-scaled');
            statusElement.classList.add('bj-status-normal-scale');
        }, 300);
    }

    /**
     * Animate speech bubble appearance
     * @param {HTMLElement} speechElement - The speech bubble element
     * @param {string} message - The message to display
     */
    animateSpeechBubble(speechElement: HTMLElement | null, message: string): void {
        if (!speechElement) return;
        
        speechElement.textContent = message;
        speechElement.classList.add('bj-speech-bubble');
        speechElement.style.display = 'block';
        
        // Animate in
        setTimeout(() => {
            speechElement.classList.remove('bj-speech-bubble');
            speechElement.classList.add('bj-speech-bubble-visible');
        }, 50);
    }

    /**
     * Animate speech bubble disappearance
     * @param {HTMLElement} speechElement - The speech bubble element
     */
    hideSpeechBubble(speechElement: HTMLElement | null): void {
        if (!speechElement) return;
        
        speechElement.classList.remove('bj-speech-bubble-visible');
        speechElement.classList.add('bj-speech-bubble-hidden');
        
        setTimeout(() => {
            speechElement.style.display = 'none';
            speechElement.classList.remove('bj-speech-bubble-hidden');
        }, 300);
    }

    /**
     * Animate win celebration
     * @param {HTMLElement} gameUI - The main game UI element
     */
    animateWinCelebration(gameUI: HTMLElement | null): void {
        if (!gameUI) return;
        
        // Add a glow effect
        gameUI.classList.remove('bj-game-ui-normal');
        gameUI.classList.add('bj-game-ui-win');
        
        // Remove glow after celebration
        setTimeout(() => {
            gameUI.classList.remove('bj-game-ui-win');
            gameUI.classList.add('bj-game-ui-normal');
        }, 2000);
    }

    /**
     * Animate lose effect
     * @param {HTMLElement} gameUI - The main game UI element
     */
    animateLoseEffect(gameUI: HTMLElement | null): void {
        if (!gameUI) return;
        
        // Add a red glow effect
        gameUI.classList.remove('bj-game-ui-normal');
        gameUI.classList.add('bj-game-ui-lose');
        
        // Remove glow after effect
        setTimeout(() => {
            gameUI.classList.remove('bj-game-ui-lose');
            gameUI.classList.add('bj-game-ui-normal');
        }, 2000);
    }

    /**
     * Animate blackjack celebration
     * @param {HTMLElement} gameUI - The main game UI element
     */
    animateBlackjackCelebration(gameUI: HTMLElement | null): void {
        if (!gameUI) return;
        
        // Intense glow and slight scale
        gameUI.classList.remove('bj-game-ui-normal');
        gameUI.classList.add('bj-game-ui-blackjack');
        
        // Return to normal
        setTimeout(() => {
            gameUI.classList.remove('bj-game-ui-blackjack');
            gameUI.classList.add('bj-game-ui-blackjack-normal');
        }, 3000);
    }

    /**
     * Animate card hover effect
     * @param {HTMLElement} cardElement - The card element
     * @param {boolean} isHovering - Whether mouse is hovering
     */
    animateCardHover(cardElement: HTMLElement | null, isHovering: boolean): void {
        if (!cardElement) return;
        
        if (isHovering) {
            cardElement.classList.remove('bj-card-normal');
            cardElement.classList.add('bj-card-hover');
        } else {
            cardElement.classList.remove('bj-card-hover');
            cardElement.classList.add('bj-card-normal');
        }
    }

    /**
     * Play card game sound with audio context
     * @param {string} type - The type of sound to play
     */
    playCardSound(type: BlackjackSoundType): void {
        const audio = this.audio;
        if (!audio) return;
        
        switch (type) {
            case 'deal':
                audio.playSound?.('boink');
                break;
            case 'hit':
                audio.playSound?.('boink');
                break;
            case 'stand':
                audio.playSound?.('boink');
                break;
            case 'double':
                // Play two sounds in quick succession
                audio.playSound?.('boink');
                setTimeout(() => audio.playSound?.('boink'), 150);
                break;
            case 'flip':
                audio.playSound?.('boink');
                break;
            case 'win':
                audio.playSound?.('phaserUp');
                break;
            case 'blackjack':
                // Play multiple sounds for celebration
                audio.playSound?.('phaserUp');
                setTimeout(() => audio.playSound?.('phaserUp'), 300);
                break;
            case 'lose':
                audio.playSound?.('phaserDown');
                break;
            case 'bust':
                audio.playSound?.('phaserDown');
                break;
            case 'push':
                audio.playSound?.('boink');
                break;
        }
    }

    /**
     * Chain multiple animations with delays
     * @param {Array} animations - Array of animation functions
     * @param {number} delay - Delay between animations
     */
    chainAnimations(animations: Array<() => void>, delay: number = 300): void {
        animations.forEach((animation, index) => {
            setTimeout(() => {
                if (typeof animation === 'function') {
                    animation();
                }
            }, index * delay);
        });
    }

    /**
     * Reset all animations on an element
     * @param {HTMLElement} element - The element to reset
     */
    resetAnimations(element: HTMLElement | null): void {
        if (!element) return;
        
        // Remove all bj-* classes
        const classesToRemove = Array.from(element.classList).filter(cls => cls.startsWith('bj-'));
        element.classList.remove(...classesToRemove);
        
        // Clear inline styles that might have been set dynamically
        element.style.transition = '';
        element.style.transform = '';
        element.style.opacity = '';
        element.style.boxShadow = '';
    }
}
