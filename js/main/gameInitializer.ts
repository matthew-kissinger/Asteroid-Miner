// gameInitializer.js - Game initialization logic

import * as THREE from 'three';
import { Renderer } from '../modules/renderer.ts';
import { Spaceship } from '../modules/spaceship';
import { Physics } from '../modules/physics';
import { Controls } from '../modules/controls.ts';
import { DEBUG_MODE } from '../globals/debug.ts';
import type { DockingSpaceship } from '../modules/controls/docking/types.ts';
// import { Environment } from '../modules/environment';
// import { UI } from '../modules/ui';
// import { AudioManager } from '../modules/audio/audio.ts';

type GameRenderer = {
    scene: THREE.Scene;
    camera: THREE.Camera;
};

type PhysicsSpaceship = Parameters<Physics['setSpaceship']>[0];

type GameEnvironment = {
    setSpaceship: (ship: PhysicsSpaceship) => void;
};

type GameSpaceship = PhysicsSpaceship & DockingSpaceship & {
    thrustPower: number;
    strafePower: number;
};

type GameUi = {
    setAudio: (audio: any) => Promise<void>;
    setControls: (controls: GameControls) => void;
    setCameraAndRenderer: (camera: any, renderer: any) => void;
    initializeSettings: (game: GameInitializerContext) => Promise<void>;
    setGameState: (gameState: any) => void;
    setWorld: (world: any) => void;
    setGameStateReference: (gameState: any) => void;
    stargateInterface?: { showStargateUI?: (() => void) | undefined };
    initializeUIComponents: () => Promise<void>; // Add this method
};

type GameControls = {
    dockingSystem?: { isDocked: boolean };
};

type GameInitializerContext = {
    audio?: any;
    renderer?: GameRenderer;
    scene?: THREE.Scene;
    camera?: THREE.Camera;
    physics?: Physics;
    environment?: GameEnvironment;
    spaceship?: GameSpaceship;
    ui?: GameUi;
    controls?: GameControls;
    world?: any;
    handleResize: () => void;
    handleVisibilityChange: () => void;
    handleKeyDown: (event: KeyboardEvent) => void;
};

export class GameInitializer {
    game: GameInitializerContext;

    constructor(game: GameInitializerContext) {
        this.game = game;
    }
    
    async initializeCore(): Promise<void> {
        // Create audio manager first but don't initialize yet
        if (DEBUG_MODE.enabled) console.log("Creating audio manager...");
        const { AudioManager } = await import('../modules/audio/audio.ts');
        this.game.audio = new AudioManager();
        
        // Initialize renderer first
        if (DEBUG_MODE.enabled) console.log("Creating renderer...");
        this.game.renderer = await Renderer.create();
        if (DEBUG_MODE.enabled) console.log("Renderer created, getting scene...");

        const renderer = this.game.renderer;
        
        // Access scene and camera directly rather than through getters
        this.game.scene = renderer.scene;
        this.game.camera = renderer.camera;
        
        if (DEBUG_MODE.enabled) console.log("Scene and camera references obtained");
        
        // Share camera reference with scene for easy access by other components
        const sceneWithCamera = this.game.scene as THREE.Scene & { camera?: THREE.Camera };
        sceneWithCamera.camera = this.game.camera;
        
        // Initialize essential components needed for the start screen
        if (DEBUG_MODE.enabled) console.log("Initializing essential components...");

        // Initialize physics with dependency injection
        const physics = new Physics(this.game.scene, {
            gameState: {
                isIntroSequenceActive: () => {
                    // Access game instance through this.game reference
                    return (this.game as any).introSequenceActive === true;
                }
            },
            inputAccessor: {
                getInputIntent: () => {
                    // Access global inputIntent (set by keyboard handler)
                    return (window as any).inputIntent;
                }
            },
            audioSystem: {
                playSound: (sound: string) => {
                    // Access audio system through game instance
                    if (this.game.audio && typeof this.game.audio.playSound === 'function') {
                        this.game.audio.playSound(sound);
                    }
                }
            }
        });
        this.game.physics = physics;
        
        // Set camera reference in physics
        physics.setCamera(this.game.camera);
        
        // Initialize environment (essential components only)
        const { Environment } = await import('../modules/environment.ts');
        const environment = new Environment(this.game.scene);
        this.game.environment = environment;
        
        // Initialize spaceship
        if (DEBUG_MODE.enabled) console.log("Creating spaceship...");
        const spaceship = new Spaceship(this.game.scene) as GameSpaceship;
        this.game.spaceship = spaceship;
        
        // Set spaceship reference in physics
        physics.setSpaceship(spaceship);
        
        // Set spaceship reference in environment (for VibeVerse portals)
        environment.setSpaceship(spaceship);
        
        // Initialize UI
        const { UI } = await import('../modules/ui.ts');
        this.game.ui = new UI(spaceship, environment);
        // Pass camera and renderer to UI for damage numbers and other visual effects
        this.game.ui.setCameraAndRenderer(this.game.camera, this.game.renderer);
        await this.game.ui.initializeUIComponents();

        // Share game state reference with UI for mobile HUD
        this.game.ui.setGameState(this.game);

        // Share world reference with UI for desktop HUD
        if (this.game.world) {
            this.game.ui.setWorld(this.game.world);
        }

        // Share audio reference with UI for sound-based components
        await this.game.ui.setAudio(this.game.audio);
        
        // Share game state reference with UI for intro sequence and FPS display
        this.game.ui.setGameStateReference(this.game);
        
        // Set game references for dependency injection in UI components
        const { setGameReference: setStargateHelpersRef } = await import('../modules/ui/components/stargate/helpers.ts');
        const { setGameReference: setSystemsViewRef } = await import('../modules/ui/components/stargate/systemsView.ts');
        const { setGameReference: setHudDisplaysRef } = await import('../modules/ui/components/hud/displays.ts');
        const { setGameReference: setHudHelpersRef } = await import('../modules/ui/components/hud/helpers.ts');
        const { setGameReference: setCustomSystemHelpersRef } = await import('../modules/ui/components/customSystem/helpers.ts');
        
        // Cast to any to avoid type mismatch - these modules only need specific properties
        setStargateHelpersRef(this.game as any);
        setSystemsViewRef(this.game as any);
        setHudDisplaysRef(this.game as any);
        setHudHelpersRef(this.game as any);
        setCustomSystemHelpersRef(this.game as any);
        
        // Initialize controls last, as it depends on other components
        this.game.controls = new Controls(spaceship, physics as any, environment as any, this.game.ui);
        
        // Share controls reference with UI for bidirectional communication
        this.game.ui.setControls(this.game.controls);
        
        // Initialize settings
        if (DEBUG_MODE.enabled) console.log("Initializing settings...");
        await this.game.ui.initializeSettings(this.game);
    }
    
    setupEventHandlers(): void {
        // Handle window resize
        window.addEventListener('resize', this.game.handleResize.bind(this.game));
        
        // Handle visibility change to pause/resume game
        document.addEventListener('visibilitychange', this.game.handleVisibilityChange.bind(this.game));
        
        // Handle keyboard events
        document.addEventListener('keydown', this.game.handleKeyDown.bind(this.game));
    }
    
    startDocked(): void {
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
            this.game.ui.stargateInterface.showStargateUI?.();
        } else {
            console.error("No stargate interface found!", this.game.ui);
        }
    }
}
