/**
 * velocityIndicator.ts - Velocity vector indicator
 * Part of Phase 4: Visual Indicators (Movement Feedback)
 *
 * Displays a subtle arrow showing current velocity direction and magnitude.
 * Helps player understand their momentum and movement inertia.
 */

import { Velocity } from '../../ecs/components';

/**
 * Velocity indicator element
 */
interface VelocityElements {
    container: HTMLDivElement;
    arrow: HTMLDivElement;
    speedText: HTMLDivElement;
}

// Configuration
const INDICATOR_BASE_LENGTH = 40; // Base length in pixels
const INDICATOR_MAX_LENGTH = 120; // Maximum length in pixels
const VELOCITY_THRESHOLD = 0.5; // Minimum velocity to show indicator
const MAX_DISPLAY_VELOCITY = 25.0; // Velocity at max length (matches Physics.MAX_VELOCITY)
const INDICATOR_WIDTH = 3; // Arrow line width in pixels

// Colors
const COLOR_SLOW = '#30ff30'; // Green for low speed
const COLOR_MEDIUM = '#ffaa30'; // Orange for medium speed
const COLOR_FAST = '#ff3030'; // Red for high speed

// State
let elements: VelocityElements | null = null;
let initialized = false;

/**
 * Initialize velocity indicator system
 * Creates the HTML overlay container and arrow element
 */
export function initVelocityIndicator(): void {
    if (initialized) return;

    // Create container
    const container = document.createElement('div');
    container.id = 'velocity-indicator-container';

    Object.assign(container.style, {
        position: 'fixed',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        pointerEvents: 'none',
        zIndex: '1000',
        opacity: '0',
        transition: 'opacity 0.2s ease-out'
    });

    document.body.appendChild(container);

    // Create arrow element (SVG)
    const arrow = document.createElement('div');
    arrow.className = 'velocity-arrow';
    arrow.innerHTML = `
        <svg width="200" height="200" viewBox="0 0 200 200">
            <defs>
                <marker id="velocity-arrowhead" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
                    <polygon points="0 0, 10 3, 0 6" fill="white" />
                </marker>
            </defs>
            <line id="velocity-line" x1="100" y1="100" x2="100" y2="100"
                stroke="white" stroke-width="${INDICATOR_WIDTH}"
                marker-end="url(#velocity-arrowhead)"/>
        </svg>
    `;

    Object.assign(arrow.style, {
        position: 'absolute',
        width: '200px',
        height: '200px',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)'
    });

    container.appendChild(arrow);

    // Create speed text
    const speedText = document.createElement('div');
    speedText.className = 'velocity-speed-text';
    speedText.textContent = '0';

    Object.assign(speedText.style, {
        position: 'absolute',
        bottom: '-30px',
        left: '50%',
        transform: 'translateX(-50%)',
        color: 'white',
        fontSize: '14px',
        fontFamily: 'monospace',
        textShadow: '0 0 4px black',
        whiteSpace: 'nowrap'
    });

    container.appendChild(speedText);

    elements = {
        container,
        arrow,
        speedText
    };

    initialized = true;
    console.log('[VelocityIndicator] Initialized');
}

/**
 * Update velocity indicator (call every frame)
 * @param playerEid - Player entity ID
 */
export function updateVelocityIndicator(playerEid: number): void {
    if (!initialized || !elements || playerEid === -1) {
        return;
    }

    // Get player velocity
    const vx = Velocity.x[playerEid];
    const vy = Velocity.y[playerEid];
    const vz = Velocity.z[playerEid];

    // Calculate velocity magnitude
    const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);

    // Hide if velocity is too low
    if (speed < VELOCITY_THRESHOLD) {
        elements.container.style.opacity = '0';
        return;
    }

    // Show indicator
    elements.container.style.opacity = '0.8';

    // Calculate arrow length based on speed
    const normalizedSpeed = Math.min(speed / MAX_DISPLAY_VELOCITY, 1.0);
    const arrowLength = INDICATOR_BASE_LENGTH + (INDICATOR_MAX_LENGTH - INDICATOR_BASE_LENGTH) * normalizedSpeed;

    // Calculate arrow direction (project 3D velocity to 2D screen space)
    // We use vx (horizontal) and vz (forward/back) for 2D arrow direction
    // Ignore vy (vertical) for simplicity
    const angle = Math.atan2(vx, -vz); // -vz because forward is negative Z in Three.js

    // Calculate arrow endpoint
    const centerX = 100;
    const centerY = 100;
    const endX = centerX + Math.sin(angle) * arrowLength;
    const endY = centerY + Math.cos(angle) * arrowLength;

    // Update arrow SVG line
    const line = elements.arrow.querySelector('#velocity-line') as SVGLineElement;
    if (line) {
        line.setAttribute('x1', centerX.toString());
        line.setAttribute('y1', centerY.toString());
        line.setAttribute('x2', endX.toString());
        line.setAttribute('y2', endY.toString());

        // Color based on speed
        const color = getSpeedColor(normalizedSpeed);
        line.setAttribute('stroke', color);

        // Update arrowhead color
        const arrowhead = elements.arrow.querySelector('#velocity-arrowhead polygon') as SVGPolygonElement;
        if (arrowhead) {
            arrowhead.setAttribute('fill', color);
        }
    }

    // Update speed text
    elements.speedText.textContent = `${speed.toFixed(1)} u/s`;
    elements.speedText.style.color = getSpeedColor(normalizedSpeed);
}

/**
 * Get color based on speed
 * @param normalizedSpeed - Speed normalized to 0-1
 * @returns CSS color string
 */
function getSpeedColor(normalizedSpeed: number): string {
    if (normalizedSpeed < 0.4) {
        return COLOR_SLOW; // Green - low speed
    } else if (normalizedSpeed < 0.7) {
        return COLOR_MEDIUM; // Orange - medium speed
    } else {
        return COLOR_FAST; // Red - high speed
    }
}

/**
 * Clean up velocity indicator (call on shutdown)
 */
export function cleanupVelocityIndicator(): void {
    if (elements && elements.container && elements.container.parentNode) {
        elements.container.parentNode.removeChild(elements.container);
    }

    elements = null;
    initialized = false;
}
