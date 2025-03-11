// planets.js - Creates and manages the planets in the solar system

// Import TextureLoader if not already imported at the top
const textureLoader = new THREE.TextureLoader();

// Load all planet textures
const planetTextures = {
    mercury: textureLoader.load('/assets/2k_mercury.jpg'),
    venus: {
        surface: textureLoader.load('/assets/2k_venus_surface.jpg'),
        atmosphere: textureLoader.load('/assets/2k_venus_atmosphere.jpg')
    },
    earth: textureLoader.load('/assets/2k_earth_daymap.jpg'),
    mars: textureLoader.load('/assets/2k_mars.jpg'),
    jupiter: textureLoader.load('/assets/2k_jupiter.jpg'),
    saturn: {
        surface: textureLoader.load('/assets/2k_saturn.jpg'),
        rings: textureLoader.load('/assets/2k_saturn_ring_alpha.png')
    },
    uranus: textureLoader.load('/assets/2k_uranus.jpg'),
    neptune: textureLoader.load('/assets/2k_neptune.jpg')
};

export class Planets {
    constructor(scene) {
        this.scene = scene;
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
            { name: "Mercury", size: 55, distance: 1200, speed: 0.0016, color: 0xaaaaaa, rings: false },
            { name: "Venus", size: 100, distance: 2000, speed: 0.0013, color: 0xe6cc9c, rings: false },
            { name: "Earth", size: 105, distance: 3000, speed: 0.0010, color: 0x4169e1, rings: false },
            { name: "Mars", size: 80, distance: 4200, speed: 0.0008, color: 0xc65d45, rings: false },
            // Wider asteroid belt
            { name: "Jupiter", size: 250, distance: 7500, speed: 0.0004, color: 0xd6b27e, rings: true },
            { name: "Saturn", size: 220, distance: 10000, speed: 0.0003, color: 0xf0e5c9, rings: true },
            { name: "Uranus", size: 180, distance: 14000, speed: 0.0002, color: 0xcaecf1, rings: true },
            { name: "Neptune", size: 175, distance: 18000, speed: 0.00016, color: 0x5fa3db, rings: false },
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
                size = (60 + Math.random() * 50) * sizeMultiplier;
            } else if (sizeClass < 0.8) {
                // Medium planet (30% chance)
                size = (110 + Math.random() * 70) * sizeMultiplier;
            } else {
                // Large planet (20% chance)
                size = (180 + Math.random() * 90) * sizeMultiplier;
            }
            
            // Distance increases with each planet, with some randomness
            const baseDistance = 1200 + (i * 2000);
            const distanceVariation = baseDistance * 0.2; // 20% variation
            const distance = (baseDistance + (Math.random() * distanceVariation - distanceVariation/2)) * distanceMultiplier;
            
            // Orbit speed (inversely proportional to distance)
            const speed = 0.002 / (distance / 1000);
            
            // Random color from palette
            const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
            
            // Chance of rings based on size (larger planets more likely to have rings)
            const rings = size > 150 ? Math.random() < 0.4 : false;
            
            planetData.push({
                name,
                size: Math.floor(size),
                distance: Math.floor(distance),
                speed,
                color,
                rings
            });
        }
        
        return planetData;
    }
    
    // Create planet objects from data array
    createPlanetsFromData(planetData) {
        planetData.forEach(planet => {
            // Create planet
            const planetGeometry = new THREE.SphereGeometry(planet.size, 32, 32);
            let planetMaterial;
            
            // Create materials based on planet type
            switch(planet.name) {
                case "Mercury":
                    planetMaterial = new THREE.MeshPhongMaterial({
                        map: planetTextures.mercury,
                        shininess: 5,
                        flatShading: false
                    });
                    break;
                    
                case "Venus":
                    // Create Venus with surface and atmosphere
                    planetMaterial = new THREE.MeshPhongMaterial({
                        map: planetTextures.venus.surface,
                        shininess: 10,
                        flatShading: false
                    });
                    break;
                    
                case "Earth":
                    planetMaterial = new THREE.MeshPhongMaterial({
                        map: planetTextures.earth,
                        shininess: 10,
                        flatShading: false
                    });
                    break;
                    
                case "Mars":
                    planetMaterial = new THREE.MeshPhongMaterial({
                        map: planetTextures.mars,
                        shininess: 5,
                        flatShading: false
                    });
                    break;
                    
                case "Jupiter":
                    planetMaterial = new THREE.MeshPhongMaterial({
                        map: planetTextures.jupiter,
                        shininess: 10,
                        flatShading: false
                    });
                    break;
                    
                case "Saturn":
                    planetMaterial = new THREE.MeshPhongMaterial({
                        map: planetTextures.saturn.surface,
                        shininess: 10,
                        flatShading: false
                    });
                    break;
                    
                case "Uranus":
                    planetMaterial = new THREE.MeshPhongMaterial({
                        map: planetTextures.uranus,
                        shininess: 10,
                        flatShading: false
                    });
                    break;
                    
                case "Neptune":
                    planetMaterial = new THREE.MeshPhongMaterial({
                        map: planetTextures.neptune,
                        shininess: 10,
                        flatShading: false
                    });
                    break;
                    
                default:
                    planetMaterial = new THREE.MeshPhongMaterial({
                        color: planet.color,
                        shininess: 10,
                        flatShading: false
                    });
            }
            
            const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
            
            // Set initial position
            const angle = Math.random() * Math.PI * 2;
            planetMesh.position.x = Math.cos(angle) * planet.distance;
            planetMesh.position.z = Math.sin(angle) * planet.distance;
            
            // Add special features
            if (planet.name === "Venus") {
                // Add Venus atmosphere
                const atmosphereGeometry = new THREE.SphereGeometry(planet.size + 1, 32, 32);
                const atmosphereMaterial = new THREE.MeshPhongMaterial({
                    map: planetTextures.venus.atmosphere,
                    transparent: true,
                    opacity: 0.4,
                    side: THREE.DoubleSide
                });
                const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
                planetMesh.add(atmosphereMesh);
            }
            
            // Add rings if needed
            if (planet.rings) {
                const ringGeometry = new THREE.RingGeometry(
                    planet.size + 2,
                    planet.size + (planet.name === "Saturn" ? 20 : 7),
                    64
                );
                const ringMaterial = planet.name === "Saturn" 
                    ? new THREE.MeshBasicMaterial({
                        map: planetTextures.saturn.rings,
                        transparent: true,
                        side: THREE.DoubleSide
                    })
                    : new THREE.MeshBasicMaterial({
                        color: 0xffffff,
                        side: THREE.DoubleSide,
                        opacity: 0.5,
                        transparent: true
                    });
                const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
                ringMesh.rotation.x = Math.PI / 2;
                planetMesh.add(ringMesh);
            }
            
            // Add planet to scene
            this.scene.add(planetMesh);
            
            // Store planet data
            this.planets.push({
                mesh: planetMesh,
                distance: planet.distance,
                speed: planet.speed,
                angle: angle,
                name: planet.name
            });
            
            // Set the planet region for location tracking
            this.planetRegions[planet.name] = {
                center: new THREE.Vector3(planetMesh.position.x, planetMesh.position.y, planetMesh.position.z),
                radius: planet.size * 20 // Increased region radius to better fit scale
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
    
    update() {
        // Update planet positions (orbit around sun)
        this.planets.forEach(planet => {
            planet.angle += planet.speed;
            
            planet.mesh.position.x = Math.cos(planet.angle) * planet.distance;
            planet.mesh.position.z = Math.sin(planet.angle) * planet.distance;
            
            // Slowly rotate the planet
            planet.mesh.rotation.y += 0.001;
            
            // Update planet region for location tracking
            this.planetRegions[planet.name].center.copy(planet.mesh.position);
        });
    }
}