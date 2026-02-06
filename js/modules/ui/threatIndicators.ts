/**
 * threatIndicators.ts - Off-screen enemy threat indicators
 * Part of Phase 4: Visual Indicators (Threat Awareness)
 *
 * Shows arrows at screen edges when enemies are off-screen to help player track threats.
 * Uses world-to-screen projection to determine enemy positions relative to viewport.
 */

import * as THREE from 'three';
import { Position } from '../../ecs/components';

/**
 * Arrow indicator element with metadata
 */
interface ThreatArrow {
    element: HTMLDivElement;
    inUse: boolean;
}

// Configuration
const MAX_INDICATORS = 6;
const DETECTION_RANGE = 500; // Only show enemies within this range
const ARROW_SIZE = 30; // pixels
const EDGE_PADDING = 20; // pixels from screen edge
const DISTANCE_NEAR = 150; // Red zone
const DISTANCE_MEDIUM = 300; // Yellow zone

// State
let arrowPool: ThreatArrow[] = [];
let container: HTMLDivElement | null = null;
let camera: THREE.Camera | null = null;
let initialized = false;

/**
 * Initialize threat indicators system
 * Creates the HTML overlay container and arrow pool
 */
export function initThreatIndicators(): void {
    if (initialized) return;

    // Create container
    container = document.createElement('div');
    container.id = 'threat-indicators-container';
    container.className = 'threat-indicators-container';

    document.body.appendChild(container);

    // Create arrow pool
    for (let i = 0; i < MAX_INDICATORS; i++) {
        const arrow = createArrowElement();
        arrowPool.push({
            element: arrow,
            inUse: false
        });
        container.appendChild(arrow);
    }

    initialized = true;
    console.log('[ThreatIndicators] Initialized with', MAX_INDICATORS, 'indicators');
}

/**
 * Create a single arrow indicator element
 */
function createArrowElement(): HTMLDivElement {
    const arrow = document.createElement('div');
    arrow.className = 'threat-arrow';

    // Set dynamic dimensions
    arrow.style.width = `${ARROW_SIZE}px`;
    arrow.style.height = `${ARROW_SIZE}px`;

    return arrow;
}

/**
 * Set the camera reference (required for projection)
 */
export function setThreatIndicatorsCamera(cam: THREE.Camera): void {
    camera = cam;
}

/**
 * Update threat indicators (call every frame)
 * @param enemies - Array of enemy entity IDs
 * @param playerEid - Player entity ID
 */
export function updateThreatIndicators(enemies: number[], playerEid: number): void {
    if (!initialized || !camera || !container || playerEid === -1) {
        return;
    }

    // Reset arrow pool
    for (const arrow of arrowPool) {
        arrow.inUse = false;
        arrow.element.style.opacity = '0';
    }

    // Get player position
    const playerX = Position.x[playerEid];
    const playerY = Position.y[playerEid];
    const playerZ = Position.z[playerEid];

    // Collect enemies within detection range, sorted by distance
    const threats: Array<{ eid: number; distance: number }> = [];

    for (const eid of enemies) {
        const dx = Position.x[eid] - playerX;
        const dy = Position.y[eid] - playerY;
        const dz = Position.z[eid] - playerZ;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        // Skip enemies outside detection range
        if (distance > DETECTION_RANGE) continue;

        threats.push({ eid, distance });
    }

    // Sort by distance (closest first)
    threats.sort((a, b) => a.distance - b.distance);

    // Process up to MAX_INDICATORS threats
    let arrowIndex = 0;

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    for (const threat of threats) {
        if (arrowIndex >= MAX_INDICATORS) break;

        const { eid, distance } = threat;

        // Project enemy position to NDC (Normalized Device Coordinates)
        const worldPos = new THREE.Vector3(
            Position.x[eid],
            Position.y[eid],
            Position.z[eid]
        );

        const ndc = worldPos.clone().project(camera);

        // Check if enemy is off-screen
        // NDC range: -1 to 1 for visible area
        const isOffScreen = Math.abs(ndc.x) > 1 || Math.abs(ndc.y) > 1 || ndc.z > 1;

        if (!isOffScreen) continue; // Skip on-screen enemies

        // Get arrow from pool
        const arrow = arrowPool[arrowIndex];
        if (!arrow) break;

        arrow.inUse = true;

        // Calculate edge position and arrow angle
        const { screenX, screenY, angle } = calculateEdgePosition(
            ndc.x,
            ndc.y,
            screenWidth,
            screenHeight
        );

        // Position arrow
        arrow.element.style.left = `${screenX - ARROW_SIZE / 2}px`;
        arrow.element.style.top = `${screenY - ARROW_SIZE / 2}px`;

        // Rotate arrow to point toward enemy
        // Base rotation: arrow points down-left (225deg), so adjust by -45deg
        arrow.element.style.transform = `rotate(${angle - 45}deg)`;

        // Color based on distance
        const color = getDistanceColor(distance);
        arrow.element.style.borderColor = color;

        // Show arrow
        arrow.element.style.opacity = '0.8';

        arrowIndex++;
    }
}

/**
 * Calculate screen position at edge and arrow angle
 * @param ndcX - Normalized Device Coordinate X (-1 to 1)
 * @param ndcY - Normalized Device Coordinate Y (-1 to 1)
 * @param screenWidth - Screen width in pixels
 * @param screenHeight - Screen height in pixels
 * @returns Screen position and rotation angle
 */
function calculateEdgePosition(
    ndcX: number,
    ndcY: number,
    screenWidth: number,
    screenHeight: number
): { screenX: number; screenY: number; angle: number } {
    // Clamp NDC to screen bounds with padding
    const paddingX = (EDGE_PADDING / screenWidth) * 2;
    const paddingY = (EDGE_PADDING / screenHeight) * 2;

    const clampedX = Math.max(-1 + paddingX, Math.min(1 - paddingX, ndcX));
    const clampedY = Math.max(-1 + paddingY, Math.min(1 - paddingY, ndcY));

    // Convert NDC to screen coordinates
    // NDC: -1 to 1 (left to right, bottom to top)
    // Screen: 0 to width (left to right), 0 to height (top to bottom)
    const screenX = ((clampedX + 1) / 2) * screenWidth;
    const screenY = ((1 - clampedY) / 2) * screenHeight; // Flip Y axis

    // Calculate angle from screen center to clamped position
    const centerX = screenWidth / 2;
    const centerY = screenHeight / 2;
    const angle = Math.atan2(screenY - centerY, screenX - centerX) * (180 / Math.PI);

    return { screenX, screenY, angle };
}

/**
 * Get color based on enemy distance
 * @param distance - Distance to enemy
 * @returns CSS color string
 */
function getDistanceColor(distance: number): string {
    if (distance < DISTANCE_NEAR) {
        return '#ff3030'; // Red - close threat
    } else if (distance < DISTANCE_MEDIUM) {
        return '#ffaa30'; // Orange - medium threat
    } else {
        return '#30ff30'; // Green - far threat
    }
}

/**
 * Clean up threat indicators (call on shutdown)
 */
export function cleanupThreatIndicators(): void {
    if (container && container.parentNode) {
        container.parentNode.removeChild(container);
    }

    arrowPool = [];
    container = null;
    camera = null;
    initialized = false;
}
