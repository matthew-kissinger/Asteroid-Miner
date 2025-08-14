// darkMatter.js - Dark matter anomaly with gravitational lensing effects

import * as THREE from 'three';

export class DarkMatterAnomaly {
    constructor(scene, anomalyScale = 4, orbScale = 4) {
        this.scene = scene;
        this.anomalyScale = anomalyScale;
        this.orbScale = orbScale;
    }

    create(position, createEnergyOrbCallback, getRandomOrbRarityCallback, addToSceneCallback) {
        // Create a dark matter anomaly with gravitational lensing effects
        const anomalyGroup = new THREE.Group();
        anomalyGroup.position.copy(position);
        
        // Apply scale to make anomaly 4x bigger
        anomalyGroup.scale.set(this.anomalyScale, this.anomalyScale, this.anomalyScale);
        
        // Create the dark matter core - a sphere with dark, distortion-like material
        const coreRadius = 100;
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
        const rings = [];
        const ringCount = 4;
        
        for (let i = 0; i < ringCount; i++) {
            const radius = 150 + i * 60;
            const tubeRadius = 4 + i * 2;
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
        const particleCount = 300;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        const particleSizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Distribute particles in a spherical shell
            const radius = 120 + Math.random() * 250;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
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
        const orbRarity = getRandomOrbRarityCallback();
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
                phases: Array(particleCount).fill().map(() => Math.random() * Math.PI * 2)
            },
            orb: orb,
            collisionRadius: 200, // Overall collision size
            orbCollected: false,
            rotationSpeed: new THREE.Vector3(0.0002, 0.0003, 0.0001)
        };
    }

    update(anomaly, deltaTime) {
        // Animate core
        anomaly.core.pulsePhase += deltaTime * 0.5;
        const corePulse = 1.0 + 0.1 * Math.sin(anomaly.core.pulsePhase);
        anomaly.core.mesh.scale.set(corePulse, corePulse, corePulse);
        
        // Animate rings
        anomaly.rings.forEach(ring => {
            // Rotate along custom axis
            const rotationMatrix = new THREE.Matrix4().makeRotationAxis(
                ring.rotationAxis,
                ring.rotationSpeed * deltaTime
            );
            ring.mesh.applyMatrix4(rotationMatrix);
            
            // Warp effect
            ring.warpPhase += deltaTime * ring.warpSpeed;
            const warpX = 1.0 + 0.1 * Math.sin(ring.warpPhase);
            const warpY = 1.0 + 0.1 * Math.sin(ring.warpPhase + Math.PI/3);
            const warpZ = 1.0 + 0.1 * Math.sin(ring.warpPhase + Math.PI*2/3);
            ring.mesh.scale.set(warpX, warpY, warpZ);
        });
        
        // Animate particles
        const positions = anomaly.particles.positions;
        const initialPositions = anomaly.particles.initialPositions;
        const phases = anomaly.particles.phases;
        
        for (let i = 0; i < positions.length / 3; i++) {
            const i3 = i * 3;
            
            // Update phase
            phases[i] += deltaTime;
            
            // Create gravitational distortion effect
            const dist = Math.sqrt(
                initialPositions[i3] * initialPositions[i3] +
                initialPositions[i3 + 1] * initialPositions[i3 + 1] +
                initialPositions[i3 + 2] * initialPositions[i3 + 2]
            );
            
            const orbitSpeed = 0.5 + (300 / (dist + 10)); // Faster closer to center
            phases[i] += deltaTime * orbitSpeed;
            
            // Create orbiting motion with radial oscillation
            const radialPulse = 1.0 + 0.2 * Math.sin(phases[i] * 0.5);
            
            // Apply the distortion
            const pos = new THREE.Vector3(
                initialPositions[i3],
                initialPositions[i3 + 1],
                initialPositions[i3 + 2]
            );
            
            // Rotate based on phase
            const rotY = phases[i] * 0.2;
            const rotZ = phases[i] * 0.1;
            
            pos.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotY);
            pos.applyAxisAngle(new THREE.Vector3(0, 0, 1), rotZ);
            
            // Apply radial pulse
            pos.multiplyScalar(radialPulse);
            
            positions[i3] = pos.x;
            positions[i3 + 1] = pos.y;
            positions[i3 + 2] = pos.z;
        }
        
        // Update the geometry
        anomaly.particles.mesh.geometry.attributes.position.needsUpdate = true;
    }

    cleanup(anomaly) {
        // Clean up core, rings, and particles
        if (anomaly.core && anomaly.core.mesh) {
            if (anomaly.core.mesh.geometry) anomaly.core.mesh.geometry.dispose();
            if (anomaly.core.mesh.material) {
                if (Array.isArray(anomaly.core.mesh.material)) {
                    anomaly.core.mesh.material.forEach(m => m.dispose());
                } else {
                    anomaly.core.mesh.material.dispose();
                }
            }
        }
        if (anomaly.rings) {
            anomaly.rings.forEach(ring => {
                if (ring.mesh && ring.mesh.geometry) {
                    ring.mesh.geometry.dispose();
                }
                if (ring.mesh && ring.mesh.material) {
                    if (Array.isArray(ring.mesh.material)) {
                        ring.mesh.material.forEach(m => m.dispose());
                    } else {
                        ring.mesh.material.dispose();
                    }
                }
            });
        }
        if (anomaly.particles && anomaly.particles.mesh) {
            if (anomaly.particles.mesh.geometry) anomaly.particles.mesh.geometry.dispose();
            if (anomaly.particles.mesh.material) {
                if (Array.isArray(anomaly.particles.mesh.material)) {
                    anomaly.particles.mesh.material.forEach(m => m.dispose());
                } else {
                    anomaly.particles.mesh.material.dispose();
                }
            }
        }
    }
}