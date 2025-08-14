// keyboard.js - Keyboard event handling and input management

export class TerminalKeyboard {
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
    
    setupEventListeners() {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
        document.addEventListener('keypress', this.handleKeyPress.bind(this));
    }
    
    handleKeyDown(event) {
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
    
    handleKeyUp(event) {
        this.updateModifiers(event, false);
    }
    
    handleKeyPress(event) {
        if (!this.isActive) return;
        
        // Handle printable characters
        if (event.charCode >= 32 && event.charCode <= 126) {
            this.handleCharacterInput(event.key);
        }
    }
    
    updateModifiers(event, pressed) {
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
    
    handleEnter(event) {
        event.preventDefault();
        this.triggerHandler('enter', {
            input: this.inputBuffer,
            modifiers: { ...this.modifiers }
        });
        this.inputBuffer = '';
    }
    
    handleEscape(event) {
        event.preventDefault();
        this.triggerHandler('escape', {
            modifiers: { ...this.modifiers }
        });
        this.inputBuffer = '';
    }
    
    handleTab(event) {
        event.preventDefault();
        this.triggerHandler('tab', {
            input: this.inputBuffer,
            modifiers: { ...this.modifiers }
        });
    }
    
    handleArrowUp(event) {
        event.preventDefault();
        this.triggerHandler('arrowUp', {
            modifiers: { ...this.modifiers }
        });
    }
    
    handleArrowDown(event) {
        event.preventDefault();
        this.triggerHandler('arrowDown', {
            modifiers: { ...this.modifiers }
        });
    }
    
    handleBackspace(event) {
        event.preventDefault();
        if (this.inputBuffer.length > 0) {
            this.inputBuffer = this.inputBuffer.slice(0, -1);
            this.triggerHandler('backspace', {
                input: this.inputBuffer,
                modifiers: { ...this.modifiers }
            });
        }
    }
    
    handleDelete(event) {
        event.preventDefault();
        this.triggerHandler('delete', {
            input: this.inputBuffer,
            modifiers: { ...this.modifiers }
        });
    }
    
    handleHome(event) {
        event.preventDefault();
        this.triggerHandler('home', {
            modifiers: { ...this.modifiers }
        });
    }
    
    handleEnd(event) {
        event.preventDefault();
        this.triggerHandler('end', {
            modifiers: { ...this.modifiers }
        });
    }
    
    handleFunctionKey(event) {
        event.preventDefault();
        const functionNumber = parseInt(event.code.substring(1));
        this.triggerHandler('function', {
            functionNumber,
            modifiers: { ...this.modifiers }
        });
    }
    
    handleCtrlCombination(event) {
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
    
    handleAltCombination(event) {
        // Handle Alt+key combinations
        this.triggerHandler('alt', {
            key: event.code,
            modifiers: { ...this.modifiers }
        });
    }
    
    handleCharacterInput(character) {
        this.inputBuffer += character;
        this.triggerHandler('character', {
            character,
            input: this.inputBuffer,
            modifiers: { ...this.modifiers }
        });
    }
    
    async handlePaste() {
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
    
    registerHandler(event, callback) {
        if (!this.keyHandlers.has(event)) {
            this.keyHandlers.set(event, []);
        }
        this.keyHandlers.get(event).push(callback);
    }
    
    unregisterHandler(event, callback) {
        const handlers = this.keyHandlers.get(event);
        if (handlers) {
            const index = handlers.indexOf(callback);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }
    
    triggerHandler(event, data) {
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
    
    activate() {
        this.isActive = true;
        this.inputBuffer = '';
    }
    
    deactivate() {
        this.isActive = false;
        this.inputBuffer = '';
    }
    
    clearInput() {
        this.inputBuffer = '';
    }
    
    getInput() {
        return this.inputBuffer;
    }
    
    setInput(text) {
        this.inputBuffer = text || '';
    }
}