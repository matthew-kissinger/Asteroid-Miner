// game.js - Enhanced game logic with combat systems (refactored with delegation pattern)
import { GameInitializer } from './game/initialization.js';
import { GameStateManager } from './game/stateManager.js';
import { GameSystemCoordinator } from './game/systemCoordinator.js';
import { GameLifecycleManager } from './game/lifecycle.js';
import { GameEventHandlers } from './game/eventHandlers.js';
import { GameHelpers } from './game/helpers.js';
export class Game {
    constructor() {
        // Initialize modules in the correct order
        this.initializeModules();
        
        // Initialize the game asynchronously
        this.initializeGame();
    }

    /**
     * Initialize all module instances
     */
    initializeModules() {
        this.initializer = new GameInitializer(this);
        this.stateManager = new GameStateManager(this);
        this.systemCoordinator = new GameSystemCoordinator(this);
        this.lifecycleManager = new GameLifecycleManager(this);
        this.eventHandlers = new GameEventHandlers(this);
        this.helpers = new GameHelpers(this);
    }

    /**
     * Initialize the game systems
     */
    async initializeGame() {
        try {
            // Initialize all game systems
            await this.initializer.initialize();
            
            // Start with docked state for initial tutorial/intro
            this.startDocked();
            
            // Register event handlers
            this.setupEventHandlers();
            
            // Start game loop
            this.animate();
        } catch (error) {
            console.error("Error in game initialization:", error);
            throw error; // Re-throw to show in the UI
        }
    }
    
    /**
     * Ensure projectile assets are precomputed - delegated to initializer
     */
    ensureProjectileAssetsPrecomputed() {
        this.initializer.ensureProjectileAssetsPrecomputed();
    }
    
    startDocked() {
        this.initializer.startDocked();
    }
    
    setupEventHandlers() {
        this.eventHandlers.setupEventHandlers();
    }
    
    update(deltaTime) {
        this.systemCoordinator.update(deltaTime);
    }
    
    // Update game sounds based on current game state
    updateAudio() {
        this.systemCoordinator.updateAudio();
    }
    
    checkGameOver() {
        this.stateManager.checkGameOver();
    }
    
    /**
     * Handle game over events from message bus
     * @param {Object} message The game over event message
     */
    handleGameOverEvent(message) {
        this.stateManager.handleGameOverEvent(message);
    }
    /**
     * Trigger game over state and show UI
     * @param {string|Object} message The reason for game over
     */
    gameOver(message) {
        this.stateManager.gameOver(message);
    }
    /**
     * Fallback method to show game over screen if the UI system fails
     * @param {string} message The reason for game over
     */
    showFallbackGameOver(message) {
        this.stateManager.showFallbackGameOver(message);
    }
    animate() {
        this.lifecycleManager.animate();
    }
    
    pause() {
        this.lifecycleManager.pause();
    }
    
    resume() {
        this.lifecycleManager.resume();
    }
    /**
     * Activate horde mode (extreme survival challenge)
     */
    activateHordeMode() {
        this.stateManager.activateHordeMode();
    }
    
    /**
     * Format horde survival time as MM:SS
     * @returns {string} Formatted time string
     */
    getFormattedHordeSurvivalTime() {
        return this.stateManager.getFormattedHordeSurvivalTime();
    }
}