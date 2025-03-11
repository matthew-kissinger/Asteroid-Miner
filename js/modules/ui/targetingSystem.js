// targetingSystem.js - Handles the targeting UI components

export class TargetingSystem {
    constructor() {
        this.setupTargetingUI();
    }
    
    setupTargetingUI() {
        // Create lock-on display
        const lockOnDisplay = document.createElement('div');
        lockOnDisplay.id = 'lock-on-display';
        lockOnDisplay.style.position = 'absolute';
        lockOnDisplay.style.top = '50%';
        lockOnDisplay.style.left = '50%';
        lockOnDisplay.style.width = '150px';
        lockOnDisplay.style.height = '150px';
        lockOnDisplay.style.transform = 'translate(-50%, -50%)';
        lockOnDisplay.style.border = '2px dashed #ff0000';
        lockOnDisplay.style.borderRadius = '50%';
        lockOnDisplay.style.boxSizing = 'border-box';
        lockOnDisplay.style.display = 'none';
        lockOnDisplay.style.zIndex = '997';
        lockOnDisplay.style.pointerEvents = 'none';
        document.body.appendChild(lockOnDisplay);
        
        // Create target indicator for lock-on 
        const targetIndicator = document.createElement('div');
        targetIndicator.id = 'target-indicator';
        targetIndicator.style.position = 'absolute';
        targetIndicator.style.bottom = '120px';
        targetIndicator.style.left = '50%';
        targetIndicator.style.transform = 'translateX(-50%)';
        targetIndicator.style.width = '200px';
        targetIndicator.style.textAlign = 'center';
        targetIndicator.style.backgroundColor = 'rgba(255, 50, 50, 0.4)';
        targetIndicator.style.border = '1px solid #ff3030';
        targetIndicator.style.borderRadius = '10px';
        targetIndicator.style.padding = '8px';
        targetIndicator.style.color = '#ffffff';
        targetIndicator.style.fontFamily = 'monospace';
        targetIndicator.style.zIndex = '100';
        targetIndicator.style.display = 'none';
        targetIndicator.style.boxShadow = '0 0 10px #ff3030';
        
        // Add targeting information
        targetIndicator.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px;">◎ TARGET LOCKED ◎</div>
            <div id="target-type">Asteroid</div>
            <div id="target-distance">Distance: 0 units</div>
        `;
        
        document.body.appendChild(targetIndicator);
    }
    
    showLockOn() {
        const lockOnDisplay = document.getElementById('lock-on-display');
        if (lockOnDisplay) {
            lockOnDisplay.style.display = 'block';
        }
    }
    
    hideLockOn() {
        const lockOnDisplay = document.getElementById('lock-on-display');
        if (lockOnDisplay) {
            lockOnDisplay.style.display = 'none';
        }
    }
    
    updateTargetInfo(targetType, distance, resourceType) {
        const targetIndicator = document.getElementById('target-indicator');
        const targetTypeElement = document.getElementById('target-type');
        const targetDistanceElement = document.getElementById('target-distance');
        
        if (targetIndicator && targetTypeElement && targetDistanceElement) {
            // Show the target indicator
            targetIndicator.style.display = 'block';
            
            // Update the target information
            targetTypeElement.textContent = `${targetType} (${resourceType})`;
            targetDistanceElement.textContent = `Distance: ${Math.round(distance)} units`;
        }
    }
    
    hideTargetInfo() {
        const targetIndicator = document.getElementById('target-indicator');
        if (targetIndicator) {
            targetIndicator.style.display = 'none';
        }
    }
} 