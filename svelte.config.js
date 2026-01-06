import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    // Inline CSS under 5KB for faster initial render (reduces HTTP requests)
    inlineStyleThreshold: 5000,
    prerender: {
      // Handle missing assets gracefully during prerendering
      handleHttpError: ({ path, referrer, message }) => {
        // Ignore FontAwesome 404s (FA folder may not exist in all environments)
        if (path.startsWith('/FA/')) {
          console.warn(`Ignoring missing FontAwesome asset: ${path}`);
          return;
        }
        // Throw for all other errors
        throw new Error(message);
      }
    }
  }
};

export default config;
