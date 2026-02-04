// ascii.ts - ASCII art, animations, and visual content

interface SystemStatus {
    [key: string]: 'online' | 'offline' | 'warning' | 'error';
}

export class TerminalAscii {
    private animationFrames: Map<string, string>;
    private currentAnimations: Map<string, number>;

    constructor() {
        this.animationFrames = new Map();
        this.currentAnimations = new Map();
    }
    
    getStargateArt(): string {
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
    
    getShipArt(): string {
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
    
    getLoadingAnimation(): string[] {
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
    
    getProgressBar(percentage: number, width = 20): string {
        const filled = Math.floor((percentage / 100) * width);
        const empty = width - filled;
        return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${percentage}%`;
    }
    
    getSystemStatus(systems: SystemStatus): string {
        const statusChars: Record<string, string> = {
            online: '●',
            offline: '○',
            warning: '◐',
            error: '◯'
        };
        
        let art = '    SYSTEM STATUS\n';
        art += '    ┌─────────────────┐\n';
        
        for (const [name, status] of Object.entries(systems)) {
            const char = statusChars[status] || '?';
            art += `    │ ${char} ${name.padEnd(13)} │\n`;
        }
        
        art += '    └─────────────────┘';
        return art;
    }
    
    getStatusColor(status: string): string {
        const colors: Record<string, string> = {
            online: '#00ff00',
            offline: '#666666',
            warning: '#ffaa00',
            error: '#ff0000'
        };
        return colors[status] || '#ffffff';
    }
    
    getResourceMeter(resource: string, amount: number, max: number): string {
        const percentage = Math.min(100, (amount / max) * 100);
        const bars = Math.floor(percentage / 10);
        const meter = '█'.repeat(bars) + '░'.repeat(10 - bars);
        
        return `${resource.toUpperCase().padEnd(8)} [${meter}] ${amount}/${max}`;
    }
    
    getBanner(text: string): string {
        const width = Math.max(text.length + 4, 20);
        const line = '═'.repeat(width);
        const padding = ' '.repeat(Math.floor((width - text.length) / 2));
        
        return `
╔${line}╗
║${padding}${text}${padding}║
╚${line}╝`;
    }
    
    getAlert(message: string, type = 'info'): string {
        const icons: Record<string, string> = {
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
    
    getConnectionAnimation(): string[] {
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
    
    getQuantumPattern(): string {
        return `
    ◆ ◇ ◆ ◇ ◆ ◇ ◆ ◇ ◆
    ◇ ◆ ◇ ◆ ◇ ◆ ◇ ◆ ◇
    ◆ ◇ ◆ ◇ ◆ ◇ ◆ ◇ ◆
    ◇ ◆ ◇ ◆ ◇ ◆ ◇ ◆ ◇
    ◆ ◇ ◆ ◇ ◆ ◇ ◆ ◇ ◆
        `;
    }
    
    startAnimation(name: string, frames: string[], interval = 500): void {
        if (this.currentAnimations.has(name)) {
            this.stopAnimation(name);
        }
        
        let frameIndex = 0;
        const animation = window.setInterval(() => {
            frameIndex = (frameIndex + 1) % frames.length;
            this.animationFrames.set(name, frames[frameIndex]);
        }, interval);
        
        this.currentAnimations.set(name, animation);
        this.animationFrames.set(name, frames[0]);
    }
    
    stopAnimation(name: string): void {
        const animation = this.currentAnimations.get(name);
        if (animation !== undefined) {
            clearInterval(animation);
            this.currentAnimations.delete(name);
            this.animationFrames.delete(name);
        }
    }
    
    getAnimationFrame(name: string): string {
        return this.animationFrames.get(name) || '';
    }
    
    createMatrix(rows: number, cols: number, char = '█'): string {
        let matrix = '';
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                matrix += Math.random() > 0.7 ? char : ' ';
            }
            matrix += '\n';
        }
        return matrix;
    }
    
    getHordeWarning(): string {
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
