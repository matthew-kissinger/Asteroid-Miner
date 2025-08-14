/**
 * Wave Definitions - Enemy wave configurations and base parameters
 */

/**
 * Base enemy configuration template
 */
export const BASE_ENEMY_CONFIG = {
    health: 20,
    damage: 15,
    speed: 700,
    spiralAmplitude: 150,
    spiralFrequency: 2.0
};

/**
 * Enemy type configurations
 */
export const ENEMY_TYPES = {
    SPECTRAL_DRONE: {
        faction: 'spectrals',
        type: 'drone',
        baseConfig: { ...BASE_ENEMY_CONFIG },
        visualVariants: 4, // 0: Normal, 1: Damaged, 2: Elite, 3: Shielded
        sizeVariation: { min: 0.8, max: 1.6 },
        baseSize: 80,
        speedVariation: { min: 0.7, max: 1.3 },
        amplitudeVariation: { min: 0.8, max: 1.2 },
        frequencyVariation: { min: 0.9, max: 1.1 },
        isDroneLike: true,
        collisionRadius: 50
    }
};

/**
 * Wave spawn patterns
 */
export const WAVE_PATTERNS = {
    SINGLE: {
        name: 'single',
        count: 1,
        description: 'Single enemy spawn'
    },
    PAIR: {
        name: 'pair',
        count: 2,
        description: 'Two enemies spawned together'
    },
    SQUAD: {
        name: 'squad',
        count: 3,
        description: 'Small squad of three enemies'
    },
    PACK: {
        name: 'pack',
        count: 5,
        description: 'Pack of five enemies'
    }
};

/**
 * Default spawn intervals by difficulty
 */
export const SPAWN_INTERVALS = {
    EASY: 5.0,      // 5 seconds between spawns
    NORMAL: 3.0,    // 3 seconds between spawns
    HARD: 2.0,      // 2 seconds between spawns
    NIGHTMARE: 1.0  // 1 second between spawns
};

/**
 * Maximum enemy counts by difficulty
 */
export const MAX_ENEMY_COUNTS = {
    EASY: 5,
    NORMAL: 10,
    HARD: 15,
    NIGHTMARE: 25
};

/**
 * Color palette for enemy visual variants
 */
export const ENEMY_COLOR_PALETTE = [
    { main: 0x00ccff, emissive: { r: 0, g: 0.533, b: 1 } },      // Blue/cyan
    { main: 0x8866ff, emissive: { r: 0.4, g: 0.2, b: 1 } },     // Purple/blue
    { main: 0x00ffcc, emissive: { r: 0, g: 0.733, b: 0.6 } },   // Teal/green
    { main: 0xff3366, emissive: { r: 0.8, g: 0.067, b: 0.267 } }, // Red/pink
    { main: 0xffaa00, emissive: { r: 0.8, g: 0.533, b: 0 } },   // Orange/gold
    { main: 0x66ff33, emissive: { r: 0.267, g: 0.8, b: 0.067 } }, // Lime/green
    { main: 0xff99ff, emissive: { r: 0.8, g: 0.6, b: 0.8 } },   // Pink/magenta
    { main: 0xffff33, emissive: { r: 0.8, g: 0.8, b: 0.067 } }, // Yellow
    { main: 0x3366ff, emissive: { r: 0.067, g: 0.267, b: 0.8 } }, // Deep blue
    { main: 0xff3333, emissive: { r: 0.8, g: 0.067, b: 0.067 } }  // Deep red
];

/**
 * Visual variant effects configuration
 */
export const VISUAL_VARIANTS = {
    NORMAL: {
        id: 0,
        name: 'normal',
        emissiveIntensity: { min: 1.0, max: 1.5 },
        opacity: 1.0,
        additionalEffects: false
    },
    DAMAGED: {
        id: 1,
        name: 'damaged',
        emissiveIntensity: { base: 0.5, flicker: 0.3 }, // Flickering effect
        opacity: 0.85,
        colorMultiplier: 0.7,
        additionalEffects: false
    },
    ELITE: {
        id: 2,
        name: 'elite',
        emissiveIntensity: { base: 2.0, pulse: 0.5 }, // Pulsing effect
        opacity: 1.0,
        colorMultiplier: 1.2,
        additionalEffects: true,
        haloEffect: true
    },
    SHIELDED: {
        id: 3,
        name: 'shielded',
        emissiveIntensity: 1.5,
        opacity: 1.0,
        shimmerEffect: true,
        shieldEffect: true,
        additionalEffects: false
    }
};

/**
 * Get a random color from the palette
 * @returns {Object} Color configuration with main and emissive properties
 */
export function getRandomEnemyColor() {
    const colorIndex = Math.floor(Math.random() * ENEMY_COLOR_PALETTE.length);
    return ENEMY_COLOR_PALETTE[colorIndex];
}

/**
 * Get visual variant configuration by ID
 * @param {number} variantId - The variant ID (0-3)
 * @returns {Object} Visual variant configuration
 */
export function getVisualVariant(variantId = 0) {
    const variants = Object.values(VISUAL_VARIANTS);
    const variant = variants.find(v => v.id === variantId);
    return variant || VISUAL_VARIANTS.NORMAL;
}

/**
 * Generate random visual variant ID
 * @returns {number} Random variant ID (0-3)
 */
export function getRandomVisualVariant() {
    return Math.floor(Math.random() * 4);
}