// Import all Three.js modules from our centralized import file
import * as ThreeImports from './three-imports.ts';

// Make THREE extensible before adding properties
// @ts-ignore - We are intentionally extending THREE on window
window.THREE = Object.assign({}, ThreeImports.THREE);

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
  resolveImport(path: string) {
    // This will be used to help resolve imports in the original code
    return path;
  }
};

// @ts-ignore - js/modules might not be typed yet
import { getGlobalPoolRegistry } from '../js/modules/pooling/PoolRegistry.js';

// Initialize the global object pool early via PoolRegistry facade
window.objectPool = (() => {
  const registry = getGlobalPoolRegistry();
  return {
    createPool: function(type: string, factory: () => any, initialSize = 10, maxSize = 100) {
      registry.register(type, { factory, reset: (_o: any)=>{}, preallocate: initialSize, maxSize });
    },
    get: function(type: string, ...args: any[]) {
      try { return registry.get(type, ...args); } catch (e: any) { console.warn(e.message); return null; }
    },
    release: function(type: string, obj: any) { registry.release(type, obj); },
    clearAllPools: function() { registry.clearAll(); },
    clearPool: function(type: string) { registry.clear(type); }
  };
})();

// ---------------- Asynchronous Asset Loading & Progress UI -----------------

interface LoadingOverlay {
  overlay: HTMLDivElement;
  text: HTMLDivElement;
  bar: HTMLDivElement;
}

// Create and inject a basic loading overlay that will display progress to the user
function createLoadingOverlay(): LoadingOverlay {
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
  loadingManager.onStart = function (_url: string, _itemsLoaded: number, _itemsTotal: number) {
  };

  loadingManager.onProgress = function (_url: string, itemsLoaded: number, itemsTotal: number) {
    const percent = Math.round((itemsLoaded / itemsTotal) * 100);
    text.textContent = `Loading ${percent}%`;
    bar.style.width = `${percent}%`;
  };

  loadingManager.onError = function (_url: string) {
  };

  // Once everything is loaded we fade out the overlay and launch the game
  loadingManager.onLoad = async function () {
    text.textContent = 'Initializing…';
    bar.style.width = '100%';

    // Small delay to let the user see 100%
    setTimeout(async () => {
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.5s ease-out';
      setTimeout(() => overlay.remove(), 600);

      // Dynamically import the main game module now that assets are ready
      try {
        // @ts-ignore
        await import('js/main.ts');
      } catch (err) {
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
  });
});

// ---------------------------------------------------------------------------