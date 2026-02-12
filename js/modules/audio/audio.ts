// audio.ts - Main AudioManager facade that delegates to specialized modules
import { AudioContextManager } from './core/context.ts';
import { AudioLoader, SoundMap } from './core/loader.ts';
import { MusicPlaylist } from './music/playlist.ts';
import { MusicPlayer } from './music/player.ts';
import { SoundPlayer } from './effects/soundPlayer.ts';
import { UISoundGenerator } from './effects/uiSounds.ts';
import { AmbientAlarms } from './effects/ambientSounds.ts';
import { MobileAudioEnabler } from './mobile/enabler.ts';
import { mainMessageBus } from '../../globals/messageBus.ts';
import { debugLog } from '../../globals/debug.js';

export class AudioManager {
    private audioContextManager: AudioContextManager;
    private audioLoader: AudioLoader;
    private musicPlaylist: MusicPlaylist;
    private musicPlayer: MusicPlayer;
    private soundPlayer: SoundPlayer;
    private mobileEnabler: MobileAudioEnabler;
    private ambientAlarms: AmbientAlarms | null = null;
    private uiSoundUnsubs: (() => void)[] = [];
    private buttonClickHandler: ((e: Event) => void) | null = null;

    // Exposed properties for compatibility
    public sounds: SoundMap;
    public soundSources: Record<string, any> = {}; // Legacy compatibility
    public backgroundMusic: any[] = []; // Legacy compatibility
    public currentMusicIndex: number = 0; // Legacy compatibility
    public currentMusic: any = null; // Legacy compatibility
    public music: HTMLAudioElement[];
    public activeNodes: Set<any>;
    public activeSounds: Record<string, any>;
    
    // Compatibility layer for intro sequence
    private masterEQ: any;
    
    constructor() {
        // Initialize core components
        this.audioContextManager = new AudioContextManager();
        this.audioLoader = new AudioLoader(this.audioContextManager);
        this.musicPlaylist = new MusicPlaylist();
        this.musicPlayer = new MusicPlayer(this.musicPlaylist);
        this.soundPlayer = new SoundPlayer(this.audioContextManager, this.audioLoader);
        const ctx = this.audioContextManager.getContext();
        if (ctx) {
            const uiSoundGenerator = new UISoundGenerator(ctx, () => this.soundPlayer.getVolume());
            this.soundPlayer.setUISoundGenerator(uiSoundGenerator);
            this.ambientAlarms = new AmbientAlarms(uiSoundGenerator, () => this.soundPlayer.isMuted());
        }
        this.mobileEnabler = new MobileAudioEnabler(this.audioContextManager, this.musicPlayer);
        
        // Exposed properties for compatibility
        this.sounds = this.audioLoader.getAllSounds();
        this.music = this.musicPlaylist.getTracks();
        this.activeNodes = (this.audioContextManager as any).activeNodes;
        this.activeSounds = this.soundPlayer.activeSounds;
        
        // Set up compatibility layer for intro sequence
        this.masterEQ = this.audioContextManager.initializeToneCompatibility();
        
        debugLog("Initializing audio manager with Web Audio API...");
    }
    
    // Getter/setter for volume properties
    get isMuted(): boolean {
        return this.soundPlayer.isMuted() || this.musicPlayer.isMuted();
    }
    
    set isMuted(value: boolean) {
        // Legacy setter - use toggleMute() instead
        if (value !== this.isMuted) {
            this.toggleMute();
        }
    }
    
    get muted(): boolean {
        return this.isMuted;
    }
    
    set muted(value: boolean) {
        this.isMuted = value;
    }
    
    get musicVolume(): number {
        return this.musicPlayer.getVolume();
    }
    
    set musicVolume(value: number) {
        this.musicPlayer.setVolume(value);
    }
    
    get sfxVolume(): number {
        return this.soundPlayer.getVolume();
    }
    
    set sfxVolume(value: number) {
        this.soundPlayer.setVolume(value);
    }
    
    get userHasInteracted(): boolean {
        return this.mobileEnabler.hasUserInteracted();
    }
    
    get audioContext(): AudioContext | null {
        return this.audioContextManager.getContext();
    }
    
    // Initialize audio - load all sounds and music
    async initialize(): Promise<boolean> {
        try {
            debugLog("Loading audio files...");
            
            // Ensure audio context is resumed on first user interaction
            const context = this.audioContext;
            if (context && context.state === 'suspended') {
                this.audioContextManager.resumeAudioContext();
            }
            
            // Check if the sound directories exist for music
            await this.audioLoader.checkSoundDirectories();
            
            // Load only the essential UI sounds first for faster startup
            await this.audioLoader.preDecodeEssentialSounds();
            
            // Load music in the background (non-blocking)
            this.musicPlaylist.loadBackgroundMusic().catch(error => {
                console.error("Error loading background music:", error);
            });
            
            debugLog("Essential audio initialization complete");
            
            // Music will play automatically once the user interacts with the page
            // If the user has already interacted, we can play immediately
            if (this.userHasInteracted) {
                this.musicPlayer.playBackgroundMusic(true);
            } else {
                debugLog("Music playback waiting for user interaction.");
            }
            
            // Schedule loading of remaining gameplay sounds in the background 
            // after a short delay to let the UI fully initialize
            setTimeout(() => {
                this.audioLoader.loadGameplaySounds();
            }, 1000);

            // Wire synthesized UI/stargate/trading sounds to MessageBus events
            this.uiSoundUnsubs.push(
                mainMessageBus.subscribe('player.docked', () => { this.playSound('stargate-dock'); }),
                mainMessageBus.subscribe('player.undocked', () => { this.playSound('stargate-undock'); }),
                mainMessageBus.subscribe('stargate.warpStart', () => { this.playSound('stargate-warp'); }),
                mainMessageBus.subscribe('trading.resourceSold', () => { this.playSound('sell'); }),
                mainMessageBus.subscribe('mining.asteroidDepleted', () => { this.playSound('mining-complete'); }),
                mainMessageBus.subscribe('player.shieldRecharged', () => { this.playSound('shield-recharge'); })
            );

            // UI button click sound (delegated)
            this.buttonClickHandler = (e: Event) => {
                const target = (e.target as Element)?.closest?.('button');
                if (target) this.playSound('ui-click');
            };
            document.addEventListener('click', this.buttonClickHandler, true);

            return true;
        } catch (error) {
            console.error("Error initializing audio:", error);
            return false;
        }
    }
    
    // Legacy method for compatibility
    async preDecodeAllSoundEffects(): Promise<void> {
        debugLog("Using optimized sound loading path instead of preDecodeAllSoundEffects");
        await this.audioLoader.preDecodeEssentialSounds();
        await this.audioLoader.loadGameplaySounds();
    }
    
    // Resume audio context on user interaction
    resumeAudioContext(): Promise<void> {
        return this.audioContextManager.resumeAudioContext();
    }
    
    // Start playing background music
    playBackgroundMusic(): void {
        this.musicPlayer.playBackgroundMusic(this.userHasInteracted);
    }
    
    // Play the next music track in the playlist
    playNextTrack(): void {
        this.musicPlayer.playNextTrack(this.userHasInteracted);
    }
    
    // Play a sound effect
    playSound(name: string): void {
        this.soundPlayer.playSound(name, this.userHasInteracted);
    }

    /** Legacy: play sound by name with optional volume (used by trading UI). */
    playSoundEffect(name: string, _volume?: number): void {
        this.playSound(name);
    }

    /** Update ambient warning alarms (low fuel / low hull). Call from game loop with 0–100 percentages. */
    updateAmbientAlarms(fuelPercent: number, hullPercent: number): void {
        this.ambientAlarms?.update(fuelPercent, hullPercent);
    }
    
    // Stop a continuous sound effect
    stopSound(name: string): void {
        this.soundPlayer.stopSound(name);
    }
    
    // Set the volume for thrust sound based on thrust level
    setThrustVolume(thrustLevel: number): void {
        this.soundPlayer.setThrustVolume(thrustLevel);
    }
    
    // Play weapon firing sound
    playWeaponSound(): void {
        this.soundPlayer.playWeaponSound(this.userHasInteracted);
    }
    
    // Toggle mute for all audio
    toggleMute(): boolean {
        const soundMuted = this.soundPlayer.toggleMute();
        const musicMuted = this.musicPlayer.toggleMute();
        
        const overallMuted = soundMuted || musicMuted;
        debugLog(`Audio ${overallMuted ? 'muted' : 'unmuted'}`);
        return overallMuted;
    }
    
    // Track an audio node for garbage collection (legacy compatibility)
    trackNode(node: any): any {
        return this.audioContextManager.trackNode(node);
    }
    
    // Clean up inactive audio nodes (legacy compatibility)
    cleanupInactiveNodes(): void {
        this.audioContextManager.cleanupInactiveNodes();
    }
    
    // Setup garbage collection (legacy compatibility)
    setupGarbageCollection(): void {
        // Already handled in audioContextManager constructor
        debugLog("Garbage collection already set up in context manager");
    }
    
    // Setup user interaction listener (legacy compatibility)
    setupUserInteractionListener(): void {
        // Already handled in mobileEnabler constructor
        debugLog("User interaction listener already set up in mobile enabler");
    }
    
    // Initialize tone compatibility (legacy compatibility)
    initializeToneCompatibility(): any {
        return this.masterEQ;
    }
    
    // Clean up resources when destroying the audio manager
    cleanup(): void {
        debugLog("Cleaning up AudioManager resources...");

        for (const unsub of this.uiSoundUnsubs) unsub();
        this.uiSoundUnsubs.length = 0;
        if (this.buttonClickHandler) {
            document.removeEventListener('click', this.buttonClickHandler, true);
            this.buttonClickHandler = null;
        }

        // Stop all active sounds
        this.soundPlayer.stopAllSounds();
        
        // Pause all music
        this.musicPlayer.pauseAll();
        
        // Clean up mobile enabler
        this.mobileEnabler.cleanup();
        
        // Clean up audio context
        this.audioContextManager.cleanup();
        
        debugLog("AudioManager cleanup complete");
    }
}
