// crystalCluster.js - Crystal cluster anomaly with floating crystals

import * as THREE from 'three';

export class CrystalClusterAnomaly {
    constructor(scene, anomalyScale = 4, orbScale = 4) {
        this.scene = scene;
        this.anomalyScale = anomalyScale;
        this.orbScale = orbScale;
    }

    create(position, createEnergyOrbCallback, getRandomOrbRarityCallback, addToSceneCallback) {
        // Create a crystalline structure with floating crystals and central orb
        const anomalyGroup = new THREE.Group();
        anomalyGroup.position.copy(position);
        
        // Apply scale to make anomaly 4x bigger
        anomalyGroup.scale.set(this.anomalyScale, this.anomalyScale, this.anomalyScale);
        
        // Create main crystal structure using multiple crystal forms
        const crystals = [];
        const crystalCount = 20;
        
        for (let i = 0; i < crystalCount; i++) {
            // Random crystal size
            const size = 50 + Math.random() * 100; // Increased from 30+80 to 50+100
            
            // Create crystal geometry - mix of different polyhedra
            let geometry;
            const crystalType = Math.floor(Math.random() * 3);
            
            if (crystalType === 0) {
                // Octahedron - diamond-like crystal
                geometry = new THREE.OctahedronGeometry(size, 0);
            } else if (crystalType === 1) {
                // Dodecahedron - more complex crystal
                geometry = new THREE.DodecahedronGeometry(size, 0);
            } else {
                // Prism-like crystal using stretched tetrahedron
                geometry = new THREE.TetrahedronGeometry(size, 0);
                
                // Stretch it to make it more crystal-like
                const positions = geometry.attributes.position;
                for (let j = 0; j < positions.count; j++) {
                    const vertex = new THREE.Vector3();
                    vertex.fromBufferAttribute(positions, j);
                    
                    // Stretch along one axis
                    vertex.y *= 2.5;
                    
                    positions.setXYZ(j, vertex.x, vertex.y, vertex.z);
                }
                geometry.computeVertexNormals();
            }
            
            // Create a semi-transparent crystalline material with bright teal colors
            const hue = 0.45 + Math.random() * 0.1; // Teal/aqua/green color palette
            const saturation = 0.9 + Math.random() * 0.1; // Increased saturation
            const lightness = 0.6 + Math.random() * 0.2; // Increased lightness
            
            const color = new THREE.Color().setHSL(hue, saturation, lightness);
            
            const material = new THREE.MeshStandardMaterial({
                color: color,
                metalness: 0.9,
                roughness: 0.1,
                transparent: true,
                opacity: 0.9,
                emissive: color.clone(),
                emissiveIntensity: 0.5
            });
            
            const crystal = new THREE.Mesh(geometry, material);
            
            // Position crystal in a spherical arrangement
            const radius = 200 + Math.random() * 100;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            crystal.position.set(
                radius * Math.sin(phi) * Math.cos(theta),
                radius * Math.sin(phi) * Math.sin(theta),
                radius * Math.cos(phi)
            );
            
            // Random rotation
            crystal.rotation.set(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            );
            
            anomalyGroup.add(crystal);
            
            // Store crystal data for animation
            crystals.push({
                mesh: crystal,
                initialPosition: crystal.position.clone(),
                floatPhase: Math.random() * Math.PI * 2,
                floatSpeed: 0.3 + Math.random() * 0.3,
                floatAmplitude: 5 + Math.random() * 10,
                rotationSpeed: {
                    x: (Math.random() - 0.5) * 0.01,
                    y: (Math.random() - 0.5) * 0.01,
                    z: (Math.random() - 0.5) * 0.01
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
            type: 'crystalCluster',
            mesh: anomalyGroup,
            position: position.clone(),
            crystals: crystals,
            orb: orb,
            collisionRadius: 300, // Overall collision size
            orbCollected: false,
            rotationSpeed: new THREE.Vector3(0.0005, 0.001, 0.0005)
        };
    }

    update(anomaly, deltaTime) {
        // Animate floating crystals
        anomaly.crystals.forEach(crystal => {
            // Update float phase
            crystal.floatPhase += deltaTime * crystal.floatSpeed;
            
            // Create floating motion
            const floatOffset = Math.sin(crystal.floatPhase) * crystal.floatAmplitude;
            crystal.mesh.position.y = crystal.initialPosition.y + floatOffset;
            
            // Rotate the crystal
            crystal.mesh.rotation.x += crystal.rotationSpeed.x;
            crystal.mesh.rotation.y += crystal.rotationSpeed.y;
            crystal.mesh.rotation.z += crystal.rotationSpeed.z;
        });
    }

    cleanup(anomaly) {
        // Clean up crystals
        if (anomaly.crystals) {
            anomaly.crystals.forEach(crystal => {
                if (crystal.mesh && crystal.mesh.geometry) {
                    crystal.mesh.geometry.dispose();
                }
                if (crystal.mesh && crystal.mesh.material) {
                    if (Array.isArray(crystal.mesh.material)) {
                        crystal.mesh.material.forEach(m => m.dispose());
                    } else {
                        crystal.mesh.material.dispose();
                    }
                }
            });
        }
    }
}