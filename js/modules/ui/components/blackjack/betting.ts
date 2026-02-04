/**
 * Blackjack Betting - Bet management, chip handling, payout calculations
 */

type ResourceType = 'iron' | 'gold' | 'platinum';

type BlackjackCargo = Partial<Record<ResourceType, number>>;

type BlackjackSpaceship = {
    cargo?: BlackjackCargo;
};

type BlackjackBet = {
    resource: ResourceType | null;
    amount: number;
};

type GameResources = Partial<Record<ResourceType, number>>;

export class BlackjackBetting {
    spaceship: BlackjackSpaceship | null;
    currentBet: BlackjackBet;

    constructor(spaceship: BlackjackSpaceship | null = null) {
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
    setSpaceship(spaceship: BlackjackSpaceship | null): void {
        this.spaceship = spaceship;
    }

    /**
     * Select a resource for betting
     * @param {string} resource - The resource type (iron, gold, platinum)
     */
    selectBetResource(resource: ResourceType): void {
        this.currentBet.resource = resource;
        this.currentBet.amount = 1;
    }

    /**
     * Increase the bet amount
     * @returns {boolean} True if bet was increased, false if at maximum
     */
    increaseBet(): boolean {
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
    decreaseBet(): boolean {
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
    getMaxBet(): number {
        if (!this.currentBet.resource || !this.spaceship || !this.spaceship.cargo) {
            return 0;
        }
        
        return this.spaceship.cargo[this.currentBet.resource] || 0;
    }

    /**
     * Get current bet information
     * @returns {Object} Current bet object
     */
    getCurrentBet(): BlackjackBet {
        return { ...this.currentBet };
    }

    /**
     * Check if a valid bet is selected
     * @returns {boolean} True if valid bet exists
     */
    hasValidBet(): boolean {
        return Boolean(this.currentBet.resource) && this.currentBet.amount > 0;
    }

    /**
     * Check if player has enough resources for the current bet
     * @returns {boolean} True if player can afford the bet
     */
    canAffordBet(): boolean {
        if (!this.hasValidBet() || !this.spaceship || !this.spaceship.cargo) {
            return false;
        }
        
        const resource = this.currentBet.resource;
        if (!resource) return false;
        const available = this.spaceship.cargo[resource] || 0;
        return available >= this.currentBet.amount;
    }

    /**
     * Check if player can afford to double down
     * @returns {boolean} True if player can double the current bet
     */
    canAffordDoubleDown(): boolean {
        if (!this.hasValidBet() || !this.spaceship || !this.spaceship.cargo) {
            return false;
        }
        
        const resource = this.currentBet.resource;
        if (!resource) return false;
        const available = this.spaceship.cargo[resource] || 0;
        return available >= this.currentBet.amount;
    }

    /**
     * Place the bet (deduct resources)
     * @returns {boolean} True if bet was successfully placed
     */
    placeBet(): boolean {
        if (!this.canAffordBet()) {
            return false;
        }
        
        // Deduct bet from player's resources
        const resource = this.currentBet.resource;
        if (!this.spaceship || !this.spaceship.cargo || !resource) {
            return false;
        }
        this.spaceship.cargo[resource] = (this.spaceship.cargo[resource] || 0) - this.currentBet.amount;
        
        // Sync with the game's resource system if available
        const game = window.game as { controls?: { resources?: GameResources } } | undefined;
        if (game && game.controls && game.controls.resources) {
            game.controls.resources[resource] = this.spaceship.cargo[resource] || 0;
        }
        
        return true;
    }

    /**
     * Double down (double the current bet)
     * @returns {boolean} True if double down was successful
     */
    doubleDown(): boolean {
        if (!this.canAffordDoubleDown()) {
            return false;
        }
        
        // Deduct additional bet amount
        const resource = this.currentBet.resource;
        if (!this.spaceship || !this.spaceship.cargo || !resource) {
            return false;
        }
        this.spaceship.cargo[resource] = (this.spaceship.cargo[resource] || 0) - this.currentBet.amount;
        
        // Double the bet amount
        this.currentBet.amount *= 2;
        
        // Sync with the game's resource system if available
        const game = window.game as { controls?: { resources?: GameResources } } | undefined;
        if (game && game.controls && game.controls.resources) {
            game.controls.resources[resource] = this.spaceship.cargo[resource] || 0;
        }
        
        return true;
    }

    /**
     * Calculate payout for a win (2x bet)
     * @returns {number} Payout amount
     */
    calculateWinPayout(): number {
        return this.currentBet.amount * 2;
    }

    /**
     * Calculate payout for a blackjack (3x bet)
     * @returns {number} Payout amount
     */
    calculateBlackjackPayout(): number {
        return this.currentBet.amount * 3;
    }

    /**
     * Calculate payout for a push (return bet)
     * @returns {number} Payout amount
     */
    calculatePushPayout(): number {
        return this.currentBet.amount;
    }

    /**
     * Pay out winnings to player
     * @param {number} amount - Amount to pay out
     */
    payOut(amount: number): void {
        if (!this.spaceship || !this.spaceship.cargo || !this.currentBet.resource) {
            return;
        }
        
        const resource = this.currentBet.resource;
        if (!resource) return;
        this.spaceship.cargo[resource] = (this.spaceship.cargo[resource] || 0) + amount;
        
        // Sync with the game's resource system if available
        const game = window.game as { controls?: { resources?: GameResources } } | undefined;
        if (game && game.controls && game.controls.resources) {
            game.controls.resources[resource] = this.spaceship.cargo[resource] || 0;
        }
    }

    /**
     * Handle win payout
     */
    handleWin(): number {
        const payout = this.calculateWinPayout();
        this.payOut(payout);
        return payout;
    }

    /**
     * Handle blackjack payout
     */
    handleBlackjack(): number {
        const payout = this.calculateBlackjackPayout();
        this.payOut(payout);
        return payout;
    }

    /**
     * Handle push (return bet)
     */
    handlePush(): number {
        const payout = this.calculatePushPayout();
        this.payOut(payout);
        return payout;
    }

    /**
     * Reset betting state
     */
    reset(): void {
        this.currentBet = {
            resource: null,
            amount: 0
        };
    }

    /**
     * Get resource amounts for display
     * @returns {Object} Resource amounts
     */
    getResourceAmounts(): Record<ResourceType, number> {
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
    initializeCargo(): boolean {
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
    syncWithGameResources(): void {
        const game = window.game as { controls?: { resources?: GameResources } } | undefined;
        if (game && game.controls && game.controls.resources) {
            if (!this.spaceship) {
                return;
            }
            // Sync with the real game resources
            const gameResources = game.controls.resources;
            
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
    getBetDisplayString(): string {
        if (!this.hasValidBet()) {
            return '0';
        }
        
        return `${this.currentBet.amount} ${this.currentBet.resource ? this.currentBet.resource.toUpperCase() : ''}`;
    }

    /**
     * Get resource color for UI
     * @param {string} resource - Resource type
     * @returns {string} CSS color string
     */
    getResourceColor(resource: ResourceType): string {
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
