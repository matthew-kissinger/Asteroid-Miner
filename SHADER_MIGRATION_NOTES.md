# TSL Post-Processing Feasibility Study

## Findings (2026-02-04)

### Research Context
Task: Convert 2 GLSL post-processing shaders (volumetric light + Claude rays) to TSL

### Key Constraints
1. **ShaderPass Architecture**: Three.js ShaderPass expects raw GLSL/WGSL strings, not TSL nodes
   - ShaderPass is the standard for post-processing in r180
   - It does NOT accept TSL nodes as input

2. **TSL Scope**: TSL is designed for material shaders, not screen-space effects
   - TSL material nodes work on Mesh materials (MeshBasicNodeMaterial, MeshStandardNodeMaterial, etc.)
   - Post-processing in TSL requires a different pipeline (TSL post-processing functions or NodePostProcessing)

3. **Experimental API**: NodePostProcessing is experimental/undocumented in r180
   - Three.js forum discussion mentions webgpu_backdrop_water example
   - Requires using `pass(scene, camera)` with TSL functions, not ShaderPass
   - API not yet stable or officially documented

### Architecture Gap
**Current setup** (EffectComposer + ShaderPass + GLSL):
```
EffectComposer → RenderPass → ShaderPass(GLSL) → ShaderPass(GLSL)
```

**Would require** (TSL post-processing):
```
PostProcessingPipeline → TSL functions (bloom, blur, custom pass) → output
```

This is NOT a drop-in replacement. Requires rewriting PostProcessingManager.

### Decision
**KEEP GLSL ShaderPass for now.**
- GLSL shaders are performant and stable
- They produce desired visual effect
- Conversion would introduce visual regression during refactor
- Better to migrate when NodePostProcessing stabilizes (Phase 4+)

### Path Forward (Phase 4)
1. Wait for NodePostProcessing API stabilization
2. Research official examples of custom TSL post-processing passes
3. Plan PostProcessingManager refactor to use TSL functions
4. Convert volumetric light logic to TSL node-based functions
5. Test visual parity with GLSL versions

### Related Files
- `js/modules/renderer/shaders.ts` - Contains TODO (Phase 4) comment
- `js/modules/renderer/post.ts` - PostProcessingManager (target for Phase 4 refactor)

### Commit
- 4840520: Added TODO comment to shaders.ts explaining constraints
- Typecheck: 0 errors (verified with `npx tsc --noEmit`)
- Build: succeeds (verified with `npm run build`, 1,111 kB main chunk)
