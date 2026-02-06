/**
 * lockOnDisplay.ts - Lock-on targeting system with lead indicator
 * Part of Phase 4: Visual Indicators (Lock-on System)
 *
 * Shows a target reticle around locked enemies with:
 * - Target reticle (red when locked)
 * - Lead indicator (shows where to aim based on projectile travel time)
 * - Target info (health bar, distance, enemy type)
 */

import * as THREE from 'three';
import { Position, Velocity, Health, Enemy } from '../../ecs/components';

/**
 * Lock-on display element with metadata
 */
interface LockOnElements {
    container: HTMLDivElement;
    reticle: HTMLDivElement;
    leadIndicator: HTMLDivElement;
    healthBar: HTMLDivElement;
    healthFill: HTMLDivElement;
    infoText: HTMLDivElement;
}

// Configuration
const PROJECTILE_SPEED = 2000; // units/second (from combatLogic.ts raycaster.far)
const RETICLE_SIZE = 80; // pixels
const LEAD_INDICATOR_SIZE = 30; // pixels
const HEALTH_BAR_WIDTH = 100; // pixels
// const HEALTH_BAR_HEIGHT = 8; // pixels (moved to CSS)

// Colors
const COLOR_LOCKED = '#ff3030'; // Red for locked target
const COLOR_DIM = '#666666'; // Dim when no target
const COLOR_LEAD = '#30ff30'; // Green for lead indicator
const COLOR_HEALTH_HIGH = '#30ff30'; // Green >50% health
const COLOR_HEALTH_MED = '#ffaa30'; // Orange 25-50% health
const COLOR_HEALTH_LOW = '#ff3030'; // Red <25% health

// State
let elements: LockOnElements | null = null;
let camera: THREE.Camera | null = null;
let lockedEnemyEid: number = -1;
let initialized = false;

/**
 * Initialize lock-on display system
 * Creates the HTML overlay container and UI elements
 */
export function initLockOnDisplay(): void {
    if (initialized) return;

    // Create container
    const container = document.createElement('div');
    container.id = 'lock-on-display-container';
    container.className = 'lock-on-container';
    
    // Set initial display state (dynamic)
    container.style.display = 'none';

    document.body.appendChild(container);

    // Create reticle (SVG circle with crosshairs)
    const reticle = createReticleElement();
    container.appendChild(reticle);

    // Create lead indicator (filled circle)
    const leadIndicator = createLeadIndicatorElement();
    container.appendChild(leadIndicator);

    // Create health bar
    const healthBar = document.createElement('div');
    healthBar.className = 'lock-on-health-bar';
    
    // Set dynamic dimensions (now in CSS)

    const healthFill = document.createElement('div');
    healthFill.className = 'lock-on-health-fill';
    
    // Initial color (dynamic)
    healthFill.style.backgroundColor = COLOR_HEALTH_HIGH;

    healthBar.appendChild(healthFill);
    container.appendChild(healthBar);

    // Create info text (distance, type)
    const infoText = document.createElement('div');
    infoText.className = 'lock-on-info-text';

    container.appendChild(infoText);

    elements = {
        container,
        reticle,
        leadIndicator,
        healthBar,
        healthFill,
        infoText
    };

    initialized = true;
    console.log('[LockOnDisplay] Initialized');
}

/**
 * Create reticle SVG element
 */
function createReticleElement(): HTMLDivElement {
    const reticle = document.createElement('div');
    reticle.className = 'lock-on-reticle';

    // Set dynamic dimensions (now in CSS)

    // SVG reticle with crosshairs
    reticle.innerHTML = `
        <svg width="${RETICLE_SIZE}" height="${RETICLE_SIZE}" viewBox="0 0 ${RETICLE_SIZE} ${RETICLE_SIZE}">
            <circle cx="${RETICLE_SIZE / 2}" cy="${RETICLE_SIZE / 2}" r="${RETICLE_SIZE / 2 - 2}"
                stroke="${COLOR_DIM}" stroke-width="2" fill="none" class="reticle-circle"/>
            <line x1="${RETICLE_SIZE / 2}" y1="0" x2="${RETICLE_SIZE / 2}" y2="15"
                stroke="${COLOR_DIM}" stroke-width="2" class="reticle-line"/>
            <line x1="${RETICLE_SIZE / 2}" y1="${RETICLE_SIZE - 15}" x2="${RETICLE_SIZE / 2}" y2="${RETICLE_SIZE}"
                stroke="${COLOR_DIM}" stroke-width="2" class="reticle-line"/>
            <line x1="0" y1="${RETICLE_SIZE / 2}" x2="15" y2="${RETICLE_SIZE / 2}"
                stroke="${COLOR_DIM}" stroke-width="2" class="reticle-line"/>
            <line x1="${RETICLE_SIZE - 15}" y1="${RETICLE_SIZE / 2}" x2="${RETICLE_SIZE}" y2="${RETICLE_SIZE / 2}"
                stroke="${COLOR_DIM}" stroke-width="2" class="reticle-line"/>
        </svg>
    `;

    return reticle;
}

/**
 * Create lead indicator element
 */
function createLeadIndicatorElement(): HTMLDivElement {
    const leadIndicator = document.createElement('div');
    leadIndicator.className = 'lock-on-lead-indicator';

    // Set dynamic dimensions (now in CSS)

    // Filled circle SVG
    leadIndicator.innerHTML = `
        <svg width="${LEAD_INDICATOR_SIZE}" height="${LEAD_INDICATOR_SIZE}" viewBox="0 0 ${LEAD_INDICATOR_SIZE} ${LEAD_INDICATOR_SIZE}">
            <circle cx="${LEAD_INDICATOR_SIZE / 2}" cy="${LEAD_INDICATOR_SIZE / 2}" r="${LEAD_INDICATOR_SIZE / 2 - 2}"
                stroke="${COLOR_LEAD}" stroke-width="2" fill="none"/>
            <circle cx="${LEAD_INDICATOR_SIZE / 2}" cy="${LEAD_INDICATOR_SIZE / 2}" r="4"
                fill="${COLOR_LEAD}"/>
        </svg>
    `;

    return leadIndicator;
}

/**
 * Set the camera reference (required for projection)
 */
export function setLockOnDisplayCamera(cam: THREE.Camera): void {
    camera = cam;
}

/**
 * Set the locked enemy entity
 * @param eid - Enemy entity ID (-1 to clear lock)
 */
export function setLockedEnemy(eid: number): void {
    lockedEnemyEid = eid;

    if (!elements) return;

    if (eid === -1) {
        // Clear lock
        elements.container.style.display = 'none';
        elements.reticle.style.opacity = '0';
        elements.leadIndicator.style.opacity = '0';
        elements.healthBar.style.opacity = '0';
        elements.infoText.style.opacity = '0';
    } else {
        // Show lock
        elements.container.style.display = 'block';
        updateReticleColor(COLOR_LOCKED);
    }
}

/**
 * Update reticle color
 */
function updateReticleColor(color: string): void {
    if (!elements) return;

    const svgElements = elements.reticle.querySelectorAll('.reticle-circle, .reticle-line');
    svgElements.forEach((el) => {
        (el as SVGElement).setAttribute('stroke', color);
    });
}

/**
 * Update lock-on display (call every frame)
 * @param playerEid - Player entity ID
 */
export function updateLockOnDisplay(playerEid: number): void {
    if (!initialized || !camera || !elements || lockedEnemyEid === -1 || playerEid === -1) {
        return;
    }

    // Validate enemy still exists
    const enemyExists = Enemy.tag[lockedEnemyEid] === 1;
    if (!enemyExists) {
        setLockedEnemy(-1);
        return;
    }

    // Get enemy position
    const enemyX = Position.x[lockedEnemyEid];
    const enemyY = Position.y[lockedEnemyEid];
    const enemyZ = Position.z[lockedEnemyEid];

    // Get enemy velocity
    const enemyVx = Velocity.x[lockedEnemyEid];
    const enemyVy = Velocity.y[lockedEnemyEid];
    const enemyVz = Velocity.z[lockedEnemyEid];

    // Get player position
    const playerX = Position.x[playerEid];
    const playerY = Position.y[playerEid];
    const playerZ = Position.z[playerEid];

    // Calculate distance to target
    const dx = enemyX - playerX;
    const dy = enemyY - playerY;
    const dz = enemyZ - playerZ;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Project enemy position to screen
    const enemyWorldPos = new THREE.Vector3(enemyX, enemyY, enemyZ);
    const enemyNdc = enemyWorldPos.clone().project(camera);

    // Check if enemy is on-screen
    const isOnScreen = Math.abs(enemyNdc.x) <= 1 && Math.abs(enemyNdc.y) <= 1 && enemyNdc.z <= 1;

    if (!isOnScreen) {
        // Hide display when off-screen
        elements.reticle.style.opacity = '0';
        elements.leadIndicator.style.opacity = '0';
        elements.healthBar.style.opacity = '0';
        elements.infoText.style.opacity = '0';
        return;
    }

    // Convert NDC to screen coordinates
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const screenX = ((enemyNdc.x + 1) / 2) * screenWidth;
    const screenY = ((1 - enemyNdc.y) / 2) * screenHeight;

    // Position reticle at enemy position
    elements.reticle.style.left = `${screenX - RETICLE_SIZE / 2}px`;
    elements.reticle.style.top = `${screenY - RETICLE_SIZE / 2}px`;
    elements.reticle.style.opacity = '0.8';

    // Calculate lead position
    // Lead time = distance / projectile speed
    const leadTime = distance / PROJECTILE_SPEED;
    const leadX = enemyX + enemyVx * leadTime;
    const leadY = enemyY + enemyVy * leadTime;
    const leadZ = enemyZ + enemyVz * leadTime;

    // Project lead position to screen
    const leadWorldPos = new THREE.Vector3(leadX, leadY, leadZ);
    const leadNdc = leadWorldPos.clone().project(camera);

    // Only show lead indicator if on-screen
    const leadOnScreen = Math.abs(leadNdc.x) <= 1 && Math.abs(leadNdc.y) <= 1 && leadNdc.z <= 1;

    if (leadOnScreen) {
        const leadScreenX = ((leadNdc.x + 1) / 2) * screenWidth;
        const leadScreenY = ((1 - leadNdc.y) / 2) * screenHeight;

        elements.leadIndicator.style.left = `${leadScreenX - LEAD_INDICATOR_SIZE / 2}px`;
        elements.leadIndicator.style.top = `${leadScreenY - LEAD_INDICATOR_SIZE / 2}px`;
        elements.leadIndicator.style.opacity = '0.7';
    } else {
        elements.leadIndicator.style.opacity = '0';
    }

    // Update health bar
    const currentHealth = Health.current[lockedEnemyEid];
    const maxHealth = Health.max[lockedEnemyEid];
    const healthPercent = (currentHealth / maxHealth) * 100;

    elements.healthBar.style.left = `${screenX - HEALTH_BAR_WIDTH / 2}px`;
    elements.healthBar.style.top = `${screenY + RETICLE_SIZE / 2 + 10}px`;
    elements.healthBar.style.opacity = '0.8';

    elements.healthFill.style.width = `${healthPercent}%`;

    // Color based on health
    if (healthPercent > 50) {
        elements.healthFill.style.backgroundColor = COLOR_HEALTH_HIGH;
    } else if (healthPercent > 25) {
        elements.healthFill.style.backgroundColor = COLOR_HEALTH_MED;
    } else {
        elements.healthFill.style.backgroundColor = COLOR_HEALTH_LOW;
    }

    // Update info text (distance and enemy type)
    const distanceText = `${Math.round(distance)} units`;
    elements.infoText.textContent = `Enemy - ${distanceText}`;
    elements.infoText.style.left = `${screenX - 50}px`; // Approximate centering
    elements.infoText.style.top = `${screenY + RETICLE_SIZE / 2 + 25}px`;
    elements.infoText.style.opacity = '0.8';
}

/**
 * Get the currently locked enemy entity ID
 */
export function getLockedEnemy(): number {
    return lockedEnemyEid;
}

/**
 * Clean up lock-on display (call on shutdown)
 */
export function cleanupLockOnDisplay(): void {
    if (elements && elements.container && elements.container.parentNode) {
        elements.container.parentNode.removeChild(elements.container);
    }

    elements = null;
    camera = null;
    lockedEnemyEid = -1;
    initialized = false;
}
