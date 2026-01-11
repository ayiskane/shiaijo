<script lang="ts">
  let { class: className = "", children } = $props();
</script>

<span class={className}>
  {@render children?.()}
</span>
