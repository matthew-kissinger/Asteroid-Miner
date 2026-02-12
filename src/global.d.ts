import * as THREE_NAMESPACE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import WebGL from 'three/addons/capabilities/WebGL.js';

declare module 'three/webgpu' {
  import * as THREE from 'three';

  export interface WebGPURendererParameters extends THREE.WebGLRendererParameters {}

  export class WebGPURenderer extends THREE.WebGLRenderer {
    constructor(parameters?: WebGPURendererParameters);
    init(): Promise<void>;
  }
}

type PerfMetrics = {
  enabled: boolean;
  fps: number;
  simMs: number;
  renderMs: number;
  drawCalls: number;
  visibleInstances: number;
  pools: { hits: number; misses: number };
  gc: number;
  systems: Record<string, number>;
};

declare global {
  interface Window {
    THREE: typeof THREE_NAMESPACE & {
      EffectComposer: typeof EffectComposer;
      RenderPass: typeof RenderPass;
      UnrealBloomPass: typeof UnrealBloomPass;
      ShaderPass: typeof ShaderPass;
      FXAAShader: any;
      ColorCorrectionShader: any;
      FilmShader: any;
      VignetteShader: any;
      WebGL: typeof WebGL;
      DefaultLoadingManager: THREE_NAMESPACE.LoadingManager;
      TextureLoader: typeof THREE_NAMESPACE.TextureLoader;
      GLTFLoader?: any;
    };
    __vite_compat: {
      resolveImport: (path: string) => string;
    };
    __perf?: PerfMetrics;
    __perfOverlay?: unknown;
    MemoryStats?: {
      update: () => void;
      logReport: () => void;
      getReport: () => unknown;
    };
    setFPSLimit?: (limit: number) => string;
    togglePerf?: () => string;
    playIntro?: () => string;
    toggleDebug?: () => string;
    gameState?: () => {
      isGameOver?: boolean;
      isDocked?: boolean;
      introActive?: boolean;
      hordeActive?: boolean;
      fps?: number;
      gameTime?: number;
      difficulty?: number;
    };
    startHorde?: () => string;
    memStats?: () => unknown;
    poolStats?: (poolName?: string) => unknown;
    entityCount?: () => unknown;
    objectPool: {
      registry?: {
        get: (type: string, ...args: unknown[]) => unknown;
        register: (type: string, config: { factory: () => unknown; reset?: (obj: unknown) => void; preallocate?: number; maxSize?: number }) => void;
        release: (type: string, obj: unknown) => void;
        clearAll?: () => void;
        typeToPool?: Map<string, { objects: unknown[]; maxSize: number }>;
        statsData?: { hits: number; misses: number };
      };
      createPool: (type: string, factory: () => unknown, initialSize?: number, maxSize?: number) => void;
      get: (type: string, ...args: unknown[]) => unknown;
      getStats?: (type: string) => { available: number; maxSize: number; hits: number; misses: number } | null;
      release: (type: string, obj: unknown) => void;
      clearAllPools: () => void;
      clearPool?: (type: string) => void;
    };
    vectorPool?: {
      pool: THREE_NAMESPACE.Vector3[];
      maxSize: number;
      get: (x?: number, y?: number, z?: number) => THREE_NAMESPACE.Vector3;
      release: (vector: THREE_NAMESPACE.Vector3) => void;
    };
    game: any;
    mainMessageBus: any;
    inputIntent?: number;
    DEBUG_MODE?: boolean;
  }
}

export {};
