import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Base path for GitHub Pages deployment
  base: '/Asteroid-Miner/',
  
  // Test configuration
  test: {
    globals: true,
    environment: 'node',
  },
  
  // Development server settings
  server: {
    port: 3000,
    open: true,
    cors: true,
  },
  
  // Build settings
  build: {
    // Output directory for production build
    outDir: 'dist',

    // Enable minification - now safe after fixing constructor.name usage
    minify: true,
    
    // Customize asset chunking
    rollupOptions: {
      output: {
        // Configure chunk sizes for better loading times
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Let the existing 'three' chunk handle this for three.js specifically
            if (id.includes('three')) {
              return 'three';
            }
            return 'vendor'; // Catch-all for other node_modules
          }
          // Group all modules directly under js/main/ into a 'game-core' chunk
          if (id.includes('/js/main/')) {
            return 'game-core';
          }
          // Group all modules directly under js/ecs/systems/ into an 'ecs-systems' chunk
          if (id.includes('/js/ecs/systems/')) {
              return 'ecs-systems';
          }
        },
      },
    },
    
    // Enable source maps for debugging production builds
    sourcemap: true,
    
    // Configure asset handling
    assetsInlineLimit: 4096, // 4kb - files smaller than this will be inlined
  },
  
  // Treat these directories as public assets (no processing, just copy)
  publicDir: 'public',
  
  // Alias configuration for cleaner imports
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      'js': resolve(__dirname, 'js'),
      'assets': resolve(__dirname, 'assets'),
      'sounds': resolve(__dirname, 'sounds'),
      'css': resolve(__dirname, 'css'),
    },
  },
  
  // Configure for optimized development
  optimizeDeps: {
    include: [
      'three',
      'three/addons/postprocessing/EffectComposer.js',
      'three/addons/postprocessing/RenderPass.js',
      'three/addons/postprocessing/UnrealBloomPass.js',
    ],
  },
}); 