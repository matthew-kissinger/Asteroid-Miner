// introSequence.js - Manages the cinematic Star Dreadnought intro sequence

import { StarDreadnought } from './environment/starDreadnought.js';
import { getAbsolutePath } from '../utils/pathUtils.js';

export class IntroSequence {
    constructor(scene, camera, spaceship, audioManager) {
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
        this.starDreadnought = new StarDreadnought(scene);
        
        // Setup portal effect
        this.setupPortalEffect();
        
        // Overlay for flash effects
        this.setupOverlay();
        
        // Dialogue elements
        this.dialogueBox = null;
        this.dialogueText = null;
        this.currentDialogueIndex = 0;
        this.isTyping = false;
        this.typeInterval = null;
        
        // Custom sound effects
        this.introSounds = {};
        
        // Dialogue WAV files
        this.dialogueWavs = [];
        
        // Dialogue lines
        this.dialogueLines = [
            "CORP CONTROLLER: [static] Belter #337, status check. Your cryostasis cycle is now complete.",
            "CORP CONTROLLER: Welcome to your deployment in the Sol System, circa 2077. As you can see, Earth is... well... let's just say \"available for unrestricted mining operations\" now.",
            "CORP CONTROLLER: CorpEx Resource Acquisition reminds you that all planetary bodies in this system are now classified as \"unclaimed assets\" following the... unfortunate global circumstances.",
            "CORP CONTROLLER: Your primary objective is resource extraction from the asteroid belt. Initial scans show promising mineral concentrations untouched since the evacuation.",
            "CORP CONTROLLER: The Stargate remains your lifeline. Return for fuel, upgrades, trading, and your allocated 15 minutes of daily entertainment. Remember, a happy belter is a productive belter!",
            "CORP CONTROLLER: Resource extraction targets are non-negotiable. Failure to meet quotas will result in extension of your 42-year contract.",
            "CORP CONTROLLER: Oh, and our long-range scans have detected spectral drone activity in adjacent sectors. Remnants of old defense systems, probably. Nothing a resourceful belter like you can't handle.",
            "CORP CONTROLLER: Connection terminating in 3...2...1... Don't die out there, #337. Replacement clones are expensive.",
            "[TRANSMISSION TERMINATED]",
            "[BELTER #337 DEPLOYMENT ACTIVE]"
        ];
        
        console.log("Intro sequence initialized");
        
        // Load dialogue WAV files
        this.loadDialogueWavs();
        
        // Create custom Tone.js sound effects
        this.createIntroSoundEffects();
    }
    
    // Load dialogue WAV files (1.wav through 8.wav)
    loadDialogueWavs() {
        console.log("Loading dialogue WAV files...");
        
        try {
            // Load 8 dialogue WAV files
            for (let i = 1; i <= 8; i++) {
                const audioPath = getAbsolutePath(`sounds/dialogue/${i}.wav`);
                console.log(`Attempting to load dialogue file: ${audioPath}`);
                
                // Create audio element
                const audio = new Audio();
                
                // Setup event handlers before setting src to avoid race conditions
                audio.addEventListener('canplaythrough', () => {
                    console.log(`Dialogue WAV ${i} loaded successfully`);
                });
                
                audio.addEventListener('error', (e) => {
                    console.warn(`Dialogue WAV ${i} not found or couldn't be loaded - this is normal if you haven't added the files yet`);
                    // Don't log the full error object as it's noisy
                });
                
                // Set source after adding event listeners
                audio.src = audioPath;
                
                // Store reference even if loading fails - the game will just skip playing it
                this.dialogueWavs.push(audio);
            }
            
            console.log("Dialogue WAV files setup complete - they'll be used if available");
        } catch (error) {
            console.error("Error in dialogue WAV files setup:", error);
        }
    }
    
    // Create custom Tone.js sound effects for the intro sequence
    createIntroSoundEffects() {
        if (typeof Tone === 'undefined') {
            console.error("Tone.js not available for intro sound effects");
            return;
        }
        
        try {
            console.log("Creating intro sequence sound effects...");
            
            // Create warp portal sound
            this.createWarpSound();
            
            // Create ship arrival sound
            this.createShipArrivalSound();
            
            // Create teleport beam sound
            this.createTeleportSound();
            
            console.log("Intro sequence sound effects created");
        } catch (error) {
            console.error("Error creating intro sound effects:", error);
        }
    }
    
    // Create warp portal sound effect
    createWarpSound() {
        try {
            // Connect to master effects chain if available
            const destination = this.audio && this.audio.masterEQ ? 
                this.audio.masterEQ : Tone.Destination;
            
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
            
            // Store the sound
            this.introSounds.warp = {
                play: () => {
                    if (this.audio && this.audio.muted) return;
                    
                    const now = Tone.now();
                    
                    // Set volume - reduced by 40%
                    const volumeLevel = this.audio ? this.audio.sfxVolume * 0.36 : 0.18;
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
        } catch (error) {
            console.error("Error creating warp sound:", error);
        }
    }
    
    // Create ship arrival sound effect
    createShipArrivalSound() {
        try {
            // Connect to master effects chain if available
            const destination = this.audio && this.audio.masterEQ ? 
                this.audio.masterEQ : Tone.Destination;
            
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
            
            // Store the sound
            this.introSounds.shipArrival = {
                play: () => {
                    if (this.audio && this.audio.muted) return;
                    
                    const now = Tone.now();
                    
                    // Set volume - reduced by 40%
                    const volumeLevel = this.audio ? this.audio.sfxVolume * 0.42 : 0.24;
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
        }
    }
    
    // Create teleport beam sound effect
    createTeleportSound() {
        try {
            // Connect to master effects chain if available
            const destination = this.audio && this.audio.masterEQ ? 
                this.audio.masterEQ : Tone.Destination;
            
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
            
            // Store the sound
            this.introSounds.teleport = {
                play: () => {
                    if (this.audio && this.audio.muted) return;
                    
                    const now = Tone.now();
                    
                    // Set volume - reduced by 40%
                    const volumeLevel = this.audio ? this.audio.sfxVolume * 0.3 : 0.18;
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
        }
    }
    
    setupDialogueUI() {
        // Create dialogue box
        this.dialogueBox = document.createElement('div');
        this.dialogueBox.id = 'intro-dialogue';
        this.dialogueBox.style.position = 'fixed';
        this.dialogueBox.style.bottom = '50px';
        this.dialogueBox.style.left = '50%';
        this.dialogueBox.style.transform = 'translateX(-50%)';
        this.dialogueBox.style.width = '80%';
        this.dialogueBox.style.maxWidth = '800px';
        this.dialogueBox.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.dialogueBox.style.color = '#30f0c0';
        this.dialogueBox.style.border = '1px solid #30f0c0';
        this.dialogueBox.style.borderRadius = '5px';
        this.dialogueBox.style.padding = '15px';
        this.dialogueBox.style.fontFamily = 'Courier New, monospace';
        this.dialogueBox.style.fontSize = '16px';
        this.dialogueBox.style.zIndex = '10000';
        this.dialogueBox.style.textShadow = '0 0 5px #30f0c0';
        this.dialogueBox.style.boxShadow = '0 0 10px rgba(48, 240, 192, 0.3)';
        this.dialogueBox.style.opacity = '0';
        this.dialogueBox.style.transition = 'opacity 0.5s';
        
        // Add dialogue text element
        this.dialogueText = document.createElement('div');
        this.dialogueText.style.lineHeight = '1.5';
        
        this.dialogueBox.appendChild(this.dialogueText);
        document.body.appendChild(this.dialogueBox);
        
        // Fade in dialogue box
        setTimeout(() => {
            this.dialogueBox.style.opacity = '1';
        }, 200);
    }
    
    typeNextDialogue() {
        if (this.currentDialogueIndex >= this.dialogueLines.length) {
            return;
        }
        
        const line = this.dialogueLines[this.currentDialogueIndex];
        
        // Play the appropriate dialogue WAV file
        // Only play WAVs for the first 8 dialogues (the ones with voice acting)
        if (this.currentDialogueIndex < 8 && this.dialogueWavs[this.currentDialogueIndex]) {
            try {
                const dialogueAudio = this.dialogueWavs[this.currentDialogueIndex];
                
                // Only attempt to play if the file has actually loaded successfully
                // We can check this by examining the networkState or readyState
                if (dialogueAudio.readyState > 0 && dialogueAudio.error === null) {
                    dialogueAudio.volume = this.audio ? this.audio.sfxVolume * 0.8 : 0.5;
                    dialogueAudio.currentTime = 0;
                    
                    // Try to play and catch any potential errors
                    const playPromise = dialogueAudio.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(err => {
                            console.warn(`Couldn't play dialogue WAV ${this.currentDialogueIndex}: ${err.message}`);
                        });
                    }
                } else {
                    console.log(`Skipping dialogue WAV ${this.currentDialogueIndex + 1} (not loaded)`);
                }
            } catch (error) {
                console.warn(`Error playing dialogue WAV ${this.currentDialogueIndex + 1}, continuing without audio`, error.message);
            }
        }
        
        this.currentDialogueIndex++;
        
        // Clear previous text
        this.dialogueText.textContent = '';
        
        // Show dialogue box if not visible
        if (this.dialogueBox.style.opacity === '0') {
            this.dialogueBox.style.opacity = '1';
        }
        
        // Type out text
        let charIndex = 0;
        this.isTyping = true;
        
        // Clear previous interval if exists
        if (this.typeInterval) {
            clearInterval(this.typeInterval);
        }
        
        // Special effects for transmission terminated line
        if (line.includes("TRANSMISSION TERMINATED") || line.includes("DEPLOYMENT ACTIVE")) {
            this.dialogueText.style.color = '#ff3030';
        } else {
            this.dialogueText.style.color = '#30f0c0';
        }
        
        // Type each character with random speed for effect
        this.typeInterval = setInterval(() => {
            if (charIndex < line.length) {
                this.dialogueText.textContent += line.charAt(charIndex);
                charIndex++;
                
                // Play typing sound
                if (this.audio && this.audio.playSound && charIndex % 3 === 0) {
                    // Try to play a typing sound if available
                    if (typeof this.audio.playSound === 'function') {
                        try {
                            this.audio.playSound('uiClick', 0.1); // Low volume typing sound
                        } catch (e) {
                            // Ignore if sound not available
                        }
                    }
                }
            } else {
                clearInterval(this.typeInterval);
                this.typeInterval = null;
                this.isTyping = false;
                
                // Automatically advance to next dialogue after a delay
                // but only for certain progress points in the sequence
                if (this.sequenceTime < 22) { // Don't auto advance during the very end
                    const waitTime = Math.max(line.length * 50, 3000); // Longer lines stay longer
                    setTimeout(() => {
                        if (!this.isTyping && this.isPlaying) {
                            this.typeNextDialogue();
                        }
                    }, waitTime);
                }
            }
        }, 30); // Base typing speed
    }
    
    setupPortalEffect() {
        // Create a circular portal instead of a particle tower
        const portalGeometry = new THREE.RingGeometry(0, 400, 64);
        const portalMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color: { value: new THREE.Color(0x6633aa) }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 color;
                varying vec2 vUv;
                
                void main() {
                    float distFromCenter = length(vUv - vec2(0.5, 0.5)) * 2.0;
                    float ripple = sin(distFromCenter * 20.0 - time * 3.0) * 0.5 + 0.5;
                    float alpha = (1.0 - distFromCenter) * ripple;
                    
                    vec3 finalColor = color * (0.8 + ripple * 0.4);
                    gl_FragColor = vec4(finalColor, alpha);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        this.warpPortal = new THREE.Mesh(portalGeometry, portalMaterial);
        
        // Create a subtle particle system around the portal for effect
        const particleCount = 500;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 350 + Math.random() * 150;
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = Math.sin(angle) * radius;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 50;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xaa33ff,
            size: 3,
            transparent: true,
            blending: THREE.AdditiveBlending
        });
        
        this.portalParticles = new THREE.Points(particles, particleMaterial);
        
        // Group the portal elements
        this.warpTunnel = new THREE.Group();
        this.warpTunnel.add(this.warpPortal);
        this.warpTunnel.add(this.portalParticles);
    }
    
    setupOverlay() {
        // Create a DOM overlay for the flash effect
        this.overlay = document.createElement('div');
        this.overlay.id = 'intro-overlay';
        this.overlay.style.position = 'fixed';
        this.overlay.style.top = '0';
        this.overlay.style.left = '0';
        this.overlay.style.width = '100%';
        this.overlay.style.height = '100%';
        this.overlay.style.backgroundColor = '#aa33ff'; // Match portal color
        this.overlay.style.opacity = '0';
        this.overlay.style.transition = 'opacity 0.5s';
        this.overlay.style.pointerEvents = 'none';
        this.overlay.style.zIndex = '9999';
        
        // Add to DOM but hide initially
        document.body.appendChild(this.overlay);
    }
    
    startSequence(onComplete) {
        if (this.isPlaying) return;
        
        console.log("Starting intro sequence...");
        this.isPlaying = true;
        this.sequenceTime = 0;
        this.onComplete = onComplete;
        
        // Store initial camera state to restore player camera after sequence
        this.initialCameraPosition = this.camera.position.clone();
        this.initialCameraRotation = this.camera.rotation.clone();
        
        // Position camera for initial view of portal forming
        this.camera.position.set(0, 6000, 12000);
        this.camera.lookAt(30000, 5000, 0); // Look at where portal will appear
        
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
        this.scene.add(this.warpTunnel);
        
        // Position the star dreadnought initially outside the scene
        this.starDreadnought.ship.position.set(35000, 5000, 0); // Off-screen
        this.starDreadnought.ship.rotation.y = Math.PI/2; // Face toward center
        this.starDreadnought.ship.visible = false;
        
        // Start sequence animation
        this.animate = this.animate.bind(this);
        this.lastTime = performance.now();
        requestAnimationFrame(this.animate);
        
        // Setup skip functionality for repeat players
        if (this.skipEnabled) {
            this.setupSkipHandler();
        }
        
        // Setup dialogue UI
        this.setupDialogueUI();
        
        // Start first dialogue line
        setTimeout(() => {
            this.typeNextDialogue();
        }, 2000);
        
        // Play warp sound
        if (this.introSounds.warp) {
            this.introSounds.warp.play();
        }
    }
    
    animate(currentTime) {
        if (!this.isPlaying) return;
        
        // Slower pace for more sublime experience
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1) * 0.4; // 60% slower
        this.lastTime = currentTime;
        
        // Update sequence timer
        this.sequenceTime += deltaTime;
        
        // Just TWO phases - arrival and departure
        if (this.sequenceTime < 14.0) {
            // Phase 1: Portal, ship arrival and player deployment (0-14s)
            this.updateArrivalPhase(this.sequenceTime / 14.0);
        } else if (this.sequenceTime < 24.0) {
            // Phase 2: Ship departure (14-24s)
            this.updateDeparturePhase((this.sequenceTime - 14.0) / 10.0);
        } else {
            // Sequence complete
            this.completeSequence();
            return;
        }
        
        requestAnimationFrame(this.animate);
    }
    
    updateArrivalPhase(progress) {
        // Portal animation
        if (this.warpPortal && this.warpPortal.material.uniforms) {
            this.warpPortal.material.uniforms.time.value += 0.016;
        }
        
        // Position portal outside the asteroid belt
        this.warpTunnel.position.set(30000, 5000, 0);
        this.warpTunnel.rotation.z = Math.PI/2;
        
        // PORTAL GROWTH phase (0-0.2)
        if (progress < 0.2) {
            // Grow portal
            const portalProgress = progress / 0.2;
            const portalScale = portalProgress * 3.5;
            this.warpTunnel.scale.set(portalScale, portalScale, 1);
            
            // Medium-distance side view of portal formation
            this.camera.position.set(0, 6000, 12000);
            this.camera.lookAt(30000, 5000, 0); // Look at portal
        }
        
        // SHIP EMERGENCE and JOURNEY phase (0.2-0.7)
        if (progress >= 0.2 && progress < 0.7) {
            // Make ship visible when it first emerges
            if (progress >= 0.2 && !this.starDreadnought.ship.visible) {
                this.starDreadnought.ship.visible = true;
                this.flashOverlay(0.3);
                
                // Play arrival sound using Tone.js
                if (this.introSounds.shipArrival) {
                    this.introSounds.shipArrival.play();
                }
            }
            
            // Smooth continuous movement along Bezier curve
            const t = (progress - 0.2) / 0.5; // Normalized time for this phase
            const easeInOut = t < 0.5 
                ? 2 * t * t 
                : 1 - Math.pow(-2 * t + 2, 2) / 2;
            
            // Bezier curve control points for ship path
            const start = new THREE.Vector3(30000, 5000, 0);        // Portal position
            const control = new THREE.Vector3(26000, 5300, -2000);  // Control point for curve
            const end = new THREE.Vector3(22000, 5000, 0);          // Final position above belt
            
            // Calculate position along quadratic Bezier curve
            const p0 = new THREE.Vector3();
            const p1 = new THREE.Vector3();
            const p2 = new THREE.Vector3();
            
            p0.copy(start).multiplyScalar(Math.pow(1-easeInOut, 2));
            p1.copy(control).multiplyScalar(2 * (1-easeInOut) * easeInOut);
            p2.copy(end).multiplyScalar(easeInOut * easeInOut);
            
            const position = new THREE.Vector3()
                .add(p0)
                .add(p1)
                .add(p2);
            
            // Add subtle vertical oscillation like a naval vessel
            position.y += Math.sin(progress * Math.PI * 3) * 80;
            
            // Update ship position
            this.starDreadnought.ship.position.copy(position);
            
            // Engine power during journey
            const enginePower = 0.4 + easeInOut * 0.6;
            this.starDreadnought.setEnginesPower(enginePower);
            
            // Fade out portal as ship moves away
            if (progress > 0.3) {
                const portalFade = Math.min((progress - 0.3) / 0.3, 1.0);
                if (this.portalParticles.material) {
                    this.portalParticles.material.opacity = 1 - portalFade;
                }
                if (this.warpPortal.material) {
                    this.warpPortal.material.opacity = 1 - portalFade;
                }
            }
            
            // Tracking shot alongside ship journey
            const shipPos = this.starDreadnought.ship.position.clone();
            this.camera.position.set(
                shipPos.x - 3000, 
                shipPos.y + 1000, 
                8000
            );
            this.camera.lookAt(shipPos);
        }
        
        // PLAYER DEPLOYMENT phase (0.7-1.0)
        if (progress >= 0.7) {
            // Ensure portal is fully invisible
            if (this.portalParticles.material) {
                this.portalParticles.material.opacity = 0;
            }
            if (this.warpPortal.material) {
                this.warpPortal.material.opacity = 0;
            }
            
            // Activate teleport beam if not already active
            if (progress < 0.75 && !this.starDreadnought.teleportBeamActive) {
                this.starDreadnought.activateTeleportBeam();
                
                // Play teleport sound using Tone.js
                if (this.introSounds.teleport) {
                    this.introSounds.teleport.play();
                }
            }
            
            // Update teleport beam
            this.starDreadnought.updateTeleportBeam(progress);
            
            // Deploy player ship
            if (progress > 0.8 && this.spaceship && !this.spaceship.mesh.visible) {
                // Position player ship BELOW dreadnought but ABOVE the asteroid belt
                const dreadPos = this.starDreadnought.ship.position;
                this.spaceship.mesh.position.set(
                    dreadPos.x, 
                    dreadPos.y - 2000, // 2000 units below dreadnought
                    dreadPos.z
                );
                
                // Properly undock the ship - this is critical to update game state
                if (this.spaceship.isDocked) {
                    console.log("Undocking player ship during intro sequence");
                    this.spaceship.isDocked = false; // Force undock directly to avoid position reset
                    this.spaceship.mesh.visible = true;
                } else {
                    this.spaceship.mesh.visible = true;
                }
                
                // Store final player position
                this.finalPlayerPosition = this.spaceship.mesh.position.clone();
                
                // Add shield effect to player ship
                this.createPlayerShieldEffect();
                
                // Flash effect for ship appearance
                this.flashOverlay(0.3);
            }
            
            // Teleport beam view camera
            const shipPos = this.starDreadnought.ship.position.clone();
            const t = (progress - 0.7) / 0.3;
            this.camera.position.set(
                shipPos.x - 2000 + t * 2000,
                shipPos.y + 2000,
                5000 - t * 3000
            );
            
            // Look at midpoint between ship and deployed player
            const lookY = shipPos.y - 1000;
            this.camera.lookAt(shipPos.x, lookY, shipPos.z);
        }
    }
    
    updateDeparturePhase(progress) {
        // Simple departure sequence: rotate ship 180 degrees and go back through original portal
        
        // Original portal location
        const portalPos = new THREE.Vector3(30000, 5000, 0);
        
        // FIRST HALF: Ship rotates and portal reappears (0-0.5)
        if (progress < 0.5) {
            // Turn off teleport beam at start
            if (progress < 0.1 && this.starDreadnought.teleportBeamActive) {
                this.starDreadnought.deactivateTeleportBeam();
            }
            
            // Make portal visible again at original position
            if (progress > 0.1) {
                // Position portal back at original entry point
                this.warpTunnel.position.copy(portalPos);
                this.warpTunnel.visible = true;
                this.warpTunnel.rotation.z = Math.PI/2; // Original orientation
                
                // Portal should be at full size immediately
                this.warpTunnel.scale.set(3.5, 3.5, 1);
                
                // Fade in portal
                const portalProgress = Math.min((progress - 0.1) / 0.3, 1.0);
                if (this.portalParticles.material) {
                    this.portalParticles.material.opacity = portalProgress;
                }
                if (this.warpPortal.material) {
                    this.warpPortal.material.opacity = portalProgress;
                }
            }
            
            // Simple 180 degree rotation
            if (progress > 0.2) {
                const rotateProgress = Math.min((progress - 0.2) / 0.3, 1.0);
                const startRot = Math.PI/2;  // Currently facing center
                const endRot = 3 * Math.PI/2; // 180 degree rotation (facing back toward original portal)
                this.starDreadnought.ship.rotation.y = startRot + (endRot - startRot) * rotateProgress;
            }
            
            // Fixed camera position from the side to view the rotation
            const shipPos = this.starDreadnought.ship.position.clone();
            this.camera.position.set(
                shipPos.x,
                shipPos.y + 3000, // High-ish angle
                shipPos.z + 8000  // Side view
            );
            this.camera.lookAt(shipPos);
        }
        
        // SECOND HALF: Ship accelerates through original portal and disappears (0.5-1.0)
        else {
            // Calculate movement progress for this phase
            const moveProgress = (progress - 0.5) / 0.5;
            
            // Ship position calculation - go back toward original portal
            const startPos = new THREE.Vector3(22000, 5000, 0); // Ship's current position
            const beyondPos = new THREE.Vector3(35000, 5000, 0); // Beyond portal
            
            // Simple acceleration curve
            const easeIn = moveProgress * moveProgress; // Accelerating movement
            
            // Ship position calculation
            let position;
            if (moveProgress < 0.7) {
                // Move to portal
                const t = easeIn / 0.5; // Normalized and accelerated
                position = new THREE.Vector3().lerpVectors(startPos, portalPos, t);
            } else {
                // Continue beyond portal
                const t = (moveProgress - 0.7) / 0.3;
                position = new THREE.Vector3().lerpVectors(portalPos, beyondPos, t);
            }
            
            // Update ship position
            this.starDreadnought.ship.position.copy(position);
            
            // Increase engine power for dramatic exit
            this.starDreadnought.setEnginesPower(0.7 + moveProgress * 0.8);
            
            // Flash when ship enters portal
            if (moveProgress > 0.6 && moveProgress < 0.63) {
                this.flashOverlay(0.4);
                
                // Play warp sound for re-entry
                if (this.introSounds.warp) {
                    this.introSounds.warp.play();
                }
            }
            
            // Hide ship after it enters portal
            if (moveProgress > 0.65) {
                this.starDreadnought.ship.visible = false;
            }
            
            // Collapse portal at the very end
            if (moveProgress > 0.9) {
                const collapseProgress = (moveProgress - 0.9) / 0.1;
                const collapseScale = (1 - collapseProgress) * 3.5;
                this.warpTunnel.scale.set(collapseScale, collapseScale, 1);
            }
            
            // Static camera position showing ship's departure path
            const shipPos = startPos.clone(); // Use initial position as reference
            this.camera.position.set(
                shipPos.x - 2000,
                shipPos.y + 3000,
                10000 // Side view
            );
            // Look at the midpoint of the departure path
            const lookPos = new THREE.Vector3().lerpVectors(startPos, portalPos, 0.5);
            this.camera.lookAt(lookPos);
        }
    }
    
    createPlayerShieldEffect() {
        // Create a sphere slightly larger than the player ship
        const geometry = new THREE.SphereGeometry(30, 32, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0x88ccff,
            transparent: true, 
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        
        this.playerShieldEffect = new THREE.Mesh(geometry, material);
        this.playerShieldEffect.scale.set(1.2, 1.2, 1.2);
        this.spaceship.mesh.add(this.playerShieldEffect);
        
        // Add pulsing animation
        this.shieldPulseTime = 0;
    }
    
    // Update portal shader uniforms
    updatePortalEffect() {
        if (this.warpPortal && this.warpPortal.material.uniforms) {
            this.warpPortal.material.uniforms.time.value += 0.016;
        }
    }
    
    flashOverlay(maxOpacity = 0.6) {
        if (!this.overlay) return;
        
        // Flash overlay effect
        this.overlay.style.opacity = maxOpacity.toString();
        
        // Fade out after flash
        setTimeout(() => {
            this.overlay.style.opacity = '0';
        }, 300);
    }
    
    setupSkipHandler() {
        // Add skip button
        const skipButton = document.createElement('div');
        skipButton.id = 'skip-intro-button';
        skipButton.textContent = 'SKIP INTRO';
        skipButton.style.position = 'fixed';
        skipButton.style.bottom = '20px';
        skipButton.style.right = '20px';
        skipButton.style.padding = '10px 15px';
        skipButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        skipButton.style.color = '#fff';
        skipButton.style.border = '1px solid #fff';
        skipButton.style.borderRadius = '5px';
        skipButton.style.cursor = 'pointer';
        skipButton.style.zIndex = '10000';
        skipButton.style.fontFamily = 'Arial, sans-serif';
        
        skipButton.addEventListener('click', () => {
            this.skipSequence();
        });
        
        document.body.appendChild(skipButton);
        this.skipButton = skipButton;
    }
    
    skipSequence() {
        // Jump to end of sequence
        this.completeSequence();
    }
    
    completeSequence() {
        console.log("Intro sequence complete");
        this.isPlaying = false;
        
        // Remove warp tunnel from scene
        this.scene.remove(this.warpTunnel);
        
        // Hide dreadnought
        this.starDreadnought.ship.visible = false;
        
        // Enable skip button for next time
        this.skipEnabled = true;
        
        // Remove shield effect from player
        if (this.playerShieldEffect) {
            this.spaceship.mesh.remove(this.playerShieldEffect);
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
        
        // Remove dialogue box if it exists
        if (this.dialogueBox) {
            document.body.removeChild(this.dialogueBox);
            this.dialogueBox = null;
        }
        
        // Clear typing interval if running
        if (this.typeInterval) {
            clearInterval(this.typeInterval);
            this.typeInterval = null;
        }
        
        // Make sure player ship is visible but DO NOT reset position
        if (this.spaceship && this.spaceship.mesh) {
            this.spaceship.mesh.visible = true;
            
            // IMPORTANT: Make sure ship is properly undocked
            if (this.spaceship.isDocked) {
                console.log("Forcing ship to undocked state after intro sequence");
                this.spaceship.isDocked = false;
            }
            
            // Log the final player position for debugging
            console.log("Player final position:", 
                this.spaceship.mesh.position.x, 
                this.spaceship.mesh.position.y, 
                this.spaceship.mesh.position.z
            );
        }
        
        // Call completion callback if provided
        if (this.onComplete && typeof this.onComplete === 'function') {
            // Use setTimeout to make sure this executes after the animation frame
            setTimeout(() => {
                console.log("Executing intro sequence completion callback");
                this.onComplete();
            }, 100);
        }
    }
} 