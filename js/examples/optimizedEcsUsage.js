/**
 * Optimized ECS Usage Example
 * 
 * This file demonstrates how to integrate the optimized ECS components
 * and systems into the Solar System Asteroid Miner game.
 */

import { World } from '../core/world.js';
import { OptimizedTransformComponent } from '../components/optimized/transformComponent.js';
import { OptimizedRigidbodyComponent } from '../components/optimized/rigidbodyComponent.js';
import { OptimizedMovementSystem } from '../systems/physics/optimizedMovementSystem.js';
import { OptimizedEntityFactory } from '../core/optimizedEntityFactory.js';

/**
 * Example function showing how to set up and use the optimized ECS
 */
export function setupOptimizedEcs() {
    // Create a new world
    const world = new World();
    
    // Register the optimized movement system
    const movementSystem = new OptimizedMovementSystem(world);
    world.registerSystem(movementSystem);
    
    // Initialize the world (this initializes all systems)
    world.initialize();
    
    // Create some entities using the factory
    
    // Create an asteroid field
    const asteroids = [];
    const ASTEROID_COUNT = 1000;
    
    for (let i = 0; i < ASTEROID_COUNT; i++) {
        const position = new THREE.Vector3(
            (Math.random() - 0.5) * 500,
            (Math.random() - 0.5) * 500,
            (Math.random() - 0.5) * 500
        );
        
        const radius = 1.0 + Math.random() * 5.0;
        const mass = radius * radius * radius; // Mass based on volume
        
        const asteroid = OptimizedEntityFactory.createAsteroid(world, position, radius, mass);
        asteroids.push(asteroid);
        
        // You would also add mesh components and other game-specific components here
    }
    
    // Create a player ship
    const playerPosition = new THREE.Vector3(0, 0, 0);
    const playerEntity = OptimizedEntityFactory.createPhysicsEntity(world, 'player', playerPosition);
    playerEntity.addTag('player');
    
    // Get references to components for later use
    const playerTransform = playerEntity.getComponent(OptimizedTransformComponent);
    const playerRigidbody = playerEntity.getComponent(OptimizedRigidbodyComponent);
    
    // Configure player physics
    playerRigidbody.drag = 0.1;
    playerRigidbody.angularDrag = 0.2;
    playerRigidbody.mass = 10;
    
    // Create the game loop with optimized ECS
    const gameLoop = (deltaTime) => {
        // Update all ECS systems (including physics)
        world.update();
        
        // You would handle input, rendering, and other game systems here
        
        // Example: Apply thrust to player if moving forward
        if (isMovingForward) {
            const forwardDirection = playerTransform.getForwardVector();
            const thrustForce = forwardDirection.multiplyScalar(50); // 50 newtons of thrust
            playerRigidbody.applyForce(thrustForce);
        }
        
        // Example: Fire a projectile
        if (isFiring) {
            const projectilePosition = playerTransform.position.clone();
            const projectileDirection = playerTransform.getForwardVector();
            
            OptimizedEntityFactory.createProjectile(world, projectilePosition, projectileDirection, 100);
            
            // Reset firing flag
            isFiring = false;
        }
        
        // Request next frame
        requestAnimationFrame(gameLoop);
    };
    
    // Start the game loop
    let isMovingForward = false;
    let isFiring = false;
    
    // Example input handlers
    document.addEventListener('keydown', (e) => {
        if (e.code === 'KeyW') {
            isMovingForward = true;
        } else if (e.code === 'Space') {
            isFiring = true;
        }
    });
    
    document.addEventListener('keyup', (e) => {
        if (e.code === 'KeyW') {
            isMovingForward = false;
        }
    });
    
    // Start the game loop
    gameLoop();
    
    return {
        world,
        playerEntity,
        asteroids
    };
}

/**
 * Example showing how to integrate optimized components with existing systems
 */
export function integrateWithExistingSystems(existingWorld) {
    // Register the optimized movement system
    const movementSystem = new OptimizedMovementSystem(existingWorld);
    existingWorld.registerSystem(movementSystem);
    
    // Create a hybrid entity that uses both optimized and regular components
    const hybridEntity = existingWorld.createEntity('hybrid');
    
    // Add optimized components
    const transform = new OptimizedTransformComponent(
        new THREE.Vector3(0, 10, 0)
    );
    const rigidbody = new OptimizedRigidbodyComponent(5.0);
    
    hybridEntity.addComponent(transform);
    hybridEntity.addComponent(rigidbody);
    
    // Add other regular components from your game
    // For example (assuming these components exist):
    // hybridEntity.addComponent(new MeshComponent(geometry, material));
    // hybridEntity.addComponent(new HealthComponent(100));
    
    return hybridEntity;
}

/**
 * Performance comparison example
 */
export function runPerformanceTest() {
    // Create two worlds - one with optimized ECS, one with regular ECS
    const optimizedWorld = new World();
    const regularWorld = new World();
    
    // Register optimized systems
    optimizedWorld.registerSystem(new OptimizedMovementSystem(optimizedWorld));
    
    // Register regular systems (assuming these exist)
    // regularWorld.registerSystem(new MovementSystem(regularWorld));
    
    // Initialize both worlds
    optimizedWorld.initialize();
    regularWorld.initialize();
    
    // Create test entities - 5000 asteroids in each world
    const ENTITY_COUNT = 5000;
    
    console.log(`Creating ${ENTITY_COUNT} entities in each world...`);
    
    // Optimized entities
    console.time('Create optimized entities');
    for (let i = 0; i < ENTITY_COUNT; i++) {
        const position = new THREE.Vector3(
            (Math.random() - 0.5) * 1000,
            (Math.random() - 0.5) * 1000,
            (Math.random() - 0.5) * 1000
        );
        
        OptimizedEntityFactory.createAsteroid(optimizedWorld, position);
    }
    console.timeEnd('Create optimized entities');
    
    // Regular entities (assuming a similar factory exists)
    // console.time('Create regular entities');
    // for (let i = 0; i < ENTITY_COUNT; i++) {
    //     const position = new THREE.Vector3(
    //         (Math.random() - 0.5) * 1000,
    //         (Math.random() - 0.5) * 1000,
    //         (Math.random() - 0.5) * 1000
    //     );
    //     
    //     EntityFactory.createAsteroid(regularWorld, position);
    // }
    // console.timeEnd('Create regular entities');
    
    // Run 100 update cycles and measure performance
    const CYCLE_COUNT = 100;
    
    console.log(`Running ${CYCLE_COUNT} update cycles...`);
    
    // Optimized world updates
    console.time('Optimized world updates');
    for (let i = 0; i < CYCLE_COUNT; i++) {
        optimizedWorld.update();
    }
    console.timeEnd('Optimized world updates');
    
    // Regular world updates
    // console.time('Regular world updates');
    // for (let i = 0; i < CYCLE_COUNT; i++) {
    //     regularWorld.update();
    // }
    // console.timeEnd('Regular world updates');
    
    console.log('Performance test complete');
} 