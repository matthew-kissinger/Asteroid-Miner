// displays.ts - Resource displays, health bars, fuel gauges, and data panels

import { HUDStyles } from './styles.ts';

// Game reference for dependency injection
type GameType = {
    audio?: {
        toggleMute(): boolean;
    };
};

let gameRef: GameType | null = null;

export function setGameReference(game: GameType): void {
    gameRef = game;
}

export class HUDDisplays {
    /**
     * Creates the flight panel displaying core ship information
     */
    static createFlightPanel(parent: HTMLElement): HTMLDivElement {
        const flightPanel = document.createElement('div');
        flightPanel.id = 'flight-panel';
        flightPanel.className = 'hud-panel';
        
        HUDStyles.applyStyles(flightPanel, {
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            width: '260px',
            padding: '15px',
            ...HUDStyles.getPanelStyles()
        });
        
        parent.appendChild(flightPanel);
        
        // Panel header
        const panelHeader = document.createElement('div');
        panelHeader.className = 'panel-header';
        panelHeader.innerHTML = '<span>FLIGHT SYSTEMS</span>';
        HUDStyles.applyStyles(panelHeader, HUDStyles.getPanelHeaderStyles());
        flightPanel.appendChild(panelHeader);
        
        // Add status indicator
        const statusIndicator = document.createElement('div');
        statusIndicator.className = 'status-indicator';
        HUDStyles.applyStyles(statusIndicator, HUDStyles.getStatusIndicatorStyles());
        panelHeader.appendChild(statusIndicator);
        
        // Create fuel gauge
        HUDDisplays.createFuelGauge(flightPanel);
        
        // Credits display
        HUDDisplays.createPanelRow(flightPanel, 'CREDITS', 'credits', '1000 CR');
        
        // Controls button
        HUDDisplays.createControlsButton(flightPanel);
        
        // Add holographic decorative elements
        HUDStyles.addCornerElements(flightPanel);
        
        return flightPanel;
    }

    /**
     * Creates the status panel for hull and shield monitoring
     */
    static createStatusPanel(parent: HTMLElement): HTMLDivElement {
        const statusPanel = document.createElement('div');
        statusPanel.id = 'status-panel';
        statusPanel.className = 'hud-panel';
        
        HUDStyles.applyStyles(statusPanel, {
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            width: '260px',
            padding: '15px',
            ...HUDStyles.getPanelStyles()
        });
        
        parent.appendChild(statusPanel);
        
        // Panel header
        const panelHeader = document.createElement('div');
        panelHeader.className = 'panel-header';
        panelHeader.innerHTML = '<span>SHIP STATUS</span>';
        HUDStyles.applyStyles(panelHeader, HUDStyles.getPanelHeaderStyles());
        statusPanel.appendChild(panelHeader);
        
        // Add status indicator
        const statusIndicator = document.createElement('div');
        statusIndicator.className = 'status-indicator';
        HUDStyles.applyStyles(statusIndicator, HUDStyles.getStatusIndicatorStyles());
        panelHeader.appendChild(statusIndicator);
        
        // Ship shield bar
        HUDDisplays.createShieldBar(statusPanel);
        
        // Ship hull integrity bar
        HUDDisplays.createHullBar(statusPanel);
        
        // Add holographic decorative elements
        HUDStyles.addCornerElements(statusPanel);
        
        // Add sound control button
        HUDDisplays.createSoundToggleButton(statusPanel);
        
        return statusPanel;
    }

    /**
     * Creates the location panel with system name, coordinates, and FPS
     */
    static createLocationPanel(parent: HTMLElement): HTMLDivElement {
        const locationPanel = document.createElement('div');
        locationPanel.id = 'location-panel';
        locationPanel.className = 'hud-panel';
        
        HUDStyles.applyStyles(locationPanel, {
            position: 'absolute',
            top: '20px',
            left: '20px',
            padding: '10px 20px',
            backgroundColor: 'rgba(6, 22, 31, 0.7)',
            backdropFilter: 'blur(5px)',
            borderRadius: '8px',
            border: '1px solid rgba(120, 220, 232, 0.3)',
            boxShadow: '0 0 15px rgba(120, 220, 232, 0.2)',
            fontSize: '14px'
        });
        
        parent.appendChild(locationPanel);
        
        // Location name with icon
        locationPanel.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" 
                          fill="rgba(120, 220, 232, 0.8)"/>
                </svg>
                <span id="current-system" style="font-weight:600; letter-spacing:1px;">SOLAR SYSTEM</span>
            </div>
            <div id="location-coordinates" style="margin-top:5px; font-size:12px; opacity:0.8;">X: 0 Y: 0 Z: 0</div>
            <div id="fps-display" style="margin-top:5px; font-size:12px; opacity:0.8;">FPS: 0</div>
            <div style="margin-top:5px; display:flex; align-items:center; gap:10px; font-size:12px; opacity:0.8;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" 
                          fill="rgba(120, 220, 232, 0.8)"/>
                    <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" 
                          fill="rgba(120, 220, 232, 0.5)"/>
                </svg>
                <span>ANOMALIES: <span id="anomaly-count" style="font-weight:600;">0</span></span>
            </div>
        `;
        
        // Add decorative corner effects
        HUDStyles.addCornerElements(locationPanel);
        
        return locationPanel;
    }

    /**
     * Creates the resource panel for cargo monitoring
     */
    static createResourcePanel(parent: HTMLElement): HTMLDivElement {
        const resourcePanel = document.createElement('div');
        resourcePanel.id = 'resource-panel';
        resourcePanel.className = 'hud-panel';
        
        HUDStyles.applyStyles(resourcePanel, {
            position: 'absolute',
            top: '20px',
            right: '20px',
            width: '180px',
            padding: '10px 15px',
            backgroundColor: 'rgba(6, 22, 31, 0.7)',
            backdropFilter: 'blur(5px)',
            borderRadius: '8px',
            border: '1px solid rgba(120, 220, 232, 0.3)',
            boxShadow: '0 0 15px rgba(120, 220, 232, 0.2)',
            fontSize: '14px'
        });
        
        parent.appendChild(resourcePanel);
        
        // Panel header
        const resourceHeader = document.createElement('div');
        resourceHeader.className = 'panel-header';
        resourceHeader.innerHTML = '<span>CARGO BAY</span>';
        HUDStyles.applyStyles(resourceHeader, {
            fontWeight: '600',
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '8px',
            paddingBottom: '5px',
            borderBottom: '1px solid rgba(120, 220, 232, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        });
        resourcePanel.appendChild(resourceHeader);
        
        // Add resources
        HUDDisplays.createResourceRow(resourcePanel, 'IRON', 'iron-amount', 'rgba(180, 180, 180, 0.8)');
        HUDDisplays.createResourceRow(resourcePanel, 'GOLD', 'gold-amount', 'rgba(255, 215, 0, 0.8)');
        HUDDisplays.createResourceRow(resourcePanel, 'PLATINUM', 'platinum-amount', 'rgba(229, 228, 226, 0.8)');
        
        // Add capacity meter
        HUDDisplays.createCapacityMeter(resourcePanel);
        
        // Add decorative corner elements
        HUDStyles.addCornerElements(resourcePanel);
        
        return resourcePanel;
    }

    /**
     * Creates the fuel gauge component
     */
    static createFuelGauge(panel: HTMLElement): void {
        const fuelRow = document.createElement('div');
        fuelRow.className = 'panel-row';
        HUDStyles.applyStyles(fuelRow, HUDStyles.getPanelRowStyles());
        panel.appendChild(fuelRow);
        
        const fuelLabel = document.createElement('span');
        fuelLabel.className = 'row-label';
        fuelLabel.textContent = 'FUEL';
        fuelLabel.style.width = '40%';
        fuelRow.appendChild(fuelLabel);
        
        // Add fuel value display
        const fuelValue = document.createElement('span');
        fuelValue.id = 'fuel-value';
        fuelValue.className = 'row-value';
        fuelValue.textContent = '100 / 100';
        HUDStyles.applyStyles(fuelValue, {
            position: 'absolute',
            right: '15px',
            top: '-18px',
            fontSize: '12px',
            color: 'rgba(120, 220, 232, 0.9)'
        });
        
        const fuelBarContainer = document.createElement('div');
        HUDStyles.applyStyles(fuelBarContainer, {
            width: '60%',
            position: 'relative',
            ...HUDStyles.getBarContainerStyles()
        });
        fuelBarContainer.appendChild(fuelValue);
        fuelRow.appendChild(fuelBarContainer);
        
        const fuelBar = document.createElement('div');
        fuelBar.id = 'fuel-bar';
        HUDStyles.applyStyles(fuelBar, {
            backgroundColor: 'rgba(120, 220, 232, 0.8)',
            ...HUDStyles.getBarStyles()
        });
        fuelBarContainer.appendChild(fuelBar);
    }

    /**
     * Creates the shield integrity bar
     */
    static createShieldBar(panel: HTMLElement): void {
        const shieldRow = document.createElement('div');
        shieldRow.className = 'panel-row';
        HUDStyles.applyStyles(shieldRow, HUDStyles.getPanelRowStyles());
        panel.appendChild(shieldRow);
        
        const shieldLabel = document.createElement('span');
        shieldLabel.className = 'row-label';
        shieldLabel.textContent = 'SHIELD';
        shieldLabel.style.width = '50%';
        shieldRow.appendChild(shieldLabel);
        
        const shieldBarContainer = document.createElement('div');
        HUDStyles.applyStyles(shieldBarContainer, {
            width: '50%',
            ...HUDStyles.getBarContainerStyles()
        });
        shieldRow.appendChild(shieldBarContainer);
        
        const shieldBar = document.createElement('div');
        shieldBar.id = 'shield-bar';
        HUDStyles.applyStyles(shieldBar, {
            backgroundColor: 'rgba(51, 153, 255, 0.8)',
            ...HUDStyles.getBarStyles()
        });
        shieldBarContainer.appendChild(shieldBar);
    }

    /**
     * Creates the hull integrity bar
     */
    static createHullBar(panel: HTMLElement): void {
        const hullRow = document.createElement('div');
        hullRow.className = 'panel-row';
        HUDStyles.applyStyles(hullRow, HUDStyles.getPanelRowStyles());
        panel.appendChild(hullRow);
        
        const hullLabel = document.createElement('span');
        hullLabel.className = 'row-label';
        hullLabel.textContent = 'HULL INTEGRITY';
        hullLabel.style.width = '50%';
        hullRow.appendChild(hullLabel);
        
        const hullBarContainer = document.createElement('div');
        HUDStyles.applyStyles(hullBarContainer, {
            width: '50%',
            ...HUDStyles.getBarContainerStyles()
        });
        hullRow.appendChild(hullBarContainer);
        
        const hullBar = document.createElement('div');
        hullBar.id = 'hull-bar';
        HUDStyles.applyStyles(hullBar, {
            backgroundColor: 'rgba(120, 220, 232, 0.8)',
            ...HUDStyles.getBarStyles()
        });
        hullBarContainer.appendChild(hullBar);
    }

    /**
     * Creates a resource row for the cargo panel
     */
    static createResourceRow(panel: HTMLElement, name: string, id: string, hexColor: string): void {
        const row = document.createElement('div');
        HUDStyles.applyStyles(row, {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            margin: '5px 0'
        });
        
        // Hex icon with resource color
        const hexIcon = document.createElement('div');
        HUDStyles.applyStyles(hexIcon, {
            width: '12px',
            height: '14px',
            clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
            backgroundColor: hexColor,
            marginRight: '8px'
        });
        
        const label = document.createElement('div');
        HUDStyles.applyStyles(label, {
            display: 'flex',
            alignItems: 'center',
            width: '50%',
            fontSize: '12px'
        });
        label.appendChild(hexIcon);
        label.appendChild(document.createTextNode(name));
        
        const value = document.createElement('div');
        value.id = id;
        HUDStyles.applyStyles(value, {
            width: '50%',
            textAlign: 'right',
            fontWeight: '600',
            fontSize: '12px'
        });
        value.textContent = '0';
        
        row.appendChild(label);
        row.appendChild(value);
        panel.appendChild(row);
    }

    /**
     * Creates the cargo capacity meter
     */
    static createCapacityMeter(panel: HTMLElement): void {
        const capacityRow = document.createElement('div');
        HUDStyles.applyStyles(capacityRow, {
            marginTop: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(120, 220, 232, 0.3)',
            paddingTop: '8px'
        });
        panel.appendChild(capacityRow);
        
        const capacityLabel = document.createElement('div');
        capacityLabel.textContent = 'CAPACITY';
        capacityLabel.style.fontSize = '12px';
        capacityRow.appendChild(capacityLabel);
        
        const capacityValue = document.createElement('div');
        capacityValue.id = 'cargo-capacity';
        capacityValue.textContent = '0 / 1000';
        HUDStyles.applyStyles(capacityValue, {
            fontSize: '12px',
            fontWeight: '600'
        });
        capacityRow.appendChild(capacityValue);
        
        // Add capacity bar
        const capacityBarContainer = document.createElement('div');
        HUDStyles.applyStyles(capacityBarContainer, {
            width: '100%',
            height: '5px',
            backgroundColor: 'rgba(10, 30, 40, 0.5)',
            borderRadius: '3px',
            overflow: 'hidden',
            marginTop: '5px'
        });
        panel.appendChild(capacityBarContainer);
        
        const capacityBar = document.createElement('div');
        capacityBar.id = 'capacity-bar';
        HUDStyles.applyStyles(capacityBar, {
            width: '0%',
            height: '100%',
            backgroundColor: 'rgba(120, 220, 232, 0.8)',
            transition: 'width 0.3s ease'
        });
        capacityBarContainer.appendChild(capacityBar);
    }

    /**
     * Creates a standard panel row with label and value
     */
    static createPanelRow(panel: HTMLElement, label: string, id: string, defaultValue: string, isIndicator: boolean = false): void {
        const row = document.createElement('div');
        row.className = 'panel-row';
        HUDStyles.applyStyles(row, {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            margin: '8px 0'
        });
        panel.appendChild(row);
        
        const labelEl = document.createElement('span');
        labelEl.className = 'row-label';
        labelEl.textContent = label;
        row.appendChild(labelEl);
        
        const valueEl = document.createElement('span');
        valueEl.id = id;
        valueEl.className = 'row-value';
        valueEl.textContent = defaultValue;
        
        if (isIndicator && defaultValue === 'ON') {
            valueEl.style.color = '#5fff8f';
        } else if (isIndicator && defaultValue === 'OFF') {
            valueEl.style.color = '#ff7f7f';
        }
        
        row.appendChild(valueEl);
    }

    /**
     * Creates the systems control button
     */
    static createControlsButton(panel: HTMLElement): void {
        const controlsButton = document.createElement('button');
        controlsButton.id = 'show-controls';
        controlsButton.textContent = 'SYSTEM CONTROLS';
        HUDStyles.applyStyles(controlsButton, HUDStyles.getButtonStyles());
        
        controlsButton.addEventListener('mouseover', () => {
            HUDStyles.applyStyles(controlsButton, {
                backgroundColor: 'rgba(120, 220, 232, 0.3)',
                boxShadow: '0 0 10px rgba(120, 220, 232, 0.5)'
            });
        });
        
        controlsButton.addEventListener('mouseout', () => {
            HUDStyles.applyStyles(controlsButton, {
                backgroundColor: 'rgba(120, 220, 232, 0.15)',
                boxShadow: 'none'
            });
        });
        
        panel.appendChild(controlsButton);
    }

    /**
     * Creates the sound toggle button
     */
    static createSoundToggleButton(panel: HTMLElement): void {
        const soundToggleBtn = document.createElement('button');
        soundToggleBtn.id = 'sound-toggle';
        soundToggleBtn.textContent = 'SOUND: ON';
        HUDStyles.applyStyles(soundToggleBtn, {
            background: 'none',
            border: '1px solid rgba(120, 220, 232, 0.5)',
            color: 'rgba(120, 220, 232, 0.9)',
            padding: '5px 10px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontFamily: '"Rajdhani", sans-serif',
            fontSize: '12px',
            marginLeft: '10px',
            marginTop: '10px',
            outline: 'none',
            pointerEvents: 'auto'
        });
        
        // Add click handler for sound toggle
        soundToggleBtn.addEventListener('click', () => {
            if (gameRef && gameRef.audio) {
                const isMuted = gameRef.audio.toggleMute();
                soundToggleBtn.textContent = isMuted ? 'SOUND: OFF' : 'SOUND: ON';
            }
        });
        
        panel.appendChild(soundToggleBtn);
    }
}