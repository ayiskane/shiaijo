import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: ['convex-svelte', 'convex', 'mode-watcher', 'svelte-sonner'],
    exclude: ['@sveltejs/kit']
  },
  
  // Build optimizations
  build: {
    // Target modern browsers for smaller bundles
    target: 'es2022',
    // Minimize output
    minify: 'esbuild',
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          'convex': ['convex', 'convex-svelte'],
        }
      }
    }
  },
  
  // Dev server optimizations
  server: {
    // Warm up files for faster HMR
    warmup: {
      clientFiles: ['./src/routes/**/*.svelte']
    }
  }
});
