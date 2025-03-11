// systemTransition.js - Handles the visual transition between star systems

export class SystemTransition {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.isTransitioning = false;
        this.transitionDuration = 3000; // milliseconds
        this.onTransitionComplete = null;
        
        // Create transition elements
        this.setupTransitionElements();
    }
    
    setupTransitionElements() {
        // Warp tunnel effect
        this.warpTunnel = new THREE.Points(
            new THREE.BufferGeometry(),
            new THREE.PointsMaterial({
                color: 0x30cfd0,
                size: 2,
                blending: THREE.AdditiveBlending,
                transparent: true,
                sizeAttenuation: true
            })
        );
        
        // Create particles for warp effect
        this.createWarpParticles();
        
        // Flash overlay for transition effect
        this.createOverlay();
    }
    
    createWarpParticles() {
        // Number of particles
        const particleCount = 2000;
        
        // Create position array
        const positions = new Float32Array(particleCount * 3);
        
        // Initialize particle positions in a tunnel shape
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Polar coordinates for tunnel shape
            const radius = 50 + Math.random() * 50;
            const theta = Math.random() * Math.PI * 2;
            const length = -500 - Math.random() * 3000; // Negative z is forward
            
            // Convert to Cartesian
            positions[i3] = radius * Math.cos(theta);     // x
            positions[i3 + 1] = radius * Math.sin(theta); // y
            positions[i3 + 2] = length;                   // z
        }
        
        // Add to buffer geometry
        this.warpTunnel.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        // Store original positions for resetting
        this.originalPositions = new Float32Array(positions);
    }
    
    createOverlay() {
        // Create a DOM overlay for the flash effect
        this.overlay = document.createElement('div');
        this.overlay.id = 'warp-overlay';
        this.overlay.style.position = 'fixed';
        this.overlay.style.top = '0';
        this.overlay.style.left = '0';
        this.overlay.style.width = '100%';
        this.overlay.style.height = '100%';
        this.overlay.style.backgroundColor = '#30cfd0';
        this.overlay.style.opacity = '0';
        this.overlay.style.transition = 'opacity 0.5s';
        this.overlay.style.pointerEvents = 'none';
        this.overlay.style.zIndex = '9999';
        
        // Add to DOM but hide initially
        document.body.appendChild(this.overlay);
    }
    
    // Start a transition between systems
    startTransition(onComplete) {
        if (this.isTransitioning) return;
        
        console.log("Starting system transition...");
        this.isTransitioning = true;
        
        // Store callback
        this.onTransitionComplete = onComplete;
        
        // Add warp tunnel to scene
        this.scene.add(this.warpTunnel);
        
        // Position the camera for the transition
        this.initialCameraPosition = this.camera.position.clone();
        this.initialCameraRotation = this.camera.rotation.clone();
        
        // Start transition animation
        this.startTime = Date.now();
        
        // Show overlay
        this.showOverlay();
        
        // Start animation
        this.animate();
    }
    
    // Animation loop for transition
    animate() {
        if (!this.isTransitioning) return;
        
        const currentTime = Date.now();
        const elapsed = currentTime - this.startTime;
        const progress = Math.min(elapsed / this.transitionDuration, 1.0);
        
        // Update warp effect
        this.updateWarpEffect(progress);
        
        // Check if transition is complete
        if (progress >= 1.0) {
            this.completeTransition();
            return;
        }
        
        // Continue animation
        requestAnimationFrame(this.animate.bind(this));
    }
    
    // Update warp tunnel effect
    updateWarpEffect(progress) {
        // Get positions
        const positions = this.warpTunnel.geometry.attributes.position.array;
        
        // Adjust warp speed based on progress
        const warpSpeed = 3 + progress * 20;
        
        // Update particle positions
        for (let i = 0; i < positions.length; i += 3) {
            // Move particles toward camera
            positions[i + 2] += warpSpeed; // z value
            
            // Reset particles that go past the camera
            if (positions[i + 2] > 100) {
                // Reset to original position with an offset to create continuous tunnel
                positions[i] = this.originalPositions[i];
                positions[i + 1] = this.originalPositions[i + 1];
                positions[i + 2] = this.originalPositions[i + 2] - 500; // Return to end of tunnel
            }
        }
        
        // Update buffer geometry
        this.warpTunnel.geometry.attributes.position.needsUpdate = true;
        
        // Update camera animation - slight movement to enhance effect
        if (this.camera) {
            this.camera.rotation.z += 0.0005 * Math.sin(progress * Math.PI);
        }
    }
    
    // Show overlay with flash effect
    showOverlay() {
        if (!this.overlay) return;
        
        // Start with low opacity
        this.overlay.style.opacity = '0.2';
        
        // Schedule flash toward end of transition
        setTimeout(() => {
            this.overlay.style.opacity = '1';
            
            // Fade out after flash
            setTimeout(() => {
                this.overlay.style.opacity = '0';
            }, 500);
        }, this.transitionDuration - 1000);
    }
    
    // Complete the transition
    completeTransition() {
        console.log("System transition complete");
        this.isTransitioning = false;
        
        // Remove warp tunnel from scene
        this.scene.remove(this.warpTunnel);
        
        // Reset camera position and rotation
        if (this.camera && this.initialCameraPosition && this.initialCameraRotation) {
            this.camera.position.copy(this.initialCameraPosition);
            this.camera.rotation.copy(this.initialCameraRotation);
        }
        
        // Call completion callback if provided
        if (this.onTransitionComplete && typeof this.onTransitionComplete === 'function') {
            // Use setTimeout to make sure this executes after the animation frame
            setTimeout(() => {
                console.log("Executing transition completion callback");
                this.onTransitionComplete();
            }, 100);
        }
    }
}