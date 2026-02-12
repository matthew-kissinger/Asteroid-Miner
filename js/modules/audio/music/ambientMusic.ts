// ambientMusic.ts - Procedural ambient space music using Web Audio API
import { AudioContextManager } from '../core/context.ts';
import { debugLog } from '../../../globals/debug.js';

/**
 * AmbientMusic generates procedural space-themed ambient music.
 * It uses multiple synthesis layers to create an immersive atmosphere.
 * No external audio files are required.
 */
export class AmbientMusic {
    private ctxMgr: AudioContextManager;
    private getVolume: () => number;
    private isMuted: () => boolean;

    private masterGain: GainNode | null = null;
    private isPlaying: boolean = false;

    // Pad layer
    private padOscillators: OscillatorNode[] = [];
    private padGains: GainNode[] = [];
    private padLFOs: OscillatorNode[] = [];
    private padCycleInterval: any = null;
    private currentPadIndex: number = 0;

    // Drone layer
    private droneOsc: OscillatorNode | null = null;
    private droneGain: GainNode | null = null;
    private droneLFO: OscillatorNode | null = null;

    // Intervals for random events
    private shimmerInterval: any = null;
    private melodyInterval: any = null;

    // Scale for melody (pentatonic C)
    private readonly scale = [130.81, 146.83, 164.81, 196.00, 220.00, 261.63, 293.66, 329.63, 392.00, 440.00]; // C3 to A4

    constructor(
        ctxMgr: AudioContextManager,
        getVolume: () => number,
        isMuted: () => boolean,
    ) {
        this.ctxMgr = ctxMgr;
        this.getVolume = getVolume;
        this.isMuted = isMuted;
    }

    private ctx(): AudioContext | null {
        return this.ctxMgr.getContext();
    }

    /**
     * Start the ambient music.
     */
    start(): void {
        if (this.isPlaying) return;
        const ac = this.ctx();
        if (!ac) return;

        debugLog('[AmbientMusic] Starting procedural music');
        this.isPlaying = true;

        this.masterGain = ac.createGain();
        this.updateVolume();
        this.masterGain.connect(ac.destination);

        this.startPadLayer();
        this.startDroneLayer();
        this.startShimmerLayer();
        this.startMelodyLayer();
    }

    /**
     * Stop all layers of ambient music.
     */
    stop(): void {
        if (!this.isPlaying) return;
        debugLog('[AmbientMusic] Stopping procedural music');
        this.isPlaying = false;

        this.stopPadLayer();
        this.stopDroneLayer();
        
        if (this.shimmerInterval) {
            clearInterval(this.shimmerInterval);
            this.shimmerInterval = null;
        }
        if (this.melodyInterval) {
            clearInterval(this.melodyInterval);
            this.melodyInterval = null;
        }

        if (this.masterGain) {
            const ac = this.ctx();
            if (ac) {
                const now = ac.currentTime;
                this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
                this.masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
            }
            this.masterGain = null;
        }
    }

    /**
     * Update the volume of the music.
     */
    updateVolume(): void {
        if (!this.masterGain) return;
        const ac = this.ctx();
        if (!ac) return;

        const volume = this.isMuted() ? 0 : this.getVolume() * 0.4; // Scaled for background
        const now = ac.currentTime;
        this.masterGain.gain.setTargetAtTime(volume, now, 0.1);
    }

    private startPadLayer(): void {
        // Frequencies for C2, E2, G2
        const freqs = [65.41, 82.41, 98.00];
        
        // Start first note
        this.playPadNote(freqs[this.currentPadIndex]);
        
        // Cycle notes every 15 seconds
        this.padCycleInterval = setInterval(() => {
            if (!this.isPlaying) return;
            this.currentPadIndex = (this.currentPadIndex + 1) % freqs.length;
            this.playPadNote(freqs[this.currentPadIndex]);
        }, 15000);
    }

    private playPadNote(freq: number): void {
        const ac = this.ctx()!;
        const now = ac.currentTime;
        const fadeTime = 8; // Long crossfade

        const gain = ac.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.06, now + fadeTime);
        // Start fade out later
        gain.gain.setValueAtTime(0.06, now + 15 - fadeTime);
        gain.gain.linearRampToValueAtTime(0, now + 15);
        gain.connect(this.masterGain!);
        this.padGains.push(gain);

        // Two detuned oscillators per note for richness
        const oscillators: OscillatorNode[] = [];
        const lfos: OscillatorNode[] = [];

        [-2, 2].forEach(detune => {
            const osc = ac.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);
            osc.detune.setValueAtTime(detune, now);
            
            // Slow LFO for frequency modulation
            const lfo = ac.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.setValueAtTime(0.1 + Math.random() * 0.1, now);
            const lfoGain = ac.createGain();
            lfoGain.gain.setValueAtTime(5, now);
            
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);
            
            osc.connect(gain);
            osc.start(now);
            lfo.start(now);
            
            oscillators.push(osc);
            lfos.push(lfo);
            this.padOscillators.push(osc);
            this.padLFOs.push(lfo);
        });

        // Cleanup after note finishes
        setTimeout(() => {
            oscillators.forEach(osc => { try { osc.stop(); } catch(e) {} });
            lfos.forEach(lfo => { try { lfo.stop(); } catch(e) {} });
            // Remove from main arrays
            this.padOscillators = this.padOscillators.filter(o => !oscillators.includes(o));
            this.padLFOs = this.padLFOs.filter(l => !lfos.includes(l));
            this.padGains = this.padGains.filter(g => g !== gain);
        }, 16000);
    }

    private stopPadLayer(): void {
        if (this.padCycleInterval) {
            clearInterval(this.padCycleInterval);
            this.padCycleInterval = null;
        }

        const ac = this.ctx();
        const now = ac ? ac.currentTime : 0;

        this.padGains.forEach(gain => {
            if (ac) {
                gain.gain.cancelScheduledValues(now);
                gain.gain.setValueAtTime(gain.gain.value, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 1);
            }
        });

        setTimeout(() => {
            this.padOscillators.forEach(osc => { try { osc.stop(); } catch(e) {} });
            this.padLFOs.forEach(lfo => { try { lfo.stop(); } catch(e) {} });
            this.padOscillators = [];
            this.padLFOs = [];
            this.padGains = [];
        }, 1100);
    }

    private startDroneLayer(): void {
        const ac = this.ctx()!;
        const now = ac.currentTime;

        this.droneGain = ac.createGain();
        this.droneGain.gain.setValueAtTime(0, now);
        this.droneGain.gain.linearRampToValueAtTime(0.08, now + 3);
        this.droneGain.connect(this.masterGain!);

        this.droneOsc = ac.createOscillator();
        this.droneOsc.type = 'sine';
        this.droneOsc.frequency.setValueAtTime(40, now); // Low hum

        // Slow amplitude modulation
        this.droneLFO = ac.createOscillator();
        this.droneLFO.type = 'sine';
        this.droneLFO.frequency.setValueAtTime(0.05, now);
        const lfoGain = ac.createGain();
        lfoGain.gain.setValueAtTime(0.03, now);
        
        this.droneLFO.connect(lfoGain);
        lfoGain.connect(this.droneGain.gain);

        this.droneOsc.connect(this.droneGain);
        this.droneOsc.start(now);
        this.droneLFO.start(now);
    }

    private stopDroneLayer(): void {
        const ac = this.ctx();
        const now = ac ? ac.currentTime : 0;

        if (this.droneGain && ac) {
            this.droneGain.gain.cancelScheduledValues(now);
            this.droneGain.gain.setValueAtTime(this.droneGain.gain.value, now);
            this.droneGain.gain.exponentialRampToValueAtTime(0.001, now + 1);
        }

        setTimeout(() => {
            if (this.droneOsc) { try { this.droneOsc.stop(); } catch(e) {} this.droneOsc = null; }
            if (this.droneLFO) { try { this.droneLFO.stop(); } catch(e) {} this.droneLFO = null; }
            this.droneGain = null;
        }, 1100);
    }

    private startShimmerLayer(): void {
        this.shimmerInterval = setInterval(() => {
            if (!this.isPlaying || Math.random() > 0.3) return;
            this.playShimmer();
        }, 4000);
    }

    private playShimmer(): void {
        const ac = this.ctx()!;
        const now = ac.currentTime;
        const dur = 4 + Math.random() * 4;

        // White noise
        const bufLen = Math.ceil(ac.sampleRate * 2);
        const buf = ac.createBuffer(1, bufLen, ac.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufLen; i++) {
            data[i] = (Math.random() * 2 - 1);
        }
        const noiseSrc = ac.createBufferSource();
        noiseSrc.buffer = buf;
        noiseSrc.loop = true;

        const filter = ac.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2000 + Math.random() * 3000, now);
        filter.Q.setValueAtTime(10, now);
        filter.frequency.exponentialRampToValueAtTime(1000 + Math.random() * 500, now + dur);

        const gain = ac.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.02, now + dur * 0.5);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        noiseSrc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain!);

        noiseSrc.start(now);
        noiseSrc.stop(now + dur);
    }

    private startMelodyLayer(): void {
        this.melodyInterval = setInterval(() => {
            if (!this.isPlaying || Math.random() > 0.4) return;
            this.playMelodyNote();
        }, 8000);
    }

    private playMelodyNote(): void {
        const ac = this.ctx()!;
        const now = ac.currentTime;
        const dur = 6 + Math.random() * 4;
        const freq = this.scale[Math.floor(Math.random() * this.scale.length)];

        const gain = ac.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.03, now + 1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        const osc = ac.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        // Add some vibrato
        const vibrato = ac.createOscillator();
        vibrato.frequency.setValueAtTime(3 + Math.random() * 2, now);
        const vibratoGain = ac.createGain();
        vibratoGain.gain.setValueAtTime(freq * 0.01, now);
        vibrato.connect(vibratoGain);
        vibratoGain.connect(osc.frequency);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(now);
        vibrato.start(now);
        osc.stop(now + dur);
        vibrato.stop(now + dur);
    }
}
