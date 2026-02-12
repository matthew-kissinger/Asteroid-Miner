// combatSounds.ts - Synthesized combat sound effects using Web Audio API
import { AudioContextManager } from '../core/context.ts';
import { debugLog } from '../../../globals/debug.js';
import { mainMessageBus } from '../../../globals/messageBus.ts';
import type { Message, MessageCallback } from '../../../core/messageBus.ts';
import type { GameEventMap } from '../../../core/events.ts';

/**
 * CombatSounds synthesizes combat audio using Web Audio API oscillators
 * and noise generators. No external audio files are needed.
 *
 * Subscribes to the game message bus for:
 *  - weapon.fire        -> player laser shot
 *  - enemy.destroyed    -> explosion
 *  - player.damaged     -> shield hit or hull damage
 *  - player.mining.start / player.mining.stop -> mining laser hum
 */
export class CombatSounds {
    private ctxMgr: AudioContextManager;
    private getVolume: () => number;
    private isMuted: () => boolean;
    private unsubscribes: (() => void)[] = [];

    // Cooldowns (ms) to prevent sound spam
    private lastWeaponTime = 0;
    private lastEnemyFireTime = 0;
    private lastShieldTime = 0;
    private lastHullTime = 0;
    private readonly weaponCooldown = 80;
    private readonly enemyFireCooldown = 120;
    private readonly shieldCooldown = 100;
    private readonly hullCooldown = 150;

    // Mining laser state
    private miningOsc: OscillatorNode | null = null;
    private miningGain: GainNode | null = null;

    constructor(
        ctxMgr: AudioContextManager,
        getVolume: () => number,
        isMuted: () => boolean,
    ) {
        this.ctxMgr = ctxMgr;
        this.getVolume = getVolume;
        this.isMuted = isMuted;
    }

    /** Subscribe to combat events on the global message bus. */
    subscribeToEvents(): void {
        const bus = mainMessageBus;

        const sub1 = bus.subscribe('weapon.fire', ((_msg: Message<GameEventMap['weapon.fire']>) => {
            this.playPlayerWeaponFire();
        }) as MessageCallback<GameEventMap['weapon.fire']>);
        this.unsubscribes.push(sub1);

        const sub2 = bus.subscribe('enemy.destroyed', ((_msg: Message<GameEventMap['enemy.destroyed']>) => {
            this.playExplosion();
        }) as MessageCallback<GameEventMap['enemy.destroyed']>);
        this.unsubscribes.push(sub2);

        const sub3 = bus.subscribe('player.damaged', ((msg: Message<GameEventMap['player.damaged']>) => {
            const data = msg.data;
            if (data.shieldDamage && data.shieldDamage > 0) {
                this.playShieldHit();
            } else {
                this.playHullDamage();
            }
        }) as MessageCallback<GameEventMap['player.damaged']>);
        this.unsubscribes.push(sub3);

        const sub4 = bus.subscribe('entity.damaged', ((msg: Message<GameEventMap['entity.damaged']>) => {
            const data = msg.data;
            if (data.source === 'enemy' || data.source === 'drone') {
                this.playEnemyWeaponFire();
            }
        }) as MessageCallback<GameEventMap['entity.damaged']>);
        this.unsubscribes.push(sub4);

        const sub5 = bus.subscribe('player.mining.start', ((_msg: Message<GameEventMap['player.mining.start']>) => {
            this.startMiningLaser();
        }) as MessageCallback<GameEventMap['player.mining.start']>);
        this.unsubscribes.push(sub5);

        const sub6 = bus.subscribe('player.mining.stop', ((_msg: Message<GameEventMap['player.mining.stop']>) => {
            this.stopMiningLaser();
        }) as MessageCallback<GameEventMap['player.mining.stop']>);
        this.unsubscribes.push(sub6);

        debugLog('[CombatSounds] Subscribed to combat events');
    }

    // ── helpers ──────────────────────────────────────────────────

    private ctx(): AudioContext | null {
        return this.ctxMgr.getContext();
    }

    private canPlay(): boolean {
        const ac = this.ctx();
        return ac !== null && ac.state !== 'closed' && !this.isMuted();
    }

    /** Effective volume scaled down so combat sounds stay subtle. */
    private vol(scale = 0.25): number {
        return this.getVolume() * scale;
    }

    private throttle(lastRef: 'lastWeaponTime' | 'lastEnemyFireTime' | 'lastShieldTime' | 'lastHullTime', cooldown: number): boolean {
        const now = performance.now();
        if (now - this[lastRef] < cooldown) return false;
        this[lastRef] = now;
        return true;
    }

    // ── sound synthesis ─────────────────────────────────────────

    /**
     * Player weapon fire: punchy laser zap.
     * Sine swept 1200→400 Hz + sawtooth burst, ~100ms.
     */
    playPlayerWeaponFire(): void {
        if (!this.canPlay() || !this.throttle('lastWeaponTime', this.weaponCooldown)) return;
        const ac = this.ctx()!;
        const now = ac.currentTime;
        const dur = 0.10;

        const gain = ac.createGain();
        gain.gain.setValueAtTime(this.vol(0.18), now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
        gain.connect(ac.destination);

        // Sine sweep
        const osc1 = ac.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(1200, now);
        osc1.frequency.exponentialRampToValueAtTime(400, now + dur);
        osc1.connect(gain);
        osc1.start(now);
        osc1.stop(now + dur);

        // Sawtooth click layer
        const gain2 = ac.createGain();
        gain2.gain.setValueAtTime(this.vol(0.08), now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.6);
        gain2.connect(ac.destination);

        const osc2 = ac.createOscillator();
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(800, now);
        osc2.frequency.exponentialRampToValueAtTime(200, now + dur * 0.6);
        osc2.connect(gain2);
        osc2.start(now);
        osc2.stop(now + dur);
    }

    /**
     * Enemy weapon fire: deeper, more menacing.
     * Square wave swept 600→150 Hz, ~120ms.
     */
    playEnemyWeaponFire(): void {
        if (!this.canPlay() || !this.throttle('lastEnemyFireTime', this.enemyFireCooldown)) return;
        const ac = this.ctx()!;
        const now = ac.currentTime;
        const dur = 0.12;

        const gain = ac.createGain();
        gain.gain.setValueAtTime(this.vol(0.14), now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
        gain.connect(ac.destination);

        const osc = ac.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + dur);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + dur);
    }

    /**
     * Explosion: white noise burst + low-frequency rumble, ~500ms.
     */
    playExplosion(): void {
        if (!this.canPlay()) return;
        const ac = this.ctx()!;
        const now = ac.currentTime;
        const dur = 0.5;

        // White noise burst via buffer source
        const bufLen = Math.ceil(ac.sampleRate * dur);
        const buf = ac.createBuffer(1, bufLen, ac.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufLen; i++) {
            data[i] = (Math.random() * 2 - 1);
        }
        const noiseSrc = ac.createBufferSource();
        noiseSrc.buffer = buf;

        const noiseGain = ac.createGain();
        noiseGain.gain.setValueAtTime(this.vol(0.22), now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + dur);
        noiseSrc.connect(noiseGain);
        noiseGain.connect(ac.destination);
        noiseSrc.start(now);
        noiseSrc.stop(now + dur);

        // Low rumble oscillator
        const rumbleGain = ac.createGain();
        rumbleGain.gain.setValueAtTime(this.vol(0.20), now);
        rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.8);
        rumbleGain.connect(ac.destination);

        const rumble = ac.createOscillator();
        rumble.type = 'sine';
        rumble.frequency.setValueAtTime(60, now);
        rumble.frequency.exponentialRampToValueAtTime(30, now + dur * 0.8);
        rumble.connect(rumbleGain);
        rumble.start(now);
        rumble.stop(now + dur);
    }

    /**
     * Shield hit: high metallic ping, ~200ms.
     */
    playShieldHit(): void {
        if (!this.canPlay() || !this.throttle('lastShieldTime', this.shieldCooldown)) return;
        const ac = this.ctx()!;
        const now = ac.currentTime;
        const dur = 0.20;

        const gain = ac.createGain();
        gain.gain.setValueAtTime(this.vol(0.16), now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
        gain.connect(ac.destination);

        // High sine ping
        const osc1 = ac.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(2400, now);
        osc1.frequency.exponentialRampToValueAtTime(1800, now + dur);
        osc1.connect(gain);
        osc1.start(now);
        osc1.stop(now + dur);

        // Metallic overtone
        const gain2 = ac.createGain();
        gain2.gain.setValueAtTime(this.vol(0.08), now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.5);
        gain2.connect(ac.destination);

        const osc2 = ac.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(4800, now);
        osc2.connect(gain2);
        osc2.start(now);
        osc2.stop(now + dur);
    }

    /**
     * Hull damage: crunchy distortion + low thud, ~300ms.
     */
    playHullDamage(): void {
        if (!this.canPlay() || !this.throttle('lastHullTime', this.hullCooldown)) return;
        const ac = this.ctx()!;
        const now = ac.currentTime;
        const dur = 0.30;

        // Distorted square burst
        const distGain = ac.createGain();
        distGain.gain.setValueAtTime(this.vol(0.14), now);
        distGain.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.6);
        distGain.connect(ac.destination);

        const osc1 = ac.createOscillator();
        osc1.type = 'square';
        osc1.frequency.setValueAtTime(300, now);
        osc1.frequency.exponentialRampToValueAtTime(80, now + dur * 0.6);
        osc1.connect(distGain);
        osc1.start(now);
        osc1.stop(now + dur);

        // Short noise crunch
        const crunchLen = Math.ceil(ac.sampleRate * dur * 0.4);
        const crunchBuf = ac.createBuffer(1, crunchLen, ac.sampleRate);
        const cd = crunchBuf.getChannelData(0);
        for (let i = 0; i < crunchLen; i++) {
            cd[i] = (Math.random() * 2 - 1);
        }
        const crunchSrc = ac.createBufferSource();
        crunchSrc.buffer = crunchBuf;
        const crunchGain = ac.createGain();
        crunchGain.gain.setValueAtTime(this.vol(0.10), now);
        crunchGain.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.4);
        crunchSrc.connect(crunchGain);
        crunchGain.connect(ac.destination);
        crunchSrc.start(now);
        crunchSrc.stop(now + dur);

        // Low thud
        const thudGain = ac.createGain();
        thudGain.gain.setValueAtTime(this.vol(0.18), now);
        thudGain.gain.exponentialRampToValueAtTime(0.001, now + dur);
        thudGain.connect(ac.destination);

        const thud = ac.createOscillator();
        thud.type = 'sine';
        thud.frequency.setValueAtTime(90, now);
        thud.frequency.exponentialRampToValueAtTime(40, now + dur);
        thud.connect(thudGain);
        thud.start(now);
        thud.stop(now + dur);
    }

    /**
     * Mining laser: sustained hum (continuous oscillator).
     */
    startMiningLaser(): void {
        if (!this.canPlay() || this.miningOsc) return;
        const ac = this.ctx()!;

        this.miningGain = ac.createGain();
        this.miningGain.gain.setValueAtTime(0.001, ac.currentTime);
        this.miningGain.gain.linearRampToValueAtTime(this.vol(0.10), ac.currentTime + 0.15);
        this.miningGain.connect(ac.destination);

        this.miningOsc = ac.createOscillator();
        this.miningOsc.type = 'sawtooth';
        this.miningOsc.frequency.setValueAtTime(180, ac.currentTime);
        this.miningOsc.connect(this.miningGain);
        this.miningOsc.start();
    }

    stopMiningLaser(): void {
        if (!this.miningOsc || !this.miningGain) return;
        const ac = this.ctx();
        if (ac) {
            const now = ac.currentTime;
            this.miningGain.gain.cancelScheduledValues(now);
            this.miningGain.gain.setValueAtTime(this.miningGain.gain.value, now);
            this.miningGain.gain.linearRampToValueAtTime(0.001, now + 0.1);
            this.miningOsc.stop(now + 0.15);
        } else {
            try { this.miningOsc.stop(); } catch (_e) { /* already stopped */ }
        }
        this.miningOsc = null;
        this.miningGain = null;
    }

    /** Unsubscribe from all events and stop continuous sounds. */
    cleanup(): void {
        this.stopMiningLaser();
        for (const unsub of this.unsubscribes) {
            unsub();
        }
        this.unsubscribes = [];
        debugLog('[CombatSounds] Cleaned up');
    }
}
