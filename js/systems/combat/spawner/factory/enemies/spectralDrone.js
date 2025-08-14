/**
 * Spectral Drone - Handles spectral drone creation and configuration
 */

import { TransformComponent } from '../../../../../components/transform.js';
import { HealthComponent } from '../../../../../components/combat/healthComponent.js';
import { EnemyAIComponent } from '../../../../../components/combat/enemyAI.js';
import { MeshComponent } from '../../../../../components/rendering/mesh.js';
import { RigidbodyComponent } from '../../../../../components/physics/rigidbody.js';
import { ENEMY_TYPES, getEnemySubtype } from '../../waves/definitions.js';

export class SpectralDroneCreator {
    constructor(world) {
        this.world = world;
    }

    /**
     * Create a spectral drone entity at the given position
     * @param {THREE.Vector3} position Spawn position
     * @param {Object} poolManager Enemy pool manager
     * @param {Set} enemies Active enemies tracking set
     * @param {number} maxEnemies Maximum enemy count
     * @param {Object} subtype Enemy subtype configuration
     * @returns {Entity|null} The created entity or null if failed
     */
    createSpectralDrone(position, poolManager, enemies, maxEnemies, subtype) {
        console.log("Creating spectral drone...");
        
        if (enemies.size >= maxEnemies) {
            console.warn(`SPAWN BLOCKED: Already at maximum enemies (${enemies.size}/${maxEnemies})`);
            return null;
        }
        
        const entity = poolManager.getEnemyFromPool();
        if (!entity) {
            console.error("Failed to get entity from pool");
            return null;
        }
        
        if (enemies.has(entity.id)) {
            console.error(`Entity ${entity.id} is already in the active enemies list!`);
            return null;
        }
        
        this.cleanEntityState(entity);
        
        // Get full subtype config if only ID was passed
        const fullSubtype = typeof subtype === 'string' ? getEnemySubtype(subtype) : 
                          (subtype.id ? getEnemySubtype(subtype.id) : subtype);
        
        this.setupEntityComponents(entity, position, fullSubtype);
        
        enemies.add(entity.id);
        this.registerWithCombatSystem(entity);
        
        console.log(`Created spectral drone at position: x=${position.x.toFixed(0)}, y=${position.y.toFixed(0)}, z=${position.z.toFixed(0)}`);
        
        return entity;
    }

    /**
     * Clean entity state from pool
     * @param {Entity} entity Entity to clean
     */
    cleanEntityState(entity) {
        if (entity.tags && entity.tags.size > 0) {
            console.warn(`Entity ${entity.id} from pool still has tags: [${[...entity.tags]}]. Clearing all tags.`);
            if (entity.clearTags && typeof entity.clearTags === 'function') {
                entity.clearTags();
            } else {
                entity.tags.clear();
                entity._isEnemy = false;
                entity._isPooled = false;
                entity._isPlayer = false;
                entity._isProjectile = false;
            }
        }
        
        entity.addTag('enemy');
        entity.addTag('spectrals');
    }

    /**
     * Setup all components for the entity
     * @param {Entity} entity Entity to setup
     * @param {THREE.Vector3} position Spawn position
     * @param {Object} subtype Enemy subtype configuration
     */
    setupEntityComponents(entity, position, subtype) {
        const enemyType = ENEMY_TYPES.SPECTRAL_DRONE;
        
        // Store subtype on entity
        entity.subtype = subtype.id;
        
        this.setupTransformComponent(entity, position, enemyType, subtype);
        this.setupHealthComponent(entity, subtype);
        this.setupAIComponent(entity, subtype);
        this.setupPhysicsComponent(entity, subtype);
    }


    /**
     * Setup transform component
     */
    setupTransformComponent(entity, position, enemyType, subtype) {
        let transform = entity.getComponent(TransformComponent);
        
        if (!transform) {
            transform = new TransformComponent(position.clone());
            entity.addComponent(transform);
        } else {
            transform.position.copy(position);
        }
        
        // Apply subtype-specific scale
        const baseSize = enemyType.baseSize * (subtype.sizeScale || 1.0);
        transform.scale.set(baseSize, baseSize, baseSize);
        
        // Random rotation offset
        transform.rotation.x = (Math.random() - 0.5) * 0.2;
        transform.rotation.y = (Math.random() - 0.5) * 0.2;
        transform.rotation.z = (Math.random() - 0.5) * 0.2;
        transform.needsUpdate = true;
    }

    /**
     * Setup health component
     */
    setupHealthComponent(entity, subtype) {
        let health = entity.getComponent(HealthComponent);
        if (!health) {
            health = new HealthComponent(subtype.health, 0);
            entity.addComponent(health);
        } else {
            health.maxHealth = subtype.health;
            health.health = subtype.health;
            health.isDestroyed = false;
        }
    }

    /**
     * Setup AI component
     */
    setupAIComponent(entity, subtype) {
        const enemyType = ENEMY_TYPES.SPECTRAL_DRONE;
        
        let enemyAI = entity.getComponent(EnemyAIComponent);
        if (!enemyAI) {
            const config = {
                faction: enemyType.faction,
                type: enemyType.type,
                subtype: subtype.id,
                health: subtype.health,
                damage: subtype.damage,
                speed: subtype.speed,
                spiralAmplitude: subtype.spiralAmplitude,
                spiralFrequency: subtype.spiralFrequency,
                isDroneLike: enemyType.isDroneLike
            };
            enemyAI = new EnemyAIComponent(config);
            entity.addComponent(enemyAI);
        } else {
            enemyAI.faction = enemyType.faction;
            enemyAI.type = enemyType.type;
            enemyAI.subtype = subtype.id;
            enemyAI.damage = subtype.damage;
            enemyAI.speed = subtype.speed;
            enemyAI.spiralAmplitude = subtype.spiralAmplitude;
            enemyAI.spiralFrequency = subtype.spiralFrequency;
            enemyAI.isDroneLike = enemyType.isDroneLike;
            enemyAI.enabled = true;
        }
    }

    /**
     * Setup physics component
     */
    setupPhysicsComponent(entity, subtype) {
        let rigidbody = entity.getComponent(RigidbodyComponent);
        if (!rigidbody) {
            rigidbody = new RigidbodyComponent(1);
            rigidbody.useGravity = false;
            rigidbody.drag = 0.1;
            rigidbody.shape = 'sphere';
            rigidbody.collisionRadius = subtype.collisionRadius;
            entity.addComponent(rigidbody);
        } else {
            rigidbody.isFrozen = false;
            rigidbody.velocity.set(0, 0, 0);
            rigidbody.collisionRadius = subtype.collisionRadius;
        }
        
        const transform = entity.getComponent(TransformComponent);
        if (transform && rigidbody) {
            rigidbody.position = transform.position.clone();
        }
    }

    /**
     * Register entity with combat system
     */
    registerWithCombatSystem(entity) {
        if (!entity.hasTag('enemy')) {
            console.warn(`CRITICAL ERROR: Entity ${entity.id} missing 'enemy' tag after setup!`);
            entity.addTag('enemy');
        }
        
        if (window.game && window.game.combat && window.game.combat.registerEnemy) {
            window.game.combat.registerEnemy(entity.id);
        }
    }
}