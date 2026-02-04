// keyboard.ts - Keyboard event handling and input management

interface KeyboardData {
    input?: string;
    character?: string;
    text?: string;
    functionNumber?: number;
    key?: string;
    modifiers: {
        shift: boolean;
        ctrl: boolean;
        alt: boolean;
    };
}

export class TerminalKeyboard {
    private keyHandlers: Map<string, ((data: KeyboardData) => void)[]>;
    private inputBuffer: string;
    private isActive: boolean;
    private modifiers: {
        shift: boolean;
        ctrl: boolean;
        alt: boolean;
    };

    constructor() {
        this.keyHandlers = new Map();
        this.inputBuffer = '';
        this.isActive = false;
        this.modifiers = {
            shift: false,
            ctrl: false,
            alt: false
        };
        this.setupEventListeners();
    }
    
    setupEventListeners(): void {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
        document.addEventListener('keypress', this.handleKeyPress.bind(this));
    }
    
    handleKeyDown(event: KeyboardEvent): void {
        if (!this.isActive) return;
        
        this.updateModifiers(event, true);
        
        // Handle special keys
        switch (event.code) {
            case 'Enter':
                this.handleEnter(event);
                break;
            case 'Escape':
                this.handleEscape(event);
                break;
            case 'Tab':
                this.handleTab(event);
                break;
            case 'ArrowUp':
                this.handleArrowUp(event);
                break;
            case 'ArrowDown':
                this.handleArrowDown(event);
                break;
            case 'Backspace':
                this.handleBackspace(event);
                break;
            case 'Delete':
                this.handleDelete(event);
                break;
            case 'Home':
                this.handleHome(event);
                break;
            case 'End':
                this.handleEnd(event);
                break;
            default:
                // Handle function keys and other special keys
                if (event.code.startsWith('F')) {
                    this.handleFunctionKey(event);
                }
                break;
        }
        
        // Handle key combinations
        if (this.modifiers.ctrl) {
            this.handleCtrlCombination(event);
        }
        
        if (this.modifiers.alt) {
            this.handleAltCombination(event);
        }
    }
    
    handleKeyUp(event: KeyboardEvent): void {
        this.updateModifiers(event, false);
    }
    
    handleKeyPress(event: KeyboardEvent): void {
        if (!this.isActive) return;
        
        // Handle printable characters
        if (event.charCode >= 32 && event.charCode <= 126) {
            this.handleCharacterInput(event.key);
        }
    }
    
    updateModifiers(event: KeyboardEvent, pressed: boolean): void {
        if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
            this.modifiers.shift = pressed;
        }
        if (event.code === 'ControlLeft' || event.code === 'ControlRight') {
            this.modifiers.ctrl = pressed;
        }
        if (event.code === 'AltLeft' || event.code === 'AltRight') {
            this.modifiers.alt = pressed;
        }
    }
    
    handleEnter(event: KeyboardEvent): void {
        event.preventDefault();
        this.triggerHandler('enter', {
            input: this.inputBuffer,
            modifiers: { ...this.modifiers }
        });
        this.inputBuffer = '';
    }
    
    handleEscape(event: KeyboardEvent): void {
        event.preventDefault();
        this.triggerHandler('escape', {
            modifiers: { ...this.modifiers }
        });
        this.inputBuffer = '';
    }
    
    handleTab(event: KeyboardEvent): void {
        event.preventDefault();
        this.triggerHandler('tab', {
            input: this.inputBuffer,
            modifiers: { ...this.modifiers }
        });
    }
    
    handleArrowUp(event: KeyboardEvent): void {
        event.preventDefault();
        this.triggerHandler('arrowUp', {
            modifiers: { ...this.modifiers }
        });
    }
    
    handleArrowDown(event: KeyboardEvent): void {
        event.preventDefault();
        this.triggerHandler('arrowDown', {
            modifiers: { ...this.modifiers }
        });
    }
    
    handleBackspace(event: KeyboardEvent): void {
        event.preventDefault();
        if (this.inputBuffer.length > 0) {
            this.inputBuffer = this.inputBuffer.slice(0, -1);
            this.triggerHandler('backspace', {
                input: this.inputBuffer,
                modifiers: { ...this.modifiers }
            });
        }
    }
    
    handleDelete(event: KeyboardEvent): void {
        event.preventDefault();
        this.triggerHandler('delete', {
            input: this.inputBuffer,
            modifiers: { ...this.modifiers }
        });
    }
    
    handleHome(event: KeyboardEvent): void {
        event.preventDefault();
        this.triggerHandler('home', {
            modifiers: { ...this.modifiers }
        });
    }
    
    handleEnd(event: KeyboardEvent): void {
        event.preventDefault();
        this.triggerHandler('end', {
            modifiers: { ...this.modifiers }
        });
    }
    
    handleFunctionKey(event: KeyboardEvent): void {
        event.preventDefault();
        const functionNumber = parseInt(event.code.substring(1));
        this.triggerHandler('function', {
            functionNumber,
            modifiers: { ...this.modifiers }
        });
    }
    
    handleCtrlCombination(event: KeyboardEvent): void {
        switch (event.code) {
            case 'KeyC':
                event.preventDefault();
                this.triggerHandler('ctrlC', {
                    input: this.inputBuffer,
                    modifiers: { ...this.modifiers }
                });
                break;
            case 'KeyV':
                event.preventDefault();
                this.handlePaste();
                break;
            case 'KeyA':
                event.preventDefault();
                this.triggerHandler('ctrlA', {
                    input: this.inputBuffer,
                    modifiers: { ...this.modifiers }
                });
                break;
            case 'KeyL':
                event.preventDefault();
                this.triggerHandler('ctrlL', {
                    modifiers: { ...this.modifiers }
                });
                break;
        }
    }
    
    handleAltCombination(event: KeyboardEvent): void {
        // Handle Alt+key combinations
        this.triggerHandler('alt', {
            key: event.code,
            modifiers: { ...this.modifiers }
        });
    }
    
    handleCharacterInput(character: string): void {
        this.inputBuffer += character;
        this.triggerHandler('character', {
            character,
            input: this.inputBuffer,
            modifiers: { ...this.modifiers }
        });
    }
    
    async handlePaste(): Promise<void> {
        try {
            const text = await navigator.clipboard.readText();
            this.inputBuffer += text;
            this.triggerHandler('paste', {
                text,
                input: this.inputBuffer,
                modifiers: { ...this.modifiers }
            });
        } catch (error) {
            console.warn('Clipboard access failed:', error);
        }
    }
    
    registerHandler(event: string, callback: (data: KeyboardData) => void): void {
        if (!this.keyHandlers.has(event)) {
            this.keyHandlers.set(event, []);
        }
        this.keyHandlers.get(event)!.push(callback);
    }
    
    unregisterHandler(event: string, callback: (data: KeyboardData) => void): void {
        const handlers = this.keyHandlers.get(event);
        if (handlers) {
            const index = handlers.indexOf(callback);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }
    
    triggerHandler(event: string, data: KeyboardData): void {
        const handlers = this.keyHandlers.get(event);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Error in ${event} handler:`, error);
                }
            });
        }
    }
    
    activate(): void {
        this.isActive = true;
        this.inputBuffer = '';
    }
    
    deactivate(): void {
        this.isActive = false;
        this.inputBuffer = '';
    }
    
    clearInput(): void {
        this.inputBuffer = '';
    }
    
    getInput(): string {
        return this.inputBuffer;
    }
    
    setInput(text: string): void {
        this.inputBuffer = text || '';
    }
}
