// startupSequence.js - Asset preloads and intro flow management

import * as THREE from 'three';
import { IntroSequence } from '../modules/introSequence.js';

type AudioContextLike = {
    state: string;
};

type AudioManagerLike = {
    audioContext?: AudioContextLike;
    resumeAudioContext: () => void;
    initialize: () => Promise<void>;
};

type StartScreenLike = {
    show: () => void;
};

type CombatDisplayLike = {
    hide: () => void;
    show: () => void;
};

type StargateInterfaceLike = {
    hide: () => void;
};

type UiLike = {
    startScreen?: StartScreenLike;
    showError?: (message: string) => void;
    combatDisplay?: CombatDisplayLike;
    stargateInterface?: StargateInterfaceLike;
    hideUI: () => void;
    showUI: () => void;
};

type EnemySystemLike = {
    freezeAllEnemies: () => void;
    unfreezeAllEnemies: () => void;
};

type CombatLike = {
    world?: unknown;
    playerEntity?: unknown;
    createPlayerReferenceEntity?: () => void;
};

type SpaceshipLike = {
    mesh?: {
        position: { set: (x: number, y: number, z: number) => void; x: number; y: number; z: number };
        rotation: { set: (x: number, y: number, z: number) => void };
    };
    isDocked: boolean;
    undock: () => void;
};

type StartupGameContext = {
    audio?: AudioManagerLike;
    ui?: UiLike;
    boundAnimate?: () => void;
    combat?: CombatLike;
    scene?: unknown;
    camera?: unknown;
    spaceship?: SpaceshipLike;
    initializeObjectPools?: () => void;
    preWarmBasicShaders?: () => void;
    startDocked?: () => void;
    introSequenceActive?: boolean;
};

type IntroSequenceLike = {
    onComplete?: () => void;
    startSequence: (onComplete?: () => void) => void;
};

export class StartupSequence {
    game: StartupGameContext;
    introSequence: IntroSequenceLike | null;
    introSequenceActive: boolean;

    constructor(game: StartupGameContext) {
        this.game = game;
        this.introSequence = null;
        this.introSequenceActive = false;
    }
    
    // Initialize game in sequence, showing start screen first and loading non-essentials after
    async initializeGameSequence(): Promise<void> {
        try {
            
            // Add a small delay to let browser stabilize after page load
            await new Promise<void>(resolve => setTimeout(resolve, 100));
            
            // Resume audio context if needed (browser autoplay policy)
            if (this.game.audio && this.game.audio.audioContext && this.game.audio.audioContext.state === 'suspended') {
                try {
                    this.game.audio.resumeAudioContext();
                } catch (e) {
                }
            }
            
            // Show the start screen immediately
            if (this.game.ui && this.game.ui.startScreen) {
                this.game.ui.startScreen.show();
            } else {
                this.fallbackToDefaultBehavior();
            }
            
            // Start game loop with warm-up frames
            if (this.game.boundAnimate) {
                requestAnimationFrame(this.game.boundAnimate);
            }
            
            // Initialize remaining systems in the background after start screen is shown
            this.initializeRemainingSystemsAsync();
            
        } catch (error) {
            
            // Show error in UI if possible
            if (this.game.ui && this.game.ui.showError) {
                const message = error instanceof Error ? error.message : String(error);
                this.game.ui.showError("Failed to initialize game: " + message);
            } else {
                const message = error instanceof Error ? error.message : String(error);
                alert("Failed to initialize game: " + message);
            }
        }
    }
    
    // Initialize remaining systems asynchronously after showing the start screen
    async initializeRemainingSystemsAsync(): Promise<void> {
        try {
            // Start loading audio in the background
            this.loadAudioAsync();
            
            // Initialize combat systems asynchronously
            if (!this.game.combat) {
                const { Combat } = await import('../modules/combat.js');
                this.game.combat = new Combat(this.game.scene as THREE.Scene, this.game.spaceship);
                
                // Ensure the ECS world in combat is properly initialized
                if (!this.game.combat.world) {
                    // Add a check to ensure the player entity exists
                    setTimeout(() => {
                        if (this.game.combat && this.game.combat.world && this.game.combat.playerEntity) {
                        } else if (this.game.combat) {
                            console.warn("Combat ECS world or player entity not available after delay, recreating...");
                            if (this.game.combat.createPlayerReferenceEntity) {
                                this.game.combat.createPlayerReferenceEntity();
                            }
                        }
                    }, 1000);
                }
            }
            
            // Initialize common object pools after start screen is shown
            setTimeout(() => {
                if (this.game.initializeObjectPools) {
                    this.game.initializeObjectPools();
                }
                
                // Pre-warm essential shaders and projectile assets after start screen is shown
                if (this.game.preWarmBasicShaders) {
                    this.game.preWarmBasicShaders();
                }
            }, 100);
        } catch (error) {
        }
    }
    
    // Load audio asynchronously after showing the start screen
    async loadAudioAsync(): Promise<void> {
        try {
            if (this.game.audio) {
                // Initialize audio in the background
                this.game.audio.initialize().then(() => {
                }).catch(() => {
                });
            }
        } catch (error) {
        }
    }
    
    fallbackToDefaultBehavior(): void {
        // Start the game immediately with default settings
        if (this.game.startDocked) {
            this.game.startDocked();
        }
    }
    
    initIntroSequence(): void {
        // Initialize the intro sequence module
        this.introSequence = new IntroSequence(
            this.game.scene,
            this.game.camera,
            this.game.spaceship,
            this.game.audio  // Pass audio manager as 4th parameter
        );
        
        // Set the completion callback
        this.introSequence.onComplete = () => {
            this.completeIntroSequence();
        };
    }
    
    startIntroSequence(): void {
        if (!this.introSequence) {
            this.initIntroSequence();
        }
        
        this.introSequenceActive = true;
        if (typeof this.game.introSequenceActive !== 'undefined') {
            this.game.introSequenceActive = true;
        }
        
        // Disable all enemies during intro sequence
        if (this.game.combat && this.game.combat.world) {
            const enemySystem = (this.game.combat.world as { enemySystem?: EnemySystemLike }).enemySystem;
            if (enemySystem) {
                enemySystem.freezeAllEnemies();
            }
        }
        
        // Hide UI elements during intro
        if (this.game.ui && this.game.ui.combatDisplay) {
            this.game.ui.combatDisplay.hide();
        }
        
        // Player controls are automatically disabled during intro via introSequenceActive flag
        // The InputHandler checks window.game.introSequenceActive
        
        // Hide the stargate UI immediately when intro starts
        if (this.game.ui && this.game.ui.stargateInterface) {
            this.game.ui.stargateInterface.hide();
        }
        
        // Also hide the entire UI during intro
        if (this.game.ui) {
            this.game.ui.hideUI();
        }
        
        // Position spaceship for intro
        if (this.game.spaceship && this.game.spaceship.mesh) {
            this.game.spaceship.mesh.position.set(0, 0, 50);
            this.game.spaceship.mesh.rotation.set(0, 0, 0);
        }
        
        // Start the intro sequence
        const introSequence = this.introSequence;
        if (!introSequence) return;
        introSequence.startSequence(() => {
            this.completeIntroSequence();
        });
    }
    
    completeIntroSequence(): void {
        this.introSequenceActive = false;
        if (typeof this.game.introSequenceActive !== 'undefined') {
            this.game.introSequenceActive = false;
        }
        
        // Mark intro as played so it doesn't play again
        localStorage.setItem('introPlayed', 'true');
        
        // Re-enable enemies after intro
        if (this.game.combat && this.game.combat.world) {
            const enemySystem = (this.game.combat.world as { enemySystem?: EnemySystemLike }).enemySystem;
            if (enemySystem) {
                enemySystem.unfreezeAllEnemies();
            }
        }
        
        // Ensure stargate UI is hidden after intro
        if (this.game.ui && this.game.ui.stargateInterface) {
            this.game.ui.stargateInterface.hide();
        }
        
        // Start game based on whether player wants to be docked or not
        // Always start undocked after intro
        if (this.game.ui) {
            this.game.ui.showUI();
        }
        
        // After intro, player should stay where they were deployed
        // Only ensure the spaceship is undocked, don't reset position
        if (this.game.spaceship) {
            // Make sure spaceship is undocked
            if (this.game.spaceship.isDocked) {
                this.game.spaceship.undock();
            }
            // Log current position for debugging
            if (this.game.spaceship.mesh) {
                console.log("Player position after intro:", 
                    this.game.spaceship.mesh.position.x,
                    this.game.spaceship.mesh.position.y,
                    this.game.spaceship.mesh.position.z
                );
            }
        }
        
        // Player controls are automatically re-enabled when introSequenceActive is set to false
        // The InputHandler checks window.game.introSequenceActive
        
        // Show combat display after intro
        if (this.game.ui && this.game.ui.combatDisplay) {
            this.game.ui.combatDisplay.show();
        }
        
        // Emit event for other systems
        if (window.mainMessageBus) {
            window.mainMessageBus.publish('intro.completed', {});
        }
        
    }
}
