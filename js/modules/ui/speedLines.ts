/**
 * speedLines.ts - Speed lines effect for high-velocity movement
 * Part of Phase 4: Visual Indicators (Movement Feedback)
 *
 * Shows radial lines emanating from screen center when traveling at high speed.
 * Creates a sense of motion and velocity feedback.
 */

import { Velocity } from '../../ecs/components';

/**
 * Speed line element with metadata
 */
interface SpeedLine {
    element: HTMLDivElement;
    inUse: boolean;
    angle: number; // Line angle in radians
    length: number; // Line length in pixels
}

// Configuration
const MAX_LINES = 20; // Maximum number of lines
const VELOCITY_THRESHOLD = 10.0; // Minimum velocity to show lines (40% of max)
const MAX_DISPLAY_VELOCITY = 25.0; // Velocity at max effect (matches Physics.MAX_VELOCITY)
const LINE_WIDTH = 2; // Line width in pixels
const LINE_MIN_LENGTH = 50; // Minimum line length in pixels
const LINE_MAX_LENGTH = 200; // Maximum line length in pixels
const LINE_DISTANCE_FROM_CENTER = 100; // Starting distance from center in pixels
const FADE_IN_DURATION = 0.3; // Seconds to fade in
const ANIMATION_SPEED = 800; // Pixels per second (how fast lines move outward)

// Colors
const LINE_COLOR = 'rgba(255, 255, 255, 0.6)'; // White with transparency

// State
let linePool: SpeedLine[] = [];
let container: HTMLDivElement | null = null;
let initialized = false;
let currentIntensity = 0; // 0-1, based on velocity

/**
 * Initialize speed lines system
 * Creates the HTML overlay container and line pool
 */
export function initSpeedLines(): void {
    if (initialized) return;

    // Create container
    container = document.createElement('div');
    container.id = 'speed-lines-container';

    Object.assign(container.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: '999', // Below other UI elements
        overflow: 'hidden'
    });

    document.body.appendChild(container);

    // Create line pool
    const angleStep = (Math.PI * 2) / MAX_LINES;
    for (let i = 0; i < MAX_LINES; i++) {
        const angle = i * angleStep;
        const line = createLineElement();
        linePool.push({
            element: line,
            inUse: false,
            angle,
            length: 0
        });
        container.appendChild(line);
    }

    initialized = true;
    console.log('[SpeedLines] Initialized with', MAX_LINES, 'lines');
}

/**
 * Create a single speed line element
 */
function createLineElement(): HTMLDivElement {
    const line = document.createElement('div');
    line.className = 'speed-line';

    Object.assign(line.style, {
        position: 'absolute',
        width: `${LINE_WIDTH}px`,
        height: '0px',
        backgroundColor: LINE_COLOR,
        transformOrigin: 'top center',
        opacity: '0',
        transition: 'opacity 0.2s ease-out'
    });

    return line;
}

/**
 * Update speed lines (call every frame)
 * @param playerEid - Player entity ID
 * @param deltaTime - Time since last frame in seconds
 */
export function updateSpeedLines(playerEid: number, deltaTime: number): void {
    if (!initialized || !container || playerEid === -1) {
        return;
    }

    // Get player velocity
    const vx = Velocity.x[playerEid];
    const vy = Velocity.y[playerEid];
    const vz = Velocity.z[playerEid];

    // Calculate velocity magnitude
    const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);

    // Calculate intensity (0-1) based on velocity
    const targetIntensity = speed < VELOCITY_THRESHOLD
        ? 0
        : Math.min((speed - VELOCITY_THRESHOLD) / (MAX_DISPLAY_VELOCITY - VELOCITY_THRESHOLD), 1.0);

    // Smooth intensity transitions
    const fadeSpeed = 1.0 / FADE_IN_DURATION;
    if (targetIntensity > currentIntensity) {
        currentIntensity = Math.min(currentIntensity + fadeSpeed * deltaTime, targetIntensity);
    } else {
        currentIntensity = Math.max(currentIntensity - fadeSpeed * deltaTime, targetIntensity);
    }

    // Hide all lines if no effect
    if (currentIntensity < 0.01) {
        for (const line of linePool) {
            line.element.style.opacity = '0';
            line.inUse = false;
        }
        return;
    }

    // Screen dimensions
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const centerX = screenWidth / 2;
    const centerY = screenHeight / 2;

    // Update lines
    for (const line of linePool) {
        line.inUse = true;

        // Calculate line length based on intensity
        const lineLength = LINE_MIN_LENGTH + (LINE_MAX_LENGTH - LINE_MIN_LENGTH) * currentIntensity;

        // Animate line length (expand outward)
        line.length = (line.length + ANIMATION_SPEED * deltaTime) % (LINE_DISTANCE_FROM_CENTER + lineLength);

        // Calculate line position
        const distance = LINE_DISTANCE_FROM_CENTER + line.length;
        const startX = centerX + Math.cos(line.angle) * distance;
        const startY = centerY + Math.sin(line.angle) * distance;

        // Position line
        line.element.style.left = `${startX}px`;
        line.element.style.top = `${startY}px`;
        line.element.style.height = `${lineLength}px`;

        // Rotate line to point away from center
        const angleDeg = (line.angle * 180 / Math.PI) + 90; // +90 to orient correctly
        line.element.style.transform = `rotate(${angleDeg}deg)`;

        // Opacity based on distance from center (fade out as they get further)
        const distanceRatio = line.length / (LINE_DISTANCE_FROM_CENTER + lineLength);
        const opacity = currentIntensity * (1.0 - distanceRatio);
        line.element.style.opacity = opacity.toString();
    }
}

/**
 * Clean up speed lines (call on shutdown)
 */
export function cleanupSpeedLines(): void {
    if (container && container.parentNode) {
        container.parentNode.removeChild(container);
    }

    linePool = [];
    container = null;
    initialized = false;
    currentIntensity = 0;
}
