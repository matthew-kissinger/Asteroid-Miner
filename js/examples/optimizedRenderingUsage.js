/**
 * Optimized Rendering Usage Example
 * 
 * This file demonstrates how to use the optimized rendering system
 * with instanced meshes for better performance when rendering many similar objects.
 */

import { World } from '../core/world.js';
import { InstancedMeshComponent } from '../components/rendering/instancedMeshComponent.js';
import { InstancedRenderSystem } from '../systems/rendering/instancedRenderSystem.js';
import { OptimizedEntityFactory } from '../core/optimizedEntityFactory.js';
import { OptimizedMovementSystem } from '../systems/physics/optimizedMovementSystem.js';
import { CameraSystem } from '../systems/rendering/cameraSystem.js';

/**
 * Set up an optimized rendering demo with asteroid field
 * @param {THREE.Scene} scene The Three.js scene
 * @param {THREE.Camera} camera The Three.js camera
 * @param {number} asteroidCount Number of asteroids to create
 * @returns {Object} Object containing world and created entities
 */
export function setupOptimizedRendering(scene, camera, asteroidCount = 1000) {
    // Create a new ECS world
    const world = new World();
    
    // Register required systems
    const renderSystem = new InstancedRenderSystem(scene, camera);
    const movementSystem = new OptimizedMovementSystem();
    const cameraSystem = new CameraSystem(camera);
    
    world.registerSystem('instancedRender', renderSystem);
    world.registerSystem('movement', movementSystem);
    world.registerSystem('camera', cameraSystem);
    
    // Initialize the world with registered systems
    world.initialize();
    
    // Create template geometry and material for asteroids
    const asteroidGeometry = new THREE.IcosahedronGeometry(1, 1);
    const asteroidMaterial = new THREE.MeshStandardMaterial({
        color: 0xaaaaaa,
        roughness: 0.8,
        metalness: 0.2,
        flatShading: true
    });
    
    // Register template with instanced mesh component
    InstancedMeshComponent.setTemplateGeometry('asteroid', asteroidGeometry);
    InstancedMeshComponent.setTemplateMaterial('asteroid', asteroidMaterial);
    
    // Add the instanced meshes to the scene
    InstancedMeshComponent.addAllToScene(scene);
    
    // Create asteroid field with optimized entities
    const asteroids = [];
    const fieldRadius = 1000;
    
    for (let i = 0; i < asteroidCount; i++) {
        // Create random position within a spherical field
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const radius = fieldRadius * Math.pow(Math.random(), 1/3); // Cube root for volume distribution
        
        const position = new THREE.Vector3(
            radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.sin(phi) * Math.sin(theta),
            radius * Math.cos(phi)
        );
        
        // Random size between 3 and 30
        const scale = 3 + Math.random() * 27;
        
        // Create asteroid entity using the factory
        const asteroid = OptimizedEntityFactory.createPhysicsEntity(
            world, 
            `asteroid_${i}`,
            position,
            new THREE.Quaternion().setFromEuler(new THREE.Euler(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            )),
            new THREE.Vector3(scale, scale, scale),
            scale * 10 // mass proportional to scale
        );
        
        // Add the instanced mesh component
        const instanced = new InstancedMeshComponent('asteroid');
        asteroid.addComponent(instanced);
        
        // Random rotation velocity
        const rb = asteroid.getComponent('OptimizedRigidbodyComponent');
        if (rb) {
            rb.angularVelocity.set(
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2
            );
            
            // Small random velocity
            rb.velocity.set(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            );
        }
        
        asteroids.push(asteroid);
    }
    
    // Create player ship with different template
    const shipGeometry = new THREE.ConeGeometry(1, 4, 8);
    shipGeometry.rotateX(Math.PI / 2);
    
    const shipMaterial = new THREE.MeshStandardMaterial({
        color: 0x3388ff,
        roughness: 0.3,
        metalness: 0.7,
        flatShading: true
    });
    
    // Register ship template
    InstancedMeshComponent.setTemplateGeometry('ship', shipGeometry);
    InstancedMeshComponent.setTemplateMaterial('ship', shipMaterial);
    
    // Create player entity
    const player = OptimizedEntityFactory.createPhysicsEntity(
        world,
        'player',
        new THREE.Vector3(0, 0, 0),
        new THREE.Quaternion(),
        new THREE.Vector3(5, 5, 5),
        100 // player mass
    );
    
    // Add instanced mesh component for the player
    const shipMesh = new InstancedMeshComponent('ship');
    player.addComponent(shipMesh);
    
    // Configure physics for player
    const playerRb = player.getComponent('OptimizedRigidbodyComponent');
    if (playerRb) {
        playerRb.drag = 0.2;
        playerRb.angularDrag = 0.9;
    }
    
    // Set up camera tracking for player
    cameraSystem.trackEntity(player);
    cameraSystem.setOffset(new THREE.Vector3(0, 20, -50));
    
    return {
        world,
        player,
        asteroids,
        renderSystem
    };
}

/**
 * Run a performance test comparing standard rendering vs instanced rendering
 * @param {THREE.Scene} scene The Three.js scene
 * @param {THREE.Camera} camera The Three.js camera
 * @param {number} entityCount Number of entities to test with
 * @returns {Object} Performance test results
 */
export function runRenderingPerformanceTest(scene, camera, entityCount = 5000) {
    console.log(`Starting rendering performance test with ${entityCount} entities...`);
    
    // Setup for standard rendering (using regular MeshComponent)
    const standardWorld = new World();
    const standardRenderSystem = new RenderSystem(scene, camera);
    standardWorld.registerSystem('render', standardRenderSystem);
    standardWorld.initialize();
    
    // Setup for instanced rendering
    const instancedWorld = new World();
    const instancedRenderSystem = new InstancedRenderSystem(scene, camera);
    instancedWorld.registerSystem('render', instancedRenderSystem);
    instancedWorld.initialize();
    
    // Common geometry and material
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    
    // Register with instanced component
    InstancedMeshComponent.setTemplateGeometry('test_box', geometry);
    InstancedMeshComponent.setTemplateMaterial('test_box', material);
    
    // Test creation time for standard entities
    const standardStart = performance.now();
    
    // Create standard entities
    for (let i = 0; i < entityCount; i++) {
        const position = new THREE.Vector3(
            (Math.random() - 0.5) * 1000,
            (Math.random() - 0.5) * 1000,
            (Math.random() - 0.5) * 1000
        );
        
        const entity = standardWorld.createEntity(`standard_${i}`);
        
        const transform = new TransformComponent();
        transform.position.copy(position);
        transform.scale.set(5, 5, 5);
        entity.addComponent(transform);
        
        const mesh = new MeshComponent(geometry.clone(), material.clone());
        entity.addComponent(mesh);
    }
    
    const standardCreateTime = performance.now() - standardStart;
    
    // Test creation time for instanced entities
    const instancedStart = performance.now();
    
    // Create instanced entities
    for (let i = 0; i < entityCount; i++) {
        const position = new THREE.Vector3(
            (Math.random() - 0.5) * 1000,
            (Math.random() - 0.5) * 1000,
            (Math.random() - 0.5) * 1000
        );
        
        const entity = instancedWorld.createEntity(`instanced_${i}`);
        
        const transform = new TransformComponent();
        transform.position.copy(position);
        transform.scale.set(5, 5, 5);
        entity.addComponent(transform);
        
        const instancedMesh = new InstancedMeshComponent('test_box');
        entity.addComponent(instancedMesh);
    }
    
    const instancedCreateTime = performance.now() - instancedStart;
    
    // Measure update performance - standard rendering
    let standardUpdateStart = performance.now();
    
    for (let i = 0; i < 100; i++) {
        standardRenderSystem.update(1/60);
    }
    
    const standardUpdateTime = performance.now() - standardUpdateStart;
    
    // Measure update performance - instanced rendering
    let instancedUpdateStart = performance.now();
    
    for (let i = 0; i < 100; i++) {
        instancedRenderSystem.update(1/60);
    }
    
    const instancedUpdateTime = performance.now() - instancedUpdateStart;
    
    // Clean up
    standardWorld.destroy();
    instancedWorld.destroy();
    
    // Return results
    return {
        entityCount,
        standard: {
            creationTime: standardCreateTime,
            updateTime: standardUpdateTime,
            totalTime: standardCreateTime + standardUpdateTime,
            creationTimePerEntity: standardCreateTime / entityCount,
            updateTimePerEntity: standardUpdateTime / entityCount / 100
        },
        instanced: {
            creationTime: instancedCreateTime,
            updateTime: instancedUpdateTime,
            totalTime: instancedCreateTime + instancedUpdateTime,
            creationTimePerEntity: instancedCreateTime / entityCount,
            updateTimePerEntity: instancedUpdateTime / entityCount / 100
        },
        improvement: {
            creationSpeedup: standardCreateTime / instancedCreateTime,
            updateSpeedup: standardUpdateTime / instancedUpdateTime,
            totalSpeedup: (standardCreateTime + standardUpdateTime) / 
                         (instancedCreateTime + instancedUpdateTime)
        }
    };
}

/**
 * Setup game loop for the optimized rendering demo
 * @param {Object} setupResult Result from setupOptimizedRendering
 * @param {HTMLElement} container The container element for the UI
 * @returns {Function} Function to stop the game loop
 */
export function setupGameLoop(setupResult, container) {
    const { world, player, renderSystem } = setupResult;
    
    // Game state
    let running = true;
    let lastTime = performance.now();
    
    // Input state
    const input = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        up: false,
        down: false,
        rollLeft: false,
        rollRight: false
    };
    
    // Setup UI for stats
    const statsElement = document.createElement('div');
    statsElement.style.position = 'absolute';
    statsElement.style.top = '10px';
    statsElement.style.left = '10px';
    statsElement.style.color = 'white';
    statsElement.style.fontFamily = 'monospace';
    statsElement.style.fontSize = '12px';
    statsElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    statsElement.style.padding = '10px';
    statsElement.style.borderRadius = '5px';
    container.appendChild(statsElement);
    
    // Game loop
    function gameLoop() {
        if (!running) return;
        
        const currentTime = performance.now();
        const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
        lastTime = currentTime;
        
        // Cap delta time to avoid huge jumps
        const dt = Math.min(deltaTime, 1/30);
        
        // Handle player movement based on input
        const playerRb = player.getComponent('OptimizedRigidbodyComponent');
        const playerTransform = player.getComponent('OptimizedTransformComponent');
        
        if (playerRb && playerTransform) {
            const speed = 50;
            const turnSpeed = 2;
            
            // Get forward and right vectors from transform
            const forward = new THREE.Vector3(0, 0, 1)
                .applyQuaternion(playerTransform.quaternion);
                
            const right = new THREE.Vector3(1, 0, 0)
                .applyQuaternion(playerTransform.quaternion);
                
            const up = new THREE.Vector3(0, 1, 0)
                .applyQuaternion(playerTransform.quaternion);
            
            // Apply forces based on input
            if (input.forward) {
                playerRb.velocity.addScaledVector(forward, speed * dt);
            }
            
            if (input.backward) {
                playerRb.velocity.addScaledVector(forward, -speed * dt);
            }
            
            if (input.left) {
                // Rotate around up axis
                const rotation = new THREE.Quaternion()
                    .setFromAxisAngle(new THREE.Vector3(0, 1, 0), turnSpeed * dt);
                    
                playerTransform.quaternion.premultiply(rotation);
            }
            
            if (input.right) {
                // Rotate around up axis
                const rotation = new THREE.Quaternion()
                    .setFromAxisAngle(new THREE.Vector3(0, 1, 0), -turnSpeed * dt);
                    
                playerTransform.quaternion.premultiply(rotation);
            }
            
            if (input.up) {
                // Rotate around right axis
                const rotation = new THREE.Quaternion()
                    .setFromAxisAngle(right, -turnSpeed * dt);
                    
                playerTransform.quaternion.premultiply(rotation);
            }
            
            if (input.down) {
                // Rotate around right axis
                const rotation = new THREE.Quaternion()
                    .setFromAxisAngle(right, turnSpeed * dt);
                    
                playerTransform.quaternion.premultiply(rotation);
            }
            
            if (input.rollLeft) {
                // Rotate around forward axis
                const rotation = new THREE.Quaternion()
                    .setFromAxisAngle(forward, turnSpeed * dt);
                    
                playerTransform.quaternion.premultiply(rotation);
            }
            
            if (input.rollRight) {
                // Rotate around forward axis
                const rotation = new THREE.Quaternion()
                    .setFromAxisAngle(forward, -turnSpeed * dt);
                    
                playerTransform.quaternion.premultiply(rotation);
            }
        }
        
        // Update all systems
        world.update(dt);
        
        // Update stats
        const stats = renderSystem.getStats();
        statsElement.innerHTML = `
            FPS: ${Math.round(1/dt)}
            Entities: ${stats.totalEntities}
            Visible: ${stats.visibleEntities}
            Instanced Meshes: ${stats.instancedMeshCount}
        `;
        
        // Request next frame
        requestAnimationFrame(gameLoop);
    }
    
    // Setup keyboard input
    function handleKeyDown(e) {
        switch (e.key.toLowerCase()) {
            case 'w': input.forward = true; break;
            case 's': input.backward = true; break;
            case 'a': input.left = true; break;
            case 'd': input.right = true; break;
            case 'q': input.up = true; break;
            case 'e': input.down = true; break;
            case 'z': input.rollLeft = true; break;
            case 'c': input.rollRight = true; break;
        }
    }
    
    function handleKeyUp(e) {
        switch (e.key.toLowerCase()) {
            case 'w': input.forward = false; break;
            case 's': input.backward = false; break;
            case 'a': input.left = false; break;
            case 'd': input.right = false; break;
            case 'q': input.up = false; break;
            case 'e': input.down = false; break;
            case 'z': input.rollLeft = false; break;
            case 'c': input.rollRight = false; break;
        }
    }
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Start the game loop
    gameLoop();
    
    // Return cleanup function
    return function cleanup() {
        running = false;
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        container.removeChild(statsElement);
    };
} 