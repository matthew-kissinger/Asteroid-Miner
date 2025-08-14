// soundEffects.js - Tone.js sound effects for intro sequence

/**
 * Creates all intro sequence sound effects using Tone.js
 * @param {AudioManager} audioManager - Reference to the main audio manager
 * @returns {Object} Object containing all intro sound effects
 */
export function createIntroSoundEffects(audioManager) {
    if (typeof Tone === 'undefined') {
        console.error("Tone.js not available for intro sound effects");
        return {};
    }
    
    try {
        console.log("Creating intro sequence sound effects...");
        
        const introSounds = {};
        
        // Create warp portal sound
        introSounds.warp = createWarpSound(audioManager);
        
        // Create ship arrival sound
        introSounds.shipArrival = createShipArrivalSound(audioManager);
        
        // Create teleport beam sound
        introSounds.teleport = createTeleportSound(audioManager);
        
        console.log("Intro sequence sound effects created");
        return introSounds;
    } catch (error) {
        console.error("Error creating intro sound effects:", error);
        return {};
    }
}

// Create warp portal sound effect
function createWarpSound(audioManager) {
    try {
        // Use Tone.Destination directly - audio system might not be fully initialized yet
        const destination = Tone.Destination;
        
        // Filter for warp sound
        const warpFilter = new Tone.Filter({
            type: "lowpass",
            frequency: 2000,
            Q: 2
        }).connect(destination);
        
        // Add reverb for spaciousness
        const warpReverb = new Tone.Reverb({
            decay: 2,
            wet: 0.5
        }).connect(warpFilter);
        
        // Create synth for warp sound
        const warpSynth = new Tone.FMSynth({
            harmonicity: 3,
            modulationIndex: 10,
            oscillator: {
                type: "sine"
            },
            envelope: {
                attack: 0.1,
                decay: 0.2,
                sustain: 0.8,
                release: 1.5
            },
            modulation: {
                type: "square"
            },
            modulationEnvelope: {
                attack: 0.5,
                decay: 0.1,
                sustain: 0.2,
                release: 0.5
            }
        }).connect(warpReverb);
        
        // Create noise component for texture
        const noiseFilter = new Tone.Filter({
            type: "bandpass",
            frequency: 700,
            Q: 0.6
        }).connect(destination);
        
        const noiseGain = new Tone.Gain(0.3).connect(noiseFilter);
        const noise = new Tone.Noise("pink").connect(noiseGain);
        
        // Create sound object with proper scope
        const soundObject = {
            lastPlayTime: 0, // Track when we last played this sound
            play: function() {
                if (audioManager && audioManager.muted) return;
                
                const now = Tone.now();
                
                // Prevent playing if it was played too recently (within 0.1 seconds)
                if (now - this.lastPlayTime < 0.1) {
                    console.log("Preventing too rapid warp sound playback");
                    return;
                }
                
                // Update last play time
                this.lastPlayTime = now;
                
                // Set volume - reduced by 40%
                const volumeLevel = audioManager ? audioManager.sfxVolume * 0.36 : 0.18;
                warpSynth.volume.value = Tone.gainToDb(volumeLevel);
                
                // Start noise component with reduced volume
                noise.start();
                
                // Play descending sequence for portal forming
                warpSynth.triggerAttack("C5", now);
                warpSynth.frequency.exponentialRampTo("C2", 2, now);
                
                // Fade out noise after 3 seconds - start with lower gain
                noiseGain.gain.setValueAtTime(0.18, now);
                noiseGain.gain.exponentialRampTo(0.01, 3, now + 1);
                
                // Stop synth and noise after 3 seconds
                setTimeout(() => {
                    warpSynth.triggerRelease();
                    setTimeout(() => {
                        noise.stop();
                    }, 500);
                }, 3000);
            }
        };
        
        return soundObject;
    } catch (error) {
        console.error("Error creating warp sound:", error);
        return { play: () => {} };
    }
}

// Create ship arrival sound effect
function createShipArrivalSound(audioManager) {
    try {
        // Use Tone.Destination directly - audio system might not be fully initialized yet
        const destination = Tone.Destination;
        
        // Filter for arrival sound
        const arrivalFilter = new Tone.Filter({
            type: "lowpass",
            frequency: 1200,
            Q: 1
        }).connect(destination);
        
        // Create synth for ship arrival sound
        const arrivalSynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: {
                type: "triangle"
            },
            envelope: {
                attack: 0.02,
                decay: 0.3,
                sustain: 0.1,
                release: 0.8
            }
        }).connect(arrivalFilter);
        
        // Create deep bass for engine rumble
        const rumbleFilter = new Tone.Filter({
            type: "lowpass",
            frequency: 200,
            Q: 0.5
        }).connect(destination);
        
        const rumbleSynth = new Tone.Synth({
            oscillator: {
                type: "sine"
            },
            envelope: {
                attack: 0.1,
                decay: 0.3,
                sustain: 0.6,
                release: 1
            }
        }).connect(rumbleFilter);
        
        // Return the sound object
        return {
            play: () => {
                if (audioManager && audioManager.muted) return;
                
                const now = Tone.now();
                
                // Set volume - reduced by 40%
                const volumeLevel = audioManager ? audioManager.sfxVolume * 0.42 : 0.24;
                arrivalSynth.volume.value = Tone.gainToDb(volumeLevel);
                rumbleSynth.volume.value = Tone.gainToDb(volumeLevel * 0.8); // Further reduced rumble
                
                // Play dramatic chord for ship appearance
                arrivalSynth.triggerAttackRelease(["G3", "D4", "A4"], 1.5, now);
                
                // Add engine rumble
                rumbleSynth.triggerAttack("G1", now);
                rumbleSynth.frequency.exponentialRampTo("C2", 2, now + 0.5);
                
                // Stop rumble after 2 seconds
                setTimeout(() => {
                    rumbleSynth.triggerRelease();
                }, 2000);
            }
        };
    } catch (error) {
        console.error("Error creating ship arrival sound:", error);
        return { play: () => {} };
    }
}

// Create teleport beam sound effect
function createTeleportSound(audioManager) {
    try {
        // Use Tone.Destination directly - audio system might not be fully initialized yet
        const destination = Tone.Destination;
        
        // Filter for teleport sound
        const teleportFilter = new Tone.Filter({
            type: "bandpass",
            frequency: 800,
            Q: 2
        }).connect(destination);
        
        // Add chorus for otherworldly effect
        const teleportChorus = new Tone.Chorus({
            frequency: 1.5,
            delayTime: 3.5,
            depth: 0.7,
            wet: 0.5
        }).connect(teleportFilter).start();
        
        // Create synth for teleport beam
        const teleportSynth = new Tone.Synth({
            oscillator: {
                type: "sine"
            },
            envelope: {
                attack: 0.05,
                decay: 0.2,
                sustain: 0.8,
                release: 1
            }
        }).connect(teleportChorus);
        
        // Create high-pitched accent for the beam
        const beamFilter = new Tone.Filter({
            type: "highpass",
            frequency: 2000,
            Q: 1
        }).connect(destination);
        
        const beamSynth = new Tone.Synth({
            oscillator: {
                type: "square"
            },
            envelope: {
                attack: 0.01,
                decay: 0.1,
                sustain: 0.6,
                release: 0.5
            }
        }).connect(beamFilter);
        
        // Return the sound object
        return {
            play: () => {
                if (audioManager && audioManager.muted) return;
                
                const now = Tone.now();
                
                // Set volume - reduced by 40%
                const volumeLevel = audioManager ? audioManager.sfxVolume * 0.3 : 0.18;
                teleportSynth.volume.value = Tone.gainToDb(volumeLevel);
                beamSynth.volume.value = Tone.gainToDb(volumeLevel * 0.4); // Further reduced high pitch
                
                // Play upward sweep for teleport activation
                teleportSynth.triggerAttack("C4", now);
                teleportSynth.frequency.exponentialRampTo("C6", 1.5, now);
                
                // Add high-pitched beam activation sound
                beamSynth.triggerAttackRelease("E7", 0.1, now + 0.3);
                setTimeout(() => {
                    beamSynth.triggerAttackRelease("G7", 0.1, now + 0.5);
                }, 200);
                
                // Release after 2 seconds
                setTimeout(() => {
                    teleportSynth.triggerRelease();
                }, 2000);
            }
        };
    } catch (error) {
        console.error("Error creating teleport sound:", error);
        return { play: () => {} };
    }
}