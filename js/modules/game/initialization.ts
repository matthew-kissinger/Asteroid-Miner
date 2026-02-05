// initialization.ts - Game initialization wrapper for the game module

import { GameInitializer as MainGameInitializer } from '../../main/gameInitializer.js';
import { ObjectPools } from '../../main/objectPools.js';

type GameContext = {
    scene?: any;
    camera?: any;
    renderer?: any;
    audio?: any;
    physics?: any;
    environment?: any;
    spaceship?: any;
    ui?: any;
    controls?: any;
    handleResize: () => void;
    handleVisibilityChange: () => void;
    handleKeyDown: (event: KeyboardEvent) => void;
};

/**
 * GameInitializer wrapper that implements the initialization interface expected by the Game class.
 * Wraps the core GameInitializer from js/main/gameInitializer.ts and adds the missing methods.
 */
export class GameInitializer {
    private coreInitializer: MainGameInitializer;
    private objectPools: ObjectPools;

    constructor(game: GameContext) {
        this.coreInitializer = new MainGameInitializer(game);
        this.objectPools = new ObjectPools(game);
    }

    /**
     * Initialize all game systems
     */
    async initialize(): Promise<void> {
        // Initialize core systems
        await this.coreInitializer.initializeCore();

        // Setup event handlers
        this.coreInitializer.setupEventHandlers();
    }

    /**
     * Ensure projectile assets are precomputed for better initial performance
     */
    ensureProjectileAssetsPrecomputed(): void {
        // Pre-warm essential shaders and projectile assets
        this.objectPools.preWarmBasicShaders();
    }

    /**
     * Start the game with the spaceship docked at the stargate
     */
    startDocked(): void {
        this.coreInitializer.startDocked();
    }
}
