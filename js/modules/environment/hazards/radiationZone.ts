// radiationZone.ts - Radiation Zone environmental hazard
// A region of space with a visible greenish-yellow nebula that deals continuous hull damage

import {
    Group,
    Vector3,
    Color,
    SphereGeometry,
    MeshBasicMaterial,
    Mesh,
    BackSide,
    AdditiveBlending,
    Scene,
} from 'three';
import { debugLog } from '../../../globals/debug.ts';
import { mainMessageBus } from '../../../globals/messageBus.ts';

interface SpaceAnomaliesLike {
    createEnergyOrb: (rarity: string) => OrbData;
    getRandomOrbRarity: () => string;
}

interface OrbData {
    mesh: Mesh;
    rarity: string;
    value: number;
    size: number;
    color: Color;
    pulsePhase: number;
    pulseSpeed: number;
    glow: Mesh;
}

interface GameGlobal {
    spaceship?: {
        mesh?: { position: Vector3 };
        hull: number;
        maxHull: number;
        shield: number;
        maxShield: number;
    };
}

export class RadiationZone {
    scene: Scene;
    group: Group;
    position: Vector3;
    radius: number;
    id: string;
    active: boolean;

    // Visual elements
    outerShell: Mesh | null;
    innerGlow: Mesh | null;
    coreGlow: Mesh | null;

    // Damage
    damagePerSecond: number;
    damageAccumulator: number;

    // Player tracking
    playerInside: boolean;

    // Energy orbs
    energyOrbs: OrbData[];
    orbCount: number;

    // Pulse animation
    pulsePhase: number;

    constructor(scene: Scene, position: Vector3, radius?: number, spaceAnomalies?: SpaceAnomaliesLike) {
        this.scene = scene;
        this.group = new Group();
        this.position = position.clone();
        this.group.position.copy(this.position);
        this.radius = radius ?? (300 + Math.random() * 300);
        this.id = `radiation-zone-${Math.random().toString(36).substring(2, 9)}`;
        this.active = true;

        this.outerShell = null;
        this.innerGlow = null;
        this.coreGlow = null;

        this.damagePerSecond = 2;
        this.damageAccumulator = 0;

        this.playerInside = false;

        this.energyOrbs = [];
        this.orbCount = 2 + Math.floor(Math.random() * 3); // 2-4 orbs

        this.pulsePhase = Math.random() * Math.PI * 2;

        this._createVisuals();
        this._createEnergyOrbs(spaceAnomalies);
        this.scene.add(this.group);
        debugLog(`RadiationZone created at ${position.x.toFixed(0)}, ${position.y.toFixed(0)}, ${position.z.toFixed(0)} with radius ${this.radius.toFixed(0)}`);
    }

    private _createVisuals(): void {
        const greenYellow = new Color(0x88cc22);

        // Outer translucent shell
        const outerGeo = new SphereGeometry(this.radius, 24, 24);
        const outerMat = new MeshBasicMaterial({
            color: greenYellow,
            transparent: true,
            opacity: 0.06,
            side: BackSide,
            blending: AdditiveBlending,
            depthWrite: false,
        });
        this.outerShell = new Mesh(outerGeo, outerMat);
        this.group.add(this.outerShell);

        // Inner glow layer
        const innerGeo = new SphereGeometry(this.radius * 0.7, 20, 20);
        const innerMat = new MeshBasicMaterial({
            color: new Color(0xaadd44),
            transparent: true,
            opacity: 0.08,
            blending: AdditiveBlending,
            depthWrite: false,
        });
        this.innerGlow = new Mesh(innerGeo, innerMat);
        this.group.add(this.innerGlow);

        // Core glow
        const coreGeo = new SphereGeometry(this.radius * 0.3, 16, 16);
        const coreMat = new MeshBasicMaterial({
            color: new Color(0xccff66),
            transparent: true,
            opacity: 0.12,
            blending: AdditiveBlending,
            depthWrite: false,
        });
        this.coreGlow = new Mesh(coreGeo, coreMat);
        this.group.add(this.coreGlow);
    }

    private _createEnergyOrbs(spaceAnomalies?: SpaceAnomaliesLike): void {
        if (!spaceAnomalies) return;

        for (let i = 0; i < this.orbCount; i++) {
            const rarity = spaceAnomalies.getRandomOrbRarity();
            const orb = spaceAnomalies.createEnergyOrb(rarity);

            // Position orbs scattered within the zone center area
            const angle = (i / this.orbCount) * Math.PI * 2;
            const dist = this.radius * 0.2 + Math.random() * this.radius * 0.3;
            orb.mesh.position.set(
                Math.cos(angle) * dist,
                (Math.random() - 0.5) * this.radius * 0.3,
                Math.sin(angle) * dist,
            );

            this.group.add(orb.mesh);
            this.energyOrbs.push(orb);
        }
    }

    update(deltaTime: number): void {
        if (!this.active) return;

        // Pulse animation
        this.pulsePhase += deltaTime * 1.5;
        const pulse = 0.5 + Math.sin(this.pulsePhase) * 0.5; // 0-1

        if (this.outerShell) {
            const mat = this.outerShell.material as MeshBasicMaterial;
            mat.opacity = 0.04 + pulse * 0.04;
        }

        if (this.innerGlow) {
            const mat = this.innerGlow.material as MeshBasicMaterial;
            mat.opacity = 0.06 + pulse * 0.05;
            this.innerGlow.rotation.y += deltaTime * 0.1;
        }

        if (this.coreGlow) {
            const mat = this.coreGlow.material as MeshBasicMaterial;
            mat.opacity = 0.08 + pulse * 0.08;
            const scale = 1.0 + pulse * 0.15;
            this.coreGlow.scale.set(scale, scale, scale);
        }

        // Animate energy orbs
        for (let i = 0; i < this.energyOrbs.length; i++) {
            const orb = this.energyOrbs[i];
            const orbPulse = 1.0 + Math.sin(this.pulsePhase * orb.pulseSpeed + i) * 0.2;
            orb.mesh.scale.set(orbPulse, orbPulse, orbPulse);
            orb.mesh.rotation.y += deltaTime * 0.5;
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
            mainMessageBus.publish('hazard.entered', { hazardType: 'radiation', hazardId: this.id });
            mainMessageBus.publish('ui.notification', { message: 'RADIATION WARNING', type: 'warning' });
            debugLog('Player entered radiation zone');
        } else if (!this.playerInside && wasInside) {
            mainMessageBus.publish('hazard.exited', { hazardType: 'radiation', hazardId: this.id });
            debugLog('Player exited radiation zone');
        }

        // Continuous damage while inside (bypasses shields)
        if (this.playerInside) {
            this.damageAccumulator += deltaTime;
            if (this.damageAccumulator >= 1.0) {
                const ticks = Math.floor(this.damageAccumulator);
                this.damageAccumulator -= ticks;
                const damage = this.damagePerSecond * ticks;
                this._applyRadiationDamage(game, damage);
            }
        } else {
            this.damageAccumulator = 0;
        }
    }

    private _applyRadiationDamage(game: GameGlobal, damage: number): void {
        if (!game.spaceship) return;

        // Radiation bypasses shields - direct hull damage
        game.spaceship.hull = Math.max(0, game.spaceship.hull - damage);

        mainMessageBus.publish('hazard.damage', {
            hazardType: 'radiation',
            amount: damage,
            damageType: 'radiation',
        });
        mainMessageBus.publish('player.damaged', {
            amount: damage,
            source: 'radiation',
        });
    }

    /** Suppress shield regeneration while player is inside */
    isPlayerInside(): boolean {
        return this.playerInside;
    }

    getPosition(): Vector3 {
        return this.position;
    }

    getRadius(): number {
        return this.radius;
    }

    collectOrb(orbIndex: number): OrbData | null {
        if (orbIndex < 0 || orbIndex >= this.energyOrbs.length) return null;
        const orb = this.energyOrbs[orbIndex];
        if (!orb.mesh.visible) return null;

        orb.mesh.visible = false;
        return orb;
    }

    dispose(): void {
        this.active = false;

        // Dispose visual meshes
        const meshes = [this.outerShell, this.innerGlow, this.coreGlow];
        for (const mesh of meshes) {
            if (mesh) {
                mesh.geometry.dispose();
                const mat = mesh.material;
                if (Array.isArray(mat)) {
                    mat.forEach(m => m.dispose());
                } else {
                    mat.dispose();
                }
                this.group.remove(mesh);
            }
        }
        this.outerShell = null;
        this.innerGlow = null;
        this.coreGlow = null;

        // Dispose energy orbs
        for (const orb of this.energyOrbs) {
            if (orb.mesh) {
                orb.mesh.geometry?.dispose();
                const mat = orb.mesh.material;
                if (Array.isArray(mat)) {
                    mat.forEach(m => m.dispose());
                } else {
                    mat.dispose();
                }
                this.group.remove(orb.mesh);
            }
        }
        this.energyOrbs = [];

        this.scene.remove(this.group);
        debugLog(`RadiationZone ${this.id} disposed`);
    }
}
