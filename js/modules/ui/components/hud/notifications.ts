// notifications.ts - Notification system and message display

import { HUDStyles } from './styles.ts';

/**
 * Interface for horde mode state that the notifications system needs
 */
export interface HordeState {
    isActive: boolean;
    survivalTime: number;
    currentWave: number;
    score: number;
    enemiesRemainingInWave: number;
    getFormattedTime: () => string;
}

export class HUDNotifications {
    private static hordeState: HordeState | null = null;

    /**
     * Initialize with horde state from the game
     */
    static setHordeState(state: HordeState): void {
        HUDNotifications.hordeState = state;
    }
    static createNotificationsArea(parent: HTMLElement): HTMLDivElement {
        // Create notifications area in the top middle of the screen
        const notificationsArea: HTMLDivElement = document.createElement('div');
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

    static createHordeModeIndicator(parent: HTMLElement): HTMLDivElement {
        const hordeIndicator: HTMLDivElement = document.createElement('div');
        hordeIndicator.id = 'horde-mode-indicator';
        hordeIndicator.className = 'hud-panel';
        HUDStyles.applyStyles(hordeIndicator, {
            display: 'none', // Hidden by default, will be changed to 'flex' when active
            padding: '12px 16px',
            backgroundColor: 'rgba(51, 10, 10, 0.8)',
            backdropFilter: 'blur(5px)',
            borderRadius: '8px',
            border: '1px solid #ff3030',
            boxShadow: '0 0 15px rgba(255, 48, 48, 0.5)',
            animation: 'pulse-horde 2s infinite',
            marginBottom: '10px',
            fontSize: '16px',
            fontWeight: '600',
            letterSpacing: '1px'
        });
        
        // Create a flex container for the horde mode indicator content
        const hordeContent: HTMLDivElement = document.createElement('div');
        HUDStyles.applyStyles(hordeContent, {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
        });
        
        // Top row: HORDE MODE label and survival time
        const topRow: HTMLDivElement = document.createElement('div');
        HUDStyles.applyStyles(topRow, {
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
        });
        
        const hordeLabel: HTMLSpanElement = document.createElement('span');
        HUDStyles.applyStyles(hordeLabel, {
            color: '#ff3030',
            textShadow: '0 0 5px rgba(255,48,48,0.5)',
            fontSize: '18px'
        });
        hordeLabel.textContent = 'HORDE MODE';
        
        const survivalTime: HTMLSpanElement = document.createElement('span');
        survivalTime.id = 'horde-survival-time';
        HUDStyles.applyStyles(survivalTime, {
            color: '#ff9999',
            fontWeight: 'bold'
        });
        survivalTime.textContent = '00:00';
        
        topRow.appendChild(hordeLabel);
        topRow.appendChild(survivalTime);
        
        // Bottom row: Wave, Score, Enemies
        const statsRow: HTMLDivElement = document.createElement('div');
        HUDStyles.applyStyles(statsRow, {
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontSize: '14px'
        });
        
        const waveDisplay: HTMLSpanElement = document.createElement('span');
        waveDisplay.id = 'horde-wave-display';
        HUDStyles.applyStyles(waveDisplay, {
            color: '#ffaa00'
        });
        waveDisplay.innerHTML = 'WAVE <strong>1</strong>';
        
        const scoreDisplay: HTMLSpanElement = document.createElement('span');
        scoreDisplay.id = 'horde-score-display';
        HUDStyles.applyStyles(scoreDisplay, {
            color: '#00ff88'
        });
        scoreDisplay.innerHTML = 'SCORE: <strong>0</strong>';
        
        const enemiesDisplay: HTMLSpanElement = document.createElement('span');
        enemiesDisplay.id = 'horde-enemies-display';
        HUDStyles.applyStyles(enemiesDisplay, {
            color: '#ff6666'
        });
        enemiesDisplay.innerHTML = 'ENEMIES: <strong>0</strong>';
        
        statsRow.appendChild(waveDisplay);
        statsRow.appendChild(scoreDisplay);
        statsRow.appendChild(enemiesDisplay);
        
        // Add rows to content
        hordeContent.appendChild(topRow);
        hordeContent.appendChild(statsRow);
        hordeIndicator.appendChild(hordeContent);
        
        // Add decorative corner elements
        HUDStyles.addCornerElements(hordeIndicator);
        
        parent.appendChild(hordeIndicator);
        
        return hordeIndicator;
    }

    /**
     * Update the horde mode indicator and survival timer
     */
    static updateHordeModeDisplay(): void {
        const hordeIndicator: HTMLDivElement | null = document.getElementById('horde-mode-indicator') as HTMLDivElement;
        const survivalTime: HTMLSpanElement | null = document.getElementById('horde-survival-time') as HTMLSpanElement;
        const waveDisplay: HTMLSpanElement | null = document.getElementById('horde-wave-display') as HTMLSpanElement;
        const scoreDisplay: HTMLSpanElement | null = document.getElementById('horde-score-display') as HTMLSpanElement;
        const enemiesDisplay: HTMLSpanElement | null = document.getElementById('horde-enemies-display') as HTMLSpanElement;
        
        if (!hordeIndicator || !survivalTime || !HUDNotifications.hordeState) {
            return;
        }
        
        // Check if horde mode is active
        if (HUDNotifications.hordeState.isActive) {
            // Show the indicator if not already visible
            if (hordeIndicator.style.display === 'none') {
                hordeIndicator.style.display = 'flex';
            }
            
            // Update the survival time display
            const timeText: string = HUDNotifications.hordeState.getFormattedTime();
            survivalTime.textContent = timeText;
            
            // Update wave, score, and enemies
            if (waveDisplay) {
                waveDisplay.innerHTML = `WAVE <strong>${HUDNotifications.hordeState.currentWave}</strong>`;
            }
            if (scoreDisplay) {
                scoreDisplay.innerHTML = `SCORE: <strong>${HUDNotifications.hordeState.score}</strong>`;
            }
            if (enemiesDisplay) {
                enemiesDisplay.innerHTML = `ENEMIES: <strong>${HUDNotifications.hordeState.enemiesRemainingInWave}</strong>`;
            }
            
            // Increase pulsing intensity based on survival time
            // After 3 minutes (180000ms), make the pulsing more urgent
            if (HUDNotifications.hordeState.survivalTime > 3 * 60 * 1000) {
                const styleEl: HTMLStyleElement = document.createElement('style');
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
    static showNotification(message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info', duration: number = 3000): void {
        const notificationsArea: HTMLDivElement | null = document.getElementById('notifications-area') as HTMLDivElement;
        if (!notificationsArea) return;

        const notification: HTMLDivElement = document.createElement('div');
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
        const fadeInStyle: HTMLStyleElement = document.createElement('style');
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
    static showCriticalAlert(message: string): void {
        HUDNotifications.showNotification(message, 'error', 5000);
        
        // Add screen flash effect for critical alerts
        const flashOverlay: HTMLDivElement = document.createElement('div');
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

        const flashStyle: HTMLStyleElement = document.createElement('style');
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