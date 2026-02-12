import { mainMessageBus } from '../../globals/messageBus.ts';
import type { Spaceship } from '../spaceship/spaceship';

export interface SessionStatsData {
    enemiesDestroyed: number;
    damageDealt: number;
    damageTaken: number;
    distanceTraveled: number;
    systemsVisited: number;
    creditsEarned: number;
    ironMined: number;
    goldMined: number;
    platinumMined: number;
    sessionDuration: number;
    lowestHullHP: number;
}

export class SessionStats {
    private enemiesDestroyed = 0;
    private damageDealt = 0;
    private damageTaken = 0;
    private distanceTraveled = 0;
    private visitedSystems = new Set<string>();
    private creditsEarned = 0;
    private ironMined = 0;
    private goldMined = 0;
    private platinumMined = 0;
    private startTime = Date.now();
    private lowestHullHP = 100;
    
    private lastPosition = { x: 0, y: 0, z: 0 };
    private lastCredits = 0;
    private lastCargo = { iron: 0, gold: 0, platinum: 0 };
    
    private spaceship: Spaceship | null = null;
    private unsubscribes: (() => void)[] = [];

    constructor() {
        this.reset();
        this.setupSubscriptions();
    }

    reset() {
        this.enemiesDestroyed = 0;
        this.damageDealt = 0;
        this.damageTaken = 0;
        this.distanceTraveled = 0;
        this.visitedSystems.clear();
        this.creditsEarned = 0;
        this.ironMined = 0;
        this.goldMined = 0;
        this.platinumMined = 0;
        this.startTime = Date.now();
        this.lowestHullHP = 100;
        this.lastPosition = { x: 0, y: 0, z: 0 };
        
        if (this.spaceship) {
            this.setSpaceship(this.spaceship);
        }
    }

    setSpaceship(spaceship: Spaceship) {
        this.spaceship = spaceship;
        this.lastPosition = { x: spaceship.position.x, y: spaceship.position.y, z: spaceship.position.z };
        this.lastCredits = spaceship.credits;
        this.lastCargo = { ...spaceship.cargo };
        this.lowestHullHP = spaceship.hull;
    }

    private setupSubscriptions() {
        this.unsubscribes.push(
            mainMessageBus.subscribe('enemy.destroyed', () => {
                this.enemiesDestroyed++;
            })
        );

        this.unsubscribes.push(
            mainMessageBus.subscribe('enemy.damaged', (msg: any) => {
                if (msg.data.source === 'player' || !msg.data.source) {
                    this.damageDealt += msg.data.damage || msg.data.amount || 0;
                }
            })
        );

        this.unsubscribes.push(
            mainMessageBus.subscribe('player.damaged', (msg: any) => {
                this.damageTaken += msg.data.damage || msg.data.amount || 0;
            })
        );
    }

    update() {
        if (!this.spaceship) return;

        // Track distance
        const pos = this.spaceship.position;
        const dx = pos.x - this.lastPosition.x;
        const dy = pos.y - this.lastPosition.y;
        const dz = pos.z - this.lastPosition.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        // Filter out jumps (e.g. docking/respawn)
        if (dist < 1000) {
            this.distanceTraveled += dist;
        }
        this.lastPosition = { x: pos.x, y: pos.y, z: pos.z };

        // Track lowest hull
        if (!this.spaceship.isDocked && this.spaceship.hull < this.lowestHullHP) {
            this.lowestHullHP = this.spaceship.hull;
        }

        // Track credits earned (only positive changes)
        if (this.spaceship.credits > this.lastCredits) {
            this.creditsEarned += (this.spaceship.credits - this.lastCredits);
        }
        this.lastCredits = this.spaceship.credits;

        // Track resources mined
        if (this.spaceship.cargo.iron > this.lastCargo.iron) {
            this.ironMined += (this.spaceship.cargo.iron - this.lastCargo.iron);
        }
        if (this.spaceship.cargo.gold > this.lastCargo.gold) {
            this.goldMined += (this.spaceship.cargo.gold - this.lastCargo.gold);
        }
        if (this.spaceship.cargo.platinum > this.lastCargo.platinum) {
            this.platinumMined += (this.spaceship.cargo.platinum - this.lastCargo.platinum);
        }
        this.lastCargo = { ...this.spaceship.cargo };
        
        // Track unique systems
        const game = (globalThis as any).game;
        if (game && game.environment && game.environment.starSystemGenerator) {
            const system = game.environment.starSystemGenerator.getCurrentSystemData();
            if (system && system.name) {
                this.visitedSystems.add(system.name);
            }
        }
    }

    getStats(): SessionStatsData {
        return {
            enemiesDestroyed: this.enemiesDestroyed,
            damageDealt: Math.floor(this.damageDealt),
            damageTaken: Math.floor(this.damageTaken),
            distanceTraveled: Math.floor(this.distanceTraveled),
            systemsVisited: Math.max(1, this.visitedSystems.size),
            creditsEarned: this.creditsEarned,
            ironMined: Math.floor(this.ironMined),
            goldMined: Math.floor(this.goldMined),
            platinumMined: Math.floor(this.platinumMined),
            sessionDuration: Date.now() - this.startTime,
            lowestHullHP: Math.max(0, Math.floor(this.lowestHullHP))
        };
    }
    
    destroy() {
        this.unsubscribes.forEach(unsub => unsub());
    }
}
