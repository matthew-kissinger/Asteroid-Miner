// asteroidStorm.ts - Asteroid Storm Zone environmental hazard
// A region of space with fast-moving asteroid chunks that deal contact damage

import {
    Group,
    Vector3,
    Matrix4,
    Quaternion,
    Euler,
    Color,
    IcosahedronGeometry,
    MeshStandardMaterial,
    InstancedMesh,
    SphereGeometry,
    MeshBasicMaterial,
    Mesh,
    BackSide,
    AdditiveBlending,
    Scene,
} from 'three';
import { debugLog } from '../../../globals/debug.ts';
import { mainMessageBus } from '../../../globals/messageBus.ts';

interface StormAsteroidState {
    position: Vector3;
    velocity: Vector3;
    rotation: Euler;
    rotationSpeed: Vector3;
    scale: number;
}

interface GameGlobal {
    spaceship?: { mesh?: { position: Vector3 }; hull: number; maxHull: number; shield: number; maxShield: number };
}

export class AsteroidStorm {
    scene: Scene;
    group: Group;
    position: Vector3;
    radius: number;
    id: string;
    active: boolean;

    instancedMesh: InstancedMesh | null;
    asteroidStates: StormAsteroidState[];
    asteroidCount: number;
    boundaryMesh: Mesh | null;

    // Damage
    damageMin: number;
    damageMax: number;
    damageCooldown: number;
    lastDamageTime: number;

    // Player tracking
    playerInside: boolean;

    // Reusable temp objects
    private _tempMatrix: Matrix4;
    private _tempQuat: Quaternion;
    private _tempVec: Vector3;
    private _tempEuler: Euler;

    constructor(scene: Scene, position: Vector3, radius?: number) {
        this.scene = scene;
        this.group = new Group();
        this.position = position.clone();
        this.group.position.copy(this.position);
        this.radius = radius ?? (500 + Math.random() * 300);
        this.id = `asteroid-storm-${Math.random().toString(36).substring(2, 9)}`;
        this.active = true;

        this.instancedMesh = null;
        this.asteroidStates = [];
        this.asteroidCount = 15 + Math.floor(Math.random() * 11); // 15-25
        this.boundaryMesh = null;

        this.damageMin = 5;
        this.damageMax = 10;
        this.damageCooldown = 0.5; // seconds between damage ticks
        this.lastDamageTime = 0;

        this.playerInside = false;

        this._tempMatrix = new Matrix4();
        this._tempQuat = new Quaternion();
        this._tempVec = new Vector3();
        this._tempEuler = new Euler();

        this._createVisuals();
        this.scene.add(this.group);
        debugLog(`AsteroidStorm created at ${position.x.toFixed(0)}, ${position.y.toFixed(0)}, ${position.z.toFixed(0)} with radius ${this.radius.toFixed(0)}`);
    }

    private _createVisuals(): void {
        // Boundary visualization - subtle translucent sphere
        const boundaryGeo = new SphereGeometry(this.radius, 16, 16);
        const boundaryMat = new MeshBasicMaterial({
            color: 0x886644,
            transparent: true,
            opacity: 0.04,
            side: BackSide,
            blending: AdditiveBlending,
            depthWrite: false,
        });
        this.boundaryMesh = new Mesh(boundaryGeo, boundaryMat);
        this.group.add(this.boundaryMesh);

        // Create instanced mesh for storm asteroids
        const asteroidGeo = new IcosahedronGeometry(1, 0);
        const asteroidMat = new MeshStandardMaterial({
            color: new Color(0x887766),
            roughness: 0.7,
            metalness: 0.3,
            flatShading: true,
            emissive: new Color(0x332211),
            emissiveIntensity: 0.15,
        });

        this.instancedMesh = new InstancedMesh(asteroidGeo, asteroidMat, this.asteroidCount);
        this.instancedMesh.instanceMatrix.setUsage(35048); // DynamicDrawUsage

        // Initialize asteroid states
        for (let i = 0; i < this.asteroidCount; i++) {
            const state = this._createAsteroidState();
            this.asteroidStates.push(state);
            this._updateInstanceMatrix(i, state);
        }

        this.instancedMesh.instanceMatrix.needsUpdate = true;
        this.group.add(this.instancedMesh);
    }

    private _createAsteroidState(): StormAsteroidState {
        const pos = new Vector3(
            (Math.random() - 0.5) * 2 * this.radius,
            (Math.random() - 0.5) * 2 * this.radius,
            (Math.random() - 0.5) * 2 * this.radius,
        );
        // Clamp within sphere
        if (pos.length() > this.radius) {
            pos.normalize().multiplyScalar(Math.random() * this.radius);
        }

        const speed = 40 + Math.random() * 60; // 40-100 units/s
        const vel = new Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
        ).normalize().multiplyScalar(speed);

        return {
            position: pos,
            velocity: vel,
            rotation: new Euler(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2),
            rotationSpeed: new Vector3(
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 4,
            ),
            scale: 0.5 + Math.random() * 1.5, // 0.5-2 unit scale
        };
    }

    private _updateInstanceMatrix(index: number, state: StormAsteroidState): void {
        this._tempEuler.copy(state.rotation);
        this._tempQuat.setFromEuler(this._tempEuler);
        this._tempVec.set(state.scale, state.scale, state.scale);
        this._tempMatrix.compose(state.position, this._tempQuat, this._tempVec);
        this.instancedMesh!.setMatrixAt(index, this._tempMatrix);
    }

    update(deltaTime: number): void {
        if (!this.active || !this.instancedMesh) return;

        let matricesChanged = false;

        // Update asteroid positions
        for (let i = 0; i < this.asteroidStates.length; i++) {
            const state = this.asteroidStates[i];

            // Move asteroid
            state.position.x += state.velocity.x * deltaTime;
            state.position.y += state.velocity.y * deltaTime;
            state.position.z += state.velocity.z * deltaTime;

            // Tumble rotation
            state.rotation.x += state.rotationSpeed.x * deltaTime;
            state.rotation.y += state.rotationSpeed.y * deltaTime;
            state.rotation.z += state.rotationSpeed.z * deltaTime;

            // Recycle if out of bounds
            if (state.position.length() > this.radius * 1.1) {
                const newState = this._createAsteroidState();
                // Spawn at edge coming inward
                newState.position.normalize().multiplyScalar(this.radius * 0.95);
                newState.velocity.copy(newState.position).negate().normalize().multiplyScalar(40 + Math.random() * 60);
                // Add slight random deviation
                newState.velocity.x += (Math.random() - 0.5) * 20;
                newState.velocity.y += (Math.random() - 0.5) * 20;
                newState.velocity.z += (Math.random() - 0.5) * 20;
                this.asteroidStates[i] = newState;
            }

            this._updateInstanceMatrix(i, this.asteroidStates[i]);
            matricesChanged = true;
        }

        if (matricesChanged) {
            this.instancedMesh.instanceMatrix.needsUpdate = true;
        }

        // Check player proximity
        this._checkPlayerProximity(deltaTime);
    }

    private _checkPlayerProximity(deltaTime: number): void {
        const game = (window as unknown as { game?: GameGlobal }).game;
        if (!game?.spaceship?.mesh) return;

        const playerPos = game.spaceship.mesh.position;
        const distToCenter = playerPos.distanceTo(this.position);
        const wasInside = this.playerInside;
        this.playerInside = distToCenter < this.radius;

        // Entry/exit notifications
        if (this.playerInside && !wasInside) {
            mainMessageBus.publish('hazard.entered', { hazardType: 'asteroid_storm', hazardId: this.id });
            mainMessageBus.publish('ui.notification', { message: 'ENTERING ASTEROID STORM', type: 'warning' });
            debugLog('Player entered asteroid storm zone');
        } else if (!this.playerInside && wasInside) {
            mainMessageBus.publish('hazard.exited', { hazardType: 'asteroid_storm', hazardId: this.id });
            debugLog('Player exited asteroid storm zone');
        }

        // Damage check - contact with storm asteroids
        if (this.playerInside) {
            this.lastDamageTime += deltaTime;
            if (this.lastDamageTime >= this.damageCooldown) {
                // Check actual proximity to individual asteroids
                const localPlayerPos = this._tempVec.copy(playerPos).sub(this.position);
                for (let i = 0; i < this.asteroidStates.length; i++) {
                    const dist = localPlayerPos.distanceTo(this.asteroidStates[i].position);
                    const hitRadius = this.asteroidStates[i].scale * 3; // generous hit detection
                    if (dist < hitRadius) {
                        this._applyDamage(game);
                        this.lastDamageTime = 0;
                        break;
                    }
                }
            }
        }
    }

    private _applyDamage(game: GameGlobal): void {
        if (!game.spaceship) return;

        const damage = this.damageMin + Math.random() * (this.damageMax - this.damageMin);

        // Damage shields first, then hull
        if (game.spaceship.shield > 0) {
            const shieldDamage = Math.min(game.spaceship.shield, damage);
            game.spaceship.shield -= shieldDamage;
            const remainingDamage = damage - shieldDamage;
            if (remainingDamage > 0) {
                game.spaceship.hull = Math.max(0, game.spaceship.hull - remainingDamage);
            }
        } else {
            game.spaceship.hull = Math.max(0, game.spaceship.hull - damage);
        }

        mainMessageBus.publish('hazard.damage', {
            hazardType: 'asteroid_storm',
            amount: damage,
            damageType: 'impact',
        });
        mainMessageBus.publish('player.damaged', {
            amount: damage,
            source: 'asteroid_storm',
        });
    }

    isPlayerInside(): boolean {
        return this.playerInside;
    }

    getPosition(): Vector3 {
        return this.position;
    }

    getRadius(): number {
        return this.radius;
    }

    dispose(): void {
        this.active = false;

        if (this.instancedMesh) {
            this.instancedMesh.geometry.dispose();
            const mat = this.instancedMesh.material;
            if (Array.isArray(mat)) {
                mat.forEach(m => m.dispose());
            } else {
                mat.dispose();
            }
            this.group.remove(this.instancedMesh);
            this.instancedMesh = null;
        }

        if (this.boundaryMesh) {
            this.boundaryMesh.geometry.dispose();
            const mat = this.boundaryMesh.material;
            if (Array.isArray(mat)) {
                mat.forEach(m => m.dispose());
            } else {
                mat.dispose();
            }
            this.group.remove(this.boundaryMesh);
            this.boundaryMesh = null;
        }

        this.scene.remove(this.group);
        this.asteroidStates = [];
        debugLog(`AsteroidStorm ${this.id} disposed`);
    }
}
