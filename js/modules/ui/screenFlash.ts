/**
 * screenFlash.ts - Screen flash effects for damage and other feedback
 * Part of Phase 3: Game Feel Overhaul
 */

import { mainMessageBus } from '../../globals/messageBus.ts';
import { Message } from '../../core/messageBus.ts';

let flashOverlay: HTMLDivElement | null = null;
let flashTimeout: number | null = null;

/**
 * Initialize the screen flash overlay
 */
export function initScreenFlash(): void {
    if (flashOverlay) return;

    flashOverlay = document.createElement('div');
    flashOverlay.id = 'screen-flash-overlay';
    
    // Initial styles
    Object.assign(flashOverlay.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: '9999',
        opacity: '0',
        backgroundColor: 'transparent',
        transition: 'opacity 50ms ease-out'
    });

    document.body.appendChild(flashOverlay);

    // Subscribe to events
    setupEventListeners();
    
    console.log('Screen flash system initialized');
}

/**
 * Set up event listeners for different flash triggers
 */
function setupEventListeners(): void {
    // Player damage - Red or Blue flash based on shield vs hull
    mainMessageBus.subscribe('player.damaged', (message: Message) => {
        const { damage, shieldDamage } = message.data;
        
        if (damage > 0) {
            // Hull damage - Red flash
            flashScreen('rgba(255, 0, 0, 0.3)', 150);
        } else if (shieldDamage > 0) {
            // Shield hit - Blue flash
            flashScreen('rgba(0, 100, 255, 0.2)', 100);
        }
    });

    // Explosion/Heavy impact - White flash
    const explosionHandler = () => {
        flashScreen('rgba(255, 255, 255, 0.4)', 100);
    };
    
    mainMessageBus.subscribe('vfx.explosion', explosionHandler);
    mainMessageBus.subscribe('explosion', explosionHandler);
    
    // Level up or special event - Gold/Yellow flash
    mainMessageBus.subscribe('player.levelup', () => {
        flashScreen('rgba(255, 215, 0, 0.3)', 500);
    });
}

/**
 * Trigger a screen flash effect
 * @param color CSS color string (preferably rgba with some transparency)
 * @param duration Duration of the fade out in milliseconds
 */
export function flashScreen(color: string, duration: number = 200): void {
    if (!flashOverlay) return;

    // Clear any existing flash timeout
    if (flashTimeout) {
        clearTimeout(flashTimeout);
        flashTimeout = null;
    }

    // Set flash color and initial opacity
    flashOverlay.style.transition = 'none'; // Instant on
    flashOverlay.style.backgroundColor = color;
    flashOverlay.style.opacity = '1';

    // Force reflow
    void flashOverlay.offsetWidth;

    // Start fade out
    flashOverlay.style.transition = `opacity ${duration}ms ease-out`;
    flashOverlay.style.opacity = '0';

    // Cleanup after duration
    flashTimeout = window.setTimeout(() => {
        flashOverlay!.style.backgroundColor = 'transparent';
        flashTimeout = null;
    }, duration);
}
