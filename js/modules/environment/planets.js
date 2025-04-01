// planets.js - Creates and manages the planets in the solar system

import * as THREE from 'three';

// Import TextureLoader if not already imported at the top
const textureLoader = new THREE.TextureLoader();

// Load all planet textures
const planetTextures = {
    mercury: textureLoader.load('./assets/2k_mercury.jpg'),
    venus: {
        surface: textureLoader.load('./assets/2k_venus_surface.jpg'),
        atmosphere: textureLoader.load('./assets/2k_venus_atmosphere.jpg')
    },
    earth: textureLoader.load('./assets/2k_earth_daymap.jpg'),
    mars: textureLoader.load('./assets/2k_mars.jpg'),
    jupiter: textureLoader.load('./assets/2k_jupiter.jpg'),
    saturn: {
        surface: textureLoader.load('./assets/2k_saturn.jpg'),
        rings: textureLoader.load('./assets/2k_saturn_ring_alpha.png')
    },
    uranus: textureLoader.load('./assets/2k_uranus.jpg'),
    neptune: textureLoader.load('./assets/2k_neptune.jpg')
};

// Set the correct color space for all planet textures
planetTextures.mercury.colorSpace = THREE.SRGBColorSpace;
planetTextures.venus.surface.colorSpace = THREE.SRGBColorSpace;
planetTextures.venus.atmosphere.colorSpace = THREE.SRGBColorSpace;
planetTextures.earth.colorSpace = THREE.SRGBColorSpace;
planetTextures.mars.colorSpace = THREE.SRGBColorSpace;
planetTextures.jupiter.colorSpace = THREE.SRGBColorSpace;
planetTextures.saturn.surface.colorSpace = THREE.SRGBColorSpace;
planetTextures.saturn.rings.colorSpace = THREE.SRGBColorSpace;
planetTextures.uranus.colorSpace = THREE.SRGBColorSpace;
planetTextures.neptune.colorSpace = THREE.SRGBColorSpace;

// Load the custom procedural textures (p1-p22)
const proceduralTextures = [];
for (let i = 1; i <= 22; i++) {
    const texture = textureLoader.load(`./assets/p${i}.jpeg`);
    texture.colorSpace = THREE.SRGBColorSpace;
    proceduralTextures.push(texture);
}

export class Planets {
    constructor(scene, starSystemGenerator) {
        this.scene = scene;
        this.starSystemGenerator = starSystemGenerator;
        this.planets = [];
        this.planetRegions = {};
        this.currentSystemId = 'Solar System'; // Default to our Solar System
        this.systemPlanets = {};
        
        // Initialize our solar system planets
        this.createHomeSolarSystem();
    }
    
    // Create our home solar system (the only non-procedural system)
    createHomeSolarSystem() {
        // Planet data for our Solar System: name, size, distance from sun, orbit speed, color, rings
        const solarSystemPlanets = [
            { name: "Mercury", size: 220, distance: 4800, speed: 0.0016, color: 0xaaaaaa, rings: false },
            { name: "Venus", size: 400, distance: 8000, speed: 0.0013, color: 0xe6cc9c, rings: false },
            { name: "Earth", size: 420, distance: 12000, speed: 0.0010, color: 0x4169e1, rings: false },
            { name: "Mars", size: 320, distance: 16800, speed: 0.0008, color: 0xc65d45, rings: false },
            // Wider asteroid belt
            { name: "Jupiter", size: 1000, distance: 30000, speed: 0.0004, color: 0xd6b27e, rings: true },
            { name: "Saturn", size: 880, distance: 40000, speed: 0.0003, color: 0xf0e5c9, rings: true },
            { name: "Uranus", size: 720, distance: 56000, speed: 0.0002, color: 0xcaecf1, rings: true },
            { name: "Neptune", size: 700, distance: 72000, speed: 0.00016, color: 0x5fa3db, rings: false },
        ];
        
        // Store our solar system planets for future reference
        this.systemPlanets['Solar System'] = solarSystemPlanets;
        
        // Create the actual planet objects
        this.createPlanetsForSystem('Solar System');
    }
    
    // Create planet objects for the current system
    createPlanetsForSystem(systemId) {
        // Clear existing planets
        this.clearPlanets();
        
        // Update current system
        this.currentSystemId = systemId;
        
        // If we already have planet data for this system, use it
        if (this.systemPlanets[systemId]) {
            this.createPlanetsFromData(this.systemPlanets[systemId]);
            return;
        }
        
        // Otherwise, we need to generate planets for this system
        const generatedPlanets = this.generatePlanetsForSystem(systemId);
        this.systemPlanets[systemId] = generatedPlanets;
        this.createPlanetsFromData(generatedPlanets);
    }
    
    // Generate procedural planets for a new star system
    generatePlanetsForSystem(systemId) {
        console.log(`Generating new planets for system: ${systemId}`);
        
        // Check if this is a custom system with predefined planets
        if (this.starSystemGenerator && this.starSystemGenerator.customPlanetData && this.starSystemGenerator.customPlanetData[systemId]) {
            const customPlanets = this.starSystemGenerator.customPlanetData[systemId];
            console.log(`Using ${customPlanets.length} custom planets for system: ${systemId}`);
            
            // Log the texture URLs for debugging
            customPlanets.forEach(planet => {
                if (planet.textureUrl) {
                    console.log(`Custom planet ${planet.name} has texture URL: ${planet.textureUrl}`);
                } else {
                    console.log(`Custom planet ${planet.name} does not have a texture URL`);
                }
            });
            
            // Return the custom planet data directly
            return this.starSystemGenerator.customPlanetData[systemId];
        }
        
        // Planet name word banks for procedural generation
        const prefixes = [
            'New', 'Alpha', 'Beta', 'Gamma', 'Delta', 'Nova', 'Proxima', 'Ultima',
            'Astro', 'Cosmo', 'Stella', 'Terra', 'Astra', 'Prime', 'Orb'
        ];
        
        const suffixes = [
            'sphere', 'world', 'orb', 'terra', 'oid', 'globus', 'ium', 'ian',
            'aria', 'anth', 'urus', 'alos', 'onos', 'era', 'ax', 'is', 'os'
        ];
        
        // Get a random star system data (assuming there's a starSystemGenerator with this info)
        // This is a fallback if we don't have access to real system data
        const starClass = systemId.includes('System-') ? systemId.split('-')[1][0] : 'M';
        
        // Generate between 1-8 planets for this system
        const planetCount = 2 + Math.floor(Math.random() * 7); // 2-8 planets
        const planetData = [];
        
        // Determine system characteristics based on star class
        let sizeMultiplier = 1.0;
        let distanceMultiplier = 1.0;
        let colorPalette = [];
        
        // Adjust planet parameters based on star class
        switch (starClass) {
            case 'O': // Blue giants - larger planets, further apart
                sizeMultiplier = 1.8;
                distanceMultiplier = 1.6;
                colorPalette = [0x6666ff, 0x9999ff, 0xccccff, 0xaaaaff, 0x8888dd];
                break;
            case 'B': // Blue-white stars - larger planets, varying colors
                sizeMultiplier = 1.5;
                distanceMultiplier = 1.3;
                colorPalette = [0x99aaff, 0xaabbff, 0xccccff, 0xddddff, 0xbbaacc];
                break;
            case 'A': // White stars - medium planets
                sizeMultiplier = 1.3;
                distanceMultiplier = 1.1;
                colorPalette = [0xccccff, 0xddddff, 0xeeeeff, 0xffffff, 0xddccdd];
                break;
            case 'F': // Yellow-white stars - Earth-like
                sizeMultiplier = 1.1;
                distanceMultiplier = 1.0;
                colorPalette = [0x99aaff, 0xaaccaa, 0xccddcc, 0xffccaa, 0xeeeecc];
                break;
            case 'G': // Yellow stars (like our sun) - Earth-like
                sizeMultiplier = 1.0;
                distanceMultiplier = 1.0;
                colorPalette = [0xaaaaaa, 0x4169e1, 0xc65d45, 0xd6b27e, 0xf0e5c9];
                break;
            case 'K': // Orange stars - smaller planets
                sizeMultiplier = 0.8;
                distanceMultiplier = 0.9;
                colorPalette = [0xe6cc9c, 0xccaa88, 0xddbb99, 0xbb9977, 0xcc8866];
                break;
            case 'M': // Red dwarfs - small planets, close together
                sizeMultiplier = 0.6;
                distanceMultiplier = 0.7;
                colorPalette = [0xcc6644, 0xdd7755, 0xee8866, 0xff9977, 0xbb5533];
                break;
            default:
                colorPalette = [0xaaaaaa, 0x4169e1, 0xc65d45, 0xd6b27e, 0xf0e5c9];
        }
        
        // Generate each planet
        for (let i = 0; i < planetCount; i++) {
            // Generate a random name
            const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
            const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
            const name = `${prefix}${suffix}`;
            
            // Determine planet size (smaller planets more common)
            const sizeClass = Math.random();
            let size;
            if (sizeClass < 0.5) {
                // Small planet (50% chance)
                size = (240 + Math.random() * 200) * sizeMultiplier; // 4x bigger: (60 + random*50) * 4
            } else if (sizeClass < 0.8) {
                // Medium planet (30% chance)
                size = (440 + Math.random() * 280) * sizeMultiplier; // 4x bigger: (110 + random*70) * 4
            } else {
                // Large planet (20% chance)
                size = (720 + Math.random() * 360) * sizeMultiplier; // 4x bigger: (180 + random*90) * 4
            }
            
            // Distance increases with each planet, with some randomness
            const baseDistance = 4800 + (i * 8000); // 4x bigger: (1200 + i*2000) * 4
            const distanceVariation = baseDistance * 0.2; // 20% variation
            const distance = (baseDistance + (Math.random() * distanceVariation - distanceVariation/2)) * distanceMultiplier;
            
            // Orbit speed (inversely proportional to distance)
            const speed = 0.002 / (distance / 1000);
            
            // Random color from palette
            const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
            
            // Chance of rings based on size (larger planets more likely to have rings)
            const rings = size > 600 ? Math.random() < 0.4 : false; // 4x bigger threshold: 150 * 4 = 600
            
            // Add axial and orbital tilt
            const axialTilt = Math.random() * Math.PI * 0.5; // Up to 90 degrees axial tilt
            const orbitalTilt = Math.random() * Math.PI * 0.2; // Up to ~35 degrees orbital tilt
            
            planetData.push({
                name,
                size: Math.floor(size),
                distance: Math.floor(distance),
                speed,
                color,
                rings,
                axialTilt,
                orbitalTilt
            });
        }
        
        return planetData;
    }
    
    // Create planet objects from data array
    createPlanetsFromData(planetData) {
        // Clear existing planets first
        this.clearPlanets();
        
        planetData.forEach(planet => {
            // Create planet
            const planetGeometry = new THREE.SphereGeometry(planet.size, 32, 32);
            let planetMaterial;
            
            // Check if this is a custom planet with its own texture
            if (planet.textureUrl) {
                console.log(`Creating planet ${planet.name} with custom texture: ${planet.textureUrl}`);
                
                // Fix texture path for API server images
                let adjustedTextureUrl = planet.textureUrl;
                
                // Check if this is an image from our API server
                if (planet.textureUrl.startsWith('/images/')) {
                    // If running on port 8000, adjust URL to point to port 8001
                    if (window.location.port === '8000') {
                        const serverHost = window.location.hostname;
                        adjustedTextureUrl = `http://${serverHost}:8001${planet.textureUrl}`;
                        console.log(`Adjusted planet texture path to API server: ${adjustedTextureUrl}`);
                    }
                }
                
                // Load the custom texture
                const customTexture = textureLoader.load(adjustedTextureUrl);
                customTexture.colorSpace = THREE.SRGBColorSpace;
                
                // Create material with custom texture
                planetMaterial = new THREE.MeshStandardMaterial({
                    map: customTexture,
                    roughness: 0.7,
                    metalness: 0.2,
                    flatShading: false,
                    emissive: new THREE.Color(planet.color || 0xffffff),
                    emissiveIntensity: 0.2,
                    emissiveMap: customTexture
                });
            } else {
                // Use standard planet textures based on planet name
                switch(planet.name) {
                    case "Mercury":
                        planetMaterial = new THREE.MeshStandardMaterial({
                            map: planetTextures.mercury,
                            roughness: 0.7,
                            metalness: 0.2,
                            flatShading: false,
                            emissive: new THREE.Color(0x555555),
                            emissiveIntensity: 0.2,
                            emissiveMap: planetTextures.mercury
                        });
                        break;
                        
                    case "Venus":
                        // Create Venus with surface and atmosphere
                        planetMaterial = new THREE.MeshStandardMaterial({
                            map: planetTextures.venus.surface,
                            roughness: 0.6,
                            metalness: 0.1,
                            flatShading: false,
                            emissive: new THREE.Color(0xe6cc9c),
                            emissiveIntensity: 0.25,
                            emissiveMap: planetTextures.venus.surface
                        });
                        break;
                        
                    case "Earth":
                        planetMaterial = new THREE.MeshStandardMaterial({
                            map: planetTextures.earth,
                            roughness: 0.5,
                            metalness: 0.1,
                            flatShading: false,
                            emissive: new THREE.Color(0x4169e1),
                            emissiveIntensity: 0.2,
                            emissiveMap: planetTextures.earth
                        });
                        break;
                        
                    case "Mars":
                        planetMaterial = new THREE.MeshStandardMaterial({
                            map: planetTextures.mars,
                            roughness: 0.7,
                            metalness: 0.1,
                            flatShading: false,
                            emissive: new THREE.Color(0xc65d45),
                            emissiveIntensity: 0.25,
                            emissiveMap: planetTextures.mars
                        });
                        break;
                        
                    case "Jupiter":
                        planetMaterial = new THREE.MeshStandardMaterial({
                            map: planetTextures.jupiter,
                            roughness: 0.5,
                            metalness: 0.0,
                            flatShading: false,
                            emissive: new THREE.Color(0xd6b27e),
                            emissiveIntensity: 0.2,
                            emissiveMap: planetTextures.jupiter
                        });
                        break;
                        
                    case "Saturn":
                        planetMaterial = new THREE.MeshStandardMaterial({
                            map: planetTextures.saturn.surface,
                            roughness: 0.6,
                            metalness: 0.1,
                            flatShading: false,
                            emissive: new THREE.Color(0xf0e5c9),
                            emissiveIntensity: 0.2,
                            emissiveMap: planetTextures.saturn.surface
                        });
                        break;
                        
                    case "Uranus":
                        planetMaterial = new THREE.MeshStandardMaterial({
                            map: planetTextures.uranus,
                            roughness: 0.5,
                            metalness: 0.0,
                            flatShading: false,
                            emissive: new THREE.Color(0x88bbcc),
                            emissiveIntensity: 0.25,
                            emissiveMap: planetTextures.uranus
                        });
                        break;
                        
                    case "Neptune":
                        planetMaterial = new THREE.MeshStandardMaterial({
                            map: planetTextures.neptune,
                            roughness: 0.5,
                            metalness: 0.0,
                            flatShading: false,
                            emissive: new THREE.Color(0x5fa3db),
                            emissiveIntensity: 0.25,
                            emissiveMap: planetTextures.neptune
                        });
                        break;
                        
                    default:
                        // For other planets, use a procedural texture from the collection
                        const textureIndex = Math.floor(Math.random() * proceduralTextures.length);
                        planetMaterial = new THREE.MeshStandardMaterial({
                            map: proceduralTextures[textureIndex],
                            roughness: 0.6,
                            metalness: 0.2,
                            color: new THREE.Color(planet.color),
                            flatShading: false,
                            emissive: new THREE.Color(planet.color),
                            emissiveIntensity: 0.3,
                            emissiveMap: proceduralTextures[textureIndex]
                        });
                        break;
                }
            }
            
            // Create the planet mesh
            const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
            
            // Position the planet at its orbital distance
            const angle = Math.random() * Math.PI * 2;
            
            // Apply orbital tilt if specified
            let orbitalTilt = planet.orbitalTilt || 0;
            let axialTilt = planet.axialTilt || 0;
            
            // Position planet with orbital tilt
            planetMesh.position.x = Math.cos(angle) * planet.distance;
            planetMesh.position.y = Math.sin(orbitalTilt) * planet.distance;
            planetMesh.position.z = Math.sin(angle) * Math.cos(orbitalTilt) * planet.distance;
            
            // Apply axial tilt to planet rotation
            planetMesh.rotation.x = axialTilt;
            
            // Enable shadows for eclipse effects
            planetMesh.castShadow = true;
            planetMesh.receiveShadow = true;
            
            // Add the planet to the scene
            this.scene.add(planetMesh);
            
            // Create planet rings if specified
            if (planet.rings) {
                let ringGeometry, ringMaterial, ringMesh;
                
                // Special case for Saturn
                if (planet.name === "Saturn") {
                    // Create ring geometry
                    ringGeometry = new THREE.RingGeometry(planet.size * 1.4, planet.size * 2.0, 32);
                    
                    // Create custom material for Saturn with transparency
                    ringMaterial = new THREE.MeshStandardMaterial({
                        map: planetTextures.saturn.rings,
                        side: THREE.DoubleSide,
                        transparent: true,
                        opacity: 0.8,
                        roughness: 0.8,
                        metalness: 0.1,
                        emissive: new THREE.Color(0xf0e5c9),
                        emissiveIntensity: 0.2,
                        emissiveMap: planetTextures.saturn.rings
                    });
                } else {
                    // Generic rings for other planets
                    ringGeometry = new THREE.RingGeometry(planet.size * 1.3, planet.size * 1.8, 32);
                    ringMaterial = new THREE.MeshStandardMaterial({
                        color: planet.color,
                        side: THREE.DoubleSide,
                        transparent: true,
                        opacity: 0.4,
                        roughness: 0.7,
                        metalness: 0.2,
                        emissive: new THREE.Color(planet.color),
                        emissiveIntensity: 0.3
                    });
                }
                
                ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
                
                // Rotate rings to be flat (perpendicular to y-axis)
                ringMesh.rotation.x = Math.PI / 2;
                
                // Enable shadows for rings
                ringMesh.castShadow = true;
                ringMesh.receiveShadow = true;
                
                // Add rings to planet
                planetMesh.add(ringMesh);
            }
            
            // Store planet data for orbiting
            this.planets.push({
                mesh: planetMesh,
                distance: planet.distance,
                speed: planet.speed,
                angle: angle,
                orbitalTilt: orbitalTilt
            });
            
            // Store planet regions for game mechanics
            this.planetRegions[planet.name] = {
                name: planet.name,
                position: planetMesh.position.clone(),
                radius: planet.size * 2
            };
        });
    }
    
    // Clear all existing planets
    clearPlanets() {
        // Remove planets from scene and clear arrays
        this.planets.forEach(planet => {
            this.scene.remove(planet.mesh);
        });
        
        this.planets = [];
        this.planetRegions = {};
    }
    
    // Set up planet system for specified star system
    updateForSystem(systemId) {
        console.log(`Updating planets for system: ${systemId}`);
        
        // Generate and create planets for this system if we haven't already
        this.createPlanetsForSystem(systemId);
        
        // Return true to indicate success
        return true;
    }
    
    getPlanetRegions() {
        return this.planetRegions;
    }
    
    getPlanets() {
        return this.planets;
    }
    
    update(deltaTime) {
        // Update planet orbits
        this.planets.forEach(planet => {
            // Update orbit angle based on speed
            planet.angle += planet.speed * deltaTime;
            
            // Calculate new position
            planet.mesh.position.x = Math.cos(planet.angle) * planet.distance;
            planet.mesh.position.z = Math.sin(planet.angle) * Math.cos(planet.orbitalTilt) * planet.distance;
            planet.mesh.position.y = Math.sin(planet.angle) * Math.sin(planet.orbitalTilt) * planet.distance;
            
            // Rotate the planet
            planet.mesh.rotation.y += deltaTime * 0.1;
            
            // FIXED: Update planet region for location tracking
            // Use the planet mesh's position directly to find the matching planet region
            // since the planet object doesn't contain the name property
            if (planet.mesh) {
                // Iterate through planet regions and find the one with a position matching this planet
                Object.values(this.planetRegions).forEach(region => {
                    if (region && region.position) {
                        // Check if this region position is close to the planet position
                        // If it's very close, it's likely the same planet
                        const distance = region.position.distanceTo(planet.mesh.position);
                        if (distance < 5000) { // A reasonable threshold
                            region.position.copy(planet.mesh.position);
                        }
                    }
                });
            }
        });
    }
}