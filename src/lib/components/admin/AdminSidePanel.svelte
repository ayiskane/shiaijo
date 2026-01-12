<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import Plus from '@lucide/svelte/icons/plus';
  import Pencil from '@lucide/svelte/icons/pencil';
  import Trash2 from '@lucide/svelte/icons/trash-2';

  type PanelItem = {
    id: string | null;
    name: string;
    subtitle?: string;
    count: number;
    icon?: string;
  };

  let {
    title = 'Items',
    items = [] as PanelItem[],
    selectedId = null as string | null,
    editMode = false,
    allItemsLabel = 'All Items',
    allItemsIcon = '📋',
    totalCount = 0,
    onSelect = (id: string | null) => {},
    onAdd = () => {},
    onEdit = (item: PanelItem) => {},
    onDelete = (item: PanelItem) => {},
    onToggleEdit = () => {},
  }: {
    title?: string;
    items?: PanelItem[];
    selectedId?: string | null;
    editMode?: boolean;
    allItemsLabel?: string;
    allItemsIcon?: string;
    totalCount?: number;
    onSelect?: (id: string | null) => void;
    onAdd?: () => void;
    onEdit?: (item: PanelItem) => void;
    onDelete?: (item: PanelItem) => void;
    onToggleEdit?: () => void;
  } = $props();
</script>

<aside class="panel" class:editing={editMode}>
  <div class="panel-header">
    <div class="panel-header-top">
      {#if editMode}
        <span class="panel-title editing">✎ Editing</span>
      {:else}
        <span class="panel-title">{title}</span>
      {/if}
      <div class="panel-actions">
        {#if editMode}
          <Button variant="default" size="sm" onclick={onToggleEdit}>Done</Button>
        {:else}
          <Button variant="ghost" size="sm" onclick={onToggleEdit}>Edit</Button>
          <Button variant="ghost" size="sm" onclick={onAdd}><Plus size={14} /></Button>
        {/if}
      </div>
    </div>
  </div>
  
  <div class="panel-list">
    <!-- All Items option -->
    <button
      class="panel-card"
      class:selected={selectedId === null}
      onclick={() => { if (!editMode) onSelect(null); }}
      disabled={editMode}
    >
      <div class="panel-icon"><span class="panel-emoji">{allItemsIcon}</span></div>
      <div class="panel-info"><span class="panel-name">{allItemsLabel}</span></div>
      <span class="panel-count">{totalCount}</span>
    </button>
    
    <!-- Individual items -->
    {#each items as item}
      <div
        class="panel-card"
        class:selected={selectedId === item.id}
        class:editing={editMode}
        onclick={() => { if (!editMode) onSelect(item.id); }}
        role="button"
        tabindex="0"
      >
        <div class="panel-icon"><span class="panel-emoji">{item.icon || '📁'}</span></div>
        <div class="panel-info">
          <span class="panel-name">{item.name}</span>
          {#if item.subtitle}<span class="panel-subtitle">{item.subtitle}</span>{/if}
        </div>
        {#if editMode}
          <div class="panel-card-actions">
            <button class="panel-action-btn" onclick={(e) => { e.stopPropagation(); onEdit(item); }}>
              <Pencil size={12} />
            </button>
            <button class="panel-action-btn danger" onclick={(e) => { e.stopPropagation(); onDelete(item); }}>
              <Trash2 size={12} />
            </button>
          </div>
        {:else}
          <span class="panel-count">{item.count}</span>
        {/if}
      </div>
    {/each}
  </div>
</aside>

<style>
  .panel {
    width: 260px;
    background: var(--sidebar, #0a0a0c);
    border-right: 1px solid var(--sidebar-border, rgba(82, 82, 91, 0.4));
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    overflow: hidden;
    transition: background 0.2s;
  }
  .panel.editing { background: #0c0c0e; }
  
  .panel-header {
    padding: 12px;
    border-bottom: 1px solid var(--sidebar-border, rgba(82, 82, 91, 0.4));
    flex-shrink: 0;
  }
  .panel-header-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .panel-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--muted-foreground, #a1a1aa);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .panel-title.editing { color: var(--primary, #818cf8); }
  .panel-actions { display: flex; align-items: center; gap: 4px; }
  
  .panel-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  .panel-card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s;
    text-align: left;
    width: 100%;
    font: inherit;
    color: inherit;
  }
  .panel-card:hover:not(:disabled) { background: #18181b; }
  .panel-card.selected {
    background: var(--sidebar-accent, rgba(129, 140, 248, 0.15));
    border-color: rgba(129, 140, 248, 0.4);
  }
  .panel-card.editing { border: 1px dashed rgba(129, 140, 248, 0.4); cursor: default; }
  .panel-card:disabled { opacity: 0.5; cursor: not-allowed; }
  
  .panel-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: var(--sidebar-accent, rgba(129, 140, 248, 0.15));
  }
  .panel-emoji { font-size: 16px; }
  
  .panel-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .panel-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--foreground, #fafafa);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .panel-subtitle { font-size: 11px; color: var(--muted-foreground, #71717a); }
  
  .panel-count {
    min-width: 28px;
    height: 24px;
    padding: 0 8px;
    background: var(--sidebar-accent, rgba(129, 140, 248, 0.15));
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
    color: var(--primary, #a78bfa);
    flex-shrink: 0;
  }
  
  .panel-card-actions { display: flex; align-items: center; gap: 4px; }
  .panel-action-btn {
    width: 26px;
    height: 26px;
    border-radius: 6px;
    background: rgba(82, 82, 91, 0.2);
    border: none;
    color: var(--muted-foreground, #a1a1aa);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }
  .panel-action-btn:hover { background: rgba(82, 82, 91, 0.3); color: var(--foreground, #fafafa); }
  .panel-action-btn.danger:hover { background: rgba(248, 113, 113, 0.15); color: #f87171; }
  
  @media (max-width: 768px) { .panel { display: none; } }
</style>
