# Solar System Asteroid Miner - Technical Architecture

## Overview

Solar System Asteroid Miner is a 3D browser-based space simulation game built with Three.js and an Entity Component System (ECS) architecture. This document provides a technical overview of the game's architecture, systems, and implementation details.

## Core Architecture

The game is built around an Entity Component System (ECS) architecture, providing a modular and extensible framework:

### ECS Implementation

The game uses a custom ECS (Entity Component System) architecture that separates data (Components) from behavior (Systems), with Entities acting as containers. This approach enables high performance, code organization, and modularity.

The core elements of the ECS implementation are:

- **Entities**: Containers for components identified by unique IDs with optional tags
- **Components**: Pure data containers that define entity properties and state
- **Systems**: Process entities with specific component requirements in priority order
- **World**: Central coordinator that manages entities, systems, and messaging

#### Data Flow
1. World manages the game simulation state and time tracking
2. EntityManager handles entity creation, destruction, and querying
3. SystemManager prioritizes and executes systems each frame
4. Systems process entities that have required components
5. MessageBus enables decoupled communication between systems
6. Components store entity-specific data that systems process
7. Data-oriented storage with typed arrays provides performance optimization

The ECS implementation is enhanced with performance optimizations like object pooling, tag caching, data-oriented design, and specialized factories for common entity types.

#### Performance Optimization Strategies

The ECS implementation incorporates several key performance optimization techniques:

- **Data-Oriented Design**:
  - Component data separated from behavior for cache efficiency
  - Typed arrays for numerical data (positions, velocities, etc.)
  - Contiguous memory layout through specialized DataStore classes
  - Minimized indirection for hot path operations

- **Memory Management**:
  - Entity recycling pool to minimize garbage collection
  - Pre-allocated component arrays with fixed maximum size
  - Index recycling within DataStore for reusing memory slots
  - Object pooling for frequently created/destroyed entities

- **Caching Strategies**:
  - Direct property access for frequently checked tags (`_isEnemy`, `_isPlayer`, etc.)
  - Entity list caching in systems with dirty flag for invalidation
  - Reusable vector objects with object pooling for calculations
  - Optimized message dispatch for high-frequency events

- **Algorithmic Optimizations**:
  - O(1) entity lookups using Maps and indices
  - Specialized fast paths for common operations
  - Batch processing entities with similar components
  - Tag-based filtering using Set data structures
  - Event-based updates to avoid polling

These techniques significantly reduce CPU usage, minimize memory churn, and maintain consistent frame rates, especially during intensive gameplay with numerous entities.

#### Entity Class (`js/core/entity.js`)

- Base class for all game objects in the game world
- Contains a unique ID and Map collection of components
- Maintains a Set of tags for categorization (player, enemy, projectile)
- Implements performance-critical tag caching for `player`, `enemy`, `projectile`, and `pooled` tags
  - Uses direct property access via `_isEnemy`, `_isPlayer`, `_isProjectile`, and `_isPooled` flags
  - Significantly faster than Set lookups for frequently checked tags
  - Includes cache consistency checking and automatic repair
- Provides methods for component and tag management:
  - Components can be retrieved by class reference or string name
  - Component addition/removal triggers lifecycle hooks
  - Tag changes update EntityManager indices
- Implements error detection and self-repair for tag registration failures
  - Logs errors when entity tags fail to register properly
  - Automatically fixes tag registration with manual fallback
  - Verifies tag consistency between cache and actual tags
- Publishes events to MessageBus for component/tag changes:
  - `component.added`, `component.removed`
  - `tag.added`, `tag.removed` (via EntityManager)

#### Component Class (`js/core/component.js`)

- Pure data containers with minimal logic
- Bi-directional reference with parent entity for context access
- Lifecycle hooks for state changes:
  - `onAttached()` - Called when added to an entity
  - `onDetached()` - Called when removed from an entity
  - `onEnabled()` - Called when component is enabled
  - `onDisabled()` - Called when component is disabled
- Enable/disable functionality for selectively activating behavior
- Chainable methods for fluent API (return `this`)
- Lifecycle hooks are only triggered when state actually changes

#### System Class (`js/core/system.js`)

- Processes entities with specific component requirements
- Priority-based execution order (lower values execute earlier)
- Component-based entity filtering via `requiredComponents` array
- Default implementation for entity iteration and processing:
  - `update(deltaTime)` - Processes all matching entities
  - `processEntity(entity, deltaTime)` - Processes individual entities
  - `initialize()` - Called once when system is registered with SystemManager
- Entity validation:
  - `checkEntity(entity)` - Verifies entity has all required components
  - `getEntities()` - Returns all compatible entities from the world
- Enable/disable functionality for toggling entire systems
- Automatic entity filtering by required component types

#### OptimizedEntityFactory (`js/core/optimizedEntityFactory.js`)

- Factory pattern for creating common entity types with optimized components
- Creates entities with pre-configured optimized component sets
- Utility methods for creating:
  - `createBasicEntity` - Basic entities with transform components
  - `createPhysicsEntity` - Physics entities with transform and rigidbody
  - `createAsteroid` - Asteroids with randomized properties:
    - Random rotation and angular velocity
    - Slight scale variation for visual diversity
    - Proper collision radius setup
  - `createProjectile` - Projectiles with directional velocity:
    - Automatic direction normalization
    - Look-at functionality for proper orientation
    - Speed-based velocity setting
    - Appropriate physics properties (low mass, small collision radius)
- Integrates with optimized component implementations:
  - OptimizedTransformComponent for positioning
  - OptimizedRigidbodyComponent for physics
- Sets appropriate tags and physics parameters automatically
- Configures entity properties through unified interface
- Uses sensible defaults to reduce boilerplate code

#### ComponentDataStore (`js/core/dataStore.js`)

- Data-oriented storage system for component data
- Uses typed arrays for cache-coherent memory layout
- Separates component data from entity references for improved performance
- Implements index recycling to reuse memory allocations
- Core API:
  - `allocate(entityId)` - Reserves space in the typed arrays 
  - `free(entityId)` - Returns space to the pool for reuse
  - `getIndex(entityId)` - Maps entity IDs to array indices
  - `hasEntity(entityId)` - Checks if an entity has this component
- Features:
  - Entity-to-index mapping for fast lookups
  - Typed array storage for numeric properties
  - Array index reuse to minimize memory fragmentation
  - Automatic cleanup and index reclamation
  - Optimized batch operations for high-performance updates
- Specialized implementations:
  - `TransformDataStore`: 
    - `positions` (Float32Array): 3 values per entity for x, y, z coordinates
    - `quaternions` (Float32Array): 4 values per entity for x, y, z, w quaternion
    - `scales` (Float32Array): 3 values per entity for x, y, z scaling
    - `needsUpdate` (Uint8Array): 1 bit flag for matrix updates
  - `RigidbodyDataStore`: 
    - `velocities` (Float32Array): 3 values per entity for x, y, z velocity
    - `angularVelocities` (Float32Array): 3 values per entity for x, y, z rotation
    - `forces` (Float32Array): 3 values per entity for accumulated force
    - `torques` (Float32Array): 3 values per entity for rotational force
    - `properties` (Float32Array): 4 values per entity for mass, drag, angularDrag, collisionRadius
    - `flags` (Uint8Array): 4 values per entity for isKinematic, freezeRotation, useGravity, isTrigger

### Enhanced Systems

#### OptimizedMovementSystem (`js/systems/physics/optimizedMovementSystem.js`)

- High-performance physics update system using data-oriented design
- Processes entities in batches for improved cache coherency
- Features:
  - Direct typed array access for minimal indirection
  - Entity caching to minimize lookups
  - Batch processing for transform and rigidbody data
  - Reusable vector objects to minimize garbage collection
  - Quaternion-based rotation integration for stable physics
- Smart entity tracking:
  - Maintains cached entity list for processing
  - Listens for relevant entity/component events to update cache
  - Only rebuilds entity cache when necessary
  - Uses dirtyEntityIds flag to track when cache needs rebuilding
- Performance optimizations:
  - Avoids creating temporary objects in hot path
  - Uses pre-allocated temporary vectors for calculations
  - Processes entities in memory-order when possible
  - Applies direct math operations on typed arrays
  - Early exits for kinematic entities
  - Separate processing for rotation-frozen bodies

#### World Class (`js/core/world.js`)

- Top-level container for the ECS architecture
- Manages the game simulation state
- Core components:
  - `entityManager` - Handles entity lifecycle
  - `systemManager` - Manages system execution
  - `messageBus` - Provides communication
- MessageBus integration:
  - Can use shared or dedicated message bus
  - Sets global `window.mainMessageBus` if creating new bus
  - Ensures consistent message bus access across systems
- Handles time tracking with delta time calculation:
  - Uses `performance.now()` for precise timing
  - Caps delta time at 100ms to prevent large jumps
  - Maintains cumulative time
- Lifecycle events:
  - Publishes `world.initialized` when setup complete
  - Publishes `world.preUpdate` at start of frame
  - Publishes `world.postUpdate` at end of frame
- Exposes convenience methods for entity and system operations
- Debug facilities for entity counting and performance monitoring
- Implements global message bus access via `window.mainMessageBus`

#### EntityManager Class (`js/core/entityManager.js`)

- Manages entity creation, retrieval, and destruction
- Performance optimizations:
  - Entity recycling pool (max 100 entities) to reduce garbage collection
  - Maps for O(1) entity lookups by ID, component type, and tag
  - WeakMap references to allow garbage collection of unused entities
  - Optimized entity reuse with automatic state clearing
- Entity lifecycle handling with proper event publishing:
  - Entity creation with automatic name-to-tag conversion
  - Component cleanup during entity destruction
  - Proper reference removal from all indices
- Tag-based entity management:
  - Efficient tag indices for fast querying
  - Automatic tag cleanup during entity destruction
  - Empty tag set removal for memory optimization
- Query capabilities:
  - Entities by single tag
  - Entities with specific components
  - All entities in the world
- Event publishing for entity lifecycle:
  - 'entity.created' on creation
  - 'entity.destroyed' before removal

#### SystemManager Class (`js/core/systemManager.js`)

- Registers and prioritizes systems for execution
- Maintains systems in two collections:
  - Array for ordered execution based on priority
  - Map for O(1) lookup by system type
- Prevents duplicate system registration
- Automatically sorts systems by priority when registered
- Sequential system updates with delta time propagation
- System initialization handling during startup
- System enabling/disabling for selective processing

#### MessageBus Class (`js/core/messageBus.js`)

- Event-driven communication system with decoupled components
- Topic-based publish/subscribe model for message distribution
- Performance optimizations:
  - Fast path for high-frequency messages (`transform.updated`, `physics.update`, `render.update`)
  - Message queuing to prevent re-entrancy issues during dispatch
  - Optimized message handling for critical paths
  - `fastPublish` method for minimal overhead on performance-critical events
- Robust error handling:
  - Global access via `window.mainMessageBus` for critical events
  - Emergency game over trigger mechanism with multiple fallbacks
  - Event forwarding between message bus instances
  - Detailed error logging and recovery for critical messages
  - Global message bus registry for emergency access
- Enhanced handling for critical game events:
  - Special case for `game.over` events with guaranteed delivery
  - Multiple fallback mechanisms for `game.over` handling:
    - Forwarding to main message bus
    - Direct window.game.gameOver() call as last resort
  - Logging and tracing of event paths
- Self-registration in global registry for emergency access
- Unsubscribe functions returned by subscribe for automatic cleanup

### Entity-Component Relationships

- Components store a reference to their parent entity via the `entity` property
- Entity attaches components using `addComponent()` method:
  - Sets up bi-directional reference between entity and component
  - Components are stored in a Map keyed by component class name
  - Automatically calls component's lifecycle hooks
- Component retrieval is optimized:
  - Direct access via `getComponent(ComponentClass)` or `getComponent("ComponentName")`
  - O(1) lookup time using Map-based storage
  - Type-safe access with class reference
- Lifecycle management:
  - Component `onAttached()` hook called when added to entity
  - Component `onDetached()` hook called when removed from entity
  - Enable/disable state changes trigger `onEnabled()`/`onDisabled()` hooks
- Event notifications are published for component changes:
  - `component.added` when a component is attached
  - `component.removed` when a component is detached
- Component access pattern:
  - Systems typically access multiple components on same entity
  - Components can access other components on the same entity: `this.entity.getComponent(OtherComponent)`
  - Component state can be modified by any system with access to the entity

### System-Entity Relationships

- Systems define required components for processing via `requiredComponents` array
- Entity filtering occurs automatically through the following mechanism:
  - System calls `getEntities()` to retrieve compatible entities
  - World's `getEntitiesWithComponents()` is invoked with required components
  - EntityManager performs the actual filtering by component requirements
- Optimized for performance:
  - Entity lookups use fast Map-based indices
  - Tag-based filtering uses specialized caching
  - Commonly checked tags use direct property access for speed
- Systems process entities in sequence during each update cycle
- Entity updates receive delta time for time-based processing
- Systems can be enabled/disabled to control processing
- Entity-System communication happens via:
  - Direct component access (reading/writing component data)
  - MessageBus events for decoupled communication
  - Shared world reference for global access

### Event-Driven Communication

- Systems communicate via MessageBus rather than direct references
- Publication-subscription model:
  - Components/systems can publish messages with `messageBus.publish(type, data)`
  - Subscribers register interest with `messageBus.subscribe(type, callback)`
  - Each subscription returns an unsubscribe function for cleanup
  - `fastPublish` method available for high-frequency, performance-critical events
- Message structure:
  - `type` - String identifier for the message category
  - `data` - Payload object with event-specific information
  - `timestamp` - Automatic timestamp for processing order
- Core event categories:
  - Entity lifecycle: `entity.created`, `entity.destroyed`
  - Component changes: `component.added`, `component.removed`
  - Frame timing: `world.preUpdate`, `world.postUpdate`
  - Game state: `game.over`
- Message queueing system:
  - Prevents re-entrancy issues during event dispatching
  - Manages the order of event processing
  - Handles recursive event triggering safely
  - Prevents cascading event issues
- Global messaging capabilities:
  - Window-level access via `window.mainMessageBus`
  - Registry of message buses for emergency access
  - Critical event forwarding between bus instances

## Core Components

### TransformComponent (`js/components/transform.js`)

- Provides spatial positioning for entities in 3D space
- Core properties:
  - `position` (THREE.Vector3) - World position
  - `rotation` (THREE.Euler) - Euler angle rotation
  - `quaternion` (THREE.Quaternion) - Rotation as quaternion
  - `scale` (THREE.Vector3) - Object scale
  - `matrix` (THREE.Matrix4) - Combined transformation matrix
  - `needsUpdate` - Dirty flag for matrix computation optimization
- Key functionality:
  - Chainable positioning methods (setPosition, setRotation, setScale)
  - Look-at target functionality with proper rotation calculation
  - Efficient matrix updates via dirty flag system
  - Directional vector computation (getForwardVector, getRightVector, getUpVector)
  - Full integration with Three.js matrix system
  - Matrix composition with position, rotation, and scale

### RigidbodyComponent (`js/components/physics/rigidbody.js`)

- Physics simulation properties for entities
- Motion properties:
  - `velocity` (THREE.Vector3) - Linear velocity
  - `angularVelocity` (THREE.Vector3) - Rotational velocity
  - `mass` - Mass for force calculations
  - `drag` and `angularDrag` - Velocity dampening
- Force handling:
  - `forces` (THREE.Vector3) - Accumulated forces per frame
  - `torque` (THREE.Vector3) - Accumulated rotational forces
  - Methods for applying forces, impulses, and torque
  - Force point-of-application for torque calculation
- Special flags:
  - `isKinematic` - Ignore forces for animation-driven objects
  - `freezeRotation` - Prevent rotation for simplified physics
  - `useGravity` - Enable gravitational effects
- Collision properties:
  - `collisionRadius` - Sphere collision detection radius
  - `isTrigger` - Non-solid collision detection flag

### HealthComponent (`js/components/combat/healthComponent.js`)

- Health and shield management system
- Core properties:
  - `health` and `maxHealth` - Current and maximum health values
  - `shield` and `maxShield` - Current and maximum shield values
  - `shieldRegenRate` and `shieldRegenDelay` - Shield regeneration parameters
  - `damageResistance` - Damage reduction percentage (0-1 range)
- Damage system:
  - Damage application with type differentiation
  - Shield-first damage absorption with overflow to health
  - Invulnerability periods for gameplay mechanics
  - Critical entity destruction event handling
- Special event handling:
  - Health synchronization for player entity across systems
  - Detailed damage reporting via MessageBus
  - Emergency game over triggering system with fallbacks
  - Main player and spaceship object hook synchronization
- Upgrade mechanics:
  - Methods for upgrading health and shield capacity
  - Proper event publication for UI updates

### EnemyAIComponent (`js/components/combat/enemyAI.js`)

- Controls enemy behavior with attack patterns
- Enemy characteristics:
  - `faction` and `type` properties for enemy categorization (spectrals, drone)
  - `detectionRange` for player awareness radius
  - `damage` for collision impact damage
  - `speed` for movement rate
- Special movement parameters:
  - `spiralAmplitude` - Controls radius of spiral pattern
  - `spiralFrequency` - Controls how tight the spiral is
  - `spiralPhase` - Random starting phase for varied movements
  - `timeAlive` - Tracks lifetime for movement calculations
  - `isDroneLike` flag for special drone movement patterns
- Advanced player detection:
  - Multiple fallback detection methods with priority order:
    1. Direct world.playerEntity reference
    2. Global window.game.combat.playerEntity reference
    3. Entity tag-based search via getEntitiesByTag('player')
    4. Entity manager tag index lookup
    5. Brute force search of all entities
    6. Fallback to direct spaceship mesh from global game object
  - Comprehensive error handling with graceful degradation
  - Defensive code to prevent errors when entities are missing or destroyed
- Movement patterns:
  - Optimized player entity lookup with direct tag access
  - Kamikaze direct pursuit behavior
  - Specialized spiral movement pattern for spectral drones
  - Banking effect for realistic turning visualization
- Implementation details:
  - Direction vector caching to avoid allocations
  - Periodic error messaging to avoid console spam
  - Rotation smoothing for natural movement
  - Velocity adjustment based on time alive
- Attack implementation:
  - Collision detection based on distance threshold
  - Damage application to player health component
  - Direct spaceship object damage for multi-system synchronization
  - Explosion effects and sounds on collision

### CargoComponent (`js/components/spaceship/cargo.js`)

- Resource management system
- Cargo properties:
  - `maxCapacity` - Maximum total storage capacity
  - `usedCapacity` - Current used storage
  - `resources` - Map of resource quantities by type
  - `resourceValues` - Credit value of each resource
  - `resourceVolumes` - Storage space required per resource unit
- Resource operations:
  - Adding resources with capacity limitation
  - Removing resources with validation
  - Resource value calculation for trading
  - Cargo percentage calculation for UI
  - Cargo clearing for bulk operations
- Event publication:
  - Resource addition/removal events
  - Cargo full notification
  - Upgrade notifications

### MiningLaserComponent (`js/components/spaceship/miningLaser.js`)

- Resource extraction tool implementation
- Mining properties:
  - `power` - Mining speed multiplier
  - `range` - Maximum mining distance
  - `active` - Current mining state
  - `targetEntityId` - Current mining target
- Visual effects:
  - Laser beam mesh with custom material properties
  - Mining progress visualization with ring geometry
  - Dynamic beam positioning between ship and target
  - Color feedback for active mining
- Mining mechanics:
  - Resource-specific mining speed calculations
  - Visual progress indication with ring geometry
  - Billboard effect for progress indicator facing camera
  - Clean resource disposal in onDetached lifecycle hook

### ThrusterComponent (`js/components/spaceship/thruster.js`)

- Spaceship propulsion system
- Thruster properties:
  - `thrust` - Base thrust force
  - `maxVelocity` - Maximum attainable speed
  - `boostMultiplier` - Speed boost factor
  - `thrusting` - Current thruster state for all directions
- Visual effects:
  - Particle systems for each thruster direction
  - Dynamic particle visibility based on thrust state
  - Particle color and size configuration
  - Particle positioning relative to ship
- Physics integration:
  - Thrust force calculation based on ship orientation
  - Forward/backward/left/right/up/down thrust application
  - Boost functionality with increased speed
  - Velocity limiting based on maximum allowed speed
- Fuel consumption:
  - Consumption rate calculation based on active thrusters
  - Higher consumption during boost
  - Integration with ship fuel system

### MineableComponent (`js/components/mining/mineable.js`)

- Makes entities harvestable for resources
- Resource properties:
  - `resourceType` - Type of resource contained (iron, gold, platinum)
  - `totalAmount` and `remainingAmount` - Resource quantities
  - `miningDifficulty` - Extraction rate multiplier by resource type
- Visual feedback:
  - Resource-specific color coding
  - Mining particle effects for visual feedback
  - Scale reduction as resources are depleted
  - Depletion percentage calculation for UI
- Mining mechanics:
  - Resource extraction with remaining amount tracking
  - Depletion status tracking
  - Visual scale updates based on remaining resources

### MeshComponent (`js/components/rendering/mesh.js`)

- Visual rendering component using Three.js
- Mesh management:
  - Handles Three.js Mesh objects
  - Supports direct mesh assignment or geometry+material creation
  - Default fallback for invalid geometry
  - Proper resource disposal on detachment
- Rendering properties:
  - Visibility control
  - Shadow casting/receiving configuration
  - Material and geometry updating
- Transform synchronization:
  - Position, rotation, and scale from TransformComponent
  - Scene management with addToScene method

### TrailComponent (`js/components/rendering/trail.js`)

- Creates visual trails behind moving entities
- Trail configuration:
  - `maxPoints` - Maximum number of points in trail
  - `pointDistance` - Minimum distance between recorded points
  - `fadeTime` - Time in seconds for trail points to fade out
- Visual effects:
  - Color configuration with transparency
  - Pulsing effect option
  - Tapering option for width variation
  - Glow effect option
- Implementation details:
  - Dynamic buffer geometry with position and color attributes
  - Time-based point aging and fading
  - Efficient attribute updating with needsUpdate flag
  - Proper THREE.js resource cleanup in onDetached

## Game Systems

### MovementSystem (`js/systems/physics/movementSystem.js`)

- Processes entities with TransformComponent and RigidbodyComponent
- Force integration with mass-based acceleration
- Velocity integration for position updates
- Angular velocity integration for rotation updates
- Drag application for velocity dampening
- Force resetting after frame processing
- Entity movement event publication

### CollisionSystem (`js/systems/physics/collisionSystem.js`)

- Spatial partitioning for efficient collision detection
- Sphere-based collision detection
- Event-based collision resolution
- Special handling for different entity types
- Trigger vs. solid collision differentiation
- Distance-based culling for performance
- Damage application for combat collisions

### CombatSystem (`js/systems/combat/combatSystem.js`)

- Projectile tracking and lifecycle management
- Collision detection between projectiles and entities
- Damage application with shield/hull penetration logic
- Visual effects for hits and explosions
- Combat statistics tracking
- Event-based weapon firing
- Projectile cleanup for performance

### EnemySystem (`js/systems/combat/enemySystem.js`)

- Comprehensive enemy entity management using a modular architecture
- Core modules:
  - `EnemyPoolManager` - Object pool system for enemy entities
  - `EnemySpawner` - Spawn point generation and enemy instantiation
  - `EnemyLifecycle` - Enemy reference management and state tracking
- Entity pooling system:
  - Pre-allocated enemy pool to minimize garbage collection
  - Entity recycling with complete state reset
  - Pool size management with configurable parameters
  - Tag management with proper cache handling
  - Component state reset during recycling
- Spawn mechanics:
  - Dynamic spawn point generation in sphere around player
  - Smart spawn interval management with configurable timers
  - Position randomization for unpredictable enemy placement
  - Enemy limit enforcement for balanced difficulty
  - Spawn diagnostics for ensuring system health
- Player docking integration:
  - Automatic enemy freezing when player is docked
  - Event-based docking state synchronization via MessageBus
  - Global game state synchronization as fallback
  - Proper unfreezing when player undocks
- Self-healing capabilities:
  - Continuous spawn system monitoring
  - Periodic validation of enemy references
  - Removal of invalid entities from tracking
  - Regeneration of spawn points as needed
  - Automatic recovery from error states
- Event-driven architecture:
  - Entity lifecycle events for tracking
  - Subscription to player docking/undocking events
  - Combat statistics tracking (enemies destroyed)
  - Entity tag state validation
- Debugging facilities:
  - Periodic diagnostic reporting
  - Robust error logging with context
  - Global state accessibility for emergency intervention
  - Performance metrics tracking

## High-Level Modules

### Renderer (`js/modules/renderer.js`)

- Advanced 3D rendering system using Three.js
- Scene management with automated resource cleanup
- Camera configuration with custom frustum settings
- Enhanced post-processing pipeline with fallback mechanisms:
  - UnrealBloomPass for energy sources, sun, and effects
  - FXAA for anti-aliasing at optimized performance
  - Color correction with powRGB and mulRGB customization
  - Film grain with configurable noise and scanline intensity
  - Vignette effect with configurable offset and darkness
  - Graceful shader unavailability handling with fallbacks
  - Dynamic adjustment methods for real-time quality control
- HDR rendering features:
  - ACES Filmic tone mapping for realistic color reproduction
  - Extended color range for high-contrast scenes
  - Physically accurate lighting model
  - Exposure control for adaptive brightness
- Enhanced lighting system:
  - Directional key, fill, and hemisphere lights
  - Shadow mapping with optimized quality settings
  - Ambient point light for better visibility
- Performance optimizations:
  - Instanced mesh rendering for repeated objects
  - Frustum culling for off-screen object skipping
  - Logarithmic depth buffer for space-scale distances
  - Adaptive quality based on performance metrics
  - Compositor resizing based on device capabilities
- Resource management:
  - Proper disposal of materials, geometries, and textures
  - Automated cleanup to prevent memory leaks
  - Comprehensive dispose() method for complete teardown
  - Material and geometry reuse where possible

## Python FastAPI Backend

### API Server (`api_server.py`)

- Python-based backend server for AI-powered content generation
- Core technologies:
  - FastAPI for API endpoint implementation
  - Google Gemini AI for image generation
  - JWT for secure token-based authentication
  - CORS middleware for cross-origin requests
- API endpoints:
  - `/token` - Authentication endpoint for JWT token generation
  - `/generate-skybox` - Creates space skybox images from text descriptions
  - `/generate-planet` - Creates planet texture images from text descriptions
- AI image generation:
  - Uses Gemini AI's image generation capabilities
  - Structured prompting for consistent results
  - Format optimization for seamless texture mapping
  - Customized wrappers for different asset types
- Security features:
  - JWT token-based authentication
  - Configurable client ID validation
  - Environment variable-based configuration
  - CORS protection for production deployment
- Asset management:
  - Automatic file saving and organization
  - Unique ID generation for image files
  - Proper MIME type handling and detection
  - URL path conversion for frontend consumption
  - Fallback image generation for error cases

### JavaScript API Integration (`js/modules/utils/apiClient.js`)

- Client-side API wrapper for communicating with the backend
- Features:
  - Automatic token management with localStorage persistence
  - Token expiration handling and renewal
  - Environment-aware API URL construction
  - Response processing and error handling
  - Image URL normalization
- Core methods:
  - `getToken()` - Authenticates and stores JWT token
  - `generateSkybox()` - Creates space environment textures
  - `generatePlanet()` - Creates planet surface textures
  - `getFullImageUrl()` - Converts API paths to usable URLs
- Environment detection:
  - Local development vs production configuration
  - Automatic base URL selection
  - Parameterized client identification

### Custom System Creator (`js/modules/ui/customSystemCreator.js`)

- UI interface for creating custom star systems using AI
- Features:
  - Comprehensive form for system design
  - Star class selection with visual preview
  - Planet creation with configurable properties
  - Interactive sliders for physical parameters
  - Real-time UI feedback during generation
  - Visual preview of generated assets
- Integration points:
  - Uses ApiClient for backend communication
  - Connects to StarSystemGenerator for system integration
  - Stores custom textures for rendering
  - Provides complete travel functionality to new systems
- Implementation details:
  - DOM-based UI with event handling
  - Progressive generation workflow
  - Structured data collection and validation
  - Error handling with user feedback
  - Preview rendering before system integration

### Physics (`js/modules/physics.js`)

- Newtonian physics simulation in zero-gravity
- Collision detection and response
- Spatial partitioning for collision optimization
- Force application and integration
- Velocity damping and limitations
- Object pooling for performance
- Raycasting for precise collision detection
- Camera-centric optimization for distant objects

### Spaceship (`js/modules/spaceship.js`)

- Player ship model and visual effects
- Thruster system with particle effects
- 6-DOF movement control
- Weapon systems integration
- Mining laser implementation
- Shield and hull management
- Fuel consumption mechanics
- Cargo capacity and resource storage
- Docking procedures and detection
- Upgrade system for ship capabilities
- Visual damage state representation

### Combat (`js/modules/combat.js`)

- Weapon systems implementation
- Projectile creation and management
- Damage calculation and application
- Visual effects for weapons and impacts
- Enemy management:
  - Modular implementation with dedicated subsystems
  - Object pooling for performance optimization
  - Self-healing reference management
  - State synchronization with main game
- Combat statistics tracking
- Difficulty scaling mechanics
- Entity reference tracking for targeting
- Combat sound effect integration
- Collision-based damage resolution

### Environment (`js/modules/environment.js`)

- Solar system creation and management
- Procedural star system generation
- Planet placement and orbital mechanics
- Asteroid belt generation with resource distribution
- Skybox implementation
- Spatial fog for depth perception
- Lighting setup with sun as primary light source
- Resource node placement and management
- Mothership creation and positioning
- Safe zone implementation around mothership
- Custom system integration:
  - AI-generated skybox and planet textures 
  - User-defined system properties
  - Seamless integration with procedural systems
  - Persistence of custom systems data
  - System connections via warp gates

### Audio (`js/modules/audio.js`)

- Sound synthesis using Tone.js
- Dynamic sound parameter adjustment
- Sound categories:
  - Thruster sounds with intensity modulation
  - Weapon firing and impact effects
  - UI interaction feedback
  - Mining operation sounds
  - Ambient space background
  - Explosions and critical alerts
- Spatial audio positioning
- Volume control and muting
- Browser autoplay policy handling
- Audio preloading and resource management
- Sound pooling for performance

### Controls (`js/modules/controls.js`)

- Input capture for keyboard and mouse
- Pointer lock implementation for mouse look
- Input mapping to ship actions
- Thrust control in 6 degrees of freedom
- Weapon and mining tool activation
- Boost functionality
- Docking initiation and control
- UI interaction support
- Input sensitivity configuration

### UI (`js/modules/ui.js`)

- Heads-up display (HUD) with:
  - Ship status indicators
  - Resource and cargo display
  - Position coordinates
  - Target information
  - Combat alerts
- Mothership interface:
  - Resource trading
  - Ship upgrades
  - Repair and refueling
  - Mission information
- Game state screens:
  - Loading screen with progress
  - Game over screen with statistics
  - Settings menu

## Game Initialization and Loop

The game initialization process follows these steps:

1. **DOM Loading and Preparation**
   - Loading screen creation
   - Shader availability checking
   - Resource preloading indication
   
2. **Game Instance Creation**
   - Game class instantiation
   - Core systems initialization:
     1. Audio manager (first to start loading sounds)
     2. Renderer and scene setup
     3. Physics world creation
     4. Environment generation
     5. Spaceship creation
     6. Combat system initialization
     7. UI setup
     8. Controls configuration
   - Entity creation and component attachment
   - Event handler registration
   
3. **Intro Sequence Check**
   - Check localStorage for previous intro playback
   - For first-time players:
     - Initialize the intro sequence components
     - Position camera for optimal intro viewing
     - Hide UI elements and disable controls
     - Start cinematic sequence with Star Dreadnought
   - For returning players:
     - Skip intro sequence
     - Start in docked state at the mothership
     - Show tutorial prompts if needed
   
4. **Game Loop**
   - Frame timing with requestAnimationFrame
   - Delta time calculation with capping (100ms max)
   - Conditional system updates:
     - During intro: Only essential non-enemy systems updated
     - Normal gameplay: All systems updated in priority order
   - Standard update sequence:
     1. Physics update (collisions, movement)
     2. Spaceship update (controls, thrust)
     3. Combat update (weapons, enemies)
     4. Environment update (celestial objects)
     5. UI update (HUD, interfaces)
     6. Audio update (sound parameters)
   - Scene rendering
   - Game over condition checking
   - Frame counting for performance metrics

## Game Mechanics Implementation

### Mining System

- **Laser Implementation**
  - Raycasting from ship to detect asteroid targets
  - Distance-based availability checking
  - Visual beam effect with LineBasicMaterial
  - Particle effects at impact point using THREE.Points
  - Color variation based on resource type
  
- **Resource Extraction**
  - Timed extraction rate based on asteroid type
  - Resource categorization (iron, gold, platinum)
  - Cargo capacity limits with overflow prevention
  - Mining efficiency upgrades
  - Sound effects synchronized with extraction rate

### Docking System

- **Proximity Detection**
  - Distance-based activation zone around mothership
  - Visual indicators when docking is available
  - Manual activation via key press when in range
  
- **Mothership Interface**
  - Resource trading with dynamic pricing
  - Credits as currency for upgrades
  - Ship system upgrades with increasing costs
  - Shield and hull repairs
  - Fuel replenishment
  - Mission information display

### Combat System

- **Projectile Implementation**
  - Entity-based projectiles with components
  - Velocity-based movement with rigidbody
  - Limited lifetime with auto-destruction
  - Visual effects with glow and trails
  - Sound effects synchronized with firing
  
- **Damage System**
  - Shield-first damage absorption
  - Hull damage when shields depleted
  - Critical hit system with increased damage
  - Visual feedback with hit flashes
  - Shield recharge delay after damage
  
- **Enemy Implementation**
  - Kamikaze attack pattern with direct pursuit
  - Spawning based on player position
  - Concurrency limits for performance and difficulty
  - Visual distinction with red coloring
  - Damage on collision with player

## Performance Optimization

- **Rendering Optimizations**
  - Frustum culling for off-screen objects
  - LOD (Level of Detail) for distant entities
  - Instanced rendering for similar objects
  - Shader complexity management
  - Render target sizing based on performance
  
- **Physics Optimizations**
  - Spatial partitioning for collision detection
  - Distance-based physics simplification
  - Object pooling for projectiles and particles
  - Force calculations only for nearby objects
  - Collision filtering by entity type
  
- **Memory Management**
  - Entity recycling pool
  - Texture and geometry sharing
  - Proper Three.js resource disposal
  - Audio resource pooling
  - Asset unloading for unused content

## Debug Facilities

- **Debug Mode**
  - Controlled via window.DEBUG_MODE flag
  - Verbose console logging
  - Performance statistics display
  - Entity count monitoring
  - Physics visualization helpers
  
- **Error Handling**
  - Graceful fallbacks for missing resources
  - User-friendly error displays
  - Console error details for troubleshooting
  - Browser compatibility checks
  - Shader capability detection

## File Structure

```
/
├── js/
│   ├── core/                # ECS architecture
│   │   ├── component.js     # Base component class
│   │   ├── entity.js        # Base entity class
│   │   ├── entityManager.js # Entity lifecycle management
│   │   ├── messageBus.js    # Event system
│   │   ├── system.js        # Base system class
│   │   ├── systemManager.js # System execution management
│   │   ├── world.js         # Top-level ECS container
│   │   ├── dataStore.js     # Data-oriented storage
│   │   └── optimizedEntityFactory.js # Factory for optimized entities
│   │
│   ├── components/          # Game components
│   │   ├── transform.js     # Position, rotation, scale
│   │   ├── optimized/       # Data-oriented components
│   │   │   ├── transformComponent.js  # Optimized transform
│   │   │   └── rigidbodyComponent.js  # Optimized physics
│   │   ├── combat/          # Combat-related components
│   │   │   ├── healthComponent.js    # Health and shields
│   │   │   └── enemyAI.js            # Enemy behavior
│   │   ├── mining/          # Mining-related components
│   │   │   └── mineable.js           # Resource extraction
│   │   ├── physics/         # Physics components
│   │   │   └── rigidbody.js          # Physics properties
│   │   ├── rendering/       # Visual components
│   │   │   ├── mesh.js               # Visual representation
│   │   │   └── trail.js              # Movement trails
│   │   └── spaceship/       # Ship-specific components
│   │       ├── cargo.js              # Resource storage
│   │       ├── miningLaser.js        # Mining tool
│   │       └── thruster.js           # Propulsion
│   │
│   ├── entities/            # Entity definitions and factories
│   │   └── spaceship.js     # Player ship creation
│   │
│   ├── systems/             # Game systems
│   │   ├── combat/          # Combat logic
│   │   │   ├── combatSystem.js       # Projectile and damage
│   │   │   ├── enemySystem.js        # Main enemy manager
│   │   │   ├── enemyPoolManager.js   # Enemy object pooling
│   │   │   ├── enemySpawner.js       # Enemy spawn generation
│   │   │   └── enemyLifecycle.js     # Enemy lifecycle tracking
│   │   ├── input/           # Input processing
│   │   ├── mining/          # Mining mechanics
│   │   ├── physics/         # Physics calculations
│   │   │   ├── collisionSystem.js    # Collision detection
│   │   │   ├── movementSystem.js     # Position updates
│   │   │   └── optimizedMovementSystem.js # Data-oriented physics
│   │   └── rendering/       # Rendering logic
│   │
│   ├── modules/             # High-level game modules
│   │   ├── audio.js         # Sound system
│   │   ├── combat.js        # Combat mechanics
│   │   ├── controls.js      # Input handling
│   │   ├── environment.js   # Space environment
│   │   ├── physics.js       # Physics simulation
│   │   ├── renderer.js      # Three.js rendering
│   │   ├── spaceship.js     # Player ship implementation
│   │   ├── ui.js            # User interface
│   │   │
│   │   ├── combat/          # Combat subsystems
│   │   ├── controls/        # Control subsystems
│   │   ├── environment/     # Environment objects
│   │   │   ├── asteroidBelt.js       # Asteroid field generation
│   │   │   ├── mothership.js         # Mothership creation
│   │   │   ├── planets.js            # Planet generation
│   │   │   ├── skybox.js             # Space background
│   │   │   ├── starDreadnought.js    # Intro sequence ship
│   │   │   ├── starSystemGenerator.js # System generation
│   │   │   └── systemTransition.js   # System travel effects
│   │   ├── ui/              # UI components
│   │   │   ├── hud.js                # In-game interface
│   │   │   ├── mothershipInterface.js # Docking interface
│   │   │   ├── starMap.js            # System navigation
│   │   │   ├── customSystemCreator.js # AI system creator
│   │   │   └── blackjackGame.js      # Mini-game
│   │   └── utils/           # Utility modules
│   │       └── apiClient.js          # Backend API integration
│   │
│   ├── utils/               # Utility functions and helpers
│   │   └── pathUtils.js     # Path handling utilities
│   │
│   ├── tests/               # Test suites for components and systems
│   ├── examples/            # Example implementations and demos
│   └── main.js              # Main entry point
│
├── assets/                  # Game assets (models, textures)
├── css/                     # CSS stylesheets
├── sounds/                  # Audio files
├── static/                  # Static assets and resources
│   └── images/              # Generated images from AI API
├── index.html               # Main HTML file
├── api_server.py            # Python-based API server
├── requirements.txt         # Python dependencies
└── README-custom-systems.md # Custom system documentation
``` 

## Core Modules

### Game Module (`js/modules/game.js`)

- Central game orchestration module
- Primary integration point for all game systems
- Core responsibilities:
  - Initializes renderer, physics, environment, and UI modules
  - Manages the game loop with delta time calculation
  - Handles game state (paused, running, game over)
  - Controls audio state based on game context
  - Processes input via Controls module
  - Orchestrates combat and weapon systems
  - Handles global events through MessageBus
- Intro sequence management:
  - Initializes and controls the cinematic intro sequence
  - Tracks intro playback state with localStorage
  - Freezes gameplay systems during intro (enemies, physics, controls)
  - Handles intro completion and transition to gameplay
  - Enables skip functionality for repeat players
- Game over handling:
  - Multiple fallback mechanisms for reliability
  - Event-based game over triggering via MessageBus
  - Comprehensive game statistics reporting on end
  - UI feedback with fallback emergency systems

### Renderer Module (`js/modules/renderer.js`)

- Advanced 3D rendering system using Three.js
- Scene management with automated resource cleanup
- Camera configuration with custom frustum settings
- Enhanced post-processing pipeline with fallback mechanisms:
  - UnrealBloomPass for energy sources, sun, and effects
  - FXAA for anti-aliasing at optimized performance
  - Color correction with powRGB and mulRGB customization
  - Film grain with configurable noise and scanline intensity
  - Vignette effect with configurable offset and darkness
  - Graceful shader unavailability handling with fallbacks
  - Dynamic adjustment methods for real-time quality control
- HDR rendering features:
  - ACES Filmic tone mapping for realistic color reproduction
  - Extended color range for high-contrast scenes
  - Physically accurate lighting model
  - Exposure control for adaptive brightness
- Enhanced lighting system:
  - Directional key, fill, and hemisphere lights
  - Shadow mapping with optimized quality settings
  - Ambient point light for better visibility
- Performance optimizations:
  - Instanced mesh rendering for repeated objects
  - Frustum culling for off-screen object skipping
  - Logarithmic depth buffer for space-scale distances
  - Adaptive quality based on performance metrics
  - Compositor resizing based on device capabilities
- Resource management:
  - Proper disposal of materials, geometries, and textures
  - Automated cleanup to prevent memory leaks
  - Comprehensive dispose() method for complete teardown
  - Material and geometry reuse where possible

### Physics Module (`js/modules/physics.js`)

- Custom zero-gravity Newtonian physics implementation
- Core systems:
  - Velocity-based movement with custom friction
  - Dynamic thrust calculation based on ship orientation
  - Collider system for different object types
  - Raycasting-based collision detection with optimizations
- Collision handling:
  - Different collision logic for asteroids, planets, and sun
  - Hull resistance system with chance-based damage absorption
  - Visual feedback with shield effects and explosions
  - Type-specific survivability calculations
- Special features:
  - Camera tracking with smooth follow behavior
  - Mouse-based rotation control for intuitive ship steering
  - Particle effect synchronization with physical movement
  - Visual thruster management based on velocity and direction

### Environment Module (`js/modules/environment.js`)

- Comprehensive space environment management
- Core components:
  - Skybox with procedural star field and nebula generation
  - Sun with corona effects and damage radius
  - Planets with orbital mechanics and custom shaders
  - Asteroid belt with resource distribution
  - Mothership for docking and trading
- Star system management:
  - Multiple star systems with unique characteristics
  - System transition effects with animation
  - System-specific resource distribution and visual style
  - Coordinate-based location tracking and region detection
- Environmental features:
  - Location detection based on position coordinates
  - Region-based event triggers for gameplay events
  - System transition handling with welcome notifications
  - Dynamic resource multipliers based on current system

### Audio Manager (`js/modules/audio.js`)

- Comprehensive sound system with 3D spatial effects
- Audio categories:
  - Background music with dynamic transitions
  - Sound effects for player actions (mining, weapons, thrusters)
  - Environmental sounds tied to game events
  - Interface sounds for UI interactions
- Technical features:
  - Dynamic audio loading with fallback capabilities
  - Automated resource cleanup with garbage collection
  - Audio context management with browser restrictions handling
  - Sound parameter modulation for variety (pitch, volume, filter)
- Specialized systems:
  - Thruster sound intensity based on thrust level
  - Mining laser audio with particle synchronization
  - Explosion sound design with filter automation
  - Weapon sounds with different profiles per weapon type

### UI Module (`js/modules/ui.js`)

- Modular UI system with component-based design
- Core components:
  - Heads-up display (HUD) with ship status information
  - Mining display for resource extraction feedback
  - Targeting system for combat mechanics
  - Mothership interface for upgrades and trading
  - Game over screen with statistics display
  - Controls menu for input configuration
  - Star map for navigation between systems
  - Mini-games (blackjack) for additional gameplay
- Technical implementation:
  - DOM-based UI with CSS styling for performance
  - Event-based updates via message bus
  - Dynamic content generation based on game state
  - Modal dialog system with stacking capabilities
- Special features:
  - Coordinate display with real-time updates
  - Resource monitoring with capacity indication
  - Location tracking with region names
  - Performance monitoring with FPS display

### Combat System

- Combat manager orchestration (`js/modules/combat/combatManager.js`)
  - Enemy spawning and lifecycle management
  - Difficulty scaling based on distance from starting point
  - Combat statistics tracking for end-game reporting
  - Player targeting system with spatial awareness
- Weapon system implementation (`js/modules/combat/weaponSystem.js`)
  - Multiple weapon modes with different firing patterns
  - Projectile physics with momentum and collision
  - Visual effects with particle trails and lighting
  - Audio synchronization with weapon firing
- Enemy mechanics:
  - Different enemy types with unique behaviors
  - Attack patterns based on enemy classification
  - Health systems with appropriate difficulty balancing
  - Explosion effects with particle systems

### Star System Generator (`js/modules/environment/starSystemGenerator.js`)

- Procedural star system creation with unique characteristics
- System properties:
  - Star type and color with appropriate lighting
  - Planet configuration with visual distinctiveness
  - Resource distribution based on system type
  - Visual skybox parameters for atmospheric difference
- Navigation features:
  - Interconnected system map with travel capabilities
  - System description and classification
  - Distance-based travel requirements
  - Welcome notifications with system information
- Technical implementation:
  - Seed-based procedural generation for consistency
  - Parameter-driven system creation for variety
  - Resource multiplier configuration for gameplay balance
  - Dynamic skybox and lighting adjustment during transitions

### Combat System Implementation

#### CombatManager (`js/modules/combat/combatManager.js`)

- Thin adapter class bridging the main game and ECS combat implementation
- Provides backward compatibility with the traditional game object system
- Synchronizes enemy and statistics data between ECS and main game systems
- Features:
  - Enemy tracking with entity transformation
  - Game statistics synchronization (health, shields, etc.)
  - Fallback explosion effects when ECS world is unavailable
  - Event-based communication with MessageBus

#### CombatSystem (`js/systems/combat/combatSystem.js`)

- Core ECS system for combat interactions and projectile management
- Manages projectile collisions, damage application, and visual effects
- Detailed implementation:
  - Event-driven projectile tracking and lifecycle management
  - Optimized collision detection for projectiles
  - Damage calculation and application to health components
  - Hit visualization effects with color-coded feedback
  - Combat statistics tracking for UI display
  - Memory management with proper entity cleanup
  - Self-healing tracking mechanism to handle invalid references

#### EnemySystem (`js/systems/combat/enemySystem.js`)

- Comprehensive enemy entity management using a modular architecture
- Core modules:
  - `EnemyPoolManager` - Object pool system for enemy entities
  - `EnemySpawner` - Spawn point generation and enemy instantiation
  - `EnemyLifecycle` - Enemy reference management and state tracking
- Entity pooling system:
  - Pre-allocated enemy pool to minimize garbage collection
  - Entity recycling with complete state reset
  - Pool size management with configurable parameters
  - Tag management with proper cache handling
  - Component state reset during recycling
- Spawn mechanics:
  - Dynamic spawn point generation in sphere around player
  - Smart spawn interval management with configurable timers
  - Position randomization for unpredictable enemy placement
  - Enemy limit enforcement for balanced difficulty
  - Spawn diagnostics for ensuring system health
- Player docking integration:
  - Automatic enemy freezing when player is docked
  - Event-based docking state synchronization via MessageBus
  - Global game state synchronization as fallback
  - Proper unfreezing when player undocks
- Self-healing capabilities:
  - Continuous spawn system monitoring
  - Periodic validation of enemy references
  - Removal of invalid entities from tracking
  - Regeneration of spawn points as needed
  - Automatic recovery from error states
- Event-driven architecture:
  - Entity lifecycle events for tracking
  - Subscription to player docking/undocking events
  - Combat statistics tracking (enemies destroyed)
  - Entity tag state validation
- Debugging facilities:
  - Periodic diagnostic reporting
  - Robust error logging with context
  - Global state accessibility for emergency intervention
  - Performance metrics tracking

#### EnemyPoolManager (`js/systems/combat/enemyPoolManager.js`)

- Specialized object pooling system for enemy entities
- Pre-allocation features:
  - Initial pool creation with configurable size (default 20)
  - Pre-creation of spectral drone entities
  - Component initialization during pooling
  - Proper tag management for pooled entities
- Entity reuse:
  - Comprehensive state clearing for reused entities
  - Tag cache synchronization with _syncTagCache
  - Component state reset for clean entity reuse
  - Removal of pooled tag when activated
- Error prevention:
  - Duplicate detection and correction
  - Inconsistency detection between pool and active entities
  - Component-specific state validation
  - Defensive entity state verification
- Technical implementation:
  - Complete tag clearing with fallback mechanisms
  - Direct cache flag manipulation when necessary
  - Proper component cleanup on entity return
  - Comprehensive debugging and logging

#### EnemySpawner (`js/systems/combat/enemySpawner.js`)

- Handles generation of spawn points and enemy instantiation
- Model management:
  - Pre-loading of enemy models with GLTFLoader
  - Model caching for performance
  - Material adjustments for visual effects
  - Error handling for model loading failures
- Spawn point generation:
  - Dynamic generation around player position
  - Fallback spawn points when player not found
  - Spherical distribution for surrounding threats
  - Configurable spawn radius and count
  - Periodic regeneration to follow player
- Enemy configuration:
  - Customizable health, damage, and speed settings
  - Randomized spawn parameters for variety
  - Resource-efficient model reuse
  - Proper material setup with emissive properties
- Technical implementation:
  - Three.js integration with mesh handling
  - Random position generation with proper math
  - Spawn validation with fallback mechanisms
  - Proper debug logging for spawn operations

#### EnemyLifecycle (`js/systems/combat/enemyLifecycle.js`)

- Manages the complete lifecycle of enemy entities
- Reference validation:
  - Periodic checking of enemy entity references
  - Removal of invalid or destroyed entities
  - Consistency checking of entity tag state
  - Auto-repair of tag cache inconsistencies
- Docking state management:
  - Global freeze/unfreeze of all enemies
  - Component-level enabling/disabling
  - State preservation during docked mode
  - Proper resumption after undocking
- Cleanup operations:
  - Safe entity removal and cleanup
  - Component state cleanup during entity recycling
  - Proper MessageBus notification
  - Memory leak prevention
- Error recovery:
  - Detection of inconsistent entity states
  - Automatic tag cache synchronization
  - Component reset for problematic entities
  - Comprehensive logging for troubleshooting

### Physics System Implementation

#### CollisionSystem (`js/systems/physics/collisionSystem.js`)

- Spatial partitioning grid for optimized collision detection
- Features:
  - Cell-based entity tracking with O(1) lookup
  - Multi-cell registration for large or fast-moving entities
  - Direction-aware cell expansion for high-speed objects
  - Memory-optimized collision pair tracking
  - Collision type differentiation (trigger vs. physical)
- Special optimizations:
  - Projectile-specific handling for better hit detection
  - Entity collision radius consideration for accurate detection
  - Performance-critical path optimization for player projectiles
- Physical collision resolution:
  - Impulse-based physics response with restitution
  - Mass-dependent position correction
  - Relative velocity calculation along collision normal
  - Event publication for collision feedback

#### MovementSystem (`js/systems/physics/movementSystem.js`)

- Physics integration system for entity movement
- Features:
  - Force and torque integration into velocity
  - Velocity integration into position
  - Angular velocity integration into rotation
  - Drag application for both linear and angular movement
- Integration methods:
  - Force-to-acceleration conversion based on mass
  - Velocity-based position updates with delta time scaling
  - Quaternion-based rotation integration
  - Euler-to-quaternion conversion for proper rotation handling
- Physics flags:
  - Kinematic flag for non-physical objects
  - Frozen rotation flag for specific entity types
  - Mass-based calculations for realistic movement
- Performance considerations:
  - Event-based notifications only when entities actually move
  - Force reset after integration to prevent accumulation
  - Proper clamping to prevent numerical instability

### Utility Systems

#### PathUtils (`js/utils/pathUtils.js`)

- Environment-aware path handling for cross-platform deployment
- Features:
  - Automatic path adjustment for local development vs. hosted environments
  - GitHub Pages compatibility for resource loading
  - Path normalization and sanitization
  - Debugging output for path resolution

### Rendering Systems

#### CameraSystem (`js/systems/rendering/cameraSystem.js`)

- Third-person camera controller for player entities
- Features:
  - Target-based camera following with smooth interpolation
  - Configurable follow distance, height, and smoothing factor
  - Quaternion-based camera orientation for stable rotations
  - Camera effects including screen shake with intensity and duration
  - Dynamic target acquisition and tracking
- Technical implementation:
  - Transform-based positioning with quaternion rotation
  - Lerp-based smooth following for natural camera movement
  - Event-driven camera shake effects with falloff
  - Configurable camera parameters for different gameplay scenarios

#### RenderSystem (`js/systems/rendering/renderSystem.js`)

- Entity-mesh synchronization system with optimization features
- Responsibilities:
  - Syncs entity transforms with Three.js mesh objects
  - Manages mesh lifecycle (creation, update, removal)
- Implements frustum culling for rendering optimization
- Features:
  - Event-based updates for efficiency
  - Performance optimizations:
    - Batched mesh updates
    - Lazy transformation updates
    - Off-screen object skipping
  - Error recovery with fallback rendering modes
  - Configurable update frequency
  - Component-based visual property management

#### TrailSystem (`js/systems/rendering/trailSystem.js`)

- Manages visual trails behind moving objects
- Features:
  - Velocity-based trail generation
  - Dynamic point creation with time-based fading
  - Color variation based on object type and velocity
  - Length adjustment based on movement speed
  - Opacity control for natural trail appearance
- Implementation details:
  - Buffer geometry for efficient rendering
  - Points material with custom size and opacity
  - Trail history with fixed-size arrays
  - Time-based position sampling
  - Performance-aware update method
- Optimization features:
  - Object pooling for trail segments
  - Manual buffer updates to reduce allocations
  - Skip inactive or slow-moving objects
  - Adaptive history size based on velocity
  - Reference counting for proper cleanup
- Technical integration:
  - Component-driven trail assignment
  - Custom handling for manually registered trails
  - Fallback for entities without proper setup
  - Transform-based positioning for accurate attachment

#### VisualEffectsSystem (`js/systems/rendering/visualEffectsSystem.js`)

- Manages and renders particle-based visual effects
- Effect types:
  - Explosions with dynamic particle animation
  - Impact effects with size and color variation
  - Thruster trails with velocity-based appearance
  - Shield impacts with dissipating energy visualization
  - Mining beam contact points with resource-specific colors
- Implementation details:
  - Object-pooled particle systems for performance
  - Time-based animation with automatic cleanup
  - Adaptive particle count based on performance settings
  - GPU-accelerated rendering with point sprites
  - Material reuse for similar effects
- Enhanced features:
  - Automatic cleanup of completed effects
  - Memory-efficient particle management
  - Event-driven effect triggering
  - Optimized buffer geometry updates
  - Additive blending for energy effects
  - Dynamic particle sizing based on distance
  - Custom shaders for specialized effects
- Technical implementation:
  - Centralized effect ID tracking
  - Container-based effect organization
  - Performance-aware update cycle
  - Typed arrays for particle data storage
  - Memory pool integration for vector reuse

### Mining System

#### MiningSystem (`js/systems/mining/miningSystem.js`)

- Resource extraction mechanics for player mining operations
- Core functionality:
  - Mining operation lifecycle management (start, update, stop)
  - Resource extraction calculation based on mining laser power
  - Progress tracking with partial resource accumulation
  - Distance and depletion validation
  - Cargo capacity management integration
- Technical implementation:
  - Event-driven mining operation control
  - Mining range checking with position-based distance calculation
  - Resource type-specific mining speed modifiers
  - Visual laser beam positioning and updates
  - Progressive resource extraction with threshold-based collection
  - Mineable component integration for asteroid resources
  - Cargo component integration for resource storage
  - Event publication for UI feedback and sound effects

### Input Systems

#### InputSystem (`js/systems/input/inputSystem.js`)

- Low-level input handling and translation to game events
- Features:
  - Keyboard and mouse event processing
  - Pointer lock management for camera control
  - Input state tracking for continuous actions
  - Action mapping system for control customization
- Technical implementation:
  - Browser event listeners for raw input capture
  - Key state tracking for held-key detection
  - Mouse movement accumulation for smooth camera control
  - Pointer lock API integration for FPS-style mouse control
  - Event-based communication through MessageBus
  - Prevention of browser default actions (context menu)

#### ShipControlSystem (`js/systems/input/shipControlSystem.js`)

- High-level ship control from mapped input actions
- Core functionality:
  - Thrust control based on input events
  - Ship rotation using mouse movement
  - Mining laser targeting and control
  - Nearest asteroid detection and selection
- Technical implementation:
  - Event-based input response through MessageBus
  - Quaternion-based ship rotation for smooth movement
  - Physics-ready thrust application through thruster component
  - Automatic target acquisition for mining operations
  - Range-based asteroid detection and prioritization
  - Tag-based player entity identification
  - Mining action automation with automatic targeting

### Environment Systems

#### Asteroid Belt (`js/modules/environment/asteroidBelt.js`)

- Procedural asteroid field generation with visual enhancements
- Features:
  - Deformable icosahedron, tetrahedron, and octahedron-based asteroid geometries
  - Resource classification system (iron, gold, platinum) with weighted distribution
  - Emissive material properties for better visibility in space
  - Orbiting motion with individual rotation rates
  - Toroidal distribution pattern with height variation
- Technical implementation:
  - Vertex manipulation for natural irregular shapes
  - Resource-specific coloration with HSL color mapping
  - System-specific resource multipliers for varied gameplay
  - Density control for different star systems
  - Proximity-based asteroid finding for mining operations

#### Mothership (`js/modules/environment/mothership.js`)

- Central base station for player with advanced visual design
- Visual Components:
  - Main ring structure with matte black material
  - Neon turquoise accent rings for visual emphasis
  - Advanced portal effect in the center using custom shader material
  - Counter-rotating inner rings for dynamic visual interest
  - Navigation lights with animated intensity for realism
  - Numerous decorative neon details along the structure
- Technical implementation:
  - THREE.Group-based structure for organized hierarchy
  - Custom shader implementation for interactive portal effect:
    - Noise-based animations for organic movement
    - Fractal Brownian Motion for complex patterns
    - Time-based animations for continuous visual change
  - Programmatically generated geometry for consistent scale
  - Emissive materials with bloom-compatible properties
  - Animated elements with independent rotation cycles
- Positioning and Scale:
  - Located high above the play area for visibility
  - Proper scale to serve as a significant landmark
  - Horizontal orientation with the portal facing downward
- Gameplay Integration:
  - Acts as a safe zone and resource trading hub
  - Docking target for player ship
  - Provides region information for proximity detection
  - Updates animations continuously through game loop

#### Planets (`js/modules/environment/planets.js`)

- Planetary system management with procedural generation
- Features:
  - Solar system recreation with accurate planet properties
  - Procedural planet generation for new star systems
  - Planet-specific textures and material properties
  - Special features like rings and atmospheres
  - Size, distance, and orbital speed variation
- Technical implementation:
  - Star class-based planet characteristics (size, color, etc.)
  - System-specific palette generation for visual coherence
  - Multiple geometry types with specialized materials
  - Texture mapping for known solar system planets
  - Orbital animation with varying speeds

#### Skybox (`js/modules/environment/skybox.js`)

- Advanced shader-based space background
- Features:
  - Procedural star field with twinkling effect
  - Milky Way texture integration for realism
  - System-specific star and nebula density
  - Color tinting based on star type
- Technical implementation:
  - Custom GLSL shader for star field generation
  - Dynamic star density and distribution control
  - Noise-based twinkling animation
  - Real-time camera-relative positioning

#### Sun (`js/modules/environment/sun.js`)

- Central star with advanced shader-based volumetric rendering
- Features:
  - Surface granulation with dynamic noise
  - Solar prominence and flare effects
  - Multi-layered corona with realistic falloff
  - Star type adaptation (O, B, A, F, G, K, M)
- Technical implementation:
  - Advanced fragment shaders for surface detail
  - Noise-based turbulence for natural appearance
  - View-dependent intensity for corona effect
  - Multi-layer approach with varying opacity
  - Point light source with star-type-specific properties

#### System Transition (`js/modules/environment/systemTransition.js`)

- Visual effects for traveling between star systems
- Features:
  - Particle-based warp tunnel animation
  - Camera animation during transitions
  - Flash effect for system change
  - Smooth transition timeline
- Technical implementation:
  - Dynamic particle movement toward camera
  - Timing-based animation sequence
  - DOM overlay for screen flash effect
  - Callback system for transition completion

#### Star System Generator (`js/modules/environment/starSystemGenerator.js`)

- Procedural star system creation and management
- Features:
  - Random star system generation with realistic properties
  - Star classification system (O, B, A, F, G, K, M)
  - System connections for travel network
  - Resource distribution calculation based on star type
- Technical implementation:
  - System-specific properties affecting all environment components
  - Procedural naming system for stars and systems
  - Network-based system connections with travel links
  - Resource multiplier calculations for balanced gameplay
  - Persistent system data storage for revisiting

### Control Systems

#### DockingSystem (`js/modules/controls/dockingSystem.js`)

- Manages ship docking with mothership for trading and upgrades
- Features:
  - Proximity detection for docking availability
  - UI management for docking interface
  - Resource selling with different pricing per material
  - Ship upgrade system with progressive costs
  - Repair and refueling services
- Technical implementation:
  - Event-based docking state transitions
  - Resource-to-credits conversion
  - UI synchronization with spaceship stats
  - Health system integration and persistence
  - Undocking position management and collision avoidance
  - Message bus integration for global state updates

#### InputHandler (`js/modules/controls/inputHandler.js`)

- Low-level input processing for spaceship control
- Features:
  - Keyboard mapping for spaceship thrust control
  - Mouse movement capture for rotation
  - Pointer lock management for immersive control
  - Context-sensitive input blocking (e.g., when docked)
- Technical implementation:
  - Browser event listeners with stateful tracking
  - Mouse sensitivity configuration
  - Pointer Lock API integration
  - Visual instructions for player guidance
  - Event propagation to physics system

#### MiningSystem (`js/modules/controls/miningSystem.js`)

- Mining mechanics and UI for resource extraction
- Features:
  - Resource type-specific mining speeds
  - Visual mining laser with dynamic properties
  - Mining efficiency scaling with upgrades
  - Resource collection with random amounts
  - Asteroid depletion and destruction effects
  - Mining progress visualization
- Technical implementation:
  - Particle systems for mining impact
  - Screen-space laser beam rendering
  - Resource type detection and multipliers
  - Distance-based operations with range limits
  - Efficiency-based extraction bonus system
  - Asteroid health tracking and depletion
  - Color-coding based on resource types

#### TargetingSystem (`js/modules/controls/targetingSystem.js`)

- Target acquisition and lock-on mechanics
- Features:
  - Asteroid scanning within configurable radius
  - Visual target reticle with animations
  - Target cycling through nearby asteroids
  - Distance tracking and display
  - Resource type identification
- Technical implementation:
  - Scan radius scaling with ship upgrades
  - Three.js mesh-based targeting reticle
  - Proximity-sorted target list management
  - UI integration for target information
  - Look-at constraints for camera-facing indicators
  - Animated reticle with pulse and rotation effects
  - Periodic re-scanning for dynamic environment

### UI Systems

#### HUD (`js/modules/ui/hud.js`)

- Core game interface with stylized sci-fi aesthetic
- Features:
  - Flight information panel with velocity and thruster status
  - Status display for hull integrity and shield levels
  - Resource tracking for mined materials
  - Location information and coordinates display
  - Animated startup sequence with glitch effects
  - Holographic styling with corner elements
- Technical implementation:
  - DOM-based UI with CSS animations
  - Scanline visual effect for immersion
  - Dynamic status indicators with color transitions
  - Modular panel creation with consistent styling
  - Real-time value updates with interpolation

#### Mining Display (`js/modules/ui/miningDisplay.js`)

- Specialized UI for mining operations
- Features:
  - Resource target information
  - Mining progress tracking
  - Cargo capacity visualization
- Technical implementation:
  - DOM-based interface elements
  - Dynamic capacity bar with color-coded thresholds
  - Resource counter integration with mining system

#### Mothership Interface (`js/modules/ui/mothershipInterface.js`)

- Comprehensive docking UI for resource trading and ship upgrades
- Tab-based interface organization:
  - Resources tab for selling mined materials
  - Upgrades tab for enhancing ship capabilities
  - Services tab for repair and refueling
  - Travel tab for accessing the star map
  - Games tab for playing the blackjack mini-game
- Core functionality:
  - Resource selling interface with dynamic pricing
  - Ship status display (cargo, fuel, shield, hull)
  - Upgrade progression system with tiered improvements
  - Credit-based economy for purchasing upgrades
  - Repair and refueling services with cost calculation
  - Integration with all ship systems for upgrades
- Advanced UI features:
  - Tabbed interface with dynamic content loading
  - Modal dialogs for confirmations
  - Resource icons with color-coded categories
  - Upgrade progress bars with visual feedback
  - Animated transitions between interface states
  - Responsive design with scrolling for smaller screens
- Technical implementation:
  - DOM-based UI with CSS styling
  - Event-driven updates for real-time data
  - Touch-optimized for mobile device support
  - Clean integration with game systems:
    - Star map for system navigation
    - Blackjack game for resource gambling
    - Settings menu for game configuration
  - Dock/undock prompting system
  - Advanced mobile touch handling with proper scrolling

#### Star Map (`js/modules/ui/starMap.js`)

- Interactive galactic navigation interface
- Features:
  - Visual star system representation with connections
  - System information panels with resource distribution
  - Travel capability between connected systems
  - Current and selected system highlighting
- Technical implementation:
  - Canvas-based star map visualization
  - Event handling for system selection
  - Resource indicator bars for system comparison
  - Integration with star system generator

#### Targeting System UI (`js/modules/ui/targetingSystem.js`)

- Target acquisition interface for mining and combat
- Features:
  - Lock-on display with animated reticle
  - Target information panel with distance tracking
  - Resource type identification
- Technical implementation:
  - DOM-based overlay elements
  - Dynamic positioning based on screen coordinates
  - Real-time distance calculations

#### Controls Menu (`js/modules/ui/controlsMenu.js`)

- Game control reference interface
- Features:
  - Key mapping display with action descriptions
  - Keyboard and mouse control listings
  - Modal overlay with styled key indicators
- Technical implementation:
  - DOM-based modal window
  - Event-driven visibility toggle
  - Click-outside detection for closing

#### Game Over Screen (`js/modules/ui/gameOverScreen.js`)

- End game state interface
- Features:
  - Game over message with cause of failure
  - Resources collected summary
  - Restart option with visual feedback
- Technical implementation:
  - Full-screen modal overlay
  - Dynamic messaging based on failure condition
  - Resource summary display with fallback handling
  - Audio cues for game over state

#### Blackjack Game (`js/modules/ui/blackjackGame.js`)

- In-game mini-game for resource gambling
- Features:
  - Classic blackjack gameplay with space theme
  - Resource wagering system
  - Dealer AI with appropriate gameplay decisions
  - Visual card representation
- Technical implementation:
  - DOM-based game interface
  - Card deck management and dealing system
  - Game state transitions
  - Integration with resource management

#### Combat Display (`js/modules/ui/combatDisplay.js`)

- Combat-focused interface elements
- Features:
  - Weapon status and ammunition tracking
  - Target information display
  - Combat statistics and enemy counts
  - Special weapon indicators
- Technical implementation:
  - HUD integration with combat-specific elements
  - 3D-to-2D coordinate projection for targeting
  - Notification system for combat events
  - Dynamic element updating based on combat state

## Memory Management

The game implements an advanced memory management system to reduce garbage collection pauses and improve performance.

### Vector Pool (`js/main.js`)

- Global pool of reusable Vector3 objects
- Prevents frequent allocation/deallocation of vector objects
- Implementation details:
  - Pre-allocated array of vector objects
  - `get(x, y, z)` method returns a pooled vector initialized with coordinates
  - `release(vector)` returns vectors to the pool
  - Configurable maximum pool size to prevent memory bloat
- Usage patterns:
  - Used for temporary calculations in physics systems
  - Used for position queries and raycasting
  - Critical for physics calculations to avoid per-frame allocations

### Object Pool (`js/main.js`)

- Generic pooling system for frequently created game objects
- Configurable factory pattern for different object types
- Core features:
  - Type-specific pools with factory functions
  - Customizable initial and maximum sizes
  - Object lifecycle methods (reset/clear)
  - Automated initialization and cleanup
- Pre-defined pools:
  - Hit effects
  - Projectiles
  - Particle systems
  - Explosion effects
- Integration with ECS:
  - Pooled resources can be linked to ECS entities
  - Entity IDs can be stored in object userData

### Typed Array Pools (`js/utils/memoryManager.js`)

- Specialized pools for typed arrays used in rendering and physics
- Reduces fragmentation and allocation overhead
- Supported array types:
  - Float32Array
  - Int32Array
  - Uint32Array
  - Uint16Array
  - Uint8Array
- Implementation:
  - Arrays are recycled based on size compatibility
  - Arrays are zeroed before reuse for safety
  - Configurable maximum pool sizes
  - Reference tracking for debugging

### Memory Statistics (`js/utils/memoryManager.js`)

- Real-time memory usage monitoring system
- Tracks allocation patterns and pool utilization
- Features:
  - Vector pool size tracking
  - Object pool utilization by type
  - Typed array pool usage statistics
  - Memory usage reporting
  - Debug mode visualization
- Developer tools:
  - `MemoryStats.update()` - Refreshes statistics
  - `MemoryStats.getReport()` - Generates detailed report
  - `MemoryStats.logReport()` - Outputs to console
  - Global `window.MemoryStats` access for debugging

### Game Module (`js/modules/game.js`)

### Intro Sequence (`js/modules/introSequence.js`)

- Cinematic game introduction system with Star Dreadnought ship
- Animation sequence:
  - Arrival phase with portal formation and ship entrance
  - Player ship deployment phase with teleporter beam 
  - Departure phase with dramatic exit
- Technical components:
  - `StarDreadnought` class (`js/modules/environment/starDreadnought.js`):
    - Massive capital ship created procedurally using THREE.js geometries
    - Advanced engine glow effects with particle systems
    - Teleport beam with shader-based animation and particles
    - Detailed surface features (turrets, trenches, shield generators)
    - Animated components synchronized with sequence timing
  - Portal effect:
    - Custom shader-based warp tunnel implementation
    - Particle systems for enhanced visual appeal
    - Ripple animations with time-based parameters
  - Camera animations:
    - Keyframe-based camera movements throughout sequence
    - Custom easing functions for natural motion
    - Smooth transitions between sequence phases
- Visual effects:
  - Screen flash effects via DOM overlay
  - Teleport beam with particle emission
  - Engine trail particles on the Star Dreadnought
  - Shield effect when player ship is released
- Sequence control:
  - Time-based progress tracking for animations
  - Phase system for managing different parts of the sequence
  - Skip functionality with local storage persistence
  - Completion callback for game state transition
- Integration with game systems:
  - Temporarily disables player control during sequence
  - Freezes enemy spawning and movement
  - Hides UI elements until completion
  - Preserves initial camera state for restoration

The intro sequence provides a dramatic, cinematic introduction to the game while also explaining the player's arrival in the star system, serving both narrative and tutorial purposes. 

### Star System Generator (`js/modules/environment/starSystemGenerator.js`)

- Star system procedural generation system
- Core features:
  - System classification with varied resource distribution
  - Star class implementation (O, B, A, F, G, K, M)
  - Skybox and lighting configuration
  - System connection network via warp gates
  - Resource multiplier calculation based on star properties
  - Procedurally generated planet placement and properties
- Custom system integration:
  - `addCustomSystem()` method for API-generated systems
  - Custom texture URL support for skyboxes and planets
  - Planet data storage for AI-generated assets
  - Connection of custom systems to existing network
  - Parameter validation and fallback generation
  - Custom system flagging for special handling
  - Storage of custom planet data with `storePlanetData()`
- System characteristics:
  - Unique visual identity for each system
  - System-specific resource distribution
  - Star color based on stellar classification
  - Random but consistent naming convention
  - Position data for star map visualization
  - Classification-based special features

### Audio (`js/modules/audio.js`)