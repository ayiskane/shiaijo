<script lang="ts">
  import { onMount } from 'svelte';
  import autoAnimate from '@formkit/auto-animate';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { cn } from '$lib/utils';
  import { Check, Plus, UserPlus, X, ChevronDown, Trash2, Pencil, Users } from '@lucide/svelte';

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

  onMount(() => {
    console.debug('[admin] MembersTab mounted', {
      membersCount: members.length,
      groupsCount: groups.length,
      filteredCount: filteredMembers.length,
      selectedTournament: selectedTournament?._id ?? null,
    });
  });
</script>

<!-- Sticky Search & Filter Bar -->
<div class="sticky top-0 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 bg-background/95 backdrop-blur-sm border-b border-border mb-4">
  <div class="flex items-center justify-between mb-3">
    <div>
      <h1 class="text-xl sm:text-2xl font-bold">Members</h1>
      <p class="text-sm text-muted-foreground">
        {filteredMembers.length} of {members.length}
        {#if selectedTournament}· {participants.length} registered{/if}
      </p>
    </div>
    <Button onclick={onOpenAddMember} variant="outline" size="sm" class="h-9 px-4">
      <Plus class="mr-2 h-4 w-4" /> Add
    </Button>
  </div>

  <div class="relative mb-3">
    <Input
      type="text"
      value={searchQuery}
      oninput={(e) => onSearchChange((e.target as HTMLInputElement).value)}
      placeholder="Search by name..."
      class="h-12 text-base pl-4 pr-10"
    />
    {#if searchQuery}
      <button
        onclick={() => onSearchChange('')}
        class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
      >
        <X class="h-5 w-5" />
      </button>
    {/if}
  </div>

  <div class="flex flex-wrap items-center gap-2">
    <div class="relative">
      <select
        bind:value={filterGroup}
        onchange={(e) => onFilterGroupChange((e.target as HTMLSelectElement).value)}
        class="h-10 appearance-none rounded-full border border-border bg-card pl-4 pr-10 text-sm font-medium cursor-pointer hover:bg-accent/50 transition-colors"
      >
        <option value="all">All Groups</option>
        {#each groups as g}<option value={g.groupId}>{g.name}</option>{/each}
      </select>
      <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
    </div>

    {#if selectedTournament}
      <div class="relative">
        <select
          bind:value={registrationFilter}
          onchange={(e) => onRegistrationFilterChange((e.target as HTMLSelectElement).value as any)}
          class="h-10 appearance-none rounded-full border border-border bg-card pl-4 pr-10 text-sm font-medium cursor-pointer hover:bg-accent/50 transition-colors"
        >
          <option value="all">All</option>
          <option value="registered">✓ Registered</option>
          <option value="unregistered">○ Not Registered</option>
        </select>
        <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>
    {/if}

    {#if filterGroup !== 'all' || registrationFilter !== 'all' || searchQuery}
      <button
        onclick={onResetFilters}
        class="h-10 px-4 rounded-full text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
      >
        Clear filters
      </button>
    {/if}

    <div class="ml-auto flex gap-2">
      <Button variant="ghost" size="sm" onclick={onOpenImportCSV} class="h-9 px-3 text-xs">CSV</Button>
      <Button variant="ghost" size="sm" onclick={onOpenMassEdit} class="h-9 px-3 text-xs">Edit</Button>
      <Button variant="ghost" size="sm" onclick={() => { resetMassMembers(); onOpenMassAdd(); }} class="h-9 px-3 text-xs">Bulk</Button>
    </div>
  </div>
</div>

{#if selectedTournament}
  <div class="mb-4 p-4 rounded-2xl border-2 border-border bg-card/50">
    <div class="flex flex-wrap items-center gap-3">
      <span class="text-sm font-medium text-muted-foreground">Quick:</span>
      <Button variant="outline" size="sm" onclick={onAddAllParticipants} class="h-10 px-4 rounded-xl">
        <UserPlus class="mr-2 h-4 w-4" /> Register All
      </Button>
      <Button variant="outline" size="sm" onclick={onClearAllParticipants} class="h-10 px-4 rounded-xl text-destructive hover:text-destructive">
        <X class="mr-2 h-4 w-4" /> Clear All
      </Button>
      {#if selectedMemberIds.size > 0}
        <Button onclick={onRegisterSelectedMembers} class="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700">
          <Check class="mr-2 h-4 w-4" /> Register {selectedMemberIds.size} Selected
        </Button>
        <button onclick={onClearSelection} class="text-sm text-muted-foreground hover:text-foreground">Clear</button>
      {/if}
    </div>
  </div>
{/if}

{#if selectedTournament && filterGroup !== 'all'}
  {@const groupMemberCount = members.filter(m => m.groupId === filterGroup).length}
  {@const registeredInGroup = members.filter(m => m.groupId === filterGroup && registeredMemberIds.has(m._id)).length}
  <div class="mb-4 flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/20">
    <span class="text-sm font-medium">{registeredInGroup} of {groupMemberCount} registered</span>
    {#if registeredInGroup < groupMemberCount}
      <Button variant="default" size="sm" onclick={() => onRegisterGroupMembers(filterGroup)} class="h-10 px-4 rounded-xl">
        Register Entire Group
      </Button>
    {/if}
  </div>
{/if}

<div class="rounded-2xl border border-border bg-card/80 backdrop-blur-sm shadow-lg shadow-[rgba(0,0,0,0.35)] members-compact overflow-hidden" bind:this={listContainer}>
  <div class="overflow-x-auto">
    <table class="min-w-full text-sm">
      <thead class="bg-card/60 text-muted-foreground uppercase tracking-[0.08em] text-[11px]">
        <tr class="border-b border-border/60">
          {#if selectedTournament}
            <th class="w-12 px-4 py-3 text-left">
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
                class="h-4 w-4 rounded border-2 border-muted-foreground"
              />
            </th>
          {/if}
          <th class="px-5 py-3 text-left">Member</th>
          <th class="px-5 py-3 text-left">Group</th>
          {#if selectedTournament}
            <th class="px-5 py-3 text-left">Status</th>
          {/if}
          <th class="px-5 py-3 text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        {#if filteredMembers.length === 0}
          <tr>
            <td colspan={selectedTournament ? 5 : 3} class="py-12 text-center text-muted-foreground">
              <Users class="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p class="text-base mb-2">No members found</p>
              {#if searchQuery || filterGroup !== 'all'}
                <button onclick={onResetFilters} class="text-primary hover:underline text-sm">Clear filters</button>
              {:else}
                <Button onclick={onOpenAddMember} variant="outline" class="mt-2">Add your first member</Button>
              {/if}
            </td>
          </tr>
        {:else}
          {#each filteredMembers as member (member._id)}
            {@const isRegistered = registeredMemberIds.has(member._id)}
            {@const isSelected = selectedMemberIds.has(member._id)}
            <tr class={cn(
              "border-b border-steel/40 transition-colors hover:bg-accent/5",
              isRegistered && "bg-emerald-950/10"
            )} style="--steel: #3d4148;">
              {#if selectedTournament}
                <td class="px-5 py-3 align-middle">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onchange={() => onToggleMemberSelection(member._id)}
                    class="h-4 w-4 rounded border-2 border-muted-foreground"
                  />
                </td>
              {/if}
              <td class="px-5 py-3">
                <div class="flex flex-col gap-1">
                  <span class="font-semibold text-[15px] leading-tight">{member.lastName}, {member.firstName}</span>
                </div>
              </td>
              <td class="px-5 py-3 text-sm text-muted-foreground">{getGroupName(member.groupId)}</td>
              {#if selectedTournament}
                <td class="px-5 py-3">
                  <button
                    onclick={() => onToggleMemberRegistration(member._id)}
                    class={cn(
                      "inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold shadow-inner transition-all",
                      isRegistered
                        ? "bg-emerald-500/15 text-emerald-200 border border-emerald-400/50"
                        : "bg-muted text-muted-foreground border border-steel/60 hover:text-foreground"
                    )}
                    title={isRegistered ? "Unregister from tournament" : "Register for tournament"}
                  >
                    {#if isRegistered}
                      <Check class="h-3.5 w-3.5" /> Registered
                    {:else}
                      <Plus class="h-3.5 w-3.5" /> Register
                    {/if}
                  </button>
                </td>
              {/if}
              <td class="px-5 py-3 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    onclick={() => onOpenEditMember(member)}
                    class="icon-btn"
                    aria-label="Edit member"
                  >
                    <Pencil class="h-4 w-4" />
                  </button>
                  <button
                    onclick={() => onDeleteMember(member._id)}
                    class="icon-btn danger"
                    aria-label="Delete member"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</div>
