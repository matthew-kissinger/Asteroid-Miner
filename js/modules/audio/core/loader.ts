// loader.ts - Audio file loading, decoding, and caching
import { getAbsolutePath } from '../../../utils/pathUtils.js';
import { AudioContextManager } from './context.js';

export interface SoundMap {
    [key: string]: AudioBuffer | null;
}

export class AudioLoader {
    private audioContextManager: AudioContextManager;
    private sounds: SoundMap = {}; // Stores decoded AudioBuffers
    
    constructor(audioContextManager: AudioContextManager) {
        this.audioContextManager = audioContextManager;
    }
    
    // Helper method to handle paths correctly for both local and GitHub Pages deployment
    getPath(relativePath: string): string {
        return getAbsolutePath(relativePath);
    }
    
    // Load and decode a sound file using Web Audio API
    async loadAndDecodeSound(name: string, url: string): Promise<AudioBuffer> {
        try {
            console.log(`Loading and decoding sound: ${name} from ${url}`);
            
            const audioContext = this.audioContextManager.getContext();
            if (!audioContext) {
                throw new Error("AudioContext not available");
            }
            
            // Fetch the audio file
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch sound ${name}: ${response.status} ${response.statusText}`);
            }
            
            // Get the audio data as an ArrayBuffer
            const audioData = await response.arrayBuffer();
            
            // Decode the audio data
            const audioBuffer = await audioContext.decodeAudioData(audioData);
            
            // Store the decoded buffer
            this.sounds[name] = audioBuffer;
            
            console.log(`Sound ${name} loaded and decoded successfully`);
            return audioBuffer;
        } catch (error) {
            console.error(`Error loading and decoding sound ${name}:`, error);
            
            // Create a dummy buffer for this sound to prevent errors
            this.sounds[name] = null;
            throw error;
        }
    }
    
    // Pre-decode only essential UI sounds for quick startup
    async preDecodeEssentialSounds(): Promise<void> {
        try {
            console.log("Pre-decoding essential UI sounds...");
            
            // List of essential sounds needed for UI interaction
            const essentialSounds = [
                { name: 'boink', path: 'sounds/effects/boink.wav' },
                { name: 'phaserUp', path: 'sounds/effects/phaserUp.wav' },
                { name: 'phaserDown', path: 'sounds/effects/phaserDown.wav' },
            ];
            
            // Create a promise for each sound to load
            const loadPromises = essentialSounds.map(sound => 
                this.loadAndDecodeSound(sound.name, this.getPath(sound.path))
            );
            
            // Wait for all essential sounds to be loaded and decoded
            await Promise.all(loadPromises);
            
            console.log("Essential UI sounds pre-decoded successfully");
            
        } catch (error) {
            console.error("Error pre-decoding essential sounds:", error);
            this.createDummySounds();
        }
    }
    
    // Load remaining gameplay sounds in the background
    async loadGameplaySounds(): Promise<void> {
        try {
            console.log("Loading gameplay sounds in background...");
            
            // List of gameplay sounds to load
            const gameplaySounds = [
                { name: 'thrust', path: 'sounds/effects/thrust.wav' },
                { name: 'laser', path: 'sounds/effects/laser.wav' },
                { name: 'mining-laser', path: 'sounds/effects/mining-laser.wav' },
                { name: 'explosion', path: 'sounds/effects/explosion.wav' },
            ];
            
            // Load sounds sequentially to avoid overwhelming the audio decoder
            for (const sound of gameplaySounds) {
                try {
                    await this.loadAndDecodeSound(sound.name, this.getPath(sound.path));
                } catch (err) {
                    console.warn(`Could not load gameplay sound ${sound.name}:`, err);
                }
            }
            
            // Explicitly set up projectile sound using the laser sound
            // This is needed for weapon firing
            if (this.sounds.laser && !this.sounds.projectile) {
                console.log("Setting up projectile sound using laser sound buffer");
                this.sounds.projectile = this.sounds.laser;
            }
            
            console.log("All gameplay sounds loaded successfully");
        } catch (error) {
            console.error("Error loading gameplay sounds:", error);
        }
    }
    
    // Create dummy sounds if loading fails
    createDummySounds(): void {
        console.warn("Creating dummy silent AudioBuffers as fallback");
        
        const soundEffects = ['laser', 'thrust', 'explosion', 'boink', 'phaserUp', 'phaserDown', 'mining-laser', 'projectile'];
        const audioContext = this.audioContextManager.getContext();
        
        for (const name of soundEffects) {
            // Create a silent buffer (0.1 seconds of silence)
            if (audioContext) {
                try {
                    const buffer = audioContext.createBuffer(
                        2, // stereo
                        audioContext.sampleRate * 0.1, // 0.1 seconds
                        audioContext.sampleRate
                    );
                    this.sounds[name] = buffer;
                } catch (error) {
                    console.error(`Failed to create dummy buffer for ${name}:`, error);
                    this.sounds[name] = null;
                }
            } else {
                this.sounds[name] = null;
            }
        }
    }
    
    // Helper method to check if a file exists
    async checkFileExists(path: string): Promise<{ path: string; exists: boolean }> {
        console.log(`Checking if file/directory exists: ${path}`);
        try {
            // Try to fetch the resource
            const response = await fetch(path, { 
                method: 'HEAD',
                cache: 'no-cache' // Avoid caching issues
            });
            
            console.log(`Fetch response for ${path}: status=${response.status}, ok=${response.ok}`);
            
            return { 
                path, 
                exists: response.ok 
            };
        } catch (err) {
            console.error(`Error checking if file exists (${path}):`, err);
            return { path, exists: false };
        }
    }
    
    // Check if the required sound directories exist and notify user if they don't
    async checkSoundDirectories(): Promise<boolean> {
        // Check for sounds directory
        const soundsDirExists = await this.checkFileExists(this.getPath('sounds'));
        if (!soundsDirExists.exists) {
            console.warn("Sounds directory not found, but will attempt to load files directly anyway.");
        }
        
        // Check for soundtrack directory
        const soundtrackDirExists = await this.checkFileExists(this.getPath('sounds/soundtrack'));
        if (!soundtrackDirExists.exists) {
            console.warn("Soundtrack directory not found, but will attempt to load files directly anyway.");
        }
        
        // Check for sound effects directory
        const effectsDirExists = await this.checkFileExists(this.getPath('sounds/effects'));
        if (!effectsDirExists.exists) {
            console.warn("Sound effects directory not found. Some sounds may not play correctly.");
        }
        
        // Always return true to continue loading process
        return true;
    }
    
    // Get a loaded sound buffer
    getSound(name: string): AudioBuffer | null {
        return this.sounds[name];
    }
    
    // Get all loaded sounds
    getAllSounds(): SoundMap {
        return this.sounds;
    }
}
