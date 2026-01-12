<script lang="ts" generics="T">
  import type { Snippet } from 'svelte';
  import ChevronLeft from '@lucide/svelte/icons/chevron-left';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';

  let {
    data = [] as T[],
    columns,
    row,
    emptyMessage = 'No items found',
    currentPage = $bindable(1),
    rowsPerPage = $bindable(10),
  }: {
    data?: T[];
    columns: Snippet;
    row: Snippet<[T, number]>;
    emptyMessage?: string;
    currentPage?: number;
    rowsPerPage?: number;
  } = $props();

  let totalPages = $derived(Math.ceil(data.length / rowsPerPage));
  let paginatedData = $derived(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return data.slice(start, start + rowsPerPage);
  });
  
  let showingStart = $derived(Math.min((currentPage - 1) * rowsPerPage + 1, data.length));
  let showingEnd = $derived(Math.min(currentPage * rowsPerPage, data.length));
  
  // Reset to page 1 when data changes significantly
  $effect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      currentPage = 1;
    }
  });
</script>

<div class="table-wrapper">
  <div class="table-container">
    <table class="data-table">
      <thead>
        <tr>
          {@render columns()}
        </tr>
      </thead>
      <tbody>
        {#each paginatedData() as item, index}
          <tr>
            {@render row(item, index)}
          </tr>
        {:else}
          <tr>
            <td colspan="100" class="empty-state">{emptyMessage}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  
  <div class="table-footer">
    <div class="pagination-info">
      <span>Rows:</span>
      <select class="rows-select" bind:value={rowsPerPage}>
        <option value={10}>10</option>
        <option value={25}>25</option>
        <option value={50}>50</option>
        <option value={9999}>Show All</option>
      </select>
      <span class="showing">
        Showing {showingStart} - {showingEnd} of {data.length}
      </span>
    </div>
    
    <div class="pagination">
      <button
        class="pagination-btn"
        onclick={() => currentPage = Math.max(1, currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft size={16} />
      </button>
      
      {#each Array(Math.min(5, totalPages)) as _, i}
        {@const pageNum = i + 1}
        <button
          class="pagination-btn"
          class:active={currentPage === pageNum}
          onclick={() => currentPage = pageNum}
        >
          {pageNum}
        </button>
      {/each}
      
      <button
        class="pagination-btn"
        onclick={() => currentPage = Math.min(totalPages, currentPage + 1)}
        disabled={currentPage === totalPages || totalPages === 0}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  </div>
</div>

<style>
  .table-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }
  
  .table-container { flex: 1; overflow: auto; }
  
  .data-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  
  .data-table :global(th) {
    text-align: left;
    padding: 12px 16px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--muted-foreground, #71717a);
    border-bottom: 1px solid var(--sidebar-border, rgba(82, 82, 91, 0.4));
    background: var(--sidebar, #0a0a0c);
    position: sticky;
    top: 0;
    z-index: 10;
  }
  
  .data-table :global(td) {
    padding: 14px 16px;
    font-size: 14px;
    color: var(--foreground, #fafafa);
    border-bottom: 1px solid var(--sidebar-border, rgba(82, 82, 91, 0.4));
    vertical-align: middle;
  }
  
  .data-table :global(tbody tr:hover) { background: #18181b; }
  
  .empty-state {
    text-align: center;
    color: var(--muted-foreground, #71717a);
    padding: 48px 16px !important;
  }
  
  .table-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: var(--sidebar, #0a0a0c);
    border-top: 1px solid var(--sidebar-border, rgba(82, 82, 91, 0.4));
    flex-shrink: 0;
  }
  
  .pagination-info {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--muted-foreground, #a1a1aa);
  }
  
  .rows-select {
    background: #18181b;
    border: 1px solid var(--sidebar-border, rgba(82, 82, 91, 0.4));
    border-radius: 6px;
    padding: 4px 8px;
    color: var(--foreground, #fafafa);
    font-size: 13px;
    font-family: inherit;
  }
  
  .showing { margin-left: 8px; }
  
  .pagination { display: flex; align-items: center; gap: 4px; }
  
  .pagination-btn {
    min-width: 32px;
    height: 32px;
    padding: 0 8px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    color: var(--muted-foreground, #a1a1aa);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.15s;
    font-family: inherit;
  }
  .pagination-btn:hover:not(:disabled) { background: #27272a; color: var(--foreground, #fafafa); }
  .pagination-btn.active { background: var(--sidebar-accent, rgba(129, 140, 248, 0.15)); color: var(--primary, #a78bfa); }
  .pagination-btn:disabled { opacity: 0.3; cursor: not-allowed; }
</style>
