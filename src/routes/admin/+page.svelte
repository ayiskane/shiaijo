<script lang="ts">
  // Build timestamp: 2026-01-06T03:25:00Z
  import { onMount, onDestroy } from 'svelte';
  import { useQuery, useConvexClient } from 'convex-svelte';
  import { api } from '../../convex/_generated/api';
  import { cn } from '$lib/utils';
  import { slide, fade } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { quintOut } from 'svelte/easing';
  import { toast } from 'svelte-sonner';
  import { SvelteMap, SvelteSet } from 'svelte/reactivity';
  import autoAnimate from '@formkit/auto-animate';
import { 
  LayoutDashboard, Users, FolderOpen, Trophy, ClipboardList, 
  ChevronLeft, ChevronDown, ChevronRight, Swords, Eye, Menu, Plus, Trash2, Pencil,
  Play, Settings, RefreshCw, RotateCcw, Archive, GripVertical, Timer, 
  Check, X, AlertTriangle, History, UserPlus, Home, Lock, KeyRound, UserCheck
} from '@lucide/svelte';
  import { parseDate } from '@internationalized/date';
  
  // shadcn-svelte components
  import * as Dialog from '$lib/components/ui/dialog';
  import * as Collapsible from '$lib/components/ui/collapsible';
  import * as Select from '$lib/components/ui/select';
  import * as Sheet from '$lib/components/ui/sheet';
  import * as Calendar from '$lib/components/ui/calendar';
  import * as ToggleGroup from '$lib/components/ui/toggle-group';
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
  const SENSEI_GROUP_ID = 'SEN';
  const SETTINGS_KEYS = ['adminPasscode', 'courtkeeperPasscode'] as const;
  let dashboardModulePromise: Promise<any> | null = null;

  // Eager-loaded admin tabs to avoid lazy-load stalls in production
  import MembersTab from './tabs/MembersTab.svelte';
  import GroupsTab from './tabs/GroupsTab.svelte';
  import TournamentTab from './tabs/TournamentTab.svelte';
  
  // Apply Sumi theme to admin portal
  onMount(() => {
    const root = document.documentElement;
    root.classList.add('theme-sumi');
    root.dataset.theme = 'sumi';
    accessUnlocked = localStorage.getItem('shiaijo_admin_unlocked') === 'true';
    accessChecked = true;
    ensureSenseiGroup();
  });
  onDestroy(() => {
    const root = document.documentElement;
    root.classList.remove('theme-sumi');
    delete root.dataset.theme;
  });

  // Debug: track tab changes and loading state
  $effect(() => {
    console.debug('[admin] activeTab', activeTab, { loading });
  });
  
  // Real-time subscriptions
  const groupsQuery = useQuery(api.groups.list, () => ({}));
  const membersQuery = useQuery(api.members.list, () => ({}));
  const tournamentsQuery = useQuery(api.tournaments.list, () => ({}));
  const settingsQuery = useQuery(api.settings.getMany, () => ({ keys: [...SETTINGS_KEYS] }));
  
  // Reactive data from queries
  let groups = $derived(groupsQuery.data ?? []);
  let members = $derived(membersQuery.data ?? []);
  let tournaments = $derived(tournamentsQuery.data ?? []);
  let loading = $derived(groupsQuery.isLoading || membersQuery.isLoading || tournamentsQuery.isLoading);
  let settingsLoading = $derived(settingsQuery.isLoading);
  let settings = $derived(settingsQuery.data ?? { adminPasscode: null, courtkeeperPasscode: null });
  
  // State
  let activeTab = $state('dashboard');
  let sidebarOpen = $state(false);
  let sidebarCollapsed = $state(false);
  let expandedNavGroups = $state<Set<string>>(new Set(['roster', 'shiai']));
  let accessUnlocked = $state(false);
  let accessChecked = $state(false);
  let adminUnlockCode = $state('');
  let selectedSenseiId = $state<string | null>(null);
  let adminPasscodeInput = $state('');
  let courtkeeperPasscodeInput = $state('');
  
  // Modal states
  let showAddGroup = $state(false);
  let showEditGroup = $state(false);
  let showAddMember = $state(false);
  let showEditMember = $state(false);
  let showMassAddMembers = $state(false);
  let showMassEditMembers = $state(false);
  let showImportCSV = $state(false);
  let showCreateTournament = $state(false);
  let showDeleteConfirm = $state(false);
  
  let editingGroup = $state<any>(null);
  let editingMember = $state<any>(null);
  let expandedGroupId = $state<string | null>(null);
  let newGroup = $state({ id: '', name: '', isHantei: false });
  let newMember = $state({ firstName: '', lastName: '', groupId: '' });
  let csvText = $state('');
  let newTournament = $state({ name: '', date: '', month: '', year: new Date().getFullYear() });
  let tournamentDateValue = $state(null as import('@internationalized/date').DateValue | null);

  $effect(() => {
    // keep calendar value in sync when dialog resets
    tournamentDateValue = newTournament.date ? parseDate(newTournament.date) : null;
  });
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
  
  // Precomputed lookup maps for faster render paths
  let membersById = $derived.by(() => {
    const map = new Map<string, typeof members[number]>();
    for (const m of members) map.set(m._id, m);
    return map;
  });
  
  let groupsByGroupId = $derived.by(() => {
    const map = new Map<string, typeof groups[number]>();
    for (const g of groups) map.set(g.groupId, g);
    return map;
  });
  
  let membersByGroupId = $derived.by(() => {
    const map = new Map<string, typeof members[number][]>();
    for (const m of members) {
      const list = map.get(m.groupId);
      if (list) list.push(m);
      else map.set(m.groupId, [m]);
    }
    return map;
  });

  let senseiMembers = $derived(members.filter(m => m.groupId === SENSEI_GROUP_ID));
  let adminPasscode = $derived(settings.adminPasscode ?? '');
  let courtkeeperPasscode = $derived(settings.courtkeeperPasscode ?? '');
  let passcodeRequired = $derived(!!adminPasscode);
  
  let matchesByStatus = $derived.by(() => {
    const pending: typeof matches = [];
    const inProgress: typeof matches = [];
    const completed: typeof matches = [];
    for (const m of matches) {
      if (m.status === 'pending') pending.push(m);
      else if (m.status === 'in_progress') inProgress.push(m);
      else completed.push(m);
    }
    return { pending, inProgress, completed };
  });
  
  let matchesByGroupId = $derived.by(() => {
    const map = new Map<string, typeof matches>();
    for (const m of matches) {
      const list = map.get(m.groupId);
      if (list) list.push(m);
      else map.set(m.groupId, [m]);
    }
    return map;
  });
  
  let completedMatchesByGroupId = $derived.by(() => {
    const map = new Map<string, typeof matches>();
    for (const m of matches) {
      if (m.status !== 'completed') continue;
      const list = map.get(m.groupId);
      if (list) list.push(m);
      else map.set(m.groupId, [m]);
    }
    return map;
  });
  
  let matchStatsByGroup = $derived.by(() => {
    const map = new Map<string, { total: number; completed: number; inProgress: number; pending: number }>();
    for (const m of matches) {
      const stats = map.get(m.groupId) ?? { total: 0, completed: 0, inProgress: 0, pending: 0 };
      stats.total += 1;
      if (m.status === 'completed') stats.completed += 1;
      else if (m.status === 'in_progress') stats.inProgress += 1;
      else stats.pending += 1;
      map.set(m.groupId, stats);
    }
    return map;
  });
  
  let courtData = $derived.by(() => {
    const courtA: typeof matches = [];
    const courtB: typeof matches = [];
    let courtACompleted = 0;
    let courtBCompleted = 0;
    for (const m of matches) {
      const isCompleted = m.status === 'completed';
      if (m.court === 'A' || m.court === 'A+B') {
        courtA.push(m);
        if (isCompleted) courtACompleted++;
      }
      if (m.court === 'B' || m.court === 'A+B') {
        courtB.push(m);
        if (isCompleted) courtBCompleted++;
      }
    }
    return { courtA, courtB, courtACompleted, courtBCompleted };
  });

  type StandingRow = {
    memberId: string;
    wins: number;
    ties: number;
    losses: number;
    points: number;
    ippons: number;
    suddenDeathWins: number;
    matches: number;
  };

  let standingsData = $derived.by(() => {
    const standingsByGroupId = new Map<string, StandingRow[]>();
    const tieKeysByGroupId = new Map<string, Set<string>>();
    const groupMemberStats = new Map<string, Map<string, StandingRow>>();

    for (const p of participants) {
      let groupStats = groupMemberStats.get(p.groupId);
      if (!groupStats) {
        groupStats = new Map();
        groupMemberStats.set(p.groupId, groupStats);
      }
        if (!groupStats.has(p.memberId)) {
          groupStats.set(p.memberId, {
            memberId: p.memberId,
            wins: 0,
            ties: 0,
            losses: 0,
            points: 0,
            ippons: 0,
            suddenDeathWins: 0,
            matches: 0,
          });
        }
      }
    
      for (const match of matches) {
        const groupStats = groupMemberStats.get(match.groupId);
        if (!groupStats) continue;
        const p1 = groupStats.get(match.player1Id);
        const p2 = groupStats.get(match.player2Id);
        if (!p1 || !p2) continue;
        if (match.isSuddenDeath) {
          if (match.status === 'completed' && match.winner) {
            if (match.winner === match.player1Id) p1.suddenDeathWins += 1;
            else if (match.winner === match.player2Id) p2.suddenDeathWins += 1;
          }
          continue;
        }
        if (match.status !== 'completed') continue;
      
        const p1Ippons = match.player1Score?.length || 0;
        const p2Ippons = match.player2Score?.length || 0;
        p1.ippons += p1Ippons;
        p2.ippons += p2Ippons;
        p1.matches += 1;
        p2.matches += 1;
      
        if (match.winner === match.player1Id) {
          p1.wins += 1;
          p2.losses += 1;
        } else if (match.winner === match.player2Id) {
          p2.wins += 1;
          p1.losses += 1;
        } else {
          p1.ties += 1;
          p2.ties += 1;
        }
      }

    for (const [groupId, memberStats] of groupMemberStats) {
      const rows = Array.from(memberStats.values());
      for (const row of rows) {
        row.points = (row.wins * 2) + row.ties;
      }
        rows.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.wins !== a.wins) return b.wins - a.wins;
          if (b.ippons !== a.ippons) return b.ippons - a.ippons;
          if (b.suddenDeathWins !== a.suddenDeathWins) return b.suddenDeathWins - a.suddenDeathWins;
          const nameA = membersById.get(a.memberId);
          const nameB = membersById.get(b.memberId);
          const sortableA = nameA ? `${nameA.lastName}, ${nameA.firstName}` : a.memberId;
          const sortableB = nameB ? `${nameB.lastName}, ${nameB.firstName}` : b.memberId;
          return sortableA.localeCompare(sortableB);
      });
      standingsByGroupId.set(groupId, rows);

        const keyCounts = new Map<string, number>();
        for (const row of rows) {
          const key = `${row.points}-${row.wins}-${row.ippons}-${row.suddenDeathWins}`;
          keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1);
        }
        const tiedKeys = new Set<string>();
      for (const [key, count] of keyCounts) {
        if (count > 1) tiedKeys.add(key);
      }
      tieKeysByGroupId.set(groupId, tiedKeys);
    }

    return { standingsByGroupId, tieKeysByGroupId };
  });
  
  // Tournament tab state
  let editTournamentOpen = $state(true);
  let collapsedGroups = $state<Set<string>>(new Set());
  let settingsSheetOpen = $state(false);
  let editingCourtGroupId = $state<string | null>(null);
  
  // Drag and drop state
  let draggedGroupId = $state<string | null>(null);
  let dragOverGroupId = $state<string | null>(null);
  
  // Group order for tournament (local state, synced from matches)
  let groupOrder = $state<string[]>([]);
  
  // Bogu settings
  let boguTimerDuration = $state(180);
  let boguMatchType = $state<'sanbon' | 'ippon'>('sanbon');
  let timerDisplayMode = $state<'up' | 'down'>('up');
  
  // Non-bogu (Hantei) settings - kihon-waza combos
  const KIHON_WAZA_OPTIONS = [
    { id: 'M', label: 'Men', short: 'M' },
    { id: 'K', label: 'Kote', short: 'K' },
    { id: 'D', label: 'Do', short: 'D' },
    { id: 'KM', label: 'Kote-Men', short: 'KM' },
    { id: 'MKD', label: 'Men-Kaeshi-Do', short: 'MKD' },
  ];

  const SCORE_LABELS: Record<number, string> = {
    1: 'Men',
    2: 'Kote',
    3: 'Do',
    4: 'Tsuki',
    5: 'Hansoku',
    6: 'Forfeit',
  };
  
  let hanteiRound1 = $state<string[]>(['K', 'M']); // 2 combos for round 1
  let hanteiRound2 = $state<string[]>(['M', 'K', 'D']); // 3 combos for round 2
  
  // Mass member creation
  type MemberRow = { firstName: string; lastName: string; groupId: string };
  let massMembers = $state<MemberRow[]>(
    Array(5).fill(null).map(() => ({ firstName: '', lastName: '', groupId: '' }))
  );
  type BulkEditRow = { id: string; firstName: string; lastName: string; groupId: string };
  let massEditMembers = $state<BulkEditRow[]>([]);
  let massEditOriginal = new Map<string, BulkEditRow>();
  
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const TIMER_OPTIONS = [60, 120, 180]; // Only up to 3 minutes
  
  // Derived values
  let activeTournament = $derived(tournaments.find(t => t.status === 'in_progress') || null);
  let selectedTournament = $derived(tournaments.find(t => t._id === selectedTournamentId) || activeTournament || tournaments[0] || null);
  
  let pendingMatches = $derived(matchesByStatus.pending);
  let inProgressMatches = $derived(matchesByStatus.inProgress);
  let completedMatches = $derived(matchesByStatus.completed);
  let courtAMatches = $derived(courtData.courtA);
  let courtBMatches = $derived(courtData.courtB);
  let courtACompletedCount = $derived(courtData.courtACompleted);
  let courtBCompletedCount = $derived(courtData.courtBCompleted);
  
  let progressPercent = $derived(matches.length > 0 ? Math.round((completedMatches.length / matches.length) * 100) : 0);
  let isComplete = $derived(matches.length > 0 && completedMatches.length === matches.length);
  let setupStep = $derived(matches.length > 0 ? 4 : participants.length > 0 ? 3 : 2);
  let currentCourtAMatch = $derived(courtAMatches.find(m => m.status === 'in_progress') || null);
  let currentCourtBMatch = $derived(courtBMatches.find(m => m.status === 'in_progress') || null);
  let tournamentSelectorLabel = $derived(
    selectedTournament ? `${selectedTournament.name} - ${selectedTournament.status}` : 'Select tournament'
  );

  $effect(() => {
    if (selectedTournament?.timerDisplayMode) {
      timerDisplayMode = selectedTournament.timerDisplayMode;
    } else {
      timerDisplayMode = 'up';
    }
  });
  
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
    const g = groupsByGroupId.get(gId);
    return g && !g.isHantei;
  }));
  
  let hanteiGroups = $derived(groupOrder.filter(gId => {
    const g = groupsByGroupId.get(gId);
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
  let registrationFilter = $state<'all' | 'registered' | 'unregistered'>('all');
  
  // Member selection for bulk registration
let selectedMemberIds = $state(new SvelteSet<string>());
  
  // Quick lookup for registered members
  let registeredMemberIds = $derived(new Set(participants.map(p => p.memberId)));
  
  let filteredMembers = $derived(
    members
      .filter(m => {
        const matchesSearch = `${m.firstName} ${m.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesGroup = filterGroup === 'all' || m.groupId === filterGroup;
        const isRegistered = registeredMemberIds.has(m._id);
        const matchesRegistration = registrationFilter === 'all' || 
          (registrationFilter === 'registered' && isRegistered) ||
          (registrationFilter === 'unregistered' && !isRegistered);
        return matchesSearch && matchesGroup && matchesRegistration;
      })
      .sort((a, b) => a.lastName.localeCompare(b.lastName))
  );
  
  // Selection helpers
function toggleMemberSelection(memberId: string) {
  const next = new SvelteSet(selectedMemberIds);
  next.has(memberId) ? next.delete(memberId) : next.add(memberId);
  selectedMemberIds = next;
}

function clearSelection() {
  selectedMemberIds = new SvelteSet();
}
  
  let allFilteredSelected = $derived(
    filteredMembers.length > 0 && filteredMembers.every(m => selectedMemberIds.has(m._id))
  );

function selectAllFiltered() {
  const next = new SvelteSet(selectedMemberIds);
  for (const m of filteredMembers) next.add(m._id);
  selectedMemberIds = next;
}
  
  function toggleNavGroup(groupId: string) {
    const newSet = new Set(expandedNavGroups);
    newSet.has(groupId) ? newSet.delete(groupId) : newSet.add(groupId);
    expandedNavGroups = newSet;
  }

  // Expand/collapse a single group in Groups tab
  function setExpandedGroup(groupId: string | null) {
    expandedGroupId = groupId;
  }
  
  function toggleGroupCollapse(groupId: string) {
    const newSet = new Set(collapsedGroups);
    newSet.has(groupId) ? newSet.delete(groupId) : newSet.add(groupId);
    collapsedGroups = newSet;
  }
  
  // Helper functions
  function getGroupName(groupId: string): string { 
    return groupsByGroupId.get(groupId)?.name || groupId; 
  }
  
  function getGroupById(groupId: string) {
    return groupsByGroupId.get(groupId);
  }
  
  function getMemberName(memberId: string): string { 
    const m = membersById.get(memberId); 
    return m ? `${m.firstName} ${m.lastName.charAt(0)}.` : 'Unknown'; 
  }
  
    function getMemberById(memberId: string) {
      return membersById.get(memberId);
    }

    function getTieKey(row: StandingRow): string {
      return `${row.points}-${row.wins}-${row.ippons}-${row.suddenDeathWins}`;
    }

    async function ensureSenseiGroup() {
      try { await client.mutation(api.groups.ensureSensei, {}); } catch {}
    }

    $effect(() => {
      if (!accessChecked) return;
      if (!passcodeRequired) accessUnlocked = true;
    });

    function unlockAdmin() {
      if (!passcodeRequired) {
        accessUnlocked = true;
        localStorage.setItem('shiaijo_admin_unlocked', 'true');
        return;
      }
      if (adminUnlockCode.trim() !== adminPasscode) {
        toast.error('Incorrect passcode');
        return;
      }
      accessUnlocked = true;
      adminUnlockCode = '';
      localStorage.setItem('shiaijo_admin_unlocked', 'true');
    }

    function unlockAsSensei() {
      if (!selectedSenseiId) {
        toast.error('Select a Sensei member');
        return;
      }
      accessUnlocked = true;
      localStorage.setItem('shiaijo_admin_unlocked', 'true');
    }

    function lockAdmin() {
      accessUnlocked = false;
      localStorage.removeItem('shiaijo_admin_unlocked');
    }
  
    function formatTimer(seconds: number): string {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    function buildScoreTimeline(match: any) {
      const p1Times = match.player1ScoreTimes ?? [];
      const p2Times = match.player2ScoreTimes ?? [];
      const p1Events = (match.player1Score ?? []).map((type: number, idx: number) => ({
        player: 'AKA',
        playerId: match.player1Id,
        type,
        time: p1Times[idx],
      }));
      const p2Events = (match.player2Score ?? []).map((type: number, idx: number) => ({
        player: 'SHIRO',
        playerId: match.player2Id,
        type,
        time: p2Times[idx],
      }));
      const events = [...p1Events, ...p2Events];
      events.sort((a, b) => {
        if (a.time === undefined && b.time === undefined) return 0;
        if (a.time === undefined) return 1;
        if (b.time === undefined) return -1;
        return a.time - b.time;
      });
      return events;
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

    function openMassEditMembers() {
      const rows = filteredMembers.map(m => ({
        id: m._id,
        firstName: m.firstName,
        lastName: m.lastName,
        groupId: m.groupId,
      }));
      massEditMembers = rows;
      massEditOriginal = new Map(rows.map(row => [row.id, { ...row }]));
      showMassEditMembers = true;
    }

    async function saveMassEditMembers() {
      const updates = massEditMembers
        .map(row => ({
          id: row.id,
          firstName: row.firstName.trim(),
          lastName: row.lastName.trim(),
          groupId: row.groupId,
        }))
        .filter(row => row.firstName && row.lastName && row.groupId)
        .filter(row => {
          const original = massEditOriginal.get(row.id);
          if (!original) return true;
          return row.firstName !== original.firstName ||
            row.lastName !== original.lastName ||
            row.groupId !== original.groupId;
        });

      if (updates.length === 0) {
        toast('No changes to save');
        showMassEditMembers = false;
        return;
      }

      try {
        await client.mutation(api.members.bulkUpdate, { members: updates });
        showMassEditMembers = false;
        toast.success(`Updated ${updates.length} member${updates.length > 1 ? 's' : ''}`);
      } catch (e) { toast.error('Failed to update members'); }
    }

    async function saveAdminPasscode() {
      try {
        await client.mutation(api.settings.set, { key: 'adminPasscode', value: adminPasscodeInput });
        adminPasscodeInput = '';
        toast.success('Admin passcode updated');
      } catch (e) { toast.error('Failed to update passcode'); }
    }

    async function saveCourtkeeperPasscode() {
      try {
        await client.mutation(api.settings.set, { key: 'courtkeeperPasscode', value: courtkeeperPasscodeInput });
        courtkeeperPasscodeInput = '';
        toast.success('Courtkeeper passcode updated');
      } catch (e) { toast.error('Failed to update passcode'); }
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
  
  function openEditMember(member: any) {
    editingMember = { ...member };
    showEditMember = true;
  }
  
  async function updateMember() {
    if (!editingMember) return;
    if (!editingMember.firstName?.trim() || !editingMember.lastName?.trim()) {
      toast.error('Name is required');
      return;
    }
    try {
        await client.mutation(api.members.update, { 
          id: editingMember._id, 
          firstName: editingMember.firstName.trim(), 
          lastName: editingMember.lastName.trim(), 
          groupId: editingMember.groupId
        });
      showEditMember = false;
      editingMember = null;
      toast.success('Member updated');
    } catch (e) { toast.error('Failed to update member'); }
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
  
  async function registerSelectedMembers() {
    if (!selectedTournament) return;
    if (selectedMemberIds.size === 0) { toast.error('No members selected'); return; }
    try {
      const memberIds = [...selectedMemberIds] as any[];
      const result = await client.mutation(api.participants.addMembers, { 
        tournamentId: selectedTournament._id, 
        memberIds 
      });
      toast.success(`Registered ${result.addedCount} members`);
      selectedMemberIds.clear();
    } catch (e) { toast.error('Failed to register members'); }
  }
  
  async function clearAllParticipants() {
    if (!selectedTournament) return;
    if (!confirm('Remove all participants from this tournament?')) return;
    try {
      const result = await client.mutation(api.participants.clearAll, { tournamentId: selectedTournament._id });
      toast.success(`Removed ${result.removedCount} participants`);
    } catch (e) { toast.error('Failed to clear participants'); }
  }

  // wrapper used by Members tab prop
  function clearParticipants() {
    return clearAllParticipants();
  }
  
  async function toggleMemberRegistration(memberId: string) {
    if (!selectedTournament) return;
    const isRegistered = registeredMemberIds.has(memberId);
    try {
      if (isRegistered) {
        await client.mutation(api.participants.removeByMember, { 
          tournamentId: selectedTournament._id, 
          memberId: memberId as any 
        });
        toast.success('Unregistered');
      } else {
        await client.mutation(api.participants.addMembers, { 
          tournamentId: selectedTournament._id, 
          memberIds: [memberId] as any[] 
        });
        toast.success('Registered');
      }
    } catch (e) { toast.error('Failed to update registration'); }
  }
  
  async function registerGroupMembers(groupId: string) {
    if (!selectedTournament) return;
    const groupMembers = membersByGroupId.get(groupId) ?? [];
    const unregisteredIds = groupMembers.filter(m => !registeredMemberIds.has(m._id)).map(m => m._id);
    if (unregisteredIds.length === 0) { toast.info('All members in this group are already registered'); return; }
    try {
      const result = await client.mutation(api.participants.addMembers, { 
        tournamentId: selectedTournament._id, 
        memberIds: unregisteredIds as any[] 
      });
      toast.success(`Registered ${result.addedCount} members from ${getGroupName(groupId)}`);
    } catch (e) { toast.error('Failed to register group'); }
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

    async function applyTimerDisplayMode() {
      if (!selectedTournament) return;
      try {
        await client.mutation(api.tournaments.update, {
          id: selectedTournament._id,
          timerDisplayMode,
        });
        toast.success('Timer display updated');
      } catch (e) { toast.error('Failed to update timer display'); }
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

  function loadDashboardTab() {
    if (!dashboardModulePromise) {
      dashboardModulePromise = import('./tabs/DashboardTab.svelte');
    }
    return dashboardModulePromise;
  }

  let membersModulePromise: Promise<any> | null = null;
  function loadMembersTab() {
    if (!membersModulePromise) {
      membersModulePromise = import('./tabs/MembersTab.svelte');
    }
    return membersModulePromise;
  }

  let groupsModulePromise: Promise<any> | null = null;
  function loadGroupsTab() {
    if (!groupsModulePromise) {
      groupsModulePromise = import('./tabs/GroupsTab.svelte');
    }
    return groupsModulePromise;
  }

  let tournamentModulePromise: Promise<any> | null = null;
  function loadTournamentTab() {
    if (!tournamentModulePromise) {
      tournamentModulePromise = import('./tabs/TournamentTab.svelte');
    }
    return tournamentModulePromise;
  }

  let resultsModulePromise: Promise<any> | null = null;
  function loadResultsTab() {
    if (!resultsModulePromise) {
      resultsModulePromise = import('./tabs/ResultsTab.svelte');
    }
    return resultsModulePromise;
  }

  let historyModulePromise: Promise<any> | null = null;
  function loadHistoryTab() {
    if (!historyModulePromise) {
      historyModulePromise = import('./tabs/HistoryTab.svelte');
    }
    return historyModulePromise;
  }
</script>

<svelte:head><title>Admin - 試合場 Shiaijo</title></svelte:head>

<style>
  :global(.logo-bob) {
    animation: logo-bob 2.4s ease-in-out infinite;
  }
  @keyframes logo-bob {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px) scale(1.02); }
  }
  @media (max-width: 640px) {
    :global(.logo-bob) {
      animation-play-state: running;
      animation-duration: 2s;
      will-change: transform;
    }
  }
</style>

{#if !accessUnlocked}
  <div class="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
    <div class="w-full max-w-md rounded-2xl border border-border bg-card p-6 space-y-4">
      <div class="flex items-center gap-3">
        <Lock class="h-6 w-6 text-amber-400" />
        <div>
          <h1 class="text-xl font-bold">Admin Locked</h1>
          <p class="text-xs text-muted-foreground">Enter the passcode or unlock as Sensei.</p>
        </div>
      </div>
      {#if settingsLoading}
        <div class="flex items-center justify-center py-8">
          <div class="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      {:else}
        <div class="space-y-2">
          <Label class="text-xs text-muted-foreground">Admin Passcode</Label>
          <div class="flex gap-2">
            <Input type="password" bind:value={adminUnlockCode} placeholder="Enter passcode" class="text-sm" />
            <Button onclick={unlockAdmin} class="shrink-0"><KeyRound class="mr-2 h-4 w-4" /> Unlock</Button>
          </div>
          {#if !passcodeRequired}
            <p class="text-[10px] text-muted-foreground">No passcode set yet. You can enter without a code.</p>
          {/if}
        </div>
        <Separator />
        <div class="space-y-2">
          <Label class="text-xs text-muted-foreground">Sensei Quick Access</Label>
          <div class="flex gap-2">
            <Select.Root value={selectedSenseiId} onValueChange={(v) => selectedSenseiId = v}>
              <Select.Trigger class="flex-1 text-sm h-10 rounded-lg border border-input bg-background px-3">
                <Select.Value placeholder="Select Sensei" />
                <Select.Icon class="ml-auto"><ChevronDown class="h-4 w-4" /></Select.Icon>
              </Select.Trigger>
              <Select.Content class="z-40">
                <Select.Item value="">Select Sensei</Select.Item>
                {#each senseiMembers as m}
                  <Select.Item value={m._id}>{m.firstName} {m.lastName}</Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
            <Button variant="outline" onclick={unlockAsSensei} class="shrink-0"><UserCheck class="mr-2 h-4 w-4" /> Sensei</Button>
          </div>
          {#if senseiMembers.length === 0}
            <p class="text-[10px] text-muted-foreground">No Sensei members found. Add members to the Sensei group.</p>
          {/if}
        </div>
      {/if}
    </div>
  </div>
{:else}
  <div class="flex min-h-screen bg-background overflow-x-hidden">
  <!-- Desktop Sidebar -->
  <aside class={cn("hidden md:flex flex-col fixed inset-y-0 left-0 z-20 transition-all duration-300", sidebarCollapsed ? "w-16" : "w-[220px]")} style="background: var(--surface); border-right: 1px solid var(--border-subtle);">
    <!-- Header with Logo -->
    <div class={cn("flex items-center border-b", sidebarCollapsed ? "h-16 justify-center px-2" : "h-auto py-5 px-4")} style="border-color: var(--border-subtle);">
      <div class={cn("flex items-center", sidebarCollapsed ? "" : "gap-3 w-full")}>
        <img src="/shiaijologo.png" alt="Shiaijo" class="h-9 w-9 object-contain shrink-0" />
        <span class={cn("font-jp text-lg whitespace-nowrap transition-all duration-300", sidebarCollapsed ? "hidden" : "block")} style="color: var(--text-primary);">試合場</span>
      </div>
    </div>
    
    <!-- Collapse/Expand Toggle -->
    <button onclick={() => sidebarCollapsed = !sidebarCollapsed} class="absolute -right-3 top-20 flex h-7 w-7 items-center justify-center rounded-full shadow-lg z-10" style="background: var(--surface); border: 1px solid var(--border-subtle);">
      <ChevronLeft class={cn("h-4 w-4 transition-transform", sidebarCollapsed && "rotate-180")} style="color: var(--text-secondary);" />
    </button>
    
    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3">
      {#if sidebarCollapsed}
        <!-- Collapsed: Icon-only navigation with tooltips -->
        <div class="flex flex-col items-center gap-1">
          {#each navItems as item (item.id)}
            {@const Icon = item.icon}
            <button onclick={() => activeTab = item.id} class={cn("nav-icon-item", activeTab === item.id && "active")}>
              <Icon class="h-5 w-5" />
              <span class="tooltip">{item.label}</span>
            </button>
          {/each}
          
          <div class="nav-divider"></div>
          
          {#each navGroups as group}
            {#each group.items as item (item.id)}
              {@const Icon = item.icon}
              <button onclick={() => activeTab = item.id} class={cn("nav-icon-item", activeTab === item.id && "active")}>
                <Icon class="h-5 w-5" />
                <span class="tooltip">{item.label}{#if item.id === 'tournament' && activeTournament} (Live){/if}</span>
              </button>
            {/each}
          {/each}
        </div>
      {:else}
        <!-- Expanded: Full navigation with sections -->
        {#each navItems as item (item.id)}
          {@const Icon = item.icon}
          <button onclick={() => activeTab = item.id} class={cn("nav-item w-full", activeTab === item.id && "active")}>
            <Icon class="h-[18px] w-[18px]" />
            <span class="nav-item-text">{item.label}</span>
          </button>
        {/each}
        
        {#each navGroups as group}
          <div class="nav-section">
            <button onclick={() => toggleNavGroup(group.id)} class="w-full nav-section-title flex items-center gap-2 cursor-pointer hover:opacity-80">
              <ChevronDown class={cn("h-3 w-3 transition-transform", !expandedNavGroups.has(group.id) && "-rotate-90")} />
              {group.label}
            </button>
            {#if expandedNavGroups.has(group.id)}
              {#each group.items as item (item.id)}
                {@const Icon = item.icon}
                <button onclick={() => activeTab = item.id} class={cn("nav-item w-full", activeTab === item.id && "active")}>
                  <Icon class="h-[18px] w-[18px]" />
                  <span class="nav-item-text">{item.label}</span>
                  {#if item.id === 'tournament' && activeTournament}
                    <span class="nav-badge">Live</span>
                  {/if}
                </button>
              {/each}
            {/if}
          </div>
        {/each}
      {/if}
    </nav>
    
    <!-- Footer -->
    <div class="sidebar-footer">
      {#if sidebarCollapsed}
        <!-- Collapsed footer: portal icons only -->
        <div class="flex flex-col items-center gap-2">
          <a href="/" class="nav-icon-item" title="Home"><Home class="h-5 w-5" /></a>
          <a href="/courtkeeper" class="nav-icon-item" title="Courtkeeper"><Swords class="h-5 w-5" /></a>
          <a href="/spectator" class="nav-icon-item" title="Spectator"><Eye class="h-5 w-5" /></a>
        </div>
      {:else}
        <!-- Expanded footer: portal links only (no user card) -->
        <p class="footer-label">Switch Portal</p>
        <div class="flex flex-col gap-2">
          <a href="/" class="portal-link home"><Home class="h-4 w-4 shrink-0" /><span>Home</span></a>
          <a href="/courtkeeper" class="portal-link court"><Swords class="h-4 w-4 shrink-0" /><span>Courtkeeper</span></a>
          <a href="/spectator" class="portal-link spec"><Eye class="h-4 w-4 shrink-0" /><span>Spectator</span></a>
        </div>
      {/if}
    </div>
  </aside>
  
  <!-- Mobile Header -->
  <header class="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background px-4 md:hidden">
    <button onclick={() => sidebarOpen = true} class="rounded-lg p-2 hover:bg-accent"><Menu class="h-5 w-5" /></button>
    <div class="flex items-center gap-2"><img src="/shiaijologo.png" alt="Shiaijo" class="h-8 w-8 object-contain logo-bob" /><span class="font-jp">試合場</span></div>
    <div class="w-10"></div>
  </header>
  
  <!-- Mobile Sidebar Overlay -->
  {#if sidebarOpen}
    <div
      class="fixed inset-0 z-40 bg-black/50 md:hidden"
      role="button"
      tabindex="0"
      onclick={() => sidebarOpen = false}
      onkeydown={(e) => (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') && (sidebarOpen = false)}
      transition:fade
    ></div>
    <aside class="fixed inset-y-0 left-0 z-50 w-64 border-r border-sidebar-border bg-sidebar md:hidden" transition:slide={{ axis: 'x' }}>
      <div class="flex h-14 items-center gap-3 border-b border-sidebar-border px-4"><img src="/shiaijologo.png" alt="Shiaijo" class="h-10 w-10 object-contain logo-bob" /><span class="font-jp text-xl">試合場</span></div>
      <nav class="p-2">
        {#each [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }, { id: 'members', label: 'Members', icon: Users }, { id: 'groups', label: 'Groups', icon: FolderOpen }, { id: 'tournament', label: 'Tournament', icon: Trophy }, { id: 'results', label: 'Results', icon: ClipboardList }, { id: 'history', label: 'History', icon: History }] as tab (tab.id)}
          {@const Icon = tab.icon}
          <button onclick={() => { activeTab = tab.id; sidebarOpen = false; }} class={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm", activeTab === tab.id ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground hover:bg-sidebar-accent")}><Icon class="h-4 w-4" />{tab.label}</button>
        {/each}
      </nav>
      <div class="absolute inset-x-4 bottom-4 flex flex-col gap-2">
        <a href="/courtkeeper" class="flex items-center justify-center gap-2 rounded-lg bg-sky-900/50 py-2 text-sm text-sky-300"><Swords class="h-4 w-4" /> Courtkeeper</a>
        <a href="/spectator" class="flex items-center justify-center gap-2 rounded-lg bg-emerald-900/50 py-2 text-sm text-emerald-300"><Eye class="h-4 w-4" /> Spectator</a>
      </div>
    </aside>
  {/if}
  
  <!-- Main Content -->
  <main class={cn("flex-1 pt-14 transition-all duration-300 md:pt-0 w-full min-w-0 overflow-x-hidden", sidebarCollapsed ? "md:ml-16" : "md:ml-[220px]")}>
    <div class="p-4 sm:p-6 max-w-6xl mx-auto w-full overflow-x-hidden">
      {#if activeTab === 'dashboard'}
        {#await loadDashboardTab()}
          <div class="space-y-4">
            <Skeleton class="h-8 w-48" />
            <div class="grid gap-4 md:grid-cols-3">
              <Skeleton class="h-24" />
              <Skeleton class="h-24" />
              <Skeleton class="h-24" />
            </div>
          </div>
        {:then Module}
          {@const Tab = Module.default}
          <Tab
            loading={loading}
            {members}
            {groups}
            {tournaments}
            {activeTournament}
            {completedMatches}
            {matches}
            {participants}
            progressPercent={progressPercent}
          />
        {:catch error}
          <div class="text-destructive text-sm">Failed to load dashboard</div>
        {/await}
      
      {:else if activeTab === 'members'}
        <MembersTab
          {members}
          {groups}
          {participants}
          {filteredMembers}
          {searchQuery}
          {filterGroup}
          {registrationFilter}
          {registeredMemberIds}
          {selectedMemberIds}
          {allFilteredSelected}
          {selectedTournament}
          onSearchChange={(v) => searchQuery = v}
          onFilterGroupChange={(v) => filterGroup = v}
          onRegistrationFilterChange={(v) => registrationFilter = v}
          onResetFilters={() => { searchQuery = ''; filterGroup = 'all'; registrationFilter = 'all'; }}
          onOpenAddMember={() => showAddMember = true}
          onOpenImportCSV={() => showImportCSV = true}
          onOpenMassAdd={() => showMassAddMembers = true}
          onOpenMassEdit={() => openMassEditMembers()}
          onAddAllParticipants={addAllParticipants}
          onClearAllParticipants={clearParticipants}
          onRegisterSelectedMembers={registerSelectedMembers}
          onRegisterGroupMembers={registerGroupMembers}
          onToggleMemberSelection={toggleMemberSelection}
          onClearSelection={() => selectedMemberIds = new SvelteSet()}
          onToggleMemberRegistration={toggleMemberRegistration}
          onOpenEditMember={(member) => { editingMember = { ...member }; showEditMember = true; }}
          onDeleteMember={deleteMember}
          {getGroupName}
          resetMassMembers={resetMassMembers}
        />

      {:else if activeTab === 'groups'}
        <GroupsTab
          {groups}
          {membersByGroupId}
          expandedGroupId={expandedGroupId}
          onExpand={setExpandedGroup}
          onOpenAddGroup={() => showAddGroup = true}
          onEditGroup={(g) => { editingGroup = g; showEditGroup = true; }}
          onDeleteGroup={deleteGroup}
          onAddMemberToGroup={(groupId) => { newMember.groupId = groupId; showAddMember = true; }}
          onDeleteMember={deleteMember}
        />

      {:else if activeTab === 'tournament'}
        <TournamentTab
            bind:selectedTournamentId
            bind:settingsSheetOpen
            bind:boguTimerDuration
            bind:boguMatchType
            bind:timerDisplayMode
            bind:hanteiRound1
            bind:hanteiRound2
            bind:adminPasscodeInput
            bind:courtkeeperPasscodeInput
            {adminPasscode}
            {courtkeeperPasscode}
            {tournaments}
            {selectedTournament}
            {tournamentSelectorLabel}
            {setupStep}
            {participants}
            {matches}
            {groupOrder}
            {groups}
            {membersByGroupId}
            {matchesByGroupId}
            {matchStatsByGroup}
            {collapsedGroups}
            {courtAMatches}
            {courtBMatches}
            {courtACompletedCount}
            {courtBCompletedCount}
            {currentCourtAMatch}
            {currentCourtBMatch}
            {pendingMatches}
            {inProgressMatches}
            {completedMatches}
            {progressPercent}
            {isComplete}
            {KIHON_WAZA_OPTIONS}
            {TIMER_OPTIONS}
            {SCORE_LABELS}
            {buildScoreTimeline}
            onOpenCreateTournament={() => showCreateTournament = true}
            onAddAllParticipants={addAllParticipants}
            onGenerateMatches={generateMatches}
            onStartTournament={startTournament}
            onCompleteTournament={completeTournament}
            onOpenSettings={() => settingsSheetOpen = true}
            onResetTournament={resetTournament}
            onDeleteTournament={() => { settingsSheetOpen = false; showDeleteConfirm = true; }}
            onSetGroupCourt={setGroupCourt}
            onToggleGroupCollapse={toggleGroupCollapse}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            onApplyBoguSettings={applyBoguSettings}
            onApplyTimerDisplayMode={applyTimerDisplayMode}
            onApplyHanteiSettings={applyHanteiSettings}
            onSaveAdminPasscode={saveAdminPasscode}
            onSaveCourtkeeperPasscode={saveCourtkeeperPasscode}
            onLockAdmin={lockAdmin}
            onRefreshParticipants={refreshParticipants}
            {getGroupById}
            {getEffectiveCourt}
            {getMemberById}
            {formatTimer}
        />

      {:else if activeTab === 'results'}
        {#await loadResultsTab()}
          <div class="space-y-4">
            <Skeleton class="h-8 w-32" />
            <div class="space-y-2">
              <Skeleton class="h-20" />
              <Skeleton class="h-20" />
            </div>
          </div>
        {:then Module}
          {@const Tab = Module.default}
          <Tab
            {groups}
            {matches}
            {selectedTournament}
            {matchesByGroupId}
            {completedMatchesByGroupId}
            {standingsData}
            {SCORE_LABELS}
            {buildScoreTimeline}
            {getTieKey}
            {getMemberName}
            {formatTimer}
          />
        {:catch error}
          <div class="text-destructive text-sm">Failed to load results</div>
        {/await}

      {:else if activeTab === 'history'}
        {#await loadHistoryTab()}
          <div class="space-y-4">
            <Skeleton class="h-8 w-32" />
            <div class="space-y-2">
              <Skeleton class="h-16" />
              <Skeleton class="h-16" />
            </div>
          </div>
        {:then Module}
          {@const Tab = Module.default}
          <Tab
            {tournaments}
          />
        {:catch error}
          <div class="text-destructive text-sm">Failed to load history</div>
        {/await}
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
      <div class="space-y-2">
        <Label for="member-group">Group</Label>
        <Select.Root value={newMember.groupId} onValueChange={(v) => newMember.groupId = v}>
          <Select.Trigger class="w-full h-10 text-sm rounded-lg border border-input bg-background px-3">
            <Select.Value placeholder="Select Group" />
            <Select.Icon class="ml-auto"><ChevronDown class="h-4 w-4" /></Select.Icon>
          </Select.Trigger>
          <Select.Content class="z-40">
            <Select.Item value="">Select Group</Select.Item>
            {#each groups as g}
              <Select.Item value={g.groupId}>{g.name}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>
    </div>
    <Dialog.Footer class="flex-col sm:flex-row gap-2"><Button variant="secondary" onclick={() => showAddMember = false} class="w-full sm:w-auto">Cancel</Button><Button onclick={createMember} class="w-full sm:w-auto">Add</Button></Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={showEditMember}>
  <Dialog.Content class="sm:max-w-sm max-w-[calc(100vw-2rem)]">
    <Dialog.Header><Dialog.Title>Edit Member</Dialog.Title></Dialog.Header>
    {#if editingMember}
      <div class="space-y-4 py-4">
        <div class="space-y-2">
          <Label for="edit-member-first">First Name</Label>
          <Input id="edit-member-first" bind:value={editingMember.firstName} />
        </div>
        <div class="space-y-2">
          <Label for="edit-member-last">Last Name</Label>
          <Input id="edit-member-last" bind:value={editingMember.lastName} />
        </div>
        <div class="space-y-2">
          <Label for="edit-member-group">Group</Label>
          <Select.Root value={editingMember.groupId} onValueChange={(v) => editingMember.groupId = v}>
            <Select.Trigger class="w-full h-10 text-sm rounded-lg border border-input bg-background px-3">
              <Select.Value placeholder="Select Group" />
              <Select.Icon class="ml-auto"><ChevronDown class="h-4 w-4" /></Select.Icon>
            </Select.Trigger>
            <Select.Content class="z-40">
              <Select.Item value="">Select Group</Select.Item>
              {#each groups as g}
                <Select.Item value={g.groupId}>{g.name}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </div>
        <div class="space-y-2">
        </div>
      </div>
    {/if}
    <Dialog.Footer class="flex-col sm:flex-row gap-2">
      <Button variant="secondary" onclick={() => { showEditMember = false; editingMember = null; }} class="w-full sm:w-auto">Cancel</Button>
      <Button onclick={updateMember} class="w-full sm:w-auto">Save</Button>
    </Dialog.Footer>
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
            <Select.Root value={member.groupId} onValueChange={(v) => member.groupId = v}>
              <Select.Trigger class="rounded-lg border border-input bg-background px-2 py-2 text-xs h-9 w-full">
                <Select.Value placeholder="-" />
                <Select.Icon class="ml-auto"><ChevronDown class="h-3 w-3" /></Select.Icon>
              </Select.Trigger>
              <Select.Content class="z-40">
                <Select.Item value="">-</Select.Item>
                {#each groups as g}
                  <Select.Item value={g.groupId}>{g.groupId}</Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
            <button onclick={() => massMembers = massMembers.filter((_, idx) => idx !== i)} class="flex items-center justify-center text-muted-foreground hover:text-destructive"><Trash2 class="h-4 w-4" /></button>
          </div>
        {/each}
      </div>
      <button onclick={addMoreRows} class="mt-4 flex items-center gap-2 text-sm text-primary hover:text-primary/80"><Plus class="h-4 w-4" /> Add 5 more</button>
    </div>
    <Dialog.Footer class="flex-col sm:flex-row gap-2"><Button variant="secondary" onclick={() => showMassAddMembers = false} class="w-full sm:w-auto">Cancel</Button><Button onclick={createMassMembers} class="w-full sm:w-auto">Add ({massMembers.filter(m => m.firstName.trim() && m.lastName.trim() && m.groupId).length})</Button></Dialog.Footer>
  </Dialog.Content>
  </Dialog.Root>
  
  <Dialog.Root bind:open={showMassEditMembers}>
    <Dialog.Content class="sm:max-w-4xl max-w-[calc(100vw-2rem)]">
      <Dialog.Header>
        <Dialog.Title>Bulk Edit Members</Dialog.Title>
        <Dialog.Description>Edits apply to the current filtered list.</Dialog.Description>
      </Dialog.Header>
      <div class="py-4 overflow-x-auto">
        <div class="mb-2 grid grid-cols-[1fr_1fr_140px] gap-2 text-xs font-medium text-muted-foreground min-w-[360px]">
          <span>First</span>
          <span>Last</span>
          <span>Group</span>
        </div>
        <div class="space-y-2 min-w-[360px] max-h-[60vh] overflow-y-auto pr-1" use:autoAnimate>
          {#each massEditMembers as member (member.id)}
            <div class="grid grid-cols-[1fr_1fr_140px] gap-2">
              <Input bind:value={member.firstName} placeholder="First" class="text-sm" />
              <Input bind:value={member.lastName} placeholder="Last" class="text-sm" />
              <Select.Root value={member.groupId} onValueChange={(v) => member.groupId = v}>
                <Select.Trigger class="rounded-lg border border-input bg-background px-2 py-2 text-xs h-9 w-full">
                  <Select.Value placeholder="-" />
                  <Select.Icon class="ml-auto"><ChevronDown class="h-3 w-3" /></Select.Icon>
                </Select.Trigger>
                <Select.Content class="z-40">
                  <Select.Item value="">-</Select.Item>
                  {#each groups as g}
                    <Select.Item value={g.groupId}>{g.groupId}</Select.Item>
                  {/each}
                </Select.Content>
              </Select.Root>
            </div>
          {:else}
            <p class="text-sm text-muted-foreground text-center py-6">No members to edit.</p>
          {/each}
        </div>
      </div>
      <Dialog.Footer class="flex-col sm:flex-row gap-2">
        <Button variant="secondary" onclick={() => showMassEditMembers = false} class="w-full sm:w-auto">Cancel</Button>
        <Button onclick={saveMassEditMembers} class="w-full sm:w-auto">Save Changes</Button>
      </Dialog.Footer>
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
        <div class="space-y-2">
          <Label for="tournament-month" class="text-xs">Month</Label>
          <Select.Root value={newTournament.month} onValueChange={(v) => newTournament.month = v}>
            <Select.Trigger class="w-full h-10 text-sm rounded-lg border border-input bg-background px-3">
              <Select.Value placeholder="Select" />
              <Select.Icon class="ml-auto"><ChevronDown class="h-4 w-4" /></Select.Icon>
            </Select.Trigger>
            <Select.Content class="z-40">
              <Select.Item value="">Select</Select.Item>
              {#each MONTHS as month}
                <Select.Item value={month}>{month}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </div>
        <div class="space-y-2">
          <Label for="tournament-year" class="text-xs">Year</Label>
          <Select.Root value={newTournament.year} onValueChange={(v) => newTournament.year = Number(v)}>
            <Select.Trigger class="w-full h-10 text-sm rounded-lg border border-input bg-background px-3">
              <Select.Value placeholder="Year" />
              <Select.Icon class="ml-auto"><ChevronDown class="h-4 w-4" /></Select.Icon>
            </Select.Trigger>
            <Select.Content class="z-40">
              {#each [2024, 2025, 2026, 2027] as year}
                <Select.Item value={year.toString()}>{year}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </div>
      </div>
      <div class="space-y-2"><Label for="tournament-name" class="text-xs">Name <span class="text-muted-foreground">(optional)</span></Label><Input id="tournament-name" bind:value={newTournament.name} placeholder={generateTournamentName()} class="text-sm" /></div>
      <div class="space-y-2">
        <Label for="tournament-date" class="text-xs">Date</Label>
        <div class="rounded-lg border border-input bg-background p-3">
          <Calendar.Calendar
            bind:value={tournamentDateValue}
            captionLayout="dropdown"
            locale="en-US"
            on:change={() => { newTournament.date = tournamentDateValue ? tournamentDateValue.toString() : ''; }}
          />
        </div>
      </div>
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

{/if}

