// darkMatter.ts - Dark matter anomaly with gravitational lensing effects

import * as THREE from 'three';

interface RingData {
    mesh: THREE.Mesh;
    rotationAxis: THREE.Vector3;
    rotationSpeed: number;
    warpPhase: number;
    warpSpeed: number;
}

interface ParticleData {
    mesh: THREE.Points;
    positions: Float32Array;
    initialPositions: Float32Array;
    phases: number[];
}

interface CoreData {
    mesh: THREE.Mesh;
    pulsePhase: number;
}

interface EnergyOrbData {
    mesh: THREE.Sprite | THREE.Mesh;
}

interface DarkMatterAnomalyData {
    type: 'darkMatter';
    mesh: THREE.Group;
    position: THREE.Vector3;
    core: CoreData;
    rings: RingData[];
    particles: ParticleData;
    orb: EnergyOrbData;
    collisionRadius: number;
    orbCollected: boolean;
    rotationSpeed: THREE.Vector3;
}

export class DarkMatterAnomaly {
    private anomalyScale: number;

    constructor(_scene: THREE.Scene, anomalyScale: number = 4, _orbScale: number = 4) {
        this.anomalyScale = anomalyScale;
    }

    create(
        position: THREE.Vector3,
        createEnergyOrbCallback: (rarity: string) => EnergyOrbData,
        getRandomOrbRarityCallback: () => string,
        addToSceneCallback: (object: THREE.Object3D) => void
    ): DarkMatterAnomalyData {
        // Create a dark matter anomaly with gravitational lensing effects
        const anomalyGroup = new THREE.Group();
        anomalyGroup.position.copy(position);

        // Apply scale to make anomaly 4x bigger
        anomalyGroup.scale.set(this.anomalyScale, this.anomalyScale, this.anomalyScale);

        // Create the dark matter core - a sphere with dark, distortion-like material
        const coreRadius: number = 100;
        const coreGeometry = new THREE.SphereGeometry(coreRadius, 32, 32);
        const coreMaterial = new THREE.MeshStandardMaterial({
            color: 0x330033,
            emissive: 0x880088,
            emissiveIntensity: 1.5,
            metalness: 1.0,
            roughness: 0.0,
            transparent: true,
            opacity: 0.95
        });

        const core = new THREE.Mesh(coreGeometry, coreMaterial);

        // Add a glow effect around the core
        const glowGeometry = new THREE.SphereGeometry(coreRadius * 1.2, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x9900ff,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });

        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        core.add(glow);

        anomalyGroup.add(core);

        // Create gravitational distortion rings
        const rings: RingData[] = [];
        const ringCount: number = 4;

        for (let i = 0; i < ringCount; i++) {
            const radius: number = 150 + i * 60;
            const tubeRadius: number = 4 + i * 2;
            const geometry = new THREE.TorusGeometry(radius, tubeRadius, 16, 100);

            // Use dark/purple color scheme with increasing brightness outward
            const color = new THREE.Color().setHSL(0.75, 0.9, 0.1 + i * 0.15);

            const material = new THREE.MeshStandardMaterial({
                color: color,
                emissive: color.clone().multiplyScalar(0.7),
                emissiveIntensity: 0.5 + i * 0.2,
                metalness: 0.8,
                roughness: 0.2,
                transparent: true,
                opacity: 0.85
            });

            const ring = new THREE.Mesh(geometry, material);

            // Position with random orientation
            ring.rotation.x = Math.random() * Math.PI;
            ring.rotation.y = Math.random() * Math.PI;
            ring.rotation.z = Math.random() * Math.PI;

            anomalyGroup.add(ring);
            rings.push({
                mesh: ring,
                rotationAxis: new THREE.Vector3(
                    Math.random() - 0.5,
                    Math.random() - 0.5,
                    Math.random() - 0.5
                ).normalize(),
                rotationSpeed: 0.002 + i * 0.001,
                warpPhase: Math.random() * Math.PI * 2,
                warpSpeed: 0.5 + Math.random() * 0.5
            });
        }

        // Create distortion particles
        const particleCount: number = 300;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        const particleSizes = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            const i3: number = i * 3;

            // Distribute particles in a spherical shell
            const radius: number = 120 + Math.random() * 250;
            const theta: number = Math.random() * Math.PI * 2;
            const phi: number = Math.random() * Math.PI;

            particlePositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            particlePositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            particlePositions[i3 + 2] = radius * Math.cos(phi);

            // Vary particle sizes
            particleSizes[i] = 1 + Math.random() * 3;
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));

        const particleMaterial = new THREE.PointsMaterial({
            color: 0x8800ff,
            size: 5,
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.8
        });

        const particles = new THREE.Points(particleGeometry, particleMaterial);
        anomalyGroup.add(particles);

        // Create energy orb in the center
        const orbRarity: string = getRandomOrbRarityCallback();
        const orb = createEnergyOrbCallback(orbRarity);
        anomalyGroup.add(orb.mesh);

        // Add to scene
        addToSceneCallback(anomalyGroup);

        // Return anomaly data
        return {
            type: 'darkMatter',
            mesh: anomalyGroup,
            position: position.clone(),
            core: {
                mesh: core,
                pulsePhase: 0
            },
            rings: rings,
            particles: {
                mesh: particles,
                positions: particlePositions,
                initialPositions: particlePositions.slice(),
                phases: Array(particleCount).fill(0).map(() => Math.random() * Math.PI * 2)
            },
            orb: orb,
            collisionRadius: 200, // Overall collision size
            orbCollected: false,
            rotationSpeed: new THREE.Vector3(0.0002, 0.0003, 0.0001)
        };
    }

    update(anomaly: DarkMatterAnomalyData, deltaTime: number): void {
        // Animate core
        anomaly.core.pulsePhase += deltaTime * 0.5;
        const corePulse: number = 1.0 + 0.1 * Math.sin(anomaly.core.pulsePhase);
        anomaly.core.mesh.scale.set(corePulse, corePulse, corePulse);

        // Animate rings
        anomaly.rings.forEach((ring: RingData) => {
            // Rotate along custom axis
            const rotationMatrix = new THREE.Matrix4().makeRotationAxis(
                ring.rotationAxis,
                ring.rotationSpeed * deltaTime
            );
            ring.mesh.applyMatrix4(rotationMatrix);

            // Warp effect
            ring.warpPhase += deltaTime * ring.warpSpeed;
            const warpX: number = 1.0 + 0.1 * Math.sin(ring.warpPhase);
            const warpY: number = 1.0 + 0.1 * Math.sin(ring.warpPhase + Math.PI / 3);
            const warpZ: number = 1.0 + 0.1 * Math.sin(ring.warpPhase + Math.PI * 2 / 3);
            ring.mesh.scale.set(warpX, warpY, warpZ);
        });

        // Animate particles
        const positions = anomaly.particles.positions;
        const initialPositions = anomaly.particles.initialPositions;
        const phases = anomaly.particles.phases;

        for (let i = 0; i < positions.length / 3; i++) {
            const i3: number = i * 3;

            // Update phase
            phases[i] += deltaTime;

            // Create gravitational distortion effect
            const dist: number = Math.sqrt(
                initialPositions[i3] * initialPositions[i3] +
                initialPositions[i3 + 1] * initialPositions[i3 + 1] +
                initialPositions[i3 + 2] * initialPositions[i3 + 2]
            );

            const orbitSpeed: number = 0.5 + (300 / (dist + 10)); // Faster closer to center
            phases[i] += deltaTime * orbitSpeed;

            // Create orbiting motion with radial oscillation
            const radialPulse: number = 1.0 + 0.2 * Math.sin(phases[i] * 0.5);

            // Apply the distortion
            const pos = new THREE.Vector3(
                initialPositions[i3],
                initialPositions[i3 + 1],
                initialPositions[i3 + 2]
            );

            // Rotate based on phase
            const rotY: number = phases[i] * 0.2;
            const rotZ: number = phases[i] * 0.1;

            pos.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotY);
            pos.applyAxisAngle(new THREE.Vector3(0, 0, 1), rotZ);

            // Apply radial pulse
            pos.multiplyScalar(radialPulse);

            positions[i3] = pos.x;
            positions[i3 + 1] = pos.y;
            positions[i3 + 2] = pos.z;
        }

        // Update the geometry
        (anomaly.particles.mesh.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    }

    cleanup(anomaly: DarkMatterAnomalyData): void {
        // Clean up core, rings, and particles
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
        if (anomaly.particles && anomaly.particles.mesh) {
            if (anomaly.particles.mesh.geometry) anomaly.particles.mesh.geometry.dispose();
            if (anomaly.particles.mesh.material) {
                if (Array.isArray(anomaly.particles.mesh.material)) {
                    anomaly.particles.mesh.material.forEach((m: THREE.Material) => m.dispose());
                } else {
                    (anomaly.particles.mesh.material as THREE.Material).dispose();
                }
            }
        }
    }
}
