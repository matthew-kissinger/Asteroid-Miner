// dialogueManager.js - Manages loading and playing dialogue WAV files for intro sequence

import { getAbsolutePath } from '../../../utils/pathUtils.js';

/**
 * Load dialogue WAV files (1.wav through 8.wav)
 * @returns {Array} Array of Audio elements for dialogue files
 */
export function loadDialogueWavs() {
    console.log("Loading dialogue WAV files...");
    
    const dialogueWavs = [];
    
    try {
        // Load 8 dialogue WAV files
        for (let i = 1; i <= 8; i++) {
            const audioPath = getAbsolutePath(`sounds/dialogue/${i}.wav`);
            console.log(`Attempting to load dialogue file: ${audioPath}`);
            
            // Create audio element
            const audio = new Audio();
            
            // Setup event handlers before setting src to avoid race conditions
            audio.addEventListener('canplaythrough', () => {
                console.log(`Dialogue WAV ${i} loaded successfully`);
            });
            
            audio.addEventListener('error', (e) => {
                console.warn(`Dialogue WAV ${i} not found or couldn't be loaded - this is normal if you haven't added the files yet`);
                // Don't log the full error object as it's noisy
            });
            
            // Set source after adding event listeners
            audio.src = audioPath;
            
            // Store reference even if loading fails - the game will just skip playing it
            dialogueWavs.push(audio);
        }
        
        console.log("Dialogue WAV files setup complete - they'll be used if available");
        return dialogueWavs;
    } catch (error) {
        console.error("Error in dialogue WAV files setup:", error);
        return [];
    }
}

/**
 * Play a specific dialogue WAV file
 * @param {Array} dialogueWavs - Array of dialogue audio elements
 * @param {number} index - Index of the dialogue to play
 * @param {AudioManager} audioManager - Audio manager for volume control
 */
export function playDialogueWav(dialogueWavs, index, audioManager) {
    // Only play WAVs for the first 8 dialogues (the ones with voice acting)
    if (index >= 8 || !dialogueWavs[index]) {
        return;
    }
    
    try {
        const dialogueAudio = dialogueWavs[index];
        
        // Only attempt to play if the file has actually loaded successfully
        // We can check this by examining the networkState or readyState
        if (dialogueAudio.readyState > 0 && dialogueAudio.error === null) {
            dialogueAudio.volume = audioManager ? audioManager.sfxVolume * 0.8 : 0.5;
            dialogueAudio.currentTime = 0;
            
            // Try to play and catch any potential errors
            const playPromise = dialogueAudio.play();
            if (playPromise !== undefined) {
                playPromise.catch(err => {
                    console.warn(`Couldn't play dialogue WAV ${index}: ${err.message}`);
                });
            }
        } else {
            console.log(`Skipping dialogue WAV ${index + 1} (not loaded)`);
        }
    } catch (error) {
        console.warn(`Error playing dialogue WAV ${index + 1}, continuing without audio`, error.message);
    }
}