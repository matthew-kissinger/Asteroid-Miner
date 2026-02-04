// upgrades.ts - Ship upgrade systems
// Extracted from spaceship.js to improve maintainability

import * as THREE from 'three';

interface ShipComponents {
  mesh?: THREE.Group;
  thrusters: Array<{ mesh: THREE.Mesh; type: string }>;
  leftCannon?: THREE.Mesh | null;
  rightCannon?: THREE.Mesh | null;
  leftEmitter?: THREE.Mesh | null;
  rightEmitter?: THREE.Mesh | null;
}

interface SpaceshipState {
  maxFuel: number;
  fuel: number;
  maxVelocity: number;
  miningEfficiency: number;
  collisionResistance: number;
  scanRange: number;
}

interface UpgradeLevels {
  fuelTankLevel: number;
  fuelUpgradeCost: number;
  engineLevel: number;
  engineUpgradeCost: number;
  miningLevel: number;
  miningUpgradeCost: number;
  hullLevel: number;
  hullUpgradeCost: number;
  scannerLevel: number;
  scannerUpgradeCost: number;
}

export class ShipUpgrades {
  components: ShipComponents;

  // Upgrade levels and costs
  fuelTankLevel: number;
  fuelUpgradeCost: number;

  engineLevel: number;
  engineUpgradeCost: number;

  miningLevel: number;
  miningUpgradeCost: number;

  hullLevel: number;
  hullUpgradeCost: number;

  scannerLevel: number;
  scannerUpgradeCost: number;

  constructor(shipComponents: ShipComponents) {
    this.components = shipComponents; // { mesh, thrusters, leftCannon, rightCannon, leftEmitter, rightEmitter }

    // Upgrade levels and costs
    this.fuelTankLevel = 1;
    this.fuelUpgradeCost = 1000;

    this.engineLevel = 1;
    this.engineUpgradeCost = 800;

    this.miningLevel = 1;
    this.miningUpgradeCost = 1200;

    this.hullLevel = 1;
    this.hullUpgradeCost = 1500;

    this.scannerLevel = 1;
    this.scannerUpgradeCost = 600;
  }

  /**
   * Upgrade the fuel tank capacity
   * @param {object} spaceshipState Reference to spaceship state
   * @returns {number} New fuel capacity
   */
  upgradeFuelTank(spaceshipState: SpaceshipState): number {
    console.log("Upgrading fuel tank");

    // Double the fuel capacity
    spaceshipState.maxFuel *= 2;

    // Increase the fuel level to match the new capacity
    spaceshipState.fuel = spaceshipState.maxFuel;

    // Increase the upgrade level
    this.fuelTankLevel++;

    // Calculate the new upgrade cost (4x the previous cost)
    this.fuelUpgradeCost *= 4;

    return spaceshipState.maxFuel;
  }

  /**
   * Upgrade the ship's engines
   * @param {object} spaceshipState Reference to spaceship state
   * @returns {number} New max velocity
   */
  upgradeEngine(spaceshipState: SpaceshipState): number {
    console.log("Upgrading engines");

    // Increase max velocity by 25%
    spaceshipState.maxVelocity *= 1.25;

    // Upgrade visual appearance of thrusters
    this.components.thrusters.forEach(thruster => {
      if (thruster.mesh && thruster.mesh.material) {
        const material = thruster.mesh.material as THREE.MeshPhongMaterial;
        // Make thrusters more intense with each upgrade
        material.emissiveIntensity += 0.2;

        // Change thruster color slightly with each upgrade to show progression
        if (this.engineLevel % 2 === 0) { // Every even level
          material.emissive.setHex(0xff8800); // More orange
        } else {
          material.emissive.setHex(0xffaa00); // More yellow
        }
      }
    });

    // Increase the upgrade level
    this.engineLevel++;

    // Calculate the new upgrade cost (2.5x the previous cost)
    this.engineUpgradeCost = Math.floor(this.engineUpgradeCost * 2.5);

    return spaceshipState.maxVelocity;
  }

  /**
   * Upgrade the mining laser system
   * @param {object} spaceshipState Reference to spaceship state
   * @returns {number} New mining efficiency
   */
  upgradeMiningLaser(spaceshipState: SpaceshipState): number {
    console.log("Upgrading mining laser");

    // Increase mining efficiency by 30%
    spaceshipState.miningEfficiency *= 1.3;

    // Upgrade visual appearance of mining laser emitters
    if (this.components.leftEmitter && this.components.leftEmitter.material) {
      // Increase the size of the left emitter
      this.components.leftEmitter.scale.set(1.1, 1.1, 1.1);

      // Change the color based on level to show progression
      const colors = [0xff0000, 0xff5500, 0xff9900, 0xffcc00, 0xffee00];
      const material = this.components.leftEmitter.material as THREE.MeshPhongMaterial;
      if (this.miningLevel < colors.length) {
        material.color.setHex(colors[this.miningLevel]);
        material.emissive.setHex(colors[this.miningLevel]);
      }

      // Increase the emissive intensity
      material.emissiveIntensity += 0.2;
    }

    // Also upgrade the right emitter to match
    if (this.components.rightEmitter && this.components.rightEmitter.material) {
      // Increase the size of the right emitter
      this.components.rightEmitter.scale.set(1.1, 1.1, 1.1);

      // Change the color based on level to show progression
      const colors = [0xff0000, 0xff5500, 0xff9900, 0xffcc00, 0xffee00];
      const material = this.components.rightEmitter.material as THREE.MeshPhongMaterial;
      if (this.miningLevel < colors.length) {
        material.color.setHex(colors[this.miningLevel]);
        material.emissive.setHex(colors[this.miningLevel]);
      }

      // Increase the emissive intensity
      material.emissiveIntensity += 0.2;
    }

    // Also update the cannons
    if (this.components.leftCannon && this.components.leftCannon.material) {
      // Make the cannons thicker with each upgrade
      this.components.leftCannon.scale.x *= 1.1;
      this.components.leftCannon.scale.y *= 1.1;
    }

    if (this.components.rightCannon && this.components.rightCannon.material) {
      // Make the cannons thicker with each upgrade
      this.components.rightCannon.scale.x *= 1.1;
      this.components.rightCannon.scale.y *= 1.1;
    }

    // Increase the upgrade level
    this.miningLevel++;

    // Calculate the new upgrade cost (3x the previous cost)
    this.miningUpgradeCost = Math.floor(this.miningUpgradeCost * 3);

    return spaceshipState.miningEfficiency;
  }

  /**
   * Upgrade the ship's hull armor
   * @param {object} spaceshipState Reference to spaceship state
   * @returns {number} New collision resistance
   */
  upgradeHull(spaceshipState: SpaceshipState): number {
    console.log("Upgrading hull");

    // Increase collision resistance by 25%
    spaceshipState.collisionResistance *= 1.25;

    // Modify ship appearance to show hull upgrade
    if (this.components.mesh) {
      const bodyGroup = this.components.mesh.children.find(child => child instanceof THREE.Group);

      if (bodyGroup && bodyGroup.children) {
        // Update both the cylinder and cone parts of the ship body
        bodyGroup.children.forEach(part => {
          if (part instanceof THREE.Mesh && part.material) {
            const material = part.material as THREE.MeshPhongMaterial;
            // Change the hull color slightly to indicate higher grade material
            if (this.hullLevel % 2 === 0) {
              // Even levels: more blue tint
              material.color.setHex(0x30c0d0);
            } else {
              // Odd levels: more green tint
              material.color.setHex(0x30d0c0);
            }

            // Increase shininess with each level to suggest better armor
            material.shininess += 10;
          }
        });
      }
    }

    // Increase the upgrade level
    this.hullLevel++;

    // Calculate the new upgrade cost (2x the previous cost)
    this.hullUpgradeCost = Math.floor(this.hullUpgradeCost * 2);

    return spaceshipState.collisionResistance;
  }

  /**
   * Upgrade the ship's scanner system
   * @param {object} spaceshipState Reference to spaceship state
   * @returns {number} New scanner range
   */
  upgradeScanner(spaceshipState: SpaceshipState): number {
    console.log("Upgrading scanner");

    // Increase scanner range by 20%
    spaceshipState.scanRange *= 1.2;

    // Add visual indicator for scanner upgrade (could add scan dish or antenna)
    // This is a simplified version - in a real implementation, you'd want to
    // add actual mesh components to the ship

    // Increase the upgrade level
    this.scannerLevel++;

    // Calculate the new upgrade cost (1.8x the previous cost)
    this.scannerUpgradeCost = Math.floor(this.scannerUpgradeCost * 1.8);

    return spaceshipState.scanRange;
  }

  /**
   * Get all upgrade levels for external access
   * @returns {object} All upgrade levels and costs
   */
  getUpgradeLevels(): UpgradeLevels {
    return {
      fuelTankLevel: this.fuelTankLevel,
      fuelUpgradeCost: this.fuelUpgradeCost,
      engineLevel: this.engineLevel,
      engineUpgradeCost: this.engineUpgradeCost,
      miningLevel: this.miningLevel,
      miningUpgradeCost: this.miningUpgradeCost,
      hullLevel: this.hullLevel,
      hullUpgradeCost: this.hullUpgradeCost,
      scannerLevel: this.scannerLevel,
      scannerUpgradeCost: this.scannerUpgradeCost
    };
  }

  /**
   * Set upgrade levels from existing data (for loading saves)
   * @param {object} upgrades Upgrade data to restore
   */
  setUpgradeLevels(upgrades: Partial<UpgradeLevels>): void {
    this.fuelTankLevel = upgrades.fuelTankLevel || 1;
    this.fuelUpgradeCost = upgrades.fuelUpgradeCost || 1000;
    this.engineLevel = upgrades.engineLevel || 1;
    this.engineUpgradeCost = upgrades.engineUpgradeCost || 800;
    this.miningLevel = upgrades.miningLevel || 1;
    this.miningUpgradeCost = upgrades.miningUpgradeCost || 1200;
    this.hullLevel = upgrades.hullLevel || 1;
    this.hullUpgradeCost = upgrades.hullUpgradeCost || 1500;
    this.scannerLevel = upgrades.scannerLevel || 1;
    this.scannerUpgradeCost = upgrades.scannerUpgradeCost || 600;
  }
}
