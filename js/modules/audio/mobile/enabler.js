// enabler.js - Mobile audio unlock handling and user interaction detection
export class MobileAudioEnabler {
    constructor(audioContextManager, musicPlayer) {
        this.audioContextManager = audioContextManager;
        this.musicPlayer = musicPlayer;
        this.userHasInteracted = false;
        
        this.setupUserInteractionListener();
    }
    
    // Check if user has interacted
    hasUserInteracted() {
        return this.userHasInteracted;
    }
    
    // Show a notification to the user when a directory is missing
    showDirectoryMissingNotification(directory) {
        console.warn(`Directory not found: ${directory}`);
        
        // Create a notification element
        const notification = document.createElement('div');
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%)';
        notification.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        notification.style.color = '#ff4400';
        notification.style.padding = '10px 15px';
        notification.style.borderRadius = '5px';
        notification.style.zIndex = '9999';
        notification.style.fontSize = '14px';
        notification.style.maxWidth = '80%';
        notification.style.textAlign = 'center';
        
        // Add message
        notification.innerHTML = `
            <div style="margin-bottom: 5px;">
                <strong>Note:</strong> ${directory} directory not found.
            </div>
            <div style="font-size: 12px; color: #aaa;">
                Game will continue with limited audio. This is normal when running on GitHub Pages.
            </div>
        `;
        
        // Add close button
        const closeButton = document.createElement('div');
        closeButton.style.position = 'absolute';
        closeButton.style.top = '5px';
        closeButton.style.right = '10px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.color = '#aaa';
        closeButton.textContent = '✕';
        closeButton.addEventListener('click', () => notification.remove());
        notification.appendChild(closeButton);
        
        // Add to document
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.style.opacity = '0';
                notification.style.transition = 'opacity 0.5s ease';
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        notification.remove();
                    }
                }, 500);
            }
        }, 5000);
    }
    
    // Set up a listener to detect the first user interaction
    setupUserInteractionListener() {
        const handleInteraction = () => {
            if (!this.userHasInteracted) {
                this.userHasInteracted = true;
                console.log("User interaction detected, enabling audio playback");
                
                // Resume AudioContext if it's suspended
                this.audioContextManager.resumeAudioContext();
                
                // Start playing background music once the user interacts
                this.musicPlayer.playBackgroundMusic(true);
                
                // Clean up the event listeners
                document.removeEventListener('click', handleInteraction);
                document.removeEventListener('keydown', handleInteraction);
                document.removeEventListener('touchstart', handleInteraction);
            }
        };
        
        // Add event listeners for user interactions
        document.addEventListener('click', handleInteraction);
        document.addEventListener('keydown', handleInteraction);
        document.addEventListener('touchstart', handleInteraction);
        
        // Additional handling specifically for mobile devices
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            console.log("Mobile device detected - adding additional audio handlers");
            
            // Force audio context resumption on specific UI interactions for mobile
            const forceAudioResume = () => {
                this.userHasInteracted = true;
                
                // Resume AudioContext if it's suspended
                this.audioContextManager.resumeAudioContext();
                
                // Ensure background music is playing
                const playlist = this.musicPlayer.playlist;
                if (playlist.hasTracks() && !this.musicPlayer.isMuted()) {
                    const currentTrack = playlist.getCurrentTrack();
                    if (currentTrack && currentTrack.paused) {
                        console.log("Mobile: Forcing background music playback");
                        this.musicPlayer.playBackgroundMusic(true);
                    }
                }
            };
            
            // Add these handlers to common UI interaction points
            document.addEventListener('touchend', forceAudioResume, {passive: true});
            
            // Attach to specific game buttons when they're created
            const attachToButtons = () => {
                // Check for UI elements every 500ms for 5 seconds after page load
                let attempts = 0;
                const interval = setInterval(() => {
                    attempts++;
                    
                    // Find and attach to important action buttons
                    const actionButtons = document.querySelectorAll('button');
                    if (actionButtons.length > 0) {
                        console.log(`Mobile: Found ${actionButtons.length} buttons to attach audio handlers`);
                        actionButtons.forEach(button => {
                            if (!button.hasAudioHandler) {
                                button.addEventListener('touchend', forceAudioResume, {passive: true});
                                button.hasAudioHandler = true;
                            }
                        });
                    }
                    
                    // Stop checking after 10 attempts (5 seconds)
                    if (attempts >= 10) {
                        clearInterval(interval);
                    }
                }, 500);
            };
            
            // Run initially and also after document is fully loaded
            attachToButtons();
            if (document.readyState === 'complete') {
                attachToButtons();
            } else {
                window.addEventListener('load', attachToButtons);
            }
        }
    }
    
    // Clean up event listeners
    cleanup() {
        // Note: The actual cleanup of event listeners is handled in the main handler
        // This method is here for consistency with other modules
        this.userHasInteracted = false;
        console.log("Mobile audio enabler cleanup complete");
    }
}