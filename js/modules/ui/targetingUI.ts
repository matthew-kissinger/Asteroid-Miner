// targetingUI.js - Handles the targeting UI components

export class TargetingUI {
    constructor() {
        this.setupTargetingUI();
    }
    
    setupTargetingUI(): void {
        // Create lock-on display
        const lockOnDisplay = document.createElement('div');
        lockOnDisplay.id = 'lock-on-display';
        lockOnDisplay.classList.add('targeting-lock-display');
        document.body.appendChild(lockOnDisplay);
        
        // Add diagonal lines for better targeting visual
        const diagonalLines = document.createElement('div');
        diagonalLines.classList.add('targeting-diagonal-lines');
        diagonalLines.innerHTML = `
            <div class="targeting-line-v-top"></div>
            <div class="targeting-line-v-bottom"></div>
            <div class="targeting-line-h-left"></div>
            <div class="targeting-line-h-right"></div>
        `;
        lockOnDisplay.appendChild(diagonalLines);
        
        // Create target indicator for lock-on 
        const targetIndicator = document.createElement('div');
        targetIndicator.id = 'target-indicator';
        targetIndicator.classList.add('targeting-info-panel');
        
        // Add targeting information
        targetIndicator.innerHTML = `
            <div class="targeting-label">◎ TARGET LOCKED ◎</div>
            <div id="target-type">Asteroid</div>
            <div id="target-distance">Distance: 0 units</div>
            <div id="target-resource" class="targeting-resource">Resource: Unknown</div>
        `;
        
        document.body.appendChild(targetIndicator);
    }
    
    showLockOn(): void {
        const lockOnDisplay = document.getElementById('lock-on-display') as HTMLDivElement | null;
        if (lockOnDisplay) {
            lockOnDisplay.style.display = 'block';
        }
    }
    
    hideLockOn(): void {
        const lockOnDisplay = document.getElementById('lock-on-display') as HTMLDivElement | null;
        if (lockOnDisplay) {
            lockOnDisplay.style.display = 'none';
        }
    }
    
    updateTargetInfo(targetType: string, distance: number, resourceType?: string | null): void {
        const targetIndicator = document.getElementById('target-indicator') as HTMLDivElement | null;
        const targetTypeElement = document.getElementById('target-type') as HTMLDivElement | null;
        const targetDistanceElement = document.getElementById('target-distance') as HTMLDivElement | null;
        const targetResourceElement = document.getElementById('target-resource') as HTMLDivElement | null;
        
        if (targetIndicator && targetTypeElement && targetDistanceElement) {
            // Show the target indicator
            targetIndicator.style.display = 'block';
            
            // Update the target information
            targetTypeElement.textContent = `${targetType}`;
            targetDistanceElement.textContent = `Distance: ${Math.round(distance)} units`;
            
            // Set resource info with proper coloring based on type
            if (targetResourceElement && resourceType) {
                let resourceColor = '#cccccc'; // Default color
                
                // Set color based on resource type
                if (resourceType.toLowerCase() === 'iron') {
                    resourceColor = '#cccccc';
                } else if (resourceType.toLowerCase() === 'gold') {
                    resourceColor = '#ffcc00';
                } else if (resourceType.toLowerCase() === 'platinum') {
                    resourceColor = '#66ffff';
                }
                
                targetResourceElement.textContent = `Resource: ${resourceType}`;
                targetResourceElement.style.color = resourceColor;
            }
            
            // Add pulse animation effect
            this.addPulseEffect(targetIndicator);
        }
    }
    
    // Add a subtle pulse animation to the target indicator
    addPulseEffect(element: HTMLElement): void {
        // Remove any existing animation
        element.classList.remove('targeting-pulse');
        
        // Force reflow
        void element.offsetWidth;
        
        // Add pulse animation
        element.classList.add('targeting-pulse');
    }
    
    hideTargetInfo(): void {
        const targetIndicator = document.getElementById('target-indicator') as HTMLDivElement | null;
        if (targetIndicator) {
            targetIndicator.style.display = 'none';
        }
    }
} 
