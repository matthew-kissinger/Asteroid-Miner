// laserMaterial.ts - TSL-based pulsing glow material for mining laser

import { color, time, sin } from 'three/tsl'; // TSL helpers
import * as THREE from 'three';

/**
 * Create a TSL-based laser material with pulsing glow effect
 * @param baseColor - Base color as hex (e.g., 0x00ffff)
 * @param pulseSpeed - Speed of pulse animation (default: 8)
 * @param pulseIntensity - Intensity of pulse variation (0-1, default: 0.3)
 * @returns Material with TSL colorNode and pulsing glow
 */
export function createLaserMaterial(
    baseColor: number = 0x00ffff,
    pulseSpeed: number = 8,
    pulseIntensity: number = 0.3
): THREE.MeshBasicMaterial {
    const material = new THREE.MeshBasicMaterial() as THREE.MeshBasicMaterial & { colorNode?: unknown };

    // Create pulsing glow effect using TSL
    // sin(time * pulseSpeed) gives oscillation between -1 and 1
    // Multiply by pulseIntensity, then add 1 to get [1-pulseIntensity, 1+pulseIntensity]
    // This creates a pulsing effect that varies the color intensity
    // Pattern matches CLAUDE.md example: sin(time.mul(10)).mul(0.3).add(1)
    const pulse = sin(time.mul(pulseSpeed)).mul(pulseIntensity).add(1);

    // Apply pulse to color - color nodes support method chaining
    // color() can take hex values directly (e.g., 0xff3030)
    // Note: TSL colorNode is experimental, fall back to standard color + emissiveMap if issues
    try {
        material.colorNode = color(baseColor).mul(pulse);
    } catch (e) {
        // Fallback: use standard material color without TSL
        material.color.setHex(baseColor);
        console.warn('TSL colorNode not supported or failed, falling back to standard material color.', e);
    }
    
    // Transparency and additive blending for glow effect
    material.transparent = true;
    material.opacity = 0.8;
    material.blending = THREE.AdditiveBlending;
    material.depthWrite = false;
    material.side = THREE.DoubleSide;
    
    return material;
}
