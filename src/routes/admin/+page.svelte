<script lang="ts">
  import { useQuery, useConvexClient } from 'convex-svelte';
  import { api } from '../../convex/_generated/api';
  import { cn } from '$lib/utils';
  import { slide, fade } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { quintOut } from 'svelte/easing';
  import { toast } from 'svelte-sonner';
  import { SvelteMap } from 'svelte/reactivity';
  import autoAnimate from '@formkit/auto-animate';
  import { 
    LayoutDashboard, Users, FolderOpen, Trophy, ClipboardList, 
    ChevronLeft, ChevronDown, ChevronRight, Swords, Eye, Menu, Plus, Trash2, Pencil,
    Play, Settings, RefreshCw, RotateCcw, Archive, GripVertical, Timer, 
    Check, X, AlertTriangle, History, UserPlus
  } from 'lucide-svelte';
  
  // shadcn-svelte components
  import * as Dialog from '$lib/components/ui/dialog';
  import * as Collapsible from '$lib/components/ui/collapsible';
  import * as Select from '$lib/components/ui/select';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import { Badge } from '$lib/components/ui/badge';
  import { Progress } from '$lib/components/ui/progress';
  import * as Card from '$lib/components/ui/card';
  import { Switch } from '$lib/components/ui/switch';
  import { Separator } from '$lib/components/ui/separator';
  
  // Convex client for mutations
  const client = useConvexClient();
  
  // Real-time subscriptions
  const groupsQuery = useQuery(api.groups.list, () => ({}));
  const membersQuery = useQuery(api.members.list, () => ({}));
  const tournamentsQuery = useQuery(api.tournaments.list, () => ({}));
  
  // Reactive data from queries
  let groups = $derived(groupsQuery.data ?? []);
  let members = $derived(membersQuery.data ?? []);
  let tournaments = $derived(tournamentsQuery.data ?? []);
  let loading = $derived(groupsQuery.isLoading || membersQuery.isLoading || tournamentsQuery.isLoading);
  
  // State
  let activeTab = $state('dashboard');
  let sidebarOpen = $state(false);
  let sidebarCollapsed = $state(false);
  let expandedNavGroups = $state<Set<string>>(new Set(['roster', 'shiai']));
  
  // Modal states
  let showAddGroup = $state(false);
  let showEditGroup = $state(false);
  let showAddMember = $state(false);
  let showMassAddMembers = $state(false);
  let showImportCSV = $state(false);
  let showCreateTournament = $state(false);
  let showDeleteConfirm = $state(false);
  
  let editingGroup = $state<any>(null);
  let newGroup = $state({ id: '', name: '', isHantei: false });
  let newMember = $state({ firstName: '', lastName: '', groupId: '' });
  let csvText = $state('');
  let newTournament = $state({ name: '', date: '', month: '', year: new Date().getFullYear() });
  let selectedTournamentId = $state<string | null>(null);
  
  // Tournament-specific queries
  const participantsQuery = useQuery(
    api.participants.list, 
    () => selectedTournamentId ? { tournamentId: selectedTournamentId } : 'skip'
  );
  const matchesQuery = useQuery(
    api.matches.getByTournament,
    () => selectedTournamentId ? { tournamentId: selectedTournamentId } : 'skip'
  );
  
  let participants = $derived(participantsQuery.data ?? []);
  let matches = $derived(matchesQuery.data ?? []);
  
  // Tournament tab state
  let editTournamentOpen = $state(true);
  let collapsedGroups = $state<Set<string>>(new Set());
  
  // Drag and drop state
  let draggedGroupId = $state<string | null>(null);
  let dragOverGroupId = $state<string | null>(null);
  
  // Group order for tournament (local state, synced from matches)
  let groupOrder = $state<string[]>([]);
  
  // Bogu settings
  let boguTimerDuration = $state(180);
  let boguMatchType = $state<'sanbon' | 'ippon'>('sanbon');
  
  // Non-bogu (Hantei) settings - kihon-waza combos
  const KIHON_WAZA_OPTIONS = [
    { id: 'M', label: 'Men', short: 'M' },
    { id: 'K', label: 'Kote', short: 'K' },
    { id: 'D', label: 'Do', short: 'D' },
    { id: 'KM', label: 'Kote-Men', short: 'KM' },
    { id: 'MKD', label: 'Men-Kaeshi-Do', short: 'MKD' },
  ];
  
  let hanteiRound1 = $state<string[]>(['K', 'M']); // 2 combos for round 1
  let hanteiRound2 = $state<string[]>(['M', 'K', 'D']); // 3 combos for round 2
  
  // Mass member creation
  type MemberRow = { firstName: string; lastName: string; groupId: string };
  let massMembers = $state<MemberRow[]>(
    Array(5).fill(null).map(() => ({ firstName: '', lastName: '', groupId: '' }))
  );
  
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const TIMER_OPTIONS = [60, 120, 180]; // Only up to 3 minutes
  
  // Derived values
  let activeTournament = $derived(tournaments.find(t => t.status === 'in_progress') || null);
  let selectedTournament = $derived(tournaments.find(t => t._id === selectedTournamentId) || activeTournament || tournaments[0] || null);
  
  let pendingMatches = $derived(matches.filter(m => m.status === 'pending'));
  let inProgressMatches = $derived(matches.filter(m => m.status === 'in_progress'));
  let completedMatches = $derived(matches.filter(m => m.status === 'completed'));
  let courtAMatches = $derived(matches.filter(m => m.court === 'A' || m.court === 'A+B'));
  let courtBMatches = $derived(matches.filter(m => m.court === 'B' || m.court === 'A+B'));
  
  let progressPercent = $derived(matches.length > 0 ? Math.round((completedMatches.length / matches.length) * 100) : 0);
  let isComplete = $derived(matches.length > 0 && completedMatches.length === matches.length);
  
  // Build a reactive map of group courts from matches
  let groupCourtMap = $derived.by(() => {
    const map = new Map<string, 'A' | 'B' | 'A+B'>();
    for (const match of matches) {
      if (!map.has(match.groupId)) {
        map.set(match.groupId, match.court as 'A' | 'B' | 'A+B');
      }
    }
    return map;
  });
  
  // Local overrides for optimistic UI updates (SvelteMap is reactive)
  let localCourtOverrides = new SvelteMap<string, 'A' | 'B' | 'A+B'>();
  
  // Get effective court (local override takes precedence)
  function getEffectiveCourt(groupId: string): 'A' | 'B' | 'A+B' {
    return localCourtOverrides.get(groupId) || groupCourtMap.get(groupId) || 'A';
  }
  
  // Clear local override when real data syncs
  $effect(() => {
    for (const [groupId, localCourt] of localCourtOverrides) {
      const realCourt = groupCourtMap.get(groupId);
      if (realCourt === localCourt) {
        localCourtOverrides.delete(groupId);
      }
    }
  });
  
  // Separate bogu and hantei groups
  let boguGroups = $derived(groupOrder.filter(gId => {
    const g = groups.find(gr => gr.groupId === gId);
    return g && !g.isHantei;
  }));
  
  let hanteiGroups = $derived(groupOrder.filter(gId => {
    const g = groups.find(gr => gr.groupId === gId);
    return g && g.isHantei;
  }));
  
  // Auto-select tournament
  $effect(() => {
    if (tournaments.length > 0 && !selectedTournamentId) {
      const active = tournaments.find(t => t.status === 'in_progress');
      selectedTournamentId = active?._id ?? tournaments[0]._id;
    }
  });
  
  // Update group order from matches
  $effect(() => {
    if (matches.length > 0) {
      const uniqueGroups = [...new Set(matches.map(m => m.groupId))];
      groupOrder = uniqueGroups;
    }
  });
  
  // Sync bogu settings from first bogu match
  $effect(() => {
    const firstBoguMatch = matches.find(m => m.matchType !== 'hantei');
    if (firstBoguMatch) {
      boguTimerDuration = firstBoguMatch.timerDuration || 180;
      boguMatchType = (firstBoguMatch.matchType as 'sanbon' | 'ippon') || 'sanbon';
    }
  });
  
  // Navigation
  const navItems = [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }];
  const navGroups = [
    { id: 'roster', label: 'Roster', items: [
      { id: 'members', label: 'Members', icon: Users },
      { id: 'groups', label: 'Groups', icon: FolderOpen },
    ]},
    { id: 'shiai', label: 'Shiai', items: [
      { id: 'tournament', label: 'Tournament', icon: Trophy },
      { id: 'results', label: 'Results', icon: ClipboardList },
      { id: 'history', label: 'History', icon: History },
    ]}
  ];
  
  // Filters
  let searchQuery = $state('');
  let filterGroup = $state('all');
  
  let filteredMembers = $derived(
    members
      .filter(m => {
        const matchesSearch = `${m.firstName} ${m.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesGroup = filterGroup === 'all' || m.groupId === filterGroup;
        return matchesSearch && matchesGroup;
      })
      .sort((a, b) => a.lastName.localeCompare(b.lastName))
  );
  
  function toggleNavGroup(groupId: string) {
    const newSet = new Set(expandedNavGroups);
    newSet.has(groupId) ? newSet.delete(groupId) : newSet.add(groupId);
    expandedNavGroups = newSet;
  }
  
  function toggleGroupCollapse(groupId: string) {
    const newSet = new Set(collapsedGroups);
    newSet.has(groupId) ? newSet.delete(groupId) : newSet.add(groupId);
    collapsedGroups = newSet;
  }
  
  // Helper functions
  function getGroupName(groupId: string): string { 
    return groups.find(g => g.groupId === groupId)?.name || groupId; 
  }
  
  function getGroupById(groupId: string) {
    return groups.find(g => g.groupId === groupId);
  }
  
  function getMemberName(memberId: string): string { 
    const m = members.find(mem => mem._id === memberId); 
    return m ? `${m.firstName} ${m.lastName.charAt(0)}.` : 'Unknown'; 
  }
  
  function getMemberById(memberId: string) {
    return members.find(m => m._id === memberId);
  }
  
  function formatTimer(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  function generateTournamentName(): string {
    const month = newTournament.month || MONTHS[new Date().getMonth()];
    const year = newTournament.year || new Date().getFullYear();
    return `Renbu Monthly Shiai - ${month} ${year}`;
  }
  
  function addMoreRows() {
    massMembers = [...massMembers, ...Array(5).fill(null).map(() => ({ firstName: '', lastName: '', groupId: '' }))];
  }
  
  function resetMassMembers() {
    massMembers = Array(5).fill(null).map(() => ({ firstName: '', lastName: '', groupId: '' }));
  }
  
  // CRUD Operations
  async function createGroup() {
    if (!newGroup.id || !newGroup.name) return;
    try {
      await client.mutation(api.groups.create, { groupId: newGroup.id, name: newGroup.name, isHantei: newGroup.isHantei });
      newGroup = { id: '', name: '', isHantei: false };
      showAddGroup = false;
      toast.success('Group created');
    } catch (e) { toast.error('Failed to create group'); }
  }
  
  async function updateGroup() {
    if (!editingGroup) return;
    try {
      await client.mutation(api.groups.update, { id: editingGroup._id, groupId: editingGroup.groupId, name: editingGroup.name, isHantei: editingGroup.isHantei });
      showEditGroup = false;
      toast.success('Group updated');
    } catch (e) { toast.error('Failed to update group'); }
  }
  
  async function deleteGroup(id: any) {
    if (!confirm('Delete this group?')) return;
    try {
      await client.mutation(api.groups.remove, { id });
      toast.success('Group deleted');
    } catch (e) { toast.error('Failed to delete group'); }
  }
  
  async function createMember() {
    if (!newMember.firstName || !newMember.lastName || !newMember.groupId) return;
    try {
      await client.mutation(api.members.create, { firstName: newMember.firstName, lastName: newMember.lastName, groupId: newMember.groupId, isGuest: false });
      newMember = { firstName: '', lastName: '', groupId: '' };
      showAddMember = false;
      toast.success('Member added');
    } catch (e) { toast.error('Failed to create member'); }
  }
  
  async function createMassMembers() {
    const validMembers = massMembers.filter(m => m.firstName.trim() && m.lastName.trim() && m.groupId);
    if (validMembers.length === 0) { toast.error('Please fill in at least one complete row'); return; }
    try {
      await client.mutation(api.members.bulkCreate, { members: validMembers.map(m => ({ firstName: m.firstName.trim(), lastName: m.lastName.trim(), groupId: m.groupId, isGuest: false })) });
      resetMassMembers();
      showMassAddMembers = false;
      toast.success(`Added ${validMembers.length} member${validMembers.length > 1 ? 's' : ''}`);
    } catch (e) { toast.error('Failed to create members'); }
  }
  
  async function deleteMember(id: any) {
    if (!confirm('Remove this member?')) return;
    try {
      await client.mutation(api.members.remove, { id });
      toast.success('Member removed');
    } catch (e) { toast.error('Failed to delete member'); }
  }
  
  async function importCSV() {
    const lines = csvText.trim().split('\n').filter(l => l.trim());
    const toAdd = lines.map(line => {
      const [firstName, lastName, groupId] = line.split(',').map(s => s.trim());
      return firstName && lastName && groupId ? { firstName, lastName, groupId, isGuest: false } : null;
    }).filter(Boolean);
    if (toAdd.length === 0) { toast.error('No valid rows. Format: FirstName,LastName,GroupID'); return; }
    try {
      await client.mutation(api.members.bulkCreate, { members: toAdd });
      csvText = '';
      showImportCSV = false;
      toast.success(`Imported ${toAdd.length} members`);
    } catch (e) { toast.error('Import failed'); }
  }
  
  // Tournament Operations
  async function createTournament() {
    if (!newTournament.date) { toast.error('Please select a date'); return; }
    try {
      const id = await client.mutation(api.tournaments.create, { name: newTournament.name || generateTournamentName(), date: newTournament.date });
      newTournament = { name: '', date: '', month: '', year: new Date().getFullYear() };
      showCreateTournament = false;
      selectedTournamentId = id;
      toast.success('Tournament created');
    } catch (e) { toast.error('Failed to create tournament'); }
  }
  
  async function startTournament() {
    if (!selectedTournament) return;
    try {
      await client.mutation(api.tournaments.start, { id: selectedTournament._id });
      toast.success('Tournament started!');
    } catch (e) { toast.error('Failed to start tournament'); }
  }
  
  async function completeTournament() {
    if (!selectedTournament) return;
    try {
      await client.mutation(api.tournaments.complete, { id: selectedTournament._id });
      toast.success('Tournament archived!');
    } catch (e) { toast.error('Failed to archive tournament'); }
  }
  
  async function deleteTournament() {
    if (!selectedTournament) return;
    try {
      await client.mutation(api.tournaments.remove, { id: selectedTournament._id });
      selectedTournamentId = null;
      showDeleteConfirm = false;
      toast.success('Tournament deleted');
    } catch (e) { toast.error('Failed to delete tournament'); }
  }
  
  async function addAllParticipants() {
    if (!selectedTournament) return;
    try {
      const result = await client.mutation(api.participants.addAllMembers, { tournamentId: selectedTournament._id });
      toast.success(`Added ${result.addedCount} participants`);
    } catch (e) { toast.error('Failed to add participants'); }
  }
  
  async function generateMatches() {
    if (!selectedTournament) return;
    try {
      const result = await client.mutation(api.tournaments.generateMatches, { tournamentId: selectedTournament._id });
      toast.success(`Generated ${result.matchCount} matches`);
    } catch (e) { toast.error('Failed to generate matches'); }
  }
  
  async function refreshParticipants() {
    if (!selectedTournament) return;
    try {
      const result = await client.mutation(api.tournaments.refreshParticipants, { tournamentId: selectedTournament._id });
      toast.success(`Added ${result.addedCount} new matches`);
    } catch (e) { toast.error('Failed to refresh participants'); }
  }
  
  async function resetTournament() {
    if (!selectedTournament) return;
    if (!confirm('Reset all matches to pending? This will clear all scores.')) return;
    try {
      const result = await client.mutation(api.tournaments.reset, { tournamentId: selectedTournament._id });
      toast.success(`Reset ${result.resetCount} matches`);
    } catch (e) { toast.error('Failed to reset tournament'); }
  }
  
  async function setGroupCourt(groupId: string, court: 'A' | 'B' | 'A+B') {
    if (!selectedTournament) return;
    // Optimistic update - set local override immediately
    localCourtOverrides.set(groupId, court);
    try {
      await client.mutation(api.matches.setGroupCourt, { 
        tournamentId: selectedTournament._id, 
        groupId, 
        court 
      });
      toast.success(`${getGroupName(groupId)} → Court ${court}`);
    } catch (e) { 
      // Revert optimistic update on error
      localCourtOverrides.delete(groupId);
      toast.error('Failed to set court'); 
    }
  }
  
  async function applyBoguSettings() {
    if (!selectedTournament) return;
    try {
      // Apply to all bogu groups
      for (const groupId of boguGroups) {
        await client.mutation(api.matches.setGroupTimer, { 
          tournamentId: selectedTournament._id, 
          groupId, 
          timerDuration: boguTimerDuration 
        });
        await client.mutation(api.matches.setGroupMatchType, { 
          tournamentId: selectedTournament._id, 
          groupId, 
          matchType: boguMatchType 
        });
      }
      toast.success('Bogu settings applied');
    } catch (e) { toast.error('Failed to apply settings'); }
  }
  
  async function applyHanteiSettings() {
    if (!selectedTournament) return;
    try {
      // Update tournament hantei config
      await client.mutation(api.tournaments.update, { 
        id: selectedTournament._id,
        hanteiConfig: {
          round1: hanteiRound1.join('-'),
          round2: hanteiRound2.join('-'),
        }
      });
      toast.success('Hantei settings applied');
    } catch (e) { toast.error('Failed to apply settings'); }
  }
  
  // Drag and Drop handlers
  function handleDragStart(e: DragEvent, groupId: string) {
    draggedGroupId = groupId;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', groupId);
    }
  }
  
  function handleDragOver(e: DragEvent, groupId: string) {
    e.preventDefault();
    if (draggedGroupId && draggedGroupId !== groupId) {
      dragOverGroupId = groupId;
    }
  }
  
  function handleDragLeave() {
    dragOverGroupId = null;
  }
  
  function handleDrop(e: DragEvent, targetGroupId: string) {
    e.preventDefault();
    if (draggedGroupId && draggedGroupId !== targetGroupId) {
      const oldIndex = groupOrder.indexOf(draggedGroupId);
      const newIndex = groupOrder.indexOf(targetGroupId);
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = [...groupOrder];
        newOrder.splice(oldIndex, 1);
        newOrder.splice(newIndex, 0, draggedGroupId);
        groupOrder = newOrder;
      }
    }
    draggedGroupId = null;
    dragOverGroupId = null;
  }
  
  function handleDragEnd() {
    draggedGroupId = null;
    dragOverGroupId = null;
  }
</script>

<svelte:head><title>Admin - 試合場 Shiaijo</title></svelte:head>

<div class="flex min-h-screen bg-background overflow-x-hidden">
  <!-- Desktop Sidebar -->
  <aside class={cn("hidden md:flex flex-col fixed inset-y-0 left-0 z-20 border-r border-sidebar-border bg-sidebar transition-all duration-300", sidebarCollapsed ? "w-[72px]" : "w-52")}>
    <div class="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
      <img src="/shiaijologo.png" alt="Shiaijo" class="h-10 w-10 shrink-0 object-contain" />
      {#if !sidebarCollapsed}<span class="font-jp text-xl text-foreground">試合場</span>{/if}
    </div>
    <button onclick={() => sidebarCollapsed = !sidebarCollapsed} class="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-sidebar-border bg-sidebar hover:bg-sidebar-accent">
      <ChevronLeft class={cn("h-4 w-4 text-sidebar-foreground transition-transform", sidebarCollapsed && "rotate-180")} />
    </button>
    <nav class="flex-1 overflow-y-auto py-4">
      {#each navItems as item}
        <button onclick={() => activeTab = item.id} title={sidebarCollapsed ? item.label : undefined} class={cn("flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-colors", sidebarCollapsed && "justify-center px-0", activeTab === item.id ? "border-l-2 border-sidebar-primary bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground hover:bg-sidebar-accent")}>
          <div class={cn("flex h-7 w-7 items-center justify-center rounded-md", activeTab === item.id ? "bg-sidebar-primary/20" : "bg-sidebar-accent")}><svelte:component this={item.icon} class="h-4 w-4" /></div>
          {#if !sidebarCollapsed}<span>{item.label}</span>{/if}
        </button>
      {/each}
      {#each navGroups as group}
        <div class="mt-2">
          {#if !sidebarCollapsed}
            <button onclick={() => toggleNavGroup(group.id)} class="flex w-full items-center gap-2 px-3 py-1.5 text-[10px] uppercase tracking-wider text-sidebar-foreground/60 hover:text-sidebar-foreground">
              <ChevronDown class={cn("h-3 w-3 transition-transform", !expandedNavGroups.has(group.id) && "-rotate-90")} />{group.label}
            </button>
          {/if}
          {#if sidebarCollapsed || expandedNavGroups.has(group.id)}
            {#each group.items as item}
              <button onclick={() => activeTab = item.id} title={sidebarCollapsed ? item.label : undefined} class={cn("flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-colors", sidebarCollapsed && "justify-center px-0", activeTab === item.id ? "border-l-2 border-sidebar-primary bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground hover:bg-sidebar-accent")}>
                <div class={cn("flex h-7 w-7 items-center justify-center rounded-md", activeTab === item.id ? "bg-sidebar-primary/20" : "bg-sidebar-accent")}><svelte:component this={item.icon} class="h-4 w-4" /></div>
                {#if !sidebarCollapsed}<span>{item.label}</span>{#if item.id === 'tournament' && activeTournament}<span class="ml-auto rounded-full border border-green-500/30 bg-green-500/20 px-1.5 py-0.5 text-[10px] text-green-400">Live</span>{/if}{/if}
              </button>
            {/each}
          {/if}
        </div>
      {/each}
    </nav>
    <div class="border-t border-sidebar-border p-3">
      {#if !sidebarCollapsed}<p class="mb-2 px-1 text-[10px] uppercase tracking-wider text-sidebar-foreground/60">Switch Portal</p>{/if}
      <div class={cn("flex gap-2", sidebarCollapsed ? "flex-col items-center" : "flex-col")}>
        <a href="/courtkeeper" class={cn("flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-900/50 to-sky-800/30 text-sky-300 transition-colors hover:from-sky-900/70", sidebarCollapsed ? "h-10 w-10 justify-center" : "px-3 py-2 text-sm")}><Swords class="h-4 w-4" />{#if !sidebarCollapsed}<span>Courtkeeper</span>{/if}</a>
        <a href="/spectator" class={cn("flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-900/50 to-emerald-800/30 text-emerald-300 transition-colors hover:from-emerald-900/70", sidebarCollapsed ? "h-10 w-10 justify-center" : "px-3 py-2 text-sm")}><Eye class="h-4 w-4" />{#if !sidebarCollapsed}<span>Spectator</span>{/if}</a>
      </div>
    </div>
  </aside>
  
  <!-- Mobile Header -->
  <header class="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background px-4 md:hidden">
    <button onclick={() => sidebarOpen = true} class="rounded-lg p-2 hover:bg-accent"><Menu class="h-5 w-5" /></button>
    <div class="flex items-center gap-2"><img src="/shiaijologo.png" alt="Shiaijo" class="h-8 w-8 object-contain" /><span class="font-jp">試合場</span></div>
    <div class="w-10"></div>
  </header>
  
  <!-- Mobile Sidebar Overlay -->
  {#if sidebarOpen}
    <div class="fixed inset-0 z-40 bg-black/50 md:hidden" onclick={() => sidebarOpen = false} transition:fade></div>
    <aside class="fixed inset-y-0 left-0 z-50 w-64 border-r border-sidebar-border bg-sidebar md:hidden" transition:slide={{ axis: 'x' }}>
      <div class="flex h-14 items-center gap-3 border-b border-sidebar-border px-4"><img src="/shiaijologo.png" alt="Shiaijo" class="h-10 w-10 object-contain" /><span class="font-jp text-xl">試合場</span></div>
      <nav class="p-2">
        {#each [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }, { id: 'members', label: 'Members', icon: Users }, { id: 'groups', label: 'Groups', icon: FolderOpen }, { id: 'tournament', label: 'Tournament', icon: Trophy }, { id: 'results', label: 'Results', icon: ClipboardList }, { id: 'history', label: 'History', icon: History }] as tab}
          <button onclick={() => { activeTab = tab.id; sidebarOpen = false; }} class={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm", activeTab === tab.id ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground hover:bg-sidebar-accent")}><svelte:component this={tab.icon} class="h-4 w-4" />{tab.label}</button>
        {/each}
      </nav>
      <div class="absolute inset-x-4 bottom-4 flex flex-col gap-2">
        <a href="/courtkeeper" class="flex items-center justify-center gap-2 rounded-lg bg-sky-900/50 py-2 text-sm text-sky-300"><Swords class="h-4 w-4" /> Courtkeeper</a>
        <a href="/spectator" class="flex items-center justify-center gap-2 rounded-lg bg-emerald-900/50 py-2 text-sm text-emerald-300"><Eye class="h-4 w-4" /> Spectator</a>
      </div>
    </aside>
  {/if}
  
  <!-- Main Content -->
  <main class={cn("flex-1 pt-14 transition-all duration-300 md:pt-0 w-full min-w-0 overflow-x-hidden", sidebarCollapsed ? "md:ml-[72px]" : "md:ml-52")}>
    <div class="p-4 sm:p-6 max-w-full overflow-x-hidden">
      {#if loading}
        <div class="space-y-4"><Skeleton class="h-8 w-48" /><div class="grid gap-4 md:grid-cols-3"><Skeleton class="h-24" /><Skeleton class="h-24" /><Skeleton class="h-24" /></div></div>
      
      {:else if activeTab === 'dashboard'}
        <h1 class="mb-6 text-2xl font-bold">Dashboard</h1>
        <div class="mb-6 grid gap-4 grid-cols-2 md:grid-cols-3">
          <div class="rounded-xl border border-border bg-card p-4"><div class="text-2xl sm:text-3xl font-bold text-primary">{members.length}</div><div class="text-xs sm:text-sm text-muted-foreground">Members</div></div>
          <div class="rounded-xl border border-border bg-card p-4"><div class="text-2xl sm:text-3xl font-bold text-blue-400">{groups.length}</div><div class="text-xs sm:text-sm text-muted-foreground">Groups</div></div>
          <div class="rounded-xl border border-border bg-card p-4 col-span-2 md:col-span-1"><div class="text-2xl sm:text-3xl font-bold text-green-400">{tournaments.length}</div><div class="text-xs sm:text-sm text-muted-foreground">Tournaments</div></div>
        </div>
        {#if activeTournament}
          <div class="rounded-xl border border-green-500/50 bg-green-900/20 p-4">
            <div class="mb-2 flex items-center gap-2"><span class="h-2 w-2 animate-pulse rounded-full bg-green-500"></span><h3 class="font-bold text-green-400 truncate">Live: {activeTournament.name}</h3></div>
            <div class="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground"><span>📅 {activeTournament.date}</span><span>⚔️ {completedMatches.length}/{matches.length}</span><span>👥 {participants.length}</span></div>
            <div class="mt-3">
              <Progress value={progressPercent} class="h-2" />
              <p class="mt-1 text-xs text-muted-foreground">{progressPercent}% complete</p>
            </div>
          </div>
        {/if}
      
      {:else if activeTab === 'tournament'}
        <!-- TOURNAMENT TAB -->
        <div class="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 class="text-2xl font-bold">Tournament</h1>
          <Button onclick={() => showCreateTournament = true} class="w-full sm:w-auto"><Plus class="mr-2 h-4 w-4" /> New Tournament</Button>
        </div>
        
        {#if tournaments.length === 0}
          <Card.Root class="border-dashed">
            <Card.Content class="flex flex-col items-center justify-center py-12">
              <Trophy class="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p class="mb-4 text-muted-foreground">No tournaments yet</p>
              <Button onclick={() => showCreateTournament = true}>Create Your First Tournament</Button>
            </Card.Content>
          </Card.Root>
        {:else}
          <!-- Tournament Selector -->
          <div class="mb-6">
            <select 
              value={selectedTournamentId} 
              onchange={(e) => selectedTournamentId = (e.target as HTMLSelectElement).value} 
              class="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm truncate"
            >
              {#each tournaments as t}
                <option value={t._id}>{t.name} - {t.status}</option>
              {/each}
            </select>
          </div>
          
          {#if selectedTournament}
            <!-- Tournament Header Card -->
            <Card.Root class="mb-4">
              <Card.Header class="pb-3">
                <div class="flex flex-col gap-2">
                  <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0 flex-1">
                      <Card.Title class="text-lg sm:text-xl truncate">{selectedTournament.name}</Card.Title>
                      <Card.Description class="text-xs sm:text-sm">📅 {selectedTournament.date}</Card.Description>
                    </div>
                    <Badge class={cn(
                      "text-xs sm:text-sm px-2 sm:px-3 py-1 shrink-0",
                      selectedTournament.status === 'in_progress' ? (isComplete ? "bg-emerald-600" : "bg-amber-500") :
                      selectedTournament.status === 'setup' ? "bg-yellow-600" : "bg-blue-600"
                    )}>
                      {selectedTournament.status === 'setup' ? 'Setup' : 
                       selectedTournament.status === 'in_progress' ? (isComplete ? 'Done' : 'Live') : 
                       'Completed'}
                    </Badge>
                  </div>
                </div>
              </Card.Header>
              <Card.Content class="space-y-4">
                <!-- Progress Bar -->
                <div class="flex items-center gap-3">
                  <div class="flex-1 min-w-0">
                    <Progress value={progressPercent} class={cn("h-2", isComplete ? "bg-emerald-900/30" : "")} />
                  </div>
                  <span class="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                    {completedMatches.length}/{matches.length}
                  </span>
                </div>
                
                <!-- Stats Grid -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div class="rounded-lg bg-muted/50 p-2 sm:p-3 text-center">
                    <div class="text-xl sm:text-2xl font-bold text-primary">{participants.length}</div>
                    <div class="text-[10px] sm:text-xs text-muted-foreground">Participants</div>
                  </div>
                  <div class="rounded-lg bg-muted/50 p-2 sm:p-3 text-center">
                    <div class="text-xl sm:text-2xl font-bold text-blue-400">{matches.length}</div>
                    <div class="text-[10px] sm:text-xs text-muted-foreground">Matches</div>
                  </div>
                  <div class="rounded-lg bg-amber-900/20 border border-amber-700/30 p-2 sm:p-3 text-center">
                    <div class="text-xl sm:text-2xl font-bold text-amber-400">{courtAMatches.length}</div>
                    <div class="text-[10px] sm:text-xs text-muted-foreground">Court A</div>
                  </div>
                  <div class="rounded-lg bg-sky-900/20 border border-sky-700/30 p-2 sm:p-3 text-center">
                    <div class="text-xl sm:text-2xl font-bold text-sky-400">{courtBMatches.length}</div>
                    <div class="text-[10px] sm:text-xs text-muted-foreground">Court B</div>
                  </div>
                </div>
                
                <!-- Action Buttons -->
                <div class="flex flex-wrap gap-2">
                  {#if selectedTournament.status === 'setup'}
                    <Button onclick={addAllParticipants} variant="secondary" size="sm" class="text-xs sm:text-sm">
                      <UserPlus class="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Add Members
                    </Button>
                    <Button onclick={generateMatches} variant="secondary" size="sm" class="text-xs sm:text-sm">
                      <Trophy class="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Generate
                    </Button>
                    {#if matches.length > 0}
                      <Button onclick={startTournament} size="sm" class="bg-emerald-600 hover:bg-emerald-700 text-xs sm:text-sm">
                        <Play class="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Start
                      </Button>
                    {/if}
                  {/if}
                  {#if selectedTournament.status === 'in_progress' && isComplete}
                    <Button onclick={completeTournament} size="sm" class="bg-orange-600 hover:bg-orange-700 text-xs sm:text-sm">
                      <Archive class="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Archive
                    </Button>
                  {/if}
                </div>
              </Card.Content>
            </Card.Root>
            
            <!-- Edit Tournament Section (Collapsible) -->
            <Collapsible.Root bind:open={editTournamentOpen} class="mb-4">
              <Card.Root>
                <Collapsible.Trigger class="w-full">
                  <Card.Header class="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div class="flex items-center justify-between">
                      <Card.Title class="text-sm flex items-center gap-2">
                        <Settings class="h-4 w-4 text-orange-400" />
                        Edit Tournament
                      </Card.Title>
                      <ChevronDown class={cn("h-4 w-4 text-muted-foreground transition-transform", editTournamentOpen && "rotate-180")} />
                    </div>
                  </Card.Header>
                </Collapsible.Trigger>
                <Collapsible.Content>
                  <Card.Content class="space-y-6 pt-0">
                    
                    <!-- 1. GROUP ORDER & COURT ASSIGNMENTS -->
                    <div class="space-y-3">
                      <h4 class="text-sm font-semibold text-foreground flex items-center gap-2">
                        <GripVertical class="h-4 w-4 text-muted-foreground" />
                        Group Order & Courts
                      </h4>
                      <p class="text-xs text-muted-foreground">Drag to reorder. Tap court to change.</p>
                      
                      {#if groupOrder.length > 0}
                        <div class="rounded-lg border border-border overflow-hidden" use:autoAnimate>
                          {#each groupOrder as groupId, idx (groupId)}
                            {@const group = getGroupById(groupId)}
                            {@const court = getEffectiveCourt(groupId)}
                            {@const groupMatches = matches.filter(m => m.groupId === groupId)}
                            {@const completedCount = groupMatches.filter(m => m.status === 'completed').length}
                            
                            <div
                              draggable="true"
                              ondragstart={(e) => handleDragStart(e, groupId)}
                              ondragover={(e) => handleDragOver(e, groupId)}
                              ondragleave={handleDragLeave}
                              ondrop={(e) => handleDrop(e, groupId)}
                              ondragend={handleDragEnd}
                              class={cn(
                                "flex items-center gap-2 px-2 sm:px-3 py-2 border-b border-border last:border-b-0 transition-all",
                                draggedGroupId === groupId && "opacity-50 bg-muted/50",
                                dragOverGroupId === groupId && "bg-primary/10 border-primary"
                              )}
                            >
                              <!-- Drag Handle -->
                              <button class="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing touch-none shrink-0">
                                <GripVertical class="h-4 w-4" />
                              </button>
                              
                              <!-- Order Number -->
                              <span class="w-5 text-center text-xs font-mono text-muted-foreground shrink-0">{idx + 1}</span>
                              
                              <!-- Group Name -->
                              <div class="flex-1 min-w-0 flex items-center gap-1">
                                <span class="font-medium text-sm truncate">
                                  {group?.name || groupId}
                                </span>
                                {#if group?.isHantei}
                                  <Badge variant="outline" class="text-[8px] sm:text-[10px] border-orange-500 text-orange-400 shrink-0 px-1">H</Badge>
                                {/if}
                              </div>
                              
                              <!-- Match Count -->
                              <span class="text-[10px] sm:text-xs text-muted-foreground shrink-0">{completedCount}/{groupMatches.length}</span>
                              
                              <!-- Court Assignment - Compact -->
                              <div class="flex rounded-md border border-input overflow-hidden shrink-0">
                                <button
                                  onclick={() => setGroupCourt(groupId, 'A')}
                                  class={cn(
                                    "px-2 py-1 text-[10px] sm:text-xs font-bold transition-colors",
                                    court === 'A' ? "bg-amber-500 text-black" : "bg-background text-muted-foreground hover:bg-muted"
                                  )}
                                >A</button>
                                <button
                                  onclick={() => setGroupCourt(groupId, 'A+B')}
                                  class={cn(
                                    "px-1.5 sm:px-2 py-1 text-[10px] sm:text-xs font-bold transition-colors border-x border-input",
                                    court === 'A+B' ? "bg-emerald-500 text-white" : "bg-background text-muted-foreground hover:bg-muted"
                                  )}
                                >+</button>
                                <button
                                  onclick={() => setGroupCourt(groupId, 'B')}
                                  class={cn(
                                    "px-2 py-1 text-[10px] sm:text-xs font-bold transition-colors",
                                    court === 'B' ? "bg-sky-500 text-white" : "bg-background text-muted-foreground hover:bg-muted"
                                  )}
                                >B</button>
                              </div>
                            </div>
                          {/each}
                        </div>
                      {:else}
                        <p class="text-sm text-muted-foreground py-4 text-center">No groups yet. Generate matches first.</p>
                      {/if}
                    </div>
                    
                    <Separator />
                    
                    <!-- 2. BOGU MATCHES SETTINGS -->
                    <div class="space-y-3">
                      <h4 class="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Swords class="h-4 w-4 text-blue-400" />
                        Bogu Matches
                      </h4>
                      
                      <div class="space-y-3">
                        <!-- Timer Options -->
                        <div class="space-y-2">
                          <Label class="text-xs text-muted-foreground">Timer</Label>
                          <div class="flex gap-2">
                            {#each TIMER_OPTIONS as secs}
                              <button
                                onclick={() => boguTimerDuration = secs}
                                class={cn(
                                  "flex-1 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all border",
                                  boguTimerDuration === secs 
                                    ? "bg-blue-600 text-white border-blue-600" 
                                    : "bg-background text-muted-foreground border-input hover:bg-muted"
                                )}
                              >
                                {formatTimer(secs)}
                              </button>
                            {/each}
                          </div>
                        </div>
                        
                        <!-- Match Type -->
                        <div class="space-y-2">
                          <Label class="text-xs text-muted-foreground">Match Type</Label>
                          <div class="flex gap-2">
                            <button
                              onclick={() => boguMatchType = 'sanbon'}
                              class={cn(
                                "flex-1 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all border",
                                boguMatchType === 'sanbon' 
                                  ? "bg-blue-600 text-white border-blue-600" 
                                  : "bg-background text-muted-foreground border-input hover:bg-muted"
                              )}
                            >
                              Sanbon
                            </button>
                            <button
                              onclick={() => boguMatchType = 'ippon'}
                              class={cn(
                                "flex-1 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all border",
                                boguMatchType === 'ippon' 
                                  ? "bg-blue-600 text-white border-blue-600" 
                                  : "bg-background text-muted-foreground border-input hover:bg-muted"
                              )}
                            >
                              Ippon
                            </button>
                          </div>
                        </div>
                        
                        <Button onclick={applyBoguSettings} variant="secondary" size="sm" class="w-full sm:w-auto">
                          <Check class="mr-2 h-4 w-4" /> Apply to Bogu
                        </Button>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <!-- 3. NON-BOGU (HANTEI) MATCHES SETTINGS -->
                    <div class="space-y-3">
                      <h4 class="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Users class="h-4 w-4 text-orange-400" />
                        Non-Bogu (Hantei)
                      </h4>
                      <p class="text-xs text-muted-foreground">Kihon-waza for each round.</p>
                      
                      <div class="space-y-3">
                        <!-- Round 1: 2 combos -->
                        <div class="space-y-2">
                          <Label class="text-xs text-muted-foreground">Round 1 (2 waza)</Label>
                          <div class="grid grid-cols-2 gap-2">
                            {#each [0, 1] as i}
                              <select
                                value={hanteiRound1[i] || ''}
                                onchange={(e) => {
                                  const newVal = [...hanteiRound1];
                                  newVal[i] = (e.target as HTMLSelectElement).value;
                                  hanteiRound1 = newVal;
                                }}
                                class="w-full rounded-lg border border-input bg-background px-2 sm:px-3 py-2 text-xs sm:text-sm"
                              >
                                {#each KIHON_WAZA_OPTIONS as opt}
                                  <option value={opt.id}>{opt.short}</option>
                                {/each}
                              </select>
                            {/each}
                          </div>
                        </div>
                        
                        <!-- Round 2: 3 combos -->
                        <div class="space-y-2">
                          <Label class="text-xs text-muted-foreground">Round 2 (3 waza)</Label>
                          <div class="grid grid-cols-3 gap-2">
                            {#each [0, 1, 2] as i}
                              <select
                                value={hanteiRound2[i] || ''}
                                onchange={(e) => {
                                  const newVal = [...hanteiRound2];
                                  newVal[i] = (e.target as HTMLSelectElement).value;
                                  hanteiRound2 = newVal;
                                }}
                                class="w-full rounded-lg border border-input bg-background px-2 sm:px-3 py-2 text-xs sm:text-sm"
                              >
                                {#each KIHON_WAZA_OPTIONS as opt}
                                  <option value={opt.id}>{opt.short}</option>
                                {/each}
                              </select>
                            {/each}
                          </div>
                        </div>
                        
                        <Button onclick={applyHanteiSettings} variant="secondary" size="sm" class="w-full sm:w-auto">
                          <Check class="mr-2 h-4 w-4" /> Apply Hantei
                        </Button>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <!-- 4. ACTIONS -->
                    <div class="space-y-3">
                      <h4 class="text-sm font-semibold text-foreground">Actions</h4>
                      <div class="flex flex-col sm:flex-row flex-wrap gap-2">
                        <Button onclick={refreshParticipants} variant="outline" size="sm" class="w-full sm:w-auto justify-center">
                          <RefreshCw class="mr-2 h-4 w-4" /> Update Participants
                        </Button>
                        <Button onclick={resetTournament} variant="outline" size="sm" class="w-full sm:w-auto justify-center border-amber-700/60 text-amber-400 hover:bg-amber-900/20">
                          <RotateCcw class="mr-2 h-4 w-4" /> Reset Scores
                        </Button>
                        <Button onclick={() => showDeleteConfirm = true} variant="outline" size="sm" class="w-full sm:w-auto justify-center border-red-700/60 text-red-400 hover:bg-red-900/20">
                          <Trash2 class="mr-2 h-4 w-4" /> Delete
                        </Button>
                      </div>
                    </div>
                    
                  </Card.Content>
                </Collapsible.Content>
              </Card.Root>
            </Collapsible.Root>
            
            <!-- Match Queue Display -->
            {#if groupOrder.length > 0 && matches.length > 0}
              <div class="space-y-3">
                <h3 class="text-sm font-semibold text-muted-foreground">Match Queue</h3>
                <div class="space-y-2" use:autoAnimate>
                  {#each groupOrder as groupId (groupId)}
                    {@const group = getGroupById(groupId)}
                    {@const groupMatches = matches.filter(m => m.groupId === groupId)}
                    {@const completedCount = groupMatches.filter(m => m.status === 'completed').length}
                    {@const court = getEffectiveCourt(groupId)}
                    {@const isCollapsed = collapsedGroups.has(groupId)}
                    
                    <div class={cn(
                      "rounded-xl border bg-card overflow-hidden transition-all",
                      court === 'A' ? "border-amber-700/30" : 
                      court === 'B' ? "border-sky-700/30" : 
                      "border-emerald-700/30"
                    )}>
                      <!-- Group Header -->
                      <button
                        onclick={() => toggleGroupCollapse(groupId)}
                        class="w-full flex items-center gap-2 p-3 hover:bg-muted/30 transition-colors"
                      >
                        <ChevronDown class={cn("h-4 w-4 text-muted-foreground transition-transform shrink-0", isCollapsed && "-rotate-90")} />
                        <Badge class={cn(
                          "text-[10px] font-bold shrink-0",
                          court === 'A' ? "bg-amber-500 text-black" :
                          court === 'B' ? "bg-sky-500 text-white" :
                          "bg-emerald-500 text-white"
                        )}>
                          {court === 'A+B' ? 'A+B' : court}
                        </Badge>
                        <span class="font-medium flex-1 text-left truncate min-w-0">{group?.name || groupId}</span>
                        {#if group?.isHantei}
                          <Badge variant="outline" class="text-[10px] border-orange-500 text-orange-400 shrink-0">H</Badge>
                        {/if}
                        <span class="text-xs text-muted-foreground shrink-0">{completedCount}/{groupMatches.length}</span>
                      </button>
                      
                      <!-- Match List -->
                      {#if !isCollapsed}
                        <div class="border-t border-border max-h-48 overflow-y-auto" transition:slide={{ duration: 200 }}>
                          {#each groupMatches as match, idx}
                            {@const p1 = getMemberById(match.player1Id)}
                            {@const p2 = getMemberById(match.player2Id)}
                            {@const isWinner1 = match.winner === match.player1Id}
                            {@const isWinner2 = match.winner === match.player2Id}
                            <div class={cn(
                              "flex items-center gap-2 px-3 py-2 text-sm border-b border-border last:border-b-0",
                              match.status === 'completed' ? "bg-muted/30" : 
                              match.status === 'in_progress' ? "bg-amber-500/10" : ""
                            )}>
                              <span class="w-5 text-xs text-muted-foreground text-center shrink-0">{idx + 1}</span>
                              <span class={cn("flex-1 truncate min-w-0 text-xs sm:text-sm", isWinner1 && "text-green-400 font-semibold")}>
                                {p1?.firstName} {p1?.lastName.charAt(0)}.
                              </span>
                              <span class="text-[10px] text-muted-foreground shrink-0">vs</span>
                              <span class={cn("flex-1 truncate text-right min-w-0 text-xs sm:text-sm", isWinner2 && "text-green-400 font-semibold")}>
                                {p2?.firstName} {p2?.lastName.charAt(0)}.
                              </span>
                              {#if match.status === 'completed'}
                                <Check class="h-3.5 w-3.5 text-green-500 shrink-0" />
                              {:else if match.status === 'in_progress'}
                                <span class="h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
                              {:else}
                                <span class="h-2 w-2 rounded-full bg-muted-foreground/30 shrink-0"></span>
                              {/if}
                            </div>
                          {:else}
                            <p class="py-4 text-center text-sm text-muted-foreground">No matches</p>
                          {/each}
                        </div>
                      {/if}
                    </div>
                  {/each}
                </div>
              </div>
            {:else if matches.length === 0 && participants.length === 0}
              <Card.Root class="border-dashed">
                <Card.Content class="flex flex-col items-center justify-center py-12">
                  <Users class="mb-4 h-12 w-12 text-muted-foreground/50" />
                  <p class="mb-2 text-muted-foreground text-center">No participants yet</p>
                  <Button onclick={addAllParticipants} variant="secondary">
                    <UserPlus class="mr-2 h-4 w-4" /> Add All Members
                  </Button>
                </Card.Content>
              </Card.Root>
            {:else if matches.length === 0}
              <Card.Root class="border-dashed">
                <Card.Content class="flex flex-col items-center justify-center py-12">
                  <Trophy class="mb-4 h-12 w-12 text-muted-foreground/50" />
                  <p class="mb-2 text-muted-foreground">{participants.length} participants ready</p>
                  <Button onclick={generateMatches}>
                    <Trophy class="mr-2 h-4 w-4" /> Generate Matches
                  </Button>
                </Card.Content>
              </Card.Root>
            {/if}
          {/if}
        {/if}
      
      {:else if activeTab === 'members'}
        <div class="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 class="text-2xl font-bold">Members ({members.length})</h1>
          <div class="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onclick={() => showImportCSV = true} class="text-xs">CSV</Button>
            <Button variant="secondary" size="sm" onclick={() => { resetMassMembers(); showMassAddMembers = true; }} class="bg-blue-600 hover:bg-blue-700 text-white text-xs"><Users class="mr-1 h-3 w-3" /> Bulk</Button>
            <Button size="sm" onclick={() => showAddMember = true} class="text-xs"><Plus class="mr-1 h-3 w-3" /> Add</Button>
          </div>
        </div>
        <div class="mb-4 flex flex-col sm:flex-row gap-2">
          <Input type="text" bind:value={searchQuery} placeholder="Search..." class="flex-1" />
          <select bind:value={filterGroup} class="w-full sm:w-auto rounded-lg border border-input bg-card px-3 py-2 text-sm">
            <option value="all">All Groups</option>
            {#each groups as g}<option value={g.groupId}>{g.name}</option>{/each}
          </select>
        </div>
        <div class="overflow-hidden rounded-xl border border-border bg-card" use:autoAnimate>
          {#each filteredMembers as member (member._id)}
            <div class="flex items-center justify-between border-b border-border px-3 sm:px-4 py-3 last:border-b-0 hover:bg-accent/50 gap-2">
              <div class="min-w-0 flex-1">
                <span class="font-semibold text-sm truncate block">{member.lastName}, {member.firstName}</span>
                <span class="text-xs text-muted-foreground truncate block">{getGroupName(member.groupId)}</span>
              </div>
              <button onclick={() => deleteMember(member._id)} class="text-destructive hover:text-destructive/80 shrink-0"><Trash2 class="h-4 w-4" /></button>
            </div>
          {:else}<p class="py-8 text-center text-muted-foreground">No members found</p>{/each}
        </div>
      
      {:else if activeTab === 'groups'}
        <div class="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 class="text-2xl font-bold">Groups ({groups.length})</h1>
          <Button onclick={() => showAddGroup = true} class="w-full sm:w-auto"><Plus class="mr-2 h-4 w-4" /> Add Group</Button>
        </div>
        <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" use:autoAnimate>
          {#each groups as group (group._id)}
            {@const memberCount = members.filter(m => m.groupId === group.groupId).length}
            <Card.Root>
              <Card.Header class="pb-2">
                <div class="flex items-center justify-between gap-2">
                  <Card.Title class="flex items-center gap-2 min-w-0 truncate">
                    <span class="truncate">{group.name}</span>
                    {#if group.isHantei}<Badge variant="outline" class="text-[10px] border-orange-500 text-orange-400 shrink-0">H</Badge>{/if}
                  </Card.Title>
                  <div class="flex gap-1 shrink-0">
                    <button onclick={() => { editingGroup = { ...group }; showEditGroup = true; }} class="p-1 text-muted-foreground hover:text-foreground"><Pencil class="h-4 w-4" /></button>
                    <button onclick={() => deleteGroup(group._id)} class="p-1 text-destructive hover:text-destructive/80"><Trash2 class="h-4 w-4" /></button>
                  </div>
                </div>
                <Card.Description class="text-xs truncate">ID: {group.groupId}</Card.Description>
              </Card.Header>
              <Card.Content>
                <div class="text-2xl font-bold">{memberCount}</div>
                <div class="text-sm text-muted-foreground">members</div>
              </Card.Content>
            </Card.Root>
          {:else}
            <Card.Root class="col-span-full border-dashed">
              <Card.Content class="flex flex-col items-center justify-center py-12">
                <FolderOpen class="mb-4 h-12 w-12 text-muted-foreground/50" />
                <p class="mb-4 text-muted-foreground">No groups yet</p>
                <Button onclick={() => showAddGroup = true}>Create Your First Group</Button>
              </Card.Content>
            </Card.Root>
          {/each}
        </div>
      
      {:else if activeTab === 'results'}
        <h1 class="mb-6 text-2xl font-bold">Results</h1>
        {#if !selectedTournament}<p class="text-muted-foreground">No tournament selected</p>
        {:else if matches.length === 0}<p class="text-muted-foreground">No matches in this tournament</p>
        {:else}
          <div class="space-y-4" use:autoAnimate>
            {#each groups as group (group._id)}
              {@const gm = matches.filter(m => m.groupId === group.groupId)}
              {@const done = gm.filter(m => m.status === 'completed')}
              {#if gm.length > 0}
                <Card.Root>
                  <Card.Header>
                    <Card.Title class="flex items-center gap-2 text-base sm:text-lg">
                      <span class="truncate">{group.name}</span>
                      <Badge variant="outline" class="text-xs shrink-0">{done.length}/{gm.length}</Badge>
                    </Card.Title>
                  </Card.Header>
                  <Card.Content>
                    <div class="space-y-2">
                      {#each done as match}
                        {@const p1Win = match.winner === match.player1Id}
                        <div class="flex items-center gap-2 rounded bg-muted/50 px-3 py-2 text-xs sm:text-sm">
                          <span class={cn("truncate flex-1", p1Win && "font-semibold text-green-400")}>{getMemberName(match.player1Id)}{p1Win ? ' 🏆' : ''}</span>
                          <span class="text-muted-foreground shrink-0">{match.player1Score?.length || 0} - {match.player2Score?.length || 0}</span>
                          <span class={cn("truncate flex-1 text-right", !p1Win && match.winner && "font-semibold text-green-400")}>{!p1Win && match.winner ? '🏆 ' : ''}{getMemberName(match.player2Id)}</span>
                        </div>
                      {:else}<p class="text-sm text-muted-foreground">No completed matches</p>{/each}
                    </div>
                  </Card.Content>
                </Card.Root>
              {/if}
            {/each}
          </div>
        {/if}
      
      {:else if activeTab === 'history'}
        <h1 class="mb-6 text-2xl font-bold">Tournament History</h1>
        {@const completedTournaments = tournaments.filter(t => t.status === 'completed')}
        {#if completedTournaments.length === 0}
          <Card.Root class="border-dashed">
            <Card.Content class="flex flex-col items-center justify-center py-12">
              <History class="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p class="text-muted-foreground">No completed tournaments yet</p>
            </Card.Content>
          </Card.Root>
        {:else}
          <div class="space-y-4" use:autoAnimate>
            {#each completedTournaments as tournament (tournament._id)}
              <Card.Root>
                <Card.Header>
                  <Card.Title class="truncate">{tournament.name}</Card.Title>
                  <Card.Description>📅 {tournament.date}</Card.Description>
                </Card.Header>
              </Card.Root>
            {/each}
          </div>
        {/if}
      {/if}
    </div>
  </main>
</div>

<!-- Dialogs -->
<Dialog.Root bind:open={showAddGroup}>
  <Dialog.Content class="sm:max-w-sm max-w-[calc(100vw-2rem)]">
    <Dialog.Header><Dialog.Title>Add Group</Dialog.Title></Dialog.Header>
    <div class="space-y-4 py-4">
      <div class="space-y-2"><Label for="group-id">Group ID</Label><Input id="group-id" bind:value={newGroup.id} placeholder="e.g., YUD, MUD" /></div>
      <div class="space-y-2"><Label for="group-name">Group Name</Label><Input id="group-name" bind:value={newGroup.name} placeholder="e.g., Youth Division" /></div>
      <div class="flex items-center space-x-2"><Checkbox id="group-hantei" bind:checked={newGroup.isHantei} /><Label for="group-hantei" class="cursor-pointer text-sm">Hantei (non-bogu)</Label></div>
    </div>
    <Dialog.Footer class="flex-col sm:flex-row gap-2"><Button variant="secondary" onclick={() => showAddGroup = false} class="w-full sm:w-auto">Cancel</Button><Button onclick={createGroup} class="w-full sm:w-auto">Create</Button></Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={showEditGroup}>
  <Dialog.Content class="sm:max-w-sm max-w-[calc(100vw-2rem)]">
    <Dialog.Header><Dialog.Title>Edit Group</Dialog.Title></Dialog.Header>
    {#if editingGroup}
      <div class="space-y-4 py-4">
        <div class="space-y-2"><Label for="edit-group-id">Group ID</Label><Input id="edit-group-id" bind:value={editingGroup.groupId} /></div>
        <div class="space-y-2"><Label for="edit-group-name">Group Name</Label><Input id="edit-group-name" bind:value={editingGroup.name} /></div>
        <div class="flex items-center space-x-2"><Checkbox id="edit-group-hantei" bind:checked={editingGroup.isHantei} /><Label for="edit-group-hantei" class="cursor-pointer text-sm">Hantei</Label></div>
      </div>
    {/if}
    <Dialog.Footer class="flex-col sm:flex-row gap-2"><Button variant="secondary" onclick={() => showEditGroup = false} class="w-full sm:w-auto">Cancel</Button><Button onclick={updateGroup} class="w-full sm:w-auto">Save</Button></Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={showAddMember}>
  <Dialog.Content class="sm:max-w-sm max-w-[calc(100vw-2rem)]">
    <Dialog.Header><Dialog.Title>Add Member</Dialog.Title></Dialog.Header>
    <div class="space-y-4 py-4">
      <div class="space-y-2"><Label for="member-first">First Name</Label><Input id="member-first" bind:value={newMember.firstName} placeholder="John" /></div>
      <div class="space-y-2"><Label for="member-last">Last Name</Label><Input id="member-last" bind:value={newMember.lastName} placeholder="Doe" /></div>
      <div class="space-y-2"><Label for="member-group">Group</Label><select id="member-group" bind:value={newMember.groupId} class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="">Select Group</option>{#each groups as g}<option value={g.groupId}>{g.name}</option>{/each}</select></div>
    </div>
    <Dialog.Footer class="flex-col sm:flex-row gap-2"><Button variant="secondary" onclick={() => showAddMember = false} class="w-full sm:w-auto">Cancel</Button><Button onclick={createMember} class="w-full sm:w-auto">Add</Button></Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={showMassAddMembers}>
  <Dialog.Content class="sm:max-w-3xl max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto">
    <Dialog.Header><Dialog.Title>Add Multiple Members</Dialog.Title><Dialog.Description>Fill in the rows below.</Dialog.Description></Dialog.Header>
    <div class="py-4 overflow-x-auto">
      <div class="mb-2 grid grid-cols-[1fr_1fr_100px_32px] gap-2 text-xs font-medium text-muted-foreground min-w-[320px]"><span>First</span><span>Last</span><span>Group</span><span></span></div>
      <div class="space-y-2 min-w-[320px]" use:autoAnimate>
        {#each massMembers as member, i (i)}
          <div class="grid grid-cols-[1fr_1fr_100px_32px] gap-2">
            <Input bind:value={member.firstName} placeholder="First" class="text-sm" />
            <Input bind:value={member.lastName} placeholder="Last" class="text-sm" />
            <select bind:value={member.groupId} class="rounded-lg border border-input bg-background px-2 py-2 text-xs"><option value="">-</option>{#each groups as g}<option value={g.groupId}>{g.groupId}</option>{/each}</select>
            <button onclick={() => massMembers = massMembers.filter((_, idx) => idx !== i)} class="flex items-center justify-center text-muted-foreground hover:text-destructive"><Trash2 class="h-4 w-4" /></button>
          </div>
        {/each}
      </div>
      <button onclick={addMoreRows} class="mt-4 flex items-center gap-2 text-sm text-primary hover:text-primary/80"><Plus class="h-4 w-4" /> Add 5 more</button>
    </div>
    <Dialog.Footer class="flex-col sm:flex-row gap-2"><Button variant="secondary" onclick={() => showMassAddMembers = false} class="w-full sm:w-auto">Cancel</Button><Button onclick={createMassMembers} class="w-full sm:w-auto">Add ({massMembers.filter(m => m.firstName.trim() && m.lastName.trim() && m.groupId).length})</Button></Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={showImportCSV}>
  <Dialog.Content class="sm:max-w-md max-w-[calc(100vw-2rem)]">
    <Dialog.Header><Dialog.Title>Import CSV</Dialog.Title><Dialog.Description>FirstName,LastName,GroupID</Dialog.Description></Dialog.Header>
    <div class="py-4"><textarea bind:value={csvText} placeholder="John,Doe,YUD&#10;Jane,Smith,MUD" rows="6" class="w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-xs sm:text-sm focus:border-primary focus:outline-none"></textarea></div>
    <Dialog.Footer class="flex-col sm:flex-row gap-2"><Button variant="secondary" onclick={() => showImportCSV = false} class="w-full sm:w-auto">Cancel</Button><Button onclick={importCSV} class="w-full sm:w-auto">Import</Button></Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={showCreateTournament}>
  <Dialog.Content class="sm:max-w-md max-w-[calc(100vw-2rem)]">
    <Dialog.Header><Dialog.Title>Create Tournament</Dialog.Title></Dialog.Header>
    <div class="space-y-4 py-4">
      <div class="grid grid-cols-2 gap-3">
        <div class="space-y-2"><Label for="tournament-month" class="text-xs">Month</Label><select id="tournament-month" bind:value={newTournament.month} class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="">Select</option>{#each MONTHS as month}<option value={month}>{month}</option>{/each}</select></div>
        <div class="space-y-2"><Label for="tournament-year" class="text-xs">Year</Label><select id="tournament-year" bind:value={newTournament.year} class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">{#each [2024, 2025, 2026, 2027] as year}<option value={year}>{year}</option>{/each}</select></div>
      </div>
      <div class="space-y-2"><Label for="tournament-name" class="text-xs">Name <span class="text-muted-foreground">(optional)</span></Label><Input id="tournament-name" bind:value={newTournament.name} placeholder={generateTournamentName()} class="text-sm" /></div>
      <div class="space-y-2"><Label for="tournament-date" class="text-xs">Date</Label><Input id="tournament-date" type="date" bind:value={newTournament.date} class="text-sm" /></div>
    </div>
    <Dialog.Footer class="flex-col sm:flex-row gap-2"><Button variant="secondary" onclick={() => showCreateTournament = false} class="w-full sm:w-auto">Cancel</Button><Button onclick={createTournament} class="w-full sm:w-auto">Create</Button></Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={showDeleteConfirm}>
  <Dialog.Content class="sm:max-w-sm max-w-[calc(100vw-2rem)]">
    <Dialog.Header>
      <Dialog.Title class="flex items-center gap-2 text-red-400">
        <AlertTriangle class="h-5 w-5" /> Delete Tournament?
      </Dialog.Title>
      <Dialog.Description>
        This will permanently delete "{selectedTournament?.name}" and all its data. This cannot be undone.
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer class="flex-col sm:flex-row gap-2">
      <Button variant="secondary" onclick={() => showDeleteConfirm = false} class="w-full sm:w-auto">Cancel</Button>
      <Button variant="destructive" onclick={deleteTournament} class="w-full sm:w-auto">Delete</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

