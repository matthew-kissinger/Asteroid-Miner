// handlers.js - Command execution and action handling

export class CommandHandlers {
    constructor(stargateInterface) {
        this.stargate = stargateInterface;
        this.lastCommandTime = 0;
        this.commandCooldown = 100; // ms between commands
    }
    
    async executeCommand(parsedCommand) {
        const now = Date.now();
        if (now - this.lastCommandTime < this.commandCooldown) {
            return { success: false, message: 'Command rate limit exceeded' };
        }
        this.lastCommandTime = now;
        
        const { command, args } = parsedCommand;
        
        try {
            switch (command) {
                case 'help':
                    return this.handleHelp(args);
                case 'list':
                    return this.handleList(args);
                case 'clear':
                    return this.handleClear();
                case 'quit':
                case 'undock':
                    return this.handleUndock();
                case 'info':
                    return this.handleInfo(args);
                case 'purchase':
                    return this.handlePurchase(args);
                case 'market':
                    return this.handleMarket(args);
                case 'enhance':
                    return this.handleEnhance(args);
                case 'refuel':
                    return this.handleRefuel();
                case 'repair':
                    return this.handleRepair(args);
                case 'scan':
                    return this.handleScan();
                case 'starmap':
                    return this.handleStarmap();
                case 'blackjack':
                    return this.handleBlackjack();
                case 'settings':
                    return this.handleSettings();
                case 'horde':
                    return this.handleHorde();
                default:
                    return { 
                        success: false, 
                        message: `Unknown command: ${command}. Type 'help' for available commands.` 
                    };
            }
        } catch (error) {
            console.error('Command execution error:', error);
            return { 
                success: false, 
                message: 'Command execution failed. Please try again.' 
            };
        }
    }
    
    handleHelp(args) {
        const helpTopics = {
            general: `Available Commands:
• help [topic] - Show this help or specific topic help
• list - Show available services and features  
• info [system] - Display ship or system information
• market [item] - Access trading interface
• purchase <item> - Buy upgrades or services
• enhance <system> - Upgrade ship systems
• refuel - Refill fuel tanks
• repair [system] - Repair ship systems
• scan - Perform system scan
• starmap - Open navigation interface
• blackjack - Access gaming interface
• settings - Configure terminal preferences
• undock - Leave stargate terminal
• clear - Clear terminal display`,
            
            market: `Market Commands:
• market - Show all available items
• market resources - Show resource prices
• market orbs - Show energy orb values
• purchase fuel - Refuel ship (100 CR)
• purchase shield - Repair shields (150 CR)
• purchase hull - Repair hull (200 CR)`,
            
            upgrade: `Upgrade Commands:
• enhance fuel - Upgrade fuel tank capacity
• enhance engine - Improve ship speed
• enhance mining - Increase mining efficiency
• enhance hull - Strengthen ship structure
• enhance scanner - Extend detection range`
        };
        
        const topic = args[0] || 'general';
        const helpText = helpTopics[topic] || helpTopics.general;
        
        return { success: true, message: helpText };
    }
    
    handleList() {
        return {
            success: true,
            message: `STARGATE SERVICES:
• Ship Maintenance & Repair
• Resource Trading Market
• Ship System Upgrades
• Navigation & Mapping
• Entertainment (Stellar Blackjack)
• System Configuration
• Challenge Modes

Type 'help [service]' for detailed information.`
        };
    }
    
    handleClear() {
        return { success: true, message: '', clearScreen: true };
    }
    
    handleUndock() {
        if (this.stargate && this.stargate.hide) {
            this.stargate.hide();
        }
        return { 
            success: true, 
            message: 'Undocking from stargate terminal...',
            action: 'undock'
        };
    }
    
    handleInfo(args) {
        const system = args[0] || 'ship';
        
        // This would integrate with actual game state
        return {
            success: true,
            message: `${system.toUpperCase()} STATUS:
System information would be displayed here.
Use the GUI panels for detailed status.`
        };
    }
    
    handlePurchase(args) {
        const item = args[0];
        if (!item) {
            return { 
                success: false, 
                message: 'Please specify an item to purchase. Use "market" to see available items.' 
            };
        }
        
        return {
            success: true,
            message: `Attempting to purchase ${item}...`,
            action: 'purchase',
            target: item
        };
    }
    
    handleMarket(args) {
        const category = args[0] || 'all';
        
        return {
            success: true,
            message: `MARKET INTERFACE - ${category.toUpperCase()}
Use the market panel for transactions.
Type 'help market' for command-line trading.`
        };
    }
    
    handleEnhance(args) {
        const system = args[0];
        if (!system) {
            return { 
                success: false, 
                message: 'Please specify a system to enhance. Use "info" to see available systems.' 
            };
        }
        
        return {
            success: true,
            message: `Initiating ${system} enhancement...`,
            action: 'enhance',
            target: system
        };
    }
    
    handleRefuel() {
        return {
            success: true,
            message: 'Initiating refueling sequence...',
            action: 'refuel'
        };
    }
    
    handleRepair(args) {
        const system = args[0] || 'all';
        
        return {
            success: true,
            message: `Initiating ${system} repair sequence...`,
            action: 'repair',
            target: system
        };
    }
    
    handleScan() {
        return {
            success: true,
            message: 'Performing system scan...\nScan results would appear here.'
        };
    }
    
    handleStarmap() {
        return {
            success: true,
            message: 'Opening stellar cartography interface...',
            action: 'starmap'
        };
    }
    
    handleBlackjack() {
        return {
            success: true,
            message: 'Accessing gaming interface...',
            action: 'blackjack'
        };
    }
    
    handleSettings() {
        return {
            success: true,
            message: 'Opening configuration interface...',
            action: 'settings'
        };
    }
    
    handleHorde() {
        return {
            success: true,
            message: 'WARNING: Prepare for extreme challenge mode...',
            action: 'horde'
        };
    }
}