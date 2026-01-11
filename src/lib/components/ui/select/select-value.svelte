<script lang="ts">
  let { class: className = "", children } = $props();
</script>

<span data-slot="select-value" class={className}>
  {@render children?.()}
</span>
