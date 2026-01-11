<script lang="ts">
	import { ToggleGroup as ToggleGroupPrimitive } from "bits-ui";
	import { getToggleGroupCtx } from "./toggle-group.svelte";
	import { cn } from "$lib/utils.js";
	import { type ToggleVariants, toggleVariants } from "$lib/components/ui/toggle/index.js";

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		size,
		variant,
		...restProps
	}: ToggleGroupPrimitive.ItemProps & ToggleVariants = $props();

	const ctx = getToggleGroupCtx();

	const mergedVariant = $derived(ctx?.variant ?? variant ?? "default");
	const mergedSize = $derived(ctx?.size ?? size ?? "default");
	const mergedSpacing = $derived(ctx?.spacing ?? 0);
</script>

<ToggleGroupPrimitive.Item
	bind:ref
	data-slot="toggle-group-item"
	data-variant={ctx?.variant ?? variant}
	data-size={ctx?.size ?? size}
	data-spacing={ctx?.spacing}
	class={cn(
		toggleVariants({
			variant: mergedVariant as ToggleVariants["variant"],
			size: mergedSize as ToggleVariants["size"],
		}),
		"w-auto min-w-0 shrink-0 px-3 focus:z-10 focus-visible:z-10 data-[spacing=0]:rounded-none data-[spacing=0]:shadow-none data-[spacing=0]:first:rounded-l-md data-[spacing=0]:last:rounded-r-md data-[spacing=0]:data-[variant=outline]:border-l-0 data-[spacing=0]:data-[variant=outline]:first:border-l",
		className
	)}
	{value}
	{...restProps}
/>
