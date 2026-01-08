<script lang="ts">
  import { onMount } from 'svelte';
  import autoAnimate from '@formkit/auto-animate';
  import { cn } from '$lib/utils';
  import { IsMobile } from '$lib/hooks/is-mobile.svelte';
  
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import * as Select from '$lib/components/ui/select';
  import * as Card from '$lib/components/ui/card';
  import * as Tabs from '$lib/components/ui/tabs';
  import { Input } from '$lib/components/ui/input';
  import { Separator } from '$lib/components/ui/separator';
  
  import { 
    Users, FolderOpen, Search, Plus, Pencil, Trash2, 
    Check, X, ChevronDown, ChevronLeft, ChevronRight, UserPlus, RefreshCw
  } from '@lucide/svelte';
  
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
  export let membersByGroupId: Map<string, any[]> = new Map();
  
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
  
  // Group callbacks
  export let onOpenAddGroup: () => void;
  export let onOpenEditGroup: (group: any) => void;
  export let onDeleteGroup: (id: string) => void;
  export let expandedGroupId: string | null = null;
  export let onToggleGroupExpansion: (id: string) => void;
  
  const isMobile = new IsMobile();
  let listContainer: HTMLElement;
  let addMenuOpen = false;
  let selectedGroupIdForFilter: string | null = null;
  let mobileTab = 'members';
  
  $: listContainer && autoAnimate(listContainer);
  
  // Pagination state
  let currentPage = 1;
  let itemsPerPage = 10;
  
  // Filter members by selected group
  $: displayedMembers = selectedGroupIdForFilter 
    ? filteredMembers.filter(m => m.groupId === selectedGroupIdForFilter)
    : filteredMembers;
  
  // Reset to page 1 when filters change
  $: if (displayedMembers) currentPage = 1;
  
  // Calculate pagination
  $: totalPages = Math.ceil(displayedMembers.length / itemsPerPage);
  $: startIndex = (currentPage - 1) * itemsPerPage;
  $: endIndex = Math.min(startIndex + itemsPerPage, displayedMembers.length);
  $: paginatedMembers = displayedMembers.slice(startIndex, endIndex);
  
  // Generate page numbers
  $: pageNumbers = (() => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  })();
  
  $: totalRegistered = participants.length;
  $: pageSelected = paginatedMembers.length > 0 && paginatedMembers.every((m) => selectedMemberIds.has(m._id));
  
  function getInitials(firstName: string, lastName: string): string {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  }
  
  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages) currentPage = page;
  }
  
  function selectGroup(groupId: string | null) {
    selectedGroupIdForFilter = groupId;
    currentPage = 1;
  }
  
  function getGroupMemberCount(groupId: string): number {
    return membersByGroupId.get(groupId)?.length || 0;
  }
  
  onMount(() => {
    console.debug('[admin] RosterTab mounted', { membersCount: members.length, groupsCount: groups.length });
  });
</script>

{#if !isMobile.current}
<!-- Desktop: Master-Detail Split View -->
<div class="h-full flex flex-col">
  <div class="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
    <div class="px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <h2 class="text-lg font-semibold">Roster</h2>
        <Badge variant="secondary">{members.length} members</Badge>
        <Badge variant="outline">{groups.length} groups</Badge>
      </div>
      <div class="flex items-center gap-2">
        <div class="relative">
          <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            type="text" 
            placeholder="Search members..." 
            class="pl-8 w-[200px] h-8"
            value={searchQuery}
            oninput={(e) => onSearchChange(e.currentTarget.value)}
          />
        </div>
        <Select.Root 
          type="single"
          value={registrationFilter}
          onValueChange={(v) => v && onRegistrationFilterChange(v)}
        >
          <Select.Trigger class="w-[130px] h-8">
            {registrationFilter === 'all' ? 'All Status' : registrationFilter === 'registered' ? 'Registered' : 'Unregistered'}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="all">All Status</Select.Item>
            <Select.Item value="registered">Registered</Select.Item>
            <Select.Item value="unregistered">Unregistered</Select.Item>
          </Select.Content>
        </Select.Root>
        <Button variant="outline" size="sm" onclick={onResetFilters}>
          <RefreshCw class="w-3.5 h-3.5 mr-1" />
          Reset
        </Button>
      </div>
    </div>
  </div>
  
  <div class="flex-1 flex overflow-hidden">
    <!-- Groups Panel (Left) -->
    <div class="groups-panel">
      <div class="groups-panel-header">
        <span class="groups-panel-title">Groups</span>
        <Button variant="ghost" size="sm" class="h-7 w-7 p-0" onclick={onOpenAddGroup}>
          <Plus class="w-4 h-4" />
        </Button>
      </div>
      <div class="groups-panel-list">
        <!-- All Members option -->
        <div 
          role="button"
          tabindex="0"
          class={cn(
            "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors",
            selectedGroupIdForFilter === null ? "bg-primary/10 text-primary" : "hover:bg-muted"
          )}
          onclick={() => selectGroup(null)}
          onkeydown={(e) => e.key === 'Enter' && selectGroup(null)}
        >
          <Users class="w-4 h-4" />
          <span class="flex-1 text-sm font-medium">All Members</span>
          <Badge variant="secondary" class="text-xs">{members.length}</Badge>
        </div>
        
        <Separator class="my-2" />
        
        <!-- Group List -->
        {#each groups as group (group._id)}
          <div 
            role="button"
            tabindex="0"
            class={cn(
              "group-item group",
              selectedGroupIdForFilter === group._id && "active",
              group.hantei && "hantei"
            )}
            onclick={() => selectGroup(group._id)}
            onkeydown={(e) => e.key === 'Enter' && selectGroup(group._id)}
          >
            <div class="group-item-icon">
              <FolderOpen class="w-4 h-4" />
            </div>
            <div class="group-item-info">
              <div class="group-item-name">{group.name}</div>
              <div class="group-item-meta">
                {getGroupMemberCount(group._id)} members
                {#if group.hantei}
                  <span class="text-[var(--accent-fire)] ml-1">• Hantei</span>
                {/if}
              </div>
            </div>
            <span class="group-item-count">{getGroupMemberCount(group._id)}</span>
            <div class="group-item-actions">
              <Button 
                variant="ghost" 
                size="sm" 
                class="h-6 w-6 p-0"
                onclick={(e) => { e.stopPropagation(); onOpenEditGroup(group); }}
              >
                <Pencil class="w-3 h-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                class="h-6 w-6 p-0 text-destructive"
                onclick={(e) => { e.stopPropagation(); onDeleteGroup(group._id); }}
              >
                <Trash2 class="w-3 h-3" />
              </Button>
            </div>
            {#if selectedTournament}
              <Button 
                variant="ghost" 
                size="sm" 
                class="h-6 px-2 text-xs hidden group-hover:flex"
                onclick={(e) => { e.stopPropagation(); onRegisterGroupMembers(group._id); }}
              >
                <UserPlus class="w-3 h-3 mr-1" />
                Register
              </Button>
            {/if}
          </div>
        {/each}
      </div>
    </div>
    
    <!-- Members Table (Right) -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Action Bar -->
      <div class="px-4 py-2 border-b border-border/50 flex items-center justify-between bg-muted/10">
        <div class="flex items-center gap-2">
          {#if selectedMemberIds.size > 0}
            <Badge variant="secondary">{selectedMemberIds.size} selected</Badge>
            <Button variant="ghost" size="sm" onclick={onClearSelection}>
              <X class="w-3.5 h-3.5 mr-1" />
              Clear
            </Button>
            {#if selectedTournament}
              <Button variant="outline" size="sm" onclick={onRegisterSelectedMembers}>
                <UserPlus class="w-3.5 h-3.5 mr-1" />
                Register Selected
              </Button>
            {/if}
          {:else}
            <span class="text-sm text-muted-foreground">
              {selectedGroupIdForFilter ? getGroupName(selectedGroupIdForFilter) : 'All Members'}
              ({displayedMembers.length})
            </span>
          {/if}
        </div>
        <div class="relative">
          <Button variant="default" size="sm" onclick={() => addMenuOpen = !addMenuOpen}>
            <Plus class="w-3.5 h-3.5 mr-1" />
            Add
            <ChevronDown class="w-3.5 h-3.5 ml-1" />
          </Button>
          {#if addMenuOpen}
            <div class="absolute right-0 top-full mt-1 bg-popover border rounded-md shadow-lg py-1 z-50 min-w-[160px]">
              <button class="w-full px-3 py-1.5 text-sm text-left hover:bg-muted" onclick={() => { onOpenAddMember(); addMenuOpen = false; }}>
                Add Member
              </button>
              <button class="w-full px-3 py-1.5 text-sm text-left hover:bg-muted" onclick={() => { onOpenMassAdd(); addMenuOpen = false; }}>
                Mass Add
              </button>
              <button class="w-full px-3 py-1.5 text-sm text-left hover:bg-muted" onclick={() => { onOpenImportCSV(); addMenuOpen = false; }}>
                Import CSV
              </button>
            </div>
          {/if}
        </div>
      </div>
      
      <!-- Table -->
      <div class="flex-1 overflow-auto">
        <table class="w-full text-sm">
          <thead class="sticky top-0 bg-muted/50 backdrop-blur-sm">
            <tr class="border-b">
              <th class="w-10 px-3 py-2">
                <input 
                  type="checkbox" 
                  checked={pageSelected}
                  onchange={() => {
                    if (pageSelected) {
                      paginatedMembers.forEach(m => selectedMemberIds.delete(m._id));
                    } else {
                      paginatedMembers.forEach(m => selectedMemberIds.add(m._id));
                    }
                    selectedMemberIds = selectedMemberIds;
                  }}
                  class="rounded border-input"
                />
              </th>
              <th class="px-3 py-2 text-left font-medium">Name</th>
              <th class="px-3 py-2 text-left font-medium">Group</th>
              {#if selectedTournament}
                <th class="px-3 py-2 text-center font-medium w-28">Registered</th>
              {/if}
              <th class="px-3 py-2 text-right font-medium w-24">Actions</th>
            </tr>
          </thead>
          <tbody bind:this={listContainer}>
            {#each paginatedMembers as member (member._id)}
              <tr class="border-b hover:bg-muted/30 transition-colors">
                <td class="px-3 py-2">
                  <input 
                    type="checkbox" 
                    checked={selectedMemberIds.has(member._id)}
                    onchange={() => onToggleMemberSelection(member._id)}
                    class="rounded border-input"
                  />
                </td>
                <td class="px-3 py-2">
                  <div class="flex items-center gap-2">
                    <div class="cell-avatar-gradient">
                      {getInitials(member.firstName, member.lastName)}
                    </div>
                    <div>
                      <div class="font-medium">{member.firstName} {member.lastName}</div>
                      {#if member.japaneseFirstName || member.japaneseLastName}
                        <div class="text-xs text-muted-foreground">
                          {member.japaneseLastName || ''} {member.japaneseFirstName || ''}
                        </div>
                      {/if}
                    </div>
                  </div>
                </td>
                <td class="px-3 py-2">
                  <Badge variant="outline" class="text-xs">
                    {getGroupName(member.groupId)}
                  </Badge>
                </td>
                {#if selectedTournament}
                  <td class="px-3 py-2 text-center">
                    <Button 
                      variant={registeredMemberIds.has(member._id) ? "default" : "outline"}
                      size="sm"
                      class="h-7 w-20"
                      onclick={() => onToggleMemberRegistration(member._id)}
                    >
                      {#if registeredMemberIds.has(member._id)}
                        <Check class="w-3.5 h-3.5 mr-1" />
                        Yes
                      {:else}
                        <X class="w-3.5 h-3.5 mr-1" />
                        No
                      {/if}
                    </Button>
                  </td>
                {/if}
                <td class="px-3 py-2">
                  <div class="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" class="h-7 w-7 p-0" onclick={() => onOpenEditMember(member)}>
                      <Pencil class="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" class="h-7 w-7 p-0 text-destructive" onclick={() => onDeleteMember(member._id)}>
                      <Trash2 class="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      
      <!-- Pagination Footer -->
      <div class="px-4 py-2 border-t border-border/50 flex items-center justify-between bg-muted/10">
        <div class="flex items-center gap-2">
          <span class="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{endIndex} of {displayedMembers.length}
          </span>
          <Select.Root 
            type="single"
            value={String(itemsPerPage)}
            onValueChange={(v) => { itemsPerPage = Number(v); currentPage = 1; }}
          >
            <Select.Trigger class="w-[70px] h-7 text-xs">
              {itemsPerPage}
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="10">10</Select.Item>
              <Select.Item value="25">25</Select.Item>
              <Select.Item value="50">50</Select.Item>
            </Select.Content>
          </Select.Root>
        </div>
        <div class="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            class="h-7 w-7 p-0"
            disabled={currentPage === 1}
            onclick={() => goToPage(currentPage - 1)}
          >
            <ChevronLeft class="w-4 h-4" />
          </Button>
          {#each pageNumbers as page}
            {#if page === '...'}
              <span class="px-2 text-muted-foreground">...</span>
            {:else}
              <Button 
                variant={currentPage === page ? "default" : "ghost"}
                size="sm"
                class="h-7 w-7 p-0 text-xs"
                onclick={() => goToPage(page as number)}
              >
                {page}
              </Button>
            {/if}
          {/each}
          <Button 
            variant="ghost" 
            size="sm" 
            class="h-7 w-7 p-0"
            disabled={currentPage === totalPages}
            onclick={() => goToPage(currentPage + 1)}
          >
            <ChevronRight class="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  </div>
</div>

{:else}
<!-- Mobile: Tabbed Interface -->
<div class="h-full flex flex-col">
  <Tabs.Root value={mobileTab} onValueChange={(v) => mobileTab = v} class="flex-1 flex flex-col">
    <div class="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
      <div class="px-4 py-2">
        <Tabs.List class="w-full grid grid-cols-2">
          <Tabs.Trigger value="members" class="flex items-center gap-2">
            <Users class="w-4 h-4" />
            Members ({members.length})
          </Tabs.Trigger>
          <Tabs.Trigger value="groups" class="flex items-center gap-2">
            <FolderOpen class="w-4 h-4" />
            Groups ({groups.length})
          </Tabs.Trigger>
        </Tabs.List>
      </div>
    </div>
    
    <Tabs.Content value="members" class="flex-1 flex flex-col mt-0">
      <!-- Search and filters -->
      <div class="px-4 py-3 space-y-2 border-b">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            type="text" 
            placeholder="Search members..." 
            class="pl-9"
            value={searchQuery}
            oninput={(e) => onSearchChange(e.currentTarget.value)}
          />
        </div>
        <div class="flex gap-2 overflow-x-auto pb-1">
          <Button 
            variant={registrationFilter === 'all' ? "default" : "outline"}
            size="sm"
            onclick={() => onRegistrationFilterChange('all')}
          >
            All
          </Button>
          <Button 
            variant={registrationFilter === 'registered' ? "default" : "outline"}
            size="sm"
            onclick={() => onRegistrationFilterChange('registered')}
          >
            Registered
          </Button>
          <Button 
            variant={registrationFilter === 'unregistered' ? "default" : "outline"}
            size="sm"
            onclick={() => onRegistrationFilterChange('unregistered')}
          >
            Unregistered
          </Button>
        </div>
      </div>
      
      <!-- Member Cards -->
      <div class="flex-1 overflow-auto p-4 space-y-2" bind:this={listContainer}>
        {#each paginatedMembers as member (member._id)}
          <Card.Root class="p-3">
            <div class="flex items-center gap-3">
              <input 
                type="checkbox" 
                checked={selectedMemberIds.has(member._id)}
                onchange={() => onToggleMemberSelection(member._id)}
                class="rounded border-input"
              />
              <div class="cell-avatar-gradient" style="width: 40px; height: 40px; font-size: 14px;">
                {getInitials(member.firstName, member.lastName)}
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-medium">{member.firstName} {member.lastName}</div>
                <div class="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" class="text-xs">{getGroupName(member.groupId)}</Badge>
                  {#if selectedTournament && registeredMemberIds.has(member._id)}
                    <Badge variant="default" class="text-xs">
                      <Check class="w-3 h-3 mr-0.5" />
                      Registered
                    </Badge>
                  {/if}
                </div>
              </div>
              <div class="flex items-center gap-1">
                <Button variant="ghost" size="sm" class="h-8 w-8 p-0" onclick={() => onOpenEditMember(member)}>
                  <Pencil class="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" class="h-8 w-8 p-0 text-destructive" onclick={() => onDeleteMember(member._id)}>
                  <Trash2 class="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card.Root>
        {/each}
      </div>
      
      <!-- Mobile pagination -->
      <div class="px-4 py-3 border-t flex items-center justify-between">
        <span class="text-sm text-muted-foreground">{startIndex + 1}-{endIndex} of {displayedMembers.length}</span>
        <div class="flex items-center gap-1">
          <Button variant="ghost" size="sm" disabled={currentPage === 1} onclick={() => goToPage(currentPage - 1)}>
            <ChevronLeft class="w-4 h-4" />
          </Button>
          <span class="text-sm px-2">{currentPage} / {totalPages || 1}</span>
          <Button variant="ghost" size="sm" disabled={currentPage === totalPages} onclick={() => goToPage(currentPage + 1)}>
            <ChevronRight class="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <!-- FAB for add -->
      <Button 
        class="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg"
        onclick={onOpenAddMember}
      >
        <Plus class="w-6 h-6" />
      </Button>
    </Tabs.Content>
    
    <Tabs.Content value="groups" class="flex-1 flex flex-col mt-0">
      <div class="flex-1 overflow-auto p-4 space-y-2">
        {#each groups as group (group._id)}
          <Card.Root class={cn("p-3", group.hantei && "border-l-4 border-orange-500")}>
            <div class="flex items-center gap-3">
              <FolderOpen class="w-5 h-5 text-muted-foreground shrink-0" />
              <div class="flex-1 min-w-0">
                <div class="font-medium">{group.name}</div>
                <div class="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{getGroupMemberCount(group._id)} members</span>
                  {#if group.hantei}
                    <Badge variant="outline" class="text-orange-500 border-orange-500 text-xs">Hantei</Badge>
                  {/if}
                  {#if group.court}
                    <Badge variant="secondary" class="text-xs">Court {group.court}</Badge>
                  {/if}
                </div>
              </div>
              <div class="flex items-center gap-1">
                {#if selectedTournament}
                  <Button variant="outline" size="sm" onclick={() => onRegisterGroupMembers(group._id)}>
                    <UserPlus class="w-4 h-4" />
                  </Button>
                {/if}
                <Button variant="ghost" size="sm" class="h-8 w-8 p-0" onclick={() => onOpenEditGroup(group)}>
                  <Pencil class="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" class="h-8 w-8 p-0 text-destructive" onclick={() => onDeleteGroup(group._id)}>
                  <Trash2 class="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card.Root>
        {/each}
      </div>
      
      <!-- FAB for add group -->
      <Button 
        class="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg"
        onclick={onOpenAddGroup}
      >
        <Plus class="w-6 h-6" />
      </Button>
    </Tabs.Content>
  </Tabs.Root>
  
  <!-- Bottom stats bar -->
  <div class="mobile-stats-bar">
    <div class="mobile-stat">
      <div class="mobile-stat-value">{members.length}</div>
      <div class="mobile-stat-label">Members</div>
    </div>
    {#if selectedTournament}
      <div class="mobile-stat">
        <div class="mobile-stat-value">{totalRegistered}</div>
        <div class="mobile-stat-label">Registered</div>
      </div>
    {/if}
    <div class="mobile-stat">
      <div class="mobile-stat-value">{groups.length}</div>
      <div class="mobile-stat-label">Groups</div>
    </div>
  </div>
</div>
{/if}

<style>
  table {
    border-collapse: collapse;
  }
</style>
