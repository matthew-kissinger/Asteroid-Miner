// weapons.js - Creates turrets and surface details for the Star Dreadnought

import * as THREE from 'three';

export class DreadnoughtWeapons {
    static createSurfaceDetails(scale, ship) {
        // Add surface details for more visual interest
        
        // Turrets along the sides
        this.createTurrets(scale, ship);
        
        // Trenches and surface details
        this.createSurfaceTrenches(scale, ship);
        
        // Shield generator domes
        this.createShieldGenerators(scale, ship);
    }
    
    static createTurrets(scale, ship) {
        // Create turret batteries along the sides
        const turretRadius = scale * 0.008;
        const turretHeight = scale * 0.01;
        const baseRadius = scale * 0.01;
        const baseHeight = scale * 0.005;
        
        // Turret material
        const turretMaterial = new THREE.MeshStandardMaterial({
            color: 0x666677,
            metalness: 0.7,
            roughness: 0.3
        });
        
        // Positions for turrets (port side)
        const portPositions = [];
        for (let i = 0; i < 12; i++) {
            const z = scale * 0.2 - (i * scale * 0.07);
            portPositions.push([-scale * 0.1, scale * 0.035, z]);
        }
        
        // Create port side turrets
        portPositions.forEach(pos => {
            // Turret base
            const baseGeometry = new THREE.CylinderGeometry(baseRadius, baseRadius, baseHeight, 8);
            const base = new THREE.Mesh(baseGeometry, turretMaterial);
            base.position.set(pos[0], pos[1], pos[2]);
            ship.add(base);
            
            // Turret gun
            const turretGeometry = new THREE.CylinderGeometry(turretRadius, turretRadius, turretHeight, 8);
            const turret = new THREE.Mesh(turretGeometry, turretMaterial);
            turret.position.set(pos[0], pos[1] + baseHeight * 0.5 + turretHeight * 0.5, pos[2]);
            turret.rotation.x = Math.PI / 2; // Orient horizontally
            turret.rotation.z = -Math.PI / 6; // Angle outward
            ship.add(turret);
        });
        
        // Positions for turrets (starboard side)
        const starboardPositions = [];
        for (let i = 0; i < 12; i++) {
            const z = scale * 0.2 - (i * scale * 0.07);
            starboardPositions.push([scale * 0.1, scale * 0.035, z]);
        }
        
        // Create starboard side turrets
        starboardPositions.forEach(pos => {
            // Turret base
            const baseGeometry = new THREE.CylinderGeometry(baseRadius, baseRadius, baseHeight, 8);
            const base = new THREE.Mesh(baseGeometry, turretMaterial);
            base.position.set(pos[0], pos[1], pos[2]);
            ship.add(base);
            
            // Turret gun
            const turretGeometry = new THREE.CylinderGeometry(turretRadius, turretRadius, turretHeight, 8);
            const turret = new THREE.Mesh(turretGeometry, turretMaterial);
            turret.position.set(pos[0], pos[1] + baseHeight * 0.5 + turretHeight * 0.5, pos[2]);
            turret.rotation.x = Math.PI / 2; // Orient horizontally
            turret.rotation.z = Math.PI / 6; // Angle outward
            ship.add(turret);
        });
    }
    
    static createSurfaceTrenches(scale, ship) {
        // Create surface trenches and details
        const trenchWidth = scale * 0.01;
        const trenchDepth = scale * 0.01;
        const trenchLength = scale * 0.3;
        
        // Trench material - darker than hull
        const trenchMaterial = new THREE.MeshStandardMaterial({
            color: 0x222233,
            metalness: 0.7,
            roughness: 0.8,
            emissive: 0x111122,
            emissiveIntensity: 0.3
        });
        
        // Center trench (inspired by Death Star trench)
        const centerTrenchGeometry = new THREE.BoxGeometry(trenchWidth, trenchDepth, trenchLength);
        const centerTrench = new THREE.Mesh(centerTrenchGeometry, trenchMaterial);
        centerTrench.position.set(0, scale * 0.035, scale * 0.1);
        ship.add(centerTrench);
        
        // Side trenches
        const sideTrenchGeometry = new THREE.BoxGeometry(trenchWidth, trenchDepth, trenchLength * 0.7);
        
        // Port side trench
        const portTrench = new THREE.Mesh(sideTrenchGeometry, trenchMaterial);
        portTrench.position.set(-scale * 0.07, scale * 0.035, scale * 0.05);
        ship.add(portTrench);
        
        // Starboard side trench
        const starboardTrench = new THREE.Mesh(sideTrenchGeometry, trenchMaterial);
        starboardTrench.position.set(scale * 0.07, scale * 0.035, scale * 0.05);
        ship.add(starboardTrench);
    }
    
    static createShieldGenerators(scale, ship) {
        // Create shield generator domes
        const domeRadius = scale * 0.02;
        const domeY = scale * 0.05;
        const domeZ = scale * 0.35;
        
        // Dome material - slightly transparent blue
        const domeMaterial = new THREE.MeshStandardMaterial({
            color: 0x3366aa,
            metalness: 0.2,
            roughness: 0.3,
            transparent: true,
            opacity: 0.6,
            emissive: 0x112244,
            emissiveIntensity: 0.3
        });
        
        // Port side shield generator
        const portDomeGeometry = new THREE.SphereGeometry(domeRadius, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const portDome = new THREE.Mesh(portDomeGeometry, domeMaterial);
        portDome.position.set(-scale * 0.08, domeY, domeZ);
        portDome.rotation.x = Math.PI; // Orient half-sphere
        ship.add(portDome);
        
        // Starboard side shield generator
        const starboardDomeGeometry = new THREE.SphereGeometry(domeRadius, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const starboardDome = new THREE.Mesh(starboardDomeGeometry, domeMaterial);
        starboardDome.position.set(scale * 0.08, domeY, domeZ);
        starboardDome.rotation.x = Math.PI; // Orient half-sphere
        ship.add(starboardDome);
        
        return { portDome, starboardDome };
    }
}