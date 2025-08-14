// hull.js - Creates the main hull structure for the Star Dreadnought

import * as THREE from 'three';

export class DreadnoughtHull {
    static createMainHull(scale, ship) {
        // Create main hull using custom geometry for the distinctive arrow/dagger shape
        const hullLength = scale;
        const hullWidth = scale * 0.22;
        const hullHeight = scale * 0.06;
        const taperFactor = 0.15; // How much the front tapers
        
        // Create geometry for the main hull shape
        const hullGeometry = new THREE.BufferGeometry();
        
        // Define vertices for the hull shape (triangulated)
        const vertices = new Float32Array([
            // Bottom face
            -hullWidth/2, -hullHeight/2, hullLength/2,  // bottom left back
            hullWidth/2, -hullHeight/2, hullLength/2,   // bottom right back
            -hullWidth*taperFactor, -hullHeight/2, -hullLength/2, // bottom left front
            
            hullWidth/2, -hullHeight/2, hullLength/2,   // bottom right back
            hullWidth*taperFactor, -hullHeight/2, -hullLength/2,  // bottom right front
            -hullWidth*taperFactor, -hullHeight/2, -hullLength/2, // bottom left front
            
            // Top face
            -hullWidth/2, hullHeight/2, hullLength/2,  // top left back
            -hullWidth*taperFactor, hullHeight/2, -hullLength/2, // top left front
            hullWidth/2, hullHeight/2, hullLength/2,   // top right back
            
            hullWidth/2, hullHeight/2, hullLength/2,   // top right back
            -hullWidth*taperFactor, hullHeight/2, -hullLength/2, // top left front
            hullWidth*taperFactor, hullHeight/2, -hullLength/2,  // top right front
            
            // Left face
            -hullWidth/2, -hullHeight/2, hullLength/2,  // bottom left back
            -hullWidth/2, hullHeight/2, hullLength/2,   // top left back
            -hullWidth*taperFactor, -hullHeight/2, -hullLength/2, // bottom left front
            
            -hullWidth/2, hullHeight/2, hullLength/2,   // top left back
            -hullWidth*taperFactor, hullHeight/2, -hullLength/2,  // top left front
            -hullWidth*taperFactor, -hullHeight/2, -hullLength/2, // bottom left front
            
            // Right face
            hullWidth/2, -hullHeight/2, hullLength/2,  // bottom right back
            hullWidth*taperFactor, -hullHeight/2, -hullLength/2, // bottom right front
            hullWidth/2, hullHeight/2, hullLength/2,   // top right back
            
            hullWidth/2, hullHeight/2, hullLength/2,   // top right back
            hullWidth*taperFactor, -hullHeight/2, -hullLength/2, // bottom right front
            hullWidth*taperFactor, hullHeight/2, -hullLength/2,  // top right front
            
            // Back face
            -hullWidth/2, -hullHeight/2, hullLength/2,  // bottom left back
            -hullWidth/2, hullHeight/2, hullLength/2,   // top left back
            hullWidth/2, -hullHeight/2, hullLength/2,   // bottom right back
            
            hullWidth/2, -hullHeight/2, hullLength/2,   // bottom right back
            -hullWidth/2, hullHeight/2, hullLength/2,   // top left back
            hullWidth/2, hullHeight/2, hullLength/2,    // top right back
            
            // Front face (pointed)
            -hullWidth*taperFactor, -hullHeight/2, -hullLength/2, // bottom left front
            -hullWidth*taperFactor, hullHeight/2, -hullLength/2,  // top left front
            hullWidth*taperFactor, -hullHeight/2, -hullLength/2,  // bottom right front
            
            hullWidth*taperFactor, -hullHeight/2, -hullLength/2,  // bottom right front
            -hullWidth*taperFactor, hullHeight/2, -hullLength/2,  // top left front
            hullWidth*taperFactor, hullHeight/2, -hullLength/2    // top right front
        ]);
        
        // Add attributes to the geometry
        hullGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        
        // Material for the main hull - metallic dark gray
        const hullMaterial = new THREE.MeshStandardMaterial({
            color: 0x333344,
            metalness: 0.8,
            roughness: 0.3,
            emissive: 0x111111,
            emissiveIntensity: 0.2
        });
        
        // Create the hull mesh
        const hull = new THREE.Mesh(hullGeometry, hullMaterial);
        hull.geometry.computeVertexNormals(); // Auto-generate normals
        
        // Cast shadows
        hull.castShadow = true;
        hull.receiveShadow = true;
        
        // Add to ship group
        ship.add(hull);
        
        // Add additional hull plates for more detail
        this.addHullPlates(scale, ship);
        
        return hull;
    }
    
    static addHullPlates(scale, ship) {
        // Add additional hull plates for more detail and segmentation
        const plateLength = scale * 0.2;
        const plateWidth = scale * 0.18;
        const plateHeight = scale * 0.01;
        const plateY = scale * 0.035; // Just above the hull
        
        // Create 5 plates down the center of the ship
        for (let i = 0; i < 5; i++) {
            const plateZ = scale * 0.4 - (i * plateLength);
            
            const plateGeometry = new THREE.BoxGeometry(plateWidth, plateHeight, plateLength);
            const plateMaterial = new THREE.MeshStandardMaterial({
                color: 0x444455,
                metalness: 0.7,
                roughness: 0.4,
                emissive: 0x222222
            });
            
            const plate = new THREE.Mesh(plateGeometry, plateMaterial);
            plate.position.set(0, plateY, plateZ);
            
            plate.castShadow = true;
            plate.receiveShadow = true;
            
            ship.add(plate);
        }
    }
}