// sceneInitializer.ts - Handles scene setup and initialization logic

import { Skybox } from '../skybox.ts';
import { Sun } from '../sun.ts';
import { Planets } from '../planets.ts';
import { Stargate } from '../stargate.ts';
import { StarSystemGenerator } from '../starSystemGenerator.ts';
import type { AsteroidBelt } from '../asteroidBelt.ts';
import type { SpaceAnomalies } from '../spaceAnomalies.ts';
import type { SystemTransition } from '../systemTransition.ts';
import type { VibeVersePortals } from '../vibeVersePortals.ts';
import type { HazardManager } from '../hazards/hazardManager.ts';
import type { LootDropManager } from '../../combat/lootDrops.ts';
import { mainMessageBus } from '../../../globals/messageBus.ts';

interface EnvironmentComponents {
    skybox: Skybox;
    sun: Sun;
    starSystemGenerator: StarSystemGenerator;
    planets: Planets;
    stargate: Stargate;
}

interface RemainingComponents {
    asteroidBelt: AsteroidBelt;
    spaceAnomalies: SpaceAnomalies;
    systemTransition: SystemTransition;
    customSystemCreator: unknown;
    hazardManager: HazardManager;
    lootDropManager: LootDropManager;
}

export class SceneInitializer {
    scene: any;
    componentsLoaded: boolean;
    skybox?: Skybox;
    sun?: Sun;
    starSystemGenerator?: StarSystemGenerator;
    planets?: Planets;
    stargate?: Stargate;
    asteroidBelt?: AsteroidBelt;
    spaceAnomalies?: SpaceAnomalies;
    systemTransition?: SystemTransition;
    customSystemCreator?: unknown;
    vibeVersePortals?: VibeVersePortals;
    hazardManager?: HazardManager;
    lootDropManager?: LootDropManager;

    constructor(scene: any) {
        this.scene = scene;
        this.componentsLoaded = false;
    }

    // Initialize essential components first
    initializeEssentialComponents(): EnvironmentComponents {
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
    async loadRemainingComponents(): Promise<RemainingComponents> {
        console.log("Loading remaining environment components...");

        // Initialize asteroid belt - slightly defer to prioritize UI loading
        const { AsteroidBelt } = await import('../asteroidBelt.ts');
        this.asteroidBelt = new AsteroidBelt(this.scene);

        // Initialize space anomalies
        const { SpaceAnomalies } = await import('../spaceAnomalies.ts');
        this.spaceAnomalies = new SpaceAnomalies(this.scene);

        // Initialize system transition effects
        const { SystemTransition } = await import('../systemTransition.ts');
        this.systemTransition = new SystemTransition(this.scene, this.scene.camera);

        // Initialize the custom system creator
        const { CustomSystemCreator } = await import('../../ui/customSystemCreator.ts');
        this.customSystemCreator = new CustomSystemCreator(this.starSystemGenerator ?? null, this as any);
        console.log("Custom system creator initialized:", this.customSystemCreator);

        // Initialize environmental hazard manager
        const { HazardManager: HazardManagerClass } = await import('../hazards/hazardManager.ts');
        this.hazardManager = new HazardManagerClass(this.scene);
        if (this.spaceAnomalies) {
            const anomalies = this.spaceAnomalies;
            this.hazardManager.setSpaceAnomalies({
                createEnergyOrb: (rarity: string) => anomalies.createEnergyOrb(rarity as 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'),
                getRandomOrbRarity: () => anomalies.getRandomOrbRarity(),
            });
        }
        this.hazardManager.generateHazards();

        // Initialize loot drop manager
        const { LootDropManager: LootDropManagerClass } = await import('../../combat/lootDrops.ts');
        this.lootDropManager = new LootDropManagerClass(this.scene, mainMessageBus);
        this.lootDropManager.init();

        this.componentsLoaded = true;
        console.log("All environment components initialized");

        return {
            asteroidBelt: this.asteroidBelt,
            spaceAnomalies: this.spaceAnomalies,
            systemTransition: this.systemTransition,
            customSystemCreator: this.customSystemCreator,
            hazardManager: this.hazardManager,
            lootDropManager: this.lootDropManager,
        };
    }

    // Initialize VibeVerse portals - requires spaceship reference
    async initializePortals(spaceship: unknown): Promise<VibeVersePortals> {
        const { VibeVersePortals } = await import('../vibeVersePortals.ts');
        this.vibeVersePortals = new VibeVersePortals(this.scene, spaceship as any);
        console.log("VibeVerse portals initialized");
        return this.vibeVersePortals;
    }

    dispose(): void {
        // Dispose all components
        if (this.skybox) this.skybox.dispose();
        if (this.sun) this.sun.dispose();
        if (this.planets) this.planets.dispose();
        if (this.asteroidBelt) this.asteroidBelt.dispose();
        if (this.stargate) this.stargate.dispose();
        if (this.spaceAnomalies) this.spaceAnomalies.clearAllAnomalies();
        if (this.hazardManager) this.hazardManager.dispose();
        if (this.lootDropManager) this.lootDropManager.cleanup();
        if (this.vibeVersePortals) this.vibeVersePortals.dispose();
    }
}
