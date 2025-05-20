import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Base path for GitHub Pages deployment
  base: '/Asteroid-Miner/',
  
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
    
    // Customize asset chunking
    rollupOptions: {
      output: {
        // Configure chunk sizes for better loading times
        manualChunks: {
          'three': ['three'],
          'core': ['./js/core/messageBus.js', './js/core/difficultyManager.js'],
          'modules': ['./js/modules/renderer.js', './js/modules/game.js'],
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
      'three/addons/controls/OrbitControls.js',
      'three/addons/loaders/GLTFLoader.js',
      'three/addons/postprocessing/EffectComposer.js',
      'three/addons/postprocessing/RenderPass.js',
      'three/addons/postprocessing/UnrealBloomPass.js',
    ],
  },
}); 