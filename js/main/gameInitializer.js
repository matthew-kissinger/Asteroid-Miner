// gameInitializer.js - Game initialization logic

import { Renderer } from '../modules/renderer.js';
import { Spaceship } from '../modules/spaceship.js';
import { Physics } from '../modules/physics.js';
import { Environment } from '../modules/environment.js';
import { Controls } from '../modules/controls.js';
import { UI } from '../modules/ui.js';
import { AudioManager } from '../modules/audio/audio.js';

export class GameInitializer {
    constructor(game) {
        this.game = game;
    }
    
    initializeCore() {
        // Create audio manager first but don't initialize yet
        if (window.DEBUG_MODE) console.log("Creating audio manager...");
        this.game.audio = new AudioManager();
        
        // Initialize renderer first
        if (window.DEBUG_MODE) console.log("Creating renderer...");
        this.game.renderer = new Renderer();
        if (window.DEBUG_MODE) console.log("Renderer created, getting scene...");
        
        // Access scene and camera directly rather than through getters
        this.game.scene = this.game.renderer.scene;
        this.game.camera = this.game.renderer.camera;
        
        if (window.DEBUG_MODE) console.log("Scene and camera references obtained");
        
        // Share camera reference with scene for easy access by other components
        this.game.scene.camera = this.game.camera;
        
        // Initialize essential components needed for the start screen
        if (window.DEBUG_MODE) console.log("Initializing essential components...");
        
        // Initialize physics
        this.game.physics = new Physics(this.game.scene);
        
        // Set camera reference in physics
        this.game.physics.setCamera(this.game.camera);
        
        // Initialize environment (essential components only)
        this.game.environment = new Environment(this.game.scene);
        
        // Initialize spaceship
        if (window.DEBUG_MODE) console.log("Creating spaceship...");
        this.game.spaceship = new Spaceship(this.game.scene);
        
        // Set spaceship reference in physics
        this.game.physics.setSpaceship(this.game.spaceship);
        
        // Set spaceship reference in environment (for VibeVerse portals)
        this.game.environment.setSpaceship(this.game.spaceship);
        
        // Initialize UI
        this.game.ui = new UI(this.game.spaceship, this.game.environment);
        
        // Share audio reference with UI for sound-based components
        this.game.ui.setAudio(this.game.audio);
        
        // Initialize controls last, as it depends on other components
        this.game.controls = new Controls(this.game.spaceship, this.game.physics, this.game.environment, this.game.ui);
        
        // Share controls reference with UI for bidirectional communication
        this.game.ui.setControls(this.game.controls);
        
        // Initialize settings
        if (window.DEBUG_MODE) console.log("Initializing settings...");
        this.game.ui.initializeSettings(this.game);
    }
    
    setupEventHandlers() {
        // Handle window resize
        window.addEventListener('resize', this.game.handleResize.bind(this.game));
        
        // Handle visibility change to pause/resume game
        document.addEventListener('visibilitychange', this.game.handleVisibilityChange.bind(this.game));
        
        // Handle keyboard events
        document.addEventListener('keydown', this.game.handleKeyDown.bind(this.game));
    }
    
    startDocked() {
        // Start the game with the spaceship docked at the stargate
        console.log("Starting game in docked state");
        
        if (this.game.spaceship) {
            // Start docked at the stargate - position is handled by spaceship.dock()
            if (!this.game.spaceship.isDocked) {
                console.log("Docking spaceship...");
                this.game.spaceship.dock();
            } else {
                console.log("Spaceship already docked");
            }
        } else {
            console.error("No spaceship found!");
        }
        
        // Set initial camera position for docked state
        if (this.game.camera) {
            this.game.camera.position.set(0, 1500, 0);
            console.log("Camera position set for docked state");
        }
        
        // Update docking system to reflect docked state
        if (this.game.controls && this.game.controls.dockingSystem) {
            // The docking system tracks the spaceship's docked state automatically
            this.game.controls.dockingSystem.isDocked = true;
            console.log("Docking system updated");
        }
        
        // Start the game UI
        if (this.game.ui && this.game.ui.stargateInterface) {
            console.log("Showing stargate UI...");
            this.game.ui.stargateInterface.showStargateUI();
        } else {
            console.error("No stargate interface found!", this.game.ui);
        }
    }
}