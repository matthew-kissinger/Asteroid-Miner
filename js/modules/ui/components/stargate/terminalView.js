// terminalView.js - Main terminal view coordinator

// Import all terminal modules
import { TerminalScreen } from './terminal/display/screen.js';
import { TerminalEffects } from './terminal/display/effects.js';
import { CommandParser } from './terminal/commands/parser.js';
import { CommandHandlers } from './terminal/commands/handlers.js';
import { TerminalMessages } from './terminal/content/messages.js';
import { TerminalAscii } from './terminal/content/ascii.js';
import { TerminalKeyboard } from './terminal/input/keyboard.js';

export class TerminalView {
    constructor() {
        this.isMobile = false;
        
        // Initialize all modules
        this.screen = new TerminalScreen();
        this.effects = new TerminalEffects();
        this.parser = new CommandParser();
        this.handlers = new CommandHandlers(this);
        this.messages = new TerminalMessages();
        this.ascii = new TerminalAscii();
        this.keyboard = new TerminalKeyboard();
        
        this.setupKeyboardHandlers();
    }
    
    setMobile(isMobile) {
        this.isMobile = isMobile;
        this.screen.setMobile(isMobile);
    }
    
    setupKeyboardHandlers() {
        // Register keyboard event handlers for terminal commands
        this.keyboard.registerHandler('enter', (data) => {
            if (data.input.trim()) {
                this.handleCommand(data.input);
            }
        });
        
        this.keyboard.registerHandler('escape', () => {
            this.hide();
        });
        
        this.keyboard.registerHandler('ctrlL', () => {
            this.clearTerminal();
        });
    }
    
    async handleCommand(input) {
        const parsed = this.parser.parseCommand(input);
        const result = await this.handlers.executeCommand(parsed);
        
        if (result.clearScreen) {
            this.clearTerminal();
        } else if (result.message) {
            this.displayMessage(result.message);
        }
        
        // Handle specific actions
        if (result.action) {
            this.handleAction(result.action, result.target);
        }
    }
    
    handleAction(action, target) {
        // This would trigger the appropriate stargate interface actions
        switch (action) {
            case 'undock':
                this.hide();
                break;
            case 'refuel':
                this.triggerRefuel();
                break;
            case 'repair':
                this.triggerRepair(target);
                break;
            case 'enhance':
                this.triggerUpgrade(target);
                break;
            case 'purchase':
                this.triggerPurchase(target);
                break;
            // Add more actions as needed
        }
    }
    
    displayMessage(message) {
        // This would display the message in a terminal-style interface
        console.log('Terminal:', message);
    }
    
    clearTerminal() {
        // Clear terminal display
        console.clear();
    }
    
    // Delegate methods to modules
    createStyles() {
        this.effects.createStyles();
    }
    
    createDockingPrompt() {
        return this.screen.createDockingPrompt();
    }
    
    createMainUI() {
        return this.screen.createMainUI();
    }
    
    getMainUIContent() {
        return this.messages.getMainUIContent();
    }
    
    getUpgradesContent() {
        return this.messages.getUpgradesContent();
    }
    
    showDockingPrompt() {
        this.screen.showDockingPrompt();
    }
    
    hideDockingPrompt() {
        this.screen.hideDockingPrompt();
    }
    
    show() {
        this.screen.showUI();
        this.keyboard.activate();
    }
    
    hide() {
        this.screen.hideUI();
        this.keyboard.deactivate();
    }
    
    // Event trigger methods for stargate interface integration
    triggerRefuel() {
        // To be implemented by the parent stargate interface
        console.log('Refuel triggered');
    }
    
    triggerRepair(system) {
        // To be implemented by the parent stargate interface
        console.log('Repair triggered for:', system);
    }
    
    triggerUpgrade(system) {
        // To be implemented by the parent stargate interface
        console.log('Upgrade triggered for:', system);
    }
    
    triggerPurchase(item) {
        // To be implemented by the parent stargate interface
        console.log('Purchase triggered for:', item);
    }
}