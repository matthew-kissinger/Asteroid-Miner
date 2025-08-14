/**
 * Separation Behavior - Handles enemy separation to avoid clustering
 */

import * as THREE from 'three';
import { TransformComponent } from '../../../../components/transform.js';
import { RigidbodyComponent } from '../../../../components/physics/rigidbody.js';
import { EnemyAIComponent } from '../../../../components/combat/enemyAI.js';

export class SeparationBehavior {
    constructor() {
        this.SEPARATION_FORCE_MAGNITUDE = 150;
        this.separationThresholdMultiplier = 2.5;
    }

    /**
     * Apply separation behavior to avoid overlapping with other enemies
     * @param {Entity} entity The entity to apply separation to
     * @param {number} deltaTime Time since last update in seconds
     * @param {Set} enemies Set of all enemy entities
     * @param {World} world Game world instance
     */
    applySeparationBehavior(entity, deltaTime, enemies, world) {
        const transform = entity.getComponent(TransformComponent);
        const rigidbody = entity.getComponent(RigidbodyComponent);
        const enemyAI = entity.getComponent(EnemyAIComponent);
        
        if (!transform || !rigidbody || !enemyAI || rigidbody.isFrozen) {
            return;
        }
        
        const separationForce = this.calculateSeparationForce(entity, transform, rigidbody, enemies, world);
        
        if (separationForce.lengthSq() > 0.01) {
            enemyAI.setSeparationForce(separationForce);
            rigidbody.applyForce(separationForce);
        } else {
            enemyAI.setSeparationForce(new THREE.Vector3());
        }
    }

    /**
     * Calculate separation force to avoid nearby enemies
     * @param {Entity} entity The current entity
     * @param {TransformComponent} transform The entity's transform
     * @param {RigidbodyComponent} rigidbody The entity's rigidbody
     * @param {Set} enemies Set of all enemy entities
     * @param {World} world Game world instance
     * @returns {THREE.Vector3} The calculated separation force
     */
    calculateSeparationForce(entity, transform, rigidbody, enemies, world) {
        const separationForce = new THREE.Vector3();
        const separationThreshold = rigidbody.collisionRadius * this.separationThresholdMultiplier;
        const nearbyEnemies = this.findNearbyEnemies(entity, transform.position, separationThreshold, enemies, world);
        
        for (const neighborId of nearbyEnemies) {
            if (neighborId === entity.id) continue;
            
            const neighbor = world.getEntity(neighborId);
            if (!neighbor) continue;
            
            const neighborTransform = neighbor.getComponent(TransformComponent);
            if (!neighborTransform) continue;
            
            const awayVector = transform.position.clone().sub(neighborTransform.position);
            const distance = awayVector.length();
            
            if (distance >= separationThreshold || distance === 0) continue;
            
            let strength = (separationThreshold - distance) / separationThreshold;
            awayVector.normalize();
            separationForce.add(awayVector.multiplyScalar(strength * this.SEPARATION_FORCE_MAGNITUDE));
        }
        
        return separationForce;
    }

    /**
     * Find nearby enemy entities within a certain radius
     * @param {Entity} entity The entity to find neighbors for
     * @param {THREE.Vector3} position The position to check from
     * @param {number} radius The radius to check within
     * @param {Set} enemies Set of all enemy entities
     * @param {World} world Game world instance
     * @returns {Set} Set of nearby enemy entity IDs
     */
    findNearbyEnemies(entity, position, radius, enemies, world) {
        const nearbyEnemies = new Set();
        
        for (const enemyId of enemies) {
            if (enemyId === entity.id) continue;
            
            const enemyEntity = world.getEntity(enemyId);
            if (!enemyEntity || enemyEntity.hasTag('pooled')) continue;
            
            const enemyTransform = enemyEntity.getComponent(TransformComponent);
            if (!enemyTransform) continue;
            
            const distance = position.distanceTo(enemyTransform.position);
            if (distance < radius) {
                nearbyEnemies.add(enemyId);
            }
        }
        
        return nearbyEnemies;
    }
}