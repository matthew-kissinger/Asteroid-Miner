// eventHandlers.js - Event handling setup and methods
export class GameEventHandlers {
    constructor(game) {
        this.game = game;
    }

    /**
     * Set up all event handlers for the game
     */
    setupEventHandlers() {
        this.setupWindowEvents();
        this.setupKeyboardEvents();
        this.setupMouseEvents();
        this.setupGameOverEventSubscription();
    }

    /**
     * Set up window-related event handlers
     */
    setupWindowEvents() {
        // Handle window resize
        window.addEventListener('resize', () => {
            this.game.renderer.handleResize();
        });

        // Handle visibility change to pause/resume game
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.game.lifecycleManager.pause();
            } else {
                this.game.lifecycleManager.resume();
            }
        });
    }

    /**
     * Set up keyboard event handlers
     */
    setupKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            // Handle ESC key to exit pointer lock
            if (e.key === 'Escape' && document.pointerLockElement) {
                document.exitPointerLock();
            }

            // Add audio mute toggle (M key)
            if (e.key.toLowerCase() === 'm' && this.game.audio) {
                const isMuted = this.game.audio.toggleMute();
                console.log(`Audio ${isMuted ? 'muted' : 'unmuted'}`);
            }

            // Add weapon mode switching (F key)
            if (e.key.toLowerCase() === 'f' && !this.game.spaceship.isDocked) {
                if (this.game.combat && this.game.combat.cycleWeaponMode) {
                    const newMode = this.game.combat.cycleWeaponMode();
                    // Display weapon switch notification in UI
                    if (this.game.ui && this.game.ui.showNotification) {
                        this.game.ui.showNotification(`Weapon Mode: ${newMode}`, 2000);
                    }
                }
            }
        });
    }

    /**
     * Set up mouse event handlers
     */
    setupMouseEvents() {
        // Add right-click firing
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            
            // Only fire if not docked
            if (!this.game.spaceship.isDocked && this.game.combat) {
                // Start firing
                this.game.combat.setFiring(true); // Use combat instead of weaponSystem
                
                // Play laser sound
                if (this.game.audio) {
                    this.game.audio.playSound('laser');
                }
            }
        });

        document.addEventListener('mouseup', (e) => {
            if (e.button === 2) {
                if (this.game.combat) {
                    // Stop firing weapons
                    this.game.combat.setFiring(false); // Use combat instead of weaponSystem
                    // Stop laser sound
                    if (this.game.audio) {
                        this.game.audio.stopSound('laser');
                    }
                }
            }
        });

        // Prevent right-click menu from appearing
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    /**
     * Set up game over event subscription
     */
    setupGameOverEventSubscription() {
        // Subscribe to game over events with enhanced logging
        console.log("Game: Setting up game.over event subscription");
        const boundHandleGameOver = this.game.stateManager.handleGameOverEvent.bind(this.game.stateManager);
        
        // Use a direct bound method reference for reliability
        this.game.gameOverUnsubscribe = this.game.messageBus.subscribe('game.over', boundHandleGameOver);
        
        // Verify subscription was successful
        if (this.game.messageBus.listeners.has('game.over')) {
            const listeners = this.game.messageBus.listeners.get('game.over');
            console.log(`Game: Successfully registered ${listeners.length} game.over listener(s)`);
        } else {
            console.error("Game: Failed to register game.over listener - critical error!");
            // Attempt emergency re-registration
            setTimeout(() => {
                this.game.gameOverUnsubscribe = this.game.messageBus.subscribe('game.over', boundHandleGameOver);
                console.log("Game: Attempted emergency re-registration of game.over event");
            }, 500);
        }

        console.log("Game: Registered event types after subscription:", 
                    Array.from(this.game.messageBus.listeners.keys()));

        // Ensure message bus is correctly shared
        console.log(`Game: Current mainMessageBus has ${window.mainMessageBus.listeners.has("game.over") ? "game.over listeners" : "NO game.over listeners"}`);
    }
}