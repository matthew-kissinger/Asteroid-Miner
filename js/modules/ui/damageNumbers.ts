/**
 * damageNumbers.ts - Floating damage numbers for combat feedback
 * Part of Phase 3: Game Feel Overhaul
 */

import * as THREE from 'three';
import { mainMessageBus } from '../../globals/messageBus.ts';
import { Message } from '../../core/messageBus.ts';
import type { GameEventMap } from '../../core/events.ts';

interface DamageNumber {
    element: HTMLDivElement;
    position: THREE.Vector3;
    value: number;
    lifetime: number;
    maxLifetime: number;
    color: string;
}

// References to camera and renderer for screen space conversion
let camera: THREE.Camera | null = null;
let renderer: { domElement: HTMLElement } | null = null;

// Pool of reusable damage number elements
const numberPool: DamageNumber[] = [];
const activeNumbers: DamageNumber[] = [];

// Damage number container
let container: HTMLDivElement | null = null;

/**
 * Initialize the damage numbers system
 * @param cam The camera for screen space conversion
 * @param rend The renderer for getting viewport info
 */
export function initDamageNumbers(cam: THREE.Camera, rend: { domElement: HTMLElement }): void {
    camera = cam;
    renderer = rend;

    // Create container if it doesn't exist
    if (container) return;

    container = document.createElement('div');
    container.id = 'damage-numbers-container';

    Object.assign(container.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: '9998',
        fontSize: '20px',
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'bold',
        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)'
    });

    document.body.appendChild(container);

    // Subscribe to damage events
    setupEventListeners();

    console.log('Damage numbers system initialized');
}

/**
 * Set up event listeners for damage events
 */
function setupEventListeners(): void {
    // Player damage - Red for hull, Blue for shield
    mainMessageBus.subscribe('player.damaged', (message: Message<GameEventMap['player.damaged']>) => {
        const { damage, shieldDamage, position } = message.data;

        if (damage && damage > 0 && position) {
            showDamageNumber(position, damage, '#FF4444');
        }
        if (shieldDamage && shieldDamage > 0 && position) {
            showDamageNumber(position, shieldDamage, '#4488FF');
        }
    });

    // Enemy damage - Red numbers
    mainMessageBus.subscribe('enemy.damaged', (message: Message<GameEventMap['enemy.damaged']>) => {
        const { amount, damage, position } = message.data;
        const damageAmount = damage ?? amount;

        if (damageAmount > 0 && position) {
            showDamageNumber(position, damageAmount, '#FF4444');
        }
    });

    // Generic entity damage fallback
    mainMessageBus.subscribe('entity.damaged', (message: Message<GameEventMap['entity.damaged']>) => {
        const { damage, damageType, position } = message.data;

        if (damage && damage > 0 && position) {
            // Color based on damage type
            let color = '#FF4444';
            if (damageType === 'shield') {
                color = '#4488FF';
            } else if (damageType === 'healing') {
                color = '#44FF44';
            }
            showDamageNumber(position, damage, color);
        }
    });

    // Healing numbers - Green
    mainMessageBus.subscribe('player.healed', (message: Message<GameEventMap['player.healed']>) => {
        const { amount, position } = message.data;

        if (amount > 0 && position) {
            showDamageNumber(position, amount, '#44FF44');
        }
    });
}

/**
 * Create and display a damage number
 * @param worldPos World position where damage occurred
 * @param value Damage amount to display
 * @param color CSS color for the number
 */
function showDamageNumber(worldPos: THREE.Vector3, value: number, color: string): void {
    if (!camera || !renderer || !container) return;

    // Reuse or create a damage number element
    let damageNum: DamageNumber;

    if (numberPool.length > 0) {
        damageNum = numberPool.pop()!;
        damageNum.element.style.display = 'block';
    } else {
        damageNum = createDamageNumberElement();
    }

    // Configure the damage number
    damageNum.position = worldPos.clone();
    damageNum.value = value;
    damageNum.color = color;
    damageNum.lifetime = 0;
    damageNum.maxLifetime = 1000; // 1 second

    // Set text and color
    damageNum.element.textContent = `-${Math.round(value)}`;
    damageNum.element.style.color = color;

    // Set initial position
    updateDamageNumberPosition(damageNum);

    activeNumbers.push(damageNum);
}

/**
 * Create a new damage number DOM element
 */
function createDamageNumberElement(): DamageNumber {
    const element = document.createElement('div');

    Object.assign(element.style, {
        position: 'fixed',
        whiteSpace: 'nowrap',
        fontSize: '24px',
        fontWeight: 'bold',
        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.9)',
        transform: 'translateZ(0)',
        willChange: 'transform, opacity'
    });

    container!.appendChild(element);

    return {
        element,
        position: new THREE.Vector3(),
        value: 0,
        lifetime: 0,
        maxLifetime: 1000,
        color: '#FFFFFF'
    };
}

/**
 * Update the screen position of a damage number based on world position
 */
function updateDamageNumberPosition(damageNum: DamageNumber): void {
    if (!camera || !renderer) return;

    // Convert world position to screen space
    const screenPos = new THREE.Vector3();
    screenPos.copy(damageNum.position);
    screenPos.project(camera);

    // Convert from NDC to screen pixels
    const width = renderer.domElement.clientWidth;
    const height = renderer.domElement.clientHeight;

    const x = (screenPos.x * 0.5 + 0.5) * width;
    const y = (-screenPos.y * 0.5 + 0.5) * height;

    // Apply floating animation - move up over lifetime
    const progress = damageNum.lifetime / damageNum.maxLifetime;
    const floatDistance = progress * 40; // Move up 40 pixels over lifetime

    // Calculate scale based on damage (bigger numbers for bigger hits)
    const scale = Math.max(0.8, Math.min(1.5, damageNum.value / 50));

    // Calculate opacity (fade out)
    const opacity = Math.max(0, 1 - progress);

    damageNum.element.style.transform =
        `translate(${x}px, ${y - floatDistance}px) scale(${scale})`;
    damageNum.element.style.opacity = String(opacity);
}

/**
 * Update all active damage numbers
 * @param deltaTime Delta time in milliseconds
 */
export function updateDamageNumbers(deltaTime: number): void {
    if (activeNumbers.length === 0) return;

    // Update positions and lifetimes
    for (let i = activeNumbers.length - 1; i >= 0; i--) {
        const damageNum = activeNumbers[i];

        damageNum.lifetime += deltaTime;

        if (damageNum.lifetime >= damageNum.maxLifetime) {
            // Move to pool
            damageNum.element.style.display = 'none';
            numberPool.push(damageNum);
            activeNumbers.splice(i, 1);
        } else {
            // Update position and animation
            updateDamageNumberPosition(damageNum);
        }
    }
}

/**
 * Clean up damage numbers system
 */
export function cleanupDamageNumbers(): void {
    if (container && container.parentNode) {
        container.parentNode.removeChild(container);
    }
    activeNumbers.length = 0;
    numberPool.length = 0;
    container = null;
    camera = null;
    renderer = null;
}
