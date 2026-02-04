// screen.ts - Terminal display rendering and DOM management

export class TerminalScreen {
    private isMobile: boolean;

    constructor() {
        this.isMobile = false;
    }
    
    setMobile(isMobile: boolean): void {
        this.isMobile = isMobile;
    }
    
    createDockingPrompt(): HTMLElement {
        const dockingPrompt = document.createElement('div');
        dockingPrompt.id = 'docking-prompt';
        dockingPrompt.style.position = 'absolute';
        dockingPrompt.style.top = '50%';
        dockingPrompt.style.left = '50%';
        dockingPrompt.style.transform = 'translate(-50%, -50%)';
        dockingPrompt.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        dockingPrompt.style.color = '#33aaff';
        dockingPrompt.style.padding = '20px';
        dockingPrompt.style.borderRadius = '10px';
        dockingPrompt.style.border = '2px solid #33aaff';
        dockingPrompt.style.boxShadow = '0 0 20px #33aaff';
        dockingPrompt.style.fontFamily = 'Courier New, monospace';
        dockingPrompt.style.fontSize = '18px';
        dockingPrompt.style.textAlign = 'center';
        dockingPrompt.style.zIndex = '1000';
        dockingPrompt.style.display = 'none';
        
        if (this.isMobile) {
            dockingPrompt.style.display = 'none';
            dockingPrompt.dataset.alwaysHide = 'true';
        } else {
            dockingPrompt.textContent = 'Press Q to dock with Stargate';
        }
        
        document.body.appendChild(dockingPrompt);
        return dockingPrompt;
    }
    
    createMainUI(): HTMLElement {
        const stargateUI = document.createElement('div');
        stargateUI.id = 'stargate-ui';
        
        if (this.isMobile) {
            stargateUI.style.width = '95%';
            stargateUI.style.maxWidth = '95vw';
            (stargateUI.style as any).webkitOverflowScrolling = 'touch';
            stargateUI.style.touchAction = 'pan-y';
            stargateUI.style.overscrollBehavior = 'contain';
        }
        
        return stargateUI;
    }
    
    showDockingPrompt(): void {
        const dockingPrompt = document.getElementById('docking-prompt');
        if (dockingPrompt && dockingPrompt.dataset.alwaysHide !== 'true') {
            dockingPrompt.style.display = 'block';
        }
    }
    
    hideDockingPrompt(): void {
        const dockingPrompt = document.getElementById('docking-prompt');
        if (dockingPrompt) {
            dockingPrompt.style.display = 'none';
        }
    }
    
    updateResourceDisplay(resource: string, value: string | number): void {
        const element = document.getElementById(`ms-${resource}`);
        if (element) {
            element.textContent = String(value);
        }
    }
    
    updateStatusBar(barId: string, percentage: number): void {
        const bar = document.getElementById(barId);
        if (bar) {
            bar.style.width = `${percentage}%`;
        }
    }
    
    updateCredits(credits: number): void {
        const element = document.getElementById('ms-credits');
        if (element) {
            element.textContent = `${credits} CR`;
        }
    }
    
    updateOrbCount(rarity: string, count: number): void {
        const element = document.getElementById(`orb-${rarity}-count`);
        if (element) {
            element.textContent = `${count} in inventory`;
        }
    }
    
    updateUpgradeLevel(upgradeType: string, level: number): void {
        const element = document.getElementById(`current-${upgradeType}-level`);
        if (element) {
            element.textContent = String(level);
        }
    }
    
    updateUpgradeProgress(upgradeType: string, percentage: number): void {
        const progressBar = document.getElementById(`${upgradeType}-upgrade-progress`);
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
    }
    
    updateUpgradeCost(upgradeType: string, cost: number): void {
        const element = document.getElementById(`${upgradeType}-upgrade-cost`);
        if (element) {
            element.textContent = String(cost);
        }
    }
    
    showUI(): void {
        const ui = document.getElementById('stargate-ui');
        if (ui) {
            ui.style.display = 'block';
        }
    }
    
    hideUI(): void {
        const ui = document.getElementById('stargate-ui');
        if (ui) {
            ui.style.display = 'none';
        }
    }
}
