import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      // Pin runtime to Vercel-supported LTS to avoid local Node 24 builds failing
      runtime: 'nodejs22.x'
    }),
    // Inline CSS under 5KB for faster initial render
    inlineStyleThreshold: 5000
  }
};

export default config;
