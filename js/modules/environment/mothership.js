// mothership.js - Creates and manages the mothership

export class Mothership {
    constructor(scene) {
        this.scene = scene;
        this.mothership = null;
        this.navLights = [];
        this.createMothership();
    }
    
    createMothership() {
        // Create a large space station/mothership model above the sun
        const mothershipGroup = new THREE.Group();
        mothershipGroup.name = 'mothership';
        
        // Main mothership body - large cylindrical structure
        const bodyGeometry = new THREE.CylinderGeometry(800, 800, 1600, 16, 1);
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: 0x888899,
            emissive: 0x222233,
            emissiveIntensity: 0.2,
            shininess: 30
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.rotation.x = Math.PI / 2; // Rotate to be horizontal
        mothershipGroup.add(body);
        
        // Add a ring around the middle
        const ringGeometry = new THREE.TorusGeometry(1000, 80, 16, 50);
        const ringMaterial = new THREE.MeshPhongMaterial({
            color: 0x99aacc,
            emissive: 0x223344,
            emissiveIntensity: 0.3
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        mothershipGroup.add(ring);
        
        // Add docking bay - open area in the front
        const dockGeometry = new THREE.CylinderGeometry(400, 400, 200, 16, 1, true);
        const dockMaterial = new THREE.MeshPhongMaterial({
            color: 0x336699,
            emissive: 0x224466,
            emissiveIntensity: 0.5,
            side: THREE.DoubleSide
        });
        const dock = new THREE.Mesh(dockGeometry, dockMaterial);
        dock.position.set(0, 0, 800); // Position at the front
        dock.rotation.x = Math.PI / 2;
        mothershipGroup.add(dock);
        
        // Add lights around the docking bay
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const light = new THREE.PointLight(0x33aaff, 1, 1200);
            light.position.set(
                Math.cos(angle) * 480,
                Math.sin(angle) * 480,
                800
            );
            mothershipGroup.add(light);
            
            // Add a small sphere to represent the light source
            const lightBulb = new THREE.Mesh(
                new THREE.SphereGeometry(40, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0x33aaff })
            );
            lightBulb.position.copy(light.position);
            mothershipGroup.add(lightBulb);
        }
        
        // Add mothership details - antennas, solar panels, etc.
        const detailsGroup = this.createMothershipDetails();
        mothershipGroup.add(detailsGroup);
        
        // Position the mothership above the sun
        mothershipGroup.position.set(0, 8000, 0);
        
        // Add to scene
        this.scene.add(mothershipGroup);
        this.mothership = mothershipGroup;
    }
    
    createMothershipDetails() {
        const detailsGroup = new THREE.Group();
        
        // Solar panel arrays
        const createSolarPanel = () => {
            const panel = new THREE.Group();
            
            // Panel
            const panelGeometry = new THREE.BoxGeometry(1200, 400, 20);
            const panelMaterial = new THREE.MeshPhongMaterial({
                color: 0x3355aa,
                emissive: 0x112233,
                emissiveIntensity: 0.3,
                shininess: 80
            });
            const panelMesh = new THREE.Mesh(panelGeometry, panelMaterial);
            panel.add(panelMesh);
            
            // Support arm
            const armGeometry = new THREE.BoxGeometry(40, 40, 280);
            const armMaterial = new THREE.MeshPhongMaterial({
                color: 0x888899
            });
            const arm = new THREE.Mesh(armGeometry, armMaterial);
            arm.position.z = -140;
            panel.add(arm);
            
            return panel;
        };
        
        // Create two solar panels on either side
        const leftPanel = createSolarPanel();
        leftPanel.position.set(-1400, 0, 0);
        detailsGroup.add(leftPanel);
        
        const rightPanel = createSolarPanel();
        rightPanel.position.set(1400, 0, 0);
        detailsGroup.add(rightPanel);
        
        // Add communication dishes
        const dishGeometry = new THREE.SphereGeometry(200, 8, 8, 0, Math.PI);
        const dishMaterial = new THREE.MeshPhongMaterial({
            color: 0xdddddd,
            side: THREE.DoubleSide
        });
        
        const dish1 = new THREE.Mesh(dishGeometry, dishMaterial);
        dish1.position.set(0, 1000, 0);
        dish1.rotation.x = Math.PI / 2;
        detailsGroup.add(dish1);
        
        const dish2 = new THREE.Mesh(dishGeometry, dishMaterial);
        dish2.position.set(0, -1000, 0);
        dish2.rotation.x = -Math.PI / 2;
        detailsGroup.add(dish2);
        
        // Add some flashing navigation lights
        const createNavLight = (position, color) => {
            const light = new THREE.PointLight(color, 1, 800);
            light.position.copy(position);
            
            const lightBulb = new THREE.Mesh(
                new THREE.SphereGeometry(32, 8, 8),
                new THREE.MeshBasicMaterial({ color: color })
            );
            lightBulb.position.copy(position);
            
            // Store the original intensity for flashing
            light.userData.originalIntensity = light.intensity;
            light.userData.phase = Math.random() * Math.PI * 2; // Random starting phase
            
            detailsGroup.add(light);
            detailsGroup.add(lightBulb);
            
            return { light, lightBulb };
        };
        
        // Create navigation lights
        this.navLights = [
            createNavLight(new THREE.Vector3(800, 600, 600), 0xff0000), // Red
            createNavLight(new THREE.Vector3(-800, 600, 600), 0x00ff00), // Green
            createNavLight(new THREE.Vector3(0, -600, 600), 0x0088ff), // Blue
        ];
        
        return detailsGroup;
    }
    
    getPosition() {
        return new THREE.Vector3(0, 8000, 0);
    }
    
    getRegionInfo() {
        return {
            center: new THREE.Vector3(0, 8000, 0),
            radius: 2000
        };
    }
    
    update() {
        // Animate mothership navigation lights
        if (this.navLights) {
            this.navLights.forEach(({ light, lightBulb }) => {
                const time = Date.now() * 0.001;
                const flicker = 0.7 + 0.3 * Math.sin(time * 2 + light.userData.phase);
                
                light.intensity = light.userData.originalIntensity * flicker;
                
                // Also update the light bulb material
                if (lightBulb.material) {
                    lightBulb.material.emissiveIntensity = flicker;
                }
            });
        }
        
        // Slowly rotate the mothership
        if (this.mothership) {
            this.mothership.rotation.y += 0.0002;
        }
    }
} 