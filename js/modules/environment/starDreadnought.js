// starDreadnought.js - Creates and manages the massive Star Dreadnought ship

import * as THREE from 'three';

export class StarDreadnought {
    constructor(scene) {
        this.scene = scene;
        this.ship = null;
        this.engineGlows = [];
        this.teleportBeam = null;
        this.teleportBeamParticles = null;
        this.teleportBeamActive = false;
        
        // Create ship model programmatically
        this.createShipModel();
        
        // Add to scene
        this.scene.add(this.ship);
        
        console.log("Star Dreadnought created");
    }
    
    createShipModel() {
        // Create a group for the entire ship
        this.ship = new THREE.Group();
        this.ship.name = 'starDreadnought';
        
        // Set scale - this is a massive ship
        const shipScale = 1200; // Overall scale factor
        
        // Main hull - elongated wedge shape
        this.createMainHull(shipScale);
        
        // Command bridge superstructure
        this.createCommandBridge(shipScale);
        
        // Engine array
        this.createEngineArray(shipScale);
        
        // Surface details
        this.createSurfaceDetails(shipScale);
        
        // Teleport beam (initially inactive)
        this.createTeleportBeam(shipScale);
    }
    
    createMainHull(scale) {
        // Create main hull using custom geometry for the distinctive arrow/dagger shape
        const hullLength = scale;
        const hullWidth = scale * 0.22;
        const hullHeight = scale * 0.06;
        const taperFactor = 0.15; // How much the front tapers
        
        // Create geometry for the main hull shape
        const hullGeometry = new THREE.BufferGeometry();
        
        // Define vertices for the hull shape (triangulated)
        const vertices = new Float32Array([
            // Bottom face
            -hullWidth/2, -hullHeight/2, hullLength/2,  // bottom left back
            hullWidth/2, -hullHeight/2, hullLength/2,   // bottom right back
            -hullWidth*taperFactor, -hullHeight/2, -hullLength/2, // bottom left front
            
            hullWidth/2, -hullHeight/2, hullLength/2,   // bottom right back
            hullWidth*taperFactor, -hullHeight/2, -hullLength/2,  // bottom right front
            -hullWidth*taperFactor, -hullHeight/2, -hullLength/2, // bottom left front
            
            // Top face
            -hullWidth/2, hullHeight/2, hullLength/2,  // top left back
            -hullWidth*taperFactor, hullHeight/2, -hullLength/2, // top left front
            hullWidth/2, hullHeight/2, hullLength/2,   // top right back
            
            hullWidth/2, hullHeight/2, hullLength/2,   // top right back
            -hullWidth*taperFactor, hullHeight/2, -hullLength/2, // top left front
            hullWidth*taperFactor, hullHeight/2, -hullLength/2,  // top right front
            
            // Left face
            -hullWidth/2, -hullHeight/2, hullLength/2,  // bottom left back
            -hullWidth/2, hullHeight/2, hullLength/2,   // top left back
            -hullWidth*taperFactor, -hullHeight/2, -hullLength/2, // bottom left front
            
            -hullWidth/2, hullHeight/2, hullLength/2,   // top left back
            -hullWidth*taperFactor, hullHeight/2, -hullLength/2,  // top left front
            -hullWidth*taperFactor, -hullHeight/2, -hullLength/2, // bottom left front
            
            // Right face
            hullWidth/2, -hullHeight/2, hullLength/2,  // bottom right back
            hullWidth*taperFactor, -hullHeight/2, -hullLength/2, // bottom right front
            hullWidth/2, hullHeight/2, hullLength/2,   // top right back
            
            hullWidth/2, hullHeight/2, hullLength/2,   // top right back
            hullWidth*taperFactor, -hullHeight/2, -hullLength/2, // bottom right front
            hullWidth*taperFactor, hullHeight/2, -hullLength/2,  // top right front
            
            // Back face
            -hullWidth/2, -hullHeight/2, hullLength/2,  // bottom left back
            -hullWidth/2, hullHeight/2, hullLength/2,   // top left back
            hullWidth/2, -hullHeight/2, hullLength/2,   // bottom right back
            
            hullWidth/2, -hullHeight/2, hullLength/2,   // bottom right back
            -hullWidth/2, hullHeight/2, hullLength/2,   // top left back
            hullWidth/2, hullHeight/2, hullLength/2,    // top right back
            
            // Front face (pointed)
            -hullWidth*taperFactor, -hullHeight/2, -hullLength/2, // bottom left front
            -hullWidth*taperFactor, hullHeight/2, -hullLength/2,  // top left front
            hullWidth*taperFactor, -hullHeight/2, -hullLength/2,  // bottom right front
            
            hullWidth*taperFactor, -hullHeight/2, -hullLength/2,  // bottom right front
            -hullWidth*taperFactor, hullHeight/2, -hullLength/2,  // top left front
            hullWidth*taperFactor, hullHeight/2, -hullLength/2    // top right front
        ]);
        
        // Calculate normals for lighting
        const normals = new Float32Array(vertices.length);
        
        // Add attributes to the geometry
        hullGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        
        // Material for the main hull - metallic dark gray
        const hullMaterial = new THREE.MeshStandardMaterial({
            color: 0x333344,
            metalness: 0.8,
            roughness: 0.3,
            emissive: 0x111111,
            emissiveIntensity: 0.2
        });
        
        // Create the hull mesh
        const hull = new THREE.Mesh(hullGeometry, hullMaterial);
        hull.geometry.computeVertexNormals(); // Auto-generate normals
        
        // Cast shadows
        hull.castShadow = true;
        hull.receiveShadow = true;
        
        // Add to ship group
        this.ship.add(hull);
        
        // Add additional hull plates for more detail
        this.addHullPlates(scale, hull);
    }
    
    addHullPlates(scale, parentHull) {
        // Add additional hull plates for more detail and segmentation
        const plateLength = scale * 0.2;
        const plateWidth = scale * 0.18;
        const plateHeight = scale * 0.01;
        const plateY = scale * 0.035; // Just above the hull
        
        // Create 5 plates down the center of the ship
        for (let i = 0; i < 5; i++) {
            const plateZ = scale * 0.4 - (i * plateLength);
            
            const plateGeometry = new THREE.BoxGeometry(plateWidth, plateHeight, plateLength);
            const plateMaterial = new THREE.MeshStandardMaterial({
                color: 0x444455,
                metalness: 0.7,
                roughness: 0.4,
                emissive: 0x222222
            });
            
            const plate = new THREE.Mesh(plateGeometry, plateMaterial);
            plate.position.set(0, plateY, plateZ);
            
            plate.castShadow = true;
            plate.receiveShadow = true;
            
            this.ship.add(plate);
        }
    }
    
    createCommandBridge(scale) {
        // Command bridge superstructure - distinctive two-tower design
        const bridgeHeight = scale * 0.12;
        const bridgeWidth = scale * 0.06;
        const bridgeDepth = scale * 0.08;
        const bridgeY = scale * 0.085; // Position on top of hull
        const bridgeZ = scale * 0.28; // Position toward the back
        
        // Bridge material - slightly lighter than hull
        const bridgeMaterial = new THREE.MeshStandardMaterial({
            color: 0x555566,
            metalness: 0.7,
            roughness: 0.3,
            emissive: 0x222222,
            emissiveIntensity: 0.2
        });
        
        // Main command tower (larger)
        const mainTowerGeometry = new THREE.BoxGeometry(bridgeWidth, bridgeHeight, bridgeDepth);
        const mainTower = new THREE.Mesh(mainTowerGeometry, bridgeMaterial);
        mainTower.position.set(0, bridgeY, bridgeZ);
        mainTower.castShadow = true;
        mainTower.receiveShadow = true;
        this.ship.add(mainTower);
        
        // Add windows to the bridge
        this.addBridgeWindows(scale, mainTower, bridgeY);
        
        // Secondary command towers (smaller)
        const secondaryTowerScale = 0.7; // 70% the size of main tower
        const secondaryTowerGeometry = new THREE.BoxGeometry(
            bridgeWidth * secondaryTowerScale, 
            bridgeHeight * secondaryTowerScale, 
            bridgeDepth * secondaryTowerScale
        );
        
        // Left tower
        const leftTower = new THREE.Mesh(secondaryTowerGeometry, bridgeMaterial);
        leftTower.position.set(-bridgeWidth * 1.2, bridgeY, bridgeZ + bridgeDepth * 0.6);
        leftTower.castShadow = true;
        leftTower.receiveShadow = true;
        this.ship.add(leftTower);
        
        // Right tower
        const rightTower = new THREE.Mesh(secondaryTowerGeometry, bridgeMaterial);
        rightTower.position.set(bridgeWidth * 1.2, bridgeY, bridgeZ + bridgeDepth * 0.6);
        rightTower.castShadow = true;
        rightTower.receiveShadow = true;
        this.ship.add(rightTower);
    }
    
    addBridgeWindows(scale, bridgeTower, bridgeY) {
        // Add illuminated windows to the bridge
        const windowSize = scale * 0.003;
        const windowSpacing = scale * 0.006;
        const windowRows = 6;
        const windowCols = 10;
        const windowsStartY = bridgeY - scale * 0.02;
        const windowDepth = scale * 0.001;
        
        // Window material - emissive for glow
        const windowMaterial = new THREE.MeshStandardMaterial({
            color: 0xaabbcc,
            emissive: 0xaabbcc,
            emissiveIntensity: 1.0,
            transparent: true,
            opacity: 0.9
        });
        
        // Create window instances
        for (let row = 0; row < windowRows; row++) {
            for (let col = 0; col < windowCols; col++) {
                // Random chance to skip a window (for variety)
                if (Math.random() > 0.85) continue;
                
                const windowGeometry = new THREE.BoxGeometry(windowSize, windowSize, windowDepth);
                const window = new THREE.Mesh(windowGeometry, windowMaterial);
                
                // Position window on the front face of the bridge
                window.position.set(
                    (col - windowCols/2) * windowSpacing,
                    windowsStartY + row * windowSpacing,
                    bridgeTower.position.z + scale * 0.04 + windowDepth
                );
                
                this.ship.add(window);
            }
        }
    }
    
    createEngineArray(scale) {
        // Create engine array at the back of the ship
        const engineRadius = scale * 0.018;
        const engineLength = scale * 0.04;
        const engineZ = scale * 0.48; // Position at the back
        const engineY = scale * 0.01; // Slightly above center line
        
        // Engine housing
        const engineHousingWidth = scale * 0.2;
        const engineHousingHeight = scale * 0.05;
        const engineHousingLength = scale * 0.06;
        
        const housingGeometry = new THREE.BoxGeometry(engineHousingWidth, engineHousingHeight, engineHousingLength);
        const housingMaterial = new THREE.MeshStandardMaterial({
            color: 0x333344,
            metalness: 0.8,
            roughness: 0.4
        });
        
        const engineHousing = new THREE.Mesh(housingGeometry, housingMaterial);
        engineHousing.position.set(0, engineY, engineZ);
        engineHousing.castShadow = true;
        engineHousing.receiveShadow = true;
        this.ship.add(engineHousing);
        
        // Engine exhaust material - blue glow for Star Wars style
        const engineMaterial = new THREE.MeshStandardMaterial({
            color: 0x3366ff,
            emissive: 0x3366ff,
            emissiveIntensity: 0.7,
            transparent: true,
            opacity: 0.7
        });
        
        // Glow material (fully emissive)
        const glowMaterial = new THREE.MeshStandardMaterial({
            color: 0x3366ff,
            emissive: 0x3366ff,
            emissiveIntensity: 1.5,
            transparent: true,
            opacity: 0.8
        });
        
        // Create engine exhausts - two rows of engines for Star Destroyer style
        const engineRows = 2;
        const enginesPerRow = 5;
        const verticalSpacing = engineHousingHeight * 0.5;
        
        for (let row = 0; row < engineRows; row++) {
            const rowY = engineY - verticalSpacing * (row - 0.5);
            
            for (let i = 0; i < enginesPerRow; i++) {
                // Distribute engines across the width
                const posX = (i - (enginesPerRow - 1) / 2) * (engineHousingWidth / (enginesPerRow - 1) * 0.8);
                
                // Engine exhaust
                const engineGeometry = new THREE.CylinderGeometry(engineRadius, engineRadius * 1.5, engineLength, 16);
                const engine = new THREE.Mesh(engineGeometry, engineMaterial);
                
                // Position and orient the engine
                engine.position.set(posX, rowY, engineZ + engineHousingLength * 0.5);
                engine.rotation.x = Math.PI / 2; // Orient horizontally
                
                this.ship.add(engine);
                
                // Add engine glow with additional outer glow
                const glowGeometry = new THREE.SphereGeometry(engineRadius * 1.6, 16, 16);
                const glow = new THREE.Mesh(glowGeometry, glowMaterial.clone());
                glow.position.set(posX, rowY, engineZ + engineHousingLength * 0.5 + engineLength * 1.1);
                
                this.ship.add(glow);
                this.engineGlows.push(glow);
                
                // Add additional outer glow for more dramatic effect
                const outerGlowGeometry = new THREE.SphereGeometry(engineRadius * 2.5, 16, 16);
                const outerGlowMaterial = glowMaterial.clone();
                outerGlowMaterial.opacity = 0.4;
                const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
                outerGlow.position.copy(glow.position);
                
                this.ship.add(outerGlow);
                this.engineGlows.push(outerGlow);
            }
        }
        
        // Add engine trail particles
        this.createEngineTrailParticles(scale, engineZ, engineHousingWidth);
    }
    
    createSurfaceDetails(scale) {
        // Add surface details for more visual interest
        
        // Turrets along the sides
        this.createTurrets(scale);
        
        // Trenches and surface details
        this.createSurfaceTrenches(scale);
        
        // Shield generator domes
        this.createShieldGenerators(scale);
    }
    
    createTurrets(scale) {
        // Create turret batteries along the sides
        const turretRadius = scale * 0.008;
        const turretHeight = scale * 0.01;
        const baseRadius = scale * 0.01;
        const baseHeight = scale * 0.005;
        
        // Turret material
        const turretMaterial = new THREE.MeshStandardMaterial({
            color: 0x666677,
            metalness: 0.7,
            roughness: 0.3
        });
        
        // Positions for turrets (port side)
        const portPositions = [];
        for (let i = 0; i < 12; i++) {
            const z = scale * 0.2 - (i * scale * 0.07);
            portPositions.push([-scale * 0.1, scale * 0.035, z]);
        }
        
        // Create port side turrets
        portPositions.forEach(pos => {
            // Turret base
            const baseGeometry = new THREE.CylinderGeometry(baseRadius, baseRadius, baseHeight, 8);
            const base = new THREE.Mesh(baseGeometry, turretMaterial);
            base.position.set(pos[0], pos[1], pos[2]);
            this.ship.add(base);
            
            // Turret gun
            const turretGeometry = new THREE.CylinderGeometry(turretRadius, turretRadius, turretHeight, 8);
            const turret = new THREE.Mesh(turretGeometry, turretMaterial);
            turret.position.set(pos[0], pos[1] + baseHeight * 0.5 + turretHeight * 0.5, pos[2]);
            turret.rotation.x = Math.PI / 2; // Orient horizontally
            turret.rotation.z = -Math.PI / 6; // Angle outward
            this.ship.add(turret);
        });
        
        // Positions for turrets (starboard side)
        const starboardPositions = [];
        for (let i = 0; i < 12; i++) {
            const z = scale * 0.2 - (i * scale * 0.07);
            starboardPositions.push([scale * 0.1, scale * 0.035, z]);
        }
        
        // Create starboard side turrets
        starboardPositions.forEach(pos => {
            // Turret base
            const baseGeometry = new THREE.CylinderGeometry(baseRadius, baseRadius, baseHeight, 8);
            const base = new THREE.Mesh(baseGeometry, turretMaterial);
            base.position.set(pos[0], pos[1], pos[2]);
            this.ship.add(base);
            
            // Turret gun
            const turretGeometry = new THREE.CylinderGeometry(turretRadius, turretRadius, turretHeight, 8);
            const turret = new THREE.Mesh(turretGeometry, turretMaterial);
            turret.position.set(pos[0], pos[1] + baseHeight * 0.5 + turretHeight * 0.5, pos[2]);
            turret.rotation.x = Math.PI / 2; // Orient horizontally
            turret.rotation.z = Math.PI / 6; // Angle outward
            this.ship.add(turret);
        });
    }
    
    createSurfaceTrenches(scale) {
        // Create surface trenches and details
        const trenchWidth = scale * 0.01;
        const trenchDepth = scale * 0.01;
        const trenchLength = scale * 0.3;
        
        // Trench material - darker than hull
        const trenchMaterial = new THREE.MeshStandardMaterial({
            color: 0x222233,
            metalness: 0.7,
            roughness: 0.8,
            emissive: 0x111122,
            emissiveIntensity: 0.3
        });
        
        // Center trench (inspired by Death Star trench)
        const centerTrenchGeometry = new THREE.BoxGeometry(trenchWidth, trenchDepth, trenchLength);
        const centerTrench = new THREE.Mesh(centerTrenchGeometry, trenchMaterial);
        centerTrench.position.set(0, scale * 0.035, scale * 0.1);
        this.ship.add(centerTrench);
        
        // Side trenches
        const sideTrenchGeometry = new THREE.BoxGeometry(trenchWidth, trenchDepth, trenchLength * 0.7);
        
        // Port side trench
        const portTrench = new THREE.Mesh(sideTrenchGeometry, trenchMaterial);
        portTrench.position.set(-scale * 0.07, scale * 0.035, scale * 0.05);
        this.ship.add(portTrench);
        
        // Starboard side trench
        const starboardTrench = new THREE.Mesh(sideTrenchGeometry, trenchMaterial);
        starboardTrench.position.set(scale * 0.07, scale * 0.035, scale * 0.05);
        this.ship.add(starboardTrench);
    }
    
    createShieldGenerators(scale) {
        // Create shield generator domes
        const domeRadius = scale * 0.02;
        const domeY = scale * 0.05;
        const domeZ = scale * 0.35;
        
        // Dome material - slightly transparent blue
        const domeMaterial = new THREE.MeshStandardMaterial({
            color: 0x3366aa,
            metalness: 0.2,
            roughness: 0.3,
            transparent: true,
            opacity: 0.6,
            emissive: 0x112244,
            emissiveIntensity: 0.3
        });
        
        // Port side shield generator
        const portDomeGeometry = new THREE.SphereGeometry(domeRadius, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const portDome = new THREE.Mesh(portDomeGeometry, domeMaterial);
        portDome.position.set(-scale * 0.08, domeY, domeZ);
        portDome.rotation.x = Math.PI; // Orient half-sphere
        this.ship.add(portDome);
        
        // Starboard side shield generator
        const starboardDomeGeometry = new THREE.SphereGeometry(domeRadius, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const starboardDome = new THREE.Mesh(starboardDomeGeometry, domeMaterial);
        starboardDome.position.set(scale * 0.08, domeY, domeZ);
        starboardDome.rotation.x = Math.PI; // Orient half-sphere
        this.ship.add(starboardDome);
    }
    
    createTeleportBeam(scale) {
        // Create teleport beam (initially inactive)
        const beamTopRadius = scale * 0.03;
        const beamBottomRadius = scale * 0.2; // Much wider at bottom for dramatic beam
        const beamHeight = scale * 0.8; // Longer beam to reach further
        
        // Custom shader material for energy beam effect with more dynamic patterns
        const beamMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0.0 },
                color: { value: new THREE.Color(0x33ccff) },
                pulseFrequency: { value: 12.0 },
                pulseAmplitude: { value: 0.3 }
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
                uniform float pulseFrequency;
                uniform float pulseAmplitude;
                varying vec2 vUv;
                
                // Improved pattern with scrolling and pulsing
                void main() {
                    // Create primary energy pattern - vertical striations
                    float verticalPattern = sin(vUv.y * 50.0 - time * 3.0) * 0.5 + 0.5;
                    
                    // Create horizontal pulse bands
                    float horizontalPulse = sin(vUv.y * pulseFrequency - time * 2.0) * pulseAmplitude + (1.0 - pulseAmplitude);
                    
                    // Edge glow effect with distortion
                    float edgeEffect = smoothstep(0.0, 0.4, vUv.x) * smoothstep(1.0, 0.6, vUv.x);
                    
                    // Swirling energy effect
                    float swirl = sin(vUv.y * 30.0 + vUv.x * 5.0 + time * 4.0) * 0.5 + 0.5;
                    
                    // Combine effects
                    float pattern = mix(verticalPattern, swirl, 0.5) * horizontalPulse * edgeEffect;
                    
                    // Add vertical fade for more realistic beam
                    float opacity = (1.0 - vUv.y * 0.8) * 0.9;
                    
                    // Pulsing brightness based on time
                    float pulse = sin(time * 3.0) * 0.1 + 0.9;
                    
                    // Combine final color 
                    vec3 finalColor = color * pulse;
                    
                    // Output final color with combined opacity
                    gl_FragColor = vec4(finalColor, opacity * pattern);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending // Use additive blending for glowing effect
        });
        
        // Create beam cone
        const beamGeometry = new THREE.CylinderGeometry(beamBottomRadius, beamTopRadius, beamHeight, 32, 16, true);
        this.teleportBeam = new THREE.Mesh(beamGeometry, beamMaterial);
        
        // Position beam below the ship facing down
        this.teleportBeam.position.set(0, -beamHeight/2, -scale * 0.1);
        this.teleportBeam.rotation.x = Math.PI; // Point downward
        
        // Hide beam initially
        this.teleportBeam.visible = false;
        
        // Add to ship
        this.ship.add(this.teleportBeam);
        
        // Create teleport beam particles
        this.createTeleportParticles(scale);
        
        // Create beam impact ring effect
        this.createBeamImpactRing(scale);
    }
    
    createBeamImpactRing(scale) {
        // Create a flat ring at the beam impact point
        const ringGeometry = new THREE.RingGeometry(scale * 0.1, scale * 0.22, 32);
        const ringMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0.0 },
                color: { value: new THREE.Color(0x33ccff) }
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
                    // Animated ripple effect
                    float ripple = sin(distance(vUv, vec2(0.5)) * 20.0 - time * 5.0) * 0.5 + 0.5;
                    
                    // Rotating element
                    float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
                    float rotatingPattern = sin(angle * 8.0 + time * 3.0) * 0.5 + 0.5;
                    
                    // Pulsing opacity
                    float pulse = sin(time * 2.0) * 0.3 + 0.7;
                    
                    // Combine patterns
                    float pattern = mix(ripple, rotatingPattern, 0.5) * pulse;
                    
                    gl_FragColor = vec4(color, pattern * 0.7);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this.impactRing = new THREE.Mesh(ringGeometry, ringMaterial);
        
        // Position the ring below the beam's end
        this.impactRing.position.set(0, -scale * 1.0, -scale * 0.1);
        this.impactRing.rotation.x = -Math.PI/2; // Face downward
        
        // Hide initially
        this.impactRing.visible = false;
        
        // Add to ship
        this.ship.add(this.impactRing);
    }
    
    createTeleportParticles(scale) {
        // Create particle system for teleport beam
        const particleCount = 800; // More particles
        const particleGeometry = new THREE.BufferGeometry();
        
        // Create arrays for particle properties
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        // Initialize particle positions in a cone shape with more variation
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Determine if this should be an inner or outer particle
            const isInnerBeam = Math.random() > 0.3;
            
            // Random position within the cone or surrounding area
            const radius = isInnerBeam ? 
                Math.random() * scale * 0.03 : // Inner beam
                scale * 0.03 + Math.random() * scale * 0.17; // Outer beam area
            
            const theta = Math.random() * Math.PI * 2;
            const height = -(Math.random() * scale * 0.8); // Full beam height
            
            // Convert to Cartesian
            positions[i3] = radius * Math.cos(theta);     // x
            positions[i3 + 1] = height;                   // y (negative for downward direction)
            positions[i3 + 2] = radius * Math.sin(theta); // z
            
            // Gradient colors from cyan to blue with variation
            if (isInnerBeam) {
                // Brighter inner beam
                colors[i3] = 0.3 + Math.random() * 0.2;       // r
                colors[i3 + 1] = 0.9 + Math.random() * 0.1;   // g
                colors[i3 + 2] = 1.0;                         // b
            } else {
                // Cooler outer particles
                colors[i3] = 0.1 + Math.random() * 0.1;       // r 
                colors[i3 + 1] = 0.7 + Math.random() * 0.3;   // g
                colors[i3 + 2] = 0.9 + Math.random() * 0.1;   // b
            }
            
            // Varied particle sizes
            sizes[i] = isInnerBeam ? 
                scale * 0.002 + Math.random() * scale * 0.002 : // Small inner particles
                scale * 0.004 + Math.random() * scale * 0.006;  // Larger outer particles
        }
        
        // Add attributes to geometry
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Particle material with custom shader for better glow
        const particleMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pointTexture: { value: this.createParticleTexture() }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                uniform float time;
                
                void main() {
                    vColor = color;
                    
                    // Animate size with time
                    float pulseFactor = sin(time * 2.0 + position.z * 0.1) * 0.3 + 0.7;
                    
                    // Calculate position
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    
                    // Size attenuation
                    gl_PointSize = size * pulseFactor * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform sampler2D pointTexture;
                varying vec3 vColor;
                
                void main() {
                    // Sample soft particle texture
                    vec4 texColor = texture2D(pointTexture, gl_PointCoord);
                    
                    // Apply color
                    gl_FragColor = vec4(vColor, texColor.r);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            vertexColors: true
        });
        
        // Create particle system
        this.teleportParticles = new THREE.Points(particleGeometry, particleMaterial);
        this.teleportParticles.visible = false;
        
        // Position particle system
        this.teleportParticles.position.set(0, 0, -scale * 0.1);
        
        // Add to ship
        this.ship.add(this.teleportParticles);
    }
    
    createParticleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        
        const context = canvas.getContext('2d');
        const gradient = context.createRadialGradient(
            32, 32, 0, 32, 32, 32
        );
        
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.3, 'rgba(255,255,255,0.8)');
        gradient.addColorStop(0.5, 'rgba(255,255,255,0.4)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, 64, 64);
        
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
    }
    
    createEngineTrailParticles(scale, engineZ, width) {
        const particleCount = 200;
        const particleGeometry = new THREE.BufferGeometry();
        
        // Create arrays for particle properties
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        // Engine positions to emit particles from
        const enginePositions = [];
        const enginesPerRow = 5;
        
        for (let i = 0; i < enginesPerRow; i++) {
            const posX = (i - (enginesPerRow - 1) / 2) * (width / (enginesPerRow - 1) * 0.8);
            enginePositions.push(posX);
        }
        
        // Initialize particles
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Choose an engine position to emit from
            const engineIndex = Math.floor(Math.random() * enginePositions.length);
            const engineX = enginePositions[engineIndex];
            
            // Random offset from engine
            const offsetX = (Math.random() - 0.5) * scale * 0.01;
            const offsetY = (Math.random() - 0.5) * scale * 0.01;
            
            // Position behind the engine
            const trailLength = Math.random() * scale * 0.5;
            
            positions[i3] = engineX + offsetX;     // x
            positions[i3 + 1] = offsetY;           // y
            positions[i3 + 2] = engineZ + engineX * 0.05 + trailLength; // z with slight angle
            
            // Blue-white colors for engine glow
            colors[i3] = 0.5 + Math.random() * 0.5;     // r
            colors[i3 + 1] = 0.7 + Math.random() * 0.3; // g
            colors[i3 + 2] = 1.0;                       // b
            
            // Different sizes for depth
            sizes[i] = (Math.random() * 0.5 + 0.5) * scale * 0.004;
        }
        
        // Add attributes to geometry
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Particle material with custom shader
        const particleMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pointTexture: { value: this.createParticleTexture() }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                uniform float time;
                
                void main() {
                    vColor = color;
                    
                    // Animate size with time
                    float pulseFactor = sin(time * 2.0 + position.z * 0.1) * 0.3 + 0.7;
                    
                    // Calculate position
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    
                    // Size attenuation
                    gl_PointSize = size * pulseFactor * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform sampler2D pointTexture;
                varying vec3 vColor;
                
                void main() {
                    // Sample soft particle texture
                    vec4 texColor = texture2D(pointTexture, gl_PointCoord);
                    
                    // Apply color
                    gl_FragColor = vec4(vColor, texColor.r);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            vertexColors: true
        });
        
        // Create particle system
        this.engineTrailParticles = new THREE.Points(particleGeometry, particleMaterial);
        this.ship.add(this.engineTrailParticles);
    }
    
    // Set engines power level (0-1)
    setEnginesPower(power) {
        // Adjust engine glow intensity based on power level
        this.engineGlows.forEach((glow, index) => {
            // Alternate between main glow and outer glow
            const isMainGlow = index % 2 === 0;
            
            if (isMainGlow) {
                // Main engine glow - brighter
                glow.material.emissiveIntensity = 0.8 + power * 1.2;
                glow.material.opacity = 0.5 + power * 0.5;
            } else {
                // Outer engine glow - softer
                glow.material.emissiveIntensity = 0.5 + power * 0.8;
                glow.material.opacity = 0.2 + power * 0.3;
            }
            
            // Scale the glow with power
            const scale = 1 + power * 0.8;
            glow.scale.set(scale, scale, scale * 1.2); // Stretch slightly on z-axis
        });
        
        // Update engine trail particles
        if (this.engineTrailParticles) {
            this.engineTrailParticles.visible = power > 0.2;
            
            // Scale particle sizes based on power
            if (this.engineTrailParticles.geometry.attributes.size) {
                const sizes = this.engineTrailParticles.geometry.attributes.size.array;
                const baseSizes = this.engineTrailParticles.userData.baseSizes || 
                                  Array.from(sizes); // Store original sizes if not saved
                                  
                // Save original sizes
                if (!this.engineTrailParticles.userData.baseSizes) {
                    this.engineTrailParticles.userData.baseSizes = baseSizes;
                }
                
                // Scale sizes
                for (let i = 0; i < sizes.length; i++) {
                    sizes[i] = baseSizes[i] * (1 + power * 2);
                }
                
                this.engineTrailParticles.geometry.attributes.size.needsUpdate = true;
            }
        }
    }
    
    // Activate teleport beam
    activateTeleportBeam() {
        if (this.teleportBeam) {
            this.teleportBeam.visible = true;
            this.teleportParticles.visible = true;
            this.impactRing.visible = true;
            this.teleportBeamActive = true;
            
            // Reset animation time
            this.teleportBeam.material.uniforms.time.value = 0;
            this.impactRing.material.uniforms.time.value = 0;
            if (this.teleportParticles.material.uniforms) {
                this.teleportParticles.material.uniforms.time.value = 0;
            }
        }
    }
    
    // Deactivate teleport beam
    deactivateTeleportBeam() {
        if (this.teleportBeam) {
            this.teleportBeam.visible = false;
            this.teleportParticles.visible = false;
            this.impactRing.visible = false;
            this.teleportBeamActive = false;
        }
    }
    
    // Update teleport beam effect
    updateTeleportBeam(progress) {
        if (!this.teleportBeamActive) return;
        
        // Update shader time uniforms for animation
        const timeIncrement = 0.02;
        
        if (this.teleportBeam && this.teleportBeam.material.uniforms) {
            this.teleportBeam.material.uniforms.time.value += timeIncrement;
            
            // Pulse the beam based on progress
            const intensity = 0.3 + Math.sin(progress * Math.PI * 6) * 0.1;
            this.teleportBeam.material.uniforms.pulseAmplitude.value = intensity;
        }
        
        // Update impact ring
        if (this.impactRing && this.impactRing.material.uniforms) {
            this.impactRing.material.uniforms.time.value += timeIncrement;
            
            // Scale the impact ring with progress
            const ringScale = 1.0 + Math.sin(progress * Math.PI * 3) * 0.2;
            this.impactRing.scale.set(ringScale, ringScale, 1);
        }
        
        // Animate particles
        if (this.teleportParticles && this.teleportParticles.material.uniforms) {
            this.teleportParticles.material.uniforms.time.value += timeIncrement;
            
            // Moving particles
            const positions = this.teleportParticles.geometry.attributes.position.array;
            
            // Move particles downward and reset when they reach bottom
            for (let i = 0; i < positions.length; i += 3) {
                // Move particle down faster
                positions[i + 1] -= 5;
                
                // Add slight horizontal movement for realism
                positions[i] += (Math.random() - 0.5) * 2;
                positions[i + 2] += (Math.random() - 0.5) * 2;
                
                // Reset particle when it gets too far
                if (positions[i + 1] < -1000) {
                    // Get a reference position to place particle within beam
                    const isInnerBeam = Math.random() > 0.3;
                    const radius = isInnerBeam ? 
                        Math.random() * 40 : // Inner beam
                        40 + Math.random() * 180; // Outer area
                    const theta = Math.random() * Math.PI * 2;
                    
                    positions[i] = radius * Math.cos(theta);     // x
                    positions[i + 1] = -(Math.random() * 400);   // y (reset to top of beam)
                    positions[i + 2] = radius * Math.sin(theta); // z
                }
            }
            
            // Update buffer geometry
            this.teleportParticles.geometry.attributes.position.needsUpdate = true;
        }
        
        // Update engine trails if they exist
        if (this.engineTrailParticles && this.engineTrailParticles.material.uniforms) {
            this.engineTrailParticles.material.uniforms.time.value += timeIncrement;
        }
    }
} 