// soundPlayer.js - Sound effects playback with 3D audio and volume control
export class SoundPlayer {
    constructor(audioContextManager, audioLoader) {
        this.audioContextManager = audioContextManager;
        this.audioLoader = audioLoader;
        this.sfxVolume = 0.5; // Default sound effects volume
        this.muted = false;
        
        // Track active continuous sounds
        this.activeSounds = {
            laser: null,
            thrust: null,
            "mining-laser": null
        };
    }
    
    // Play a sound effect using Web Audio API
    playSound(name, userHasInteracted) {
        console.log(`Attempting to play sound: ${name}`);
        
        if (this.muted) {
            console.log(`Sound ${name} not played: audio is muted`);
            return;
        }
        
        if (!userHasInteracted) {
            console.log(`Sound ${name} not played: waiting for user interaction`);
            return;
        }
        
        const audioContext = this.audioContextManager.getContext();
        
        // Make sure AudioContext is running
        if (audioContext && audioContext.state === 'suspended') {
            this.audioContextManager.resumeAudioContext();
        }
        
        // Handle the case where the name is 'weapon' or similar, map to projectile sound
        if (name === 'weapon' || name === 'fire' || name === 'shoot') {
            console.log(`Mapping ${name} sound to projectile sound`);
            name = 'projectile';
            // Use 'laser' sound for projectile if projectile sound is not available
            const sounds = this.audioLoader.getAllSounds();
            if (!sounds.projectile && sounds.laser) {
                console.log("Using laser sound for projectile");
                sounds.projectile = sounds.laser;
            }
        }
        
        const soundBuffer = this.audioLoader.getSound(name);
        if (!soundBuffer) {
            console.warn(`Sound "${name}" not found in loaded sounds`);
            return;
        }
        
        try {
            // Handle looped sounds vs one-shot sounds
            if (name === 'laser' || name === 'thrust' || name === 'mining-laser') {
                // For continuous sounds, create and track the sound source node
                if (!this.activeSounds[name]) {
                    // Create source node for looping sound
                    const sourceNode = audioContext.createBufferSource();
                    sourceNode.buffer = soundBuffer;
                    sourceNode.loop = true;
                    
                    // Create gain node for volume control
                    const gainNode = audioContext.createGain();
                    gainNode.gain.value = this.sfxVolume * (name === 'thrust' ? 1.5 : 1.0);
                    
                    // Connect nodes: source -> gain -> destination
                    sourceNode.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    // Start playing
                    sourceNode.start(0);
                    
                    // Store references to these nodes for later control
                    this.activeSounds[name] = {
                        source: sourceNode,
                        gain: gainNode
                    };
                    
                    // Track nodes for garbage collection
                    this.audioContextManager.trackNode(sourceNode);
                    this.audioContextManager.trackNode(gainNode);
                }
            } else {
                // For one-shot sounds
                // Create source node
                const sourceNode = audioContext.createBufferSource();
                sourceNode.buffer = soundBuffer;
                
                // Create gain node for volume control
                const gainNode = audioContext.createGain();
                // Increase volume slightly for projectile sounds to make them more noticeable
                const volumeMultiplier = name === 'projectile' ? 0.7 : 0.5;
                gainNode.gain.value = this.sfxVolume * volumeMultiplier;
                
                // Connect nodes: source -> gain -> destination
                sourceNode.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                // Start playing (one-shot)
                sourceNode.start(0);
                
                // Set ended callback for cleanup
                sourceNode.onended = () => {
                    sourceNode._inactive = true;
                    gainNode._inactive = true;
                };
                
                // Track nodes for garbage collection
                this.audioContextManager.trackNode(sourceNode);
                this.audioContextManager.trackNode(gainNode);
                
                // Log successful playback
                console.log(`Started playback of one-shot sound: ${name}`);
            }
        } catch (err) {
            console.error(`Error playing sound ${name}:`, err);
        }
    }
    
    // Stop a continuous sound effect
    stopSound(name) {
        if (!this.activeSounds[name]) return;
        
        try {
            if (name === 'laser' || name === 'thrust' || name === 'mining-laser') {
                // For looping sounds
                if (this.activeSounds[name]) {
                    const nodes = this.activeSounds[name];
                    
                    // Stop the source node
                    if (nodes.source) {
                        try {
                            nodes.source.stop();
                        } catch (e) {
                            // Ignore errors if already stopped
                        }
                        nodes.source._inactive = true;
                    }
                    
                    // Mark gain node as inactive
                    if (nodes.gain) {
                        nodes.gain._inactive = true;
                    }
                    
                    // Clear reference
                    this.activeSounds[name] = null;
                }
            }
        } catch (err) {
            console.error(`Error stopping sound ${name}:`, err);
        }
    }
    
    // Set the volume for thrust sound based on thrust level
    setThrustVolume(thrustLevel) {
        if (!this.activeSounds.thrust || !this.activeSounds.thrust.gain) return;
        
        // Scale the volume based on thrust level
        const volume = Math.min(1.0, Math.max(0.1, thrustLevel)) * this.sfxVolume * 1.5;
        
        // Apply volume to gain node
        try {
            this.activeSounds.thrust.gain.gain.value = volume;
        } catch (err) {
            console.error("Error setting thrust volume:", err);
        }
    }
    
    // Play weapon firing sound - dedicated method for weapon sounds
    playWeaponSound(userHasInteracted) {
        console.log("Playing weapon firing sound");
        
        // Check usual conditions
        if (this.muted || !userHasInteracted) {
            return;
        }
        
        const audioContext = this.audioContextManager.getContext();
        
        // Make sure AudioContext is running
        if (audioContext && audioContext.state === 'suspended') {
            this.audioContextManager.resumeAudioContext();
        }
        
        // Make sure we have a projectile sound (use laser as fallback)
        const sounds = this.audioLoader.getAllSounds();
        if (!sounds.projectile && sounds.laser) {
            console.log("Using laser sound for projectile in playWeaponSound");
            sounds.projectile = sounds.laser;
        }
        
        if (!sounds.projectile) {
            console.warn("Projectile sound not found");
            return;
        }
        
        try {
            // Create source node
            const sourceNode = audioContext.createBufferSource();
            sourceNode.buffer = sounds.projectile;
            
            // Create gain node with higher volume for weapon sound
            const gainNode = audioContext.createGain();
            gainNode.gain.value = this.sfxVolume * 0.8; // Higher volume for weapon sounds
            
            // Connect nodes: source -> gain -> destination
            sourceNode.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Start playing
            sourceNode.start(0);
            
            // Set ended callback for cleanup
            sourceNode.onended = () => {
                sourceNode._inactive = true;
                gainNode._inactive = true;
            };
            
            // Track nodes for garbage collection
            this.audioContextManager.trackNode(sourceNode);
            this.audioContextManager.trackNode(gainNode);
            
            console.log("Weapon sound started playing");
        } catch (err) {
            console.error("Error playing weapon sound:", err);
        }
    }
    
    // Toggle mute for sound effects
    toggleMute() {
        this.muted = !this.muted;
        
        // Stop any active sound effects when muting
        if (this.muted) {
            this.stopSound('laser');
            this.stopSound('thrust');
            this.stopSound('mining-laser');
        }
        
        console.log(`Sound effects ${this.muted ? 'muted' : 'unmuted'}`);
        return this.muted;
    }
    
    // Set sound effects volume
    setVolume(volume) {
        this.sfxVolume = volume;
    }
    
    // Get sound effects volume
    getVolume() {
        return this.sfxVolume;
    }
    
    // Check if sound effects are muted
    isMuted() {
        return this.muted;
    }
    
    // Stop all active sounds
    stopAllSounds() {
        this.stopSound('laser');
        this.stopSound('thrust');
        this.stopSound('mining-laser');
    }
}