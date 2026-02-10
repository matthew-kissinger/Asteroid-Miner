// terminalView.ts - Main terminal view coordinator

// Import all terminal modules
import { TerminalScreen } from './terminal/display/screen.ts';
import { TerminalEffects } from './terminal/display/effects.ts';
import { CommandParser } from './terminal/commands/parser.ts';
import { CommandHandlers } from './terminal/commands/handlers.ts';
import { TerminalMessages } from './terminal/content/messages.ts';
import { TerminalKeyboard } from './terminal/input/keyboard.ts';

export class TerminalView {
    private screen: TerminalScreen;
    private effects: TerminalEffects;
    private parser: CommandParser;
    private handlers: CommandHandlers;
    private messages: TerminalMessages;
    private keyboard: TerminalKeyboard;
    
    constructor() {
        // Initialize all modules
        this.screen = new TerminalScreen();
        this.effects = new TerminalEffects();
        this.parser = new CommandParser();
        this.handlers = new CommandHandlers(this);
        this.messages = new TerminalMessages();
        this.keyboard = new TerminalKeyboard();

        this.setupKeyboardHandlers();
    }

    setMobile(isMobile: boolean): void {
        this.screen.setMobile(isMobile);
    }
    
    setupKeyboardHandlers(): void {
        // Register keyboard event handlers for terminal commands
        this.keyboard.registerHandler('enter', (data) => {
            if (data.input?.trim()) {
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
    
    createDockingPrompt(): HTMLElement {
        return this.screen.createDockingPrompt();
    }

    createMainUI(): HTMLElement {
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
