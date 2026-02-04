// terminalView.ts - Main terminal view coordinator

// Import all terminal modules
import { TerminalScreen } from './terminal/display/screen.js';
import { TerminalEffects } from './terminal/display/effects.js';
import { CommandParser } from './terminal/commands/parser.js';
import { CommandHandlers } from './terminal/commands/handlers.js';
import { TerminalMessages } from './terminal/content/messages.js';
import { TerminalAscii } from './terminal/content/ascii.js';
import { TerminalKeyboard } from './terminal/input/keyboard.js';

interface CommandResult {
    clearScreen?: boolean;
    message?: string;
    action?: string;
    target?: string;
}

interface ParsedCommand {
    command: string;
    args: string[];
}

export class TerminalView {
    private isMobile: boolean;
    private screen: TerminalScreen;
    private effects: TerminalEffects;
    private parser: CommandParser;
    private handlers: CommandHandlers;
    private messages: TerminalMessages;
    private ascii: TerminalAscii;
    private keyboard: TerminalKeyboard;
    
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
    
    setMobile(isMobile: boolean): void {
        this.isMobile = isMobile;
        this.screen.setMobile(isMobile);
    }
    
    setupKeyboardHandlers(): void {
        // Register keyboard event handlers for terminal commands
        this.keyboard.registerHandler('enter', (data: { input: string }) => {
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
    
    async handleCommand(input: string): Promise<void> {
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
    
    handleAction(action: string, target?: string): void {
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
    
    displayMessage(message: string): void {
        // This would display the message in a terminal-style interface
        console.log('Terminal:', message);
    }
    
    clearTerminal(): void {
        // Clear terminal display
        console.clear();
    }
    
    // Delegate methods to modules
    createStyles(): void {
        this.effects.createStyles();
    }
    
    createDockingPrompt(): string {
        return this.screen.createDockingPrompt();
    }
    
    createMainUI(): string {
        return this.screen.createMainUI();
    }
    
    getMainUIContent(): string {
        return this.messages.getMainUIContent();
    }
    
    getUpgradesContent(): string {
        return this.messages.getUpgradesContent();
    }
    
    showDockingPrompt(): void {
        this.screen.showDockingPrompt();
    }
    
    hideDockingPrompt(): void {
        this.screen.hideDockingPrompt();
    }
    
    show(): void {
        this.screen.showUI();
        this.keyboard.activate();
    }
    
    hide(): void {
        this.screen.hideUI();
        this.keyboard.deactivate();
    }
    
    // Event trigger methods for stargate interface integration
    triggerRefuel(): void {
        // To be implemented by the parent stargate interface
        console.log('Refuel triggered');
    }
    
    triggerRepair(system?: string): void {
        // To be implemented by the parent stargate interface
        console.log('Repair triggered for:', system);
    }
    
    triggerUpgrade(system?: string): void {
        // To be implemented by the parent stargate interface
        console.log('Upgrade triggered for:', system);
    }
    
    triggerPurchase(item?: string): void {
        // To be implemented by the parent stargate interface
        console.log('Purchase triggered for:', item);
    }
}
