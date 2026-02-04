// dialogueSystem.ts - Manages dialogue UI and typing animation for intro sequence

import { playDialogueWav } from '../audio/dialogueManager.js';

export class DialogueSystem {
    private dialogueBox: HTMLDivElement | null = null;
    private dialogueText: HTMLDivElement | null = null;
    private currentDialogueIndex: number = 0;
    private isTyping: boolean = false;
    private typeInterval: number | ReturnType<typeof setInterval> | null = null;
    private dialogueWavs: HTMLAudioElement[] = [];
    private audioManager: any = null;
    private dialogueLines: string[];
    
    constructor() {
        this.dialogueBox = null;
        this.dialogueText = null;
        this.currentDialogueIndex = 0;
        this.isTyping = false;
        this.typeInterval = null;
        this.dialogueWavs = [];
        this.audioManager = null;
        
        // Dialogue lines
        this.dialogueLines = [
            "CORP CONTROLLER: [static] Belter #337, status check. Your cryostasis cycle is now complete.",
            "CORP CONTROLLER: Welcome to your deployment in the Sol System, circa 2077. As you can see, Earth is... well... let's just say \"available for unrestricted mining operations\" now.",
            "CORP CONTROLLER: CorpEx Resource Acquisition reminds you that all planetary bodies in this system are now classified as \"unclaimed assets\" following the... unfortunate global circumstances.",
            "CORP CONTROLLER: Your primary objective is resource extraction from the asteroid belt. Initial scans show promising mineral concentrations untouched since the evacuation.",
            "CORP CONTROLLER: The Stargate remains your lifeline. Return for fuel, upgrades, trading, and your allocated 15 minutes of daily entertainment. Remember, a happy belter is a productive belter!",
            "CORP CONTROLLER: Resource extraction targets are non-negotiable. Failure to meet quotas will result in extension of your 42-year contract.",
            "CORP CONTROLLER: Oh, and our long-range scans have detected spectral drone activity in adjacent sectors. Remnants of old defense systems, probably. Nothing a resourceful belter like you can't handle.",
            "CORP CONTROLLER: Connection terminating in 3...2...1... Don't die out there, #337. Replacement clones are expensive.",
            "[TRANSMISSION TERMINATED]",
            "[BELTER #337 DEPLOYMENT ACTIVE]"
        ];
    }
    
    /**
     * Initialize the dialogue system with required dependencies
     * @param {HTMLAudioElement[]} dialogueWavs - Array of loaded dialogue audio elements
     * @param {any} audioManager - Audio manager for volume control
     */
    initialize(dialogueWavs: HTMLAudioElement[], audioManager: any): void {
        this.dialogueWavs = dialogueWavs;
        this.audioManager = audioManager;
    }
    
    /**
     * Setup the dialogue UI elements
     */
    setupDialogueUI(): void {
        // Create dialogue box
        this.dialogueBox = document.createElement('div');
        this.dialogueBox.id = 'intro-dialogue';
        this.dialogueBox.style.position = 'fixed';
        this.dialogueBox.style.bottom = '50px';
        this.dialogueBox.style.left = '50%';
        this.dialogueBox.style.transform = 'translateX(-50%)';
        this.dialogueBox.style.width = '80%';
        this.dialogueBox.style.maxWidth = '800px';
        this.dialogueBox.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.dialogueBox.style.color = '#30f0c0';
        this.dialogueBox.style.border = '1px solid #30f0c0';
        this.dialogueBox.style.borderRadius = '5px';
        this.dialogueBox.style.padding = '15px';
        this.dialogueBox.style.fontFamily = 'Courier New, monospace';
        this.dialogueBox.style.fontSize = '16px';
        this.dialogueBox.style.zIndex = '10000';
        this.dialogueBox.style.textShadow = '0 0 5px #30f0c0';
        this.dialogueBox.style.boxShadow = '0 0 10px rgba(48, 240, 192, 0.3)';
        this.dialogueBox.style.opacity = '0';
        this.dialogueBox.style.transition = 'opacity 0.5s';
        
        // Add dialogue text element
        this.dialogueText = document.createElement('div');
        this.dialogueText.style.lineHeight = '1.5';
        
        this.dialogueBox.appendChild(this.dialogueText);
        document.body.appendChild(this.dialogueBox);
        
        // Fade in dialogue box
        setTimeout(() => {
            if (this.dialogueBox) {
                this.dialogueBox.style.opacity = '1';
            }
        }, 200);
    }
    
    /**
     * Type out the next dialogue line with animation
     * @param {number} sequenceTime - Current sequence time for auto-advance logic
     * @param {boolean} isPlaying - Whether intro sequence is still playing
     * @returns {boolean} True if there are more dialogues, false if complete
     */
    typeNextDialogue(sequenceTime: number = 0, isPlaying: boolean = true): boolean {
        if (this.currentDialogueIndex >= this.dialogueLines.length) {
            return false;
        }
        
        const line = this.dialogueLines[this.currentDialogueIndex];
        
        // Play the appropriate dialogue WAV file
        playDialogueWav(this.dialogueWavs, this.currentDialogueIndex, this.audioManager);
        
        this.currentDialogueIndex++;
        
        // Clear previous text
        if (this.dialogueText) {
            this.dialogueText.textContent = '';
        }
        
        // Show dialogue box if not visible
        if (this.dialogueBox && this.dialogueBox.style.opacity === '0') {
            this.dialogueBox.style.opacity = '1';
        }
        
        // Type out text
        let charIndex = 0;
        this.isTyping = true;
        
        // Clear previous interval if exists
        if (this.typeInterval) {
            clearInterval(this.typeInterval as any);
        }
        
        // Special effects for transmission terminated line
        if (this.dialogueText) {
            if (line.includes("TRANSMISSION TERMINATED") || line.includes("DEPLOYMENT ACTIVE")) {
                this.dialogueText.style.color = '#ff3030';
            } else {
                this.dialogueText.style.color = '#30f0c0';
            }
        }
        
        // Type each character with random speed for effect
        this.typeInterval = setInterval(() => {
            if (charIndex < line.length) {
                if (this.dialogueText) {
                    this.dialogueText.textContent += line.charAt(charIndex);
                }
                charIndex++;
                
                // Typing sound disabled - uiClick sound not available
                // Could be re-enabled when proper UI sounds are added to the audio system
            } else {
                if (this.typeInterval) {
                    clearInterval(this.typeInterval as any);
                }
                this.typeInterval = null;
                this.isTyping = false;
                
                // Automatically advance to next dialogue after a delay
                // but only for certain progress points in the sequence
                if (sequenceTime < 22) { // Don't auto advance during the very end
                    const waitTime = Math.max(line.length * 50, 3000); // Longer lines stay longer
                    setTimeout(() => {
                        if (!this.isTyping && isPlaying) {
                            this.typeNextDialogue(sequenceTime, isPlaying);
                        }
                    }, waitTime);
                }
            }
        }, 30); // Base typing speed
        
        return true;
    }
    
    /**
     * Get current dialogue index
     * @returns {number} Current dialogue index
     */
    getCurrentDialogueIndex(): number {
        return this.currentDialogueIndex;
    }
    
    /**
     * Check if currently typing
     * @returns {boolean} True if typing animation is active
     */
    getIsTyping(): boolean {
        return this.isTyping;
    }
    
    /**
     * Clean up dialogue system resources
     */
    cleanup(): void {
        // Clear typing interval if running
        if (this.typeInterval) {
            clearInterval(this.typeInterval as any);
            this.typeInterval = null;
        }
        
        // Remove dialogue box if it exists
        if (this.dialogueBox && this.dialogueBox.parentNode) {
            this.dialogueBox.parentNode.removeChild(this.dialogueBox);
            this.dialogueBox = null;
            this.dialogueText = null;
        }
        
        // Reset state
        this.currentDialogueIndex = 0;
        this.isTyping = false;
    }
}
