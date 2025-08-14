/**
 * Blackjack Betting - Bet management, chip handling, payout calculations
 */

export class BlackjackBetting {
    constructor(spaceship = null) {
        this.spaceship = spaceship;
        this.currentBet = {
            resource: null,
            amount: 0
        };
    }

    /**
     * Set the spaceship reference for resource management
     * @param {Object} spaceship - Spaceship object with cargo
     */
    setSpaceship(spaceship) {
        this.spaceship = spaceship;
    }

    /**
     * Select a resource for betting
     * @param {string} resource - The resource type (iron, gold, platinum)
     */
    selectBetResource(resource) {
        this.currentBet.resource = resource;
        this.currentBet.amount = 1;
    }

    /**
     * Increase the bet amount
     * @returns {boolean} True if bet was increased, false if at maximum
     */
    increaseBet() {
        const maxAmount = this.getMaxBet();
        if (this.currentBet.amount < maxAmount) {
            this.currentBet.amount++;
            return true;
        }
        return false;
    }

    /**
     * Decrease the bet amount
     * @returns {boolean} True if bet was decreased, false if at minimum
     */
    decreaseBet() {
        if (this.currentBet.amount > 1) {
            this.currentBet.amount--;
            return true;
        }
        return false;
    }

    /**
     * Get the maximum possible bet amount for the selected resource
     * @returns {number} The maximum bet amount
     */
    getMaxBet() {
        if (!this.currentBet.resource || !this.spaceship || !this.spaceship.cargo) {
            return 0;
        }
        
        return this.spaceship.cargo[this.currentBet.resource] || 0;
    }

    /**
     * Get current bet information
     * @returns {Object} Current bet object
     */
    getCurrentBet() {
        return { ...this.currentBet };
    }

    /**
     * Check if a valid bet is selected
     * @returns {boolean} True if valid bet exists
     */
    hasValidBet() {
        return this.currentBet.resource && this.currentBet.amount > 0;
    }

    /**
     * Check if player has enough resources for the current bet
     * @returns {boolean} True if player can afford the bet
     */
    canAffordBet() {
        if (!this.hasValidBet() || !this.spaceship || !this.spaceship.cargo) {
            return false;
        }
        
        const available = this.spaceship.cargo[this.currentBet.resource] || 0;
        return available >= this.currentBet.amount;
    }

    /**
     * Check if player can afford to double down
     * @returns {boolean} True if player can double the current bet
     */
    canAffordDoubleDown() {
        if (!this.hasValidBet() || !this.spaceship || !this.spaceship.cargo) {
            return false;
        }
        
        const available = this.spaceship.cargo[this.currentBet.resource] || 0;
        return available >= this.currentBet.amount;
    }

    /**
     * Place the bet (deduct resources)
     * @returns {boolean} True if bet was successfully placed
     */
    placeBet() {
        if (!this.canAffordBet()) {
            return false;
        }
        
        // Deduct bet from player's resources
        this.spaceship.cargo[this.currentBet.resource] -= this.currentBet.amount;
        
        // Sync with the game's resource system if available
        if (window.game && window.game.controls && window.game.controls.resources) {
            window.game.controls.resources[this.currentBet.resource] = this.spaceship.cargo[this.currentBet.resource];
        }
        
        return true;
    }

    /**
     * Double down (double the current bet)
     * @returns {boolean} True if double down was successful
     */
    doubleDown() {
        if (!this.canAffordDoubleDown()) {
            return false;
        }
        
        // Deduct additional bet amount
        this.spaceship.cargo[this.currentBet.resource] -= this.currentBet.amount;
        
        // Double the bet amount
        this.currentBet.amount *= 2;
        
        // Sync with the game's resource system if available
        if (window.game && window.game.controls && window.game.controls.resources) {
            window.game.controls.resources[this.currentBet.resource] = this.spaceship.cargo[this.currentBet.resource];
        }
        
        return true;
    }

    /**
     * Calculate payout for a win (2x bet)
     * @returns {number} Payout amount
     */
    calculateWinPayout() {
        return this.currentBet.amount * 2;
    }

    /**
     * Calculate payout for a blackjack (3x bet)
     * @returns {number} Payout amount
     */
    calculateBlackjackPayout() {
        return this.currentBet.amount * 3;
    }

    /**
     * Calculate payout for a push (return bet)
     * @returns {number} Payout amount
     */
    calculatePushPayout() {
        return this.currentBet.amount;
    }

    /**
     * Pay out winnings to player
     * @param {number} amount - Amount to pay out
     */
    payOut(amount) {
        if (!this.spaceship || !this.spaceship.cargo || !this.currentBet.resource) {
            return;
        }
        
        this.spaceship.cargo[this.currentBet.resource] += amount;
        
        // Sync with the game's resource system if available
        if (window.game && window.game.controls && window.game.controls.resources) {
            window.game.controls.resources[this.currentBet.resource] = this.spaceship.cargo[this.currentBet.resource];
        }
    }

    /**
     * Handle win payout
     */
    handleWin() {
        const payout = this.calculateWinPayout();
        this.payOut(payout);
        return payout;
    }

    /**
     * Handle blackjack payout
     */
    handleBlackjack() {
        const payout = this.calculateBlackjackPayout();
        this.payOut(payout);
        return payout;
    }

    /**
     * Handle push (return bet)
     */
    handlePush() {
        const payout = this.calculatePushPayout();
        this.payOut(payout);
        return payout;
    }

    /**
     * Reset betting state
     */
    reset() {
        this.currentBet = {
            resource: null,
            amount: 0
        };
    }

    /**
     * Get resource amounts for display
     * @returns {Object} Resource amounts
     */
    getResourceAmounts() {
        if (!this.spaceship || !this.spaceship.cargo) {
            return { iron: 0, gold: 0, platinum: 0 };
        }
        
        return {
            iron: this.spaceship.cargo.iron || 0,
            gold: this.spaceship.cargo.gold || 0,
            platinum: this.spaceship.cargo.platinum || 0
        };
    }

    /**
     * Initialize cargo if needed
     */
    initializeCargo() {
        if (!this.spaceship) {
            console.error("No spaceship object available");
            return false;
        }
        
        if (!this.spaceship.cargo) {
            console.warn("Creating cargo object for spaceship");
            this.spaceship.cargo = { iron: 0, gold: 0, platinum: 0 };
        }
        
        // Ensure all resources are defined
        if (this.spaceship.cargo.iron === undefined) this.spaceship.cargo.iron = 0;
        if (this.spaceship.cargo.gold === undefined) this.spaceship.cargo.gold = 0;
        if (this.spaceship.cargo.platinum === undefined) this.spaceship.cargo.platinum = 0;
        
        return true;
    }

    /**
     * Sync with game resources
     */
    syncWithGameResources() {
        if (window.game && window.game.controls && window.game.controls.resources) {
            // Sync with the real game resources
            const gameResources = window.game.controls.resources;
            
            if (!this.spaceship.cargo) {
                this.spaceship.cargo = {};
            }
            
            // Update cargo with current game resources
            this.spaceship.cargo.iron = gameResources.iron || 0;
            this.spaceship.cargo.gold = gameResources.gold || 0;
            this.spaceship.cargo.platinum = gameResources.platinum || 0;
        }
    }

    /**
     * Get bet amount display string
     * @returns {string} Formatted bet amount
     */
    getBetDisplayString() {
        if (!this.hasValidBet()) {
            return '0';
        }
        
        return `${this.currentBet.amount} ${this.currentBet.resource.toUpperCase()}`;
    }

    /**
     * Get resource color for UI
     * @param {string} resource - Resource type
     * @returns {string} CSS color string
     */
    getResourceColor(resource) {
        switch (resource) {
            case 'iron':
                return 'rgba(150, 150, 150, 1)';
            case 'gold':
                return 'rgba(255, 215, 0, 1)';
            case 'platinum':
                return 'rgba(229, 228, 226, 1)';
            default:
                return 'rgba(255, 255, 255, 1)';
        }
    }
}