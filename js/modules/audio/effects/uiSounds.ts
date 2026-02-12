// uiSounds.ts - Synthesized UI and stargate sound effects via Web Audio API (no external files)

/**
 * UISoundGenerator - Creates short, non-intrusive synthesized sounds for
 * stargate docking/undocking/warp, trading, mining complete, and UI clicks.
 * All sounds respect the given volume multiplier (SFX volume from AudioManager).
 */
export class UISoundGenerator {
    private ctx: AudioContext;
    private getVolume: () => number;

    constructor(ctx: AudioContext, getVolume: () => number) {
        this.ctx = ctx;
        this.getVolume = getVolume;
    }

    private masterGain(): GainNode {
        const g = this.ctx.createGain();
        g.gain.value = this.getVolume();
        return g;
    }

    /** Stargate docking: deep resonant hum + metallic clank */
    playStargateDock(): void {
        const now = this.ctx.currentTime;
        const gain = this.masterGain();
        gain.connect(this.ctx.destination);

        const hum = this.ctx.createOscillator();
        hum.type = 'sine';
        hum.frequency.setValueAtTime(80, now);
        hum.frequency.exponentialRampToValueAtTime(55, now + 0.4);
        const humGain = this.ctx.createGain();
        humGain.gain.setValueAtTime(0.15, now);
        humGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        hum.connect(humGain);
        humGain.connect(gain);
        hum.start(now);
        hum.stop(now + 0.5);

        const clank = this.ctx.createOscillator();
        clank.type = 'square';
        clank.frequency.setValueAtTime(400, now + 0.15);
        clank.frequency.exponentialRampToValueAtTime(100, now + 0.25);
        const clankGain = this.ctx.createGain();
        clankGain.gain.setValueAtTime(0.2, now + 0.15);
        clankGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        const clankFilter = this.ctx.createBiquadFilter();
        clankFilter.type = 'lowpass';
        clankFilter.frequency.value = 1200;
        clank.connect(clankFilter);
        clankFilter.connect(clankGain);
        clankGain.connect(gain);
        clank.start(now + 0.15);
        clank.stop(now + 0.28);
    }

    /** Stargate undocking: reverse hum + whoosh */
    playStargateUndock(): void {
        const now = this.ctx.currentTime;
        const gain = this.masterGain();
        gain.connect(this.ctx.destination);

        const hum = this.ctx.createOscillator();
        hum.type = 'sine';
        hum.frequency.setValueAtTime(55, now);
        hum.frequency.exponentialRampToValueAtTime(120, now + 0.35);
        const humGain = this.ctx.createGain();
        humGain.gain.setValueAtTime(0.12, now);
        humGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        hum.connect(humGain);
        humGain.connect(gain);
        hum.start(now);
        hum.stop(now + 0.4);

        const whoosh = this.ctx.createOscillator();
        whoosh.type = 'sawtooth';
        whoosh.frequency.setValueAtTime(200, now);
        whoosh.frequency.exponentialRampToValueAtTime(40, now + 0.3);
        const whooshGain = this.ctx.createGain();
        whooshGain.gain.setValueAtTime(0.06, now);
        whooshGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        const whooshFilter = this.ctx.createBiquadFilter();
        whooshFilter.type = 'lowpass';
        whooshFilter.frequency.setValueAtTime(800, now);
        whooshFilter.frequency.exponentialRampToValueAtTime(100, now + 0.3);
        whoosh.connect(whooshFilter);
        whooshFilter.connect(whooshGain);
        whooshGain.connect(gain);
        whoosh.start(now);
        whoosh.stop(now + 0.3);
    }

    /** Stargate warp travel: rising pitch sweep + phase-like distortion */
    playStargateWarp(): void {
        const now = this.ctx.currentTime;
        const duration = 1.8;
        const gain = this.masterGain();
        gain.connect(this.ctx.destination);

        const sweep = this.ctx.createOscillator();
        sweep.type = 'sine';
        sweep.frequency.setValueAtTime(110, now);
        sweep.frequency.exponentialRampToValueAtTime(880, now + duration * 0.7);
        sweep.frequency.setValueAtTime(880, now + duration * 0.7);
        sweep.frequency.exponentialRampToValueAtTime(2000, now + duration);
        const sweepGain = this.ctx.createGain();
        sweepGain.gain.setValueAtTime(0.08, now);
        sweepGain.gain.setValueAtTime(0.08, now + duration * 0.6);
        sweepGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        const sweepFilter = this.ctx.createBiquadFilter();
        sweepFilter.type = 'lowpass';
        sweepFilter.frequency.setValueAtTime(600, now);
        sweepFilter.frequency.exponentialRampToValueAtTime(3000, now + duration);
        sweep.connect(sweepFilter);
        sweepFilter.connect(sweepGain);
        sweepGain.connect(gain);
        sweep.start(now);
        sweep.stop(now + duration);

        const sub = this.ctx.createOscillator();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(55, now);
        sub.frequency.exponentialRampToValueAtTime(220, now + duration);
        const subGain = this.ctx.createGain();
        subGain.gain.setValueAtTime(0.06, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        sub.connect(subGain);
        subGain.connect(gain);
        sub.start(now);
        sub.stop(now + duration);
    }

    /** Purchase/upgrade: ka-ching + ascending chime */
    playPurchase(): void {
        const now = this.ctx.currentTime;
        const gain = this.masterGain();
        gain.connect(this.ctx.destination);

        const kaching = this.ctx.createOscillator();
        kaching.type = 'triangle';
        kaching.frequency.setValueAtTime(1200, now);
        kaching.frequency.setValueAtTime(800, now + 0.06);
        kaching.frequency.setValueAtTime(600, now + 0.12);
        const kachingGain = this.ctx.createGain();
        kachingGain.gain.setValueAtTime(0.2, now);
        kachingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        kaching.connect(kachingGain);
        kachingGain.connect(gain);
        kaching.start(now);
        kaching.stop(now + 0.18);

        const chime = this.ctx.createOscillator();
        chime.type = 'sine';
        chime.frequency.setValueAtTime(523, now + 0.1);
        chime.frequency.setValueAtTime(659, now + 0.2);
        chime.frequency.setValueAtTime(784, now + 0.3);
        const chimeGain = this.ctx.createGain();
        chimeGain.gain.setValueAtTime(0, now);
        chimeGain.gain.setValueAtTime(0.15, now + 0.1);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        chime.connect(chimeGain);
        chimeGain.connect(gain);
        chime.start(now + 0.1);
        chime.stop(now + 0.45);
    }

    /** Sell resources: coin cascade */
    playSell(): void {
        const now = this.ctx.currentTime;
        const gain = this.masterGain();
        gain.connect(this.ctx.destination);
        const freqs = [400, 520, 640, 760];
        freqs.forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = f;
            const g = this.ctx.createGain();
            const t = now + i * 0.06;
            g.gain.setValueAtTime(0, t);
            g.gain.setValueAtTime(0.12, t + 0.01);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
            osc.connect(g);
            g.connect(gain);
            osc.start(t);
            osc.stop(t + 0.15);
        });
    }

    /** Low fuel warning: single pulsing beep (called repeatedly by ambient system) */
    playLowFuelBeep(): void {
        const now = this.ctx.currentTime;
        const gain = this.masterGain();
        gain.connect(this.ctx.destination);
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 440;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.2, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(g);
        g.connect(gain);
        osc.start(now);
        osc.stop(now + 0.12);
    }

    /** Low hull warning: faster single beep (higher pitch) */
    playLowHullBeep(): void {
        const now = this.ctx.currentTime;
        const gain = this.masterGain();
        gain.connect(this.ctx.destination);
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 660;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.22, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(g);
        g.connect(gain);
        osc.start(now);
        osc.stop(now + 0.08);
    }

    /** Shield recharge complete: gentle ascending tone */
    playShieldRechargeComplete(): void {
        const now = this.ctx.currentTime;
        const gain = this.masterGain();
        gain.connect(this.ctx.destination);
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(330, now);
        osc.frequency.exponentialRampToValueAtTime(523, now + 0.35);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.08, now);
        g.gain.setValueAtTime(0.1, now + 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(g);
        g.connect(gain);
        osc.start(now);
        osc.stop(now + 0.4);
    }

    /** Mining complete: rock crumble (noise-like) + collection chime */
    playMiningComplete(): void {
        const now = this.ctx.currentTime;
        const gain = this.masterGain();
        gain.connect(this.ctx.destination);

        const crumble = this.ctx.createOscillator();
        crumble.type = 'sawtooth';
        crumble.frequency.setValueAtTime(80, now);
        crumble.frequency.exponentialRampToValueAtTime(25, now + 0.2);
        const crumbleGain = this.ctx.createGain();
        crumbleGain.gain.setValueAtTime(0.06, now);
        crumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        const crumbleFilter = this.ctx.createBiquadFilter();
        crumbleFilter.type = 'lowpass';
        crumbleFilter.frequency.value = 400;
        crumble.connect(crumbleFilter);
        crumbleFilter.connect(crumbleGain);
        crumbleGain.connect(gain);
        crumble.start(now);
        crumble.stop(now + 0.25);

        const chime = this.ctx.createOscillator();
        chime.type = 'sine';
        chime.frequency.setValueAtTime(392, now + 0.1);
        chime.frequency.setValueAtTime(523, now + 0.22);
        const chimeGain = this.ctx.createGain();
        chimeGain.gain.setValueAtTime(0, now);
        chimeGain.gain.setValueAtTime(0.14, now + 0.1);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        chime.connect(chimeGain);
        chimeGain.connect(gain);
        chime.start(now + 0.1);
        chime.stop(now + 0.4);
    }

    /** Menu/button click: subtle click/blip */
    playButtonClick(): void {
        const now = this.ctx.currentTime;
        const gain = this.masterGain();
        gain.connect(this.ctx.destination);
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 1200;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.15, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(g);
        g.connect(gain);
        osc.start(now);
        osc.stop(now + 0.05);
    }
}
