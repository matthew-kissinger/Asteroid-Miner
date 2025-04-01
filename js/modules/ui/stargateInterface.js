// stargateInterface.js - Handles the stargate docking and trading UI

import { MobileDetector } from '../../utils/mobileDetector.js';

export class StargateInterface {
    constructor() {
        this.starMap = null;
        this.blackjackGame = null;
        this.settings = null;
        this.isMobile = MobileDetector.isMobile();
        this.setupStargateUI();
        this.setupEventHandlers();
    }
    
    setStarMap(starMap) {
        this.starMap = starMap;
    }
    
    setBlackjackGame(blackjackGame) {
        this.blackjackGame = blackjackGame;
    }
    
    setSettings(settings) {
        this.settings = settings;
        
        // Pass the stargate interface reference to settings
        if (this.settings) {
            this.settings.setStargateInterface(this);
        }
        
        // Setup settings button handler now that we have settings
        this.setupSettingsButton();
    }
    
    setupStargateUI() {
        // Add CSS for animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse-warning {
                0% { box-shadow: 0 0 15px rgba(255, 48, 48, 0.5); }
                50% { box-shadow: 0 0 25px rgba(255, 48, 48, 0.8); }
                100% { box-shadow: 0 0 15px rgba(255, 48, 48, 0.5); }
            }
            
            /* Stargate Terminal Styles */
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
            
            #stargate-header {
                background-color: rgba(30, 40, 60, 0.9);
                padding: 15px 20px;
                border-bottom: 1px solid var(--primary-border);
                position: sticky;
                top: 0;
                z-index: 10;
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
                grid-row: 1 ;
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
            
            /* Footer */
            #stargate-footer {
                padding: 20px;
                border-top: 1px solid rgba(51, 170, 255, 0.3);
                text-align: center;
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
            
            /* Custom colors for buttons */
            .btn-fuel { background-color: var(--accent-green); }
            .btn-shield { background-color: var(--accent-blue); }
            .btn-hull { background-color: var(--accent-orange); }
            .btn-starmap { background-color: var(--accent-cyan); }
            .btn-blackjack { background-color: var(--accent-purple); }
            .btn-settings { background-color: var(--accent-blue); }
            .btn-horde { 
                background: linear-gradient(135deg, #990000 0%, var(--accent-red) 100%);
                color: #fff;
                border: 2px solid var(--accent-red);
                box-shadow: 0 0 15px rgba(255, 48, 48, 0.5);
                animation: pulse-warning 2s infinite;
            }
            .btn-undock {
                background-color: var(--accent-blue);
                font-size: 1.2em;
                padding: 15px;
            }
            
            .iron-border { border: 1px solid #cc6633; box-shadow: 0 0 10px rgba(204, 102, 51, 0.3); }
            .gold-border { border: 1px solid #ffcc33; box-shadow: 0 0 10px rgba(255, 204, 51, 0.3); }
            .platinum-border { border: 1px solid #33ccff; box-shadow: 0 0 10px rgba(51, 204, 255, 0.3); }
            .common-border { border: 1px solid #00ff66; box-shadow: 0 0 10px rgba(0, 255, 102, 0.3); }
            .uncommon-border { border: 1px solid #0066ff; box-shadow: 0 0 10px rgba(0, 102, 255, 0.3); }
            .rare-border { border: 1px solid #9900ff; box-shadow: 0 0 10px rgba(153, 0, 255, 0.3); }
            .epic-border { border: 1px solid #ff6600; box-shadow: 0 0 10px rgba(255, 102, 0, 0.3); }
            .legendary-border { border: 1px solid #ff0000; box-shadow: 0 0 10px rgba(255, 0, 0, 0.3); }
            
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
                
                .upgrade-footer {
                    flex-direction: column;
                    align-items: stretch;
                }
                
                .upgrade-description {
                    margin-bottom: 10px;
                }
            }
            
            #horde-confirm-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2000;
            }
            
            #horde-confirm-content {
                background-color: rgba(30, 30, 35, 0.95);
                border: 2px solid #ff3030;
                border-radius: 10px;
                padding: 30px;
                max-width: 500px;
                width: 80%;
                color: #fff;
                box-shadow: 0 0 30px rgba(255, 48, 48, 0.7);
                text-align: center;
            }
            
            .horde-confirm-title {
                color: #ff3030;
                font-size: 24px;
                margin-bottom: 20px;
                font-weight: bold;
                text-shadow: 0 0 10px rgba(255, 48, 48, 0.5);
            }
            
            .horde-confirm-text {
                margin-bottom: 25px;
                line-height: 1.5;
            }
            
            .horde-confirm-buttons {
                display: flex;
                justify-content: space-between;
            }
            
            .horde-confirm-btn {
                padding: 12px 25px;
                border-radius: 5px;
                border: none;
                font-family: 'Courier New', monospace;
                font-weight: bold;
                cursor: pointer;
                width: 45%;
            }
            
            .horde-confirm-yes {
                background-color: #ff3030;
                color: #fff;
            }
            
            .horde-confirm-no {
                background-color: #333;
                color: #fff;
            }
        `;
        document.head.appendChild(style);
        
        // Add docking prompt
        const dockingPrompt = document.createElement('div');
        dockingPrompt.id = 'docking-prompt';
        dockingPrompt.style.position = 'absolute';
        dockingPrompt.style.top = '50%';
        dockingPrompt.style.left = '50%';
        dockingPrompt.style.transform = 'translate(-50%, -50%)';
        dockingPrompt.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        dockingPrompt.style.color = '#33aaff';
        dockingPrompt.style.padding = '20px';
        dockingPrompt.style.borderRadius = '10px';
        dockingPrompt.style.border = '2px solid #33aaff';
        dockingPrompt.style.boxShadow = '0 0 20px #33aaff';
        dockingPrompt.style.fontFamily = 'Courier New, monospace';
        dockingPrompt.style.fontSize = '18px';
        dockingPrompt.style.textAlign = 'center';
        dockingPrompt.style.zIndex = '1000';
        dockingPrompt.style.display = 'none';
        
        // Update prompt text based on device - on mobile, we don't need this prompt
        // since we have an actual interactive DOCK button
        if (this.isMobile) {
            // On mobile, we'll hide this text prompt completely since we have a dedicated dock button
            dockingPrompt.style.display = 'none';
            dockingPrompt.dataset.alwaysHide = 'true'; // Mark to keep it hidden
        } else {
            dockingPrompt.textContent = 'Press Q to dock with Stargate';
        }
        
        document.body.appendChild(dockingPrompt);
        
        // Create stargate interface (hidden by default)
        const stargateUI = document.createElement('div');
        stargateUI.id = 'stargate-ui';
        
        // Use responsive width based on device type
        if (this.isMobile) {
            stargateUI.style.width = '95%';
            stargateUI.style.maxWidth = '95vw';
            
            // Add touch scrolling properties for mobile
            stargateUI.style.webkitOverflowScrolling = 'touch';
            stargateUI.style.touchAction = 'pan-y';
            stargateUI.style.overscrollBehavior = 'contain';
        }
        
        // Create the improved stargate UI structure
        stargateUI.innerHTML = `
            <!-- Header -->
            <div id="stargate-header">
                <h2 style="text-align: center; color: #33aaff; margin: 0;">STARGATE TERMINAL</h2>
            </div>
            
            <!-- Main Content Grid -->
            <div id="stargate-content">
                <!-- Ship Status Section -->
                <div id="ship-status-section" class="stargate-section">
                    <h3>SHIP STATUS</h3>
                    
                    <!-- Resources section -->
                    <div>
                        <h4 style="color: #33aaff; margin-top: 0; margin-bottom: 10px;">RESOURCES</h4>
                        <div class="resources-container">
                            <div class="resource-display iron-border">
                                <div style="font-weight: bold; font-size: 14px;">IRON</div>
                                <div id="ms-iron" style="font-size: 18px; margin-top: 5px;">0</div>
                                <div style="font-size: 10px; opacity: 0.7;">UNITS</div>
                            </div>
                            <div class="resource-display gold-border">
                                <div style="font-weight: bold; font-size: 14px;">GOLD</div>
                                <div id="ms-gold" style="font-size: 18px; margin-top: 5px;">0</div>
                                <div style="font-size: 10px; opacity: 0.7;">UNITS</div>
                            </div>
                            <div class="resource-display platinum-border">
                                <div style="font-weight: bold; font-size: 14px;">PLATINUM</div>
                                <div id="ms-platinum" style="font-size: 18px; margin-top: 5px;">0</div>
                                <div style="font-size: 10px; opacity: 0.7;">UNITS</div>
                            </div>
                        </div>
                        
                        <div style="margin-top: 15px;">
                            <h4 style="color: #33aaff; margin-top: 0; margin-bottom: 10px;">CREDITS</h4>
                            <div id="ms-credits" style="font-size: 18px; font-weight: bold; color: #ffcc33; text-shadow: 0 0 5px rgba(255, 204, 51, 0.5);">0 CR</div>
                        </div>
                    </div>
                    
                    <!-- Fuel section -->
                    <div>
                        <div class="status-label">
                            <h4 style="color: #00cc33; margin: 0;">FUEL</h4>
                            <span><span id="fuel-level">100</span>%</span>
                        </div>
                        <div class="status-bar-container" id="fuel-gauge-container">
                            <div class="status-bar" id="fuel-gauge" style="background-color: #00cc33; width: 100%;"></div>
                        </div>
                        <button id="refuel-btn" class="action-btn btn-fuel">REFUEL (100 CR)</button>
                    </div>
                    
                    <!-- Shield section -->
                    <div>
                        <div class="status-label">
                            <h4 style="color: #3399ff; margin: 0;">SHIELD</h4>
                            <span><span id="shield-level">100</span>%</span>
                        </div>
                        <div class="status-bar-container" id="shield-gauge-container">
                            <div class="status-bar" id="shield-gauge" style="background-color: #3399ff; width: 100%;"></div>
                        </div>
                        <button id="repair-shield-btn" class="action-btn btn-shield">REPAIR SHIELD (150 CR)</button>
                    </div>
                    
                    <!-- Hull section -->
                    <div>
                        <div class="status-label">
                            <h4 style="color: #ff9900; margin: 0;">HULL INTEGRITY</h4>
                            <span><span id="hull-level">100</span>%</span>
                        </div>
                        <div class="status-bar-container" id="hull-gauge-container">
                            <div class="status-bar" id="hull-gauge" style="background-color: #ff9900; width: 100%;"></div>
                        </div>
                        <button id="repair-hull-btn" class="action-btn btn-hull">REPAIR HULL (200 CR)</button>
                    </div>
                </div>
                
                <!-- Market Section (Now spans 2 rows) -->
                <div id="market-section" class="stargate-section">
                    <h3>MARKET</h3>
                    
                    <!-- Resources Market -->
                    <h4 style="color: #33aaff; margin-top: 0; margin-bottom: 10px;">MATERIALS</h4>
                    <div class="sell-buttons">
                        <button id="sell-iron" class="sell-btn iron-border">
                            <div style="font-weight: bold;">SELL IRON</div>
                            <div style="font-size: 12px; margin-top: 3px;">(10 CR each)</div>
                        </button>
                        <button id="sell-gold" class="sell-btn gold-border">
                            <div style="font-weight: bold;">SELL GOLD</div>
                            <div style="font-size: 12px; margin-top: 3px;">(50 CR each)</div>
                        </button>
                        <button id="sell-platinum" class="sell-btn platinum-border">
                            <div style="font-weight: bold;">SELL PLATINUM</div>
                            <div style="font-size: 12px; margin-top: 3px;">(200 CR each)</div>
                        </button>
                    </div>
                    
                    <!-- Energy Orbs Market -->
                    <h4 style="color: #33aaff; margin-top: 20px; margin-bottom: 10px;">ENERGY ORBS</h4>
                    <div style="font-size: 14px; color: #aaa; margin-bottom: 10px;">
                        Valuable artifacts collected from space anomalies. Increasing rarity yields higher value.
                    </div>
                    
                    <div class="orb-buttons">
                        <button id="sell-orb-common" class="sell-btn common-border">
                            <div style="font-weight: bold;">COMMON ORB</div>
                            <div id="orb-common-count" style="font-size: 12px;">0 in inventory</div>
                            <div style="font-size: 12px; margin-top: 3px;">(100 CR each)</div>
                        </button>
                        <button id="sell-orb-uncommon" class="sell-btn uncommon-border">
                            <div style="font-weight: bold;">UNCOMMON ORB</div>
                            <div id="orb-uncommon-count" style="font-size: 12px;">0 in inventory</div>
                            <div style="font-size: 12px; margin-top: 3px;">(500 CR each)</div>
                        </button>
                        <button id="sell-orb-rare" class="sell-btn rare-border">
                            <div style="font-weight: bold;">RARE ORB</div>
                            <div id="orb-rare-count" style="font-size: 12px;">0 in inventory</div>
                            <div style="font-size: 12px; margin-top: 3px;">(1,500 CR each)</div>
                        </button>
                        <button id="sell-orb-epic" class="sell-btn epic-border">
                            <div style="font-weight: bold;">EPIC ORB</div>
                            <div id="orb-epic-count" style="font-size: 12px;">0 in inventory</div>
                            <div style="font-size: 12px; margin-top: 3px;">(5,000 CR each)</div>
                        </button>
                        <button id="sell-orb-legendary" class="sell-btn legendary-border">
                            <div style="font-weight: bold;">LEGENDARY ORB</div>
                            <div id="orb-legendary-count" style="font-size: 12px;">0 in inventory</div>
                            <div style="font-size: 12px; margin-top: 3px;">(15,000 CR each)</div>
                        </button>
                    </div>
                    
                    <!-- Deployable Weapons Section -->
                    <h4 style="color: #33aaff; margin-top: 20px; margin-bottom: 10px;">DEPLOYABLE WEAPONS</h4>
                    <div class="upgrade-item">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <div>
                                <strong style="color: #FF3333;">Laser Turrets:</strong> <span id="current-laser-count">0</span>
                            </div>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="flex: 2; padding-right: 10px;">
                                <p style="margin: 0; font-size: 12px;">Deployable laser turrets automatically target and fire at enemies within 1000m range.</p>
                            </div>
                            <button id="purchase-laser" style="flex: 1; padding: 10px; background-color: #FF3333; color: #fff; border: none; border-radius: 5px; cursor: pointer; font-family: 'Courier New', monospace; font-weight: bold;">
                                PURCHASE (1000 CR)
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Upgrades Section (Now in first row) -->
                <div id="upgrades-section" class="stargate-section">
                    <h3>SHIP UPGRADES</h3>
                    
                    <!-- Fuel Tank Upgrade -->
                    <div class="upgrade-item">
                        <div class="upgrade-header">
                            <div>
                                <strong style="color: #00cc33;">Fuel Tank Level:</strong> <span id="current-fuel-level">1</span>
                            </div>
                            <div style="text-align: right;">
                                <strong>Capacity:</strong> <span id="current-fuel-capacity">100</span> units
                                <br>
                                <small style="opacity: 0.8;">Next: <span id="next-fuel-capacity">200</span> units</small>
                            </div>
                        </div>
                        <div class="upgrade-progress">
                            <div id="fuel-upgrade-progress" class="upgrade-progress-bar" style="background-color: #00cc33; width: 20%;"></div>
                        </div>
                        <div class="upgrade-footer">
                            <div class="upgrade-description">
                                <p style="margin: 0; font-size: 12px;">Increases maximum fuel capacity, allowing for longer journeys.</p>
                            </div>
                            <button id="upgrade-fuel-tank" style="flex: 1; padding: 10px; background-color: #00cc33; color: #000; border: none; border-radius: 5px; cursor: pointer; font-family: 'Courier New', monospace; font-weight: bold;">
                                UPGRADE (<span id="fuel-upgrade-cost">1000</span> CR)
                            </button>
                        </div>
                    </div>
                    
                    <!-- Engine Upgrade -->
                    <div class="upgrade-item">
                        <div class="upgrade-header">
                            <div>
                                <strong style="color: #ff9900;">Engine Level:</strong> <span id="current-engine-level">1</span>
                            </div>
                            <div style="text-align: right;">
                                <strong>Max Speed:</strong> <span id="current-max-velocity">25</span> units/s
                                <br>
                                <small style="opacity: 0.8;">Next: <span id="next-max-velocity">31.25</span> units/s</small>
                            </div>
                        </div>
                        <div class="upgrade-progress">
                            <div id="engine-upgrade-progress" class="upgrade-progress-bar" style="background-color: #ff9900; width: 20%;"></div>
                        </div>
                        <div class="upgrade-footer">
                            <div class="upgrade-description">
                                <p style="margin: 0; font-size: 12px;">Enhances thruster power, increasing maximum velocity and maneuverability.</p>
                            </div>
                            <button id="upgrade-engine" style="flex: 1; padding: 10px; background-color: #ff9900; color: #000; border: none; border-radius: 5px; cursor: pointer; font-family: 'Courier New', monospace; font-weight: bold;">
                                UPGRADE (<span id="engine-upgrade-cost">800</span> CR)
                            </button>
                        </div>
                    </div>
                    
                    <!-- Mining Laser Upgrade -->
                    <div class="upgrade-item">
                        <div class="upgrade-header">
                            <div>
                                <strong style="color: #ff3030;">Mining Laser Level:</strong> <span id="current-mining-level">1</span>
                            </div>
                            <div style="text-align: right;">
                                <strong>Efficiency:</strong> <span id="current-mining-efficiency">100</span>%
                                <br>
                                <small style="opacity: 0.8;">Next: <span id="next-mining-efficiency">130</span>%</small>
                            </div>
                        </div>
                        <div class="upgrade-progress">
                            <div id="mining-upgrade-progress" class="upgrade-progress-bar" style="background-color: #ff3030; width: 20%;"></div>
                        </div>
                        <div class="upgrade-footer">
                            <div class="upgrade-description">
                                <p style="margin: 0; font-size: 12px;">Increases mining speed and extraction efficiency, allowing faster resource collection.</p>
                            </div>
                            <button id="upgrade-mining" style="flex: 1; padding: 10px; background-color: #ff3030; color: #fff; border: none; border-radius: 5px; cursor: pointer; font-family: 'Courier New', monospace; font-weight: bold;">
                                UPGRADE (<span id="mining-upgrade-cost">1200</span> CR)
                            </button>
                        </div>
                    </div>
                    
                    <!-- Hull Upgrade -->
                    <div class="upgrade-item">
                        <div class="upgrade-header">
                            <div>
                                <strong style="color: #30cfd0;">Hull Level:</strong> <span id="current-hull-level">1</span>
                            </div>
                            <div style="text-align: right;">
                                <strong>Resistance:</strong> <span id="current-hull-resistance">100</span>%
                                <br>
                                <small style="opacity: 0.8;">Next: <span id="next-hull-resistance">125</span>%</small>
                            </div>
                        </div>
                        <div class="upgrade-progress">
                            <div id="hull-upgrade-progress" class="upgrade-progress-bar" style="background-color: #30cfd0; width: 20%;"></div>
                        </div>
                        <div class="upgrade-footer">
                            <div class="upgrade-description">
                                <p style="margin: 0; font-size: 12px;">Reinforces ship structure, improving collision resistance and reducing damage.</p>
                            </div>
                            <button id="upgrade-hull" style="flex: 1; padding: 10px; background-color: #30cfd0; color: #000; border: none; border-radius: 5px; cursor: pointer; font-family: 'Courier New', monospace; font-weight: bold;">
                                UPGRADE (<span id="hull-upgrade-cost">1500</span> CR)
                            </button>
                        </div>
                    </div>
                    
                    <!-- Scanner Upgrade -->
                    <div class="upgrade-item">
                        <div class="upgrade-header">
                            <div>
                                <strong style="color: #9933cc;">Scanner Level:</strong> <span id="current-scanner-level">1</span>
                            </div>
                            <div style="text-align: right;">
                                <strong>Range:</strong> <span id="current-scanner-range">1000</span> units
                                <br>
                                <small style="opacity: 0.8;">Next: <span id="next-scanner-range">1200</span> units</small>
                            </div>
                        </div>
                        <div class="upgrade-progress">
                            <div id="scanner-upgrade-progress" class="upgrade-progress-bar" style="background-color: #9933cc; width: 20%;"></div>
                        </div>
                        <div class="upgrade-footer">
                            <div class="upgrade-description">
                                <p style="margin: 0; font-size: 12px;">Extends scanner range for detecting asteroids and other objects at greater distances.</p>
                            </div>
                            <button id="upgrade-scanner" style="flex: 1; padding: 10px; background-color: #9933cc; color: #fff; border: none; border-radius: 5px; cursor: pointer; font-family: 'Courier New', monospace; font-weight: bold;">
                                UPGRADE (<span id="scanner-upgrade-cost">600</span> CR)
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Features Section -->
                <div id="features-section" class="stargate-section">
                    <h3>SERVICES</h3>
                    
                    <div class="feature-buttons">
                        <button id="open-star-map" class="feature-btn" style="background-color: #30cfd0;">
                            STAR MAP
                            <small>Access star systems navigation</small>
                        </button>
                        <button id="create-custom-system" class="feature-btn" style="background: linear-gradient(135deg, #2c5a8c 0%, #4a76a8 100%); border: 1px solid #4a9dff; box-shadow: 0 0 10px rgba(74, 157, 255, 0.3);">
                            CREATE NEW SYSTEM
                            <small>Generate custom AI star systems</small>
                        </button>
                        <button id="open-blackjack" class="feature-btn" style="background-color: #9933cc;">
                            STELLAR BLACKJACK
                            <small>Wager resources in card games</small>
                        </button>
                        <button id="open-settings" class="feature-btn" style="background-color: #33aaff;">
                            SETTINGS
                            <small>Adjust graphics and audio options</small>
                        </button>
                    </div>
                </div>
                
                <!-- Challenge Section -->
                <div id="challenge-section" class="stargate-section">
                    <h3>EXTREME CHALLENGE</h3>
                    <button id="unleash-horde" class="action-btn btn-horde">
                        UNLEASH THE HORDE
                    </button>
                    <p style="font-size: 12px; color: #ff9999; margin: 10px 0 0 0;">WARNING: Activate extreme survival mode with infinitely scaling difficulty</p>
                </div>
            </div>
            
            <!-- Footer -->
            <div id="stargate-footer">
                <button id="undock-btn" class="action-btn btn-undock" data-no-touch-overlay="true">UNDOCK</button>
            </div>
        `;
        
        document.body.appendChild(stargateUI);
    }
    
    setupSettingsButton() {
        if (!this.settings) return;
        
        const settingsButton = document.getElementById('open-settings');
        if (settingsButton) {
            settingsButton.addEventListener('click', () => {
                console.log("Opening settings");
                this.hideStargateUI();
                this.settings.show();
            });
        }
    }
    
    showDockingPrompt() {
        const dockingPrompt = document.getElementById('docking-prompt');
        if (dockingPrompt) {
            // Only show if not flagged to always hide (on mobile devices)
            if (dockingPrompt.dataset.alwaysHide !== 'true') {
                dockingPrompt.style.display = 'block';
            }
        }
    }
    
    hideDockingPrompt() {
        const dockingPrompt = document.getElementById('docking-prompt');
        if (dockingPrompt) {
            dockingPrompt.style.display = 'none';
        }
    }
    
    showStargateUI() {
        // Show the stargate UI
        const stargateUI = document.getElementById('stargate-ui');
        if (stargateUI) {
            console.log("Showing stargate UI on " + (this.isMobile ? "mobile" : "desktop"));
            stargateUI.style.display = 'block';
            
            // Ensure background color is explicitly set
            stargateUI.style.backgroundColor = 'rgba(20, 30, 50, 0.9)';
            
            // Mobile-specific adjustments
            if (this.isMobile) {
                // Ensure proper mobile styling
                stargateUI.style.width = '92%';
                stargateUI.style.maxWidth = '92vw';
                stargateUI.style.maxHeight = '85vh';
                stargateUI.style.webkitOverflowScrolling = 'touch';
                stargateUI.style.touchAction = 'pan-y';
                stargateUI.style.overscrollBehavior = 'auto'; // Changed from 'contain' to 'auto'
                
                // Ensure proper positioning
                stargateUI.style.position = 'absolute';
                stargateUI.style.top = '50%';
                stargateUI.style.left = '50%';
                stargateUI.style.transform = 'translate(-50%, -50%)';
                stargateUI.style.zIndex = '1000';
                
                // Ensure body is in a state that allows the UI to be visible
                document.body.classList.remove('undocking', 'modal-open');
            }
        }
        
        // Hide the docking prompt
        const dockingPrompt = document.getElementById('docking-prompt');
        if (dockingPrompt) {
            dockingPrompt.style.display = 'none';
        }
        
        // Setup star map button handler
        this.setupStarMapButton();
        
        // Setup blackjack game button handler
        this.setupBlackjackButton();
        
        // Setup settings button handler
        this.setupSettingsButton();
        
        // Set up touch events for mobile scrolling
        if (this.isMobile) {
            this.setupTouchEvents();
        }
        
        // Sync resources with game if available (similar to BlackjackGame)
        if (window.game && window.game.controls) {
            // Get reference to spaceship and resources
            const spaceship = window.game.spaceship;
            const resources = window.game.controls.resources;
            
            // Update the stargate UI with current values
            if (spaceship && resources) {
                console.log("Syncing stargate UI with game resources:", resources);
                this.updateStargateUI(spaceship, resources);
            }
        }
    }
    
    setupStarMapButton() {
        const starMapButton = document.getElementById('open-star-map');
        if (starMapButton && this.starMap) {
            starMapButton.addEventListener('click', () => {
                console.log("Opening star map");
                this.hideStargateUI();
                this.starMap.show();
            });
        } else if (starMapButton) {
            // If star map not available, disable the button
            starMapButton.disabled = true;
            starMapButton.style.backgroundColor = '#555';
            starMapButton.style.cursor = 'not-allowed';
            starMapButton.title = 'Star map not available';
        }
    }
    
    setupBlackjackButton() {
        const blackjackButton = document.getElementById('open-blackjack');
        if (blackjackButton && this.blackjackGame) {
            blackjackButton.addEventListener('click', () => {
                console.log("Opening blackjack game");
                this.hideStargateUI();
                this.blackjackGame.show();
            });
        } else if (blackjackButton) {
            // If blackjack game not available, disable the button
            blackjackButton.disabled = true;
            blackjackButton.style.backgroundColor = '#555';
            blackjackButton.style.cursor = 'not-allowed';
            blackjackButton.title = 'Blackjack game not available';
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
        // Update resource display with visual elements
        document.getElementById('ms-iron').textContent = resources.iron;
        document.getElementById('ms-gold').textContent = resources.gold;
        document.getElementById('ms-platinum').textContent = resources.platinum;
        
        // Update credits with styling
        document.getElementById('ms-credits').textContent = `${spaceship.credits} CR`;
        
        // Update fuel gauge
        document.getElementById('fuel-gauge').style.width = `${(spaceship.fuel / spaceship.maxFuel) * 100}%`;
        document.getElementById('fuel-level').textContent = Math.round((spaceship.fuel / spaceship.maxFuel) * 100);
        
        // Update shield gauge
        document.getElementById('shield-gauge').style.width = `${(spaceship.shield / spaceship.maxShield) * 100}%`;
        document.getElementById('shield-level').textContent = Math.round((spaceship.shield / spaceship.maxShield) * 100);
        
        // Update hull gauge
        document.getElementById('hull-gauge').style.width = `${(spaceship.hull / spaceship.maxHull) * 100}%`;
        document.getElementById('hull-level').textContent = Math.round((spaceship.hull / spaceship.maxHull) * 100);
        
        // Disable refuel button if not enough credits or fuel is full
        const refuelBtn = document.getElementById('refuel-btn');
        if (spaceship.credits < 100 || spaceship.fuel >= spaceship.maxFuel * 0.999) {
            refuelBtn.disabled = true;
            refuelBtn.style.backgroundColor = '#555';
            refuelBtn.style.cursor = 'not-allowed';
        } else {
            refuelBtn.disabled = false;
            refuelBtn.style.backgroundColor = '#00cc33';
            refuelBtn.style.cursor = 'pointer';
        }
        
        // Disable shield repair button if not enough credits or shield is full
        const repairShieldBtn = document.getElementById('repair-shield-btn');
        if (spaceship.credits < 150 || spaceship.shield >= spaceship.maxShield * 0.999) {
            repairShieldBtn.disabled = true;
            repairShieldBtn.style.backgroundColor = '#555';
            repairShieldBtn.style.cursor = 'not-allowed';
        } else {
            repairShieldBtn.disabled = false;
            repairShieldBtn.style.backgroundColor = '#3399ff';
            repairShieldBtn.style.cursor = 'pointer';
        }
        
        // Disable hull repair button if not enough credits or hull is full
        const repairHullBtn = document.getElementById('repair-hull-btn');
        if (spaceship.credits < 200 || spaceship.hull >= spaceship.maxHull * 0.999) {
            repairHullBtn.disabled = true;
            repairHullBtn.style.backgroundColor = '#555';
            repairHullBtn.style.cursor = 'not-allowed';
        } else {
            repairHullBtn.disabled = false;
            repairHullBtn.style.backgroundColor = '#ff9900';
            repairHullBtn.style.cursor = 'pointer';
        }
        
        // Update Fuel Tank upgrade information
        document.getElementById('current-fuel-level').textContent = spaceship.fuelTankLevel;
        document.getElementById('current-fuel-capacity').textContent = spaceship.maxFuel;
        document.getElementById('next-fuel-capacity').textContent = spaceship.maxFuel * 2;
        document.getElementById('fuel-upgrade-cost').textContent = spaceship.fuelUpgradeCost;
        document.getElementById('fuel-upgrade-progress').style.width = `${Math.min(spaceship.fuelTankLevel * 20, 100)}%`;
        
        // Update Engine upgrade information
        document.getElementById('current-engine-level').textContent = spaceship.engineLevel;
        document.getElementById('current-max-velocity').textContent = spaceship.maxVelocity.toFixed(2);
        document.getElementById('next-max-velocity').textContent = (spaceship.maxVelocity * 1.25).toFixed(2);
        document.getElementById('engine-upgrade-cost').textContent = spaceship.engineUpgradeCost;
        document.getElementById('engine-upgrade-progress').style.width = `${Math.min(spaceship.engineLevel * 20, 100)}%`;
        
        // Update Mining Laser upgrade information
        document.getElementById('current-mining-level').textContent = spaceship.miningLevel;
        document.getElementById('current-mining-efficiency').textContent = Math.round(spaceship.miningEfficiency * 100);
        document.getElementById('next-mining-efficiency').textContent = Math.round(spaceship.miningEfficiency * 130);
        document.getElementById('mining-upgrade-cost').textContent = spaceship.miningUpgradeCost;
        document.getElementById('mining-upgrade-progress').style.width = `${Math.min(spaceship.miningLevel * 20, 100)}%`;
        
        // Update Hull upgrade information
        document.getElementById('current-hull-level').textContent = spaceship.hullLevel;
        document.getElementById('current-hull-resistance').textContent = Math.round(spaceship.collisionResistance * 100);
        document.getElementById('next-hull-resistance').textContent = Math.round(spaceship.collisionResistance * 125);
        document.getElementById('hull-upgrade-cost').textContent = spaceship.hullUpgradeCost;
        document.getElementById('hull-upgrade-progress').style.width = `${Math.min(spaceship.hullLevel * 20, 100)}%`;
        
        // Update Scanner upgrade information
        document.getElementById('current-scanner-level').textContent = spaceship.scannerLevel;
        document.getElementById('current-scanner-range').textContent = Math.round(spaceship.scanRange);
        document.getElementById('next-scanner-range').textContent = Math.round(spaceship.scanRange * 1.2);
        document.getElementById('scanner-upgrade-cost').textContent = spaceship.scannerUpgradeCost;
        document.getElementById('scanner-upgrade-progress').style.width = `${Math.min(spaceship.scannerLevel * 20, 100)}%`;
        
        // Disable upgrade buttons if not enough credits
        this.updateUpgradeButtonStatus('upgrade-fuel-tank', spaceship.credits, spaceship.fuelUpgradeCost, '#00cc33');
        this.updateUpgradeButtonStatus('upgrade-engine', spaceship.credits, spaceship.engineUpgradeCost, '#ff9900');
        this.updateUpgradeButtonStatus('upgrade-mining', spaceship.credits, spaceship.miningUpgradeCost, '#ff3030');
        this.updateUpgradeButtonStatus('upgrade-hull', spaceship.credits, spaceship.hullUpgradeCost, '#30cfd0');
        this.updateUpgradeButtonStatus('upgrade-scanner', spaceship.credits, spaceship.scannerUpgradeCost, '#9933cc');
        
        // Disable sell buttons if no resources
        document.getElementById('sell-iron').disabled = resources.iron === 0;
        document.getElementById('sell-gold').disabled = resources.gold === 0;
        document.getElementById('sell-platinum').disabled = resources.platinum === 0;
        
        // Update sell button styles based on resource availability
        this.updateSellButtonStatus('sell-iron', resources.iron, '#cc6633');
        this.updateSellButtonStatus('sell-gold', resources.gold, '#ffcc33');
        this.updateSellButtonStatus('sell-platinum', resources.platinum, '#33ccff');
        
        // Update button styles based on disabled state
        document.querySelectorAll('.sell-btn').forEach(btn => {
            if (btn.disabled) {
                btn.style.backgroundColor = 'rgba(40, 40, 40, 0.8)';
                btn.style.color = '#777';
                btn.style.cursor = 'not-allowed';
                btn.style.boxShadow = 'none';
            }
        });
        
        // Update the laser turret count
        const laserCountElement = document.getElementById('current-laser-count');
        if (laserCountElement) {
            laserCountElement.textContent = spaceship.deployableLaserCount || 0;
        }
        
        // Update the purchase laser button status
        const purchaseLaserBtn = document.getElementById('purchase-laser');
        if (purchaseLaserBtn) {
            if (spaceship.credits < 1000) {
                purchaseLaserBtn.disabled = true;
                purchaseLaserBtn.style.backgroundColor = '#555';
                purchaseLaserBtn.style.cursor = 'not-allowed';
            } else {
                purchaseLaserBtn.disabled = false;
                purchaseLaserBtn.style.backgroundColor = '#FF3333';
                purchaseLaserBtn.style.cursor = 'pointer';
            }
        }
        
        // Update orb counts and button states
        if (!resources.orbs) {
            resources.orbs = {
                common: 0,
                uncommon: 0,
                rare: 0,
                epic: 0,
                legendary: 0
            };
        }
        
        // Update orb counts
        document.getElementById('orb-common-count').textContent = resources.orbs.common > 0 ? 
            `${resources.orbs.common} in inventory` : "0 in inventory";
        document.getElementById('orb-uncommon-count').textContent = resources.orbs.uncommon > 0 ? 
            `${resources.orbs.uncommon} in inventory` : "0 in inventory";
        document.getElementById('orb-rare-count').textContent = resources.orbs.rare > 0 ? 
            `${resources.orbs.rare} in inventory` : "0 in inventory";
        document.getElementById('orb-epic-count').textContent = resources.orbs.epic > 0 ? 
            `${resources.orbs.epic} in inventory` : "0 in inventory";
        document.getElementById('orb-legendary-count').textContent = resources.orbs.legendary > 0 ? 
            `${resources.orbs.legendary} in inventory` : "0 in inventory";
        
        // Disable sell buttons if no orbs available
        const updateOrbSellButton = (buttonId, orbCount, borderColor) => {
            const button = document.getElementById(buttonId);
            if (!button) return;
            
            if (orbCount === 0) {
                button.disabled = true;
                button.style.backgroundColor = 'rgba(40, 40, 40, 0.8)';
                button.style.color = '#777';
                button.style.cursor = 'not-allowed';
                button.style.boxShadow = 'none';
            } else {
                button.disabled = false;
                button.style.backgroundColor = 'rgba(15, 40, 55, 0.8)';
                button.style.color = '#fff';
                button.style.cursor = 'pointer';
                button.style.boxShadow = `0 0 10px ${borderColor}`;
            }
        };
        
        updateOrbSellButton('sell-orb-common', resources.orbs.common, 'rgba(0, 255, 102, 0.3)');
        updateOrbSellButton('sell-orb-uncommon', resources.orbs.uncommon, 'rgba(0, 102, 255, 0.3)');
        updateOrbSellButton('sell-orb-rare', resources.orbs.rare, 'rgba(153, 0, 255, 0.3)');
        updateOrbSellButton('sell-orb-epic', resources.orbs.epic, 'rgba(255, 102, 0, 0.3)');
        updateOrbSellButton('sell-orb-legendary', resources.orbs.legendary, 'rgba(255, 0, 0, 0.3)');
    }
    
    // Helper method to update upgrade button status
    updateUpgradeButtonStatus(buttonId, currentCredits, cost, activeColor) {
        const button = document.getElementById(buttonId);
        if (!button) return;
        
        if (currentCredits < cost) {
            button.disabled = true;
            button.style.backgroundColor = '#555';
            button.style.color = '#777';
            button.style.cursor = 'not-allowed';
        } else {
            button.disabled = false;
            button.style.backgroundColor = activeColor;
            button.style.color = activeColor === '#ff9900' || activeColor === '#30cfd0' ? '#000' : '#fff';
            button.style.cursor = 'pointer';
        }
    }
    
    // Update sell button styles based on available resources
    updateSellButtonStatus(buttonId, resourceAmount, borderColor) {
        const button = document.getElementById(buttonId);
        if (!button) return;
        
        if (resourceAmount === 0) {
            button.disabled = true;
            button.style.backgroundColor = 'rgba(40, 40, 40, 0.8)';
            button.style.borderColor = '#555';
            button.style.color = '#777';
            button.style.boxShadow = 'none';
            button.style.cursor = 'not-allowed';
        } else {
            button.disabled = false;
            button.style.backgroundColor = 'rgba(15, 40, 55, 0.8)';
            button.style.borderColor = borderColor;
            button.style.color = '#fff';
            button.style.boxShadow = `0 0 10px rgba(${parseInt(borderColor.slice(1, 3), 16)}, ${parseInt(borderColor.slice(3, 5), 16)}, ${parseInt(borderColor.slice(5, 7), 16)}, 0.3)`;
            button.style.cursor = 'pointer';
        }
    }
    
    // Add a new method for setting up touch events
    setupTouchEvents() {
        if (!this.isMobile) return;
        
        const stargateUI = document.getElementById('stargate-ui');
        if (!stargateUI) return;
        
        console.log("Setting up touch events for stargate UI");
        
        // Make sure the undock button has proper touch handling
        const undockBtn = document.getElementById('undock-btn');
        if (undockBtn) {
            undockBtn.style.touchAction = 'manipulation';
            undockBtn.style.webkitTapHighlightColor = 'transparent';
            undockBtn.style.position = 'relative';
            undockBtn.style.zIndex = '9999';
            
            // Ensure proper touch handling
            undockBtn.addEventListener('touchstart', (e) => {
                console.log("Touch start on undock button");
                // Change appearance to show it's being touched
                undockBtn.style.backgroundColor = '#1b88db';
                undockBtn.style.transform = 'scale(0.98)';
                // Prevent any default behavior that might interfere
                e.stopPropagation();
            }, { passive: false });
            
            undockBtn.addEventListener('touchend', (e) => {
                console.log("Touch end on undock button");
                // Reset appearance
                undockBtn.style.backgroundColor = '#33aaff';
                undockBtn.style.transform = 'scale(1)';
                // Prevent any default behavior that might interfere
                e.stopPropagation();
            }, { passive: false });
        }
        
        // Prevent default touchmove on body but allow scrolling within the stargate UI
        stargateUI.addEventListener('touchmove', (e) => {
            // Allow the default scroll behavior within the stargate UI
            e.stopPropagation();
        }, { passive: true });
        
        // Fix for iOS scrolling issues - only prevent at the top, not at the bottom
        stargateUI.addEventListener('touchstart', (e) => {
            // Only prevent pull-to-refresh at the top, don't interfere with bottom scrolling
            const scrollTop = stargateUI.scrollTop;
            
            if (scrollTop <= 0 && e.touches[0].screenY < e.touches[0].clientY) {
                e.preventDefault();
            }
            // Removed condition that was preventing scrolling at the bottom
        }, { passive: false });
        
        // Handle tabbed content for better touch experience
        const tabButtons = stargateUI.querySelectorAll('.tablinks');
        if (tabButtons.length > 0) {
            tabButtons.forEach(button => {
                button.addEventListener('touchend', (e) => {
                    // Prevent rapid multiple touches
                    e.preventDefault();
                    
                    // Simulate a click event
                    button.click();
                });
            });
        }
        
        // Improve touch experience for all buttons in the stargate UI
        const allButtons = stargateUI.querySelectorAll('button');
        allButtons.forEach(button => {
            if (button !== undockBtn) { // We already handled the undock button specially
                button.style.touchAction = 'manipulation';
                button.style.webkitTapHighlightColor = 'transparent';
                
                // Provide visual feedback on touch
                button.addEventListener('touchstart', () => {
                    button.style.transform = 'scale(0.98)';
                }, { passive: true });
                
                button.addEventListener('touchend', () => {
                    button.style.transform = 'scale(1)';
                }, { passive: true });
            }
        });
    }
    
    setupEventHandlers() {
        // Add event handler for custom system button
        const customSystemBtn = document.getElementById('create-custom-system');
        if (customSystemBtn) {
            customSystemBtn.addEventListener('click', () => {
                // Check if custom system creator is available on environment
                if (window.game && window.game.environment && window.game.environment.customSystemCreator) {
                    // Close stargate interface
                    this.hide();
                    
                    // Show custom system creator
                    window.game.environment.customSystemCreator.show();
                } else {
                    console.error('Custom system creator not available');
                }
            });
        }
        
        // Add event handler for UNLEASH THE HORDE button
        const hordeButton = document.getElementById('unleash-horde');
        if (hordeButton) {
            hordeButton.addEventListener('click', () => {
                // Check if spectral drones have started spawning
                const dronesHaveSpawned = window.game && 
                                         window.game.ecsWorld && 
                                         window.game.ecsWorld.enemySystem && 
                                         window.game.ecsWorld.enemySystem.initialSpawnComplete;
                
                if (dronesHaveSpawned) {
                    console.log("HORDE MODE: Button clicked, showing confirmation");
                    this.showHordeConfirmation();
                } else {
                    console.log("HORDE MODE: Button clicked but spectral drones haven't appeared yet");
                    // Show notification that horde mode is not available yet
                    this.showNotification("Horde mode is only available after spectral drones appear in the sector.", 0xff3030);
                }
            });
        }
        
        // Add handler for purchasing laser turrets
        const purchaseLaserBtn = document.getElementById('purchase-laser');
        if (purchaseLaserBtn) {
            purchaseLaserBtn.addEventListener('click', this.purchaseLaserTurret.bind(this));
        }
        
        // Energy orb sell handlers
        document.getElementById('sell-orb-common').addEventListener('click', () => {
            if (this.sellEnergyOrb('common')) {
                // Update UI after selling
                this.updateStargateUI(window.game.spaceship, window.game.controls.resources);
            }
        });
        
        document.getElementById('sell-orb-uncommon').addEventListener('click', () => {
            if (this.sellEnergyOrb('uncommon')) {
                // Update UI after selling
                this.updateStargateUI(window.game.spaceship, window.game.controls.resources);
            }
        });
        
        document.getElementById('sell-orb-rare').addEventListener('click', () => {
            if (this.sellEnergyOrb('rare')) {
                // Update UI after selling
                this.updateStargateUI(window.game.spaceship, window.game.controls.resources);
            }
        });
        
        document.getElementById('sell-orb-epic').addEventListener('click', () => {
            if (this.sellEnergyOrb('epic')) {
                // Update UI after selling
                this.updateStargateUI(window.game.spaceship, window.game.controls.resources);
            }
        });
        
        document.getElementById('sell-orb-legendary').addEventListener('click', () => {
            if (this.sellEnergyOrb('legendary')) {
                // Update UI after selling
                this.updateStargateUI(window.game.spaceship, window.game.controls.resources);
            }
        });
    }
    
    /**
     * Show confirmation dialog for activating horde mode
     */
    showHordeConfirmation() {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.id = 'horde-confirm-modal';
        
        // Create content container
        const content = document.createElement('div');
        content.id = 'horde-confirm-content';
        
        // Add title
        const title = document.createElement('div');
        title.className = 'horde-confirm-title';
        title.textContent = 'UNLEASH THE HORDE?';
        content.appendChild(title);
        
        // Add warning text
        const text = document.createElement('div');
        text.className = 'horde-confirm-text';
        text.innerHTML = `
            <p>You are about to activate EXTREME SURVIVAL MODE.</p>
            <p>Enemies will continuously spawn with increasing:</p>
            <ul style="text-align: left; padding-left: 30px; margin: 15px 0;">
                <li>Numbers (starting at 50, scaling upward)</li>
                <li>Speed (progressively faster movement)</li>
                <li>Health (gradually becoming tougher)</li>
                <li>Damage (increasingly lethal hits)</li>
            </ul>
            <p>Difficulty will scale <strong>infinitely</strong> until you are overwhelmed.</p>
            <p style="color: #ff9999;">This is a test of survival. How long can you last?</p>
        `;
        content.appendChild(text);
        
        // Add buttons container
        const buttons = document.createElement('div');
        buttons.className = 'horde-confirm-buttons';
        
        // Add YES button
        const yesBtn = document.createElement('button');
        yesBtn.className = 'horde-confirm-btn horde-confirm-yes';
        yesBtn.textContent = 'UNLEASH THEM';
        yesBtn.addEventListener('click', () => {
            // Remove the confirmation dialog
            document.body.removeChild(modal);
            
            // Hide the stargate UI
            this.hideStargateUI();
            
            // Activate horde mode in the game
            if (window.game && typeof window.game.activateHordeMode === 'function') {
                window.game.activateHordeMode();
                console.log("HORDE MODE: Activated via stargateInterface");
            } else {
                console.error("HORDE MODE: Failed to activate - game.activateHordeMode not available");
            }
        });
        
        // Add NO button
        const noBtn = document.createElement('button');
        noBtn.className = 'horde-confirm-btn horde-confirm-no';
        noBtn.textContent = 'CANCEL';
        noBtn.addEventListener('click', () => {
            // Just remove the confirmation dialog
            document.body.removeChild(modal);
        });
        
        // Add buttons to container
        buttons.appendChild(noBtn);  // Cancel on left
        buttons.appendChild(yesBtn); // Confirm on right
        
        // Add buttons to content
        content.appendChild(buttons);
        
        // Add content to modal
        modal.appendChild(content);
        
        // Add modal to body
        document.body.appendChild(modal);
    }

    /**
     * Purchase a deployable laser turret
     */
    purchaseLaserTurret() {
        console.log("Attempting to purchase laser turret");
        
        // Check if game and spaceship are available
        if (!window.game || !window.game.spaceship) {
            console.error("Cannot purchase laser turret: game or spaceship not found");
            return;
        }
        
        const spaceship = window.game.spaceship;
        
        // Check if player has enough credits
        if (spaceship.credits < 1000) {
            console.log("Not enough credits to purchase laser turret");
            // Show notification to the player
            if (window.mainMessageBus) {
                window.mainMessageBus.publish('ui.notification', {
                    message: "Not enough credits to purchase laser turret",
                    type: "error",
                    duration: 2
                });
            }
            return;
        }
        
        // Purchase the laser turret
        spaceship.credits -= 1000;
        
        // Initialize deployableLaserCount if it doesn't exist
        if (typeof spaceship.deployableLaserCount === 'undefined') {
            spaceship.deployableLaserCount = 0;
        }
        
        // Add a laser turret to the player's inventory
        spaceship.deployableLaserCount++;
        
        // Play purchase sound
        if (window.game.audio && window.game.audio.playSound) {
            window.game.audio.playSound('purchase');
        }
        
        // Update the UI
        this.updateStargateUI(spaceship, window.game.controls.resources);
        
        // Show notification to the player
        if (window.mainMessageBus) {
            window.mainMessageBus.publish('ui.notification', {
                message: "Laser turret purchased",
                type: "success",
                duration: 2
            });
        }
        
        console.log("Laser turret purchased successfully");
    }

    // Sell an energy orb of the specified rarity
    sellEnergyOrb(rarity) {
        // Make sure we have spaceship and resources references
        if (!window.game || !window.game.spaceship || !window.game.controls || !window.game.controls.resources) {
            console.error("Required game objects not available");
            return false;
        }
        
        const spaceship = window.game.spaceship;
        const resources = window.game.controls.resources;
        
        // Check if orbs property exists, initialize if needed
        if (!resources.orbs) {
            resources.orbs = {
                common: 0,
                uncommon: 0,
                rare: 0,
                epic: 0,
                legendary: 0
            };
            return false; // No orbs available yet
        }
        
        // Check if player has any orbs of the specified rarity
        if (!resources.orbs[rarity] || resources.orbs[rarity] <= 0) {
            console.log(`No ${rarity} orbs available to sell`);
            return false;
        }
        
        // Calculate value based on rarity
        let value = 0;
        switch (rarity) {
            case 'common':
                value = 100;
                break;
            case 'uncommon':
                value = 500;
                break;
            case 'rare':
                value = 1500;
                break;
            case 'epic':
                value = 5000;
                break;
            case 'legendary':
                value = 15000;
                break;
            default:
                console.error(`Unknown orb rarity: ${rarity}`);
                return false;
        }
        
        // Sell the orb - update inventory and credits
        resources.orbs[rarity]--;
        spaceship.credits += value;
        
        // Show message
        const capitalizedRarity = rarity.charAt(0).toUpperCase() + rarity.slice(1);
        this.showNotification(`Sold ${capitalizedRarity} Energy Orb for ${value} credits`, 0x33aaff);
        
        // Play sound if audio manager is available
        if (window.game.audio) {
            window.game.audio.playSoundEffect('sell', 0.5);
        }
        
        return true;
    }
    
    // Helper method to show notifications
    showNotification(message, color = 0x33aaff) {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.position = 'fixed';
        notification.style.top = '35%';
        notification.style.left = '50%';
        notification.style.transform = 'translate(-50%, -50%)';
        notification.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        notification.style.color = '#fff';
        notification.style.padding = '15px 30px';
        notification.style.borderRadius = '10px';
        notification.style.border = `2px solid #${color.toString(16).padStart(6, '0')}`;
        notification.style.boxShadow = `0 0 15px #${color.toString(16).padStart(6, '0')}`;
        notification.style.fontFamily = 'Courier New, monospace';
        notification.style.fontSize = '16px';
        notification.style.zIndex = '1001'; // Above the stargate UI
        notification.style.textAlign = 'center';
        
        // Set notification text
        notification.textContent = message;
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Remove after a few seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.8s';
            
            setTimeout(() => {
                notification.remove();
            }, 800);
        }, 2000);
    }
}