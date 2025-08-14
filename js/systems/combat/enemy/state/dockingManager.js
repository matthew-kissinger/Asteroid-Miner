/**
 * Docking Manager - Handles player docking state and enemy freezing
 */

export class DockingManager {
    constructor() {
        this.playerIsDocked = false;
    }

    /**
     * Set up event listeners for player docking/undocking events
     * @param {World} world Game world instance
     * @param {Function} onDocked Callback for when player docks
     * @param {Function} onUndocked Callback for when player undocks
     */
    setupEventListeners(world, onDocked, onUndocked) {
        world.messageBus.subscribe('player.docked', (message) => {
            this.handlePlayerDocked(message, onDocked);
        });
        
        world.messageBus.subscribe('player.undocked', (message) => {
            this.handlePlayerUndocked(message, onUndocked);
        });
        
        console.log("Enemy system: Event listeners set up for player docking/undocking");
    }

    /**
     * Handle player docked event
     * @param {object} message Event message
     * @param {Function} onDocked Callback for when player docks
     */
    handlePlayerDocked(message, onDocked) {
        console.log("Enemy system detected player docked - freezing enemies");
        this.playerIsDocked = true;
        onDocked();
    }

    /**
     * Handle player undocked event
     * @param {object} message Event message
     * @param {Function} onUndocked Callback for when player undocks
     */
    handlePlayerUndocked(message, onUndocked) {
        console.log("Enemy system detected player undocked - resuming enemy activities");
        this.playerIsDocked = false;
        onUndocked();
    }

    /**
     * Check and sync global docking state
     * @param {Function} onDocked Callback for when player docks
     * @param {Function} onUndocked Callback for when player undocks
     */
    syncGlobalDockingState(onDocked, onUndocked) {
        if (window.game && window.game.spaceship && window.game.spaceship.isDocked !== undefined) {
            if (this.playerIsDocked !== window.game.spaceship.isDocked) {
                console.log(`Enemy system syncing docked state from global: ${window.game.spaceship.isDocked}`);
                this.playerIsDocked = window.game.spaceship.isDocked;
                
                if (this.playerIsDocked) {
                    onDocked();
                } else {
                    onUndocked();
                }
            }
        }
    }

    /**
     * Check if player is currently docked
     * @returns {boolean} True if player is docked
     */
    isPlayerDocked() {
        return this.playerIsDocked;
    }
}