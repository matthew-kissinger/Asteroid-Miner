# CLAUDE.md - Guide for Code Assistants

## Runtime Commands
- Launch: Open `index.html` in a browser (no build step required)
- Debug Mode: Set `DEBUG_MODE = true` in main.js for verbose console logging

## Code Style Guidelines
- **Formatting**: 4-space indentation, braces on same line
- **Naming**: 
  - PascalCase for classes (`Entity`, `Component`)
  - camelCase for variables/methods (`addComponent`, `updatePosition`)
  - Private properties prefixed with underscore (`_isEnemy`)
- **Imports**: Use ES module syntax with relative paths (`import { Entity } from './core/entity.js'`)
- **Documentation**: JSDoc comments for functions with @param and @returns tags
- **Error Handling**: Use try/catch with fallbacks and user notifications, log errors to console

## Architecture
- Entity Component System (ECS) pattern with message bus communication
- Components hold data, Systems contain logic
- Event-driven design with publish/subscribe messaging
- Method chaining pattern with `return this`
- Performance optimization with object pooling and spatial partitioning

## Code Structure
- **Core**:
  - `js/core/` - ECS implementation (entity.js, component.js, system.js, world.js)
  - `js/core/messageBus.js` - Event-driven communication system
- **Modules**:
  - `js/modules/game.js` - Main game orchestration
  - `js/modules/renderer.js` - Three.js integration with post-processing
  - `js/modules/physics.js` - Custom movement and collision handling
  - `js/modules/environment.js` - Space environment and star systems
    - `environment/asteroidBelt.js` - Procedural asteroid field generation
    - `environment/mothership.js` - Base station for trading and upgrades
    - `environment/planets.js` - Solar system and procedural planet creation
    - `environment/skybox.js` - GLSL shader-based space background
    - `environment/sun.js` - Central star with shader-based rendering
    - `environment/starSystemGenerator.js` - Procedural system generation
    - `environment/systemTransition.js` - Visual effects for system travel
  - `js/modules/audio.js` - Sound effects and music system
  - `js/modules/ui.js` - DOM-based user interface
  - `js/modules/spaceship.js` - Player ship implementation
  - `js/modules/combat/` - Combat and weapon systems
- **Systems**:
  - `js/systems/physics/` - Movement and collision detection systems
  - `js/systems/combat/` - Enemy AI and projectile management
  - `js/systems/mining/` - Resource extraction mechanics
  - `js/systems/rendering/` - Visual effects and trail systems
  - `js/systems/input/` - Keyboard, mouse, and control input handling
- **Components**:
  - `js/components/` - Data containers for entity properties
  - Component categories: combat, physics, spaceship, ui, rendering, mining
- **Utils**:
  - `js/utils/` - Helper utilities for path handling, math, and cross-platform support

## Performance Optimizations
- **Entity Pooling**: Recycling destroyed entities to minimize garbage collection
  - Pre-allocated enemy pool for minimal runtime allocations
  - Component reuse with reset functionality
  - Tag-based tracking for active vs. pooled entities
- **Spatial Partitioning**: Grid-based collision detection for O(1) entity lookup
  - Cell-based entity tracking to minimize collision checks
  - Direction-aware cell expansion for high-speed objects
  - Memory optimization for collision pair tracking
- **Memory Management**:
  - Resource cleanup with proper disposal of Three.js objects
  - WeakMap references to allow garbage collection
  - Self-healing systems to prevent memory leaks
  - Optimized message handling for high-frequency events
- **Render Optimization**:
  - Frustum culling for off-screen objects
  - Instanced mesh rendering for repeated objects
  - Logarithmic depth buffer for space-scale rendering
  - Matrix-based visibility testing with bounding spheres

## System Interaction Patterns

- **Input Processing Chain**:
  1. `InputSystem` captures raw browser events
  2. Events are translated to game actions via MessageBus
  3. `ShipControlSystem` applies actions to player entities
  4. Physics systems respond to control inputs

- **Rendering Pipeline**:
  1. `RenderSystem` syncs entity transforms with Three.js meshes
  2. `CameraSystem` positions and orients the camera
  3. `TrailSystem` updates visual trail effects
  4. `VisualEffectsSystem` manages particles and screen effects
  5. Main renderer performs frustum culling and actual rendering

- **Mining Process Flow**:
  1. Player input triggers mining action
  2. `ShipControlSystem` finds nearest asteroid
  3. `MiningSystem` validates distance and initiates extraction
  4. Resource accumulation occurs over time
  5. Resources are transferred to cargo when threshold reached
  6. Events trigger UI updates and sound effects

## Control Systems Architecture

The game's control systems manage player interactions with the environment through several specialized modules:

### Core Control Components

1. **Input Handler**:
   - Captures raw keyboard and mouse input
   - Manages pointer lock for camera control
   - Translates input to spaceship thrust commands
   - Provides sensitivity configuration
   - Blocks inputs contextually (e.g., when docked)

2. **Docking System**:
   - Manages mothership docking/undocking sequences
   - Controls trade and upgrade UI interactions
   - Handles resource selling with variable pricing
   - Manages ship upgrades with progressive costs
   - Ensures health system synchronization between states

3. **Mining System**:
   - Controls resource extraction mechanics
   - Manages mining beam visualization
   - Applies efficiency upgrades to mining speed
   - Handles resource type-specific extraction rates
   - Creates particle effects for mining operations
   - Tracks asteroid health and depletion

4. **Targeting System**:
   - Provides asteroid scanning within configurable radius
   - Manages visual targeting reticle with animations
   - Handles target selection and cycling
   - Updates UI with target information
   - Scales scan radius based on ship upgrades

### Control Integration Pattern

The control systems follow a hierarchical integration pattern:

```javascript
// Control module hierarchy and integration
class Controls {
    constructor(spaceship, physics, environment, ui) {
        // Core input capture
        this.inputHandler = new InputHandler(spaceship, physics);
        
        // Specialized control systems that depend on inputHandler
        this.miningSystem = new MiningSystem(spaceship, scene);
        this.targetingSystem = new TargetingSystem(spaceship, scene, environment);
        this.dockingSystem = new DockingSystem(spaceship, environment.mothership, ui);
        
        // Cross-system references for integrated functionality
        this.miningSystem.setTargetingSystem(this.targetingSystem);
        this.dockingSystem.setResources(this.miningSystem.resources);
        
        // Setup input mappings for specialized systems
        this.setupKeyBindings();
    }
    
    setupKeyBindings() {
        // Map key press events to system actions
        document.addEventListener('keydown', e => {
            switch(e.key.toLowerCase()) {
                case 't': this.targetingSystem.toggleLockOn(); break;
                case 'tab': this.targetingSystem.cycleLockOnTarget(); break;
                case 'e': this.miningSystem.startMining(); break;
                case 'q': this.dockingSystem.attemptDocking(); break;
                // Additional key mappings...
            }
        });
    }
    
    update() {
        // Update all control systems
        this.inputHandler.update();
        this.targetingSystem.update();
        this.miningSystem.update();
        this.dockingSystem.update();
    }
}
```

### Control-Entity Interaction

Control systems interact with entities through a mix of direct references and message bus events:

1. **Direct References**: Core controls directly manipulate the player spaceship for immediate feedback
   ```javascript
   // Direct control of spaceship properties
   this.spaceship.thrust.forward = true;
   this.physics.updateRotation(movementX, movementY);
   ```

2. **Message Bus Events**: State transitions and global events use the message bus
   ```javascript
   // Event-based state notification
   this.spaceship.world.messageBus.publish('player.docked', {
       playerPosition: this.spaceship.mesh.position.clone(),
       mothership: this.mothership
   });
   ```

3. **Command Pattern**: For some actions, the controls issue commands to specialized systems
   ```javascript
   // Command-style interaction
   if (window.game && window.game.combat) {
       window.game.combat.setFiring(true);
   }
   ```

### Control-UI Integration

Control systems manage both 3D scene elements and DOM-based UI components:

1. **3D Scene Elements**:
   - Targeting reticles rendered in 3D space
   - Mining particles and visual effects
   - Camera positioning during docking

2. **DOM UI Elements**:
   - Mining progress bars and status text
   - Targeting information displays
   - Mothership docking UI with upgrade buttons
   - Resource counts and credit displays

3. **Hybrid Visuals**:
   - Screen-space laser beams connecting 3D positions
   - Contextual prompts based on proximity
   - Adaptive UI based on ship state

This hybrid approach allows for complex interactions while maintaining performance.

## Environment Module Architecture

The environment module manages the creation and simulation of space environments across multiple star systems:

### Core Components

1. **Star System Generator**:
   - Coordinates all environment components for each star system
   - Manages transition between different systems
   - Procedurally generates star classes (O, B, A, F, G, K, M)
   - Creates star system network with travel connections
   - Maps resource distribution based on star properties

2. **Skybox Rendering**:
   - Custom GLSL shaders for background star field
   - Milky Way texture integration
   - Adjustable star and nebula density per system
   - Twinkling effect with noise-based animation
   - Color adjustments based on star type

3. **Sun Rendering**:
   - Multi-layered approach with core, corona, and outer corona
   - Multiple shader implementations for surface details
   - Volumetric rendering with view-dependent intensity
   - Fractional Brownian Motion for realistic surface turbulence
   - Adapts visually to different star classifications

4. **Planetary System**:
   - Solar System simulation with real planet properties
   - Procedural generation for new star systems
   - Texture mapping system for planet surfaces
   - Specialized handling for atmospheric and ring effects
   - Orbit simulation with varied speeds and distances

5. **Asteroid Belt**:
   - Procedural mesh generation with vertex deformation
   - Resource type assignment with weighted distribution
   - System-specific resource multipliers
   - Orbital mechanics with individual rotation rates
   - Proximity queries for mining operations

6. **System Transition Effects**:
   - Particle-based warp tunnel with direction-oriented movement
   - Camera animation during transitions
   - DOM overlay for transition flash
   - Callback-based completion notification

### Environment Integration

The environment systems share common initialization and update patterns:

```javascript
// Typical environment component structure
class EnvironmentComponent {
    constructor(scene) {
        this.scene = scene;
        this.initialize();
    }
    
    initialize() {
        // Create base objects
    }
    
    updateForSystem(systemParams) {
        // Adapt to new star system characteristics
    }
    
    update(deltaTime) {
        // Perform per-frame updates
    }
}
```

Environment components communicate primarily through the star system generator, which coordinates system-wide parameters affecting all components:

```javascript
// Example system parameter object
const systemParams = {
    starClass: 'G',           // Star classification
    starColor: 0xFFF4EA,      // RGB color of the star
    resourceMultipliers: {    // Resource availability
        iron: 1.0,
        gold: 0.8,
        platinum: 0.5
    },
    nebulaDensity: 0.7,       // Visual density of nebula
    starDensity: 1.2,         // Density of background stars
    asteroidDensity: 0.9      // Density of asteroid belt
};
```

### Shader Implementation

The environment makes extensive use of GLSL shaders, particularly for the sun and skybox. Key shader techniques include:

1. **Noise Functions**:
   - Hash-based random generation
   - Fractional Brownian Motion (FBM) for realistic detail
   - Time-based animation for dynamic effects

2. **View-Dependent Effects**:
   - Camera-relative intensity calculations
   - Edge glow and limb darkening effects
   - Surface detail based on viewing angle

3. **Multi-Pass Rendering**:
   - Layered transparent meshes for volumetric effects
   - Additive blending for light accumulation
   - Depth-aware rendering for proper occlusion

These shader implementations are defined inline within material definitions rather than in separate files.

## Key Technical Features
- Three.js renderer with custom post-processing pipeline
- Entity-Component-System architecture with message bus
- Multiple star systems with transition effects
- Custom physics with enhanced collision detection
- GLSL shader-based celestial body rendering
- Procedural content generation with deterministic seeding
- Advanced mesh manipulation for asteroid generation
- Audio system with WebAudio API and dynamic loading
- Resource management with automatic garbage collection
- Event-driven architecture for decoupled components
- Pointer lock integration for immersive camera control
- DOM-based UI with CSS transitions for visual effects

## Development Notes
- The game uses Three.js for 3D rendering with bloom, FXAA, and film grain effects
- Audio, physics, and input handling are encapsulated in separate modules
- Resource loading is asynchronous with fallbacks for missing assets
- Star systems are procedurally generated with unique characteristics
- Error handling includes multiple fallback mechanisms for critical systems
- The MessageBus is globally accessible via window.mainMessageBus
- Entity systems include self-validating and self-healing mechanisms

## UI System Architecture

### Overview
The game features a comprehensive UI system built with DOM elements and CSS for rendering interface components, while leveraging Three.js for 3D world rendering. This hybrid approach allows for complex 2D UI elements that integrate with the 3D game world.

### Core UI Components

The UI system is composed of several specialized modules:

1. **HUD** (`js/modules/ui/hud.js`) - Core game interface with flight data, status panels, and resource tracking
2. **Mining Display** (`js/modules/ui/miningDisplay.js`) - Specialized UI for mining operations
3. **Mothership Interface** (`js/modules/ui/mothershipInterface.js`) - Trading, upgrades, and maintenance UI
4. **Star Map** (`js/modules/ui/starMap.js`) - Galactic navigation interface using canvas for visualization
5. **Targeting System** (`js/modules/ui/targetingSystem.js`) - Target acquisition and tracking interface
6. **Controls Menu** (`js/modules/ui/controlsMenu.js`) - Game control reference UI
7. **Game Over Screen** (`js/modules/ui/gameOverScreen.js`) - End game state UI
8. **Blackjack Game** (`js/modules/ui/blackjackGame.js`) - In-game mini-game UI for resource gambling
9. **Combat Display** (`js/modules/ui/combatDisplay.js`) - Combat-focused interface elements

### Integration Patterns

#### 1. DOM-based UI with Three.js Integration
- UI elements are created using standard DOM elements for optimal text rendering and complex layouts
- Three.js is used for 3D world rendering and projection
- UI components use world-to-screen coordinate conversion for placing elements over 3D objects

#### 2. Dependency Injection
- UI modules have minimal direct dependencies
- Game systems are injected into UI components via setters:
  ```javascript
  setControls(controls) {
    this.controls = controls;
  }
  ```
- This pattern enables easier testing and maintenance

#### 3. Event-Driven Communication
- Many UI modules communicate with game systems through events
- Example: The mothership interface triggers ship upgrades via event handlers:
  ```javascript
  document.getElementById('upgrade-mining').addEventListener('click', () => {
    // Trigger upgrade action
  });
  ```

#### 4. State Management
- UI components maintain internal state for their specific interfaces
- Some components track visibility state:
  ```javascript
  this.isVisible = false;
  // Later...
  if (this.isVisible) {
    this.hide();
  } else {
    this.show();
  }
  ```

### Technical Implementation Details

#### 1. DOM Element Creation
UI elements are created programmatically with JavaScript:

```javascript
const element = document.createElement('div');
element.id = 'element-id';
element.style.position = 'absolute';
// Additional styling...
document.body.appendChild(element);
```

#### 2. Styling Approach
- Inline styles are used for positioning and dynamic styling
- CSS class names are used for consistent styling patterns
- CSS transitions are used for smooth animations

#### 3. Canvas Rendering (Star Map)
The star map uses canvas for efficient drawing of star systems:

```javascript
const ctx = canvas.getContext('2d');
// Clear canvas
ctx.clearRect(0, 0, canvas.width, canvas.height);
// Draw elements
ctx.beginPath();
ctx.arc(x, y, radius, 0, Math.PI * 2);
ctx.fill();
```

#### 4. World-to-Screen Projection
For placing UI elements relative to 3D objects:

```javascript
worldToScreen(position) {
  // Convert 3D position to 2D screen coordinates
  const vector = position.clone();
  vector.project(this.camera);
  
  // Convert to pixel coordinates
  const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-(vector.y * 0.5) + 0.5) * window.innerHeight;
  
  return { x, y };
}
```

#### 5. Dynamic Updates
UI components update regularly to reflect game state:

```javascript
update() {
  // Update resource displays
  document.getElementById('iron-amount').textContent = this.resources.iron;
  
  // Update status indicators
  const percentage = (value / max) * 100;
  element.style.width = `${percentage}%`;
}
```

### Best Practices for Extending the UI

1. **Follow Existing Style Patterns** - Use the established sci-fi aesthetic with consistent colors, borders, and animations
2. **Component Independence** - New UI components should be self-contained with minimal dependencies
3. **Performance Considerations** - Minimize DOM manipulations during frequent updates
4. **Responsive Design** - UI elements should adapt to different screen sizes
5. **Event Handling** - Use event delegation where appropriate for efficient event handling