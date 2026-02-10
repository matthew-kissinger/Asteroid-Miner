// planetGenerator.ts - Procedural planet generation logic

import { PlanetData } from './planetFactory.ts';

// Type definition for star system generator
interface StarSystemGenerator {
    customPlanetData?: {
        [systemId: string]: PlanetData[];
    };
}

export class PlanetGenerator {
    static generatePlanetsForSystem(systemId: string, starSystemGenerator?: StarSystemGenerator): PlanetData[] {
        console.log(`Generating new planets for system: ${systemId}`);

        // Check if this is a custom system with predefined planets
        if (starSystemGenerator && starSystemGenerator.customPlanetData && starSystemGenerator.customPlanetData[systemId]) {
            const customPlanets = starSystemGenerator.customPlanetData[systemId];
            console.log(`Using ${customPlanets.length} custom planets for system: ${systemId}`);

            customPlanets.forEach((planet: PlanetData) => {
                if (planet.textureUrl) {
                    console.log(`Custom planet ${planet.name} has texture URL: ${planet.textureUrl}`);
                } else {
                    console.log(`Custom planet ${planet.name} does not have a texture URL`);
                }
            });

            return starSystemGenerator.customPlanetData[systemId];
        }

        // Planet name word banks for procedural generation
        const prefixes = [
            'New', 'Alpha', 'Beta', 'Gamma', 'Delta', 'Nova', 'Proxima', 'Ultima',
            'Astro', 'Cosmo', 'Stella', 'Terra', 'Astra', 'Prime', 'Orb'
        ];

        const suffixes = [
            'sphere', 'world', 'orb', 'terra', 'oid', 'globus', 'ium', 'ian',
            'aria', 'anth', 'urus', 'alos', 'onos', 'era', 'ax', 'is', 'os'
        ];

        const starClass = systemId.includes('System-') ? systemId.split('-')[1][0] : 'M';
        const planetCount = 2 + Math.floor(Math.random() * 7); // 2-8 planets
        const planetData: PlanetData[] = [];

        // Determine system characteristics based on star class
        let sizeMultiplier = 1.0;
        let distanceMultiplier = 1.0;
        let colorPalette: number[] = [];

        switch (starClass) {
            case 'O':
                sizeMultiplier = 1.8;
                distanceMultiplier = 1.6;
                colorPalette = [0x6666ff, 0x9999ff, 0xccccff, 0xaaaaff, 0x8888dd];
                break;
            case 'B':
                sizeMultiplier = 1.5;
                distanceMultiplier = 1.3;
                colorPalette = [0x99aaff, 0xaabbff, 0xccccff, 0xddddff, 0xbbaacc];
                break;
            case 'A':
                sizeMultiplier = 1.3;
                distanceMultiplier = 1.1;
                colorPalette = [0xccccff, 0xddddff, 0xeeeeff, 0xffffff, 0xddccdd];
                break;
            case 'F':
                sizeMultiplier = 1.1;
                distanceMultiplier = 1.0;
                colorPalette = [0x99aaff, 0xaaccaa, 0xccddcc, 0xffccaa, 0xeeeecc];
                break;
            case 'G':
                sizeMultiplier = 1.0;
                distanceMultiplier = 1.0;
                colorPalette = [0xaaaaaa, 0x4169e1, 0xc65d45, 0xd6b27e, 0xf0e5c9];
                break;
            case 'K':
                sizeMultiplier = 0.8;
                distanceMultiplier = 0.9;
                colorPalette = [0xe6cc9c, 0xccaa88, 0xddbb99, 0xbb9977, 0xcc8866];
                break;
            case 'M':
                sizeMultiplier = 0.6;
                distanceMultiplier = 0.7;
                colorPalette = [0xcc6644, 0xdd7755, 0xee8866, 0xff9977, 0xbb5533];
                break;
            default:
                colorPalette = [0xaaaaaa, 0x4169e1, 0xc65d45, 0xd6b27e, 0xf0e5c9];
        }

        // Generate each planet
        for (let i = 0; i < planetCount; i++) {
            const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
            const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
            const name = `${prefix}${suffix}`;

            const sizeClass = Math.random();
            let size: number;
            if (sizeClass < 0.5) {
                size = (240 + Math.random() * 200) * sizeMultiplier;
            } else if (sizeClass < 0.8) {
                size = (440 + Math.random() * 280) * sizeMultiplier;
            } else {
                size = (720 + Math.random() * 360) * sizeMultiplier;
            }

            const baseDistance = 4800 + (i * 8000);
            const distanceVariation = baseDistance * 0.2;
            const distance = (baseDistance + (Math.random() * distanceVariation - distanceVariation / 2)) * distanceMultiplier;

            const speed = 0.002 / (distance / 1000);
            const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
            const rings = size > 600 ? Math.random() < 0.4 : false;
            const axialTilt = Math.random() * Math.PI * 0.5;
            const orbitalTilt = Math.random() * Math.PI * 0.2;

            planetData.push({
                name,
                size: Math.floor(size),
                distance: Math.floor(distance),
                speed,
                color,
                rings,
                axialTilt,
                orbitalTilt
            });
        }

        return planetData;
    }

    static createHomeSolarSystemPlanets(): PlanetData[] {
        return [
            { name: "Mercury", size: 220, distance: 4800, speed: 0.0016, color: 0xaaaaaa, rings: false },
            { name: "Venus", size: 400, distance: 8000, speed: 0.0013, color: 0xe6cc9c, rings: false },
            { name: "Earth", size: 420, distance: 12000, speed: 0.0010, color: 0x4169e1, rings: false },
            { name: "Mars", size: 320, distance: 16800, speed: 0.0008, color: 0xc65d45, rings: false },
            { name: "Jupiter", size: 1000, distance: 30000, speed: 0.0004, color: 0xd6b27e, rings: true },
            { name: "Saturn", size: 880, distance: 40000, speed: 0.0003, color: 0xf0e5c9, rings: true },
            { name: "Uranus", size: 720, distance: 56000, speed: 0.0002, color: 0xcaecf1, rings: true },
            { name: "Neptune", size: 700, distance: 72000, speed: 0.00016, color: 0x5fa3db, rings: false }
        ];
    }
}