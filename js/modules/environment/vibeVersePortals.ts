// vibeVersePortals.ts - Implements VibeVerse portal entrance and exit

import {
  Object3D,
  Vector3,
  Scene,
  Group,
  Box3,
  Points,
  TorusGeometry,
  MeshStandardMaterial,
  Mesh,
  CircleGeometry,
  MeshBasicMaterial,
  DoubleSide,
  BufferGeometry,
  BufferAttribute,
  PointsMaterial,
  AdditiveBlending,
  CanvasTexture,
  PlaneGeometry,
} from 'three';

interface SpaceshipLike {
    mesh?: Object3D;
    velocity?: Vector3;
}

interface GameGlobal {
    selfUsername?: string;
    currentSpeed?: number;
}

export class VibeVersePortals {
    scene: Scene;
    spaceship: SpaceshipLike;
    startPortalGroup: Group | null;
    exitPortalGroup: Group | null;
    startPortalBox: Box3 | null;
    exitPortalBox: Box3 | null;
    startPortalParticleSystem: Points | null;
    exitPortalParticleSystem: Points | null;
    shouldCreateStartPortal: boolean;
    refUrl: string;
    _isRedirecting?: boolean;

    constructor(scene: Scene, spaceship: SpaceshipLike) {
        this.scene = scene;
        this.spaceship = spaceship;
        this.startPortalGroup = null;
        this.exitPortalGroup = null;
        this.startPortalBox = null;
        this.exitPortalBox = null;
        this.startPortalParticleSystem = null;
        this.exitPortalParticleSystem = null;

        // Check if we should create a start portal
        const search = (window as any).location?.search || '';
        this.shouldCreateStartPortal = new URLSearchParams(search).has('portal');

        // Get reference URL if it exists
        this.refUrl = new URLSearchParams(search).get('ref') || '';

        // Initialize portals
        this.init();
    }

    init(): void {
        // Create start portal if needed (based on URL parameter)
        if (this.shouldCreateStartPortal) {
            this.createStartPortal();
        }

        // Exit portal removed - no longer creating it
    }

    createStartPortal(): void {
        // Create a portal group
        this.startPortalGroup = new Group();
        this.startPortalGroup.name = 'startPortal';

        // Create portal ring - INCREASED SIZE
        const ringGeometry = new TorusGeometry(150, 15, 32, 100);
        const ringMaterial = new MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.5,
            roughness: 0.3,
            metalness: 0.7
        });
        const ring = new Mesh(ringGeometry, ringMaterial);
        this.startPortalGroup.add(ring);

        // Create portal surface (semi-transparent) - INCREASED SIZE
        const surfaceGeometry = new CircleGeometry(135, 32);
        const surfaceMaterial = new MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.3,
            side: DoubleSide
        });
        const surface = new Mesh(surfaceGeometry, surfaceMaterial);
        surface.position.z = 0.1; // Slight offset to avoid z-fighting
        this.startPortalGroup.add(surface);

        // Create particle system
        const particleCount = 500;
        const particleGeometry = new BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        // Position particles in a ring pattern - ADJUSTED FOR LARGER SIZE
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const radius = 135 + (Math.random() * 30 - 15); // Random variation around the ring

            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = Math.sin(angle) * radius;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 15; // Small variation in z
        }

        particleGeometry.setAttribute('position', new BufferAttribute(positions, 3));

        const particleMaterial = new PointsMaterial({
            color: 0xff5555,
            size: 3.5, // Increased particle size
            blending: AdditiveBlending,
            transparent: true
        });

        this.startPortalParticleSystem = new Points(particleGeometry, particleMaterial);
        this.startPortalGroup.add(this.startPortalParticleSystem);

        // Position the portal higher above the stargate and centered on y-axis
        this.startPortalGroup.position.set(0, 15000, 0); // Centered above stargate
        this.startPortalGroup.rotation.x = Math.PI / 2; // Face straight down

        // Add to scene
        this.scene.add(this.startPortalGroup);

        // Create collision box
        this.startPortalBox = new Box3().setFromObject(this.startPortalGroup);

        console.log("Start portal created at position:", this.startPortalGroup.position);
    }

    createExitPortal(): void {
        // Create a portal group
        this.exitPortalGroup = new Group();
        this.exitPortalGroup.name = 'exitPortal';

        // Create portal ring - INCREASED SIZE
        const ringGeometry = new TorusGeometry(150, 15, 32, 100);
        const ringMaterial = new MeshStandardMaterial({
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 0.5,
            roughness: 0.3,
            metalness: 0.7
        });
        const ring = new Mesh(ringGeometry, ringMaterial);
        this.exitPortalGroup.add(ring);

        // Create portal surface (semi-transparent) - INCREASED SIZE
        const surfaceGeometry = new CircleGeometry(135, 32);
        const surfaceMaterial = new MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.3,
            side: DoubleSide
        });
        const surface = new Mesh(surfaceGeometry, surfaceMaterial);
        surface.position.z = 0.1; // Slight offset to avoid z-fighting
        this.exitPortalGroup.add(surface);

        // Create particle system
        const particleCount = 500;
        const particleGeometry = new BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        // Position particles in a ring pattern - ADJUSTED FOR LARGER SIZE
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const radius = 135 + (Math.random() * 30 - 15); // Random variation around the ring

            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = Math.sin(angle) * radius;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 15; // Small variation in z
        }

        particleGeometry.setAttribute('position', new BufferAttribute(positions, 3));

        const particleMaterial = new PointsMaterial({
            color: 0x55ff55,
            size: 3.5, // Increased particle size
            blending: AdditiveBlending,
            transparent: true
        });

        this.exitPortalParticleSystem = new Points(particleGeometry, particleMaterial);
        this.exitPortalGroup.add(this.exitPortalParticleSystem);

        // Create text label for the portal - INCREASED SIZE
        const canvas = document.createElement('canvas');
        canvas.width = 1024; // Increased size
        canvas.height = 256; // Increased size
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.font = '72px Arial'; // Increased font size
            ctx.fillStyle = '#00ff00';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('VIBEVERSE PORTAL', canvas.width / 2, canvas.height / 2);
        }

        const texture = new CanvasTexture(canvas);
        const labelGeometry = new PlaneGeometry(200, 50); // Increased size
        const labelMaterial = new MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: DoubleSide
        });

        const label = new Mesh(labelGeometry, labelMaterial);
        label.position.set(0, 200, 0); // Position above the portal (increased)
        this.exitPortalGroup.add(label);

        // Position the portal higher above the stargate and centered on y-axis
        this.exitPortalGroup.position.set(0, 16000, 0); // Centered above stargate, bit higher than start portal
        this.exitPortalGroup.rotation.x = Math.PI / 2; // Face straight down

        // Add to scene
        this.scene.add(this.exitPortalGroup);

        // Create collision box
        this.exitPortalBox = new Box3().setFromObject(this.exitPortalGroup);

        console.log("Exit portal created at position:", this.exitPortalGroup.position);
    }

    animateStartPortal(deltaTime: number): void {
        if (!this.startPortalGroup || !this.startPortalParticleSystem || !this.startPortalBox) return;

        // Rotate particle system
        this.startPortalParticleSystem.rotation.z += deltaTime * 0.5;

        // Update collision box (only periodically to save performance)
        if (Math.random() < 0.05) {
            this.startPortalBox.setFromObject(this.startPortalGroup);
        }
    }

    animateExitPortal(deltaTime: number): void {
        if (!this.exitPortalGroup || !this.exitPortalParticleSystem || !this.exitPortalBox) return;

        // Rotate particle system
        this.exitPortalParticleSystem.rotation.z += deltaTime * 0.5;

        // Update collision box (only periodically to save performance)
        if (Math.random() < 0.05) {
            this.exitPortalBox.setFromObject(this.exitPortalGroup);
        }
    }

    checkPortalInteractions(_deltaTime: number): void {
        void _deltaTime;
        if (!this.spaceship || !this.spaceship.mesh) return;

        // Create a box for the spaceship (used for collision detection)
        const shipBox = new Box3().setFromObject(this.spaceship.mesh);

        // Check start portal interaction (if it exists)
        if (this.startPortalGroup && this.startPortalBox) {
            const distance = this.spaceship.mesh.position.distanceTo(this.startPortalGroup.position);

            // If player is close to the start portal - INCREASED DETECTION RANGE
            if (distance < 400) { // Increased from 200 to match much larger portal size
                // Check for collision
                if (shipBox.intersectsBox(this.startPortalBox)) {
                    this.handleStartPortalEntry();
                }
            }
        }

        // Exit portal interaction removed
    }

    handleStartPortalEntry(): void {
        // Prevent multiple redirects
        if (this._isRedirecting) return;
        this._isRedirecting = true;

        console.log("Player entered start portal");

        // Get the reference URL from the query parameter
        let targetUrl = this.refUrl;

        // Make sure the URL has the https:// prefix
        if (targetUrl && !targetUrl.startsWith('http')) {
            targetUrl = 'https://' + targetUrl;
        }

        // If no target URL, do nothing
        if (!targetUrl) {
            console.error("No target URL specified for portal");
            this._isRedirecting = false;
            return;
        }

        // Parse current URL parameters (excluding 'ref')
        const currentParams = new URLSearchParams((window as any).location?.search || '');
        currentParams.delete('ref');
        currentParams.delete('portal');

        // Create a URL object for the target
        let finalUrl: URL;
        try {
            finalUrl = new URL(targetUrl);

            // Append any other current parameters to the target URL
            for (const [key, value] of currentParams.entries()) {
                finalUrl.searchParams.append(key, value);
            }
        } catch (e) {
            console.error("Invalid target URL:", targetUrl);
            this._isRedirecting = false;
            return;
        }

        console.log("Redirecting to:", finalUrl.toString());

        // Short delay before redirecting
        setTimeout(() => {
            (window as any).location.href = finalUrl.toString();
        }, 100);
    }

    handleExitPortalEntry(): void {
        // Prevent multiple redirects
        if (this._isRedirecting) return;
        this._isRedirecting = true;

        console.log("Player entered exit portal");

        // Construct next page URL
        const nextPage = 'https://portal.pieter.com';

        // Get current parameters
        const currentParams = new URLSearchParams((window as any).location?.search || '');

        // Create URL object
        const url = new URL(nextPage);

        // Add required parameters
        url.searchParams.append('portal', 'true');
        url.searchParams.append('username', this.getUsername());
        url.searchParams.append('color', 'white'); // Default color
        url.searchParams.append('speed', this.getPlayerSpeed());

        // Copy other parameters from current URL
        for (const [key, value] of currentParams.entries()) {
            if (!['portal', 'username', 'color', 'speed'].includes(key)) {
                url.searchParams.append(key, value);
            }
        }

        console.log("Redirecting to:", url.toString());

        // Short delay before redirecting
        setTimeout(() => {
            (window as any).location.href = url.toString();
        }, 100);
    }

    getUsername(): string {
        // Get username from game state if available
        const game = (window as any).game as GameGlobal | undefined;
        if (game && game.selfUsername) {
            return game.selfUsername;
        }

        // Fallback: generate a random username
        return `Miner${Math.floor(Math.random() * 10000)}`;
    }

    getPlayerSpeed(): string {
        // Get current speed from game state if available
        const game = (window as any).game as GameGlobal | undefined;
        if (game && game.currentSpeed) {
            return game.currentSpeed.toString();
        }

        // Try to get speed from spaceship if available
        if (this.spaceship && this.spaceship.velocity) {
            return this.spaceship.velocity.length().toString();
        }

        // Fallback: default speed
        return '10';
    }

    update(deltaTime: number): void {
        // Animate start portal only (if it exists)
        this.animateStartPortal(deltaTime);

        // Check for portal interactions
        this.checkPortalInteractions(deltaTime);
    }

    dispose(): void {
        // Clean up resources
        if (this.startPortalGroup) {
            this.scene.remove(this.startPortalGroup);
        }

        if (this.exitPortalGroup) {
            this.scene.remove(this.exitPortalGroup);
        }

        // Clear references
        this.startPortalGroup = null;
        this.exitPortalGroup = null;
        this.startPortalBox = null;
        this.exitPortalBox = null;
        this.startPortalParticleSystem = null;
        this.exitPortalParticleSystem = null;
    }
}
