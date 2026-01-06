import type { Handle } from '@sveltejs/kit';

/**
 * Server hook to enable font preloading in SvelteKit
 * By default, SvelteKit only preloads js and css files.
 * Adding 'font' to the preload filter ensures woff2 fonts are preloaded
 * via Link: rel=preload headers, reducing FOIT/FOUT.
 */
export const handle: Handle = async ({ event, resolve }) => {
	return resolve(event, {
		preload: ({ type }) => {
			// Preload fonts, js, and css for optimal loading
			return type === 'font' || type === 'js' || type === 'css';
		}
	});
};
