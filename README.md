# README.md

# Solar System Asteroid Miner

![Gameplay Screenshot](placeholder.png)  <!-- Add a screenshot later -->

A 3D space mining simulation game playable directly in your web browser. Navigate the cosmos, mine valuable resources, upgrade your ship, and defend yourself against dangers.

**[► Play Now!](https://matthew-kissinger.github.io/Asteroid-Miner/)** *(Link from original README)*

## Key Features

*   **Explore Space:** Navigate a 3D environment with dynamic lighting and celestial bodies.
*   **Mine Resources:** Target and extract Iron, Gold, and Platinum from asteroids using your mining laser.
*   **Trade & Upgrade:** Dock with the stargate to sell resources, refuel, repair, and purchase upgrades for your ship's engine, hull, shields, mining laser, scanner, and cargo capacity.
*   **Combat:** Engage with AI-controlled spectral drones (optional, based on difficulty progression).
*   **Deployable Space Lasers:** Purchase and deploy autonomous laser turrets that automatically target and destroy enemy ships within range.
*   **Interstellar Travel:** Use the Star Map at the stargate to travel between different star systems.
*   **Custom System Creation:** (Optional) Use an AI-powered tool to generate unique star systems with custom skyboxes and planets.
*   **Cross-Platform:** Playable on both desktop (keyboard/mouse) and mobile (touch controls).
*   **Mini-Game:** Try your luck at Stellar Blackjack aboard the stargate.
*   **Adaptive Performance:** Automatically detects your monitor's refresh rate and optimizes frame rate limits accordingly for smooth gameplay.
*   **Realistic Volumetric Lighting:** Experience realistic god rays emanating from the sun with distance-based attenuation and atmospheric scattering. Choose between standard realistic rays or the dramatic "Claude Rays" effect for a more stylized look.

## Technologies Used

*   **Frontend:** HTML5, CSS3, JavaScript (ES Modules)
*   **3D Engine:** Three.js (r175+)
*   **Build System:** Vite (v5+)
*   **Architecture:** Custom Entity-Component-System (ECS) with Data-Oriented optimizations
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
    *   `W/A/S/D`: Thrust Forward/Left/Backward/Right
    *   `Q/E`: Thrust Up/Down (Check Controls Menu in-game for confirmation)
    *   `Shift`: Boost
    *   `Mouse`: Rotate Ship (Requires clicking in the game window to lock pointer)
    *   `Left Click`: Fire Weapon
    *   `R`: Toggle Mining Laser (must have an asteroid targeted)
    *   `E`: Toggle Target Lock-On System
    *   `Tab`: Cycle Locked Target
    *   `Q`: Dock with Stargate (when nearby)
    *   `T`: Deploy Space Laser Turret
    *   `G`: Pick Up Nearby Space Laser Turret
    *   `M`: Toggle Mute
    *   `Escape`: Exit Pointer Lock / Show Menu (TBD)
*   **Controls (Mobile):**
    *   **Left Joystick:** Ship Thrust (Forward/Backward/Strafe)
    *   **Right Joystick:** Ship Rotation
    *   **Buttons:** FIRE, MINE, TARGET, DEPLOY, PICKUP (On-screen buttons)
    *   **Dock Button:** Appears when near the stargate.
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

The codebase includes preserved advanced optimization systems that are not currently in use but maintained for future scaling needs:

* **Data-Oriented Design Components:** TypedArray-based component storage in `js/core/dataStore.js` and related optimized components provide highly efficient memory layouts for handling thousands of entities.
* **Instanced Rendering:** The `InstancedRenderSystem` leverages THREE.InstancedMesh for efficiently rendering many similar objects with minimal draw calls.
* **Optimized Physics:** Specialized systems for high-performance physics simulation when dealing with large numbers of entities.

These optimized systems could be re-implemented to support:
1. Massive asteroid fields (1000+ asteroids)
2. Large-scale space battles with many ships and projectiles
3. Advanced particle effects and debris systems

## Contributing

This project was primarily a learning exercise. Contributions are not actively sought, but feel free to fork the repository and experiment.

## License

*License information not provided in the codebase. Please add appropriate license details here (e.g., MIT License).*