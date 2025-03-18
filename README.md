# Solar System Asteroid Miner

A browser-based 3D space mining simulation game built with JavaScript and Three.js.

## Overview

Solar System Asteroid Miner is a resource extraction and trading game set in space. Players control a mining ship, harvest resources from asteroids, and return to the mothership to sell resources and upgrade their vessel. The game features multiple star systems to explore, each with unique characteristics and resource distributions.

## Features

- **3D Space Environment**: Navigate a procedurally generated universe with multiple star systems, each containing planets, asteroid fields, and a unique visual style.
- **Mining Mechanics**: Extract valuable resources from asteroids using mining lasers with resource-specific extraction rates and visual feedback.
- **Resource Management**: Manage cargo space, fuel consumption, and ship integrity.
- **Trading System**: Sell mined resources at the mothership for credits.
- **Ship Upgrades**: Enhance your ship's capabilities:
  - Mining laser efficiency
  - Cargo capacity
  - Engine power
  - Shield strength
  - Hull durability
  - Scanner range
- **Combat System**: Defend yourself against hostile entities with different weapon modes and combat mechanics.
- **Star System Travel**: Explore different star systems, each with unique resource distributions and visual appearance.
- **Environmental Hazards**: Navigate through radiation zones, dense asteroid clusters, and solar hazards.
- **Mini-games**: Play blackjack at the mothership to potentially earn extra credits.
- **Visual Effects**: Enjoy particle-based explosions, damage flashes, engine trails, and mining beam effects.

### Universe Exploration

- **Diverse Star Systems**: Travel between star systems with different star types (O, B, A, F, G, K, M) affecting resource availability
- **Visually Unique Environments**: Each star system features distinct coloration, nebula density, and visual appearance
- **Dynamic Skybox**: Immersive starfield with system-specific star density and Milky Way visibility
- **Realistic Star Types**: Stars range from hot blue giants to cool red dwarfs, each with realistic surface details and corona effects
- **Spectacular Transitions**: Warp between systems with a stunning particle tunnel effect and smooth visual transition
- **Procedural Planets**: Discover unique planets with realistic textures, atmospheres, and ring systems
- **Central Mothership**: Dock at the detailed mothership to trade resources, upgrade your ship, and play mini-games
- **Resource Distribution**: Different star types have varying concentrations of resources - some rich in iron, others in precious metals

### Mining Environment

- **Asteroid Belt Exploration**: Navigate dense asteroid fields with realistic orbital motion and distribution
- **Resource Visualization**: Identify resource types by asteroid coloration and emissive properties
- **System-Specific Mining**: Resource distribution varies by system - some rich in common minerals, others with abundant rare metals
- **Dynamic Asteroid Density**: System-specific asteroid field density affects navigation difficulty and mining opportunities
- **Asteroid Deformation**: Realistically deformed asteroid shapes with various sizes and compositions
- **Visual Resource Depletion**: Watch asteroids visually transform as resources are extracted

### Advanced Targeting & Extraction

- **Smart Targeting System**: Lock onto nearby asteroids with an upgradeable scanner
- **Visual Target Reticle**: Dynamic targeting indicator shows selected asteroid with range information
- **Target Cycling**: Easily cycle through detected asteroids to find your preferred resource type
- **Resource Identification**: Visual and HUD indicators show asteroid resource type before mining
- **Adaptive Mining Laser**: Mining beam appearance changes based on resource type and mining efficiency
- **Resource-Based Mining Speed**: Different resources require different extraction times - platinum takes longer than iron
- **Efficiency Upgrades**: Improve mining speed with mothership upgrades for faster resource collection
- **Visual Extraction Feedback**: Mining particles and laser effects show active resource extraction
- **Mining Progress Indicator**: Clear UI showing extraction progress for current asteroid
- **Bonus Resource Chance**: Higher mining efficiency increases chances of bonus resource yield

### Mothership Interaction

- **Proximity Docking**: Approach the mothership and press a key to dock when in range
- **Trading Interface**: Sell different resources at varying market rates
- **Upgrade Shop**: Purchase ship improvements with credits earned from resource sales
- **Ship Refueling**: Replenish fuel supply for continued exploration
- **Hull and Shield Repair**: Repair damage sustained during your mining operations
- **Credit Economy**: Balance upgrade purchases with your earned credits
- **Persistent Upgrades**: All ship improvements are permanently applied
- **Upgrade Progression**: Each upgrade increases ship capabilities while also increasing future upgrade costs
- **Visual Upgrade Feedback**: See the effects of your upgrades directly impact gameplay

## User Interface Features

### Immersive HUD System
- Sci-fi themed heads-up display with animated startup sequence
- Real-time flight data including speed, coordinates, and thruster status
- Dynamic shield and hull integrity monitors with visual damage indicators
- Resource tracking with capacity management display
- Stylized holographic design with scanline effects and corner decorations

### Resource Mining Interface
- Target asteroid information with resource composition details
- Visual mining progress feedback
- Cargo capacity monitoring with color-coded capacity warnings
- Automated target tracking with distance calculations

### Mothership Docking Station
- Comprehensive trading interface for selling mined resources
- Ship maintenance with fuel replenishment and repair options
- Progressive upgrade system for ship capabilities:
  - Enhanced fuel capacity for longer expeditions
  - Improved engine performance for faster travel
  - Advanced mining lasers for efficient resource extraction
  - Reinforced hull for damage resistance
  - Extended scanner range for detecting distant objects
- Progress tracking for each upgrade path with visual indicators

### Galactic Navigation
- Interactive star map with visual representation of the galaxy
- Detailed system information with resource distribution analysis
- Travel capabilities with fuel consumption calculations
- Connected star systems with navigation paths
- Visual highlighting of current and selected systems

### Targeting System
- Lock-on targeting display for asteroids and enemies
- Distance tracking with real-time updates
- Resource type identification for informed mining decisions
- Target cycling for efficient resource selection

### In-Game Entertainment
- Stellar Blackjack mini-game for resource gambling
- Resource wagering system with risk/reward dynamics
- Dealer AI with authentic game mechanics
- Visually engaging card interface

### Combat Interface
- Weapon status displays with ammunition tracking
- Enemy targeting with health and shield indicators
- Combat statistics with hit counts and damage metrics
- Special weapon availability and cooldown timers
- Notification system for combat events

### Game Controls Reference
- Accessible controls menu with key mapping display
- Visual key indicators for easy reference
- Comprehensive listing of all gameplay actions

## Technical Details

### Architecture

Built using an enhanced Entity Component System (ECS) architecture with an event-driven message bus system:

- **Entities**: Game objects like ships, asteroids, projectiles
- **Components**: Data containers for entity properties:
  - `TransformComponent`: Position, rotation, and scale in 3D space
  - `RigidbodyComponent`: Physics properties for momentum and collisions
  - `HealthComponent`: Health and shield management with damage system
  - `MeshComponent`: Visual representation with Three.js meshes
  - `TrailComponent`: Visual trails for movement effects
  - `MineableComponent`: Resource properties for asteroids
  - `EnemyAIComponent`: Behavior patterns for hostile entities
  - `MiningLaserComponent`: Resource extraction tool with visual effects
  - `CargoComponent`: Resource storage with capacity management
  - `ThrusterComponent`: Ship propulsion with particle effects
- **Systems**: Logic that processes entities with specific components:
  - Optimized physics system with batch processing
  - Instanced rendering system for performance
  - Combat system for projectiles and damage
  - Mining system for resource extraction
  - AI system for enemy behavior
  - Trail system for visual effects
- **Message Bus**: Event-driven communication system allowing components to interact without direct references
- **Performance Optimizations**:
  - Entity pooling system that recycles game objects to reduce garbage collection
  - Spatial partitioning grid for efficient collision detection
  - Customized update cycles with priority-based execution
  - Optimized movement system with batch processing
  - Enhanced entity cache for faster lookups
  - System update prioritization for critical operations

### Memory Management

Advanced memory management techniques to reduce garbage collection pauses:

- **Vector Pool**: Reusable THREE.Vector3 objects to avoid frequent allocations
- **Object Pooling**: Pre-allocated object pools for commonly created entities:
  - Hit effects
  - Projectiles
  - Particle effects
  - UI elements
- **Typed Array Pools**: Reusable typed arrays for geometry operations:
  - Float32Array for vertex data
  - Uint32Array for indices
  - Uint16Array for compact indices
  - Uint8Array for attribute data
- **Memory Statistics**: Real-time tracking of pool usage and memory allocations
- **Lifecycle Management**: Proper disposal of Three.js resources to prevent memory leaks
- **Reference Cleanup**: Automatic clearing of object references when returned to pools

### Rendering System

Enhanced rendering with modern post-processing effects:

- **Camera effects including screen shake and damage flashes**
- **Third-person camera with smooth target following**
- **Thruster trail effects that respond to ship movement**
- **Particle-based explosion effects with realistic physics**
- **Screen-space visual feedback for player damage**
- **Performance optimization with off-screen object culling**
- **Motion trails for fast-moving objects and projectiles**
- **Advanced Post-Processing Pipeline**:
  - UnrealBloomPass for glowing effects on energy sources
  - FXAA for edge smoothing without performance impact
  - Color correction for visual mood enhancement
  - Film grain effect for cinematic appearance
  - Vignette effect for visual focus and atmosphere
- **HDR Rendering**: ACES Filmic tone mapping for realistic lighting
- **Optimized Resource Management**:
  - Proper disposal of Three.js objects
  - Material sharing between similar objects
  - Instanced mesh rendering for asteroid fields
  - Dynamic LOD (Level of Detail) system for distant objects
- **Visual Effects System**:
  - Dedicated system for managing explosion and impact effects
  - Time-based particle animation with automatic cleanup
  - GPU-accelerated particle systems
  - Object-pooled visual effects
- **Adaptive Quality Settings**:
  - Automatic adjustment of post-processing based on performance
  - Fallback rendering path when shaders aren't available
  - Debug-mode visualization of render statistics

### Technologies

- **Three.js**: 3D rendering with advanced post-processing effects
- **JavaScript Modules**: Modular code organization
- **Custom Physics**: Zero-gravity Newtonian physics system with realistic collisions
- **Event System**: Message bus for decoupled communication
- **Audio System**: Dynamic sound effects and music system with spatial audio

## Getting Started

1. Clone the repository
2. Open `index.html` in a modern browser
3. Use WASD to move, mouse to look around, left mouse button to mine, and right mouse button to fire weapons

## Controls

- **WASD**: Forward, left, backward, right movement
- **Mouse**: Look around
- **Left Mouse Button**: Activate mining laser
- **Right Mouse Button**: Fire weapons
- **Shift**: Boost (increased speed, higher fuel consumption)
- **Space**: Dock with mothership (when in range)
- **F**: Cycle weapon modes
- **M**: Toggle audio mute
- **ESC**: Exit pointer lock / Pause game

## Game Loop

1. Mine resources from asteroids
2. Manage cargo space and fuel
3. Return to mothership to sell resources
4. Upgrade your ship with credits earned
5. Travel to different star systems to find rarer, more valuable resources
6. Defend against increasingly challenging threats

## Implementation Details

### Mining System
- Automated asteroid targeting for efficient resource collection
- Visual laser beams dynamically connecting ship to mining target
- Progress indicators for resource extraction rate
- Resource-specific mining speeds based on laser upgrades
- Proximity-based mining operations with range limitations
- Depletion mechanics with asteroid destruction effects
- Cargo capacity monitoring with automatic mining interruption

### Input System
- Intuitive controls with customizable key mappings
- Mouse-look camera with pointer-lock for immersive gameplay
- First-person style ship rotation and movement
- Automatic targeting for mining and combat actions
- Continuous thrust input for smooth flight control
- Immersive camera shake effects during collisions and damage
- UI interaction through contextual controls

### Rendering System
- Camera effects including screen shake and damage flashes
- Third-person camera with smooth target following
- Thruster trail effects that respond to ship movement
- Particle-based explosion effects with realistic physics
- Screen-space visual feedback for player damage
- Performance optimization with off-screen object culling
- Motion trails for fast-moving objects and projectiles
- **Advanced Post-Processing Pipeline**:
  - UnrealBloomPass for glowing effects on energy sources
  - FXAA for edge smoothing without performance impact
  - Color correction for visual mood enhancement
  - Film grain effect for cinematic appearance
  - Vignette effect for visual focus and atmosphere
- **HDR Rendering**: ACES Filmic tone mapping for realistic lighting
- **Optimized Resource Management**:
  - Proper disposal of Three.js objects
  - Material sharing between similar objects
  - Instanced mesh rendering for asteroid fields
  - Dynamic LOD (Level of Detail) system for distant objects
- **Visual Effects System**:
  - Dedicated system for managing explosion and impact effects
  - Time-based particle animation with automatic cleanup
  - GPU-accelerated particle systems
  - Object-pooled visual effects
- **Adaptive Quality Settings**:
  - Automatic adjustment of post-processing based on performance
  - Fallback rendering path when shaders aren't available
  - Debug-mode visualization of render statistics

### Physics System
- Custom zero-gravity physics implementation with friction for control
- Spatial partitioning collision detection for optimal performance
- Cell-based entity tracking with optimized lookups
- Impulse-based collision resolution with mass considerations
- Hull resistance system with survival chance based on impact type
- Visual effects for collisions and damage
- Quaternion-based rotation integration for stable movement

### Combat System
- Weapon system with different firing modes
- Projectile management with trails and lighting effects
- Enemy AI with different behavior patterns
- Health and shield system with regeneration
- Hit visualization effects with color-coded feedback
- Enemy pooling system for performance optimization
- Self-healing spawn system with dynamic spawn point generation
- Spectral drones with unique visual effects and movement patterns

### Star System Generator
- Procedurally generated star systems with unique characteristics
- System-specific visual styles and resource distributions
- Transition effects when traveling between systems

### Memory Management System
- **Vector Pooling**: Recycling of vector objects for position, direction, and force calculations
- **Object Pooling System**: Framework for creating and managing object pools:
  - Pre-allocation of commonly used objects during initialization
  - Automatic object recycling with reset and clear methods
  - Pool size management to prevent memory bloat
  - Type-specific factory functions for object creation
- **Particle Effect Management**: Optimized particle systems using pooled geometry and materials
- **Projectile Recycling**: Efficient projectile management without constant allocation/deallocation
- **Mesh Instancing**: Using THREE.InstancedMesh for rendering many similar objects
- **Typed Array Management**: Pooled typed arrays for geometry operations
- **Garbage Collection Reduction**: Strategies to minimize GC pauses:
  - Reusing objects instead of creating new ones
  - Pre-binding methods to avoid closure creation
  - Pooled variables for hot path calculations
  - Optimized deltaTime calculation without object creation
- **Performance Monitoring**: Debug tools to track memory usage and object allocation

### Message Bus Architecture
- Decoupled communication between game components
- Event-driven design for better code organization
- Enhanced error handling and recovery mechanisms

### Optimized ECS Architecture
- **Component-First Design**: Optimized data structures for component storage and access
- **Batch Processing**: Systems process entities in groups for improved performance
- **Priority Execution**: Systems execute in priority order to ensure critical systems run first
- **Entity Caching**: Smart caching of entity references to reduce lookups
- **System Querying**: Efficient entity querying based on component requirements
- **Event Integration**: Full integration with the message bus for component-level events
- **Dynamic System Registration**: Systems can be added or removed at runtime
- **Component Lifecycle Hooks**: Components have attached/detached lifecycle events
- **World Management**: Centralized world manager controls all system updates
- **Debug Mode**: Special debug mode provides real-time statistics on entity and system performance

## License

See the LICENSE file for details.

## Credits

Developed as a learning project for Three.js and ECS architecture.

