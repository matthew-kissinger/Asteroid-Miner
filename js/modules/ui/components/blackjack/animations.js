/**
 * Blackjack Animations - Card animations, chip movements, visual effects
 */

export class BlackjackAnimations {
    constructor(audio = null) {
        this.audio = audio;
    }

    /**
     * Animate card being dealt
     * @param {HTMLElement} cardElement - The card element to animate
     * @param {number} delay - Animation delay in ms
     */
    animateCardDeal(cardElement, delay = 50) {
        if (!cardElement) return;
        
        // Initial state
        cardElement.style.transform = 'translateY(0px) scale(0.8)';
        cardElement.style.opacity = '0';
        
        // Animate to final position
        setTimeout(() => {
            cardElement.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
            cardElement.style.transform = 'translateY(-5px) scale(1)';
            cardElement.style.opacity = '1';
        }, delay);
    }

    /**
     * Animate card flip (for revealing dealer's face-down card)
     * @param {HTMLElement} cardElement - The card element to animate
     * @param {Function} callback - Callback to execute at flip midpoint
     */
    animateCardFlip(cardElement, callback = null) {
        if (!cardElement) return;
        
        // First half of flip
        cardElement.style.transition = 'transform 0.2s ease';
        cardElement.style.transform = 'rotateY(90deg) translateY(-5px)';
        
        // At midpoint, execute callback and complete flip
        setTimeout(() => {
            if (callback) callback();
            cardElement.style.transform = 'rotateY(0deg) translateY(-5px)';
        }, 200);
    }

    /**
     * Animate button press
     * @param {HTMLElement} buttonElement - The button element to animate
     */
    animateButtonPress(buttonElement) {
        if (!buttonElement) return;
        
        // Scale down slightly
        buttonElement.style.transition = 'transform 0.1s ease';
        buttonElement.style.transform = 'scale(0.95)';
        
        // Return to normal size
        setTimeout(() => {
            buttonElement.style.transform = 'scale(1)';
        }, 100);
    }

    /**
     * Animate resource button selection
     * @param {HTMLElement} buttonElement - The button element to animate
     */
    animateResourceSelection(buttonElement) {
        if (!buttonElement) return;
        
        // Pulse effect
        buttonElement.style.transition = 'transform 0.2s ease, border-width 0.2s ease';
        buttonElement.style.transform = 'scale(1.05)';
        buttonElement.style.borderWidth = '2px';
    }

    /**
     * Remove resource button selection animation
     * @param {HTMLElement} buttonElement - The button element to reset
     */
    removeResourceSelection(buttonElement) {
        if (!buttonElement) return;
        
        buttonElement.style.transform = 'scale(1)';
        buttonElement.style.borderWidth = '1px';
    }

    /**
     * Animate bet amount change
     * @param {HTMLElement} betElement - The bet display element
     * @param {string} newAmount - The new amount to display
     */
    animateBetChange(betElement, newAmount) {
        if (!betElement) return;
        
        // Scale up briefly
        betElement.style.transition = 'transform 0.15s ease';
        betElement.style.transform = 'scale(1.1)';
        
        // Update text and scale back
        setTimeout(() => {
            betElement.textContent = newAmount;
            betElement.style.transform = 'scale(1)';
        }, 75);
    }

    /**
     * Animate score update
     * @param {HTMLElement} scoreElement - The score display element
     * @param {string} newScore - The new score to display
     * @param {boolean} isBust - Whether this score is a bust
     */
    animateScoreUpdate(scoreElement, newScore, isBust = false) {
        if (!scoreElement) return;
        
        // Color flash effect
        const originalColor = scoreElement.style.color;
        const flashColor = isBust ? '#ff6b6b' : '#30cfd0';
        
        scoreElement.style.transition = 'color 0.2s ease, transform 0.2s ease';
        scoreElement.style.color = flashColor;
        scoreElement.style.transform = 'scale(1.1)';
        scoreElement.textContent = newScore;
        
        // Return to normal
        setTimeout(() => {
            scoreElement.style.color = originalColor;
            scoreElement.style.transform = 'scale(1)';
        }, 200);
    }

    /**
     * Animate game status message
     * @param {HTMLElement} statusElement - The status display element
     * @param {string} message - The new status message
     * @param {string} type - Type of message (win, lose, push, etc.)
     */
    animateStatusUpdate(statusElement, message, type = 'normal') {
        if (!statusElement) return;
        
        // Determine colors based on type
        let bgColor = 'rgba(51, 170, 255, 0.2)';
        let borderColor = 'rgba(51, 170, 255, 0.4)';
        
        switch (type) {
            case 'win':
            case 'blackjack':
                bgColor = 'rgba(48, 207, 208, 0.3)';
                borderColor = 'rgba(48, 207, 208, 0.6)';
                break;
            case 'lose':
            case 'bust':
                bgColor = 'rgba(255, 107, 107, 0.3)';
                borderColor = 'rgba(255, 107, 107, 0.6)';
                break;
            case 'push':
                bgColor = 'rgba(255, 193, 7, 0.3)';
                borderColor = 'rgba(255, 193, 7, 0.6)';
                break;
        }
        
        // Animate background change
        statusElement.style.transition = 'background-color 0.3s ease, border-color 0.3s ease, transform 0.3s ease';
        statusElement.style.backgroundColor = bgColor;
        statusElement.style.borderColor = borderColor;
        statusElement.style.transform = 'scale(1.05)';
        statusElement.textContent = message;
        
        // Return to normal size
        setTimeout(() => {
            statusElement.style.transform = 'scale(1)';
        }, 300);
    }

    /**
     * Animate speech bubble appearance
     * @param {HTMLElement} speechElement - The speech bubble element
     * @param {string} message - The message to display
     */
    animateSpeechBubble(speechElement, message) {
        if (!speechElement) return;
        
        speechElement.textContent = message;
        speechElement.style.opacity = '0';
        speechElement.style.transform = 'translateY(10px) scale(0.9)';
        speechElement.style.display = 'block';
        
        // Animate in
        setTimeout(() => {
            speechElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            speechElement.style.opacity = '1';
            speechElement.style.transform = 'translateY(0px) scale(1)';
        }, 50);
    }

    /**
     * Animate speech bubble disappearance
     * @param {HTMLElement} speechElement - The speech bubble element
     */
    hideSpeechBubble(speechElement) {
        if (!speechElement) return;
        
        speechElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        speechElement.style.opacity = '0';
        speechElement.style.transform = 'translateY(-10px) scale(0.9)';
        
        setTimeout(() => {
            speechElement.style.display = 'none';
        }, 300);
    }

    /**
     * Animate win celebration
     * @param {HTMLElement} gameUI - The main game UI element
     */
    animateWinCelebration(gameUI) {
        if (!gameUI) return;
        
        // Add a glow effect
        gameUI.style.transition = 'box-shadow 0.5s ease';
        gameUI.style.boxShadow = '0 0 50px rgba(48, 207, 208, 0.8)';
        
        // Remove glow after celebration
        setTimeout(() => {
            gameUI.style.boxShadow = '0 0 30px rgba(51, 170, 255, 0.5)';
        }, 2000);
    }

    /**
     * Animate lose effect
     * @param {HTMLElement} gameUI - The main game UI element
     */
    animateLoseEffect(gameUI) {
        if (!gameUI) return;
        
        // Add a red glow effect
        gameUI.style.transition = 'box-shadow 0.5s ease';
        gameUI.style.boxShadow = '0 0 50px rgba(255, 107, 107, 0.6)';
        
        // Remove glow after effect
        setTimeout(() => {
            gameUI.style.boxShadow = '0 0 30px rgba(51, 170, 255, 0.5)';
        }, 2000);
    }

    /**
     * Animate blackjack celebration
     * @param {HTMLElement} gameUI - The main game UI element
     */
    animateBlackjackCelebration(gameUI) {
        if (!gameUI) return;
        
        // Intense glow and slight scale
        gameUI.style.transition = 'box-shadow 0.5s ease, transform 0.5s ease';
        gameUI.style.boxShadow = '0 0 80px rgba(48, 207, 208, 1)';
        gameUI.style.transform = 'translate(-50%, -50%) scale(1.02)';
        
        // Return to normal
        setTimeout(() => {
            gameUI.style.boxShadow = '0 0 30px rgba(51, 170, 255, 0.5)';
            gameUI.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 3000);
    }

    /**
     * Animate card hover effect
     * @param {HTMLElement} cardElement - The card element
     * @param {boolean} isHovering - Whether mouse is hovering
     */
    animateCardHover(cardElement, isHovering) {
        if (!cardElement) return;
        
        if (isHovering) {
            cardElement.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
            cardElement.style.transform = 'translateY(-10px) scale(1.05)';
            cardElement.style.boxShadow = '0 0 20px rgba(51, 170, 255, 0.8)';
        } else {
            cardElement.style.transform = 'translateY(-5px) scale(1)';
            cardElement.style.boxShadow = '0 0 10px rgba(51, 170, 255, 0.5)';
        }
    }

    /**
     * Play card game sound with audio context
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

    /**
     * Chain multiple animations with delays
     * @param {Array} animations - Array of animation functions
     * @param {number} delay - Delay between animations
     */
    chainAnimations(animations, delay = 300) {
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
    resetAnimations(element) {
        if (!element) return;
        
        element.style.transition = '';
        element.style.transform = '';
        element.style.opacity = '';
        element.style.boxShadow = '';
    }
}