// introSequence.ts - Manages the cinematic Star Dreadnought intro sequence

import type { Group, Vector3, Euler, Object3D, Camera, Scene } from 'three';
import { debugLog } from '../globals/debug.ts';
import { StarDreadnought } from './environment/starDreadnought.ts';
import { createIntroSoundEffects } from './intro/audio/soundEffects.ts';
import { loadDialogueWavs } from './intro/audio/dialogueManager.ts';
import { PortalEffect } from './intro/effects/portalEffect.ts';
import { DialogueSystem } from './intro/ui/dialogueSystem.ts';
import { updateArrivalPhase } from './intro/animation/arrivalPhase.ts';
import { updateDeparturePhase } from './intro/animation/departurePhase.ts';

type IntroSoundEffect = {
    play?: () => void;
    dispose?: () => void;
};

type IntroSoundMap = Record<string, IntroSoundEffect>;

type AudioManagerLike = {
    muted?: boolean;
    sfxVolume?: number;
    audioContext?: { state: string };
    resumeAudioContext?: () => void;
    initialize?: () => Promise<void>;
};

interface PortalEffectLike {
    getPortalGroup: () => Group;
    updatePortalEffect: () => void;
    setOpacity: (opacity: number) => void;
    setScale: (scale: number) => void;
    setPosition: (position: Vector3) => void;
    setRotation: (rotation: Euler) => void;
    setVisible: (visible: boolean) => void;
    dispose: () => void;
}

interface StarDreadnoughtLike {
    ship: Group;
    teleportBeamActive: boolean;
    setEnginesPower: (power: number) => void;
    activateTeleportBeam: () => void;
    deactivateTeleportBeam: () => void;
    updateTeleportBeam: (progress: number) => void;
    destroy?: () => void;
    dispose?: () => void;
}

interface VectorLike {
    set: (x: number, y: number, z: number) => void;
    x: number;
    y: number;
    z: number;
}

interface EulerLike {
    set: (x: number, y: number, z: number) => void;
}

interface MeshLike {
    position: VectorLike;
    rotation: EulerLike;
    visible?: boolean;
    add?: (obj: Object3D) => void;
    remove?: (obj: Object3D) => void;
}

interface SpaceshipLike {
    mesh?: MeshLike;
    thrust?: {
        forward: boolean;
        backward: boolean;
        left: boolean;
        right: boolean;
        boost: boolean;
    };
    velocity?: Vector3;
    isDocked?: boolean;
    hull?: number;
    shield?: number;
    fuel?: number;
}

interface DialogueSystemLike {
    initialize: (dialogueWavs: HTMLAudioElement[], audioManager?: AudioManagerLike | null) => void;
    setupDialogueUI: () => void;
    typeNextDialogue: (sequenceTime?: number, isPlaying?: boolean) => boolean;
    cleanup: () => void;
}

export type IntroSequenceAnimationContext = {
    portalEffect: PortalEffectLike;
    starDreadnought: StarDreadnoughtLike;
    camera: Camera;
    spaceship: SpaceshipLike | null;
    introSounds: IntroSoundMap;
    flashOverlay: (maxOpacity?: number) => void;
    finalPlayerPosition?: Vector3;
    playerShieldEffect?: Object3D | null;
    shieldPulseTime?: number;
};

type GameWindowWithInstance = Window & {
    gameInstance?: {
        spaceship?: SpaceshipLike;
    };
};

export class IntroSequence {
    scene: Scene | null;
    camera: Camera | null;
    spaceship: SpaceshipLike | null;
    audio: AudioManagerLike | null;
    isPlaying: boolean;
    sequenceTime: number;
    onComplete: (() => void) | null;
    skipEnabled: boolean;
    initialCameraPosition: Vector3 | null;
    initialCameraRotation: Euler | null;
    starDreadnought: StarDreadnoughtLike | null;
    portalEffect: PortalEffectLike | null;
    overlay: HTMLDivElement | null;
    dialogueSystem: DialogueSystemLike | null;
    introSounds: IntroSoundMap;
    dialogueWavs: HTMLAudioElement[];
    skipButton: HTMLDivElement | null;
    lastTime: number;
    animationFrameId: number | null;
    finalPlayerPosition?: Vector3;
    playerShieldEffect?: Object3D | null;
    shieldPulseTime?: number;
    skipHandler?: (event: KeyboardEvent) => void;

    constructor(scene: Scene, camera: Camera, spaceship: SpaceshipLike | null, audioManager: AudioManagerLike | null) {
        this.scene = scene;
        this.camera = camera;
        this.spaceship = spaceship;
        this.audio = audioManager;
        this.isPlaying = false;
        this.sequenceTime = 0;
        this.onComplete = null;
        this.skipEnabled = false; // Only enable skip after first playthrough
        
        // Save initial camera position
        this.initialCameraPosition = null;
        this.initialCameraRotation = null;
        
        // Create StarDreadnought instance
        this.starDreadnought = new StarDreadnought(scene) as unknown as StarDreadnoughtLike;
        
        // Setup portal effect
        this.portalEffect = new PortalEffect() as unknown as PortalEffectLike;
        
        // Overlay for flash effects
        this.overlay = null;
        this.setupOverlay();
        
        // Setup dialogue system
        this.dialogueSystem = new DialogueSystem() as unknown as DialogueSystemLike;
        
        // Custom sound effects
        this.introSounds = {};
        
        // Dialogue WAV files
        this.dialogueWavs = [];
        
        this.skipButton = null;
        this.lastTime = 0;
        this.animationFrameId = null;
        
        debugLog("Intro sequence initialized");
        
        // Load dialogue WAV files
        this.dialogueWavs = loadDialogueWavs() as HTMLAudioElement[];
        
        // Create custom Tone.js sound effects
        this.introSounds = createIntroSoundEffects(this.audio) as IntroSoundMap;
        
        // Initialize dialogue system
        this.dialogueSystem.initialize(this.dialogueWavs, this.audio);
    }
    
    setupOverlay(): void {
        // Create a DOM overlay for the flash effect
        this.overlay = document.createElement('div');
        this.overlay.id = 'intro-overlay';
        this.overlay.classList.add('intro-overlay');
        
        // Add to DOM but hide initially
        document.body.appendChild(this.overlay);
    }
    
    startSequence(onComplete?: () => void): void {
        if (this.isPlaying) return;
        
        debugLog("Starting intro sequence...");
        this.isPlaying = true;
        this.sequenceTime = 0;
        this.onComplete = onComplete || null;

        const camera = this.camera as Camera;
        const scene = this.scene as Scene;
        const portalEffect = this.portalEffect as PortalEffectLike;
        const starDreadnought = this.starDreadnought as StarDreadnoughtLike;
        
        // Store initial camera state to restore player camera after sequence
        this.initialCameraPosition = camera.position.clone();
        this.initialCameraRotation = camera.rotation.clone();
        
        // Position camera for initial view of portal forming
        camera.position.set(0, 6000, 12000);
        camera.lookAt(30000, 5000, 0); // Look at where portal will appear
        
        // Hide player ship during sequence
        if (this.spaceship && this.spaceship.mesh) {
            this.spaceship.mesh.visible = false;
            
            // Disable ship thrusters to prevent any movement
            if (this.spaceship.thrust) {
                this.spaceship.thrust.forward = false;
                this.spaceship.thrust.backward = false;
                this.spaceship.thrust.left = false;
                this.spaceship.thrust.right = false;
                this.spaceship.thrust.boost = false;
            }
            
            // Make sure velocity is zero
            if (this.spaceship.velocity) {
                this.spaceship.velocity.set(0, 0, 0);
            }
        }
        
        // Add portal to scene
        scene.add(portalEffect.getPortalGroup());
        
        // Position the star dreadnought initially outside the scene
        starDreadnought.ship.position.set(35000, 5000, 0); // Off-screen
        starDreadnought.ship.rotation.y = Math.PI / 2; // Face toward center
        starDreadnought.ship.visible = false;
        
        // Start sequence animation
        this.animate = this.animate.bind(this);
        this.lastTime = performance.now();
        requestAnimationFrame(this.animate);
        
        // Setup skip functionality
        this.setupSkipHandler();
        
        // Setup dialogue UI
        this.dialogueSystem?.setupDialogueUI();
        
        // Start first dialogue line
        setTimeout(() => {
            this.dialogueSystem?.typeNextDialogue(this.sequenceTime, this.isPlaying);
        }, 2000);
        
        // Play warp sound
        if (this.introSounds.warp) {
            this.introSounds.warp.play?.();
        }
    }
    
    animate(currentTime: number): void {
        if (!this.isPlaying) return;
        
        // Slower pace for more sublime experience
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1) * 0.4; // 60% slower
        this.lastTime = currentTime;
        
        // Update sequence timer
        this.sequenceTime += deltaTime;
        
        // Just TWO phases - arrival and departure
        if (this.sequenceTime < 14.0) {
            // Phase 1: Portal, ship arrival and player deployment (0-14s)
            const context = this.createAnimationContext();
            updateArrivalPhase(this.sequenceTime / 14.0, context);
        } else if (this.sequenceTime < 24.0) {
            // Phase 2: Ship departure (14-24s)
            const context = this.createAnimationContext();
            updateDeparturePhase((this.sequenceTime - 14.0) / 10.0, context);
        } else {
            // Sequence complete
            this.completeSequence();
            return;
        }
        
        requestAnimationFrame(this.animate);
    }
    
    /**
     * Create context object for animation phases
     * @returns Context containing all necessary references
     */
    createAnimationContext(): IntroSequenceAnimationContext {
        return {
            portalEffect: this.portalEffect as PortalEffectLike,
            starDreadnought: this.starDreadnought as StarDreadnoughtLike,
            camera: this.camera as Camera,
            spaceship: this.spaceship,
            introSounds: this.introSounds,
            flashOverlay: this.flashOverlay.bind(this),
            finalPlayerPosition: this.finalPlayerPosition,
            playerShieldEffect: this.playerShieldEffect,
            shieldPulseTime: this.shieldPulseTime
        };
    }
    
    flashOverlay(maxOpacity = 0.6): void {
        if (!this.overlay) return;
        
        // Flash overlay effect
        this.overlay.style.opacity = maxOpacity.toString();
        
        // Fade out after flash
        setTimeout(() => {
            if (this.overlay) {
                this.overlay.style.opacity = '0';
            }
        }, 300);
    }
    
    setupSkipHandler(): void {
        // Add skip button
        const skipButton = document.createElement('div');
        skipButton.id = 'skip-intro-button';
        skipButton.textContent = 'SKIP INTRO';
        skipButton.classList.add('intro-skip-button');
        
        skipButton.addEventListener('click', () => {
            this.skipSequence();
        });
        
        document.body.appendChild(skipButton);
        this.skipButton = skipButton;
    }
    
    skipSequence(): void {
        debugLog("Skipping intro sequence");
        
        // Position ship exactly where the intro would have positioned it
        if (this.spaceship && this.spaceship.mesh) {
            // Position where the dreadnought would have deployed the ship
            // Dreadnought ends at (22000, 5000, 0), ship is 2000 units below
            this.spaceship.mesh.position.set(22000, 3000, 0);
            this.spaceship.mesh.rotation.set(0, 0, 0);
            
            // Make sure ship is NOT docked
            this.spaceship.isDocked = false;
            this.spaceship.mesh.visible = true;
            
            // Ensure ship has proper health and fuel values
            if (this.spaceship.hull !== undefined && this.spaceship.hull <= 0) {
                debugLog("Fixing spaceship hull from", this.spaceship.hull, "to 100");
                this.spaceship.hull = 100;
            }
            if (this.spaceship.shield !== undefined && this.spaceship.shield <= 0) {
                debugLog("Fixing spaceship shield from", this.spaceship.shield, "to 50");
                this.spaceship.shield = 50;
            }
            if (this.spaceship.fuel !== undefined && this.spaceship.fuel <= 0) {
                debugLog("Fixing spaceship fuel from", this.spaceship.fuel, "to 100");
                this.spaceship.fuel = 100;
            }
        }
        
        // End the sequence immediately
        this.completeSequence();
        
        // Don't show stargate UI - player should be in space after skipping
        // Just ensure the ship is properly set to undocked state
        const gameWindow = window as GameWindowWithInstance;
        if (gameWindow.gameInstance && gameWindow.gameInstance.spaceship) {
            gameWindow.gameInstance.spaceship.isDocked = false;
            debugLog("Ship set to undocked state after skip");
            
            // Double-check health values on the global instance too
            if (gameWindow.gameInstance.spaceship.hull !== undefined && gameWindow.gameInstance.spaceship.hull <= 0) {
                debugLog("Fixing global spaceship hull to 100");
                gameWindow.gameInstance.spaceship.hull = 100;
            }
            if (gameWindow.gameInstance.spaceship.fuel !== undefined && gameWindow.gameInstance.spaceship.fuel <= 0) {
                debugLog("Fixing global spaceship fuel to 100");
                gameWindow.gameInstance.spaceship.fuel = 100;
            }
        }
    }
    
    completeSequence(): void {
        debugLog("Intro sequence complete");
        this.isPlaying = false;

        const scene = this.scene as Scene;
        const portalEffect = this.portalEffect as PortalEffectLike;
        const starDreadnought = this.starDreadnought as StarDreadnoughtLike;
        
        // Remove warp tunnel from scene
        scene.remove(portalEffect.getPortalGroup());
        
        // Hide dreadnought
        starDreadnought.ship.visible = false;
        
        // Enable skip button for next time
        this.skipEnabled = true;
        
        // Remove shield effect from player
        if (this.playerShieldEffect && this.spaceship?.mesh) {
            this.spaceship.mesh.remove?.(this.playerShieldEffect);
            this.playerShieldEffect = null;
        }
        
        // Remove skip button if it exists
        if (this.skipButton) {
            document.body.removeChild(this.skipButton);
            this.skipButton = null;
        }
        
        // Remove overlay from DOM completely
        if (this.overlay) {
            document.body.removeChild(this.overlay);
            this.overlay = null;
        }
        
        // Clean up dialogue system
        this.dialogueSystem?.cleanup();
        
        // Make sure player ship is visible but DO NOT reset position
        if (this.spaceship && this.spaceship.mesh) {
            this.spaceship.mesh.visible = true;
            
            // IMPORTANT: Make sure ship is properly undocked
            if (this.spaceship.isDocked) {
                debugLog("Forcing ship to undocked state after intro sequence");
                this.spaceship.isDocked = false;
            }
            
            // Log the final player position for debugging
            debugLog("Player final position:", 
                this.spaceship.mesh.position.x, 
                this.spaceship.mesh.position.y, 
                this.spaceship.mesh.position.z
            );
        }
        
        // Call completion callback if provided
        if (this.onComplete && typeof this.onComplete === 'function') {
            // Use setTimeout to make sure this executes after the animation frame
            setTimeout(() => {
                debugLog("Executing intro sequence completion callback");
                this.onComplete?.();
            }, 100);
        }
    }

    /**
     * Clean up resources when intro sequence is no longer needed
     */
    destroy(): void {
        // Cancel animation frame if running
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Clean up dialogue system
        this.dialogueSystem?.cleanup();
        
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
        
        // Remove skip handler
        document.removeEventListener('keydown', this.skipHandler as EventListener);
        
        // Clean up portal effect
        if (this.portalEffect) {
            this.portalEffect.dispose();
        }
        
        // Dispose of star dreadnought resources
        if (this.starDreadnought && typeof this.starDreadnought.destroy === 'function') {
            this.starDreadnought.destroy();
        }
        
        // Dispose of Tone.js sound effects
        if (this.introSounds) {
            Object.values(this.introSounds).forEach(sound => {
                if (sound.dispose && typeof sound.dispose === 'function') {
                    sound.dispose();
                }
            });
            this.introSounds = {};
        }
        
        // Clear references to help GC
        this.scene = null;
        this.camera = null;
        this.spaceship = null;
        this.audio = null;
        this.starDreadnought = null;
        this.portalEffect = null;
        this.dialogueSystem = null;
        this.dialogueWavs = [];
    }
}
