// ascii.js - ASCII art, animations, and visual content

export class TerminalAscii {
    constructor() {
        this.animationFrames = new Map();
        this.currentAnimations = new Map();
    }
    
    getStargateArt() {
        return `
    ╔════════════════════════════════════════════════════════════════╗
    ║                        STARGATE TERMINAL                       ║
    ║                      ┌─────────────────┐                      ║
    ║                      │  ◆ ◇ ◆ ◇ ◆ ◇ ◆  │                      ║
    ║                      │ ◇   QUANTUM   ◇ │                      ║
    ║                      │ ◆  LINK CORE  ◆ │                      ║
    ║                      │ ◇             ◇ │                      ║
    ║                      │  ◆ ◇ ◆ ◇ ◆ ◇ ◆  │                      ║
    ║                      └─────────────────┘                      ║
    ╚════════════════════════════════════════════════════════════════╝
        `;
    }
    
    getShipArt() {
        return `
              ▲
             ╱ ╲
            ╱───╲
           ╱     ╲
          │ ◆   ◆ │
          │   ▼   │
          ╲       ╱
           ╲─────╱
            ╲   ╱
             ╲ ╱
              ▼
        `;
    }
    
    getLoadingAnimation() {
        return [
            '⠋ Processing...',
            '⠙ Processing...',
            '⠹ Processing...',
            '⠸ Processing...',
            '⠼ Processing...',
            '⠴ Processing...',
            '⠦ Processing...',
            '⠧ Processing...',
            '⠇ Processing...',
            '⠏ Processing...'
        ];
    }
    
    getProgressBar(percentage, width = 20) {
        const filled = Math.floor((percentage / 100) * width);
        const empty = width - filled;
        return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${percentage}%`;
    }
    
    getSystemStatus(systems) {
        const statusChars = {
            online: '●',
            offline: '○',
            warning: '◐',
            error: '◯'
        };
        
        let art = '    SYSTEM STATUS\n';
        art += '    ┌─────────────────┐\n';
        
        for (const [name, status] of Object.entries(systems)) {
            const char = statusChars[status] || '?';
            const color = this.getStatusColor(status);
            art += `    │ ${char} ${name.padEnd(13)} │\n`;
        }
        
        art += '    └─────────────────┘';
        return art;
    }
    
    getStatusColor(status) {
        const colors = {
            online: '#00ff00',
            offline: '#666666',
            warning: '#ffaa00',
            error: '#ff0000'
        };
        return colors[status] || '#ffffff';
    }
    
    getResourceMeter(resource, amount, max) {
        const percentage = Math.min(100, (amount / max) * 100);
        const bars = Math.floor(percentage / 10);
        const meter = '█'.repeat(bars) + '░'.repeat(10 - bars);
        
        return `${resource.toUpperCase().padEnd(8)} [${meter}] ${amount}/${max}`;
    }
    
    getBanner(text) {
        const width = Math.max(text.length + 4, 20);
        const line = '═'.repeat(width);
        const padding = ' '.repeat(Math.floor((width - text.length) / 2));
        
        return `
╔${line}╗
║${padding}${text}${padding}║
╚${line}╝`;
    }
    
    getAlert(message, type = 'info') {
        const icons = {
            info: 'ℹ',
            warning: '⚠',
            error: '✕',
            success: '✓'
        };
        
        const icon = icons[type] || 'ℹ';
        const border = type === 'error' ? '!' : type === 'warning' ? '!' : '-';
        const line = border.repeat(message.length + 6);
        
        return `
${line}
${border} ${icon} ${message} ${border}
${line}`;
    }
    
    getConnectionAnimation() {
        return [
            'Connecting    .',
            'Connecting   ..',
            'Connecting  ...',
            'Connecting .... ',
            'Connecting....  ',
            'Connecting...   ',
            'Connecting..    ',
            'Connecting.     '
        ];
    }
    
    getQuantumPattern() {
        return `
    ◆ ◇ ◆ ◇ ◆ ◇ ◆ ◇ ◆
    ◇ ◆ ◇ ◆ ◇ ◆ ◇ ◆ ◇
    ◆ ◇ ◆ ◇ ◆ ◇ ◆ ◇ ◆
    ◇ ◆ ◇ ◆ ◇ ◆ ◇ ◆ ◇
    ◆ ◇ ◆ ◇ ◆ ◇ ◆ ◇ ◆
        `;
    }
    
    startAnimation(name, frames, interval = 500) {
        if (this.currentAnimations.has(name)) {
            this.stopAnimation(name);
        }
        
        let frameIndex = 0;
        const animation = setInterval(() => {
            frameIndex = (frameIndex + 1) % frames.length;
            this.animationFrames.set(name, frames[frameIndex]);
        }, interval);
        
        this.currentAnimations.set(name, animation);
        this.animationFrames.set(name, frames[0]);
    }
    
    stopAnimation(name) {
        const animation = this.currentAnimations.get(name);
        if (animation) {
            clearInterval(animation);
            this.currentAnimations.delete(name);
            this.animationFrames.delete(name);
        }
    }
    
    getAnimationFrame(name) {
        return this.animationFrames.get(name) || '';
    }
    
    createMatrix(rows, cols, char = '█') {
        let matrix = '';
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                matrix += Math.random() > 0.7 ? char : ' ';
            }
            matrix += '\n';
        }
        return matrix;
    }
    
    getHordeWarning() {
        return `
██╗  ██╗ ██████╗ ██████╗ ██████╗ ███████╗
██║  ██║██╔═══██╗██╔══██╗██╔══██╗██╔════╝
███████║██║   ██║██████╔╝██║  ██║█████╗  
██╔══██║██║   ██║██╔══██╗██║  ██║██╔══╝  
██║  ██║╚██████╔╝██║  ██║██████╔╝███████╗
╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═════╝ ╚══════╝
                                         
 ██╗    ██╗ █████╗ ██████╗ ███╗   ██╗██╗███╗   ██╗ ██████╗ 
 ██║    ██║██╔══██╗██╔══██╗████╗  ██║██║████╗  ██║██╔════╝ 
 ██║ █╗ ██║███████║██████╔╝██╔██╗ ██║██║██╔██╗ ██║██║  ███╗
 ██║███╗██║██╔══██║██╔══██╗██║╚██╗██║██║██║╚██╗██║██║   ██║
 ╚███╔███╔╝██║  ██║██║  ██║██║ ╚████║██║██║ ╚████║╚██████╔╝
  ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝╚═╝  ╚═══╝ ╚═════╝ 
        `;
    }
}