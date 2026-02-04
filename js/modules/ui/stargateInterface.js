// stargateInterface.js - Handles the stargate docking and trading UI

import { MobileDetector } from '../../utils/mobileDetector.ts';
import { TerminalView } from './components/stargate/terminalView.js';
import { SystemsView } from './components/stargate/systemsView.js';
import { TradingView } from './components/stargate/tradingView.js';
import { UpgradesView } from './components/stargate/upgrades.js';
import { MissionsView } from './components/stargate/missions.js';
import { EventHandlers } from './components/stargate/eventHandlers.js';
import { StargateHelpers } from './components/stargate/helpers.js';

export class StargateInterface {
    constructor() {
        this.starMap = null;
        this.blackjackGame = null;
        this.settings = null;
        this.isMobile = MobileDetector.isMobile();
        
        // Initialize submodules
        this.terminalView = new TerminalView();
        this.systemsView = new SystemsView();
        this.tradingView = new TradingView();
        this.upgradesView = new UpgradesView();
        this.missionsView = new MissionsView();
        this.eventHandlers = new EventHandlers();
        
        // Configure mobile settings
        this.terminalView.setMobile(this.isMobile);
        this.eventHandlers.setMobile(this.isMobile);
        this.eventHandlers.setTradingView(this.tradingView);
        this.missionsView.setHideCallback(() => this.hideStargateUI());
        
        this.setupStargateUI();
        this.setupEventHandlers();
    }
    
    setStarMap(starMap) {
        this.starMap = starMap;
        this.systemsView.setStarMap(starMap);
    }
    
    setBlackjackGame(blackjackGame) {
        this.blackjackGame = blackjackGame;
        this.systemsView.setBlackjackGame(blackjackGame);
    }
    
    setSettings(settings) {
        this.settings = settings;
        this.systemsView.setSettings(settings);
        
        // Pass the stargate interface reference to settings
        if (this.settings) {
            this.settings.setStargateInterface(this);
        }
    }
    
    setupStargateUI() {
        // Create and inject styles
        this.terminalView.createStyles();
        
        // Create docking prompt
        this.terminalView.createDockingPrompt();
        
        // Create main UI container
        const stargateUI = this.terminalView.createMainUI();
        stargateUI.innerHTML = this.terminalView.getMainUIContent();
        
        document.body.appendChild(stargateUI);
    }
    
    showDockingPrompt() {
        this.terminalView.showDockingPrompt();
    }
    
    hideDockingPrompt() {
        this.terminalView.hideDockingPrompt();
    }
    
    showStargateUI() {
        const stargateUI = document.getElementById('stargate-ui');
        if (stargateUI) {
            console.log("Showing stargate UI on " + (this.isMobile ? "mobile" : "desktop"));
            stargateUI.style.display = 'block';
            stargateUI.style.backgroundColor = 'rgba(20, 30, 50, 0.9)';
            
            // Mobile-specific adjustments
            if (this.isMobile) {
                StargateHelpers.configureMobileUI(stargateUI, this.isMobile);
            }
        }
        
        this.hideDockingPrompt();
        this.systemsView.setupAllSystemButtons();
        
        if (this.isMobile) {
            this.eventHandlers.setupTouchEvents();
        }
        
        // Sync resources with game
        const gameData = StargateHelpers.syncWithGameResources();
        if (gameData) {
            this.updateStargateUI(gameData.spaceship, gameData.resources);
        }
    }
    
    hideStargateUI() {
        const stargateUI = document.getElementById('stargate-ui');
        if (stargateUI) {
            stargateUI.style.display = 'none';
        }
    }

    // Add alias for compatibility
    hide() {
        this.hideStargateUI();
    }
    
    updateStargateUI(spaceship, resources) {
        // Set references in submodules
        this.tradingView.setGameReferences(spaceship, resources);
        this.upgradesView.setSpaceship(spaceship);
        
        // Update displays using submodules
        StargateHelpers.updateResourceDisplays(resources);
        StargateHelpers.updateCreditsDisplay(spaceship);
        StargateHelpers.updateStatusGauges(spaceship);
        StargateHelpers.updateServiceButtons(spaceship);
        
        this.upgradesView.updateUpgradeDisplays();
        this.tradingView.updateResourceSellButtons();
        this.tradingView.updateOrbCounts();
        this.tradingView.updateOrbSellButtons();
        this.tradingView.updateLaserTurretDisplay();
    }
    setupEventHandlers() {
        const updateUICallback = () => {
            const gameData = StargateHelpers.syncWithGameResources();
            if (gameData) {
                this.updateStargateUI(gameData.spaceship, gameData.resources);
            }
        };
        
        // Setup orb selling handlers
        this.eventHandlers.setupOrbSellHandlers(updateUICallback);
        
        // Setup laser purchase handler
        this.eventHandlers.setupLaserPurchaseHandler(updateUICallback);
        
        // Setup horde mode button
        this.missionsView.setupHordeButton();
    }
}