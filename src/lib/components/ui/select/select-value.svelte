<script lang="ts">
  let { class: className = "", children = null, placeholder = "" } = $props();
</script>

<span data-slot="select-value" class={className}>
  {#if children}
    {@render children?.()}
  {:else if placeholder}
    {placeholder}
  {/if}
</span>
