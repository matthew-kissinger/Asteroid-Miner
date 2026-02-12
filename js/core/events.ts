// events.ts - typed events enum + optional dev validation

import { DEBUG_MODE } from '../globals/debug.ts';
import type { THREE } from '../../src/three-imports.ts';

type Vector3 = THREE.Vector3;

/**
 * Type-safe event map defining all game events and their payload types.
 * Add new events here to get compile-time type safety across the codebase.
 */
export interface GameEventMap extends Record<string, unknown> {
    // Game lifecycle
    'game.over': { reason: string; source?: string; type?: string; collisionType?: string };
    'world.initialized': Record<string, never>;
    'world.preUpdate': { deltaTime: number; time?: number };
    'world.postUpdate': { deltaTime: number; time?: number };
    'intro.completed': Record<string, never>;

    // Player events
    'player.created': { entity: number };
    'player.damaged': { entityId?: number; amount?: number; source?: string; damage?: number; shieldDamage?: number; position?: Vector3 };
    'player.healed': { amount: number; position?: Vector3 };
    'player.docked': { stationId?: string };
    'player.undocked': { health?: number; maxHealth?: number };
    'player.levelup': Record<string, never>;
    'player.syncHealth': { health: number; maxHealth: number };
    'player.requestUndock': { force?: boolean; forced?: boolean; reason?: string };

    // Mining
    'player.mining.start': { sourceEntity: number; targetEntity: number };
    'player.mining.stop': { sourceEntity: number };

    // Combat & damage
    'enemy.destroyed': { entityId: string | number };
    'enemy.damaged': { entityId: number; amount: number; source?: string; damage?: number; position?: Vector3 };
    'entity.damage': { entityId: number; amount: number; source?: string };
    'entity.damaged': { entityId: number; amount: number; source?: string; damage?: number; damageType?: string; position?: Vector3 };
    'entity.destroyed': { entityId: number };
    'weapon.fire': { entity: number; position?: Vector3 };

    // Visual effects
    'vfx.explosion': { position: Vector3; color: number; size: number; duration: number };
    'explosion': { position: Vector3; color?: number; size?: number };
    'transform.updated': { entity: number };

    // Input
    'input.vibrate': { intensity: number; duration: number };
    'input.lockOnToggle': Record<string, never>;
    'input.deployLaser': Record<string, never>;
    'input.pickupInteract': Record<string, never>;

    // UI
    'ui.notification': { message: string; type?: 'info' | 'warning' | 'error' };

    // Horde mode
    'horde.activated': { wave?: number; startTime?: number };

    // XP and progression
    'xp.gained': { amount: number; newTotal: number; rank: number };
    'rank.up': { rank: number; rankName: string };
    'mining.resourceCollected': { amount: number; resourceType: string };
    'mining.asteroidDepleted': { entityId?: number };
    'trading.resourceSold': { amount: number; resourceType: string };
    'trading.purchase': Record<string, never>;
    'system.discovered': { systemId: string };
    'orb.collected': { rarity: string };
    'stargate.warpStart': { systemId: string };
    'stargate.warpComplete': { systemId: string };
    'player.shieldRecharged': Record<string, never>;
}

export const EVENT = Object.freeze({
    GAME_OVER: 'game.over',
    PLAYER_CREATED: 'player.created',
    TRANSFORM_UPDATED: 'transform.updated',
    VFX_EXPLOSION: 'vfx.explosion',
    MINING_START: 'player.mining.start',
    MINING_STOP: 'player.mining.stop',
    ENEMY_DESTROYED: 'enemy.destroyed',
    WEAPON_FIRED: 'weapon.fired',
    INPUT_VIBRATE: 'input.vibrate',
    XP_GAINED: 'xp.gained',
    RANK_UP: 'rank.up',
} as const);

const SCHEMA: Record<string, Record<string, string>> = {
    [EVENT.GAME_OVER]: { reason: 'string' },
    [EVENT.PLAYER_CREATED]: { entity: 'object' },
    [EVENT.TRANSFORM_UPDATED]: { entity: 'object' },
    [EVENT.VFX_EXPLOSION]: { position: 'object', color: 'number', size: 'number', duration: 'number' },
    [EVENT.MINING_START]: { sourceEntity: 'object', targetEntity: 'object' },
    [EVENT.MINING_STOP]: { sourceEntity: 'object' },
    [EVENT.ENEMY_DESTROYED]: { entityId: 'string' },
    [EVENT.WEAPON_FIRED]: { entity: 'object' },
    [EVENT.INPUT_VIBRATE]: { intensity: 'number', duration: 'number' },
    [EVENT.XP_GAINED]: { amount: 'number', newTotal: 'number', rank: 'number' },
    [EVENT.RANK_UP]: { rank: 'number', rankName: 'string' },
};

export function validateEventPayload(type: string, data: unknown): boolean {
    if (!DEBUG_MODE || !DEBUG_MODE.enabled) return true;
    const shape = SCHEMA[type];
    if (!shape) return true;
    if (typeof data !== 'object' || data == null) return warn(type, 'payload is not object');
    for (const [key, t] of Object.entries(shape)) {
        const v = (data as Record<string, unknown>)[key];
        if (t === 'object') {
            if (typeof v !== 'object' || v == null) return warn(type, `field ${key} must be object`);
        } else if (typeof v !== t) {
            return warn(type, `field ${key} must be ${t}`);
        }
    }
    return true;
}

function warn(type: string, msg: string): boolean {
    console.warn(`[EVENT VALIDATION] ${type}: ${msg}`);
    return false;
}
