import {
  Mesh,
  SphereGeometry,
  MeshStandardMaterial,
  Scene,
  Vector3,
  AdditiveBlending,
} from 'three';
import type { MessageBus } from '../../core/messageBus';
import type { GameEventMap } from '../../core/events';
import { Position } from '../../ecs/components';

type LootType = 'iron' | 'gold' | 'platinum' | 'credits' | 'mixed';

interface LootDrop {
  mesh: Mesh;
  glow: Mesh;
  position: Vector3;
  type: LootType;
  amount: number;
  resourceType?: string;
  spawnTime: number;
  pulsePhase: number;
}

interface GameRenderer {
  _withGuard?: (fn: () => void) => void;
  add?: (obj: Mesh) => void;
  remove?: (obj: Mesh) => void;
}

interface GameGlobal {
  renderer?: GameRenderer;
  spaceship?: { mesh?: { position: Vector3 } };
  game?: {
    renderer?: GameRenderer;
    spaceship?: { mesh?: { position: Vector3 }; cargo?: Record<string, number>; credits?: number };
  };
}

const LOOT_COLORS: Record<LootType, number> = {
  iron: 0xff6600,
  gold: 0xffdd00,
  platinum: 0xeeeeee,
  credits: 0x00ff66,
  mixed: 0xff00ff,
};

const LOOT_LIFETIME = 30000;
const COLLECTION_RADIUS = 50;
const MAX_LOOT = 20;

export class LootDropManager {
  scene: Scene;
  lootDrops: LootDrop[];
  messageBus: MessageBus<GameEventMap>;
  unsubEnemy: (() => void) | null;
  unsubBoss: (() => void) | null;

  constructor(scene: Scene, messageBus: MessageBus<GameEventMap>) {
    this.scene = scene;
    this.lootDrops = [];
    this.messageBus = messageBus;
    this.unsubEnemy = null;
    this.unsubBoss = null;
  }

  init(): void {
    this.unsubEnemy = this.messageBus.subscribe('enemy.destroyed', (msg) => {
      const eid = typeof msg.data.entityId === 'number' ? msg.data.entityId : -1;
      if (eid !== -1) {
        const pos = new Vector3(Position.x[eid], Position.y[eid], Position.z[eid]);
        this.spawnRegularLoot(pos);
      }
    });

    this.unsubBoss = this.messageBus.subscribe('boss.destroyed', (msg) => {
      const eid = msg.data.bossEid;
      const pos = new Vector3(Position.x[eid], Position.y[eid], Position.z[eid]);
      const bossType = msg.data.bossType;
      this.spawnBossLoot(pos, bossType);
    });
  }

  spawnRegularLoot(position: Vector3): void {
    const types: Array<{ type: LootType; resourceType: string; amount: number }> = [
      { type: 'iron', resourceType: 'iron', amount: 5 + Math.floor(Math.random() * 10) },
      { type: 'gold', resourceType: 'gold', amount: 5 + Math.floor(Math.random() * 10) },
      { type: 'platinum', resourceType: 'platinum', amount: 5 + Math.floor(Math.random() * 10) },
    ];
    const loot = types[Math.floor(Math.random() * types.length)];
    this.createLootDrop(position, loot.type, loot.amount, loot.resourceType);
  }

  spawnBossLoot(position: Vector3, bossType: number): void {
    if (bossType === 0) {
      this.createLootDrop(position, 'mixed', 50 + Math.floor(Math.random() * 50), 'iron');
      this.createLootDrop(position.clone().add(new Vector3(20, 0, 0)), 'credits', 200 + Math.floor(Math.random() * 300), undefined);
    } else if (bossType === 1) {
      this.createLootDrop(position, 'credits', 300 + Math.floor(Math.random() * 300), undefined);
    } else if (bossType === 2) {
      this.createLootDrop(position, 'mixed', 30 + Math.floor(Math.random() * 30), 'gold');
      this.createLootDrop(position.clone().add(new Vector3(20, 0, 0)), 'credits', 400 + Math.floor(Math.random() * 400), undefined);
    }
  }

  createLootDrop(position: Vector3, type: LootType, amount: number, resourceType?: string): void {
    if (this.lootDrops.length >= MAX_LOOT) {
      const oldest = this.lootDrops.shift();
      if (oldest) this.removeLootDrop(oldest);
    }

    const geometry = new SphereGeometry(8, 16, 16);
    const material = new MeshStandardMaterial({
      color: LOOT_COLORS[type],
      emissive: LOOT_COLORS[type],
      emissiveIntensity: 1.5,
      metalness: 0.8,
      roughness: 0.2,
    });
    const mesh = new Mesh(geometry, material);
    mesh.position.copy(position);

    const glowGeometry = new SphereGeometry(12, 16, 16);
    const glowMaterial = new MeshStandardMaterial({
      color: LOOT_COLORS[type],
      emissive: LOOT_COLORS[type],
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.3,
      blending: AdditiveBlending,
    });
    const glow = new Mesh(glowGeometry, glowMaterial);
    glow.position.copy(position);

    this._addToScene(mesh);
    this._addToScene(glow);

    this.lootDrops.push({
      mesh,
      glow,
      position: position.clone(),
      type,
      amount,
      resourceType,
      spawnTime: performance.now(),
      pulsePhase: Math.random() * Math.PI * 2,
    });
  }

  update(deltaTime: number): void {
    const now = performance.now();
    const game = (window as GameGlobal).game;
    const playerPos = game?.spaceship?.mesh?.position;

    for (let i = this.lootDrops.length - 1; i >= 0; i--) {
      const loot = this.lootDrops[i];

      if (now - loot.spawnTime > LOOT_LIFETIME) {
        this.lootDrops.splice(i, 1);
        this.removeLootDrop(loot);
        continue;
      }

      loot.pulsePhase += deltaTime * 3;
      const scale = 1 + Math.sin(loot.pulsePhase) * 0.2;
      loot.mesh.scale.set(scale, scale, scale);
      loot.glow.scale.set(scale * 1.2, scale * 1.2, scale * 1.2);

      if (playerPos && playerPos.distanceTo(loot.position) < COLLECTION_RADIUS) {
        this.collectLoot(loot);
        this.lootDrops.splice(i, 1);
      }
    }
  }

  collectLoot(loot: LootDrop): void {
    const game = (window as GameGlobal).game;
    if (!game?.spaceship) return;

    if (loot.type === 'credits') {
      if (typeof game.spaceship.credits === 'number') {
        game.spaceship.credits += loot.amount;
      }
      this.showNotification(`+${loot.amount} CR`, LOOT_COLORS.credits);
    } else if (loot.resourceType && game.spaceship.cargo) {
      game.spaceship.cargo[loot.resourceType] = (game.spaceship.cargo[loot.resourceType] || 0) + loot.amount;
      this.showNotification(`+${loot.amount} ${loot.resourceType.toUpperCase()}`, LOOT_COLORS[loot.type]);
    }

    this.removeLootDrop(loot);
  }

  showNotification(message: string, color: number): void {
    const colorStr = `#${color.toString(16).padStart(6, '0')}`;
    const notif = document.createElement('div');
    notif.textContent = message;
    notif.style.cssText = `position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:${colorStr};font-size:24px;font-weight:bold;pointer-events:none;z-index:9999;text-shadow:0 0 10px ${colorStr}`;
    document.body.appendChild(notif);
    setTimeout(() => {
      notif.style.transition = 'opacity 0.5s, transform 0.5s';
      notif.style.opacity = '0';
      notif.style.transform = 'translate(-50%, -100px)';
      setTimeout(() => notif.remove(), 500);
    }, 1000);
  }

  removeLootDrop(loot: LootDrop): void {
    this._removeFromScene(loot.mesh);
    this._removeFromScene(loot.glow);
    loot.mesh.geometry.dispose();
    loot.glow.geometry.dispose();
    if (Array.isArray(loot.mesh.material)) {
      loot.mesh.material.forEach((m: MeshStandardMaterial) => m.dispose());
    } else {
      loot.mesh.material.dispose();
    }
    if (Array.isArray(loot.glow.material)) {
      loot.glow.material.forEach((m: MeshStandardMaterial) => m.dispose());
    } else {
      loot.glow.material.dispose();
    }
  }

  _addToScene(obj: Mesh): void {
    const game = (window as GameGlobal).game;
    if (game?.renderer?._withGuard) {
      game.renderer._withGuard(() => this.scene.add(obj));
    } else if (game?.renderer?.add) {
      game.renderer.add(obj);
    } else {
      this.scene.add(obj);
    }
  }

  _removeFromScene(obj: Mesh): void {
    const game = (window as GameGlobal).game;
    if (game?.renderer?._withGuard) {
      game.renderer._withGuard(() => this.scene.remove(obj));
    } else if (game?.renderer?.remove) {
      game.renderer.remove(obj);
    } else {
      this.scene.remove(obj);
    }
  }

  cleanup(): void {
    this.unsubEnemy?.();
    this.unsubBoss?.();
    this.lootDrops.forEach(loot => this.removeLootDrop(loot));
    this.lootDrops = [];
  }
}
