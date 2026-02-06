// controlsMenu.js - Handles the controls menu UI

export class ControlsMenu {
    constructor() {
        this.setupControlsMenu();
    }
    
    setupControlsMenu(): void {
        // Create controls menu
        const controlsMenu = document.createElement('div');
        controlsMenu.id = 'controls-menu';
        controlsMenu.className = 'controls-menu';
        controlsMenu.style.display = 'none';
        document.body.appendChild(controlsMenu);
        
        // Controls menu header
        const controlsTitle = document.createElement('div');
        controlsTitle.className = 'help-title';
        controlsTitle.innerHTML = 'CONTROLS <span id="close-controls" style="float: right; cursor: pointer; font-weight: bold;">X</span>';
        controlsMenu.appendChild(controlsTitle);
        
        // Control rows
        const createControlRow = (keyText: string, actionText: string): HTMLDivElement => {
            const row = document.createElement('div');
            row.className = 'controls-menu-row';
            
            const keySpan = document.createElement('span');
            if (keyText !== 'Mouse') {
                keySpan.className = 'controls-menu-key';
            }
            keySpan.textContent = keyText;
            row.appendChild(keySpan);
            
            const actionSpan = document.createElement('span');
            actionSpan.textContent = actionText;
            row.appendChild(actionSpan);
            
            return row;
        };
        
        // Add all control rows
        controlsMenu.appendChild(createControlRow('W', 'Forward Thrust'));
        controlsMenu.appendChild(createControlRow('S', 'Backward Thrust'));
        controlsMenu.appendChild(createControlRow('A', 'Left Thrust'));
        controlsMenu.appendChild(createControlRow('D', 'Right Thrust'));
        controlsMenu.appendChild(createControlRow('SHIFT', 'Boost'));
        controlsMenu.appendChild(createControlRow('Mouse', 'Ship Rotation'));
        controlsMenu.appendChild(createControlRow('Click', 'Fire Particle Cannon'));
        controlsMenu.appendChild(createControlRow('E', 'Target Lock-On'));
        controlsMenu.appendChild(createControlRow('TAB', 'Cycle Targets'));
        controlsMenu.appendChild(createControlRow('R', 'Toggle Mining'));
        controlsMenu.appendChild(createControlRow('T', 'Deploy Laser Turret'));
        controlsMenu.appendChild(createControlRow('Q', 'Dock with Stargate'));
        
        // Set up event listeners for the controls menu
        const closeControls = document.getElementById('close-controls');
        if (closeControls) {
            closeControls.addEventListener('click', () => {
                this.hide();
            });
        }

        // Close menu when clicking outside of it
        document.addEventListener('click', (e: MouseEvent) => {
            const controlsMenu = document.getElementById('controls-menu') as HTMLDivElement | null;
            const showControlsButton = document.getElementById('show-controls') as HTMLButtonElement | null;
            
            if (!controlsMenu) return;
            
            if (controlsMenu.style.display === 'block' && 
                !controlsMenu.contains(e.target as Node) && 
                e.target !== showControlsButton) {
                this.hide();
            }
        });
    }
    
    show(): void {
        const controlsMenu = document.getElementById('controls-menu') as HTMLDivElement | null;
        if (controlsMenu) {
            controlsMenu.style.display = 'block';
        }
    }
    
    hide(): void {
        const controlsMenu = document.getElementById('controls-menu') as HTMLDivElement | null;
        if (controlsMenu) {
            controlsMenu.style.display = 'none';
        }
    }
    
    setupButtonHandler(): void {
        // Add click handler for the show controls button
        const showControlsButton = document.getElementById('show-controls') as HTMLButtonElement | null;
        if (showControlsButton) {
            showControlsButton.addEventListener('click', (e: MouseEvent) => {
                this.show();
                e.stopPropagation(); // Prevent click from passing through
            });
        }
    }
} 
