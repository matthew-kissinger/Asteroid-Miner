// Import Three.js through Vite
import * as THREE from 'three';

// Import necessary Three.js addons manually
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { ColorCorrectionShader } from 'three/addons/shaders/ColorCorrectionShader.js';
import { FilmShader } from 'three/addons/shaders/FilmShader.js';
import { VignetteShader } from 'three/addons/shaders/VignetteShader.js';
import WebGL from 'three/addons/capabilities/WebGL.js';
// @ts-ignore
import { WebGPURenderer } from 'three/webgpu';

// Export everything
export {
  THREE,
  EffectComposer,
  RenderPass,
  UnrealBloomPass,
  ShaderPass,
  FXAAShader,
  ColorCorrectionShader,
  FilmShader,
  VignetteShader,
  WebGL,
  WebGPURenderer
};