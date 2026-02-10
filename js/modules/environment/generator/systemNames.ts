// systemNames.ts - System name generation and descriptions

import type { StarClass, SystemClassification } from './systemConfig.ts';

export class SystemNames {
    static generateSystemName(starClass: StarClass | string): string {
        const prefixes = [
            'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta',
            'Proxima', 'Nova', 'Sirius', 'Vega', 'Rigel', 'Antares', 'Arcturus'
        ];

        const suffixes = [
            'Prime', 'Major', 'Minor', 'A', 'B', 'I', 'II', 'III', 'IV', 'V'
        ];

        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffix = Math.random() > 0.7 ? ` ${suffixes[Math.floor(Math.random() * suffixes.length)]}` : '';
        const number = Math.floor(Math.random() * 999) + 1;

        return `${prefix} ${starClass}${number}${suffix}`;
    }

    static generateSpecialFeatures(classification: SystemClassification | string): string[] {
        const features: string[] = [];

        switch (classification) {
            case 'Resource-Rich':
                features.push('Dense Asteroid Fields', 'Rich Mineral Veins');
                break;
            case 'Ancient':
                features.push('Abandoned Structures', 'Ancient Artifacts');
                break;
            case 'Unstable':
                features.push('Solar Flares', 'Radiation Bursts');
                break;
            case 'Barren':
                features.push('Minimal Resources', 'Few Planets');
                break;
            case 'Hazardous':
                features.push('Asteroid Storms', 'Energy Anomalies');
                break;
            case 'Peaceful':
                features.push('Stable Environment', 'Optimal Mining Conditions');
                break;
        }

        return features;
    }

    static generateDescription(starClass: StarClass | string, classification: SystemClassification | string): string {
        const starDescriptions: Record<string, string> = {
            'O': "A rare, hot blue star system with intense radiation.",
            'B': "A blue-white star system with high energy output.",
            'A': "A white star system with moderate radiation levels.",
            'F': "A yellow-white star system with mild conditions.",
            'G': "A yellow star system similar to our Solar System.",
            'K': "An orange star system with reduced energy output.",
            'M': "A common red dwarf system with low energy output."
        };

        const classDescriptions: Record<string, string> = {
            'Resource-Rich': "The system is known for its abundant resources and dense asteroid fields.",
            'Ancient': "This ancient system contains remnants of long-lost civilizations.",
            'Unstable': "Be cautious as unpredictable stellar activity occurs in this system.",
            'Barren': "Resources are scarce in this mostly empty star system.",
            'Hazardous': "Environmental hazards make mining operations difficult but rewarding.",
            'Peaceful': "This system offers stable and optimal conditions for mining operations.",
            'Home System': "Our home system, containing Earth and the origin of humanity."
        };

        return `${starDescriptions[starClass]} ${classDescriptions[classification]}`;
    }
}
