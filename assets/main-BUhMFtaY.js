var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { U as Group, z as BufferGeometry, B as BufferAttribute, v as MeshStandardMaterial, E as Mesh, av as BoxGeometry, aq as CylinderGeometry, au as SphereGeometry, ad as ShaderMaterial, aj as AdditiveBlending, w as DoubleSide, C as Color, aB as RingGeometry, K as Points, a3 as Texture, s as PointsMaterial, g as Vector3, x as MeshBasicMaterial, aU as THREE } from "./three-Cpq8ZWQ0.js";
import { g as getAbsolutePath, A as AudioManager, b as Renderer, P as Physics, c as Environment, d as Spaceship, e as UI, f as Controls, h as Combat } from "./modules-Dn-zqvei.js";
import { MessageBus } from "./core-D1pAqHYH.js";
import { g as getGlobalPoolRegistry } from "./index-DeLDFO0X.js";
class StarDreadnought {
  constructor(scene) {
    this.scene = scene;
    this.ship = null;
    this.engineGlows = [];
    this.teleportBeam = null;
    this.teleportBeamParticles = null;
    this.teleportBeamActive = false;
    this.createShipModel();
    this.scene.add(this.ship);
    console.log("Star Dreadnought created");
  }
  createShipModel() {
    this.ship = new Group();
    this.ship.name = "starDreadnought";
    const shipScale = 1200;
    this.createMainHull(shipScale);
    this.createCommandBridge(shipScale);
    this.createEngineArray(shipScale);
    this.createSurfaceDetails(shipScale);
    this.createTeleportBeam(shipScale);
  }
  createMainHull(scale) {
    const hullLength = scale;
    const hullWidth = scale * 0.22;
    const hullHeight = scale * 0.06;
    const taperFactor = 0.15;
    const hullGeometry = new BufferGeometry();
    const vertices = new Float32Array([
      // Bottom face
      -hullWidth / 2,
      -hullHeight / 2,
      hullLength / 2,
      // bottom left back
      hullWidth / 2,
      -hullHeight / 2,
      hullLength / 2,
      // bottom right back
      -hullWidth * taperFactor,
      -hullHeight / 2,
      -hullLength / 2,
      // bottom left front
      hullWidth / 2,
      -hullHeight / 2,
      hullLength / 2,
      // bottom right back
      hullWidth * taperFactor,
      -hullHeight / 2,
      -hullLength / 2,
      // bottom right front
      -hullWidth * taperFactor,
      -hullHeight / 2,
      -hullLength / 2,
      // bottom left front
      // Top face
      -hullWidth / 2,
      hullHeight / 2,
      hullLength / 2,
      // top left back
      -hullWidth * taperFactor,
      hullHeight / 2,
      -hullLength / 2,
      // top left front
      hullWidth / 2,
      hullHeight / 2,
      hullLength / 2,
      // top right back
      hullWidth / 2,
      hullHeight / 2,
      hullLength / 2,
      // top right back
      -hullWidth * taperFactor,
      hullHeight / 2,
      -hullLength / 2,
      // top left front
      hullWidth * taperFactor,
      hullHeight / 2,
      -hullLength / 2,
      // top right front
      // Left face
      -hullWidth / 2,
      -hullHeight / 2,
      hullLength / 2,
      // bottom left back
      -hullWidth / 2,
      hullHeight / 2,
      hullLength / 2,
      // top left back
      -hullWidth * taperFactor,
      -hullHeight / 2,
      -hullLength / 2,
      // bottom left front
      -hullWidth / 2,
      hullHeight / 2,
      hullLength / 2,
      // top left back
      -hullWidth * taperFactor,
      hullHeight / 2,
      -hullLength / 2,
      // top left front
      -hullWidth * taperFactor,
      -hullHeight / 2,
      -hullLength / 2,
      // bottom left front
      // Right face
      hullWidth / 2,
      -hullHeight / 2,
      hullLength / 2,
      // bottom right back
      hullWidth * taperFactor,
      -hullHeight / 2,
      -hullLength / 2,
      // bottom right front
      hullWidth / 2,
      hullHeight / 2,
      hullLength / 2,
      // top right back
      hullWidth / 2,
      hullHeight / 2,
      hullLength / 2,
      // top right back
      hullWidth * taperFactor,
      -hullHeight / 2,
      -hullLength / 2,
      // bottom right front
      hullWidth * taperFactor,
      hullHeight / 2,
      -hullLength / 2,
      // top right front
      // Back face
      -hullWidth / 2,
      -hullHeight / 2,
      hullLength / 2,
      // bottom left back
      -hullWidth / 2,
      hullHeight / 2,
      hullLength / 2,
      // top left back
      hullWidth / 2,
      -hullHeight / 2,
      hullLength / 2,
      // bottom right back
      hullWidth / 2,
      -hullHeight / 2,
      hullLength / 2,
      // bottom right back
      -hullWidth / 2,
      hullHeight / 2,
      hullLength / 2,
      // top left back
      hullWidth / 2,
      hullHeight / 2,
      hullLength / 2,
      // top right back
      // Front face (pointed)
      -hullWidth * taperFactor,
      -hullHeight / 2,
      -hullLength / 2,
      // bottom left front
      -hullWidth * taperFactor,
      hullHeight / 2,
      -hullLength / 2,
      // top left front
      hullWidth * taperFactor,
      -hullHeight / 2,
      -hullLength / 2,
      // bottom right front
      hullWidth * taperFactor,
      -hullHeight / 2,
      -hullLength / 2,
      // bottom right front
      -hullWidth * taperFactor,
      hullHeight / 2,
      -hullLength / 2,
      // top left front
      hullWidth * taperFactor,
      hullHeight / 2,
      -hullLength / 2
      // top right front
    ]);
    new Float32Array(vertices.length);
    hullGeometry.setAttribute("position", new BufferAttribute(vertices, 3));
    const hullMaterial = new MeshStandardMaterial({
      color: 3355460,
      metalness: 0.8,
      roughness: 0.3,
      emissive: 1118481,
      emissiveIntensity: 0.2
    });
    const hull = new Mesh(hullGeometry, hullMaterial);
    hull.geometry.computeVertexNormals();
    hull.castShadow = true;
    hull.receiveShadow = true;
    this.ship.add(hull);
    this.addHullPlates(scale, hull);
  }
  addHullPlates(scale, parentHull) {
    const plateLength = scale * 0.2;
    const plateWidth = scale * 0.18;
    const plateHeight = scale * 0.01;
    const plateY = scale * 0.035;
    for (let i = 0; i < 5; i++) {
      const plateZ = scale * 0.4 - i * plateLength;
      const plateGeometry = new BoxGeometry(plateWidth, plateHeight, plateLength);
      const plateMaterial = new MeshStandardMaterial({
        color: 4473941,
        metalness: 0.7,
        roughness: 0.4,
        emissive: 2236962
      });
      const plate = new Mesh(plateGeometry, plateMaterial);
      plate.position.set(0, plateY, plateZ);
      plate.castShadow = true;
      plate.receiveShadow = true;
      this.ship.add(plate);
    }
  }
  createCommandBridge(scale) {
    const bridgeHeight = scale * 0.12;
    const bridgeWidth = scale * 0.06;
    const bridgeDepth = scale * 0.08;
    const bridgeY = scale * 0.085;
    const bridgeZ = scale * 0.28;
    const bridgeMaterial = new MeshStandardMaterial({
      color: 5592422,
      metalness: 0.7,
      roughness: 0.3,
      emissive: 2236962,
      emissiveIntensity: 0.2
    });
    const mainTowerGeometry = new BoxGeometry(bridgeWidth, bridgeHeight, bridgeDepth);
    const mainTower = new Mesh(mainTowerGeometry, bridgeMaterial);
    mainTower.position.set(0, bridgeY, bridgeZ);
    mainTower.castShadow = true;
    mainTower.receiveShadow = true;
    this.ship.add(mainTower);
    this.addBridgeWindows(scale, mainTower, bridgeY);
    const secondaryTowerScale = 0.7;
    const secondaryTowerGeometry = new BoxGeometry(
      bridgeWidth * secondaryTowerScale,
      bridgeHeight * secondaryTowerScale,
      bridgeDepth * secondaryTowerScale
    );
    const leftTower = new Mesh(secondaryTowerGeometry, bridgeMaterial);
    leftTower.position.set(-bridgeWidth * 1.2, bridgeY, bridgeZ + bridgeDepth * 0.6);
    leftTower.castShadow = true;
    leftTower.receiveShadow = true;
    this.ship.add(leftTower);
    const rightTower = new Mesh(secondaryTowerGeometry, bridgeMaterial);
    rightTower.position.set(bridgeWidth * 1.2, bridgeY, bridgeZ + bridgeDepth * 0.6);
    rightTower.castShadow = true;
    rightTower.receiveShadow = true;
    this.ship.add(rightTower);
  }
  addBridgeWindows(scale, bridgeTower, bridgeY) {
    const windowSize = scale * 3e-3;
    const windowSpacing = scale * 6e-3;
    const windowRows = 6;
    const windowCols = 10;
    const windowsStartY = bridgeY - scale * 0.02;
    const windowDepth = scale * 1e-3;
    const windowMaterial = new MeshStandardMaterial({
      color: 11189196,
      emissive: 11189196,
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.9
    });
    for (let row = 0; row < windowRows; row++) {
      for (let col = 0; col < windowCols; col++) {
        if (Math.random() > 0.85) continue;
        const windowGeometry = new BoxGeometry(windowSize, windowSize, windowDepth);
        const window2 = new Mesh(windowGeometry, windowMaterial);
        window2.position.set(
          (col - windowCols / 2) * windowSpacing,
          windowsStartY + row * windowSpacing,
          bridgeTower.position.z + scale * 0.04 + windowDepth
        );
        this.ship.add(window2);
      }
    }
  }
  createEngineArray(scale) {
    const engineRadius = scale * 0.018;
    const engineLength = scale * 0.04;
    const engineZ = scale * 0.48;
    const engineY = scale * 0.01;
    const engineHousingWidth = scale * 0.2;
    const engineHousingHeight = scale * 0.05;
    const engineHousingLength = scale * 0.06;
    const housingGeometry = new BoxGeometry(engineHousingWidth, engineHousingHeight, engineHousingLength);
    const housingMaterial = new MeshStandardMaterial({
      color: 3355460,
      metalness: 0.8,
      roughness: 0.4
    });
    const engineHousing = new Mesh(housingGeometry, housingMaterial);
    engineHousing.position.set(0, engineY, engineZ);
    engineHousing.castShadow = true;
    engineHousing.receiveShadow = true;
    this.ship.add(engineHousing);
    const engineMaterial = new MeshStandardMaterial({
      color: 3368703,
      emissive: 3368703,
      emissiveIntensity: 0.7,
      transparent: true,
      opacity: 0.7
    });
    const glowMaterial = new MeshStandardMaterial({
      color: 3368703,
      emissive: 3368703,
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.8
    });
    const engineRows = 2;
    const enginesPerRow = 5;
    const verticalSpacing = engineHousingHeight * 0.5;
    for (let row = 0; row < engineRows; row++) {
      const rowY = engineY - verticalSpacing * (row - 0.5);
      for (let i = 0; i < enginesPerRow; i++) {
        const posX = (i - (enginesPerRow - 1) / 2) * (engineHousingWidth / (enginesPerRow - 1) * 0.8);
        const engineGeometry = new CylinderGeometry(engineRadius, engineRadius * 1.5, engineLength, 16);
        const engine = new Mesh(engineGeometry, engineMaterial);
        engine.position.set(posX, rowY, engineZ + engineHousingLength * 0.5);
        engine.rotation.x = Math.PI / 2;
        this.ship.add(engine);
        const glowGeometry = new SphereGeometry(engineRadius * 1.6, 16, 16);
        const glow = new Mesh(glowGeometry, glowMaterial.clone());
        glow.position.set(posX, rowY, engineZ + engineHousingLength * 0.5 + engineLength * 1.1);
        this.ship.add(glow);
        this.engineGlows.push(glow);
        const outerGlowGeometry = new SphereGeometry(engineRadius * 2.5, 16, 16);
        const outerGlowMaterial = glowMaterial.clone();
        outerGlowMaterial.opacity = 0.4;
        const outerGlow = new Mesh(outerGlowGeometry, outerGlowMaterial);
        outerGlow.position.copy(glow.position);
        this.ship.add(outerGlow);
        this.engineGlows.push(outerGlow);
      }
    }
    this.createEngineTrailParticles(scale, engineZ, engineHousingWidth);
  }
  createSurfaceDetails(scale) {
    this.createTurrets(scale);
    this.createSurfaceTrenches(scale);
    this.createShieldGenerators(scale);
  }
  createTurrets(scale) {
    const turretRadius = scale * 8e-3;
    const turretHeight = scale * 0.01;
    const baseRadius = scale * 0.01;
    const baseHeight = scale * 5e-3;
    const turretMaterial = new MeshStandardMaterial({
      color: 6710903,
      metalness: 0.7,
      roughness: 0.3
    });
    const portPositions = [];
    for (let i = 0; i < 12; i++) {
      const z = scale * 0.2 - i * scale * 0.07;
      portPositions.push([-scale * 0.1, scale * 0.035, z]);
    }
    portPositions.forEach((pos) => {
      const baseGeometry = new CylinderGeometry(baseRadius, baseRadius, baseHeight, 8);
      const base = new Mesh(baseGeometry, turretMaterial);
      base.position.set(pos[0], pos[1], pos[2]);
      this.ship.add(base);
      const turretGeometry = new CylinderGeometry(turretRadius, turretRadius, turretHeight, 8);
      const turret = new Mesh(turretGeometry, turretMaterial);
      turret.position.set(pos[0], pos[1] + baseHeight * 0.5 + turretHeight * 0.5, pos[2]);
      turret.rotation.x = Math.PI / 2;
      turret.rotation.z = -Math.PI / 6;
      this.ship.add(turret);
    });
    const starboardPositions = [];
    for (let i = 0; i < 12; i++) {
      const z = scale * 0.2 - i * scale * 0.07;
      starboardPositions.push([scale * 0.1, scale * 0.035, z]);
    }
    starboardPositions.forEach((pos) => {
      const baseGeometry = new CylinderGeometry(baseRadius, baseRadius, baseHeight, 8);
      const base = new Mesh(baseGeometry, turretMaterial);
      base.position.set(pos[0], pos[1], pos[2]);
      this.ship.add(base);
      const turretGeometry = new CylinderGeometry(turretRadius, turretRadius, turretHeight, 8);
      const turret = new Mesh(turretGeometry, turretMaterial);
      turret.position.set(pos[0], pos[1] + baseHeight * 0.5 + turretHeight * 0.5, pos[2]);
      turret.rotation.x = Math.PI / 2;
      turret.rotation.z = Math.PI / 6;
      this.ship.add(turret);
    });
  }
  createSurfaceTrenches(scale) {
    const trenchWidth = scale * 0.01;
    const trenchDepth = scale * 0.01;
    const trenchLength = scale * 0.3;
    const trenchMaterial = new MeshStandardMaterial({
      color: 2236979,
      metalness: 0.7,
      roughness: 0.8,
      emissive: 1118498,
      emissiveIntensity: 0.3
    });
    const centerTrenchGeometry = new BoxGeometry(trenchWidth, trenchDepth, trenchLength);
    const centerTrench = new Mesh(centerTrenchGeometry, trenchMaterial);
    centerTrench.position.set(0, scale * 0.035, scale * 0.1);
    this.ship.add(centerTrench);
    const sideTrenchGeometry = new BoxGeometry(trenchWidth, trenchDepth, trenchLength * 0.7);
    const portTrench = new Mesh(sideTrenchGeometry, trenchMaterial);
    portTrench.position.set(-scale * 0.07, scale * 0.035, scale * 0.05);
    this.ship.add(portTrench);
    const starboardTrench = new Mesh(sideTrenchGeometry, trenchMaterial);
    starboardTrench.position.set(scale * 0.07, scale * 0.035, scale * 0.05);
    this.ship.add(starboardTrench);
  }
  createShieldGenerators(scale) {
    const domeRadius = scale * 0.02;
    const domeY = scale * 0.05;
    const domeZ = scale * 0.35;
    const domeMaterial = new MeshStandardMaterial({
      color: 3368618,
      metalness: 0.2,
      roughness: 0.3,
      transparent: true,
      opacity: 0.6,
      emissive: 1122884,
      emissiveIntensity: 0.3
    });
    const portDomeGeometry = new SphereGeometry(domeRadius, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const portDome = new Mesh(portDomeGeometry, domeMaterial);
    portDome.position.set(-scale * 0.08, domeY, domeZ);
    portDome.rotation.x = Math.PI;
    this.ship.add(portDome);
    const starboardDomeGeometry = new SphereGeometry(domeRadius, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const starboardDome = new Mesh(starboardDomeGeometry, domeMaterial);
    starboardDome.position.set(scale * 0.08, domeY, domeZ);
    starboardDome.rotation.x = Math.PI;
    this.ship.add(starboardDome);
  }
  createTeleportBeam(scale) {
    const beamTopRadius = scale * 0.03;
    const beamBottomRadius = scale * 0.2;
    const beamHeight = scale * 0.8;
    const beamMaterial = new ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new Color(3394815) },
        pulseFrequency: { value: 12 },
        pulseAmplitude: { value: 0.3 }
      },
      vertexShader: `
                varying vec2 vUv;
                
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
      fragmentShader: `
                uniform float time;
                uniform vec3 color;
                uniform float pulseFrequency;
                uniform float pulseAmplitude;
                varying vec2 vUv;
                
                // Improved pattern with scrolling and pulsing
                void main() {
                    // Create primary energy pattern - vertical striations
                    float verticalPattern = sin(vUv.y * 50.0 - time * 3.0) * 0.5 + 0.5;
                    
                    // Create horizontal pulse bands
                    float horizontalPulse = sin(vUv.y * pulseFrequency - time * 2.0) * pulseAmplitude + (1.0 - pulseAmplitude);
                    
                    // Edge glow effect with distortion
                    float edgeEffect = smoothstep(0.0, 0.4, vUv.x) * smoothstep(1.0, 0.6, vUv.x);
                    
                    // Swirling energy effect
                    float swirl = sin(vUv.y * 30.0 + vUv.x * 5.0 + time * 4.0) * 0.5 + 0.5;
                    
                    // Combine effects
                    float pattern = mix(verticalPattern, swirl, 0.5) * horizontalPulse * edgeEffect;
                    
                    // Add vertical fade for more realistic beam
                    float opacity = (1.0 - vUv.y * 0.8) * 0.9;
                    
                    // Pulsing brightness based on time
                    float pulse = sin(time * 3.0) * 0.1 + 0.9;
                    
                    // Combine final color 
                    vec3 finalColor = color * pulse;
                    
                    // Output final color with combined opacity
                    gl_FragColor = vec4(finalColor, opacity * pattern);
                }
            `,
      transparent: true,
      side: DoubleSide,
      blending: AdditiveBlending
      // Use additive blending for glowing effect
    });
    const beamGeometry = new CylinderGeometry(beamBottomRadius, beamTopRadius, beamHeight, 32, 16, true);
    this.teleportBeam = new Mesh(beamGeometry, beamMaterial);
    this.teleportBeam.position.set(0, -beamHeight / 2, -scale * 0.1);
    this.teleportBeam.rotation.x = Math.PI;
    this.teleportBeam.visible = false;
    this.ship.add(this.teleportBeam);
    this.createTeleportParticles(scale);
    this.createBeamImpactRing(scale);
  }
  createBeamImpactRing(scale) {
    const ringGeometry = new RingGeometry(scale * 0.1, scale * 0.22, 32);
    const ringMaterial = new ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new Color(3394815) }
      },
      vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
      fragmentShader: `
                uniform float time;
                uniform vec3 color;
                varying vec2 vUv;
                
                void main() {
                    // Animated ripple effect
                    float ripple = sin(distance(vUv, vec2(0.5)) * 20.0 - time * 5.0) * 0.5 + 0.5;
                    
                    // Rotating element
                    float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
                    float rotatingPattern = sin(angle * 8.0 + time * 3.0) * 0.5 + 0.5;
                    
                    // Pulsing opacity
                    float pulse = sin(time * 2.0) * 0.3 + 0.7;
                    
                    // Combine patterns
                    float pattern = mix(ripple, rotatingPattern, 0.5) * pulse;
                    
                    gl_FragColor = vec4(color, pattern * 0.7);
                }
            `,
      transparent: true,
      side: DoubleSide,
      blending: AdditiveBlending,
      depthWrite: false
    });
    this.impactRing = new Mesh(ringGeometry, ringMaterial);
    this.impactRing.position.set(0, -scale * 1, -scale * 0.1);
    this.impactRing.rotation.x = -Math.PI / 2;
    this.impactRing.visible = false;
    this.ship.add(this.impactRing);
  }
  createTeleportParticles(scale) {
    const particleCount = 800;
    const particleGeometry = new BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const isInnerBeam = Math.random() > 0.3;
      const radius = isInnerBeam ? Math.random() * scale * 0.03 : (
        // Inner beam
        scale * 0.03 + Math.random() * scale * 0.17
      );
      const theta = Math.random() * Math.PI * 2;
      const height = -(Math.random() * scale * 0.8);
      positions[i3] = radius * Math.cos(theta);
      positions[i3 + 1] = height;
      positions[i3 + 2] = radius * Math.sin(theta);
      if (isInnerBeam) {
        colors[i3] = 0.3 + Math.random() * 0.2;
        colors[i3 + 1] = 0.9 + Math.random() * 0.1;
        colors[i3 + 2] = 1;
      } else {
        colors[i3] = 0.1 + Math.random() * 0.1;
        colors[i3 + 1] = 0.7 + Math.random() * 0.3;
        colors[i3 + 2] = 0.9 + Math.random() * 0.1;
      }
      sizes[i] = isInnerBeam ? scale * 2e-3 + Math.random() * scale * 2e-3 : (
        // Small inner particles
        scale * 4e-3 + Math.random() * scale * 6e-3
      );
    }
    particleGeometry.setAttribute("position", new BufferAttribute(positions, 3));
    particleGeometry.setAttribute("color", new BufferAttribute(colors, 3));
    particleGeometry.setAttribute("size", new BufferAttribute(sizes, 1));
    const particleMaterial = new ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pointTexture: { value: this.createParticleTexture() }
      },
      vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                uniform float time;
                
                void main() {
                    vColor = color;
                    
                    // Animate size with time
                    float pulseFactor = sin(time * 2.0 + position.z * 0.1) * 0.3 + 0.7;
                    
                    // Calculate position
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    
                    // Size attenuation
                    gl_PointSize = size * pulseFactor * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
      fragmentShader: `
                uniform sampler2D pointTexture;
                varying vec3 vColor;
                
                void main() {
                    // Sample soft particle texture
                    vec4 texColor = texture2D(pointTexture, gl_PointCoord);
                    
                    // Apply color
                    gl_FragColor = vec4(vColor, texColor.r);
                }
            `,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      vertexColors: true
    });
    this.teleportParticles = new Points(particleGeometry, particleMaterial);
    this.teleportParticles.visible = false;
    this.teleportParticles.position.set(0, 0, -scale * 0.1);
    this.ship.add(this.teleportParticles);
  }
  createParticleTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext("2d");
    const gradient = context.createRadialGradient(
      32,
      32,
      0,
      32,
      32,
      32
    );
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.3, "rgba(255,255,255,0.8)");
    gradient.addColorStop(0.5, "rgba(255,255,255,0.4)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);
    const texture = new Texture(canvas);
    texture.needsUpdate = true;
    return texture;
  }
  createEngineTrailParticles(scale, engineZ, width) {
    const particleCount = 200;
    const particleGeometry = new BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const enginePositions = [];
    const enginesPerRow = 5;
    for (let i = 0; i < enginesPerRow; i++) {
      const posX = (i - (enginesPerRow - 1) / 2) * (width / (enginesPerRow - 1) * 0.8);
      enginePositions.push(posX);
    }
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const engineIndex = Math.floor(Math.random() * enginePositions.length);
      const engineX = enginePositions[engineIndex];
      const offsetX = (Math.random() - 0.5) * scale * 0.01;
      const offsetY = (Math.random() - 0.5) * scale * 0.01;
      const trailLength = Math.random() * scale * 0.5;
      positions[i3] = engineX + offsetX;
      positions[i3 + 1] = offsetY;
      positions[i3 + 2] = engineZ + engineX * 0.05 + trailLength;
      colors[i3] = 0.5 + Math.random() * 0.5;
      colors[i3 + 1] = 0.7 + Math.random() * 0.3;
      colors[i3 + 2] = 1;
      sizes[i] = (Math.random() * 0.5 + 0.5) * scale * 4e-3;
    }
    particleGeometry.setAttribute("position", new BufferAttribute(positions, 3));
    particleGeometry.setAttribute("color", new BufferAttribute(colors, 3));
    particleGeometry.setAttribute("size", new BufferAttribute(sizes, 1));
    const particleMaterial = new ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pointTexture: { value: this.createParticleTexture() }
      },
      vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                uniform float time;
                
                void main() {
                    vColor = color;
                    
                    // Animate size with time
                    float pulseFactor = sin(time * 2.0 + position.z * 0.1) * 0.3 + 0.7;
                    
                    // Calculate position
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    
                    // Size attenuation
                    gl_PointSize = size * pulseFactor * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
      fragmentShader: `
                uniform sampler2D pointTexture;
                varying vec3 vColor;
                
                void main() {
                    // Sample soft particle texture
                    vec4 texColor = texture2D(pointTexture, gl_PointCoord);
                    
                    // Apply color
                    gl_FragColor = vec4(vColor, texColor.r);
                }
            `,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      vertexColors: true
    });
    this.engineTrailParticles = new Points(particleGeometry, particleMaterial);
    this.ship.add(this.engineTrailParticles);
  }
  // Set engines power level (0-1)
  setEnginesPower(power) {
    this.engineGlows.forEach((glow, index) => {
      const isMainGlow = index % 2 === 0;
      if (isMainGlow) {
        glow.material.emissiveIntensity = 0.8 + power * 1.2;
        glow.material.opacity = 0.5 + power * 0.5;
      } else {
        glow.material.emissiveIntensity = 0.5 + power * 0.8;
        glow.material.opacity = 0.2 + power * 0.3;
      }
      const scale = 1 + power * 0.8;
      glow.scale.set(scale, scale, scale * 1.2);
    });
    if (this.engineTrailParticles) {
      this.engineTrailParticles.visible = power > 0.2;
      if (this.engineTrailParticles.geometry.attributes.size) {
        const sizes = this.engineTrailParticles.geometry.attributes.size.array;
        const baseSizes = this.engineTrailParticles.userData.baseSizes || Array.from(sizes);
        if (!this.engineTrailParticles.userData.baseSizes) {
          this.engineTrailParticles.userData.baseSizes = baseSizes;
        }
        for (let i = 0; i < sizes.length; i++) {
          sizes[i] = baseSizes[i] * (1 + power * 2);
        }
        this.engineTrailParticles.geometry.attributes.size.needsUpdate = true;
      }
    }
  }
  // Activate teleport beam
  activateTeleportBeam() {
    if (this.teleportBeam) {
      this.teleportBeam.visible = true;
      this.teleportParticles.visible = true;
      this.impactRing.visible = true;
      this.teleportBeamActive = true;
      this.teleportBeam.material.uniforms.time.value = 0;
      this.impactRing.material.uniforms.time.value = 0;
      if (this.teleportParticles.material.uniforms) {
        this.teleportParticles.material.uniforms.time.value = 0;
      }
    }
  }
  // Deactivate teleport beam
  deactivateTeleportBeam() {
    if (this.teleportBeam) {
      this.teleportBeam.visible = false;
      this.teleportParticles.visible = false;
      this.impactRing.visible = false;
      this.teleportBeamActive = false;
    }
  }
  // Update teleport beam effect
  updateTeleportBeam(progress) {
    if (!this.teleportBeamActive) return;
    const timeIncrement = 0.02;
    if (this.teleportBeam && this.teleportBeam.material.uniforms) {
      this.teleportBeam.material.uniforms.time.value += timeIncrement;
      const intensity = 0.3 + Math.sin(progress * Math.PI * 6) * 0.1;
      this.teleportBeam.material.uniforms.pulseAmplitude.value = intensity;
    }
    if (this.impactRing && this.impactRing.material.uniforms) {
      this.impactRing.material.uniforms.time.value += timeIncrement;
      const ringScale = 1 + Math.sin(progress * Math.PI * 3) * 0.2;
      this.impactRing.scale.set(ringScale, ringScale, 1);
    }
    if (this.teleportParticles && this.teleportParticles.material.uniforms) {
      this.teleportParticles.material.uniforms.time.value += timeIncrement;
      const positions = this.teleportParticles.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] -= 5;
        positions[i] += (Math.random() - 0.5) * 2;
        positions[i + 2] += (Math.random() - 0.5) * 2;
        if (positions[i + 1] < -1e3) {
          const isInnerBeam = Math.random() > 0.3;
          const radius = isInnerBeam ? Math.random() * 40 : (
            // Inner beam
            40 + Math.random() * 180
          );
          const theta = Math.random() * Math.PI * 2;
          positions[i] = radius * Math.cos(theta);
          positions[i + 1] = -(Math.random() * 400);
          positions[i + 2] = radius * Math.sin(theta);
        }
      }
      this.teleportParticles.geometry.attributes.position.needsUpdate = true;
    }
    if (this.engineTrailParticles && this.engineTrailParticles.material.uniforms) {
      this.engineTrailParticles.material.uniforms.time.value += timeIncrement;
    }
  }
}
class IntroSequence {
  constructor(scene, camera, spaceship, audioManager) {
    this.scene = scene;
    this.camera = camera;
    this.spaceship = spaceship;
    this.audio = audioManager;
    this.isPlaying = false;
    this.sequenceTime = 0;
    this.onComplete = null;
    this.skipEnabled = false;
    this.initialCameraPosition = null;
    this.initialCameraRotation = null;
    this.starDreadnought = new StarDreadnought(scene);
    this.setupPortalEffect();
    this.setupOverlay();
    this.dialogueBox = null;
    this.dialogueText = null;
    this.currentDialogueIndex = 0;
    this.isTyping = false;
    this.typeInterval = null;
    this.introSounds = {};
    this.dialogueWavs = [];
    this.dialogueLines = [
      "CORP CONTROLLER: [static] Belter #337, status check. Your cryostasis cycle is now complete.",
      `CORP CONTROLLER: Welcome to your deployment in the Sol System, circa 2077. As you can see, Earth is... well... let's just say "available for unrestricted mining operations" now.`,
      'CORP CONTROLLER: CorpEx Resource Acquisition reminds you that all planetary bodies in this system are now classified as "unclaimed assets" following the... unfortunate global circumstances.',
      "CORP CONTROLLER: Your primary objective is resource extraction from the asteroid belt. Initial scans show promising mineral concentrations untouched since the evacuation.",
      "CORP CONTROLLER: The Stargate remains your lifeline. Return for fuel, upgrades, trading, and your allocated 15 minutes of daily entertainment. Remember, a happy belter is a productive belter!",
      "CORP CONTROLLER: Resource extraction targets are non-negotiable. Failure to meet quotas will result in extension of your 42-year contract.",
      "CORP CONTROLLER: Oh, and our long-range scans have detected spectral drone activity in adjacent sectors. Remnants of old defense systems, probably. Nothing a resourceful belter like you can't handle.",
      "CORP CONTROLLER: Connection terminating in 3...2...1... Don't die out there, #337. Replacement clones are expensive.",
      "[TRANSMISSION TERMINATED]",
      "[BELTER #337 DEPLOYMENT ACTIVE]"
    ];
    console.log("Intro sequence initialized");
    this.loadDialogueWavs();
    this.createIntroSoundEffects();
  }
  // Load dialogue WAV files (1.wav through 8.wav)
  loadDialogueWavs() {
    console.log("Loading dialogue WAV files...");
    try {
      for (let i = 1; i <= 8; i++) {
        const audioPath = getAbsolutePath(`sounds/dialogue/${i}.wav`);
        console.log(`Attempting to load dialogue file: ${audioPath}`);
        const audio = new Audio();
        audio.addEventListener("canplaythrough", () => {
          console.log(`Dialogue WAV ${i} loaded successfully`);
        });
        audio.addEventListener("error", (e) => {
          console.warn(`Dialogue WAV ${i} not found or couldn't be loaded - this is normal if you haven't added the files yet`);
        });
        audio.src = audioPath;
        this.dialogueWavs.push(audio);
      }
      console.log("Dialogue WAV files setup complete - they'll be used if available");
    } catch (error) {
      console.error("Error in dialogue WAV files setup:", error);
    }
  }
  // Create custom Tone.js sound effects for the intro sequence
  createIntroSoundEffects() {
    if (typeof Tone === "undefined") {
      console.error("Tone.js not available for intro sound effects");
      return;
    }
    try {
      console.log("Creating intro sequence sound effects...");
      this.createWarpSound();
      this.createShipArrivalSound();
      this.createTeleportSound();
      console.log("Intro sequence sound effects created");
    } catch (error) {
      console.error("Error creating intro sound effects:", error);
    }
  }
  // Create warp portal sound effect
  createWarpSound() {
    try {
      const destination = this.audio && this.audio.masterEQ ? this.audio.masterEQ : Tone.Destination;
      const warpFilter = new Tone.Filter({
        type: "lowpass",
        frequency: 2e3,
        Q: 2
      }).connect(destination);
      const warpReverb = new Tone.Reverb({
        decay: 2,
        wet: 0.5
      }).connect(warpFilter);
      const warpSynth = new Tone.FMSynth({
        harmonicity: 3,
        modulationIndex: 10,
        oscillator: {
          type: "sine"
        },
        envelope: {
          attack: 0.1,
          decay: 0.2,
          sustain: 0.8,
          release: 1.5
        },
        modulation: {
          type: "square"
        },
        modulationEnvelope: {
          attack: 0.5,
          decay: 0.1,
          sustain: 0.2,
          release: 0.5
        }
      }).connect(warpReverb);
      const noiseFilter = new Tone.Filter({
        type: "bandpass",
        frequency: 700,
        Q: 0.6
      }).connect(destination);
      const noiseGain = new Tone.Gain(0.3).connect(noiseFilter);
      const noise = new Tone.Noise("pink").connect(noiseGain);
      this.introSounds.warp = {
        lastPlayTime: 0,
        // Track when we last played this sound
        play: () => {
          if (this.audio && this.audio.muted) return;
          const now = Tone.now();
          if (now - this.introSounds.warp.lastPlayTime < 0.1) {
            console.log("Preventing too rapid warp sound playback");
            return;
          }
          this.introSounds.warp.lastPlayTime = now;
          const volumeLevel = this.audio ? this.audio.sfxVolume * 0.36 : 0.18;
          warpSynth.volume.value = Tone.gainToDb(volumeLevel);
          noise.start();
          warpSynth.triggerAttack("C5", now);
          warpSynth.frequency.exponentialRampTo("C2", 2, now);
          noiseGain.gain.setValueAtTime(0.18, now);
          noiseGain.gain.exponentialRampTo(0.01, 3, now + 1);
          setTimeout(() => {
            warpSynth.triggerRelease();
            setTimeout(() => {
              noise.stop();
            }, 500);
          }, 3e3);
        }
      };
    } catch (error) {
      console.error("Error creating warp sound:", error);
    }
  }
  // Create ship arrival sound effect
  createShipArrivalSound() {
    try {
      const destination = this.audio && this.audio.masterEQ ? this.audio.masterEQ : Tone.Destination;
      const arrivalFilter = new Tone.Filter({
        type: "lowpass",
        frequency: 1200,
        Q: 1
      }).connect(destination);
      const arrivalSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: "triangle"
        },
        envelope: {
          attack: 0.02,
          decay: 0.3,
          sustain: 0.1,
          release: 0.8
        }
      }).connect(arrivalFilter);
      const rumbleFilter = new Tone.Filter({
        type: "lowpass",
        frequency: 200,
        Q: 0.5
      }).connect(destination);
      const rumbleSynth = new Tone.Synth({
        oscillator: {
          type: "sine"
        },
        envelope: {
          attack: 0.1,
          decay: 0.3,
          sustain: 0.6,
          release: 1
        }
      }).connect(rumbleFilter);
      this.introSounds.shipArrival = {
        play: () => {
          if (this.audio && this.audio.muted) return;
          const now = Tone.now();
          const volumeLevel = this.audio ? this.audio.sfxVolume * 0.42 : 0.24;
          arrivalSynth.volume.value = Tone.gainToDb(volumeLevel);
          rumbleSynth.volume.value = Tone.gainToDb(volumeLevel * 0.8);
          arrivalSynth.triggerAttackRelease(["G3", "D4", "A4"], 1.5, now);
          rumbleSynth.triggerAttack("G1", now);
          rumbleSynth.frequency.exponentialRampTo("C2", 2, now + 0.5);
          setTimeout(() => {
            rumbleSynth.triggerRelease();
          }, 2e3);
        }
      };
    } catch (error) {
      console.error("Error creating ship arrival sound:", error);
    }
  }
  // Create teleport beam sound effect
  createTeleportSound() {
    try {
      const destination = this.audio && this.audio.masterEQ ? this.audio.masterEQ : Tone.Destination;
      const teleportFilter = new Tone.Filter({
        type: "bandpass",
        frequency: 800,
        Q: 2
      }).connect(destination);
      const teleportChorus = new Tone.Chorus({
        frequency: 1.5,
        delayTime: 3.5,
        depth: 0.7,
        wet: 0.5
      }).connect(teleportFilter).start();
      const teleportSynth = new Tone.Synth({
        oscillator: {
          type: "sine"
        },
        envelope: {
          attack: 0.05,
          decay: 0.2,
          sustain: 0.8,
          release: 1
        }
      }).connect(teleportChorus);
      const beamFilter = new Tone.Filter({
        type: "highpass",
        frequency: 2e3,
        Q: 1
      }).connect(destination);
      const beamSynth = new Tone.Synth({
        oscillator: {
          type: "square"
        },
        envelope: {
          attack: 0.01,
          decay: 0.1,
          sustain: 0.6,
          release: 0.5
        }
      }).connect(beamFilter);
      this.introSounds.teleport = {
        play: () => {
          if (this.audio && this.audio.muted) return;
          const now = Tone.now();
          const volumeLevel = this.audio ? this.audio.sfxVolume * 0.3 : 0.18;
          teleportSynth.volume.value = Tone.gainToDb(volumeLevel);
          beamSynth.volume.value = Tone.gainToDb(volumeLevel * 0.4);
          teleportSynth.triggerAttack("C4", now);
          teleportSynth.frequency.exponentialRampTo("C6", 1.5, now);
          beamSynth.triggerAttackRelease("E7", 0.1, now + 0.3);
          setTimeout(() => {
            beamSynth.triggerAttackRelease("G7", 0.1, now + 0.5);
          }, 200);
          setTimeout(() => {
            teleportSynth.triggerRelease();
          }, 2e3);
        }
      };
    } catch (error) {
      console.error("Error creating teleport sound:", error);
    }
  }
  setupDialogueUI() {
    this.dialogueBox = document.createElement("div");
    this.dialogueBox.id = "intro-dialogue";
    this.dialogueBox.style.position = "fixed";
    this.dialogueBox.style.bottom = "50px";
    this.dialogueBox.style.left = "50%";
    this.dialogueBox.style.transform = "translateX(-50%)";
    this.dialogueBox.style.width = "80%";
    this.dialogueBox.style.maxWidth = "800px";
    this.dialogueBox.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    this.dialogueBox.style.color = "#30f0c0";
    this.dialogueBox.style.border = "1px solid #30f0c0";
    this.dialogueBox.style.borderRadius = "5px";
    this.dialogueBox.style.padding = "15px";
    this.dialogueBox.style.fontFamily = "Courier New, monospace";
    this.dialogueBox.style.fontSize = "16px";
    this.dialogueBox.style.zIndex = "10000";
    this.dialogueBox.style.textShadow = "0 0 5px #30f0c0";
    this.dialogueBox.style.boxShadow = "0 0 10px rgba(48, 240, 192, 0.3)";
    this.dialogueBox.style.opacity = "0";
    this.dialogueBox.style.transition = "opacity 0.5s";
    this.dialogueText = document.createElement("div");
    this.dialogueText.style.lineHeight = "1.5";
    this.dialogueBox.appendChild(this.dialogueText);
    document.body.appendChild(this.dialogueBox);
    setTimeout(() => {
      this.dialogueBox.style.opacity = "1";
    }, 200);
  }
  typeNextDialogue() {
    if (this.currentDialogueIndex >= this.dialogueLines.length) {
      return;
    }
    const line = this.dialogueLines[this.currentDialogueIndex];
    if (this.currentDialogueIndex < 8 && this.dialogueWavs[this.currentDialogueIndex]) {
      try {
        const dialogueAudio = this.dialogueWavs[this.currentDialogueIndex];
        if (dialogueAudio.readyState > 0 && dialogueAudio.error === null) {
          dialogueAudio.volume = this.audio ? this.audio.sfxVolume * 0.8 : 0.5;
          dialogueAudio.currentTime = 0;
          const playPromise = dialogueAudio.play();
          if (playPromise !== void 0) {
            playPromise.catch((err) => {
              console.warn(`Couldn't play dialogue WAV ${this.currentDialogueIndex}: ${err.message}`);
            });
          }
        } else {
          console.log(`Skipping dialogue WAV ${this.currentDialogueIndex + 1} (not loaded)`);
        }
      } catch (error) {
        console.warn(`Error playing dialogue WAV ${this.currentDialogueIndex + 1}, continuing without audio`, error.message);
      }
    }
    this.currentDialogueIndex++;
    this.dialogueText.textContent = "";
    if (this.dialogueBox.style.opacity === "0") {
      this.dialogueBox.style.opacity = "1";
    }
    let charIndex = 0;
    this.isTyping = true;
    if (this.typeInterval) {
      clearInterval(this.typeInterval);
    }
    if (line.includes("TRANSMISSION TERMINATED") || line.includes("DEPLOYMENT ACTIVE")) {
      this.dialogueText.style.color = "#ff3030";
    } else {
      this.dialogueText.style.color = "#30f0c0";
    }
    this.typeInterval = setInterval(() => {
      if (charIndex < line.length) {
        this.dialogueText.textContent += line.charAt(charIndex);
        charIndex++;
        if (this.audio && this.audio.playSound && charIndex % 3 === 0) {
          if (typeof this.audio.playSound === "function") {
            try {
              this.audio.playSound("uiClick", 0.1);
            } catch (e) {
            }
          }
        }
      } else {
        clearInterval(this.typeInterval);
        this.typeInterval = null;
        this.isTyping = false;
        if (this.sequenceTime < 22) {
          const waitTime = Math.max(line.length * 50, 3e3);
          setTimeout(() => {
            if (!this.isTyping && this.isPlaying) {
              this.typeNextDialogue();
            }
          }, waitTime);
        }
      }
    }, 30);
  }
  setupPortalEffect() {
    const portalGeometry = new RingGeometry(0, 400, 64);
    const portalMaterial = new ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new Color(6697898) }
      },
      vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
      fragmentShader: `
                uniform float time;
                uniform vec3 color;
                varying vec2 vUv;
                
                void main() {
                    float distFromCenter = length(vUv - vec2(0.5, 0.5)) * 2.0;
                    float ripple = sin(distFromCenter * 20.0 - time * 3.0) * 0.5 + 0.5;
                    float alpha = (1.0 - distFromCenter) * ripple;
                    
                    vec3 finalColor = color * (0.8 + ripple * 0.4);
                    gl_FragColor = vec4(finalColor, alpha);
                }
            `,
      transparent: true,
      side: DoubleSide
    });
    this.warpPortal = new Mesh(portalGeometry, portalMaterial);
    const particleCount = 500;
    const particles = new BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 350 + Math.random() * 150;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50;
    }
    particles.setAttribute("position", new BufferAttribute(positions, 3));
    const particleMaterial = new PointsMaterial({
      color: 11154431,
      size: 3,
      transparent: true,
      blending: AdditiveBlending
    });
    this.portalParticles = new Points(particles, particleMaterial);
    this.warpTunnel = new Group();
    this.warpTunnel.add(this.warpPortal);
    this.warpTunnel.add(this.portalParticles);
  }
  setupOverlay() {
    this.overlay = document.createElement("div");
    this.overlay.id = "intro-overlay";
    this.overlay.style.position = "fixed";
    this.overlay.style.top = "0";
    this.overlay.style.left = "0";
    this.overlay.style.width = "100%";
    this.overlay.style.height = "100%";
    this.overlay.style.backgroundColor = "#aa33ff";
    this.overlay.style.opacity = "0";
    this.overlay.style.transition = "opacity 0.5s";
    this.overlay.style.pointerEvents = "none";
    this.overlay.style.zIndex = "9999";
    document.body.appendChild(this.overlay);
  }
  startSequence(onComplete) {
    if (this.isPlaying) return;
    console.log("Starting intro sequence...");
    this.isPlaying = true;
    this.sequenceTime = 0;
    this.onComplete = onComplete;
    this.initialCameraPosition = this.camera.position.clone();
    this.initialCameraRotation = this.camera.rotation.clone();
    this.camera.position.set(0, 6e3, 12e3);
    this.camera.lookAt(3e4, 5e3, 0);
    if (this.spaceship && this.spaceship.mesh) {
      this.spaceship.mesh.visible = false;
      if (this.spaceship.thrust) {
        this.spaceship.thrust.forward = false;
        this.spaceship.thrust.backward = false;
        this.spaceship.thrust.left = false;
        this.spaceship.thrust.right = false;
        this.spaceship.thrust.boost = false;
      }
      if (this.spaceship.velocity) {
        this.spaceship.velocity.set(0, 0, 0);
      }
    }
    this.scene.add(this.warpTunnel);
    this.starDreadnought.ship.position.set(35e3, 5e3, 0);
    this.starDreadnought.ship.rotation.y = Math.PI / 2;
    this.starDreadnought.ship.visible = false;
    this.animate = this.animate.bind(this);
    this.lastTime = performance.now();
    requestAnimationFrame(this.animate);
    this.setupSkipHandler();
    this.setupDialogueUI();
    setTimeout(() => {
      this.typeNextDialogue();
    }, 2e3);
    if (this.introSounds.warp) {
      this.introSounds.warp.lastPlayTime = Tone.now() - 1;
      this.introSounds.warp.play();
    }
  }
  animate(currentTime) {
    if (!this.isPlaying) return;
    const deltaTime = Math.min((currentTime - this.lastTime) / 1e3, 0.1) * 0.4;
    this.lastTime = currentTime;
    this.sequenceTime += deltaTime;
    if (this.sequenceTime < 14) {
      this.updateArrivalPhase(this.sequenceTime / 14);
    } else if (this.sequenceTime < 24) {
      this.updateDeparturePhase((this.sequenceTime - 14) / 10);
    } else {
      this.completeSequence();
      return;
    }
    requestAnimationFrame(this.animate);
  }
  updateArrivalPhase(progress) {
    if (this.warpPortal && this.warpPortal.material.uniforms) {
      this.warpPortal.material.uniforms.time.value += 0.016;
    }
    this.warpTunnel.position.set(3e4, 5e3, 0);
    this.warpTunnel.rotation.z = Math.PI / 2;
    if (progress < 0.2) {
      const portalProgress = progress / 0.2;
      const portalScale = portalProgress * 3.5;
      this.warpTunnel.scale.set(portalScale, portalScale, 1);
      this.camera.position.set(0, 6e3, 12e3);
      this.camera.lookAt(3e4, 5e3, 0);
    }
    if (progress >= 0.2 && progress < 0.7) {
      if (progress >= 0.2 && !this.starDreadnought.ship.visible) {
        this.starDreadnought.ship.visible = true;
        this.flashOverlay(0.3);
        if (this.introSounds.shipArrival) {
          this.introSounds.shipArrival.play();
        }
      }
      const t = (progress - 0.2) / 0.5;
      const easeInOut = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const start = new Vector3(3e4, 5e3, 0);
      const control = new Vector3(26e3, 5300, -2e3);
      const end = new Vector3(22e3, 5e3, 0);
      const p0 = new Vector3();
      const p1 = new Vector3();
      const p2 = new Vector3();
      p0.copy(start).multiplyScalar(Math.pow(1 - easeInOut, 2));
      p1.copy(control).multiplyScalar(2 * (1 - easeInOut) * easeInOut);
      p2.copy(end).multiplyScalar(easeInOut * easeInOut);
      const position = new Vector3().add(p0).add(p1).add(p2);
      position.y += Math.sin(progress * Math.PI * 3) * 80;
      this.starDreadnought.ship.position.copy(position);
      const enginePower = 0.4 + easeInOut * 0.6;
      this.starDreadnought.setEnginesPower(enginePower);
      if (progress > 0.3) {
        const portalFade = Math.min((progress - 0.3) / 0.3, 1);
        if (this.portalParticles.material) {
          this.portalParticles.material.opacity = 1 - portalFade;
        }
        if (this.warpPortal.material) {
          this.warpPortal.material.opacity = 1 - portalFade;
        }
      }
      const shipPos = this.starDreadnought.ship.position.clone();
      this.camera.position.set(
        shipPos.x - 3e3,
        shipPos.y + 1e3,
        8e3
      );
      this.camera.lookAt(shipPos);
    }
    if (progress >= 0.7) {
      if (this.portalParticles.material) {
        this.portalParticles.material.opacity = 0;
      }
      if (this.warpPortal.material) {
        this.warpPortal.material.opacity = 0;
      }
      if (progress < 0.75 && !this.starDreadnought.teleportBeamActive) {
        this.starDreadnought.activateTeleportBeam();
        if (this.introSounds.teleport) {
          this.introSounds.teleport.play();
        }
      }
      this.starDreadnought.updateTeleportBeam(progress);
      if (progress > 0.8 && this.spaceship && !this.spaceship.mesh.visible) {
        const dreadPos = this.starDreadnought.ship.position;
        this.spaceship.mesh.position.set(
          dreadPos.x,
          dreadPos.y - 2e3,
          // 2000 units below dreadnought
          dreadPos.z
        );
        if (this.spaceship.isDocked) {
          console.log("Undocking player ship during intro sequence");
          this.spaceship.isDocked = false;
          this.spaceship.mesh.visible = true;
        } else {
          this.spaceship.mesh.visible = true;
        }
        this.finalPlayerPosition = this.spaceship.mesh.position.clone();
        this.createPlayerShieldEffect();
        this.flashOverlay(0.3);
      }
      const shipPos = this.starDreadnought.ship.position.clone();
      const t = (progress - 0.7) / 0.3;
      this.camera.position.set(
        shipPos.x - 2e3 + t * 2e3,
        shipPos.y + 2e3,
        5e3 - t * 3e3
      );
      const lookY = shipPos.y - 1e3;
      this.camera.lookAt(shipPos.x, lookY, shipPos.z);
    }
  }
  updateDeparturePhase(progress) {
    const portalPos = new Vector3(3e4, 5e3, 0);
    if (progress < 0.5) {
      if (progress < 0.1 && this.starDreadnought.teleportBeamActive) {
        this.starDreadnought.deactivateTeleportBeam();
      }
      if (progress > 0.1) {
        this.warpTunnel.position.copy(portalPos);
        this.warpTunnel.visible = true;
        this.warpTunnel.rotation.z = Math.PI / 2;
        this.warpTunnel.scale.set(3.5, 3.5, 1);
        const portalProgress = Math.min((progress - 0.1) / 0.3, 1);
        if (this.portalParticles.material) {
          this.portalParticles.material.opacity = portalProgress;
        }
        if (this.warpPortal.material) {
          this.warpPortal.material.opacity = portalProgress;
        }
      }
      if (progress > 0.2) {
        const rotateProgress = Math.min((progress - 0.2) / 0.3, 1);
        const startRot = Math.PI / 2;
        const endRot = 3 * Math.PI / 2;
        this.starDreadnought.ship.rotation.y = startRot + (endRot - startRot) * rotateProgress;
      }
      const shipPos = this.starDreadnought.ship.position.clone();
      this.camera.position.set(
        shipPos.x,
        shipPos.y + 3e3,
        // High-ish angle
        shipPos.z + 8e3
        // Side view
      );
      this.camera.lookAt(shipPos);
    } else {
      const moveProgress = (progress - 0.5) / 0.5;
      const startPos = new Vector3(22e3, 5e3, 0);
      const beyondPos = new Vector3(35e3, 5e3, 0);
      const easeIn = moveProgress * moveProgress;
      let position;
      if (moveProgress < 0.7) {
        const t = easeIn / 0.5;
        position = new Vector3().lerpVectors(startPos, portalPos, t);
      } else {
        const t = (moveProgress - 0.7) / 0.3;
        position = new Vector3().lerpVectors(portalPos, beyondPos, t);
      }
      this.starDreadnought.ship.position.copy(position);
      this.starDreadnought.setEnginesPower(0.7 + moveProgress * 0.8);
      if (moveProgress > 0.6 && moveProgress < 0.63) {
        this.flashOverlay(0.4);
        if (this.introSounds.warp && Math.abs(moveProgress - 0.61) < 0.01) {
          this.introSounds.warp.play();
        }
      }
      if (moveProgress > 0.65) {
        this.starDreadnought.ship.visible = false;
      }
      if (moveProgress > 0.9) {
        const collapseProgress = (moveProgress - 0.9) / 0.1;
        const collapseScale = (1 - collapseProgress) * 3.5;
        this.warpTunnel.scale.set(collapseScale, collapseScale, 1);
      }
      const shipPos = startPos.clone();
      this.camera.position.set(
        shipPos.x - 2e3,
        shipPos.y + 3e3,
        1e4
        // Side view
      );
      const lookPos = new Vector3().lerpVectors(startPos, portalPos, 0.5);
      this.camera.lookAt(lookPos);
    }
  }
  createPlayerShieldEffect() {
    const geometry = new SphereGeometry(30, 32, 32);
    const material = new MeshBasicMaterial({
      color: 8965375,
      transparent: true,
      opacity: 0.6,
      side: DoubleSide
    });
    this.playerShieldEffect = new Mesh(geometry, material);
    this.playerShieldEffect.scale.set(1.2, 1.2, 1.2);
    this.spaceship.mesh.add(this.playerShieldEffect);
    this.shieldPulseTime = 0;
  }
  // Update portal shader uniforms
  updatePortalEffect() {
    if (this.warpPortal && this.warpPortal.material.uniforms) {
      this.warpPortal.material.uniforms.time.value += 0.016;
    }
  }
  flashOverlay(maxOpacity = 0.6) {
    if (!this.overlay) return;
    this.overlay.style.opacity = maxOpacity.toString();
    setTimeout(() => {
      this.overlay.style.opacity = "0";
    }, 300);
  }
  setupSkipHandler() {
    const skipButton = document.createElement("div");
    skipButton.id = "skip-intro-button";
    skipButton.textContent = "SKIP INTRO";
    skipButton.style.position = "fixed";
    skipButton.style.bottom = "10px";
    skipButton.style.left = "50%";
    skipButton.style.transform = "translateX(-50%)";
    skipButton.style.padding = "10px 15px";
    skipButton.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    skipButton.style.color = "#30f0c0";
    skipButton.style.border = "1px solid #30f0c0";
    skipButton.style.borderRadius = "5px";
    skipButton.style.cursor = "pointer";
    skipButton.style.zIndex = "10000";
    skipButton.style.fontFamily = "Courier New, monospace";
    skipButton.style.boxShadow = "0 0 10px rgba(48, 240, 192, 0.3)";
    skipButton.addEventListener("click", () => {
      this.skipSequence();
    });
    document.body.appendChild(skipButton);
    this.skipButton = skipButton;
  }
  skipSequence() {
    console.log("Skipping intro sequence");
    this.completeSequence();
    if (this.spaceship) {
      this.spaceship.isDocked = true;
      if (this.spaceship.mesh) {
        this.spaceship.mesh.position.set(22e3, 5e3, 0);
      }
    }
    if (window.gameInstance && window.gameInstance.controls && window.gameInstance.controls.dockingSystem) {
      setTimeout(() => {
        window.gameInstance.controls.dockingSystem.dockWithStargate();
        console.log("Stargate UI shown after skip");
      }, 100);
    }
  }
  completeSequence() {
    console.log("Intro sequence complete");
    this.isPlaying = false;
    this.scene.remove(this.warpTunnel);
    this.starDreadnought.ship.visible = false;
    this.skipEnabled = true;
    if (this.playerShieldEffect) {
      this.spaceship.mesh.remove(this.playerShieldEffect);
      this.playerShieldEffect = null;
    }
    if (this.skipButton) {
      document.body.removeChild(this.skipButton);
      this.skipButton = null;
    }
    if (this.overlay) {
      document.body.removeChild(this.overlay);
      this.overlay = null;
    }
    if (this.dialogueBox) {
      document.body.removeChild(this.dialogueBox);
      this.dialogueBox = null;
    }
    if (this.typeInterval) {
      clearInterval(this.typeInterval);
      this.typeInterval = null;
    }
    if (this.spaceship && this.spaceship.mesh) {
      this.spaceship.mesh.visible = true;
      if (this.spaceship.isDocked) {
        console.log("Forcing ship to undocked state after intro sequence");
        this.spaceship.isDocked = false;
      }
      console.log(
        "Player final position:",
        this.spaceship.mesh.position.x,
        this.spaceship.mesh.position.y,
        this.spaceship.mesh.position.z
      );
    }
    if (this.onComplete && typeof this.onComplete === "function") {
      setTimeout(() => {
        console.log("Executing intro sequence completion callback");
        this.onComplete();
      }, 100);
    }
  }
  /**
   * Clean up resources when intro sequence is no longer needed
   */
  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.typeInterval) {
      clearInterval(this.typeInterval);
      this.typeInterval = null;
    }
    if (this.dialogueBox && this.dialogueBox.parentNode) {
      this.dialogueBox.parentNode.removeChild(this.dialogueBox);
    }
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    document.removeEventListener("keydown", this.skipHandler);
    if (this.portalMesh && this.portalMesh.parent) {
      this.portalMesh.parent.remove(this.portalMesh);
    }
    if (this.portalFlare && this.portalFlare.parent) {
      this.portalFlare.parent.remove(this.portalFlare);
    }
    if (this.portalMesh) {
      if (this.portalMesh.geometry) this.portalMesh.geometry.dispose();
      if (this.portalMesh.material) this.portalMesh.material.dispose();
    }
    if (this.portalFlare) {
      if (this.portalFlare.geometry) this.portalFlare.geometry.dispose();
      if (this.portalFlare.material) this.portalFlare.material.dispose();
    }
    if (this.starDreadnought && typeof this.starDreadnought.destroy === "function") {
      this.starDreadnought.destroy();
    }
    if (this.introSounds) {
      Object.values(this.introSounds).forEach((sound) => {
        if (sound.dispose && typeof sound.dispose === "function") {
          sound.dispose();
        }
      });
      this.introSounds = {};
    }
    this.scene = null;
    this.camera = null;
    this.spaceship = null;
    this.audio = null;
    this.starDreadnought = null;
    this.portalMesh = null;
    this.portalFlare = null;
    this.portalGeometry = null;
    this.portalMaterial = null;
    this.dialogueWavs = [];
  }
}
class PerfOverlay {
  constructor() {
    if (!window.__perf) {
      window.__perf = {
        enabled: false,
        fps: 0,
        simMs: 0,
        renderMs: 0,
        drawCalls: 0,
        visibleInstances: 0,
        pools: { hits: 0, misses: 0 },
        gc: 0,
        systems: {}
      };
    }
    this.panel = null;
    this.lastUpdate = 0;
    this.updateHzMs = 500;
    try {
      if ("PerformanceObserver" in window && performance && performance.observe) {
      }
      if ("PerformanceObserver" in window) {
        const obs = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === "gc") {
              if (!window.__perf.gc) window.__perf.gc = 0;
              window.__perf.gc += 1;
            }
          }
        });
        obs.observe({ entryTypes: ["gc"] });
        this._gcObserver = obs;
      }
    } catch {
    }
    {
      document.addEventListener("keydown", (e) => {
        if (e.key === "F3") {
          this.toggle();
        }
      });
    }
  }
  toggle() {
    window.__perf.enabled = !window.__perf.enabled;
    if (window.__perf.enabled) {
      this.ensurePanel();
      this.renderOnce();
    } else {
      this.destroy();
    }
  }
  ensurePanel() {
    if (this.panel) return;
    const el = document.createElement("div");
    el.id = "perf-overlay";
    el.style.position = "fixed";
    el.style.top = "8px";
    el.style.right = "8px";
    el.style.minWidth = "220px";
    el.style.maxWidth = "320px";
    el.style.background = "rgba(0,0,0,0.6)";
    el.style.color = "#9ef7ff";
    el.style.fontFamily = "monospace";
    el.style.fontSize = "12px";
    el.style.lineHeight = "1.4";
    el.style.padding = "8px 10px";
    el.style.border = "1px solid rgba(158,247,255,0.3)";
    el.style.borderRadius = "6px";
    el.style.zIndex = "99999";
    el.style.pointerEvents = "none";
    el.innerHTML = this.renderContent();
    document.body.appendChild(el);
    this.panel = el;
    this.interval = setInterval(() => this.renderOnce(), this.updateHzMs);
  }
  renderOnce() {
    if (!this.panel) return;
    this.panel.innerHTML = this.renderContent();
  }
  renderContent() {
    var _a, _b;
    const p = window.__perf;
    const systems = p.systems ? Object.entries(p.systems).slice(0, 8) : [];
    const sysHtml = systems.map(([k, v]) => `<div>${k}: ${Number(v).toFixed(2)} ms</div>`).join("");
    return `<div style="opacity:.85"><div><b>Perf Overlay</b> (F3)</div><div>FPS: ${Math.round(p.fps || 0)}</div><div>Sim: ${Number(p.simMs || 0).toFixed(2)} ms</div><div>Render: ${Number(p.renderMs || 0).toFixed(2)} ms</div><div>DrawCalls: ${p.drawCalls || 0}</div><div>Instances: ${p.visibleInstances || 0}</div><div>Pool hits/misses: ${((_a = p.pools) == null ? void 0 : _a.hits) || 0} / ${((_b = p.pools) == null ? void 0 : _b.misses) || 0}</div><div>GC: ${p.gc || 0}</div><div style="margin-top:6px; border-top:1px solid rgba(158,247,255,.2)"><div><b>Systems</b></div>` + sysHtml + `</div></div>`;
  }
  destroy() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    if (this._gcObserver && this._gcObserver.disconnect) {
      this._gcObserver.disconnect();
      this._gcObserver = null;
    }
    if (this.panel && this.panel.parentNode) {
      this.panel.parentNode.removeChild(this.panel);
    }
    this.panel = null;
  }
}
function initPerfOverlay() {
  if (!window.__perfOverlay) {
    window.__perfOverlay = new PerfOverlay();
  }
  return window.__perfOverlay;
}
window.DEBUG_MODE = false;
window.vectorPool = {
  pool: [],
  maxSize: 100,
  get: function(x = 0, y = 0, z = 0) {
    if (this.pool.length > 0) {
      return this.pool.pop().set(x, y, z);
    }
    return new Vector3(x, y, z);
  },
  release: function(vector) {
    if (this.pool.length < this.maxSize) {
      this.pool.push(vector);
    }
  }
};
class Game {
  constructor() {
    /**
     * Handle window resize event
     * @private
     */
    __publicField(this, "handleResize", () => {
      if (this.renderer) {
        this.renderer.handleResize();
      }
    });
    /**
     * Handle visibility change event
     * @private
     */
    __publicField(this, "handleVisibilityChange", () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    });
    /**
     * Handle key down event
     * @param {KeyboardEvent} e Key event
     * @private
     */
    __publicField(this, "handleKeyDown", (e) => {
      if (e.key === "Escape" && document.pointerLockElement) {
        document.exitPointerLock();
      }
      if (e.key.toLowerCase() === "m" && this.audio) {
        const isMuted = this.audio.toggleMute();
        console.log(`Audio ${isMuted ? "muted" : "unmuted"}`);
      }
      if (e.key.toLowerCase() === "d" && e.shiftKey) {
        this.toggleDebugMode();
      }
    });
    console.log("Initializing game...");
    window.game = this;
    window.mainMessageBus = new MessageBus();
    window.mainMessageBus.subscribe("game.over", this.gameOver.bind(this));
    try {
      console.log("Creating audio manager...");
      this.audio = new AudioManager();
      console.log("Creating renderer...");
      this.renderer = new Renderer();
      console.log("Renderer created, getting scene...");
      this.scene = this.renderer.scene;
      this.camera = this.renderer.camera;
      console.log("Scene and camera references obtained");
      this.scene.camera = this.camera;
      console.log("Initializing essential components...");
      this.physics = new Physics(this.scene);
      this.physics.setCamera(this.camera);
      this.environment = new Environment(this.scene);
      console.log("Creating spaceship...");
      this.spaceship = new Spaceship(this.scene);
      this.physics.setSpaceship(this.spaceship);
      this.environment.setSpaceship(this.spaceship);
      this.ui = new UI(this.spaceship, this.environment);
      this.ui.setAudio(this.audio);
      this.controls = new Controls(this.spaceship, this.physics, this.environment, this.ui);
      this.ui.setControls(this.controls);
      console.log("Initializing settings...");
      this.ui.initializeSettings(this);
      this.isGameOver = false;
      this.lastUpdateTime = performance.now();
      this.frameCount = 0;
      this.currentFPS = 0;
      this.introSequenceActive = false;
      this.gameTime = 0;
      initPerfOverlay();
      if (!window.__perf) window.__perf = {};
      window.__perf.enabled = false;
      this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
      this.frameRateCap = 0;
      this.warmupFrames = 10;
      this.currentWarmupFrame = 0;
      this.performanceStable = false;
      if (this.ui && this.ui.settings) {
        this.applyFrameRateSettings();
      }
      this.lastFrameTime = 0;
      this.actualFrameTime = 0;
      this.frameStartTime = 0;
      this.accumulator = 0;
      this.fixedDeltaTime = 1 / 60;
      this.fpsBuffer = [];
      this.fpsBufferSize = 15;
      console.log("Initializing difficulty manager...");
      this.initializeDifficultyManager();
      this.setupEventHandlers();
      this.boundAnimate = this.animate.bind(this);
      this.deltaTime = 0;
      this.initializeGameSequence();
    } catch (error) {
      console.error("Error in game initialization:", error);
      throw error;
    }
  }
  // Initialize game in sequence, showing start screen first and loading non-essentials after
  async initializeGameSequence() {
    try {
      console.log("Starting game initialization sequence...");
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (this.audio && this.audio.audioContext && this.audio.audioContext.state === "suspended") {
        try {
          this.audio.resumeAudioContext();
        } catch (e) {
          console.log("Audio context couldn't be resumed yet, will try again after user interaction");
        }
      }
      if (this.ui && this.ui.startScreen) {
        console.log("Showing start screen");
        this.ui.startScreen.show();
      } else {
        console.error("Start screen not found, falling back to default behavior");
        this.fallbackToDefaultBehavior();
      }
      console.log("Starting game loop with warm-up frames");
      requestAnimationFrame(this.boundAnimate);
      this.initializeRemainingSystemsAsync();
      console.log("Game initialization sequence completed successfully");
    } catch (error) {
      console.error("Error during game initialization sequence:", error);
      if (this.ui && this.ui.showError) {
        this.ui.showError("Failed to initialize game: " + error.message);
      } else {
        alert("Failed to initialize game: " + error.message);
      }
    }
  }
  // Initialize remaining systems asynchronously after showing the start screen
  async initializeRemainingSystemsAsync() {
    try {
      this.loadAudioAsync();
      console.log("Initializing combat module asynchronously...");
      if (!this.combat) {
        this.combat = new Combat(this.scene, this.spaceship);
        if (this.combat.world) {
          console.log("Combat ECS world successfully created");
        } else {
          console.log("Waiting for combat ECS world to initialize...");
          setTimeout(() => {
            if (this.combat.world && this.combat.playerEntity) {
              console.log("Combat ECS world and player entity initialized after delay");
            } else {
              console.warn("Combat ECS world or player entity not available after delay, recreating...");
              if (this.combat.createPlayerReferenceEntity) {
                this.combat.createPlayerReferenceEntity();
              }
            }
          }, 1e3);
        }
      }
      setTimeout(() => {
        this.initializeObjectPools();
        this.preWarmBasicShaders();
      }, 100);
    } catch (error) {
      console.error("Error initializing remaining systems:", error);
    }
  }
  // Load audio asynchronously after showing the start screen
  async loadAudioAsync() {
    try {
      if (this.audio) {
        console.log("Initializing audio system asynchronously...");
        this.audio.initialize().then(() => {
          console.log("Audio system initialization complete");
        }).catch((error) => {
          console.error("Error initializing audio:", error);
        });
      }
    } catch (error) {
      console.error("Error loading audio:", error);
    }
  }
  // Pre-warm only the most essential shaders needed for immediate gameplay
  preWarmBasicShaders() {
    console.log("Pre-warming essential shaders...");
    this.projectileGeometry = new SphereGeometry(1.8, 12, 12);
    this.projectileMaterial = new MeshStandardMaterial({
      color: 65535,
      emissive: 65535,
      emissiveIntensity: 5,
      metalness: 0.7,
      roughness: 0.3
    });
    const dummyProjectile = new Mesh(this.projectileGeometry, this.projectileMaterial);
    this.scene.add(dummyProjectile);
    this.renderer.renderer.compile(this.scene, this.camera);
    this.renderer._withGuard(() => this.scene.remove(dummyProjectile));
    console.log("Essential shaders pre-warmed");
  }
  // Initialize object pools for commonly created objects
  initializeObjectPools() {
    console.log("Initializing object pools...");
    window.objectPool.createPool("hitEffect", () => {
      if (!this.hitEffectGeometry) {
        this.hitEffectGeometry = new SphereGeometry(1, 8, 8);
      }
      const material = new MeshBasicMaterial({
        color: 16777215,
        transparent: true,
        opacity: 0.8
      });
      const mesh = new Mesh(this.hitEffectGeometry, material);
      return {
        mesh,
        material,
        // Reset function for when the object is retrieved from the pool
        reset: function(color = 16733440, size = 1) {
          this.material.color.set(color);
          this.material.opacity = 0.8;
          this.mesh.scale.set(size, size, size);
          this.mesh.visible = true;
        },
        // Clear function for when the object is returned to the pool
        clear: function() {
          if (this.mesh.parent) {
            this.mesh.parent.remove(this.mesh);
          }
          this.mesh.visible = false;
        }
      };
    }, 20, 100);
    window.objectPool.createPool("projectile", () => {
      if (!this.projectileGeometry) {
        this.projectileGeometry = new SphereGeometry(2, 8, 8);
      }
      const material = new MeshStandardMaterial({
        color: 65535,
        emissive: 65535,
        emissiveIntensity: 1,
        metalness: 0.3,
        roughness: 0.2
      });
      const mesh = new Mesh(this.projectileGeometry, material);
      return {
        mesh,
        material,
        velocity: new Vector3(),
        // Reset function for when the object is retrieved from the pool
        reset: function(position, direction, speed = 500, color = 65535) {
          this.mesh.position.copy(position);
          this.velocity.copy(direction).normalize().multiplyScalar(speed);
          this.material.color.set(color);
          this.material.emissive.set(color);
          this.mesh.visible = true;
        },
        // Clear function for when the object is returned to the pool
        clear: function() {
          if (this.mesh.parent) {
            this.mesh.parent.remove(this.mesh);
          }
          this.mesh.visible = false;
          this.velocity.set(0, 0, 0);
        }
      };
    }, 50, 200);
    window.objectPool.createPool("particleEffect", () => {
      const particleCount = 20;
      const particles = new BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        positions[i3] = 0;
        positions[i3 + 1] = 0;
        positions[i3 + 2] = 0;
        colors[i3] = 1;
        colors[i3 + 1] = 1;
        colors[i3 + 2] = 1;
      }
      particles.setAttribute("position", new BufferAttribute(positions, 3));
      particles.setAttribute("color", new BufferAttribute(colors, 3));
      const particleMaterial = new PointsMaterial({
        size: 3,
        transparent: true,
        opacity: 0.8,
        vertexColors: true,
        blending: AdditiveBlending
      });
      const particleSystem = new Points(particles, particleMaterial);
      return {
        system: particleSystem,
        velocities: new Float32Array(particleCount * 3),
        lifetime: new Float32Array(particleCount),
        maxLifetime: new Float32Array(particleCount),
        // Reset function for when the object is retrieved from the pool
        reset: function(position, color = new Color(1, 1, 1), size = 3, particleSpeed = 20) {
          this.system.position.copy(position);
          const positions2 = this.system.geometry.attributes.position.array;
          const colors2 = this.system.geometry.attributes.color.array;
          this.system.material.size = size;
          for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions2[i3] = 0;
            positions2[i3 + 1] = 0;
            positions2[i3 + 2] = 0;
            colors2[i3] = color.r;
            colors2[i3 + 1] = color.g;
            colors2[i3 + 2] = color.b;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            this.velocities[i3] = Math.sin(phi) * Math.cos(theta) * (Math.random() * particleSpeed);
            this.velocities[i3 + 1] = Math.sin(phi) * Math.sin(theta) * (Math.random() * particleSpeed);
            this.velocities[i3 + 2] = Math.cos(phi) * (Math.random() * particleSpeed);
            this.maxLifetime[i] = 0.5 + Math.random() * 1.5;
            this.lifetime[i] = this.maxLifetime[i];
          }
          this.system.geometry.attributes.position.needsUpdate = true;
          this.system.geometry.attributes.color.needsUpdate = true;
          this.system.visible = true;
          if (!this.system.parent) {
            window.game.scene.add(this.system);
          }
          this.animate();
        },
        // Animation function
        animate: function() {
          if (!this.system.visible) return;
          const positions2 = this.system.geometry.attributes.position.array;
          this.system.geometry.attributes.color.array;
          let anyAlive = false;
          for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            this.lifetime[i] -= 0.016;
            if (this.lifetime[i] <= 0) continue;
            anyAlive = true;
            positions2[i3] += this.velocities[i3] * 0.016;
            positions2[i3 + 1] += this.velocities[i3 + 1] * 0.016;
            positions2[i3 + 2] += this.velocities[i3 + 2] * 0.016;
            const lifeRatio = this.lifetime[i] / this.maxLifetime[i];
            this.system.material.opacity = lifeRatio;
          }
          this.system.geometry.attributes.position.needsUpdate = true;
          if (anyAlive) {
            requestAnimationFrame(this.animate.bind(this));
          } else {
            this.clear();
          }
        },
        // Clear function for when the object is returned to the pool
        clear: function() {
          if (this.system.parent) {
            this.system.parent.remove(this.system);
          }
          this.system.visible = false;
        }
      };
    }, 10, 50);
    console.log("Object pools initialized");
  }
  startDocked() {
    if (this.spaceship) {
      if (!this.spaceship.isDocked) {
        this.spaceship.dock();
      }
    }
    setTimeout(() => {
      if (this.controls && this.controls.dockingSystem) {
        this.controls.dockingSystem.dockWithStargate();
        console.log("Stargate UI shown");
      } else {
        console.error("Controls or dockingSystem not available");
      }
    }, 500);
  }
  /**
   * Initialize the intro sequence
   */
  initIntroSequence() {
    console.log("Initializing intro sequence...");
    this.introSequence = new IntroSequence(
      this.scene,
      this.camera,
      this.spaceship,
      this.audio
    );
    this.originalCameraPosition = this.camera.position.clone();
    this.originalCameraRotation = this.camera.rotation.clone();
    console.log("Intro sequence initialized");
  }
  /**
   * Start the intro sequence
   */
  startIntroSequence() {
    if (!this.introSequence) {
      this.initIntroSequence();
    }
    console.log("Starting intro sequence...");
    this.introSequenceActive = true;
    if (this.combat && this.combat.world && this.combat.enemySystem) {
      console.log("Freezing all enemies for intro sequence");
      this.combat.enemySystem.freezeAllEnemies();
    } else if (window.game && window.game.ecsWorld && window.game.ecsWorld.enemySystem) {
      console.log("Freezing all enemies via global reference for intro sequence");
      window.game.ecsWorld.enemySystem.freezeAllEnemies();
    }
    this.camera.position.set(0, 6e3, 12e3);
    this.camera.lookAt(3e4, 5e3, 0);
    if (this.controls && this.controls.inputHandler) {
      this.controls.inputHandler.enabled = false;
    }
    if (this.ui && this.ui.stargateInterface) {
      console.log("Explicitly hiding stargate UI before intro sequence");
      this.ui.stargateInterface.hideStargateUI();
    }
    if (this.ui) {
      this.ui.hideUI();
    }
    if (this.spaceship && this.spaceship.mesh) {
      this.spaceship.mesh.visible = false;
    }
    this.introSequence.startSequence(() => {
      this.completeIntroSequence();
    });
  }
  /**
   * Handle completion of the intro sequence
   */
  completeIntroSequence() {
    console.log("Intro sequence completed - final phase");
    if (this.combat && this.combat.world && this.combat.enemySystem) {
      console.log("Unfreezing all enemies after intro sequence");
      this.combat.enemySystem.unfreezeAllEnemies();
    } else if (window.game && window.game.ecsWorld && window.game.ecsWorld.enemySystem) {
      console.log("Unfreezing all enemies via global reference after intro sequence");
      window.game.ecsWorld.enemySystem.unfreezeAllEnemies();
    }
    if (this.ui && this.ui.stargateInterface) {
      console.log("Explicitly hiding stargate UI after intro sequence");
      this.ui.stargateInterface.hideStargateUI();
    }
    this.introSequenceActive = false;
    if (this.ui) {
      console.log("Showing game UI elements after intro completion");
      this.ui.showUI();
    }
    if (this.spaceship && this.spaceship.mesh) {
      this.spaceship.mesh.visible = true;
      if (this.spaceship.isDocked) {
        console.log("Forcing undocked state in completeIntroSequence");
        this.spaceship.isDocked = false;
      }
    }
    if (this.controls && this.controls.inputHandler) {
      console.log("Re-enabling player controls");
      this.controls.inputHandler.enabled = true;
    }
    localStorage.setItem("introPlayed", "true");
    if (window.mainMessageBus) {
      window.mainMessageBus.publish("intro.completed", {});
    }
    console.log("Game starting after intro sequence");
  }
  setupEventHandlers() {
    window.addEventListener("resize", this.handleResize);
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    document.addEventListener("keydown", this.handleKeyDown);
  }
  update(deltaTime) {
    if (this.isGameOver) return;
    if (this.isHordeActive) {
      this.hordeSurvivalTime = performance.now() - this.hordeStartTime;
    }
    this.physics.update(deltaTime);
    if (this.spaceship.update) {
      this.spaceship.update(deltaTime);
    }
    if (this.difficultyManager && !this.introSequenceActive && !this.spaceship.isDocked) {
      this.difficultyManager.update(deltaTime);
    }
    if (this.ui && this.ui.updateCoordinates && this.spaceship && this.spaceship.mesh) {
      const position = this.spaceship.mesh.position;
      this.ui.updateCoordinates(position.x, position.y, position.z);
    }
    performance.now();
    const instantFPS = this.actualFrameTime ? 1e3 / this.actualFrameTime : 60;
    this.fpsBuffer.push(instantFPS);
    if (this.fpsBuffer.length > this.fpsBufferSize) {
      this.fpsBuffer.shift();
    }
    let totalWeight = 0;
    let weightedSum = 0;
    for (let i = 0; i < this.fpsBuffer.length; i++) {
      const weight = i + 1;
      weightedSum += this.fpsBuffer[i] * weight;
      totalWeight += weight;
    }
    this.currentFPS = Math.round(weightedSum / totalWeight);
    if (this.frameCount % 5 === 0 && this.ui && this.ui.updateFPS) {
      if (this.frameRateCap > 0) {
        this.ui.updateFPS(this.currentFPS, this.frameRateCap);
      } else {
        this.ui.updateFPS(this.currentFPS);
      }
    }
    if (this.controls.update) {
      this.controls.update();
    }
    if (this.combat && this.combat.updatePlayerReference) {
      try {
        this.combat.updatePlayerReference();
      } catch (error) {
        console.warn("Error updating player reference:", error);
      }
    } else if (this.combat && !this.combat.updatePlayerReference) {
      console.warn("Combat module does not have updatePlayerReference method");
      if (this.combat.createPlayerReferenceEntity && !this.combat.playerEntity) {
        console.log("Creating player entity directly since updatePlayerReference is not available");
        this.combat.createPlayerReferenceEntity();
      }
    }
    if (this.combat && this.combat.update) {
      this.combat.update(deltaTime);
    }
    if (this.environment.update) {
      this.environment.update();
    }
    if (this.ui.update) {
      this.ui.update();
    }
    this.updateAudio();
    this.checkGameOver();
    this.frameCount++;
    if (this.world && !this.introSequenceActive) {
      this.world.messageBus && this.world.messageBus.fastPublish && this.world.messageBus.fastPublish("world.preUpdate", { deltaTime });
      this.world.systemManager.update(deltaTime);
      this.world.messageBus && this.world.messageBus.fastPublish && this.world.messageBus.fastPublish("world.postUpdate", { deltaTime });
    } else if (this.world && this.introSequenceActive) {
      if (this.world.entityManager && this.world.systemManager) {
        for (const system of this.world.systemManager.systems) {
          if (system.constructor.name !== "EnemySystem" && system.constructor.name !== "EnemyAISystem" && system.constructor.name !== "CombatSystem") {
            system.update(deltaTime);
          }
        }
      }
    }
  }
  // Update game sounds based on current game state
  updateAudio() {
    if (!this.audio || !this.spaceship) return;
    if (this.spaceship.isDocked) {
      this.audio.stopSound("thrust");
    } else {
      const isThrusting = this.spaceship.thrust.forward || this.spaceship.thrust.backward || this.spaceship.thrust.left || this.spaceship.thrust.right;
      if (isThrusting) {
        this.audio.playSound("thrust");
        let thrustIntensity = 0.5;
        if (this.spaceship.thrust.forward) thrustIntensity += 0.2;
        if (this.spaceship.thrust.backward) thrustIntensity += 0.1;
        if (this.spaceship.thrust.left) thrustIntensity += 0.1;
        if (this.spaceship.thrust.right) thrustIntensity += 0.1;
        if (this.spaceship.thrust.boost) thrustIntensity *= 1.5;
        this.audio.setThrustVolume(thrustIntensity);
      } else {
        this.audio.stopSound("thrust");
      }
    }
  }
  checkGameOver() {
    if (!this.spaceship) return;
    if (this.spaceship.isDocked) return;
    if (this.spaceship.fuel <= 0 && this.controls.dockingSystem && !this.controls.dockingSystem.nearStargate) {
      this.gameOver("Your ship ran out of fuel");
      return;
    }
    const sunPosition = window.vectorPool.get(0, 0, 0);
    const distanceToSun = this.spaceship.mesh.position.distanceTo(sunPosition);
    window.vectorPool.release(sunPosition);
    if (distanceToSun < 400) {
      this.gameOver("Your ship was destroyed by the sun's heat");
      return;
    }
  }
  gameOver(message) {
    if (this.isGameOver) return;
    console.log("Game over:", message);
    this.isGameOver = true;
    if (this.audio) {
      this.audio.playSound("explosion");
    }
    if (this.ui.showGameOver && this.controls.resources) {
      const gameStats = {
        resources: this.controls.resources,
        hordeMode: {
          active: this.isHordeActive,
          survivalTime: this.isHordeActive ? this.getFormattedHordeSurvivalTime() : "00:00",
          rawSurvivalTime: this.hordeSurvivalTime || 0
        }
      };
      this.ui.showGameOver(gameStats, message);
    }
    if (this.spaceship && this.spaceship.thrust) {
      this.spaceship.thrust.forward = false;
      this.spaceship.thrust.backward = false;
      this.spaceship.thrust.left = false;
      this.spaceship.thrust.right = false;
      this.spaceship.thrust.boost = false;
    }
    if (this.controls && this.controls.inputHandler) {
      this.controls.inputHandler.exitPointerLock();
    }
    this.gameOverCleanupTimeout = setTimeout(() => {
      const ui = this.ui;
      const audio = this.audio;
      this.ui = null;
      this.audio = null;
      this.destroy();
      this.ui = ui;
      this.audio = audio;
    }, 5e3);
  }
  animate(timestamp) {
    if (this.currentWarmupFrame < this.warmupFrames) {
      this.currentWarmupFrame++;
      if (this.currentWarmupFrame === this.warmupFrames) {
        this.lastFrameTime = timestamp;
        this.frameStartTime = performance.now();
        this.lastUpdateTime = performance.now();
        this.performanceStable = true;
        console.log(`Warm-up complete, starting game loop`);
      }
      requestAnimationFrame(this.boundAnimate);
      return;
    }
    if (!this.lastFrameTime) {
      this.lastFrameTime = timestamp;
      this.frameStartTime = performance.now();
      requestAnimationFrame(this.boundAnimate);
      return;
    }
    this.actualFrameTime = timestamp - this.lastFrameTime;
    if (this.frameRateCap > 0) {
      const targetFrameTime = 1e3 / this.frameRateCap;
      const elapsedSinceLastFrame = timestamp - this.lastFrameTime;
      if (elapsedSinceLastFrame < targetFrameTime - 0.5) {
        requestAnimationFrame(this.boundAnimate);
        return;
      }
      this.lastFrameTime += targetFrameTime;
      if (timestamp - this.lastFrameTime > targetFrameTime) {
        this.lastFrameTime = timestamp;
      }
    } else {
      this.lastFrameTime = timestamp;
    }
    const now = performance.now();
    let frameDelta = Math.min(now - this.lastUpdateTime, 100) / 1e3;
    if (this.performanceStable && this.frameCount % 60 === 0) {
      this.checkPerformanceAndAdjust();
    }
    const useFixedTimestep = !this.frameRateCap || this.frameRateCap > 90 || this.frameRateCap === 0;
    if (useFixedTimestep) {
      this.accumulator += frameDelta;
      const fixedTimestep = this.fixedDeltaTime || 1 / 60;
      let updates = 0;
      const maxUpdates = 4;
      const simStart = performance.now();
      while (this.accumulator >= fixedTimestep && updates < maxUpdates) {
        if (this.combat && this.combat.world) {
          const ents = this.combat.world.getEntitiesWithComponents(["TransformComponent"]);
          for (const e of ents) {
            const t = e.getComponent("TransformComponent");
            if (t && t.snapshotPrevious) t.snapshotPrevious();
          }
        }
        this.update(fixedTimestep);
        this.accumulator -= fixedTimestep;
        updates++;
      }
      const simEnd = performance.now();
      if (this.accumulator > fixedTimestep * 2) {
        console.warn(`Resetting accumulator from ${this.accumulator} to prevent spiral`);
        this.accumulator = fixedTimestep;
      }
      const alpha = Math.min(this.accumulator / fixedTimestep, 1);
      const renderStart = performance.now();
      if (this.renderer.interpolateMeshes) {
        this.renderer.interpolateMeshes(alpha);
      }
      this.renderer.render();
      const renderEnd = performance.now();
      if (window.__perf) {
        const frameFps = this.actualFrameTime ? 1e3 / this.actualFrameTime : 60;
        window.__perf.fps = Math.round(frameFps);
        window.__perf.simMs = simEnd - simStart || 0;
        window.__perf.renderMs = renderEnd - renderStart || 0;
      }
    } else {
      this.deltaTime = frameDelta;
      const simStart = performance.now();
      if (this.combat && this.combat.world) {
        const ents = this.combat.world.getEntitiesWithComponents(["TransformComponent"]);
        for (const e of ents) {
          const t = e.getComponent("TransformComponent");
          t && t.snapshotPrevious && t.snapshotPrevious();
        }
      }
      this.update(this.deltaTime);
      const simEnd = performance.now();
      const renderStart = performance.now();
      if (this.renderer.interpolateMeshes) this.renderer.interpolateMeshes(1);
      this.renderer.render();
      const renderEnd = performance.now();
      if (window.__perf) {
        window.__perf.fps = Math.round(1 / (this.deltaTime || 0.016));
        window.__perf.simMs = simEnd - simStart || 0;
        window.__perf.renderMs = renderEnd - renderStart || 0;
      }
    }
    this.lastUpdateTime = now;
    this.frameCount++;
    requestAnimationFrame(this.boundAnimate);
  }
  pause() {
    console.log("Game paused");
    if (this.audio) {
      this.audio.muted = true;
      for (const sound of Object.values(this.audio.sounds)) {
        sound.muted = true;
      }
      for (const track of this.audio.music) {
        track.muted = true;
      }
    }
  }
  resume() {
    console.log("Game resumed");
    this.lastUpdateTime = performance.now();
    if (this.audio && !this.audio.muted) {
      for (const sound of Object.values(this.audio.sounds)) {
        sound.muted = false;
      }
      for (const track of this.audio.music) {
        track.muted = false;
      }
    }
  }
  // Create a fallback for the initOptimizedECS method that is causing errors
  initOptimizedECS() {
    console.log("initOptimizedECS called - This is a placeholder implementation");
    if (this.world && typeof this.world.getSystem !== "function") {
      console.log("Adding getSystem method to World class to fix compatibility issues");
      this.world.getSystem = function(systemType) {
        if (this.systemManager && typeof this.systemManager.getSystem === "function") {
          return this.systemManager.getSystem(systemType);
        }
        return null;
      };
    }
    return true;
  }
  /**
   * Toggle debug mode
   */
  toggleDebugMode() {
    window.DEBUG_MODE = !window.DEBUG_MODE;
    console.log(`Debug mode ${window.DEBUG_MODE ? "enabled" : "disabled"}`);
    if (window.DEBUG_MODE) {
      if (this.ui && !document.getElementById("performance-stats")) {
        this.ui.initializePerformanceMonitor();
      }
      if (window.MemoryStats) {
        window.MemoryStats.update();
        window.MemoryStats.logReport();
      }
    } else {
      const statsElement = document.getElementById("performance-stats");
      if (statsElement) {
        statsElement.remove();
      }
      if (this.ui && this.ui.statsInterval) {
        clearInterval(this.ui.statsInterval);
        this.ui.statsInterval = null;
      }
    }
    window.playIntro = () => {
      if (this.startIntroSequence) {
        console.log("Manually triggering intro sequence");
        this.startIntroSequence();
        return "Playing intro sequence...";
      }
      return "Intro sequence not available";
    };
  }
  /**
   * Initialize difficulty manager when combat system is ready
   */
  initializeDifficultyManager() {
    this.difficultyManager = {
      params: {
        maxEnemies: 10,
        spawnInterval: 3,
        enemyHealth: 20,
        enemyDamage: 15,
        enemySpeed: 700
      },
      gameTime: 0,
      currentLevel: 1,
      update: function(deltaTime) {
        this.gameTime += deltaTime;
        const minutes = this.gameTime / 60;
        const newLevel = Math.floor(minutes / 3) + 1;
        if (newLevel !== this.currentLevel) {
          this.currentLevel = newLevel;
          const difficultyMultiplier = 1 + Math.min(this.currentLevel - 1, 4) * 0.5;
          this.params.maxEnemies = Math.min(10 * difficultyMultiplier, 30);
          this.params.spawnInterval = Math.max(3 / difficultyMultiplier, 1);
          this.params.enemyHealth = Math.floor(20 * difficultyMultiplier);
          this.params.enemyDamage = Math.floor(15 * difficultyMultiplier);
          this.params.enemySpeed = Math.min(700 * (1 + 0.2 * (this.currentLevel - 1)), 1400);
          console.log(`Difficulty increased to level ${this.currentLevel} (${difficultyMultiplier}x)`);
          console.log(`Parameters: maxEnemies=${this.params.maxEnemies}, spawnInterval=${this.params.spawnInterval}`);
          console.log(`Health=${this.params.enemyHealth}, Damage=${this.params.enemyDamage}, Speed=${this.params.enemySpeed}`);
        }
      }
    };
  }
  /**
   * Activate horde mode (extreme survival challenge)
   */
  activateHordeMode() {
    if (this.isHordeActive) return;
    console.log("ACTIVATING HORDE MODE - EXTREME SURVIVAL CHALLENGE");
    this.isHordeActive = true;
    this.hordeStartTime = performance.now();
    this.hordeSurvivalTime = 0;
    if (this.audio) {
      this.audio.playSound("boink");
    }
    window.mainMessageBus.publish("horde.activated", {
      startTime: this.hordeStartTime
    });
    if (this.ui && this.ui.showNotification) {
      this.ui.showNotification("HORDE MODE ACTIVATED - SURVIVE!", 5e3);
    }
    if (this.spaceship && this.spaceship.isDocked) {
      console.log("Horde mode forcing undock from stargate");
      this.spaceship.undock();
      window.mainMessageBus.publish("player.requestUndock", {
        forced: true,
        reason: "horde_mode_activation"
      });
      setTimeout(() => {
        console.log("Horde mode ensuring HUD is visible");
        if (this.ui && this.ui.showUI) {
          this.ui.showUI();
        }
      }, 200);
    }
  }
  /**
   * Format horde survival time as MM:SS
   * @returns {string} Formatted time string
   */
  getFormattedHordeSurvivalTime() {
    const totalSeconds = Math.floor(this.hordeSurvivalTime / 1e3);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  /**
   * Clean up all game resources, event listeners, and references
   * Call this when the game is no longer needed to prevent memory leaks
   */
  destroy() {
    console.log("Cleaning up game resources...");
    if (this.boundAnimate) {
      cancelAnimationFrame(this.boundAnimate);
      this.boundAnimate = null;
    }
    if (this.gameOverCleanupTimeout) {
      clearTimeout(this.gameOverCleanupTimeout);
      this.gameOverCleanupTimeout = null;
    }
    window.removeEventListener("resize", this.handleResize);
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    document.removeEventListener("keydown", this.handleKeyDown);
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
    if (this.audio) {
      this.audio.dispose();
      this.audio = null;
    }
    if (this.physics) {
      this.physics.dispose();
      this.physics = null;
    }
    if (this.spaceship) {
      this.spaceship.dispose();
      this.spaceship = null;
    }
    if (this.environment) {
      this.environment.dispose();
      this.environment = null;
    }
    if (this.controls) {
      this.controls.dispose();
      this.controls = null;
    }
    if (this.ui) {
      this.ui.dispose();
      this.ui = null;
    }
    if (this.combat) {
      this.combat.dispose();
      this.combat = null;
    }
    if (this.introSequence) {
      this.introSequence.destroy();
      this.introSequence = null;
    }
    if (this.world) {
      if (this.world.entityManager) {
        const entityIds = [...this.world.entityManager.entities.keys()];
        for (const entityId of entityIds) {
          this.world.destroyEntity(entityId);
        }
      }
      if (this.world.systemManager) {
        for (const system of this.world.systemManager.systems) {
          if (system.onDestroyed && typeof system.onDestroyed === "function") {
            system.onDestroyed();
          }
        }
      }
      this.world = null;
    }
    if (window.mainMessageBus) {
      window.mainMessageBus.unsubscribe("game.over", this.gameOver.bind(this));
    }
    window.game = null;
    if (window.vectorPool) {
      window.vectorPool.pool = [];
    }
    if (window.objectPool) {
      window.objectPool.clearAllPools();
    }
    this.scene = null;
    this.camera = null;
    this.fpsBuffer = [];
    console.log("Game resources cleaned up successfully");
  }
  /**
   * Apply frame rate settings based on detected refresh rate and user preferences
   */
  applyFrameRateSettings() {
    if (!this.ui || !this.ui.settings) return;
    const settings = this.ui.settings.settings;
    const refreshRate = this.ui.settings.monitorRefreshRate || 60;
    if (settings.frameRateCap === "auto") {
      if (this.isMobile) {
        this.frameRateCap = 60;
        console.log(`Mobile device: capping at 60fps for battery life`);
      } else if (refreshRate > 90) {
        this.frameRateCap = 0;
        this.fixedDeltaTime = 1 / 60;
        console.log(`High refresh display (${refreshRate}Hz): using fixed 60Hz physics with interpolation`);
      } else if (refreshRate > 65) {
        this.frameRateCap = refreshRate;
        console.log(`Moderate high refresh (${refreshRate}Hz): capping at monitor rate`);
      } else {
        this.frameRateCap = refreshRate;
        console.log(`Standard display: matching refresh rate at ${refreshRate}Hz`);
      }
    } else {
      this.frameRateCap = parseInt(settings.frameRateCap) || 0;
      if (this.isMobile && this.frameRateCap === 0) {
        this.frameRateCap = 60;
        console.log(`Mobile device: overriding unlimited to 60fps`);
      }
    }
    console.log(`Frame rate configuration: cap=${this.frameRateCap}, fixed timestep=${this.fixedDeltaTime * 1e3}ms`);
  }
  /**
   * Monitor performance and auto-adjust settings if needed
   */
  checkPerformanceAndAdjust() {
    if (!this.ui || !this.ui.settings || !this.ui.settings.settings.autoQuality) {
      return;
    }
    if (this.fpsBuffer.length < 10) return;
    const avgFPS = this.fpsBuffer.reduce((a, b) => a + b, 0) / this.fpsBuffer.length;
    const targetFPS = this.frameRateCap || 60;
    const performanceRatio = avgFPS / targetFPS;
    if (performanceRatio < 0.85) {
      const currentQuality = this.ui.settings.settings.graphicalQuality;
      if (currentQuality === "high") {
        console.log(`Performance low (${Math.round(avgFPS)}fps), reducing quality to medium`);
        this.ui.settings.settings.graphicalQuality = "medium";
        this.ui.settings.applyGraphicsSettings();
        this.ui.settings.saveSettings();
      } else if (currentQuality === "medium") {
        console.log(`Performance low (${Math.round(avgFPS)}fps), reducing quality to low`);
        this.ui.settings.settings.graphicalQuality = "low";
        this.ui.settings.applyGraphicsSettings();
        this.ui.settings.saveSettings();
      }
    }
  }
  // Fallback to old behavior if start screen is not available
  fallbackToDefaultBehavior() {
    const introPlayed = localStorage.getItem("introPlayed") === "true";
    if (introPlayed) {
      console.log("Intro already played, starting in docked state");
      this.camera.position.set(0, 1500, 0);
      this.startDocked();
    } else {
      console.log("First time playing, preparing for intro sequence");
      if (this.spaceship && !this.spaceship.isDocked) {
        this.spaceship.dock();
      }
      setTimeout(() => {
        this.startIntroSequence();
      }, 500);
    }
  }
}
(() => {
  const registry = getGlobalPoolRegistry();
  window.objectPool = {
    createPool: function(type, factory, initialSize = 10, maxSize = 100) {
      registry.register(type, { factory, reset: (o) => {
      }, preallocate: initialSize, maxSize });
    },
    get: function(type, ...args) {
      try {
        return registry.get(type, ...args);
      } catch (e) {
        console.warn(e.message);
        return null;
      }
    },
    release: function(type, obj) {
      registry.release(type, obj);
    },
    clearAllPools: function() {
      registry.clearAll();
    },
    clearPool: function(type) {
      registry.clear(type);
    }
  };
})();
function startGameMainModule() {
  console.log("DOM ready, starting game initialization...");
  const canvases = document.querySelectorAll("canvas");
  canvases.forEach((canvas) => {
    const gl = canvas.getContext("webgl") || canvas.getContext("webgl2");
    if (gl && gl.getExtension("WEBGL_lose_context")) {
      gl.getExtension("WEBGL_lose_context").loseContext();
    }
  });
  setTimeout(() => {
    initializeGame();
  }, 50);
}
function initializeGame() {
  console.log("Creating game instance...");
  try {
    console.log("Checking for THREE module availability...");
    console.log("THREE available:", typeof THREE !== "undefined");
    window.game = new Game();
    console.log("Precomputing projectile assets and warming shaders...");
    window.game.projectileGeometry = new SphereGeometry(1.8, 12, 12);
    window.game.projectileMaterial = new MeshStandardMaterial({
      color: 65535,
      emissive: 65535,
      emissiveIntensity: 5,
      metalness: 0.7,
      roughness: 0.3
    });
    window.game.projectileGlowGeometry = new SphereGeometry(2.4, 16, 16);
    window.game.projectileGlowMaterial = new MeshBasicMaterial({
      color: 65535,
      transparent: true,
      opacity: 0.4,
      blending: AdditiveBlending
    });
    console.log("Precomputing trail particle geometries...");
    window.game.trailParticleGeometries = [];
    const numPoints = 20;
    for (let i = 0; i < numPoints; i++) {
      const ratio = i / numPoints;
      const size = 0.5 * (1 - ratio);
      const particleGeometry = new SphereGeometry(size, 8, 8);
      window.game.trailParticleGeometries.push(particleGeometry);
    }
    console.log("Warming shaders...");
    const dummyProjectile = new Mesh(window.game.projectileGeometry, window.game.projectileMaterial);
    const dummyGlow = new Mesh(window.game.projectileGlowGeometry, window.game.projectileGlowMaterial);
    dummyProjectile.add(dummyGlow);
    if (window.game && window.game.renderer && typeof window.game.renderer._withGuard === "function") {
      window.game.renderer._withGuard(() => window.game.scene.add(dummyProjectile));
    } else {
      window.game.scene.add(dummyProjectile);
    }
    console.log("Precomputing explosion effect assets...");
    window.game.explosionGeometry = new SphereGeometry(1, 8, 8);
    window.game.explosionMaterial = new MeshBasicMaterial({
      color: 16733440,
      transparent: true,
      opacity: 0.8
    });
    window.game.hitEffectGeometry = new SphereGeometry(1, 8, 8);
    const dummyExplosionContainer = new Group();
    if (window.game && window.game.renderer && typeof window.game.renderer._withGuard === "function") {
      window.game.renderer._withGuard(() => window.game.scene.add(dummyExplosionContainer));
    } else {
      window.game.scene.add(dummyExplosionContainer);
    }
    const explosionParticleCount = 20;
    const dummyExplosionParticles = [];
    for (let i = 0; i < explosionParticleCount; i++) {
      const size = Math.random() * 2 + 1;
      const particle = new Mesh(
        window.game.explosionGeometry,
        window.game.explosionMaterial.clone()
        // Clone material for individual control
      );
      particle.position.set(
        Math.random() * 10 - 5,
        Math.random() * 10 - 5,
        Math.random() * 10 - 5
      );
      particle.position.multiplyScalar(10).add(new Vector3(0, -1e4, 0));
      dummyExplosionContainer.add(particle);
      dummyExplosionParticles.push(particle);
    }
    window.objectPool.createPool("explosionParticle", () => {
      const material = window.game.explosionMaterial.clone();
      const mesh = new Mesh(window.game.explosionGeometry, material);
      return {
        mesh,
        material,
        velocity: new Vector3(),
        // Reset function when retrieved from pool
        reset: function(position, size = 1, color = 16733440) {
          if (!position) {
            position = new Vector3(0, 0, 0);
          }
          this.mesh.position.copy(position);
          this.mesh.scale.set(size, size, size);
          this.material.color.set(color);
          this.material.opacity = 0.8;
          this.mesh.visible = true;
        },
        // Clear function when returned to pool
        clear: function() {
          if (this.mesh.parent) {
            this.mesh.parent.remove(this.mesh);
          }
          this.mesh.visible = false;
          this.velocity.set(0, 0, 0);
        }
      };
    }, 50, 200);
    try {
      let testHit = window.objectPool.get("hitEffect");
      if (!testHit) {
        window.objectPool.createPool("hitEffect", () => {
          const geo = window.game.hitEffectGeometry || new SphereGeometry(1, 8, 8);
          const material = new MeshBasicMaterial({ color: 16777215, transparent: true, opacity: 0.8 });
          const mesh = new Mesh(geo, material);
          return {
            mesh,
            material,
            reset(color = 16733440, size = 1) {
              this.material.color.set(color);
              this.material.opacity = 0.8;
              this.mesh.scale.set(size, size, size);
              this.mesh.visible = true;
            },
            clear() {
              if (this.mesh.parent) {
                this.mesh.parent.remove(this.mesh);
              }
              this.mesh.visible = false;
            }
          };
        }, 10, 100);
      } else {
        window.objectPool.release("hitEffect", testHit);
      }
    } catch {
    }
    const hitEffectColors = [16733440, 3381759, 16711680, 16776960];
    const dummyHitEffects = [];
    for (const color of hitEffectColors) {
      const hitEffect = window.objectPool.get("hitEffect", color, 1.5);
      if (hitEffect && hitEffect.mesh) {
        hitEffect.mesh.position.set(0, -10100, 0);
        if (window.game && window.game.renderer && typeof window.game.renderer._withGuard === "function") {
          window.game.renderer._withGuard(() => window.game.scene.add(hitEffect.mesh));
        } else {
          window.game.scene.add(hitEffect.mesh);
        }
        dummyHitEffects.push(hitEffect);
      }
    }
    window.game.renderer.renderer.compile(window.game.scene, window.game.camera);
    console.log("Cleaning up dummy objects after warming...");
    if (window.game && window.game.renderer && typeof window.game.renderer._withGuard === "function") {
      window.game.renderer._withGuard(() => window.game.scene.remove(dummyExplosionContainer));
    } else {
      window.game.scene.remove(dummyExplosionContainer);
    }
    for (const particle of dummyExplosionParticles) {
      dummyExplosionContainer.remove(particle);
    }
    for (const hitEffect of dummyHitEffects) {
      window.objectPool.release("hitEffect", hitEffect);
    }
    console.log("Precomputed assets and shaders warmed successfully");
    console.log("Game started successfully");
  } catch (error) {
    console.error("Error starting game:", error);
    const errorMessage = document.createElement("div");
    errorMessage.style.position = "fixed";
    errorMessage.style.top = "50%";
    errorMessage.style.left = "50%";
    errorMessage.style.transform = "translate(-50%, -50%)";
    errorMessage.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    errorMessage.style.color = "#ff3030";
    errorMessage.style.padding = "20px";
    errorMessage.style.borderRadius = "10px";
    errorMessage.style.border = "1px solid #ff3030";
    errorMessage.style.zIndex = "9999";
    errorMessage.style.textAlign = "center";
    errorMessage.style.fontFamily = "Courier New, monospace";
    errorMessage.style.maxWidth = "80%";
    errorMessage.innerHTML = `
            <h2>Error Starting Game</h2>
            <p>${error.message}</p>
            <p>Check the console for more details (F12).</p>
            <p>You can try refreshing the page or clearing your browser cache.</p>
            <button id="reload-button" style="background: #ff3030; color: white; border: none; padding: 10px; margin-top: 20px; cursor: pointer;">Reload Page</button>
        `;
    document.body.appendChild(errorMessage);
    document.getElementById("reload-button").addEventListener("click", () => {
      const cacheBuster = Date.now();
      window.location.href = window.location.pathname + "?cache=" + cacheBuster;
    });
  }
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startGameMainModule);
} else {
  startGameMainModule();
}
//# sourceMappingURL=main-BUhMFtaY.js.map
