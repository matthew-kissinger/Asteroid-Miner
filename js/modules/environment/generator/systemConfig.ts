// systemConfig.ts - Star system configuration and constants

export const STAR_CLASSES = ['O', 'B', 'A', 'F', 'G', 'K', 'M'] as const;
export type StarClass = typeof STAR_CLASSES[number];

export const SYSTEM_CLASSIFICATIONS = [
    'Resource-Rich',
    'Ancient',
    'Unstable',
    'Barren',
    'Hazardous',
    'Peaceful'
] as const;
export type SystemClassification = typeof SYSTEM_CLASSIFICATIONS[number] | 'Home System' | 'Custom';

export const SKYBOX_TEXTURES = [
    './assets/s1.jpg',
    './assets/s2.jpg',
    './assets/s3.jpg',
    './assets/s4.jpg',
    './assets/s5.jpg',
    './assets/s6.jpg',
    './assets/s7.jpg',
    './assets/s8.jpg',
    './assets/s9.jpg'
] as const;

export const RESOURCE_DISTRIBUTION: Record<StarClass, { iron: number; gold: number; platinum: number }> = {
    'O': { iron: 0.3, gold: 0.4, platinum: 0.3 },
    'B': { iron: 0.2, gold: 0.3, platinum: 0.5 },
    'A': { iron: 0.2, gold: 0.5, platinum: 0.3 },
    'F': { iron: 0.3, gold: 0.4, platinum: 0.3 },
    'G': { iron: 0.4, gold: 0.3, platinum: 0.3 },
    'K': { iron: 0.5, gold: 0.3, platinum: 0.2 },
    'M': { iron: 0.6, gold: 0.2, platinum: 0.2 }
};

export const CLASSIFICATION_MULTIPLIERS: Record<string, { iron: number; gold: number; platinum: number }> = {
    'Resource-Rich': { iron: 2.0, gold: 2.0, platinum: 2.0 },
    'Ancient': { iron: 1.0, gold: 1.5, platinum: 2.5 },
    'Unstable': { iron: 1.0, gold: 1.0, platinum: 3.0 },
    'Barren': { iron: 0.5, gold: 0.5, platinum: 0.5 },
    'Hazardous': { iron: 1.5, gold: 1.5, platinum: 1.5 },
    'Peaceful': { iron: 1.0, gold: 1.0, platinum: 1.0 },
    'Home System': { iron: 1.0, gold: 1.0, platinum: 1.0 }
};

export const STAR_COLORS: Record<StarClass, number> = {
    'O': 0x9bb0ff, // Blue
    'B': 0xaabfff, // Blue-white
    'A': 0xcad7ff, // White
    'F': 0xf8f7ff, // Yellow-white
    'G': 0xfff4ea, // Yellow (like our sun)
    'K': 0xffd2a1, // Orange
    'M': 0xffcc6f  // Red
};

export const SKYBOX_COLORS: Record<StarClass, number> = {
    'O': 0x0000ff, // Blue tint
    'B': 0x4444ff, // Blue-white tint
    'A': 0x8888ff, // White-blue tint
    'F': 0xddddff, // Yellow-white tint
    'G': 0xffffdd, // Yellow tint
    'K': 0xffddaa, // Orange tint
    'M': 0xff8866  // Red tint
};
