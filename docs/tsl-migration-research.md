# TSL Post-Processing Migration Research

**Date:** 2026-02-05
**Target Version:** Three.js r180+ (WebGPU)
**Status:** Feasible

## 1. Feasibility Assessment

Migrating from GLSL `ShaderPass` to TSL (Three Shading Language) post-processing is **fully feasible** in Three.js r180. The architecture shifts from `EffectComposer` (WebGL) to the `PostProcessing` class (WebGPU), which uses a node-based approach.

### Key Findings
- **WebGPU Ready:** The project is already using `WebGPURenderer`, which is the primary requirement for TSL post-processing.
- **API Availability:**
  - `PostProcessing` class is exported from `three/webgpu` (or `three/renderers/common/PostProcessing.js`).
  - `pass()` function is available in `three/tsl` to create screen passes.
  - `Loop()` is available in `three/tsl` for porting complex iterative shaders (like God Rays).
- **Standard Effects:** Common effects like Bloom, FXAA, and Film Grain have TSL implementations in `three/addons/tsl/display/`.
- **Custom Shaders:** The God Ray and "Claude Ray" GLSL shaders can be ported to TSL `Fn` functions using `Loop` and texture sampling nodes.

## 2. Recommended Approach

We should migrate the entire post-processing stack to TSL rather than mixing systems, as `EffectComposer` is legacy for WebGPU contexts.

### Migration Steps
1.  **Replace Architecture:** Replace `PostProcessingManager`'s usage of `EffectComposer` with `PostProcessing`.
2.  **Port Standard Passes:**
    - `UnrealBloomPass` -> `BloomNode` (from `three/addons/tsl/display/BloomNode.js`)
    - `FXAAShader` -> `FXAANode`
    - `FilmShader` -> `FilmNode`
    - `VignetteShader` -> Custom TSL function (simple math) or `VignetteNode` if available.
3.  **Port Custom Shaders:** Rewrite `createVolumetricLightShader` (God Rays) using TSL.
4.  **Integration:** Wire the new `PostProcessing` instance into `Renderer`.

## 3. Code Examples

### A. PostProcessing Setup (TSL)

```typescript
import { PostProcessing } from 'three/webgpu';
import { pass, color, vec4 } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { fxaa } from 'three/addons/tsl/display/FXAANode.js';
import { film } from 'three/addons/tsl/display/FilmNode.js';

export class TSLPostProcessingManager {
    postProcessing: PostProcessing;
    
    constructor(renderer, scene, camera) {
        this.postProcessing = new PostProcessing(renderer);
        
        // 1. Scene Pass (Base Render)
        const scenePass = pass(scene, camera);
        
        // 2. Volumetric Lights (Custom TSL Function)
        const godRays = volumetricLight(scenePass, camera); // See section B
        
        // 3. Bloom
        const bloomEffect = bloom(scenePass, 0.2, 0.2, 0.95);
        
        // 4. Composition (Add effects together)
        // Note: Logic might vary based on node implementation (add vs blend)
        let output = scenePass.add(godRays).add(bloomEffect);
        
        // 5. Film Grain
        output = film(output, 0.08, 0.03, 0); // intensity, noise, grayscale
        
        // 6. FXAA (Anti-aliasing)
        output = fxaa(output);
        
        // Set Final Output
        this.postProcessing.outputNode = output;
    }
    
    render() {
        this.postProcessing.render();
    }
}
```

### B. God Rays (Volumetric Light) TSL Port

This is a conceptual port of the GLSL loop to TSL.

```typescript
import { Fn, texture, uv, vec2, float, Loop, uniform, vec3, mix } from 'three/tsl';

// Define uniforms
const density = uniform(0.6);
const weight = uniform(0.5);
const decay = uniform(0.94);
const exposure = uniform(0.4);
const lightPosition = uniform(vec2(0.5, 0.5));
const sunColor = uniform(vec3(1.0, 0.98, 0.94));

export const volumetricLight = Fn(([inputPass, camera]) => {
    const tex = texture(inputPass);
    const coord = uv();
    
    // Vector from pixel to light
    const deltaTextCoord = coord.sub(lightPosition);
    const textCoord = coord.toVar();
    
    // Scale delta by density/samples
    const samples = 100;
    deltaTextCoord.mulAssign(density.div(float(samples)));
    
    const illuminationDecay = float(1.0).toVar();
    const accumulatedColor = vec3(0.0).toVar();
    
    // Loop Node
    Loop(samples, ({ i }) => {
        // Move coordinate
        textCoord.subAssign(deltaTextCoord);
        
        // Sample texture
        const sampleColor = tex.uv(textCoord);
        
        // Accumulate
        sampleColor.mulAssign(illuminationDecay.mul(weight));
        accumulatedColor.addAssign(sampleColor.rgb);
        
        // Decay
        illuminationDecay.mulAssign(decay);
    });
    
    // Apply exposure and color
    const finalColor = accumulatedColor.mul(exposure).mul(sunColor);
    
    return vec4(finalColor, 1.0);
});
```

## 4. Risks and Blockers

- **Experimental API:** The `three/tsl` and `three/webgpu` APIs are stable but evolving. Node implementations in `three/addons/tsl` might change.
- **Performance:** We need to ensure the TSL `Loop` compiles to an efficient shader loop on WebGPU.
- **Complex Shader Logic:** The "God Ray" shader has complex logic (visibility factors, scattering, conditional exits). Porting this 1:1 requires careful TSL construction.
- **Missing Nodes:** If a specific effect (like `Vignette`) isn't pre-made, we have to write the math ourselves (low risk, just math).

## 5. Estimated Effort

- **Setup & Infrastructure:** 2 hours (Replacing `PostProcessingManager`)
- **Standard Effects Port:** 1 hour (Wiring up Bloom, FXAA, Film)
- **God Ray Port:** 4-6 hours (Iterative implementation and debugging of the TSL loop)
- **Testing & Tuning:** 2 hours

**Total Estimate:** ~1.5 Days

## Recommendation

Proceed with Phase 6 by creating a parallel `TSLPostProcessingManager` to incrementally implement the TSL stack while keeping the GLSL version as a fallback until feature parity is reached.
