// main.ts - Main entry point for the game (ultra-lean refactored version)

// Import refactored modules
import { initializeGlobals } from './main/globals.js';
import { StartupSequence } from './main/startupSequence.js';
import { GameLoop } from './main/gameLoop.js';
import { Diagnostics } from './main/diagnostics.js';
import { GameInitializer } from './main/gameInitializer.js';
import { mainMessageBus } from './globals/messageBus.ts';
// Removed direct imports for ObjectPools, DifficultyManager, HordeMode, AudioUpdater, GameLifecycle
// import { ObjectPools } from './main/objectPools.js';
// import { DifficultyManager } from './main/difficultyManager.js';
// import { HordeMode } from './main/hordeMode.js';
// import { AudioUpdater } from './main/audioUpdater.js';
// import { GameLifecycle } from './main/gameLifecycle.ts';

// Import bitECS systems
// import { initECS, updateECS } from './ecs/systems/index.js'; // Removed direct import

export class Game {
    initializer: any;
    lifecycle: any;
    difficultyManager: any;
    hordeMode: any;
    audioUpdater: any;
    objectPools: any;
    gameLoop: any;
    boundAnimate: any;
    startupSequence: any;
    diagnostics: any;
    isGameOver: boolean = false;
    introSequenceActive: boolean = false;
    gameTime: number = 0;
    isMobile: boolean = false;
    ui: any;
    physics: any;
    spaceship: any;
    camera: any;
    combat: any;
    world: any;
    renderer: any;
    audio: any;
    private _environment: any;
    private _controls: any;
    private _updateECS: ((deltaTime: number) => void) | undefined; // New property

    constructor() {
        // Initialize globals first
        initializeGlobals();
        
        // Make game instance globally accessible for emergency access
        window.game = this;
        
        // Subscribe to global events
        mainMessageBus.subscribe('game.over', (data: any) => {
            if (this.lifecycle) {
                this.lifecycle.gameOver(data.reason || 'Game Over');
            }
        });

        // Initialize core game systems
        this.initializer = new GameInitializer(this);
    }

    async initialize() {
        try {
            await this.initializer.initializeCore();

            // Game state
            this.isGameOver = false;
            this.introSequenceActive = false;
            this.gameTime = 0;

            // Detect mobile device
            this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                           (window.matchMedia && window.matchMedia('(max-width: 768px)').matches);

            // Initialize managers
            const { DifficultyManager } = await import('./main/difficultyManager.js');
            this.difficultyManager = new DifficultyManager();
            
            const { HordeMode } = await import('./main/hordeMode.js');
            this.hordeMode = new HordeMode(this);
            
            const { AudioUpdater } = await import('./main/audioUpdater.js');
            this.audioUpdater = new AudioUpdater(this);
            
            const { GameLifecycle } = await import('./main/gameLifecycle.ts');
            this.lifecycle = new GameLifecycle(this);
            
            const { ObjectPools } = await import('./main/objectPools.js');
            this.objectPools = new ObjectPools(this);

            // Register event handlers
            this.initializer.setupEventHandlers();

            // Initialize game loop
            this.gameLoop = new GameLoop(this);
            this.boundAnimate = this.gameLoop.boundAnimate;

            // Apply frame rate settings if available
            if (this.ui && this.ui.settings) {
                this.gameLoop.applyFrameRateSettings();
            }

            // Initialize startup sequence
            this.startupSequence = new StartupSequence(this);

            // Initialize diagnostics
            this.diagnostics = new Diagnostics(this);

            // Initialize bitECS systems (pass scene for test entity mesh)
            const { initECS, updateECS } = await import('./ecs/systems/index.js');
            initECS(this.renderer?.scene);
            this._updateECS = updateECS;

            // Start the initialization sequence
            this.startupSequence.initializeGameSequence();
        } catch (error) {
            throw error;
        }
    }
    
    // Delegation methods
    async initIntroSequence() {
        await this.startupSequence.initIntroSequence();
    }
    
    async startIntroSequence() {
        await this.startupSequence.startIntroSequence();
    }
    
    completeIntroSequence() {
        this.startupSequence.completeIntroSequence();
    }
    
    preWarmBasicShaders() {
        this.objectPools.preWarmBasicShaders();
    }
    
    initializeObjectPools() {
        this.objectPools.initializeObjectPools();
    }
    
    startDocked() {
        this.initializer.startDocked();
    }
    
    setupEventHandlers() {
        this.initializer.setupEventHandlers();
    }
    
    initializeDifficultyManager() {
        // Compatibility method - difficulty manager is now initialized in constructor
    }
    
    activateHordeMode() {
        this.hordeMode.activate();
    }
    
    getFormattedHordeSurvivalTime() {
        return this.hordeMode.getFormattedSurvivalTime();
    }
    
    updateAudio() {
        this.audioUpdater.update();
    }
    
    checkGameOver() {
        this.lifecycle.checkGameOver();
    }
    
    gameOver(reason: string) {
        this.lifecycle.gameOver(reason);
    }
    
    cleanup() {
        this.lifecycle.cleanup();
    }
    
    destroy() {
        this.lifecycle.destroy();
    }
    
    // Main update loop
    update(deltaTime: number) {
        if (this.isGameOver) return;
        
        // Update horde mode
        this.hordeMode.update();
        
        // Update physics
        this.physics.update(deltaTime);

        // Update bitECS systems (parallel to legacy systems)
        if (this._updateECS) {
            this._updateECS(deltaTime);
        }

        // Update spaceship
        if (this.spaceship.update) {
            this.spaceship.update(deltaTime);
        }
        
        // Update difficulty manager (but not during intro sequence)
        if (this.difficultyManager && !this.introSequenceActive && !this.spaceship.isDocked) {
            this.difficultyManager.update(deltaTime);
        }
        
        // Update coordinates in HUD after physics update
        if (this.ui && this.ui.updateCoordinates && this.spaceship && this.spaceship.mesh) {
            const position = this.spaceship.mesh.position;
            this.ui.updateCoordinates(position.x, position.y, position.z);
        }
        
        // Update controls
        if (this.controls.update) {
            this.controls.update();
        }
        
        // Update combat
        this.updateCombat(deltaTime);
        
        // Update environment
        if (this.environment.update) {
            this.environment.update(deltaTime, this.camera);
        }
        
        // Update UI
        if (this.ui.update) {
            this.ui.update();
        }
        
        // Update audio
        this.updateAudio();
        
        // Check for game over conditions
        this.checkGameOver();
        
        // Update ECS world
        this.updateECSWorld(deltaTime);
    }
    
    // Explicitly typed helper for combat
    get environment(): any { return this._environment; }
    set environment(v: any) { this._environment = v; }
    get controls(): any { return this._controls; }
    set controls(v: any) { this._controls = v; }

    updateCombat(deltaTime: number) {
        // Ensure the combat system's player entity is always up to date
        if (this.combat && this.combat.updatePlayerReference) {
            try {
                this.combat.updatePlayerReference();
            } catch (error) {
            }
        } else if (this.combat && !this.combat.updatePlayerReference) {
            
            // Try to initialize player entity directly if method is missing
            if (this.combat.createPlayerReferenceEntity && !this.combat.playerEntity) {
                this.combat.createPlayerReferenceEntity();
            }
        }
        
        // Update combat systems - this will update the ECS world
        if (this.combat && this.combat.update) {
            this.combat.update(deltaTime);
        }
    }
    
    updateECSWorld(deltaTime: number) {
        // Update the ECS world with the current delta time - skip during intro sequence
        if (this.world && !this.introSequenceActive) {
            // Fixed-step for ECS using same delta to keep in lockstep
            this.world.messageBus && this.world.messageBus.fastPublish && this.world.messageBus.fastPublish('world.preUpdate', { deltaTime });
            this.world.systemManager.update(deltaTime);
            this.world.messageBus && this.world.messageBus.fastPublish && this.world.messageBus.fastPublish('world.postUpdate', { deltaTime });
        } else if (this.world && this.introSequenceActive) {
            // If intro is active, only update essential systems but not enemy systems
            // This is a fallback in case freezeAllEnemies() wasn't called or doesn't work
            if (this.world.entityManager && this.world.systemManager) {
                for (const system of this.world.systemManager.systems) {
                    // Skip enemy-related systems during intro
                    if (system.constructor.name !== 'EnemySystem' && 
                        system.constructor.name !== 'EnemyAISystem' && 
                        system.constructor.name !== 'CombatSystem') {
                        system.update(deltaTime);
                    }
                }
            }
        }
    }
    
    // Event handlers
    handleResize = () => {
        if (this.renderer) {
            this.renderer.handleResize();
        }
    }
    
    handleVisibilityChange = () => {
        if (document.hidden) {
            // Pause game when tab is not visible
            if (this.audio) {
                this.audio.pauseAllSounds();
            }
        } else {
            // Resume game when tab becomes visible
            if (this.audio) {
                this.audio.resumeAllSounds();
            }
        }
    }
    
    handleKeyDown = (event: KeyboardEvent) => {
        // Global key handlers
        if (event.key === 'Escape') {
            if (this.ui && this.ui.togglePauseMenu) {
                this.ui.togglePauseMenu();
            }
        }
    }
}

// Entry point - called from bootstrap.js or directly
async function startGameMainModule() {
    try {
        // Create loading overlay - hide the black loading screen after initialization
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            // Add a small delay to ensure everything is properly loaded
            setTimeout(() => {
                loadingOverlay.style.opacity = '0';
                loadingOverlay.style.transition = 'opacity 1s ease-in-out';
                setTimeout(() => {
                    if (loadingOverlay.parentNode) {
                        loadingOverlay.remove();
                    }
                }, 1000);
            }, 100);
        }


        // Create game instance (globals initialized in constructor)
        window.game = new Game();
        await window.game.initialize();

    } catch (error: any) {
        
        // Show error message to user
        const errorMessage = document.createElement('div');
        errorMessage.style.position = 'fixed';
        errorMessage.style.top = '50%';
        errorMessage.style.left = '50%';
        errorMessage.style.transform = 'translate(-50%, -50%)';
        errorMessage.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        errorMessage.style.color = '#ff3030';
        errorMessage.style.padding = '20px';
        errorMessage.style.borderRadius = '10px';
        errorMessage.style.border = '1px solid #ff3030';
        errorMessage.style.zIndex = '9999';
        errorMessage.style.textAlign = 'center';
        errorMessage.style.fontFamily = 'Courier New, monospace';
        errorMessage.style.maxWidth = '80%';
        
        errorMessage.innerHTML = `
            <h2>Error Starting Game</h2>
            <p>${error.message}</p>
            <p>Check the console for more details (F12).</p>
            <p>You can try refreshing the page or clearing your browser cache.</p>
            <button id="reload-button" style="background: #ff3030; color: white; border: none; padding: 10px; margin-top: 20px; cursor: pointer;">Reload Page</button>
        `;
        
        document.body.appendChild(errorMessage);
        
        // Add event listener to reload button
        const reloadButton = document.getElementById('reload-button');
        if (reloadButton) {
          reloadButton.addEventListener('click', () => {
              // Add cache-busting parameter to the URL
              const cacheBuster = Date.now();
              window.location.href = window.location.pathname + '?cache=' + cacheBuster;
          });
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startGameMainModule);
} else {
    // DOM is already ready
    startGameMainModule();
}
