const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/modules-CtmUUd99.js","assets/core-CQR7b8gS.js","assets/three-BPefaS9B.js"])))=>i.map(i=>d[i]);
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { MessageBus } from "./core-CQR7b8gS.js";
import { g as getAbsolutePath, _ as __vitePreload, A as AudioManager, b as Renderer, P as Physics, c as Environment, d as Spaceship, e as UI, f as Controls } from "./modules-CtmUUd99.js";
import { aS as THREE, g as Vector3, z as BufferGeometry, B as BufferAttribute, v as MeshStandardMaterial, E as Mesh, al as BoxGeometry, ar as CylinderGeometry, an as SphereGeometry, ad as ShaderMaterial, aj as AdditiveBlending, K as Points, a3 as Texture, w as DoubleSide, C as Color, aC as RingGeometry, U as Group, s as PointsMaterial, ak as Euler, x as MeshBasicMaterial } from "./three-BPefaS9B.js";
import { g as getGlobalPoolRegistry } from "./index-D9pzPllf.js";
window.DEBUG_MODE = false;
function initializeGlobals() {
  if (!window.THREE) {
    window.THREE = THREE;
  }
  window.mainMessageBus = new MessageBus();
  initializeObjectPoolFacade();
  initializeVectorPool();
}
function initializeVectorPool() {
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
}
function initializeObjectPoolFacade() {
  window.objectPool = {
    registry: getGlobalPoolRegistry(),
    // Get an object from a pool
    get(poolName, ...args) {
      try {
        return this.registry.get(poolName, ...args);
      } catch (e) {
        if (window.DEBUG_MODE) {
          console.log(`Creating on-demand pool: ${poolName}`);
        }
        this.registry.register(poolName, {
          factory: () => ({}),
          preallocate: 10,
          maxSize: 100
        });
        return this.registry.get(poolName, ...args);
      }
    },
    // Return an object to a pool
    release(poolName, obj) {
      this.registry.release(poolName, obj);
    },
    // Create or configure a pool
    createPool(poolName, factory, initialSize = 10, maxSize = 100) {
      this.registry.register(poolName, {
        factory,
        reset: (obj) => {
          if (obj && typeof obj.reset === "function") {
            obj.reset();
          }
        },
        preallocate: initialSize,
        maxSize
      });
    },
    // Get pool statistics
    getStats(poolName) {
      if (this.registry.typeToPool && this.registry.typeToPool.has(poolName)) {
        const pool = this.registry.typeToPool.get(poolName);
        return {
          available: pool.objects.length,
          maxSize: pool.maxSize,
          hits: this.registry.statsData.hits,
          misses: this.registry.statsData.misses
        };
      }
      return null;
    },
    // Clear all pools
    clearAllPools() {
      if (this.registry.clearAll) {
        this.registry.clearAll();
      } else if (this.registry.typeToPool) {
        this.registry.typeToPool.forEach((pool, type) => {
          pool.objects = [];
        });
      }
    }
  };
}
class DreadnoughtHull {
  static createMainHull(scale, ship) {
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
    ship.add(hull);
    this.addHullPlates(scale, ship);
    return hull;
  }
  static addHullPlates(scale, ship) {
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
      ship.add(plate);
    }
  }
}
class DreadnoughtBridge {
  static createCommandBridge(scale, ship) {
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
    ship.add(mainTower);
    this.addBridgeWindows(scale, ship, bridgeY, bridgeZ);
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
    ship.add(leftTower);
    const rightTower = new Mesh(secondaryTowerGeometry, bridgeMaterial);
    rightTower.position.set(bridgeWidth * 1.2, bridgeY, bridgeZ + bridgeDepth * 0.6);
    rightTower.castShadow = true;
    rightTower.receiveShadow = true;
    ship.add(rightTower);
    return { mainTower, leftTower, rightTower };
  }
  static addBridgeWindows(scale, ship, bridgeY, bridgeZ) {
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
          bridgeZ + scale * 0.04 + windowDepth
        );
        ship.add(window2);
      }
    }
  }
}
class DreadnoughtEngines {
  constructor() {
    this.engineGlows = [];
    this.engineTrailParticles = null;
  }
  createEngineArray(scale, ship) {
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
    ship.add(engineHousing);
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
        ship.add(engine);
        const glowGeometry = new SphereGeometry(engineRadius * 1.6, 16, 16);
        const glow = new Mesh(glowGeometry, glowMaterial.clone());
        glow.position.set(posX, rowY, engineZ + engineHousingLength * 0.5 + engineLength * 1.1);
        ship.add(glow);
        this.engineGlows.push(glow);
        const outerGlowGeometry = new SphereGeometry(engineRadius * 2.5, 16, 16);
        const outerGlowMaterial = glowMaterial.clone();
        outerGlowMaterial.opacity = 0.4;
        const outerGlow = new Mesh(outerGlowGeometry, outerGlowMaterial);
        outerGlow.position.copy(glow.position);
        ship.add(outerGlow);
        this.engineGlows.push(outerGlow);
      }
    }
    this.createEngineTrailParticles(scale, engineZ, engineHousingWidth, ship);
    return { engineHousing, engineGlows: this.engineGlows };
  }
  createEngineTrailParticles(scale, engineZ, width, ship) {
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
    ship.add(this.engineTrailParticles);
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
  // Update engine trail particles animation
  updateEngineTrails() {
    if (this.engineTrailParticles && this.engineTrailParticles.material.uniforms) {
      this.engineTrailParticles.material.uniforms.time.value += 0.02;
    }
  }
}
class DreadnoughtWeapons {
  static createSurfaceDetails(scale, ship) {
    this.createTurrets(scale, ship);
    this.createSurfaceTrenches(scale, ship);
    this.createShieldGenerators(scale, ship);
  }
  static createTurrets(scale, ship) {
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
      ship.add(base);
      const turretGeometry = new CylinderGeometry(turretRadius, turretRadius, turretHeight, 8);
      const turret = new Mesh(turretGeometry, turretMaterial);
      turret.position.set(pos[0], pos[1] + baseHeight * 0.5 + turretHeight * 0.5, pos[2]);
      turret.rotation.x = Math.PI / 2;
      turret.rotation.z = -Math.PI / 6;
      ship.add(turret);
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
      ship.add(base);
      const turretGeometry = new CylinderGeometry(turretRadius, turretRadius, turretHeight, 8);
      const turret = new Mesh(turretGeometry, turretMaterial);
      turret.position.set(pos[0], pos[1] + baseHeight * 0.5 + turretHeight * 0.5, pos[2]);
      turret.rotation.x = Math.PI / 2;
      turret.rotation.z = Math.PI / 6;
      ship.add(turret);
    });
  }
  static createSurfaceTrenches(scale, ship) {
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
    ship.add(centerTrench);
    const sideTrenchGeometry = new BoxGeometry(trenchWidth, trenchDepth, trenchLength * 0.7);
    const portTrench = new Mesh(sideTrenchGeometry, trenchMaterial);
    portTrench.position.set(-scale * 0.07, scale * 0.035, scale * 0.05);
    ship.add(portTrench);
    const starboardTrench = new Mesh(sideTrenchGeometry, trenchMaterial);
    starboardTrench.position.set(scale * 0.07, scale * 0.035, scale * 0.05);
    ship.add(starboardTrench);
  }
  static createShieldGenerators(scale, ship) {
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
    ship.add(portDome);
    const starboardDomeGeometry = new SphereGeometry(domeRadius, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const starboardDome = new Mesh(starboardDomeGeometry, domeMaterial);
    starboardDome.position.set(scale * 0.08, domeY, domeZ);
    starboardDome.rotation.x = Math.PI;
    ship.add(starboardDome);
    return { portDome, starboardDome };
  }
}
class TeleportBeam {
  static createTeleportBeam(scale, ship) {
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
    const teleportBeam = new Mesh(beamGeometry, beamMaterial);
    teleportBeam.position.set(0, -beamHeight / 2, -scale * 0.1);
    teleportBeam.rotation.x = Math.PI;
    teleportBeam.visible = false;
    ship.add(teleportBeam);
    return teleportBeam;
  }
  static createBeamImpactRing(scale, ship) {
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
    const impactRing = new Mesh(ringGeometry, ringMaterial);
    impactRing.position.set(0, -scale * 1, -scale * 0.1);
    impactRing.rotation.x = -Math.PI / 2;
    impactRing.visible = false;
    ship.add(impactRing);
    return impactRing;
  }
}
class TeleportParticles {
  static createTeleportParticles(scale, ship) {
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
    const teleportParticles = new Points(particleGeometry, particleMaterial);
    teleportParticles.visible = false;
    teleportParticles.position.set(0, 0, -scale * 0.1);
    ship.add(teleportParticles);
    return teleportParticles;
  }
  static createParticleTexture() {
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
  static animateParticles(teleportParticles) {
    if (!teleportParticles || !teleportParticles.visible) return;
    const positions = teleportParticles.geometry.attributes.position.array;
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
    teleportParticles.geometry.attributes.position.needsUpdate = true;
  }
}
class TeleportController {
  constructor() {
    this.teleportBeam = null;
    this.teleportParticles = null;
    this.impactRing = null;
    this.teleportBeamActive = false;
  }
  setComponents(teleportBeam, teleportParticles, impactRing) {
    this.teleportBeam = teleportBeam;
    this.teleportParticles = teleportParticles;
    this.impactRing = impactRing;
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
  updateTeleportBeam(progress = 0) {
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
      TeleportParticles.animateParticles(this.teleportParticles);
    }
  }
  // Get current beam active state
  isBeamActive() {
    return this.teleportBeamActive;
  }
}
class StarDreadnought {
  constructor(scene) {
    this.scene = scene;
    this.ship = null;
    this.engines = new DreadnoughtEngines();
    this.teleportController = new TeleportController();
    this.createShipModel();
    this.scene.add(this.ship);
    console.log("Star Dreadnought created");
  }
  createShipModel() {
    this.ship = new Group();
    this.ship.name = "starDreadnought";
    const shipScale = 1200;
    this.createStructure(shipScale);
    this.createSystems(shipScale);
    this.createTeleporter(shipScale);
  }
  createStructure(scale) {
    DreadnoughtHull.createMainHull(scale, this.ship);
    DreadnoughtBridge.createCommandBridge(scale, this.ship);
  }
  createSystems(scale) {
    this.engines.createEngineArray(scale, this.ship);
    DreadnoughtWeapons.createSurfaceDetails(scale, this.ship);
  }
  createTeleporter(scale) {
    const teleportBeam = TeleportBeam.createTeleportBeam(scale, this.ship);
    const impactRing = TeleportBeam.createBeamImpactRing(scale, this.ship);
    const teleportParticles = TeleportParticles.createTeleportParticles(scale, this.ship);
    this.teleportController.setComponents(teleportBeam, teleportParticles, impactRing);
  }
  // Set engines power level (0-1)
  setEnginesPower(power) {
    this.engines.setEnginesPower(power);
  }
  // Activate teleport beam
  activateTeleportBeam() {
    this.teleportController.activateTeleportBeam();
  }
  // Deactivate teleport beam
  deactivateTeleportBeam() {
    this.teleportController.deactivateTeleportBeam();
  }
  // Update teleport beam effect
  updateTeleportBeam(progress) {
    this.teleportController.updateTeleportBeam(progress);
    this.engines.updateEngineTrails();
  }
  // Check if teleport beam is active
  get teleportBeamActive() {
    return this.teleportController.isBeamActive();
  }
  // Get ship group for external access
  getShip() {
    return this.ship;
  }
  // Get engine glows for external effects
  getEngineGlows() {
    return this.engines.engineGlows;
  }
  // Update method for any ongoing animations
  update(deltaTime) {
    this.engines.updateEngineTrails();
    if (this.teleportController.isBeamActive()) {
      this.teleportController.updateTeleportBeam();
    }
  }
  // Cleanup method
  dispose() {
    if (this.ship) {
      this.scene.remove(this.ship);
      this.ship.traverse((child) => {
        if (child.geometry) {
          child.geometry.dispose();
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((material) => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      this.ship = null;
    }
  }
}
function createIntroSoundEffects(audioManager) {
  if (typeof Tone === "undefined") {
    console.error("Tone.js not available for intro sound effects");
    return {};
  }
  try {
    console.log("Creating intro sequence sound effects...");
    const introSounds = {};
    introSounds.warp = createWarpSound(audioManager);
    introSounds.shipArrival = createShipArrivalSound(audioManager);
    introSounds.teleport = createTeleportSound(audioManager);
    console.log("Intro sequence sound effects created");
    return introSounds;
  } catch (error) {
    console.error("Error creating intro sound effects:", error);
    return {};
  }
}
function createWarpSound(audioManager) {
  try {
    const destination = Tone.Destination;
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
    const soundObject = {
      lastPlayTime: 0,
      // Track when we last played this sound
      play: function() {
        if (audioManager && audioManager.muted) return;
        const now = Tone.now();
        if (now - this.lastPlayTime < 0.1) {
          console.log("Preventing too rapid warp sound playback");
          return;
        }
        this.lastPlayTime = now;
        const volumeLevel = audioManager ? audioManager.sfxVolume * 0.36 : 0.18;
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
    return soundObject;
  } catch (error) {
    console.error("Error creating warp sound:", error);
    return { play: () => {
    } };
  }
}
function createShipArrivalSound(audioManager) {
  try {
    const destination = Tone.Destination;
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
    return {
      play: () => {
        if (audioManager && audioManager.muted) return;
        const now = Tone.now();
        const volumeLevel = audioManager ? audioManager.sfxVolume * 0.42 : 0.24;
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
    return { play: () => {
    } };
  }
}
function createTeleportSound(audioManager) {
  try {
    const destination = Tone.Destination;
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
    return {
      play: () => {
        if (audioManager && audioManager.muted) return;
        const now = Tone.now();
        const volumeLevel = audioManager ? audioManager.sfxVolume * 0.3 : 0.18;
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
    return { play: () => {
    } };
  }
}
function loadDialogueWavs() {
  console.log("Loading dialogue WAV files...");
  const dialogueWavs = [];
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
      dialogueWavs.push(audio);
    }
    console.log("Dialogue WAV files setup complete - they'll be used if available");
    return dialogueWavs;
  } catch (error) {
    console.error("Error in dialogue WAV files setup:", error);
    return [];
  }
}
function playDialogueWav(dialogueWavs, index, audioManager) {
  if (index >= 8 || !dialogueWavs[index]) {
    return;
  }
  try {
    const dialogueAudio = dialogueWavs[index];
    if (dialogueAudio.readyState > 0 && dialogueAudio.error === null) {
      dialogueAudio.volume = audioManager ? audioManager.sfxVolume * 0.8 : 0.5;
      dialogueAudio.currentTime = 0;
      const playPromise = dialogueAudio.play();
      if (playPromise !== void 0) {
        playPromise.catch((err) => {
          console.warn(`Couldn't play dialogue WAV ${index}: ${err.message}`);
        });
      }
    } else {
      console.log(`Skipping dialogue WAV ${index + 1} (not loaded)`);
    }
  } catch (error) {
    console.warn(`Error playing dialogue WAV ${index + 1}, continuing without audio`, error.message);
  }
}
class PortalEffect {
  constructor() {
    this.warpTunnel = null;
    this.warpPortal = null;
    this.portalParticles = null;
    this.setupPortalEffect();
  }
  setupPortalEffect() {
    const portalGeometry = new RingGeometry(0, 400, 64);
    const portalMaterial = new ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new Color(6697898) }
      },
      vertexShader: `
                precision highp float;
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
      fragmentShader: `
                precision highp float;
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
  /**
   * Update portal shader uniforms and animations
   */
  updatePortalEffect() {
    if (this.warpPortal && this.warpPortal.material.uniforms) {
      this.warpPortal.material.uniforms.time.value += 0.016;
    }
  }
  /**
   * Set portal opacity for fade effects
   * @param {number} opacity - Opacity value between 0 and 1
   */
  setOpacity(opacity) {
    if (this.portalParticles && this.portalParticles.material) {
      this.portalParticles.material.opacity = opacity;
    }
    if (this.warpPortal && this.warpPortal.material) {
      this.warpPortal.material.opacity = opacity;
    }
  }
  /**
   * Set portal scale
   * @param {number} scale - Scale factor
   */
  setScale(scale) {
    if (this.warpTunnel) {
      this.warpTunnel.scale.set(scale, scale, 1);
    }
  }
  /**
   * Set portal position
   * @param {THREE.Vector3} position - Position vector
   */
  setPosition(position) {
    if (this.warpTunnel) {
      this.warpTunnel.position.copy(position);
    }
  }
  /**
   * Set portal rotation
   * @param {THREE.Euler} rotation - Rotation euler angles
   */
  setRotation(rotation) {
    if (this.warpTunnel) {
      this.warpTunnel.rotation.copy(rotation);
    }
  }
  /**
   * Set portal visibility
   * @param {boolean} visible - Whether portal should be visible
   */
  setVisible(visible) {
    if (this.warpTunnel) {
      this.warpTunnel.visible = visible;
    }
  }
  /**
   * Get the portal group for adding to scene
   * @returns {THREE.Group} The warp tunnel group
   */
  getPortalGroup() {
    return this.warpTunnel;
  }
  /**
   * Clean up portal resources
   */
  dispose() {
    if (this.warpPortal) {
      if (this.warpPortal.geometry) this.warpPortal.geometry.dispose();
      if (this.warpPortal.material) this.warpPortal.material.dispose();
    }
    if (this.portalParticles) {
      if (this.portalParticles.geometry) this.portalParticles.geometry.dispose();
      if (this.portalParticles.material) this.portalParticles.material.dispose();
    }
    this.warpTunnel = null;
    this.warpPortal = null;
    this.portalParticles = null;
  }
}
class DialogueSystem {
  constructor() {
    this.dialogueBox = null;
    this.dialogueText = null;
    this.currentDialogueIndex = 0;
    this.isTyping = false;
    this.typeInterval = null;
    this.dialogueWavs = [];
    this.audioManager = null;
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
  }
  /**
   * Initialize the dialogue system with required dependencies
   * @param {Array} dialogueWavs - Array of loaded dialogue audio elements
   * @param {AudioManager} audioManager - Audio manager for volume control
   */
  initialize(dialogueWavs, audioManager) {
    this.dialogueWavs = dialogueWavs;
    this.audioManager = audioManager;
  }
  /**
   * Setup the dialogue UI elements
   */
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
  /**
   * Type out the next dialogue line with animation
   * @param {number} sequenceTime - Current sequence time for auto-advance logic
   * @param {boolean} isPlaying - Whether intro sequence is still playing
   * @returns {boolean} True if there are more dialogues, false if complete
   */
  typeNextDialogue(sequenceTime = 0, isPlaying = true) {
    if (this.currentDialogueIndex >= this.dialogueLines.length) {
      return false;
    }
    const line = this.dialogueLines[this.currentDialogueIndex];
    playDialogueWav(this.dialogueWavs, this.currentDialogueIndex, this.audioManager);
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
      } else {
        clearInterval(this.typeInterval);
        this.typeInterval = null;
        this.isTyping = false;
        if (sequenceTime < 22) {
          const waitTime = Math.max(line.length * 50, 3e3);
          setTimeout(() => {
            if (!this.isTyping && isPlaying) {
              this.typeNextDialogue(sequenceTime, isPlaying);
            }
          }, waitTime);
        }
      }
    }, 30);
    return true;
  }
  /**
   * Get current dialogue index
   * @returns {number} Current dialogue index
   */
  getCurrentDialogueIndex() {
    return this.currentDialogueIndex;
  }
  /**
   * Check if currently typing
   * @returns {boolean} True if typing animation is active
   */
  getIsTyping() {
    return this.isTyping;
  }
  /**
   * Clean up dialogue system resources
   */
  cleanup() {
    if (this.typeInterval) {
      clearInterval(this.typeInterval);
      this.typeInterval = null;
    }
    if (this.dialogueBox && this.dialogueBox.parentNode) {
      this.dialogueBox.parentNode.removeChild(this.dialogueBox);
      this.dialogueBox = null;
      this.dialogueText = null;
    }
    this.currentDialogueIndex = 0;
    this.isTyping = false;
  }
}
function updateArrivalPhase(progress, context) {
  const {
    portalEffect,
    starDreadnought,
    camera,
    spaceship,
    introSounds,
    flashOverlay
  } = context;
  portalEffect.updatePortalEffect();
  portalEffect.setPosition(new Vector3(3e4, 5e3, 0));
  portalEffect.setRotation(new Euler(0, 0, Math.PI / 2));
  if (progress < 0.2) {
    const portalProgress = progress / 0.2;
    const portalScale = portalProgress * 3.5;
    portalEffect.setScale(portalScale);
    camera.position.set(0, 6e3, 12e3);
    camera.lookAt(3e4, 5e3, 0);
  }
  if (progress >= 0.2 && progress < 0.7) {
    if (progress >= 0.2 && !starDreadnought.ship.visible) {
      starDreadnought.ship.visible = true;
      flashOverlay(0.3);
      if (introSounds.shipArrival) {
        introSounds.shipArrival.play();
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
    starDreadnought.ship.position.copy(position);
    const enginePower = 0.4 + easeInOut * 0.6;
    starDreadnought.setEnginesPower(enginePower);
    if (progress > 0.3) {
      const portalFade = Math.min((progress - 0.3) / 0.3, 1);
      portalEffect.setOpacity(1 - portalFade);
    }
    const shipPos = starDreadnought.ship.position.clone();
    camera.position.set(
      shipPos.x - 3e3,
      shipPos.y + 1e3,
      8e3
    );
    camera.lookAt(shipPos);
  }
  if (progress >= 0.7) {
    portalEffect.setOpacity(0);
    if (progress < 0.75 && !starDreadnought.teleportBeamActive) {
      starDreadnought.activateTeleportBeam();
      if (introSounds.teleport) {
        introSounds.teleport.play();
      }
    }
    starDreadnought.updateTeleportBeam(progress);
    if (progress > 0.8 && spaceship && !spaceship.mesh.visible) {
      const dreadPos = starDreadnought.ship.position;
      spaceship.mesh.position.set(
        dreadPos.x,
        dreadPos.y - 2e3,
        // 2000 units below dreadnought
        dreadPos.z
      );
      if (spaceship.isDocked) {
        console.log("Undocking player ship during intro sequence");
        spaceship.isDocked = false;
        spaceship.mesh.visible = true;
      } else {
        spaceship.mesh.visible = true;
      }
      context.finalPlayerPosition = spaceship.mesh.position.clone();
      createPlayerShieldEffect(spaceship, context);
      flashOverlay(0.3);
    }
    const shipPos = starDreadnought.ship.position.clone();
    const t = (progress - 0.7) / 0.3;
    camera.position.set(
      shipPos.x - 2e3 + t * 2e3,
      shipPos.y + 2e3,
      5e3 - t * 3e3
    );
    const lookY = shipPos.y - 1e3;
    camera.lookAt(shipPos.x, lookY, shipPos.z);
  }
}
function createPlayerShieldEffect(spaceship, context) {
  const geometry = new SphereGeometry(30, 32, 32);
  const material = new MeshBasicMaterial({
    color: 8965375,
    transparent: true,
    opacity: 0.6,
    side: DoubleSide
  });
  context.playerShieldEffect = new Mesh(geometry, material);
  context.playerShieldEffect.scale.set(1.2, 1.2, 1.2);
  spaceship.mesh.add(context.playerShieldEffect);
  context.shieldPulseTime = 0;
}
function updateDeparturePhase(progress, context) {
  const {
    portalEffect,
    starDreadnought,
    camera,
    introSounds,
    flashOverlay
  } = context;
  const portalPos = new Vector3(3e4, 5e3, 0);
  if (progress < 0.5) {
    if (progress < 0.1 && starDreadnought.teleportBeamActive) {
      starDreadnought.deactivateTeleportBeam();
    }
    if (progress > 0.1) {
      portalEffect.setPosition(portalPos);
      portalEffect.setVisible(true);
      portalEffect.setRotation(new Euler(0, 0, Math.PI / 2));
      portalEffect.setScale(3.5);
      const portalProgress = Math.min((progress - 0.1) / 0.3, 1);
      portalEffect.setOpacity(portalProgress);
    }
    if (progress > 0.2) {
      const rotateProgress = Math.min((progress - 0.2) / 0.3, 1);
      const startRot = Math.PI / 2;
      const endRot = 3 * Math.PI / 2;
      starDreadnought.ship.rotation.y = startRot + (endRot - startRot) * rotateProgress;
    }
    const shipPos = starDreadnought.ship.position.clone();
    camera.position.set(
      shipPos.x,
      shipPos.y + 3e3,
      // High-ish angle
      shipPos.z + 8e3
      // Side view
    );
    camera.lookAt(shipPos);
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
    starDreadnought.ship.position.copy(position);
    starDreadnought.setEnginesPower(0.7 + moveProgress * 0.8);
    if (moveProgress > 0.6 && moveProgress < 0.63) {
      flashOverlay(0.4);
      if (introSounds.warp && Math.abs(moveProgress - 0.61) < 0.01) {
        introSounds.warp.play();
      }
    }
    if (moveProgress > 0.65) {
      starDreadnought.ship.visible = false;
    }
    if (moveProgress > 0.9) {
      const collapseProgress = (moveProgress - 0.9) / 0.1;
      const collapseScale = (1 - collapseProgress) * 3.5;
      portalEffect.setScale(collapseScale);
    }
    const shipPos = startPos.clone();
    camera.position.set(
      shipPos.x - 2e3,
      shipPos.y + 3e3,
      1e4
      // Side view
    );
    const lookPos = new Vector3().lerpVectors(startPos, portalPos, 0.5);
    camera.lookAt(lookPos);
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
    this.portalEffect = new PortalEffect();
    this.setupOverlay();
    this.dialogueSystem = new DialogueSystem();
    this.introSounds = {};
    this.dialogueWavs = [];
    console.log("Intro sequence initialized");
    this.dialogueWavs = loadDialogueWavs();
    this.introSounds = createIntroSoundEffects(this.audio);
    this.dialogueSystem.initialize(this.dialogueWavs, this.audio);
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
    this.scene.add(this.portalEffect.getPortalGroup());
    this.starDreadnought.ship.position.set(35e3, 5e3, 0);
    this.starDreadnought.ship.rotation.y = Math.PI / 2;
    this.starDreadnought.ship.visible = false;
    this.animate = this.animate.bind(this);
    this.lastTime = performance.now();
    requestAnimationFrame(this.animate);
    this.setupSkipHandler();
    this.dialogueSystem.setupDialogueUI();
    setTimeout(() => {
      this.dialogueSystem.typeNextDialogue(this.sequenceTime, this.isPlaying);
    }, 2e3);
    if (this.introSounds.warp) {
      this.introSounds.warp.play();
    }
  }
  animate(currentTime) {
    if (!this.isPlaying) return;
    const deltaTime = Math.min((currentTime - this.lastTime) / 1e3, 0.1) * 0.4;
    this.lastTime = currentTime;
    this.sequenceTime += deltaTime;
    if (this.sequenceTime < 14) {
      const context = this.createAnimationContext();
      updateArrivalPhase(this.sequenceTime / 14, context);
    } else if (this.sequenceTime < 24) {
      const context = this.createAnimationContext();
      updateDeparturePhase((this.sequenceTime - 14) / 10, context);
    } else {
      this.completeSequence();
      return;
    }
    requestAnimationFrame(this.animate);
  }
  /**
   * Create context object for animation phases
   * @returns {Object} Context containing all necessary references
   */
  createAnimationContext() {
    return {
      portalEffect: this.portalEffect,
      starDreadnought: this.starDreadnought,
      camera: this.camera,
      spaceship: this.spaceship,
      introSounds: this.introSounds,
      flashOverlay: this.flashOverlay.bind(this),
      finalPlayerPosition: this.finalPlayerPosition,
      playerShieldEffect: this.playerShieldEffect,
      shieldPulseTime: this.shieldPulseTime
    };
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
    if (this.spaceship && this.spaceship.mesh) {
      this.spaceship.mesh.position.set(22e3, 3e3, 0);
      this.spaceship.mesh.rotation.set(0, 0, 0);
      this.spaceship.isDocked = false;
      this.spaceship.mesh.visible = true;
      if (this.spaceship.hull <= 0) {
        console.log("Fixing spaceship hull from", this.spaceship.hull, "to 100");
        this.spaceship.hull = 100;
      }
      if (this.spaceship.shield <= 0) {
        console.log("Fixing spaceship shield from", this.spaceship.shield, "to 50");
        this.spaceship.shield = 50;
      }
      if (this.spaceship.fuel <= 0) {
        console.log("Fixing spaceship fuel from", this.spaceship.fuel, "to 100");
        this.spaceship.fuel = 100;
      }
    }
    this.completeSequence();
    if (window.gameInstance && window.gameInstance.spaceship) {
      window.gameInstance.spaceship.isDocked = false;
      console.log("Ship set to undocked state after skip");
      if (window.gameInstance.spaceship.hull <= 0) {
        console.log("Fixing global spaceship hull to 100");
        window.gameInstance.spaceship.hull = 100;
      }
      if (window.gameInstance.spaceship.fuel <= 0) {
        console.log("Fixing global spaceship fuel to 100");
        window.gameInstance.spaceship.fuel = 100;
      }
    }
  }
  completeSequence() {
    console.log("Intro sequence complete");
    this.isPlaying = false;
    this.scene.remove(this.portalEffect.getPortalGroup());
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
    this.dialogueSystem.cleanup();
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
    this.dialogueSystem.cleanup();
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    document.removeEventListener("keydown", this.skipHandler);
    if (this.portalEffect) {
      this.portalEffect.dispose();
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
    this.portalEffect = null;
    this.dialogueSystem = null;
    this.dialogueWavs = [];
  }
}
class StartupSequence {
  constructor(game) {
    this.game = game;
    this.introSequence = null;
    this.introSequenceActive = false;
  }
  // Initialize game in sequence, showing start screen first and loading non-essentials after
  async initializeGameSequence() {
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (this.game.audio && this.game.audio.audioContext && this.game.audio.audioContext.state === "suspended") {
        try {
          this.game.audio.resumeAudioContext();
        } catch (e) {
        }
      }
      if (this.game.ui && this.game.ui.startScreen) {
        this.game.ui.startScreen.show();
      } else {
        this.fallbackToDefaultBehavior();
      }
      requestAnimationFrame(this.game.boundAnimate);
      this.initializeRemainingSystemsAsync();
    } catch (error) {
      if (this.game.ui && this.game.ui.showError) {
        this.game.ui.showError("Failed to initialize game: " + error.message);
      } else {
        alert("Failed to initialize game: " + error.message);
      }
    }
  }
  // Initialize remaining systems asynchronously after showing the start screen
  async initializeRemainingSystemsAsync() {
    try {
      this.loadAudioAsync();
      if (!this.game.combat) {
        const { Combat } = await __vitePreload(async () => {
          const { Combat: Combat2 } = await import("./modules-CtmUUd99.js").then((n) => n.i);
          return { Combat: Combat2 };
        }, true ? __vite__mapDeps([0,1,2]) : void 0);
        this.game.combat = new Combat(this.game.scene, this.game.spaceship);
        if (this.game.combat.world) {
        } else {
          setTimeout(() => {
            if (this.game.combat.world && this.game.combat.playerEntity) {
            } else {
              console.warn("Combat ECS world or player entity not available after delay, recreating...");
              if (this.game.combat.createPlayerReferenceEntity) {
                this.game.combat.createPlayerReferenceEntity();
              }
            }
          }, 1e3);
        }
      }
      setTimeout(() => {
        this.game.initializeObjectPools();
        this.game.preWarmBasicShaders();
      }, 100);
    } catch (error) {
    }
  }
  // Load audio asynchronously after showing the start screen
  async loadAudioAsync() {
    try {
      if (this.game.audio) {
        this.game.audio.initialize().then(() => {
        }).catch((error) => {
        });
      }
    } catch (error) {
    }
  }
  fallbackToDefaultBehavior() {
    this.game.startDocked();
  }
  initIntroSequence() {
    this.introSequence = new IntroSequence(
      this.game.scene,
      this.game.camera,
      this.game.spaceship,
      this.game.audio
      // Pass audio manager as 4th parameter
    );
    this.introSequence.onComplete = () => {
      this.completeIntroSequence();
    };
  }
  startIntroSequence() {
    if (!this.introSequence) {
      this.initIntroSequence();
    }
    this.introSequenceActive = true;
    this.game.introSequenceActive = true;
    if (this.game.combat && this.game.combat.world && this.game.combat.world.enemySystem) {
      this.game.combat.world.enemySystem.freezeAllEnemies();
    }
    if (this.game.ui && this.game.ui.combatDisplay) {
      this.game.ui.combatDisplay.hide();
    }
    if (this.game.ui && this.game.ui.stargateInterface) {
      this.game.ui.stargateInterface.hide();
    }
    if (this.game.ui) {
      this.game.ui.hideUI();
    }
    if (this.game.spaceship && this.game.spaceship.mesh) {
      this.game.spaceship.mesh.position.set(0, 0, 50);
      this.game.spaceship.mesh.rotation.set(0, 0, 0);
    }
    this.introSequence.startSequence(() => {
      this.completeIntroSequence();
    });
  }
  completeIntroSequence() {
    this.introSequenceActive = false;
    this.game.introSequenceActive = false;
    localStorage.setItem("introPlayed", "true");
    if (this.game.combat && this.game.combat.world && this.game.combat.world.enemySystem) {
      this.game.combat.world.enemySystem.unfreezeAllEnemies();
    }
    if (this.game.ui && this.game.ui.stargateInterface) {
      this.game.ui.stargateInterface.hide();
    }
    if (this.game.ui) {
      this.game.ui.showUI();
    }
    if (this.game.spaceship) {
      if (this.game.spaceship.isDocked) {
        this.game.spaceship.undock();
      }
      if (this.game.spaceship.mesh) {
        console.log(
          "Player position after intro:",
          this.game.spaceship.mesh.position.x,
          this.game.spaceship.mesh.position.y,
          this.game.spaceship.mesh.position.z
        );
      }
    }
    if (this.game.ui && this.game.ui.combatDisplay) {
      this.game.ui.combatDisplay.show();
    }
    if (window.mainMessageBus) {
      window.mainMessageBus.publish("intro.completed", {});
    }
  }
}
class GameLoop {
  constructor(game) {
    this.game = game;
    this.frameRateCap = 0;
    this.warmupFrames = 10;
    this.currentWarmupFrame = 0;
    this.performanceStable = false;
    this.lastFrameTime = 0;
    this.actualFrameTime = 0;
    this.frameStartTime = 0;
    this.accumulator = 0;
    this.fixedDeltaTime = 1 / 60;
    this.fpsBuffer = [];
    this.fpsBufferSize = 15;
    this.boundAnimate = this.animate.bind(this);
    this.deltaTime = 0;
    this.lastUpdateTime = performance.now();
    this.frameCount = 0;
    this.currentFPS = 0;
  }
  start() {
    requestAnimationFrame(this.boundAnimate);
  }
  animate(timestamp) {
    if (this.currentWarmupFrame < this.warmupFrames) {
      this.currentWarmupFrame++;
      if (this.currentWarmupFrame === this.warmupFrames) {
        this.lastFrameTime = timestamp;
        this.frameStartTime = performance.now();
        this.lastUpdateTime = performance.now();
        this.performanceStable = true;
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
        this.lastFrameTime = timestamp - targetFrameTime;
      }
    } else {
      this.lastFrameTime = timestamp;
    }
    const now = performance.now();
    const rawDelta = Math.min((now - this.lastUpdateTime) / 1e3, 0.1);
    this.lastUpdateTime = now;
    this.accumulator += rawDelta;
    while (this.accumulator >= this.fixedDeltaTime) {
      this.deltaTime = this.fixedDeltaTime;
      this.game.gameTime += this.deltaTime;
      this.game.update(this.deltaTime);
      this.accumulator -= this.fixedDeltaTime;
    }
    if (this.game.renderer && this.game.renderer.render) {
      this.game.renderer.render();
    }
    this.updateFPS();
    requestAnimationFrame(this.boundAnimate);
  }
  updateFPS() {
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
    if (this.frameCount % 5 === 0 && this.game.ui && this.game.ui.updateFPS) {
      if (this.frameRateCap > 0) {
        this.game.ui.updateFPS(this.currentFPS, this.frameRateCap);
      } else {
        this.game.ui.updateFPS(this.currentFPS);
      }
    }
    this.frameCount++;
  }
  setFrameRateCap(cap) {
    this.frameRateCap = cap;
  }
  applyFrameRateSettings() {
    if (this.game.ui && this.game.ui.settings) {
      const frameRateSetting = this.game.ui.settings.getFrameRateCap ? this.game.ui.settings.getFrameRateCap() : 0;
      if (frameRateSetting === "auto" || frameRateSetting === 0) {
        this.setFrameRateCap(0);
        this.detectRefreshRate().then((rate) => {
          if (rate && rate > 0) {
            this.setFrameRateCap(rate);
          }
        });
      } else {
        this.setFrameRateCap(parseInt(frameRateSetting));
      }
    }
  }
  async detectRefreshRate() {
    return new Promise((resolve) => {
      let frames = 0;
      let startTime = 0;
      const samples = [];
      const measure = (timestamp) => {
        if (frames === 0) {
          startTime = timestamp;
        } else if (frames > 10 && frames <= 70) {
          const delta = timestamp - startTime;
          samples.push(delta);
          startTime = timestamp;
        }
        frames++;
        if (frames < 80) {
          requestAnimationFrame(measure);
        } else {
          if (samples.length > 0) {
            const avgFrameTime = samples.reduce((a, b) => a + b, 0) / samples.length;
            const detectedRate = Math.round(1e3 / avgFrameTime);
            const commonRates = [30, 60, 75, 90, 120, 144, 165, 240, 360];
            let closestRate = 60;
            let minDiff = Math.abs(detectedRate - 60);
            for (const rate of commonRates) {
              const diff = Math.abs(detectedRate - rate);
              if (diff < minDiff) {
                minDiff = diff;
                closestRate = rate;
              }
            }
            if (minDiff < 5) {
              resolve(closestRate);
            } else {
              resolve(0);
            }
          } else {
            resolve(0);
          }
        }
      };
      requestAnimationFrame(measure);
    });
  }
  destroy() {
    if (this.boundAnimate) {
      cancelAnimationFrame(this.boundAnimate);
      this.boundAnimate = null;
    }
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
class Diagnostics {
  constructor(game) {
    this.game = game;
    this.setupDiagnostics();
  }
  setupDiagnostics() {
    initPerfOverlay();
    if (!window.__perf) window.__perf = {};
    window.__perf.enabled = false;
    window.setFPSLimit = (limit) => {
      if (this.game.gameLoop) {
        this.game.gameLoop.setFrameRateCap(limit);
        return `FPS limit set to ${limit > 0 ? limit : "unlimited"}`;
      }
      return "Game loop not initialized";
    };
    window.togglePerf = () => {
      window.__perf.enabled = !window.__perf.enabled;
      if (window.__perf.enabled) {
        if (this.game.ui && this.game.ui.initializePerformanceMonitor) {
          this.game.ui.initializePerformanceMonitor();
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
        if (this.game.ui && this.game.ui.statsInterval) {
          clearInterval(this.game.ui.statsInterval);
          this.game.ui.statsInterval = null;
        }
      }
      return window.__perf.enabled ? "enabled" : "disabled";
    };
    window.playIntro = () => {
      if (this.game.startupSequence && this.game.startupSequence.startIntroSequence) {
        this.game.startupSequence.startIntroSequence();
        return "Playing intro sequence...";
      }
      return "Intro sequence not available";
    };
    window.toggleDebug = () => {
      window.DEBUG_MODE = !window.DEBUG_MODE;
      return `Debug mode ${window.DEBUG_MODE ? "enabled" : "disabled"}`;
    };
    window.gameState = () => {
      var _a, _b, _c;
      return {
        isGameOver: this.game.isGameOver,
        isDocked: (_a = this.game.spaceship) == null ? void 0 : _a.isDocked,
        introActive: this.game.introSequenceActive,
        hordeActive: this.game.isHordeActive,
        fps: (_b = this.game.gameLoop) == null ? void 0 : _b.currentFPS,
        gameTime: this.game.gameTime,
        difficulty: (_c = this.game.difficultyManager) == null ? void 0 : _c.currentLevel
      };
    };
    window.startHorde = () => {
      if (this.game.activateHordeMode) {
        this.game.activateHordeMode();
        return "Horde mode activated!";
      }
      return "Horde mode not available";
    };
    window.memStats = () => {
      if (window.MemoryStats) {
        window.MemoryStats.update();
        return window.MemoryStats.getReport();
      }
      return "Memory stats not available";
    };
    window.poolStats = (poolName) => {
      if (window.objectPool && window.objectPool.getStats) {
        if (poolName) {
          return window.objectPool.getStats(poolName);
        } else {
          const allStats = {};
          const pools = ["projectile", "enemy", "particle", "hitEffect", "explosion"];
          for (const pool of pools) {
            const stats = window.objectPool.getStats(pool);
            if (stats) {
              allStats[pool] = stats;
            }
          }
          return allStats;
        }
      }
      return "Object pool not available";
    };
    window.entityCount = () => {
      var _a;
      if (this.game.combat && this.game.combat.world && this.game.combat.world.entityManager) {
        const entities = this.game.combat.world.entityManager.entities.size;
        const systems = this.game.combat.world.systemManager.systems.length;
        return {
          entities,
          systems,
          sceneChildren: (_a = this.game.scene) == null ? void 0 : _a.children.length
        };
      }
      return "ECS world not available";
    };
  }
}
class GameInitializer {
  constructor(game) {
    this.game = game;
  }
  initializeCore() {
    if (window.DEBUG_MODE) console.log("Creating audio manager...");
    this.game.audio = new AudioManager();
    if (window.DEBUG_MODE) console.log("Creating renderer...");
    this.game.renderer = new Renderer();
    if (window.DEBUG_MODE) console.log("Renderer created, getting scene...");
    this.game.scene = this.game.renderer.scene;
    this.game.camera = this.game.renderer.camera;
    if (window.DEBUG_MODE) console.log("Scene and camera references obtained");
    this.game.scene.camera = this.game.camera;
    if (window.DEBUG_MODE) console.log("Initializing essential components...");
    this.game.physics = new Physics(this.game.scene);
    this.game.physics.setCamera(this.game.camera);
    this.game.environment = new Environment(this.game.scene);
    if (window.DEBUG_MODE) console.log("Creating spaceship...");
    this.game.spaceship = new Spaceship(this.game.scene);
    this.game.physics.setSpaceship(this.game.spaceship);
    this.game.environment.setSpaceship(this.game.spaceship);
    this.game.ui = new UI(this.game.spaceship, this.game.environment);
    this.game.ui.setAudio(this.game.audio);
    this.game.controls = new Controls(this.game.spaceship, this.game.physics, this.game.environment, this.game.ui);
    this.game.ui.setControls(this.game.controls);
    if (window.DEBUG_MODE) console.log("Initializing settings...");
    this.game.ui.initializeSettings(this.game);
  }
  setupEventHandlers() {
    window.addEventListener("resize", this.game.handleResize.bind(this.game));
    document.addEventListener("visibilitychange", this.game.handleVisibilityChange.bind(this.game));
    document.addEventListener("keydown", this.game.handleKeyDown.bind(this.game));
  }
  startDocked() {
    console.log("Starting game in docked state");
    if (this.game.spaceship) {
      if (!this.game.spaceship.isDocked) {
        console.log("Docking spaceship...");
        this.game.spaceship.dock();
      } else {
        console.log("Spaceship already docked");
      }
    } else {
      console.error("No spaceship found!");
    }
    if (this.game.camera) {
      this.game.camera.position.set(0, 1500, 0);
      console.log("Camera position set for docked state");
    }
    if (this.game.controls && this.game.controls.dockingSystem) {
      this.game.controls.dockingSystem.isDocked = true;
      console.log("Docking system updated");
    }
    if (this.game.ui && this.game.ui.stargateInterface) {
      console.log("Showing stargate UI...");
      this.game.ui.stargateInterface.showStargateUI();
    } else {
      console.error("No stargate interface found!", this.game.ui);
    }
  }
}
class ObjectPools {
  constructor(game) {
    this.game = game;
  }
  // Pre-warm only the most essential shaders needed for immediate gameplay
  preWarmBasicShaders() {
    this.projectileGeometry = new SphereGeometry(1.8, 12, 12);
    this.projectileMaterial = new MeshStandardMaterial({
      color: 65535,
      emissive: 65535,
      emissiveIntensity: 5,
      metalness: 0.7,
      roughness: 0.3
    });
    const dummyProjectile = new Mesh(this.projectileGeometry, this.projectileMaterial);
    this.game.scene.add(dummyProjectile);
    this.game.renderer.renderer.compile(this.game.scene, this.game.camera);
    this.game.renderer._withGuard(() => this.game.scene.remove(dummyProjectile));
  }
  initializeObjectPools() {
    try {
      if (!this.hitEffectGeometry) {
        this.hitEffectGeometry = new SphereGeometry(2, 8, 8);
      }
      window.objectPool.createPool("hitEffect", () => {
        const material = new MeshBasicMaterial({
          color: 16733440,
          transparent: true,
          opacity: 0.8
        });
        const mesh = new Mesh(this.hitEffectGeometry, material);
        mesh.visible = false;
        return {
          mesh,
          material,
          reset: function(color = 16733440, size = 1) {
            this.material.color.set(color);
            this.material.opacity = 0.8;
            this.mesh.scale.set(size, size, size);
            this.mesh.visible = true;
          },
          clear: function() {
            if (this.mesh.parent) {
              this.mesh.parent.remove(this.mesh);
            }
            this.mesh.visible = false;
          }
        };
      }, 5, 20);
      if (!this.projectileGeometry) {
        this.projectileGeometry = new SphereGeometry(1.8, 12, 12);
      }
      const particleGeometry = new SphereGeometry(0.5, 4, 4);
      const particleMaterial = new MeshBasicMaterial({
        color: 16733440,
        transparent: true
      });
      window.objectPool.createPool("particle", () => {
        const mesh = new Mesh(particleGeometry, particleMaterial.clone());
        mesh.visible = false;
        return {
          mesh,
          velocity: new Vector3(),
          life: 0,
          reset: function(position, velocity, color = 16733440) {
            this.mesh.position.copy(position);
            this.velocity.copy(velocity);
            this.mesh.material.color.set(color);
            this.mesh.material.opacity = 1;
            this.mesh.visible = true;
            this.life = 1;
          },
          update: function(delta) {
            this.life -= delta * 2;
            if (this.life <= 0) {
              this.clear();
              return false;
            }
            this.mesh.position.add(this.velocity.clone().multiplyScalar(delta));
            this.mesh.material.opacity = this.life;
            return true;
          },
          clear: function() {
            if (this.mesh.parent) {
              this.mesh.parent.remove(this.mesh);
            }
            this.mesh.visible = false;
            this.life = 0;
          }
        };
      }, 20, 100);
      const particleCount = 15;
      window.objectPool.createPool("explosion", () => {
        const container = new Group();
        const particles = [];
        for (let i = 0; i < particleCount; i++) {
          const particle = window.objectPool.get("particle");
          if (particle) {
            particles.push(particle);
          }
        }
        return {
          container,
          particles,
          active: false,
          reset: function(position, color = 16733440, force = 50) {
            this.container.position.copy(position);
            this.active = true;
            for (let i = 0; i < particleCount; i++) {
              if (this.particles[i]) {
                const velocity = new Vector3(
                  (Math.random() - 0.5) * force,
                  (Math.random() - 0.5) * force,
                  (Math.random() - 0.5) * force
                );
                this.particles[i].reset(new Vector3(), velocity, color);
                this.container.add(this.particles[i].mesh);
              }
            }
            if (!this.container.parent) {
              window.game.scene.add(this.container);
            }
          },
          update: function(delta) {
            if (!this.active) return false;
            let anyAlive = false;
            for (let i = 0; i < particleCount; i++) {
              if (this.particles[i] && this.particles[i].life > 0) {
                if (this.particles[i].update(delta)) {
                  anyAlive = true;
                }
              }
            }
            if (!anyAlive) {
              this.clear();
              return false;
            }
            return true;
          },
          clear: function() {
            this.active = false;
            for (let i = 0; i < particleCount; i++) {
              if (this.particles[i]) {
                this.particles[i].clear();
              }
            }
            if (this.container.parent) {
              this.container.parent.remove(this.container);
            }
          }
        };
      }, 5, 20);
    } catch (error) {
      console.error("Error initializing object pools:", error);
    }
  }
}
class DifficultyManager {
  constructor() {
    this.params = {
      maxEnemies: 10,
      spawnInterval: 3,
      enemyHealth: 20,
      enemyDamage: 15,
      enemySpeed: 700
    };
    this.gameTime = 0;
    this.currentLevel = 1;
  }
  update(deltaTime) {
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
      if (window.DEBUG_MODE) {
        console.log(`Difficulty increased to level ${this.currentLevel} (${difficultyMultiplier}x)`);
        console.log(`Parameters: maxEnemies=${this.params.maxEnemies}, spawnInterval=${this.params.spawnInterval}`);
        console.log(`Health=${this.params.enemyHealth}, Damage=${this.params.enemyDamage}, Speed=${this.params.enemySpeed}`);
      }
    }
  }
}
class HordeMode {
  constructor(game) {
    this.game = game;
    this.isActive = false;
    this.startTime = 0;
    this.survivalTime = 0;
  }
  /**
   * Activate horde mode (extreme survival challenge)
   */
  activate() {
    if (this.isActive) return;
    if (window.DEBUG_MODE) console.log("ACTIVATING HORDE MODE - EXTREME SURVIVAL CHALLENGE");
    this.isActive = true;
    this.startTime = performance.now();
    this.survivalTime = 0;
    this.game.isHordeActive = true;
    this.game.hordeStartTime = this.startTime;
    this.game.hordeSurvivalTime = this.survivalTime;
    if (this.game.audio) {
      this.game.audio.playSound("boink");
    }
    window.mainMessageBus.publish("horde.activated", {
      startTime: this.startTime
    });
    if (this.game.ui && this.game.ui.showNotification) {
      this.game.ui.showNotification("HORDE MODE ACTIVATED - SURVIVE!", 5e3);
    }
    if (this.game.spaceship && this.game.spaceship.isDocked) {
      if (window.DEBUG_MODE) console.log("Horde mode forcing undock from stargate");
      this.game.spaceship.undock();
      window.mainMessageBus.publish("player.requestUndock", {
        forced: true,
        reason: "horde_mode_activation"
      });
      setTimeout(() => {
        if (window.DEBUG_MODE) console.log("Horde mode ensuring HUD is visible");
        if (this.game.ui && this.game.ui.showUI) {
          this.game.ui.showUI();
        }
      }, 200);
    }
  }
  /**
   * Update horde mode survival time
   */
  update() {
    if (this.isActive) {
      this.survivalTime = performance.now() - this.startTime;
      this.game.hordeSurvivalTime = this.survivalTime;
    }
  }
  /**
   * Format horde survival time as MM:SS
   * @returns {string} Formatted time string
   */
  getFormattedSurvivalTime() {
    const totalSeconds = Math.floor(this.survivalTime / 1e3);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
}
class AudioUpdater {
  constructor(game) {
    this.game = game;
  }
  // Update game sounds based on current game state
  update() {
    if (!this.game.audio || !this.game.spaceship) return;
    if (this.game.spaceship.isDocked) {
      this.game.audio.stopSound("thrust");
    } else {
      const isThrusting = this.game.spaceship.thrust.forward || this.game.spaceship.thrust.backward || this.game.spaceship.thrust.left || this.game.spaceship.thrust.right;
      if (isThrusting) {
        this.game.audio.playSound("thrust");
        let thrustIntensity = 0.5;
        if (this.game.spaceship.thrust.forward) thrustIntensity += 0.2;
        if (this.game.spaceship.thrust.backward) thrustIntensity += 0.1;
        if (this.game.spaceship.thrust.left) thrustIntensity += 0.1;
        if (this.game.spaceship.thrust.right) thrustIntensity += 0.1;
        if (this.game.spaceship.thrust.boost) thrustIntensity *= 1.5;
        this.game.audio.setThrustVolume(thrustIntensity);
      } else {
        this.game.audio.stopSound("thrust");
      }
    }
  }
}
class GameLifecycle {
  constructor(game) {
    this.game = game;
  }
  checkGameOver() {
    if (!this.game.spaceship) return;
    if (this.game.spaceship.isDocked) return;
    if (this.game.spaceship.fuel <= 0 && !this.game.environment.stargate.isNearby(this.game.spaceship.mesh.position)) {
      this.gameOver("Out of fuel! You drift endlessly through space...");
    }
  }
  gameOver(reason) {
    if (this.game.isGameOver) return;
    this.game.isGameOver = true;
    if (this.game.boundAnimate) {
      cancelAnimationFrame(this.game.boundAnimate);
    }
    if (this.game.ui) {
      if (this.game.hordeMode && this.game.hordeMode.isActive) {
        const survivalTime = this.game.hordeMode.getFormattedSurvivalTime();
        this.game.ui.showGameOver(`HORDE MODE - Survived: ${survivalTime}\\n${reason}`);
      } else {
        this.game.ui.showGameOver(reason);
      }
    }
    if (this.game.audio) {
      this.game.audio.playSound("gameOver");
    }
    this.game.gameOverCleanupTimeout = setTimeout(() => {
      this.cleanup();
    }, 5e3);
  }
  cleanup() {
    if (window.objectPool && window.objectPool.clearAllPools) {
      window.objectPool.clearAllPools();
    }
    if (this.game.audio && this.game.audio.cleanup) {
      this.game.audio.cleanup();
    }
  }
  /**
   * Clean up all game resources, event listeners, and references
   * Call this when the game is no longer needed to prevent memory leaks
   */
  destroy() {
    if (this.game.gameLoop) {
      this.game.gameLoop.destroy();
      this.game.gameLoop = null;
    }
    if (this.game.gameOverCleanupTimeout) {
      clearTimeout(this.game.gameOverCleanupTimeout);
      this.game.gameOverCleanupTimeout = null;
    }
    window.removeEventListener("resize", this.game.handleResize);
    document.removeEventListener("visibilitychange", this.game.handleVisibilityChange);
    document.removeEventListener("keydown", this.game.handleKeyDown);
    if (this.game.renderer) {
      this.game.renderer.dispose();
      this.game.renderer = null;
    }
    if (this.game.audio) {
      this.game.audio.dispose();
      this.game.audio = null;
    }
    if (this.game.physics) {
      this.game.physics.dispose();
      this.game.physics = null;
    }
    if (this.game.spaceship) {
      this.game.spaceship.dispose();
      this.game.spaceship = null;
    }
    if (this.game.environment) {
      this.game.environment.dispose();
      this.game.environment = null;
    }
    if (this.game.controls) {
      this.game.controls.dispose();
      this.game.controls = null;
    }
    if (this.game.ui) {
      this.game.ui.dispose();
      this.game.ui = null;
    }
    if (this.game.combat) {
      this.game.combat.dispose();
      this.game.combat = null;
    }
    window.game = null;
  }
}
class Game {
  constructor() {
    // Event handlers
    __publicField(this, "handleResize", () => {
      if (this.renderer) {
        this.renderer.handleResize();
      }
    });
    __publicField(this, "handleVisibilityChange", () => {
      if (document.hidden) {
        if (this.audio) {
          this.audio.pauseAllSounds();
        }
      } else {
        if (this.audio) {
          this.audio.resumeAllSounds();
        }
      }
    });
    __publicField(this, "handleKeyDown", (event) => {
      if (event.key === "Escape") {
        if (this.ui && this.ui.togglePauseMenu) {
          this.ui.togglePauseMenu();
        }
      }
    });
    initializeGlobals();
    window.game = this;
    window.mainMessageBus.subscribe("game.over", (data) => this.lifecycle.gameOver(data.reason || "Game Over"));
    try {
      this.initializer = new GameInitializer(this);
      this.initializer.initializeCore();
      this.isGameOver = false;
      this.introSequenceActive = false;
      this.gameTime = 0;
      this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
      this.difficultyManager = new DifficultyManager();
      this.hordeMode = new HordeMode(this);
      this.audioUpdater = new AudioUpdater(this);
      this.lifecycle = new GameLifecycle(this);
      this.objectPools = new ObjectPools(this);
      this.initializer.setupEventHandlers();
      this.gameLoop = new GameLoop(this);
      this.boundAnimate = this.gameLoop.boundAnimate;
      if (this.ui && this.ui.settings) {
        this.gameLoop.applyFrameRateSettings();
      }
      this.startupSequence = new StartupSequence(this);
      this.diagnostics = new Diagnostics(this);
      this.startupSequence.initializeGameSequence();
    } catch (error) {
      throw error;
    }
  }
  // Delegation methods
  initIntroSequence() {
    this.startupSequence.initIntroSequence();
  }
  startIntroSequence() {
    this.startupSequence.startIntroSequence();
  }
  completeIntroSequence() {
    this.startupSequence.completeIntroSequence();
  }
  preWarmBasicShaders() {
    this.objectPools.preWarmBasicShaders();
  }
  initializeObjectPools() {
    this.objectPools.initializeObjectPools();
  }
  startDocked() {
    this.initializer.startDocked();
  }
  setupEventHandlers() {
    this.initializer.setupEventHandlers();
  }
  initializeDifficultyManager() {
  }
  activateHordeMode() {
    this.hordeMode.activate();
  }
  getFormattedHordeSurvivalTime() {
    return this.hordeMode.getFormattedSurvivalTime();
  }
  updateAudio() {
    this.audioUpdater.update();
  }
  checkGameOver() {
    this.lifecycle.checkGameOver();
  }
  gameOver(reason) {
    this.lifecycle.gameOver(reason);
  }
  cleanup() {
    this.lifecycle.cleanup();
  }
  destroy() {
    this.lifecycle.destroy();
  }
  // Main update loop
  update(deltaTime) {
    if (this.isGameOver) return;
    this.hordeMode.update();
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
    if (this.controls.update) {
      this.controls.update();
    }
    this.updateCombat(deltaTime);
    if (this.environment.update) {
      this.environment.update(deltaTime, this.camera);
    }
    if (this.ui.update) {
      this.ui.update();
    }
    this.updateAudio();
    this.checkGameOver();
    this.updateECSWorld(deltaTime);
  }
  updateCombat(deltaTime) {
    if (this.combat && this.combat.updatePlayerReference) {
      try {
        this.combat.updatePlayerReference();
      } catch (error) {
      }
    } else if (this.combat && !this.combat.updatePlayerReference) {
      if (this.combat.createPlayerReferenceEntity && !this.combat.playerEntity) {
        this.combat.createPlayerReferenceEntity();
      }
    }
    if (this.combat && this.combat.update) {
      this.combat.update(deltaTime);
    }
  }
  updateECSWorld(deltaTime) {
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
}
function startGameMainModule() {
  try {
    const loadingOverlay = document.getElementById("loading-overlay");
    if (loadingOverlay) {
      setTimeout(() => {
        loadingOverlay.style.opacity = "0";
        loadingOverlay.style.transition = "opacity 1s ease-in-out";
        setTimeout(() => {
          if (loadingOverlay.parentNode) {
            loadingOverlay.remove();
          }
        }, 1e3);
      }, 100);
    }
    window.game = new Game();
  } catch (error) {
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
export {
  Game
};
//# sourceMappingURL=main-No8h_hpM.js.map
