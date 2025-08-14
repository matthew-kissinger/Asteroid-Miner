/**
 * Formation Patterns - Templates and configurations for enemy spawn formations
 */

import * as THREE from 'three';

/**
 * Formation pattern definitions
 */
export const FORMATION_PATTERNS = {
    SPHERE: {
        name: 'sphere',
        description: 'Spherical distribution around center point',
        defaultRadius: 2500,
        defaultCount: 12,
        generate: (center, count = 12, radius = 2500) => {
            const points = [];
            for (let i = 0; i < count; i++) {
                // Generate random points on a sphere using spherical coordinates
                const phi = Math.acos(2 * Math.random() - 1);
                const theta = Math.random() * Math.PI * 2;
                
                const x = center.x + radius * Math.sin(phi) * Math.cos(theta);
                const y = center.y + radius * Math.sin(phi) * Math.sin(theta);
                const z = center.z + radius * Math.cos(phi);
                
                points.push(new THREE.Vector3(x, y, z));
            }
            return points;
        }
    },

    CIRCLE: {
        name: 'circle',
        description: 'Circular distribution around center point',
        defaultRadius: 3000,
        defaultCount: 10,
        generate: (center, count = 10, radius = 3000) => {
            const points = [];
            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2;
                const x = center.x + Math.cos(angle) * radius;
                const y = center.y + (Math.random() - 0.5) * 1000; // Some Y variation
                const z = center.z + Math.sin(angle) * radius;
                points.push(new THREE.Vector3(x, y, z));
            }
            return points;
        }
    },

    RING: {
        name: 'ring',
        description: 'Ring formation with inner and outer radius',
        defaultInnerRadius: 2000,
        defaultOuterRadius: 3500,
        defaultCount: 8,
        generate: (center, count = 8, innerRadius = 2000, outerRadius = 3500) => {
            const points = [];
            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2;
                const radius = innerRadius + Math.random() * (outerRadius - innerRadius);
                const x = center.x + Math.cos(angle) * radius;
                const y = center.y + (Math.random() - 0.5) * 500;
                const z = center.z + Math.sin(angle) * radius;
                points.push(new THREE.Vector3(x, y, z));
            }
            return points;
        }
    },

    HEMISPHERE: {
        name: 'hemisphere',
        description: 'Hemisphere above/below center point',
        defaultRadius: 2800,
        defaultCount: 10,
        generate: (center, count = 10, radius = 2800, upper = true) => {
            const points = [];
            for (let i = 0; i < count; i++) {
                // Generate points on hemisphere (phi from 0 to π/2 for upper, π/2 to π for lower)
                const phi = upper ? 
                    Math.random() * Math.PI / 2 : 
                    Math.PI / 2 + Math.random() * Math.PI / 2;
                const theta = Math.random() * Math.PI * 2;
                
                const x = center.x + radius * Math.sin(phi) * Math.cos(theta);
                const y = center.y + radius * Math.sin(phi) * Math.sin(theta);
                const z = center.z + radius * Math.cos(phi);
                
                points.push(new THREE.Vector3(x, y, z));
            }
            return points;
        }
    },

    GRID_3D: {
        name: 'grid3d',
        description: '3D grid formation around center',
        defaultSpacing: 1000,
        defaultSize: 3,
        generate: (center, size = 3, spacing = 1000) => {
            const points = [];
            const offset = (size - 1) * spacing / 2;
            
            for (let x = 0; x < size; x++) {
                for (let y = 0; y < size; y++) {
                    for (let z = 0; z < size; z++) {
                        // Skip center point to avoid spawning on player
                        if (x === Math.floor(size/2) && y === Math.floor(size/2) && z === Math.floor(size/2)) {
                            continue;
                        }
                        
                        const point = new THREE.Vector3(
                            center.x + (x * spacing) - offset,
                            center.y + (y * spacing) - offset,
                            center.z + (z * spacing) - offset
                        );
                        points.push(point);
                    }
                }
            }
            return points;
        }
    },

    RANDOM_CLOUD: {
        name: 'randomcloud',
        description: 'Random distribution within a bounding volume',
        defaultRadius: 3000,
        defaultCount: 15,
        generate: (center, count = 15, radius = 3000) => {
            const points = [];
            for (let i = 0; i < count; i++) {
                // Generate random point within sphere
                const u = Math.random();
                const v = Math.random();
                const w = Math.random();
                
                // Convert to spherical coordinates and scale by cube root for uniform distribution
                const r = radius * Math.cbrt(u);
                const theta = 2 * Math.PI * v;
                const phi = Math.acos(2 * w - 1);
                
                const x = center.x + r * Math.sin(phi) * Math.cos(theta);
                const y = center.y + r * Math.sin(phi) * Math.sin(theta);
                const z = center.z + r * Math.cos(phi);
                
                points.push(new THREE.Vector3(x, y, z));
            }
            return points;
        }
    }
};

/**
 * Default formation configuration
 */
export const DEFAULT_FORMATION = FORMATION_PATTERNS.SPHERE;

/**
 * Get formation pattern by name
 * @param {string} name - Pattern name
 * @returns {Object} Formation pattern or default pattern
 */
export function getFormationPattern(name) {
    return FORMATION_PATTERNS[name.toUpperCase()] || DEFAULT_FORMATION;
}

/**
 * Get all available formation pattern names
 * @returns {Array<string>} Array of pattern names
 */
export function getAvailablePatterns() {
    return Object.keys(FORMATION_PATTERNS);
}

/**
 * Generate formation with random pattern
 * @param {THREE.Vector3} center - Center point for formation
 * @param {number} count - Number of spawn points
 * @param {number} radius - Formation radius
 * @returns {Array<THREE.Vector3>} Array of spawn points
 */
export function generateRandomFormation(center, count = 12, radius = 2500) {
    const patternNames = getAvailablePatterns();
    const randomPattern = patternNames[Math.floor(Math.random() * patternNames.length)];
    const pattern = FORMATION_PATTERNS[randomPattern];
    
    return pattern.generate(center, count, radius);
}