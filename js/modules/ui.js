// ui.js - Main UI class that integrates all UI components

import { HUD } from './ui/hud.js';
import { MiningDisplay } from './ui/miningDisplay.js';
import { TargetingSystem } from './ui/targetingSystem.js';
import { MothershipInterface } from './ui/mothershipInterface.js';
import { GameOverScreen } from './ui/gameOverScreen.js';
import { ControlsMenu } from './ui/controlsMenu.js';
import { StarMap } from './ui/starMap.js';
import { BlackjackGame } from './ui/blackjackGame.js';

export class UI {
    constructor(spaceship, environment) {
        this.spaceship = spaceship;
        this.environment = environment;
        this.controls = null; // Will be set via setControls
        this.audio = null; // Will be set via setAudio
        
        console.log("Initializing UI components...");
        
        // Initialize UI components
        this.hud = new HUD(spaceship);
        this.miningDisplay = new MiningDisplay();
        this.targetingSystem = new TargetingSystem();
        this.mothershipInterface = new MothershipInterface();
        this.gameOverScreen = new GameOverScreen();
        this.controlsMenu = new ControlsMenu();
        
        // Initialize star map (requires environment, docking system, and mothership interface)
        this.starMap = new StarMap(this.environment.starSystemGenerator, null, this.mothershipInterface);
        
        // Initialize Blackjack game (will be fully initialized after audio is set)
        this.blackjackGame = null;
        
        // Link starMap to mothershipInterface
        this.mothershipInterface.setStarMap(this.starMap);
        
        console.log("UI components initialized");
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
        
        // Update star map with docking system
        if (this.starMap && this.controls.dockingSystem) {
            this.starMap.dockingSystem = this.controls.dockingSystem;
        }
        
        // Set up button handlers
        this.setupEventHandlers();
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
    }
    
    update() {
        // Update individual components
        if (this.hud && this.hud.update) {
            this.hud.update();
        }
        
        if (this.miningDisplay && this.miningDisplay.update) {
            this.miningDisplay.update();
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
    }
    
    showUI() {
        console.log("Showing UI elements");
        
        // Show all UI elements
        if (this.hud && this.hud.show) {
            this.hud.show();
        }
        
        if (this.miningDisplay && this.miningDisplay.show) {
            this.miningDisplay.show();
        }
    }
} 