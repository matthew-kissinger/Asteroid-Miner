// xpAwards.ts - Subscribes to activity events and awards XP via spaceship.addXP

import type { MessageBus } from '../../../core/messageBus.ts';
import type { GameEventMap } from '../../../core/events.ts';

const XP_PER_KILL = 20;
const XP_PER_BOSS_KILL = 200; // 10x normal enemy XP
const XP_PER_MINED_UNIT = 5;
const XP_PER_RESOURCE_SOLD = 2;
const XP_SYSTEM_DISCOVERED = 50;
const XP_ORB: Record<string, number> = {
  common: 10,
  uncommon: 20,
  rare: 30,
  epic: 40,
  legendary: 50
};

type SpaceshipWithXP = { addXP: (amount: number) => void };

let spaceshipRef: SpaceshipWithXP | null = null;
let unsubEnemy: (() => void) | null = null;
let unsubBoss: (() => void) | null = null;
let unsubMining: (() => void) | null = null;
let unsubTrading: (() => void) | null = null;
let unsubSystem: (() => void) | null = null;
let unsubOrb: (() => void) | null = null;

function addXP(amount: number): void {
  if (amount <= 0) return;
  spaceshipRef?.addXP(amount);
}

/**
 * Initialize XP awards: subscribe to activity events and call spaceship.addXP.
 * Call once when game has a spaceship (e.g. from gameInitializer).
 */
export function initXpAwards(messageBus: MessageBus<GameEventMap>, spaceship: SpaceshipWithXP): void {
  cleanupXpAwards();
  spaceshipRef = spaceship;

  unsubEnemy = messageBus.subscribe('enemy.destroyed', () => {
    addXP(XP_PER_KILL);
  });

  unsubBoss = messageBus.subscribe('boss.destroyed', () => {
    addXP(XP_PER_BOSS_KILL);
  });

  unsubMining = messageBus.subscribe('mining.resourceCollected', (msg: { data: GameEventMap['mining.resourceCollected'] }) => {
    addXP(msg.data.amount * XP_PER_MINED_UNIT);
  });

  unsubTrading = messageBus.subscribe('trading.resourceSold', (msg: { data: GameEventMap['trading.resourceSold'] }) => {
    addXP(msg.data.amount * XP_PER_RESOURCE_SOLD);
  });

  unsubSystem = messageBus.subscribe('system.discovered', () => {
    addXP(XP_SYSTEM_DISCOVERED);
  });

  unsubOrb = messageBus.subscribe('orb.collected', (msg: { data: GameEventMap['orb.collected'] }) => {
    const xp = XP_ORB[msg.data.rarity] ?? 10;
    addXP(xp);
  });
}

export function cleanupXpAwards(): void {
  spaceshipRef = null;
  unsubEnemy?.();
  unsubBoss?.();
  unsubMining?.();
  unsubTrading?.();
  unsubSystem?.();
  unsubOrb?.();
  unsubEnemy = unsubBoss = unsubMining = unsubTrading = unsubSystem = unsubOrb = null;
}
