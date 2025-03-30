# ARCHITECTURE.md

## 1. Project Overview

-   **Project Name:** Solar System Asteroid Miner (aminer)
-   **Purpose:** A 3D space mining simulation game playable in a web browser. Players navigate space, mine asteroids, trade resources, upgrade their ship, and engage in combat.
-   **Core Functionality:**
    -   3D Space Navigation & Physics Simulation
    -   Asteroid Mining & Resource Collection
    -   Ship Upgrades & Trading via Stargate Interface
    -   Combat System (Player vs AI Enemies)
    -   Multiple Star System Exploration (Including procedural/AI generation)
    -   Entity-Component-System (ECS) Architecture
    -   Mobile and Desktop Controls
-   **Main Technologies & Frameworks:**
    -   JavaScript (ES Modules)
    -   Three.js (r175+) for 3D rendering and core structures (Vectors, Quaternions, etc.)
    -   HTML5 & CSS3
    -   Custom ECS Implementation
    -   NippleJS (for mobile touch joysticks)
    -   Tone.js (for intro sequence audio synthesis)
    -   External AI API (Optional, via `apiClient.js`) for custom system generation (likely FastAPI/Google Gemini based on README hints).
-   **System Architecture Type:** Client-Side Monolith with a custom Entity-Component-System (ECS) architecture. Includes Data-Oriented Design (DOD) optimizations via `DataStore`. Communicates with an external API for optional AI content generation.

## 2. Complete File Structure
Use code with caution.
Markdown
aminer_0.4.15_flat/
css/ # CSS Stylesheets
custom-system.css # Styles for the custom system creator UI
mobile.css # Specific styles for mobile devices
js/ # JavaScript source code
components/ # ECS Components (Data)
combat/ # Combat-related components
enemyAI.js
healthComponent.js # [CORE] Handles entity health and shields
common/ # Common components
mining/ # Mining-related components
mineable.js
optimized/ # Optimized components using DataStore
rigidbodyComponent.js # [CORE-OPTIMIZED] Physics properties (DataStore)
transformComponent.js # [CORE-OPTIMIZED] Position, rotation, scale (DataStore)
physics/ # Standard physics components
rigidbody.js # [CORE-STANDARD] Physics properties (Standard Object)
rendering/ # Rendering-related components
instancedMeshComponent.js # [CORE-OPTIMIZED] For efficient rendering of many similar objects
mesh.js # [CORE-STANDARD] Standard Three.js mesh wrapper
trail.js # Component for rendering entity trails
spaceship/ # Spaceship-specific components
cargo.js # [DEPRECATED?] May be superseded by cargoComponent.js
cargoComponent.js # Handles ship cargo hold
miningLaser.js # Component for mining laser capabilities
shipState.js # Holds high-level ship state (docked, fuel, upgrades) - Bridges ECS and legacy state?
thruster.js # Handles ship thruster logic and effects
transform.js # [CORE-STANDARD] Standard position, rotation, scale (Standard Object)
core/ # Core ECS framework and managers
component.js # [CORE] Base class for all components
dataStore.js # [CORE-OPTIMIZED] Data storage for optimized components (DOD approach)
difficultyManager.js # Manages game difficulty scaling over time
entity.js # [CORE] Base class for entities
entityManager.js # [CORE] Manages entity creation, destruction, and querying
messageBus.js # [CORE] Central event bus for system communication
optimizedEntityFactory.js # Factory for creating entities with optimized components
system.js # [CORE] Base class for all systems
systemManager.js # [CORE] Manages system registration and updates
world.js # [CORE] Main ECS world container
entities/ # Entity factory/prefab functions
spaceship.js # Functions to create spaceship and asteroid entities
examples/ # Example usage code
optimizedEcsUsage.js
optimizedRenderingUsage.js
modules/ # Higher-level game feature modules
combat/ # Combat management logic
combatManager.js # Manages combat state (seems like an adapter/bridge?)
controls/ # Input handling and control systems
dockingSystem.js # Logic for docking/undocking with stargate
inputHandler.js # Handles keyboard/mouse input (Desktop)
miningSystem.js # Handles mining logic and UI interaction
targetingSystem.js # Handles target locking and cycling
touchControls.js # Handles touch input (Mobile)
environment/ # World environment elements
asteroidBelt.js # Generates and manages the asteroid belt
stargate.js # Creates and manages the stargate object
planets.js # Creates and manages planets in the system
skybox.js # Creates and manages the space skybox
starDreadnought.js # Creates the Star Dreadnought model (for intro?)
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
utils/ # Utility modules
apiClient.js # Client for interacting with the external AI API
audio.js # Manages audio playback and context
combat.js # Main combat logic (Higher level than systems?)
controls.js # Main controls coordinator module
environment.js # Main environment coordinator module
game.js # Main game loop and state management (Acts as central coordinator)
introSequence.js # Manages the game's intro sequence
physics.js # Main physics coordination (Applies forces based on input)
renderer.js # Main rendering setup and coordination (Three.js)
spaceship.js # Main spaceship state and logic class (Acts as bridge/legacy state?)
ui.js # Main UI coordinator module
systems/ # ECS Systems (Logic)
combat/ # Combat-related systems
combatSystem.js # Processes combat interactions (damage, etc.)
enemyLifecycle.js # Handles enemy state validation and transitions
enemyPoolManager.js # Manages pooling of enemy objects for performance
enemySpawner.js # Handles spawning of enemies
enemySystem.js # Manages enemy AI and behavior updates
docking/ # Docking-related systems
dockingSystem.js # Processes docking/undocking state logic
entity/ # Entity state systems
healthSystem.js # Updates health, shields, handles destruction logic
input/ # Input processing systems
inputSystem.js # Processes raw keyboard/mouse input (Desktop)
shipControlSystem.js # Applies input to ship movement/actions
touchInputSystem.js # Processes raw touch input (Mobile)
mining/ # Mining-related systems
miningSystem.js # Handles mining interactions and resource collection
physics/ # Physics simulation systems
collisionSystem.js # Detects and resolves collisions
movementSystem.js # [CORE-STANDARD] Updates entity position/rotation based on physics (Standard)
optimizedMovementSystem.js # [CORE-OPTIMIZED] Updates entity position/rotation (Optimized via DataStore)
rendering/ # Rendering update systems
cameraSystem.js # Manages camera position and behavior (e.g., following player)
instancedRenderSystem.js # [CORE-OPTIMIZED] Updates and manages instanced meshes
renderSystem.js # [CORE-STANDARD] Updates standard mesh positions/visibility
trailSystem.js # Updates and renders entity trails
visualEffectsSystem.js # Manages creation and updating of visual effects (explosions, etc.)
trading/ # Trading-related systems
tradingSystem.js # Handles resource trading and upgrades at stargate
tests/ # Test files
renderingPerformanceTest.js # Compares standard vs instanced rendering
utils/ # Utility classes and functions
memoryManager.js # Utilities for memory pooling (TypedArrays, Vectors)
mobileDetector.js # Detects if the user agent is mobile
pathUtils.js # Utility for handling asset paths depending on environment
main.js # [ENTRY POINT] Initializes the game and starts the main loop
index.html # [ENTRY POINT] Main HTML file, loads scripts
README.md # Project README file (this file)

## 3. Core Components

### `js/core/`
-   **Purpose:** Provides the fundamental building blocks for the Entity-Component-System (ECS) architecture and Data-Oriented Design (DOD) optimizations.
-   **Key Files:**
    -   `entity.js`: Defines the `Entity` class, which acts as a container for components and tags.
    -   `component.js`: Base class for all components (data containers).
    -   `system.js`: Base class for all systems (logic processors).
    -   `entityManager.js`: Manages the lifecycle and querying of entities. Stores entities by ID, tag, and potentially component types. Includes entity recycling.
    -   `systemManager.js`: Manages the registration, ordering (by priority), and updating of systems.
    -   `world.js`: Orchestrates the ECS, holding references to the EntityManager and SystemManager, and managing the main update loop timing (`deltaTime`).
    -   `messageBus.js`: A publish/subscribe event bus for inter-system communication, decoupling systems. Handles event queueing. Critical for coordinating actions.
    -   `dataStore.js`: Implements `ComponentDataStore` base class and specific stores (`TransformDataStore`, `RigidbodyDataStore`) using TypedArrays for optimized, cache-friendly data access (DOD).
    -   `optimizedEntityFactory.js`: Helper functions to create entities pre-configured with optimized components.
    -   `difficultyManager.js`: Scales game difficulty based on time elapsed. Adjusts enemy stats and spawn rates.
-   **Interactions:** `World` uses `EntityManager` and `SystemManager`. `Systems` query `EntityManager` for entities and interact via `MessageBus`. `Optimized` Components/Systems rely heavily on `DataStore`.

### `js/components/`
-   **Purpose:** Defines the data associated with entities. Components are simple data containers. Divided into standard (object-based) and optimized (DataStore-based) versions.
-   **Key Files/Subdirectories:**
    -   `transform.js` / `optimized/transformComponent.js`: Position, rotation, scale. Fundamental for all positioned entities. Optimized version uses `TransformDataStore`.
    -   `physics/rigidbody.js` / `optimized/rigidbodyComponent.js`: Mass, velocity, forces, drag. Used by physics systems. Optimized version uses `RigidbodyDataStore`.
    -   `rendering/mesh.js` / `rendering/instancedMeshComponent.js`: Represents visual geometry and material. Standard uses `THREE.Mesh`, optimized uses `THREE.InstancedMesh` for performance.
    -   `combat/healthComponent.js`: Implementation used by combat systems for health, shields, damage handling. Contains functionality like damage resistance and integration with player sync events.
    -   `combat/enemyAI.js`: Holds AI state and parameters (faction, type, detection range, speed, behavior logic like spiraling).
    -   `mining/mineable.js`: Data for mineable entities (resource type, amount, difficulty).
    -   `spaceship/`: Components specific to the player's ship (Cargo, MiningLaser, Thruster, ShipState). `ShipState` holds high-level game state that bridges ECS and the Spaceship class.
-   **Interactions:** Components are added to Entities via `entity.addComponent()`. Systems query entities based on the components they possess using `entityManager.getEntitiesWithComponents()`. Optimized components interact directly with their respective `DataStore`.

### `js/systems/`
-   **Purpose:** Implements the game logic by operating on entities that possess specific sets of components.
-   **Key Files/Subdirectories:**
    -   `physics/movementSystem.js` / `physics/optimizedMovementSystem.js`: Update entity positions based on velocity, forces, and drag. Optimized version reads/writes directly to DataStores.
    -   `physics/collisionSystem.js`: Detects and resolves collisions between entities based on `RigidbodyComponent` data. Uses spatial grid partitioning (`cells`) for optimization.
    -   `rendering/renderSystem.js` / `rendering/instancedRenderSystem.js`: Updates visual representations. Standard system updates `THREE.Mesh` transforms. Optimized system updates `THREE.InstancedMesh` matrices. Includes frustum culling.
    -   `rendering/cameraSystem.js`: Controls the game camera, often following the player entity.
    -   `combat/`: Includes `CombatSystem` (damage processing), `EnemySystem` (AI updates, spawning via `EnemySpawner`, pooling via `EnemyPoolManager`, state via `EnemyLifecycle`), `HealthSystem` (health/shield updates).
    -   `input/`: `InputSystem` (raw input capture), `TouchInputSystem` (mobile), `ShipControlSystem` (translates input actions into forces/component state changes).
    -   `mining/miningSystem.js`: Processes mining interactions between player and mineable entities.
    -   `docking/dockingSystem.js`: Manages docking state logic.
    -   `trading/tradingSystem.js`: Handles resource trading and upgrade logic when docked.
    -   `rendering/visualEffectsSystem.js`: Creates and manages temporary visual effects like explosions.
    -   `rendering/trailSystem.js`: Manages and updates entity trails.
-   **Interactions:** Systems are managed by `SystemManager` in `World`. They typically fetch relevant entities from `EntityManager` each frame and operate on their components. They communicate indirectly via `MessageBus` or by modifying component data that other systems read.

### `js/modules/`
-   **Purpose:** Encapsulates higher-level game features and logic, often acting as coordinators or bridges between the ECS core and specific game functionalities (UI, Input, Environment setup).
-   **Key Files/Subdirectories:**
    -   `game.js`: The main game class, orchestrating initialization, the main loop, and connections between major modules (Renderer, Physics, UI, Controls, etc.). Holds central game state like `isGameOver`.
    -   `renderer.js`: Sets up the Three.js renderer, scene, camera, lighting, and post-processing effects. Manages the rendering loop.
    -   `spaceship.js`: Represents the player's spaceship. Acts as the authoritative source of player state, while syncing to ECS components.
    -   **Key Elements:** `Spaceship` class, properties like `hull`, `shield`, `fuel`, `credits`, `cargo`, upgrade levels. Methods for `dock()`, `undock()`, `refuel()`, `repair()`, `upgrade()`. `syncValuesToHealthComponent` actively pushes state to ECS components.
    -   `physics.js`: Coordinator for physics simulation. Directly applies forces to the spaceship object based on controls. Works in parallel with the ECS physics systems (not as a bridge) to handle player ship movement.
    -   `environment.js`: Manages the setup and updating of the game world environment (Skybox, Sun, Planets, AsteroidBelt, Stargate). Uses `StarSystemGenerator` for procedural content and manages system transitions.
    -   `controls.js`: Coordinates input handling (Desktop/Mobile), mining, targeting, and docking logic. Bridges raw input with actions affecting the spaceship or ECS systems.
    -   `ui.js`: Manages all UI elements (HUD, Menus, Screens). Coordinates updates to UI based on game state.
    -   `combat.js`: Higher-level combat coordinator that creates and manages its own ECS world specifically for combat features. Handles projectile creation, firing logic, and bridges game state with enemy systems.
    -   `audio.js`: Manages loading and playback of sound effects and background music using Web Audio API.
    -   `introSequence.js`: Handles the game's introductory cutscene.
    -   `utils/apiClient.js`: Handles communication with the external AI API for custom system generation. Used exclusively by the `customSystemCreator.js` UI module.
    -   `controls/targetingSystem.js`: Handles targeting logic, lock-on mechanics, and asteroid scanning. Manages in-game reticles and target selection.
    -   `ui/targetingUI.js`: Handles UI components for target display. Creates and updates the targeting HUD elements in the DOM.
-   **Interactions:** Modules often hold references to each other (`Game` holds references to most others). They interact with the ECS world (`game.combat.world`, `game.scene.ecsWorld`). They manage specific game aspects and provide interfaces for other parts of the game.

## 4. File Explanations

*   **`main.js`**:
    *   **Path:** `js/main.js`
    *   **Purpose:** Entry point for the JavaScript application. Initializes the main `Game` class and potentially sets up global configurations or pools (like `vectorPool`). Starts the game loop.
    *   **Key Elements:** Imports core modules (`Game`), instantiates `Game`, potentially sets up global error handling or initial configuration.
    *   **Dependencies:** `Game` class, core modules implicitly.
*   **`js/core/world.js`**:
    *   **Path:** `js/core/world.js`
    *   **Purpose:** Represents the ECS world. Owns the `EntityManager` and `SystemManager`. Manages the main update tick (`deltaTime`, `time`).
    *   **Key Elements:** `World` class, `entityManager`, `systemManager`, `messageBus`, `update()` method (core loop logic).
    *   **Dependencies:** `EntityManager`, `SystemManager`, `MessageBus`.
*   **`js/core/entityManager.js`**:
    *   **Path:** `js/core/entityManager.js`
    *   **Purpose:** Manages all entities in the world. Handles creation, destruction, tagging, and retrieval of entities. Implements entity pooling/recycling.
    *   **Key Elements:** `EntityManager` class, `entities` Map, `entitiesByTag` Map, `createEntity()`, `destroyEntity()`, `getEntitiesByTag()`, `getEntitiesWithComponents()`, `onTagAdded/Removed`.
    *   **Dependencies:** `Entity`.
*   **`js/core/systemManager.js`**:
    *   **Path:** `js/core/systemManager.js`
    *   **Purpose:** Manages all registered systems. Executes system updates in order of priority.
    *   **Key Elements:** `SystemManager` class, `systems` array, `registerSystem()`, `update()`, `initialize()`.
    *   **Dependencies:** `System` (base class).
*   **`js/core/messageBus.js`**:
    *   **Path:** `js/core/messageBus.js`
    *   **Purpose:** Decoupled event bus for communication between different parts of the application (especially systems).
    *   **Key Elements:** `MessageBus` class, `subscribe()`, `unsubscribe()`, `publish()`. Uses a queue for handling nested publishes. Special handling for `game.over`. Static `triggerGameOver` method.
    *   **Dependencies:** None.
*   **`js/core/dataStore.js`**:
    *   **Path:** `js/core/dataStore.js`
    *   **Purpose:** Implements Data-Oriented Design (DOD) storage for optimized components using TypedArrays. Improves cache locality and allows for faster batch processing.
    *   **Key Elements:** `ComponentDataStore` base class, `TransformDataStore`, `RigidbodyDataStore`. Manages allocation/deallocation of entity data within large TypedArrays. Provides getters/setters for component properties based on entity ID.
    *   **Dependencies:** `THREE` (for Vector3/Quaternion in getters).
*   **`js/modules/game.js`**:
    *   **Path:** `js/modules/game.js`
    *   **Purpose:** Central coordinator for the entire game. Initializes all major modules, manages the main animation loop, handles game state transitions (like game over).
    *   **Key Elements:** `Game` class, references to `Renderer`, `Physics`, `Environment`, `Controls`, `UI`, `Combat`, `Audio`. `animate()` loop, `gameOver()` logic. Subscribes to critical `messageBus` events.
    *   **Dependencies:** All major module classes, `MessageBus`, `DifficultyManager`, `IntroSequence`.
*   **`js/modules/spaceship.js`**:
    *   **Path:** `js/modules/spaceship.js`
    *   **Purpose:** Represents the player's ship state and core attributes. Acts as the authoritative source of player state, while syncing to ECS components.
    *   **Key Elements:** `Spaceship` class, properties like `hull`, `shield`, `fuel`, `credits`, `cargo`, upgrade levels. Methods for `dock()`, `undock()`, `refuel()`, `repair()`, `upgrade()`. `syncValuesToHealthComponent` actively pushes state to ECS components.
    *   **Dependencies:** `THREE`.
*   **`js/systems/physics/optimizedMovementSystem.js`**:
    *   **Path:** `js/systems/physics/optimizedMovementSystem.js`
    *   **Purpose:** Updates entity positions and rotations based on physics data stored in `TransformDataStore` and `RigidbodyDataStore`. Designed for performance.
    *   **Key Elements:** `OptimizedMovementSystem` class, directly accesses and modifies TypedArrays in `DataStore`s (`transformStore`, `rigidbodyStore`). Batch processes entities.
    *   **Dependencies:** `System`, `OptimizedTransformComponent`, `OptimizedRigidbodyComponent`, `THREE`.
*   **`js/systems/rendering/instancedRenderSystem.js`**:
    *   **Path:** `js/systems/rendering/instancedRenderSystem.js`
    *   **Purpose:** Manages and updates `THREE.InstancedMesh` objects for rendering large numbers of similar entities efficiently.
    *   **Key Elements:** `InstancedRenderSystem` class, interacts with `InstancedMeshComponent` static methods and updates instance matrices based on entity transforms. Implements frustum culling and basic LOD.
    *   **Dependencies:** `System`, `InstancedMeshComponent`, `OptimizedTransformComponent`, `TransformComponent`, `THREE`.
*   **`js/modules/utils/apiClient.js`**:
    *   **Path:** `js/modules/utils/apiClient.js`
    *   **Purpose:** Handles all communication with the external AI API for generating skyboxes and planet textures. Manages authentication (JWT).
    *   **Key Elements:** `ApiClient` class, methods like `getToken`, `generateSkybox`, `generatePlanet`. Handles API base URL based on environment. Error handling for common HTTP statuses (401, 429).
    *   **Dependencies:** None. Used exclusively by `customSystemCreator.js`.

## 5. Data Models

-   **Primary Data Model:** Entity-Component-System (ECS).
    -   **Entities:** Simple IDs (`entity.js`).
    -   **Components:** Data containers (`components/`). Key components include:
        -   `TransformComponent`/`OptimizedTransformComponent`: Position (Vec3), Rotation/Quaternion (Euler/Quat), Scale (Vec3).
        -   `RigidbodyComponent`/`OptimizedRigidbodyComponent`: Velocity (Vec3), AngularVelocity (Vec3), Mass (float), Drag (float), Forces (Vec3), Torque (Vec3), CollisionRadius (float), Flags (isKinematic, etc.).
        -   `HealthComponent`: Health (float), MaxHealth (float), Shield (float), MaxShield (float), Regeneration rates/delays, isDestroyed (bool).
        -   `CargoComponent`: MaxCapacity (float), CurrentCapacity (float), Resources (Map<string, float>).
        -   `MineableComponent`: ResourceType (string), TotalAmount (float), RemainingAmount (float), Difficulty (float).
        -   `EnemyAIComponent`: State parameters, detection range, speed, damage, behavior flags.
        -   `MeshComponent`/`InstancedMeshComponent`: Reference to `THREE.Mesh` or instance data (matrix, color).
-   **Optimized Data Storage (`DataStore`):**
    -   Uses large TypedArrays (`Float32Array`, `Uint8Array`) to store component data contiguously.
    -   Entities are mapped to indices within these arrays.
    -   Improves cache performance for systems processing many entities (e.g., `OptimizedMovementSystem`).
    -   Primarily used for asteroid fields, enemy ships, and other entities that benefit from batch processing.
-   **Spaceship State Management (`js/modules/spaceship.js`):**
    -   The `Spaceship` class is the authoritative source for player state (hull, shield, fuel, credits, cargo, upgrades).
    -   Uses `syncValuesToHealthComponent` to push state to the player entity's ECS components when changes occur.
    -   This bridging approach allows the game to have a central object for player state while still integrating with the ECS framework.
    -   Updates happen in both directions - changes to the Spaceship object are pushed to ECS components, and the Spaceship receives updates from ECS events.
-   **Data Flow:**
    -   Input Systems (`InputSystem`, `TouchInputSystem`) -> `MessageBus` ('input.*' events).
    -   `ShipControlSystem` consumes input events -> Modifies `ThrusterComponent` state or applies forces via `RigidbodyComponent`.
    -   `MovementSystem` updates `TransformComponent` based on `RigidbodyComponent` velocity/forces.
    -   `RenderSystem`/`InstancedRenderSystem` read `TransformComponent` -> Update `MeshComponent`/`InstancedMeshComponent` visuals.
    -   `CollisionSystem` reads `TransformComponent`, `RigidbodyComponent` -> Publishes 'collision.*' events via `MessageBus`.
    -   `CombatSystem` handles 'collision.*' events or direct weapon firing -> Modifies `HealthComponent`.
    -   `HealthSystem` updates health/shields -> Publishes 'entity.destroyed' etc. via `MessageBus`.
    -   `EnemySystem` updates `EnemyAIComponent`, spawns enemies (`EnemySpawner`), manages pooling (`EnemyPoolManager`).
    -   `MiningSystem` updates `MineableComponent` and adds resources to player `CargoComponent`.
    -   `TradingSystem` interacts with `CargoComponent` and `ShipStateComponent` (for credits/upgrades).
    -   `Spaceship` module pulls and pushes state to/from ECS components via `syncValuesToHealthComponent`.
    -   `UI` modules read game state (from `Spaceship` class or ECS components) -> Update DOM.
-   **State Management:** Mix of ECS component state and object-oriented state in the `Spaceship` class. `MessageBus` coordinates state changes across systems. `DifficultyManager` manages global difficulty state. `Settings.js` manages user preferences via `localStorage`.

## 6. API Documentation

-   **Internal APIs (MessageBus Events):** The primary method of inter-system communication. Key events include:
    -   `entity.created`, `entity.destroyed`
    -   `component.added`, `component.removed`
    -   `input.keyDown`, `input.keyUp`, `input.mouseMove`, `input.mouseDown`, `input.mouseUp`, `input.thrust`, `input.rotate`
    -   `weapon.startFiring`, `weapon.stopFiring`, `weapon.fired`
    -   `mining.start`, `mining.stop`, `mining.progress`, `mining.resourceMined`, `mining.targetDepleted`, `mining.outOfRange`, `mining.cargoFull`
    -   `collision.detected`, `collision.trigger`, `projectile.hit`
    -   `player.docked`, `player.undocked`, `player.requestDock`, `player.requestUndock`, `player.nearStargate`, `player.leftStargate`, `player.syncHealth`
    -   `trading.*` (sellResource, buyUpgrade, refuel, repair)
    -   `vfx.explosion`, `vfx.damageFlash`
    -   `game.over` (Critical event)
    -   `game.introStart`, `game.introEnd`
    -   `camera.set`, `camera.request`
    -   `score.enemyDestroyed`
    -   `system.error`
    -   *Format:* Typically `{ type: string, data: object, timestamp: number }` passed to subscribers.
-   **External APIs (`apiClient.js`):**
    -   **Base URL:** Determined dynamically (`http://localhost:8001` for local, `https://aminer-skybox-generator-833fe937a945.herokuapp.com` for hosted).
    -   **Authentication:** JWT Bearer Token.
        -   `/token` (POST): Requests a token using `client_id`. Token seems to last 1 hour. Handled automatically by `ApiClient`.
    -   **Endpoints:**
        -   `/generate-skybox` (POST):
            -   Request Body: `{ system_name: string, skybox_description: string }`
            -   Response Body: `{ success: bool, message?: string, image_paths?: string[] }`
        -   `/generate-planet` (POST):
            -   Request Body: `{ planet_name: string, planet_description: string }`
            -   Response Body: `{ success: bool, message?: string, image_paths?: string[] }`
    -   **Notes:** Used exclusively by the `CustomSystemCreator` UI module. Requires API backend to be running.

## 7. Configuration

-   **Environment Variables:** No explicit use shown, but API base URL determination in `apiClient.js` implies sensitivity to `window.location.hostname`.
-   **Configuration Files:** None explicitly shown. Game settings are managed via:
    -   `js/modules/ui/settings.js`: Loads/saves settings to `localStorage` under the key `asteroidMinerSettings`. Includes graphics quality, post-processing, detail levels, frame rate cap, etc.
-   **Build/Deployment:**
    -   Seems to be a simple static file setup (no complex build process evident).
    -   Deployment mentioned for GitHub Pages (frontend) and Heroku (API backend). `pathUtils.js` adjusts asset paths based on the environment.

## 8. Dependencies

-   **Three.js (r175+):** Core 3D library for rendering, math operations (Vectors, Quaternions, Matrices), geometry, materials, loaders (GLTF), post-processing effects.
    -   *Purpose:* Rendering, 3D math, scene graph.
    -   *Version:* Specified as `0.175.0` in `index.html` import map.
-   **NippleJS (0.10.1):** JavaScript library for creating virtual joysticks.
    -   *Purpose:* Mobile touch controls.
    -   *Version:* Specified in `touchInputSystem.js` CDN link.
-   **Tone.js:** Web Audio framework.
    -   *Purpose:* Used in `introSequence.js` for generating specific sound effects synthesis.
    -   *Version:* Loaded via CDN in `index.html` (version not specified in URL).
-   **External AI API:** (Likely FastAPI/Google Gemini)
    -   *Purpose:* AI-powered generation of skybox and planet textures for the custom system creator feature.

## 9. Development Workflow

-   **Build Process:** Appears minimal. Likely involves serving the static files (`index.html`, `js/`, `css/`, `assets/`) using a local web server. No transpilation or bundling step is evident from the provided files.
-   **Testing Approach:** Limited automated testing. `js/tests/renderingPerformanceTest.js` exists for comparing standard vs. instanced rendering. Manual testing is likely the primary method.
-   **Development Environment Setup:** Requires a local web server to serve the files due to ES Module usage and potentially asset loading restrictions. Node.js might be used for the server, but not strictly required for the client code itself.
-   **Deployment Pipeline:**
    -   Frontend (Game): Static files hosted on GitHub Pages. `pathUtils.js` handles asset path adjustments.
    -   Backend (API): FastAPI application hosted on Heroku (as inferred from `apiClient.js` and README).

## 10. Special Considerations

-   **Performance:** Significant focus on optimization:
    -   Instanced Rendering (`InstancedMeshComponent`, `InstancedRenderSystem`) for asteroids/enemies.
    -   Optimized Components/Systems (`OptimizedTransformComponent`, `OptimizedRigidbodyComponent`, `OptimizedMovementSystem`) using `DataStore` (DOD approach).
    -   Object Pooling (`EnemyPoolManager`, potential use in `visualEffectsSystem`, `memoryManager.js`).
    -   Frustum Culling in rendering systems.
    -   Graphics settings allow users to tune performance.
-   **State Management:** Potential complexity due to dual state management: the ECS components (`HealthComponent`, `CargoComponent`, `ShipStateComponent`) and the `js/modules/spaceship.js` class properties. Synchronization (`syncValuesToHealthComponent`) is crucial and a potential source of bugs.
-   **Mobile vs. Desktop:** Separate UI (`hud.js` vs `mobileHUD.js`), controls (`inputHandler.js` vs `touchControls.js` / `touchInputSystem.js`), and CSS (`mobile.css`) are used. `MobileDetector.js` handles detection. Needs careful testing on both platforms.
-   **External API Dependency:** The custom system creation feature relies on an external API (`apiClient.js`). This feature will fail if the API is unavailable. Error handling and user feedback for API issues are important.
-   **Audio Context:** Web Audio API requires user interaction to start. The `AudioManager` includes logic to handle this (`setupUserInteractionListener`). Music playback might be delayed until interaction.
-   **Code Duplication:** `TargetingSystem` appears in both `modules/controls` and `modules/ui`, likely representing logic vs UI parts, but naming could be clearer.
-   **Cargo Component Consolidation:** Resolved ambiguity between `cargo.js` and `cargoComponent.js` in the `js/components/spaceship/` directory. Only `cargo.js` is used in the codebase (imported in `js/entities/spaceship.js`), with systems referring to it as 'CargoComponent'. The unused `cargoComponent.js` file has been deleted.
-   **Error Handling:** Some basic error handling exists (e.g., `apiClient.js`, audio loading), but robustness could be improved, especially around API calls and ECS entity/component access.
-   **Legacy Code?:** The existence of both standard and optimized components/systems, plus the `Spaceship` module managing state alongside ECS components, might indicate ongoing refactoring or a mix of architectural patterns.
-   **Asset Loading:** Relies on assets being available at specific paths (`assets/`, `sounds/`). `pathUtils.js` attempts to manage path differences between local dev and GitHub Pages deployment.
