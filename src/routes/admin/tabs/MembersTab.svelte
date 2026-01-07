<script lang="ts">
  import { onMount } from 'svelte';
  import autoAnimate from '@formkit/auto-animate';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { cn } from '$lib/utils';
  import { Check, Plus, UserPlus, X, ChevronDown, Trash2, Pencil, Users, Search, Filter } from '@lucide/svelte';

  export let members: any[] = [];
  export let groups: any[] = [];
  export let participants: any[] = [];
  export let selectedTournament: any = null;
  export let filteredMembers: any[] = [];
  export let searchQuery = '';
  export let filterGroup = 'all';
  export let registrationFilter: 'all' | 'registered' | 'unregistered' = 'all';
  export let registeredMemberIds: Set<string> = new Set();
  export let selectedMemberIds: Set<string> = new Set();
  export let allFilteredSelected = false;
  export let onSearchChange: (v: string) => void;
  export let onFilterGroupChange: (v: string) => void;
  export let onRegistrationFilterChange: (v: 'all' | 'registered' | 'unregistered') => void;
  export let onResetFilters: () => void;
  export let onOpenAddMember: () => void;
  export let onOpenImportCSV: () => void;
  export let onOpenMassAdd: () => void;
  export let onOpenMassEdit: () => void;
  export let onAddAllParticipants: () => void;
  export let onClearAllParticipants: () => void;
  export let onRegisterSelectedMembers: () => void;
  export let onRegisterGroupMembers: (groupId: string) => void;
  export let onToggleMemberSelection: (id: string) => void;
  export let onClearSelection: () => void;
  export let onToggleMemberRegistration: (id: string) => void;
  export let onOpenEditMember: (member: any) => void;
  export let onDeleteMember: (id: string) => void;
  export let getGroupName: (groupId: string) => string;
  export let resetMassMembers: () => void;

  let listContainer: HTMLElement;
  $: listContainer && autoAnimate(listContainer);

  // Get initials from name
  function getInitials(firstName: string, lastName: string): string {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  }

  onMount(() => {
    console.debug('[admin] MembersTab mounted', {
      membersCount: members.length,
      groupsCount: groups.length,
      filteredCount: filteredMembers.length,
      selectedTournament: selectedTournament?._id ?? null,
    });
  });
</script>

<!-- Top Bar - Hybrid: Design 2 structure with Design 1 centered tabs -->
<div class="top-bar">
  <!-- Left: Breadcrumb + Title -->
  <div class="top-bar-left">
    <div class="top-bar-breadcrumb">Admin / Roster</div>
    <h1 class="top-bar-title">Member Management</h1>
  </div>
  
  <!-- Center: Filter Tabs -->
  <div class="top-bar-center">
    <div class="top-bar-tabs">
      <button 
        onclick={() => onRegistrationFilterChange('all')}
        class={cn("top-bar-tab", registrationFilter === 'all' && "active")}
      >
        All Members
      </button>
      {#if selectedTournament}
        <button 
          onclick={() => onRegistrationFilterChange('registered')}
          class={cn("top-bar-tab", registrationFilter === 'registered' && "active")}
        >
          Registered
        </button>
        <button 
          onclick={() => onRegistrationFilterChange('unregistered')}
          class={cn("top-bar-tab", registrationFilter === 'unregistered' && "active")}
        >
          Unregistered
        </button>
      {/if}
    </div>
  </div>
  
  <!-- Right Side: Search + Actions -->
  <div class="top-bar-right">
    <div class="top-bar-search">
      <Search class="h-3.5 w-3.5" />
      <input 
        type="text" 
        value={searchQuery}
        oninput={(e) => onSearchChange((e.target as HTMLInputElement).value)}
        placeholder="Search..."
      />
    </div>
    <button onclick={onOpenImportCSV} class="btn-sm ghost">Export</button>
    <button onclick={onOpenAddMember} class="btn-sm primary">+ Add Member</button>
  </div>
</div>

<!-- Stats Strip -->
<div class="stats-strip">
  <div class="stat-mini">
    <div class="stat-mini-icon indigo">👥</div>
    <div class="stat-mini-content">
      <div class="stat-mini-value">{members.length}</div>
      <div class="stat-mini-label">Total Members</div>
    </div>
  </div>
  <div class="stat-mini">
    <div class="stat-mini-icon success">✓</div>
    <div class="stat-mini-content">
      <div class="stat-mini-value">{participants.length}</div>
      <div class="stat-mini-label">Registered</div>
    </div>
  </div>
  <div class="stat-mini">
    <div class="stat-mini-icon warning">⏳</div>
    <div class="stat-mini-content">
      <div class="stat-mini-value">{members.length - participants.length}</div>
      <div class="stat-mini-label">Not Registered</div>
    </div>
  </div>
  <div class="stat-mini">
    <div class="stat-mini-icon fire">🔥</div>
    <div class="stat-mini-content">
      <div class="stat-mini-value">{filteredMembers.length}</div>
      <div class="stat-mini-label">Showing</div>
    </div>
  </div>
</div>

<!-- Quick Actions for Tournament -->
{#if selectedTournament}
  <div class="mb-5 p-4 rounded-xl" style="background: var(--surface); border: 1px solid var(--border-subtle);">
    <div class="flex flex-wrap items-center gap-3">
      <span class="text-xs font-medium" style="color: var(--text-muted);">Quick Actions:</span>
      <button onclick={onAddAllParticipants} class="btn-sm ghost">
        <UserPlus class="h-3.5 w-3.5" /> Register All
      </button>
      <button onclick={onClearAllParticipants} class="btn-sm ghost" style="color: var(--error);">
        <X class="h-3.5 w-3.5" /> Clear All
      </button>
      {#if selectedMemberIds.size > 0}
        <button onclick={onRegisterSelectedMembers} class="btn-sm primary">
          <Check class="h-3.5 w-3.5" /> Register {selectedMemberIds.size} Selected
        </button>
        <button onclick={onClearSelection} class="text-xs hover:underline" style="color: var(--text-muted);">Clear selection</button>
      {/if}
      <div class="ml-auto flex gap-2">
        <button onclick={onOpenMassEdit} class="btn-sm ghost">Bulk Edit</button>
        <button onclick={() => { resetMassMembers(); onOpenMassAdd(); }} class="btn-sm ghost">Bulk Add</button>
      </div>
    </div>
  </div>
{/if}

<!-- Group Registration Banner -->
{#if selectedTournament && filterGroup !== 'all'}
  {@const groupMemberCount = members.filter(m => m.groupId === filterGroup).length}
  {@const registeredInGroup = members.filter(m => m.groupId === filterGroup && registeredMemberIds.has(m._id)).length}
  <div class="mb-5 flex items-center justify-between p-4 rounded-xl" style="background: var(--indigo-glow); border: 1px solid rgba(59, 130, 246, 0.3);">
    <span class="text-sm font-medium">{registeredInGroup} of {groupMemberCount} registered in {getGroupName(filterGroup)}</span>
    {#if registeredInGroup < groupMemberCount}
      <button onclick={() => onRegisterGroupMembers(filterGroup)} class="btn-sm primary">
        Register Entire Group
      </button>
    {/if}
  </div>
{/if}

<!-- Data Table Card -->
<div class="table-card" bind:this={listContainer}>
  <!-- Table Header -->
  <div class="table-header">
    <h2 class="table-title">Member Directory</h2>
    <div class="table-actions">
      <!-- Group Filter -->
      <div class="relative">
        <select
          bind:value={filterGroup}
          onchange={(e) => onFilterGroupChange((e.target as HTMLSelectElement).value)}
          class={cn("filter-btn cursor-pointer appearance-none pr-8", filterGroup !== 'all' && "active")}
        >
          <option value="all">All Groups</option>
          {#each groups as g}<option value={g.groupId}>{g.name}</option>{/each}
        </select>
        <ChevronDown class="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" style="color: var(--text-muted);" />
      </div>
      
      {#if filterGroup !== 'all' || registrationFilter !== 'all' || searchQuery}
        <button onclick={onResetFilters} class="filter-btn">
          <X class="h-3 w-3" /> Clear
        </button>
      {/if}
    </div>
  </div>
  
  <!-- Table -->
  <div class="overflow-x-auto">
    <table class="data-table">
      <thead>
        <tr>
          {#if selectedTournament}
            <th style="width: 40px;">
              <input
                type="checkbox"
                checked={allFilteredSelected}
                onchange={() => {
                  if (allFilteredSelected) {
                    onClearSelection();
                  } else {
                    filteredMembers.forEach((m) => {
                      if (!selectedMemberIds.has(m._id)) onToggleMemberSelection(m._id);
                    });
                  }
                }}
                class="h-4 w-4 rounded"
                style="accent-color: var(--indigo-primary);"
              />
            </th>
          {/if}
          <th>Member</th>
          <th>Group</th>
          {#if selectedTournament}
            <th>Status</th>
          {/if}
          <th></th>
        </tr>
      </thead>
      <tbody>
        {#if filteredMembers.length === 0}
          <tr>
            <td colspan={selectedTournament ? 5 : 3} class="py-16 text-center" style="color: var(--text-muted);">
              <Users class="h-12 w-12 mx-auto mb-4 opacity-40" />
              <p class="text-base mb-3">No members found</p>
              {#if searchQuery || filterGroup !== 'all'}
                <button onclick={onResetFilters} class="text-sm hover:underline" style="color: var(--indigo-light);">Clear filters</button>
              {:else}
                <button onclick={onOpenAddMember} class="btn-sm primary mx-auto">Add your first member</button>
              {/if}
            </td>
          </tr>
        {:else}
          {#each filteredMembers as member (member._id)}
            {@const isRegistered = registeredMemberIds.has(member._id)}
            {@const isSelected = selectedMemberIds.has(member._id)}
            <tr class={cn(isRegistered && "bg-emerald-950/10")}>
              {#if selectedTournament}
                <td>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onchange={() => onToggleMemberSelection(member._id)}
                    class="h-4 w-4 rounded"
                    style="accent-color: var(--indigo-primary);"
                  />
                </td>
              {/if}
              <td>
                <div class="cell-member">
                  <div class="cell-avatar">{getInitials(member.firstName, member.lastName)}</div>
                  <div>
                    <div class="cell-name">{member.lastName}, {member.firstName}</div>
                  </div>
                </div>
              </td>
              <td>
                <span class="cell-badge" class:dan={getGroupName(member.groupId).includes('Dan')} class:kyu={getGroupName(member.groupId).includes('Kyu')}>
                  {getGroupName(member.groupId)}
                </span>
              </td>
              {#if selectedTournament}
                <td>
                  <button
                    onclick={() => onToggleMemberRegistration(member._id)}
                    class={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] font-semibold uppercase tracking-wide transition-all",
                    )}
                    style={isRegistered 
                      ? "background: rgba(74, 222, 128, 0.12); color: var(--success); border: 1px solid rgba(74, 222, 128, 0.4);" 
                      : "background: var(--muted); color: var(--text-muted); border: 1px solid var(--border-subtle);"}
                    title={isRegistered ? "Unregister from tournament" : "Register for tournament"}
                  >
                    {#if isRegistered}
                      <Check class="h-3 w-3" /> Registered
                    {:else}
                      <Plus class="h-3 w-3" /> Register
                    {/if}
                  </button>
                </td>
              {/if}
              <td>
                <div class="cell-actions">
                  <button
                    onclick={() => onOpenEditMember(member)}
                    class="action-btn"
                    aria-label="Edit member"
                  >
                    <Pencil class="h-3.5 w-3.5" />
                  </button>
                  <button
                    onclick={() => onDeleteMember(member._id)}
                    class="action-btn"
                    style="color: var(--error);"
                    aria-label="Delete member"
                  >
                    <Trash2 class="h-3.5 w-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
  
  <!-- Table Footer -->
  <div class="table-footer">
    <div class="table-info">Showing {filteredMembers.length} of {members.length} members</div>
    <div class="pagination">
      <!-- Pagination would go here if needed -->
    </div>
  </div>
</div>
