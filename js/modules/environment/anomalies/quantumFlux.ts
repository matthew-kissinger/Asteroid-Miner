// quantumFlux.ts - Quantum flux anomaly with rotating cube frames

import * as THREE from 'three';

interface FrameData {
    mesh: THREE.LineSegments;
    innerBox: THREE.Mesh;
    rotationAxis: THREE.Vector3;
    rotationSpeed: number;
    pulsePhase: number;
}

interface ParticleData {
    mesh: THREE.Points;
    positions: Float32Array;
    initialPositions: Float32Array;
    velocities: THREE.Vector3[];
}

interface EnergyOrbData {
    mesh: THREE.Sprite | THREE.Mesh;
}

interface QuantumFluxAnomalyData {
    type: 'quantumFlux';
    mesh: THREE.Group;
    position: THREE.Vector3;
    frames: FrameData[];
    particles: ParticleData;
    orb: EnergyOrbData;
    collisionRadius: number;
    orbCollected: boolean;
    rotationSpeed: THREE.Vector3;
}

export class QuantumFluxAnomaly {
    private anomalyScale: number;

    constructor(_scene: THREE.Scene, anomalyScale: number = 4, _orbScale: number = 4) {
        this.anomalyScale = anomalyScale;
    }

    create(
        position: THREE.Vector3,
        createEnergyOrbCallback: (rarity: string) => EnergyOrbData,
        getRandomOrbRarityCallback: () => string,
        addToSceneCallback: (object: THREE.Object3D) => void
    ): QuantumFluxAnomalyData {
        // Create a quantum flux anomaly with rotating cube frames
        const anomalyGroup = new THREE.Group();
        anomalyGroup.position.copy(position);

        // Apply scale to make anomaly 4x bigger
        anomalyGroup.scale.set(this.anomalyScale, this.anomalyScale, this.anomalyScale);

        // Create rotating cubic frames
        const frames: FrameData[] = [];
        const frameCount: number = 5;

        for (let i = 0; i < frameCount; i++) {
            // Create cubic wireframe box
            const size: number = 250 - i * 40;
            const geometry = new THREE.BoxGeometry(size, size, size);

            // Add a solid but transparent box inside the wireframe for better visibility
            const innerGeometry = new THREE.BoxGeometry(size * 0.98, size * 0.98, size * 0.98);

            // Extract only edges to create wireframe
            const edges = new THREE.EdgesGeometry(geometry);

            // Use extremely vibrant electric colors
            const hue: number = 0.3 + i * 0.1; // Shift from green to blue
            const color = new THREE.Color().setHSL(hue, 1.0, 0.6);

            const material = new THREE.LineBasicMaterial({
                color: color,
                linewidth: 2,
                transparent: false, // Changed to non-transparent for better visibility
                opacity: 1.0
            });

            // Inner box with semi-transparent material
            const innerMaterial = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.1,
                side: THREE.DoubleSide
            });

            const frame = new THREE.LineSegments(edges, material);
            const innerBox = new THREE.Mesh(innerGeometry, innerMaterial);

            // Add both to group and store for animation
            anomalyGroup.add(frame);
            anomalyGroup.add(innerBox);

            frames.push({
                mesh: frame,
                innerBox: innerBox,
                rotationAxis: new THREE.Vector3(
                    Math.random() - 0.5,
                    Math.random() - 0.5,
                    Math.random() - 0.5
                ).normalize(),
                rotationSpeed: 0.01 + i * 0.005,
                pulsePhase: Math.random() * Math.PI * 2
            });
        }

        // Add energy particles inside
        const particleCount: number = 200;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        const particleSizes = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            const i3: number = i * 3;

            // Position particles within the inner cube
            const radius: number = 100 * Math.random();
            const theta: number = Math.random() * Math.PI * 2;
            const phi: number = Math.random() * Math.PI;

            particlePositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            particlePositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            particlePositions[i3 + 2] = radius * Math.cos(phi);

            // Vary particle sizes
            particleSizes[i] = 2 + Math.random() * 3;
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));

        const particleMaterial = new THREE.PointsMaterial({
            color: 0xff00ff, // Magenta
            size: 6,
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.9
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
            type: 'quantumFlux',
            mesh: anomalyGroup,
            position: position.clone(),
            frames: frames,
            particles: {
                mesh: particles,
                positions: particlePositions,
                initialPositions: particlePositions.slice(), // Clone for reference
                velocities: Array(particleCount).fill(null).map(() => new THREE.Vector3(
                    (Math.random() - 0.5) * 0.5,
                    (Math.random() - 0.5) * 0.5,
                    (Math.random() - 0.5) * 0.5
                ))
            },
            orb: orb,
            collisionRadius: 230, // Overall collision size
            orbCollected: false,
            rotationSpeed: new THREE.Vector3(0.0001, 0.0002, 0.0001)
        };
    }

    update(anomaly: QuantumFluxAnomalyData, deltaTime: number): void {
        // Animate rotating frames
        anomaly.frames.forEach((frame: FrameData) => {
            // Rotate around custom axis
            const rotationMatrix = new THREE.Matrix4().makeRotationAxis(
                frame.rotationAxis,
                frame.rotationSpeed * deltaTime
            );
            frame.mesh.applyMatrix4(rotationMatrix);

            // Also rotate the inner box if it exists
            if (frame.innerBox) {
                frame.innerBox.applyMatrix4(rotationMatrix);
            }

            // Pulse effect
            frame.pulsePhase += deltaTime;
            const pulseScale: number = 1.0 + 0.05 * Math.sin(frame.pulsePhase);
            frame.mesh.scale.set(pulseScale, pulseScale, pulseScale);

            // Also pulse the inner box if it exists
            if (frame.innerBox) {
                frame.innerBox.scale.set(pulseScale, pulseScale, pulseScale);
            }
        });

        // Animate particles
        const positions = anomaly.particles.positions;
        const velocities = anomaly.particles.velocities;

        for (let i = 0; i < positions.length / 3; i++) {
            const i3: number = i * 3;

            // Update position based on velocity
            positions[i3] += velocities[i].x;
            positions[i3 + 1] += velocities[i].y;
            positions[i3 + 2] += velocities[i].z;

            // Contain particles within the inner cube
            const maxDist: number = 120;
            const pos = new THREE.Vector3(positions[i3], positions[i3 + 1], positions[i3 + 2]);

            if (pos.length() > maxDist) {
                // Reflect particles at boundary
                pos.normalize().multiplyScalar(maxDist);
                positions[i3] = pos.x;
                positions[i3 + 1] = pos.y;
                positions[i3 + 2] = pos.z;

                // Reflect velocity
                velocities[i].reflect(pos.normalize());
            }
        }

        // Update the geometry
        (anomaly.particles.mesh.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    }

    cleanup(anomaly: QuantumFluxAnomalyData): void {
        // Clean up frames and particles
        if (anomaly.frames) {
            anomaly.frames.forEach((frame: FrameData) => {
                if (frame.mesh && frame.mesh.geometry) {
                    frame.mesh.geometry.dispose();
                }
                if (frame.mesh && frame.mesh.material) {
                    if (Array.isArray(frame.mesh.material)) {
                        frame.mesh.material.forEach((m: THREE.Material) => m.dispose());
                    } else {
                        (frame.mesh.material as THREE.Material).dispose();
                    }
                }
                if (frame.innerBox) {
                    if (frame.innerBox.geometry) frame.innerBox.geometry.dispose();
                    if (frame.innerBox.material) {
                        if (Array.isArray(frame.innerBox.material)) {
                            frame.innerBox.material.forEach((m: THREE.Material) => m.dispose());
                        } else {
                            (frame.innerBox.material as THREE.Material).dispose();
                        }
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
