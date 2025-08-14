// vortex.js - Vortex anomaly with spiraling rings

import * as THREE from 'three';

export class VortexAnomaly {
    constructor(scene, anomalyScale = 4, orbScale = 4) {
        this.scene = scene;
        this.anomalyScale = anomalyScale;
        this.orbScale = orbScale;
    }

    create(position, createEnergyOrbCallback, getRandomOrbRarityCallback, addToSceneCallback) {
        // Create a spiraling vortex structure with central orb
        const anomalyGroup = new THREE.Group();
        anomalyGroup.position.copy(position);
        
        // Apply scale to make anomaly 4x bigger
        anomalyGroup.scale.set(this.anomalyScale, this.anomalyScale, this.anomalyScale);
        
        // Create the structural elements - spiral rings
        const ringCount = 6;
        const rings = [];
        
        // Create multiple rings with decreasing radius
        for (let i = 0; i < ringCount; i++) {
            const radius = 400 - (i * 50);
            const geometry = new THREE.TorusGeometry(radius, 15, 16, 100); // Increased tube radius from 10 to 15
            
            // Bright blue-cyan color scheme for better visibility
            const hue = 0.5 + (i * 0.05); // Blue to cyan gradient
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
        const orbRarity = getRandomOrbRarityCallback();
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

    update(anomaly, deltaTime) {
        // Rotate each ring
        anomaly.rings.forEach(ring => {
            ring.mesh.rotation.x += ring.rotationSpeed.x * deltaTime;
            ring.mesh.rotation.y += ring.rotationSpeed.y * deltaTime;
            ring.mesh.rotation.z += ring.rotationSpeed.z * deltaTime;
        });
    }

    cleanup(anomaly) {
        // Clean up rings
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
    }
}