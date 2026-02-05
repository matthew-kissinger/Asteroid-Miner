/**
 * radarDisplay.ts - Radar minimap for spatial awareness
 * Part of Phase 4: Radar/Minimap System
 *
 * Shows nearby enemies, asteroids, and stations on a 2D radar.
 * Player is always at the center, with their forward direction pointing UP.
 */

import * as THREE from 'three';
import { Position, Rotation } from '../../ecs/components';
import { getEnemies, getAsteroids, getPlanets, getPlayerEntity } from '../../ecs/systems/index';

// Configuration
const RADAR_SIZE = 150; // pixels
const RADAR_RADIUS = RADAR_SIZE / 2;
const RADAR_RANGE = 2000; // game units - increased for better awareness
const UPDATE_INTERVAL = 100; // ms (10fps)

// Colors
const COLOR_BG = 'rgba(6, 22, 31, 0.6)';
const COLOR_GRID = 'rgba(120, 220, 232, 0.15)';
const COLOR_PLAYER = '#ffffff';
const COLOR_ENEMY = '#ff3030';
const COLOR_ASTEROID = '#888888';
const COLOR_STATION = '#30a0ff';

// State
let container: HTMLDivElement | null = null;
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let lastUpdateTime = 0;
let initialized = false;

// Reusable objects to avoid GC
const tempQuaternion = new THREE.Quaternion();
const tempEuler = new THREE.Euler();

/**
 * Initialize radar display
 */
export function initRadar(): void {
    if (initialized) return;

    // Create container
    container = document.createElement('div');
    container.id = 'radar-container';
    
    Object.assign(container.style, {
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        width: `${RADAR_SIZE}px`,
        height: `${RADAR_SIZE}px`,
        borderRadius: '50%',
        border: '2px solid rgba(120, 220, 232, 0.3)',
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: '1000',
        backgroundColor: COLOR_BG,
        backdropFilter: 'blur(4px)',
        boxShadow: '0 0 15px rgba(0, 0, 0, 0.5)'
    });

    // Create canvas
    canvas = document.createElement('canvas');
    canvas.width = RADAR_SIZE;
    canvas.height = RADAR_SIZE;
    ctx = canvas.getContext('2d');

    container.appendChild(canvas);
    document.body.appendChild(container);

    initialized = true;
    console.log('[Radar] Initialized');
}

/**
 * Update radar (call every frame, but throttled to 10fps)
 * @param currentTime - Current game time in ms
 */
export function updateRadar(currentTime: number): void {
    if (!initialized || !ctx || !canvas) return;

    // Throttle update rate
    if (currentTime - lastUpdateTime < UPDATE_INTERVAL) return;
    lastUpdateTime = currentTime;

    const playerEid = getPlayerEntity();
    if (playerEid === -1) {
        // Hide radar if no player
        if (container) container.style.display = 'none';
        return;
    } else {
        if (container) container.style.display = 'block';
    }

    // Clear canvas
    ctx.clearRect(0, 0, RADAR_SIZE, RADAR_SIZE);

    // Draw grid/background
    drawBackground();

    // Get player position and heading
    const px = Position.x[playerEid];
    const pz = Position.z[playerEid];
    
    // Get player heading (Y rotation)
    tempQuaternion.set(
        Rotation.x[playerEid],
        Rotation.y[playerEid],
        Rotation.z[playerEid],
        Rotation.w[playerEid]
    );
    tempEuler.setFromQuaternion(tempQuaternion, 'YXZ');
    const heading = tempEuler.y;

    // Pre-calculate rotation factors
    const cosH = Math.cos(-heading);
    const sinH = Math.sin(-heading);

    // Draw blips
    // 1. Stations/Planets (Draw these first so they are under other blips)
    const planets = getPlanets();
    for (const eid of planets) {
        drawBlip(eid, px, pz, cosH, sinH, COLOR_STATION, 5);
    }

    // 2. Asteroids
    const asteroids = getAsteroids();
    for (const eid of asteroids) {
        drawBlip(eid, px, pz, cosH, sinH, COLOR_ASTEROID, 2);
    }

    // 3. Enemies
    const enemies = getEnemies();
    for (const eid of enemies) {
        drawBlip(eid, px, pz, cosH, sinH, COLOR_ENEMY, 3);
    }

    // Draw player at center (as a small triangle pointing up)
    drawPlayerIcon();
}

/**
 * Draw radar background and grid
 */
function drawBackground(): void {
    if (!ctx) return;

    // Draw circular grid lines
    ctx.strokeStyle = COLOR_GRID;
    ctx.lineWidth = 1;

    // Rings
    ctx.beginPath();
    ctx.arc(RADAR_RADIUS, RADAR_RADIUS, RADAR_RADIUS * 0.33, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(RADAR_RADIUS, RADAR_RADIUS, RADAR_RADIUS * 0.66, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(RADAR_RADIUS, 0);
    ctx.lineTo(RADAR_RADIUS, RADAR_SIZE);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, RADAR_RADIUS);
    ctx.lineTo(RADAR_SIZE, RADAR_RADIUS);
    ctx.stroke();
}

/**
 * Draw a single blip on the radar
 */
function drawBlip(
    eid: number,
    px: number,
    pz: number,
    cosH: number,
    sinH: number,
    color: string,
    size: number
): void {
    if (!ctx) return;

    // Relative world position
    const dx = Position.x[eid] - px;
    const dz = Position.z[eid] - pz;

    // Distance check
    const distSq = dx * dx + dz * dz;
    if (distSq > RADAR_RANGE * RADAR_RANGE) return;

    // Rotate relative to player heading
    // Standard rotation: 
    // rx = dx * cos - dz * sin
    // rz = dx * sin + dz * cos
    const rx = dx * cosH - dz * sinH;
    const rz = dx * sinH + dz * cosH;

    // Scale to radar coordinates
    // rz is forward/backward. In radar, -rz is UP.
    const canvasX = RADAR_RADIUS + (rx / RADAR_RANGE) * RADAR_RADIUS;
    const canvasY = RADAR_RADIUS + (rz / RADAR_RANGE) * RADAR_RADIUS;

    // Fade blips near the edge
    const dist = Math.sqrt(distSq);
    const alpha = Math.max(0, Math.min(1, 1.5 - (dist / RADAR_RANGE) * 1.5));

    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(canvasX, canvasY, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
}

/**
 * Draw player icon at center
 */
function drawPlayerIcon(): void {
    if (!ctx) return;

    ctx.fillStyle = COLOR_PLAYER;
    ctx.beginPath();
    // Triangle pointing UP
    ctx.moveTo(RADAR_RADIUS, RADAR_RADIUS - 5);
    ctx.lineTo(RADAR_RADIUS - 4, RADAR_RADIUS + 4);
    ctx.lineTo(RADAR_RADIUS + 4, RADAR_RADIUS + 4);
    ctx.closePath();
    ctx.fill();

    // Add a small glow to player
    ctx.shadowBlur = 5;
    ctx.shadowColor = COLOR_PLAYER;
    ctx.stroke();
    ctx.shadowBlur = 0;
}

/**
 * Toggle radar visibility
 */
export function setRadarVisible(visible: boolean): void {
    if (container) {
        container.style.display = visible ? 'block' : 'none';
    }
}

/**
 * Cleanup radar display
 */
export function cleanupRadar(): void {
    if (container && container.parentNode) {
        container.parentNode.removeChild(container);
    }
    container = null;
    canvas = null;
    ctx = null;
    initialized = false;
}
