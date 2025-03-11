# Solar System Asteroid Miner

A 3D space simulation game where players navigate the solar system, mine asteroids, and engage in combat.

## Overview

Solar System Asteroid Miner is a browser-based 3D space simulation built with Three.js. Players control a spaceship to explore the solar system, mine resources from asteroids, and engage in combat with enemy ships.

## Features

- Realistic 3D solar system environment with planets
  - Procedurally generated star systems
  - Detailed planet models with textures and atmospheres
  - Dynamic asteroid belts with minable resources
  - Realistic space lighting and effects
  - Mothership docking system

- Spaceship flight controls with physics-based movement
  - 6 degrees of freedom movement
  - Realistic inertial physics
  - Thruster-based propulsion with particle effects
  - Boost capability for rapid travel

- Mining system for extracting resources from asteroids
  - Mining laser for resource extraction
  - Three resource types: iron, gold, platinum
  - Cargo management system
  - Resource trading at the mothership

- Combat system with weapons and shields
  - Particle cannon weapon system with visual beam effects
  - Projectile-based combat with collision detection
  - Shield management system with damage absorption
  - Configurable damage resistance system
  - Enemy AI with kamikaze attack patterns
  - Visual combat effects including explosions and impact flashes
  - Combat statistics tracking (damage dealt/received)

- Advanced ASMR-like audio system with programmatic sound synthesis
  - Powered by Tone.js for real-time sound generation
  - Deep, oscillating hum for thrusters that intensifies with thrust level
  - Distinct pew-pew sound effects for projectiles with satisfying frequency sweeps
  - Comical explosion sounds with multi-layered synthesis
  - Satisfying UI interaction sounds with tactile feedback
  - Progressive audio feedback as actions intensify
  - Custom audio processing with reverb, EQ, and compression for ASMR quality
  - Ambient space soundtrack with multiple tracks
  - Spatial audio positioning for immersion
  - Dynamic volume control and mute functionality
  - Browser autoplay policy handling with user interaction detection

- Entity Component System (ECS) architecture
  - Modular, extensible codebase
  - Component-based entity design
  - System-driven gameplay logic
  - Message-based communication

- Post-processing visual effects for enhanced graphics
  - Bloom effect for glowing elements
  - Film grain for visual style
  - FXAA anti-aliasing
  - Vignette effect

- Advanced holographic UI
  - Dynamic heads-up display (HUD)
  - Ship status monitoring
  - Resource tracking
  - Location tracking
  - Targeting system

- Mothership Interface
  - Ship upgrades and customization
  - Resource trading system
  - Repair and refueling
  - Star map for navigation
  - Mini-games (Blackjack)

## Installation

The game must be served from a web server due to browser security restrictions with ES modules and Web Audio API. You cannot simply open the HTML file directly.

### Option 1: Using Python's built-in HTTP server

```bash
# Clone the repository
git clone [repository-url]

# Navigate to the project directory
cd solar-system-asteroid-miner

# If you have Python 3 installed
python -m http.server 8000


# Open in browser
# Visit http://localhost:8000 in your web browser
```

### Option 2: Using Node.js and http-server

```bash
# Install http-server globally if you haven't already
npm install -g http-server

# Navigate to the project directory
cd solar-system-asteroid-miner

# Start the server
http-server -p 8000

# Open in browser
# Visit http://localhost:8000 in your web browser
```

## Usage

### Controls

- **W/A/S/D**: Thrust forward/left/backward/right
- **Q/E**: Thrust up/down
- **Mouse**: Look around
- **Space**: Fire weapons
- **Left Click**: Activate mining laser
- **Shift**: Boost
- **M**: Toggle audio mute
- **ESC**: Exit pointer lock/open menu
- **Q** (near mothership): Dock with mothership

### Gameplay

1. The game starts with your ship docked at the mothership
2. Navigate through the solar system using the controls
3. Locate asteroids to mine for resources
   - Asteroids contain different resources (iron, gold, platinum)
   - Each resource has different values and mining difficulty
4. Defend yourself against enemy ships
   - Enemies have different behaviors and difficulty levels
   - Use shields and weapons to survive combat
5. Combat mechanics:
   - Shield absorbs damage first before health is affected
   - Shields and hull do not regenerate automatically
   - Different enemy types have varying attack patterns and health
   - Visual and audio feedback indicates hits and damage
   - Destroyed enemies trigger explosion effects
6. Return to the mothership to:
   - Trade resources for credits
   - Upgrade your ship systems
   - Repair/refill shields
   - Repair hull damage
   - Refuel
   - Access the star map for navigation
   - Play mini-games like Blackjack

### Game Systems

- **Resource Management**: Mine resources, manage cargo capacity, trade for credits
- **Ship Upgrades**: Improve thrusters, weapons, shields, and cargo capacity
- **Navigation**: Travel between planets and asteroid fields
- **Combat**: 
  - Engage in battles with enemy ships using particle cannon weapon (Space key)
  - Manage shield energy that absorbs damage before health
  - Shields and hull must be repaired/refilled at the mothership
  - Enemy ships use kamikaze attacks, ramming into your ship for damage
  - Visual effects show projectiles, impacts, and explosions
  - Audio cues reinforce combat actions and hits
- **Audio System**: 
  - Programmatically generated ASMR-like sounds using Tone.js
  - Dynamic sound effects that respond to gameplay actions
  - Thruster sounds that change pitch and intensity based on thrust direction and boost
  - Unique projectile sounds when firing the particle cannon
  - Combat sounds for weapon impacts and explosions
  - UI interaction sounds in various game interfaces
  - Background music system with randomized track playback
  - Global audio controls with mute toggle (M key)

- **Enemy System**:
  - Pirate faction scouts with kamikaze attack pattern
  - Enemy ships spawn around player at regular intervals
  - Maximum of 5 concurrent enemies to balance difficulty
  - Enemies freeze when docked at mothership for safe zones
  - Enemies track directly toward player position
  - Red enemy ships are visible from a distance for easy identification
  - Collision with enemies causes damage and triggers explosions
  - Enemies track player using sight/detection within 2000-2500 unit range
  - Destroy enemies before they reach collision distance of 75 units

## Development

### Debug Mode

Set `DEBUG_MODE = true` in main.js for verbose console logging.

### Code Structure

- `js/core/`: Core ECS architecture components
  - `entity.js`: Base entity class
  - `component.js`: Base component class
  - `system.js`: Base system class
  - `entityManager.js`: Manages entity lifecycle
  - `systemManager.js`: Manages system execution
  - `world.js`: Top-level container for game world
  - `messageBus.js`: Pub/sub system for communication

- `js/components/`: Game component definitions
  - `transform.js`: Position, rotation, scale
  - `combat/`: Weapons, shields, health components
    - `healthComponent.js`: Health and shield management with regeneration
    - `enemyAI.js`: Enemy behavior control and attack patterns
  - `mining/`: Resource extraction components
    - `mineable.js`: Makes entities minable for resources
  - `physics/`: Movement and collision components
    - `rigidbody.js`: Physics properties for entities
  - `rendering/`: Visual representation components
    - `mesh.js`: 3D model management
  - `spaceship/`: Ship-specific components
    - `thruster.js`: Ship propulsion system
    - `cargo.js`: Resource storage and management
    - `miningLaser.js`: Resource extraction tool

- `js/systems/`: Game system implementations
  - `combat/`: Combat logic
    - `combatSystem.js`: Projectile tracking, collision detection, and damage
    - `enemySystem.js`: Enemy spawning, AI control, and lifecycle management
  - `input/`: Input processing
  - `mining/`: Mining mechanics
    - `miningSystem.js`: Resource extraction logic
  - `physics/`: Physics calculations
    - `collisionSystem.js`: Collision detection and response
    - `movementSystem.js`: Entity movement
  - `rendering/`: Rendering logic

- `js/modules/`: High-level game modules
  - `renderer.js`: Three.js rendering pipeline
  - `physics.js`: Physics simulation
  - `spaceship.js`: Player ship implementation
  - `environment.js`: Solar system and space environment
  - `controls.js`: Input handling
  - `ui.js`: User interface
  - `audio.js`: Sound system with Tone.js integration for ASMR-like sound synthesis
  - `combat.js`: Weapons systems, projectile management, and combat effects
  - `environment/`: Space environment components
    - `planets.js`: Planet generation and management
    - `asteroidBelt.js`: Asteroid field creation
    - `sun.js`: Star rendering and effects
    - `skybox.js`: Space background
    - `mothership.js`: Player's home base
  - `ui/`: User interface components
    - `hud.js`: Heads-up display
    - `mothershipInterface.js`: Upgrade and trading UI
    - `combatDisplay.js`: Combat information display
    - `starMap.js`: Navigation interface
    - `miningDisplay.js`: Mining status display
    - `blackjackGame.js`: Mini-game implementation
    - `gameOverScreen.js`: End game UI
    - `controlsMenu.js`: Controls information
    - `targetingSystem.js`: Target acquisition UI

- `js/entities/`: Entity definitions
  - `spaceship.js`: Player ship entity definition

- `assets/`: Game assets
  - Planet textures (2k resolution)
  - Stars background
  - Ships and models

- `sounds/`: Audio files
  - `soundtrack/`: Background music tracks (WAV files)
    - Multiple ambient space tracks for background music
  - Note: Game sound effects (thrust, laser, explosion, etc.) are generated programmatically using Tone.js

## Technical Requirements

- Modern web browser with WebGL support
- Recommended: Dedicated graphics card for optimal performance
- Keyboard and mouse
- Audio output device (for full experience)
- Web Audio API support (for sound synthesis)

## External Libraries

- [Three.js](https://threejs.org/) - 3D rendering engine
- [Tone.js](https://tonejs.github.io/) - Sound synthesis and audio processing
- Planet textures from [Solar System Scope](https://www.solarsystemscope.com/)
- AI

