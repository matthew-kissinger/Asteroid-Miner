// miningSystem.js - Handles asteroid mining functionality

export class MiningSystem {
    constructor(spaceship, scene) {
        this.spaceship = spaceship;
        this.scene = scene;
        this.isMining = false;
        this.targetAsteroid = null;
        this.miningProgress = 0;
        this.lastDestroyedAsteroid = null;
        
        // Mining speeds based on resource types (lower = slower mining)
        this.miningSpeedByType = {
            iron: 0.006,     // Base mining speed
            gold: 0.0012,    // 5x slower than iron
            platinum: 0.0004  // 15x slower than iron
        };
        this.miningSpeed = 0.03; // Default speed, will be set based on asteroid type
        this.miningDistance = 600; // Maximum mining distance
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
        this.targetAsteroid = asteroid;
        
        // Set mining speed based on asteroid resource type and apply efficiency modifier
        if (asteroid && asteroid.resourceType) {
            const resourceType = asteroid.resourceType.toLowerCase();
            const baseSpeed = this.miningSpeedByType[resourceType] || this.miningSpeedByType.iron;
            const efficiency = this.getMiningEfficiency();
            
            this.miningSpeed = baseSpeed * efficiency;
            console.log(`Mining ${resourceType} asteroid with speed: ${this.miningSpeed} (efficiency: ${efficiency}x)`);
        } else {
            // Default to iron speed if no resource type is specified
            this.miningSpeed = this.miningSpeedByType.iron * this.getMiningEfficiency();
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
        const timeSeconds = Math.round(1 / this.miningSpeed);
        const efficiency = this.getMiningEfficiency();
        
        let efficiencyText = "";
        if (efficiency > 1.0) {
            efficiencyText = ` [${Math.round(efficiency * 100)}% efficiency]`;
        }
        
        miningStatusElement.textContent = `MINING ${resourceType.toUpperCase()} (${timeSeconds}s per unit)${efficiencyText}`;
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
            window.game.audio.stopSound('laser');
        }
    }
    
    update() {
        // Update mining cooldown
        if (this.miningCooldown > 0) {
            this.miningCooldown--;
        }
        
        // Update mining if active
        if (this.isMining) {
            this.updateMining();
        }
        
        // Update mining particles if visible
        if (this.miningParticles && this.miningParticles.visible) {
            this.updateMiningParticles();
        }
    }
    
    updateMining() {
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
        
        // Update mining progress
        this.miningProgress += this.miningSpeed;
        
        // Update laser beam position
        this.updateLaserBeam();
        
        // Update mining particles position
        if (this.miningParticles && this.miningParticles.visible) {
            this.miningParticles.position.copy(this.targetAsteroid.mesh.position);
        }
        
        // Extract resources when mining progress reaches 1.0
        if (this.miningProgress >= 1.0) {
            this.extractResources();
            this.miningProgress = 0; // Reset for continuous mining
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
        const shipOffset = new THREE.Vector3(0, 0, -15); // Negative Z to go to the front of the ship
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
            
            if (dist > 9) { // Larger reset distance
                positions[i] = (Math.random() - 0.5) * 6;
                positions[i+1] = (Math.random() - 0.5) * 6;
                positions[i+2] = (Math.random() - 0.5) * 6;
            }
        }
        this.miningParticles.geometry.attributes.position.needsUpdate = true;
    }
    
    extractResources() {
        if (!this.targetAsteroid) return;
        
        // Get the resource type from the asteroid
        const resourceType = this.targetAsteroid.resourceType || 'iron'; // Default to iron if no type specified
        
        // Get mining efficiency for resource extraction bonus
        const efficiency = this.getMiningEfficiency();
        const bonusChance = (efficiency - 1.0) * 0.5; // Chance for bonus resources based on efficiency
        
        // Add resources based on type (random amount within a range)
        let amount = 0;
        switch (resourceType.toLowerCase()) {
            case 'iron':
                amount = Math.floor(Math.random() * 3) + 1; // 1-3 iron
                break;
            case 'gold':
                amount = Math.floor(Math.random() * 2) + 1; // 1-2 gold
                break;
            case 'platinum':
                amount = 1; // 1 platinum (rarer)
                break;
            default:
                amount = 1; // Default to 1 iron
        }
        
        // Apply bonus resources based on mining efficiency
        if (efficiency > 1.0 && Math.random() < bonusChance) {
            amount += 1; // 1 extra resource
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
        
        // Reduce asteroid health
        if (this.targetAsteroid.mesh.userData.health) {
            // Higher efficiency reduces health faster
            const damageAmount = 10 * (1 + (efficiency - 1) * 0.5);
            this.targetAsteroid.mesh.userData.health -= damageAmount;
            
            // If asteroid is depleted, remove it and stop mining
            if (this.targetAsteroid.mesh.userData.health <= 0) {
                // Create a small explosion effect
                this.createAsteroidBreakEffect(this.targetAsteroid.mesh.position);
                
                // Remove from scene
                this.scene.remove(this.targetAsteroid.mesh);
                
                // Store reference to the destroyed asteroid
                this.lastDestroyedAsteroid = this.targetAsteroid;
                
                // Stop mining
                this.stopMining();
                this.targetAsteroid = null;
                
                return true; // Asteroid was destroyed
            }
        }
        
        return false; // No asteroid was destroyed
    }
    
    createAsteroidBreakEffect(position) {
        // Create particle effect for asteroid breaking
        const particleCount = 50;
        const particles = new THREE.BufferGeometry();
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xaaaaaa,
            size: 3, 
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
            
            // Random velocity in all directions
            velocities.push({
                x: (Math.random() - 0.5) * 2,
                y: (Math.random() - 0.5) * 2,
                z: (Math.random() - 0.5) * 2
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
} 