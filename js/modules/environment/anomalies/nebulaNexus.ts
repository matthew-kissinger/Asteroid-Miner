// nebulaNexus.ts - Nebula nexus anomaly with crystalline rings and energy arcs

import * as THREE from 'three';

interface CrystalData {
    mesh: THREE.Mesh;
    initialPosition: THREE.Vector3;
    pulsePhase: number;
    pulseSpeed: number;
}

interface RingData {
    mesh: THREE.Mesh;
    crystals: CrystalData[];
    rotationSpeed: number;
    rotationAxis: THREE.Vector3;
}

interface CoreData {
    mesh: THREE.Mesh;
    pulsePhase: number;
    pulseSpeed: number;
}

interface ArcData {
    mesh: THREE.Line;
    curve: THREE.CubicBezierCurve3;
    updatePhase: number;
    updateSpeed: number;
}

interface EnergyOrbData {
    mesh: THREE.Sprite | THREE.Mesh;
}

interface NebulaNexusAnomalyData {
    type: 'nebulaNexus';
    mesh: THREE.Group;
    position: THREE.Vector3;
    rings: RingData[];
    core: CoreData;
    arcs: ArcData[];
    orb: EnergyOrbData;
    collisionRadius: number;
    orbCollected: boolean;
    rotationSpeed: THREE.Vector3;
}

export class NebulaNexusAnomaly {
    private anomalyScale: number;

    constructor(_scene: THREE.Scene, anomalyScale: number = 4, _orbScale: number = 4) {
        this.anomalyScale = anomalyScale;
    }

    create(
        position: THREE.Vector3,
        createEnergyOrbCallback: (rarity: string) => EnergyOrbData,
        getRandomOrbRarityCallback: () => string,
        addToSceneCallback: (object: THREE.Object3D) => void
    ): NebulaNexusAnomalyData {
        // Create a crystalline ring structure with central orb
        const anomalyGroup = new THREE.Group();
        anomalyGroup.position.copy(position);

        // Apply scale to make anomaly 4x bigger
        anomalyGroup.scale.set(this.anomalyScale, this.anomalyScale, this.anomalyScale);

        // Create a series of rotating rings with crystal formations
        const ringCount: number = 3;
        const rings: RingData[] = [];

        // Create multiple crystal-studded rings
        for (let i = 0; i < ringCount; i++) {
            // Create a ring
            const ringRadius: number = 200 + i * 60;
            const ringGeometry = new THREE.TorusGeometry(ringRadius, 8, 16, 50);

            // Create a vibrant material for the ring
            const ringHue: number = 0.6 + i * 0.1; // Blue to purple gradient
            const ringColor = new THREE.Color().setHSL(ringHue, 1.0, 0.6);

            const ringMaterial = new THREE.MeshStandardMaterial({
                color: ringColor,
                emissive: ringColor.clone().multiplyScalar(0.5),
                emissiveIntensity: 1.0,
                metalness: 0.9,
                roughness: 0.1,
                transparent: false,
                opacity: 1.0
            });

            const ring = new THREE.Mesh(ringGeometry, ringMaterial);

            // Position ring with different orientation
            ring.rotation.x = Math.PI / 2 + (i * Math.PI / 3);
            ring.rotation.y = i * Math.PI / 4;

            anomalyGroup.add(ring);

            // Add crystals along the ring
            const crystalCount: number = 10 + i * 5;
            const crystals: CrystalData[] = [];

            for (let j = 0; j < crystalCount; j++) {
                // Crystal position along the ring
                const angle: number = (j / crystalCount) * Math.PI * 2;

                // Create crystal geometry
                const crystalSize: number = 15 + Math.random() * 10;
                const crystalGeometry = new THREE.OctahedronGeometry(crystalSize, 0);

                // Create crystal material with complementary color
                const crystalHue: number = (ringHue + 0.5) % 1.0; // Complementary color
                const crystalColor = new THREE.Color().setHSL(crystalHue, 1.0, 0.7);

                const crystalMaterial = new THREE.MeshStandardMaterial({
                    color: crystalColor,
                    emissive: crystalColor.clone(),
                    emissiveIntensity: 0.8,
                    metalness: 0.9,
                    roughness: 0.1,
                    transparent: false,
                    opacity: 1.0
                });

                const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);

                // Position crystal on the ring
                crystal.position.x = ringRadius * Math.cos(angle);
                crystal.position.y = 0;
                crystal.position.z = ringRadius * Math.sin(angle);

                // Random rotation
                crystal.rotation.x = Math.random() * Math.PI;
                crystal.rotation.y = Math.random() * Math.PI;
                crystal.rotation.z = Math.random() * Math.PI;

                ring.add(crystal);

                crystals.push({
                    mesh: crystal,
                    initialPosition: crystal.position.clone(),
                    pulsePhase: Math.random() * Math.PI * 2,
                    pulseSpeed: 0.5 + Math.random() * 0.5
                });
            }

            rings.push({
                mesh: ring,
                crystals: crystals,
                rotationSpeed: 0.1 - (i * 0.03), // Outer rings rotate slower
                rotationAxis: new THREE.Vector3(
                    Math.random() - 0.5,
                    Math.random() - 0.5,
                    Math.random() - 0.5
                ).normalize()
            });
        }

        // Create an inner sphere with energy effect
        const coreRadius: number = 80;
        const coreGeometry = new THREE.SphereGeometry(coreRadius, 32, 32);
        const coreColor = new THREE.Color().setHSL(0.15, 1.0, 0.6); // Gold color

        const coreMaterial = new THREE.MeshStandardMaterial({
            color: coreColor,
            emissive: coreColor,
            emissiveIntensity: 1.0,
            metalness: 1.0,
            roughness: 0.3,
            transparent: true,
            opacity: 0.9
        });

        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        anomalyGroup.add(core);

        // Add energy arcs from core to rings
        const arcCount: number = 8;
        const arcs: ArcData[] = [];

        for (let i = 0; i < arcCount; i++) {
            const curve = new THREE.CubicBezierCurve3(
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(
                    (Math.random() - 0.5) * 200,
                    (Math.random() - 0.5) * 200,
                    (Math.random() - 0.5) * 200
                ),
                new THREE.Vector3(
                    (Math.random() - 0.5) * 300,
                    (Math.random() - 0.5) * 300,
                    (Math.random() - 0.5) * 300
                ),
                new THREE.Vector3(
                    (Math.random() - 0.5) * 400,
                    (Math.random() - 0.5) * 400,
                    (Math.random() - 0.5) * 400
                )
            );

            const points = curve.getPoints(20);
            const arcGeometry = new THREE.BufferGeometry().setFromPoints(points);

            const arcColor = new THREE.Color().setHSL(0.15, 1.0, 0.6); // Gold color
            const arcMaterial = new THREE.LineBasicMaterial({
                color: arcColor,
                linewidth: 3,
                transparent: true,
                opacity: 0.8
            });

            const arc = new THREE.Line(arcGeometry, arcMaterial);
            anomalyGroup.add(arc);

            arcs.push({
                mesh: arc,
                curve: curve,
                updatePhase: Math.random() * Math.PI * 2,
                updateSpeed: 0.2 + Math.random() * 0.3
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
            type: 'nebulaNexus',
            mesh: anomalyGroup,
            position: position.clone(),
            rings: rings,
            core: {
                mesh: core,
                pulsePhase: 0,
                pulseSpeed: 0.5
            },
            arcs: arcs,
            orb: orb,
            collisionRadius: 250,
            orbCollected: false,
            rotationSpeed: new THREE.Vector3(0.0003, 0.0004, 0.0002)
        };
    }

    update(anomaly: NebulaNexusAnomalyData, deltaTime: number): void {
        // Animate core
        anomaly.core.pulsePhase += deltaTime * anomaly.core.pulseSpeed;
        const scale: number = 1.0 + 0.2 * Math.sin(anomaly.core.pulsePhase);
        anomaly.core.mesh.scale.set(scale, scale, scale);

        // Animate rings and crystals
        anomaly.rings.forEach((ring: RingData) => {
            // Rotate each ring
            const rotationMatrix = new THREE.Matrix4().makeRotationAxis(
                ring.rotationAxis,
                ring.rotationSpeed * deltaTime
            );
            ring.mesh.applyMatrix4(rotationMatrix);

            // Animate crystals on the ring
            ring.crystals.forEach((crystal: CrystalData) => {
                crystal.pulsePhase += deltaTime * crystal.pulseSpeed;
                const crystalScale: number = 1.0 + 0.3 * Math.sin(crystal.pulsePhase);
                crystal.mesh.scale.set(crystalScale, crystalScale, crystalScale);
            });
        });

        // Animate energy arcs
        anomaly.arcs.forEach((arc: ArcData) => {
            arc.updatePhase += deltaTime * arc.updateSpeed;

            // Update arc control points for dynamic movement
            const controlPoint1 = arc.curve.v1;
            const controlPoint2 = arc.curve.v2;

            controlPoint1.x = Math.sin(arc.updatePhase) * 200;
            controlPoint1.y = Math.cos(arc.updatePhase * 0.7) * 200;
            controlPoint1.z = Math.sin(arc.updatePhase * 1.3) * 200;

            controlPoint2.x = Math.sin(arc.updatePhase * 0.8 + 1) * 300;
            controlPoint2.y = Math.cos(arc.updatePhase * 1.2 + 2) * 300;
            controlPoint2.z = Math.sin(arc.updatePhase * 0.9 + 3) * 300;

            // Update arc geometry
            const points = arc.curve.getPoints(20);
            arc.mesh.geometry.setFromPoints(points);
            (arc.mesh.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
        });
    }

    cleanup(anomaly: NebulaNexusAnomalyData): void {
        // Clean up rings, core, and arcs
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
        if (anomaly.core && anomaly.core.mesh) {
            if (anomaly.core.mesh.geometry) anomaly.core.mesh.geometry.dispose();
            if (anomaly.core.mesh.material) {
                if (Array.isArray(anomaly.core.mesh.material)) {
                    anomaly.core.mesh.material.forEach((m: THREE.Material) => m.dispose());
                } else {
                    (anomaly.core.mesh.material as THREE.Material).dispose();
                }
            }
        }
        if (anomaly.arcs) {
            anomaly.arcs.forEach((arc: ArcData) => {
                if (arc.mesh && arc.mesh.geometry) {
                    arc.mesh.geometry.dispose();
                }
                if (arc.mesh && arc.mesh.material) {
                    if (Array.isArray(arc.mesh.material)) {
                        arc.mesh.material.forEach((m: THREE.Material) => m.dispose());
                    } else {
                        (arc.mesh.material as THREE.Material).dispose();
                    }
                }
            });
        }
    }
}
