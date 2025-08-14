// audio.js - Main AudioManager facade that delegates to specialized modules
import { AudioContext } from './core/context.js';
import { AudioLoader } from './core/loader.js';
import { MusicPlaylist } from './music/playlist.js';
import { MusicPlayer } from './music/player.js';
import { SoundPlayer } from './effects/soundPlayer.js';
import { MobileAudioEnabler } from './mobile/enabler.js';

export class AudioManager {
    constructor() {
        // Initialize core components
        this.audioContextManager = new AudioContext();
        this.audioLoader = new AudioLoader(this.audioContextManager);
        this.musicPlaylist = new MusicPlaylist();
        this.musicPlayer = new MusicPlayer(this.musicPlaylist);
        this.soundPlayer = new SoundPlayer(this.audioContextManager, this.audioLoader);
        this.mobileEnabler = new MobileAudioEnabler(this.audioContextManager, this.musicPlayer);
        
        // Exposed properties for compatibility
        this.sounds = this.audioLoader.getAllSounds();
        this.soundSources = {}; // Legacy compatibility
        this.backgroundMusic = []; // Legacy compatibility
        this.currentMusicIndex = 0; // Legacy compatibility
        this.currentMusic = null; // Legacy compatibility
        this.music = this.musicPlaylist.getTracks();
        this.activeNodes = this.audioContextManager.activeNodes;
        this.activeSounds = this.soundPlayer.activeSounds;
        
        // Set up compatibility layer for intro sequence
        this.masterEQ = this.audioContextManager.initializeToneCompatibility();
        
        console.log("Initializing audio manager with Web Audio API...");
    }
    
    // Getter/setter for volume properties
    get isMuted() {
        return this.soundPlayer.isMuted() || this.musicPlayer.isMuted();
    }
    
    set isMuted(value) {
        // Legacy setter - use toggleMute() instead
        if (value !== this.isMuted) {
            this.toggleMute();
        }
    }
    
    get muted() {
        return this.isMuted;
    }
    
    set muted(value) {
        this.isMuted = value;
    }
    
    get musicVolume() {
        return this.musicPlayer.getVolume();
    }
    
    set musicVolume(value) {
        this.musicPlayer.setVolume(value);
    }
    
    get sfxVolume() {
        return this.soundPlayer.getVolume();
    }
    
    set sfxVolume(value) {
        this.soundPlayer.setVolume(value);
    }
    
    get userHasInteracted() {
        return this.mobileEnabler.hasUserInteracted();
    }
    
    get audioContext() {
        return this.audioContextManager.getContext();
    }
    
    // Initialize audio - load all sounds and music
    async initialize() {
        try {
            console.log("Loading audio files...");
            
            // Ensure audio context is resumed on first user interaction
            if (this.audioContext && this.audioContext.state === 'suspended') {
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
            
            console.log("Essential audio initialization complete");
            
            // Music will play automatically once the user interacts with the page
            // If the user has already interacted, we can play immediately
            if (this.userHasInteracted) {
                this.musicPlayer.playBackgroundMusic(true);
            } else {
                console.log("Music playback waiting for user interaction.");
            }
            
            // Schedule loading of remaining gameplay sounds in the background 
            // after a short delay to let the UI fully initialize
            setTimeout(() => {
                this.audioLoader.loadGameplaySounds();
            }, 1000);
            
            return true;
        } catch (error) {
            console.error("Error initializing audio:", error);
            return false;
        }
    }
    
    // Legacy method for compatibility
    async preDecodeAllSoundEffects() {
        console.log("Using optimized sound loading path instead of preDecodeAllSoundEffects");
        await this.audioLoader.preDecodeEssentialSounds();
        await this.audioLoader.loadGameplaySounds();
    }
    
    // Resume audio context on user interaction
    resumeAudioContext() {
        return this.audioContextManager.resumeAudioContext();
    }
    
    // Start playing background music
    playBackgroundMusic() {
        this.musicPlayer.playBackgroundMusic(this.userHasInteracted);
    }
    
    // Play the next music track in the playlist
    playNextTrack() {
        this.musicPlayer.playNextTrack(this.userHasInteracted);
    }
    
    // Play a sound effect
    playSound(name) {
        this.soundPlayer.playSound(name, this.userHasInteracted);
    }
    
    // Stop a continuous sound effect
    stopSound(name) {
        this.soundPlayer.stopSound(name);
    }
    
    // Set the volume for thrust sound based on thrust level
    setThrustVolume(thrustLevel) {
        this.soundPlayer.setThrustVolume(thrustLevel);
    }
    
    // Play weapon firing sound
    playWeaponSound() {
        this.soundPlayer.playWeaponSound(this.userHasInteracted);
    }
    
    // Toggle mute for all audio
    toggleMute() {
        const soundMuted = this.soundPlayer.toggleMute();
        const musicMuted = this.musicPlayer.toggleMute();
        
        const overallMuted = soundMuted || musicMuted;
        console.log(`Audio ${overallMuted ? 'muted' : 'unmuted'}`);
        return overallMuted;
    }
    
    // Track an audio node for garbage collection (legacy compatibility)
    trackNode(node) {
        return this.audioContextManager.trackNode(node);
    }
    
    // Clean up inactive audio nodes (legacy compatibility)
    cleanupInactiveNodes() {
        this.audioContextManager.cleanupInactiveNodes();
    }
    
    // Setup garbage collection (legacy compatibility)
    setupGarbageCollection() {
        // Already handled in audioContextManager constructor
        console.log("Garbage collection already set up in context manager");
    }
    
    // Setup user interaction listener (legacy compatibility)
    setupUserInteractionListener() {
        // Already handled in mobileEnabler constructor
        console.log("User interaction listener already set up in mobile enabler");
    }
    
    // Initialize tone compatibility (legacy compatibility)
    initializeToneCompatibility() {
        return this.masterEQ;
    }
    
    // Clean up resources when destroying the audio manager
    cleanup() {
        console.log("Cleaning up AudioManager resources...");
        
        // Stop all active sounds
        this.soundPlayer.stopAllSounds();
        
        // Pause all music
        this.musicPlayer.pauseAll();
        
        // Clean up mobile enabler
        this.mobileEnabler.cleanup();
        
        // Clean up audio context
        this.audioContextManager.cleanup();
        
        console.log("AudioManager cleanup complete");
    }
}