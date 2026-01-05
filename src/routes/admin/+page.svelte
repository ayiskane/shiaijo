<script lang="ts">
  import { onMount } from 'svelte';
  import { convexQuery, convexMutation } from '$lib/convex';
  import { cn } from '$lib/utils';
  import { slide, fade } from 'svelte/transition';
  import { 
    LayoutDashboard, Users, FolderOpen, Trophy, ClipboardList, 
    ChevronLeft, ChevronDown, Swords, Eye, Menu, Plus, Trash2, Pencil
  } from 'lucide-svelte';
  
  // shadcn-svelte components
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Checkbox } from '$lib/components/ui/checkbox';
  
  // State
  let activeTab = $state('dashboard');
  let sidebarOpen = $state(false);
  let sidebarCollapsed = $state(false);
  let expandedGroups = $state<Set<string>>(new Set(['roster', 'shiai']));
  let loading = $state(true);
  
  // Data
  let groups = $state<any[]>([]);
  let members = $state<any[]>([]);
  let tournaments = $state<any[]>([]);
  let participants = $state<any[]>([]);
  let matches = $state<any[]>([]);
  
  // Modal states
  let showAddGroup = $state(false);
  let showEditGroup = $state(false);
  let showAddMember = $state(false);
  let showMassAddMembers = $state(false);
  let showImportCSV = $state(false);
  let showCreateTournament = $state(false);
  
  let editingGroup = $state<any>(null);
  let newGroup = $state({ id: '', name: '', isHantei: false });
  let newMember = $state({ firstName: '', lastName: '', groupId: '' });
  let csvText = $state('');
  let newTournament = $state({ name: '', date: '', month: '', year: new Date().getFullYear() });
  let selectedTournamentId = $state<string | null>(null);
  
  // Mass member creation
  type MemberRow = { firstName: string; lastName: string; groupId: string };
  let massMembers = $state<MemberRow[]>([
    { firstName: '', lastName: '', groupId: '' },
    { firstName: '', lastName: '', groupId: '' },
    { firstName: '', lastName: '', groupId: '' },
    { firstName: '', lastName: '', groupId: '' },
    { firstName: '', lastName: '', groupId: '' },
  ]);
  
  function addMoreRows() {
    massMembers = [
      ...massMembers,
      { firstName: '', lastName: '', groupId: '' },
      { firstName: '', lastName: '', groupId: '' },
      { firstName: '', lastName: '', groupId: '' },
      { firstName: '', lastName: '', groupId: '' },
      { firstName: '', lastName: '', groupId: '' },
    ];
  }
  
  function resetMassMembers() {
    massMembers = [
      { firstName: '', lastName: '', groupId: '' },
      { firstName: '', lastName: '', groupId: '' },
      { firstName: '', lastName: '', groupId: '' },
      { firstName: '', lastName: '', groupId: '' },
      { firstName: '', lastName: '', groupId: '' },
    ];
  }
  
  async function createMassMembers() {
    const validMembers = massMembers.filter(m => m.firstName.trim() && m.lastName.trim() && m.groupId);
    if (validMembers.length === 0) {
      alert('Please fill in at least one complete row (First Name, Last Name, and Group)');
      return;
    }
    try {
      const toAdd = validMembers.map(m => ({
        firstName: m.firstName.trim(),
        lastName: m.lastName.trim(),
        groupId: m.groupId,
        isGuest: false
      }));
      await convexMutation('members:bulkCreate', { members: toAdd });
      resetMassMembers();
      showMassAddMembers = false;
      await loadData();
      alert(`Successfully added ${toAdd.length} member${toAdd.length > 1 ? 's' : ''}`);
    } catch (e) {
      alert('Failed to create members');
    }
  }
  
  // Filters
  let searchQuery = $state('');
  let filterGroup = $state('all');
  
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  // Navigation
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];
  
  const navGroups = [
    {
      id: 'roster',
      label: 'Roster',
      items: [
        { id: 'members', label: 'Members', icon: Users },
        { id: 'groups', label: 'Groups', icon: FolderOpen },
      ]
    },
    {
      id: 'shiai',
      label: 'Shiai',
      items: [
        { id: 'tournament', label: 'Tournament', icon: Trophy },
        { id: 'results', label: 'Results', icon: ClipboardList },
      ]
    }
  ];
  
  // Derived
  let filteredMembers = $derived(
    members
      .filter(m => {
        const matchesSearch = `${m.firstName} ${m.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesGroup = filterGroup === 'all' || m.groupId === filterGroup;
        return matchesSearch && matchesGroup;
      })
      .sort((a, b) => a.lastName.localeCompare(b.lastName))
  );
  
  let activeTournament = $derived(tournaments.find(t => t.status === 'in_progress') || null);
  let selectedTournament = $derived(tournaments.find(t => t._id === selectedTournamentId) || activeTournament || tournaments[0] || null);
  let pendingMatches = $derived(matches.filter(m => m.status === 'pending'));
  let completedMatches = $derived(matches.filter(m => m.status === 'completed'));
  
  $effect(() => {
    if (selectedTournament && selectedTournament._id) {
      loadTournamentData(selectedTournament._id);
    }
  });
  
  async function loadTournamentData(tournamentId: string) {
    try {
      const [p, m] = await Promise.all([
        convexQuery<any[]>('participants:list', { tournamentId }),
        convexQuery<any[]>('matches:getByTournament', { tournamentId }),
      ]);
      participants = p;
      matches = m;
    } catch (e) {
      console.error('Failed to load tournament data:', e);
    }
  }
  
  async function loadData() {
    try {
      loading = true;
      const [g, m, t] = await Promise.all([
        convexQuery<any[]>('groups:list', {}),
        convexQuery<any[]>('members:list', {}),
        convexQuery<any[]>('tournaments:list', {}),
      ]);
      groups = g;
      members = m;
      tournaments = t;
      
      const active = t.find((tour: any) => tour.status === 'in_progress');
      if (active) {
        selectedTournamentId = active._id;
      } else if (t.length > 0) {
        selectedTournamentId = t[0]._id;
      }
      loading = false;
    } catch (e) {
      console.error('Load failed:', e);
      loading = false;
    }
  }
  
  function toggleNavGroup(groupId: string) {
    const newSet = new Set(expandedGroups);
    if (newSet.has(groupId)) {
      newSet.delete(groupId);
    } else {
      newSet.add(groupId);
    }
    expandedGroups = newSet;
  }
  
  function getNextGroupId(): string {
    const ids = groups.map(g => g.groupId).filter(id => /^G\d+$/.test(id));
    if (ids.length === 0) return 'G1';
    const nums = ids.map(id => parseInt(id.slice(1)));
    return `G${Math.max(...nums) + 1}`;
  }
  
  async function createGroup() {
    if (!newGroup.id || !newGroup.name) return;
    try {
      await convexMutation('groups:create', { groupId: newGroup.id, name: newGroup.name, isHantei: newGroup.isHantei });
      newGroup = { id: '', name: '', isHantei: false };
      showAddGroup = false;
      await loadData();
    } catch (e) {
      alert('Failed to create group');
    }
  }
  
  async function updateGroup() {
    if (!editingGroup) return;
    try {
      await convexMutation('groups:update', { id: editingGroup._id, groupId: editingGroup.groupId, name: editingGroup.name, isHantei: editingGroup.isHantei });
      editingGroup = null;
      showEditGroup = false;
      await loadData();
    } catch (e) {
      alert('Failed to update group');
    }
  }
  
  async function deleteGroup(id: any) {
    if (!confirm('Delete this group?')) return;
    try {
      await convexMutation('groups:remove', { id });
      await loadData();
    } catch (e) {
      alert('Failed to delete group');
    }
  }
  
  async function createMember() {
    if (!newMember.firstName || !newMember.lastName || !newMember.groupId) return;
    try {
      await convexMutation('members:create', { firstName: newMember.firstName, lastName: newMember.lastName, groupId: newMember.groupId, isGuest: false });
      newMember = { firstName: '', lastName: '', groupId: '' };
      showAddMember = false;
      await loadData();
    } catch (e) {
      alert('Failed to create member');
    }
  }
  
  async function deleteMember(id: any) {
    if (!confirm('Remove this member?')) return;
    try {
      await convexMutation('members:remove', { id });
      await loadData();
    } catch (e) {
      alert('Failed to delete member');
    }
  }
  
  async function importCSV() {
    const lines = csvText.trim().split('\n').filter(l => l.trim());
    const toAdd = [];
    for (const line of lines) {
      const [firstName, lastName, groupId] = line.split(',').map(s => s.trim());
      if (firstName && lastName && groupId) toAdd.push({ firstName, lastName, groupId, isGuest: false });
    }
    if (toAdd.length === 0) {
      alert('No valid rows found. Format: FirstName,LastName,GroupID');
      return;
    }
    try {
      await convexMutation('members:bulkCreate', { members: toAdd });
      csvText = '';
      showImportCSV = false;
      await loadData();
      alert(`Imported ${toAdd.length} members`);
    } catch (e) {
      alert('Import failed');
    }
  }
  
  function generateTournamentName(): string {
    const month = newTournament.month || MONTHS[new Date().getMonth()];
    const year = newTournament.year || new Date().getFullYear();
    return `Renbu Monthly Shiai - ${month} ${year}`;
  }
  
  async function createTournament() {
    if (!newTournament.date) {
      alert('Please select a date');
      return;
    }
    const name = newTournament.name || generateTournamentName();
    try {
      const id = await convexMutation<string>('tournaments:create', { name, date: newTournament.date });
      newTournament = { name: '', date: '', month: '', year: new Date().getFullYear() };
      showCreateTournament = false;
      await loadData();
      selectedTournamentId = id;
    } catch (e) {
      alert('Failed to create tournament');
    }
  }
  
  async function startTournament() {
    if (!selectedTournament) return;
    try {
      await convexMutation('tournaments:start', { id: selectedTournament._id });
      await loadData();
    } catch (e) {
      alert('Failed to start tournament');
    }
  }
  
  async function addAllParticipants() {
    if (!selectedTournament) return;
    try {
      const result = await convexMutation<any>('participants:addAllMembers', { tournamentId: selectedTournament._id });
      await loadTournamentData(selectedTournament._id);
      alert(`Added ${result.addedCount} participants`);
    } catch (e) {
      alert('Failed to add participants');
    }
  }
  
  async function generateMatches() {
    if (!selectedTournament) return;
    try {
      const result = await convexMutation<any>('tournaments:generateMatches', { tournamentId: selectedTournament._id });
      await loadTournamentData(selectedTournament._id);
      alert(`Generated ${result.matchCount} matches`);
    } catch (e) {
      alert('Failed to generate matches');
    }
  }
  
  function getGroupName(groupId: string): string {
    return groups.find(g => g.groupId === groupId)?.name || groupId;
  }
  
  function getMemberName(memberId: string): string {
    const m = members.find(mem => mem._id === memberId);
    return m ? `${m.firstName} ${m.lastName.charAt(0)}.` : 'Unknown';
  }
  
  onMount(loadData);
</script>

<svelte:head>
  <title>Admin - 試合場 Shiaijo</title>
  <link rel="icon" href="/renbu-logo.png" type="image/png" />
</svelte:head>

<div class="flex min-h-screen bg-background">
  <!-- Desktop Sidebar -->
  <aside class={cn(
    "hidden md:flex flex-col fixed inset-y-0 left-0 z-20 border-r border-sidebar-border bg-sidebar transition-all duration-300",
    sidebarCollapsed ? "w-[72px]" : "w-52"
  )}>
    <!-- Logo -->
    <div class="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
      <img src="/shiaijologo.png" alt="Shiaijo" class="h-10 w-10 shrink-0 object-contain" />
      {#if !sidebarCollapsed}
        <span class="font-jp text-xl text-foreground">試合場</span>
      {/if}
    </div>
    
    <!-- Collapse Button -->
    <button 
      onclick={() => sidebarCollapsed = !sidebarCollapsed}
      class="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-sidebar-border bg-sidebar hover:bg-sidebar-accent"
    >
      <ChevronLeft class={cn("h-4 w-4 text-sidebar-foreground transition-transform", sidebarCollapsed && "rotate-180")} />
    </button>
    
    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto py-4">
      <!-- Dashboard -->
      {#each navItems as item}
        <button
          onclick={() => activeTab = item.id}
          title={sidebarCollapsed ? item.label : undefined}
          class={cn(
            "flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-colors",
            sidebarCollapsed && "justify-center px-0",
            activeTab === item.id 
              ? "border-l-2 border-sidebar-primary bg-sidebar-accent text-sidebar-primary" 
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <div class={cn(
            "flex h-7 w-7 items-center justify-center rounded-md",
            activeTab === item.id ? "bg-sidebar-primary/20" : "bg-sidebar-accent"
          )}>
            <svelte:component this={item.icon} class="h-4 w-4" />
          </div>
          {#if !sidebarCollapsed}
            <span>{item.label}</span>
          {/if}
        </button>
      {/each}
      
      <!-- Nav Groups -->
      {#each navGroups as group}
        <div class="mt-2">
          {#if !sidebarCollapsed}
            <button
              onclick={() => toggleNavGroup(group.id)}
              class="flex w-full items-center gap-2 px-3 py-1.5 text-[10px] uppercase tracking-wider text-sidebar-foreground/60 hover:text-sidebar-foreground"
            >
              <ChevronDown class={cn("h-3 w-3 transition-transform", !expandedGroups.has(group.id) && "-rotate-90")} />
              {group.label}
            </button>
          {/if}
          {#if sidebarCollapsed || expandedGroups.has(group.id)}
            {#each group.items as item}
              <button
                onclick={() => activeTab = item.id}
                title={sidebarCollapsed ? item.label : undefined}
                class={cn(
                  "flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-colors",
                  sidebarCollapsed && "justify-center px-0",
                  activeTab === item.id 
                    ? "border-l-2 border-sidebar-primary bg-sidebar-accent text-sidebar-primary" 
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <div class={cn(
                  "flex h-7 w-7 items-center justify-center rounded-md",
                  activeTab === item.id ? "bg-sidebar-primary/20" : "bg-sidebar-accent"
                )}>
                  <svelte:component this={item.icon} class="h-4 w-4" />
                </div>
                {#if !sidebarCollapsed}
                  <span>{item.label}</span>
                  {#if item.id === 'tournament' && activeTournament}
                    <span class="ml-auto rounded-full border border-green-500/30 bg-green-500/20 px-1.5 py-0.5 text-[10px] text-green-400">Live</span>
                  {/if}
                {/if}
              </button>
            {/each}
          {/if}
        </div>
      {/each}
    </nav>
    
    <!-- Portal Switcher -->
    <div class="border-t border-sidebar-border p-3">
      {#if !sidebarCollapsed}
        <p class="mb-2 px-1 text-[10px] uppercase tracking-wider text-sidebar-foreground/60">Switch Portal</p>
      {/if}
      <div class={cn("flex gap-2", sidebarCollapsed ? "flex-col items-center" : "flex-col")}>
        <a 
          href="/courtkeeper" 
          class={cn(
            "flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-900/50 to-sky-800/30 text-sky-300 transition-colors hover:from-sky-900/70 hover:to-sky-800/50",
            sidebarCollapsed ? "h-10 w-10 justify-center" : "px-3 py-2 text-sm"
          )}
        >
          <Swords class="h-4 w-4" />
          {#if !sidebarCollapsed}<span>Courtkeeper</span>{/if}
        </a>
        <a 
          href="/spectator" 
          class={cn(
            "flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-900/50 to-emerald-800/30 text-emerald-300 transition-colors hover:from-emerald-900/70 hover:to-emerald-800/50",
            sidebarCollapsed ? "h-10 w-10 justify-center" : "px-3 py-2 text-sm"
          )}
        >
          <Eye class="h-4 w-4" />
          {#if !sidebarCollapsed}<span>Spectator</span>{/if}
        </a>
      </div>
    </div>
  </aside>
  
  <!-- Mobile Header -->
  <header class="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background px-4 md:hidden">
    <button onclick={() => sidebarOpen = true} class="rounded-lg p-2 hover:bg-accent">
      <Menu class="h-5 w-5" />
    </button>
    <div class="flex items-center gap-2">
      <img src="/shiaijologo.png" alt="Shiaijo" class="h-8 w-8 object-contain" />
      <span class="font-jp">試合場</span>
    </div>
    <div class="w-10"></div>
  </header>
  
  <!-- Mobile Sidebar Overlay -->
  {#if sidebarOpen}
    <div class="fixed inset-0 z-40 bg-black/50 md:hidden" onclick={() => sidebarOpen = false} transition:fade></div>
    <aside class="fixed inset-y-0 left-0 z-50 w-64 border-r border-sidebar-border bg-sidebar md:hidden" transition:slide={{ axis: 'x' }}>
      <div class="flex h-14 items-center gap-3 border-b border-sidebar-border px-4">
        <img src="/shiaijologo.png" alt="Shiaijo" class="h-10 w-10 object-contain" />
        <span class="font-jp text-xl">試合場</span>
      </div>
      <nav class="p-2">
        {#each [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'members', label: 'Members', icon: Users },
          { id: 'groups', label: 'Groups', icon: FolderOpen },
          { id: 'tournament', label: 'Tournament', icon: Trophy },
          { id: 'results', label: 'Results', icon: ClipboardList },
        ] as tab}
          <button
            onclick={() => { activeTab = tab.id; sidebarOpen = false; }}
            class={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm",
              activeTab === tab.id 
                ? "bg-sidebar-accent text-sidebar-primary" 
                : "text-sidebar-foreground hover:bg-sidebar-accent"
            )}
          >
            <svelte:component this={tab.icon} class="h-4 w-4" />
            {tab.label}
          </button>
        {/each}
      </nav>
      <div class="absolute inset-x-4 bottom-4 flex flex-col gap-2">
        <a href="/courtkeeper" class="flex items-center justify-center gap-2 rounded-lg bg-sky-900/50 py-2 text-sm text-sky-300">
          <Swords class="h-4 w-4" /> Courtkeeper
        </a>
        <a href="/spectator" class="flex items-center justify-center gap-2 rounded-lg bg-emerald-900/50 py-2 text-sm text-emerald-300">
          <Eye class="h-4 w-4" /> Spectator
        </a>
      </div>
    </aside>
  {/if}
  
  <!-- Main Content -->
  <main class={cn(
    "flex-1 pt-14 transition-all duration-300 md:pt-0",
    sidebarCollapsed ? "md:ml-[72px]" : "md:ml-52"
  )}>
    <div class="p-6">
      {#if loading}
        <div class="flex min-h-[400px] items-center justify-center">
          <div class="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        </div>
        
      {:else if activeTab === 'dashboard'}
        <h1 class="mb-6 text-2xl font-bold">Dashboard</h1>
        <div class="mb-6 grid gap-4 md:grid-cols-3">
          <div class="rounded-xl border border-border bg-card p-4">
            <div class="text-3xl font-bold text-primary">{members.length}</div>
            <div class="text-sm text-muted-foreground">Members</div>
          </div>
          <div class="rounded-xl border border-border bg-card p-4">
            <div class="text-3xl font-bold text-blue-400">{groups.length}</div>
            <div class="text-sm text-muted-foreground">Groups</div>
          </div>
          <div class="rounded-xl border border-border bg-card p-4">
            <div class="text-3xl font-bold text-green-400">{tournaments.length}</div>
            <div class="text-sm text-muted-foreground">Tournaments</div>
          </div>
        </div>
        {#if activeTournament}
          <div class="rounded-xl border border-green-500/50 bg-green-900/20 p-4">
            <div class="mb-2 flex items-center gap-2">
              <span class="h-2 w-2 animate-pulse rounded-full bg-green-500"></span>
              <h3 class="font-bold text-green-400">Live: {activeTournament.name}</h3>
            </div>
            <div class="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>📅 {activeTournament.date}</span>
              <span>⚔️ {completedMatches.length}/{matches.length} matches</span>
              <span>👥 {participants.length} participants</span>
            </div>
          </div>
        {/if}
        
      {:else if activeTab === 'tournament'}
        <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 class="text-2xl font-bold">Tournament</h1>
          <Button onclick={() => showCreateTournament = true}>
            <Plus class="mr-2 h-4 w-4" /> New Tournament
          </Button>
        </div>
        
        {#if tournaments.length === 0}
          <div class="rounded-xl border border-border bg-card p-6 text-center">
            <p class="mb-4 text-muted-foreground">No tournaments yet</p>
            <Button onclick={() => showCreateTournament = true}>Create Your First Tournament</Button>
          </div>
        {:else}
          <div class="mb-6">
            <select 
              value={selectedTournamentId} 
              onchange={(e) => selectedTournamentId = (e.target as HTMLSelectElement).value}
              class="w-full rounded-lg border border-input bg-card px-4 py-2 md:w-auto"
            >
              {#each tournaments as t}
                <option value={t._id}>{t.name} ({t.date}) - {t.status}</option>
              {/each}
            </select>
          </div>
          
          {#if selectedTournament}
            <div class="rounded-xl border border-border bg-card p-4">
              <div class="mb-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 class="text-lg font-bold">{selectedTournament.name}</h3>
                  <p class="text-sm text-muted-foreground">📅 {selectedTournament.date}</p>
                </div>
                <span class={cn(
                  "rounded-lg border px-3 py-1 text-sm font-medium",
                  selectedTournament.status === 'in_progress' ? "border-green-500/50 bg-green-500/20 text-green-400" :
                  selectedTournament.status === 'setup' ? "border-amber-500/50 bg-amber-500/20 text-amber-400" :
                  "border-blue-500/50 bg-blue-500/20 text-blue-400"
                )}>{selectedTournament.status}</span>
              </div>
              
              <div class="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                <div class="rounded-lg bg-background p-3 text-center">
                  <div class="text-2xl font-bold text-primary">{participants.length}</div>
                  <div class="text-xs text-muted-foreground">Participants</div>
                </div>
                <div class="rounded-lg bg-background p-3 text-center">
                  <div class="text-2xl font-bold text-blue-400">{matches.length}</div>
                  <div class="text-xs text-muted-foreground">Matches</div>
                </div>
                <div class="rounded-lg bg-background p-3 text-center">
                  <div class="text-2xl font-bold text-green-400">{completedMatches.length}</div>
                  <div class="text-xs text-muted-foreground">Completed</div>
                </div>
                <div class="rounded-lg bg-background p-3 text-center">
                  <div class="text-2xl font-bold text-amber-400">{pendingMatches.length}</div>
                  <div class="text-xs text-muted-foreground">Remaining</div>
                </div>
              </div>
              
              <div class="flex flex-wrap gap-2">
                {#if selectedTournament.status === 'setup'}
                  <Button variant="secondary" onclick={addAllParticipants}>Add All Members</Button>
                  {#if matches.length === 0}
                    <Button variant="secondary" onclick={generateMatches} class="bg-green-600 hover:bg-green-700 text-white">Generate Matches</Button>
                  {/if}
                  <Button onclick={startTournament}>▶ Start Tournament</Button>
                {/if}
              </div>
            </div>
          {/if}
        {/if}
        
      {:else if activeTab === 'groups'}
        <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 class="text-2xl font-bold">Groups</h1>
          <Button onclick={() => { newGroup.id = getNextGroupId(); showAddGroup = true; }}>
            <Plus class="mr-2 h-4 w-4" /> Add Group
          </Button>
        </div>
        
        {#if groups.length === 0}
          <div class="rounded-xl border border-border bg-card p-6 text-center">
            <p class="mb-4 text-muted-foreground">No groups yet</p>
            <Button onclick={() => { newGroup.id = 'G1'; showAddGroup = true; }}>Create Your First Group</Button>
          </div>
        {:else}
          <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {#each groups as group}
              <div class="rounded-xl border border-border bg-card p-4">
                <div class="mb-2 flex items-center justify-between">
                  <span class="font-bold">{group.name}</span>
                  <span class="text-sm text-muted-foreground">{group.groupId}</span>
                </div>
                {#if group.isHantei}<span class="inline-block rounded bg-primary/20 px-2 py-0.5 text-xs text-primary">Hantei</span>{/if}
                <p class="mt-1 text-sm text-muted-foreground">{members.filter(m => m.groupId === group.groupId).length} members</p>
                <div class="mt-3 flex gap-2">
                  <Button variant="secondary" size="sm" onclick={() => { editingGroup = {...group}; showEditGroup = true; }}>
                    <Pencil class="mr-1 h-3 w-3" /> Edit
                  </Button>
                  <Button variant="destructive" size="sm" onclick={() => deleteGroup(group._id)}>
                    <Trash2 class="mr-1 h-3 w-3" /> Delete
                  </Button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
        
      {:else if activeTab === 'members'}
        <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 class="text-2xl font-bold">Members ({members.length})</h1>
          <div class="flex flex-wrap gap-2">
            <Button variant="secondary" onclick={() => showImportCSV = true}>Import CSV</Button>
            <Button variant="secondary" onclick={() => { resetMassMembers(); showMassAddMembers = true; }} class="bg-blue-600 hover:bg-blue-700 text-white">
              <Users class="mr-2 h-4 w-4" /> Add Multiple
            </Button>
            <Button onclick={() => showAddMember = true}>
              <Plus class="mr-2 h-4 w-4" /> Add Member
            </Button>
          </div>
        </div>
        
        <div class="mb-4 flex flex-wrap gap-4">
          <input 
            type="text" 
            bind:value={searchQuery} 
            placeholder="Search..." 
            class="flex-1 rounded-lg border border-input bg-card px-4 py-2 focus:border-primary focus:outline-none"
          />
          <select bind:value={filterGroup} class="rounded-lg border border-input bg-card px-4 py-2">
            <option value="all">All Groups</option>
            {#each groups as g}<option value={g.groupId}>{g.name}</option>{/each}
          </select>
        </div>
        
        <div class="overflow-hidden rounded-xl border border-border bg-card">
          {#each filteredMembers as member}
            <div class="flex items-center justify-between border-b border-border px-4 py-3 last:border-b-0 hover:bg-accent/50">
              <div>
                <span class="font-semibold">{member.lastName}, {member.firstName}</span>
                <span class="ml-2 text-sm text-muted-foreground">({getGroupName(member.groupId)})</span>
              </div>
              <button onclick={() => deleteMember(member._id)} class="text-destructive hover:text-destructive/80">
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
          {:else}
            <p class="py-8 text-center text-muted-foreground">No members found</p>
          {/each}
        </div>
        
      {:else if activeTab === 'results'}
        <h1 class="mb-6 text-2xl font-bold">Results</h1>
        {#if !selectedTournament}
          <p class="text-muted-foreground">No tournament selected</p>
        {:else if matches.length === 0}
          <p class="text-muted-foreground">No matches in this tournament</p>
        {:else}
          <div class="space-y-4">
            {#each groups as group}
              {@const gm = matches.filter(m => m.groupId === group.groupId)}
              {@const done = gm.filter(m => m.status === 'completed')}
              {#if gm.length > 0}
                <div class="rounded-xl border border-border bg-card p-4">
                  <h3 class="mb-3 font-bold">{group.name} <span class="ml-2 text-sm font-normal text-muted-foreground">({done.length}/{gm.length})</span></h3>
                  <div class="space-y-2">
                    {#each done as match}
                      {@const p1Win = match.winner === match.player1Id}
                      <div class="flex items-center gap-2 rounded bg-background px-2 py-1 text-sm">
                        <span class={p1Win ? "font-semibold text-green-400" : ""}>{getMemberName(match.player1Id)}{p1Win ? ' 🏆' : ''}</span>
                        <span class="text-muted-foreground">{match.player1Score?.length || 0} - {match.player2Score?.length || 0}</span>
                        <span class={!p1Win && match.winner ? "font-semibold text-green-400" : ""}>{!p1Win && match.winner ? '🏆 ' : ''}{getMemberName(match.player2Id)}</span>
                      </div>
                    {:else}
                      <p class="text-sm text-muted-foreground">No completed matches</p>
                    {/each}
                  </div>
                </div>
              {/if}
            {/each}
          </div>
        {/if}
      {/if}
    </div>
  </main>
</div>

<!-- Dialogs using shadcn-svelte -->

<!-- Add Group Dialog -->
<Dialog.Root bind:open={showAddGroup}>
  <Dialog.Content class="sm:max-w-sm">
    <Dialog.Header>
      <Dialog.Title>Add Group</Dialog.Title>
    </Dialog.Header>
    <div class="space-y-4 py-4">
      <div class="space-y-2">
        <Label for="group-id">Group ID</Label>
        <Input id="group-id" bind:value={newGroup.id} placeholder="e.g., YUD, MUD, G1" />
      </div>
      <div class="space-y-2">
        <Label for="group-name">Group Name</Label>
        <Input id="group-name" bind:value={newGroup.name} placeholder="e.g., Youth Division" />
      </div>
      <div class="flex items-center space-x-2">
        <Checkbox id="group-hantei" bind:checked={newGroup.isHantei} />
        <Label for="group-hantei" class="cursor-pointer">Hantei (judgment-based)</Label>
      </div>
    </div>
    <Dialog.Footer>
      <Button variant="secondary" onclick={() => showAddGroup = false}>Cancel</Button>
      <Button onclick={createGroup}>Create</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- Edit Group Dialog -->
<Dialog.Root bind:open={showEditGroup}>
  <Dialog.Content class="sm:max-w-sm">
    <Dialog.Header>
      <Dialog.Title>Edit Group</Dialog.Title>
    </Dialog.Header>
    {#if editingGroup}
      <div class="space-y-4 py-4">
        <div class="space-y-2">
          <Label for="edit-group-id">Group ID</Label>
          <Input id="edit-group-id" bind:value={editingGroup.groupId} />
        </div>
        <div class="space-y-2">
          <Label for="edit-group-name">Group Name</Label>
          <Input id="edit-group-name" bind:value={editingGroup.name} />
        </div>
        <div class="flex items-center space-x-2">
          <Checkbox id="edit-group-hantei" bind:checked={editingGroup.isHantei} />
          <Label for="edit-group-hantei" class="cursor-pointer">Hantei</Label>
        </div>
      </div>
    {/if}
    <Dialog.Footer>
      <Button variant="secondary" onclick={() => showEditGroup = false}>Cancel</Button>
      <Button onclick={updateGroup}>Save</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- Add Member Dialog -->
<Dialog.Root bind:open={showAddMember}>
  <Dialog.Content class="sm:max-w-sm">
    <Dialog.Header>
      <Dialog.Title>Add Member</Dialog.Title>
    </Dialog.Header>
    <div class="space-y-4 py-4">
      <div class="space-y-2">
        <Label for="member-first">First Name</Label>
        <Input id="member-first" bind:value={newMember.firstName} placeholder="John" />
      </div>
      <div class="space-y-2">
        <Label for="member-last">Last Name</Label>
        <Input id="member-last" bind:value={newMember.lastName} placeholder="Doe" />
      </div>
      <div class="space-y-2">
        <Label for="member-group">Group</Label>
        <select id="member-group" bind:value={newMember.groupId} class="w-full rounded-lg border border-input bg-background px-4 py-2">
          <option value="">Select Group</option>
          {#each groups as g}<option value={g.groupId}>{g.name}</option>{/each}
        </select>
      </div>
    </div>
    <Dialog.Footer>
      <Button variant="secondary" onclick={() => showAddMember = false}>Cancel</Button>
      <Button onclick={createMember}>Add</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- Mass Add Members Dialog -->
<Dialog.Root bind:open={showMassAddMembers}>
  <Dialog.Content class="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
    <Dialog.Header>
      <Dialog.Title>Add Multiple Members</Dialog.Title>
      <Dialog.Description>Fill in the rows below. Empty rows will be skipped.</Dialog.Description>
    </Dialog.Header>
    
    <div class="py-4">
      <!-- Header -->
      <div class="mb-2 grid grid-cols-[1fr_1fr_1fr_40px] gap-2 text-sm font-medium text-muted-foreground">
        <span>First Name</span>
        <span>Last Name</span>
        <span>Group</span>
        <span></span>
      </div>
      
      <!-- Rows -->
      <div class="space-y-2">
        {#each massMembers as member, i}
          <div class="grid grid-cols-[1fr_1fr_1fr_40px] gap-2">
            <Input bind:value={member.firstName} placeholder="First Name" />
            <Input bind:value={member.lastName} placeholder="Last Name" />
            <select 
              bind:value={member.groupId}
              class="rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select Group</option>
              {#each groups as g}<option value={g.groupId}>{g.name}</option>{/each}
            </select>
            <button 
              onclick={() => massMembers = massMembers.filter((_, idx) => idx !== i)}
              class="flex items-center justify-center text-muted-foreground hover:text-destructive"
              title="Remove row"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
        {/each}
      </div>
      
      <button 
        onclick={addMoreRows}
        class="mt-4 flex items-center gap-2 text-sm text-primary hover:text-primary/80"
      >
        <Plus class="h-4 w-4" /> Add 5 more rows
      </button>
    </div>
    
    <Dialog.Footer>
      <Button variant="secondary" onclick={() => showMassAddMembers = false}>Cancel</Button>
      <Button onclick={createMassMembers}>
        Add Members ({massMembers.filter(m => m.firstName.trim() && m.lastName.trim() && m.groupId).length})
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- Import CSV Dialog -->
<Dialog.Root bind:open={showImportCSV}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>Import CSV</Dialog.Title>
      <Dialog.Description>Format: FirstName,LastName,GroupID (one per line)</Dialog.Description>
    </Dialog.Header>
    <div class="py-4">
      <textarea 
        bind:value={csvText} 
        placeholder="John,Doe,YUD&#10;Jane,Smith,MUD" 
        rows="8" 
        class="w-full rounded-lg border border-input bg-background px-4 py-2 font-mono text-sm focus:border-primary focus:outline-none"
      ></textarea>
    </div>
    <Dialog.Footer>
      <Button variant="secondary" onclick={() => showImportCSV = false}>Cancel</Button>
      <Button onclick={importCSV}>Import</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- Create Tournament Dialog -->
<Dialog.Root bind:open={showCreateTournament}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>Create Tournament</Dialog.Title>
    </Dialog.Header>
    <div class="space-y-4 py-4">
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label for="tournament-month">Month</Label>
          <select id="tournament-month" bind:value={newTournament.month} class="w-full rounded-lg border border-input bg-background px-4 py-2">
            <option value="">Select</option>
            {#each MONTHS as month}<option value={month}>{month}</option>{/each}
          </select>
        </div>
        <div class="space-y-2">
          <Label for="tournament-year">Year</Label>
          <select id="tournament-year" bind:value={newTournament.year} class="w-full rounded-lg border border-input bg-background px-4 py-2">
            {#each [2024, 2025, 2026, 2027] as year}<option value={year}>{year}</option>{/each}
          </select>
        </div>
      </div>
      <div class="space-y-2">
        <Label for="tournament-name">Name <span class="text-xs text-muted-foreground">(optional)</span></Label>
        <Input id="tournament-name" bind:value={newTournament.name} placeholder={generateTournamentName()} />
      </div>
      <div class="space-y-2">
        <Label for="tournament-date">Date</Label>
        <Input id="tournament-date" type="date" bind:value={newTournament.date} />
      </div>
    </div>
    <Dialog.Footer>
      <Button variant="secondary" onclick={() => showCreateTournament = false}>Cancel</Button>
      <Button onclick={createTournament}>Create</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
