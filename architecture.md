# ARCHITECTURE.md

## 1. Project Overview

-   **Project Name:** Solar System Asteroid Miner (aminer)
-   **Version:** v0.5.6
-   **Purpose:** A 3D space mining simulation game playable in a web browser. Players navigate space, mine asteroids, trade resources, upgrade their ship, and engage in combat.
-   **Core Functionality:**
    -   3D Space Navigation & Physics Simulation
    -   Asteroid Mining & Resource Collection (Split between Module and ECS System)
    -   Ship Upgrades & Trading via Stargate Interface (Likely involves ECS Trading System)
    -   Combat System (Player vs AI Enemies, managed via dedicated ECS)
    -   Deployable Space Laser Turrets (Autonomous defense platforms)
    -   Space Anomalies with Collectible Energy Orbs (Exploration incentives outside asteroid belts)
    -   Multiple Star System Exploration (Including procedural/AI generation)
    -   Mobile and Desktop Controls (Split between Module and ECS System)
    -   Object Pooling Systems for Performance Optimization (ProjectilePoolManager and global pool)
-   **Main Technologies & Frameworks:**
    -   JavaScript (ES Modules)
    -   Three.js (r175) for 3D rendering and core structures (Vectors, Quaternions, etc.)
    -   HTML5 & CSS3
    -   Custom ECS Implementation (Used within the Combat module, potentially includes optimized variations)
    -   NippleJS v0.10.1 (for mobile touch joysticks, dynamically loaded from CDN)
    -   Tone.js (for intro sequence audio synthesis - latest version via CDN)
    -   External AI API (Optional, via `apiClient.js`) for custom system generation.
-   **System Architecture Type:** Client-Side Monolith with a hybrid architecture. Features a dedicated Entity-Component-System (ECS) world managed by the `Combat` module for enemies, combat logic, trading, mining visuals, docking visuals, and potentially input/control handling. Other aspects like player ship physics, resource management, and asteroid management use direct object manipulation and custom classes (`Spaceship`, `AsteroidBelt`). Includes two object pooling systems for performance. Communicates with an external API for optional AI content generation.

## 2. Complete File Structure

aminer_0.5.6/
css/ # CSS Stylesheets
    custom-system.css # Styles for the custom system creator UI
    mobile.css # Specific styles for mobile devices
js/ # JavaScript source code
    components/ # ECS Components (Data - Primarily used by Combat ECS)
        combat/ # Combat-related components
            deployableLaser.js # Handles autonomous laser turret behavior
            enemyAI.js
            healthComponent.js # Handles entity health and shields (Player & Enemies)
        common/ # Common components
        mining/ # Mining-related components
            mineable.js
        physics/ # Standard physics components
            rigidbody.js # Physics properties
        rendering/ # Rendering-related components
            mesh.js # Standard Three.js mesh wrapper
            trail.js # Component for rendering entity trails
        spaceship/ # Spaceship-specific components
            cargo.js # Handles ship cargo hold
            miningLaser.js # Component for mining laser capabilities
            pickupable.js # Allows objects to be picked up by the player
            shipState.js # Holds high-level ship state (docked, fuel, upgrades)
            thruster.js # Handles ship thruster logic and effects
        transform.js # Standard position, rotation, scale
    core/ # Core ECS framework
        component.js # Base class for all components
        difficultyManager.js # Base logic for game difficulty scaling (Integration primarily in game.js/main.js)
        entity.js # Base class for entities
        entityManager.js # Manages entity creation, destruction, and querying
        messageBus.js # Central event bus for system communication
        system.js # Base class for all systems
        systemManager.js # Manages system registration and updates
        world.js # Main ECS world container
    entities/ # Entity factory/prefab functions
        spaceship.js # Functions to create spaceship and asteroid entities
    future/ # Components and systems preserved for future scaling
        components/ # Future optimized components
            optimized/ # TypedArray-based components
                rigidbodyComponent.js # Optimized rigidbody using TypedArrays
                transformComponent.js # Optimized transform using TypedArrays
            rendering/ # Instanced rendering components
                instancedMeshComponent.js # Component for instanced rendering
        core/ # Future core optimizations
            dataStore.js # Data-Oriented Design storage using TypedArrays
            optimizedEntityFactory.js # Factory for optimized entities
        systems/ # Future optimized systems
            rendering/ # Optimized rendering systems
                instancedRenderSystem.js # System for instanced rendering
        README.md # Documentation on future scaling components
    modules/ # Higher-level game feature modules
        combat/ # Combat management logic
            combatManager.js # Adapter/bridge to the Combat ECS world state
        pooling/ # Performance optimization through object reuse
            ObjectPool.js # Generic object pool class
            ProjectilePoolManager.js # Manages pools of projectiles/effects for the Combat module
        controls/ # High-level Input handling and control systems (Player Intent, UI)
            deploymentSystem.js # Handles player deployment/retrieval of space laser turrets
            dockingSystem.js # Handles player intent/UI for docking/undocking
            inputHandler.js # Handles keyboard/mouse input (Desktop)
            miningSystem.js # Handles player mining intent, resource calculation, and UI interaction
            targetingSystem.js # Handles target locking and cycling
            touchControls.js # Handles touch input (Mobile UI/Gestures)
        environment/ # World environment elements
            asteroidBelt.js # Generates and manages the asteroid belt (Direct THREE.Mesh objects)
            spaceAnomalies.js # Creates and manages space anomalies with collectible energy orbs
            stargate.js # Creates and manages the stargate object
            planets.js # Creates and manages planets in the system
            skybox.js # Creates and manages the space skybox
            starDreadnought.js # Creates the Star Dreadnought model
            starSystemGenerator.js # Generates procedural star systems and manages transitions
            sun.js # Creates and manages the system's sun
            systemTransition.js # Handles visual effects for system transitions
        ui/ # User Interface elements and management
            blackjackGame.js # Implements the Blackjack minigame UI
            combatDisplay.js # UI elements related to combat status
            controlsMenu.js # UI for displaying game controls
            customSystemCreator.js # UI for the AI-powered custom system creation feature
            gameOverScreen.js # UI displayed on game over
            hud.js # Heads-Up Display (Desktop)
            miningDisplay.js # UI elements related to mining status/progress
            mobileHUD.js # Heads-Up Display (Mobile)
            stargateInterface.js # UI for interacting with the stargate
            settings.js # UI for game settings
            starMap.js # UI for navigating between star systems
            targetingUI.js # UI components for target display and information
        utils/ # Utility modules coordinating major features
            apiClient.js # Client for interacting with the external AI API
            audio.js # Manages audio playback and context
            combat.js # Creates and manages the Combat ECS world
            controls.js # Main controls coordinator module
            environment.js # Main environment coordinator module
            game.js # Main game loop and state management
            introSequence.js # Manages the game's intro sequence
            physics.js # Main physics coordination for player ship (Direct object manipulation)
            renderer.js # Main rendering setup and coordination
            spaceship.js # Main spaceship state and logic class (Authoritative source)
            ui.js # Main UI coordinator module
    systems/ # ECS Systems (Logic - Used ONLY within the Combat ECS World)
        combat/ # Combat-related systems
            combatSystem.js # Processes combat interactions
            deployableLaserSystem.js # Manages autonomous space laser turret targeting and firing
            enemyLifecycle.js # Handles enemy state validation and transitions
            enemyPoolManager.js # Manages pooling of enemy objects for performance
            enemySpawner.js # Handles spawning of enemies
            enemySystem.js # Manages enemy AI and behavior updates
        deployment/ # Deployment logic within ECS
            deploymentSystem.js # Handles deployment and retrieval of space laser turrets
        docking/ # Docking logic within ECS (e.g., state changes, visual triggers)
            dockingSystem.js # Handles low-level docking state/events within ECS
        entity/ # Entity state systems
            healthSystem.js # Updates health, shields, handles destruction logic
        input/ # Low-level input processing within ECS
            inputSystem.js # Generic input processing for ECS entities?
            shipControlSystem.js # Processes control inputs for ECS entities (e.g., AI ships?)
            touchInputSystem.js # Low-level touch event handling within ECS?
        mining/ # Mining process logic within ECS (Visuals, entity interaction)
            miningSystem.js # Handles laser visuals, entity state changes during mining
        physics/ # Physics simulation systems for ECS entities
            collisionSystem.js # Detects and resolves collisions
            movementSystem.js # Updates entity position/rotation based on physics
        rendering/ # Rendering update systems for ECS entities
            renderSystem.js # Updates standard mesh positions/visibility
            trailSystem.js # Updates and renders entity trails
            visualEffectsSystem.js # Manages creation and updating of visual effects (explosions)
        trading/ # Trading logic within ECS (e.g., resource exchange between entities?)
            tradingSystem.js
    utils/ # Utility classes and functions (General purpose)
        memoryManager.js # Utilities for memory pooling
        mobileDetector.js # Detects if the user agent is mobile
        pathUtils.js # Utility for handling asset paths depending on environment
    main.js # [ENTRY POINT] Initializes the game and starts the main loop
assets/ # Game assets (textures, models, etc.)
sounds/ # Audio files for game sounds
index.html # [ENTRY POINT] Main HTML file, loads scripts
README.md # Project README file

## 3. Core Components

### `js/core/` (Used by Combat Module ECS)
-   **Purpose:** Provides the fundamental building blocks for the Entity-Component-System (ECS) architecture used by the Combat module. Includes experimental/optimized variations for future scaling.
-   **Key Files:**
    -   `entity.js`: Defines the `Entity` class.
    -   `component.js`: Base class for all components.
    -   `system.js`: Base class for all systems.
    -   `entityManager.js`: Manages the lifecycle and querying of entities within the Combat World instance.
    -   `systemManager.js`: Manages the registration, ordering, and updating of systems within the Combat World instance.
    -   `world.js`: Orchestrates an ECS instance, holding references to the `EntityManager` and `SystemManager`. Instantiated by `js/modules/combat.js`.
    -   `messageBus.js`: A publish/subscribe event bus. A global instance (`window.mainMessageBus`) is created in `main.js`, and the Combat ECS world uses this shared bus.
    -   `difficultyManager.js`: Contains base logic for difficulty scaling. Primary integration and application occur within the `Game` class (`js/modules/game.js`) and `main.js`.
    -   `dataStore.js`: Implements Data-Oriented Design pattern using TypedArrays for optimal memory layout and performance. Currently preserved for future scaling but not actively used in the main game. Provides optimized storage for transform and rigidbody components.
    -   `optimizedEntityFactory.js`: Factory for creating entities with optimized components found in `js/components/optimized/`. Preserved for future scaling but not actively used in the main game.
-   **Interactions:** The `World` instance created by `Combat.js` uses `EntityManager` and `SystemManager`. Systems registered within this world query its `EntityManager` and communicate via the shared `MessageBus`.

### Object Pooling Systems
-   **Purpose:** Provides object pooling to improve performance by reducing garbage collection for frequently created/destroyed objects like visual effects and projectiles. Two distinct systems are currently in use.
-   **System 1: `ProjectilePoolManager.js` (`js/modules/pooling/`)**
    -   **Scope:** Used exclusively by the `js/modules/combat.js` module.
    -   **Implementation:** A specialized manager for projectiles, muzzle flashes, explosions, tracers, and trails used in combat.
    -   **Key Features:** Creates shared geometries and materials, manages multiple internal pools using the `ObjectPool.js` class, specialized reset functions, pre-allocation.
    -   **Interactions:** `Combat.js` instantiates and uses `ProjectilePoolManager` to get/release combat-specific visual effect objects.
-   **System 2: Global `window.objectPool` (Defined in `js/main.js`)**
    -   **Scope:** Used by `main.js` and potentially other systems outside the `Combat` module for general-purpose pooling.
    -   **Implementation:** A simple, globally accessible object literal defined directly in `main.js`. Provides `createPool`, `get`, `release`, `clearAllPools` methods.
    -   **Key Features:** Basic pooling with factory functions, pre-population, reset/clear methods on pooled objects.
    -   **Pooled Object Types:** `hitEffect`, `projectile`, `particleEffect` (as defined in `main.js`'s `initializeObjectPools`).
    -   **Interactions:** Initialized in `main.js`. Used by systems like `VisualEffectsSystem` and `CombatSystem`.
-   **`js/modules/pooling/ObjectPool.js`:** This generic pooling class is actively used by `ProjectilePoolManager` to manage its internal pools. It provides a proper object-oriented implementation of pooling with methods for getting, releasing, and disposing objects.

### `js/components/` (Used by Combat ECS)
-   **Purpose:** Defines the data associated with entities within the Combat ECS world. Components are simple data containers. Includes standard and optimized versions.
-   **Key Files/Subdirectories:**
    -   `transform.js`: Standard position, rotation, scale.
    -   `physics/rigidbody.js`: Standard mass, velocity, forces, drag.
    -   `rendering/mesh.js`: Represents visual geometry and material.
    -   `combat/healthComponent.js`: Health, shields, damage handling.
    -   `combat/enemyAI.js`: Holds AI state and parameters.
    -   `combat/deployableLaser.js`: Handles autonomous space laser turret behavior, targeting, and firing.
    -   `rendering/trail.js`: Data for entity trails.
    -   `spaceship/`, `mining/`: Components like `CargoComponent`, `MineableComponent`, `MiningLaserComponent` used by `Spaceship` class, `AsteroidBelt` class, or ECS Systems.
    -   `spaceship/pickupable.js`: Allows objects (like deployable lasers) to be picked up by the player.
    -   `optimized/`: Contains performance-optimized versions of components using TypedArrays for better memory layout and performance:
        -   `transformComponent.js`: Optimized transform component that uses the `TransformDataStore`.
        -   `rigidbodyComponent.js`: Optimized rigidbody component that uses the `RigidbodyDataStore`.
        -   These optimized components are preserved for future scaling but not actively used in the main game.
-   **Interactions:** Components are added to Entities via `entity.addComponent()`. Systems query entities based on components using `entityManager.getEntitiesWithComponents()`.

### `js/systems/` (Used ONLY by Combat ECS)
-   **Purpose:** Implements game logic specifically for the Combat ECS world by operating on entities (enemies, player reference, projectiles, potentially asteroids/stations) that possess specific sets of components. Handles low-level state changes, physics, rendering updates, and visual effects within the ECS context.
-   **Key Systems Registered in Combat ECS:**
    -   `physics/movementSystem.js`: Updates Combat ECS entity positions based on velocity/forces.
    -   `physics/collisionSystem.js`: Detects and resolves collisions between Combat ECS entities.
    -   `rendering/renderSystem.js`: Updates transforms of `THREE.Mesh` objects associated with Combat ECS entities.
    -   `rendering/trailSystem.js`: Manages and updates trails for Combat ECS entities (e.g., projectiles).
    -   `rendering/visualEffectsSystem.js`: Creates and manages temporary visual effects (explosions) triggered by Combat ECS events using pooling.
    -   `combat/combatSystem.js`: Processes combat interactions (damage, etc.).
    -   `combat/enemySystem.js`: Manages enemy AI behavior, state, and spawning.
    -   `combat/deployableLaserSystem.js`: Manages autonomous space laser turret targeting and firing behavior.
    -   `combat/enemyLifecycle.js`, `enemyPoolManager.js`, `enemySpawner.js`: Support systems for enemy management.
    -   `deployment/deploymentSystem.js`: Handles deployment and retrieval of space laser turrets.
    -   `entity/healthSystem.js`: Updates health/shields and handles destruction logic.
    -   `mining/miningSystem.js`: Handles the *visuals and entity interactions* of the mining process (e.g., updating laser beam appearance, checking `MineableComponent` state), triggered by events from `js/modules/controls/miningSystem.js`.
    -   `docking/dockingSystem.js`: Handles low-level ECS entity state changes related to docking (e.g., attaching entities, managing physics constraints), likely triggered by events from `js/modules/controls/dockingSystem.js`.
    -   `trading/tradingSystem.js`: Manages resource exchange or interactions between entities within the ECS (e.g., player entity trading with station entity). Details need confirmation.
    -   `input/inputSystem.js`, `shipControlSystem.js`, `touchInputSystem.js`: Potentially handle low-level input processing directed at ECS entities (e.g., AI ship movement based on internal state, translating touch data for ECS). Relationship with module-level input handlers needs clarification.
-   **Interactions:** Systems are managed by the `SystemManager` within the Combat ECS `World`. They fetch relevant entities from that world's `EntityManager`, operate on their components, and communicate via the shared `MessageBus`. They often react to events published by higher-level modules.

### `js/modules/`
-   **Purpose:** Encapsulates higher-level game features and logic. Acts as coordinators or implementers of specific game functionalities, handling player intent, UI, overall game state, and interactions with non-ECS game objects. Often triggers actions or publishes events processed by the Combat ECS systems.
-   **Key Files/Subdirectories:**
    -   `game.js`: Central coordinator (`Game` class). Initializes modules, manages the main loop, holds global state (`isGameOver`), applies `DifficultyManager` logic, initializes global `window.objectPool`.
    -   `renderer.js`: Sets up Three.js renderer, scene, camera, lighting, post-processing.
    -   `spaceship.js`: Authoritative source for player state (hull, shield, cargo, upgrades, etc.). Manages deployable laser inventory. Synchronizes relevant state bidirectionally with the 'player' entity's components within the Combat ECS world via methods called in `combat.js`.
    -   `physics.js`: Coordinator for *player ship* physics simulation. Directly applies forces to the `Spaceship` object based on controls. Operates independently of the Combat ECS physics systems (which handle enemies, projectiles etc.).
    -   `environment.js`: Manages scene elements (Skybox, Sun, Planets, Stargate, AsteroidBelt, SpaceAnomalies). `AsteroidBelt` manages asteroids directly using standard `THREE.Mesh` objects (though asteroids might also have corresponding entities in the ECS for mining/targeting). `SpaceAnomalies` manages unique space structures with collectible energy orbs. Uses `StarSystemGenerator`.
    -   `controls.js`: Main coordinator for player input. Delegates to specific handlers (`inputHandler.js`, `touchControls.js`) and systems (`miningSystem.js`, `targetingSystem.js`, `dockingSystem.js`, `deploymentSystem.js`). Handles automatic collection of energy orbs when colliding with anomalies.
    -   `controls/inputHandler.js`, `controls/touchControls.js`: Handle raw desktop/mobile input events and translate them into game actions or state changes for the `Spaceship` or other modules.
    -   `controls/miningSystem.js`: Handles player *intent* to mine, target selection, UI updates (progress bar, target info), resource calculation and addition to `Spaceship` cargo. Publishes events like `mining.start` / `mining.stop` for the ECS `miningSystem` to handle visuals.
    -   `controls/dockingSystem.js`: Handles player *intent* to dock/undock, target selection (stargate), UI updates. Publishes events for the ECS `dockingSystem` to handle entity state changes.
    -   `controls/deploymentSystem.js`: Handles player *intent* to deploy/retrieve space laser turrets, UI updates. Publishes events for the ECS `deploymentSystem` to handle entity creation/destruction.
    -   `ui.js`: Manages all UI elements (instantiation, updates). Reads state from `Spaceship` class, `Environment`, and potentially the Combat ECS world via adapters (`CombatManager`) or `MessageBus` events.
    -   `combat.js`: Creates and manages the dedicated Combat ECS `World`. Instantiates `ProjectilePoolManager`. Handles projectile firing logic, synchronization between `Spaceship` state and the Combat ECS player entity. Registers all ECS Systems (`js/systems/*`).
    -   `pooling/ObjectPool.js`: Generic object pool class used by `ProjectilePoolManager`.
    -   `pooling/ProjectilePoolManager.js`: Used by `js/modules/combat.js` for pooling combat effects. Uses `ObjectPool.js` internally.
    -   `combat/combatManager.js`: Thin adapter providing a simplified view into the Combat ECS world state (enemies, stats) primarily for UI display.
    -   `audio.js`: Manages audio.
    -   `introSequence.js`: Manages intro sequence.
    -   `utils/apiClient.js`: Handles external AI API communication.
    -   `mobile/`: (Currently Empty) Placeholder.
-   **Interactions:** Modules hold references to each other (`Game` holds most). `Combat.js` is central to the ECS part. Modules like `controls/miningSystem.js` initiate actions, often by publishing events to the `MessageBus`, which are then handled by corresponding ECS systems in `js/systems/` for low-level execution and visual updates within the 3D world. `Spaceship.js` remains the authoritative source for player status, syncing with the ECS representation.

## 4. File Explanations

-   **`main.js`**: Initializes core modules, starts loop, defines global `window.objectPool`, may apply `DifficultyManager` logic.
-   **`js/core/world.js`**: Represents an ECS world instance. Used by `js/modules/combat.js`.
-   **`js/core/entityManager.js`**: Manages entities within the Combat ECS world.
-   **`js/core/systemManager.js`**: Manages systems within the Combat ECS world.
-   **`js/modules/pooling/ObjectPool.js`**: Generic object pool class.
-   **`js/modules/pooling/ProjectilePoolManager.js`**: Specialized pool manager for combat effects.
-   **`js/modules/game.js`**: Central coordinator. Holds references to modules. Manages game loop.
-   **`js/modules/spaceship.js`**: Authoritative player state. Syncs with the Combat ECS player entity.
-   **`js/modules/combat.js`**: Creates and manages the Combat ECS world, registers combat systems, handles projectile logic and pooling, syncs player state with ECS.
-   **`js/modules/controls/miningSystem.js`**: Handles player mining intent, UI, and resource logic.
-   **`js/systems/mining/miningSystem.js`**: Handles ECS-level mining visuals and entity state updates.
-   **`js/modules/environment/asteroidBelt.js`**: Manages asteroids using direct `THREE.Mesh` objects.
-   **`js/modules/environment/spaceAnomalies.js`**: Creates and manages space anomalies with collectible energy orbs. Implements 5 unique anomaly types with particle effects, animations, and collision detection.
-   **`js/modules/utils/apiClient.js`**: Handles external AI API.
-   **`js/core/dataStore.js`**: Implements Data-Oriented Design pattern using TypedArrays for optimized component storage. Preserved for future scaling but not actively used in the main game.
-   **`js/core/optimizedEntityFactory.js`**: Factory for creating entities with optimized components. Preserved for future scaling but not actively used in the main game.
-   **`js/components/optimized/*`**: Optimized component versions using TypedArrays. Preserved for future scaling but not actively used in the main game.

## 5. Data Models

-   **Primary Data Models:** Hybrid Approach
    -   **Combat ECS:** A dedicated ECS world managed by `js/modules/combat.js` uses the core ECS classes (`Entity`, `Component`, `System`, `World`). Manages enemies, projectiles, player reference entity, and potentially handles aspects of mining, docking, trading involving entities.
    -   **Entities:** Simple IDs (`entity.js`).
        -   **Components:** Standard data containers (`components/`) like `TransformComponent`, `RigidbodyComponent`, `HealthComponent`, `EnemyAIComponent`, `MeshComponent`, `TrailComponent`, `MiningLaserComponent`, `MineableComponent`, plus optimized versions in `components/optimized/`.
    -   **Direct Object Management:** Other game elements are managed via standard JavaScript classes and direct manipulation of `THREE.Object3D` instances.
        -   **Player Ship:** State managed by `js/modules/spaceship.js` (Authoritative). Physics handled by `js/modules/physics.js`.
        -   **Asteroids:** Managed by `js/modules/environment/asteroidBelt.js` (likely as `THREE.Mesh` objects with metadata). May have corresponding ECS entities for interaction.
        -   **Space Anomalies:** Managed by `js/modules/environment/spaceAnomalies.js` as THREE.js objects with custom animations and collision logic. Energy orbs inventory is managed through the player's resource system.
-   **Object Pooling System:** (Dual Implementation)
    -   **System 1: `ProjectilePoolManager`:** Used by `Combat.js` for combat effects. Uses `ObjectPool.js` internally.
    -   **System 2: `window.objectPool`:** Global pool in `main.js` for general effects.
-   **Spaceship State Management (`js/modules/spaceship.js`):**
    -   The `Spaceship` class is the authoritative source for player state (health, shields, cargo, position, etc.).
    -   Synchronization occurs specifically with the 'player' entity within the Combat ECS world. `combat.js` handles this bidirectional data flow.
-   **Data Flow:**
    -   Input (`InputHandler`, `TouchControls`) -> `Controls` module (`controls.js`, `miningSystem.js`, `dockingSystem.js`, `deploymentSystem.js`) -> Directly modifies `Spaceship` state / calls `Physics` module methods (for player movement) / Publishes events (e.g., `mining.start`, `docking.request`, `deployment.laser`, `pickup.laser`).
    -   Input -> `Controls` module -> May trigger actions in `Combat` module (e.g., `startFiring`).
    -   `Combat` module -> Fires projectiles (using `ProjectilePoolManager`).
    -   `Combat` module -> Updates its internal ECS `World`.
    -   Combat ECS `Systems` (`MovementSystem`, `CollisionSystem`, `CombatSystem`, `EnemySystem`, `HealthSystem`, `MiningSystem`, `DockingSystem`, `TradingSystem`, etc.) operate on entities within the Combat ECS world, often reacting to `MessageBus` events.
    -   ECS `MiningSystem` / `DockingSystem` -> Update visuals and entity states based on events from corresponding modules.
    -   ECS `CollisionSystem` / `CombatSystem` -> Modify `HealthComponent` of entities.
    -   `Combat` module reads `HealthComponent` of player reference entity -> Updates `Spaceship` object state (`hull`, `shield`).
    -   `Combat` module reads `Spaceship` object state -> Updates `TransformComponent` / `HealthComponent` of player reference entity.
    -   ECS `RenderSystem` reads `TransformComponent`/`MeshComponent` -> Updates visuals of Combat ECS entities.
    -   `Environment` module (`AsteroidBelt`) -> Directly updates asteroid `THREE.Mesh` positions/rotations.
    -   `Renderer` module -> Renders the main scene containing player ship, asteroids (directly managed), and Combat ECS entity meshes.
    -   `UI` modules read state primarily from `Spaceship` class and `Environment` module. Use `CombatManager` adapter to read basic Combat ECS state. React to `MessageBus` events.
    -   `MessageBus` is used for cross-cutting events (e.g., `game.over`, `vfx.explosion`, `player.docked`, `mining.start`, `mining.stop`, `deployment.laser`, `pickup.laser`).
-   **State Management:** Mix of object-oriented state (`Spaceship` as authoritative player state, `AsteroidBelt`) and the state within the Combat ECS world's components. `Combat.js` acts as a crucial bridge for player state sync. Modules often manage high-level intent/UI state, while ECS systems handle low-level entity state and interactions. `MessageBus` coordinates events between modules and systems. `DifficultyManager` logic applied in `game.js`/`main.js`. `Settings.js` uses `localStorage`.

## 6. API Documentation

-   **Internal APIs (MessageBus Events):** Used for decoupled communication between modules.
    -   `game.over`: Triggered when the game ends (player destroyed, etc.)
    -   `player.damage`: Triggered when the player takes damage
    -   `player.death`: Triggered when the player dies
    -   `player.docked`: Triggered when the player docks with the stargate
    -   `player.undocked`: Triggered when the player undocks from the stargate
    -   `player.mining.start`: Triggered when the player starts mining
    -   `player.mining.stop`: Triggered when the player stops mining
    -   `player.mining.complete`: Triggered when the player completes mining an asteroid
    -   `deployment.laser`: Triggered when the player deploys a space laser turret
    -   `pickup.laser`: Triggered when the player picks up a space laser turret
    -   `vfx.explosion`: Triggered to create an explosion effect, also used for anomaly orb collection
    -   `enemy.destroyed`: Triggered when an enemy is destroyed
    -   `intro.completed`: Triggered when the intro sequence completes
    -   `transform.updated`: Triggered when an entity's transform is updated
-   **External APIs (`apiClient.js`):**
    -   Used by `customSystemCreator.js` for AI-powered star system creation
    -   Handles API requests for custom skybox and planet generation

## 7. Configuration

-   **Settings.js:** Manages game settings via `localStorage`
    -   Graphics settings: resolution, quality, frame rate cap
    -   Audio settings: master volume, effects volume, music volume
    -   Control settings: sensitivity, invert Y axis, etc.
    -   These settings are applied during game initialization in `main.js`

## 8. Dependencies

-   **Three.js (r175):** Core 3D library for rendering and math operations.
    -   *Version:* Specified as `0.175.0` in `index.html` import map.
-   **NippleJS:** JavaScript library for creating virtual joysticks used in mobile controls.
    -   *Version:* 0.10.1, dynamically loaded via CDN in `touchControls.js`.
    -   *URL:* 'https://cdnjs.cloudflare.com/ajax/libs/nipplejs/0.10.1/nipplejs.min.js'
-   **Tone.js:** Web Audio framework used in the intro sequence for audio synthesis.
    -   *Version:* Latest version loaded via unpkg CDN in `index.html`.
-   **External AI API:** Used by the custom system creator feature.
    -   *Integration:* `apiClient.js` is used by `customSystemCreator.js` for skybox and planet generation.
    -   *Initialization:* The `CustomSystemCreator` is created in `environment.js` and accessed via the stargate interface.

## 9. Development Workflow

-   **Local Development:** Simple HTTP server to serve the files locally.
-   **Building:** No build step required as the game uses ES modules directly.
-   **Testing Approach:** Manual testing for gameplay features.

## 10. Special Considerations

-   **Performance:**
    -   **Object Pooling:** Two complementary systems: `ProjectilePoolManager` (Combat ECS effects) and `window.objectPool` (general effects). Enemy pooling via `EnemyPoolManager` within ECS.
    -   **Optimized ECS Components:** Components in `js/future/components/optimized/` and factory in `js/future/core/optimizedEntityFactory.js` implement Data-Oriented Design patterns with TypedArrays for better memory layout and performance. These are preserved for future scaling but not actively used in the main game.
    -   **DataStore:** The `js/future/core/dataStore.js` implements TypedArray-based data storage for transform and rigidbody components, enabling efficient batch processing. Currently preserved for future scaling but not actively used.
    -   **Rendering Optimizations:** Standard THREE.js techniques. ECS `RenderSystem` updates entity visuals. The `Combat` module pre-creates and reuses geometries/materials for better performance.
-   **State Management:** Hybrid: `Spaceship` class is authoritative for player state. Environment uses direct object management. Combat ECS manages state for enemies, projectiles, deployable laser turrets, and potentially interactions involving mining, docking, trading entities. `Combat.js` syncs player state between `Spaceship` and the ECS player entity. Clear separation between module-level (intent, UI, resource logic) and ECS system-level (entity state, physics, visuals) responsibilities for features like mining, docking, and deployment.
-   **Mobile vs. Desktop:**
    -   Separate UI components (`hud.js` vs `mobileHUD.js`).
    -   Separate high-level control handlers (`inputHandler.js` vs `touchControls.js` in `modules/controls/`).
    -   Potentially separate low-level ECS input systems (`inputSystem.js` vs `touchInputSystem.js` in `js/systems/input/`).
    -   Mobile CSS (`mobile.css`) dynamically loaded.
    -   NippleJS dynamically loaded for mobile joysticks.
    -   `js/modules/mobile/` directory exists as a placeholder for future mobile-specific modules.
-   **External API Dependency:**
    -   The custom system creation feature using `apiClient.js` and `customSystemCreator.js` is implemented.
    -   Initialized in `environment.js` and accessible through the stargate interface.
    -   This feature requires the external API to be available.
-   **Audio Context:** Audio Context suspension to handle browser restrictions.
-   **Asset Loading:** Asset paths are handled by `pathUtils.js` to support different deployment environments.
-   **Shader Pre-compilation:** The `Combat` module pre-compiles shaders during initialization to prevent stuttering during gameplay.
-   **Deployable Space Laser Turrets Feature:**
    -   Implements autonomous defense platforms that players can purchase, deploy, retrieve, and reuse.
    -   Feature cost: 1000 credits per turret, purchasable at the stargate.
    -   Integration with the Combat ECS world through dedicated components and systems:
        -   `DeployableLaserComponent`: Handles autonomous targeting and firing logic.
        -   `PickupableComponent`: Allows turrets to be retrieved by the player.
        -   `DeployableLaserSystem`: Manages targeting and firing behaviors.
        -   `DeploymentSystem`: Handles deployment and retrieval mechanics.
    -   Player can deploy turrets with 'T' key and retrieve them with 'G' key.
    -   Turrets have 1000m targeting radius with a 3-second firing cycle.
    -   Visual design includes a dark core with glowing red energy center, four orbiting emitter nodes, and dual intersecting orbital rings.
-   **Future Scaling Architecture:**
    -   The `js/future/` directory contains components, systems, and utilities preserved for future scaling.
    -   Includes Data-Oriented optimizations using TypedArrays (`dataStore.js`, `components/optimized/`).
    -   Includes instanced rendering systems for thousands of similar objects (`components/rendering/instancedMeshComponent.js`, `systems/rendering/instancedRenderSystem.js`).
    -   Includes factory for creating optimized entities (`core/optimizedEntityFactory.js`).
    -   Well-documented with READMEs explaining implementation strategies.
    -   Ready to be integrated when the game requires handling thousands of entities simultaneously.
-   **Space Anomalies Feature:**
    -   Implements 5 uniquely structured space anomalies with collectible energy orbs positioned outside asteroid belts.
    -   Anomaly types include Vortex, Crystal Cluster, Nebula Nexus, Quantum Flux, and Dark Matter, each with distinct visual style and animations.
    -   Energy orbs have 5 rarity levels (common, uncommon, rare, epic, legendary) with increasing value.
    -   Orbs are automatically collected when players navigate to the center of an anomaly.
    -   Collected orbs are stored in player inventory and can be sold at the stargate for credits.
    -   Visual effects for collection include particle animations and screen notifications with color-coded rarities.
    -   Integrated with existing resource management and stargate trading systems.
