/**
 * asteroidScanner.ts - Asteroid scanner overlay showing composition and value
 * Toggle with V key. Raycast from camera center, show panel near targeted asteroid.
 */

import {
  Camera,
  Mesh,
  Raycaster,
  Vector2,
  Vector3,
  Scene,
  BufferGeometry,
  MeshBasicMaterial,
  DoubleSide,
} from 'three';
import { debugLog } from '../../globals/debug.ts';

// Sell prices per unit at stargate (from docking uiIntegration)
const SELL_PRICE_IRON = 10;
const SELL_PRICE_GOLD = 50;
const SELL_PRICE_PLATINUM = 200;

const SCANNER_RANGE_BASE = 500;
const SCANNER_RANGE_PER_LEVEL = 200;
const PANEL_WIDTH = 200;
const PANEL_HEIGHT = 120;
const SCAN_LINE_OPACITY = 0.1;
const SCANNING_TEXT_DURATION_MS = 500;
const PANEL_FADE_DURATION_MS = 200;

export interface ScanResult {
  name: string;
  ironPercent: number;
  goldPercent: number;
  platinumPercent: number;
  estimatedValue: number;
  distance: number;
  sizeLabel: 'Small' | 'Medium' | 'Large';
}

interface AsteroidLike {
  mesh: Mesh & { position: Vector3; visible: boolean; geometry?: BufferGeometry };
  resourceType?: string | null;
  resourceAmount?: number;
  baseResourceAmount?: number;
  size?: number;
  minable?: boolean;
}

interface SpaceshipLike {
  mesh?: { position: Vector3 };
  isDocked?: boolean;
  shipUpgrades?: { getUpgradeLevels(): { scannerLevel: number } };
}

export interface AsteroidScannerContext {
  camera: Camera | null;
  scene: Scene | null;
  environment: { asteroids: AsteroidLike[] } | null;
  spaceship: SpaceshipLike | null;
  isDocked: boolean;
  introSequenceActive?: boolean;
}

let scannerActive = false;
let overlayRoot: HTMLDivElement | null = null;
let scanLineEl: HTMLDivElement | null = null;
let panelEl: HTMLDivElement | null = null;
let scanningTextEl: HTMLDivElement | null = null;
let highlightMesh: Mesh | null = null;
let lastTargetAsteroid: AsteroidLike | null = null;
let scanningTextHideAt = 0;
let raycaster: Raycaster | null = null;
let rayOriginNDC: Vector2 | null = null;
let tempVec3: Vector3 | null = null;
let initialized = false;

export function isScannerActive(): boolean {
  return scannerActive;
}

export function toggleScanner(): boolean {
  scannerActive = !scannerActive;
  if (!scannerActive) {
    hideOverlay();
    removeHighlight();
    lastTargetAsteroid = null;
  }
  debugLog('[AsteroidScanner] Scanner', scannerActive ? 'ON' : 'OFF');
  return scannerActive;
}

export function setScannerActive(active: boolean): void {
  scannerActive = active;
  if (!active) {
    hideOverlay();
    removeHighlight();
    lastTargetAsteroid = null;
  }
}

function getScannerRange(spaceship: SpaceshipLike | null): number {
  if (!spaceship?.shipUpgrades?.getUpgradeLevels) {
    return SCANNER_RANGE_BASE + SCANNER_RANGE_PER_LEVEL;
  }
  const levels = spaceship.shipUpgrades.getUpgradeLevels();
  const level = Math.max(1, levels.scannerLevel ?? 1);
  return SCANNER_RANGE_BASE + level * SCANNER_RANGE_PER_LEVEL;
}

function buildScanResult(asteroid: AsteroidLike, distance: number): ScanResult {
  const resourceType = asteroid.resourceType ?? null;
  const amount = asteroid.resourceAmount ?? asteroid.baseResourceAmount ?? 0;

  let ironPercent = 0;
  let goldPercent = 100;
  let platinumPercent = 0;
  if (resourceType === 'iron') {
    ironPercent = 100;
    goldPercent = 0;
  } else if (resourceType === 'gold') {
    goldPercent = 100;
  } else if (resourceType === 'platinum') {
    platinumPercent = 100;
    goldPercent = 0;
  }

  let estimatedValue = 0;
  if (resourceType === 'iron') estimatedValue = amount * SELL_PRICE_IRON;
  else if (resourceType === 'gold') estimatedValue = amount * SELL_PRICE_GOLD;
  else if (resourceType === 'platinum') estimatedValue = amount * SELL_PRICE_PLATINUM;

  const size = asteroid.size ?? 150;
  let sizeLabel: 'Small' | 'Medium' | 'Large' = 'Medium';
  if (size < 160) sizeLabel = 'Small';
  else if (size >= 200) sizeLabel = 'Large';

  const name =
    resourceType === 'iron'
      ? 'Iron Asteroid'
      : resourceType === 'gold'
        ? 'Gold Asteroid'
        : resourceType === 'platinum'
          ? 'Platinum Asteroid'
          : 'Unknown Asteroid';

  return {
    name,
    ironPercent,
    goldPercent,
    platinumPercent,
    estimatedValue,
    distance,
    sizeLabel,
  };
}

function barHtml(label: string, percent: number): string {
  const filled = Math.round((percent / 100) * 8);
  const empty = 8 - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `${label} ${bar} ${percent}%`;
}

function worldToScreen(
  worldPos: Vector3,
  camera: Camera,
  viewWidth: number,
  viewHeight: number
): { x: number; y: number; inFront: boolean } {
  if (!tempVec3) tempVec3 = new Vector3();
  tempVec3.copy(worldPos);
  tempVec3.project(camera);
  const ndcX = tempVec3.x;
  const ndcY = tempVec3.y;
  const inFront = tempVec3.z >= -1 && tempVec3.z <= 1;
  const x = (ndcX * 0.5 + 0.5) * viewWidth;
  const y = (1.0 - (ndcY * 0.5 + 0.5)) * viewHeight;
  return { x, y, inFront };
}

function ensureRaycaster(): void {
  if (!raycaster) raycaster = new Raycaster();
  if (!rayOriginNDC) rayOriginNDC = new Vector2(0, 0);
}

function findClosestAsteroidInRange(
  context: AsteroidScannerContext
): { asteroid: AsteroidLike; distance: number } | null {
  const { camera, scene, environment, spaceship } = context;
  if (!camera || !scene || !environment?.asteroids?.length || !spaceship?.mesh) {
    return null;
  }

  const range = getScannerRange(spaceship);
  const shipPos = spaceship.mesh.position;
  const asteroids = environment.asteroids;

  ensureRaycaster();
  if (!raycaster || !rayOriginNDC) return null;

  raycaster.setFromCamera(rayOriginNDC, camera);
  const meshes: Mesh[] = [];
  const asteroidByMesh = new Map<Mesh, AsteroidLike>();

  for (let i = 0; i < asteroids.length; i++) {
    const a = asteroids[i];
    if (!a.minable || !a.mesh?.visible || !a.mesh) continue;
    const mesh = a.mesh as Mesh;
    const dist = shipPos.distanceTo(mesh.position);
    if (dist > range) continue;
    meshes.push(mesh);
    asteroidByMesh.set(mesh, a);
  }

  if (meshes.length === 0) return null;

  const hits = raycaster.intersectObjects(meshes, false);
  if (hits.length === 0) return null;

  const closest = hits[0];
  const asteroid = asteroidByMesh.get(closest.object as Mesh);
  if (!asteroid) return null;

  const distance = closest.distance;
  return { asteroid, distance };
}

function createHighlightMesh(asteroid: AsteroidLike): Mesh | null {
  const mesh = asteroid.mesh as Mesh;
  const geo = mesh.geometry;
  if (!geo) return null;

  try {
    const cloneGeo = geo.clone();
    const mat = new MeshBasicMaterial({
      wireframe: true,
      color: 0x00ff00,
      side: DoubleSide,
    });
    const wire = new Mesh(cloneGeo, mat);
    wire.position.copy(mesh.position);
    wire.rotation.copy(mesh.rotation);
    wire.scale.copy(mesh.scale);
    return wire;
  } catch {
    return null;
  }
}

function removeHighlight(): void {
  if (highlightMesh && highlightMesh.parent) {
    highlightMesh.parent.remove(highlightMesh);
    if (highlightMesh.geometry) highlightMesh.geometry.dispose();
    if (highlightMesh.material && !Array.isArray(highlightMesh.material)) {
      highlightMesh.material.dispose();
    }
    highlightMesh = null;
  }
}

function ensureOverlayDOM(): void {
  if (overlayRoot) return;

  overlayRoot = document.createElement('div');
  overlayRoot.id = 'asteroid-scanner-root';
  Object.assign(overlayRoot.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: '1100',
    visibility: 'hidden',
  });

  scanLineEl = document.createElement('div');
  scanLineEl.id = 'asteroid-scanner-line';
  Object.assign(scanLineEl.style, {
    position: 'absolute',
    left: '0',
    right: '0',
    height: '2px',
    backgroundColor: 'rgba(120, 220, 232, 1)',
    opacity: String(SCAN_LINE_OPACITY),
    transformOrigin: 'left center',
    animation: 'asteroid-scanner-sweep 2s linear infinite',
  });

  panelEl = document.createElement('div');
  panelEl.id = 'asteroid-scanner-panel';
  Object.assign(panelEl.style, {
    position: 'absolute',
    width: `${PANEL_WIDTH}px`,
    minHeight: `${PANEL_HEIGHT}px`,
    padding: '10px 12px',
    backgroundColor: 'rgba(6, 22, 31, 0.85)',
    backdropFilter: 'blur(6px)',
    borderRadius: '8px',
    border: '1px solid rgba(120, 220, 232, 0.4)',
    boxShadow: '0 0 20px rgba(120, 220, 232, 0.25)',
    fontFamily: '"Rajdhani", "Electrolize", sans-serif',
    fontSize: '12px',
    color: 'rgba(120, 220, 232, 0.95)',
    lineHeight: '1.4',
    transition: `opacity ${PANEL_FADE_DURATION_MS}ms ease`,
    opacity: '0',
  });

  scanningTextEl = document.createElement('div');
  scanningTextEl.id = 'asteroid-scanner-scanning';
  scanningTextEl.textContent = 'SCANNING...';
  Object.assign(scanningTextEl.style, {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '14px',
    fontWeight: '600',
    letterSpacing: '2px',
    color: 'rgba(120, 220, 232, 0.8)',
    opacity: '0',
    pointerEvents: 'none',
    transition: 'opacity 0.15s ease',
  });

  const style = document.createElement('style');
  style.textContent = `
    @keyframes asteroid-scanner-sweep {
      0% { transform: translateY(-100%); }
      100% { transform: translateY(100vh); }
    }
  `;
  document.head.appendChild(style);

  overlayRoot.appendChild(scanLineEl);
  overlayRoot.appendChild(panelEl);
  overlayRoot.appendChild(scanningTextEl);
  document.body.appendChild(overlayRoot);
}

function hideOverlay(): void {
  if (overlayRoot) {
    overlayRoot.style.visibility = 'hidden';
  }
  if (panelEl) {
    panelEl.style.opacity = '0';
  }
  if (scanningTextEl) {
    scanningTextEl.style.opacity = '0';
  }
}

function showPanelAt(x: number, y: number, result: ScanResult): void {
  if (!panelEl || !overlayRoot) return;

  const viewWidth = window.innerWidth;
  const viewHeight = window.innerHeight;

  let left = x - PANEL_WIDTH / 2;
  let top = y - PANEL_HEIGHT - 20;

  if (left < 10) left = 10;
  if (left + PANEL_WIDTH > viewWidth - 10) left = viewWidth - PANEL_WIDTH - 10;
  if (top < 10) top = y + 15;
  if (top + PANEL_HEIGHT > viewHeight - 10) top = viewHeight - PANEL_HEIGHT - 10;

  panelEl.style.left = `${left}px`;
  panelEl.style.top = `${top}px`;
  panelEl.style.opacity = '1';

  const ironBar = barHtml('Iron', result.ironPercent);
  const goldBar = barHtml('Gold', result.goldPercent);
  const platinumBar = barHtml('Platinum', result.platinumPercent);

  panelEl.innerHTML = `
    <div style="font-weight:600; margin-bottom:6px; border-bottom:1px solid rgba(120,220,232,0.3); padding-bottom:4px;">${result.name}</div>
    <div style="font-size:11px; margin-bottom:4px;">${ironBar}</div>
    <div style="font-size:11px; margin-bottom:4px;">${goldBar}</div>
    <div style="font-size:11px; margin-bottom:6px;">${platinumBar}</div>
    <div style="display:flex; justify-content:space-between; font-size:11px;">
      <span>Est. value:</span>
      <span>${result.estimatedValue.toLocaleString()} CR</span>
    </div>
    <div style="display:flex; justify-content:space-between; font-size:11px;">
      <span>Distance:</span>
      <span>${Math.round(result.distance)} m</span>
    </div>
    <div style="display:flex; justify-content:space-between; font-size:11px;">
      <span>Size:</span>
      <span>${result.sizeLabel}</span>
    </div>
  `;

  overlayRoot.style.visibility = 'visible';
}

export function initAsteroidScanner(): void {
  if (initialized) return;
  ensureOverlayDOM();
  initialized = true;
  debugLog('[AsteroidScanner] Initialized');
}

export function updateAsteroidScanner(context: AsteroidScannerContext): void {
  if (!initialized) ensureOverlayDOM();

  const shouldHide =
    !scannerActive ||
    context.isDocked ||
    context.introSequenceActive === true ||
    !context.camera ||
    !context.scene ||
    !context.environment?.asteroids?.length;

  if (shouldHide) {
    hideOverlay();
    removeHighlight();
    lastTargetAsteroid = null;
    return;
  }

  const camera = context.camera;
  const scene = context.scene;
  if (!camera || !scene) return;

  const result = findClosestAsteroidInRange(context);

  if (!result) {
    hideOverlay();
    removeHighlight();
    lastTargetAsteroid = null;
    return;
  }

  const { asteroid, distance } = result;
  const isNewTarget = lastTargetAsteroid !== asteroid;
  lastTargetAsteroid = asteroid;

  if (isNewTarget) {
    removeHighlight();
    highlightMesh = createHighlightMesh(asteroid);
    if (highlightMesh) {
      scene.add(highlightMesh);
    }
    scanningTextHideAt = performance.now() + SCANNING_TEXT_DURATION_MS;
    if (scanningTextEl) {
      scanningTextEl.style.opacity = '1';
    }
  }

  if (scanningTextEl && performance.now() > scanningTextHideAt) {
    scanningTextEl.style.opacity = '0';
  }

  const mesh = asteroid.mesh as Mesh;
  const screen = worldToScreen(
    mesh.position,
    camera,
    window.innerWidth,
    window.innerHeight
  );

  if (!screen.inFront) {
    hideOverlay();
    return;
  }

  const scanResult = buildScanResult(asteroid, distance);
  showPanelAt(screen.x, screen.y, scanResult);

  if (highlightMesh) {
    highlightMesh.position.copy(mesh.position);
    highlightMesh.rotation.copy(mesh.rotation);
    highlightMesh.scale.copy(mesh.scale);
  }
}

export function cleanupAsteroidScanner(): void {
  setScannerActive(false);
  removeHighlight();
  if (overlayRoot?.parentNode) {
    overlayRoot.parentNode.removeChild(overlayRoot);
  }
  overlayRoot = null;
  scanLineEl = null;
  panelEl = null;
  scanningTextEl = null;
  lastTargetAsteroid = null;
  raycaster = null;
  rayOriginNDC = null;
  tempVec3 = null;
  initialized = false;
}
