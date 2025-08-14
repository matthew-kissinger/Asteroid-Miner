// initialization.js - Game initialization logic
import { Renderer } from '../renderer.js';
import { Spaceship } from '../spaceship.js';
import { Physics } from '../physics.js';
import { Environment } from '../environment.js';
import { Controls } from '../controls.js';
import { UI } from '../ui.js';
import { CombatManager } from '../combat/combatManager.js';
import { Combat } from '../combat.js';
import { AudioManager } from '../audio/audio.js';
import { MessageBus } from '../../core/messageBus.js';

export class GameInitializer {
    constructor(game) {
        this.game = game;
    }

    /**
     * Initialize all game systems and components
     */
    async initialize() {
        console.log("Initializing enhanced game with combat systems...");
        
        // Create message bus for events
        this.game.messageBus = new MessageBus();

        try {
            // Initialize audio manager first
            console.log("Creating audio manager...");
            this.game.audio = new AudioManager();

            // Initialize renderer first
            console.log("Creating renderer...");
            this.game.renderer = new Renderer();
            console.log("Renderer created, getting scene...");

            // Access scene and camera directly rather than through getters
            this.game.scene = this.game.renderer.scene;
            this.game.camera = this.game.renderer.camera;
            console.log("Scene and camera references obtained");

            // Share camera reference with scene for easy access by other components
            this.game.scene.camera = this.game.camera;

            // Initialize physics
            this.game.physics = new Physics(this.game.scene);
            // Set camera reference in physics
            this.game.physics.setCamera(this.game.camera);

            // Initialize environment
            this.game.environment = new Environment(this.game.scene);

            // Initialize spaceship
            console.log("Creating spaceship...");
            this.game.spaceship = new Spaceship(this.game.scene);
            // Set spaceship reference in physics
            this.game.physics.setSpaceship(this.game.spaceship);
            
            // Set spaceship reference in environment (for VibeVerse portals)
            this.game.environment.setSpaceship(this.game.spaceship);
            
            // Initialize UI
            this.game.ui = new UI(this.game.spaceship, this.game.environment);

            // Initialize combat systems
            console.log("Initializing combat systems...");
            // Create combat system for player's ship
            this.game.combat = new Combat(this.game.scene, this.game.spaceship);
            // Create combat manager for handling enemy ships
            this.game.combatManager = new CombatManager(this.game.scene, this.game.spaceship, this.game.environment);

            // Initialize controls last, as it depends on other components
            this.game.controls = new Controls(this.game.spaceship, this.game.physics, this.game.environment, this.game.ui);
            // Add combat system reference to controls (instead of weaponSystem)
            this.game.controls.weaponSystem = this.game.combat;
            // Share controls reference with UI for bidirectional communication
            this.game.ui.setControls(this.game.controls);

            // Initial camera positioning
            this.game.camera.position.set(0, 1500, 0);

            // Make instance globally available to help with debugging
            window.gameInstance = this.game;
            window.game = this.game;
            window.mainMessageBus = this.game.messageBus;

            // Ensure projectile assets are precomputed if not already done
            this.ensureProjectileAssetsPrecomputed();

            // Initialize audio after everything else is set up
            await this.game.audio.initialize();
            console.log("Audio system initialized");

            console.log("Game initialization complete with combat systems");

        } catch (error) {
            console.error("Error in game initialization:", error);
            throw error; // Re-throw to show in the UI
        }
    }

    /**
     * Start the game docked with the stargate for tutorial/intro
     */
    startDocked() {
        // Start the game docked with the stargate for tutorial/intro
        // Make sure the ship is already docked
        if (this.game.spaceship) {
            // Ensure the ship is docked
            if (!this.game.spaceship.isDocked) {
                this.game.spaceship.dock();
            }
        }

        // Show stargate UI after a short delay
        setTimeout(() => {
            if (this.game.controls && this.game.controls.dockingSystem) {
                // Just show stargate UI without changing state
                this.game.controls.dockingSystem.dockWithStargate();
                console.log("Stargate UI shown");
            } else {
                console.error("Controls or dockingSystem not available");
            }
        }, 500);
    }

    /**
     * Ensure projectile assets are precomputed to prevent stutter
     * This is a backup in case the precomputation in main.js fails
     */
    ensureProjectileAssetsPrecomputed() {
        if (!this.game.projectileGeometry) {
            console.log("Projectile geometry not precomputed, doing it now...");
            this.game.projectileGeometry = new THREE.SphereGeometry(1.8, 12, 12);
        }
        
        if (!this.game.projectileMaterial) {
            console.log("Projectile material not precomputed, doing it now...");
            this.game.projectileMaterial = new THREE.MeshStandardMaterial({
                color: 0x00ffff,
                emissive: 0x00ffff,
                emissiveIntensity: 5,
                metalness: 0.7,
                roughness: 0.3
            });
        }
        
        if (!this.game.projectileGlowGeometry) {
            console.log("Projectile glow geometry not precomputed, doing it now...");
            this.game.projectileGlowGeometry = new THREE.SphereGeometry(2.4, 16, 16);
        }
        
        if (!this.game.projectileGlowMaterial) {
            console.log("Projectile glow material not precomputed, doing it now...");
            this.game.projectileGlowMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ffff,
                transparent: true,
                opacity: 0.4,
                blending: THREE.AdditiveBlending
            });
        }
        
        if (!this.game.trailParticleGeometries || this.game.trailParticleGeometries.length === 0) {
            console.log("Trail particle geometries not precomputed, doing it now...");
            this.game.trailParticleGeometries = [];
            const numPoints = 20;
            
            for (let i = 0; i < numPoints; i++) {
                const ratio = i / numPoints;
                const size = 0.5 * (1 - ratio);
                const particleGeometry = new THREE.SphereGeometry(size, 8, 8);
                this.game.trailParticleGeometries.push(particleGeometry);
            }
        }
        
        // Warm shaders if not already done
        console.log("Ensuring shaders are warmed...");
        const dummyProjectile = new THREE.Mesh(this.game.projectileGeometry, this.game.projectileMaterial);
        const dummyGlow = new THREE.Mesh(this.game.projectileGlowGeometry, this.game.projectileGlowMaterial);
        dummyProjectile.add(dummyGlow);
        
        // Add to scene temporarily
        this.game.scene.add(dummyProjectile);
        
        // Force shader compilation
        if (this.game.renderer && this.game.renderer.renderer) {
            this.game.renderer.renderer.compile(this.game.scene, this.game.camera);
        }
        
        // Set position far away (out of view) but still rendered
        dummyProjectile.position.set(0, -10000, 0);
        
        console.log("Projectile assets verified and shaders ensured to be warmed");
    }
}