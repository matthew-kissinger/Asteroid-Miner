// canvasRenderer.ts - Handles star map canvas rendering

interface StarSystem {
    name: string;
    position: { x: number; y: number };
    starColor?: number;
    connections: string[];
}

interface StarSystemGenerator {
    getAllSystems(): Record<string, StarSystem>;
    currentSystem: string;
    warpGates: Record<string, string[]>;
}

export class CanvasRenderer {
    private isMobile: boolean;

    constructor(isMobile: boolean) {
        this.isMobile = isMobile;
    }

    // Draw the star map on the canvas
    updateCanvas(starSystemGenerator: StarSystemGenerator): void {
        const canvas = document.getElementById('star-map-canvas') as HTMLCanvasElement;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Define the center of the canvas
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Get systems data
        const systems = starSystemGenerator.getAllSystems();
        const currentSystem = starSystemGenerator.currentSystem;
        const connections = starSystemGenerator.warpGates;
        
        // First draw connections
        this.drawConnections(ctx, centerX, centerY, systems, connections);
        
        // Highlight connections from current system
        this.drawCurrentSystemConnections(ctx, centerX, centerY, systems, currentSystem);
        
        // Now draw systems
        this.drawSystems(ctx, centerX, centerY, systems, currentSystem);
    }

    drawConnections(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, systems: Record<string, StarSystem>, connections: Record<string, string[]>): void {
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(48, 207, 208, 0.4)';
        
        for (const [systemId, connectedSystems] of Object.entries(connections)) {
            const system = systems[systemId];
            if (!system) continue;
            
            // Convert system position to canvas position
            const x1 = centerX + system.position.x;
            const y1 = centerY + system.position.y;
            
            for (const connectedId of connectedSystems) {
                const connectedSystem = systems[connectedId];
                if (!connectedSystem) continue;
                
                // Convert connected system position to canvas position
                const x2 = centerX + connectedSystem.position.x;
                const y2 = centerY + connectedSystem.position.y;
                
                // Draw the connection
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
        }
    }

    drawCurrentSystemConnections(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, systems: Record<string, StarSystem>, currentSystem: string): void {
        if (currentSystem && systems[currentSystem]) {
            const currentSystemData = systems[currentSystem];
            const x1 = centerX + currentSystemData.position.x;
            const y1 = centerY + currentSystemData.position.y;
            
            ctx.lineWidth = this.isMobile ? 3 : 2;
            ctx.strokeStyle = 'rgba(48, 207, 208, 0.8)';
            
            for (const connectedId of currentSystemData.connections) {
                const connectedSystem = systems[connectedId];
                if (!connectedSystem) continue;
                
                // Convert connected system position to canvas position
                const x2 = centerX + connectedSystem.position.x;
                const y2 = centerY + connectedSystem.position.y;
                
                // Draw the connection
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
        }
    }

    drawSystems(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, systems: Record<string, StarSystem>, currentSystem: string, selectedSystem: string | null = null): void {
        // Now draw systems
        for (const [systemId, system] of Object.entries(systems)) {
            // Convert system position to canvas position
            const x = centerX + system.position.x;
            const y = centerY + system.position.y;
            
            // Determine if it's the current system, selected system, or regular
            const isCurrent = systemId === currentSystem;
            const isSelected = systemId === selectedSystem;
            const isConnected = currentSystem && systems[currentSystem] && 
                                systems[currentSystem].connections.includes(systemId);
            
            // Draw a circle for the system
            ctx.beginPath();
            
            // Size based on status and device
            let radius: number;
            if (this.isMobile) {
                radius = isCurrent ? 18 : isSelected ? 15 : 10;
            } else {
                radius = isCurrent ? 15 : isSelected ? 12 : 8;
            }
            
            // Fill color based on star class
            ctx.fillStyle = system.starColor ? `#${system.starColor.toString(16).padStart(6, '0')}` : '#ffffff';
            
            // Add glow for current and selected
            if (isCurrent || isSelected) {
                ctx.shadowBlur = this.isMobile ? 20 : 15;
                ctx.shadowColor = isCurrent ? '#30cfd0' : '#ffffff';
            } else {
                ctx.shadowBlur = 0;
            }
            
            // Draw the star
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Reset shadow
            ctx.shadowBlur = 0;
            
            // Draw border for connected systems
            if (isConnected && !isCurrent) {
                ctx.strokeStyle = '#30cfd0';
                ctx.lineWidth = this.isMobile ? 3 : 2;
                ctx.beginPath();
                ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
                ctx.stroke();
            }
            
            // Draw name label
            ctx.fillStyle = isCurrent ? '#30cfd0' : isSelected ? '#ffffff' : '#aaaaaa';
            ctx.font = isCurrent ? 
                      (this.isMobile ? 'bold 14px Courier New' : 'bold 12px Courier New') : 
                      (this.isMobile ? '12px Courier New' : '10px Courier New');
            ctx.textAlign = 'center';
            ctx.fillText(system.name, x, y + radius + (this.isMobile ? 18 : 15));
        }
    }

    // Find which system was clicked (if any)
    findSystemAtPosition(x: number, y: number, starSystemGenerator: StarSystemGenerator): string | null {
        const systems = starSystemGenerator.getAllSystems();
        const currentSystem = starSystemGenerator.currentSystem;
        
        // Define the center of the canvas
        const centerX = 250;
        const centerY = 250;
        
        // Check each system
        for (const [systemId, system] of Object.entries(systems)) {
            // Convert system position to canvas position
            const canvasX = centerX + system.position.x;
            const canvasY = centerY + system.position.y;
            
            // Calculate distance from click to star
            const dx = x - canvasX;
            const dy = y - canvasY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // If click is within the star's radius (make current system bigger)
            // Use larger tap area for mobile
            const radius = systemId === currentSystem ? 
                          (this.isMobile ? 20 : 15) : 
                          (this.isMobile ? 15 : 10);
            if (distance <= radius) {
                return systemId;
            }
        }
        
        return null;
    }
}
