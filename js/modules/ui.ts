// ui.ts - Main UI class that integrates all UI components

import { HUD } from './ui/hud.ts';
import { MobileHUD } from './ui/mobileHUD.ts';
// Removed direct imports for MiningDisplay, TargetingUI, StargateInterface, GameOverScreen, ControlsMenu, StarMap, BlackjackGame, Settings, StartScreen
// import { MiningDisplay } from './ui/miningDisplay.ts';
// import { TargetingUI } from './ui/targetingUI.ts';
// import { StargateInterface } from './ui/stargateInterface.ts';
// import { GameOverScreen } from './ui/gameOverScreen.ts';
// import { ControlsMenu } from './ui/controlsMenu.ts';
// import { StarMap } from './ui/starMap.ts';
// import { BlackjackGame } from './ui/blackjackGame.ts';
// import { Settings } from './ui/settings.ts';
// import { StartScreen } from './ui/startScreen.ts';
import { MemoryStats } from '../utils/memoryManager.js';
import { MobileDetector } from '../utils/mobileDetector.js';
import { DEBUG_MODE } from '../globals/debug.ts';
import { mainMessageBus } from '../globals/messageBus.ts';
import { initScreenFlash } from './ui/screenFlash.ts';
import { initDamageNumbers, updateDamageNumbers } from './ui/damageNumbers.ts';
import { initThreatIndicators, setThreatIndicatorsCamera, updateThreatIndicators } from './ui/threatIndicators.ts';
import { initLockOnDisplay, setLockOnDisplayCamera, updateLockOnDisplay, setLockedEnemy, getLockedEnemy } from './ui/lockOnDisplay.ts';
import { initRadar, updateRadar } from './ui/radarDisplay.ts';
import { getEnemies, getPlayerEntity } from '../ecs/systems/ecsRunner';
import { Position } from '../ecs/components';

// Type definitions for UI-related objects
type SpaceshipForUI = any;

interface StarSystemGenerator {
    getCurrentSystemData(): { name: string } | null;
}

interface EnvironmentForUI {
    starSystemGenerator?: StarSystemGenerator;
}

interface DockingSystem {
    isDocked: boolean;
}

interface TouchControls {
    update(): void;
    hide(): void;
    show(): void;
}

interface ControlsForUI {
    dockingSystem?: DockingSystem;
    touchControls?: TouchControls;
    setupStargateUIControls?: () => void;
    [key: string]: unknown;
}

interface AudioForUI {
    playSound?: (sound: string) => void;
}

interface HUDComponent {
    update?: () => void;
    updateLocation?: (location: string | null, systemName: string) => void;
    updateCoordinates?: (x: number, y: number, z: number) => void;
    updateFPS?: (fps: number, cap?: number) => void;
    hide?: () => void;
    show?: () => void;
    setControls?: (controls: any) => void;
}

interface MiningDisplayComponent {
    update?: () => void;
    hide?: () => void;
    show?: () => void;
    setControls?: (controls: any) => void;
}

interface TargetingUIComponent {
    hideLockOn?: () => void;
    hideTargetInfo?: () => void;
}

interface StargateInterfaceComponent {
    hideDockingPrompt?: () => void;
    showStargateUI?: () => void;
    setStarMap?: (starMap: any) => void;
    setBlackjackGame?: (blackjackGame: any) => void;
    setSettings?: (settings: any) => void;
}

interface GameOverScreenComponent {
    audio?: AudioForUI;
    show?: (resources: unknown, message: unknown) => void;
    setupGameOverScreen?: () => void;
}

interface ControlsMenuComponent {
    setupButtonHandler?: () => void;
}

interface StarMapComponent {
    dockingSystem?: DockingSystem | null;
}

interface BlackjackGameComponent {
    // BlackjackGame interface
}

interface SettingsComponent {
    settings?: {
        showFPS?: boolean;
    };
}

interface StartScreenComponent {
    isVisible?: boolean;
}

// Use any for game parameter to be compatible with different game types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GameForUI = any;

interface MessageBusEvent {
    data?: {
        message?: string;
        duration?: number;
        reason?: string;
    };
}

export class UI {
    spaceship: SpaceshipForUI;
    environment: EnvironmentForUI;
    controls: ControlsForUI | null;
    audio: AudioForUI | null;
    isMobile: boolean;
    hud: HUDComponent;
    miningDisplay!: MiningDisplayComponent;
    targetingUI!: TargetingUIComponent;
    stargateInterface!: StargateInterfaceComponent;
    gameOverScreen!: GameOverScreenComponent;
    controlsMenu!: ControlsMenuComponent;
    starMap!: StarMapComponent;
    blackjackGame: BlackjackGameComponent | null = null;
    settings: SettingsComponent | null = null;
    startScreen: StartScreenComponent | null = null;
    statsInterval?: number;
    camera: any = null;
    renderer: any = null;
    
    constructor(spaceship: SpaceshipForUI, environment: EnvironmentForUI) {
        this.spaceship = spaceship;
        this.environment = environment;
        this.controls = null; // Will be set via setControls
        this.audio = null; // Will be set via setAudio
        this.isMobile = MobileDetector.isMobile();

        if (DEBUG_MODE.enabled) console.log(`Initializing UI components for ${this.isMobile ? 'mobile' : 'desktop'} device...`);
        
        // Load mobile CSS if on mobile device
        if (this.isMobile) {
            this.loadMobileCSS();
        }
        
        // Initialize UI components
        if (this.isMobile) {
            this.hud = new MobileHUD(spaceship);
        } else {
            this.hud = new HUD(spaceship);
        }
    }
    
    // Add an async initialization method
    async initializeUIComponents() {
        // Initialize screen flash early so it's ready for any initialization-related flashes
        initScreenFlash();

        // Initialize threat indicators
        initThreatIndicators();

        // Initialize lock-on display
        initLockOnDisplay();

        // Initialize radar display
        initRadar();

        // Initialize damage numbers if camera and renderer are available
        if (this.camera && this.renderer) {
            initDamageNumbers(this.camera, this.renderer);
        }

        const { MiningDisplay } = await import('./ui/miningDisplay.ts');
        this.miningDisplay = new MiningDisplay();
        
        const { TargetingUI } = await import('./ui/targetingUI.ts');
        this.targetingUI = new TargetingUI();
        
        const { StargateInterface } = await import('./ui/stargateInterface.ts');
        this.stargateInterface = new StargateInterface();
        
        const { GameOverScreen } = await import('./ui/gameOverScreen.ts');
        this.gameOverScreen = new GameOverScreen();
        
        const { ControlsMenu } = await import('./ui/controlsMenu.ts');
        this.controlsMenu = new ControlsMenu();
        
        const { StarMap } = await import('./ui/starMap.ts');
        // Initialize star map (requires environment, docking system, and stargate interface)
        this.starMap = new StarMap(this.environment.starSystemGenerator ?? null, null, this.stargateInterface);
        
        // Initialize Blackjack game (will be fully initialized after audio is set)
        this.blackjackGame = null;
        
        // Initialize settings (requires game instance)
        this.settings = null;
        
        // Link starMap to stargateInterface
        this.stargateInterface.setStarMap?.(this.starMap);
        
        // StartScreen will be initialized after game instance is available
        this.startScreen = null;
        
        // Initialize performance monitoring if in debug mode
        if (DEBUG_MODE.enabled) {
            this.initializePerformanceMonitor();
            console.log("UI components initialized");
        }
    }
    
    loadMobileCSS(): void {
        // Create link element for mobile CSS
        const mobileCSS = document.createElement('link');
        mobileCSS.rel = 'stylesheet';
        mobileCSS.href = 'css/mobile.css';
        mobileCSS.type = 'text/css';
        
        // Add to document head
        document.head.appendChild(mobileCSS);

        if (DEBUG_MODE.enabled) console.log("Mobile CSS loaded");
    }

    async setAudio(audio: AudioForUI): Promise<void> {
        if (DEBUG_MODE.enabled) console.log("Setting audio reference in UI");
        this.audio = audio;
        
        // Now that we have audio, initialize BlackjackGame
        if (this.audio) {
            // Make sure spaceship has cargo property
            if (this.spaceship && !this.spaceship.cargo) {
                this.spaceship.cargo = { iron: 0, gold: 0, platinum: 0 };
                console.warn("UI: Created empty cargo object for spaceship");
            }
            
            const { BlackjackGame } = await import('./ui/blackjackGame.ts');
            this.blackjackGame = new BlackjackGame(null, this.spaceship, this.audio);
            if (DEBUG_MODE.enabled) console.log("UI: Created BlackjackGame with spaceship:", this.spaceship);
            
            // Link blackjackGame to stargateInterface
            this.stargateInterface.setBlackjackGame?.(this.blackjackGame);
        }
    }
    
    setControls(controls: ControlsForUI): void {
        if (DEBUG_MODE.enabled) console.log("Setting controls reference in UI");
        this.controls = controls;
        
        // Now that we have controls, we can set it in components that need it
        if (this.miningDisplay.setControls) {
            this.miningDisplay.setControls(this.controls);
        }
        
        // Set controls in the mobile HUD if we're on mobile
        if (this.isMobile && this.hud && this.hud.setControls) {
            this.hud.setControls(this.controls);
        }
        
        // Update star map with docking system
        if (this.starMap && this.controls.dockingSystem) {
            this.starMap.dockingSystem = this.controls.dockingSystem;
        }
        
        // Set up button handlers
        this.setupEventHandlers();
    }

    setCameraAndRenderer(camera: any, renderer: any): void {
        this.camera = camera;
        this.renderer = renderer;

        // Set camera for threat indicators
        setThreatIndicatorsCamera(camera);

        // Set camera for lock-on display
        setLockOnDisplayCamera(camera);
    }

    // Initialize settings with the game instance
    async initializeSettings(game: GameForUI): Promise<void> {
        if (!game) {
            console.error("Cannot initialize settings without game instance");
            return;
        }
        
        // Create settings
        const { Settings } = await import('./ui/settings.ts');
        this.settings = new Settings(game);
        
        // Link settings to stargateInterface
        this.stargateInterface.setSettings?.(this.settings);
        
        // Initialize start screen now that we have game instance
        const { StartScreen } = await import('./ui/startScreen.ts');
        this.startScreen = new StartScreen(game, this);

        if (DEBUG_MODE.enabled) console.log("Settings and StartScreen initialized with game instance");
    }
    
    /**
     * Set up event handlers
     */
    setupEventHandlers(): void {
        if (DEBUG_MODE.enabled) console.log("Setting up UI event handlers");
        
        // Set up controls menu button handler
        if (this.controlsMenu && this.controlsMenu.setupButtonHandler) {
            this.controlsMenu.setupButtonHandler();
        }
        
        // Set up stargate UI control handlers if controls are available
        if (this.controls && this.controls.setupStargateUIControls) {
            this.controls.setupStargateUIControls();
        }
        
        // Listen for UI notification events
        mainMessageBus?.subscribe('ui.notification', this.handleNotification.bind(this));

        // Listen for lock-on toggle events
        mainMessageBus?.subscribe('input.lockOnToggle', this.handleLockOnToggle.bind(this));

        // Add resize handler to update mobile detection
        window.addEventListener('resize', () => {
            const wasMobile = this.isMobile;
            this.isMobile = MobileDetector.isMobile();
            
            // If device type changed, reload the page to apply correct UI
            if (wasMobile !== this.isMobile) {
                if (DEBUG_MODE.enabled) console.log(`Device type changed from ${wasMobile ? 'mobile' : 'desktop'} to ${this.isMobile ? 'mobile' : 'desktop'}`);
                location.reload();
            }
        });
    }
    
    /**
     * Handle UI notification events
     * @param message The notification message
     */
    handleNotification(message: MessageBusEvent): void {
        if (message && message.data) {
            const content = message.data.message || 'System notification';
            const duration = message.data.duration || 3000;
            this.showNotification(content, duration);
        }
    }

    /**
     * Handle lock-on toggle events
     * Finds nearest enemy and toggles lock-on
     */
    handleLockOnToggle(_message: MessageBusEvent): void {
        const currentLocked = getLockedEnemy();
        const enemies = getEnemies();
        const playerEid = getPlayerEntity();

        if (currentLocked !== -1) {
            // Already locked, unlock
            setLockedEnemy(-1);
            if (DEBUG_MODE.enabled) console.log('[LockOn] Unlocked');
        } else if (enemies.length > 0 && playerEid !== -1) {
            // Find nearest enemy
            const playerX = Position.x[playerEid];
            const playerY = Position.y[playerEid];
            const playerZ = Position.z[playerEid];

            let nearestEid = -1;
            let nearestDist = Infinity;

            for (const eid of enemies) {
                const dx = Position.x[eid] - playerX;
                const dy = Position.y[eid] - playerY;
                const dz = Position.z[eid] - playerZ;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestEid = eid;
                }
            }

            if (nearestEid !== -1) {
                setLockedEnemy(nearestEid);
                if (DEBUG_MODE.enabled) console.log('[LockOn] Locked enemy', nearestEid);
            }
        }
    }
    
    /**
     * Handle game over event
     * @param _message Event data
     */
    handleGameOver(_message: MessageBusEvent): void {
        // ... existing code ...
    }
    
    update(deltaTime: number = 16): void {
        // Update appropriate HUD based on device type
        if (this.hud && this.hud.update) {
            this.hud.update();
        }

        if (this.miningDisplay && this.miningDisplay.update) {
            this.miningDisplay.update();
        }

        // Update damage numbers animation
        updateDamageNumbers(deltaTime);

        // Update threat indicators
        const enemies = getEnemies();
        const playerEid = getPlayerEntity();
        updateThreatIndicators(enemies, playerEid);

        // Update lock-on display
        updateLockOnDisplay(playerEid);

        // Update radar display
        updateRadar(performance.now());

        // Update touch controls if on mobile

        if (this.isMobile && this.controls && this.controls.touchControls) {
            this.controls.touchControls.update();
        }
    }
    
    updateLocation(_locationName: string): void {
        // Get the current star system name from the environment
        let systemName = 'Unknown System';
        if (this.environment && this.environment.starSystemGenerator) {
            const systemData = this.environment.starSystemGenerator.getCurrentSystemData();
            systemName = systemData ? systemData.name : 'Unknown System';
        }
        
        if (this.hud && this.hud.updateLocation) {
            // Only pass the system name since we removed the location display
            this.hud.updateLocation(null, systemName);
        }
    }
    
    updateCoordinates(x: number, y: number, z: number): void {
        if (this.hud && this.hud.updateCoordinates) {
            this.hud.updateCoordinates(x, y, z);
        }
    }
    
    updateFPS(fps: number, cap?: number): void {
        if (this.hud && this.hud.updateFPS) {
            // Pass both actual FPS and cap to HUD
            this.hud.updateFPS(fps, cap);
            
            // Control visibility of FPS display based on settings
            if (this.settings && this.settings.settings) {
                const fpsDisplay = document.getElementById('fps-display');
                if (fpsDisplay) {
                    if (this.settings.settings.showFPS) {
                        fpsDisplay.classList.remove('hud-hidden');
                        fpsDisplay.classList.add('hud-visible');
                    } else {
                        fpsDisplay.classList.add('hud-hidden');
                        fpsDisplay.classList.remove('hud-visible');
                    }
                }
            }
        }
    }
    
    /**
     * Show a notification message to the user
     * @param message - The message to display
     * @param duration - Time in milliseconds to show the notification
     */
    showNotification(message: string, duration: number = 3000): void {
        const notificationsArea = document.getElementById('notifications-area');
        if (!notificationsArea) return;
        
        const notification = document.createElement('div');
        notification.className = 'hud-notification';
        notification.textContent = message;
        
        notificationsArea.appendChild(notification);
        
        // Fade in
        setTimeout(() => {
            notification.classList.add('hud-notification-visible');
        }, 10);
        
        // Fade out and remove after duration
        setTimeout(() => {
            notification.classList.remove('hud-notification-visible');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }
    
    showGameOver(resources: unknown, message: unknown): void {
        if (DEBUG_MODE.enabled) console.log("Showing game over screen");
        if (DEBUG_MODE.enabled) console.log("Resources data:", resources); // Add logging to see structure
        
        // Show game over screen
        if (this.gameOverScreen && this.gameOverScreen.show) {
            // Make sure element exists in DOM first
            if (!document.getElementById('game-over-container')) {
                console.warn("Game over container not found in DOM, recreating");
                this.gameOverScreen.setupGameOverScreen?.();
            }
            
            // Pass the audio reference to the game over screen
            if (this.audio) {
                this.gameOverScreen.audio = this.audio;
            }
            
            // Pass the message object through directly - gameOverScreen will handle the parsing
            this.gameOverScreen.show(resources, message);
            
            // Remove all direct sound playback from here
            // The GameOverScreen will handle playing the sound
        } else {
            console.error("Game over screen not properly initialized");
            // Create a very simple fallback
            const fallbackOverlay = document.createElement('div');
            fallbackOverlay.id = 'fallback-overlay';
            fallbackOverlay.classList.add('hud-fallback-overlay');
            
            // Extract message text if it's an object
            const messageData = message as MessageBusEvent;
            const messageText = typeof message === 'string' ? message : 
                               (messageData && messageData.data && messageData.data.reason ? messageData.data.reason : 
                                'Your ship was destroyed!');
            
            const content = document.createElement('div');
            content.innerHTML = `
                <h1 class="hud-fallback-title">GAME OVER</h1>
                <p class="hud-fallback-text">${messageText}</p>
                <button id="restart-btn" class="hud-fallback-button">RESTART GAME</button>
            `;
            fallbackOverlay.appendChild(content);
            document.body.appendChild(fallbackOverlay);
            
            // Add restart button handler
            const restartBtn = document.getElementById('restart-btn');
            if (restartBtn) {
                restartBtn.addEventListener('click', () => {
                    location.reload();
                });
            }
        }
        
        // Hide other UI elements
        this.hideUI();
    }
    
    hideUI(): void {
        if (DEBUG_MODE.enabled) console.log("Hiding UI elements");

        // Force hide ALL UI elements during intro sequence
        if (window.game && window.game.introSequenceActive) {
            if (DEBUG_MODE.enabled) console.log("Intro sequence active - forcing ALL UI elements to be hidden");
            
            // Get references to each UI element we need to hide
            const elements: (HTMLElement | null)[] = [
                document.getElementById('hud-container'),
                document.getElementById('mobile-hud-container'),
                document.getElementById('pointer-lock-instructions'),
                document.getElementById('notifications-area')
            ];
            
            // Hide each found element (being careful to check if it exists)
            elements.forEach(element => {
                if (element) {
                    element.classList.add('hud-hidden');
                    element.classList.remove('hud-visible');
                }
            });
            
            // Hide any additional UI panels that might be visible
            const allPanels = document.querySelectorAll('.ui-panel, .panel, .hud-panel, .status-panel');
            allPanels.forEach(panel => {
                if (panel instanceof HTMLElement) {
                    panel.classList.add('hud-hidden');
                    panel.classList.remove('hud-visible');
                }
            });
            
            return; // Skip standard hiding - we've handled everything
        }
        
        // Standard UI hiding for non-intro cases
        // Hide main UI elements but not game over screen
        if (this.hud && this.hud.hide) {
            this.hud.hide();
        }
        
        if (this.miningDisplay && this.miningDisplay.hide) {
            this.miningDisplay.hide();
        }
        
        if (this.targetingUI && this.targetingUI.hideLockOn) {
            this.targetingUI.hideLockOn();
        }
        
        if (this.targetingUI && this.targetingUI.hideTargetInfo) {
            this.targetingUI.hideTargetInfo();
        }
        
        if (this.stargateInterface && this.stargateInterface.hideDockingPrompt) {
            this.stargateInterface.hideDockingPrompt();
        }
        
        // Hide touch controls if on mobile
        if (this.isMobile && this.controls && this.controls.touchControls) {
            this.controls.touchControls.hide();
        }
    }
    
    showUI(): void {
        if (DEBUG_MODE.enabled) console.log("Showing UI elements");

        // Don't show UI if intro sequence is active
        if (window.game && window.game.introSequenceActive) {
            console.warn("showUI called while intro is still active - not showing UI elements");
            return; // Exit early - don't show any UI during intro
        }

        // Don't show UI if start screen is visible
        if (this.startScreen && this.startScreen.isVisible) {
            console.warn("showUI called while start screen is visible - not showing UI elements");
            return;
        }

        // First, show UI components through their interfaces
        if (this.hud && this.hud.show) {
            if (DEBUG_MODE.enabled) console.log("Calling hud.show()");
            this.hud.show();
        }
        
        if (this.miningDisplay && this.miningDisplay.show) {
            this.miningDisplay.show();
        }
        
        // Show touch controls if on mobile
        if (this.isMobile && this.controls && this.controls.touchControls) {
            this.controls.touchControls.show();
        }
        
        // FORCE restore elements that might have been forcibly hidden
        // But only if intro is not active
        if (window.game && window.game.introSequenceActive) {
            return; // Double-check intro is not active before forcing visibility
        }
        
        if (DEBUG_MODE.enabled) console.log("Forcing all UI elements to be displayed");

        // Ensure HUD container is visible
        const hudContainer = document.getElementById('hud-container');
        if (hudContainer) {
            if (DEBUG_MODE.enabled) console.log("Setting hudContainer to visible");
            hudContainer.classList.remove('hud-hidden');
            hudContainer.classList.add('hud-visible');
        } else {
            console.warn("HUD container not found - could not make visible");
        }
        
        // Ensure mobile HUD is visible if on mobile
        const mobileHudContainer = document.getElementById('mobile-hud-container');
        if (mobileHudContainer) {
            mobileHudContainer.classList.remove('hud-hidden');
            mobileHudContainer.classList.add('hud-visible');
        }
        
        // Show pointer lock instructions only if not locked
        const pointerLockInstructions = document.getElementById('pointer-lock-instructions');
        if (pointerLockInstructions && !document.pointerLockElement) {
            pointerLockInstructions.classList.remove('hud-hidden');
            pointerLockInstructions.classList.add('hud-visible');
        }
        
        // Show notifications area
        const notificationsArea = document.getElementById('notifications-area');
        if (notificationsArea) {
            notificationsArea.classList.remove('hud-hidden');
            notificationsArea.classList.add('hud-visible');
        }

        // Also show any panels that might have been hidden (except target-info which should stay hidden)
        const allPanels = document.querySelectorAll('.ui-panel, .panel, .hud-panel, .status-panel');
        allPanels.forEach(panel => {
            if (panel instanceof HTMLElement) {
                // Don't force target-info to be visible - let targeting system control it
                if (panel.id !== 'target-info') {
                    panel.classList.remove('hud-hidden');
                }
                panel.classList.add('hud-visible');
            }
        });
    }
    
    /**
     * Initialize performance monitor for debugging
     */
    initializePerformanceMonitor(): void {
        // Create container for performance stats
        const statsContainer = document.createElement('div');
        statsContainer.id = 'performance-stats';
        statsContainer.classList.add('hud-perf-stats');
        
        // Memory stats container
        const memoryStats = document.createElement('div');
        memoryStats.id = 'memory-stats';
        statsContainer.appendChild(memoryStats);
        
        // FPS counter
        const fpsCounter = document.createElement('div');
        fpsCounter.id = 'fps-counter';
        statsContainer.appendChild(fpsCounter);
        
        // Add to DOM
        document.body.appendChild(statsContainer);
        
        // Update stats every second
        this.statsInterval = window.setInterval(() => {
            // Update memory stats display
            memoryStats.innerHTML = MemoryStats.getReport().replace(/\n/g, '<br>');
            
            // Display current FPS if available
            if (window.game && window.game.currentFPS) {
                fpsCounter.innerHTML = `FPS: ${Math.round(window.game.currentFPS)}`;
            }
        }, 1000);
    }
    
    // Make sure to clean up stats interval when necessary
    onDisabled(): void {
        // Clear stats interval if it exists
        if (this.statsInterval) {
            clearInterval(this.statsInterval);
            this.statsInterval = undefined;
        }
    }
}
