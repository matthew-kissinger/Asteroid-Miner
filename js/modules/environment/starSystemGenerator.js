// starSystemGenerator.js - Procedural generation of star systems

export class StarSystemGenerator {
    constructor(scene) {
        this.scene = scene;
        this.systems = {}; // Stores all generated star systems
        this.currentSystem = null; // Currently active system
        this.warpGates = {}; // Map of connections between systems
        this.starClasses = ['O', 'B', 'A', 'F', 'G', 'K', 'M']; // Star classification
        this.systemClassifications = [
            'Resource-Rich', 
            'Ancient', 
            'Unstable', 
            'Barren', 
            'Hazardous', 
            'Peaceful'
        ];
        
        // Available skybox textures for non-Solar systems
        this.skyboxTextures = [
            './assets/s1.jpg',
            './assets/s2.jpg',
            './assets/s3.jpg',
            './assets/s4.jpg',
            './assets/s5.jpg',
            './assets/s6.jpg',
            './assets/s7.jpg',
            './assets/s8.jpg',
            './assets/s9.jpg'
        ];
        
        // Resource distribution by star type
        this.resourceDistribution = {
            'O': { iron: 0.3, gold: 0.4, platinum: 0.3 }, // Hot blue stars - balanced
            'B': { iron: 0.2, gold: 0.3, platinum: 0.5 }, // Blue-white - platinum rich
            'A': { iron: 0.2, gold: 0.5, platinum: 0.3 }, // White - gold rich
            'F': { iron: 0.3, gold: 0.4, platinum: 0.3 }, // Yellow-white - balanced
            'G': { iron: 0.4, gold: 0.3, platinum: 0.3 }, // Yellow (like our sun) - iron rich
            'K': { iron: 0.5, gold: 0.3, platinum: 0.2 }, // Orange - iron rich
            'M': { iron: 0.6, gold: 0.2, platinum: 0.2 }  // Red dwarfs - iron rich
        };
        
        // Resource multipliers by system classification
        this.classificationMultipliers = {
            'Resource-Rich': { iron: 2.0, gold: 2.0, platinum: 2.0 },
            'Ancient': { iron: 1.0, gold: 1.5, platinum: 2.5 },
            'Unstable': { iron: 1.0, gold: 1.0, platinum: 3.0 },
            'Barren': { iron: 0.5, gold: 0.5, platinum: 0.5 },
            'Hazardous': { iron: 1.5, gold: 1.5, platinum: 1.5 },
            'Peaceful': { iron: 1.0, gold: 1.0, platinum: 1.0 },
            'Home System': { iron: 1.0, gold: 1.0, platinum: 1.0 }
        };
        
        // Initialize the system
        this.initializeSystems();
    }
    
    // Initialize star systems with Solar System as default
    initializeSystems() {
        console.log("Initializing star systems...");
        
        // First create our Solar System as the starting point
        this.createSolarSystem();
        
        // Generate a few more star systems
        this.generateRandomSystems(5);
        
        // Create connections between systems via warp gates
        this.createSystemConnections();
        
        // Set Solar System as current system
        this.setCurrentSystem('Solar System');
        
        console.log("Star systems initialized");
    }
    
    // Create our Solar System
    createSolarSystem() {
        // Add solar system with predefined properties and Earth as special planet
        const solarSystem = {
            id: 'Solar System',
            name: 'Solar System',
            starClass: 'G',
            classification: 'Home System',
            starColor: 0xFFFF00, // Yellow sun
            planetCount: 8,
            asteroidDensity: 1.0,
            specialFeatures: ['Earth'],
            description: 'Our home system, with Earth as the starting location.',
            connections: [], // Will be populated later
            position: new THREE.Vector3(0, 0, 0), // Center point for the star map
            skyboxParams: {
                starDensity: 1.0,
                nebulaDensity: 0.5,
                color: 0xFFFFFF,
                texturePath: './assets/2k_stars_milky_way.jpg', // Default Milky Way texture
                brightness: 1.0 // Full brightness for Solar System
            },
            resourceMultipliers: {
                iron: 1.0, 
                gold: 1.0, 
                platinum: 1.0
            }
        };
        
        this.systems['Solar System'] = solarSystem;
    }
    
    // Generate random star systems
    generateRandomSystems(count) {
        for (let i = 0; i < count; i++) {
            const id = `System-${i+1}`;
            const starClass = this.getRandomStarClass();
            const classification = this.getRandomClassification();
            
            // Determine color based on star class
            const starColor = this.getStarColorFromClass(starClass);
            
            // Calculate resource distribution based on star class and classification
            const resourceMult = this.calculateResourceMultipliers(starClass, classification);
            
            // Select a random skybox texture
            const skyboxTexture = this.getRandomSkyboxTexture();
            
            // Create the system
            const system = {
                id: id,
                name: this.generateSystemName(starClass),
                starClass: starClass,
                classification: classification,
                starColor: starColor,
                planetCount: this.getRandomInt(2, 10),
                asteroidDensity: this.getRandomFloat(0.5, 2.5),
                specialFeatures: this.generateSpecialFeatures(classification),
                description: this.generateDescription(starClass, classification),
                connections: [], // Will be populated later
                position: this.generateMapPosition(), // Position in the star map
                skyboxParams: {
                    starDensity: this.getRandomFloat(0.7, 1.5),
                    nebulaDensity: this.getRandomFloat(0.3, 1.2),
                    color: this.getSkyboxColorFromClass(starClass),
                    texturePath: skyboxTexture,
                    brightness: 0.8 // Changed from 0.5 to 0.8
                },
                resourceMultipliers: resourceMult
            };
            
            this.systems[id] = system;
        }
    }
    
    // Get a random skybox texture for non-Solar systems
    getRandomSkyboxTexture() {
        return this.skyboxTextures[this.getRandomInt(0, this.skyboxTextures.length - 1)];
    }
    
    // Create connections between systems
    createSystemConnections() {
        // Map all systems to ensure each has at least one connection
        const systemIds = Object.keys(this.systems);
        
        // Connect Solar System to at least two random systems
        const solarSystem = this.systems['Solar System'];
        const solarConnections = this.getRandomSystemsExcept('Solar System', 2);
        
        for (const targetId of solarConnections) {
            this.createConnection('Solar System', targetId);
        }
        
        // Ensure each system has at least one connection
        for (const systemId of systemIds) {
            const system = this.systems[systemId];
            
            // If no connections yet, create one
            if (system.connections.length === 0) {
                // Find a random system to connect to (that is not itself)
                const targetId = this.getRandomSystemExcept(systemId);
                this.createConnection(systemId, targetId);
            }
        }
        
        // Add some additional random connections for more interesting network
        const extraConnectionCount = Math.floor(systemIds.length / 2);
        for (let i = 0; i < extraConnectionCount; i++) {
            const sourceId = systemIds[this.getRandomInt(0, systemIds.length - 1)];
            const targetId = this.getRandomSystemExcept(sourceId);
            
            // Ensure we're not creating a duplicate connection
            if (!this.systems[sourceId].connections.includes(targetId)) {
                this.createConnection(sourceId, targetId);
            }
        }
    }
    
    // Create a connection between two systems
    createConnection(sourceId, targetId) {
        // Add to connections list of both systems
        this.systems[sourceId].connections.push(targetId);
        this.systems[targetId].connections.push(sourceId);
        
        // Register in warp gates map
        if (!this.warpGates[sourceId]) {
            this.warpGates[sourceId] = [];
        }
        if (!this.warpGates[targetId]) {
            this.warpGates[targetId] = [];
        }
        
        this.warpGates[sourceId].push(targetId);
        this.warpGates[targetId].push(sourceId);
        
        console.log(`Created connection between ${sourceId} and ${targetId}`);
    }
    
    // Get list of connections for current system
    getCurrentSystemConnections() {
        if (!this.currentSystem) return [];
        return this.systems[this.currentSystem].connections;
    }
    
    // Get resource distribution for current system
    getCurrentSystemResources() {
        if (!this.currentSystem) return { iron: 1, gold: 1, platinum: 1 };
        
        const system = this.systems[this.currentSystem];
        return system.resourceMultipliers;
    }
    
    // Set the current active system
    setCurrentSystem(systemId) {
        if (this.systems[systemId]) {
            this.currentSystem = systemId;
            console.log(`Traveled to system: ${systemId}`);
            return true;
        }
        return false;
    }
    
    // Travel to a connected system
    travelToSystem(targetSystemId) {
        // Verify the target system exists
        if (!this.systems[targetSystemId]) {
            console.error(`System ${targetSystemId} does not exist`);
            return false;
        }
        
        // Verify there is a connection from current to target
        const connections = this.getCurrentSystemConnections();
        if (!connections.includes(targetSystemId)) {
            console.error(`No connection from ${this.currentSystem} to ${targetSystemId}`);
            return false;
        }
        
        // Check if the ship is docked
        if (window.game && window.game.spaceship && window.game.spaceship.isDocked) {
            console.log("Player is docked during interstellar travel");
        }
        
        // Log current system params
        if (this.systems[this.currentSystem]) {
            const currentParams = this.systems[this.currentSystem].skyboxParams;
            console.log(`${this.currentSystem} skybox params before travel: 
                         color=${currentParams.color.toString(16)}, 
                         starDensity=${currentParams.starDensity}, 
                         nebulaDensity=${currentParams.nebulaDensity}, 
                         texture=${currentParams.texturePath}`);
        }
        
        // Log target system params
        if (this.systems[targetSystemId]) {
            const targetParams = this.systems[targetSystemId].skyboxParams;
            console.log(`Traveling to ${targetSystemId} with skybox params: 
                         color=${targetParams.color.toString(16)}, 
                         starDensity=${targetParams.starDensity}, 
                         nebulaDensity=${targetParams.nebulaDensity}, 
                         texture=${targetParams.texturePath}`);
        }
        
        // Set the new current system
        this.setCurrentSystem(targetSystemId);
        return true;
    }
    
    // Get all star systems for the map
    getAllSystems() {
        return this.systems;
    }
    
    // Get current system data
    getCurrentSystemData() {
        if (!this.currentSystem) return null;
        return this.systems[this.currentSystem];
    }
    
    // Helper methods
    getRandomStarClass() {
        const weights = [1, 2, 5, 10, 15, 20, 50]; // More common to have M class stars, rarer to have O class
        const total = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * total;
        
        for (let i = 0; i < weights.length; i++) {
            if (random < weights[i]) {
                return this.starClasses[i];
            }
            random -= weights[i];
        }
        
        return this.starClasses[this.getRandomInt(0, this.starClasses.length - 1)];
    }
    
    getRandomClassification() {
        return this.systemClassifications[this.getRandomInt(0, this.systemClassifications.length - 1)];
    }
    
    getStarColorFromClass(starClass) {
        // Star colors based on spectral classification
        const colors = {
            'O': 0x9bb0ff, // Blue
            'B': 0xaabfff, // Blue-white
            'A': 0xcad7ff, // White
            'F': 0xf8f7ff, // Yellow-white
            'G': 0xfff4ea, // Yellow (like our sun)
            'K': 0xffd2a1, // Orange
            'M': 0xffcc6f  // Red
        };
        
        return colors[starClass] || 0xffffff;
    }
    
    getSkyboxColorFromClass(starClass) {
        // Skybox colors based on spectral classification
        const colors = {
            'O': 0x0000ff, // Blue tint
            'B': 0x4444ff, // Blue-white tint
            'A': 0x8888ff, // White-blue tint
            'F': 0xddddff, // Yellow-white tint
            'G': 0xffffdd, // Yellow tint
            'K': 0xffddaa, // Orange tint
            'M': 0xff8866  // Red tint
        };
        
        return colors[starClass] || 0xffffff;
    }
    
    generateSystemName(starClass) {
        const prefixes = [
            'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta',
            'Proxima', 'Nova', 'Sirius', 'Vega', 'Rigel', 'Antares', 'Arcturus'
        ];
        
        const suffixes = [
            'Prime', 'Major', 'Minor', 'A', 'B', 'I', 'II', 'III', 'IV', 'V'
        ];
        
        const prefix = prefixes[this.getRandomInt(0, prefixes.length - 1)];
        const suffix = this.getRandomInt(0, 10) > 7 ? ` ${suffixes[this.getRandomInt(0, suffixes.length - 1)]}` : '';
        const number = this.getRandomInt(1, 999);
        
        return `${prefix} ${starClass}${number}${suffix}`;
    }
    
    generateSpecialFeatures(classification) {
        const features = [];
        
        // Add classification-specific features
        switch (classification) {
            case 'Resource-Rich':
                features.push('Dense Asteroid Fields', 'Rich Mineral Veins');
                break;
            case 'Ancient':
                features.push('Abandoned Structures', 'Ancient Artifacts');
                break;
            case 'Unstable':
                features.push('Solar Flares', 'Radiation Bursts');
                break;
            case 'Barren':
                features.push('Minimal Resources', 'Few Planets');
                break;
            case 'Hazardous':
                features.push('Asteroid Storms', 'Energy Anomalies');
                break;
            case 'Peaceful':
                features.push('Stable Environment', 'Optimal Mining Conditions');
                break;
        }
        
        return features;
    }
    
    generateDescription(starClass, classification) {
        // Base descriptions by star class
        const starDescriptions = {
            'O': "A rare, hot blue star system with intense radiation.",
            'B': "A blue-white star system with high energy output.",
            'A': "A white star system with moderate radiation levels.",
            'F': "A yellow-white star system with mild conditions.",
            'G': "A yellow star system similar to our Solar System.",
            'K': "An orange star system with reduced energy output.",
            'M': "A common red dwarf system with low energy output."
        };
        
        // Additional descriptions by classification
        const classDescriptions = {
            'Resource-Rich': "The system is known for its abundant resources and dense asteroid fields.",
            'Ancient': "This ancient system contains remnants of long-lost civilizations.",
            'Unstable': "Be cautious as unpredictable stellar activity occurs in this system.",
            'Barren': "Resources are scarce in this mostly empty star system.",
            'Hazardous': "Environmental hazards make mining operations difficult but rewarding.",
            'Peaceful': "This system offers stable and optimal conditions for mining operations.",
            'Home System': "Our home system, containing Earth and the origin of humanity."
        };
        
        return `${starDescriptions[starClass]} ${classDescriptions[classification]}`;
    }
    
    calculateResourceMultipliers(starClass, classification) {
        const baseDistribution = this.resourceDistribution[starClass];
        const classMultiplier = this.classificationMultipliers[classification];
        
        return {
            iron: baseDistribution.iron * classMultiplier.iron,
            gold: baseDistribution.gold * classMultiplier.gold, 
            platinum: baseDistribution.platinum * classMultiplier.platinum
        };
    }
    
    generateMapPosition() {
        // Generate a position for the star map UI
        // This is in abstract coordinates for the 2D map, not the 3D world
        const radius = 150 + Math.random() * 100; // Distance from center
        const angle = Math.random() * Math.PI * 2; // Random angle
        
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        return new THREE.Vector3(x, y, 0);
    }
    
    getRandomSystemsExcept(exceptId, count) {
        const systemIds = Object.keys(this.systems).filter(id => id !== exceptId);
        const selected = [];
        
        // Select random systems up to count
        for (let i = 0; i < Math.min(count, systemIds.length); i++) {
            const index = this.getRandomInt(0, systemIds.length - 1);
            selected.push(systemIds[index]);
            systemIds.splice(index, 1); // Remove to avoid duplicates
        }
        
        return selected;
    }
    
    getRandomSystemExcept(exceptId) {
        const systemIds = Object.keys(this.systems).filter(id => id !== exceptId);
        const index = this.getRandomInt(0, systemIds.length - 1);
        return systemIds[index];
    }
    
    // Utility methods
    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    getRandomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    // Add this method to the StarSystemGenerator class
    addCustomSystem(systemData) {
        if (!systemData || !systemData.id || !systemData.name) {
            console.error('Invalid system data', systemData);
            return false;
        }
        
        // Check if a system with this ID already exists
        if (this.systems[systemData.id]) {
            console.warn(`System with ID ${systemData.id} already exists, overwriting`);
        }
        
        console.log(`Adding custom system: ${systemData.name} (${systemData.id})`);
        
        // Create or update the custom system
        const customSystem = {
            id: systemData.id,
            name: systemData.name,
            starClass: systemData.starClass || this.getRandomStarClass(),
            classification: systemData.classification || 'Custom',
            starColor: systemData.starColor || this.getStarColorFromClass(systemData.starClass || 'G'),
            planetCount: systemData.planetData ? systemData.planetData.length : 0,
            asteroidDensity: systemData.asteroidDensity || 1.0,
            specialFeatures: systemData.specialFeatures || ['User Created'],
            description: systemData.description || 'A custom star system created by the user',
            connections: [], // Will be populated by createConnection
            position: systemData.position || this.generateMapPosition(),
            skyboxParams: {
                starDensity: systemData.skyboxParams?.starDensity || 1.0,
                nebulaDensity: systemData.skyboxParams?.nebulaDensity || 0.8,
                color: systemData.skyboxParams?.color || this.getSkyboxColorFromClass(systemData.starClass || 'G'),
                texturePath: systemData.skyboxUrl || this.getRandomSkyboxTexture(),
                brightness: systemData.skyboxParams?.brightness || 0.8,
                isCustomTexture: !!systemData.skyboxUrl // Flag to indicate custom texture
            },
            resourceMultipliers: systemData.resourceMultipliers || {
                iron: 1.0,
                gold: 1.0,
                platinum: 1.0
            },
            isCustomSystem: true // Flag to mark as custom
        };
        
        // Store custom planet data if provided
        if (systemData.planetData && Array.isArray(systemData.planetData)) {
            this.storePlanetData(systemData.id, systemData.planetData);
        }
        
        // Add the system to our collection
        this.systems[systemData.id] = customSystem;
        
        // Create a connection to Solar System or another random system
        this.createConnection('Solar System', systemData.id);
        
        // Create an additional random connection
        const randomSystem = this.getRandomSystemExcept(systemData.id, 'Solar System');
        if (randomSystem) {
            this.createConnection(systemData.id, randomSystem);
        }
        
        console.log(`Custom system ${systemData.name} added successfully with connections to Solar System and ${randomSystem || 'no other system'}`);
        
        return true;
    }
    
    // Add this method to store custom planet data
    storePlanetData(systemId, planetData) {
        if (!Array.isArray(planetData)) {
            console.error('Planet data must be an array');
            return;
        }
        
        // Create a new array to store standardized planet data
        const standardizedPlanets = [];
        
        // Process each planet
        for (let i = 0; i < planetData.length; i++) {
            const planet = planetData[i];
            
            standardizedPlanets.push({
                name: planet.name || `Planet-${i+1}`,
                size: planet.size || (300 + Math.random() * 500),
                distance: planet.distance || (4800 + (i * 8000) + (Math.random() * 2000)),
                speed: planet.speed || (0.001 + (Math.random() * 0.001)),
                color: planet.color || this.getRandomColor(),
                rings: planet.rings !== undefined ? planet.rings : Math.random() > 0.7,
                textureUrl: planet.textureUrl || null, // Custom texture URL
                axialTilt: planet.axialTilt || (Math.random() * Math.PI * 0.5),
                orbitalTilt: planet.orbitalTilt || (Math.random() * Math.PI * 0.2)
            });
        }
        
        // Store the planet data for this system
        if (!this.customPlanetData) {
            this.customPlanetData = {};
        }
        
        this.customPlanetData[systemId] = standardizedPlanets;
        console.log(`Stored ${standardizedPlanets.length} planets for system ${systemId}`);
    }
    
    // Helper method to generate a random color
    getRandomColor() {
        return Math.floor(Math.random() * 0xFFFFFF);
    }

    /**
     * Returns player to mothership after interstellar travel
     * Should be called after travel to ensure proper docking state
     */
    returnFromTravel() {
        console.log("StarSystemGenerator: Handling return from interstellar travel");
        
        // Check if game and spaceship are available
        if (!window.game || !window.game.spaceship) {
            console.error("StarSystemGenerator: Cannot return from travel - game or spaceship not found");
            return false;
        }
        
        // Ensure the player is docked after travel
        if (!window.game.spaceship.isDocked) {
            console.log("StarSystemGenerator: Setting ship to docked state after travel");
            window.game.spaceship.dock();
        }
        
        // Reposition ship near mothership
        const dockingSystem = window.game.controls?.dockingSystem;
        if (dockingSystem) {
            console.log("StarSystemGenerator: Repositioning ship near mothership");
            dockingSystem.positionNearMothership();
            
            // Show mothership UI
            if (typeof dockingSystem.showMothershipUI === 'function') {
                console.log("StarSystemGenerator: Showing mothership UI via docking system");
                dockingSystem.showMothershipUI();
                return true;
            }
        }
        
        // Fallback - try to find UI or mothership interface directly
        if (window.game.ui?.mothershipInterface?.showMothershipUI) {
            console.log("StarSystemGenerator: Showing mothership UI via game.ui.mothershipInterface");
            window.game.ui.mothershipInterface.showMothershipUI();
            return true;
        }
        
        console.warn("StarSystemGenerator: Could not fully complete return from travel");
        return false;
    }
}