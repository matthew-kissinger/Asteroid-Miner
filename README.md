# Asteroid Miner

![Gameplay Screenshot](placeholder.png)  <!-- Add a screenshot later -->

*For detailed technical information, please see `architecture.md`.*

A 3D space mining simulation game playable directly in your web browser. Navigate the cosmos, mine valuable resources, upgrade your ship, and defend yourself against spectral drone attacks in this immersive space adventure.

**[► Play Now!](https://matthew-kissinger.github.io/Asteroid-Miner/)** *(Link from original README)*

## Key Features

*   **Explore Procedurally Generated Star Systems:** Navigate diverse 3D environments with dynamic lighting and celestial bodies.
*   **Mine Resources:** Target and extract Iron, Gold, and Platinum from asteroids using your mining laser.
*   **Trade & Upgrade:** Dock with the stargate to sell resources, refuel, repair, and purchase upgrades for your ship's engine, hull, shields, mining laser, scanner, and cargo capacity.
*   **Dynamic Combat:** Battle against spectral drones - remnants of ancient defense systems with varying difficulty levels and visual variants.
*   **Balanced Enemy Encounters:** Enemies begin spawning after 1 minute of gameplay and gradually spawn less frequently over time for a well-paced experience.
*   **Deployable Space Laser Turrets:** Purchase and deploy autonomous laser turrets that automatically target and destroy enemy ships within range.
*   **Interstellar Travel:** Use the Star Map at the stargate to travel between different star systems.
*   **Space Anomalies & Energy Orbs:** Discover and investigate unique space anomalies to collect valuable energy orbs.
*   **Custom System Creation (Optional AI Feature):** Use an AI-powered tool to generate unique star systems with custom skyboxes and planets.
*   **VibeVerse Portals (Experimental):** Discover and explore experimental VibeVerse portals. (Confirm if this is a prominent feature to keep).
*   **Cross-Platform:** Playable on both desktop (keyboard/mouse) and mobile (touch controls).
*   **Advanced Controller Support:** Full gamepad/controller support with optimized controls, sensitivity adjustment, and responsive aiming.
*   **Optimized UI Experience:** Clean, unobtrusive targeting system with minimal visual clutter and performance-optimized updates.
*   **Mini-Game:** Try your luck at Stellar Blackjack aboard the stargate.
*   **Adaptive Performance:** Optimizes frame rate limits based on your monitor's refresh rate.
*   **Realistic Volumetric Lighting:** Experience god rays from the sun with options for standard or stylized "Claude Rays" effects.

## Technologies Used

*   **Frontend:** HTML5, CSS3, JavaScript (ES Modules)
*   **3D Engine:** Three.js (r175+)
*   **Build System:** Vite (v5+)
*   **Architecture:** Hybrid ECS. A dedicated Entity-Component-System (ECS) is used for combat systems (enemies, projectiles), while other features like player ship physics and resource management use direct object manipulation. See `architecture.md` for a detailed breakdown.
*   **Mobile Controls:** NippleJS
*   **Audio:** Web Audio API, Tone.js (for intro sequence)
*   **AI Generation API (Optional):** External API (likely FastAPI/Google Gemini) for custom system creation feature.
*   **Shader Effects:** Custom GLSL shaders for advanced visual effects like volumetric lighting and sun surface

## Installation

1.  **Clone or Download:** Get the code from the repository.
    ```bash
    git clone https://github.com/yourusername/aminer.git
    cd aminer
    ```

2.  **Install Dependencies:** Use npm to install all dependencies.
    ```bash
    npm install
    ```

3.  **Development Server:** Run the development server with hot module replacement.
    ```bash
    npm run dev
    ```

4.  **Build for Production:** Create an optimized production build.
    ```bash
    npm run build
    ```

5.  **Preview Production Build:** Test the production build locally.
    ```bash
    npm run preview
    ```

6.  **Serve Production Build:** Serves the production build on port 8080.
    ```bash
    npm run serve 
    ```

7.  **Clean Build Directory:** Removes the `dist` build directory.
    ```bash
    npm run clean
    ```

8.  **Deploy to GitHub Pages:** Builds the project and deploys it to GitHub Pages.
    ```bash
    npm run deploy
    ```

## Development Workflow

This project uses Vite for an optimized development experience:

* **Hot Module Replacement:** Changes reflect immediately without a full page reload.
* **Fast Builds:** Blazing fast build times with efficient bundling.
* **Asset Optimization:** Automatic asset optimization during production builds.
* **Local Dev Server:** Automatic port assignment and network access options.

## Usage

*   **Start:** The game begins docked at the stargate (after an optional intro sequence on first play).
*   **Undock:** Use the "UNDOCK" button in the stargate interface.
*   **Controls (Desktop):**
    *   `W`: Thrust Forward
    *   `S`: Thrust Backward
    *   `A`: Strafe Left
    *   `D`: Strafe Right
    *   `Shift`: Boost
    *   `Mouse`: Rotate Ship (Requires clicking in the game window to lock pointer)
    *   `Left Click`: Fire Weapon
    *   `R`: Toggle Mining Laser (must have an asteroid targeted)
    *   `E`: Toggle Target Lock-On System (optimized with clean top-screen display)
    *   `Tab`: Cycle Locked Target
    *   `F7`/`F8`: Adjust Controller Sensitivity (gamepad users)
    *   `Q`: Dock with Stargate (when nearby)
    *   `T`: Deploy Space Laser Turret
    *   `G`: Pick Up Nearby Space Laser Turret
    *   `M`: Toggle Mute
    *   `Escape`: Exit Pointer Lock / Show Menu (TBD)
*   **Controls (Mobile):**
    *   **Left Joystick:** Ship Thrust (Forward/Backward/Strafe)
    *   **Right Joystick:** Ship Rotation
    *   **Buttons:** `FIRE`, `MINE`, `TARGET`, `DEPLOY` (On-screen buttons). `PICKUP` functionality for deployed turrets is typically contextual or might share a button, refer to in-game prompts.
    *   **Dock Button:** Appears when near the stargate.
*   **Controls (Gamepad/Controller):**
    *   **Left Stick:** Ship Movement (Forward/Backward/Strafe)
    *   **Right Stick:** Ship Rotation (with sensitivity adjustment and smoothing)
    *   **Left Stick Click (L3):** Boost
    *   **A Button:** Toggle Target Lock-On System
    *   **B Button:** Toggle Mining Laser (tap to start/stop)
    *   **X Button:** Dock with Stargate (when nearby)
    *   **Y Button:** Deploy Space Laser Turret
    *   **Right Trigger (RT):** Fire Weapons
    *   **Left/Right Bumpers:** Cycle Targets
    *   **Start Button:** Pause/Menu
*   **Goal:** Mine resources, sell them, upgrade your ship, and explore different systems. Survive encounters with hazards or enemies.

## Performance Optimization

The game includes several settings to optimize for different hardware capabilities:

* **Post-Processing Effects:** Toggle bloom, anti-aliasing, and other visual effects
* **Volumetric Lighting:** Choose between standard god rays, "Claude Rays" effect, or disable for performance
* **Resolution Scaling:** Adjust rendering resolution for better performance
* **Graphical Quality Presets:** Choose Performance, Balanced, or Quality presets

## Production Build

When you run `npm run build`, Vite creates an optimized production build:

* **Tree-Shaking:** Eliminates unused code for smaller bundle sizes
* **Minification:** Reduces file sizes for faster loading
* **Asset Hashing:** Facilitates efficient caching
* **Code Splitting:** Improves initial load times by loading only what's needed
* **Smart Chunking:** Optimized chunk sizes for better network performance

## Future Scaling Capabilities

The codebase preserves foundational elements for advanced optimizations, intended for future scaling if needed. These are not all actively used in the current version but are maintained for potential integration:

*   **Data-Oriented Design (DOD) Components:**
    *   Utilizes TypedArray-based component storage in `js/core/dataStore.js`.
    *   Includes optimized component variants in `js/components/optimized/` (e.g., for transforms and rigidbodies).
    *   These offer highly efficient memory layouts and access patterns, crucial for scenarios with thousands of entities.
*   **Conceptual Basis for Instanced Rendering:** While specific `InstancedRenderSystem` files as detailed in `architecture.md` may not be in the current active path, the design anticipates leveraging `THREE.InstancedMesh` for rendering large numbers of similar objects (e.g., asteroids, debris) with minimal draw calls. The foundational DOD components would support managing data for such instanced systems.
*   **Optimized Physics Concepts:** The architecture includes provisions for specialized physics systems, potentially using the DOD components, for high-performance simulation when dealing with a large number of entities.

These preserved systems and concepts could be more fully implemented or re-activated to support:
1.  Massive asteroid fields (e.g., 1000+ asteroids).
2.  Large-scale space battles with numerous ships and projectiles.
3.  Complex particle effects and debris systems.

For a more detailed technical discussion of these preserved systems and their original design, please refer to `architecture.md`.

## Contributing

This project was primarily a learning exercise. Contributions are not actively sought, but feel free to fork the repository and experiment.

## License

*License information not provided in the codebase. Please add appropriate license details here (e.g., MIT License).*