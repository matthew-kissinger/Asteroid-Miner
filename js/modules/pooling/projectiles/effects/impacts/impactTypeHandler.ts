/**
 * Impact Type Handler Module
 *
 * Handles different types of impact effects based on projectile type
 */

import type { ObjectPool } from '../../../ObjectPool.ts';
import type * as THREE from 'three';
import type { ExplosionFactory } from './explosionFactory.ts';
import type { SparkFactory } from './sparkFactory.ts';
import type { DebrisFactory } from './debrisFactory.ts';

type ExplosionPoints = ReturnType<ExplosionFactory['createExplosion']>;
type SparkPoints = ReturnType<SparkFactory['createSparkEffect']>;
type DebrisGroup = ReturnType<DebrisFactory['createDebrisEffect']>;

type ImpactEffects = {
    explosion?: ExplosionPoints;
    spark?: SparkPoints;
    debris?: DebrisGroup;
};

type ImpactPools = {
    explosionPool?: ObjectPool<ExplosionPoints>;
    sparkPool?: ObjectPool<SparkPoints>;
    debrisPool?: ObjectPool<DebrisGroup>;
};

export class ImpactTypeHandler {
    constructor() {
        // No initialization needed
    }

    /**
     * Create an impact effect based on projectile type
     * @param position - Impact position
     * @param projectileType - Type of projectile that impacted
     * @param options - Effect options
     * @param pools - Object containing the different effect pools
     * @returns Created effects
     */
    createImpactEffect(position: THREE.Vector3, projectileType = 'bullet', options: Record<string, unknown> = {}, pools: ImpactPools = {}): ImpactEffects {
        void options;
        const effects: ImpactEffects = {};
        const { explosionPool, sparkPool, debrisPool } = pools;

        switch (projectileType) {
            case 'missile':
                // Large explosion for missiles
                if (explosionPool) {
                    effects.explosion = this._getExplosion(explosionPool, position, 1500);
                    effects.explosion.material.color.setHex(0xff4400);
                    effects.explosion.scale.set(2, 2, 2); // Larger explosion
                }
                break;

            case 'laser':
                // Bright spark effect for lasers
                if (sparkPool) {
                    effects.spark = this._getSparkEffect(sparkPool, position, 300);
                    effects.spark.material.color.setHex(0x00ffff);
                }
                break;

            case 'plasma':
                // Purple energy explosion for plasma
                if (explosionPool) {
                    effects.explosion = this._getExplosion(explosionPool, position, 800);
                    effects.explosion.material.color.setHex(0x8800ff);
                }
                if (sparkPool) {
                    effects.spark = this._getSparkEffect(sparkPool, position, 400);
                    effects.spark.material.color.setHex(0xaa00ff);
                }
                break;

            case 'bullet':
            default:
                // Sparks and debris for bullets
                if (sparkPool) {
                    effects.spark = this._getSparkEffect(sparkPool, position, 200);
                }
                if (debrisPool) {
                    effects.debris = this._getDebrisEffect(debrisPool, position, 1500);
                }
                break;
        }

        return effects;
    }

    /**
     * Helper method to get explosion from pool
     * @private
     */
    private _getExplosion(explosionPool: ObjectPool<ExplosionPoints>, position: THREE.Vector3, duration: number): ExplosionPoints {
        const explosion = explosionPool.get();
        explosion.position.copy(position);
        explosion.visible = true;
        explosion.userData.active = true;
        explosion.userData.startTime = Date.now();
        explosion.userData.duration = duration;
        return explosion;
    }

    /**
     * Helper method to get spark effect from pool
     * @private
     */
    private _getSparkEffect(sparkPool: ObjectPool<SparkPoints>, position: THREE.Vector3, duration: number): SparkPoints {
        const spark = sparkPool.get();
        spark.position.copy(position);
        spark.visible = true;
        spark.userData.active = true;
        spark.userData.startTime = Date.now();
        spark.userData.duration = duration;
        return spark;
    }

    /**
     * Helper method to get debris effect from pool
     * @private
     */
    private _getDebrisEffect(debrisPool: ObjectPool<DebrisGroup>, position: THREE.Vector3, duration: number): DebrisGroup {
        const debris = debrisPool.get();
        debris.position.copy(position);
        debris.visible = true;
        debris.userData.active = true;
        debris.userData.startTime = Date.now();
        debris.userData.duration = duration;
        return debris;
    }
}
