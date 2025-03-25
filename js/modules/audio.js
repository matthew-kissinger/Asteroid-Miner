// audio.js - Handles game audio, both music and sound effects with improved resource management

import { getAbsolutePath } from '../utils/pathUtils.js';

export class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.backgroundMusic = [];
        this.currentMusicIndex = 0;
        this.currentMusic = null;
        this.isMuted = false;
        this.thrustSound = null;
        this.music = []; // Store all background music tracks
        this.musicVolume = 0.21; // Reduced by 30% from 0.3
        this.sfxVolume = 0.5; // Default sound effects volume
        
        // Store active audio elements
        this.activeNodes = new Set();
        
        // Track active continuous sounds
        this.activeSounds = {
            laser: null,
            thrust: null,
            "mining-laser": null
        };
        
        // Track if the user has interacted with the page (for autoplay policies)
        this.userHasInteracted = false;
        
        console.log("Initializing audio manager with WAV-based sound effects...");
        
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
            
            // Check if the sound directories exist for music
            await this.checkSoundDirectories();
            
            // First, load the background music
            await this.loadBackgroundMusic();
            
            // Then load the sound effects from WAV files
            this.createSoundEffects();
            
            console.log("Audio initialization complete");
            
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
    
    // Create sound effects using WAV files
    createSoundEffects() {
        try {
            console.log("Loading WAV sound effects...");
            
            // Create individual sound effects
            this.createThrustSound();
            this.createLaserSound();
            this.createExplosionSound();
            this.createBoinkSound();
            this.createPhaserUpSound();
            this.createPhaserDownSound();
            
            console.log("WAV sound effects loaded successfully");
        } catch (error) {
            console.error("Error loading WAV sound effects:", error);
            this.createDummySounds();
        }
    }
    
    // Create dummy sounds if WAV loading fails
    createDummySounds() {
        console.warn("Creating dummy silent audio elements as fallback");
        
        const soundEffects = ['laser', 'thrust', 'explosion', 'boink', 'phaserUp', 'phaserDown', 'mining-laser'];
        
        for (const name of soundEffects) {
            const dummyAudio = new Audio();
            dummyAudio.loop = name === 'laser' || name === 'thrust' || name === 'mining-laser';
            this.sounds[name] = dummyAudio;
        }
    }
    
    // Load thruster sound WAV file
    createThrustSound() {
        try {
            const thrustSound = new Audio(this.getPath('sounds/effects/thrust.wav'));
            thrustSound.loop = true;
            thrustSound.volume = this.sfxVolume * 0.5; // Default volume
            
            // Store the sound
            this.sounds.thrust = thrustSound;
            
            console.log("Loaded thrust sound WAV file");
        } catch (error) {
            console.error("Error loading thrust sound WAV:", error);
            // Create a silent dummy sound as fallback
            this.sounds.thrust = new Audio();
            this.sounds.thrust.loop = true;
        }
    }
    
    // Load laser sound WAV file
    createLaserSound() {
        try {
            // Main laser sound (continuous firing)
            const laserSound = new Audio(this.getPath('sounds/effects/laser.wav'));
            laserSound.loop = true;
            laserSound.volume = this.sfxVolume * 0.5;
            
            // Store the sound
            this.sounds.laser = laserSound;
            
            // Load mining laser sound
            const miningLaserSound = new Audio(this.getPath('sounds/effects/mining-laser.wav'));
            miningLaserSound.loop = true;
            miningLaserSound.volume = this.sfxVolume * 0.5;
            
            // Store mining laser sound
            this.sounds['mining-laser'] = miningLaserSound;
            
            // Create projectile sound for single shots (uses laser.wav but plays it once)
            this.sounds.projectile = {
                play: () => {
                    if (this.muted) return;
                    
                    // Create a new instance to allow overlapping sounds
                    const projectileSound = new Audio(this.getPath('sounds/effects/laser.wav'));
                    projectileSound.volume = this.sfxVolume * 0.6;
                    projectileSound.loop = false;
                    projectileSound.play().catch(err => {
                        console.warn(`Error playing projectile sound:`, err);
                    });
                }
            };
            
            console.log("Loaded laser sound WAV files");
        } catch (error) {
            console.error("Error loading laser sound WAV:", error);
            // Create silent dummy sounds as fallback
            this.sounds.laser = new Audio();
            this.sounds.laser.loop = true;
            this.sounds['mining-laser'] = new Audio();
            this.sounds['mining-laser'].loop = true;
            this.sounds.projectile = { play: () => {} };
        }
    }
    
    // Load explosion sound WAV file
    createExplosionSound() {
        try {
            // Load the sound file
            const explosionSound = new Audio(this.getPath('sounds/effects/explosion.wav'));
            explosionSound.volume = this.sfxVolume;
            
            // Store the sound with a play method that creates a new instance
            // This allows multiple explosions to play simultaneously
            this.sounds.explosion = {
                play: () => {
                    if (this.muted) return;
                    
                    const sound = explosionSound.cloneNode();
                    sound.volume = this.sfxVolume;
                    sound.play().catch(err => {
                        console.warn(`Error playing explosion sound:`, err);
                    });
                }
            };
            
            console.log("Loaded explosion sound WAV file");
        } catch (error) {
            console.error("Error loading explosion sound WAV:", error);
            // Create a dummy sound as fallback
            this.sounds.explosion = { play: () => {} };
        }
    }
    
    // Load boink/UI feedback sound WAV file
    createBoinkSound() {
        try {
            // Load the sound file
            const boinkSound = new Audio(this.getPath('sounds/effects/boink.wav'));
            boinkSound.volume = this.sfxVolume;
            
            // Store the sound with a play method that creates a new instance
            this.sounds.boink = {
                play: () => {
                    if (this.muted) return;
                    
                    const sound = boinkSound.cloneNode();
                    sound.volume = this.sfxVolume;
                    sound.play().catch(err => {
                        console.warn(`Error playing boink sound:`, err);
                    });
                }
            };
            
            console.log("Loaded boink sound WAV file");
        } catch (error) {
            console.error("Error loading boink sound WAV:", error);
            // Create a dummy sound as fallback
            this.sounds.boink = { play: () => {} };
        }
    }
    
    // Load phaser up sound WAV file
    createPhaserUpSound() {
        try {
            // Load the sound file
            const phaserUpSound = new Audio(this.getPath('sounds/effects/phaserUp.wav'));
            phaserUpSound.volume = this.sfxVolume;
            
            // Store the sound with a play method that creates a new instance
            this.sounds.phaserUp = {
                play: () => {
                    if (this.muted) return;
                    
                    const sound = phaserUpSound.cloneNode();
                    sound.volume = this.sfxVolume;
                    sound.play().catch(err => {
                        console.warn(`Error playing phaserUp sound:`, err);
                    });
                }
            };
            
            console.log("Loaded phaserUp sound WAV file");
        } catch (error) {
            console.error("Error loading phaserUp sound WAV:", error);
            // Create a dummy sound as fallback
            this.sounds.phaserUp = { play: () => {} };
        }
    }
    
    // Load phaser down sound WAV file
    createPhaserDownSound() {
        try {
            // Load the sound file
            const phaserDownSound = new Audio(this.getPath('sounds/effects/phaserDown.wav'));
            phaserDownSound.volume = this.sfxVolume;
            
            // Store the sound with a play method that creates a new instance
            this.sounds.phaserDown = {
                play: () => {
                    if (this.muted) return;
                    
                    const sound = phaserDownSound.cloneNode();
                    sound.volume = this.sfxVolume;
                    sound.play().catch(err => {
                        console.warn(`Error playing phaserDown sound:`, err);
                    });
                }
            };
            
            console.log("Loaded phaserDown sound WAV file");
        } catch (error) {
            console.error("Error loading phaserDown sound WAV:", error);
            // Create a dummy sound as fallback
            this.sounds.phaserDown = { play: () => {} };
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
    
    // Play a sound effect
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
        
        // Handle the case where the name is 'weapon' or similar, map to projectile sound
        if (name === 'weapon' || name === 'fire' || name === 'shoot') {
            name = 'projectile';
        }
        
        if (!this.sounds[name]) {
            console.warn(`Sound "${name}" not found in loaded sounds`);
            return;
        }
        
        try {
            // Handle looped sounds vs one-shot sounds
            if (name === 'laser' || name === 'thrust' || name === 'mining-laser') {
                // For continuous sounds, track the audio element
                if (!this.activeSounds[name]) {
                    this.sounds[name].currentTime = 0;
                    this.sounds[name].play().catch(err => {
                        console.warn(`Error playing ${name} sound:`, err);
                    });
                    this.activeSounds[name] = this.sounds[name];
                }
            } else if (typeof this.sounds[name].play === 'function') {
                // For one-shot sounds with custom play method
                this.sounds[name].play();
            } else {
                // For standard Audio elements (one-shot)
                const sound = this.sounds[name].cloneNode();
                sound.volume = this.sfxVolume;
                sound.play().catch(err => {
                    console.warn(`Error playing ${name} sound:`, err);
                });
            }
        } catch (err) {
            console.error(`Error playing sound ${name}:`, err);
        }
    }
    
    // Stop a continuous sound effect
    stopSound(name) {
        if (!this.sounds[name]) return;
        
        try {
            if (name === 'laser' || name === 'thrust' || name === 'mining-laser') {
                // For looping sounds
                if (this.activeSounds[name]) {
                    this.activeSounds[name].pause();
                    this.activeSounds[name].currentTime = 0;
                    this.activeSounds[name] = null;
                }
            }
        } catch (err) {
            console.error(`Error stopping sound ${name}:`, err);
        }
    }
    
    // Set the volume for thrust sound based on thrust level
    setThrustVolume(thrustLevel) {
        if (!this.sounds.thrust) return;
        
        try {
            const volume = Math.min(1.0, Math.max(0, thrustLevel) * this.sfxVolume);
            this.sounds.thrust.volume = volume;
        } catch (err) {
            console.error("Error setting thrust volume:", err);
        }
    }
    
    // Toggle mute state
    toggleMute() {
        this.muted = !this.muted;
        
        // Update all audio elements
        for (const track of this.music) {
            track.muted = this.muted;
        }
        
        // Stop any active sounds if muting
        if (this.muted) {
            for (const [name, sound] of Object.entries(this.activeSounds)) {
                if (sound) {
                    this.stopSound(name);
                }
            }
        }
        
        // If unmuting and no music is playing, start playback
        if (!this.muted && this.userHasInteracted && this.music.length > 0 && this.music[0].paused) {
            this.playBackgroundMusic();
        }
        
        return this.muted;
    }
    
    /**
     * Clean up all audio resources
     */
    cleanup() {
        console.log("Cleaning up audio resources...");
        
        // Stop all currently playing sounds
        for (const key in this.activeSounds) {
            if (this.activeSounds[key]) {
                try {
                    this.stopSound(key);
                } catch (e) {
                    console.warn(`Error stopping sound ${key}:`, e);
                }
            }
        }
        
        // Stop and clean up background music
        for (const track of this.music) {
            try {
                track.pause();
                track.src = '';
            } catch (e) {
                console.warn("Error stopping background music:", e);
            }
        }
        
        // Clean up all tracked nodes
        this.activeNodes.clear();
        
        // Clear all sound references
        this.sounds = {};
        
        // Clear the GC interval
        if (this.gcInterval) {
            clearInterval(this.gcInterval);
        }
        
        console.log("Audio resources cleaned up");
    }
} 