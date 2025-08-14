// sceneInitializer.js - Handles scene setup and initialization logic

import { Skybox } from '../skybox.js';
import { Sun } from '../sun.js';
import { Planets } from '../planets.js';
import { Stargate } from '../stargate.js';
import { StarSystemGenerator } from '../starSystemGenerator.js';

export class SceneInitializer {
    constructor(scene) {
        this.scene = scene;
        this.componentsLoaded = false;
    }

    // Initialize essential components first
    initializeEssentialComponents() {
        console.log("Initializing essential environment components...");
        
        // Initialize only essential components first
        this.skybox = new Skybox(this.scene);
        this.sun = new Sun(this.scene);
        
        // Initialize star system generator
        this.starSystemGenerator = new StarSystemGenerator(this.scene);
        
        // Initialize planets with reference to starSystemGenerator - needed for basic gameplay
        this.planets = new Planets(this.scene, this.starSystemGenerator);
        
        // Initialize stargate - needed for docking UI
        this.stargate = new Stargate(this.scene);
        
        console.log("Essential environment components initialized");
        
        return {
            skybox: this.skybox,
            sun: this.sun,
            starSystemGenerator: this.starSystemGenerator,
            planets: this.planets,
            stargate: this.stargate
        };
    }

    // Load remaining non-essential components asynchronously
    async loadRemainingComponents() {
        console.log("Loading remaining environment components...");
        
        // Initialize asteroid belt - slightly defer to prioritize UI loading
        const { AsteroidBelt } = await import('../asteroidBelt.js');
        this.asteroidBelt = new AsteroidBelt(this.scene);
        
        // Initialize space anomalies
        const { SpaceAnomalies } = await import('../spaceAnomalies.js');
        this.spaceAnomalies = new SpaceAnomalies(this.scene);
        
        // Initialize system transition effects
        const { SystemTransition } = await import('../systemTransition.js');
        this.systemTransition = new SystemTransition(this.scene, this.scene.camera);
        
        // Initialize the custom system creator
        const { CustomSystemCreator } = await import('../../ui/customSystemCreator.js');
        this.customSystemCreator = new CustomSystemCreator(this.starSystemGenerator, this);
        console.log("Custom system creator initialized:", this.customSystemCreator);
        
        this.componentsLoaded = true;
        console.log("All environment components initialized");
        
        return {
            asteroidBelt: this.asteroidBelt,
            spaceAnomalies: this.spaceAnomalies,
            systemTransition: this.systemTransition,
            customSystemCreator: this.customSystemCreator
        };
    }

    // Initialize VibeVerse portals - requires spaceship reference
    async initializePortals(spaceship) {
        const { VibeVersePortals } = await import('../vibeVersePortals.js');
        this.vibeVersePortals = new VibeVersePortals(this.scene, spaceship);
        console.log("VibeVerse portals initialized");
        return this.vibeVersePortals;
    }

    dispose() {
        // Dispose all components
        if (this.skybox) this.skybox.dispose();
        if (this.sun) this.sun.dispose();
        if (this.planets) this.planets.dispose();
        if (this.asteroidBelt) this.asteroidBelt.dispose();
        if (this.stargate) this.stargate.dispose();
        if (this.spaceAnomalies) this.spaceAnomalies.clearAllAnomalies();
        if (this.vibeVersePortals) this.vibeVersePortals.dispose();
    }
}