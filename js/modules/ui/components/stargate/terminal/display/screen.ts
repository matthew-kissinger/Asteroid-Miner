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
        dockingPrompt.classList.add('stargate-docking-prompt');
        
        if (this.isMobile) {
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
            stargateUI.classList.add('stargate-ui-mobile-initial');
        }
        
        return stargateUI;
    }
    
    showDockingPrompt(): void {
        const dockingPrompt = document.getElementById('docking-prompt');
        if (dockingPrompt && dockingPrompt.dataset.alwaysHide !== 'true') {
            dockingPrompt.classList.add('stargate-docking-prompt-visible');
        }
    }
    
    hideDockingPrompt(): void {
        const dockingPrompt = document.getElementById('docking-prompt');
        if (dockingPrompt) {
            dockingPrompt.classList.remove('stargate-docking-prompt-visible');
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
            ui.classList.add('stargate-ui-visible');
        }
    }
    
    hideUI(): void {
        const ui = document.getElementById('stargate-ui');
        if (ui) {
            ui.classList.remove('stargate-ui-visible');
        }
    }
}
