// asteroidBelt.js - Creates and manages the asteroid belt

import * as THREE from 'three';

export class AsteroidBelt {
    constructor(scene) {
        this.scene = scene;
        this.asteroids = [];
        this.innerRadius = 20000;
        this.outerRadius = 28000;
        this.width = 1800;
        this.resourceMultipliers = { iron: 1.0, gold: 1.0, platinum: 1.0 };
        
        this.createAsteroidBelt();
    }
    
    createAsteroidBelt() {
        const asteroidCount = 1000;
        
        for (let i = 0; i < asteroidCount; i++) {
            // Random asteroid size - Much larger for better visibility
            const size = Math.random() * 120 + 120; // Dramatically increased size for visibility
            
            // Use different geometries for variety
            let geometry;
            const type = Math.floor(Math.random() * 3);
            if (type === 0) {
                geometry = new THREE.IcosahedronGeometry(size, 0);
            } else if (type === 1) {
                geometry = new THREE.TetrahedronGeometry(size, 0);
            } else {
                geometry = new THREE.OctahedronGeometry(size, 0);
            }
            
            // Deform the geometry to make it look more like an asteroid
            const positions = geometry.attributes.position;
            for (let j = 0; j < positions.count; j++) {
                const vertex = new THREE.Vector3();
                vertex.fromBufferAttribute(positions, j);
                
                // Add some random bumps
                vertex.x += (Math.random() - 0.5) * 0.4 * size;
                vertex.y += (Math.random() - 0.5) * 0.4 * size;
                vertex.z += (Math.random() - 0.5) * 0.4 * size;
                
                positions.setXYZ(j, vertex.x, vertex.y, vertex.z);
            }
            
            // Update geometry
            geometry.computeVertexNormals();
            
            // Material with different color variations - brighter for better visibility
            const color = new THREE.Color();
            const resourceRoll = Math.random();
            let resourceType = null;
            
            // Determine resource type based on probability
            if (resourceRoll < 0.7) {
                // 70% iron asteroids (common) - brightened
                color.setHSL(0.02, 0.30, 0.35 + Math.random() * 0.2); // Much brighter
                resourceType = 'iron';
            } else if (resourceRoll < 0.93) {
                // 23% gold asteroids (uncommon) - brightened
                color.setHSL(0.12, 0.7, 0.5 + Math.random() * 0.2); // Much brighter
                resourceType = 'gold';
            } else {
                // 7% platinum asteroids (rare) - brightened
                color.setHSL(0.1, 0.3, 0.7 + Math.random() * 0.15); // Much brighter
                resourceType = 'platinum';
            }
            
            // Enhanced material with higher emissive properties for better visibility
            const material = new THREE.MeshStandardMaterial({
                color: color,
                roughness: 0.6 + Math.random() * 0.2, // Reduced roughness
                metalness: 0.4 + Math.random() * 0.4, // Increased metalness
                flatShading: true,
                emissive: color.clone().multiplyScalar(0.3), // Add emissive glow
                emissiveIntensity: 0.2 // Subtle glow for better visibility
            });
            
            // Create the mesh
            const mesh = new THREE.Mesh(geometry, material);
            
            // Position in asteroid belt with variation using torus pattern
            const angle = Math.random() * Math.PI * 2;
            const radius = this.innerRadius + Math.random() * (this.outerRadius - this.innerRadius);
            const heightVariation = (Math.random() - 0.5) * this.width;
            
            mesh.position.set(
                Math.cos(angle) * radius,
                heightVariation,
                Math.sin(angle) * radius
            );
            
            // Apply random axial tilt (rotation on local axis)
            mesh.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            // Setup orbital parameters
            const orbitSpeed = 0.0001 + Math.random() * 0.0001; // Slow orbit
            const orbitRadius = radius; // Use initial radius
            
            // Add random orbital tilt
            const orbitTilt = Math.random() * Math.PI * 0.15; // Reduced to ~27 degrees max tilt
            
            // Add to scene
            this.scene.add(mesh);
            
            // Add to asteroids array with metadata
            const baseResourceAmount = 50 + Math.random() * 50; // Base amount before multipliers
            this.asteroids.push({
                mesh: mesh,
                size: size,
                orbitSpeed: orbitSpeed,
                orbitRadius: orbitRadius,
                orbitAngle: angle,
                orbitTilt: orbitTilt,
                initialHeight: heightVariation, // Store initial height variation
                rotationSpeed: {
                    x: (Math.random() - 0.5) * 0.005,
                    y: (Math.random() - 0.5) * 0.005,
                    z: (Math.random() - 0.5) * 0.005
                },
                resourceType: resourceType,
                baseResourceAmount: baseResourceAmount, // Base amount
                resourceAmount: baseResourceAmount, // Current amount
                maxResourceAmount: baseResourceAmount, // Max capacity
                minable: true
            });
        }
    }
    
    getRegionInfo() {
        return {
            center: new THREE.Vector3(0, 0, 0),
            innerRadius: this.innerRadius,
            outerRadius: this.outerRadius
        };
    }
    
    getAsteroids() {
        return this.asteroids;
    }
    
    // Set resource multipliers based on the current star system
    setResourceMultipliers(multipliers) {
        if (!multipliers) return;
        this.resourceMultipliers = multipliers;
        
        // Update existing asteroids with new resource distributions
        this.updateAsteroidResources();
        console.log("Updated asteroid belt with resource multipliers:", multipliers);
    }
    
    // Update asteroid resources based on current system
    updateAsteroidResources() {
        this.asteroids.forEach(asteroid => {
            if (asteroid.resourceType) {
                // Apply system-specific multipliers to resource amounts
                switch (asteroid.resourceType) {
                    case 'iron':
                        asteroid.resourceAmount = asteroid.baseResourceAmount * this.resourceMultipliers.iron;
                        break;
                    case 'gold':
                        asteroid.resourceAmount = asteroid.baseResourceAmount * this.resourceMultipliers.gold;
                        break;
                    case 'platinum':
                        asteroid.resourceAmount = asteroid.baseResourceAmount * this.resourceMultipliers.platinum;
                        break;
                }
            }
        });
    }
    
    // Update asteroid density based on system characteristics
    updateForSystem(params) {
        if (!params) return;
        
        // Update density if provided
        if (params.asteroidDensity) {
            this.updateDensity(params.asteroidDensity);
        }
        
        // Update resource distribution if provided
        if (params.resourceMultipliers) {
            this.setResourceMultipliers(params.resourceMultipliers);
        }
    }
    
    // Update asteroid density
    updateDensity(densityMultiplier = 1.0) {
        if (densityMultiplier < 0.5) densityMultiplier = 0.5; // Minimum density
        if (densityMultiplier > 3.0) densityMultiplier = 3.0; // Maximum density
        
        // Adjust asteroid visibility based on density
        this.asteroids.forEach((asteroid, index) => {
            // Use index to ensure consistent visibility
            const shouldBeVisible = (index % 10) < (densityMultiplier * 5);
            asteroid.mesh.visible = shouldBeVisible;
        });
    }
    
    // Helper function to find the closest asteroid to a point (for mining)
    findClosestAsteroid(position, maxDistance = 1600) {
        let closestAsteroid = null;
        let closestDistance = maxDistance;
        
        this.asteroids.forEach(asteroid => {
            // Skip asteroids that aren't minable or visible
            if (!asteroid.minable || !asteroid.mesh.visible) return;
            
            const distance = position.distanceTo(asteroid.mesh.position);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestAsteroid = asteroid;
            }
        });
        
        return closestAsteroid;
    }
    
    removeAsteroid(asteroid) {
        // Remove the asteroid from the scene
        this.scene.remove(asteroid.mesh);
        
        // Remove from asteroid array
        const index = this.asteroids.findIndex(a => a === asteroid);
        if (index !== -1) {
            this.asteroids.splice(index, 1);
        }
    }
    
    update() {
        // Update asteroid positions and rotations with orbital tilt
        this.asteroids.forEach(asteroid => {
            // Rotate the asteroid (axial rotation)
            asteroid.mesh.rotation.x += asteroid.rotationSpeed.x;
            asteroid.mesh.rotation.y += asteroid.rotationSpeed.y;
            asteroid.mesh.rotation.z += asteroid.rotationSpeed.z;
            
            // Orbit around sun with tilt
            asteroid.orbitAngle += asteroid.orbitSpeed;
            
            // Calculate orbit position with tilt
            const flatX = Math.cos(asteroid.orbitAngle) * asteroid.orbitRadius;
            const flatZ = Math.sin(asteroid.orbitAngle) * asteroid.orbitRadius;
            
            // Apply orbit tilt if it exists
            if (asteroid.orbitTilt) {
                // Apply orbital tilt by rotating the position around the X axis
                const tiltY = flatZ * Math.sin(asteroid.orbitTilt);
                const tiltZ = flatZ * Math.cos(asteroid.orbitTilt);
                
                asteroid.mesh.position.x = flatX;
                asteroid.mesh.position.z = tiltZ;
                asteroid.mesh.position.y = tiltY + asteroid.initialHeight; // Use stored initial height variation
            } else {
                // Regular orbit
                asteroid.mesh.position.x = flatX;
                asteroid.mesh.position.z = flatZ;
                asteroid.mesh.position.y = asteroid.initialHeight;
            }
        });
    }
}