// targetingUI.js - Handles the targeting UI components

export class TargetingUI {
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
        
        // Add diagonal lines for better targeting visual
        const diagonalLines = document.createElement('div');
        diagonalLines.style.position = 'absolute';
        diagonalLines.style.width = '100%';
        diagonalLines.style.height = '100%';
        diagonalLines.style.top = '0';
        diagonalLines.style.left = '0';
        diagonalLines.innerHTML = `
            <div style="position: absolute; width: 2px; height: 30px; background-color: #ff0000; top: 0; left: 50%; transform: translateX(-50%);"></div>
            <div style="position: absolute; width: 2px; height: 30px; background-color: #ff0000; bottom: 0; left: 50%; transform: translateX(-50%);"></div>
            <div style="position: absolute; width: 30px; height: 2px; background-color: #ff0000; left: 0; top: 50%; transform: translateY(-50%);"></div>
            <div style="position: absolute; width: 30px; height: 2px; background-color: #ff0000; right: 0; top: 50%; transform: translateY(-50%);"></div>
        `;
        lockOnDisplay.appendChild(diagonalLines);
        
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
            <div id="target-resource" style="color: #ffcc00;">Resource: Unknown</div>
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
        const targetResourceElement = document.getElementById('target-resource');
        
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
    addPulseEffect(element) {
        // Remove any existing animation
        element.style.animation = 'none';
        
        // Force reflow
        void element.offsetWidth;
        
        // Add pulse animation
        element.style.animation = 'targetPulse 2s infinite';
        
        // Add CSS keyframes if not already present
        if (!document.getElementById('targeting-keyframes')) {
            const style = document.createElement('style');
            style.id = 'targeting-keyframes';
            style.textContent = `
                @keyframes targetPulse {
                    0% { box-shadow: 0 0 10px #ff3030; }
                    50% { box-shadow: 0 0 20px #ff3030; }
                    100% { box-shadow: 0 0 10px #ff3030; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    hideTargetInfo() {
        const targetIndicator = document.getElementById('target-indicator');
        if (targetIndicator) {
            targetIndicator.style.display = 'none';
        }
    }
} 