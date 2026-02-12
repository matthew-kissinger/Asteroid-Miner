import { debugLog } from '../../globals/debug.ts';
/**
 * Projectile Pool Manager
 *
 * Manages pools of projectiles, muzzle flashes, and trails for the combat system.
 * This reduces garbage collection by reusing objects instead of creating new ones.
 *
 * Refactored to use specialized pools for different projectile types and effects.
 */

import { LaserProjectilePool } from './projectiles/types/laser.ts';
import { MissileProjectilePool } from './projectiles/types/missile.ts';
import { PlasmaProjectilePool } from './projectiles/types/plasma.ts';
import { BulletProjectilePool } from './projectiles/types/bullet.ts';
import { TrailEffectsPool } from './projectiles/effects/trails.ts';
import { ImpactEffectsPool } from './projectiles/effects/impacts.ts';
import { MuzzleFlashPool } from './projectiles/effects/muzzleFlash.ts';
import { ObjectPool } from './ObjectPool.ts';
import * as THREE from 'three';

type SharedAssets = {
    projectileGeometry: THREE.BufferGeometry;
    projectileGlowGeometry: THREE.BufferGeometry;
    muzzleFlashGeometry: THREE.BufferGeometry;
    tracerGeometry: THREE.BufferGeometry;
    trailParticleGeometries: THREE.BufferGeometry[];
    projectileMaterial: THREE.MeshStandardMaterial;
    projectileGlowMaterial: THREE.MeshBasicMaterial;
    trailParticleMaterial: THREE.MeshBasicMaterial;
    muzzleFlashMaterial: THREE.MeshBasicMaterial;
    tracerLineMaterial: THREE.LineBasicMaterial;
    explosionParticleMaterial: THREE.PointsMaterial;
};

type RendererFacade = {
    _withGuard?: (fn: () => void) => void;
    add?: (object: THREE.Object3D) => void;
};

type ProjectileType = 'laser' | 'missile' | 'plasma' | 'bullet';

type LaserProjectile = ReturnType<LaserProjectilePool['get']>;
type MissileProjectile = ReturnType<MissileProjectilePool['get']>;
type PlasmaProjectile = ReturnType<PlasmaProjectilePool['get']>;
type BulletProjectile = ReturnType<BulletProjectilePool['get']>;
type ProjectileMesh = LaserProjectile | MissileProjectile | PlasmaProjectile | BulletProjectile;

type TracerUserData = {
    isTracer: true;
    active: boolean;
    pooled: boolean;
    startTime: number;
};

type TracerLine = THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial> & {
    userData: TracerUserData;
};

type MuzzleFlashMesh = ReturnType<MuzzleFlashPool['getMuzzleFlash']>;
type TrailContainer = ReturnType<TrailEffectsPool['getTrailContainer']>;
type TrailParticle = ReturnType<TrailEffectsPool['getTrailParticle']>;
type ExplosionPoints = ReturnType<ImpactEffectsPool['getExplosion']>;

type LegacyProjectilePool = {
    get: () => ProjectileMesh;
    release: (projectile: ProjectileMesh) => void;
    active: Set<ProjectileMesh>;
    availableCount: () => number;
    activeCount: () => number;
};

export class ProjectilePoolManager {
    scene: THREE.Scene;
    sharedAssets: SharedAssets;

    projectileGeometry: THREE.BufferGeometry;
    projectileGlowGeometry: THREE.BufferGeometry;
    muzzleFlashGeometry: THREE.BufferGeometry;
    tracerGeometry: THREE.BufferGeometry;
    trailParticleGeometries: THREE.BufferGeometry[];
    projectileMaterial: THREE.MeshStandardMaterial;
    projectileGlowMaterial: THREE.MeshBasicMaterial;
    trailParticleMaterial: THREE.MeshBasicMaterial;
    muzzleFlashMaterial: THREE.MeshBasicMaterial;
    tracerLineMaterial: THREE.LineBasicMaterial;
    explosionParticleMaterial: THREE.PointsMaterial;

    laserPool!: LaserProjectilePool;
    missilePool!: MissileProjectilePool;
    plasmaPool!: PlasmaProjectilePool;
    bulletPool!: BulletProjectilePool;
    trailEffects!: TrailEffectsPool;
    impactEffects!: ImpactEffectsPool;
    muzzleFlashEffects!: MuzzleFlashPool;
    tracerPool!: ObjectPool<TracerLine>;
    projectilePool!: LegacyProjectilePool;

    constructor(scene: THREE.Scene, sharedAssets: SharedAssets) {
        this.scene = scene;
        this.sharedAssets = sharedAssets;

        // Assign geometries and materials from sharedAssets
        this.projectileGeometry = sharedAssets.projectileGeometry;
        this.projectileGlowGeometry = sharedAssets.projectileGlowGeometry;
        this.muzzleFlashGeometry = sharedAssets.muzzleFlashGeometry;
        this.tracerGeometry = sharedAssets.tracerGeometry;
        this.trailParticleGeometries = sharedAssets.trailParticleGeometries;
        this.projectileMaterial = sharedAssets.projectileMaterial;
        this.projectileGlowMaterial = sharedAssets.projectileGlowMaterial;
        this.trailParticleMaterial = sharedAssets.trailParticleMaterial;
        this.muzzleFlashMaterial = sharedAssets.muzzleFlashMaterial;
        this.tracerLineMaterial = sharedAssets.tracerLineMaterial;
        this.explosionParticleMaterial = sharedAssets.explosionParticleMaterial;

        // Populate window.game with these shared assets (for legacy access if needed)
        this.populateWindowGameWithSharedAssets();

        // Create specialized pools
        this.initializePools();

        debugLog("ProjectilePoolManager initialized using pre-warmed shared assets and specialized pools");
    }

    populateWindowGameWithSharedAssets(): void {
        if (!window.game) window.game = {};
        Object.assign(window.game, this.sharedAssets);
    }

    initializePools(): void {
        // Create renderer facade functions for delegation
        const addToScene = (object: THREE.Object3D) => this._addToScene(object);
        const removeFromParent = (object: THREE.Object3D) => this._removeFromParent(object);

        // Initialize projectile type pools
        this.laserPool = new LaserProjectilePool(this.sharedAssets, addToScene, removeFromParent);
        this.missilePool = new MissileProjectilePool(this.sharedAssets, addToScene, removeFromParent);
        this.plasmaPool = new PlasmaProjectilePool(this.sharedAssets, addToScene, removeFromParent);
        this.bulletPool = new BulletProjectilePool(this.sharedAssets, addToScene, removeFromParent);

        // Initialize effect pools
        this.trailEffects = new TrailEffectsPool(this.sharedAssets, removeFromParent);
        this.impactEffects = new ImpactEffectsPool(this.sharedAssets, addToScene, removeFromParent);
        this.muzzleFlashEffects = new MuzzleFlashPool(this.sharedAssets, addToScene, removeFromParent);

        // Initialize tracer pool (still generic)
        this.initializeTracerPool();

        // Create legacy projectile pool for backward compatibility
        this.createLegacyProjectilePool();
    }

    initializeTracerPool(): void {
        this.tracerPool = new ObjectPool<TracerLine>(
            () => {
                const tracer = new THREE.Line(this.tracerGeometry.clone(), this.tracerLineMaterial.clone()) as TracerLine;
                tracer.userData = { isTracer: true, active: false, pooled: true, startTime: 0 };
                return tracer;
            },
            (tracer) => {
                tracer.position.set(0, 0, 0);
                tracer.visible = false;
                tracer.material.opacity = 0.6;
                tracer.userData.active = false;
                tracer.userData.startTime = 0;
            },
            20,
            5
        );
    }

    createLegacyProjectilePool(): void {
        this.projectilePool = {
            get: () => this.bulletPool.get(),
            release: (projectile) => {
                const type = (projectile.userData && projectile.userData.projectileType) || 'bullet';
                this.releaseProjectile(projectile, type);
            },
            active: new Set(),
            availableCount: () => this.bulletPool.availableCount(),
            activeCount: () => this.getAllActiveProjectiles().size
        };
    }

    // Factory Pattern - Get projectile by type
    getProjectile(type: ProjectileType | string = 'bullet'): ProjectileMesh {
        switch (type.toLowerCase()) {
            case 'laser':
                return this.laserPool.get();
            case 'missile':
                return this.missilePool.get();
            case 'plasma':
                return this.plasmaPool.get();
            case 'bullet':
            default:
                return this.bulletPool.get();
        }
    }

    // Effect factory methods
    getMuzzleFlash(weaponType = 'generic', position: THREE.Vector3 | null = null, direction: THREE.Vector3 | null = null): THREE.Mesh {
        return this.muzzleFlashEffects.getMuzzleFlash(weaponType, position, direction);
    }

    getTrailContainer(): TrailContainer {
        return this.trailEffects.getTrailContainer();
    }

    getTrailParticle(sizeIndex = 0): TrailParticle {
        return this.trailEffects.getTrailParticle(sizeIndex);
    }

    getTracer(): TracerLine {
        const tracer = this.tracerPool.get();
        tracer.visible = true;
        tracer.userData.active = true;
        tracer.userData.startTime = performance.now();
        if (!tracer.parent) this._addToScene(tracer);
        return tracer;
    }

    getExplosion(position: THREE.Vector3, duration = 1000): ExplosionPoints {
        return this.impactEffects.getExplosion(position, duration);
    }

    createImpactEffect(position: THREE.Vector3, projectileType: ProjectileType | string = 'bullet', options: Record<string, unknown> = {}): Record<string, THREE.Object3D> {
        return this.impactEffects.createImpactEffect(position, projectileType, options);
    }

    createTrailForProjectile(projectile: ProjectileMesh, options: Record<string, unknown> = {}): THREE.Object3D {
        return this.trailEffects.createTrailForProjectile(projectile, options);
    }

    // Release methods - delegate to appropriate pools
    releaseProjectile(projectile: ProjectileMesh, type: ProjectileType | string | null = null): void {
        if (!projectile || !projectile.userData || !projectile.userData.isProjectile) return;

        const projectileType = type || projectile.userData.projectileType || 'bullet';

        // Release trail if it exists
        const trail = projectile.userData.trail;
        if (trail) {
            this.releaseTrail(trail as TrailContainer);
            projectile.remove(trail);
            projectile.userData.trail = null;
            projectile.userData.trailParticles = null;
        }

        // Delegate to appropriate pool
        switch (projectileType.toLowerCase()) {
            case 'laser':
                this.laserPool.release(projectile as LaserProjectile);
                break;
            case 'missile':
                this.missilePool.release(projectile as MissileProjectile);
                break;
            case 'plasma':
                this.plasmaPool.release(projectile as PlasmaProjectile);
                break;
            case 'bullet':
            default:
                this.bulletPool.release(projectile as BulletProjectile);
                break;
        }
    }

    releaseMuzzleFlash(muzzleFlash: MuzzleFlashMesh): void {
        this.muzzleFlashEffects.release(muzzleFlash);
    }

    releaseTrail(trail: TrailContainer): void {
        this.trailEffects.releaseTrail(trail);
    }

    releaseTrailParticle(particle: TrailParticle): void {
        this.trailEffects.releaseTrailParticle(particle);
    }

    releaseExplosion(explosion: ExplosionPoints): void {
        this.impactEffects.releaseExplosion(explosion);
    }

    releaseTracer(tracer: TracerLine): void {
        if (!tracer || !tracer.userData || !tracer.userData.isTracer) return;
        if (tracer.parent) this._removeFromParent(tracer);
        this.tracerPool.release(tracer);
    }

    // Get all active projectiles from all pools
    getAllActiveProjectiles(): Set<ProjectileMesh> {
        const allActive = new Set<ProjectileMesh>();
        [this.laserPool, this.missilePool, this.plasmaPool, this.bulletPool].forEach((pool) => {
            pool.getActive().forEach((p) => allActive.add(p));
        });
        this.projectilePool.active = allActive;
        return allActive;
    }

    // Update all active objects from the pools
    update(deltaTime: number): void {
        // Update specialized projectile behaviors
        this.missilePool.getActive().forEach((missile) => this.missilePool.updateMissile(missile, deltaTime));
        this.plasmaPool.getActive().forEach((plasma) => this.plasmaPool.updatePlasma(plasma, deltaTime));
        this.bulletPool.getActive().forEach((bullet) => this.bulletPool.updateBullet(bullet, deltaTime));

        // Update effects
        this.muzzleFlashEffects.updateMuzzleFlashes(deltaTime);
        this.trailEffects.updateTrails(deltaTime);
        this.impactEffects.updateEffects(deltaTime);
        this.updateTracers(deltaTime);
    }

    updateTracers(_deltaTime: number): void {
        for (const tracer of this.tracerPool.active) {
            const opacity = Math.max(0, tracer.material.opacity - 1.5 * 0.016);
            if (opacity <= 0) {
                this.releaseTracer(tracer);
            } else {
                tracer.material.opacity = opacity;
            }
        }
    }

    // Dispose all pools and shared assets
    dispose(): void {
        // Dispose shared geometries
        [this.projectileGeometry, this.projectileGlowGeometry, this.muzzleFlashGeometry, this.tracerGeometry].forEach((geo) => geo && geo.dispose());
        if (this.trailParticleGeometries) {
            this.trailParticleGeometries.forEach((geo) => geo && geo.dispose());
        }

        // Dispose shared materials
        [
            this.projectileMaterial,
            this.projectileGlowMaterial,
            this.trailParticleMaterial,
            this.muzzleFlashMaterial,
            this.tracerLineMaterial
        ].forEach((mat) => mat && mat.dispose());

        // Dispose specialized pools
        [this.laserPool, this.missilePool, this.plasmaPool, this.bulletPool].forEach((pool) => pool && pool.dispose());

        // Dispose effect pools
        [this.trailEffects, this.impactEffects, this.muzzleFlashEffects].forEach((pool) => pool && pool.dispose());

        // Dispose tracer pool
        if (this.tracerPool) {
            this.tracerPool.dispose((tracer) => {
                if (tracer.parent) this._removeFromParent(tracer);
                if (tracer.material) tracer.material.dispose();
            });
        }

        debugLog("ProjectilePoolManager disposed all pools and shared assets");
    }

    // Renderer facade helpers
    private _getRenderer(): RendererFacade | null {
        return (window.game && window.game.renderer) || null;
    }

    private _addToScene(object: THREE.Object3D): void {
        const renderer = this._getRenderer();
        if (renderer && renderer._withGuard) {
            renderer._withGuard(() => renderer.add?.(object));
        } else if (this.scene && this.scene.add) {
            this.scene.add(object);
        }
    }

    private _removeFromScene(object: THREE.Object3D): void {
        const renderer = this._getRenderer();
        if (renderer && renderer._withGuard) {
            renderer._withGuard(() => this.scene.remove(object));
        } else if (this.scene && this.scene.remove) {
            this.scene.remove(object);
        }
    }

    private _removeFromParent(object: THREE.Object3D): void {
        if (!object || !object.parent) return;
        if (object.parent === this.scene) {
            this._removeFromScene(object);
        } else if (object.parent.remove) {
            object.parent.remove(object);
        }
    }
}
