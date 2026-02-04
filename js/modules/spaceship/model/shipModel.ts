// shipModel.ts - 3D model creation for spaceship
// Extracted from spaceship.js to improve maintainability

import * as THREE from 'three';

interface ThrusterComponent {
  mesh: THREE.Mesh;
  type: string;
}

interface ShipComponents {
  mesh: THREE.Group;
  thrusters: ThrusterComponent[];
  leftCannon?: THREE.Mesh | null;
  rightCannon?: THREE.Mesh | null;
  leftEmitter?: THREE.Mesh | null;
  rightEmitter?: THREE.Mesh | null;
  miningLaser?: THREE.Mesh | null;
}

export class ShipModel {
  scene: THREE.Scene;
  shipScale: number;
  mesh: THREE.Group | null;
  thrusters: ThrusterComponent[];
  leftCannon: THREE.Mesh | null;
  rightCannon: THREE.Mesh | null;
  leftEmitter: THREE.Mesh | null;
  rightEmitter: THREE.Mesh | null;
  miningLaser: THREE.Mesh | null;

  constructor(scene: THREE.Scene, shipScale: number = 2.0) {
    this.scene = scene;
    this.shipScale = shipScale;
    this.mesh = null;
    this.thrusters = [];
    this.leftCannon = null;
    this.rightCannon = null;
    this.leftEmitter = null;
    this.rightEmitter = null;
    this.miningLaser = null;
  }

  /**
   * Create the complete spaceship 3D model
   * @returns {THREE.Group} The spaceship mesh group
   */
  createSpaceship(): THREE.Group {
    // Create spaceship group
    this.mesh = new THREE.Group();

    // Scale the entire ship
    this.mesh.scale.set(this.shipScale, this.shipScale, this.shipScale);

    // Set initial position to a safe location far from the sun
    this.mesh.position.set(0, 2000, 0); // Position near stargate initially

    // Create the main body of the ship - sleek aerodynamic design using basic geometries
    // Use a cylinder with a cone at the front instead of CapsuleGeometry
    const bodyGroup = new THREE.Group();

    // Main hull cylinder
    const cylinderGeometry = new THREE.CylinderGeometry(0.4, 0.5, 1.8, 12);
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff, // White base
      specular: 0xffd700, // Gold specular highlights
      shininess: 100,
      emissive: 0x222222,
      emissiveIntensity: 0.1
    });

    const bodyCylinder = new THREE.Mesh(cylinderGeometry, bodyMaterial);
    bodyCylinder.rotation.x = Math.PI / 2; // Rotate to point forward
    bodyGroup.add(bodyCylinder);

    // Front nose cone
    const noseGeometry = new THREE.ConeGeometry(0.4, 0.8, 12);
    const noseCone = new THREE.Mesh(noseGeometry, bodyMaterial);
    noseCone.position.set(0, 0, -1.2);
    noseCone.rotation.x = -Math.PI / 2; // Point forward
    bodyGroup.add(noseCone);

    // Add the complete body to the ship
    this.mesh.add(bodyGroup);

    // Add cockpit - glass dome
    this._createCockpit();

    // Add dual front cannons
    this._createCannons();

    // Add cannon emitters (glowing tips)
    this._createEmitters();

    // Create mining laser emitter (use one of the cannons for mining)
    this.miningLaser = this.leftEmitter;

    // Add curved wings
    this._createWings();

    // Add gold accents to body
    this._createGoldAccents();

    // Add thrusters
    this._createThrusters();

    // Add to scene
    this.scene.add(this.mesh);

    return this.mesh;
  }

  /**
   * Create the cockpit glass dome
   */
  private _createCockpit(): void {
    const cockpitGeometry = new THREE.SphereGeometry(0.35, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const cockpitMaterial = new THREE.MeshPhongMaterial({
      color: 0x88ccff,
      specular: 0xffffff,
      shininess: 100,
      transparent: true,
      opacity: 0.7,
      emissive: 0x0066ff,
      emissiveIntensity: 0.1
    });
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.set(0, 0.25, -0.2);
    cockpit.rotation.x = -Math.PI / 2;
    if (this.mesh) {
      this.mesh.add(cockpit);
    }
  }

  /**
   * Create the dual front cannons
   */
  private _createCannons(): void {
    const cannonGeometry = new THREE.CylinderGeometry(0.08, 0.06, 2.0, 8);
    const cannonMaterial = new THREE.MeshPhongMaterial({
      color: 0xffd700, // Gold
      specular: 0xffffff,
      shininess: 80,
      emissive: 0xffd700,
      emissiveIntensity: 0.2
    });

    // Left cannon
    this.leftCannon = new THREE.Mesh(cannonGeometry, cannonMaterial);
    this.leftCannon.position.set(0.2, 0, -1.5); // Left side of cockpit
    this.leftCannon.rotation.x = Math.PI / 2; // Point forward
    if (this.mesh) {
      this.mesh.add(this.leftCannon);
    }

    // Right cannon
    this.rightCannon = new THREE.Mesh(cannonGeometry, cannonMaterial);
    this.rightCannon.position.set(-0.2, 0, -1.5); // Right side of cockpit
    this.rightCannon.rotation.x = Math.PI / 2; // Point forward
    if (this.mesh) {
      this.mesh.add(this.rightCannon);
    }
  }

  /**
   * Create the cannon emitters (glowing tips)
   */
  private _createEmitters(): void {
    const emitterGeometry = new THREE.SphereGeometry(0.08, 16, 16);
    const emitterMaterial = new THREE.MeshPhongMaterial({
      color: 0xff6600,
      emissive: 0xff3300,
      emissiveIntensity: 1
    });

    // Left emitter
    this.leftEmitter = new THREE.Mesh(emitterGeometry, emitterMaterial);
    this.leftEmitter.position.set(0.2, 0, -2.5); // Front of left cannon
    if (this.mesh) {
      this.mesh.add(this.leftEmitter);
    }

    // Right emitter
    this.rightEmitter = new THREE.Mesh(emitterGeometry, emitterMaterial);
    this.rightEmitter.position.set(-0.2, 0, -2.5); // Front of right cannon
    if (this.mesh) {
      this.mesh.add(this.rightEmitter);
    }
  }

  /**
   * Create curved wings using custom geometry
   */
  private _createWings(): void {
    const createCurvedWing = (isLeft: boolean): THREE.Group => {
      const wingGroup = new THREE.Group();

      // Create curved wing shape using multiple segments
      const wingMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff, // White
        specular: 0xffd700, // Gold specular
        shininess: 80,
        emissive: 0xffffff,
        emissiveIntensity: 0.1
      });

      // Wing base connecting to ship body
      const wingBaseGeom = new THREE.BoxGeometry(0.1, 0.2, 0.6);
      const wingBase = new THREE.Mesh(wingBaseGeom, wingMaterial);
      wingBase.position.set(isLeft ? 0.55 : -0.55, 0, 0.2);
      wingGroup.add(wingBase);

      // Curved part of wing - using custom curved mesh
      const wingCurveGeom = new THREE.BoxGeometry(0.8, 0.1, 0.5);
      const wingCurve = new THREE.Mesh(wingCurveGeom, wingMaterial);

      // Rotate and position to create curved wing effect
      wingCurve.position.set(isLeft ? 1 : -1, 0, 0.2);
      wingCurve.rotation.z = isLeft ? Math.PI / 8 : -Math.PI / 8;
      wingGroup.add(wingCurve);

      // Wing tip with gold accent
      const wingTipGeom = new THREE.BoxGeometry(0.3, 0.08, 0.3);
      const goldMaterial = new THREE.MeshPhongMaterial({
        color: 0xffd700, // Gold
        specular: 0xffffff,
        shininess: 100,
        emissive: 0xffd700,
        emissiveIntensity: 0.3
      });

      const wingTip = new THREE.Mesh(wingTipGeom, goldMaterial);
      wingTip.position.set(isLeft ? 1.4 : -1.4, 0, 0.2);
      wingTip.rotation.z = isLeft ? Math.PI / 6 : -Math.PI / 6;
      wingGroup.add(wingTip);

      return wingGroup;
    };

    // Add wings to ship
    const leftWing = createCurvedWing(true);
    if (this.mesh) {
      this.mesh.add(leftWing);
    }

    const rightWing = createCurvedWing(false);
    if (this.mesh) {
      this.mesh.add(rightWing);
    }
  }

  /**
   * Add gold accents to the ship body
   */
  private _createGoldAccents(): void {
    const addGoldAccent = (
      width: number,
      height: number,
      depth: number,
      x: number,
      y: number,
      z: number,
      rotX: number = 0,
      rotY: number = 0,
      rotZ: number = 0
    ): THREE.Mesh => {
      const accentGeom = new THREE.BoxGeometry(width, height, depth);
      const goldMaterial = new THREE.MeshPhongMaterial({
        color: 0xffd700, // Gold
        specular: 0xffffff,
        shininess: 100,
        emissive: 0xffd700,
        emissiveIntensity: 0.3
      });

      const accent = new THREE.Mesh(accentGeom, goldMaterial);
      accent.position.set(x, y, z);
      accent.rotation.set(rotX, rotY, rotZ);
      if (this.mesh) {
        this.mesh.add(accent);
      }
      return accent;
    };

    // Add gold accents along the body
    addGoldAccent(0.8, 0.05, 0.1, 0, -0.25, -0.3);
    addGoldAccent(0.8, 0.05, 0.1, 0, -0.25, 0.3);
    addGoldAccent(0.05, 0.05, 1.0, 0.3, -0.25, 0);
    addGoldAccent(0.05, 0.05, 1.0, -0.3, -0.25, 0);
  }

  /**
   * Create thrusters for the spaceship
   */
  private _createThrusters(): void {
    const thrusterGeometry = new THREE.CylinderGeometry(0.2, 0.15, 0.5, 8);
    const thrusterMaterial = new THREE.MeshPhongMaterial({
      color: 0xffd700, // Gold
      emissive: 0xff5500,
      emissiveIntensity: 0.5
    });

    // Main thrusters (back)
    const mainThruster = new THREE.Mesh(thrusterGeometry, thrusterMaterial);
    mainThruster.position.z = 1.2; // Position at the back of the ship
    mainThruster.rotation.x = Math.PI; // Point backward
    if (this.mesh) {
      this.mesh.add(mainThruster);
    }
    this.thrusters.push({ mesh: mainThruster, type: 'main' });

    // Front/Reverse thruster (new)
    const reverseThruster = new THREE.Mesh(thrusterGeometry.clone(), thrusterMaterial.clone());
    reverseThruster.position.z = -1.0; // Position at the front of the ship
    reverseThruster.rotation.x = 0; // Point forward
    reverseThruster.scale.set(0.6, 0.6, 0.6); // Make it slightly smaller than main thruster
    if (this.mesh) {
      this.mesh.add(reverseThruster);
    }
    this.thrusters.push({ mesh: reverseThruster, type: 'reverse' });

    // Side thrusters for lateral movement
    const leftThruster = new THREE.Mesh(thrusterGeometry.clone(), thrusterMaterial.clone());
    leftThruster.position.set(0.5, 0, 0.5);
    leftThruster.rotation.z = Math.PI / 2; // Point to the right (for leftward thrust)
    leftThruster.scale.set(0.5, 0.5, 0.5); // Make side thrusters smaller
    if (this.mesh) {
      this.mesh.add(leftThruster);
    }
    this.thrusters.push({ mesh: leftThruster, type: 'left' });

    const rightThruster = new THREE.Mesh(thrusterGeometry.clone(), thrusterMaterial.clone());
    rightThruster.position.set(-0.5, 0, 0.5);
    rightThruster.rotation.z = -Math.PI / 2; // Point to the left (for rightward thrust)
    rightThruster.scale.set(0.5, 0.5, 0.5); // Make side thrusters smaller
    if (this.mesh) {
      this.mesh.add(rightThruster);
    }
    this.thrusters.push({ mesh: rightThruster, type: 'right' });
  }

  /**
   * Get references to important mesh components
   * @returns {object} Object containing mesh references
   */
  getComponents(): ShipComponents {
    return {
      mesh: this.mesh!,
      thrusters: this.thrusters,
      leftCannon: this.leftCannon,
      rightCannon: this.rightCannon,
      leftEmitter: this.leftEmitter,
      rightEmitter: this.rightEmitter,
      miningLaser: this.miningLaser
    };
  }
}
