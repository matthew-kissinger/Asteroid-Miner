// stargateIndicator.ts - Stargate direction indicator arrow for HUD

import * as THREE from 'three';

export class StargateIndicator {
    container: HTMLElement | null = null;
    arrow: HTMLDivElement | null = null;
    distanceText: HTMLDivElement | null = null;
    marker: HTMLDivElement | null = null;
    isInitialized: boolean = false;

    // Reusable math objects
    private stargateWorldPos = new THREE.Vector3();
    private projectResult = new THREE.Vector3();

    /**
     * Initialize the stargate indicator DOM elements
     */
    init(parent: HTMLElement): void {
        if (this.isInitialized) return;

        // Create main container
        this.container = document.createElement('div');
        this.container.id = 'stargate-indicator-container';
        Object.assign(this.container.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: '500'
        });
        parent.appendChild(this.container);

        // Create arrow element
        this.arrow = document.createElement('div');
        this.arrow.id = 'stargate-arrow';
        this.arrow.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 22h8v-8h4v8h8L12 2Z" fill="currentColor"/>
            </svg>
        `;
        Object.assign(this.arrow.style, {
            position: 'absolute',
            width: '24px',
            height: '24px',
            color: 'rgba(0, 255, 255, 0.9)',
            textShadow: '0 0 10px rgba(0, 255, 255, 0.6)',
            filter: 'drop-shadow(0 0 8px rgba(0, 255, 255, 0.5))',
            transform: 'translate(-50%, -50%)',
            transition: 'opacity 0.1s linear',
            display: 'none',
            opacity: '1'
        });
        this.container.appendChild(this.arrow);

        // Create distance text
        this.distanceText = document.createElement('div');
        this.distanceText.id = 'stargate-distance';
        Object.assign(this.distanceText.style, {
            position: 'absolute',
            fontSize: '12px',
            fontFamily: '"Rajdhani", "Electrolize", monospace',
            fontWeight: '500',
            color: 'rgba(0, 255, 255, 0.8)',
            textShadow: '0 0 5px rgba(0, 255, 255, 0.4)',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            transform: 'translate(-50%, -50%)',
            transition: 'opacity 0.1s linear',
            display: 'none'
        });
        this.container.appendChild(this.distanceText);

        // Create on-screen marker (diamond shape)
        this.marker = document.createElement('div');
        this.marker.id = 'stargate-marker';
        this.marker.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 1L14 8L8 15L2 8L8 1Z" stroke="currentColor" stroke-width="1" fill="none"/>
            </svg>
        `;
        Object.assign(this.marker.style, {
            position: 'absolute',
            width: '16px',
            height: '16px',
            color: 'rgba(0, 255, 255, 0.7)',
            filter: 'drop-shadow(0 0 4px rgba(0, 255, 255, 0.3))',
            transform: 'translate(-50%, -50%)',
            transition: 'opacity 0.1s linear',
            display: 'none',
            opacity: '1'
        });
        this.container.appendChild(this.marker);

        this.isInitialized = true;
    }

    /**
     * Update the indicator position and visibility
     * @param camera - Three.js camera for projection
     * @param starshipPosition - World position of the spaceship
     */
    update(camera: THREE.Camera, starshipPosition: THREE.Vector3): void {
        if (!this.isInitialized || !this.arrow || !this.distanceText || !this.marker) return;

        // Stargate is always at (0, 10000, 0)
        this.stargateWorldPos.set(0, 10000, 0);

        // Calculate distance
        const distance = starshipPosition.distanceTo(this.stargateWorldPos);

        // Fade out when very close (< 200 units)
        const fadeFactor = Math.max(0, Math.min(1, (distance - 200) / 500));

        // Project stargate position to screen coordinates
        this.projectResult.copy(this.stargateWorldPos);
        this.projectResult.project(camera);

        // Check if stargate is visible in viewport
        // projectResult is in NDC space: x, y in [-1, 1]
        const isOnScreen = this.projectResult.x > -1.1 && this.projectResult.x < 1.1 &&
                          this.projectResult.y > -1.1 && this.projectResult.y < 1.1 &&
                          this.projectResult.z <= 1; // z <= 1 means in front of camera

        if (isOnScreen) {
            // Show on-screen marker
            this.marker.style.display = 'block';
            this.arrow.style.display = 'none';
            this.distanceText.style.display = 'block';

            // Convert NDC to screen pixels
            const screenX = (this.projectResult.x + 1) * window.innerWidth / 2;
            const screenY = (1 - this.projectResult.y) * window.innerHeight / 2;

            this.marker.style.left = `${screenX}px`;
            this.marker.style.top = `${screenY}px`;

            // Position distance text near marker
            this.distanceText.style.left = `${screenX + 12}px`;
            this.distanceText.style.top = `${screenY}px`;
            this.distanceText.style.opacity = `${fadeFactor}`;

            this.distanceText.textContent = this.formatDistance(distance);
        } else {
            // Show off-screen arrow
            this.marker.style.display = 'none';
            this.arrow.style.display = 'block';
            this.distanceText.style.display = 'block';

            // Calculate angle from screen center to stargate
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;

            // Use NDC coordinates to calculate angle
            const angle = Math.atan2(this.projectResult.y, this.projectResult.x);
            const angleDeg = (angle * 180 / Math.PI) + 90; // +90 because SVG arrow points up

            // Place arrow at edge of screen with padding
            const padding = 40;
            const maxX = window.innerWidth - padding;
            const maxY = window.innerHeight - padding;

            // Calculate position on screen edge
            const maxDistance = Math.max(window.innerWidth, window.innerHeight);
            const edgeX = centerX + Math.cos(angle - Math.PI / 2) * maxDistance;
            const edgeY = centerY + Math.sin(angle - Math.PI / 2) * maxDistance;

            // Clamp to screen edges with padding
            const clampedX = Math.max(padding, Math.min(maxX, edgeX));
            const clampedY = Math.max(padding, Math.min(maxY, edgeY));

            this.arrow.style.left = `${clampedX}px`;
            this.arrow.style.top = `${clampedY}px`;
            this.arrow.style.transform = `translate(-50%, -50%) rotate(${angleDeg}deg)`;
            this.arrow.style.opacity = `${fadeFactor}`;

            // Position distance text near arrow
            this.distanceText.style.left = `${clampedX}px`;
            this.distanceText.style.top = `${clampedY + 20}px`;
            this.distanceText.style.opacity = `${fadeFactor}`;

            this.distanceText.textContent = this.formatDistance(distance);
        }
    }

    /**
     * Format distance for display
     */
    private formatDistance(distance: number): string {
        if (distance < 1000) {
            return `${Math.round(distance)} u`;
        } else if (distance < 1000000) {
            return `${(distance / 1000).toFixed(1)}k u`;
        } else {
            return `${(distance / 1000000).toFixed(1)}m u`;
        }
    }

    /**
     * Cleanup the indicator
     */
    destroy(): void {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.container = null;
        this.arrow = null;
        this.distanceText = null;
        this.marker = null;
        this.isInitialized = false;
    }
}
