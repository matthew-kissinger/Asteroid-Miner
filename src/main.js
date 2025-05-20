// Import all Three.js modules from our centralized import file
import * as ThreeImports from './three-imports.js';

// Make THREE extensible before adding properties
Object.defineProperty(window, 'THREE', {
  value: Object.assign({}, ThreeImports.THREE),
  writable: true,
  configurable: true
});

// Set up global THREE addon references that the original code expects
window.THREE.OrbitControls = ThreeImports.OrbitControls;
window.THREE.GLTFLoader = ThreeImports.GLTFLoader;
window.THREE.EffectComposer = ThreeImports.EffectComposer;
window.THREE.RenderPass = ThreeImports.RenderPass;
window.THREE.UnrealBloomPass = ThreeImports.UnrealBloomPass;
window.THREE.ShaderPass = ThreeImports.ShaderPass;
window.THREE.FXAAShader = ThreeImports.FXAAShader;
window.THREE.ColorCorrectionShader = ThreeImports.ColorCorrectionShader;
window.THREE.FilmShader = ThreeImports.FilmShader;
window.THREE.VignetteShader = ThreeImports.VignetteShader;
window.THREE.WebGL = ThreeImports.WebGL;

// Create a global compat layer for fixing module imports
window.__vite_compat = {
  resolveImport(path) {
    // This will be used to help resolve imports in the original code
    console.log(`Resolving import: ${path}`);
    return path;
  }
};

// Initialize the global object pool early
window.objectPool = {
  pools: {},
  
  // Initialize a pool for a specific object type
  createPool: function(type, factory, initialSize = 10, maxSize = 100) {
    if (!this.pools[type]) {
      this.pools[type] = {
        objects: [],
        factory: factory,
        maxSize: maxSize
      };
      
      // Pre-populate the pool
      for (let i = 0; i < initialSize; i++) {
        this.pools[type].objects.push(factory());
      }
    }
  },
  
  // Get an object from the pool or create a new one
  get: function(type, ...args) {
    const pool = this.pools[type];
    if (!pool) {
      console.warn(`No pool exists for type: ${type}`);
      return null;
    }
    
    let obj;
    if (pool.objects.length > 0) {
      obj = pool.objects.pop();
    } else {
      obj = pool.factory();
    }
    
    // Call reset method if it exists
    if (typeof obj.reset === 'function') {
      obj.reset(...args);
    }
    
    return obj;
  },
  
  // Return an object to the pool
  release: function(type, obj) {
    const pool = this.pools[type];
    if (!pool) {
      console.warn(`No pool exists for type: ${type}`);
      return;
    }
    
    // Prevent pool overflow
    if (pool.objects.length < pool.maxSize) {
      // Clear any references the object might have
      if (typeof obj.clear === 'function') {
        obj.clear();
      }
      
      pool.objects.push(obj);
    }
  },
  
  // Clear all pools
  clearAllPools: function() {
    for (const type in this.pools) {
      this.clearPool(type);
    }
  },
  
  // Clear a specific pool
  clearPool: function(type) {
    const pool = this.pools[type];
    if (!pool) {
      console.warn(`No pool exists for type: ${type}`);
      return;
    }
    
    // Clear each object in the pool
    for (const obj of pool.objects) {
      if (typeof obj.clear === 'function') {
        obj.clear();
      }
    }
    
    // Empty the pool array
    pool.objects = [];
  }
};

// ---------------- Asynchronous Asset Loading & Progress UI -----------------

// Create and inject a basic loading overlay that will display progress to the user
function createLoadingOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'loading-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.display = 'flex';
  overlay.style.flexDirection = 'column';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  overlay.style.background = 'radial-gradient(circle at center, #101020 0%, #000000 80%)';
  overlay.style.zIndex = '10000';

  const text = document.createElement('div');
  text.id = 'loading-text';
  text.style.fontFamily = 'Courier New, monospace';
  text.style.fontSize = '24px';
  text.style.color = '#30cfd0';
  text.style.marginBottom = '20px';
  text.textContent = 'Loading 0%';
  overlay.appendChild(text);

  const barContainer = document.createElement('div');
  barContainer.style.width = '60%';
  barContainer.style.maxWidth = '400px';
  barContainer.style.height = '10px';
  barContainer.style.border = '1px solid #30cfd0';
  barContainer.style.borderRadius = '5px';
  barContainer.style.overflow = 'hidden';

  const bar = document.createElement('div');
  bar.id = 'loading-bar';
  bar.style.width = '0%';
  bar.style.height = '100%';
  bar.style.background = '#30cfd0';
  bar.style.transition = 'width 0.2s ease-out';

  barContainer.appendChild(bar);
  overlay.appendChild(barContainer);

  return { overlay, text, bar };
}

// Wait until the DOM is ready before injecting the overlay and kicking off pre-loading
document.addEventListener('DOMContentLoaded', () => {
  const { overlay, text, bar } = createLoadingOverlay();
  document.body.appendChild(overlay);

  // Reference to the shared loading manager (DefaultLoadingManager is used by all loaders by default)
  const loadingManager = window.THREE.DefaultLoadingManager;

  // Track loading progress and update UI
  loadingManager.onStart = function (url, itemsLoaded, itemsTotal) {
    console.log(`Started loading: ${url} (${itemsLoaded}/${itemsTotal})`);
  };

  loadingManager.onProgress = function (url, itemsLoaded, itemsTotal) {
    const percent = Math.round((itemsLoaded / itemsTotal) * 100);
    text.textContent = `Loading ${percent}%`;
    bar.style.width = `${percent}%`;
  };

  loadingManager.onError = function (url) {
    console.warn(`There was an error loading ${url}`);
  };

  // Once everything is loaded we fade out the overlay and launch the game
  loadingManager.onLoad = async function () {
    console.log('All critical assets loaded. Initializing game…');
    text.textContent = 'Initializing…';
    bar.style.width = '100%';

    // Small delay to let the user see 100%
    setTimeout(async () => {
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.5s ease-out';
      setTimeout(() => overlay.remove(), 600);

      // Dynamically import the main game module now that assets are ready
      try {
        await import('js/main.js');
        console.timeEnd('init');
      } catch (err) {
        console.error('Failed to load main game module:', err);
      }
    }, 200);
  };

  // ---------------- Pre-load essential assets -----------------

  // NOTE: These are assets required for the first visible scene (ship trail, sun lens flares, skybox, etc.)
  const essentialTextures = [
    './assets/2k_stars_milky_way.jpg',
    'https://threejs.org/examples/textures/sprites/spark1.png',
    'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/lensflare/lensflare0.png',
    'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/lensflare/lensflare2.png',
    'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/lensflare/lensflare3.png'
  ];

  const textureLoader = new window.THREE.TextureLoader(loadingManager);
  essentialTextures.forEach((tex) => textureLoader.load(tex, () => {}));

  // Pre-load enemy model (not strictly visible at start but avoids hitch later)
  const gltfLoader = new window.THREE.GLTFLoader(loadingManager);
  gltfLoader.load('assets/enemy.glb', () => {
    console.log('Pre-loaded enemy.glb');
  });
});

// ---------------------------------------------------------------------------
