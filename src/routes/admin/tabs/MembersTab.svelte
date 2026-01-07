<script lang="ts">
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

<div class="rounded-2xl border-2 border-border bg-card overflow-hidden" bind:this={listContainer}>
  {#if selectedTournament && filteredMembers.length > 0}
    <div class="flex items-center gap-4 px-5 py-3 bg-muted/30 border-b border-border">
      <input
        type="checkbox"
        checked={allFilteredSelected}
        onchange={() => allFilteredSelected ? onClearSelection() : filteredMembers.forEach(m => onToggleMemberSelection(m._id))}
        class="h-5 w-5 rounded border-2 border-muted-foreground"
      />
      <span class="text-sm text-muted-foreground">
        {selectedMemberIds.size > 0 ? `${selectedMemberIds.size} selected` : `Select all ${filteredMembers.length}`}
      </span>
    </div>
  {/if}

  {#each filteredMembers as member (member._id)}
    {@const isRegistered = registeredMemberIds.has(member._id)}
    {@const isSelected = selectedMemberIds.has(member._id)}
    <div class={cn(
      "flex items-center gap-4 px-5 py-4 border-b border-border last:border-b-0 transition-colors min-h-[72px]",
      isRegistered && "bg-emerald-950/20",
      "hover:bg-accent/30 active:bg-accent/50"
    )}>
      {#if selectedTournament}
        <input
          type="checkbox"
          checked={isSelected}
          onchange={() => onToggleMemberSelection(member._id)}
          class="h-5 w-5 rounded border-2 border-muted-foreground shrink-0"
        />
      {/if}

      {#if selectedTournament}
        <button
          onclick={() => onToggleMemberRegistration(member._id)}
          class={cn(
            "shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all",
            isRegistered 
              ? "bg-emerald-500 text-white hover:bg-emerald-600" 
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
          title={isRegistered ? "Click to unregister" : "Click to register"}
        >
          {#if isRegistered}<Check class="h-5 w-5" />{:else}<Plus class="h-5 w-5" />{/if}
        </button>
      {/if}

      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <span class="font-semibold text-base truncate">{member.lastName}, {member.firstName}</span>
        </div>
        <span class="text-sm text-muted-foreground block truncate">{getGroupName(member.groupId)}</span>
      </div>

      <button
        onclick={() => onOpenEditMember(member)}
        class="shrink-0 w-11 h-11 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        <Pencil class="h-4 w-4" />
      </button>

      <button
        onclick={() => onDeleteMember(member._id)}
        class="shrink-0 w-11 h-11 flex items-center justify-center rounded-xl text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors"
      >
        <Trash2 class="h-5 w-5" />
      </button>
    </div>
  {:else}
    <div class="py-16 text-center">
      <Users class="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
      <p class="text-lg text-muted-foreground mb-2">No members found</p>
      {#if searchQuery || filterGroup !== 'all'}
        <button
          onclick={onResetFilters}
          class="text-sm text-primary hover:underline"
        >
          Clear filters
        </button>
      {:else}
        <Button onclick={onOpenAddMember} variant="outline" class="mt-2">
          Add your first member
        </Button>
      {/if}
    </div>
  {/each}
</div>
