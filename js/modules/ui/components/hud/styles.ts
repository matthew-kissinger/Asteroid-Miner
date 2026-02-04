// styles.js - CSS styles and animations for HUD elements

export class HUDStyles {
    static initializeStyles(): void {
        // Add Google Font for futuristic UI
        const fontLink: HTMLLinkElement = document.createElement('link');
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600&family=Electrolize&display=swap';
        fontLink.rel = 'stylesheet';
        document.head.appendChild(fontLink);

        // Add main HUD animations and styles
        const style: HTMLStyleElement = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { opacity: 0.7; }
                50% { opacity: 1; }
                100% { opacity: 0.7; }
            }
            
            @keyframes radar-ping {
                0% { transform: translate(-50%, -50%) scale(0); opacity: 0.5; }
                100% { transform: translate(-50%, -50%) scale(3); opacity: 0; }
            }
            
            @keyframes text-flicker {
                0% { opacity: 1; }
                3% { opacity: 0.4; }
                6% { opacity: 1; }
                9% { opacity: 0.4; }
                12% { opacity: 1; }
                35% { opacity: 1; }
                38% { opacity: 0.4; }
                41% { opacity: 1; }
                100% { opacity: 1; }
            }
            
            @keyframes blink {
                0% { opacity: 1; }
                49% { opacity: 1; }
                50% { opacity: 0; }
                100% { opacity: 0; }
            }

            @keyframes pulse-horde {
                0% { box-shadow: 0 0 5px rgba(255, 30, 30, 0.5); }
                50% { box-shadow: 0 0 10px rgba(255, 30, 30, 0.8); }
                100% { box-shadow: 0 0 5px rgba(255, 30, 30, 0.5); }
            }
        `;
        document.head.appendChild(style);
    }

    static getMainContainerStyles(): Record<string, string> {
        return {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            fontFamily: '"Rajdhani", "Electrolize", sans-serif',
            fontWeight: '400',
            color: 'rgba(120, 220, 232, 0.9)',
            textShadow: '0 0 10px rgba(120, 220, 232, 0.5)',
            opacity: '0',
            transition: 'opacity 0.5s ease'
        };
    }

    static getPanelStyles(): Record<string, string> {
        return {
            backgroundColor: 'rgba(6, 22, 31, 0.7)',
            backdropFilter: 'blur(5px)',
            borderRadius: '10px',
            border: '1px solid rgba(120, 220, 232, 0.3)',
            boxShadow: '0 0 15px rgba(120, 220, 232, 0.2), inset 0 0 10px rgba(120, 220, 232, 0.1)',
            overflow: 'hidden'
        };
    }

    static getPanelHeaderStyles(): Record<string, string> {
        return {
            fontWeight: '600',
            fontSize: '14px',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            marginBottom: '15px',
            paddingBottom: '8px',
            borderBottom: '1px solid rgba(120, 220, 232, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        };
    }

    static getStatusIndicatorStyles(): Record<string, string> {
        return {
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: 'rgba(120, 220, 232, 0.8)',
            boxShadow: '0 0 5px rgba(120, 220, 232, 0.8)',
            animation: 'pulse 2s infinite'
        };
    }

    static getPanelRowStyles(): Record<string, string> {
        return {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            margin: '10px 0'
        };
    }

    static getButtonStyles(): Record<string, string> {
        return {
            width: '100%',
            marginTop: '15px',
            padding: '8px',
            backgroundColor: 'rgba(120, 220, 232, 0.15)',
            border: '1px solid rgba(120, 220, 232, 0.5)',
            borderRadius: '5px',
            color: 'rgba(120, 220, 232, 0.9)',
            fontSize: '12px',
            fontFamily: '"Rajdhani", sans-serif',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontWeight: '600',
            outline: 'none',
            pointerEvents: 'auto'
        };
    }

    static getBarContainerStyles(): Record<string, string> {
        return {
            height: '10px',
            backgroundColor: 'rgba(10, 30, 40, 0.5)',
            borderRadius: '5px',
            overflow: 'hidden'
        };
    }

    static getBarStyles(): Record<string, string> {
        return {
            width: '100%',
            height: '100%',
            boxShadow: 'inset 0 0 5px rgba(255, 255, 255, 0.5)',
            transition: 'width 0.3s ease'
        };
    }

    static getScanlineEffectStyles(): Record<string, string> {
        return {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(transparent 50%, rgba(120, 220, 232, 0.03) 50%)',
            backgroundSize: '100% 4px',
            zIndex: '1000',
            pointerEvents: 'none',
            opacity: '0.5'
        };
    }

    static getActiveScanlineStyles(): Record<string, string> {
        return {
            position: 'absolute',
            left: '0',
            width: '100%',
            height: '3px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(120, 220, 232, 0.1) 50%, transparent 100%)',
            boxShadow: '0 0 10px rgba(120, 220, 232, 0.3)',
            zIndex: '1001',
            top: '0',
            opacity: '0.7',
            pointerEvents: 'none'
        };
    }

    static createGlitchAnimation(): string {
        const timestamp: number = Date.now();
        const glitchAnimation: string = `
            @keyframes glitch-${timestamp} {
                0% { transform: translate(0, 0) skew(0deg); filter: hue-rotate(0deg); }
                1% { transform: translate(2px, 2px) skew(1deg); filter: hue-rotate(90deg); }
                2% { transform: translate(-2px, -3px) skew(-1deg); filter: hue-rotate(180deg); }
                3% { transform: translate(0, 0) skew(0deg); filter: hue-rotate(0deg); }
                12% { clip-path: inset(0 0 0 0); }
                13% { clip-path: inset(10% 0 0 0); }
                14% { clip-path: inset(0 0 0 0); }
                15% { clip-path: inset(0 0 10% 0); }
                16% { clip-path: inset(0 0 0 0); }
                100% { transform: translate(0, 0) skew(0deg); filter: hue-rotate(0deg); }
            }
        `;
        
        // Add animation to document
        const style: HTMLStyleElement = document.createElement('style');
        style.textContent = glitchAnimation;
        document.head.appendChild(style);
        
        // Return animation name for usage
        return `glitch-${timestamp}`;
    }

    static applyStyles(element: HTMLElement, styles: Partial<CSSStyleDeclaration>): void {
        Object.assign(element.style, styles);
    }

    static addCornerElements(panel: HTMLElement): void {
        // Top left corner
        const topLeft: HTMLDivElement = document.createElement('div');
        HUDStyles.applyStyles(topLeft, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '10px',
            height: '10px',
            borderTop: '2px solid rgba(120, 220, 232, 0.8)',
            borderLeft: '2px solid rgba(120, 220, 232, 0.8)'
        });
        panel.appendChild(topLeft);
        
        // Top right corner
        const topRight: HTMLDivElement = document.createElement('div');
        HUDStyles.applyStyles(topRight, {
            position: 'absolute',
            top: '0',
            right: '0',
            width: '10px',
            height: '10px',
            borderTop: '2px solid rgba(120, 220, 232, 0.8)',
            borderRight: '2px solid rgba(120, 220, 232, 0.8)'
        });
        panel.appendChild(topRight);
        
        // Bottom left corner
        const bottomLeft: HTMLDivElement = document.createElement('div');
        HUDStyles.applyStyles(bottomLeft, {
            position: 'absolute',
            bottom: '0',
            left: '0',
            width: '10px',
            height: '10px',
            borderBottom: '2px solid rgba(120, 220, 232, 0.8)',
            borderLeft: '2px solid rgba(120, 220, 232, 0.8)'
        });
        panel.appendChild(bottomLeft);
        
        // Bottom right corner
        const bottomRight: HTMLDivElement = document.createElement('div');
        HUDStyles.applyStyles(bottomRight, {
            position: 'absolute',
            bottom: '0',
            right: '0',
            width: '10px',
            height: '10px',
            borderBottom: '2px solid rgba(120, 220, 232, 0.8)',
            borderRight: '2px solid rgba(120, 220, 232, 0.8)'
        });
        panel.appendChild(bottomRight);
    }
}