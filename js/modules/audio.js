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
        
        // Store active audio nodes
        this.activeNodes = new Set();
        
        // Store active audio contexts
        this.activeSounds = {
            laser: null,
            thrust: null,
            projectile: null
        };
        
        // Track if the user has interacted with the page (for autoplay policies)
        this.userHasInteracted = false;
        
        console.log("Initializing audio manager with improved resource management...");
        
        // Initialize Tone.js (now loaded from CDN in index.html)
        this.initializeTone();
        
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
            // If a node is inactive (e.g., a one-shot sound that's finished playing)
            if (node._inactive || (node.disposed === true)) {
                if (typeof node.dispose === 'function') {
                    node.dispose();
                    count++;
                }
                this.activeNodes.delete(node);
            }
        });
        
        if (count > 0) {
            console.log(`Audio manager: cleaned up ${count} inactive audio nodes`);
        }
    }
    
    // Track an audio node for garbage collection
    trackNode(node) {
        if (node) {
            this.activeNodes.add(node);
        }
        return node;
    }
    
    // Initialize Tone.js effects chain
    initializeTone() {
        if (typeof Tone === 'undefined') {
            console.error("Tone.js not available. Check that it's properly loaded in index.html");
            return;
        }
        
        try {
            console.log("Initializing Tone.js...");
            
            // Create master effects for ASMR-like quality
            this.masterReverb = this.trackNode(new Tone.Reverb({
                decay: 1.5,
                wet: 0.2
            }).toDestination());
            
            this.masterCompressor = this.trackNode(new Tone.Compressor({
                threshold: -24,
                ratio: 4,
                attack: 0.005,
                release: 0.1
            }).connect(this.masterReverb));
            
            // Create ASMR EQ profile
            this.masterEQ = this.trackNode(new Tone.EQ3({
                low: 2,
                mid: 0,
                high: 3
            }).connect(this.masterCompressor));
            
            // Connect to destination
            Tone.Destination.volume.value = -6; // Lower overall volume
            
            console.log("Tone.js initialized with ASMR sound profile");
        } catch (error) {
            console.error("Error initializing Tone.js:", error);
        }
    }
    
    // Initialize audio - load all sounds and music
    async initialize() {
        try {
            console.log("Loading audio files...");
            
            // Check if the sound directories exist for music
            await this.checkSoundDirectories();
            
            // First, load the background music
            await this.loadBackgroundMusic();
            
            // Then create the programmatic sound effects
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
        // Only check for soundtrack directory since we're generating other sounds
        const soundsDirExists = await this.checkFileExists(this.getPath('sounds'));
        if (!soundsDirExists.exists) {
            console.warn("Sounds directory not found, but will attempt to load files directly anyway.");
            // Removed notification call since sound is working fine
        }
        
        // Check for soundtrack directory
        const soundtrackDirExists = await this.checkFileExists(this.getPath('sounds/soundtrack'));
        if (!soundtrackDirExists.exists) {
            console.warn("Soundtrack directory not found, but will attempt to load files directly anyway.");
            // Removed notification call since sound is working fine
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
        // Remove pending explosion tracking
        
        const handleInteraction = () => {
            if (!this.userHasInteracted) {
                this.userHasInteracted = true;
                console.log("User interaction detected, enabling audio playback");
                
                // Start Tone.js audio context
                if (typeof Tone !== 'undefined') {
                    Tone.start().then(() => {
                        console.log("Tone.js audio context started");
                    }).catch(err => {
                        console.error("Error starting Tone.js audio context:", err);
                    });
                }
                
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
                // If audio context exists but is suspended, resume it
                if (typeof Tone !== 'undefined' && Tone.context && Tone.context.state !== 'running') {
                    Tone.context.resume().then(() => {
                        console.log("Mobile: Audio context resumed on user action");
                        this.userHasInteracted = true;
                        
                        // Ensure background music is playing
                        if (this.music.length > 0 && !this.muted) {
                            const currentTrack = this.music[0];
                            if (currentTrack.paused) {
                                console.log("Mobile: Forcing background music playback");
                                this.playBackgroundMusic();
                            }
                        }
                    }).catch(err => {
                        console.error("Mobile: Failed to resume audio context:", err);
                    });
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
    
    // Create programmatic sound effects using Tone.js
    createSoundEffects() {
        if (typeof Tone === 'undefined') {
            console.error("Can't create sound effects: Tone.js not loaded");
            this.createDummySounds();
            return;
        }
        
        try {
            console.log("Creating programmatic ASMR sound effects...");
            
            // 1. Thrust sound - low hum (continuous)
            this.createThrustSound();
            
            // 2. Laser/projectile sound - pew pew (not too high pitch)
            this.createLaserSound();
            
            // 3. Explosion sound - funny sound
            this.createExplosionSound();
            
            // 4. Boink sound for UI - satisfying click
            this.createBoinkSound();
            
            // 5. Additional UI sounds
            this.createPhaserUpSound();
            this.createPhaserDownSound();
            
            console.log("Programmatic ASMR sound effects created successfully");
        } catch (error) {
            console.error("Error creating programmatic sound effects:", error);
            this.createDummySounds();
        }
    }
    
    // Create dummy sounds if Tone.js fails
    createDummySounds() {
        console.warn("Creating dummy silent audio elements as fallback");
        
        const soundEffects = ['laser', 'thrust', 'explosion', 'boink', 'phaserUp', 'phaserDown'];
        
        for (const name of soundEffects) {
            const dummyAudio = new Audio();
            dummyAudio.loop = name === 'laser' || name === 'thrust';
            this.sounds[name] = dummyAudio;
        }
    }
    
    // Create a low hum for thrust
    createThrustSound() {
        // Create a synth for the base drone - deeper pitch and more vibration
        const droneFilter = new Tone.Filter({
            type: "lowpass",
            frequency: 400, // Lower from 600 to 400 for deeper sound
            Q: 2.5 // Slightly more resonance
        }).connect(this.masterEQ);
        
        // More pronounced vibrato for oscillation effect
        const vibrato = new Tone.Vibrato({
            frequency: 4, // Increased from 0.5 to 4 for faster oscillation
            depth: 0.3    // Increased from 0.1 to 0.3 for more pronounced effect
        }).connect(droneFilter);
        
        // Lower frequency oscillator
        const thrustSynth = new Tone.FatOscillator({
            type: "sine",
            frequency: 80,  // Lowered from 120 to 80 for deeper bass
            spread: 30,     // Increased spread for wider sound
            count: 5        // More oscillators for richer texture
        }).connect(vibrato);
        
        // Add subtle noise for texture
        const noiseFilter = new Tone.Filter({
            type: "bandpass",
            frequency: 150, // Lower noise filter frequency
            Q: 0.8
        }).connect(this.masterEQ);
        
        // Add tremolo for additional oscillation
        const tremolo = new Tone.Tremolo({
            frequency: 6,
            depth: 0.4
        }).connect(noiseFilter).start();
        
        // More pronounced noise component
        const noiseGain = new Tone.Gain(0.1).connect(tremolo);
        const noise = new Tone.Noise("brown").connect(noiseGain); // Brown noise for deeper texture
        
        // Store synths for later control
        this.sounds.thrust = {
            type: "synth",
            synths: [thrustSynth, noise],
            volume: this.sfxVolume * 2.5,
            play: () => {
                thrustSynth.start();
                noise.start();
            },
            stop: () => {
                thrustSynth.stop();
                noise.stop();
            },
            setVolume: (vol) => {
                const scaledVol = Math.min(1.0, vol);
                thrustSynth.volume.value = Tone.gainToDb(scaledVol * 0.5); // Louder base oscillator
                noiseGain.gain.value = scaledVol * 0.1; // More noise component
            }
        };
        
        console.log("Created enhanced ASMR thrust sound: deep vibrating hum");
    }
    
    // Create pew pew sound for laser/projectiles
    createLaserSound() {
        // Filter for smoothing
        const filter = new Tone.Filter({
            type: "bandpass",
            frequency: 800,
            Q: 1.5
        }).connect(this.masterEQ);
        
        // Add reverb for ASMR feel
        const laserReverb = new Tone.Reverb({
            decay: 0.8,
            wet: 0.3
        }).connect(filter);
        
        // Create synth
        const laserSynth = new Tone.Synth({
            oscillator: {
                type: "triangle"
            },
            envelope: {
                attack: 0.01,
                decay: 0.1,
                sustain: 0.3,
                release: 0.5
            }
        }).connect(laserReverb);
        
        // Store synthesized sound
        this.sounds.laser = {
            type: "synth",
            synth: laserSynth,
            volume: this.sfxVolume * 0.5,
            isPlaying: false,
            loop: null,
            play: () => {
                if (this.sounds.laser.isPlaying) return;
                
                laserSynth.volume.value = Tone.gainToDb(this.sounds.laser.volume);
                
                // Create a repeating pattern for the pew-pew effect
                this.sounds.laser.isPlaying = true;
                this.sounds.laser.loop = Tone.Transport.scheduleRepeat((time) => {
                    laserSynth.triggerAttackRelease("A4", 0.1, time);
                    laserSynth.triggerAttackRelease("E5", 0.1, time + 0.15);
                }, 0.4);
                
                Tone.Transport.start();
            },
            stop: () => {
                if (!this.sounds.laser.isPlaying) return;
                
                if (this.sounds.laser.loop !== null) {
                    Tone.Transport.clear(this.sounds.laser.loop);
                    this.sounds.laser.loop = null;
                }
                this.sounds.laser.isPlaying = false;
            }
        };
        
        console.log("Created ASMR laser sound: pew pew");
        
        // Create dedicated projectile sound (one-shot "pew" for each projectile fired)
        const projectileFilter = new Tone.Filter({
            type: "bandpass",
            frequency: 900,
            Q: 2
        }).connect(this.masterEQ);
        
        const projectileReverb = new Tone.Reverb({
            decay: 1.2,
            wet: 0.4
        }).connect(projectileFilter);
        
        const projectileSynth = new Tone.Synth({
            oscillator: {
                type: "sawtooth",  // More pronounced waveform for projectiles
                width: 0.5
            },
            envelope: {
                attack: 0.005,
                decay: 0.1,
                sustain: 0.1,
                release: 0.8
            }
        }).connect(projectileReverb);
        
        // Second synth for layered effect
        const projectileSynth2 = new Tone.Synth({
            oscillator: {
                type: "sine"
            },
            envelope: {
                attack: 0.001,
                decay: 0.1,
                sustain: 0,
                release: 0.4
            }
        }).connect(projectileReverb);
        
        // Store synthesized sound
        this.sounds.projectile = {
            type: "oneshot",
            play: () => {
                if (this.muted) return;
                
                // Set volume
                projectileSynth.volume.value = Tone.gainToDb(this.sfxVolume * 0.6);
                projectileSynth2.volume.value = Tone.gainToDb(this.sfxVolume * 0.4);
                
                // Create a satisfying "pew" sound that sweeps upward
                const now = Tone.now();
                
                // Main projectile sound - sweep from low to high
                projectileSynth.triggerAttack("C4", now);
                projectileSynth.frequency.exponentialRampTo("C6", 0.15, now);
                projectileSynth.triggerRelease(now + 0.2);
                
                // Add higher pitched accent for definition
                projectileSynth2.triggerAttackRelease("G5", 0.1, now + 0.05);
            }
        };
        
        console.log("Created ASMR projectile sound: distinct pew for each shot");
    }
    
    // Create funny sound for explosions
    createExplosionSound() {
        const explosionFilter = new Tone.Filter({
            type: "lowpass",
            frequency: 1000,
            Q: 1
        }).connect(this.masterEQ);
        
        const explosionSynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: {
                type: "fmsquare",
                modulationType: "sine",
                modulationIndex: 3,
                harmonicity: 3.4
            },
            envelope: {
                attack: 0.001,
                decay: 0.3,
                sustain: 0.1,
                release: 0.4
            }
        }).connect(explosionFilter);
        
        // Add a noise burst
        const noiseFilter = new Tone.Filter({
            type: "lowpass",
            frequency: 800,
            Q: 0.2
        }).connect(this.masterEQ);
        
        // Store synthesized sound
        this.sounds.explosion = {
            type: "oneshot",
            play: () => {
                if (this.muted) return;
                
                // Set volume
                explosionSynth.volume.value = Tone.gainToDb(this.sfxVolume * 0.5);
                
                // Funny explosion - cartoonish sound
                const now = Tone.now();
                
                // Play descending notes
                explosionSynth.triggerAttackRelease(["C4", "G3", "E3"], 0.2, now);
                explosionSynth.triggerAttackRelease(["B2", "G2"], 0.3, now + 0.1);
                
                // Comedic bounce-back
                setTimeout(() => {
                    explosionSynth.triggerAttackRelease("D5", 0.05, Tone.now());
                    setTimeout(() => {
                        explosionSynth.triggerAttackRelease("G5", 0.05, Tone.now());
                    }, 100);
                }, 300);
                
                // Create a noise burst with envelope
                const noise = new Tone.Noise("brown").connect(noiseFilter);
                const noiseEnv = new Tone.AmplitudeEnvelope({
                    attack: 0.001,
                    decay: 0.2,
                    sustain: 0.1,
                    release: 0.4
                }).connect(noiseFilter.frequency);
                
                // Set fixed frequency modulation
                noiseEnv.baseFrequency = 800;
                noiseEnv.octaves = 2.5;
                noiseEnv.exponent = 1.5;
                
                // Play noise burst
                noise.start();
                noiseEnv.triggerAttackRelease(0.5);
                
                // Stop noise after envelope completes
                setTimeout(() => {
                    noise.stop();
                }, 1000);
            }
        };
        
        console.log("Created ASMR explosion sound: funny cartoonish effect");
    }
    
    // Create a satisfying click/boink sound
    createBoinkSound() {
        const boinkFilter = new Tone.Filter({
            type: "bandpass",
            frequency: 1200,
            Q: 2
        }).connect(this.masterEQ);
        
        const boinkSynth = new Tone.Synth({
            oscillator: {
                type: "sine"
            },
            envelope: {
                attack: 0.001,
                decay: 0.1,
                sustain: 0.05,
                release: 0.3
            }
        }).connect(boinkFilter);
        
        // Store synthesized sound
        this.sounds.boink = {
            type: "oneshot",
            play: () => {
                if (this.muted) return;
                
                // Set volume
                boinkSynth.volume.value = Tone.gainToDb(this.sfxVolume * 0.5);
                
                // Play a satisfying click sound
                boinkSynth.triggerAttackRelease("C6", 0.08);
            }
        };
        
        console.log("Created ASMR boink sound: satisfying click");
    }
    
    // Create upward phaser sound for wins
    createPhaserUpSound() {
        const phaserUpFilter = new Tone.Filter({
            type: "highpass",
            frequency: 400,
            Q: 1
        }).connect(this.masterEQ);
        
        const phaserUpSynth = new Tone.Synth({
            oscillator: {
                type: "sine"
            },
            envelope: {
                attack: 0.01,
                decay: 0.1,
                sustain: 0.5,
                release: 0.5
            }
        }).connect(phaserUpFilter);
        
        // Store synthesized sound
        this.sounds.phaserUp = {
            type: "oneshot",
            play: () => {
                if (this.muted) return;
                
                // Set volume
                phaserUpSynth.volume.value = Tone.gainToDb(this.sfxVolume * 0.6);
                
                // Pleasant rising tone
                const now = Tone.now();
                phaserUpSynth.triggerAttack("C5", now);
                phaserUpSynth.frequency.exponentialRampTo("G5", 0.2, now);
                phaserUpSynth.triggerRelease(now + 0.3);
            }
        };
        
        console.log("Created ASMR phaser up sound: pleasant rise");
    }
    
    // Create downward phaser sound for losses
    createPhaserDownSound() {
        const phaserDownFilter = new Tone.Filter({
            type: "lowpass",
            frequency: 2000,
            Q: 1
        }).connect(this.masterEQ);
        
        const phaserDownSynth = new Tone.Synth({
            oscillator: {
                type: "sine"
            },
            envelope: {
                attack: 0.01,
                decay: 0.1,
                sustain: 0.5,
                release: 0.5
            }
        }).connect(phaserDownFilter);
        
        // Store synthesized sound
        this.sounds.phaserDown = {
            type: "oneshot",
            play: () => {
                if (this.muted) return;
                
                // Set volume
                phaserDownSynth.volume.value = Tone.gainToDb(this.sfxVolume * 0.6);
                
                // Gentle falling tone
                const now = Tone.now();
                phaserDownSynth.triggerAttack("E5", now);
                phaserDownSynth.frequency.exponentialRampTo("A4", 0.2, now);
                phaserDownSynth.triggerRelease(now + 0.3);
            }
        };
        
        console.log("Created ASMR phaser down sound: gentle fall");
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
        
        // Check if we need to initialize Tone.js
        if (typeof Tone !== 'undefined' && Tone.context.state !== 'running') {
            Tone.start().catch(err => {
                console.error("Failed to start Tone.js context:", err);
            });
        }
        
        try {
            // Handle synthesized sounds
            if (this.sounds[name].type === "synth") {
                // For continuous synthesized sounds like thrust and laser
                if (!this.activeSounds[name]) {
                    this.sounds[name].play();
                    this.activeSounds[name] = true;
                }
            } else if (this.sounds[name].type === "oneshot") {
                // For one-shot sounds like explosion, boink, phaser, projectile
                this.sounds[name].play();
            } else {
                // Fallback to audio element approach for imported sounds
                console.log(`Playing traditional sound: ${name}`);
                
                if (name !== 'laser' && name !== 'thrust') {
                    // One-shot sounds
                    const sound = this.sounds[name].cloneNode();
                    sound.volume = this.sfxVolume;
                    sound.play().catch(err => {
                        console.warn(`Error playing sound ${name}:`, err);
                    });
                } else if (!this.activeSounds[name]) {
                    // Loop sounds
                    this.activeSounds[name] = this.sounds[name];
                    this.sounds[name].play().catch(err => {
                        console.warn(`Error playing sound ${name}:`, err);
                        this.activeSounds[name] = null;
                    });
                }
            }
        } catch (err) {
            console.error(`Error playing sound ${name}:`, err);
        }
    }
    
    // Stop a continuous sound effect
    stopSound(name) {
        if (!this.sounds[name]) return;
        
        try {
            // Handle synthesized sounds
            if (this.sounds[name].type === "synth") {
                this.sounds[name].stop();
                this.activeSounds[name] = null;
            } else if (this.activeSounds[name]) {
                // Handle standard Audio elements
                this.sounds[name].pause();
                this.sounds[name].currentTime = 0;
                this.activeSounds[name] = null;
            }
        } catch (err) {
            console.error(`Error stopping sound ${name}:`, err);
        }
    }
    
    // Set the volume for thrust sound based on thrust level
    setThrustVolume(thrustLevel) {
        if (!this.sounds.thrust) return;
        
        try {
            // For synthesized thrust sound
            if (this.sounds.thrust.type === "synth") {
                const volume = Math.min(1.0, Math.max(0, thrustLevel) * this.sfxVolume * 2.5);
                this.sounds.thrust.setVolume(volume);
            } else {
                // Fallback for Audio element
                const volume = Math.min(1.0, Math.max(0, thrustLevel) * this.sfxVolume * 2.5);
                this.sounds.thrust.volume = volume;
            }
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
        
        // Stop any active synth sounds if muting
        if (this.muted) {
            for (const [name, sound] of Object.entries(this.sounds)) {
                if (sound.type === "synth" && this.activeSounds[name]) {
                    sound.stop();
                    this.activeSounds[name] = null;
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
        if (this.currentMusic) {
            try {
                this.currentMusic.stop();
                this.currentMusic.dispose();
                this.currentMusic = null;
            } catch (e) {
                console.warn("Error stopping background music:", e);
            }
        }
        
        // Dispose of all tracked nodes
        this.activeNodes.forEach(node => {
            try {
                if (typeof node.dispose === 'function') {
                    node.dispose();
                }
            } catch (e) {
                console.warn("Error disposing audio node:", e);
            }
        });
        this.activeNodes.clear();
        
        // Clean up effect chain
        if (this.masterReverb && typeof this.masterReverb.dispose === 'function') {
            this.masterReverb.dispose();
        }
        
        if (this.masterCompressor && typeof this.masterCompressor.dispose === 'function') {
            this.masterCompressor.dispose();
        }
        
        if (this.masterEQ && typeof this.masterEQ.dispose === 'function') {
            this.masterEQ.dispose();
        }
        
        // Clear all sound references
        this.sounds = {};
        
        // Clear the GC interval
        if (this.gcInterval) {
            clearInterval(this.gcInterval);
        }
        
        console.log("Audio resources cleaned up");
    }
} 