// hud.js - Handles the game's advanced holographic heads-up display

export class HUD {
    constructor(spaceship) {
        this.spaceship = spaceship;
        this.setupHUD();
        this.animationFrames = [];
        this.glitchInterval = null;
        this.scanline = null;
        this.hudOpacity = 0;
        this.animateHudIn();
    }
    
    setupHUD() {
        // Create main HUD container with holographic glass effect
        const hudContainer = document.createElement('div');
        hudContainer.id = 'hud-container';
        hudContainer.style.position = 'absolute';
        hudContainer.style.top = '0';
        hudContainer.style.left = '0';
        hudContainer.style.width = '100%';
        hudContainer.style.height = '100%';
        hudContainer.style.pointerEvents = 'none';
        hudContainer.style.fontFamily = '"Rajdhani", "Electrolize", sans-serif';
        hudContainer.style.fontWeight = '400';
        hudContainer.style.color = 'rgba(120, 220, 232, 0.9)';
        hudContainer.style.textShadow = '0 0 10px rgba(120, 220, 232, 0.5)';
        hudContainer.style.opacity = '0';
        hudContainer.style.transition = 'opacity 0.5s ease';
        document.body.appendChild(hudContainer);
        
        // Add Google Font for futuristic UI
        const fontLink = document.createElement('link');
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600&family=Electrolize&display=swap';
        fontLink.rel = 'stylesheet';
        document.head.appendChild(fontLink);
        
        // Add holographic scanline effect
        this.createScanlineEffect(hudContainer);
        
        // Create flight data panel - bottom left
        this.createFlightPanel(hudContainer);
        
        // Create ship status panel - bottom right 
        this.createStatusPanel(hudContainer);
        
        // Create crosshair with targeting system
        this.createTargetingSystem(hudContainer);
        
        // Create location info - top left
        this.createLocationPanel(hudContainer);
        
        // Create resource panel - top right
        this.createResourcePanel(hudContainer);
        
        // Radar removed as per user request
        
        // Add notifications area - top center
        this.createNotificationsArea(hudContainer);
    }
    
    createScanlineEffect(parent) {
        // Scanline effect overlay
        const scanlineEffect = document.createElement('div');
        scanlineEffect.id = 'scanline-effect';
        scanlineEffect.style.position = 'absolute';
        scanlineEffect.style.top = '0';
        scanlineEffect.style.left = '0';
        scanlineEffect.style.width = '100%';
        scanlineEffect.style.height = '100%';
        scanlineEffect.style.background = 'linear-gradient(transparent 50%, rgba(120, 220, 232, 0.03) 50%)';
        scanlineEffect.style.backgroundSize = '100% 4px';
        scanlineEffect.style.zIndex = '1000';
        scanlineEffect.style.pointerEvents = 'none';
        scanlineEffect.style.opacity = '0.5';
        parent.appendChild(scanlineEffect);
        
        // Add subtle scan line that moves
        const activeScanline = document.createElement('div');
        activeScanline.id = 'active-scanline';
        activeScanline.style.position = 'absolute';
        activeScanline.style.left = '0';
        activeScanline.style.width = '100%';
        activeScanline.style.height = '3px';
        activeScanline.style.background = 'linear-gradient(90deg, transparent 0%, rgba(120, 220, 232, 0.1) 50%, transparent 100%)';
        activeScanline.style.boxShadow = '0 0 10px rgba(120, 220, 232, 0.3)';
        activeScanline.style.zIndex = '1001';
        activeScanline.style.top = '0';
        activeScanline.style.opacity = '0.7';
        activeScanline.style.pointerEvents = 'none';
        parent.appendChild(activeScanline);
        
        this.scanline = activeScanline;
    }
    
    createFlightPanel(parent) {
        const flightPanel = document.createElement('div');
        flightPanel.id = 'flight-panel';
        flightPanel.className = 'hud-panel';
        flightPanel.style.position = 'absolute';
        flightPanel.style.bottom = '20px';
        flightPanel.style.left = '20px';
        flightPanel.style.width = '260px';
        flightPanel.style.padding = '15px';
        flightPanel.style.backgroundColor = 'rgba(6, 22, 31, 0.7)';
        flightPanel.style.backdropFilter = 'blur(5px)';
        flightPanel.style.borderRadius = '10px';
        flightPanel.style.border = '1px solid rgba(120, 220, 232, 0.3)';
        flightPanel.style.boxShadow = '0 0 15px rgba(120, 220, 232, 0.2), inset 0 0 10px rgba(120, 220, 232, 0.1)';
        flightPanel.style.overflow = 'hidden';
        parent.appendChild(flightPanel);
        
        // Panel header
        const panelHeader = document.createElement('div');
        panelHeader.className = 'panel-header';
        panelHeader.innerHTML = '<span>FLIGHT SYSTEMS</span>';
        panelHeader.style.fontWeight = '600';
        panelHeader.style.fontSize = '14px';
        panelHeader.style.textTransform = 'uppercase';
        panelHeader.style.letterSpacing = '2px';
        panelHeader.style.marginBottom = '15px';
        panelHeader.style.paddingBottom = '8px';
        panelHeader.style.borderBottom = '1px solid rgba(120, 220, 232, 0.3)';
        panelHeader.style.display = 'flex';
        panelHeader.style.justifyContent = 'space-between';
        panelHeader.style.alignItems = 'center';
        flightPanel.appendChild(panelHeader);
        
        // Add a small blinking indicator
        const statusIndicator = document.createElement('div');
        statusIndicator.className = 'status-indicator';
        statusIndicator.style.width = '8px';
        statusIndicator.style.height = '8px';
        statusIndicator.style.borderRadius = '50%';
        statusIndicator.style.backgroundColor = 'rgba(120, 220, 232, 0.8)';
        statusIndicator.style.boxShadow = '0 0 5px rgba(120, 220, 232, 0.8)';
        statusIndicator.style.animation = 'pulse 2s infinite';
        panelHeader.appendChild(statusIndicator);
        
        // Create flight data items
        
        // Add fuel gauge with visual indicator
        const fuelRow = document.createElement('div');
        fuelRow.className = 'panel-row';
        fuelRow.style.display = 'flex';
        fuelRow.style.justifyContent = 'space-between';
        fuelRow.style.alignItems = 'center';
        fuelRow.style.margin = '10px 0';
        flightPanel.appendChild(fuelRow);
        
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
        fuelValue.style.position = 'absolute';
        fuelValue.style.right = '15px';
        fuelValue.style.top = '-18px';
        fuelValue.style.fontSize = '12px';
        fuelValue.style.color = 'rgba(120, 220, 232, 0.9)';
        
        const fuelBarContainer = document.createElement('div');
        fuelBarContainer.style.width = '60%';
        fuelBarContainer.style.height = '10px';
        fuelBarContainer.style.backgroundColor = 'rgba(10, 30, 40, 0.5)';
        fuelBarContainer.style.borderRadius = '5px';
        fuelBarContainer.style.overflow = 'hidden';
        fuelBarContainer.style.position = 'relative';
        fuelBarContainer.appendChild(fuelValue);
        fuelRow.appendChild(fuelBarContainer);
        
        const fuelBar = document.createElement('div');
        fuelBar.id = 'fuel-bar';
        fuelBar.style.width = '100%';
        fuelBar.style.height = '100%';
        fuelBar.style.backgroundColor = 'rgba(120, 220, 232, 0.8)';
        fuelBar.style.boxShadow = 'inset 0 0 5px rgba(255, 255, 255, 0.5)';
        fuelBar.style.transition = 'width 0.3s ease';
        fuelBarContainer.appendChild(fuelBar);
        
        // Credits display
        this.createPanelRow(flightPanel, 'CREDITS', 'credits', '1000 CR');
        
        // Controls button
        const controlsButton = document.createElement('button');
        controlsButton.id = 'show-controls';
        controlsButton.textContent = 'SYSTEM CONTROLS';
        controlsButton.style.width = '100%';
        controlsButton.style.marginTop = '15px';
        controlsButton.style.padding = '8px';
        controlsButton.style.backgroundColor = 'rgba(120, 220, 232, 0.15)';
        controlsButton.style.border = '1px solid rgba(120, 220, 232, 0.5)';
        controlsButton.style.borderRadius = '5px';
        controlsButton.style.color = 'rgba(120, 220, 232, 0.9)';
        controlsButton.style.fontSize = '12px';
        controlsButton.style.fontFamily = '"Rajdhani", sans-serif';
        controlsButton.style.cursor = 'pointer';
        controlsButton.style.transition = 'all 0.2s ease';
        controlsButton.style.textTransform = 'uppercase';
        controlsButton.style.letterSpacing = '1px';
        controlsButton.style.fontWeight = '600';
        controlsButton.style.outline = 'none';
        controlsButton.style.pointerEvents = 'auto';
        
        controlsButton.addEventListener('mouseover', () => {
            controlsButton.style.backgroundColor = 'rgba(120, 220, 232, 0.3)';
            controlsButton.style.boxShadow = '0 0 10px rgba(120, 220, 232, 0.5)';
        });
        
        controlsButton.addEventListener('mouseout', () => {
            controlsButton.style.backgroundColor = 'rgba(120, 220, 232, 0.15)';
            controlsButton.style.boxShadow = 'none';
        });
        
        flightPanel.appendChild(controlsButton);
        
        // Add holographic decorative elements
        this.addHolographicElements(flightPanel);
    }
    
    createStatusPanel(parent) {
        const statusPanel = document.createElement('div');
        statusPanel.id = 'status-panel';
        statusPanel.className = 'hud-panel';
        statusPanel.style.position = 'absolute';
        statusPanel.style.bottom = '20px';
        statusPanel.style.right = '20px';
        statusPanel.style.width = '260px';
        statusPanel.style.padding = '15px';
        statusPanel.style.backgroundColor = 'rgba(6, 22, 31, 0.7)';
        statusPanel.style.backdropFilter = 'blur(5px)';
        statusPanel.style.borderRadius = '10px';
        statusPanel.style.border = '1px solid rgba(120, 220, 232, 0.3)';
        statusPanel.style.boxShadow = '0 0 15px rgba(120, 220, 232, 0.2), inset 0 0 10px rgba(120, 220, 232, 0.1)';
        parent.appendChild(statusPanel);
        
        // Panel header
        const panelHeader = document.createElement('div');
        panelHeader.className = 'panel-header';
        panelHeader.innerHTML = '<span>SHIP STATUS</span>';
        panelHeader.style.fontWeight = '600';
        panelHeader.style.fontSize = '14px';
        panelHeader.style.textTransform = 'uppercase';
        panelHeader.style.letterSpacing = '2px';
        panelHeader.style.marginBottom = '15px';
        panelHeader.style.paddingBottom = '8px';
        panelHeader.style.borderBottom = '1px solid rgba(120, 220, 232, 0.3)';
        panelHeader.style.display = 'flex';
        panelHeader.style.justifyContent = 'space-between';
        panelHeader.style.alignItems = 'center';
        statusPanel.appendChild(panelHeader);
        
        // Add a small blinking indicator
        const statusIndicator = document.createElement('div');
        statusIndicator.className = 'status-indicator';
        statusIndicator.style.width = '8px';
        statusIndicator.style.height = '8px';
        statusIndicator.style.borderRadius = '50%';
        statusIndicator.style.backgroundColor = 'rgba(120, 220, 232, 0.8)';
        statusIndicator.style.boxShadow = '0 0 5px rgba(120, 220, 232, 0.8)';
        statusIndicator.style.animation = 'pulse 2s infinite';
        panelHeader.appendChild(statusIndicator);
        
        // Ship shield bar
        const shieldRow = document.createElement('div');
        shieldRow.className = 'panel-row';
        shieldRow.style.display = 'flex';
        shieldRow.style.justifyContent = 'space-between';
        shieldRow.style.alignItems = 'center';
        shieldRow.style.margin = '10px 0';
        statusPanel.appendChild(shieldRow);
        
        const shieldLabel = document.createElement('span');
        shieldLabel.className = 'row-label';
        shieldLabel.textContent = 'SHIELD';
        shieldLabel.style.width = '50%';
        shieldRow.appendChild(shieldLabel);
        
        const shieldBarContainer = document.createElement('div');
        shieldBarContainer.style.width = '50%';
        shieldBarContainer.style.height = '10px';
        shieldBarContainer.style.backgroundColor = 'rgba(10, 30, 40, 0.5)';
        shieldBarContainer.style.borderRadius = '5px';
        shieldBarContainer.style.overflow = 'hidden';
        shieldRow.appendChild(shieldBarContainer);
        
        const shieldBar = document.createElement('div');
        shieldBar.id = 'shield-bar';
        shieldBar.style.width = '100%';
        shieldBar.style.height = '100%';
        shieldBar.style.backgroundColor = 'rgba(51, 153, 255, 0.8)'; // Blue color for shield
        shieldBar.style.boxShadow = 'inset 0 0 5px rgba(255, 255, 255, 0.5)';
        shieldBar.style.transition = 'width 0.3s ease';
        shieldBarContainer.appendChild(shieldBar);
        
        // Ship hull integrity bar
        const hullRow = document.createElement('div');
        hullRow.className = 'panel-row';
        hullRow.style.display = 'flex';
        hullRow.style.justifyContent = 'space-between';
        hullRow.style.alignItems = 'center';
        hullRow.style.margin = '10px 0';
        statusPanel.appendChild(hullRow);
        
        const hullLabel = document.createElement('span');
        hullLabel.className = 'row-label';
        hullLabel.textContent = 'HULL INTEGRITY';
        hullLabel.style.width = '50%';
        hullRow.appendChild(hullLabel);
        
        const hullBarContainer = document.createElement('div');
        hullBarContainer.style.width = '50%';
        hullBarContainer.style.height = '10px';
        hullBarContainer.style.backgroundColor = 'rgba(10, 30, 40, 0.5)';
        hullBarContainer.style.borderRadius = '5px';
        hullBarContainer.style.overflow = 'hidden';
        hullRow.appendChild(hullBarContainer);
        
        const hullBar = document.createElement('div');
        hullBar.id = 'hull-bar';
        hullBar.style.width = '100%';
        hullBar.style.height = '100%';
        hullBar.style.backgroundColor = 'rgba(120, 220, 232, 0.8)';
        hullBar.style.boxShadow = 'inset 0 0 5px rgba(255, 255, 255, 0.5)';
        hullBar.style.transition = 'width 0.3s ease';
        hullBarContainer.appendChild(hullBar);
        
        // Add holographic decorative elements
        this.addHolographicElements(statusPanel);
        
        // Add sound control button
        const soundToggleBtn = document.createElement('button');
        soundToggleBtn.id = 'sound-toggle';
        soundToggleBtn.textContent = 'SOUND: ON';
        soundToggleBtn.style.background = 'none';
        soundToggleBtn.style.border = '1px solid rgba(120, 220, 232, 0.5)';
        soundToggleBtn.style.color = 'rgba(120, 220, 232, 0.9)';
        soundToggleBtn.style.padding = '5px 10px';
        soundToggleBtn.style.borderRadius = '5px';
        soundToggleBtn.style.cursor = 'pointer';
        soundToggleBtn.style.fontFamily = '"Rajdhani", sans-serif';
        soundToggleBtn.style.fontSize = '12px';
        soundToggleBtn.style.marginLeft = '10px';
        soundToggleBtn.style.marginTop = '10px';
        soundToggleBtn.style.outline = 'none';
        soundToggleBtn.style.pointerEvents = 'auto';
        
        // Add click handler for sound toggle
        soundToggleBtn.addEventListener('click', () => {
            if (window.game && window.game.audio) {
                const isMuted = window.game.audio.toggleMute();
                soundToggleBtn.textContent = isMuted ? 'SOUND: OFF' : 'SOUND: ON';
            }
        });
        
        statusPanel.appendChild(soundToggleBtn);
    }
    
    createTargetingSystem(parent) {
        // Main crosshair container
        const targetingSystem = document.createElement('div');
        targetingSystem.id = 'targeting-system';
        targetingSystem.style.position = 'absolute';
        targetingSystem.style.top = '50%';
        targetingSystem.style.left = '50%';
        targetingSystem.style.transform = 'translate(-50%, -50%)';
        targetingSystem.style.width = '100px';
        targetingSystem.style.height = '100px';
        targetingSystem.style.zIndex = '100';
        parent.appendChild(targetingSystem);
        
        // Crosshair - create using SVG for more precise styling
        const crosshair = document.createElement('div');
        crosshair.id = 'crosshair';
        crosshair.style.position = 'absolute';
        crosshair.style.top = '50%';
        crosshair.style.left = '50%';
        crosshair.style.transform = 'translate(-50%, -50%)';
        crosshair.style.width = '50px';
        crosshair.style.height = '50px';
        
        // SVG crosshair
        crosshair.innerHTML = `
            <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="25" cy="25" r="20" stroke="rgba(120, 220, 232, 0.5)" stroke-width="1" stroke-dasharray="8 4"/>
                <circle cx="25" cy="25" r="3" stroke="rgba(120, 220, 232, 0.8)" stroke-width="1"/>
                <circle cx="25" cy="25" r="1" fill="rgba(120, 220, 232, 0.8)"/>
                <line x1="25" y1="10" x2="25" y2="18" stroke="rgba(120, 220, 232, 0.8)" stroke-width="1"/>
                <line x1="25" y1="32" x2="25" y2="40" stroke="rgba(120, 220, 232, 0.8)" stroke-width="1"/>
                <line x1="10" y1="25" x2="18" y2="25" stroke="rgba(120, 220, 232, 0.8)" stroke-width="1"/>
                <line x1="32" y1="25" x2="40" y2="25" stroke="rgba(120, 220, 232, 0.8)" stroke-width="1"/>
                <!-- Add a pulsing animation to the outer circle -->
                <circle cx="25" cy="25" r="24" stroke="rgba(120, 220, 232, 0.3)" stroke-width="1">
                    <animate attributeName="r" values="24;28;24" dur="3s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.3;0.1;0.3" dur="3s" repeatCount="indefinite"/>
                </circle>
            </svg>
        `;
        
        targetingSystem.appendChild(crosshair);
        
        // Target info display that appears when targeting something
        const targetInfo = document.createElement('div');
        targetInfo.id = 'target-info';
        targetInfo.style.position = 'absolute';
        targetInfo.style.top = '60px';
        targetInfo.style.left = '50%';
        targetInfo.style.transform = 'translateX(-50%)';
        targetInfo.style.width = '200px';
        targetInfo.style.backgroundColor = 'rgba(6, 22, 31, 0.5)';
        targetInfo.style.backdropFilter = 'blur(5px)';
        targetInfo.style.borderRadius = '5px';
        targetInfo.style.padding = '8px';
        targetInfo.style.fontSize = '12px';
        targetInfo.style.color = 'rgba(120, 220, 232, 0.9)';
        targetInfo.style.border = '1px solid rgba(120, 220, 232, 0.3)';
        targetInfo.style.boxShadow = '0 0 10px rgba(120, 220, 232, 0.2)';
        targetInfo.style.textAlign = 'center';
        targetInfo.style.display = 'none';
        targetingSystem.appendChild(targetInfo);
        
        // Target info content
        targetInfo.innerHTML = `
            <div id="target-name" style="font-weight:600; margin-bottom:5px; font-size:14px;">NO TARGET</div>
            <div id="target-distance" style="margin-bottom:3px;">DISTANCE: ---</div>
            <div id="target-type" style="margin-bottom:3px;">TYPE: ---</div>
            <div id="target-resources" style="margin-bottom:3px;">RESOURCES: ---</div>
        `;
        
        // Laser beam
        const laserBeam = document.createElement('div');
        laserBeam.id = 'laser-beam';
        laserBeam.style.position = 'absolute';
        laserBeam.style.top = '50%';
        laserBeam.style.left = '50%';
        laserBeam.style.width = '0px';
        laserBeam.style.height = '2px';
        laserBeam.style.backgroundColor = 'rgba(255, 50, 50, 0.8)';
        laserBeam.style.boxShadow = '0 0 10px rgba(255, 50, 50, 0.8)';
        laserBeam.style.transformOrigin = 'left';
        laserBeam.style.transform = 'rotate(var(--angle, 0deg))';
        laserBeam.style.zIndex = '90';
        laserBeam.style.display = 'none';
        parent.appendChild(laserBeam);
    }
    
    createLocationPanel(parent) {
        // Location info panel - top left
        const locationPanel = document.createElement('div');
        locationPanel.id = 'location-panel';
        locationPanel.className = 'hud-panel';
        locationPanel.style.position = 'absolute';
        locationPanel.style.top = '20px';
        locationPanel.style.left = '20px';
        locationPanel.style.padding = '10px 20px';
        locationPanel.style.backgroundColor = 'rgba(6, 22, 31, 0.7)';
        locationPanel.style.backdropFilter = 'blur(5px)';
        locationPanel.style.borderRadius = '8px';
        locationPanel.style.border = '1px solid rgba(120, 220, 232, 0.3)';
        locationPanel.style.boxShadow = '0 0 15px rgba(120, 220, 232, 0.2)';
        locationPanel.style.fontSize = '14px';
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
        this.addCornerElements(locationPanel);
    }
    
    createResourcePanel(parent) {
        // Resource monitoring panel - top right
        const resourcePanel = document.createElement('div');
        resourcePanel.id = 'resource-panel';
        resourcePanel.className = 'hud-panel';
        resourcePanel.style.position = 'absolute';
        resourcePanel.style.top = '20px';
        resourcePanel.style.right = '20px';
        resourcePanel.style.width = '180px';
        resourcePanel.style.padding = '10px 15px';
        resourcePanel.style.backgroundColor = 'rgba(6, 22, 31, 0.7)';
        resourcePanel.style.backdropFilter = 'blur(5px)';
        resourcePanel.style.borderRadius = '8px';
        resourcePanel.style.border = '1px solid rgba(120, 220, 232, 0.3)';
        resourcePanel.style.boxShadow = '0 0 15px rgba(120, 220, 232, 0.2)';
        resourcePanel.style.fontSize = '14px';
        parent.appendChild(resourcePanel);
        
        // Panel header
        const resourceHeader = document.createElement('div');
        resourceHeader.className = 'panel-header';
        resourceHeader.innerHTML = '<span>CARGO BAY</span>';
        resourceHeader.style.fontWeight = '600';
        resourceHeader.style.fontSize = '12px';
        resourceHeader.style.textTransform = 'uppercase';
        resourceHeader.style.letterSpacing = '1px';
        resourceHeader.style.marginBottom = '8px';
        resourceHeader.style.paddingBottom = '5px';
        resourceHeader.style.borderBottom = '1px solid rgba(120, 220, 232, 0.3)';
        resourceHeader.style.display = 'flex';
        resourceHeader.style.justifyContent = 'space-between';
        resourceHeader.style.alignItems = 'center';
        resourcePanel.appendChild(resourceHeader);
        
        // Add resources with hex icon prefixes
        const createResourceRow = (name, id, hexColor) => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.justifyContent = 'space-between';
            row.style.margin = '5px 0';
            
            // Hex icon with resource color
            const hexIcon = document.createElement('div');
            hexIcon.style.width = '12px';
            hexIcon.style.height = '14px';
            hexIcon.style.clipPath = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
            hexIcon.style.backgroundColor = hexColor;
            hexIcon.style.marginRight = '8px';
            
            const label = document.createElement('div');
            label.style.display = 'flex';
            label.style.alignItems = 'center';
            label.style.width = '50%';
            label.style.fontSize = '12px';
            label.appendChild(hexIcon);
            label.appendChild(document.createTextNode(name));
            
            const value = document.createElement('div');
            value.id = id;
            value.style.width = '50%';
            value.style.textAlign = 'right';
            value.style.fontWeight = '600';
            value.style.fontSize = '12px';
            value.textContent = '0';
            
            row.appendChild(label);
            row.appendChild(value);
            resourcePanel.appendChild(row);
        };
        
        createResourceRow('IRON', 'iron-amount', 'rgba(180, 180, 180, 0.8)');
        createResourceRow('GOLD', 'gold-amount', 'rgba(255, 215, 0, 0.8)');
        createResourceRow('PLATINUM', 'platinum-amount', 'rgba(229, 228, 226, 0.8)');
        
        // Add capacity meter
        const capacityRow = document.createElement('div');
        capacityRow.style.marginTop = '8px';
        capacityRow.style.display = 'flex';
        capacityRow.style.justifyContent = 'space-between';
        capacityRow.style.alignItems = 'center';
        capacityRow.style.borderTop = '1px solid rgba(120, 220, 232, 0.3)';
        capacityRow.style.paddingTop = '8px';
        resourcePanel.appendChild(capacityRow);
        
        const capacityLabel = document.createElement('div');
        capacityLabel.textContent = 'CAPACITY';
        capacityLabel.style.fontSize = '12px';
        capacityRow.appendChild(capacityLabel);
        
        const capacityValue = document.createElement('div');
        capacityValue.id = 'cargo-capacity';
        capacityValue.textContent = '0 / 1000';
        capacityValue.style.fontSize = '12px';
        capacityValue.style.fontWeight = '600';
        capacityRow.appendChild(capacityValue);
        
        // Add capacity bar
        const capacityBarContainer = document.createElement('div');
        capacityBarContainer.style.width = '100%';
        capacityBarContainer.style.height = '5px';
        capacityBarContainer.style.backgroundColor = 'rgba(10, 30, 40, 0.5)';
        capacityBarContainer.style.borderRadius = '3px';
        capacityBarContainer.style.overflow = 'hidden';
        capacityBarContainer.style.marginTop = '5px';
        resourcePanel.appendChild(capacityBarContainer);
        
        const capacityBar = document.createElement('div');
        capacityBar.id = 'capacity-bar';
        capacityBar.style.width = '0%';
        capacityBar.style.height = '100%';
        capacityBar.style.backgroundColor = 'rgba(120, 220, 232, 0.8)';
        capacityBar.style.transition = 'width 0.3s ease';
        capacityBarContainer.appendChild(capacityBar);
        
        // Add decorative corner elements
        this.addCornerElements(resourcePanel);
    }
    
    // Radar panel removed as per user request
    
    createNotificationsArea(parent) {
        // Create notifications area in the top middle of the screen
        const notificationsArea = document.createElement('div');
        notificationsArea.id = 'notifications-area';
        notificationsArea.style.position = 'absolute';
        notificationsArea.style.top = '20px';
        notificationsArea.style.left = '50%';
        notificationsArea.style.transform = 'translateX(-50%)';
        notificationsArea.style.display = 'flex';
        notificationsArea.style.flexDirection = 'column';
        notificationsArea.style.alignItems = 'center';
        notificationsArea.style.gap = '10px';
        parent.appendChild(notificationsArea);
        
        // Note: Survival timer has been removed - only horde mode timer will be used
        
        // Add horde mode indicator (hidden by default)
        const hordeIndicator = document.createElement('div');
        hordeIndicator.id = 'horde-mode-indicator';
        hordeIndicator.className = 'hud-panel';
        hordeIndicator.style.display = 'none'; // Hidden by default, will be changed to 'flex' when active
        hordeIndicator.style.padding = '8px 12px';
        hordeIndicator.style.backgroundColor = 'rgba(51, 10, 10, 0.8)';
        hordeIndicator.style.backdropFilter = 'blur(5px)';
        hordeIndicator.style.borderRadius = '8px';
        hordeIndicator.style.border = '1px solid #ff3030';
        hordeIndicator.style.boxShadow = '0 0 15px rgba(255, 48, 48, 0.5)';
        hordeIndicator.style.animation = 'pulse-horde 2s infinite';
        hordeIndicator.style.marginBottom = '10px';
        hordeIndicator.style.fontSize = '18px';
        hordeIndicator.style.fontWeight = '600';
        hordeIndicator.style.letterSpacing = '1px';
        
        // Create a flex container for the horde mode indicator content
        const hordeContent = document.createElement('div');
        hordeContent.style.display = 'flex';
        hordeContent.style.alignItems = 'center';
        hordeContent.style.justifyContent = 'center';
        hordeContent.style.gap = '10px';
        
        // Add the text and timer elements
        const hordeLabel = document.createElement('span');
        hordeLabel.style.color = '#ff3030';
        hordeLabel.style.textShadow = '0 0 5px rgba(255,48,48,0.5)';
        hordeLabel.textContent = 'HORDE MODE';
        
        const survivalTime = document.createElement('span');
        survivalTime.id = 'horde-survival-time';
        survivalTime.style.color = '#ff9999';
        survivalTime.style.fontWeight = 'bold';
        survivalTime.textContent = '00:00';
        
        // Add the elements to the container
        hordeContent.appendChild(hordeLabel);
        hordeContent.appendChild(survivalTime);
        hordeIndicator.appendChild(hordeContent);
        
        // Add decorative corner elements
        this.addCornerElements(hordeIndicator);
        
        notificationsArea.appendChild(hordeIndicator);
        
        // Add CSS for horde mode pulsing
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse-horde {
                0% { box-shadow: 0 0 5px rgba(255, 30, 30, 0.5); }
                50% { box-shadow: 0 0 10px rgba(255, 30, 30, 0.8); }
                100% { box-shadow: 0 0 5px rgba(255, 30, 30, 0.5); }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Helper methods for UI elements
    createPanelRow(panel, label, id, defaultValue, isIndicator = false) {
        const row = document.createElement('div');
        row.className = 'panel-row';
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.margin = '8px 0';
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
    
    createStatusRow(panel, label, id, status) {
        const row = document.createElement('div');
        row.className = 'status-row';
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.margin = '8px 0';
        panel.appendChild(row);
        
        const labelEl = document.createElement('span');
        labelEl.className = 'row-label';
        labelEl.textContent = label;
        labelEl.style.fontSize = '12px';
        row.appendChild(labelEl);
        
        const valueEl = document.createElement('span');
        valueEl.id = id;
        valueEl.className = 'row-value';
        valueEl.textContent = status;
        valueEl.style.fontSize = '12px';
        valueEl.style.fontWeight = '600';
        
        // Color based on status
        if (status === 'NOMINAL') {
            valueEl.style.color = 'rgba(120, 220, 232, 0.9)';
        } else if (status === 'WARNING') {
            valueEl.style.color = '#ffcc00';
        } else if (status === 'CRITICAL') {
            valueEl.style.color = '#ff3030';
        }
        
        row.appendChild(valueEl);
    }
    
    addHolographicElements(panel) {
        // Add corner decorative elements only
        this.addCornerElements(panel);
    }
    
    addCornerElements(panel) {
        // Top left corner
        const topLeft = document.createElement('div');
        topLeft.style.position = 'absolute';
        topLeft.style.top = '0';
        topLeft.style.left = '0';
        topLeft.style.width = '10px';
        topLeft.style.height = '10px';
        topLeft.style.borderTop = '2px solid rgba(120, 220, 232, 0.8)';
        topLeft.style.borderLeft = '2px solid rgba(120, 220, 232, 0.8)';
        panel.appendChild(topLeft);
        
        // Top right corner
        const topRight = document.createElement('div');
        topRight.style.position = 'absolute';
        topRight.style.top = '0';
        topRight.style.right = '0';
        topRight.style.width = '10px';
        topRight.style.height = '10px';
        topRight.style.borderTop = '2px solid rgba(120, 220, 232, 0.8)';
        topRight.style.borderRight = '2px solid rgba(120, 220, 232, 0.8)';
        panel.appendChild(topRight);
        
        // Bottom left corner
        const bottomLeft = document.createElement('div');
        bottomLeft.style.position = 'absolute';
        bottomLeft.style.bottom = '0';
        bottomLeft.style.left = '0';
        bottomLeft.style.width = '10px';
        bottomLeft.style.height = '10px';
        bottomLeft.style.borderBottom = '2px solid rgba(120, 220, 232, 0.8)';
        bottomLeft.style.borderLeft = '2px solid rgba(120, 220, 232, 0.8)';
        panel.appendChild(bottomLeft);
        
        // Bottom right corner
        const bottomRight = document.createElement('div');
        bottomRight.style.position = 'absolute';
        bottomRight.style.bottom = '0';
        bottomRight.style.right = '0';
        bottomRight.style.width = '10px';
        bottomRight.style.height = '10px';
        bottomRight.style.borderBottom = '2px solid rgba(120, 220, 232, 0.8)';
        bottomRight.style.borderRight = '2px solid rgba(120, 220, 232, 0.8)';
        panel.appendChild(bottomRight);
    }
    
    // Animation for HUD appearance
    animateHudIn() {
        // Add styling for animations
        const style = document.createElement('style');
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
        `;
        document.head.appendChild(style);
        
        // Add glitch effect for initialization
        this.addStartupGlitchEffect();
        
        // Animate scanlines
        setTimeout(() => {
            if (this.scanline) {
                this.animateScanline();
            }
        }, 1500);
    }
    
    addStartupGlitchEffect() {
        // Add glitch animation to show HUD is starting up
        const hudContainer = document.getElementById('hud-container');
        if (!hudContainer) return;
        
        // Incremental fade-in with glitches
        setTimeout(() => {
            hudContainer.style.opacity = '0.3';
            this.addGlitch(hudContainer);
        }, 300);
        
        setTimeout(() => {
            hudContainer.style.opacity = '0.7';
            this.addGlitch(hudContainer);
        }, 800);
        
        setTimeout(() => {
            hudContainer.style.opacity = '1';
            this.addGlitch(hudContainer);
        }, 1200);
        
        // Start random glitch effects at intervals
        this.glitchInterval = setInterval(() => {
            if (Math.random() > 0.7) {
                this.addGlitch(hudContainer);
            }
        }, 5000);
    }
    
    addGlitch(element) {
        // Create a temporary animation
        const glitchAnimation = `
            @keyframes glitch-${Date.now()} {
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
        const style = document.createElement('style');
        style.textContent = glitchAnimation;
        document.head.appendChild(style);
        
        // Apply animation
        const animationName = `glitch-${Date.now()}`;
        element.style.animation = `${animationName} 1s forwards`;
        
        // Remove animation after it's complete
        setTimeout(() => {
            element.style.animation = '';
            style.remove();
        }, 1000);
    }
    
    animateScanline() {
        // Animate the scanline moving down the screen
        let position = 0;
        const height = window.innerHeight;
        
        const moveScanline = () => {
            if (!this.scanline) return;
            position = (position + 2) % height;
            this.scanline.style.top = `${position}px`;
            
            // Add random flicker
            if (Math.random() > 0.97) {
                this.scanline.style.opacity = '0';
                setTimeout(() => {
                    if (this.scanline) {
                        this.scanline.style.opacity = '0.7';
                    }
                }, 50);
            }
            
            this.animationFrames.push(requestAnimationFrame(moveScanline));
        };
        
        moveScanline();
    }
    
    update() {
        if (!this.spaceship) return;
        
        // Update shield display
        this.updateShieldDisplay();
        
        // Update hull display
        this.updateHullDisplay();
        
        // Update fuel display
        const fuelBar = document.getElementById('fuel-bar');
        const fuelValue = document.getElementById('fuel-value');
        if (fuelBar) {
            // Correctly calculate fuel percentage based on maxFuel
            const fuelPercent = this.spaceship.maxFuel > 0 ? 
                (this.spaceship.fuel / this.spaceship.maxFuel) * 100 : 0;
            
            fuelBar.style.width = `${fuelPercent}%`;
            
            // Change color based on fuel level
            if (fuelPercent < 20) {
                fuelBar.style.backgroundColor = 'rgba(255, 80, 80, 0.8)';
            } else if (fuelPercent < 40) {
                fuelBar.style.backgroundColor = 'rgba(255, 204, 0, 0.8)';
            } else {
                fuelBar.style.backgroundColor = 'rgba(120, 220, 232, 0.8)';
            }
            
            // Update text display if it exists
            if (fuelValue) {
                fuelValue.textContent = `${Math.round(this.spaceship.fuel)} / ${Math.round(this.spaceship.maxFuel)}`;
            }
        }
        
        // Update credits display
        const creditsDisplay = document.getElementById('credits-value');
        if (creditsDisplay) {
            creditsDisplay.textContent = `${this.spaceship.credits} CR`;
        }
        
        // Update horde mode indicator and timer
        this.updateHordeModeDisplay();
    }
    
    /**
     * Update the horde mode indicator and survival timer
     */
    updateHordeModeDisplay() {
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
    
    // Add a new method to update shield display directly from HealthComponent
    updateShieldDisplay() {
        const shieldBar = document.getElementById('shield-bar');
        if (!shieldBar) return;
        
        let shieldPercentage = 100;
        let shieldFound = false;
        
        // Try to directly access player's health component
        try {
            if (window.game && window.game.world) {
                const players = window.game.world.getEntitiesByTag('player');
                if (players && players.length > 0) {
                    const player = players[0];
                    const health = player.getComponent('HealthComponent');
                    
                    if (health) {
                        shieldPercentage = health.getShieldPercentage();
                        
                        // Ensure spaceship object is in sync with the HealthComponent
                        if (this.spaceship) {
                            // If HealthComponent shield is higher, use that value
                            if (health.shield > this.spaceship.shield) {
                                this.spaceship.shield = health.shield;
                                this.spaceship.maxShield = health.maxShield;
                            } 
                            // If spaceship shield is higher (e.g., after repair), update health component
                            else if (this.spaceship.shield > health.shield) {
                                health.shield = this.spaceship.shield;
                                console.log(`Updated HealthComponent shield from spaceship: ${health.shield}`);
                                // Recalculate shield percentage
                                shieldPercentage = health.getShieldPercentage();
                            }
                        }
                        
                        shieldFound = true;
                    }
                }
            }
        } catch (e) {
            console.error("Error accessing player shield component:", e);
        }
        
        // Fallback to spaceship object if health component not found
        if (!shieldFound && this.spaceship && this.spaceship.shield !== undefined) {
            shieldPercentage = (this.spaceship.shield / this.spaceship.maxShield) * 100;
        }
        
        // Update the shield bar
        shieldBar.style.width = `${shieldPercentage}%`;
        
        // Change color based on shield status
        if (shieldPercentage < 25) {
            shieldBar.style.backgroundColor = 'rgba(255, 80, 80, 0.8)'; // Red for low shields
        } else if (shieldPercentage < 50) {
            shieldBar.style.backgroundColor = 'rgba(255, 204, 0, 0.8)'; // Yellow for medium shields
        } else {
            shieldBar.style.backgroundColor = 'rgba(51, 153, 255, 0.8)'; // Blue for healthy shields
        }
    }
    
    // New method to update hull display directly from HealthComponent if possible
    updateHullDisplay() {
        const hullBar = document.getElementById('hull-bar');
        if (!hullBar) return;
        
        let hullPercentage = 100;
        let healthFound = false;
        
        // Try to directly access player's health component
        try {
            if (window.game && window.game.world) {
                const players = window.game.world.getEntitiesByTag('player');
                if (players && players.length > 0) {
                    const player = players[0];
                    const health = player.getComponent('HealthComponent');
                    
                    if (health) {
                        hullPercentage = health.getHealthPercentage();
                        
                        // Ensure spaceship object is in sync with the HealthComponent
                        if (this.spaceship) {
                            // If HealthComponent health is higher, use that value
                            if (health.health > this.spaceship.hull) {
                                this.spaceship.hull = health.health;
                                this.spaceship.maxHull = health.maxHealth;
                            }
                            // If spaceship hull is higher (e.g., after repair), update health component
                            else if (this.spaceship.hull > health.health) {
                                health.health = this.spaceship.hull;
                                console.log(`Updated HealthComponent health from spaceship: ${health.health}`);
                                // Recalculate hull percentage
                                hullPercentage = health.getHealthPercentage();
                            }
                        }
                        
                        healthFound = true;
                    }
                }
            }
        } catch (e) {
            console.error("Error accessing player health component:", e);
        }
        
        // Fallback to spaceship object if health component not found
        if (!healthFound && this.spaceship && this.spaceship.hull !== undefined) {
            hullPercentage = (this.spaceship.hull / this.spaceship.maxHull) * 100;
        }
        
        // Update the hull bar
        hullBar.style.width = `${hullPercentage}%`;
        
        // Change color based on hull status
        if (hullPercentage < 30) {
            hullBar.style.backgroundColor = 'rgba(255, 80, 80, 0.8)';
        } else if (hullPercentage < 60) {
            hullBar.style.backgroundColor = 'rgba(255, 204, 0, 0.8)';
        } else {
            hullBar.style.backgroundColor = 'rgba(120, 220, 232, 0.8)';
        }
    }
    
    updateLocation(locationName, systemName = 'Unknown System') {
        // Update system name in location panel
        const currentSystem = document.getElementById('current-system');
        
        if (currentSystem) {
            currentSystem.textContent = systemName.toUpperCase();
            
            // Add glitch effect during location change
            const locationPanel = document.getElementById('location-panel');
            if (locationPanel) {
                this.addGlitch(locationPanel);
            }
        }
    }
    
    updateCoordinates(x, y, z) {
        const coordsElement = document.getElementById('location-coordinates');
        if (coordsElement) {
            coordsElement.textContent = `X: ${Math.round(x)} Y: ${Math.round(y)} Z: ${Math.round(z)}`;
        }
    }
    
    updateFPS(fps, cap) {
        const fpsElement = document.getElementById('fps-display');
        if (fpsElement) {
            if (cap) {
                // Show actual FPS and the cap
                fpsElement.textContent = `FPS: ${Math.round(fps)}/${cap}`;
                
                // Color code based on performance relative to cap
                if (fps < cap * 0.9) {
                    // Below 90% of target - indicate performance issues
                    fpsElement.style.color = "rgba(255, 120, 120, 0.9)";
                } else {
                    // Normal performance - standard color
                    fpsElement.style.color = "rgba(120, 220, 232, 0.8)";
                }
            } else {
                // Just show FPS for uncapped mode
                fpsElement.textContent = `FPS: ${Math.round(fps)}`;
                fpsElement.style.color = "rgba(120, 220, 232, 0.8)";
            }
            
            // Add auto indicator if using monitor refresh rate
            if (window.game && 
                window.game.ui && 
                window.game.ui.settings && 
                window.game.ui.settings.settings.frameRateCap === 'auto') {
                
                const refreshRate = window.game.ui.settings.monitorRefreshRate || 60;
                
                if (cap > 0) {
                    // Show it's using auto mode with the detected refresh rate
                    fpsElement.textContent = `FPS: ${Math.round(fps)}/${cap} (Auto)`;
                } else {
                    // Using unlimited because refresh rate is high
                    fpsElement.textContent = `FPS: ${Math.round(fps)} (Auto: Unlimited)`;
                }
            }
        }
    }
    
    hide() {
        // Hide HUD container
        const hudContainer = document.getElementById('hud-container');
        if (hudContainer) {
            hudContainer.style.opacity = '0';
        }
        
        // Clear animation frames
        this.animationFrames.forEach(frame => cancelAnimationFrame(frame));
        this.animationFrames = [];
        
        // Clear glitch interval
        if (this.glitchInterval) {
            clearInterval(this.glitchInterval);
        }
    }
    
    show() {
        // Show HUD container
        const hudContainer = document.getElementById('hud-container');
        if (hudContainer) {
            hudContainer.style.opacity = '1';
        }
        
        // Restart scanline animation
        if (this.scanline) {
            this.animateScanline();
        }
        
        // Restart glitch interval
        if (!this.glitchInterval) {
            this.glitchInterval = setInterval(() => {
                if (Math.random() > 0.7) {
                    this.addGlitch(hudContainer);
                }
            }, 5000);
        }
    }
    
    /**
     * Clean up resources and event listeners
     */
    destroy() {
        // Cancel any active animation frames
        this.animationFrames.forEach(frameId => {
            cancelAnimationFrame(frameId);
        });
        this.animationFrames = [];
        
        // Clear intervals
        if (this.glitchInterval) {
            clearInterval(this.glitchInterval);
            this.glitchInterval = null;
        }
        
        // Remove DOM event listeners
        const controls = document.getElementById('show-controls');
        if (controls) {
            controls.removeEventListener('click', controls.clickHandler);
            controls.removeEventListener('mouseover', controls.mouseoverHandler);
            controls.removeEventListener('mouseout', controls.mouseoutHandler);
        }
        
        // Remove DOM elements
        const hudContainer = document.getElementById('hud-container');
        if (hudContainer && hudContainer.parentNode) {
            hudContainer.parentNode.removeChild(hudContainer);
        }
        
        // Clear references
        this.spaceship = null;
        this.scanline = null;
    }
}