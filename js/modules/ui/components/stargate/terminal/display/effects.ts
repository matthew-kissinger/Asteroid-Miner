// effects.ts - CRT effects, glitch animations, and visual styling

export class TerminalEffects {
    private stylesInjected: boolean;

    constructor() {
        this.stylesInjected = false;
    }
    
    createStyles(): void {
        if (this.stylesInjected) return;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse-warning {
                0% { box-shadow: 0 0 15px rgba(255, 48, 48, 0.5); }
                50% { box-shadow: 0 0 25px rgba(255, 48, 48, 0.8); }
                100% { box-shadow: 0 0 15px rgba(255, 48, 48, 0.5); }
            }
            
            @keyframes pulse-glow {
                0%, 100% { opacity: 0.5; }
                50% { opacity: 1; }
            }
            
            /* Stargate Terminal Base Styles */
            #stargate-ui {
                --primary-bg: rgba(20, 30, 50, 0.9);
                --primary-border: #33aaff;
                --section-bg: rgba(10, 20, 35, 0.8);
                --accent-blue: #33aaff;
                --accent-green: #00cc33;
                --accent-orange: #ff9900;
                --accent-red: #ff3030;
                --accent-purple: #9933cc;
                --accent-cyan: #30cfd0;
                
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 80%;
                max-width: 1000px;
                max-height: 90vh;
                background-color: var(--primary-bg);
                color: #fff;
                border-radius: 15px;
                border: 2px solid var(--primary-border);
                box-shadow: 0 0 30px var(--primary-border);
                font-family: 'Courier New', monospace;
                z-index: 1000;
                display: none;
                overflow-y: auto;
                overflow-x: hidden;
                padding: 0;
            }
            
            /* Layout and Structure Styles */
            #stargate-header {
                background-color: rgba(30, 40, 60, 0.9);
                padding: 15px 20px;
                border-bottom: 1px solid var(--primary-border);
                position: sticky;
                top: 0;
                z-index: 10;
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            
            #stargate-content {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 20px;
                padding: 20px;
            }
            
            .stargate-section {
                background-color: var(--section-bg);
                border-radius: 10px;
                padding: 15px;
                border: 1px solid rgba(51, 170, 255, 0.3);
            }
            
            .stargate-section h3 {
                color: var(--accent-blue);
                margin-top: 0;
                margin-bottom: 15px;
                padding-bottom: 8px;
                border-bottom: 1px solid rgba(51, 170, 255, 0.3);
                font-size: 1.2em;
            }
            
            ${this.getComponentStyles()}
            
            /* Resource Border Effects */
            .iron-border { 
                border: 1px solid #cc6633; 
                box-shadow: 0 0 10px rgba(204, 102, 51, 0.3); 
            }
            .gold-border { 
                border: 1px solid #ffcc33; 
                box-shadow: 0 0 10px rgba(255, 204, 51, 0.3); 
            }
            .platinum-border { 
                border: 1px solid #33ccff; 
                box-shadow: 0 0 10px rgba(51, 204, 255, 0.3); 
            }
            .common-border { 
                border: 1px solid #00ff66; 
                box-shadow: 0 0 10px rgba(0, 255, 102, 0.3); 
            }
            .uncommon-border { 
                border: 1px solid #0066ff; 
                box-shadow: 0 0 10px rgba(0, 102, 255, 0.3); 
            }
            .rare-border { 
                border: 1px solid #9900ff; 
                box-shadow: 0 0 10px rgba(153, 0, 255, 0.3); 
            }
            .epic-border { 
                border: 1px solid #ff6600; 
                box-shadow: 0 0 10px rgba(255, 102, 0, 0.3); 
            }
            .legendary-border { 
                border: 1px solid #ff0000; 
                box-shadow: 0 0 10px rgba(255, 0, 0, 0.3); 
            }
            
            /* Undock Button Glow Effects */
            .btn-undock {
                background: linear-gradient(135deg, #00a8ff 0%, #0066cc 100%);
                font-size: 1.4em;
                font-weight: bold;
                letter-spacing: 3px;
                padding: 16px 40px;
                width: auto;
                min-width: 200px;
                margin-bottom: 15px;
                border: 2px solid #00d4ff;
                box-shadow: 0 0 20px rgba(0, 212, 255, 0.5), inset 0 0 20px rgba(0, 168, 255, 0.2);
                text-transform: uppercase;
                position: relative;
                overflow: hidden;
                transition: all 0.3s ease;
            }
            
            .btn-undock:hover {
                background: linear-gradient(135deg, #00d4ff 0%, #0088ff 100%);
                box-shadow: 0 0 30px rgba(0, 212, 255, 0.8), inset 0 0 20px rgba(0, 212, 255, 0.3);
                transform: translateY(-2px);
            }
            
            .btn-undock:active {
                transform: translateY(0);
            }
            
            .btn-undock::before {
                content: '';
                position: absolute;
                top: -2px;
                left: -2px;
                right: -2px;
                bottom: -2px;
                background: linear-gradient(45deg, transparent, #00d4ff, transparent);
                z-index: -1;
                opacity: 0;
                transition: opacity 0.3s;
                animation: pulse-glow 2s infinite;
            }
            
            .btn-undock:hover::before {
                opacity: 1;
            }
            
            /* Horde Button Warning Effects */
            .btn-horde { 
                background: linear-gradient(135deg, #990000 0%, var(--accent-red) 100%);
                color: #fff;
                border: 2px solid var(--accent-red);
                box-shadow: 0 0 15px rgba(255, 48, 48, 0.5);
                animation: pulse-warning 2s infinite;
            }
        `;
        document.head.appendChild(style);
        this.stylesInjected = true;
    }
    
    applyGlowEffect(element: HTMLElement | null, color = '#33aaff', intensity = 0.5): void {
        if (!element) return;
        
        element.style.boxShadow = `0 0 20px rgba(${this.hexToRgb(color)}, ${intensity})`;
    }
    
    removeGlowEffect(element: HTMLElement | null): void {
        if (!element) return;
        
        element.style.boxShadow = '';
    }
    
    hexToRgb(hex: string): string {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? 
            `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
            '255, 255, 255';
    }
    
    addPulseAnimation(element: HTMLElement | null, color = '#ff3030'): void {
        if (!element) return;
        
        element.style.animation = 'pulse-warning 2s infinite';
        element.style.boxShadow = `0 0 15px rgba(${this.hexToRgb(color)}, 0.5)`;
    }
    
    removePulseAnimation(element: HTMLElement | null): void {
        if (!element) return;
        
        element.style.animation = '';
        element.style.boxShadow = '';
    }
    
    addBorderGlow(element: HTMLElement | null, type: string): void {
        if (!element) return;
        
        const glowClasses = [
            'iron-border', 'gold-border', 'platinum-border',
            'common-border', 'uncommon-border', 'rare-border',
            'epic-border', 'legendary-border'
        ];
        
        // Remove existing glow classes
        element.classList.remove(...glowClasses);
        
        // Add new glow class
        if (type && glowClasses.includes(`${type}-border`)) {
            element.classList.add(`${type}-border`);
        }
    }
    
    getComponentStyles(): string {
        return `
            /* Ship Status Section */
            #ship-status-section {
                grid-column: 1;
                display: flex;
                flex-direction: column;
                gap: 15px;
            }
            
            .resources-container {
                display: flex;
                gap: 5px;
                margin-bottom: 10px;
            }
            
            .resource-display {
                flex: 1;
                padding: 8px;
                background-color: rgba(15, 40, 55, 0.8);
                border-radius: 5px;
                text-align: center;
            }
            
            .status-bar-container {
                width: 100%;
                height: 15px;
                background-color: #222;
                border-radius: 10px;
                overflow: hidden;
                margin-bottom: 5px;
            }
            
            .status-bar {
                height: 100%;
                border-radius: 10px;
            }
            
            .status-label {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
                font-size: 0.9em;
            }
            
            /* Market Section */
            #market-section {
                grid-column: 2;
                grid-row: 1;
            }
            
            .sell-buttons {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 5px;
                margin-bottom: 15px;
            }
            
            .sell-btn {
                padding: 10px;
                background-color: rgba(15, 40, 55, 0.8);
                color: #fff;
                border-radius: 5px;
                cursor: pointer;
                text-align: center;
                transition: all 0.2s;
                border: none;
                font-family: 'Courier New', monospace;
            }
            
            .orb-buttons {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
            }
            
            /* Upgrades Section */
            #upgrades-section {
                grid-column: 3;
                grid-row: 1;
            }
            
            .upgrade-item {
                margin-bottom: 15px;
                border: 1px solid rgba(85, 85, 85, 0.5);
                border-radius: 8px;
                padding: 12px;
                background-color: rgba(0, 0, 0, 0.3);
            }
            
            .upgrade-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }
            
            .upgrade-progress {
                position: relative;
                height: 8px;
                background-color: #333;
                border-radius: 4px;
                margin-bottom: 12px;
            }
            
            .upgrade-progress-bar {
                position: absolute;
                top: 0;
                left: 0;
                height: 100%;
                width: 20%;
                border-radius: 4px;
            }
            
            .upgrade-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .upgrade-description {
                flex: 2;
                padding-right: 10px;
                font-size: 0.85em;
                opacity: 0.8;
            }
            
            /* Features Section */
            #features-section {
                grid-column: 1 / span 2;
                grid-row: 2;
            }
            
            .feature-buttons {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
            }
            
            .feature-btn {
                padding: 15px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-family: 'Courier New', monospace;
                font-weight: bold;
                font-size: 16px;
                color: #fff;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 80px;
            }
            
            .feature-btn small {
                font-size: 0.8em;
                opacity: 0.8;
                margin-top: 5px;
            }
            
            /* Challenge Section */
            #challenge-section {
                border-color: rgba(255, 48, 48, 0.5);
            }
            
            #challenge-section h3 {
                color: var(--accent-red);
                border-color: rgba(255, 48, 48, 0.3);
            }
            
            /* Common Button Styles */
            .action-btn {
                width: 100%;
                padding: 10px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-family: 'Courier New', monospace;
                font-weight: bold;
                color: #000;
                margin-top: 5px;
            }
            
            /* Button color variations */
            .btn-fuel { background-color: var(--accent-green); }
            .btn-shield { background-color: var(--accent-blue); }
            .btn-hull { background-color: var(--accent-orange); }
            .btn-starmap { background-color: var(--accent-cyan); }
            .btn-blackjack { background-color: var(--accent-purple); }
            .btn-settings { background-color: var(--accent-blue); }
            
            /* Mobile Responsiveness */
            @media (max-width: 900px) {
                #stargate-ui {
                    width: 95%;
                    max-width: 95vw;
                    max-height: 85vh;
                    border-radius: 10px;
                }
                
                #stargate-content {
                    grid-template-columns: 1fr;
                    gap: 15px;
                    padding: 15px;
                }
                
                #ship-status-section,
                #market-section,
                #upgrades-section,
                #features-section {
                    grid-column: 1;
                }
                
                .feature-buttons {
                    grid-template-columns: 1fr;
                }
                
                .sell-buttons {
                    grid-template-columns: 1fr 1fr;
                }
                
                .action-btn {
                    padding: 12px;
                    min-height: 44px;
                }
            }
        `;
    }
}
