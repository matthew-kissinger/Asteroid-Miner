// events.js - typed events enum + optional dev validation

export const EVENT = Object.freeze({
  GAME_OVER: 'game.over',
  PLAYER_CREATED: 'player.created',
  TRANSFORM_UPDATED: 'transform.updated',
  VFX_EXPLOSION: 'vfx.explosion',
  MINING_START: 'player.mining.start',
  MINING_STOP: 'player.mining.stop',
  ENEMY_DESTROYED: 'enemy.destroyed',
  WEAPON_FIRED: 'weapon.fired',
});

const SCHEMA = {
  [EVENT.GAME_OVER]: { reason: 'string' },
  [EVENT.PLAYER_CREATED]: { entity: 'object' },
  [EVENT.TRANSFORM_UPDATED]: { entity: 'object' },
  [EVENT.VFX_EXPLOSION]: { position: 'object', color: 'number', size: 'number', duration: 'number' },
  [EVENT.MINING_START]: { sourceEntity: 'object', targetEntity: 'object' },
  [EVENT.MINING_STOP]: { sourceEntity: 'object' },
  [EVENT.ENEMY_DESTROYED]: { entityId: 'string' },
  [EVENT.WEAPON_FIRED]: { entity: 'object' },
};

export function validateEventPayload(type, data) {
  if (!window || !window.DEBUG_MODE) return true;
  const shape = SCHEMA[type];
  if (!shape) return true;
  if (typeof data !== 'object' || data == null) return warn(type, 'payload is not object');
  for (const [key, t] of Object.entries(shape)) {
    const v = data[key];
    if (t === 'object') {
      if (typeof v !== 'object' || v == null) return warn(type, `field ${key} must be object`);
    } else if (typeof v !== t) {
      return warn(type, `field ${key} must be ${t}`);
    }
  }
  return true;
}

function warn(type, msg) {
  console.warn(`[EVENT VALIDATION] ${type}: ${msg}`);
  return false;
}


