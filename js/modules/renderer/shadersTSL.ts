// shadersTSL.ts - TSL implementations of custom shaders for WebGPU
import * as THREE from 'three';
import { 
    Fn, texture, uv, vec4, float, Loop, 
    uniform, mix, pow, normalize, length, max, min, step
} from 'three/tsl';

/**
 * TSL implementation of the Volumetric Light (God Ray) shader
 */
export const volumetricLight = Fn(([inputPass, params_input]: [any, any]) => {
    // Cast input params to specific types or use defaults
    const tDiffuse = inputPass;
    const p = params_input || {};
    
    // Define uniforms with defaults matching the GLSL version
    const lightPosition = p.lightPosition || uniform(new THREE.Vector2(0.5, 0.5));
    const intensity = p.intensity || uniform(0.45);
    const decay = p.decay || uniform(0.94);
    const density = p.density || uniform(0.6);
    const weight = p.weight || uniform(0.5);
    const samples = p.samples || uniform(100); 
    const sunColor = p.sunColor || uniform(new THREE.Color(0xFFFAF0));
    const sunDistance = p.sunDistance || uniform(0.5);
    const sunVisibility = p.sunVisibility || uniform(1.0);
    const scattering = p.scattering || uniform(0.4);
    const attenuationMultiplier = p.attenuationMultiplier || uniform(3.5);

    const vUv = uv();
    
    // Get the texture color (original scene)
    const sceneColor = texture(tDiffuse, vUv);
    
    // Calculate ray direction from pixel to light source
    const rayVector = vUv.sub(lightPosition);
    const rayLength = length(rayVector);
    const rayDirection = normalize(rayVector);
    
    // Angle factor (rays stronger when looking near sun)
    const angleFactor = float(1.0).sub(rayLength).pow(0.8);
    
    // Calculate ray sampling parameters
    const sampleStep = rayDirection.negate().mul(min(density, 1.0).div(float(samples)));
    
    const rayProgress = max(0.0, float(1.0).sub(rayLength.mul(2.0)));
    
    const samplePosition = vUv.sub(sampleStep.mul(rayProgress).mul(10.0)).toVar();
    
    // Start with current scene color
    const finalColor = vec4(sceneColor).toVar();
    
    // Calculate scattering factor based on distance and angle
    const scatterFactor = scattering.mul(angleFactor).mul(float(1.0).sub(sunDistance.mul(0.5)));
    
    // MAX_SAMPLES constant for the loop
    const MAX_SAMPLES = 150;
    
    // Sample the light path
    Loop(MAX_SAMPLES, ({ i }: { i: any }) => {
        // We use 'samples' uniform. converting to float.
        const shouldSample = step(float(i), float(samples).sub(0.5));
        
        // Move along the ray
        samplePosition.addAssign(sampleStep);
        
        // Sample at the current position
        const sampledColor = texture(tDiffuse, samplePosition);
        
        // illuminationDecay logic inlined:
        const progress = float(i).div(float(samples));
        const baseFalloff = pow(decay, progress.mul(100.0));
        const distAtten = max(0.0, float(1.0).sub(sunDistance.mul(sunDistance).mul(attenuationMultiplier)));
        const decayFactor = baseFalloff.mul(distAtten).mul(sunVisibility);
        
        // Create the ray sample with attenuation
        const raySample = sampledColor.mul(decayFactor).mul(weight).mul(shouldSample).toVar();
        
        // Apply sun color to the ray (tinted by scene color)
        raySample.rgb.mulAssign(mix(sunColor, sampledColor.rgb, 0.3));
        
        // Apply scattering effect
        const scatterAmount = step(float(i), float(samples).div(3.0).sub(0.5));
        
        const scatterFade = float(1.0).sub(float(i).div(max(float(samples).div(3.0), 1.0)));
        const scatterTerm = sunColor.mul(scatterFactor).mul(decayFactor).mul(0.2).mul(scatterFade).mul(scatterAmount).mul(shouldSample);
        
        raySample.rgb.addAssign(scatterTerm);
        
        // Add to accumulated color
        finalColor.addAssign(raySample);
    });
    
    // Apply master intensity factor
    finalColor.mulAssign(mix(1.0, intensity, sunVisibility));
    
    // Preserve original scene color with a blend factor
    const blendFactor = min(0.95, intensity.mul(sunVisibility));
    const result = mix(sceneColor, finalColor, blendFactor);
    
    // Handle the early exit condition from GLSL: if (rayLength > 1.0)
    const isRayTooLong = rayLength.greaterThan(1.0);
    
    return mix(result, sceneColor, isRayTooLong);
});

/**
 * TSL implementation of the Claude Rays shader
 */
export const claudeRays = Fn(([inputPass, params_input]: [any, any]) => {
    const tDiffuse = inputPass;
    const p = params_input || {};
    
    const lightPosition = p.lightPosition || uniform(new THREE.Vector2(0.5, 0.5));
    const exposure = p.exposure || uniform(0.4);
    const decay = p.decay || uniform(0.93);
    const density = p.density || uniform(0.8);
    const weight = p.weight || uniform(0.25);
    const lightColor = p.lightColor || uniform(new THREE.Color(0xFFFAF0));
    
    const vUv = uv();
    const sceneColor = texture(tDiffuse, vUv);
    
    const texCoord = vUv.toVar();
    
    const NUM_SAMPLES = 24;
    
    const deltaTextCoord = texCoord.sub(lightPosition).mul(density).div(float(NUM_SAMPLES));
    
    const illuminationDecay = float(1.0).toVar();
    const finalColor = vec4(sceneColor).toVar();
    
    Loop(NUM_SAMPLES, () => {
        // Move along the ray
        texCoord.subAssign(deltaTextCoord);
        
        // Sample at the current position
        const sampleColor = texture(tDiffuse, texCoord).toVar();
        
        // Apply decay and weight
        sampleColor.mulAssign(illuminationDecay.mul(weight));
        
        // Apply light color
        sampleColor.rgb.mulAssign(lightColor);
        
        // Add to the final color
        finalColor.addAssign(sampleColor);
        
        // Reduce illumination for the next sample
        illuminationDecay.mulAssign(decay);
    });
    
    // Apply exposure
    finalColor.mulAssign(exposure);
    
    return finalColor;
});