// context.js - Web Audio API context management and compatibility
export class AudioContext {
    constructor() {
        this.audioContext = null;
        this.activeNodes = new Set();
        this.gcInterval = null;
        
        this.initializeContext();
        this.setupGarbageCollection();
    }
    
    // Initialize Web Audio API context with compatibility
    initializeContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log("Web Audio API context created successfully");
        } catch (error) {
            console.error("Failed to create Web Audio API context:", error);
        }
    }
    
    // Resume audio context on user interaction
    resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            return this.audioContext.resume().then(() => {
                console.log("AudioContext resumed successfully");
            }).catch(error => {
                console.error("Failed to resume AudioContext:", error);
            });
        }
        return Promise.resolve();
    }
    
    // Get the audio context instance
    getContext() {
        return this.audioContext;
    }
    
    // Check if context is available and ready
    isReady() {
        return this.audioContext && this.audioContext.state !== 'closed';
    }
    
    // Set up regular garbage collection for unused audio nodes
    setupGarbageCollection() {
        // Clean up inactive nodes every 30 seconds
        this.gcInterval = setInterval(() => this.cleanupInactiveNodes(), 30000);
        console.log("Audio garbage collection scheduled");
    }
    
    // Clean up inactive audio nodes to prevent memory leaks
    cleanupInactiveNodes() {
        let count = 0;
        this.activeNodes.forEach(node => {
            // Check if node is inactive
            if (node._inactive || (node.disposed === true)) {
                this.activeNodes.delete(node);
                count++;
            }
        });
        
        if (count > 0) {
            console.log(`Audio context: cleaned up ${count} inactive audio objects`);
        }
    }
    
    // Track an audio node for garbage collection
    trackNode(node) {
        if (node) {
            this.activeNodes.add(node);
        }
        return node;
    }
    
    // Initialize a minimal Tone.js compatibility layer for the intro sequence
    initializeToneCompatibility() {
        // Create a dummy masterEQ object that the intro sequence can connect to
        // This allows the intro sequence code to remain unchanged
        this.masterEQ = {
            // Dummy connect method that returns the input
            connect: function(node) {
                return node;
            }
        };
        
        console.log("Audio compatibility layer initialized for intro sequence");
        return this.masterEQ;
    }
    
    // Clean up context and resources
    cleanup() {
        console.log("Cleaning up AudioContext resources...");
        
        // Clear intervals
        if (this.gcInterval) {
            clearInterval(this.gcInterval);
            this.gcInterval = null;
        }
        
        // Close audio context
        if (this.audioContext) {
            return this.audioContext.close().then(() => {
                console.log("AudioContext closed successfully");
                this.audioContext = null;
            }).catch(error => {
                console.error("Error closing AudioContext:", error);
            });
        }
        
        return Promise.resolve();
    }
}