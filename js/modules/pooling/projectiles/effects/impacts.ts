/**
 * Impact Effects Pool
 *
 * Manages pooling of impact effects for projectile collisions:
 * - Explosion particle systems
 * - Impact flashes and sparks
 * - Debris and shrapnel effects
 * - Different effects based on impact type
 */

import { ObjectPool } from '../../ObjectPool.ts';
import * as THREE from 'three';
import { ExplosionFactory } from './impacts/explosionFactory.ts';
import { SparkFactory } from './impacts/sparkFactory.ts';
import { DebrisFactory } from './impacts/debrisFactory.ts';
import { ImpactTypeHandler } from './impacts/impactTypeHandler.ts';

type SharedAssets = {
    explosionParticleMaterial: THREE.PointsMaterial;
};

type ExplosionPoints = ReturnType<ExplosionFactory['createExplosion']>;

type SparkPoints = ReturnType<SparkFactory['createSparkEffect']>;

type DebrisGroup = ReturnType<DebrisFactory['createDebrisEffect']>;

type ImpactEffects = {
    explosion?: ExplosionPoints;
    spark?: SparkPoints;
    debris?: DebrisGroup;
};

type AddToScene = (object: THREE.Object3D) => void;

type RemoveFromParent = (object: THREE.Object3D) => void;

export class ImpactEffectsPool {
    sharedAssets: SharedAssets;
    private _addToScene: AddToScene;
    private _removeFromParent: RemoveFromParent;

    explosionFactory: ExplosionFactory;
    sparkFactory: SparkFactory;
    debrisFactory: DebrisFactory;
    impactTypeHandler: ImpactTypeHandler;

    explosionPool!: ObjectPool<ExplosionPoints>;
    sparkPool!: ObjectPool<SparkPoints>;
    debrisPool!: ObjectPool<DebrisGroup>;

    /**
     * Create a new ImpactEffectsPool
     * @param sharedAssets - Shared geometries and materials
     * @param addToScene - Function to add objects to scene
     * @param removeFromParent - Function to remove objects from parent
     */
    constructor(sharedAssets: SharedAssets, addToScene: AddToScene, removeFromParent: RemoveFromParent) {
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
    initializePools(): void {
        // Initialize explosion pool
        this.explosionPool = new ObjectPool<ExplosionPoints>(
            // Create function
            () => this.createExplosion(),
            // Reset function
            (explosion) => this.resetExplosion(explosion),
            10, // Initial size
            5 // Expand size
        );

        // Initialize spark pool for impact effects
        this.sparkPool = new ObjectPool<SparkPoints>(
            // Create function
            () => this.createSparkEffect(),
            // Reset function
            (spark) => this.resetSparkEffect(spark),
            20, // Initial size
            8 // Expand size
        );

        // Initialize debris pool
        this.debrisPool = new ObjectPool<DebrisGroup>(
            // Create function
            () => this.createDebrisEffect(),
            // Reset function
            (debris) => this.resetDebrisEffect(debris),
            15, // Initial size
            6 // Expand size
        );
    }

    /**
     * Create a new explosion effect
     * @returns An explosion particle system
     */
    createExplosion(): ExplosionPoints {
        return this.explosionFactory.createExplosion();
    }

    /**
     * Reset explosion to initial state
     * @param explosion - The explosion to reset
     */
    resetExplosion(explosion: ExplosionPoints): void {
        this.explosionFactory.resetExplosion(explosion);
    }

    /**
     * Create a spark effect for impacts
     * @returns A spark particle system
     */
    createSparkEffect(): SparkPoints {
        return this.sparkFactory.createSparkEffect();
    }

    /**
     * Reset spark effect to initial state
     * @param spark - The spark effect to reset
     */
    resetSparkEffect(spark: SparkPoints): void {
        this.sparkFactory.resetSparkEffect(spark);
    }

    /**
     * Create debris effect for impacts
     * @returns A debris group
     */
    createDebrisEffect(): DebrisGroup {
        return this.debrisFactory.createDebrisEffect();
    }

    /**
     * Reset debris effect to initial state
     * @param debris - The debris effect to reset
     */
    resetDebrisEffect(debris: DebrisGroup): void {
        this.debrisFactory.resetDebrisEffect(debris);
    }

    /**
     * Create an impact effect based on projectile type
     * @param position - Impact position
     * @param projectileType - Type of projectile that impacted
     * @param options - Effect options
     * @returns Created effects
     */
    createImpactEffect(position: THREE.Vector3, projectileType = 'bullet', options: Record<string, unknown> = {}): ImpactEffects {
        const pools = {
            explosionPool: this.explosionPool,
            sparkPool: this.sparkPool,
            debrisPool: this.debrisPool
        };

        const effects = this.impactTypeHandler.createImpactEffect(position, projectileType, options, pools);

        // Add effects to scene if not already there
        Object.values(effects).forEach((effect) => {
            if (effect && !effect.parent) {
                this._addToScene(effect);
            }
        });

        return effects;
    }

    /**
     * Get an explosion effect from the pool
     * @param position - Position for the explosion
     * @param duration - Duration of the explosion in milliseconds
     * @returns An explosion effect
     */
    getExplosion(position: THREE.Vector3, duration = 1000): ExplosionPoints {
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
     * @param position - Position for the spark effect
     * @param duration - Duration of the effect in milliseconds
     * @returns A spark effect
     */
    getSparkEffect(position: THREE.Vector3, duration = 500): SparkPoints {
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
     * @param position - Position for the debris effect
     * @param duration - Duration of the effect in milliseconds
     * @returns A debris effect
     */
    getDebrisEffect(position: THREE.Vector3, duration = 2000): DebrisGroup {
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
     * @param deltaTime - Time since last update
     */
    updateEffects(_deltaTime: number): void {
        this.updateExplosions();
        this.updateSparks();
        this.updateDebris();
    }

    /**
     * Update all active explosions
     */
    updateExplosions(): void {
        this.explosionFactory.updateExplosions(this.explosionPool.active, (explosion) => this.releaseExplosion(explosion));
    }

    /**
     * Update all active spark effects
     */
    updateSparks(): void {
        this.sparkFactory.updateSparks(this.sparkPool.active, (spark) => this.releaseSparkEffect(spark));
    }

    /**
     * Update all active debris effects
     */
    updateDebris(): void {
        this.debrisFactory.updateDebris(this.debrisPool.active, (debris) => this.releaseDebrisEffect(debris));
    }

    /**
     * Release effects back to pools
     */
    releaseExplosion(explosion: ExplosionPoints): void {
        if (explosion.parent) {
            this._removeFromParent(explosion);
        }
        this.explosionPool.release(explosion);
    }

    releaseSparkEffect(spark: SparkPoints): void {
        if (spark.parent) {
            this._removeFromParent(spark);
        }
        this.sparkPool.release(spark);
    }

    releaseDebrisEffect(debris: DebrisGroup): void {
        if (debris.parent) {
            this._removeFromParent(debris);
        }
        this.debrisPool.release(debris);
    }

    /**
     * Dispose all impact effect pools
     */
    dispose(): void {
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
                const mesh = piece as THREE.Mesh;
                if (mesh.material) {
                    if (Array.isArray(mesh.material)) {
                        mesh.material.forEach((material) => material.dispose());
                    } else {
                        mesh.material.dispose();
                    }
                }
                if (mesh.geometry) {
                    mesh.geometry.dispose();
                }
            }
        });
    }
}
