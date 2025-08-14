/**
 * Impact Effects Pool
 * 
 * Manages pooling of impact effects for projectile collisions:
 * - Explosion particle systems
 * - Impact flashes and sparks
 * - Debris and shrapnel effects
 * - Different effects based on impact type
 */

import { ObjectPool } from '../../ObjectPool.js';
import * as THREE from 'three';
import { ExplosionFactory } from './impacts/explosionFactory.js';
import { SparkFactory } from './impacts/sparkFactory.js';
import { DebrisFactory } from './impacts/debrisFactory.js';
import { ImpactTypeHandler } from './impacts/impactTypeHandler.js';

export class ImpactEffectsPool {
    /**
     * Create a new ImpactEffectsPool
     * @param {object} sharedAssets - Shared geometries and materials
     * @param {function} addToScene - Function to add objects to scene
     * @param {function} removeFromParent - Function to remove objects from parent
     */
    constructor(sharedAssets, addToScene, removeFromParent) {
        this.sharedAssets = sharedAssets;
        this._addToScene = addToScene;
        this._removeFromParent = removeFromParent;
        
        // Initialize factories
        this.explosionFactory = new ExplosionFactory(sharedAssets);
        this.sparkFactory = new SparkFactory(sharedAssets);
        this.debrisFactory = new DebrisFactory();
        this.impactTypeHandler = new ImpactTypeHandler();
        
        this.initializePools();
    }
    
    /**
     * Initialize impact effect pools
     */
    initializePools() {
        // Initialize explosion pool
        this.explosionPool = new ObjectPool(
            // Create function
            () => this.createExplosion(),
            // Reset function
            (explosion) => this.resetExplosion(explosion),
            10, // Initial size
            5   // Expand size
        );
        
        // Initialize spark pool for impact effects
        this.sparkPool = new ObjectPool(
            // Create function
            () => this.createSparkEffect(),
            // Reset function
            (spark) => this.resetSparkEffect(spark),
            20, // Initial size
            8   // Expand size
        );
        
        // Initialize debris pool
        this.debrisPool = new ObjectPool(
            // Create function
            () => this.createDebrisEffect(),
            // Reset function
            (debris) => this.resetDebrisEffect(debris),
            15, // Initial size
            6   // Expand size
        );
    }
    
    /**
     * Create a new explosion effect
     * @returns {THREE.Points} An explosion particle system
     */
    createExplosion() {
        return this.explosionFactory.createExplosion();
    }
    
    /**
     * Reset explosion to initial state
     * @param {THREE.Points} explosion - The explosion to reset
     */
    resetExplosion(explosion) {
        this.explosionFactory.resetExplosion(explosion);
    }
    
    /**
     * Create a spark effect for impacts
     * @returns {THREE.Points} A spark particle system
     */
    createSparkEffect() {
        return this.sparkFactory.createSparkEffect();
    }
    
    /**
     * Reset spark effect to initial state
     * @param {THREE.Points} spark - The spark effect to reset
     */
    resetSparkEffect(spark) {
        this.sparkFactory.resetSparkEffect(spark);
    }
    
    /**
     * Create debris effect for impacts
     * @returns {THREE.Group} A debris group
     */
    createDebrisEffect() {
        return this.debrisFactory.createDebrisEffect();
    }
    
    /**
     * Reset debris effect to initial state
     * @param {THREE.Group} debris - The debris effect to reset
     */
    resetDebrisEffect(debris) {
        this.debrisFactory.resetDebrisEffect(debris);
    }
    
    /**
     * Create an impact effect based on projectile type
     * @param {THREE.Vector3} position - Impact position
     * @param {string} projectileType - Type of projectile that impacted
     * @param {object} options - Effect options
     * @returns {object} Created effects
     */
    createImpactEffect(position, projectileType = 'bullet', options = {}) {
        const pools = {
            explosionPool: this.explosionPool,
            sparkPool: this.sparkPool,
            debrisPool: this.debrisPool
        };
        
        const effects = this.impactTypeHandler.createImpactEffect(position, projectileType, options, pools);
        
        // Add effects to scene if not already there
        Object.values(effects).forEach(effect => {
            if (effect && !effect.parent) {
                this._addToScene(effect);
            }
        });
        
        return effects;
    }
    
    /**
     * Get an explosion effect from the pool
     * @param {THREE.Vector3} position - Position for the explosion
     * @param {number} duration - Duration of the explosion in milliseconds
     * @returns {THREE.Points} An explosion effect
     */
    getExplosion(position, duration = 1000) {
        const explosion = this.explosionPool.get();
        explosion.position.copy(position);
        explosion.visible = true;
        explosion.userData.active = true;
        explosion.userData.startTime = Date.now();
        explosion.userData.duration = duration;
        
        // Add to scene if not already there
        if (!explosion.parent) {
            this._addToScene(explosion);
        }
        
        return explosion;
    }
    
    /**
     * Get a spark effect from the pool
     * @param {THREE.Vector3} position - Position for the spark effect
     * @param {number} duration - Duration of the effect in milliseconds
     * @returns {THREE.Points} A spark effect
     */
    getSparkEffect(position, duration = 500) {
        const spark = this.sparkPool.get();
        spark.position.copy(position);
        spark.visible = true;
        spark.userData.active = true;
        spark.userData.startTime = Date.now();
        spark.userData.duration = duration;
        
        if (!spark.parent) {
            this._addToScene(spark);
        }
        
        return spark;
    }
    
    /**
     * Get a debris effect from the pool
     * @param {THREE.Vector3} position - Position for the debris effect
     * @param {number} duration - Duration of the effect in milliseconds
     * @returns {THREE.Group} A debris effect
     */
    getDebrisEffect(position, duration = 2000) {
        const debris = this.debrisPool.get();
        debris.position.copy(position);
        debris.visible = true;
        debris.userData.active = true;
        debris.userData.startTime = Date.now();
        debris.userData.duration = duration;
        
        if (!debris.parent) {
            this._addToScene(debris);
        }
        
        return debris;
    }
    
    /**
     * Update all active impact effects
     * @param {number} deltaTime - Time since last update
     */
    updateEffects(deltaTime) {
        this.updateExplosions(deltaTime);
        this.updateSparks(deltaTime);
        this.updateDebris(deltaTime);
    }
    
    /**
     * Update all active explosions
     * @param {number} deltaTime - Time since last update
     */
    updateExplosions(deltaTime) {
        this.explosionFactory.updateExplosions(this.explosionPool.active, (explosion) => this.releaseExplosion(explosion));
    }
    
    /**
     * Update all active spark effects
     * @param {number} deltaTime - Time since last update
     */
    updateSparks(deltaTime) {
        this.sparkFactory.updateSparks(this.sparkPool.active, (spark) => this.releaseSparkEffect(spark));
    }
    
    /**
     * Update all active debris effects
     * @param {number} deltaTime - Time since last update
     */
    updateDebris(deltaTime) {
        this.debrisFactory.updateDebris(this.debrisPool.active, (debris) => this.releaseDebrisEffect(debris));
    }
    
    /**
     * Release effects back to pools
     */
    releaseExplosion(explosion) {
        if (explosion.parent) {
            this._removeFromParent(explosion);
        }
        this.explosionPool.release(explosion);
    }
    
    releaseSparkEffect(spark) {
        if (spark.parent) {
            this._removeFromParent(spark);
        }
        this.sparkPool.release(spark);
    }
    
    releaseDebrisEffect(debris) {
        if (debris.parent) {
            this._removeFromParent(debris);
        }
        this.debrisPool.release(debris);
    }
    
    /**
     * Dispose all impact effect pools
     */
    dispose() {
        this.explosionPool.dispose((explosion) => {
            if (explosion.parent) this._removeFromParent(explosion);
            if (explosion.material) explosion.material.dispose();
            if (explosion.geometry) explosion.geometry.dispose();
        });
        
        this.sparkPool.dispose((spark) => {
            if (spark.parent) this._removeFromParent(spark);
            if (spark.material) spark.material.dispose();
            if (spark.geometry) spark.geometry.dispose();
        });
        
        this.debrisPool.dispose((debris) => {
            if (debris.parent) this._removeFromParent(debris);
            for (const piece of debris.children) {
                if (piece.material) piece.material.dispose();
                if (piece.geometry) piece.geometry.dispose();
            }
        });
    }
}