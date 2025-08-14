/**
 * Spaceship entity factory
 * 
 * Creates a player spaceship entity with all required components.
 */

import { TransformComponent } from '../components/transform.js';
import { RigidbodyComponent } from '../components/physics/rigidbody.js';
import { MeshComponent } from '../components/rendering/mesh.js';
import { ThrusterComponent } from '../components/spaceship/thruster.js';
import { MiningLaserComponent } from '../components/spaceship/miningLaser.js';
import { CargoComponent } from '../components/spaceship/cargo.js';

/**
 * Create a player spaceship entity
 * @param {World} world World to create entity in
 * @param {THREE.Vector3} position Initial position
 * @param {THREE.Scene} scene Three.js scene (for particles)
 * @returns {Entity} The created entity
 */
export function createPlayerShip(world, position, scene) {
    // Create entity
    const ship = world.createEntity('player');
    
    // MAKE SURE to tag the entity as a player for enemy targeting
    ship.addTag('player');
    console.log("Player ship created with 'player' tag");
    
    // Add transform component
    const transform = new TransformComponent(position);
    ship.addComponent(transform);
    
    // Add rigidbody component
    const rigidbody = new RigidbodyComponent(1000);  // Mass: 1000 units
    rigidbody.drag = 0.1;                            // Apply space drag
    rigidbody.angularDrag = 0.2;                     // Angular damping
    rigidbody.collisionRadius = 3;                   // Collision radius
    ship.addComponent(rigidbody);
    
    // Create ship geometry
    const shipGeometry = new THREE.Group();
    
    // Main body
    const bodyGeometry = new THREE.CylinderGeometry(0, 2, 8, 8);
    bodyGeometry.rotateX(Math.PI / 2);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x3344aa, 
        specular: 0x111111, 
        shininess: 100 
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    shipGeometry.add(body);
    
    // Cockpit
    const cockpitGeometry = new THREE.SphereGeometry(1.2, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    cockpitGeometry.translate(0, 0, -2.5);
    const cockpitMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x88ccff, 
        specular: 0xffffff, 
        shininess: 200,
        transparent: true,
        opacity: 0.7
    });
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    shipGeometry.add(cockpit);
    
    // Wings
    const wingGeometry = new THREE.BoxGeometry(6, 0.2, 3);
    wingGeometry.translate(0, 0, 1);
    const wingMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x2233aa, 
        specular: 0x111111, 
        shininess: 100 
    });
    const wings = new THREE.Mesh(wingGeometry, wingMaterial);
    shipGeometry.add(wings);
    
    // Add mesh component
    const mesh = new MeshComponent(null, null);
    mesh.mesh = shipGeometry;
    mesh.setCastShadow(true);
    mesh.setReceiveShadow(true);
    ship.addComponent(mesh);
    
    // Add thruster component
    const thruster = new ThrusterComponent(25, 100);
    ship.addComponent(thruster);
    
    // Initialize thruster particles
    if (scene) {
        thruster.initializeParticleEffects(scene);
    }
    
    // Add mining laser component
    const miningLaser = new MiningLaserComponent(1, 50);
    ship.addComponent(miningLaser);
    
    // Initialize mining laser
    if (scene) {
        miningLaser.initializeLaser(scene);
    }
    
    // Add cargo component
    const cargo = new CargoComponent(100);
    ship.addComponent(cargo);
    
    // Add the ship to the scene
    if (scene) {
        scene.add(shipGeometry);
    }
    
    return ship;
}

/**
 * Create a generic asteroid entity
 * @param {World} world World to create entity in
 * @param {THREE.Vector3} position Initial position
 * @param {string} resourceType Resource type (iron, gold, platinum)
 * @param {number} size Asteroid size
 * @param {THREE.Scene} scene Three.js scene
 * @returns {Entity} The created entity
 */
export function createAsteroid(world, position, resourceType, size, scene) {
    // Create entity
    const asteroid = world.createEntity('asteroid');
    
    // Add transform component
    const transform = new TransformComponent(position);
    transform.setScale(size, size, size);
    asteroid.addComponent(transform);
    
    // Add rigidbody component
    const rigidbody = new RigidbodyComponent(size * 100);  // Mass based on size
    rigidbody.drag = 0;                                    // No drag in space
    rigidbody.collisionRadius = size * 2;                  // Collision radius based on size
    asteroid.addComponent(rigidbody);
    
    // Create asteroid geometry with random segments
    const segments = Math.floor(Math.random() * 3) + 5;
    const asteroidGeometry = new THREE.DodecahedronGeometry(2, 0);
    
    // Randomize vertices to make it look more natural
    const positions = asteroidGeometry.getAttribute('position');
    
    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);
        
        // Add noise to vertices, with more distortion further from center
        const distortion = 0.2 + Math.random() * 0.3;
        const length = Math.sqrt(x * x + y * y + z * z);
        const noise = 1 + (Math.random() - 0.5) * distortion;
        
        positions.setXYZ(
            i,
            (x / length) * noise,
            (y / length) * noise,
            (z / length) * noise
        );
    }
    
    // Update geometry normals
    asteroidGeometry.computeVertexNormals();
    
    // Use MeshPhongMaterial for better light response
    let material;
    switch (resourceType) {
        case 'iron':
            material = new THREE.MeshPhongMaterial({ 
                color: 0xA19D94,
                specular: 0x222222,
                shininess: 30,
                emissive: 0x050505,
                emissiveIntensity: 0.02,
                flatShading: true
            });
            break;
        case 'gold':
            material = new THREE.MeshPhongMaterial({ 
                color: 0xFFD700,
                specular: 0xFFFFAA,
                shininess: 100,
                emissive: 0x110500,
                emissiveIntensity: 0.05,
                flatShading: true
            });
            break;
        case 'platinum':
            material = new THREE.MeshPhongMaterial({ 
                color: 0xE5E4E2,
                specular: 0xFFFFFF,
                shininess: 150,
                emissive: 0x0a0a0a,
                emissiveIntensity: 0.03,
                flatShading: true
            });
            break;
        default:
            material = new THREE.MeshPhongMaterial({ 
                color: 0x8A8A8A,
                specular: 0x111111,
                shininess: 20,
                emissive: 0x050505,
                emissiveIntensity: 0.02,
                flatShading: true 
            });
    }
    
    // Add mesh component
    const mesh = new MeshComponent(asteroidGeometry, material);
    mesh.setCastShadow(true);
    mesh.setReceiveShadow(true);
    asteroid.addComponent(mesh);
    
    // Add mineable component with balanced resource amounts for single-action mining
    let resourceAmount;
    switch (resourceType) {
        case 'iron':
            resourceAmount = Math.floor(size * 5 + Math.random() * 5); // 5-10 iron for small asteroids
            break;
        case 'gold':
            resourceAmount = Math.floor(size * 3 + Math.random() * 2); // 3-5 gold for small asteroids
            break;
        case 'platinum':
            resourceAmount = Math.floor(size * 1 + Math.random() * 2); // 1-3 platinum for small asteroids
            break;
        default:
            resourceAmount = Math.floor(size * 5);
    }
    
    // Scale up resources for larger asteroids
    if (size > 2) {
        resourceAmount *= 1.5;
    }
    
    const mineable = new MineableComponent(resourceType, resourceAmount);
    mineable.setStartingScale(size);
    asteroid.addComponent(mineable);
    
    // Initialize mining particle effects
    if (scene) {
        mineable.initializeParticleEffects(scene);
    }
    
    // Add the asteroid to the scene
    if (scene) {
        mesh.addToScene(scene);
    }
    
    return asteroid;
}