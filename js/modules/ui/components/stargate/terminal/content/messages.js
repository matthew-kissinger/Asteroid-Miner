// messages.js - Terminal text content and UI templates

export class TerminalMessages {
    constructor() {
        this.welcomeMessages = [
            'STARGATE TERMINAL ONLINE',
            'QUANTUM LINK ESTABLISHED',
            'NEURAL INTERFACE ACTIVE',
            'SYSTEM READY FOR COMMANDS'
        ];
    }
    
    getMainUIContent() {
        return `
            <!-- Header -->
            <div id="stargate-header">
                <button id="undock-btn" class="action-btn btn-undock" data-no-touch-overlay="true">
                    <span class="undock-text">◆ UNDOCK ◆</span>
                </button>
                <h2 style="text-align: center; color: #33aaff; margin: 0;">STARGATE TERMINAL</h2>
            </div>
            
            <!-- Main Content Grid -->
            <div id="stargate-content">
                <!-- Ship Status Section -->
                <div id="ship-status-section" class="stargate-section">
                    <h3>SHIP STATUS</h3>
                    ${this.getShipStatusContent()}
                </div>
                
                <!-- Market Section -->
                <div id="market-section" class="stargate-section">
                    <h3>MARKET</h3>
                    ${this.getMarketContent()}
                </div>
                
                <!-- Upgrades Section -->
                <div id="upgrades-section" class="stargate-section">
                    <h3>SHIP UPGRADES</h3>
                    ${this.getUpgradesContent()}
                </div>
                
                <!-- Features Section -->
                <div id="features-section" class="stargate-section">
                    <h3>SERVICES</h3>
                    ${this.getFeaturesContent()}
                </div>
                
                <!-- Challenge Section -->
                <div id="challenge-section" class="stargate-section">
                    <h3>EXTREME CHALLENGE</h3>
                    ${this.getChallengeContent()}
                </div>
            </div>
            
            <!-- Footer -->
            <div id="stargate-footer">
                <!-- Footer now empty, undock button moved to header -->
            </div>
        `;
    }
    
    getShipStatusContent() {
        return `
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
        `;
    }
    
    getMarketContent() {
        return `
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
                ${this.getOrbButtons()}
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
        `;
    }
    
    getOrbButtons() {
        const orbs = [
            { type: 'common', price: 100 },
            { type: 'uncommon', price: 500 },
            { type: 'rare', price: 1500 },
            { type: 'epic', price: 5000 },
            { type: 'legendary', price: 15000 }
        ];
        
        return orbs.map(orb => `
            <button id="sell-orb-${orb.type}" class="sell-btn ${orb.type}-border">
                <div style="font-weight: bold;">${orb.type.toUpperCase()} ORB</div>
                <div id="orb-${orb.type}-count" style="font-size: 12px;">0 in inventory</div>
                <div style="font-size: 12px; margin-top: 3px;">(${orb.price.toLocaleString()} CR each)</div>
            </button>
        `).join('');
    }
    
    getUpgradesContent() {
        const upgrades = [
            { type: 'fuel', name: 'Fuel Tank', color: '#00cc33', description: 'Increases maximum fuel capacity, allowing for longer journeys.' },
            { type: 'engine', name: 'Engine', color: '#ff9900', description: 'Enhances thruster power, increasing maximum velocity and maneuverability.' },
            { type: 'mining', name: 'Mining Laser', color: '#ff3030', description: 'Increases mining speed and extraction efficiency, allowing faster resource collection.' },
            { type: 'hull', name: 'Hull', color: '#30cfd0', description: 'Reinforces ship structure, improving collision resistance and reducing damage.' },
            { type: 'scanner', name: 'Scanner', color: '#9933cc', description: 'Extends scanner range for detecting asteroids and other objects at greater distances.' }
        ];
        
        return upgrades.map(upgrade => this.getUpgradeItemHTML(upgrade)).join('');
    }
    
    getUpgradeItemHTML(upgrade) {
        const buttonColor = upgrade.color === '#ff3030' || upgrade.color === '#9933cc' ? '#fff' : '#000';
        
        return `
            <div class="upgrade-item">
                <div class="upgrade-header">
                    <div>
                        <strong style="color: ${upgrade.color};">${upgrade.name} Level:</strong> <span id="current-${upgrade.type}-level">1</span>
                    </div>
                    <div style="text-align: right;">
                        <strong>Current:</strong> <span id="current-${upgrade.type}-capacity">--</span>
                        <br>
                        <small style="opacity: 0.8;">Next: <span id="next-${upgrade.type}-capacity">--</span></small>
                    </div>
                </div>
                <div class="upgrade-progress">
                    <div id="${upgrade.type}-upgrade-progress" class="upgrade-progress-bar" style="background-color: ${upgrade.color}; width: 20%;"></div>
                </div>
                <div class="upgrade-footer">
                    <div class="upgrade-description">
                        <p style="margin: 0; font-size: 12px;">${upgrade.description}</p>
                    </div>
                    <button id="upgrade-${upgrade.type}" style="flex: 1; padding: 10px; background-color: ${upgrade.color}; color: ${buttonColor}; border: none; border-radius: 5px; cursor: pointer; font-family: 'Courier New', monospace; font-weight: bold;">
                        UPGRADE (<span id="${upgrade.type}-upgrade-cost">1000</span> CR)
                    </button>
                </div>
            </div>
        `;
    }
    
    getFeaturesContent() {
        return `
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
        `;
    }
    
    getChallengeContent() {
        return `
            <button id="unleash-horde" class="action-btn btn-horde">
                UNLEASH THE HORDE
            </button>
            <p style="font-size: 12px; color: #ff9999; margin: 10px 0 0 0;">WARNING: Activate extreme survival mode with infinitely scaling difficulty</p>
        `;
    }
    
    getRandomWelcomeMessage() {
        return this.welcomeMessages[Math.floor(Math.random() * this.welcomeMessages.length)];
    }
}