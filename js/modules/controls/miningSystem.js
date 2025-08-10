// miningSystem.js - Handles asteroid mining functionality

import * as THREE from 'three';

export class MiningSystem {
    constructor(spaceship, scene) {
        this.spaceship = spaceship;
        this.scene = scene;
        this.isMining = false;
        this.targetAsteroid = null;
        this.miningProgress = 0;
        this.lastDestroyedAsteroid = null;
        
        // Mining speeds for single-action mining that takes 7.5, 22.5, and 45 seconds respectively
        // Values are in progress per second (1 / seconds_required)
        this.miningSpeedByType = {
            iron: 0.133,     // 1/7.5 seconds to complete
            gold: 0.044,     // 1/22.5 seconds to complete
            platinum: 0.022  // 1/45 seconds to complete
        };
        this.miningSpeed = 0.133; // Default speed, will be set based on asteroid type
        this.miningDistance = 6000; // Maximum mining distance (reduced from 24000 to 12000)
        this.miningCooldown = 0;
        
        // Resources collected
        this.resources = {
            iron: 0,
            gold: 0,
            platinum: 0
        };
        
        this.setupMiningLaser();
    }
    
    // Helper method to get the mining efficiency from the spaceship
    getMiningEfficiency() {
        return this.spaceship && this.spaceship.miningEfficiency 
            ? this.spaceship.miningEfficiency 
            : 1.0; // Default value if spaceship property not available
    }
    
    setupMiningLaser() {
        // Create particle effect for mining impact
        const particleCount = 100;
        const particles = new THREE.BufferGeometry();
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xff5500,
            size: 1.5, // Increased for visibility
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.8
        });
        
        const positions = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = 0;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = 0;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.miningParticles = new THREE.Points(particles, particleMaterial);
        this.miningParticles.visible = false;
        this.scene.add(this.miningParticles);
    }
    
    setTargetAsteroid(asteroid) {
        try {
            console.log("MiningSystem: setTargetAsteroid called", asteroid);
            
            // Validate asteroid before setting it as the target
            if (!asteroid || !asteroid.mesh || !asteroid.mesh.position) {
                console.error("MiningSystem: Invalid asteroid provided to setTargetAsteroid");
                return false;
            }
            
            this.targetAsteroid = asteroid;
            
            // Set mining speed based on asteroid resource type and apply efficiency modifier
            if (asteroid && asteroid.resourceType) {
                const resourceType = asteroid.resourceType.toLowerCase();
                const baseSpeed = this.miningSpeedByType[resourceType] || this.miningSpeedByType.iron;
                const efficiency = this.getMiningEfficiency();
                
                this.miningSpeed = baseSpeed * efficiency;
                console.log(`Mining ${resourceType} asteroid with speed: ${this.miningSpeed} (efficiency: ${efficiency}x)`);
                
                // Update UI to show targeting info
                const targetInfo = document.getElementById('target-info');
                if (targetInfo) {
                    targetInfo.style.display = 'block';
                    
                    // Calculate distance and range status
                    const distance = Math.round(this.spaceship.mesh.position.distanceTo(asteroid.mesh.position));
                    const inRange = distance <= this.miningDistance;
                    
                    // Set color based on range
                    targetInfo.style.color = inRange ? '#30cfd0' : '#ff4400';
                    
                    // Update target name/type
                    const targetName = document.getElementById('target-name');
                    if (targetName) {
                        if (!inRange) {
                            targetName.textContent = `${resourceType.toUpperCase()} Asteroid - OUT OF RANGE`;
                            targetName.style.color = '#ff4400';
                        } else {
                            targetName.textContent = `${resourceType.toUpperCase()} Asteroid`;
                            targetName.style.color = '#30cfd0';
                        }
                    }
                    
                    // Update distance with range status
                    const targetDistance = document.getElementById('target-distance');
                    if (targetDistance) {
                        const rangeStatus = inRange ? ' [IN RANGE]' : ' [OUT OF RANGE]';
                        const rangeColor = inRange ? '#00ff00' : '#ff4400';
                        targetDistance.innerHTML = `Distance: ${distance} units<span style="color: ${rangeColor}">${rangeStatus}</span>`;
                    }
                }
            } else {
                // Default to iron speed if no resource type is specified
                this.miningSpeed = this.miningSpeedByType.iron * this.getMiningEfficiency();
            }
            
            return true;
        } catch (error) {
            console.error("MiningSystem: Error in setTargetAsteroid:", error);
            return false;
        }
    }
    
    startMining() {
        try {
            console.log("MiningSystem: startMining called");
            
            // Don't allow mining if no asteroid is targeted
            if (!this.targetAsteroid) {
                console.error("MiningSystem: Cannot start mining - no target asteroid set");
                return;
            }

            // Validate asteroid has required properties
            if (!this.targetAsteroid.mesh || !this.targetAsteroid.mesh.position) {
                console.error("MiningSystem: Target asteroid is missing mesh or position", this.targetAsteroid);
                return;
            }

            // Validate spaceship has required properties
            if (!this.spaceship || !this.spaceship.mesh || !this.spaceship.mesh.position) {
                console.error("MiningSystem: Spaceship is missing mesh or position");
                return;
            }
            
            // Check if asteroid is in mining range
            const distance = this.spaceship.mesh.position.distanceTo(this.targetAsteroid.mesh.position);
            console.log(`MiningSystem: Distance to asteroid: ${distance}, max range: ${this.miningDistance}`);
            
            if (distance > this.miningDistance) {
                // Show a message that target is out of range
                const targetInfo = document.getElementById('target-info');
                if (targetInfo) {
                    targetInfo.textContent = 'TARGET OUT OF RANGE';
                    targetInfo.style.color = '#ff4400';
                    targetInfo.style.display = 'block';
                    
                    // Hide after 2 seconds
                    setTimeout(() => {
                        targetInfo.style.display = 'none';
                    }, 2000);
                }
                console.log("MiningSystem: Target out of range");
                return;
            }
            
            // Set mining state to active
            this.isMining = true;
            this.miningProgress = 0;
            console.log("MiningSystem: Mining state activated");
            
            // Get or create laser beam element
            let laserBeam = document.getElementById('laser-beam');
            
            // If laser beam element doesn't exist, create it
            if (!laserBeam) {
                console.log("MiningSystem: Creating laser beam element");
                laserBeam = document.createElement('div');
                laserBeam.id = 'laser-beam';
                laserBeam.style.position = 'absolute';
                laserBeam.style.height = '2px';
                laserBeam.style.backgroundColor = '#ff3030';
                laserBeam.style.transformOrigin = '0 0';
                laserBeam.style.zIndex = '100';
                laserBeam.style.pointerEvents = 'none';
                document.body.appendChild(laserBeam);
            }
            
            // Show mining laser beam
            if (laserBeam) {
                laserBeam.style.display = 'block';
                
                // Adjust laser color based on resource type and mining level
                if (this.targetAsteroid.resourceType) {
                    const resourceType = this.targetAsteroid.resourceType.toLowerCase();
                    let laserColor = '#ff3030'; // Default red for iron
                    let glowColor = '#ff0000';
                    
                    if (resourceType === 'gold') {
                        laserColor = '#ffcc00'; // Gold color
                        glowColor = '#ffaa00';
                    } else if (resourceType === 'platinum') {
                        laserColor = '#66ffff'; // Cyan color for platinum
                        glowColor = '#00ffff';
                    }
                    
                    // Adjust intensity based on mining efficiency - brighter for higher efficiency
                    const efficiency = this.getMiningEfficiency();
                    if (efficiency > 1.0) {
                        // Make the laser more intense as mining level increases
                        const laserIntensity = Math.min(1.0 + (efficiency - 1.0) * 0.5, 3.0);
                        laserBeam.style.boxShadow = `0 0 ${10 * laserIntensity}px ${glowColor}, 0 0 ${20 * laserIntensity}px ${glowColor}`;
                    } else {
                        laserBeam.style.boxShadow = `0 0 10px ${glowColor}, 0 0 20px ${glowColor}`;
                    }
                    
                    laserBeam.style.backgroundColor = laserColor;
                } else {
                    // Default red laser
                    laserBeam.style.backgroundColor = '#ff3030'; 
                    laserBeam.style.boxShadow = '0 0 10px #ff0000, 0 0 20px #ff0000';
                }
            }
            
            // Show mining particles
            if (this.miningParticles) {
                this.miningParticles.visible = true;
                
                // Adjust particle color based on resource type
                if (this.targetAsteroid.resourceType && this.miningParticles.material) {
                    const resourceType = this.targetAsteroid.resourceType.toLowerCase();
                    
                    if (resourceType === 'iron') {
                        this.miningParticles.material.color.set(0xff5500); // Orange
                    } else if (resourceType === 'gold') {
                        this.miningParticles.material.color.set(0xffcc00); // Yellow
                    } else if (resourceType === 'platinum') {
                        this.miningParticles.material.color.set(0x66ffff); // Light blue
                    }
                    
                    // Adjust particle size based on mining efficiency
                    const efficiency = this.getMiningEfficiency();
                    if (efficiency > 1.0) {
                        this.miningParticles.material.size = 1.5 * Math.sqrt(efficiency);
                    }
                }
            }
            
            // Create or update mining progress bar
            let miningProgressContainer = document.getElementById('mining-progress-container');
            if (!miningProgressContainer) {
                console.log("MiningSystem: Creating mining progress container");
                miningProgressContainer = document.createElement('div');
                miningProgressContainer.id = 'mining-progress-container';
                miningProgressContainer.style.position = 'absolute';
                miningProgressContainer.style.bottom = '20px';
                miningProgressContainer.style.left = '50%';
                miningProgressContainer.style.transform = 'translateX(-50%)';
                miningProgressContainer.style.width = '200px';
                miningProgressContainer.style.height = '10px';
                miningProgressContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                miningProgressContainer.style.border = '1px solid #30cfd0';
                miningProgressContainer.style.zIndex = '1000';
                document.body.appendChild(miningProgressContainer);
                
                const progressBar = document.createElement('div');
                progressBar.id = 'mining-progress-bar';
                progressBar.style.width = '0%';
                progressBar.style.height = '100%';
                progressBar.style.backgroundColor = '#30cfd0';
                miningProgressContainer.appendChild(progressBar);
            } else {
                miningProgressContainer.style.display = 'block';
                const progressBar = document.getElementById('mining-progress-bar');
                if (progressBar) {
                    progressBar.style.width = '0%';
                }
            }
            
            // Activate the spaceship's laser emitter
            if (this.spaceship && typeof this.spaceship.activateMiningLaser === 'function') {
                this.spaceship.activateMiningLaser();
            }
            
            // Update mining status display with timing info
            this.updateMiningStatusWithTime();
            
            // Trigger laser sound
            if (window.game && window.game.audio) {
                window.game.audio.playSound('mining-laser');
            } else if (window.game && window.game.audio) {
                window.game.audio.playSound('laser');
            }
            
            console.log("MiningSystem: Mining successfully started");
        } catch (error) {
            console.error("MiningSystem: Error in startMining:", error);
            this.isMining = false;
        }
    }
    
    // Update the mining status with time estimate
    updateMiningStatusWithTime() {
        const miningStatusElement = document.getElementById('mining-status');
        if (!miningStatusElement || !this.targetAsteroid || !this.targetAsteroid.resourceType) return;
        
        // Calculate approximate time to mine based on resource type
        const resourceType = this.targetAsteroid.resourceType.toLowerCase();
        const secondsRequired = Math.round(1 / this.miningSpeed);
        const efficiency = this.getMiningEfficiency();
        
        let efficiencyText = "";
        if (efficiency > 1.0) {
            efficiencyText = ` [${Math.round(efficiency * 100)}% efficiency]`;
        }
        
        miningStatusElement.textContent = `MINING ${resourceType.toUpperCase()} (${secondsRequired}s)${efficiencyText}`;
        miningStatusElement.style.color = '#ff4400';
    }
    
    stopMining() {
        if (!this.isMining) return;
        
        this.isMining = false;
        this.miningProgress = 0;
        
        // Hide laser beam
        const laserBeam = document.getElementById('laser-beam');
        if (laserBeam) {
            laserBeam.style.display = 'none';
        }
        
        // Hide mining particles
        if (this.miningParticles) {
            this.miningParticles.visible = false;
        }
        
        // Hide mining progress bar
        const miningProgressContainer = document.getElementById('mining-progress-container');
        if (miningProgressContainer) {
            miningProgressContainer.style.display = 'none';
        }
        
        // Deactivate the spaceship's laser emitter
        this.spaceship.deactivateMiningLaser();
        
        // Reset mining status display
        const miningStatusElement = document.getElementById('mining-status');
        if (miningStatusElement) {
            miningStatusElement.textContent = 'INACTIVE';
            miningStatusElement.style.color = '#30cfd0';
        }
        
        // Stop laser sound
        if (window.game && window.game.audio) {
            window.game.audio.stopSound('mining-laser');
        }
    }
    
    update(deltaTime = 1/60) {
        // Update mining cooldown
        if (this.miningCooldown > 0) {
            this.miningCooldown--;
        }
        
        // Update mining if active
        if (this.isMining) {
            this.updateMining(deltaTime);
        }
        
        // Update mining particles if visible
        if (this.miningParticles && this.miningParticles.visible) {
            this.updateMiningParticles();
        }
        
        // Update target info if we have a target but aren't mining
        if (this.targetAsteroid && !this.isMining) {
            this.updateTargetInfo();
        }
    }
    
    updateMining(deltaTime = 1/60) {
        // Make sure we have a target asteroid
        if (!this.targetAsteroid || !this.isMining) {
            this.stopMining();
            return;
        }
        
        // Check if asteroid is in range - if not, stop mining and require new click
        const distance = this.spaceship.mesh.position.distanceTo(this.targetAsteroid.mesh.position);
        if (distance > this.miningDistance) {
            this.stopMining();
            return;
        }
        
        // Update mining progress using deltaTime for frame-rate independence
        this.miningProgress += this.miningSpeed * deltaTime;
        
        // Update laser beam position
        this.updateLaserBeam();
        
        // Update mining particles position
        if (this.miningParticles && this.miningParticles.visible) {
            this.miningParticles.position.copy(this.targetAsteroid.mesh.position);
        }
        
        // Complete mining when progress reaches 1.0
        if (this.miningProgress >= 1.0) {
            // Add resources from asteroid in one batch
            this.addAsteroidResources();
            
            // Create asteroid break effect
            this.createAsteroidBreakEffect(this.targetAsteroid.mesh.position);
            
            // Store reference to the destroyed asteroid
            this.lastDestroyedAsteroid = this.targetAsteroid;
            
            // Remove asteroid from scene
            this.scene.remove(this.targetAsteroid.mesh);
            
            // Stop mining
            this.stopMining();
            this.targetAsteroid = null;
        }
        
        // Update the progress bar
        const progressBar = document.getElementById('mining-progress-bar');
        if (progressBar) {
            progressBar.style.width = `${this.miningProgress * 100}%`;
        }
    }
    
    updateLaserBeam() {
        const laserBeam = document.getElementById('laser-beam');
        if (!laserBeam || !this.targetAsteroid || !this.isMining) return;
        
        // Create a vector pointing from the ship to the asteroid
        const shipPosition = this.spaceship.mesh.position.clone();
        const asteroidPosition = this.targetAsteroid.mesh.position.clone();
        
        // Add a small offset to the ship position to start from the FRONT of the mining laser
        // The ship's coordinate system has -Z as the forward direction, so use negative Z
        const shipOffset = new THREE.Vector3(0, 0, -60); // 4x the original offset (-15)
        shipOffset.applyQuaternion(this.spaceship.mesh.quaternion);
        shipPosition.add(shipOffset);
        
        // Convert 3D positions to screen coordinates
        const tempVector = new THREE.Vector3();
        
        // Get the camera
        const camera = this.scene.camera;
        if (!camera) return;
        
        // Convert ship position to screen space
        tempVector.copy(shipPosition);
        tempVector.project(camera);
        const shipX = (tempVector.x * 0.5 + 0.5) * window.innerWidth;
        const shipY = (-(tempVector.y * 0.5) + 0.5) * window.innerHeight;
        
        // Convert asteroid position to screen space
        tempVector.copy(asteroidPosition);
        tempVector.project(camera);
        const asteroidX = (tempVector.x * 0.5 + 0.5) * window.innerWidth;
        const asteroidY = (-(tempVector.y * 0.5) + 0.5) * window.innerHeight;
        
        // Calculate distance and angle
        const dx = asteroidX - shipX;
        const dy = asteroidY - shipY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        
        // Update laser beam style
        laserBeam.style.width = `${distance}px`;
        laserBeam.style.left = `${shipX}px`;
        laserBeam.style.top = `${shipY}px`;
        laserBeam.style.transform = `rotate(${angle}rad)`;
        
        // Animate the laser beam for a more dynamic effect
        const intensity = 0.8 + Math.sin(Date.now() * 0.01) * 0.2;
        laserBeam.style.opacity = intensity.toString();
        
        // Make laser thickness vary with mining efficiency
        const efficiency = this.getMiningEfficiency();
        const thickness = Math.max(2, Math.ceil(2 * Math.sqrt(efficiency)));
        laserBeam.style.height = `${thickness}px`;
        
        // Create multiple beams for a more powerful effect
        if (!laserBeam.hasChildNodes()) {
            // Create 2 additional beams for a thicker laser effect
            for (let i = 0; i < 2; i++) {
                const additionalBeam = document.createElement('div');
                additionalBeam.style.position = 'absolute';
                additionalBeam.style.left = '0';
                additionalBeam.style.top = `${i === 0 ? -1 : 1}px`;
                additionalBeam.style.width = '100%';
                additionalBeam.style.height = '1px';
                additionalBeam.style.backgroundColor = '#ff6060';
                additionalBeam.style.opacity = '0.7';
                laserBeam.appendChild(additionalBeam);
            }
        }
    }
    
    updateMiningParticles() {
        const positions = this.miningParticles.geometry.attributes.position.array;
        
        // Get mining efficiency to adjust particle behavior
        const efficiency = this.getMiningEfficiency();
        // Particles move faster with higher efficiency
        const particleSpeed = 0.3 * efficiency;
        
        for (let i = 0; i < positions.length; i += 3) {
            // Move particles outward slightly
            const dir = new THREE.Vector3(positions[i], positions[i+1], positions[i+2]);
            dir.normalize().multiplyScalar(particleSpeed);
            
            positions[i] += dir.x;
            positions[i+1] += dir.y;
            positions[i+2] += dir.z;
            
            // Reset particles that move too far
            const dist = Math.sqrt(
                positions[i] * positions[i] + 
                positions[i+1] * positions[i+1] + 
                positions[i+2] * positions[i+2]
            );
            
            if (dist > 36) { // 4x original reset distance (was 9)
                positions[i] = (Math.random() - 0.5) * 24; // 4x original spread (was 6)
                positions[i+1] = (Math.random() - 0.5) * 24;
                positions[i+2] = (Math.random() - 0.5) * 24;
            }
        }
        this.miningParticles.geometry.attributes.position.needsUpdate = true;
    }
    
    /**
     * Add all resources from the mined asteroid to the player's inventory at once
     */
    addAsteroidResources() {
        if (!this.targetAsteroid) return;
        
        // Get the resource type from the asteroid
        const resourceType = this.targetAsteroid.resourceType || 'iron'; // Default to iron if no type specified
        
        // Get mining efficiency for resource extraction bonus
        const efficiency = this.getMiningEfficiency();
        const bonusChance = (efficiency - 1.0) * 0.5; // Chance for bonus resources based on efficiency
        
        // Calculate base amount based on asteroid type
        let amount = 0;
        switch (resourceType.toLowerCase()) {
            case 'iron':
                amount = Math.floor(Math.random() * 5) + 10; // 10-14 iron
                break;
            case 'gold':
                amount = Math.floor(Math.random() * 3) + 5; // 5-7 gold
                break;
            case 'platinum':
                amount = Math.floor(Math.random() * 2) + 2; // 2-3 platinum
                break;
            default:
                amount = 10; // Default to 10 iron
        }
        
        // Apply bonus resources based on mining efficiency
        if (efficiency > 1.0 && Math.random() < bonusChance) {
            amount = Math.ceil(amount * 1.2); // 20% bonus
        }
        
        // Update resource counts
        switch (resourceType.toLowerCase()) {
            case 'iron':
                this.resources.iron += amount;
                break;
            case 'gold':
                this.resources.gold += amount;
                break;
            case 'platinum':
                this.resources.platinum += amount;
                break;
            default:
                this.resources.iron += amount;
        }
        
        console.log(`MiningSystem: Added ${amount} ${resourceType} from asteroid`);
        
        // Show resource gain notification
        this.showResourceGainNotification(amount, resourceType);
        
        return true;
    }
    
    /**
     * Show a notification for resources gained
     */
    showResourceGainNotification(amount, resourceType) {
        // Get color based on resource type
        let color = '#a0a0a0'; // Default gray for iron
        if (resourceType === 'gold') {
            color = '#ffcc00';
        } else if (resourceType === 'platinum') {
            color = '#66ffff';
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.textContent = `+${amount} ${resourceType.toUpperCase()}`;
        notification.style.position = 'absolute';
        notification.style.top = '40%';
        notification.style.left = '50%';
        notification.style.transform = 'translate(-50%, -50%)';
        notification.style.color = color;
        notification.style.fontSize = '24px';
        notification.style.fontWeight = 'bold';
        notification.style.textShadow = '0 0 8px black';
        notification.style.zIndex = '1000';
        notification.style.opacity = '1';
        notification.style.transition = 'all 1.5s ease-out';
        
        document.body.appendChild(notification);
        
        // Animate the notification
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.top = '30%';
            
            // Remove after animation
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 1500);
        }, 100);
    }
    
    createAsteroidBreakEffect(position) {
        // Create particle effect for asteroid breaking
        const particleCount = 50;
        const particles = new THREE.BufferGeometry();
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xaaaaaa,
            size: 12, // 4x original size (was 3)
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.8
        });
        
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];
        
        for (let i = 0; i < particleCount; i++) {
            // Start at asteroid position
            positions[i * 3] = position.x;
            positions[i * 3 + 1] = position.y;
            positions[i * 3 + 2] = position.z;
            
            // Random velocity in all directions - 4x faster to match scale
            velocities.push({
                x: (Math.random() - 0.5) * 8,  // 4x original speed (was 2)
                y: (Math.random() - 0.5) * 8,  // 4x original speed
                z: (Math.random() - 0.5) * 8   // 4x original speed
            });
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particleSystem = new THREE.Points(particles, particleMaterial);
        this.scene.add(particleSystem);
        
        // Animate particles
        let frameCount = 0;
        const animateParticles = () => {
            frameCount++;
            
            // Update particle positions
            const positions = particleSystem.geometry.attributes.position.array;
            
            for (let i = 0; i < particleCount; i++) {
                positions[i * 3] += velocities[i].x;
                positions[i * 3 + 1] += velocities[i].y;
                positions[i * 3 + 2] += velocities[i].z;
            }
            
            particleSystem.geometry.attributes.position.needsUpdate = true;
            
            // Fade out over time
            particleSystem.material.opacity = Math.max(0, 0.8 - frameCount * 0.02);
            
            // Remove after 40 frames
            if (frameCount < 40) {
                requestAnimationFrame(animateParticles);
            } else {
                this.scene.remove(particleSystem);
            }
        };
        
        animateParticles();
    }
    
    // New method to retrieve the last destroyed asteroid and reset the property
    getLastDestroyedAsteroid() {
        const destroyedAsteroid = this.lastDestroyedAsteroid;
        this.lastDestroyedAsteroid = null; // Reset after getting it
        return destroyedAsteroid;
    }
    
    // Add a new method to update target info in the UI
    updateTargetInfo() {
        if (!this.targetAsteroid || !this.targetAsteroid.mesh) return;
        
        try {
            // Update distance calculation
            const distance = this.spaceship.mesh.position.distanceTo(this.targetAsteroid.mesh.position);
            const inRange = distance <= this.miningDistance;
            
            // Update UI elements if they exist
            const targetDistance = document.getElementById('target-distance');
            if (targetDistance) {
                const rangeStatus = inRange ? ' [IN RANGE]' : ' [OUT OF RANGE]';
                const rangeColor = inRange ? '#00ff00' : '#ff4400';
                targetDistance.innerHTML = `Distance: ${Math.round(distance)} units<span style="color: ${rangeColor}">${rangeStatus}</span>`;
            }
            
            // Update target info color
            const targetInfo = document.getElementById('target-info');
            if (targetInfo) {
                targetInfo.style.color = inRange ? '#30cfd0' : '#ff4400';
            }
            
            // Update target name to show range status
            const targetName = document.getElementById('target-name');
            if (targetName && this.targetAsteroid.resourceType) {
                const resourceType = this.targetAsteroid.resourceType.toUpperCase();
                if (!inRange) {
                    targetName.textContent = `${resourceType} Asteroid - OUT OF RANGE`;
                    targetName.style.color = '#ff4400';
                } else {
                    targetName.textContent = `${resourceType} Asteroid`;
                    targetName.style.color = '#30cfd0';
                }
            }
        } catch (error) {
            console.error("MiningSystem: Error updating target info:", error);
        }
    }
} 