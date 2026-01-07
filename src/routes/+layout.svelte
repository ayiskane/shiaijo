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

{@render children()}
