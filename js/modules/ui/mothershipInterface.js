// mothershipInterface.js - Handles the mothership docking and trading UI

export class MothershipInterface {
    constructor() {
        this.starMap = null;
        this.blackjackGame = null;
        this.setupMothershipUI();
    }
    
    setStarMap(starMap) {
        this.starMap = starMap;
    }
    
    setBlackjackGame(blackjackGame) {
        this.blackjackGame = blackjackGame;
    }
    
    setupMothershipUI() {
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
        dockingPrompt.textContent = 'Press Q to dock with Mothership';
        document.body.appendChild(dockingPrompt);
        
        // Create mothership interface (hidden by default)
        const mothershipUI = document.createElement('div');
        mothershipUI.id = 'mothership-ui';
        mothershipUI.style.position = 'absolute';
        mothershipUI.style.top = '50%';
        mothershipUI.style.left = '50%';
        mothershipUI.style.transform = 'translate(-50%, -50%)';
        mothershipUI.style.width = '700px';  // Increased width to accommodate more upgrades
        mothershipUI.style.maxHeight = '90vh';  // Maximum height with viewport percentage
        mothershipUI.style.overflowY = 'auto';  // Add scrolling for smaller screens
        mothershipUI.style.backgroundColor = 'rgba(20, 30, 50, 0.9)';
        mothershipUI.style.color = '#fff';
        mothershipUI.style.padding = '30px';
        mothershipUI.style.borderRadius = '15px';
        mothershipUI.style.border = '2px solid #33aaff';
        mothershipUI.style.boxShadow = '0 0 30px #33aaff';
        mothershipUI.style.fontFamily = 'Courier New, monospace';
        mothershipUI.style.zIndex = '1000';
        mothershipUI.style.display = 'none';
        
        mothershipUI.innerHTML = `
            <h2 style="text-align: center; color: #33aaff; margin-top: 0;">MOTHERSHIP TERMINAL</h2>
            <div style="display: flex; justify-content: space-between; margin-bottom: 25px;">
                <div style="flex: 1; padding: 15px; border-right: 1px solid #33aaff;">
                    <h3 style="color: #33aaff;">RESOURCES</h3>
                    <div id="mothership-resources">
                        <div>Iron: <span id="ms-iron">0</span></div>
                        <div>Gold: <span id="ms-gold">0</span></div>
                        <div>Platinum: <span id="ms-platinum">0</span></div>
                    </div>
                    <h3 style="color: #33aaff; margin-top: 20px;">CREDITS</h3>
                    <div id="ms-credits">0 CR</div>
                </div>
                <div style="flex: 1; padding: 15px;">
                    <h3 style="color: #33aaff;">FUEL</h3>
                    <div id="fuel-gauge-container" style="width: 100%; height: 20px; background-color: #222; border-radius: 10px; overflow: hidden; margin-bottom: 10px;">
                        <div id="fuel-gauge" style="width: 100%; height: 100%; background-color: #00cc33;"></div>
                    </div>
                    <div style="text-align: center; margin-bottom: 20px;">
                        <span id="fuel-level">100</span>%
                    </div>
                    <button id="refuel-btn" style="width: 100%; padding: 10px; background-color: #00cc33; color: #000; border: none; border-radius: 5px; cursor: pointer; font-family: 'Courier New', monospace; font-weight: bold; margin-bottom: 15px;">
                        REFUEL (100 CR)
                    </button>
                    
                    <h3 style="color: #33aaff; margin-top: 15px;">SHIELD</h3>
                    <div id="shield-gauge-container" style="width: 100%; height: 20px; background-color: #222; border-radius: 10px; overflow: hidden; margin-bottom: 10px;">
                        <div id="shield-gauge" style="width: 100%; height: 100%; background-color: #3399ff;"></div>
                    </div>
                    <div style="text-align: center; margin-bottom: 20px;">
                        <span id="shield-level">100</span>%
                    </div>
                    <button id="repair-shield-btn" style="width: 100%; padding: 10px; background-color: #3399ff; color: #000; border: none; border-radius: 5px; cursor: pointer; font-family: 'Courier New', monospace; font-weight: bold; margin-bottom: 15px;">
                        REPAIR SHIELD (150 CR)
                    </button>
                    
                    <h3 style="color: #33aaff; margin-top: 15px;">HULL INTEGRITY</h3>
                    <div id="hull-gauge-container" style="width: 100%; height: 20px; background-color: #222; border-radius: 10px; overflow: hidden; margin-bottom: 10px;">
                        <div id="hull-gauge" style="width: 100%; height: 100%; background-color: #ff9900;"></div>
                    </div>
                    <div style="text-align: center; margin-bottom: 20px;">
                        <span id="hull-level">100</span>%
                    </div>
                    <button id="repair-hull-btn" style="width: 100%; padding: 10px; background-color: #ff9900; color: #000; border: none; border-radius: 5px; cursor: pointer; font-family: 'Courier New', monospace; font-weight: bold;">
                        REPAIR HULL (200 CR)
                    </button>
                </div>
            </div>
            <div style="border-top: 1px solid #33aaff; padding-top: 20px; margin-bottom: 20px;">
                <h3 style="color: #33aaff;">MARKET</h3>
                <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                    <button id="sell-iron" class="sell-btn" style="flex: 1; margin-right: 5px; padding: 10px; background-color: #555; color: #fff; border: 1px solid #777; border-radius: 5px; cursor: pointer;">
                        SELL IRON (10 CR each)
                    </button>
                    <button id="sell-gold" class="sell-btn" style="flex: 1; margin-right: 5px; padding: 10px; background-color: #555; color: #fff; border: 1px solid #777; border-radius: 5px; cursor: pointer;">
                        SELL GOLD (50 CR each)
                    </button>
                    <button id="sell-platinum" class="sell-btn" style="flex: 1; padding: 10px; background-color: #555; color: #fff; border: 1px solid #777; border-radius: 5px; cursor: pointer;">
                        SELL PLATINUM (200 CR each)
                    </button>
                </div>
            </div>
            <div style="border-top: 1px solid #33aaff; padding-top: 20px; margin-bottom: 20px;">
                <h3 style="color: #33aaff;">INTERSTELLAR TRAVEL</h3>
                <button id="open-star-map" style="width: 100%; padding: 15px; margin-bottom: 10px; background-color: #30cfd0; color: #000; border: none; border-radius: 5px; cursor: pointer; font-family: 'Courier New', monospace; font-weight: bold; font-size: 16px;">
                    STAR MAP
                </button>
                <p style="font-size: 12px; color: #aaa; margin: 0;">Access the star map to travel between star systems</p>
            </div>
            <div style="border-top: 1px solid #33aaff; padding-top: 20px; margin-bottom: 20px;">
                <h3 style="color: #33aaff;">ENTERTAINMENT</h3>
                <button id="open-blackjack" style="width: 100%; padding: 15px; margin-bottom: 10px; background-color: #9933cc; color: #fff; border: none; border-radius: 5px; cursor: pointer; font-family: 'Courier New', monospace; font-weight: bold; font-size: 16px;">
                    STELLAR BLACKJACK
                </button>
                <p style="font-size: 12px; color: #aaa; margin: 0;">Wager resources in this classic card game with a space twist</p>
            </div>
            <div style="border-top: 1px solid #33aaff; padding-top: 20px; margin-bottom: 20px;">
                <h3 style="color: #33aaff;">UPGRADES</h3>
                
                <!-- Fuel Tank Upgrade Section -->
                <div class="upgrade-item" style="margin-bottom: 15px; border: 1px solid #555; border-radius: 8px; padding: 15px; background-color: rgba(0, 0, 0, 0.3);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <div>
                            <strong style="color: #00cc33;">Fuel Tank Level:</strong> <span id="current-fuel-level">1</span>
                        </div>
                        <div style="text-align: right;">
                            <strong>Capacity:</strong> <span id="current-fuel-capacity">100</span> units
                            <br>
                            <small style="opacity: 0.8;">Next: <span id="next-fuel-capacity">200</span> units</small>
                        </div>
                    </div>
                    <div style="position: relative; height: 8px; background-color: #333; border-radius: 4px; margin-bottom: 15px;">
                        <div id="fuel-upgrade-progress" style="position: absolute; top: 0; left: 0; height: 100%; width: 20%; background-color: #00cc33; border-radius: 4px;"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="flex: 2; padding-right: 10px;">
                            <p style="margin: 0; font-size: 12px;">Increases maximum fuel capacity, allowing for longer journeys.</p>
                        </div>
                        <button id="upgrade-fuel-tank" style="flex: 1; padding: 10px; background-color: #00cc33; color: #fff; border: none; border-radius: 5px; cursor: pointer; font-family: 'Courier New', monospace; font-weight: bold;">
                            UPGRADE (<span id="fuel-upgrade-cost">1000</span> CR)
                        </button>
                    </div>
                </div>
                
                <!-- Engine Upgrade Section -->
                <div class="upgrade-item" style="margin-bottom: 15px; border: 1px solid #555; border-radius: 8px; padding: 15px; background-color: rgba(0, 0, 0, 0.3);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <div>
                            <strong style="color: #ff9900;">Engine Level:</strong> <span id="current-engine-level">1</span>
                        </div>
                        <div style="text-align: right;">
                            <strong>Max Speed:</strong> <span id="current-max-velocity">25</span> units/s
                            <br>
                            <small style="opacity: 0.8;">Next: <span id="next-max-velocity">31.25</span> units/s</small>
                        </div>
                    </div>
                    <div style="position: relative; height: 8px; background-color: #333; border-radius: 4px; margin-bottom: 15px;">
                        <div id="engine-upgrade-progress" style="position: absolute; top: 0; left: 0; height: 100%; width: 20%; background-color: #ff9900; border-radius: 4px;"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="flex: 2; padding-right: 10px;">
                            <p style="margin: 0; font-size: 12px;">Enhances thruster power, increasing maximum velocity and maneuverability.</p>
                        </div>
                        <button id="upgrade-engine" style="flex: 1; padding: 10px; background-color: #ff9900; color: #000; border: none; border-radius: 5px; cursor: pointer; font-family: 'Courier New', monospace; font-weight: bold;">
                            UPGRADE (<span id="engine-upgrade-cost">800</span> CR)
                        </button>
                    </div>
                </div>
                
                <!-- Mining Laser Upgrade Section -->
                <div class="upgrade-item" style="margin-bottom: 15px; border: 1px solid #555; border-radius: 8px; padding: 15px; background-color: rgba(0, 0, 0, 0.3);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <div>
                            <strong style="color: #ff3030;">Mining Laser Level:</strong> <span id="current-mining-level">1</span>
                        </div>
                        <div style="text-align: right;">
                            <strong>Efficiency:</strong> <span id="current-mining-efficiency">100</span>%
                            <br>
                            <small style="opacity: 0.8;">Next: <span id="next-mining-efficiency">130</span>%</small>
                        </div>
                    </div>
                    <div style="position: relative; height: 8px; background-color: #333; border-radius: 4px; margin-bottom: 15px;">
                        <div id="mining-upgrade-progress" style="position: absolute; top: 0; left: 0; height: 100%; width: 20%; background-color: #ff3030; border-radius: 4px;"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="flex: 2; padding-right: 10px;">
                            <p style="margin: 0; font-size: 12px;">Increases mining speed and extraction efficiency, allowing faster resource collection.</p>
                        </div>
                        <button id="upgrade-mining" style="flex: 1; padding: 10px; background-color: #ff3030; color: #fff; border: none; border-radius: 5px; cursor: pointer; font-family: 'Courier New', monospace; font-weight: bold;">
                            UPGRADE (<span id="mining-upgrade-cost">1200</span> CR)
                        </button>
                    </div>
                </div>
                
                <!-- Hull Upgrade Section -->
                <div class="upgrade-item" style="margin-bottom: 15px; border: 1px solid #555; border-radius: 8px; padding: 15px; background-color: rgba(0, 0, 0, 0.3);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <div>
                            <strong style="color: #30cfd0;">Hull Level:</strong> <span id="current-hull-level">1</span>
                        </div>
                        <div style="text-align: right;">
                            <strong>Resistance:</strong> <span id="current-hull-resistance">100</span>%
                            <br>
                            <small style="opacity: 0.8;">Next: <span id="next-hull-resistance">125</span>%</small>
                        </div>
                    </div>
                    <div style="position: relative; height: 8px; background-color: #333; border-radius: 4px; margin-bottom: 15px;">
                        <div id="hull-upgrade-progress" style="position: absolute; top: 0; left: 0; height: 100%; width: 20%; background-color: #30cfd0; border-radius: 4px;"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="flex: 2; padding-right: 10px;">
                            <p style="margin: 0; font-size: 12px;">Reinforces ship structure, improving collision resistance and reducing damage.</p>
                        </div>
                        <button id="upgrade-hull" style="flex: 1; padding: 10px; background-color: #30cfd0; color: #000; border: none; border-radius: 5px; cursor: pointer; font-family: 'Courier New', monospace; font-weight: bold;">
                            UPGRADE (<span id="hull-upgrade-cost">1500</span> CR)
                        </button>
                    </div>
                </div>
                
                <!-- Scanner Upgrade Section -->
                <div class="upgrade-item" style="margin-bottom: 15px; border: 1px solid #555; border-radius: 8px; padding: 15px; background-color: rgba(0, 0, 0, 0.3);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <div>
                            <strong style="color: #9933cc;">Scanner Level:</strong> <span id="current-scanner-level">1</span>
                        </div>
                        <div style="text-align: right;">
                            <strong>Range:</strong> <span id="current-scanner-range">1000</span> units
                            <br>
                            <small style="opacity: 0.8;">Next: <span id="next-scanner-range">1200</span> units</small>
                        </div>
                    </div>
                    <div style="position: relative; height: 8px; background-color: #333; border-radius: 4px; margin-bottom: 15px;">
                        <div id="scanner-upgrade-progress" style="position: absolute; top: 0; left: 0; height: 100%; width: 20%; background-color: #9933cc; border-radius: 4px;"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="flex: 2; padding-right: 10px;">
                            <p style="margin: 0; font-size: 12px;">Extends scanner range for detecting asteroids and other objects at greater distances.</p>
                        </div>
                        <button id="upgrade-scanner" style="flex: 1; padding: 10px; background-color: #9933cc; color: #fff; border: none; border-radius: 5px; cursor: pointer; font-family: 'Courier New', monospace; font-weight: bold;">
                            UPGRADE (<span id="scanner-upgrade-cost">600</span> CR)
                        </button>
                    </div>
                </div>
            </div>
            <button id="undock-btn" style="width: 100%; padding: 15px; margin-top: 20px; background-color: #33aaff; color: #000; border: none; border-radius: 5px; cursor: pointer; font-family: 'Courier New', monospace; font-weight: bold; font-size: 16px;">
                UNDOCK
            </button>
        `;
        
        document.body.appendChild(mothershipUI);
    }
    
    showDockingPrompt() {
        const dockingPrompt = document.getElementById('docking-prompt');
        if (dockingPrompt) {
            dockingPrompt.style.display = 'block';
        }
    }
    
    hideDockingPrompt() {
        const dockingPrompt = document.getElementById('docking-prompt');
        if (dockingPrompt) {
            dockingPrompt.style.display = 'none';
        }
    }
    
    showMothershipUI() {
        const mothershipUI = document.getElementById('mothership-ui');
        if (mothershipUI) {
            mothershipUI.style.display = 'block';
        }
        
        // Setup star map button handler
        this.setupStarMapButton();
        
        // Setup blackjack game button handler
        this.setupBlackjackButton();
    }
    
    setupStarMapButton() {
        const starMapButton = document.getElementById('open-star-map');
        if (starMapButton && this.starMap) {
            starMapButton.addEventListener('click', () => {
                console.log("Opening star map");
                this.hideMothershipUI();
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
                this.hideMothershipUI();
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
    
    hideMothershipUI() {
        const mothershipUI = document.getElementById('mothership-ui');
        if (mothershipUI) {
            mothershipUI.style.display = 'none';
        }
    }
    
    updateMothershipUI(spaceship, resources) {
        // Update resource display
        document.getElementById('ms-iron').textContent = resources.iron;
        document.getElementById('ms-gold').textContent = resources.gold;
        document.getElementById('ms-platinum').textContent = resources.platinum;
        
        // Update credits
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
        
        // Update button styles based on disabled state
        document.querySelectorAll('.sell-btn').forEach(btn => {
            if (btn.disabled) {
                btn.style.backgroundColor = '#333';
                btn.style.color = '#777';
                btn.style.cursor = 'not-allowed';
            } else {
                btn.style.backgroundColor = '#555';
                btn.style.color = '#fff';
                btn.style.cursor = 'pointer';
            }
        });
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
}