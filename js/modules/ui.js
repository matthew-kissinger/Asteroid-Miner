// ui.js - Main UI class that integrates all UI components

import { HUD } from './ui/hud.js';
import { MobileHUD } from './ui/mobileHUD.js';
import { MiningDisplay } from './ui/miningDisplay.js';
import { TargetingSystem } from './ui/targetingSystem.js';
import { MothershipInterface } from './ui/mothershipInterface.js';
import { GameOverScreen } from './ui/gameOverScreen.js';
import { ControlsMenu } from './ui/controlsMenu.js';
import { StarMap } from './ui/starMap.js';
import { BlackjackGame } from './ui/blackjackGame.js';
import { Settings } from './ui/settings.js';
import { MemoryStats } from '../utils/memoryManager.js';
import { MobileDetector } from '../utils/mobileDetector.js';

export class UI {
    constructor(spaceship, environment) {
        this.spaceship = spaceship;
        this.environment = environment;
        this.controls = null; // Will be set via setControls
        this.audio = null; // Will be set via setAudio
        this.isMobile = MobileDetector.isMobile();
        
        console.log(`Initializing UI components for ${this.isMobile ? 'mobile' : 'desktop'} device...`);
        
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
        
        this.miningDisplay = new MiningDisplay();
        this.targetingSystem = new TargetingSystem();
        this.mothershipInterface = new MothershipInterface();
        this.gameOverScreen = new GameOverScreen();
        this.controlsMenu = new ControlsMenu();
        
        // Initialize star map (requires environment, docking system, and mothership interface)
        this.starMap = new StarMap(this.environment.starSystemGenerator, null, this.mothershipInterface);
        
        // Initialize Blackjack game (will be fully initialized after audio is set)
        this.blackjackGame = null;
        
        // Initialize settings (requires game instance)
        this.settings = null;
        
        // Link starMap to mothershipInterface
        this.mothershipInterface.setStarMap(this.starMap);
        
        // Initialize performance monitoring if in debug mode
        if (window.DEBUG_MODE) {
            this.initializePerformanceMonitor();
        }
        
        console.log("UI components initialized");
    }
    
    loadMobileCSS() {
        // Create link element for mobile CSS
        const mobileCSS = document.createElement('link');
        mobileCSS.rel = 'stylesheet';
        mobileCSS.href = 'css/mobile.css';
        mobileCSS.type = 'text/css';
        
        // Add to document head
        document.head.appendChild(mobileCSS);
        
        console.log("Mobile CSS loaded");
    }
    
    setAudio(audio) {
        console.log("Setting audio reference in UI");
        this.audio = audio;
        
        // Now that we have audio, initialize BlackjackGame
        if (this.audio) {
            // Make sure spaceship has cargo property
            if (this.spaceship && !this.spaceship.cargo) {
                this.spaceship.cargo = { iron: 0, gold: 0, platinum: 0 };
                console.warn("UI: Created empty cargo object for spaceship");
            }
            
            this.blackjackGame = new BlackjackGame(null, this.spaceship, this.audio);
            console.log("UI: Created BlackjackGame with spaceship:", this.spaceship);
            
            // Link blackjackGame to mothershipInterface
            this.mothershipInterface.setBlackjackGame(this.blackjackGame);
        }
    }
    
    setControls(controls) {
        console.log("Setting controls reference in UI");
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
    
    // Initialize settings with the game instance
    initializeSettings(game) {
        if (!game) {
            console.error("Cannot initialize settings without game instance");
            return;
        }
        
        // Create settings
        this.settings = new Settings(game);
        
        // Link settings to mothershipInterface
        this.mothershipInterface.setSettings(this.settings);
        
        console.log("Settings initialized with game instance");
    }
    
    setupEventHandlers() {
        console.log("Setting up UI event handlers");
        
        // Set up controls menu button handler
        if (this.controlsMenu && this.controlsMenu.setupButtonHandler) {
            this.controlsMenu.setupButtonHandler();
        }
        
        // Set up mothership UI control handlers if controls are available
        if (this.controls && this.controls.setupMothershipUIControls) {
            this.controls.setupMothershipUIControls();
        }
        
        // Add resize handler to update mobile detection
        window.addEventListener('resize', () => {
            const wasMobile = this.isMobile;
            this.isMobile = MobileDetector.isMobile();
            
            // If device type changed, reload the page to apply correct UI
            if (wasMobile !== this.isMobile) {
                console.log(`Device type changed from ${wasMobile ? 'mobile' : 'desktop'} to ${this.isMobile ? 'mobile' : 'desktop'}`);
                location.reload();
            }
        });
    }
    
    update() {
        // Update appropriate HUD based on device type
        if (this.hud && this.hud.update) {
            this.hud.update();
        }
        
        if (this.miningDisplay && this.miningDisplay.update) {
            this.miningDisplay.update();
        }
        
        // Update touch controls if on mobile
        if (this.isMobile && this.controls && this.controls.touchControls) {
            this.controls.touchControls.update();
        }
    }
    
    updateLocation(locationName) {
        if (this.hud && this.hud.updateLocation) {
            this.hud.updateLocation(locationName);
        }
    }
    
    updateCoordinates(x, y, z) {
        if (this.hud && this.hud.updateCoordinates) {
            this.hud.updateCoordinates(x, y, z);
        }
    }
    
    updateFPS(fps, cap) {
        if (this.hud && this.hud.updateFPS) {
            // Pass both actual FPS and cap to HUD
            this.hud.updateFPS(fps, cap);
            
            // Control visibility of FPS display based on settings
            if (this.settings && this.settings.settings) {
                const fpsDisplay = document.getElementById('fps-display');
                if (fpsDisplay) {
                    fpsDisplay.style.display = this.settings.settings.showFPS ? 'block' : 'none';
                }
            }
        }
    }
    
    /**
     * Show a notification message to the user
     * @param {string} message - The message to display
     * @param {number} duration - Time in milliseconds to show the notification
     */
    showNotification(message, duration = 3000) {
        const notificationsArea = document.getElementById('notifications-area');
        if (!notificationsArea) return;
        
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.backgroundColor = 'rgba(6, 22, 31, 0.7)';
        notification.style.backdropFilter = 'blur(5px)';
        notification.style.color = 'rgba(120, 220, 232, 0.9)';
        notification.style.padding = '8px 15px';
        notification.style.borderRadius = '5px';
        notification.style.marginBottom = '10px';
        notification.style.border = '1px solid rgba(120, 220, 232, 0.3)';
        notification.style.boxShadow = '0 0 10px rgba(120, 220, 232, 0.2)';
        notification.style.textAlign = 'center';
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s';
        
        notificationsArea.appendChild(notification);
        
        // Fade in
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 10);
        
        // Fade out and remove after duration
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }
    
    showGameOver(resources, message) {
        console.log("Showing game over screen");
        console.log("Resources data:", resources); // Add logging to see structure
        
        // Show game over screen
        if (this.gameOverScreen && this.gameOverScreen.show) {
            // Make sure element exists in DOM first
            if (!document.getElementById('game-over-container')) {
                console.warn("Game over container not found in DOM, recreating");
                this.gameOverScreen.setupGameOverScreen();
            }
            
            this.gameOverScreen.show(resources, message);
            
            // Remove all direct sound playback from here
            // The GameOverScreen will handle playing the sound
        } else {
            console.error("Game over screen not properly initialized");
            // Create a very simple fallback
            const fallbackOverlay = document.createElement('div');
            fallbackOverlay.id = 'fallback-overlay';
            fallbackOverlay.style.position = 'fixed';
            fallbackOverlay.style.top = '0';
            fallbackOverlay.style.left = '0';
            fallbackOverlay.style.width = '100%';
            fallbackOverlay.style.height = '100%';
            fallbackOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            fallbackOverlay.style.display = 'flex';
            fallbackOverlay.style.justifyContent = 'center';
            fallbackOverlay.style.alignItems = 'center';
            fallbackOverlay.style.zIndex = '9999';
            
            const content = document.createElement('div');
            content.innerHTML = `
                <h1 style="color: #ff3030; font-size: 48px; margin-bottom: 20px;">GAME OVER</h1>
                <p style="color: #fff; font-size: 24px; margin-bottom: 30px;">${message || 'Your ship was destroyed!'}</p>
                <button id="restart-btn" style="padding: 15px 30px; background-color: #ff3030; color: #fff; border: none; 
                    font-size: 24px; cursor: pointer; border-radius: 5px;">RESTART GAME</button>
            `;
            fallbackOverlay.appendChild(content);
            document.body.appendChild(fallbackOverlay);
            
            // Add restart button handler
            document.getElementById('restart-btn').addEventListener('click', () => {
                location.reload();
            });
        }
        
        // Hide other UI elements
        this.hideUI();
    }
    
    hideUI() {
        console.log("Hiding UI elements");
        
        // Force hide ALL UI elements during intro sequence
        if (window.game && window.game.introSequenceActive) {
            console.log("Intro sequence active - forcing ALL UI elements to be hidden");
            
            // Get references to each UI element we need to hide
            const elements = [
                document.getElementById('hud-container'),
                document.getElementById('mobile-hud-container'),
                document.getElementById('pointer-lock-instructions'),
                document.getElementById('notifications-area')
            ];
            
            // Hide each found element (being careful to check if it exists)
            elements.forEach(element => {
                if (element) {
                    element.style.display = 'none';
                }
            });
            
            // Hide any additional UI panels that might be visible
            const allPanels = document.querySelectorAll('.ui-panel, .panel, .hud-panel, .status-panel');
            allPanels.forEach(panel => {
                panel.style.display = 'none';
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
        
        if (this.targetingSystem && this.targetingSystem.hideLockOn) {
            this.targetingSystem.hideLockOn();
        }
        
        if (this.targetingSystem && this.targetingSystem.hideTargetInfo) {
            this.targetingSystem.hideTargetInfo();
        }
        
        if (this.mothershipInterface && this.mothershipInterface.hideDockingPrompt) {
            this.mothershipInterface.hideDockingPrompt();
        }
        
        // Hide touch controls if on mobile
        if (this.isMobile && this.controls && this.controls.touchControls) {
            this.controls.touchControls.hide();
        }
    }
    
    showUI() {
        console.log("Showing UI elements");
        
        // Don't show UI if intro sequence is active
        if (window.game && window.game.introSequenceActive) {
            console.warn("showUI called while intro is still active - not showing UI elements");
            return; // Exit early - don't show any UI during intro
        }
        
        // First, show UI components through their interfaces
        if (this.hud && this.hud.show) {
            console.log("Calling hud.show()");
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
        
        console.log("Forcing all UI elements to be displayed");
        
        // Ensure HUD container is visible
        const hudContainer = document.getElementById('hud-container');
        if (hudContainer) {
            console.log("Setting hudContainer to display:block");
            hudContainer.style.display = 'block';
            hudContainer.style.visibility = 'visible'; // Double ensure visibility
        } else {
            console.warn("HUD container not found - could not make visible");
        }
        
        // Ensure mobile HUD is visible if on mobile
        const mobileHudContainer = document.getElementById('mobile-hud-container');
        if (mobileHudContainer) {
            mobileHudContainer.style.display = 'block';
            mobileHudContainer.style.visibility = 'visible';
        }
        
        // Show pointer lock instructions only if not locked
        const pointerLockInstructions = document.getElementById('pointer-lock-instructions');
        if (pointerLockInstructions && !document.pointerLockElement) {
            pointerLockInstructions.style.display = 'block';
            pointerLockInstructions.style.visibility = 'visible';
        }
        
        // Show notifications area
        const notificationsArea = document.getElementById('notifications-area');
        if (notificationsArea) {
            notificationsArea.style.display = 'block';
            notificationsArea.style.visibility = 'visible';
        }

        // Also show any panels that might have been hidden
        const allPanels = document.querySelectorAll('.ui-panel, .panel, .hud-panel, .status-panel');
        allPanels.forEach(panel => {
            panel.style.display = 'block';
            panel.style.visibility = 'visible';
        });
    }
    
    /**
     * Initialize performance monitor for debugging
     */
    initializePerformanceMonitor() {
        // Create container for performance stats
        const statsContainer = document.createElement('div');
        statsContainer.id = 'performance-stats';
        statsContainer.style.position = 'fixed';
        statsContainer.style.bottom = '10px';
        statsContainer.style.right = '10px';
        statsContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        statsContainer.style.color = '#0ff';
        statsContainer.style.padding = '10px';
        statsContainer.style.fontFamily = 'monospace';
        statsContainer.style.fontSize = '12px';
        statsContainer.style.borderRadius = '4px';
        statsContainer.style.zIndex = '1000';
        statsContainer.style.maxWidth = '300px';
        statsContainer.style.maxHeight = '200px';
        statsContainer.style.overflow = 'auto';
        
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
        this.statsInterval = setInterval(() => {
            // Update memory stats display
            memoryStats.innerHTML = MemoryStats.getReport().replace(/\n/g, '<br>');
            
            // Display current FPS if available
            if (window.game && window.game.currentFPS) {
                fpsCounter.innerHTML = `FPS: ${Math.round(window.game.currentFPS)}`;
            }
        }, 1000);
    }
    
    // Make sure to clean up stats interval when necessary
    onDisabled() {
        // Clear stats interval if it exists
        if (this.statsInterval) {
            clearInterval(this.statsInterval);
            this.statsInterval = null;
        }
    }
} 