/**
 * OptimizedEntityFactory
 * 
 * [PRESERVED FOR FUTURE SCALING]
 * This factory is currently not used in the main game, but is preserved for future
 * performance optimization when scaling to many entities. It creates entities with
 * optimized components that use TypedArrays for better memory layout and performance.
 * 
 * If re-implementing the optimized ECS system:
 * 1. Use this factory instead of creating entities manually
 * 2. Ensure optimized components are registered with the world
 * 3. Register the optimizedMovementSystem in the world
 * 4. Consider using instancedRenderSystem for rendering
 */

import { OptimizedTransformComponent } from '../components/optimized/transformComponent.js';
import { OptimizedRigidbodyComponent } from '../components/optimized/rigidbodyComponent.js';

export class OptimizedEntityFactory {
    /**
     * Create a basic entity with optimized transform
     * @param {World} world The world to create the entity in
     * @param {string} name Optional name for the entity
     * @param {THREE.Vector3} position Initial position
     * @param {THREE.Euler} rotation Initial rotation
     * @param {THREE.Vector3} scale Initial scale
     * @returns {Entity} The created entity
     */
    static createBasicEntity(world, name = '', position = new THREE.Vector3(), rotation = new THREE.Euler(), scale = new THREE.Vector3(1, 1, 1)) {
        // Create entity
        const entity = world.createEntity(name);
        
        // Add transform component
        const transform = new OptimizedTransformComponent(position, rotation, scale);
        entity.addComponent(transform);
        
        return entity;
    }
    
    /**
     * Create a physics entity with optimized transform and rigidbody
     * @param {World} world The world to create the entity in
     * @param {string} name Optional name for the entity
     * @param {THREE.Vector3} position Initial position
     * @param {THREE.Euler} rotation Initial rotation
     * @param {THREE.Vector3} scale Initial scale
     * @param {number} mass Initial mass
     * @returns {Entity} The created entity
     */
    static createPhysicsEntity(world, name = '', position = new THREE.Vector3(), rotation = new THREE.Euler(), scale = new THREE.Vector3(1, 1, 1), mass = 1.0) {
        // Create entity with transform
        const entity = this.createBasicEntity(world, name, position, rotation, scale);
        
        // Add rigidbody component
        const rigidbody = new OptimizedRigidbodyComponent(mass);
        entity.addComponent(rigidbody);
        
        return entity;
    }
    
    /**
     * Create an asteroid entity with optimized components
     * @param {World} world The world to create the entity in
     * @param {THREE.Vector3} position Initial position
     * @param {number} radius Asteroid radius
     * @param {number} mass Asteroid mass
     * @returns {Entity} The created entity
     */
    static createAsteroid(world, position = new THREE.Vector3(), radius = 1.0, mass = 1.0) {
        // Randomize rotation
        const rotation = new THREE.Euler(
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
        );
        
        // Randomize scale slightly for variety
        const scale = new THREE.Vector3(radius, radius, radius);
        scale.multiply(new THREE.Vector3(
            0.8 + Math.random() * 0.4,
            0.8 + Math.random() * 0.4,
            0.8 + Math.random() * 0.4
        ));
        
        // Create physics entity
        const entity = this.createPhysicsEntity(world, 'asteroid', position, rotation, scale, mass);
        
        // Add random rotation
        const rigidbody = entity.getComponent(OptimizedRigidbodyComponent);
        rigidbody.setAngularVelocity(
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5
        );
        
        // Set collision radius based on scale average
        rigidbody.collisionRadius = (scale.x + scale.y + scale.z) / 3;
        
        return entity;
    }
    
    /**
     * Create a projectile entity with optimized components
     * @param {World} world The world to create the entity in
     * @param {THREE.Vector3} position Initial position
     * @param {THREE.Vector3} direction Direction vector
     * @param {number} speed Projectile speed
     * @returns {Entity} The created entity
     */
    static createProjectile(world, position = new THREE.Vector3(), direction = new THREE.Vector3(0, 0, -1), speed = 50) {
        // Create entity with proper rotation based on direction
        const entity = this.createPhysicsEntity(world, 'projectile', position);
        
        // Make direction a unit vector
        direction.normalize();
        
        // Look in the direction of travel
        const transform = entity.getComponent(OptimizedTransformComponent);
        const targetPos = new THREE.Vector3().copy(position).add(direction);
        transform.lookAt(targetPos);
        
        // Set velocity based on direction and speed
        const rigidbody = entity.getComponent(OptimizedRigidbodyComponent);
        rigidbody.setVelocity(
            direction.x * speed,
            direction.y * speed,
            direction.z * speed
        );
        
        // Set collision properties
        rigidbody.collisionRadius = 0.25;
        rigidbody.mass = 0.1;
        
        // Add projectile tag
        entity.addTag('projectile');
        
        return entity;
    }
} 