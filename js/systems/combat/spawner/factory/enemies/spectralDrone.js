/**
 * Spectral Drone - Handles spectral drone creation and configuration
 */

import { TransformComponent } from '../../../../../components/transform.js';
import { HealthComponent } from '../../../../../components/combat/healthComponent.js';
import { EnemyAIComponent } from '../../../../../components/combat/enemyAI.js';
import { MeshComponent } from '../../../../../components/rendering/mesh.js';
import { RigidbodyComponent } from '../../../../../components/physics/rigidbody.js';
import { ENEMY_TYPES } from '../../waves/definitions.js';

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
     * @param {Object} enemyConfig Current enemy configuration
     * @returns {Entity|null} The created entity or null if failed
     */
    createSpectralDrone(position, poolManager, enemies, maxEnemies, enemyConfig) {
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
        this.setupEntityComponents(entity, position, enemyConfig);
        
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
     * @param {Object} enemyConfig Enemy configuration
     */
    setupEntityComponents(entity, position, enemyConfig) {
        const enemyType = ENEMY_TYPES.SPECTRAL_DRONE;
        const variations = this.generateEnemyVariations(enemyConfig, enemyType);
        
        this.setupTransformComponent(entity, position, enemyType, variations);
        this.setupHealthComponent(entity, enemyConfig);
        this.setupAIComponent(entity, enemyConfig, variations);
        this.setupPhysicsComponent(entity, enemyType);
    }

    /**
     * Generate enemy variations
     * @param {Object} enemyConfig Base enemy configuration
     * @param {Object} enemyType Enemy type definition
     * @returns {Object} Generated variations
     */
    generateEnemyVariations(enemyConfig, enemyType) {
        const sizeVariation = enemyType.sizeVariation.min + 
            Math.random() * (enemyType.sizeVariation.max - enemyType.sizeVariation.min);
        const finalSize = enemyType.baseSize * sizeVariation;
        
        const rotationOffset = {
            x: (Math.random() - 0.5) * 0.2,
            y: (Math.random() - 0.5) * 0.2,
            z: (Math.random() - 0.5) * 0.2
        };
        
        return {
            amplitude: enemyConfig.spiralAmplitude * 
                (enemyType.amplitudeVariation.min + Math.random() * (enemyType.amplitudeVariation.max - enemyType.amplitudeVariation.min)),
            frequency: enemyConfig.spiralFrequency * 
                (enemyType.frequencyVariation.min + Math.random() * (enemyType.frequencyVariation.max - enemyType.frequencyVariation.min)),
            speed: enemyConfig.speed * 
                (enemyType.speedVariation.min + Math.random() * (enemyType.speedVariation.max - enemyType.speedVariation.min)),
            size: finalSize,
            rotationOffset
        };
    }

    /**
     * Setup transform component
     */
    setupTransformComponent(entity, position, enemyType, variations) {
        let transform = entity.getComponent(TransformComponent);
        
        if (!transform) {
            transform = new TransformComponent(position.clone());
            entity.addComponent(transform);
        } else {
            transform.position.copy(position);
        }
        
        transform.scale.set(variations.size, variations.size, variations.size);
        transform.rotation.x = variations.rotationOffset.x;
        transform.rotation.y = variations.rotationOffset.y;
        transform.rotation.z = variations.rotationOffset.z;
        transform.needsUpdate = true;
    }

    /**
     * Setup health component
     */
    setupHealthComponent(entity, enemyConfig) {
        let health = entity.getComponent(HealthComponent);
        if (!health) {
            health = new HealthComponent(enemyConfig.health, 0);
            entity.addComponent(health);
        } else {
            health.maxHealth = enemyConfig.health;
            health.health = enemyConfig.health;
            health.isDestroyed = false;
        }
    }

    /**
     * Setup AI component
     */
    setupAIComponent(entity, enemyConfig, variations) {
        const enemyType = ENEMY_TYPES.SPECTRAL_DRONE;
        
        let enemyAI = entity.getComponent(EnemyAIComponent);
        if (!enemyAI) {
            const config = {
                faction: enemyType.faction,
                type: enemyType.type,
                health: enemyConfig.health,
                damage: enemyConfig.damage,
                speed: variations.speed,
                spiralAmplitude: variations.amplitude,
                spiralFrequency: variations.frequency,
                isDroneLike: enemyType.isDroneLike
            };
            enemyAI = new EnemyAIComponent(config);
            entity.addComponent(enemyAI);
        } else {
            enemyAI.faction = enemyType.faction;
            enemyAI.type = enemyType.type;
            enemyAI.damage = enemyConfig.damage;
            enemyAI.speed = variations.speed;
            enemyAI.spiralAmplitude = variations.amplitude;
            enemyAI.spiralFrequency = variations.frequency;
            enemyAI.isDroneLike = enemyType.isDroneLike;
            enemyAI.enabled = true;
        }
    }

    /**
     * Setup physics component
     */
    setupPhysicsComponent(entity, enemyType) {
        let rigidbody = entity.getComponent(RigidbodyComponent);
        if (!rigidbody) {
            rigidbody = new RigidbodyComponent(1);
            rigidbody.useGravity = false;
            rigidbody.drag = 0.1;
            rigidbody.shape = 'sphere';
            rigidbody.collisionRadius = enemyType.collisionRadius;
            entity.addComponent(rigidbody);
        } else {
            rigidbody.isFrozen = false;
            rigidbody.velocity.set(0, 0, 0);
            rigidbody.collisionRadius = enemyType.collisionRadius;
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