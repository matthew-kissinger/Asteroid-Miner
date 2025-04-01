// spaceship.js - Handles spaceship creation and management

import * as THREE from 'three';

export class Spaceship {
    constructor(scene) {
        this.scene = scene;
        this.mesh = null;
        this.thrusters = [];
        this.leftCannon = null;
        this.rightCannon = null;
        this.leftEmitter = null;
        this.rightEmitter = null;
        this.miningLaser = null; // Will point to leftEmitter during initialization
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.rotation = new THREE.Euler(0, 0, 0);
        this.thrust = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            boost: false
        };
        this.particleSystems = [];
        this.trailParticles = null;
        this.shipScale = 2.0; // New property to track ship scale
        
        // Combat properties
        this.hull = 100; // Current hull health
        this.maxHull = 100; // Maximum hull health
        this.shield = 50; // Current shield value
        this.maxShield = 50; // Maximum shield value
        this.isDestroyed = false; // Track if ship is destroyed
        
        // Docking and fuel properties
        this.fuel = 100; // Start with full fuel
        this.maxFuel = 100;
        this.fuelConsumptionRate = 0.01; // Fuel used per frame when thrusting
        this.isDocked = true; // Start docked by default (CHANGED FROM FALSE TO TRUE)
        this.credits = 1000; // Starting credits
        
        // Initialize cargo (empty by default)
        this.cargo = {
            iron: 0,
            gold: 0,
            platinum: 0
        };
        
        // Track fuel tank upgrades
        this.fuelTankLevel = 1;
        this.fuelUpgradeCost = 1000; // Initial upgrade cost
        
        // New upgrade properties for enhanced ship systems
        this.engineLevel = 1;
        this.engineUpgradeCost = 800;
        this.maxVelocity = 25.0; // Starting max velocity
        
        this.miningLevel = 1;
        this.miningUpgradeCost = 1200;
        this.miningEfficiency = 1.0; // Multiplier for mining speed
        
        this.hullLevel = 1;
        this.hullUpgradeCost = 1500;
        this.collisionResistance = 1.0; // Multiplier for collision damage resistance
        
        this.scannerLevel = 1;
        this.scannerUpgradeCost = 600;
        this.scanRange = 1000; // Base scanner range
        
        // Deployable lasers
        this.deployableLaserCount = 0; // Number of deployable lasers
        
        // Position where ship should undock to - moved further away from the sun
        this.undockLocation = new THREE.Vector3(0, 10000, 0); // Middle of the stargate
        
        console.log("Creating spaceship...");
        this.createSpaceship();
        this.createTrailEffect();
        
        // Start the ship invisible since it's docked
        if (this.mesh) {
            this.mesh.visible = false;
        }
        
        console.log("Spaceship created successfully (docked state)");
    }
    
    // Methods for updating spaceship state in game loop
    update(deltaTime) {
        // Update any continuous effects or animations
        if (this.updateParticles && !this.isDocked) {
            this.updateParticles();
        }
    }
    
    createSpaceship() {
        // Create spaceship group
        this.mesh = new THREE.Group();
        
        // Scale the entire ship
        this.mesh.scale.set(this.shipScale, this.shipScale, this.shipScale);
        
        // Set initial position to a safe location far from the sun
        this.mesh.position.set(0, 2000, 0); // Position near stargate initially
        
        // Create the main body of the ship - sleek aerodynamic design using basic geometries
        // Use a cylinder with a cone at the front instead of CapsuleGeometry
        const bodyGroup = new THREE.Group();
        
        // Main hull cylinder
        const cylinderGeometry = new THREE.CylinderGeometry(0.4, 0.5, 1.8, 12);
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xFFFFFF, // White base
            specular: 0xFFD700, // Gold specular highlights
            shininess: 100,
            emissive: 0x222222,
            emissiveIntensity: 0.1
        });
        
        const bodyCylinder = new THREE.Mesh(cylinderGeometry, bodyMaterial);
        bodyCylinder.rotation.x = Math.PI / 2; // Rotate to point forward
        bodyGroup.add(bodyCylinder);
        
        // Front nose cone
        const noseGeometry = new THREE.ConeGeometry(0.4, 0.8, 12);
        const noseCone = new THREE.Mesh(noseGeometry, bodyMaterial);
        noseCone.position.set(0, 0, -1.2);
        noseCone.rotation.x = -Math.PI / 2; // Point forward
        bodyGroup.add(noseCone);
        
        // Add the complete body to the ship
        this.mesh.add(bodyGroup);
        
        // Add cockpit - glass dome
        const cockpitGeometry = new THREE.SphereGeometry(0.35, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const cockpitMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x88CCFF,
            specular: 0xFFFFFF,
            shininess: 100,
            transparent: true,
            opacity: 0.7,
            emissive: 0x0066FF,
            emissiveIntensity: 0.1
        });
        const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
        cockpit.position.set(0, 0.25, -0.2);
        cockpit.rotation.x = -Math.PI / 2;
        this.mesh.add(cockpit);
        
        // Add dual front cannons
        const cannonGeometry = new THREE.CylinderGeometry(0.08, 0.06, 2.0, 8);
        const cannonMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xFFD700, // Gold
            specular: 0xFFFFFF,
            shininess: 80,
            emissive: 0xFFD700,
            emissiveIntensity: 0.2
        });
        
        // Left cannon
        this.leftCannon = new THREE.Mesh(cannonGeometry, cannonMaterial);
        this.leftCannon.position.set(0.2, 0, -1.5); // Left side of cockpit
        this.leftCannon.rotation.x = Math.PI / 2; // Point forward
        this.mesh.add(this.leftCannon);
        
        // Right cannon
        this.rightCannon = new THREE.Mesh(cannonGeometry, cannonMaterial);
        this.rightCannon.position.set(-0.2, 0, -1.5); // Right side of cockpit
        this.rightCannon.rotation.x = Math.PI / 2; // Point forward
        this.mesh.add(this.rightCannon);
        
        // Add cannon emitters (glowing tips)
        const emitterGeometry = new THREE.SphereGeometry(0.08, 16, 16);
        const emitterMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xFF6600,
            emissive: 0xFF3300,
            emissiveIntensity: 1
        });
        
        // Left emitter
        this.leftEmitter = new THREE.Mesh(emitterGeometry, emitterMaterial);
        this.leftEmitter.position.set(0.2, 0, -2.5); // Front of left cannon
        this.mesh.add(this.leftEmitter);
        
        // Right emitter
        this.rightEmitter = new THREE.Mesh(emitterGeometry, emitterMaterial);
        this.rightEmitter.position.set(-0.2, 0, -2.5); // Front of right cannon
        this.mesh.add(this.rightEmitter);
        
        // Create mining laser emitter (use one of the cannons for mining)
        this.miningLaser = this.leftEmitter;
        
        // Add curved wings - using custom shape for curves
        const createCurvedWing = (isLeft) => {
            const wingGroup = new THREE.Group();
            
            // Create curved wing shape using multiple segments
            const wingMaterial = new THREE.MeshPhongMaterial({ 
                color: 0xFFFFFF, // White
                specular: 0xFFD700, // Gold specular 
                shininess: 80,
                emissive: 0xFFFFFF,
                emissiveIntensity: 0.1
            });
            
            // Wing base connecting to ship body
            const wingBaseGeom = new THREE.BoxGeometry(0.1, 0.2, 0.6);
            const wingBase = new THREE.Mesh(wingBaseGeom, wingMaterial);
            wingBase.position.set(isLeft ? 0.55 : -0.55, 0, 0.2);
            wingGroup.add(wingBase);
            
            // Curved part of wing - using custom curved mesh
            const wingCurveGeom = new THREE.BoxGeometry(0.8, 0.1, 0.5);
            const wingCurve = new THREE.Mesh(wingCurveGeom, wingMaterial);
            
            // Rotate and position to create curved wing effect
            wingCurve.position.set(isLeft ? 1 : -1, 0, 0.2);
            wingCurve.rotation.z = isLeft ? Math.PI / 8 : -Math.PI / 8;
            wingGroup.add(wingCurve);
            
            // Wing tip with gold accent
            const wingTipGeom = new THREE.BoxGeometry(0.3, 0.08, 0.3);
            const goldMaterial = new THREE.MeshPhongMaterial({ 
                color: 0xFFD700, // Gold
                specular: 0xFFFFFF, 
                shininess: 100,
                emissive: 0xFFD700,
                emissiveIntensity: 0.3
            });
            
            const wingTip = new THREE.Mesh(wingTipGeom, goldMaterial);
            wingTip.position.set(isLeft ? 1.4 : -1.4, 0, 0.2);
            wingTip.rotation.z = isLeft ? Math.PI / 6 : -Math.PI / 6;
            wingGroup.add(wingTip);
            
            return wingGroup;
        };
        
        // Add wings to ship
        const leftWing = createCurvedWing(true);
        this.mesh.add(leftWing);
        
        const rightWing = createCurvedWing(false);
        this.mesh.add(rightWing);
        
        // Add gold accents to body
        const addGoldAccent = (width, height, depth, x, y, z, rotX = 0, rotY = 0, rotZ = 0) => {
            const accentGeom = new THREE.BoxGeometry(width, height, depth);
            const goldMaterial = new THREE.MeshPhongMaterial({ 
                color: 0xFFD700, // Gold
                specular: 0xFFFFFF,
                shininess: 100,
                emissive: 0xFFD700,
                emissiveIntensity: 0.3
            });
            
            const accent = new THREE.Mesh(accentGeom, goldMaterial);
            accent.position.set(x, y, z);
            accent.rotation.set(rotX, rotY, rotZ);
            this.mesh.add(accent);
            return accent;
        };
        
        // Add gold accents along the body
        addGoldAccent(0.8, 0.05, 0.1, 0, -0.25, -0.3);
        addGoldAccent(0.8, 0.05, 0.1, 0, -0.25, 0.3);
        addGoldAccent(0.05, 0.05, 1.0, 0.3, -0.25, 0);
        addGoldAccent(0.05, 0.05, 1.0, -0.3, -0.25, 0);
        
        // Add thrusters
        const thrusterGeometry = new THREE.CylinderGeometry(0.2, 0.15, 0.5, 8);
        const thrusterMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xFFD700, // Gold
            emissive: 0xFF5500,
            emissiveIntensity: 0.5
        });
        
        // Main thrusters (back)
        const mainThruster = new THREE.Mesh(thrusterGeometry, thrusterMaterial);
        mainThruster.position.z = 1.2; // Position at the back of the ship
        mainThruster.rotation.x = Math.PI; // Point backward
        this.mesh.add(mainThruster);
        this.thrusters.push({ mesh: mainThruster, type: 'main' });
        
        // Front/Reverse thruster (new)
        const reverseThruster = new THREE.Mesh(thrusterGeometry.clone(), thrusterMaterial.clone());
        reverseThruster.position.z = -1.0; // Position at the front of the ship
        reverseThruster.rotation.x = 0; // Point forward
        reverseThruster.scale.set(0.6, 0.6, 0.6); // Make it slightly smaller than main thruster
        this.mesh.add(reverseThruster);
        this.thrusters.push({ mesh: reverseThruster, type: 'reverse' });
        
        // Side thrusters for lateral movement
        const leftThruster = new THREE.Mesh(thrusterGeometry.clone(), thrusterMaterial.clone());
        leftThruster.position.set(0.5, 0, 0.5);
        leftThruster.rotation.z = Math.PI / 2; // Point to the right (for leftward thrust)
        leftThruster.scale.set(0.5, 0.5, 0.5); // Make side thrusters smaller
        this.mesh.add(leftThruster);
        this.thrusters.push({ mesh: leftThruster, type: 'left' });
        
        const rightThruster = new THREE.Mesh(thrusterGeometry.clone(), thrusterMaterial.clone());
        rightThruster.position.set(-0.5, 0, 0.5);
        rightThruster.rotation.z = -Math.PI / 2; // Point to the left (for rightward thrust)
        rightThruster.scale.set(0.5, 0.5, 0.5); // Make side thrusters smaller
        this.mesh.add(rightThruster);
        this.thrusters.push({ mesh: rightThruster, type: 'right' });
        
        // Add to scene
        this.scene.add(this.mesh);
        
        // Create particle systems for thrusters
        this.createThrusterParticles();
    }
    
    // Create mining laser beam - the actual beam is handled by the Controls class
    activateMiningLaser() {
        // Activate both emitters for a more powerful effect
        if (this.leftEmitter && this.rightEmitter) {
            // Left emitter
            this.leftEmitter.material.emissiveIntensity = 1.5;
            this.leftEmitter.scale.set(1.2, 1.2, 1.2);
            
            // Right emitter
            this.rightEmitter.material.emissiveIntensity = 1.5;
            this.rightEmitter.scale.set(1.2, 1.2, 1.2);
        }
    }
    
    deactivateMiningLaser() {
        // Deactivate both emitters
        if (this.leftEmitter && this.rightEmitter) {
            // Left emitter
            this.leftEmitter.material.emissiveIntensity = 1;
            this.leftEmitter.scale.set(1, 1, 1);
            
            // Right emitter
            this.rightEmitter.material.emissiveIntensity = 1;
            this.rightEmitter.scale.set(1, 1, 1);
        }
    }
    
    createThrusterParticles() {
        // Main thruster particles
        const particleCount = 150; // Reduced from 200
        
        // Function to create a particle system
        const createParticleSystem = (position, rotation, size, type, color = 0xff5500) => {
            const positions = new Float32Array(particleCount * 3);
            
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                positions[i3] = (Math.random() - 0.5) * size.x * 0.7; // Reduced spread by 30%
                positions[i3 + 1] = (Math.random() - 0.5) * size.y * 0.7; // Reduced spread by 30%
                positions[i3 + 2] = Math.random() * size.z * 0.7; // Reduced length by 30%
            }
            
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            
            const material = new THREE.PointsMaterial({
                color: color,
                size: 0.04, // Reduced from 0.06
                transparent: true,
                opacity: 0.6, // Reduced from 0.9
                blending: THREE.AdditiveBlending
            });
            
            const particleSystem = new THREE.Points(geometry, material);
            particleSystem.visible = false; // Initially invisible
            particleSystem.position.copy(position);
            if (rotation) particleSystem.rotation.copy(rotation);
            this.mesh.add(particleSystem);
            
            return {
                system: particleSystem,
                geometry: geometry,
                positions: positions,
                type: type,
                baseSize: size
            };
        };
        
        // Main thruster (back)
        this.particleSystems.push(
            createParticleSystem(
                new THREE.Vector3(0, 0, 1.1), // Position
                new THREE.Euler(Math.PI, 0, 0), // Rotation
                new THREE.Vector3(0.15, 0.15, 2), // Size - reduced from 0.2x0.2x3
                'main',
                0xff4400 // Darker color than before
            )
        );
        
        // Left thruster
        this.particleSystems.push(
            createParticleSystem(
                new THREE.Vector3(0.5, 0, 0.5), // Position
                new THREE.Euler(0, 0, Math.PI / 2), // Rotation
                new THREE.Vector3(0.08, 0.08, 0.8), // Size - reduced from 0.1x0.1x1.2
                'left',
                0xff3300 // Darker color
            )
        );
        
        // Right thruster
        this.particleSystems.push(
            createParticleSystem(
                new THREE.Vector3(-0.5, 0, 0.5), // Position
                new THREE.Euler(0, 0, -Math.PI / 2), // Rotation
                new THREE.Vector3(0.08, 0.08, 0.8), // Size - reduced from 0.1x0.1x1.2
                'right',
                0xff3300 // Darker color
            )
        );
        
        // Reverse thruster (front)
        this.particleSystems.push(
            createParticleSystem(
                new THREE.Vector3(0, 0, -1.1), // Position
                new THREE.Euler(0, 0, 0), // Rotation
                new THREE.Vector3(0.15, 0.15, 1.4), // Size - reduced from 0.2x0.2x2
                'reverse',
                0x44ccff // Darker blue-cyan color
            )
        );
    }
    
    createTrailEffect() {
        // Create particle system for the ship's trail - cypherpunk style
        const particleCount = 1800; // Reduced slightly
        const particles = new THREE.BufferGeometry();
        
        // Create positions for particles
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        // Initial positions - cypherpunk style with more angular distribution
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Angular, grid-like positioning for cypherpunk aesthetic
            positions[i3] = (Math.floor((Math.random() - 0.5) * 10) / 10) * 0.4; // Grid-like X distribution
            positions[i3 + 1] = (Math.floor((Math.random() - 0.5) * 10) / 10) * 0.4; // Grid-like Y distribution
            positions[i3 + 2] = 1.8 + (Math.random() * 0.4); // Z position with less randomness
            
            // More consistent velocities for straight, digital-looking trails
            velocities[i3] = (Math.random() - 0.5) * 0.008; // Reduced randomness
            velocities[i3 + 1] = (Math.random() - 0.5) * 0.008;
            velocities[i3 + 2] = 0.12 + (Math.random() * 0.05); // More consistent speed
            
            // Cypherpunk colors - neon blues, purples, and teals
            // Assign one of three color schemes randomly for variety
            const colorScheme = Math.floor(Math.random() * 3);
            if (colorScheme === 0) {
                // Neon blue/cyan
                colors[i3] = 0.0;
                colors[i3 + 1] = 0.7 + Math.random() * 0.3;
                colors[i3 + 2] = 0.8 + Math.random() * 0.2;
            } else if (colorScheme === 1) {
                // Neon purple/magenta
                colors[i3] = 0.7 + Math.random() * 0.3;
                colors[i3 + 1] = 0.0;
                colors[i3 + 2] = 0.8 + Math.random() * 0.2;
            } else {
                // Electric green
                colors[i3] = 0.0;
                colors[i3 + 1] = 0.9 + Math.random() * 0.1;
                colors[i3 + 2] = 0.4 + Math.random() * 0.2;
            }
            
            // Random variation between small angular particles and larger ones
            sizes[i] = Math.random() < 0.7 ? 
                0.8 + Math.random() * 0.4 : // Small particles
                1.5 + Math.random() * 0.5;  // Occasional larger particles
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
        particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Trail particle shader material - cypherpunk style with angular particles
        const trailMaterial = new THREE.ShaderMaterial({
            uniforms: {
                color: { value: new THREE.Color(0x00ffff) }, // Base cyan color
                pointTexture: { value: new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/spark1.png') } // Using spark texture instead of disc
            },
            vertexShader: `
                attribute float size;
                attribute vec3 customColor;
                varying vec3 vColor;
                void main() {
                    vColor = customColor;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    
                    // Add slight "digital jitter" to the position for glitch effect
                    if (mod(mvPosition.y * 10.0, 4.0) < 0.1) {
                        mvPosition.x += sin(mvPosition.z) * 0.05;
                    }
                    
                    gl_PointSize = size * (180.0 / -mvPosition.z); // Adjusted size calculation
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform vec3 color;
                uniform sampler2D pointTexture;
                varying vec3 vColor;
                void main() {
                    // Create more angular particles by manipulating texture coordinates
                    vec2 uv = gl_PointCoord;
                    
                    // Digital distortion effect - occasional "glitch" lines
                    if (mod(gl_FragCoord.y, 16.0) < 0.5) {
                        uv.x = mod(uv.x + sin(uv.y * 10.0) * 0.1, 1.0);
                    }
                    
                    // Apply texture with the modified coordinates
                    vec4 texColor = texture2D(pointTexture, uv);
                    
                    // Sharper edges for angular look
                    texColor.a = step(0.2, texColor.r);
                    
                    // Combine with color
                    gl_FragColor = vec4(color * vColor, 0.75) * texColor;
                    
                    // Hard cutoff for sharper particle edges
                    if (gl_FragColor.a < 0.2) discard;
                }
            `,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            transparent: true
        });
        
        // Add after creating the material
        trailMaterial.uniforms.pointTexture.value.colorSpace = THREE.SRGBColorSpace;
        
        this.trailParticles = new THREE.Points(particles, trailMaterial);
        this.trailParticles.visible = false; // Only visible when moving
        this.mesh.add(this.trailParticles);
        
        // Store data for updating
        this.trailParticles.userData = {
            positions: positions,
            velocities: velocities,
            colors: colors
        };
    }
    
    updateParticles() {
        if (!this.particleSystems) return;
        
        this.particleSystems.forEach(ps => {
            if (ps.system.visible) {
                const positions = ps.positions;
                const baseSize = ps.baseSize;
                
                for (let i = 0; i < positions.length; i += 3) {
                    // Move particle outward along z-axis of particle system
                    positions[i] += (Math.random() - 0.5) * 0.02; // More randomness
                    positions[i + 1] += (Math.random() - 0.5) * 0.02;
                    positions[i + 2] += 0.15; // Faster speed outward for more dynamic effect
                    
                    // Add some randomness to particle movement
                    positions[i] += (Math.random() - 0.5) * 0.01;
                    positions[i + 1] += (Math.random() - 0.5) * 0.01;
                    
                    // Reset particles that go too far
                    if (positions[i + 2] > baseSize.z) {
                        positions[i] = (Math.random() - 0.5) * baseSize.x;
                        positions[i + 1] = (Math.random() - 0.5) * baseSize.y;
                        positions[i + 2] = 0;
                    }
                }
                
                // Update the geometry
                ps.geometry.attributes.position.needsUpdate = true;
            }
        });
        
        // Update trail particles with cypherpunk effects
        if (this.trailParticles && this.trailParticles.visible) {
            const positions = this.trailParticles.userData.positions;
            const velocities = this.trailParticles.userData.velocities;
            const colors = this.trailParticles.userData.colors;
            
            // Calculate a trail speed factor based on current velocity
            const speedFactor = this.velocity.length() / 8;
            
            for (let i = 0; i < positions.length; i += 3) {
                // Add digital "glitch" effect occasionally
                if (Math.random() < 0.01) {
                    // Sudden position jump to simulate digital glitch
                    positions[i] += (Math.random() - 0.5) * 0.2;
                    positions[i + 1] += (Math.random() - 0.5) * 0.2;
                }
                
                // Move particles based on velocity, with occasional "stutter" for digital effect
                const stutter = Math.random() < 0.05 ? 0 : 1; // Occasionally freeze particle
                positions[i] += velocities[i] * speedFactor * stutter;
                positions[i + 1] += velocities[i + 1] * speedFactor * stutter;
                positions[i + 2] += velocities[i + 2] * speedFactor * stutter;
                
                // Digital color shift - occasional color changes for glitch effect
                if (Math.random() < 0.005) {
                    // Sudden color swap
                    const temp = colors[i];
                    colors[i] = colors[i + 2];
                    colors[i + 2] = temp;
                }
                
                // Slower fade for digital persistence effect
                colors[i] *= 0.99;
                colors[i + 1] *= 0.99;
                colors[i + 2] *= 0.99;
                
                // Reset particles that go too far or fade out
                // Increased distance threshold for longer trails
                const distance = Math.sqrt(
                    positions[i] * positions[i] + 
                    positions[i + 1] * positions[i + 1] + 
                    positions[i + 2] * positions[i + 2]
                );
                
                if (distance > 45 || colors[i] + colors[i+1] + colors[i+2] < 0.3) {
                    // Reset position with grid-like distribution for cypherpunk aesthetic
                    positions[i] = (Math.floor((Math.random() - 0.5) * 10) / 10) * 0.4;
                    positions[i + 1] = (Math.floor((Math.random() - 0.5) * 10) / 10) * 0.4;
                    positions[i + 2] = 1.8 + (Math.random() * 0.4);
                    
                    // Reset velocity - digital precision
                    velocities[i] = (Math.random() - 0.5) * 0.008;
                    velocities[i + 1] = (Math.random() - 0.5) * 0.008;
                    velocities[i + 2] = 0.12 + (Math.random() * 0.05);
                    
                    // Reset with cypherpunk colors - rotating between schemes
                    const colorScheme = Math.floor(Math.random() * 3);
                    if (colorScheme === 0) {
                        // Neon blue/cyan
                        colors[i] = 0.0;
                        colors[i + 1] = 0.7 + Math.random() * 0.3;
                        colors[i + 2] = 0.8 + Math.random() * 0.2;
                    } else if (colorScheme === 1) {
                        // Neon purple/magenta
                        colors[i] = 0.7 + Math.random() * 0.3;
                        colors[i + 1] = 0.0;
                        colors[i + 2] = 0.8 + Math.random() * 0.2;
                    } else {
                        // Electric green
                        colors[i] = 0.0;
                        colors[i + 1] = 0.9 + Math.random() * 0.1;
                        colors[i + 2] = 0.4 + Math.random() * 0.2;
                    }
                }
            }
            
            // Update the geometry
            this.trailParticles.geometry.attributes.position.needsUpdate = true;
            this.trailParticles.geometry.attributes.customColor.needsUpdate = true;
        }
    }

    dock() {
        console.log("Docking spaceship");
        console.log("Spaceship values before docking:", {
            shield: this.shield,
            maxShield: this.maxShield,
            hull: this.hull,
            maxHull: this.maxHull,
            isDocked: this.isDocked
        });
        
        this.isDocked = true;
        this.velocity.set(0, 0, 0);
        this.mesh.visible = false;
        
        console.log("Spaceship values after docking:", {
            shield: this.shield,
            maxShield: this.maxShield,
            hull: this.hull,
            maxHull: this.maxHull,
            isDocked: this.isDocked
        });
    }

    undock() {
        console.log("Undocking spaceship");
        console.log("Spaceship values before undocking:", {
            shield: this.shield,
            maxShield: this.maxShield,
            hull: this.hull,
            maxHull: this.maxHull,
            isDocked: this.isDocked
        });
        
        // Store shield value before undocking to diagnose reset issue
        const shieldBeforeUndock = this.shield;
        
        this.isDocked = false;
        this.mesh.visible = true;
        
        // Check if shield was reset and restore it
        if (this.shield !== shieldBeforeUndock) {
            console.log(`SHIELD RESET DETECTED during undock! Value changed from ${shieldBeforeUndock} to ${this.shield}`);
            console.log("Restoring shield value to:", shieldBeforeUndock);
            this.shield = shieldBeforeUndock;
        }
        
        console.log("Spaceship values after undocking:", {
            shield: this.shield,
            maxShield: this.maxShield,
            hull: this.hull,
            maxHull: this.maxHull,
            isDocked: this.isDocked
        });
        
        // When undocking, attempt to sync shield and hull values to the HealthComponent
        this.syncValuesToHealthComponent();
        
        // If an undock location is specified, use that instead
        if (this.undockLocation) {
            this.mesh.position.copy(this.undockLocation);
            
            // Point away from the stargate (down toward sun)
            this.mesh.rotation.set(Math.PI/2, 0, 0);
        } else {
            // Original behavior - position just outside the docking bay
            const stargatePosition = this.scene.getObjectByName('stargate').position.clone();
            stargatePosition.z += 550; // Move in front of the docking bay
            this.mesh.position.copy(stargatePosition);
            
            // Reset rotation to face away from the stargate
            this.mesh.rotation.set(0, Math.PI, 0);
        }
        
        this.velocity.set(0, 0, 0); // This line resets velocity, but it's fine since we're undocking
        
        return this.mesh.position.clone();
    }

    refuel() {
        console.log("Refueling spaceship");
        this.fuel = this.maxFuel;
        return 100; // Cost of refueling
    }

    repairShield() {
        const oldShield = this.shield;
        console.log(`===== SHIELD REPAIR INITIATED =====`);
        console.log(`Repairing shield: ${oldShield} → ${this.maxShield}`);
        
        // CRITICAL FIX: Set and verify shield repair
        this.shield = this.maxShield;
        console.log(`Shield value is now: ${this.shield} (Expected: ${this.maxShield})`);
        
        // Log full spaceship state for debugging
        console.log("Full spaceship state after shield repair:", {
            shield: this.shield,
            maxShield: this.maxShield,
            hull: this.hull,
            maxHull: this.maxHull,
            fuel: this.fuel,
            maxFuel: this.maxFuel
        });
        console.log(`===== SHIELD REPAIR COMPLETED =====`);
        
        // Sync the updated shield value to the player entity's HealthComponent
        // Use direct entity access for more reliable syncing
        if (window.game && window.game.world) {
            try {
                const players = window.game.world.getEntitiesByTag('player');
                if (players && players.length > 0) {
                    const health = players[0].getComponent('HealthComponent');
                    if (health) {
                        // Update shield directly on the component
                        const oldHealthShield = health.shield;
                        health.shield = this.shield;
                        console.log(`Direct shield update on HealthComponent: ${oldHealthShield} → ${health.shield}`);
                    }
                }
            } catch (e) {
                console.error("Error during direct HealthComponent update:", e);
            }
        }
        
        // Also use the normal sync method
        this.syncValuesToHealthComponent();
        
        return 150; // Cost of shield repair
    }

    repairHull() {
        const oldHull = this.hull;
        console.log(`===== HULL REPAIR INITIATED =====`);
        console.log(`Repairing hull: ${oldHull} → ${this.maxHull}`);
        
        // CRITICAL FIX: Set and verify hull repair
        this.hull = this.maxHull;
        console.log(`Hull value is now: ${this.hull} (Expected: ${this.maxHull})`);
        
        // Log full spaceship state for debugging
        console.log("Full spaceship state after hull repair:", {
            shield: this.shield,
            maxShield: this.maxShield,
            hull: this.hull,
            maxHull: this.maxHull,
            fuel: this.fuel,
            maxFuel: this.maxFuel
        });
        console.log(`===== HULL REPAIR COMPLETED =====`);
        
        // Sync the updated hull value to the player entity's HealthComponent
        // Use direct entity access for more reliable syncing
        if (window.game && window.game.world) {
            try {
                const players = window.game.world.getEntitiesByTag('player');
                if (players && players.length > 0) {
                    const health = players[0].getComponent('HealthComponent');
                    if (health) {
                        // Update hull directly on the component
                        const oldHealthHull = health.health;
                        health.health = this.hull;
                        console.log(`Direct hull update on HealthComponent: ${oldHealthHull} → ${health.health}`);
                    }
                }
            } catch (e) {
                console.error("Error during direct HealthComponent update:", e);
            }
        }
        
        // Also use the normal sync method
        this.syncValuesToHealthComponent();
        
        return 200; // Cost of hull repair
    }

    consumeFuel() {
        // Consume fuel when thrusting
        if (this.thrust.forward || this.thrust.backward || this.thrust.left || this.thrust.right) {
            let consumptionRate = this.fuelConsumptionRate;
            
            // Extra consumption when boosting
            if (this.thrust.boost) {
                consumptionRate *= 3;
            }
            
            this.fuel = Math.max(0, this.fuel - consumptionRate);
        }
        
        // Return true if we have fuel, false if empty
        return this.fuel > 0;
    }

    // Add a new method for upgrading the fuel tank
    upgradeFuelTank() {
        console.log("Upgrading fuel tank");
        
        // Double the fuel capacity
        this.maxFuel *= 2;
        
        // Increase the fuel level to match the new capacity
        this.fuel = this.maxFuel;
        
        // Increase the upgrade level
        this.fuelTankLevel++;
        
        // Calculate the new upgrade cost (4x the previous cost)
        this.fuelUpgradeCost *= 4;
        
        return this.maxFuel;
    }
    
    // New method for upgrading engines
    upgradeEngine() {
        console.log("Upgrading engines");
        
        // Increase max velocity by 25%
        this.maxVelocity *= 1.25;
        
        // Upgrade visual appearance of thrusters
        this.thrusters.forEach(thruster => {
            if (thruster.mesh && thruster.mesh.material) {
                // Make thrusters more intense with each upgrade
                thruster.mesh.material.emissiveIntensity += 0.2;
                
                // Change thruster color slightly with each upgrade to show progression
                if (this.engineLevel % 2 === 0) { // Every even level
                    thruster.mesh.material.emissive.setHex(0xff8800); // More orange
                } else {
                    thruster.mesh.material.emissive.setHex(0xffaa00); // More yellow
                }
            }
        });
        
        // Increase the upgrade level
        this.engineLevel++;
        
        // Calculate the new upgrade cost (2.5x the previous cost)
        this.engineUpgradeCost = Math.floor(this.engineUpgradeCost * 2.5);
        
        return this.maxVelocity;
    }
    
    // New method for upgrading mining laser
    upgradeMiningLaser() {
        console.log("Upgrading mining laser");
        
        // Increase mining efficiency by 30%
        this.miningEfficiency *= 1.3;
        
        // Upgrade visual appearance of mining laser emitters
        if (this.leftEmitter && this.leftEmitter.material) {
            // Increase the size of the left emitter
            this.leftEmitter.scale.set(1.1, 1.1, 1.1);
            
            // Change the color based on level to show progression
            const colors = [0xff0000, 0xff5500, 0xff9900, 0xffcc00, 0xffee00];
            if (this.miningLevel < colors.length) {
                this.leftEmitter.material.color.setHex(colors[this.miningLevel]);
                this.leftEmitter.material.emissive.setHex(colors[this.miningLevel]);
            }
            
            // Increase the emissive intensity
            this.leftEmitter.material.emissiveIntensity += 0.2;
        }
        
        // Also upgrade the right emitter to match
        if (this.rightEmitter && this.rightEmitter.material) {
            // Increase the size of the right emitter
            this.rightEmitter.scale.set(1.1, 1.1, 1.1);
            
            // Change the color based on level to show progression
            const colors = [0xff0000, 0xff5500, 0xff9900, 0xffcc00, 0xffee00];
            if (this.miningLevel < colors.length) {
                this.rightEmitter.material.color.setHex(colors[this.miningLevel]);
                this.rightEmitter.material.emissive.setHex(colors[this.miningLevel]);
            }
            
            // Increase the emissive intensity
            this.rightEmitter.material.emissiveIntensity += 0.2;
        }
        
        // Also update the cannons
        if (this.leftCannon && this.leftCannon.material) {
            // Make the cannons thicker with each upgrade
            this.leftCannon.scale.x *= 1.1;
            this.leftCannon.scale.y *= 1.1;
        }
        
        if (this.rightCannon && this.rightCannon.material) {
            // Make the cannons thicker with each upgrade
            this.rightCannon.scale.x *= 1.1;
            this.rightCannon.scale.y *= 1.1;
        }
        
        // Increase the upgrade level
        this.miningLevel++;
        
        // Calculate the new upgrade cost (3x the previous cost)
        this.miningUpgradeCost = Math.floor(this.miningUpgradeCost * 3);
        
        return this.miningEfficiency;
    }
    
    // New method for upgrading hull
    upgradeHull() {
        console.log("Upgrading hull");
        
        // Increase collision resistance by 25%
        this.collisionResistance *= 1.25;
        
        // Modify ship appearance to show hull upgrade
        const bodyGroup = this.mesh.children.find(child => child instanceof THREE.Group);
        
        if (bodyGroup && bodyGroup.children) {
            // Update both the cylinder and cone parts of the ship body
            bodyGroup.children.forEach(part => {
                if (part instanceof THREE.Mesh && part.material) {
                    // Change the hull color slightly to indicate higher grade material
                    if (this.hullLevel % 2 === 0) {
                        // Even levels: more blue tint
                        part.material.color.setHex(0x30c0d0);
                    } else {
                        // Odd levels: more green tint
                        part.material.color.setHex(0x30d0c0);
                    }
                    
                    // Increase shininess with each level to suggest better armor
                    part.material.shininess += 10;
                }
            });
        }
        
        // Increase the upgrade level
        this.hullLevel++;
        
        // Calculate the new upgrade cost (2x the previous cost)
        this.hullUpgradeCost = Math.floor(this.hullUpgradeCost * 2);
        
        return this.collisionResistance;
    }
    
    // New method for upgrading scanner
    upgradeScanner() {
        console.log("Upgrading scanner");
        
        // Increase scanner range by 20%
        this.scanRange *= 1.2;
        
        // Add visual indicator for scanner upgrade (could add scan dish or antenna)
        // This is a simplified version - in a real implementation, you'd want to
        // add actual mesh components to the ship
        
        // Increase the upgrade level
        this.scannerLevel++;
        
        // Calculate the new upgrade cost (1.8x the previous cost)
        this.scannerUpgradeCost = Math.floor(this.scannerUpgradeCost * 1.8);
        
        return this.scanRange;
    }

    updateTrailVisibility(isMoving) {
        // Show trail particles when the ship is moving, not just when thrusting forward
        if (this.trailParticles) {
            this.trailParticles.visible = isMoving;
        }
    }
    
    /**
     * Subscribe to player entity destruction events
     * @param {MessageBus} messageBus The game's message bus
     */
    subscribeToDestructionEvents(messageBus) {
        if (!messageBus) return;
        
        messageBus.subscribe('entity.destroyed', (message) => {
            const entity = message.data.entity;
            
            // Check if this is the player entity
            if (entity && entity.hasTag && entity.hasTag('player')) {
                console.log("Player entity destroyed - updating spaceship state");
                this.isDestroyed = true;
                
                // Update hull and shield values from the player entity if available
                const healthComponent = entity.getComponent('HealthComponent');
                if (healthComponent) {
                    this.hull = healthComponent.health;
                    this.shield = healthComponent.shield;
                } else {
                    // If no health component, just set to 0
                    this.hull = 0;
                    this.shield = 0;
                }
                
                // Make visual changes to show destroyed state
                this.handleDestruction();
            }
        });
        
        console.log("Spaceship subscribed to destruction events");
    }
    
    /**
     * Handle ship destruction effects
     */
    handleDestruction() {
        // Visual and behavioral changes for destroyed state
        if (this.mesh) {
            // Disable thrusters
            this.particleSystems.forEach(ps => {
                if (ps && ps.system) {
                    ps.system.visible = false;
                }
            });
            
            // Disable trail
            if (this.trailParticles) {
                this.trailParticles.visible = false;
            }
            
            // Could add explosion effect, damage texture, etc.
        }
    }

    // Method to sync hull and shield values to the player entity's HealthComponent
    syncValuesToHealthComponent() {
        console.log("Beginning shield and hull sync to HealthComponent");
        
        console.log("Current spaceship values:", {
            shield: this.shield,
            maxShield: this.maxShield,
            hull: this.hull,
            maxHull: this.maxHull
        });
        
        // Store the values that need to be synced to the HealthComponent
        const valuesForSync = {
            shield: this.shield,
            maxShield: this.maxShield,
            hull: this.hull,
            maxHull: this.maxHull
        };
        
        console.log(`Preparing to sync values to player HealthComponent: Shield=${this.shield}, Hull=${this.hull}`);
        
        // Try using the MessageBus to broadcast the sync event
        try {
            if (window.game && window.game.messageBus) {
                // Use the message bus to publish a sync event for any interested components
                window.game.messageBus.publish('player.syncHealth', valuesForSync);
                console.log("Published player.syncHealth event to game.messageBus with values:", valuesForSync);
            } else if (window.mainMessageBus) {
                // Try using the global message bus
                window.mainMessageBus.publish('player.syncHealth', valuesForSync);
                console.log("Published player.syncHealth event to mainMessageBus with values:", valuesForSync);
            } else {
                console.warn("No message bus available to sync health values");
            }
        } catch (e) {
            console.error("Error publishing sync event:", e);
        }
        
        // Also try direct access as a fallback
        try {
            if (window.game && window.game.world) {
                const players = window.game.world.getEntitiesByTag('player');
                console.log(`Found ${players ? players.length : 0} player entities for direct sync`);
                
                if (players && players.length > 0) {
                    const player = players[0];
                    const health = player.getComponent('HealthComponent');
                    
                    if (health) {
                        // Log pre-sync state
                        console.log("DIRECT SYNC - HealthComponent before sync:", {
                            shield: health.shield,
                            maxShield: health.maxShield,
                            health: health.health,
                            maxHealth: health.maxHealth
                        });
                        
                        console.log("DIRECT SYNC - Spaceship values to sync:", {
                            shield: this.shield,
                            maxShield: this.maxShield,
                            hull: this.hull,
                            maxHull: this.maxHull
                        });
                        
                        // Sync shield value
                        const oldShield = health.shield;
                        health.shield = this.shield;
                        health.maxShield = this.maxShield;
                        
                        // Sync hull value
                        const oldHealth = health.health;
                        health.health = this.hull;
                        health.maxHealth = this.maxHull;
                        
                        console.log(`Directly synced values to HealthComponent: Shield ${oldShield} → ${health.shield}, Hull ${oldHealth} → ${health.health}`);
                        
                        // Verify sync was successful
                        console.log("DIRECT SYNC - HealthComponent after sync:", {
                            shield: health.shield,
                            maxShield: health.maxShield,
                            health: health.health,
                            maxHealth: health.maxHealth
                        });
                    } else {
                        console.warn("Player entity found but has no HealthComponent");
                    }
                } else {
                    console.warn("No player entities found for direct sync");
                }
            }
        } catch (e) {
            console.error("Error directly syncing values to HealthComponent:", e);
        }
    }
} 