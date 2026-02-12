// stargateInterface.js - Handles the stargate docking and trading UI

import { MobileDetector } from '../../utils/mobileDetector.ts';
import { TerminalView } from './components/stargate/terminalView.ts';
import { SystemsView } from './components/stargate/systemsView.ts';
import { TradingView } from './components/stargate/tradingView.ts';
import { UpgradesView } from './components/stargate/upgrades.ts';
import { MissionsView } from './components/stargate/missions.ts';
import { EventHandlers } from './components/stargate/eventHandlers.ts';
import { StargateHelpers } from './components/stargate/helpers.ts';

type StargateStarMap = any;

type StargateBlackjackGame = any;

type StargateSettings = any;

type StargateSpaceship = any;

type StargateResources = any;

export class StargateInterface {
    starMap: StargateStarMap | null;
    blackjackGame: StargateBlackjackGame | null;
    settings: StargateSettings | null;
    isMobile: boolean;
    terminalView: TerminalView;
    systemsView: SystemsView;
    tradingView: TradingView;
    upgradesView: UpgradesView;
    missionsView: MissionsView;
    eventHandlers: EventHandlers;

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
    
    setStarMap(starMap: StargateStarMap): void {
        this.starMap = starMap;
        this.systemsView.setStarMap(starMap as unknown as never);
    }
    
    setBlackjackGame(blackjackGame: StargateBlackjackGame): void {
        this.blackjackGame = blackjackGame;
        this.systemsView.setBlackjackGame(blackjackGame as unknown as never);
    }
    
    setSettings(settings: StargateSettings): void {
        this.settings = settings;
        this.systemsView.setSettings(settings as unknown as never);
        
        // Pass the stargate interface reference to settings
        if (this.settings) {
            this.settings.setStargateInterface(this);
        }
    }
    
    setGameReference(gameRef: any): void {
        this.missionsView.setGameReference(gameRef);
        this.tradingView.setAudio(gameRef.audio);
        
        // Connect mission manager to missions view
        if (gameRef.missionManager) {
            this.missionsView.setMissionManager(gameRef.missionManager);
        }
    }
    
    setupStargateUI(): void {
        // Create and inject styles
        this.terminalView.createStyles();
        
        // Create docking prompt
        this.terminalView.createDockingPrompt();
        
        // Create main UI container
        const stargateUI = this.terminalView.createMainUI() as unknown as HTMLDivElement;
        stargateUI.innerHTML = this.terminalView.getMainUIContent();
        
        document.body.appendChild(stargateUI);
    }
    
    showDockingPrompt(): void {
        this.terminalView.showDockingPrompt();
    }
    
    hideDockingPrompt(): void {
        this.terminalView.hideDockingPrompt();
    }
    
    showStargateUI(): void {
        const stargateUI = document.getElementById('stargate-ui') as HTMLDivElement | null;
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
        
        // Render mission contracts
        this.missionsView.renderContracts();
    }
    
    hideStargateUI(): void {
        this.eventHandlers.destroyTouchEvents();
        const stargateUI = document.getElementById('stargate-ui') as HTMLDivElement | null;
        if (stargateUI) {
            stargateUI.style.display = 'none';
        }
    }

    // Add alias for compatibility
    hide(): void {
        this.hideStargateUI();
    }
    
    updateStargateUI(spaceship: StargateSpaceship, resources: StargateResources): void {
        // Set references in submodules
        this.tradingView.setGameReferences(spaceship as any, resources as any);
        this.upgradesView.setSpaceship(spaceship as any);
        
        // Update displays using submodules
        StargateHelpers.updateResourceDisplays(resources as any);
        StargateHelpers.updateCreditsDisplay(spaceship as any);
        StargateHelpers.updateStatusGauges(spaceship as any);
        StargateHelpers.updateServiceButtons(spaceship as any);
        
        this.upgradesView.updateUpgradeDisplays();
        this.tradingView.updateResourceSellButtons();
        this.tradingView.updateOrbCounts();
        this.tradingView.updateOrbSellButtons();
        this.tradingView.updateLaserTurretDisplay();
    }
    setupEventHandlers(): void {
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
