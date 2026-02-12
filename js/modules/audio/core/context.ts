// context.ts - Web Audio API context management and compatibility

import { debugLog } from '../../../globals/debug.js';

export interface TrackableNode {
    _inactive?: boolean;
    disposed?: boolean;
}

export class AudioContextManager {
    private audioContext: AudioContext | null = null;
    private activeNodes: Set<TrackableNode> = new Set();
    private gcInterval: number | ReturnType<typeof setInterval> | null = null;
    private masterEQ: { connect: (node: any) => any } | null = null;
    
    constructor() {
        this.initializeContext();
        this.setupGarbageCollection();
    }
    
    // Initialize Web Audio API context with compatibility
    initializeContext(): void {
        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                this.audioContext = new AudioContextClass();
                debugLog("Web Audio API context created successfully");
            } else {
                console.error("Web Audio API not supported in this browser");
            }
        } catch (error) {
            console.error("Failed to create Web Audio API context:", error);
        }
    }
    
    // Resume audio context on user interaction
    resumeAudioContext(): Promise<void> {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            return this.audioContext.resume().then(() => {
                debugLog("AudioContext resumed successfully");
            }).catch(error => {
                console.error("Failed to resume AudioContext:", error);
            });
        }
        return Promise.resolve();
    }
    
    // Get the audio context instance
    getContext(): AudioContext | null {
        return this.audioContext;
    }
    
    // Check if context is available and ready
    isReady(): boolean {
        return this.audioContext !== null && this.audioContext.state !== 'closed';
    }
    
    // Set up regular garbage collection for unused audio nodes
    setupGarbageCollection(): void {
        // Clean up inactive nodes every 30 seconds
        this.gcInterval = setInterval(() => this.cleanupInactiveNodes(), 30000);
        debugLog("Audio garbage collection scheduled");
    }
    
    // Clean up inactive audio nodes to prevent memory leaks
    cleanupInactiveNodes(): void {
        let count = 0;
        this.activeNodes.forEach(node => {
            // Check if node is inactive
            if (node._inactive || (node.disposed === true)) {
                this.activeNodes.delete(node);
                count++;
            }
        });
        
        if (count > 0) {
            debugLog(`Audio context: cleaned up ${count} inactive audio objects`);
        }
    }
    
    // Track an audio node for garbage collection
    trackNode<T extends TrackableNode>(node: T): T {
        if (node) {
            this.activeNodes.add(node);
        }
        return node;
    }
    
    // Initialize a minimal Tone.js compatibility layer for the intro sequence
    initializeToneCompatibility(): { connect: (node: any) => any } {
        // Create a dummy masterEQ object that the intro sequence can connect to
        // This allows the intro sequence code to remain unchanged
        this.masterEQ = {
            // Dummy connect method that returns the input
            connect: function(node: any) {
                return node;
            }
        };
        
        debugLog("Audio compatibility layer initialized for intro sequence");
        return this.masterEQ;
    }
    
    // Clean up context and resources
    cleanup(): Promise<void> {
        debugLog("Cleaning up AudioContext resources...");
        
        // Clear intervals
        if (this.gcInterval) {
            clearInterval(this.gcInterval as number);
            this.gcInterval = null;
        }
        
        // Close audio context
        if (this.audioContext) {
            return this.audioContext.close().then(() => {
                debugLog("AudioContext closed successfully");
                this.audioContext = null;
            }).catch(error => {
                console.error("Error closing AudioContext:", error);
            });
        }
        
        return Promise.resolve();
    }
}
