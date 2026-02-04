// game.ts - Enhanced game logic with combat systems (refactored with delegation pattern)
// @ts-ignore - legacy module not included in TS project
import { GameInitializer } from './game/initialization.js';
import { GameStateManager } from './game/stateManager.js';
import { GameSystemCoordinator } from './game/systemCoordinator.js';
import { GameLifecycleManager } from './game/lifecycle.js';
import { GameEventHandlers } from './game/eventHandlers.js';
import { GameHelpers } from './game/helpers.js';

type GameOverMessage = string | Record<string, unknown>;

type GameModuleConstructor<T> = new (game: Game) => T;

interface GameInitializerLike {
    initialize: () => Promise<void>;
    ensureProjectileAssetsPrecomputed: () => void;
    startDocked: () => void;
}

interface GameStateManagerLike {
    checkGameOver: () => void;
    handleGameOverEvent: (message: Record<string, unknown>) => void;
    gameOver: (message: GameOverMessage) => void;
    showFallbackGameOver: (message: string) => void;
    activateHordeMode: () => void;
    getFormattedHordeSurvivalTime: () => string;
}

interface GameSystemCoordinatorLike {
    update: (deltaTime: number) => void;
    updateAudio: () => void;
}

interface GameLifecycleManagerLike {
    animate: () => void;
    pause: () => void;
    resume: () => void;
}

interface GameEventHandlersLike {
    setupEventHandlers: () => void;
}

interface GameHelpersLike {
}

export class Game {
    initializer!: GameInitializerLike;
    stateManager!: GameStateManagerLike;
    systemCoordinator!: GameSystemCoordinatorLike;
    lifecycleManager!: GameLifecycleManagerLike;
    eventHandlers!: GameEventHandlersLike;
    helpers!: GameHelpersLike;

    constructor() {
        // Initialize modules in the correct order
        this.initializeModules();
        
        // Initialize the game asynchronously
        this.initializeGame();
    }

    /**
     * Initialize all module instances
     */
    initializeModules(): void {
        this.initializer = new (GameInitializer as unknown as GameModuleConstructor<GameInitializerLike>)(this);
        this.stateManager = new (GameStateManager as unknown as GameModuleConstructor<GameStateManagerLike>)(this);
        this.systemCoordinator = new (GameSystemCoordinator as unknown as GameModuleConstructor<GameSystemCoordinatorLike>)(this);
        this.lifecycleManager = new (GameLifecycleManager as unknown as GameModuleConstructor<GameLifecycleManagerLike>)(this);
        this.eventHandlers = new (GameEventHandlers as unknown as GameModuleConstructor<GameEventHandlersLike>)(this);
        this.helpers = new (GameHelpers as unknown as GameModuleConstructor<GameHelpersLike>)(this);
    }

    /**
     * Initialize the game systems
     */
    async initializeGame(): Promise<void> {
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
    ensureProjectileAssetsPrecomputed(): void {
        this.initializer.ensureProjectileAssetsPrecomputed();
    }
    
    startDocked(): void {
        this.initializer.startDocked();
    }
    
    setupEventHandlers(): void {
        this.eventHandlers.setupEventHandlers();
    }
    
    update(deltaTime: number): void {
        this.systemCoordinator.update(deltaTime);
    }
    
    // Update game sounds based on current game state
    updateAudio(): void {
        this.systemCoordinator.updateAudio();
    }
    
    checkGameOver(): void {
        this.stateManager.checkGameOver();
    }
    
    /**
     * Handle game over events from message bus
     * @param message The game over event message
     */
    handleGameOverEvent(message: Record<string, unknown>): void {
        this.stateManager.handleGameOverEvent(message);
    }
    /**
     * Trigger game over state and show UI
     * @param message The reason for game over
     */
    gameOver(message: GameOverMessage): void {
        this.stateManager.gameOver(message);
    }
    /**
     * Fallback method to show game over screen if the UI system fails
     * @param message The reason for game over
     */
    showFallbackGameOver(message: string): void {
        this.stateManager.showFallbackGameOver(message);
    }
    animate(): void {
        this.lifecycleManager.animate();
    }
    
    pause(): void {
        this.lifecycleManager.pause();
    }
    
    resume(): void {
        this.lifecycleManager.resume();
    }
    /**
     * Activate horde mode (extreme survival challenge)
     */
    activateHordeMode(): void {
        this.stateManager.activateHordeMode();
    }
    
    /**
     * Format horde survival time as MM:SS
     * @returns Formatted time string
     */
    getFormattedHordeSurvivalTime(): string {
        return this.stateManager.getFormattedHordeSurvivalTime();
    }
}
