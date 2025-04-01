// audio.js - Handles game audio, both music and sound effects with improved resource management

import { getAbsolutePath } from '../utils/pathUtils.js';

export class AudioManager {
    constructor() {
        // Initialize Web Audio API context
        this.audioContext = null;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log("Web Audio API context created successfully");
        } catch (error) {
            console.error("Failed to create Web Audio API context:", error);
        }
        
        this.sounds = {}; // Stores decoded AudioBuffers
        this.soundSources = {}; // Tracks currently playing sound sources
        this.backgroundMusic = [];
        this.currentMusicIndex = 0;
        this.currentMusic = null;
        this.isMuted = false;
        this.thrustSound = null;
        this.music = []; // Store all background music tracks
        this.musicVolume = 0.21; // Reduced by 30% from 0.3
        this.sfxVolume = 0.5; // Default sound effects volume
        
        // Store active audio nodes
        this.activeNodes = new Set();
        
        // Track active continuous sounds
        this.activeSounds = {
            laser: null,
            thrust: null,
            "mining-laser": null
        };
        
        // Track if the user has interacted with the page (for autoplay policies)
        this.userHasInteracted = false;
        
        console.log("Initializing audio manager with Web Audio API...");
        
        // Set up compatibility layer for intro sequence
        this.initializeToneCompatibility();
        
        // Listen for user interaction to enable audio
        this.setupUserInteractionListener();
        
        // Set up garbage collection interval
        this.setupGarbageCollection();
    }
    
    // Set up regular garbage collection for unused audio nodes
    setupGarbageCollection() {
        // Clean up inactive nodes every 30 seconds
        this.gcInterval = setInterval(() => this.cleanupInactiveNodes(), 30000);
        console.log("Audio garbage collection scheduled");
    }
    
    // Clean up inactive audio nodes to prevent memory leaks
    cleanupInactiveNodes() {
        let count = 0;
        this.activeNodes.forEach(node => {
            // Check if node is inactive
            if (node._inactive || (node.disposed === true)) {
                this.activeNodes.delete(node);
                count++;
            }
        });
        
        if (count > 0) {
            console.log(`Audio manager: cleaned up ${count} inactive audio objects`);
        }
    }
    
    // Track an audio node for garbage collection
    trackNode(node) {
        if (node) {
            this.activeNodes.add(node);
        }
        return node;
    }
    
    // Initialize a minimal Tone.js compatibility layer for the intro sequence
    initializeToneCompatibility() {
        // Create a dummy masterEQ object that the intro sequence can connect to
        // This allows the intro sequence code to remain unchanged
        this.masterEQ = {
            // Dummy connect method that returns the input
            connect: function(node) {
                return node;
            }
        };
        
        console.log("Audio compatibility layer initialized for intro sequence");
    }
    
    // Initialize audio - load all sounds and music
    async initialize() {
        try {
            console.log("Loading audio files...");
            
            // Ensure audio context is resumed on first user interaction
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.resumeAudioContext();
            }
            
            // Check if the sound directories exist for music
            await this.checkSoundDirectories();
            
            // Load only the essential UI sounds first for faster startup
            await this.preDecodeEssentialSounds();
            
            // Load music in the background (non-blocking)
            this.loadBackgroundMusic().catch(error => {
                console.error("Error loading background music:", error);
            });
            
            console.log("Essential audio initialization complete");
            
            // Music will play automatically once the user interacts with the page
            // If the user has already interacted, we can play immediately
            if (this.userHasInteracted) {
                this.playBackgroundMusic();
            } else {
                console.log("Music playback waiting for user interaction.");
            }
            
            return true;
        } catch (error) {
            console.error("Error initializing audio:", error);
            return false;
        }
    }
    
    // Pre-decode only essential UI sounds for quick startup
    async preDecodeEssentialSounds() {
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
            
            // Schedule loading of remaining gameplay sounds in the background 
            // after a short delay to let the UI fully initialize
            setTimeout(() => {
                this.loadGameplaySounds();
            }, 1000);
            
        } catch (error) {
            console.error("Error pre-decoding essential sounds:", error);
            this.createDummySounds();
        }
    }
    
    // Load remaining gameplay sounds in the background
    async loadGameplaySounds() {
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
    
    // Pre-decode all sound effects using Web Audio API (legacy method, kept for compatibility)
    async preDecodeAllSoundEffects() {
        try {
            console.log("Using optimized sound loading path instead of preDecodeAllSoundEffects");
            // Load essential sounds first
            await this.preDecodeEssentialSounds();
            // Then load gameplay sounds
            await this.loadGameplaySounds();
        } catch (error) {
            console.error("Error pre-decoding sound effects:", error);
            this.createDummySounds();
        }
    }
    
    // Load and decode a sound file using Web Audio API
    async loadAndDecodeSound(name, url) {
        try {
            console.log(`Loading and decoding sound: ${name} from ${url}`);
            
            // Fetch the audio file
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch sound ${name}: ${response.status} ${response.statusText}`);
            }
            
            // Get the audio data as an ArrayBuffer
            const audioData = await response.arrayBuffer();
            
            // Decode the audio data
            const audioBuffer = await this.audioContext.decodeAudioData(audioData);
            
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
    
    // Resume audio context on user interaction
    resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume().then(() => {
                console.log("AudioContext resumed successfully");
            }).catch(error => {
                console.error("Failed to resume AudioContext:", error);
            });
        }
    }
    
    // Check if the required sound directories exist and notify user if they don't
    async checkSoundDirectories() {
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
    
    // Show a notification to the user when a directory is missing
    showDirectoryMissingNotification(directory) {
        console.warn(`Directory not found: ${directory}`);
        
        // Create a notification element
        const notification = document.createElement('div');
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%)';
        notification.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        notification.style.color = '#ff4400';
        notification.style.padding = '10px 15px';
        notification.style.borderRadius = '5px';
        notification.style.zIndex = '9999';
        notification.style.fontSize = '14px';
        notification.style.maxWidth = '80%';
        notification.style.textAlign = 'center';
        
        // Add message
        notification.innerHTML = `
            <div style="margin-bottom: 5px;">
                <strong>Note:</strong> ${directory} directory not found.
            </div>
            <div style="font-size: 12px; color: #aaa;">
                Game will continue with limited audio. This is normal when running on GitHub Pages.
            </div>
        `;
        
        // Add close button
        const closeButton = document.createElement('div');
        closeButton.style.position = 'absolute';
        closeButton.style.top = '5px';
        closeButton.style.right = '10px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.color = '#aaa';
        closeButton.textContent = '✕';
        closeButton.addEventListener('click', () => notification.remove());
        notification.appendChild(closeButton);
        
        // Add to document
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.style.opacity = '0';
                notification.style.transition = 'opacity 0.5s ease';
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        notification.remove();
                    }
                }, 500);
            }
        }, 5000);
    }
    
    // Set up a listener to detect the first user interaction
    setupUserInteractionListener() {
        const handleInteraction = () => {
            if (!this.userHasInteracted) {
                this.userHasInteracted = true;
                console.log("User interaction detected, enabling audio playback");
                
                // Resume AudioContext if it's suspended
                this.resumeAudioContext();
                
                // Start playing background music once the user interacts
                this.playBackgroundMusic();
                
                // Clean up the event listeners
                document.removeEventListener('click', handleInteraction);
                document.removeEventListener('keydown', handleInteraction);
                document.removeEventListener('touchstart', handleInteraction);
            }
        };
        
        // Add event listeners for user interactions
        document.addEventListener('click', handleInteraction);
        document.addEventListener('keydown', handleInteraction);
        document.addEventListener('touchstart', handleInteraction);
        
        // Additional handling specifically for mobile devices
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            console.log("Mobile device detected - adding additional audio handlers");
            
            // Force audio context resumption on specific UI interactions for mobile
            const forceAudioResume = () => {
                this.userHasInteracted = true;
                
                // Resume AudioContext if it's suspended
                this.resumeAudioContext();
                
                // Ensure background music is playing
                if (this.music.length > 0 && !this.muted) {
                    const currentTrack = this.music[0];
                    if (currentTrack.paused) {
                        console.log("Mobile: Forcing background music playback");
                        this.playBackgroundMusic();
                    }
                }
            };
            
            // Add these handlers to common UI interaction points
            document.addEventListener('touchend', forceAudioResume, {passive: true});
            
            // Attach to specific game buttons when they're created
            const attachToButtons = () => {
                // Check for UI elements every 500ms for 5 seconds after page load
                let attempts = 0;
                const interval = setInterval(() => {
                    attempts++;
                    
                    // Find and attach to important action buttons
                    const actionButtons = document.querySelectorAll('button');
                    if (actionButtons.length > 0) {
                        console.log(`Mobile: Found ${actionButtons.length} buttons to attach audio handlers`);
                        actionButtons.forEach(button => {
                            if (!button.hasAudioHandler) {
                                button.addEventListener('touchend', forceAudioResume, {passive: true});
                                button.hasAudioHandler = true;
                            }
                        });
                    }
                    
                    // Stop checking after 10 attempts (5 seconds)
                    if (attempts >= 10) {
                        clearInterval(interval);
                    }
                }, 500);
            };
            
            // Run initially and also after document is fully loaded
            attachToButtons();
            if (document.readyState === 'complete') {
                attachToButtons();
            } else {
                window.addEventListener('load', attachToButtons);
            }
        }
    }
    
    // Load all music files from the soundtrack folder
    async loadBackgroundMusic() {
        try {
            console.log("Loading soundtrack files...");
            
            // Directly use the exact soundtrack files from the user's folder
            const soundtrackFiles = [
                this.getPath('sounds/soundtrack/The Sound of Lightyears.wav'),
                this.getPath('sounds/soundtrack/Aurora Drifts.wav'),
                this.getPath('sounds/soundtrack/Tidal Lock.wav'),
                this.getPath('sounds/soundtrack/Solar Drift.wav'),
                this.getPath('sounds/soundtrack/Orbital Resonance.wav'),
                this.getPath('sounds/soundtrack/Starlight Trails.wav'),
                this.getPath('sounds/soundtrack/Orbit Bloom.wav')
            ];
            
            console.log(`Loading ${soundtrackFiles.length} soundtrack files...`);
            
            // Load the music files
            await this.loadMusicFiles(soundtrackFiles);
            
        } catch (error) {
            console.error("Error loading background music:", error);
            
            // Create a dummy audio element if loading fails
            console.warn("Falling back to a dummy silent track");
            const dummyAudio = new Audio();
            dummyAudio.loop = true;
            this.music.push(dummyAudio);
        }
    }
    
    // Helper method to check if a file exists
    async checkFileExists(path) {
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
    
    // Helper method to handle paths correctly for both local and GitHub Pages deployment
    getPath(relativePath) {
        return getAbsolutePath(relativePath);
    }
    
    // Fisher-Yates shuffle algorithm for arrays
    shuffleArray(array) {
        let currentIndex = array.length, randomIndex;
        
        // While there remain elements to shuffle
        while (currentIndex > 0) {
            // Pick a remaining element
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            
            // Swap it with the current element
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        
        return array;
    }
    
    // Helper method to load music files
    async loadMusicFiles(files) {
        // Note: Currently keeping music as HTML5 Audio for compatibility
        // Could be updated to Web Audio API in the future
        console.log(`Found ${files.length} music files:`, files);
        
        // Create a copy of the files array and shuffle it to randomize the order
        const shuffledFiles = [...files];
        this.shuffleArray(shuffledFiles);
        
        console.log(`Randomized playlist order:`, shuffledFiles.map(file => file.split('/').pop()));
        
        // Check if any files exist before trying to load them
        let anyFilesExist = false;
        for (const file of shuffledFiles) {
            const fileExists = await this.checkFileExists(file);
            if (fileExists.exists) {
                anyFilesExist = true;
                break;
            }
        }
        
        if (!anyFilesExist) {
            console.warn("None of the music files could be found. Using fallback audio.");
            this.createDummySounds();
            return;
        }
        
        // Load each music track in the randomized order
        for (const file of shuffledFiles) {
            try {
                console.log(`Attempting to load audio file: ${file}`);
                const audio = new Audio(file);
                audio.loop = false; // We'll handle looping manually for playlist functionality
                audio.volume = this.musicVolume;
                
                // Add ended event to play the next track
                audio.addEventListener('ended', () => this.playNextTrack());
                
                // Add error handler
                audio.addEventListener('error', (e) => {
                    console.error(`Error loading music file ${file}:`, e);
                });
                
                // Add a load event to confirm successful loading
                audio.addEventListener('canplaythrough', () => {
                    console.log(`Successfully loaded music file: ${file}`);
                });
                
                this.music.push(audio);
                console.log(`Added music track to playlist: ${file}`);
            } catch (err) {
                console.error(`Failed to load music file ${file}:`, err);
            }
        }
        
        console.log(`Loaded ${this.music.length} music tracks in randomized order`);
        
        // If we haven't found any music, create a dummy audio element
        // so that the music system doesn't break
        if (this.music.length === 0) {
            console.warn("No music files could be loaded, creating a dummy track");
            const dummyAudio = new Audio();
            dummyAudio.loop = true;
            this.music.push(dummyAudio);
        }
    }
    
    // Create dummy sounds if loading fails
    createDummySounds() {
        console.warn("Creating dummy silent AudioBuffers as fallback");
        
        const soundEffects = ['laser', 'thrust', 'explosion', 'boink', 'phaserUp', 'phaserDown', 'mining-laser', 'projectile'];
        
        for (const name of soundEffects) {
            // Create a silent buffer (0.1 seconds of silence)
            if (this.audioContext) {
                try {
                    const buffer = this.audioContext.createBuffer(
                        2, // stereo
                        this.audioContext.sampleRate * 0.1, // 0.1 seconds
                        this.audioContext.sampleRate
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
    
    // Play the next music track in the playlist
    playNextTrack() {
        if (this.music.length === 0) return;
        
        // Move current track to the end of the playlist
        const currentTrack = this.music.shift();
        this.music.push(currentTrack);
        
        // Play the next track
        this.playBackgroundMusic();
    }
    
    // Start playing background music
    playBackgroundMusic() {
        if (this.music.length === 0 || this.muted) return;
        
        // Only attempt to play if the user has interacted with the page
        if (!this.userHasInteracted) {
            console.log("Deferring music playback until user interaction");
            return;
        }
        
        // Get the track at the front of the queue
        const track = this.music[0];
        console.log(`Starting to play track: ${track.src.split('/').pop()}`);
        
        // Reset the track to the beginning
        track.currentTime = 0;
        
        // Attempt to play the track
        const playPromise = track.play();
        
        // Handle play promise (modern browsers return a promise from play())
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log("Started playing background music");
                })
                .catch(err => {
                    if (err.name === 'NotAllowedError') {
                        console.log("Autoplay prevented by browser. Music will play after user interaction.");
                    } else {
                        console.error("Error playing background music:", err);
                    }
                });
        }
    }
    
    // Play a sound effect using Web Audio API
    playSound(name) {
        console.log(`Attempting to play sound: ${name}`);
        
        if (this.muted) {
            console.log(`Sound ${name} not played: audio is muted`);
            return;
        }
        
        if (!this.userHasInteracted) {
            console.log(`Sound ${name} not played: waiting for user interaction`);
            return;
        }
        
        // Make sure AudioContext is running
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.resumeAudioContext();
        }
        
        // Handle the case where the name is 'weapon' or similar, map to projectile sound
        if (name === 'weapon' || name === 'fire' || name === 'shoot') {
            console.log(`Mapping ${name} sound to projectile sound`);
            name = 'projectile';
            // Use 'laser' sound for projectile if projectile sound is not available
            if (!this.sounds.projectile && this.sounds.laser) {
                console.log("Using laser sound for projectile");
                this.sounds.projectile = this.sounds.laser;
            }
        }
        
        if (!this.sounds[name]) {
            console.warn(`Sound "${name}" not found in loaded sounds`);
            return;
        }
        
        try {
            // Handle looped sounds vs one-shot sounds
            if (name === 'laser' || name === 'thrust' || name === 'mining-laser') {
                // For continuous sounds, create and track the sound source node
                if (!this.activeSounds[name]) {
                    // Create source node for looping sound
                    const sourceNode = this.audioContext.createBufferSource();
                    sourceNode.buffer = this.sounds[name];
                    sourceNode.loop = true;
                    
                    // Create gain node for volume control
                    const gainNode = this.audioContext.createGain();
                    gainNode.gain.value = this.sfxVolume * (name === 'thrust' ? 1.5 : 1.0);
                    
                    // Connect nodes: source -> gain -> destination
                    sourceNode.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    
                    // Start playing
                    sourceNode.start(0);
                    
                    // Store references to these nodes for later control
                    this.activeSounds[name] = {
                        source: sourceNode,
                        gain: gainNode
                    };
                    
                    // Track nodes for garbage collection
                    this.trackNode(sourceNode);
                    this.trackNode(gainNode);
                }
            } else {
                // For one-shot sounds
                // Create source node
                const sourceNode = this.audioContext.createBufferSource();
                sourceNode.buffer = this.sounds[name];
                
                // Create gain node for volume control
                const gainNode = this.audioContext.createGain();
                // Increase volume slightly for projectile sounds to make them more noticeable
                const volumeMultiplier = name === 'projectile' ? 0.7 : 0.5;
                gainNode.gain.value = this.sfxVolume * volumeMultiplier;
                
                // Connect nodes: source -> gain -> destination
                sourceNode.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                // Start playing (one-shot)
                sourceNode.start(0);
                
                // Set ended callback for cleanup
                sourceNode.onended = () => {
                    sourceNode._inactive = true;
                    gainNode._inactive = true;
                };
                
                // Track nodes for garbage collection
                this.trackNode(sourceNode);
                this.trackNode(gainNode);
                
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
    
    // Toggle mute for all audio
    toggleMute() {
        this.muted = !this.muted;
        
        // Adjust music volume
        for (const track of this.music) {
            track.volume = this.muted ? 0 : this.musicVolume;
        }
        
        // Stop any active sound effects
        if (this.muted) {
            this.stopSound('laser');
            this.stopSound('thrust');
            this.stopSound('mining-laser');
        }
        
        console.log(`Audio ${this.muted ? 'muted' : 'unmuted'}`);
        return this.muted;
    }
    
    // Clean up resources when destroying the audio manager
    cleanup() {
        console.log("Cleaning up AudioManager resources...");
        
        // Stop all active sounds
        this.stopSound('laser');
        this.stopSound('thrust');
        this.stopSound('mining-laser');
        
        // Pause all music
        for (const track of this.music) {
            track.pause();
        }
        
        // Clear intervals
        if (this.gcInterval) {
            clearInterval(this.gcInterval);
            this.gcInterval = null;
        }
        
        // Close audio context
        if (this.audioContext) {
            this.audioContext.close().then(() => {
                console.log("AudioContext closed successfully");
            }).catch(error => {
                console.error("Error closing AudioContext:", error);
            });
        }
        
        // Remove event listeners
        document.removeEventListener('click', this.handleInteraction);
        document.removeEventListener('keydown', this.handleInteraction);
        document.removeEventListener('touchstart', this.handleInteraction);
        
        console.log("AudioManager cleanup complete");
    }
    
    // Play weapon firing sound - dedicated method for weapon sounds
    playWeaponSound() {
        console.log("Playing weapon firing sound");
        
        // Check usual conditions
        if (this.muted || !this.userHasInteracted) {
            return;
        }
        
        // Make sure AudioContext is running
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.resumeAudioContext();
        }
        
        // Make sure we have a projectile sound (use laser as fallback)
        if (!this.sounds.projectile && this.sounds.laser) {
            console.log("Using laser sound for projectile in playWeaponSound");
            this.sounds.projectile = this.sounds.laser;
        }
        
        if (!this.sounds.projectile) {
            console.warn("Projectile sound not found");
            return;
        }
        
        try {
            // Create source node
            const sourceNode = this.audioContext.createBufferSource();
            sourceNode.buffer = this.sounds.projectile;
            
            // Create gain node with higher volume for weapon sound
            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = this.sfxVolume * 0.8; // Higher volume for weapon sounds
            
            // Connect nodes: source -> gain -> destination
            sourceNode.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Start playing
            sourceNode.start(0);
            
            // Set ended callback for cleanup
            sourceNode.onended = () => {
                sourceNode._inactive = true;
                gainNode._inactive = true;
            };
            
            // Track nodes for garbage collection
            this.trackNode(sourceNode);
            this.trackNode(gainNode);
            
            console.log("Weapon sound started playing");
        } catch (err) {
            console.error("Error playing weapon sound:", err);
        }
    }
} 