// vortex.ts - Vortex anomaly with spiraling rings

import * as THREE from 'three';

interface RingData {
    mesh: THREE.Mesh;
    rotationSpeed: {
        x: number;
        y: number;
        z: number;
    };
}

interface EnergyOrbData {
    mesh: THREE.Sprite | THREE.Mesh;
}

interface VortexAnomalyData {
    type: 'vortex';
    mesh: THREE.Group;
    position: THREE.Vector3;
    rings: RingData[];
    orb: EnergyOrbData;
    collisionRadius: number;
    orbCollected: boolean;
    rotationSpeed: THREE.Vector3;
}

export class VortexAnomaly {
    private anomalyScale: number;

    constructor(_scene: THREE.Scene, anomalyScale: number = 4, _orbScale: number = 4) {
        this.anomalyScale = anomalyScale;
    }

    create(
        position: THREE.Vector3,
        createEnergyOrbCallback: (rarity: string) => EnergyOrbData,
        getRandomOrbRarityCallback: () => string,
        addToSceneCallback: (object: THREE.Object3D) => void
    ): VortexAnomalyData {
        // Create a spiraling vortex structure with central orb
        const anomalyGroup = new THREE.Group();
        anomalyGroup.position.copy(position);

        // Apply scale to make anomaly 4x bigger
        anomalyGroup.scale.set(this.anomalyScale, this.anomalyScale, this.anomalyScale);

        // Create the structural elements - spiral rings
        const ringCount: number = 6;
        const rings: RingData[] = [];

        // Create multiple rings with decreasing radius
        for (let i = 0; i < ringCount; i++) {
            const radius: number = 400 - (i * 50);
            const geometry = new THREE.TorusGeometry(radius, 15, 16, 100); // Increased tube radius from 10 to 15

            // Bright blue-cyan color scheme for better visibility
            const hue: number = 0.5 + (i * 0.05); // Blue to cyan gradient
            const color = new THREE.Color().setHSL(hue, 0.9, 0.6); // Increased saturation and lightness

            const material = new THREE.MeshStandardMaterial({
                color: color,
                emissive: color.clone().multiplyScalar(0.5),
                emissiveIntensity: 1.0,
                metalness: 0.8,
                roughness: 0.2,
                transparent: true,
                opacity: 0.95
            });

            const ring = new THREE.Mesh(geometry, material);

            // Rotate each ring at different angles to create spiral effect
            ring.rotation.x = Math.PI / 2 + (i * 0.2);
            ring.rotation.y = i * 0.3;

            anomalyGroup.add(ring);
            rings.push({
                mesh: ring,
                rotationSpeed: {
                    x: 0.005 + (i * 0.002),
                    y: 0.003 + (i * 0.001),
                    z: 0.001 + (i * 0.0005)
                }
            });
        }

        // Create energy orb in the center
        const orbRarity: string = getRandomOrbRarityCallback();
        const orb = createEnergyOrbCallback(orbRarity);
        anomalyGroup.add(orb.mesh);

        // Add to scene
        addToSceneCallback(anomalyGroup);

        // Return anomaly data
        return {
            type: 'vortex',
            mesh: anomalyGroup,
            position: position.clone(),
            rings: rings,
            orb: orb,
            collisionRadius: 350, // Overall collision size
            orbCollected: false,
            rotationSpeed: new THREE.Vector3(0.001, 0.002, 0.0015)
        };
    }

    update(anomaly: VortexAnomalyData, deltaTime: number): void {
        // Rotate each ring
        anomaly.rings.forEach((ring: RingData) => {
            ring.mesh.rotation.x += ring.rotationSpeed.x * deltaTime;
            ring.mesh.rotation.y += ring.rotationSpeed.y * deltaTime;
            ring.mesh.rotation.z += ring.rotationSpeed.z * deltaTime;
        });
    }

    cleanup(anomaly: VortexAnomalyData): void {
        // Clean up rings
        if (anomaly.rings) {
            anomaly.rings.forEach((ring: RingData) => {
                if (ring.mesh && ring.mesh.geometry) {
                    ring.mesh.geometry.dispose();
                }
                if (ring.mesh && ring.mesh.material) {
                    if (Array.isArray(ring.mesh.material)) {
                        ring.mesh.material.forEach((m: THREE.Material) => m.dispose());
                    } else {
                        (ring.mesh.material as THREE.Material).dispose();
                    }
                }
            });
        }
    }
}
