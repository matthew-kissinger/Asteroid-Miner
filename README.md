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
*   **Interstellar Travel:** Use the Star Map at the stargate to travel between different star systems.
*   **Custom System Creation:** (Optional) Use an AI-powered tool to generate unique star systems with custom skyboxes and planets.
*   **Cross-Platform:** Playable on both desktop (keyboard/mouse) and mobile (touch controls).
*   **Mini-Game:** Try your luck at Stellar Blackjack aboard the stargate.
*   **Adaptive Performance:** Automatically detects your monitor's refresh rate and optimizes frame rate limits accordingly for smooth gameplay.
*   **Realistic Volumetric Lighting:** Experience realistic god rays emanating from the sun with distance-based attenuation and atmospheric scattering. Choose between standard realistic rays or the dramatic "Claude Rays" effect for a more stylized look.

## Technologies Used

*   **Frontend:** HTML5, CSS3, JavaScript (ES Modules)
*   **3D Engine:** Three.js (r175+)
*   **Architecture:** Custom Entity-Component-System (ECS) with Data-Oriented optimizations
*   **Mobile Controls:** NippleJS
*   **Audio:** Web Audio API, Tone.js (for intro sequence)
*   **AI Generation API (Optional):** External API (likely FastAPI/Google Gemini) for custom system creation feature.
*   **Shader Effects:** Custom GLSL shaders for advanced visual effects like volumetric lighting and sun surface

## Installation

No complex installation is required!

1.  **Clone or Download:** Get the code from the repository.
2.  **Serve Files:** Use a simple local web server to serve the project files. Due to browser security restrictions (CORS, ES Modules), you cannot simply open `index.html` directly from the file system.
    *   If you have Python 3: `python -m http.server`
    *   If you have Node.js: `npm install -g serve && serve .`
    *   Or use an extension like "Live Server" for VS Code.
3.  **Access:** Open your browser and navigate to the local server address (e.g., `http://localhost:8000`).

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
    *   `M`: Toggle Mute
    *   `Escape`: Exit Pointer Lock / Show Menu (TBD)
*   **Controls (Mobile):**
    *   **Left Joystick:** Ship Thrust (Forward/Backward/Strafe)
    *   **Right Joystick:** Ship Rotation
    *   **Buttons:** FIRE, MINE, TARGET (On-screen buttons)
    *   **Dock Button:** Appears when near the stargate.
*   **Goal:** Mine resources, sell them, upgrade your ship, and explore different systems. Survive encounters with hazards or enemies.

## Performance Optimization

The game includes several settings to optimize for different hardware capabilities:

* **Post-Processing Effects:** Toggle bloom, anti-aliasing, and other visual effects
* **Volumetric Lighting:** Choose between standard god rays, "Claude Rays" effect, or disable for performance
* **Resolution Scaling:** Adjust rendering resolution for better performance
* **Graphical Quality Presets:** Choose Performance, Balanced, or Quality presets

## Contributing

This project was primarily a learning exercise. Contributions are not actively sought, but feel free to fork the repository and experiment.

## License

*License information not provided in the codebase. Please add appropriate license details here (e.g., MIT License).*