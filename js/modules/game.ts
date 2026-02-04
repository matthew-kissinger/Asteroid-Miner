// game.ts - Enhanced game logic with combat systems (refactored with delegation pattern)
import { GameInitializer } from './game/initialization.js';
import { GameStateManager } from './game/stateManager.js';
import { GameSystemCoordinator } from './game/systemCoordinator.js';
import { GameLifecycleManager } from './game/lifecycle.js';
import { GameEventHandlers } from './game/eventHandlers.js';
import { GameHelpers } from './game/helpers.js';
import * as THREE from 'three';
import { MessageBus } from '../core/messageBus.js';
import { Physics } from './physics';
import { Spaceship } from './spaceship';
import { Environment } from './environment';
import { Controls } from './controls.js';
import { UI } from './ui';
import { AudioManager } from './audio/audio.js';
import { Combat } from './combat';

type GameOverMessage = string | Record<string, unknown>;

interface GameInitializerLike {
    initialize: () => Promise<void>;
    ensureProjectileAssetsPrecomputed: () => void;
    startDocked: () => void;
}

interface GameStateManagerLike {
    checkGameOver: () => void;
    handleGameOverEvent: (message: any) => void;
    gameOver: (message: GameOverMessage) => void;
    showFallbackGameOver: (message: string) => void;
    activateHordeMode: () => void;
    getFormattedHordeSurvivalTime: () => string;
    updateHordeTime: () => void;
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
    getPerformanceMetrics: () => any;
    getGameStatistics: () => any;
    areSystemsReady: () => boolean;
    logSystemStatus: () => void;
}

export class Game {
    initializer!: GameInitializerLike;
    stateManager!: GameStateManagerLike;
    systemCoordinator!: GameSystemCoordinatorLike;
    lifecycleManager!: GameLifecycleManagerLike;
    eventHandlers!: GameEventHandlersLike;
    helpers!: GameHelpersLike;

    // Game state properties
    isGameOver: boolean = false;
    lastUpdateTime: number = performance.now();
    frameCount: number = 0;
    currentFPS: number = 0;
    
    // Combat stats
    enemiesDestroyed: number = 0;
    damageDealt: number = 0;
    damageReceived: number = 0;
    
    // Horde mode properties
    isHordeActive: boolean = false;
    hordeStartTime: number = 0;
    hordeSurvivalTime: number = 0;

    // System references
    renderer: any; // Using any for now as Renderer is complex
    scene!: THREE.Scene;
    camera!: THREE.PerspectiveCamera;
    physics!: Physics;
    environment!: Environment;
    spaceship!: Spaceship;
    ui!: UI;
    combat!: Combat;
    combatManager: any; // AI manager
    controls!: Controls;
    audio!: AudioManager;
    messageBus: MessageBus = new MessageBus();
    gameOverUnsubscribe?: Function;

    constructor() {
        // Global reference for emergency access
        (window as any).game = this;
        
        // Initialize modules in the correct order
        this.initializeModules();
        
        // Initialize the game asynchronously
        this.initializeGame();
    }

    /**
     * Initialize all module instances
     */
    initializeModules(): void {
        this.initializer = new (GameInitializer as any)(this);
        this.stateManager = new GameStateManager(this);
        this.systemCoordinator = new GameSystemCoordinator(this);
        this.lifecycleManager = new GameLifecycleManager(this);
        this.eventHandlers = new GameEventHandlers(this);
        this.helpers = new GameHelpers(this);
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
