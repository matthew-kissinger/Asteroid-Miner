# Asteroid Miner v0.6.1

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
*   **Optimized UI Experience:** Clean, unobtrusive targeting system that only appears when activated (press T), with minimal visual clutter and performance-optimized updates.
*   **Mini-Game:** Try your luck at Stellar Blackjack aboard the stargate.
*   **Adaptive Performance:** Optimizes frame rate limits based on your monitor's refresh rate.
*   **Realistic Volumetric Lighting:** Experience god rays from the sun with options for standard or stylized "Claude Rays" effects.

## Technologies Used

*   **Language:** TypeScript 5.7 strict (248 pure TS files, 0 JavaScript)
*   **3D Engine:** Three.js r180 WebGPU (WebGL2 fallback)
*   **ECS:** bitECS v0.4.0 (29 components, 5 active systems)
*   **Build System:** Vite 6 (code-split: game-core 180 kB, combat 27 kB, env 62 kB, ui 63 kB)
*   **Styles:** Tailwind CSS 3.4 + 18 CSS files
*   **Tests:** Vitest (7 files, 61 tests) + Playwright smoke test
*   **Architecture:** Hybrid ECS/Module. Combat (enemies/projectiles) runs under bitECS with fixed-step and instanced rendering; player ship physics and economy/UI run via modules. See `architecture.md`.
*   **Mobile Controls:** NippleJS
*   **Audio:** Web Audio API, Tone.js (for intro sequence)
*   **AI Generation API (Optional):** External API for custom system creation feature.
*   **Shader Effects:** TSL laser material + 2 GLSL post-processing shaders (volumetric lighting, sun surface)

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

* **Perf Overlay (F3):** FPS, sim ms, render ms, draw calls, visible instances, pool stats, GC count, per-system timings (~2 Hz).
* **Unified Pooling:** All hot-path allocations use PoolRegistry with hit/miss stats.
* **Fixed-Step + Interpolation:** ECS updates at fixed dt; renderer interpolates between snapshots for smooth visuals.
* **Spatial Hash:** Proximity queries and interest bubbles built atop hashed cells.
* **Instanced Rendering:** Enemies render as InstancedMesh per cell × archetype to collapse draw calls.
* **Typed Events:** Enum + schema with dev-time validation to prevent stray event names.

## Runbook

- Toggle Perf Overlay: Press `F3` in-game. Metrics: FPS, sim ms, render ms, draw calls, visible instances, pool stats, GC count, per-system timings.
- Renderer Facade: Use `renderer.addView/removeView` or guarded `renderer.add`; avoid direct `scene.add/remove` in modules. Migrated hotspots: `js/modules/combat.ts`, `js/modules/pooling/ProjectilePoolManager.ts`, `js/modules/environment/spaceAnomalies.ts`, shader warm-up in `js/main.ts`.
- Pooling: Use `window.objectPool` facade (delegates to `PoolRegistry`); ECS combat visuals use `ProjectilePoolManager` internally.
- Fixed-Step Sim: 60 Hz physics with render interpolation, automatically used on high-refresh displays.
- Typed Events: Publish via `window.mainMessageBus` with canonical event names; dev mode validates payloads.
- Test Flow: Fire weapons (no emissive warnings; no facade warnings), wait for anomalies to spawn (no facade warnings), watch overlay for draw calls, visible instances, pool stats.

### Developer Notes
- Renderer facade guards all `scene.add/remove`; modules should call the facade.
- Input intent -> ECS: Ship movement is progressively driven by ECS systems; avoid writing directly to `Spaceship.position/rotation` in new code.
- Pooling: Use `window.objectPool` facade (delegates to `PoolRegistry`); for ECS combat visuals, use `ProjectilePoolManager`.
- Fixed-step simulation with render interpolation is on by default, tuned for 60 Hz physics.

## Production Build

When you run `npm run build`, Vite creates an optimized production build:

* **Tree-Shaking:** Eliminates unused code for smaller bundle sizes
* **Minification:** Reduces file sizes for faster loading
* **Asset Hashing:** Facilitates efficient caching
* **Code Splitting:** Improves initial load times by loading only what's needed
* **Smart Chunking:** Optimized chunk sizes for better network performance

## Architecture

The game uses a **hybrid ECS/Module** pattern:

*   **bitECS** manages entities with many similar instances (enemies, projectiles, deployable turrets) using 29 SoA TypedArray components and 5 active systems.
*   **Modules** manage unique objects (player ship, UI, environment) via traditional OOP patterns.
*   **Instanced Rendering:** Enemies render as `InstancedMesh` to minimize draw calls.
*   **Object Pooling:** `PoolRegistry` + `ProjectilePoolManager` reuse hot-path allocations.
*   **Fixed-Step Simulation:** 60 Hz physics with render interpolation for smooth visuals.

See `architecture.md` for detailed technical discussion.

## Changelog

### v0.6.1 (Latest)
- **Fixed:** Targeting HUD now properly starts hidden and only appears when targeting is activated (press T)
- **Improved:** Mining system respects targeting state for UI display

### v0.6.0
- **Major Cleanup:** Removed ~20% of unused code while preserving valuable ECS systems
- **Documentation:** Created ECS_SYSTEMS_INVENTORY.md documenting 5 ready-to-activate systems
- **Performance:** Wrapped 72+ console.log statements in DEBUG_MODE checks
- **Architecture:** Clarified hybrid ECS/Module design as intentional

## Contributing

This project was primarily a learning exercise. Contributions are not actively sought, but feel free to fork the repository and experiment.

## License

*License information not provided in the codebase. Please add appropriate license details here (e.g., MIT License).*