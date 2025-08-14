// notifications.js - Notification system and message display

import { HUDStyles } from './styles.js';

export class HUDNotifications {
    static createNotificationsArea(parent) {
        // Create notifications area in the top middle of the screen
        const notificationsArea = document.createElement('div');
        notificationsArea.id = 'notifications-area';
        HUDStyles.applyStyles(notificationsArea, {
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px'
        });
        parent.appendChild(notificationsArea);
        
        // Add horde mode indicator (hidden by default)
        HUDNotifications.createHordeModeIndicator(notificationsArea);
        
        return notificationsArea;
    }

    static createHordeModeIndicator(parent) {
        const hordeIndicator = document.createElement('div');
        hordeIndicator.id = 'horde-mode-indicator';
        hordeIndicator.className = 'hud-panel';
        HUDStyles.applyStyles(hordeIndicator, {
            display: 'none', // Hidden by default, will be changed to 'flex' when active
            padding: '8px 12px',
            backgroundColor: 'rgba(51, 10, 10, 0.8)',
            backdropFilter: 'blur(5px)',
            borderRadius: '8px',
            border: '1px solid #ff3030',
            boxShadow: '0 0 15px rgba(255, 48, 48, 0.5)',
            animation: 'pulse-horde 2s infinite',
            marginBottom: '10px',
            fontSize: '18px',
            fontWeight: '600',
            letterSpacing: '1px'
        });
        
        // Create a flex container for the horde mode indicator content
        const hordeContent = document.createElement('div');
        HUDStyles.applyStyles(hordeContent, {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
        });
        
        // Add the text and timer elements
        const hordeLabel = document.createElement('span');
        HUDStyles.applyStyles(hordeLabel, {
            color: '#ff3030',
            textShadow: '0 0 5px rgba(255,48,48,0.5)'
        });
        hordeLabel.textContent = 'HORDE MODE';
        
        const survivalTime = document.createElement('span');
        survivalTime.id = 'horde-survival-time';
        HUDStyles.applyStyles(survivalTime, {
            color: '#ff9999',
            fontWeight: 'bold'
        });
        survivalTime.textContent = '00:00';
        
        // Add the elements to the container
        hordeContent.appendChild(hordeLabel);
        hordeContent.appendChild(survivalTime);
        hordeIndicator.appendChild(hordeContent);
        
        // Add decorative corner elements
        HUDStyles.addCornerElements(hordeIndicator);
        
        parent.appendChild(hordeIndicator);
        
        return hordeIndicator;
    }

    /**
     * Update the horde mode indicator and survival timer
     */
    static updateHordeModeDisplay() {
        const hordeIndicator = document.getElementById('horde-mode-indicator');
        const survivalTime = document.getElementById('horde-survival-time');
        
        if (!hordeIndicator || !survivalTime) return;
        
        // Check if horde mode is active in the game
        if (window.game && window.game.isHordeActive) {
            // Show the indicator if not already visible
            if (hordeIndicator.style.display === 'none') {
                hordeIndicator.style.display = 'flex';
            }
            
            // Update the survival time display
            if (window.game.getFormattedHordeSurvivalTime) {
                survivalTime.textContent = window.game.getFormattedHordeSurvivalTime();
            } else {
                // Fallback calculation if method not available
                const totalSeconds = Math.floor(window.game.hordeSurvivalTime / 1000);
                const minutes = Math.floor(totalSeconds / 60);
                const seconds = totalSeconds % 60;
                survivalTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
            
            // Increase pulsing intensity based on survival time
            // After 3 minutes, make the pulsing more urgent
            if (window.game.hordeSurvivalTime > 3 * 60 * 1000) {
                const styleEl = document.createElement('style');
                styleEl.textContent = `
                    @keyframes pulse-horde {
                        0% { box-shadow: 0 0 8px rgba(255, 30, 30, 0.7); }
                        50% { box-shadow: 0 0 15px rgba(255, 30, 30, 1); }
                        100% { box-shadow: 0 0 8px rgba(255, 30, 30, 0.7); }
                    }
                `;
                document.head.appendChild(styleEl);
                
                // Make animation faster
                hordeIndicator.style.animation = 'pulse-horde 1s infinite';
            }
        } else {
            // Hide the indicator if horde mode is not active
            hordeIndicator.style.display = 'none';
        }
    }

    /**
     * Show a temporary notification message
     */
    static showNotification(message, type = 'info', duration = 3000) {
        const notificationsArea = document.getElementById('notifications-area');
        if (!notificationsArea) return;

        const notification = document.createElement('div');
        notification.className = 'hud-notification';
        
        let backgroundColor, borderColor;
        switch (type) {
            case 'warning':
                backgroundColor = 'rgba(255, 204, 0, 0.1)';
                borderColor = 'rgba(255, 204, 0, 0.5)';
                break;
            case 'error':
                backgroundColor = 'rgba(255, 48, 48, 0.1)';
                borderColor = 'rgba(255, 48, 48, 0.5)';
                break;
            case 'success':
                backgroundColor = 'rgba(95, 255, 143, 0.1)';
                borderColor = 'rgba(95, 255, 143, 0.5)';
                break;
            default: // info
                backgroundColor = 'rgba(120, 220, 232, 0.1)';
                borderColor = 'rgba(120, 220, 232, 0.5)';
        }

        HUDStyles.applyStyles(notification, {
            padding: '8px 15px',
            backgroundColor: backgroundColor,
            backdropFilter: 'blur(5px)',
            borderRadius: '5px',
            border: `1px solid ${borderColor}`,
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.9)',
            textAlign: 'center',
            animation: 'fadeIn 0.3s ease-in-out',
            marginBottom: '5px',
            maxWidth: '300px',
            wordWrap: 'break-word'
        });

        notification.textContent = message;
        notificationsArea.appendChild(notification);

        // Add fade-in animation
        const fadeInStyle = document.createElement('style');
        fadeInStyle.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes fadeOut {
                from { opacity: 1; transform: translateY(0); }
                to { opacity: 0; transform: translateY(-10px); }
            }
        `;
        document.head.appendChild(fadeInStyle);

        // Remove notification after duration
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease-in-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    /**
     * Show a critical alert that requires attention
     */
    static showCriticalAlert(message) {
        HUDNotifications.showNotification(message, 'error', 5000);
        
        // Add screen flash effect for critical alerts
        const flashOverlay = document.createElement('div');
        HUDStyles.applyStyles(flashOverlay, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
            pointerEvents: 'none',
            zIndex: '9999',
            animation: 'flash 0.5s ease-in-out'
        });

        const flashStyle = document.createElement('style');
        flashStyle.textContent = `
            @keyframes flash {
                0% { opacity: 0; }
                50% { opacity: 1; }
                100% { opacity: 0; }
            }
        `;
        document.head.appendChild(flashStyle);

        document.body.appendChild(flashOverlay);

        setTimeout(() => {
            if (flashOverlay.parentNode) {
                flashOverlay.parentNode.removeChild(flashOverlay);
            }
            if (flashStyle.parentNode) {
                flashStyle.parentNode.removeChild(flashStyle);
            }
        }, 500);
    }
}