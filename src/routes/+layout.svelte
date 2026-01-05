<script lang="ts">
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';

	let { children } = $props();
</script>

<ModeWatcher defaultMode="dark" />

<svelte:head>
	<link rel="stylesheet" href="/FA/css/all.css" />
	<link
		rel="preload"
		href="/fonts/shiaijo-jp.ttf"
		as="font"
		type="font/ttf"
		crossorigin
	/>
</svelte:head>
{@render children()}
