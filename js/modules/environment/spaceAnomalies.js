// spaceAnomalies.js - Creates and manages space anomalies with collectible energy orbs

import * as THREE from 'three';

export class SpaceAnomalies {
    constructor(scene) {
        this.scene = scene;
        this.anomalies = [];
        
        // Anomalies are outside the asteroid belt
        this.minRadius = 32000; // Beyond asteroid belt
        this.maxRadius = 45000; // Not too far into deep space
        this.width = 3000; // Height variation
        
        // Scale factors for size
        this.anomalyScale = 4; // Make anomalies 4x bigger
        this.orbScale = 4;     // Make orbs 4x bigger
        
        // Orb rarity and values
        this.orbValues = {
            common: 100,    // Green orb - 100 credits
            uncommon: 500,  // Blue orb - 500 credits
            rare: 1500,     // Purple orb - 1500 credits
            epic: 5000,     // Orange orb - 5000 credits
            legendary: 15000 // Red orb - 15000 credits
        };
        
        // Initialize timer system for dynamic anomaly spawning
        this.spawnTimer = 0;
        this.checkInterval = 60; // Check every 60 seconds (1 minute)
        this.spawnChance = 0.5; // 50% chance to spawn a new anomaly
        this.despawnChance = 0.3; // 30% chance for an anomaly to despawn
        
        // Available anomaly types
        this.anomalyTypes = [
            'vortex',
            'crystalCluster',
            'nebulaNexus',
            'quantumFlux',
            'darkMatter'
        ];
        
        // Maximum number of anomalies that can exist simultaneously
        this.maxAnomalies = 5;
        
        // Notify about active anomalies
        this.updateAnomalyCountDisplay();
    }
    
    // Method to check and potentially spawn/despawn anomalies
    checkAnomalySpawning(deltaTime) {
        // Increment timer
        this.spawnTimer += deltaTime;
        
        // Check if it's time to evaluate spawn/despawn
        if (this.spawnTimer >= this.checkInterval) {
            // Reset timer
            this.spawnTimer -= this.checkInterval;
            
            // Check for potential new anomaly spawn
            if (this.anomalies.length < this.maxAnomalies && Math.random() < this.spawnChance) {
                // Determine which anomaly type to spawn
                const availableTypes = this.anomalyTypes.filter(type => 
                    !this.anomalies.some(anomaly => anomaly.type === type)
                );
                
                if (availableTypes.length > 0) {
                    const typeToSpawn = availableTypes[Math.floor(Math.random() * availableTypes.length)];
                    this.spawnAnomaly(typeToSpawn);
                    
                    // Update HUD with new count
                    this.updateAnomalyCountDisplay();
                }
            }
            
            // Check each existing anomaly for potential despawn
            const anomaliesToRemove = [];
            this.anomalies.forEach(anomaly => {
                if (Math.random() < this.despawnChance) {
                    anomaliesToRemove.push(anomaly);
                }
            });
            
            // Remove marked anomalies
            if (anomaliesToRemove.length > 0) {
                anomaliesToRemove.forEach(anomaly => {
                    this.despawnAnomaly(anomaly);
                });
                
                // Update HUD with new count
                this.updateAnomalyCountDisplay();
            }
        }
    }
    
    // Spawn a specific type of anomaly
    spawnAnomaly(type) {
        console.log(`Spawning ${type} anomaly`);
        
        switch(type) {
            case 'vortex':
                this.createVortexAnomaly();
                break;
            case 'crystalCluster':
                this.createCrystalClusterAnomaly();
                break;
            case 'nebulaNexus':
                this.createNebulaNexusAnomaly();
                break;
            case 'quantumFlux':
                this.createQuantumFluxAnomaly();
                break;
            case 'darkMatter':
                this.createDarkMatterAnomaly();
                break;
        }
    }
    
    // Despawn and cleanup a specific anomaly
    despawnAnomaly(anomaly) {
        console.log(`Despawning ${anomaly.type} anomaly`);
        
        // Remove from scene
        this.scene.remove(anomaly.mesh);
        
        // Perform specific cleanup based on anomaly type
        switch (anomaly.type) {
            case 'vortex':
                // Clean up rings
                if (anomaly.rings) {
                    anomaly.rings.forEach(ring => {
                        if (ring.mesh && ring.mesh.geometry) {
                            ring.mesh.geometry.dispose();
                        }
                        if (ring.mesh && ring.mesh.material) {
                            if (Array.isArray(ring.mesh.material)) {
                                ring.mesh.material.forEach(m => m.dispose());
                            } else {
                                ring.mesh.material.dispose();
                            }
                        }
                    });
                }
                break;
                
            case 'crystalCluster':
                // Clean up crystals
                if (anomaly.crystals) {
                    anomaly.crystals.forEach(crystal => {
                        if (crystal.mesh && crystal.mesh.geometry) {
                            crystal.mesh.geometry.dispose();
                        }
                        if (crystal.mesh && crystal.mesh.material) {
                            if (Array.isArray(crystal.mesh.material)) {
                                crystal.mesh.material.forEach(m => m.dispose());
                            } else {
                                crystal.mesh.material.dispose();
                            }
                        }
                    });
                }
                break;
                
            case 'nebulaNexus':
                // Clean up rings, core, and arcs
                if (anomaly.rings) {
                    anomaly.rings.forEach(ring => {
                        if (ring.mesh && ring.mesh.geometry) {
                            ring.mesh.geometry.dispose();
                        }
                        if (ring.mesh && ring.mesh.material) {
                            if (Array.isArray(ring.mesh.material)) {
                                ring.mesh.material.forEach(m => m.dispose());
                            } else {
                                ring.mesh.material.dispose();
                            }
                        }
                    });
                }
                if (anomaly.core && anomaly.core.mesh) {
                    if (anomaly.core.mesh.geometry) anomaly.core.mesh.geometry.dispose();
                    if (anomaly.core.mesh.material) {
                        if (Array.isArray(anomaly.core.mesh.material)) {
                            anomaly.core.mesh.material.forEach(m => m.dispose());
                        } else {
                            anomaly.core.mesh.material.dispose();
                        }
                    }
                }
                if (anomaly.arcs) {
                    anomaly.arcs.forEach(arc => {
                        if (arc.mesh && arc.mesh.geometry) {
                            arc.mesh.geometry.dispose();
                        }
                        if (arc.mesh && arc.mesh.material) {
                            if (Array.isArray(arc.mesh.material)) {
                                arc.mesh.material.forEach(m => m.dispose());
                            } else {
                                arc.mesh.material.dispose();
                            }
                        }
                    });
                }
                break;
                
            case 'quantumFlux':
                // Clean up frames and particles
                if (anomaly.frames) {
                    anomaly.frames.forEach(frame => {
                        if (frame.mesh && frame.mesh.geometry) {
                            frame.mesh.geometry.dispose();
                        }
                        if (frame.mesh && frame.mesh.material) {
                            if (Array.isArray(frame.mesh.material)) {
                                frame.mesh.material.forEach(m => m.dispose());
                            } else {
                                frame.mesh.material.dispose();
                            }
                        }
                        if (frame.innerBox) {
                            if (frame.innerBox.geometry) frame.innerBox.geometry.dispose();
                            if (frame.innerBox.material) {
                                if (Array.isArray(frame.innerBox.material)) {
                                    frame.innerBox.material.forEach(m => m.dispose());
                                } else {
                                    frame.innerBox.material.dispose();
                                }
                            }
                        }
                    });
                }
                if (anomaly.particles && anomaly.particles.mesh) {
                    if (anomaly.particles.mesh.geometry) anomaly.particles.mesh.geometry.dispose();
                    if (anomaly.particles.mesh.material) {
                        if (Array.isArray(anomaly.particles.mesh.material)) {
                            anomaly.particles.mesh.material.forEach(m => m.dispose());
                        } else {
                            anomaly.particles.mesh.material.dispose();
                        }
                    }
                }
                break;
                
            case 'darkMatter':
                // Clean up core, rings, and particles
                if (anomaly.core && anomaly.core.mesh) {
                    if (anomaly.core.mesh.geometry) anomaly.core.mesh.geometry.dispose();
                    if (anomaly.core.mesh.material) {
                        if (Array.isArray(anomaly.core.mesh.material)) {
                            anomaly.core.mesh.material.forEach(m => m.dispose());
                        } else {
                            anomaly.core.mesh.material.dispose();
                        }
                    }
                }
                if (anomaly.rings) {
                    anomaly.rings.forEach(ring => {
                        if (ring.mesh && ring.mesh.geometry) {
                            ring.mesh.geometry.dispose();
                        }
                        if (ring.mesh && ring.mesh.material) {
                            if (Array.isArray(ring.mesh.material)) {
                                ring.mesh.material.forEach(m => m.dispose());
                            } else {
                                ring.mesh.material.dispose();
                            }
                        }
                    });
                }
                if (anomaly.particles && anomaly.particles.mesh) {
                    if (anomaly.particles.mesh.geometry) anomaly.particles.mesh.geometry.dispose();
                    if (anomaly.particles.mesh.material) {
                        if (Array.isArray(anomaly.particles.mesh.material)) {
                            anomaly.particles.mesh.material.forEach(m => m.dispose());
                        } else {
                            anomaly.particles.mesh.material.dispose();
                        }
                    }
                }
                break;
        }
        
        // Clean up the orb
        if (anomaly.orb && anomaly.orb.mesh) {
            if (anomaly.orb.mesh.geometry) anomaly.orb.mesh.geometry.dispose();
            if (anomaly.orb.mesh.material) {
                if (Array.isArray(anomaly.orb.mesh.material)) {
                    anomaly.orb.mesh.material.forEach(m => m.dispose());
                } else {
                    anomaly.orb.mesh.material.dispose();
                }
            }
        }
        
        // Remove from anomalies array
        const index = this.anomalies.indexOf(anomaly);
        if (index !== -1) {
            this.anomalies.splice(index, 1);
        }
    }
    
    // Update HUD to show active anomaly count
    updateAnomalyCountDisplay() {
        // Find the anomaly count element in the HUD
        const anomalyCountEl = document.getElementById('anomaly-count');
        if (anomalyCountEl) {
            anomalyCountEl.textContent = this.anomalies.length.toString();
        }
    }
    
    // Get the number of active anomalies
    getActiveAnomalyCount() {
        return this.anomalies.length;
    }
    
    // Modified update method to include anomaly spawning/despawning checks
    update(deltaTime) {
        // Check for spawning/despawning anomalies
        this.checkAnomalySpawning(deltaTime);
        
        // Get player position if available (from global reference)
        let playerPosition = null;
        if (window.game && window.game.spaceship && window.game.spaceship.mesh) {
            playerPosition = window.game.spaceship.mesh.position;
        }
        
        // Update existing anomalies
        for (let i = 0; i < this.anomalies.length; i++) {
            const anomaly = this.anomalies[i];
            
            // Skip if orb is already collected
            if (anomaly.orbCollected) {
                // Simple rotation for collected anomalies
                if (anomaly.mesh && anomaly.rotationSpeed) {
                    anomaly.mesh.rotation.x += anomaly.rotationSpeed.x * deltaTime;
                    anomaly.mesh.rotation.y += anomaly.rotationSpeed.y * deltaTime;
                    anomaly.mesh.rotation.z += anomaly.rotationSpeed.z * deltaTime;
                }
                continue;
            }
            
            // Check if player is nearby to enhance effects
            let playerNearby = false;
            if (playerPosition) {
                const distance = playerPosition.distanceTo(anomaly.position);
                playerNearby = distance < (anomaly.orb.size * 3) * this.orbScale; // Only enhance effects based on orb distance
            }
            
            // Rotate the entire anomaly slowly
            if (anomaly.mesh && anomaly.rotationSpeed) {
                anomaly.mesh.rotation.x += anomaly.rotationSpeed.x * deltaTime;
                anomaly.mesh.rotation.y += anomaly.rotationSpeed.y * deltaTime;
                anomaly.mesh.rotation.z += anomaly.rotationSpeed.z * deltaTime;
            }
            
            // Animate specific anomaly types
            switch (anomaly.type) {
                case 'vortex':
                    this.updateVortexAnomaly(anomaly, deltaTime);
                    break;
                case 'crystalCluster':
                    this.updateCrystalClusterAnomaly(anomaly, deltaTime);
                    break;
                case 'nebulaNexus':
                    this.updateNebulaNexusAnomaly(anomaly, deltaTime);
                    break;
                case 'quantumFlux':
                    this.updateQuantumFluxAnomaly(anomaly, deltaTime);
                    break;
                case 'darkMatter':
                    this.updateDarkMatterAnomaly(anomaly, deltaTime);
                    break;
            }
            
            // Update orb effects based on player proximity
            this.updateOrbEffects(anomaly, playerNearby);
        }
    }
    
    createVortexAnomaly() {
        // Create a spiraling vortex structure with central orb
        
        // Determine position outside asteroid belt
        const position = this.getRandomAnomalyPosition();
        const anomalyGroup = new THREE.Group();
        anomalyGroup.position.copy(position);
        
        // Apply scale to make anomaly 4x bigger
        anomalyGroup.scale.set(this.anomalyScale, this.anomalyScale, this.anomalyScale);
        
        // Create the structural elements - spiral rings
        const ringCount = 6;
        const rings = [];
        
        // Create multiple rings with decreasing radius
        for (let i = 0; i < ringCount; i++) {
            const radius = 400 - (i * 50);
            const geometry = new THREE.TorusGeometry(radius, 15, 16, 100); // Increased tube radius from 10 to 15
            
            // Bright blue-cyan color scheme for better visibility
            const hue = 0.5 + (i * 0.05); // Blue to cyan gradient
            const color = new THREE.Color().setHSL(hue, 0.9, 0.6); // Increased saturation and lightness
            
            const material = new THREE.MeshStandardMaterial({
                color: color,
                emissive: color.clone().multiplyScalar(0.5),
                emissiveIntensity: 1.0,
                metalness: 0.8,
                roughness: 0.2,
                transparent: true,
                opacity: 0.95
            });
            
            const ring = new THREE.Mesh(geometry, material);
            
            // Rotate each ring at different angles to create spiral effect
            ring.rotation.x = Math.PI / 2 + (i * 0.2);
            ring.rotation.y = i * 0.3;
            
            anomalyGroup.add(ring);
            rings.push({
                mesh: ring,
                rotationSpeed: {
                    x: 0.005 + (i * 0.002),
                    y: 0.003 + (i * 0.001),
                    z: 0.001 + (i * 0.0005)
                }
            });
        }
        
        // Create energy orb in the center
        const orbRarity = this.getRandomOrbRarity();
        const orb = this.createEnergyOrb(orbRarity);
        anomalyGroup.add(orb.mesh);
        
        // Add to scene
        this.scene.add(anomalyGroup);
        
        // Save anomaly data
        this.anomalies.push({
            type: 'vortex',
            mesh: anomalyGroup,
            position: position.clone(),
            rings: rings,
            orb: orb,
            collisionRadius: 350, // Overall collision size
            orbCollected: false,
            rotationSpeed: new THREE.Vector3(0.001, 0.002, 0.0015)
        });
    }
    
    createCrystalClusterAnomaly() {
        // Create a crystalline structure with floating crystals and central orb
        
        // Determine position outside asteroid belt
        const position = this.getRandomAnomalyPosition();
        const anomalyGroup = new THREE.Group();
        anomalyGroup.position.copy(position);
        
        // Apply scale to make anomaly 4x bigger
        anomalyGroup.scale.set(this.anomalyScale, this.anomalyScale, this.anomalyScale);
        
        // Create main crystal structure using multiple crystal forms
        const crystals = [];
        const crystalCount = 20;
        
        for (let i = 0; i < crystalCount; i++) {
            // Random crystal size
            const size = 50 + Math.random() * 100; // Increased from 30+80 to 50+100
            
            // Create crystal geometry - mix of different polyhedra
            let geometry;
            const crystalType = Math.floor(Math.random() * 3);
            
            if (crystalType === 0) {
                // Octahedron - diamond-like crystal
                geometry = new THREE.OctahedronGeometry(size, 0);
            } else if (crystalType === 1) {
                // Dodecahedron - more complex crystal
                geometry = new THREE.DodecahedronGeometry(size, 0);
            } else {
                // Prism-like crystal using stretched tetrahedron
                geometry = new THREE.TetrahedronGeometry(size, 0);
                
                // Stretch it to make it more crystal-like
                const positions = geometry.attributes.position;
                for (let j = 0; j < positions.count; j++) {
                    const vertex = new THREE.Vector3();
                    vertex.fromBufferAttribute(positions, j);
                    
                    // Stretch along one axis
                    vertex.y *= 2.5;
                    
                    positions.setXYZ(j, vertex.x, vertex.y, vertex.z);
                }
                geometry.computeVertexNormals();
            }
            
            // Create a semi-transparent crystalline material with bright teal colors
            const hue = 0.45 + Math.random() * 0.1; // Teal/aqua/green color palette
            const saturation = 0.9 + Math.random() * 0.1; // Increased saturation
            const lightness = 0.6 + Math.random() * 0.2; // Increased lightness
            
            const color = new THREE.Color().setHSL(hue, saturation, lightness);
            
            const material = new THREE.MeshStandardMaterial({
                color: color,
                metalness: 0.9,
                roughness: 0.1,
                transparent: true,
                opacity: 0.9,
                emissive: color.clone(),
                emissiveIntensity: 0.5
            });
            
            const crystal = new THREE.Mesh(geometry, material);
            
            // Position crystal in a spherical arrangement
            const radius = 200 + Math.random() * 100;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            crystal.position.set(
                radius * Math.sin(phi) * Math.cos(theta),
                radius * Math.sin(phi) * Math.sin(theta),
                radius * Math.cos(phi)
            );
            
            // Random rotation
            crystal.rotation.set(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            );
            
            anomalyGroup.add(crystal);
            
            // Store crystal data for animation
            crystals.push({
                mesh: crystal,
                initialPosition: crystal.position.clone(),
                floatPhase: Math.random() * Math.PI * 2,
                floatSpeed: 0.3 + Math.random() * 0.3,
                floatAmplitude: 5 + Math.random() * 10,
                rotationSpeed: {
                    x: (Math.random() - 0.5) * 0.01,
                    y: (Math.random() - 0.5) * 0.01,
                    z: (Math.random() - 0.5) * 0.01
                }
            });
        }
        
        // Create energy orb in the center
        const orbRarity = this.getRandomOrbRarity();
        const orb = this.createEnergyOrb(orbRarity);
        anomalyGroup.add(orb.mesh);
        
        // Add to scene
        this.scene.add(anomalyGroup);
        
        // Save anomaly data
        this.anomalies.push({
            type: 'crystalCluster',
            mesh: anomalyGroup,
            position: position.clone(),
            crystals: crystals,
            orb: orb,
            collisionRadius: 300, // Overall collision size
            orbCollected: false,
            rotationSpeed: new THREE.Vector3(0.0005, 0.001, 0.0005)
        });
    }
    
    createNebulaNexusAnomaly() {
        // Create a crystalline ring structure with central orb
        // Completely redesigned from particle-based nebula to solid structure
        
        // Determine position outside asteroid belt
        const position = this.getRandomAnomalyPosition();
        const anomalyGroup = new THREE.Group();
        anomalyGroup.position.copy(position);
        
        // Apply scale to make anomaly 4x bigger
        anomalyGroup.scale.set(this.anomalyScale, this.anomalyScale, this.anomalyScale);
        
        // Create a series of rotating rings with crystal formations
        const ringCount = 3;
        const rings = [];
        
        // Create multiple crystal-studded rings
        for (let i = 0; i < ringCount; i++) {
            // Create a ring
            const ringRadius = 200 + i * 60;
            const ringGeometry = new THREE.TorusGeometry(ringRadius, 8, 16, 50);
            
            // Create a vibrant material for the ring
            const ringHue = 0.6 + i * 0.1; // Blue to purple gradient
            const ringColor = new THREE.Color().setHSL(ringHue, 1.0, 0.6);
            
            const ringMaterial = new THREE.MeshStandardMaterial({
                color: ringColor,
                emissive: ringColor.clone().multiplyScalar(0.5),
                emissiveIntensity: 1.0,
                metalness: 0.9,
                roughness: 0.1,
                transparent: false,
                opacity: 1.0
            });
            
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            
            // Position ring with different orientation
            ring.rotation.x = Math.PI/2 + (i * Math.PI/3);
            ring.rotation.y = i * Math.PI/4;
            
            anomalyGroup.add(ring);
            
            // Add crystals along the ring
            const crystalCount = 10 + i * 5;
            const crystals = [];
            
            for (let j = 0; j < crystalCount; j++) {
                // Crystal position along the ring
                const angle = (j / crystalCount) * Math.PI * 2;
                
                // Create crystal geometry
                const crystalSize = 15 + Math.random() * 10;
                const crystalGeometry = new THREE.OctahedronGeometry(crystalSize, 0);
                
                // Create crystal material with complementary color
                const crystalHue = (ringHue + 0.5) % 1.0; // Complementary color
                const crystalColor = new THREE.Color().setHSL(crystalHue, 1.0, 0.7);
                
                const crystalMaterial = new THREE.MeshStandardMaterial({
                    color: crystalColor,
                    emissive: crystalColor.clone(),
                    emissiveIntensity: 0.8,
                    metalness: 0.9,
                    roughness: 0.1,
                    transparent: false,
                    opacity: 1.0
                });
                
                const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
                
                // Position crystal on the ring
                crystal.position.x = ringRadius * Math.cos(angle);
                crystal.position.y = 0;
                crystal.position.z = ringRadius * Math.sin(angle);
                
                // Random rotation
                crystal.rotation.x = Math.random() * Math.PI;
                crystal.rotation.y = Math.random() * Math.PI;
                crystal.rotation.z = Math.random() * Math.PI;
                
                ring.add(crystal);
                
                crystals.push({
                    mesh: crystal,
                    initialPosition: crystal.position.clone(),
                    pulsePhase: Math.random() * Math.PI * 2,
                    pulseSpeed: 0.5 + Math.random() * 0.5
                });
            }
            
            rings.push({
                mesh: ring,
                crystals: crystals,
                rotationSpeed: 0.1 - (i * 0.03), // Outer rings rotate slower
                rotationAxis: new THREE.Vector3(
                    Math.random() - 0.5,
                    Math.random() - 0.5,
                    Math.random() - 0.5
                ).normalize()
            });
        }
        
        // Create an inner sphere with energy effect
        const coreRadius = 80;
        const coreGeometry = new THREE.SphereGeometry(coreRadius, 32, 32);
        const coreColor = new THREE.Color().setHSL(0.15, 1.0, 0.6); // Gold color
        
        const coreMaterial = new THREE.MeshStandardMaterial({
            color: coreColor,
            emissive: coreColor,
            emissiveIntensity: 1.0,
            metalness: 1.0,
            roughness: 0.3,
                transparent: true,
            opacity: 0.9
        });
        
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        anomalyGroup.add(core);
        
        // Add energy arcs from core to rings
        const arcCount = 8;
        const arcs = [];
        
        for (let i = 0; i < arcCount; i++) {
            const curve = new THREE.CubicBezierCurve3(
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(
                    (Math.random() - 0.5) * 200,
                    (Math.random() - 0.5) * 200,
                    (Math.random() - 0.5) * 200
                ),
                new THREE.Vector3(
                    (Math.random() - 0.5) * 300,
                    (Math.random() - 0.5) * 300,
                    (Math.random() - 0.5) * 300
                ),
                new THREE.Vector3(
                    (Math.random() - 0.5) * 400,
                    (Math.random() - 0.5) * 400,
                    (Math.random() - 0.5) * 400
                )
            );
            
            const points = curve.getPoints(20);
            const arcGeometry = new THREE.BufferGeometry().setFromPoints(points);
            
            const arcColor = new THREE.Color().setHSL(0.15, 1.0, 0.6); // Gold color
            const arcMaterial = new THREE.LineBasicMaterial({
                color: arcColor,
                linewidth: 3,
                transparent: true,
                opacity: 0.8
            });
            
            const arc = new THREE.Line(arcGeometry, arcMaterial);
            anomalyGroup.add(arc);
            
            arcs.push({
                mesh: arc,
                curve: curve,
                updatePhase: Math.random() * Math.PI * 2,
                updateSpeed: 0.2 + Math.random() * 0.3
            });
        }
        
        // Create energy orb in the center
        const orbRarity = this.getRandomOrbRarity();
        const orb = this.createEnergyOrb(orbRarity);
        anomalyGroup.add(orb.mesh);
        
        // Add to scene
        this.scene.add(anomalyGroup);
        
        // Save anomaly data
        this.anomalies.push({
            type: 'nebulaNexus',
            mesh: anomalyGroup,
            position: position.clone(),
            rings: rings,
            core: {
                mesh: core,
                pulsePhase: 0,
                pulseSpeed: 0.5
            },
            arcs: arcs,
            orb: orb,
            collisionRadius: 250,
            orbCollected: false,
            rotationSpeed: new THREE.Vector3(0.0003, 0.0004, 0.0002)
        });
    }
    
    createQuantumFluxAnomaly() {
        // Create a quantum flux anomaly with rotating cube frames
        
        // Determine position outside asteroid belt
        const position = this.getRandomAnomalyPosition();
        const anomalyGroup = new THREE.Group();
        anomalyGroup.position.copy(position);
        
        // Apply scale to make anomaly 4x bigger
        anomalyGroup.scale.set(this.anomalyScale, this.anomalyScale, this.anomalyScale);
        
        // Create rotating cubic frames
        const frames = [];
        const frameCount = 5;
        
        for (let i = 0; i < frameCount; i++) {
            // Create cubic wireframe box
            const size = 250 - i * 40;
            const geometry = new THREE.BoxGeometry(size, size, size);
            
            // Add a solid but transparent box inside the wireframe for better visibility
            const innerGeometry = new THREE.BoxGeometry(size * 0.98, size * 0.98, size * 0.98);
            
            // Extract only edges to create wireframe
            const edges = new THREE.EdgesGeometry(geometry);
            
            // Use extremely vibrant electric colors
            const hue = 0.3 + i * 0.1; // Shift from green to blue
            const color = new THREE.Color().setHSL(hue, 1.0, 0.6);
            
            const material = new THREE.LineBasicMaterial({ 
                color: color,
                linewidth: 2,
                transparent: false, // Changed to non-transparent for better visibility
                opacity: 1.0
            });
            
            // Inner box with semi-transparent material
            const innerMaterial = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.1,
                side: THREE.DoubleSide
            });
            
            const frame = new THREE.LineSegments(edges, material);
            const innerBox = new THREE.Mesh(innerGeometry, innerMaterial);
            
            // Add both to group and store for animation
            anomalyGroup.add(frame);
            anomalyGroup.add(innerBox);
            
            frames.push({
                mesh: frame,
                innerBox: innerBox,
                rotationAxis: new THREE.Vector3(
                    Math.random() - 0.5,
                    Math.random() - 0.5,
                    Math.random() - 0.5
                ).normalize(),
                rotationSpeed: 0.01 + i * 0.005,
                pulsePhase: Math.random() * Math.PI * 2
            });
        }
        
        // Add energy particles inside
        const particleCount = 200;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        const particleSizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Position particles within the inner cube
            const radius = 100 * Math.random();
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            particlePositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            particlePositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            particlePositions[i3 + 2] = radius * Math.cos(phi);
            
            // Vary particle sizes
            particleSizes[i] = 2 + Math.random() * 3;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xff00ff, // Magenta
            size: 6,
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.9
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        anomalyGroup.add(particles);
        
        // Create energy orb in the center
        const orbRarity = this.getRandomOrbRarity();
        const orb = this.createEnergyOrb(orbRarity);
        anomalyGroup.add(orb.mesh);
        
        // Add to scene
        this.scene.add(anomalyGroup);
        
        // Save anomaly data
        this.anomalies.push({
            type: 'quantumFlux',
            mesh: anomalyGroup,
            position: position.clone(),
            frames: frames,
            particles: {
                mesh: particles,
                positions: particlePositions,
                initialPositions: particlePositions.slice(), // Clone for reference
                velocities: Array(particleCount).fill().map(() => new THREE.Vector3(
                    (Math.random() - 0.5) * 0.5,
                    (Math.random() - 0.5) * 0.5,
                    (Math.random() - 0.5) * 0.5
                ))
            },
            orb: orb,
            collisionRadius: 230, // Overall collision size
            orbCollected: false,
            rotationSpeed: new THREE.Vector3(0.0001, 0.0002, 0.0001)
        });
    }
    
    createDarkMatterAnomaly() {
        // Create a dark matter anomaly with gravitational lensing effects
        
        // Determine position outside asteroid belt
        const position = this.getRandomAnomalyPosition();
        const anomalyGroup = new THREE.Group();
        anomalyGroup.position.copy(position);
        
        // Apply scale to make anomaly 4x bigger
        anomalyGroup.scale.set(this.anomalyScale, this.anomalyScale, this.anomalyScale);
        
        // Create the dark matter core - a sphere with dark, distortion-like material
        const coreRadius = 100;
        const coreGeometry = new THREE.SphereGeometry(coreRadius, 32, 32);
        const coreMaterial = new THREE.MeshStandardMaterial({
            color: 0x330033,
            emissive: 0x880088,
            emissiveIntensity: 1.5,
            metalness: 1.0,
            roughness: 0.0,
            transparent: true,
            opacity: 0.95
        });
        
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        
        // Add a glow effect around the core
        const glowGeometry = new THREE.SphereGeometry(coreRadius * 1.2, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x9900ff,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        core.add(glow);
        
        anomalyGroup.add(core);
        
        // Create gravitational distortion rings
        const rings = [];
        const ringCount = 4;
        
        for (let i = 0; i < ringCount; i++) {
            const radius = 150 + i * 60;
            const tubeRadius = 4 + i * 2;
            const geometry = new THREE.TorusGeometry(radius, tubeRadius, 16, 100);
            
            // Use dark/purple color scheme with increasing brightness outward
            const color = new THREE.Color().setHSL(0.75, 0.9, 0.1 + i * 0.15);
            
            const material = new THREE.MeshStandardMaterial({
                color: color,
                emissive: color.clone().multiplyScalar(0.7),
                emissiveIntensity: 0.5 + i * 0.2,
                metalness: 0.8,
                roughness: 0.2,
                transparent: true,
                opacity: 0.85
            });
            
            const ring = new THREE.Mesh(geometry, material);
            
            // Position with random orientation
            ring.rotation.x = Math.random() * Math.PI;
            ring.rotation.y = Math.random() * Math.PI;
            ring.rotation.z = Math.random() * Math.PI;
            
            anomalyGroup.add(ring);
            rings.push({
                mesh: ring,
                rotationAxis: new THREE.Vector3(
                    Math.random() - 0.5,
                    Math.random() - 0.5,
                    Math.random() - 0.5
                ).normalize(),
                rotationSpeed: 0.002 + i * 0.001,
                warpPhase: Math.random() * Math.PI * 2,
                warpSpeed: 0.5 + Math.random() * 0.5
            });
        }
        
        // Create distortion particles
        const particleCount = 300;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        const particleSizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Distribute particles in a spherical shell
            const radius = 120 + Math.random() * 250;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            particlePositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            particlePositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            particlePositions[i3 + 2] = radius * Math.cos(phi);
            
            // Vary particle sizes
            particleSizes[i] = 1 + Math.random() * 3;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: 0x8800ff,
            size: 5,
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.8
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        anomalyGroup.add(particles);
        
        // Create energy orb in the center
        const orbRarity = this.getRandomOrbRarity();
        const orb = this.createEnergyOrb(orbRarity);
        anomalyGroup.add(orb.mesh);
        
        // Add to scene
        this.scene.add(anomalyGroup);
        
        // Save anomaly data
        this.anomalies.push({
            type: 'darkMatter',
            mesh: anomalyGroup,
            position: position.clone(),
            core: {
                mesh: core,
                pulsePhase: 0
            },
            rings: rings,
            particles: {
                mesh: particles,
                positions: particlePositions,
                initialPositions: particlePositions.slice(),
                phases: Array(particleCount).fill().map(() => Math.random() * Math.PI * 2)
            },
            orb: orb,
            collisionRadius: 200, // Overall collision size
            orbCollected: false,
            rotationSpeed: new THREE.Vector3(0.0002, 0.0003, 0.0001)
        });
    }
    
    createEnergyOrb(rarity) {
        // Create an energy orb with glow effects based on rarity
        
        // Determine orb color and properties based on rarity
        let color, size, intensity, pulseSpeed;
        
        switch(rarity) {
            case 'legendary':
                color = new THREE.Color(0xff0000); // Red
                size = 30 * this.orbScale;  // 4x bigger
                intensity = 0.9;
                pulseSpeed = 2.0;
                break;
            case 'epic':
                color = new THREE.Color(0xff6600); // Orange
                size = 25 * this.orbScale;  // 4x bigger
                intensity = 0.8;
                pulseSpeed = 1.8;
                break;
            case 'rare':
                color = new THREE.Color(0x9900ff); // Purple
                size = 22 * this.orbScale;  // 4x bigger
                intensity = 0.7;
                pulseSpeed = 1.5;
                break;
            case 'uncommon':
                color = new THREE.Color(0x0066ff); // Blue
                size = 20 * this.orbScale;  // 4x bigger
                intensity = 0.6;
                pulseSpeed = 1.2;
                break;
            default: // common
                color = new THREE.Color(0x00ff66); // Green
                size = 18 * this.orbScale;  // 4x bigger
                intensity = 0.5;
                pulseSpeed = 1.0;
                break;
        }
        
        // Create the core orb
        const orbGeometry = new THREE.SphereGeometry(size, 32, 32);
        const orbMaterial = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: intensity,
            metalness: 0.8,
            roughness: 0.2,
            transparent: true,
            opacity: 0.9
        });
        
        const orb = new THREE.Mesh(orbGeometry, orbMaterial);
        
        // Create outer glow
        const glowSize = size * 1.5;
        const glowGeometry = new THREE.SphereGeometry(glowSize, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        orb.add(glow);
        
        // Return orb data
        return {
            mesh: orb,
            rarity: rarity,
            value: this.orbValues[rarity],
            size: size,
            color: color,
            pulsePhase: 0,
            pulseSpeed: pulseSpeed,
            glow: glow
        };
    }
    
    createParticleTexture() {
        // Create a particle texture for better-looking nebula particles
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        
        const context = canvas.getContext('2d');
        const gradient = context.createRadialGradient(
            32, 32, 0,
            32, 32, 32
        );
        
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.3, 'rgba(255,255,255,0.8)');
        gradient.addColorStop(0.7, 'rgba(200,200,200,0.3)');
        gradient.addColorStop(1, 'rgba(100,100,100,0)');
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, 64, 64);
        
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
    }
    
    getRandomAnomalyPosition() {
        // Get random position outside asteroid belt
        const angle = Math.random() * Math.PI * 2;
        const radius = this.minRadius + Math.random() * (this.maxRadius - this.minRadius);
        const heightVariation = (Math.random() - 0.5) * this.width;
        
        return new THREE.Vector3(
            Math.cos(angle) * radius,
            heightVariation,
            Math.sin(angle) * radius
        );
    }
    
    getRandomOrbRarity() {
        // Determine orb rarity based on probabilities
        const roll = Math.random();
        
        if (roll < 0.005) {
            return 'legendary'; // 0.5% chance
        } else if (roll < 0.025) {
            return 'epic'; // 2% chance
        } else if (roll < 0.1) {
            return 'rare'; // 7.5% chance
        } else if (roll < 0.3) {
            return 'uncommon'; // 20% chance
        } else {
            return 'common'; // 70% chance
        }
    }
    
    getRegionInfo() {
        return {
            center: new THREE.Vector3(0, 0, 0),
            innerRadius: this.minRadius,
            outerRadius: this.maxRadius
        };
    }
    
    findClosestAnomaly(position, maxDistance = 8000) {
        let closestAnomaly = null;
        let closestDistance = maxDistance;
        
        this.anomalies.forEach(anomaly => {
            // Calculate distance to this anomaly
            const distance = position.distanceTo(anomaly.position);
            
            if (distance < closestDistance) {
                closestDistance = distance;
                closestAnomaly = anomaly;
            }
        });
        
        return closestAnomaly;
    }
    
    collectOrb(anomaly) {
        if (!anomaly || anomaly.orbCollected) {
            return null; // Already collected or invalid anomaly
        }
        
        // Get orb data before marking as collected
        const orbData = {
            rarity: anomaly.orb.rarity,
            value: this.orbValues[anomaly.orb.rarity] || 100 // Default to 100 if rarity not found
        };
        
        // Mark as collected and update visuals
        anomaly.orbCollected = true;
        
        // Hide the orb
        if (anomaly.orb && anomaly.orb.mesh) {
            anomaly.orb.mesh.visible = false;
            
            // Also hide glow if present
            if (anomaly.orb.glow) {
                anomaly.orb.glow.visible = false;
            }
        }
        
        return orbData; // Return data for player inventory and notification
    }
    
    checkCollision(position, anomaly) {
        if (!position || !anomaly || !anomaly.position) return false;
        
        // Calculate distance from player to anomaly center
        const distance = position.distanceTo(anomaly.position);
        
        // Check if within orb collection radius - we only want orb collisions, not anomaly collision
        // Use the original collision radius for orb collection, scaled by orbScale
        // This ensures we're only checking for the orb and not the anomaly itself
        return distance < (anomaly.orb.size * 2) * this.orbScale;
    }
    
    updateOrbEffects(anomaly, playerNearby) {
        if (!anomaly || !anomaly.orb || anomaly.orbCollected) return;
        
        // Enhance orb effects when player is nearby to make collection more obvious
        if (playerNearby) {
            // If player is nearby, make the orb pulse more dramatically
            const scale = 1.5 + Math.sin(performance.now() * 0.005) * 0.5;
            anomaly.orb.mesh.scale.set(scale, scale, scale);
            
            // Increase emission intensity
            if (anomaly.orb.mesh.material) {
                anomaly.orb.mesh.material.emissiveIntensity = 2.0;
            }
        } else {
            // Reset to normal effects when player is not nearby
            const scale = 1.0 + Math.sin(performance.now() * 0.002) * 0.2;
            anomaly.orb.mesh.scale.set(scale, scale, scale);
            
            // Normal emission intensity
            if (anomaly.orb.mesh.material) {
                anomaly.orb.mesh.material.emissiveIntensity = 0.8;
            }
        }
    }
    
    updateVortexAnomaly(anomaly, deltaTime) {
        // Rotate each ring
        anomaly.rings.forEach(ring => {
            ring.mesh.rotation.x += ring.rotationSpeed.x * deltaTime;
            ring.mesh.rotation.y += ring.rotationSpeed.y * deltaTime;
            ring.mesh.rotation.z += ring.rotationSpeed.z * deltaTime;
        });
    }
    
    updateCrystalClusterAnomaly(anomaly, deltaTime) {
        // Animate floating crystals
        anomaly.crystals.forEach(crystal => {
            // Update float phase
            crystal.floatPhase += deltaTime * crystal.floatSpeed;
            
            // Create floating motion
            const floatOffset = Math.sin(crystal.floatPhase) * crystal.floatAmplitude;
            crystal.mesh.position.y = crystal.initialPosition.y + floatOffset;
            
            // Rotate the crystal
            crystal.mesh.rotation.x += crystal.rotationSpeed.x;
            crystal.mesh.rotation.y += crystal.rotationSpeed.y;
            crystal.mesh.rotation.z += crystal.rotationSpeed.z;
        });
    }
    
    updateNebulaNexusAnomaly(anomaly, deltaTime) {
        // Animate core
        anomaly.core.pulsePhase += deltaTime * anomaly.core.pulseSpeed;
        const scale = 1.0 + 0.2 * Math.sin(anomaly.core.pulsePhase);
        anomaly.core.mesh.scale.set(scale, scale, scale);
        
        // Animate rings and crystals
        anomaly.rings.forEach(ring => {
            // Rotate each ring
            const rotationMatrix = new THREE.Matrix4().makeRotationAxis(
                ring.rotationAxis,
                ring.rotationSpeed * deltaTime
            );
            ring.mesh.applyMatrix4(rotationMatrix);
            
            // Animate crystals on the ring
            ring.crystals.forEach(crystal => {
                crystal.pulsePhase += deltaTime * crystal.pulseSpeed;
                const crystalScale = 1.0 + 0.3 * Math.sin(crystal.pulsePhase);
                crystal.mesh.scale.set(crystalScale, crystalScale, crystalScale);
            });
        });
        
        // Animate energy arcs
        anomaly.arcs.forEach(arc => {
            arc.updatePhase += deltaTime * arc.updateSpeed;
            
            // Update arc control points for dynamic movement
            const controlPoint1 = arc.curve.v1;
            const controlPoint2 = arc.curve.v2;
            
            controlPoint1.x = Math.sin(arc.updatePhase) * 200;
            controlPoint1.y = Math.cos(arc.updatePhase * 0.7) * 200;
            controlPoint1.z = Math.sin(arc.updatePhase * 1.3) * 200;
            
            controlPoint2.x = Math.sin(arc.updatePhase * 0.8 + 1) * 300;
            controlPoint2.y = Math.cos(arc.updatePhase * 1.2 + 2) * 300;
            controlPoint2.z = Math.sin(arc.updatePhase * 0.9 + 3) * 300;
            
            // Update arc geometry
            const points = arc.curve.getPoints(20);
            arc.mesh.geometry.setFromPoints(points);
            arc.mesh.geometry.attributes.position.needsUpdate = true;
        });
    }
    
    updateQuantumFluxAnomaly(anomaly, deltaTime) {
        // Animate rotating frames
        anomaly.frames.forEach(frame => {
            // Rotate around custom axis
            const rotationMatrix = new THREE.Matrix4().makeRotationAxis(
                frame.rotationAxis,
                frame.rotationSpeed * deltaTime
            );
            frame.mesh.applyMatrix4(rotationMatrix);
            
            // Also rotate the inner box if it exists
            if (frame.innerBox) {
                frame.innerBox.applyMatrix4(rotationMatrix);
            }
            
            // Pulse effect
            frame.pulsePhase += deltaTime;
            const pulseScale = 1.0 + 0.05 * Math.sin(frame.pulsePhase);
            frame.mesh.scale.set(pulseScale, pulseScale, pulseScale);
            
            // Also pulse the inner box if it exists
            if (frame.innerBox) {
                frame.innerBox.scale.set(pulseScale, pulseScale, pulseScale);
            }
        });
        
        // Animate particles
        const positions = anomaly.particles.positions;
        const velocities = anomaly.particles.velocities;
        
        for (let i = 0; i < positions.length / 3; i++) {
            const i3 = i * 3;
            
            // Update position based on velocity
            positions[i3] += velocities[i].x;
            positions[i3 + 1] += velocities[i].y;
            positions[i3 + 2] += velocities[i].z;
            
            // Contain particles within the inner cube
            const maxDist = 120;
            const pos = new THREE.Vector3(positions[i3], positions[i3 + 1], positions[i3 + 2]);
            
            if (pos.length() > maxDist) {
                // Reflect particles at boundary
                pos.normalize().multiplyScalar(maxDist);
                positions[i3] = pos.x;
                positions[i3 + 1] = pos.y;
                positions[i3 + 2] = pos.z;
                
                // Reflect velocity
                velocities[i].reflect(pos.normalize());
            }
        }
        
        // Update the geometry
        anomaly.particles.mesh.geometry.attributes.position.needsUpdate = true;
    }
    
    updateDarkMatterAnomaly(anomaly, deltaTime) {
        // Animate core
        anomaly.core.pulsePhase += deltaTime * 0.5;
        const corePulse = 1.0 + 0.1 * Math.sin(anomaly.core.pulsePhase);
        anomaly.core.mesh.scale.set(corePulse, corePulse, corePulse);
        
        // Animate rings
        anomaly.rings.forEach(ring => {
            // Rotate along custom axis
            const rotationMatrix = new THREE.Matrix4().makeRotationAxis(
                ring.rotationAxis,
                ring.rotationSpeed * deltaTime
            );
            ring.mesh.applyMatrix4(rotationMatrix);
            
            // Warp effect
            ring.warpPhase += deltaTime * ring.warpSpeed;
            const warpX = 1.0 + 0.1 * Math.sin(ring.warpPhase);
            const warpY = 1.0 + 0.1 * Math.sin(ring.warpPhase + Math.PI/3);
            const warpZ = 1.0 + 0.1 * Math.sin(ring.warpPhase + Math.PI*2/3);
            ring.mesh.scale.set(warpX, warpY, warpZ);
        });
        
        // Animate particles
        const positions = anomaly.particles.positions;
        const initialPositions = anomaly.particles.initialPositions;
        const phases = anomaly.particles.phases;
        
        for (let i = 0; i < positions.length / 3; i++) {
            const i3 = i * 3;
            
            // Update phase
            phases[i] += deltaTime;
            
            // Create gravitational distortion effect
            const dist = Math.sqrt(
                initialPositions[i3] * initialPositions[i3] +
                initialPositions[i3 + 1] * initialPositions[i3 + 1] +
                initialPositions[i3 + 2] * initialPositions[i3 + 2]
            );
            
            const orbitSpeed = 0.5 + (300 / (dist + 10)); // Faster closer to center
            phases[i] += deltaTime * orbitSpeed;
            
            // Create orbiting motion with radial oscillation
            const radialPulse = 1.0 + 0.2 * Math.sin(phases[i] * 0.5);
            
            // Apply the distortion
            const pos = new THREE.Vector3(
                initialPositions[i3],
                initialPositions[i3 + 1],
                initialPositions[i3 + 2]
            );
            
            // Rotate based on phase
            const rotY = phases[i] * 0.2;
            const rotZ = phases[i] * 0.1;
            
            pos.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotY);
            pos.applyAxisAngle(new THREE.Vector3(0, 0, 1), rotZ);
            
            // Apply radial pulse
            pos.multiplyScalar(radialPulse);
            
            positions[i3] = pos.x;
            positions[i3 + 1] = pos.y;
            positions[i3 + 2] = pos.z;
        }
        
        // Update the geometry
        anomaly.particles.mesh.geometry.attributes.position.needsUpdate = true;
    }
    
    updateForSystem(systemData) {
        console.log("Updating space anomalies for new star system");
        
        // Clear any existing anomalies
        this.clearAllAnomalies();
        
        // Reset the timer to immediately check for spawning in the new system
        this.spawnTimer = this.checkInterval;
        
        // Update HUD
        this.updateAnomalyCountDisplay();
    }
    
    clearAllAnomalies() {
        // Clone the array to avoid modification during iteration
        const anomaliesToRemove = [...this.anomalies];
        
        // Remove each anomaly
        anomaliesToRemove.forEach(anomaly => {
            this.despawnAnomaly(anomaly);
        });
        
        // Ensure the array is empty
        this.anomalies = [];
        
        // Update HUD
        this.updateAnomalyCountDisplay();
    }
} 