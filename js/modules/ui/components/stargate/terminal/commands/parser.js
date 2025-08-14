// parser.js - Command parsing logic for terminal interface

export class CommandParser {
    constructor() {
        this.commandHistory = [];
        this.historyIndex = -1;
        this.aliases = new Map();
        this.setupAliases();
    }
    
    setupAliases() {
        // Common command aliases
        this.aliases.set('ls', 'list');
        this.aliases.set('dir', 'list');
        this.aliases.set('h', 'help');
        this.aliases.set('?', 'help');
        this.aliases.set('q', 'quit');
        this.aliases.set('exit', 'quit');
        this.aliases.set('cls', 'clear');
        this.aliases.set('clr', 'clear');
        this.aliases.set('buy', 'purchase');
        this.aliases.set('sell', 'market');
        this.aliases.set('upgrade', 'enhance');
        this.aliases.set('status', 'info');
        this.aliases.set('stat', 'info');
    }
    
    parseCommand(input) {
        if (!input || typeof input !== 'string') {
            return { command: '', args: [], original: '' };
        }
        
        const trimmed = input.trim();
        if (!trimmed) {
            return { command: '', args: [], original: input };
        }
        
        // Add to history if it's a new command
        if (this.commandHistory[this.commandHistory.length - 1] !== trimmed) {
            this.commandHistory.push(trimmed);
            // Limit history to 50 commands
            if (this.commandHistory.length > 50) {
                this.commandHistory.shift();
            }
        }
        this.historyIndex = this.commandHistory.length;
        
        // Parse command and arguments
        const parts = this.tokenize(trimmed);
        const rawCommand = parts[0]?.toLowerCase() || '';
        const command = this.resolveAlias(rawCommand);
        const args = parts.slice(1);
        
        return {
            command,
            args,
            original: trimmed,
            raw: rawCommand
        };
    }
    
    tokenize(input) {
        const tokens = [];
        let current = '';
        let inQuotes = false;
        let quoteChar = '';
        
        for (let i = 0; i < input.length; i++) {
            const char = input[i];
            
            if ((char === '"' || char === "'") && !inQuotes) {
                inQuotes = true;
                quoteChar = char;
            } else if (char === quoteChar && inQuotes) {
                inQuotes = false;
                quoteChar = '';
            } else if (char === ' ' && !inQuotes) {
                if (current) {
                    tokens.push(current);
                    current = '';
                }
            } else {
                current += char;
            }
        }
        
        if (current) {
            tokens.push(current);
        }
        
        return tokens;
    }
    
    resolveAlias(command) {
        return this.aliases.get(command) || command;
    }
    
    getCommandHistory() {
        return [...this.commandHistory];
    }
    
    getPreviousCommand() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            return this.commandHistory[this.historyIndex];
        }
        return null;
    }
    
    getNextCommand() {
        if (this.historyIndex < this.commandHistory.length - 1) {
            this.historyIndex++;
            return this.commandHistory[this.historyIndex];
        } else if (this.historyIndex === this.commandHistory.length - 1) {
            this.historyIndex++;
            return '';
        }
        return null;
    }
    
    validateCommand(command) {
        const validCommands = [
            'help', 'list', 'clear', 'quit', 'info', 'status',
            'purchase', 'market', 'enhance', 'upgrade', 'refuel',
            'repair', 'undock', 'dock', 'scan', 'navigate',
            'starmap', 'blackjack', 'settings', 'horde'
        ];
        
        return validCommands.includes(command);
    }
    
    getCommandSuggestions(partial) {
        const validCommands = [
            'help', 'list', 'clear', 'quit', 'info',
            'purchase', 'market', 'enhance', 'refuel',
            'repair', 'undock', 'dock', 'scan', 'navigate',
            'starmap', 'blackjack', 'settings', 'horde'
        ];
        
        return validCommands.filter(cmd => 
            cmd.startsWith(partial.toLowerCase())
        );
    }
}