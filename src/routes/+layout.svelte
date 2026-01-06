<script lang="ts">
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import { setupConvex } from 'convex-svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	
	// Setup Convex with the deployment URL
	const CONVEX_URL = import.meta.env.PUBLIC_CONVEX_URL || 'https://rare-panther-467.convex.cloud';
	setupConvex(CONVEX_URL);

	let { children } = $props();
</script>

<ModeWatcher defaultMode="dark" />
<Toaster richColors position="top-center" />

<svelte:head>
	<link rel="stylesheet" href="/FA/css/all.css" />
	<!-- Preload critical fonts for faster rendering -->
	<link
		rel="preload"
		href="/fonts/TitilliumWeb-Regular.woff2"
		as="font"
		type="font/woff2"
		crossorigin
	/>
	<link
		rel="preload"
		href="/fonts/TitilliumWeb-SemiBold.woff2"
		as="font"
		type="font/woff2"
		crossorigin
	/>
	<link
		rel="preload"
		href="/fonts/TitilliumWeb-Bold.woff2"
		as="font"
		type="font/woff2"
		crossorigin
	/>
</svelte:head>
{@render children()}

