// asteroidBelt.ts - Creates and manages the asteroid belt

import {
  Mesh,
  Scene,
  BufferGeometry,
  IcosahedronGeometry,
  TetrahedronGeometry,
  OctahedronGeometry,
  Vector3,
  Color,
  MeshStandardMaterial,
} from 'three';
import { createGameEntity, removeGameEntity } from '../../ecs/world';
import { Position, Asteroid as AsteroidTag } from '../../ecs/components';
import { addAsteroid } from '../../ecs/systems/index';

type ResourceType = 'iron' | 'gold' | 'platinum';

interface ResourceMultipliers {
    iron: number;
    gold: number;
    platinum: number;
}

interface AsteroidRotationSpeed {
    x: number;
    y: number;
    z: number;
}

interface AsteroidData {
    mesh: Mesh;
    eid: number;
    size: number;
    orbitSpeed: number;
    orbitRadius: number;
    orbitAngle: number;
    orbitTilt: number;
    initialHeight: number;
    rotationSpeed: AsteroidRotationSpeed;
    resourceType: ResourceType | null;
    baseResourceAmount: number;
    resourceAmount: number;
    maxResourceAmount: number;
    minable: boolean;
}

interface AsteroidSystemParams {
    asteroidDensity?: number;
    resourceMultipliers?: ResourceMultipliers;
}

export class AsteroidBelt {
    scene: Scene;
    asteroids: AsteroidData[];
    innerRadius: number;
    outerRadius: number;
    width: number;
    resourceMultipliers: ResourceMultipliers;

    constructor(scene: Scene) {
        this.scene = scene;
        this.asteroids = [];
        this.innerRadius = 20000;
        this.outerRadius = 28000;
        this.width = 1800;
        this.resourceMultipliers = { iron: 1.0, gold: 1.0, platinum: 1.0 };

        this.createAsteroidBelt();
    }

    createAsteroidBelt(): void {
        const asteroidCount = 1000;

        for (let i = 0; i < asteroidCount; i++) {
            // Random asteroid size - Much larger for better visibility
            const size = Math.random() * 120 + 120; // Dramatically increased size for visibility

            // Use different geometries for variety
            let geometry: BufferGeometry;
            const type = Math.floor(Math.random() * 3);
            if (type === 0) {
                geometry = new IcosahedronGeometry(size, 0);
            } else if (type === 1) {
                geometry = new TetrahedronGeometry(size, 0);
            } else {
                geometry = new OctahedronGeometry(size, 0);
            }

            // Deform the geometry to make it look more like an asteroid
            const positions = geometry.attributes.position;
            for (let j = 0; j < positions.count; j++) {
                const vertex = new Vector3();
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
            const color = new Color();
            const resourceRoll = Math.random();
            let resourceType: ResourceType | null = null;

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
            const material = new MeshStandardMaterial({
                color: color,
                roughness: 0.6 + Math.random() * 0.2, // Reduced roughness
                metalness: 0.4 + Math.random() * 0.4, // Increased metalness
                flatShading: true,
                emissive: color.clone().multiplyScalar(0.3), // Add emissive glow
                emissiveIntensity: 0.2 // Subtle glow for better visibility
            });

            // Create the mesh
            const mesh = new Mesh(geometry, material);

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
            const orbitSpeed = 0.00005 + Math.random() * 0.00005; // Realistic asteroid orbital speed
            const orbitRadius = radius; // Use initial radius

            // Add random orbital tilt
            const orbitTilt = Math.random() * Math.PI * 0.15; // Reduced to ~27 degrees max tilt

            // Add to scene
            this.scene.add(mesh);

            // Create bitECS entity for the radar and other systems
            const eid = createGameEntity();
            AsteroidTag.tag[eid] = 1;
            
            Position.x[eid] = mesh.position.x;
            Position.y[eid] = mesh.position.y;
            Position.z[eid] = mesh.position.z;
            
            addAsteroid(eid);

            // Add to asteroids array with metadata
            const baseResourceAmount = 50 + Math.random() * 50; // Base amount before multipliers
            this.asteroids.push({
                mesh: mesh,
                eid: eid, // Store entity ID
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

    getRegionInfo(): { center: Vector3; innerRadius: number; outerRadius: number } {
        return {
            center: new Vector3(0, 0, 0),
            innerRadius: this.innerRadius,
            outerRadius: this.outerRadius
        };
    }

    getAsteroids(): AsteroidData[] {
        return this.asteroids;
    }

    // Set resource multipliers based on the current star system
    setResourceMultipliers(multipliers?: ResourceMultipliers): void {
        if (!multipliers) return;
        this.resourceMultipliers = multipliers;

        // Update existing asteroids with new resource distributions
        this.updateAsteroidResources();
        console.log("Updated asteroid belt with resource multipliers:", multipliers);
    }

    // Update asteroid resources based on current system
    updateAsteroidResources(): void {
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
    updateForSystem(params?: AsteroidSystemParams): void {
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
    updateDensity(densityMultiplier: number = 1.0): void {
        if (densityMultiplier < 0.5) densityMultiplier = 0.5; // Minimum density
        if (densityMultiplier > 3.0) densityMultiplier = 3.0; // Maximum density

        // Adjust asteroid visibility based on density
        this.asteroids.forEach((asteroid, index) => {
            // Use index to ensure consistent visibility
            const shouldBeVisible = (index % 10) < (densityMultiplier * 5);
            asteroid.mesh.visible = shouldBeVisible;
            // Also update the minable flag to prevent targeting invisible asteroids
            asteroid.minable = shouldBeVisible;
        });
    }

    // Helper function to find the closest asteroid to a point (for mining)
    findClosestAsteroid(position: Vector3, maxDistance: number = 1600): AsteroidData | null {
        let closestAsteroid: AsteroidData | null = null;
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

    removeAsteroid(asteroid: AsteroidData): void {
        // Remove from bitECS
        removeGameEntity(asteroid.eid);

        // Remove the asteroid from the scene
        this.scene.remove(asteroid.mesh);

        // Properly dispose of geometry and material to prevent memory leaks
        if (asteroid.mesh.geometry) {
            asteroid.mesh.geometry.dispose();
        }

        const material = asteroid.mesh.material;
        if (material) {
            // Dispose of textures if they exist
            if (Array.isArray(material)) {
                material.forEach(mat => {
                    if ((mat as MeshStandardMaterial).map) (mat as MeshStandardMaterial).map?.dispose();
                    if ((mat as MeshStandardMaterial).emissiveMap) (mat as MeshStandardMaterial).emissiveMap?.dispose();
                    if ((mat as MeshStandardMaterial).normalMap) (mat as MeshStandardMaterial).normalMap?.dispose();
                    if ((mat as MeshStandardMaterial).roughnessMap) (mat as MeshStandardMaterial).roughnessMap?.dispose();
                    if ((mat as MeshStandardMaterial).metalnessMap) (mat as MeshStandardMaterial).metalnessMap?.dispose();
                    mat.dispose();
                });
            } else {
                const mat = material as MeshStandardMaterial;
                mat.map?.dispose();
                mat.emissiveMap?.dispose();
                mat.normalMap?.dispose();
                mat.roughnessMap?.dispose();
                mat.metalnessMap?.dispose();
                mat.dispose();
            }
        }

        // Remove from asteroid array
        const index = this.asteroids.findIndex(a => a === asteroid);
        if (index !== -1) {
            this.asteroids.splice(index, 1);
        }
    }

    update(deltaTime: number = 0.016): void {
        void deltaTime;
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

            // Sync bitECS position for radar
            Position.x[asteroid.eid] = asteroid.mesh.position.x;
            Position.y[asteroid.eid] = asteroid.mesh.position.y;
            Position.z[asteroid.eid] = asteroid.mesh.position.z;
        });
    }

    // Clean up all asteroids (for system transitions)
    dispose(): void {
        // Remove and dispose of all asteroids
        while (this.asteroids.length > 0) {
            const asteroid = this.asteroids[0];
            this.removeAsteroid(asteroid);
        }

        // Clear the array completely
        this.asteroids = [];
    }
}
