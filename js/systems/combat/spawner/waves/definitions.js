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
 * Enemy subtype configurations - Three distinct drone variants
 */
export const ENEMY_SUBTYPES = {
    STANDARD: {
        id: 'standard',
        name: 'Standard Spectral Drone',
        health: 20,
        damage: 15,
        speed: 700,
        sizeScale: 1.0,
        collisionRadius: 50,
        spiralAmplitude: 150,
        spiralFrequency: 2.0,
        spawnWeight: 60, // 60% spawn chance
        // Visual properties
        color: { main: 0x00FFFF, emissive: { r: 0, g: 1, b: 1 } },
        emissiveIntensity: 3.0,
        shaderType: 'pulsingCore'
    },
    HEAVY: {
        id: 'heavy',
        name: 'Heavy Spectral Drone',
        health: 60,
        damage: 30,
        speed: 400,
        sizeScale: 1.5,
        collisionRadius: 75,
        spiralAmplitude: 100,
        spiralFrequency: 1.0,
        spawnWeight: 15, // 15% spawn chance
        // Visual properties
        color: { main: 0xFF6600, emissive: { r: 1, g: 0.4, b: 0 } },
        emissiveIntensity: 4.0,
        shaderType: 'hexagonShield'
    },
    SWIFT: {
        id: 'swift',
        name: 'Swift Spectral Drone',
        health: 10,
        damage: 10,
        speed: 1200,
        sizeScale: 0.8,
        collisionRadius: 40,
        spiralAmplitude: 200,
        spiralFrequency: 3.0,
        spawnWeight: 25, // 25% spawn chance
        // Visual properties
        color: { main: 0x66FF00, emissive: { r: 0.4, g: 1, b: 0 } },
        emissiveIntensity: 3.5,
        shaderType: 'speedBlur'
    }
};

/**
 * Enemy type configurations
 */
export const ENEMY_TYPES = {
    SPECTRAL_DRONE: {
        faction: 'spectrals',
        type: 'drone',
        baseConfig: { ...BASE_ENEMY_CONFIG },
        subtypes: ENEMY_SUBTYPES,
        baseSize: 80,
        isDroneLike: true
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
 * Bright color palette for enhanced visibility (deprecated - use subtype colors)
 */
export const ENEMY_COLOR_PALETTE = [
    { main: 0x00FFFF, emissive: { r: 0, g: 1, b: 1 } },         // Bright cyan
    { main: 0xFF00FF, emissive: { r: 1, g: 0, b: 1 } },         // Bright magenta
    { main: 0x00FF00, emissive: { r: 0, g: 1, b: 0 } },         // Bright green
    { main: 0xFFFF00, emissive: { r: 1, g: 1, b: 0 } },         // Bright yellow
    { main: 0xFF6600, emissive: { r: 1, g: 0.4, b: 0 } },       // Bright orange
    { main: 0x00FFAA, emissive: { r: 0, g: 1, b: 0.67 } },      // Bright teal
    { main: 0xFF00AA, emissive: { r: 1, g: 0, b: 0.67 } },      // Bright pink
    { main: 0xAAFF00, emissive: { r: 0.67, g: 1, b: 0 } },      // Bright lime
    { main: 0xAA00FF, emissive: { r: 0.67, g: 0, b: 1 } },      // Bright purple
    { main: 0xFFAA00, emissive: { r: 1, g: 0.67, b: 0 } }       // Bright amber
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
 * Get a random enemy subtype based on spawn weights
 * @returns {Object} Enemy subtype configuration
 */
export function getRandomEnemySubtype() {
    const totalWeight = Object.values(ENEMY_SUBTYPES).reduce((sum, type) => sum + type.spawnWeight, 0);
    let random = Math.random() * totalWeight;
    
    for (const subtype of Object.values(ENEMY_SUBTYPES)) {
        random -= subtype.spawnWeight;
        if (random <= 0) {
            return subtype;
        }
    }
    
    return ENEMY_SUBTYPES.STANDARD; // Fallback
}

/**
 * Get enemy subtype by ID
 * @param {string} subtypeId - The subtype ID
 * @returns {Object} Enemy subtype configuration
 */
export function getEnemySubtype(subtypeId) {
    return ENEMY_SUBTYPES[subtypeId.toUpperCase()] || ENEMY_SUBTYPES.STANDARD;
}

/**
 * Get a random color from the palette (deprecated - use subtype colors)
 * @returns {Object} Color configuration with main and emissive properties
 */
export function getRandomEnemyColor() {
    // Now returns color from a random subtype for backward compatibility
    const subtype = getRandomEnemySubtype();
    return subtype.color;
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
 * Generate random visual variant ID (deprecated - use getRandomEnemySubtype)
 * @returns {number} Random variant ID (0-2 for backward compatibility)
 */
export function getRandomVisualVariant() {
    // Map to new subtype system for backward compatibility
    const subtype = getRandomEnemySubtype();
    return subtype.id === 'standard' ? 0 : (subtype.id === 'heavy' ? 1 : 2);
}