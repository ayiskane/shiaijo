<script lang="ts">
  import { onMount } from 'svelte';
  import autoAnimate from '@formkit/auto-animate';
  import { cn } from '$lib/utils';
  import { IsMobile } from '$lib/hooks/is-mobile.svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import * as Select from '$lib/components/ui/select';
  import * as ToggleGroup from '$lib/components/ui/toggle-group';
  import * as Sheet from '$lib/components/ui/sheet';
  import { Progress } from '$lib/components/ui/progress';
  import { Separator } from '$lib/components/ui/separator';
  import { Badge } from '$lib/components/ui/badge';
  import { Label } from '$lib/components/ui/label';
  import { Input } from '$lib/components/ui/input';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import {
    Trophy, Users, Swords, Play, Settings, Archive, ChevronDown, GripVertical,
    Check, Timer, Lock, RotateCcw, Trash2, UserPlus, KeyRound, RefreshCw, Plus,
    Search, X, ChevronRight
  } from '@lucide/svelte';
  
  const isMobile = new IsMobile();

  // Props using Svelte 5 runes
  let {
    tournaments = [],
    selectedTournamentId = $bindable(null),
    selectedTournament,
    tournamentSelectorLabel = 'Select tournament',
    setupStep = 1,
    participants = [],
    matches = [],
    groupOrder = [],
    groups = [],
    members = [],
    membersByGroupId = new Map(),
    matchesByGroupId = new Map(),
    matchStatsByGroup = new Map(),
    collapsedGroups = new Set(),
    courtAMatches = [],
    courtBMatches = [],
    courtACompletedCount = 0,
    courtBCompletedCount = 0,
    currentCourtAMatch = null,
    currentCourtBMatch = null,
    pendingMatches = [],
    inProgressMatches = [],
    completedMatches = [],
    progressPercent = 0,
    isComplete = false,
    boguTimerDuration = $bindable(180),
    boguMatchType = $bindable<'sanbon' | 'ippon'>('sanbon'),
    timerDisplayMode = $bindable<'up' | 'down'>('up'),
    hanteiRound1 = $bindable(['K', 'M']),
    hanteiRound2 = $bindable(['M', 'K', 'D']),
    KIHON_WAZA_OPTIONS = [],
    TIMER_OPTIONS = [],
    SCORE_LABELS = {},
    settingsSheetOpen = $bindable(false),
    adminPasscodeInput = $bindable(''),
    courtkeeperPasscodeInput = $bindable(''),
    adminPasscode = null,
    courtkeeperPasscode = null,
    registeredMemberIds = new Set<string>(),
    onOpenCreateTournament,
    onAddAllParticipants,
    onClearAllParticipants,
    onRegisterMember,
    onUnregisterMember,
    onRegisterGroupMembers,
    onUnregisterGroupMembers,
    onGenerateMatches,
    onStartTournament,
    onCompleteTournament,
    onOpenSettings,
    onCloseSettings = undefined,
    onResetTournament,
    onDeleteTournament,
    onSetGroupCourt,
    onToggleGroupCollapse,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    onDragEnd,
    onApplyBoguSettings,
    onApplyTimerDisplayMode,
    onApplyHanteiSettings,
    onSaveAdminPasscode,
    onSaveCourtkeeperPasscode,
    onLockAdmin,
    onRefreshParticipants,
    getGroupById,
    getEffectiveCourt,
    getMemberById,
    getGroupName,
    formatTimer,
    buildScoreTimeline
  }: {
    tournaments?: any[];
    selectedTournamentId?: string | null;
    selectedTournament?: any;
    tournamentSelectorLabel?: string;
    setupStep?: number;
    participants?: any[];
    matches?: any[];
    groupOrder?: string[];
    groups?: any[];
    members?: any[];
    membersByGroupId?: Map<string, any[]>;
    matchesByGroupId?: Map<string, any[]>;
    matchStatsByGroup?: Map<string, any>;
    collapsedGroups?: Set<string>;
    courtAMatches?: any[];
    courtBMatches?: any[];
    courtACompletedCount?: number;
    courtBCompletedCount?: number;
    currentCourtAMatch?: any;
    currentCourtBMatch?: any;
    pendingMatches?: any[];
    inProgressMatches?: any[];
    completedMatches?: any[];
    progressPercent?: number;
    isComplete?: boolean;
    boguTimerDuration?: number;
    boguMatchType?: 'sanbon' | 'ippon';
    timerDisplayMode?: 'up' | 'down';
    hanteiRound1?: string[];
    hanteiRound2?: string[];
    KIHON_WAZA_OPTIONS?: { id: string; short: string }[];
    TIMER_OPTIONS?: number[];
    SCORE_LABELS?: Record<number, string>;
    settingsSheetOpen?: boolean;
    adminPasscodeInput?: string;
    courtkeeperPasscodeInput?: string;
    adminPasscode?: string | null;
    courtkeeperPasscode?: string | null;
    registeredMemberIds?: Set<string>;
    onOpenCreateTournament: () => void;
    onAddAllParticipants: () => void;
    onClearAllParticipants?: () => void;
    onRegisterMember?: (memberId: string) => void;
    onUnregisterMember?: (memberId: string) => void;
    onRegisterGroupMembers?: (groupId: string) => void;
    onUnregisterGroupMembers?: (groupId: string) => void;
    onGenerateMatches: () => void;
    onStartTournament: () => void;
    onCompleteTournament: () => void;
    onOpenSettings: () => void;
    onCloseSettings?: () => void;
    onResetTournament: () => void;
    onDeleteTournament: () => void;
    onSetGroupCourt: (groupId: string, court: 'A' | 'B' | 'A+B') => void;
    onToggleGroupCollapse: (groupId: string) => void;
    onDragStart: (e: DragEvent, groupId: string) => void;
    onDragOver: (e: DragEvent, groupId: string) => void;
    onDragLeave: (e: DragEvent) => void;
    onDrop: (e: DragEvent, groupId: string) => void;
    onDragEnd: () => void;
    onApplyBoguSettings: () => void;
    onApplyTimerDisplayMode: () => void;
    onApplyHanteiSettings: () => void;
    onSaveAdminPasscode: () => void;
    onSaveCourtkeeperPasscode: () => void;
    onLockAdmin: () => void;
    onRefreshParticipants: () => void;
    getGroupById: (groupId: string) => any;
    getEffectiveCourt: (groupId: string) => 'A' | 'B' | 'A+B';
    getMemberById: (id: string) => any;
    getGroupName?: (groupId: string) => string;
    formatTimer: (secs: number) => string;
    buildScoreTimeline?: (match: any) => any[];
  } = $props();

  // Callback when sheet closes
  function handleSheetOpenChange(open: boolean) {
    settingsSheetOpen = open;
  }

  const BUILD_TAG = 'tournament-v2-participants';

  function openSettings() {
    console.debug('[admin][tournament] settings gear clicked', { selectedTournamentId, status: selectedTournament?.status, build: BUILD_TAG });
    settingsSheetOpen = true;
  }

  // Local state for participant management
  let registeredSearchQuery = $state('');
  let availableSearchQuery = $state('');
  let mobileParticipantTab = $state<'registered' | 'available'>('registered');

  let listEl: HTMLElement | undefined = $state(undefined);
  let registeredListEl: HTMLElement | undefined = $state(undefined);
  let availableListEl: HTMLElement | undefined = $state(undefined);
  
  $effect(() => {
    if (listEl) autoAnimate(listEl);
  });

  $effect(() => {
    if (registeredListEl) autoAnimate(registeredListEl, { duration: 150 });
  });

  $effect(() => {
    if (availableListEl) autoAnimate(availableListEl, { duration: 150 });
  });
  
  $effect(() => {
    console.debug('[admin][tournament] settingsSheetOpen', settingsSheetOpen, 'tournament', selectedTournamentId);
  });

  // Compute registered and available members
  let registeredMembers = $derived(
    members
      .filter(m => !m.archived && registeredMemberIds.has(m._id))
      .filter(m => {
        if (!registeredSearchQuery) return true;
        return `${m.firstName} ${m.lastName}`.toLowerCase().includes(registeredSearchQuery.toLowerCase());
      })
  );
  
  let availableMembers = $derived(
    members
      .filter(m => !m.archived && !registeredMemberIds.has(m._id))
      .filter(m => {
        if (!availableSearchQuery) return true;
        return `${m.firstName} ${m.lastName}`.toLowerCase().includes(availableSearchQuery.toLowerCase());
      })
  );

  // Group members by groupId for display
  let registeredByGroup = $derived.by(() => {
    const map = new Map<string, any[]>();
    for (const m of registeredMembers) {
      const arr = map.get(m.groupId) || [];
      arr.push(m);
      map.set(m.groupId, arr);
    }
    return map;
  });

  let availableByGroup = $derived.by(() => {
    const map = new Map<string, any[]>();
    for (const m of availableMembers) {
      const arr = map.get(m.groupId) || [];
      arr.push(m);
      map.set(m.groupId, arr);
    }
    return map;
  });

  // Get unique groups that have members
  let groupsWithRegistered = $derived([...registeredByGroup.keys()].map(gId => groups.find(g => g.groupId === gId)).filter(Boolean));
  let groupsWithAvailable = $derived([...availableByGroup.keys()].map(gId => groups.find(g => g.groupId === gId)).filter(Boolean));

  function getInitials(firstName: string, lastName: string): string {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  }

  function handleRegisterMember(memberId: string) {
    if (onRegisterMember) onRegisterMember(memberId);
  }

  function handleUnregisterMember(memberId: string) {
    if (onUnregisterMember) onUnregisterMember(memberId);
  }

  function handleRegisterGroup(groupId: string) {
    if (onRegisterGroupMembers) onRegisterGroupMembers(groupId);
  }

  function handleUnregisterGroup(groupId: string) {
    if (onUnregisterGroupMembers) onUnregisterGroupMembers(groupId);
  }
  
  // mark externally-provided props as used to satisfy runes a11y checks
  const _keepProps = [groups, pendingMatches, SCORE_LABELS, getGroupName, buildScoreTimeline];

  onMount(() => {
    console.debug('[admin] TournamentTab mounted', {
      tournamentsCount: tournaments.length,
      selectedTournamentId,
      matchesCount: matches.length,
      participantsCount: participants.length,
    });
  });
</script>

<!-- Top Bar -->
<div class="top-bar">
  <div class="top-bar-left">
    <span class="top-bar-breadcrumb">Admin</span>
    <span class="top-bar-title">
      Tournament Control
      {#if selectedTournament?.status === 'in_progress'}
        <span class="top-bar-badge live">Live</span>
      {/if}
    </span>
  </div>
  {#if selectedTournament}
    <div class="top-bar-center">
      <div class="top-bar-stats">
        <div class="top-bar-progress">
          <div class="top-bar-progress-header">
            <span class="top-bar-progress-label">Progress</span>
            <span class="top-bar-progress-value">{progressPercent}%</span>
          </div>
          <div class="top-bar-progress-track">
            <div class="top-bar-progress-fill" style="width: {progressPercent}%;"></div>
          </div>
        </div>
        <div class="top-bar-divider"></div>
        <div class="top-bar-stat">
          <div class="top-bar-stat-value">{matches.length - completedMatches.length}</div>
          <div class="top-bar-stat-label">Matches Left</div>
        </div>
      </div>
    </div>
  {/if}
  <div class="top-bar-right">
    {#if selectedTournament}
      <button class="btn-sm ghost" onclick={openSettings}>⚙ Settings</button>
    {/if}
    <button class="btn-sm primary" onclick={onOpenCreateTournament}>+ New Tournament</button>
  </div>
</div>

{#if tournaments.length === 0}
  <Card.Root class="border-dashed">
    <Card.Content class="flex flex-col items-center justify-center py-12">
      <Trophy class="mb-4 h-12 w-12 text-muted-foreground/50" />
      <p class="mb-4 text-muted-foreground">No tournaments yet</p>
      <Button onclick={onOpenCreateTournament}>Create Your First Tournament</Button>
    </Card.Content>
  </Card.Root>
{:else}
  <!-- Tournament Selector with Label -->
  <div class="mb-4">
    <Label class="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">Currently Editing Tournament</Label>
    <div class="flex items-center gap-2">
      <Select.Root type="single" bind:value={selectedTournamentId}>
        <Select.Trigger class="flex-1 rounded-xl h-12 border-2 border-primary/50">
          <div class="flex items-center gap-2">
            <Trophy class="w-4 h-4 text-primary" />
            <span>{tournamentSelectorLabel}</span>
          </div>
        </Select.Trigger>
      <Select.Content>
        {#each tournaments as t (t._id)}
          <Select.Item value={t._id} label={`${t.name} - ${t.status}`}>
            <div class="flex items-center justify-between w-full">
              <span>{t.name}</span>
              <Badge variant="outline" class={cn(
                'ml-2 text-[10px]',
                t.status === 'in_progress'
                  ? 'border-amber-500 text-amber-400'
                  : t.status === 'setup'
                  ? 'border-yellow-500 text-yellow-400'
                  : 'border-emerald-500 text-emerald-400'
              )}>
                {t.status === 'setup' ? 'Setup' : t.status === 'in_progress' ? 'Live' : 'Done'}
              </Badge>
            </div>
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
    <!-- Delete Tournament Button -->
    <Button 
      variant="outline" 
      size="icon" 
      class="h-12 w-12 rounded-xl border-2 border-red-500/50 hover:bg-red-500/20 hover:border-red-500 shrink-0" 
      onclick={onDeleteTournament}
      title="Delete Tournament"
    >
      <Trash2 class="w-5 h-5 text-red-400" />
    </Button>
    </div>
  </div>

  {#if selectedTournament}
    {#if selectedTournament.status === 'setup'}
      <!-- 3-Step Stepper -->
      <div class="flex items-center justify-center gap-2 mb-6">
        {#each [
          { num: 1, name: 'Participants', icon: Users },
          { num: 2, name: 'Courts', icon: Settings },
          { num: 3, name: 'Start', icon: Swords }
        ] as step}
          {@const StepIcon = step.icon}
          {@const isActive = (step.num === 1 && participants.length === 0) || (step.num === 2 && participants.length > 0 && matches.length === 0) || (step.num === 3 && matches.length > 0)}
          {@const isCompleteStep = (step.num === 1 && participants.length > 0) || (step.num === 2 && matches.length > 0)}
          <div class="flex items-center gap-2">
            <div class={cn(
              'w-9 h-9 rounded-full flex items-center justify-center transition-all',
              isCompleteStep
                ? 'bg-emerald-500 text-white'
                : isActive
                ? 'bg-primary ring-4 ring-primary/20 text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            )}>
              {#if isCompleteStep}
                <Check class="w-4 h-4" />
              {:else}
                <StepIcon class="w-4 h-4" />
              {/if}
            </div>
            <span class={cn('text-sm font-medium hidden sm:inline', isActive ? 'text-primary' : isCompleteStep ? 'text-emerald-400' : 'text-muted-foreground')}>
              {step.name}
            </span>
          </div>
          {#if step.num < 3}
            <div class={cn('w-8 h-0.5', isCompleteStep ? 'bg-emerald-500' : 'bg-muted')}></div>
          {/if}
        {/each}
      </div>

      <!-- Step 1: Participants (when no participants OR can always edit) -->
      {#if participants.length === 0 || matches.length === 0}
        <!-- Summary Bar -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-card border border-border mb-4 gap-3">
          <div class="flex items-center gap-4 sm:gap-6">
            <div class="flex items-baseline gap-2">
              <span class="text-2xl font-bold text-emerald-400">{participants.length}</span>
              <span class="text-sm text-muted-foreground">registered</span>
            </div>
            <Separator orientation="vertical" class="h-6 hidden sm:block" />
            <div class="flex items-baseline gap-2">
              <span class="text-2xl font-bold text-blue-400">{availableMembers.length}</span>
              <span class="text-sm text-muted-foreground">available</span>
            </div>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            {#each groupsWithRegistered as group}
              <Badge variant="secondary" class="text-xs">
                <span class="font-semibold mr-1">{registeredByGroup.get(group.groupId)?.length || 0}</span>
                {group.name}
              </Badge>
            {/each}
          </div>
        </div>

        <!-- Dual Panel (Desktop) / Tabs (Mobile) -->
        {#if !isMobile.current}
          <div class="grid grid-cols-2 gap-4 mb-4">
            <!-- Registered Panel (Left) -->
            <div class="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
              <div class="px-4 py-3 border-b border-border bg-emerald-500/10 flex items-center justify-between">
                <h3 class="font-semibold text-emerald-400 flex items-center gap-2">
                  <Check class="w-4 h-4" />
                  Registered
                  <Badge variant="secondary" class="bg-emerald-500/20 text-emerald-400">{registeredMembers.length}</Badge>
                </h3>
                {#if onClearAllParticipants && participants.length > 0}
                  <Button variant="ghost" size="sm" class="h-7 text-xs text-destructive hover:text-destructive" onclick={onClearAllParticipants}>
                    Clear All
                  </Button>
                {/if}
              </div>
              <div class="px-3 py-2 border-b border-border">
                <div class="relative">
                  <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    type="text" 
                    placeholder="Search registered..." 
                    class="pl-8 h-9"
                    bind:value={registeredSearchQuery}
                  />
                </div>
              </div>
              <div class="flex-1 overflow-y-auto max-h-[380px]" bind:this={registeredListEl}>
                {#each groupsWithRegistered as group (group._id)}
                  {@const groupMembers = registeredByGroup.get(group.groupId) || []}
                  <div class="sticky top-0 z-10 px-3 py-2 bg-muted/80 backdrop-blur-sm border-b border-border flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.name}</span>
                      <Badge variant="outline" class="text-xs">{groupMembers.length}</Badge>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      class="h-6 px-2 text-xs text-destructive hover:text-destructive opacity-70 hover:opacity-100"
                      onclick={() => handleUnregisterGroup(group.groupId)}
                    >
                      Remove All
                    </Button>
                  </div>
                  {#each groupMembers as member (member._id)}
                    <div class="flex items-center gap-3 px-3 py-2.5 border-b border-border hover:bg-muted/30 transition-colors group">
                      <div class="cell-avatar-gradient shrink-0" style="width: 32px; height: 32px; font-size: 11px;">
                        {getInitials(member.firstName, member.lastName)}
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="text-sm font-medium truncate">{member.firstName} {member.lastName}</div>
                        <div class="text-xs text-muted-foreground">{member.rank || 'No rank'}</div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        class="h-7 px-2 text-xs opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onclick={() => handleUnregisterMember(member._id)}
                      >
                        Remove
                      </Button>
                    </div>
                  {/each}
                {:else}
                  <div class="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Users class="w-10 h-10 mb-2 opacity-50" />
                    <p class="text-sm">No participants registered</p>
                    <p class="text-xs mt-1">Add members from the right panel</p>
                  </div>
                {/each}
              </div>
            </div>

            <!-- Available Panel (Right) -->
            <div class="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
              <div class="px-4 py-3 border-b border-border bg-blue-500/10 flex items-center justify-between">
                <h3 class="font-semibold text-blue-400 flex items-center gap-2">
                  Available
                  <Badge variant="secondary" class="bg-blue-500/20 text-blue-400">{availableMembers.length}</Badge>
                </h3>
                <Button size="sm" class="h-7" onclick={onAddAllParticipants}>
                  <Plus class="w-3 h-3 mr-1" />
                  Add All
                </Button>
              </div>
              <div class="px-3 py-2 border-b border-border">
                <div class="relative">
                  <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    type="text" 
                    placeholder="Search available..." 
                    class="pl-8 h-9"
                    bind:value={availableSearchQuery}
                  />
                </div>
              </div>
              <div class="flex-1 overflow-y-auto max-h-[380px]" bind:this={availableListEl}>
                {#each groupsWithAvailable as group (group._id)}
                  {@const groupMembers = availableByGroup.get(group.groupId) || []}
                  <div class="sticky top-0 z-10 px-3 py-2 bg-muted/80 backdrop-blur-sm border-b border-border flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.name}</span>
                      <Badge variant="outline" class="text-xs">{groupMembers.length}</Badge>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      class="h-6 px-2 text-xs text-blue-400 hover:text-blue-300 opacity-70 hover:opacity-100"
                      onclick={() => handleRegisterGroup(group.groupId)}
                    >
                      + Add All
                    </Button>
                  </div>
                  {#each groupMembers as member (member._id)}
                    <div class="flex items-center gap-3 px-3 py-2.5 border-b border-border hover:bg-muted/30 transition-colors group">
                      <div class="cell-avatar-gradient shrink-0" style="width: 32px; height: 32px; font-size: 11px;">
                        {getInitials(member.firstName, member.lastName)}
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="text-sm font-medium truncate">{member.firstName} {member.lastName}</div>
                        <div class="text-xs text-muted-foreground">{member.rank || 'No rank'}</div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        class="h-7 px-2 text-xs opacity-0 group-hover:opacity-100 text-primary hover:text-primary hover:bg-primary/10"
                        onclick={() => handleRegisterMember(member._id)}
                      >
                        + Add
                      </Button>
                    </div>
                  {/each}
                {:else}
                  <div class="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Check class="w-10 h-10 mb-2 opacity-50" />
                    <p class="text-sm">All members registered!</p>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        {:else}
          <!-- Mobile: Tab-based -->
          <div class="rounded-xl border border-border bg-card overflow-hidden mb-4">
            <div class="flex border-b border-border">
              <button 
                class={cn(
                  "flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2",
                  mobileParticipantTab === 'registered' 
                    ? "bg-emerald-500/10 text-emerald-400 border-b-2 border-emerald-500" 
                    : "text-muted-foreground"
                )}
                onclick={() => mobileParticipantTab = 'registered'}
              >
                Registered
                <Badge variant="secondary" class="text-xs">{registeredMembers.length}</Badge>
              </button>
              <button 
                class={cn(
                  "flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2",
                  mobileParticipantTab === 'available' 
                    ? "bg-blue-500/10 text-blue-400 border-b-2 border-blue-500" 
                    : "text-muted-foreground"
                )}
                onclick={() => mobileParticipantTab = 'available'}
              >
                Available
                <Badge variant="secondary" class="text-xs">{availableMembers.length}</Badge>
              </button>
            </div>
            
            {#if mobileParticipantTab === 'registered'}
              <div class="px-3 py-2 border-b border-border">
                <div class="relative">
                  <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    type="text" 
                    placeholder="Search registered..." 
                    class="pl-8 h-10"
                    bind:value={registeredSearchQuery}
                  />
                </div>
              </div>
              <div class="max-h-[350px] overflow-y-auto">
                {#each groupsWithRegistered as group (group._id)}
                  {@const groupMembers = registeredByGroup.get(group.groupId) || []}
                  <div class="sticky top-0 z-10 px-3 py-2 bg-muted/90 backdrop-blur-sm border-b border-border flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.name}</span>
                      <Badge variant="outline" class="text-xs">{groupMembers.length}</Badge>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      class="h-8 px-3 text-xs text-destructive"
                      onclick={() => handleUnregisterGroup(group.groupId)}
                    >
                      Remove All
                    </Button>
                  </div>
                  {#each groupMembers as member (member._id)}
                    <div class="flex items-center gap-3 px-3 py-3 border-b border-border">
                      <div class="cell-avatar-gradient shrink-0" style="width: 36px; height: 36px; font-size: 12px;">
                        {getInitials(member.firstName, member.lastName)}
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="text-sm font-medium truncate">{member.firstName} {member.lastName}</div>
                        <div class="text-xs text-muted-foreground">{member.rank || 'No rank'}</div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        class="h-9 px-3 text-xs text-destructive border-destructive/30"
                        onclick={() => handleUnregisterMember(member._id)}
                      >
                        Remove
                      </Button>
                    </div>
                  {/each}
                {:else}
                  <div class="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Users class="w-10 h-10 mb-2 opacity-50" />
                    <p class="text-sm">No participants registered</p>
                  </div>
                {/each}
              </div>
            {:else}
              <div class="px-3 py-2 border-b border-border flex items-center gap-2">
                <div class="relative flex-1">
                  <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    type="text" 
                    placeholder="Search available..." 
                    class="pl-8 h-10"
                    bind:value={availableSearchQuery}
                  />
                </div>
                <Button size="sm" class="h-10" onclick={onAddAllParticipants}>
                  <Plus class="w-3 h-3 mr-1" />
                  Add All
                </Button>
              </div>
              <div class="max-h-[350px] overflow-y-auto">
                {#each groupsWithAvailable as group (group._id)}
                  {@const groupMembers = availableByGroup.get(group.groupId) || []}
                  <div class="sticky top-0 z-10 px-3 py-2 bg-muted/90 backdrop-blur-sm border-b border-border flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.name}</span>
                      <Badge variant="outline" class="text-xs">{groupMembers.length}</Badge>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      class="h-8 px-3 text-xs text-blue-400"
                      onclick={() => handleRegisterGroup(group.groupId)}
                    >
                      + Add All
                    </Button>
                  </div>
                  {#each groupMembers as member (member._id)}
                    <div class="flex items-center gap-3 px-3 py-3 border-b border-border">
                      <div class="cell-avatar-gradient shrink-0" style="width: 36px; height: 36px; font-size: 12px;">
                        {getInitials(member.firstName, member.lastName)}
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="text-sm font-medium truncate">{member.firstName} {member.lastName}</div>
                        <div class="text-xs text-muted-foreground">{member.rank || 'No rank'}</div>
                      </div>
                      <Button 
                        variant="default" 
                        size="sm" 
                        class="h-9 px-3 text-xs"
                        onclick={() => handleRegisterMember(member._id)}
                      >
                        + Add
                      </Button>
                    </div>
                  {/each}
                {:else}
                  <div class="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Check class="w-10 h-10 mb-2 opacity-50" />
                    <p class="text-sm">All members registered!</p>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/if}

        <!-- Step 2: Courts (only show if we have participants) -->
        {#if participants.length > 0}
          <Card.Root class="mb-4">
            <Card.Content class="pt-6 space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="font-bold text-lg">Configure Courts</h3>
                  <p class="text-sm text-muted-foreground">{participants.length} participants ready</p>
                </div>
                <Badge class="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">{participants.length} ready</Badge>
              </div>

              {#if groupOrder.length > 0}
                <div class="space-y-2">
                  <p class="text-xs text-muted-foreground">Drag to reorder • Tap court to change</p>
                  <div class="rounded-xl border border-border overflow-hidden" bind:this={listEl}>
                    {#each groupOrder as groupId, idx (groupId)}
                      {@const group = getGroupById(groupId)}
                      {@const court = getEffectiveCourt(groupId)}
                      {@const groupMembers = membersByGroupId.get(groupId) ?? []}
                      <div
                        draggable="true"
                        role="listitem"
                        ondragstart={(e) => onDragStart(e, groupId)}
                        ondragover={(e) => onDragOver(e, groupId)}
                        ondragleave={onDragLeave}
                        ondrop={(e) => onDrop(e, groupId)}
                        ondragend={onDragEnd}
                        class="flex items-center gap-2 px-3 py-3 border-b border-border last:border-b-0 transition-all min-h-[56px]"
                      >
                        <button class="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing touch-none shrink-0">
                          <GripVertical class="h-5 w-5" />
                        </button>
                        <span class="w-6 text-center text-sm font-mono text-muted-foreground shrink-0">{idx + 1}</span>
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center gap-2">
                            <span class="font-medium truncate">{group?.name || groupId}</span>
                            {#if group?.isHantei}
                              <Badge variant="outline" class="text-[10px] border-orange-500 text-orange-400 px-1">H</Badge>
                            {/if}
                          </div>
                          <span class="text-xs text-muted-foreground">{groupMembers.length} members</span>
                        </div>
                        <ToggleGroup.Root type="single" value={court} onValueChange={(value) => value && onSetGroupCourt(groupId, value)} class="court-toggle-root">
                          <ToggleGroup.Item value="A" aria-label="Court A" class="court-toggle-item">A</ToggleGroup.Item>
                          <ToggleGroup.Item value="A+B" aria-label="Both Courts" class="court-toggle-item">+</ToggleGroup.Item>
                          <ToggleGroup.Item value="B" aria-label="Court B" class="court-toggle-item">B</ToggleGroup.Item>
                        </ToggleGroup.Root>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}

              <Button onclick={onGenerateMatches} class="w-full bg-amber-500 hover:bg-amber-600 text-black">
                <Trophy class="mr-2 h-4 w-4" /> Generate Matches
              </Button>
            </Card.Content>
          </Card.Root>
        {/if}

      <!-- Step 3: Ready to Start (matches generated) -->
      {:else}
        <Card.Root class="mb-4">
          <Card.Content class="pt-6">
            <div class="text-center py-6">
              <div class="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Swords class="h-8 w-8 text-emerald-400" />
              </div>
              <h3 class="font-bold text-lg mb-2">Ready to Begin!</h3>
              <p class="text-sm text-muted-foreground mb-2">{matches.length} matches generated</p>
              <div class="flex justify-center gap-4 text-sm text-muted-foreground mb-6">
                <span class="text-amber-400">{courtAMatches.length} Court A</span>
                <span class="text-sky-400">{courtBMatches.length} Court B</span>
              </div>
              <div class="flex flex-col sm:flex-row gap-2 justify-center">
                <Button onclick={onStartTournament} class="bg-emerald-500 hover:bg-emerald-600">
                  <Play class="mr-2 h-4 w-4" /> Start Tournament
                </Button>
                <Button onclick={openSettings} variant="outline">
                  <Settings class="mr-2 h-4 w-4" /> Configure
                </Button>
              </div>
            </div>
          </Card.Content>
        </Card.Root>
      {/if}
    {:else if selectedTournament.status === 'in_progress'}}
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="font-bold text-xl">{selectedTournament.name}</h2>
          <p class="text-xs text-muted-foreground">📅 {selectedTournament.date}</p>
        </div>
        <div class="flex items-center gap-2">
          <Badge class={cn('px-3 py-1', isComplete ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse')}>
            {isComplete ? '✓ Done' : '● Live'}
          </Badge>
          <Button onclick={openSettings} variant="outline" size="icon" class="h-10 w-10">
            <Settings class="h-5 w-5" />
          </Button>
        </div>
      </div>

      <Card.Root class="mb-4">
        <Card.Content class="py-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-muted-foreground">Tournament Progress</span>
            <span class="text-sm font-bold text-amber-400">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} class="h-2" />
          <div class="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{completedMatches.length} completed</span>
            <span>{matches.length - completedMatches.length} remaining</span>
          </div>
        </Card.Content>
      </Card.Root>

      <div class="grid grid-cols-2 gap-3 mb-4">
        <div class="rounded-2xl p-3 border-2 bg-amber-950/20 border-amber-500/50">
          <div class="flex items-center justify-between mb-2">
            <div class="text-xl font-black text-amber-400">Court A</div>
            <div class="text-xs text-muted-foreground">{courtACompletedCount}/{courtAMatches.length}</div>
          </div>
          <div class="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
            <div class="h-full bg-amber-500 rounded-full" style={`width: ${courtAMatches.length > 0 ? (courtACompletedCount / courtAMatches.length) * 100 : 0}%`}></div>
          </div>
          {#if currentCourtAMatch}
            {@const p1 = getMemberById(currentCourtAMatch.player1Id)}
            {@const p2 = getMemberById(currentCourtAMatch.player2Id)}
            <div class="text-center">
              <div class="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Now Playing</div>
              <div class="text-sm font-medium">{p1?.firstName} {p1?.lastName?.charAt(0)}.</div>
              <div class="text-xs text-muted-foreground my-0.5">vs</div>
              <div class="text-sm font-medium">{p2?.firstName} {p2?.lastName?.charAt(0)}.</div>
            </div>
          {:else}
            <div class="text-center text-xs text-muted-foreground py-2">No active match</div>
          {/if}
        </div>

        <div class="rounded-2xl p-3 border-2 bg-sky-950/20 border-sky-500/50">
          <div class="flex items-center justify-between mb-2">
            <div class="text-xl font-black text-sky-400">Court B</div>
            <div class="text-xs text-muted-foreground">{courtBCompletedCount}/{courtBMatches.length}</div>
          </div>
          <div class="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
            <div class="h-full bg-sky-500 rounded-full" style={`width: ${courtBMatches.length > 0 ? (courtBCompletedCount / courtBMatches.length) * 100 : 0}%`}></div>
          </div>
          {#if currentCourtBMatch}
            {@const p1 = getMemberById(currentCourtBMatch.player1Id)}
            {@const p2 = getMemberById(currentCourtBMatch.player2Id)}
            <div class="text-center">
              <div class="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Now Playing</div>
              <div class="text-sm font-medium">{p1?.firstName} {p1?.lastName?.charAt(0)}.</div>
              <div class="text-xs text-muted-foreground my-0.5">vs</div>
              <div class="text-sm font-medium">{p2?.firstName} {p2?.lastName?.charAt(0)}.</div>
            </div>
          {:else}
            <div class="text-center text-xs text-muted-foreground py-2">No active match</div>
          {/if}
        </div>
      </div>

      <div class="grid grid-cols-4 gap-2 mb-4">
        <div class="rounded-xl bg-muted/50 p-2 text-center"><div class="text-lg font-bold text-primary">{participants.length}</div><div class="text-[10px] text-muted-foreground">Players</div></div>
        <div class="rounded-xl bg-muted/50 p-2 text-center"><div class="text-lg font-bold text-blue-400">{matches.length}</div><div class="text-[10px] text-muted-foreground">Matches</div></div>
        <div class="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-2 text-center"><div class="text-lg font-bold text-emerald-400">{completedMatches.length}</div><div class="text-[10px] text-muted-foreground">Done</div></div>
        <div class="rounded-xl bg-amber-500/10 border border-amber-500/30 p-2 text-center"><div class="text-lg font-bold text-amber-400">{inProgressMatches.length}</div><div class="text-[10px] text-muted-foreground">Live</div></div>
      </div>

      {#if isComplete}
        <Card.Root class="mb-4 bg-emerald-500/10 border-emerald-500/30">
          <Card.Content class="py-4 text-center">
            <p class="text-sm text-emerald-400 mb-3">🎉 All matches completed!</p>
            <Button onclick={onCompleteTournament} class="bg-emerald-500 hover:bg-emerald-600">
              <Archive class="mr-2 h-4 w-4" /> Archive Tournament
            </Button>
          </Card.Content>
        </Card.Root>
      {/if}

      {#if groupOrder.length > 0 && matches.length > 0}
        <div class="space-y-3">
          <h3 class="text-sm font-semibold text-muted-foreground">Match Queue</h3>
          <div class="space-y-2" bind:this={listEl}>
            {#each groupOrder as groupId (groupId)}
              {@const group = getGroupById(groupId)}
              {@const groupMatches = matchesByGroupId.get(groupId) ?? []}
              {@const groupStats = matchStatsByGroup.get(groupId) ?? { total: 0, completed: 0, inProgress: 0, pending: 0 }}
              {@const court = getEffectiveCourt(groupId)}
              {@const isCollapsed = collapsedGroups.has(groupId)}
              <div class={cn('rounded-xl border bg-card overflow-hidden transition-all', court === 'A' ? 'border-amber-700/30' : court === 'B' ? 'border-sky-700/30' : 'border-emerald-700/30')}>
                <button onclick={() => onToggleGroupCollapse(groupId)} class="w-full flex items-center gap-2 p-3 hover:bg-muted/30 transition-colors">
                  <ChevronDown class={cn('h-4 w-4 text-muted-foreground transition-transform shrink-0', isCollapsed && '-rotate-90')} />
                  <Badge class={cn('text-[10px] font-bold shrink-0', court === 'A' ? 'bg-amber-500 text-black' : court === 'B' ? 'bg-sky-500 text-white' : 'bg-emerald-500 text-white')}>
                    {court === 'A+B' ? 'A+B' : court}
                  </Badge>
                  <span class="font-medium flex-1 text-left truncate min-w-0">{group?.name || groupId}</span>
                  {#if group?.isHantei}<Badge variant="outline" class="text-[10px] border-orange-500 text-orange-400 shrink-0">H</Badge>{/if}
                  <span class="text-xs text-muted-foreground shrink-0">{groupStats.completed}/{groupStats.total}</span>
                </button>
                {#if !isCollapsed}
                  <div class="border-t border-border max-h-48 overflow-y-auto">
                    {#each groupMatches as match, idx}
                      {@const p1 = getMemberById(match.player1Id)}
                      {@const p2 = getMemberById(match.player2Id)}
                      {@const isWinner1 = match.winner === match.player1Id}
                      {@const isWinner2 = match.winner === match.player2Id}
                      <div class={cn('flex items-center gap-2 px-3 py-2 text-sm border-b border-border last:border-b-0', match.status === 'completed' ? 'bg-muted/30' : match.status === 'in_progress' ? 'bg-emerald-500/10' : 'bg-card')}>
                        <span class={cn('truncate flex-1', isWinner1 && 'font-semibold text-green-400')}>{p1?.firstName} {p1?.lastName?.charAt(0)}.</span>
                        <span class="text-xs text-muted-foreground">{match.player1Score.length} - {match.player2Score.length}</span>
                        <span class={cn('truncate flex-1 text-right', isWinner2 && 'font-semibold text-green-400')}>{p2?.firstName} {p2?.lastName?.charAt(0)}.</span>
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
      {/if}
    {:else}
      <Card.Root class="mb-4">
        <Card.Content class="py-8 text-center">
          <Trophy class="h-12 w-12 text-amber-400 mx-auto mb-4" />
          <h2 class="text-xl font-bold mb-2">Tournament Completed</h2>
          <p class="text-muted-foreground mb-4">{selectedTournament.name}</p>
          <div class="flex justify-center gap-4 text-sm">
            <span>{participants.length} participants</span>
            <span>{matches.length} matches</span>
          </div>
        </Card.Content>
      </Card.Root>
    {/if}
  {/if}
{/if}

<Sheet.Root open={settingsSheetOpen} onOpenChange={handleSheetOpenChange}>
  <Sheet.Portal>
    <Sheet.Overlay class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120]" />
    <Sheet.Content
      side="bottom"
      class="sheet-panel h-[85vh] rounded-t-3xl bg-background/98 border-t border-border z-[130] shadow-[0_-24px_60px_rgba(0,0,0,0.55)] text-foreground transition-transform duration-200 data-[state=closed]:translate-y-full data-[state=open]:translate-y-0 data-[state=closed]:opacity-0 data-[state=open]:opacity-100"
    >
      <div class="flex justify-center pt-2 pb-4"><div class="w-10 h-1 bg-muted-foreground/30 rounded-full"></div></div>
      <Sheet.Header class="px-6 pb-4">
        <Sheet.Title>Tournament Settings</Sheet.Title>
        <Sheet.Description>Configure groups, courts, and match settings</Sheet.Description>
      </Sheet.Header>

      <div class="px-6 pb-6 max-h-[calc(85vh-120px)] overflow-y-auto">
        <div class="flex flex-col lg:flex-row gap-5">
          <!-- Left column -->
          <div class="lg:w-[420px] flex-shrink-0 space-y-6">
            <div class="space-y-3">
              <h4 class="text-sm font-semibold flex items-center gap-2"><GripVertical class="h-4 w-4 text-muted-foreground" />Group Order & Courts</h4>
              <p class="text-xs text-muted-foreground">Drag to reorder. Tap court badge to change.</p>
              {#if groupOrder.length > 0}
                <div class="rounded-xl border border-border overflow-hidden" bind:this={listEl}>
                  {#each groupOrder as groupId, idx (groupId)}
                    {@const group = getGroupById(groupId)}
                    {@const court = getEffectiveCourt(groupId)}
                    {@const groupStats = matchStatsByGroup.get(groupId) ?? { total: 0, completed: 0, inProgress: 0, pending: 0 }}
                    <div
                      draggable="true"
                      role="listitem"
                      ondragstart={(e) => onDragStart(e, groupId)}
                      ondragover={(e) => onDragOver(e, groupId)}
                      ondragleave={onDragLeave}
                      ondrop={(e) => onDrop(e, groupId)}
                      ondragend={onDragEnd}
                      class="flex items-center gap-2 px-3 py-3 border-b border-border last:border-b-0 transition-all min-h-[56px]"
                    >
                      <button class="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing touch-none shrink-0"><GripVertical class="h-5 w-5" /></button>
                      <span class="w-6 text-center text-sm font-mono text-muted-foreground shrink-0">{idx + 1}</span>
                      <div class="flex-1 min-w-0">
                        <div class="font-medium truncate">{group?.name || groupId}</div>
                        <span class="text-xs text-muted-foreground">{groupStats.completed}/{groupStats.total} matches</span>
                      </div>
                      <ToggleGroup.Root type="single" value={court} onValueChange={(value) => value && onSetGroupCourt(groupId, value)} class="court-toggle-root">
                        <ToggleGroup.Item value="A" aria-label="Court A" class="court-toggle-item">A</ToggleGroup.Item>
                        <ToggleGroup.Item value="A+B" aria-label="Both Courts" class="court-toggle-item">+</ToggleGroup.Item>
                        <ToggleGroup.Item value="B" aria-label="Court B" class="court-toggle-item">B</ToggleGroup.Item>
                      </ToggleGroup.Root>
                    </div>
                  {/each}
                </div>
              {:else}
                <p class="text-sm text-muted-foreground py-4 text-center">No groups yet.</p>
              {/if}
            </div>

            <Separator />

            <div class="space-y-3">
              <h4 class="text-sm font-semibold flex items-center gap-2"><Swords class="h-4 w-4 text-blue-400" />Bogu Matches</h4>
              <div class="space-y-3">
                <div class="space-y-2">
                  <Label class="text-xs text-muted-foreground">Timer</Label>
                  <div class="flex gap-2">
                    {#each TIMER_OPTIONS as secs}
                      <button
                        onclick={() => (boguTimerDuration = secs)}
                        class={cn('flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all border', boguTimerDuration === secs ? 'bg-blue-600 text-white border-blue-600' : 'bg-background text-muted-foreground border-input hover:bg-muted')}
                      >
                        {formatTimer(secs)}
                      </button>
                    {/each}
                  </div>
                </div>

                <div class="space-y-2">
                  <Label class="text-xs text-muted-foreground">Match Type</Label>
                  <div class="flex gap-2">
                    <button onclick={() => (boguMatchType = 'sanbon')} class={cn('flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all border', boguMatchType === 'sanbon' ? 'bg-blue-600 text-white border-blue-600' : 'bg-background text-muted-foreground border-input hover:bg-muted')}>Sanbon</button>
                    <button onclick={() => (boguMatchType = 'ippon')} class={cn('flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all border', boguMatchType === 'ippon' ? 'bg-blue-600 text-white border-blue-600' : 'bg-background text-muted-foreground border-input hover:bg-muted')}>Ippon</button>
                  </div>
                </div>

                <div class="space-y-2">
                  <Label class="text-xs text-muted-foreground">Timer Display</Label>
                  <div class="flex gap-2">
                    <button onclick={() => (timerDisplayMode = 'up')} class={cn('flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all border', timerDisplayMode === 'up' ? 'bg-blue-600 text-white border-blue-600' : 'bg-background text-muted-foreground border-input hover:bg-muted')}>Count Up</button>
                    <button onclick={() => (timerDisplayMode = 'down')} class={cn('flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all border', timerDisplayMode === 'down' ? 'bg-blue-600 text-white border-blue-600' : 'bg-background text-muted-foreground border-input hover:bg-muted')}>Count Down</button>
                  </div>
                </div>

                <Button onclick={onApplyBoguSettings} variant="secondary" size="sm" class="w-full"><Check class="mr-2 h-4 w-4" /> Apply to Bogu</Button>
                <Button onclick={onApplyTimerDisplayMode} variant="outline" size="sm" class="w-full"><Timer class="mr-2 h-4 w-4" /> Apply Timer Display</Button>
              </div>
            </div>

            <Separator />

            <div class="space-y-3">
              <h4 class="text-sm font-semibold flex items-center gap-2"><Users class="h-4 w-4 text-orange-400" />Non-Bogu (Hantei)</h4>
              <p class="text-xs text-muted-foreground">Kihon-waza for each round.</p>
              <div class="space-y-3">
                <div class="space-y-2">
                  <Label class="text-xs text-muted-foreground">Round 1 (2 waza)</Label>
                  <div class="grid grid-cols-2 gap-2">
                    {#each [0, 1] as i}
                      <Select.Root
                        value={hanteiRound1[i] || ''}
                        onValueChange={(v) => {
                          const newVal = [...hanteiRound1];
                          newVal[i] = v;
                          hanteiRound1 = newVal;
                        }}
                      >
                        <Select.Trigger class="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm">
                          <Select.Value placeholder="Select" />
                          <Select.Icon class="ml-auto">
                            <ChevronDown class="h-4 w-4 text-muted-foreground" />
                          </Select.Icon>
                        </Select.Trigger>
                        <Select.Content class="z-40">
                          {#each KIHON_WAZA_OPTIONS as opt}
                            <Select.Item value={opt.id}>{opt.short}</Select.Item>
                          {/each}
                        </Select.Content>
                      </Select.Root>
                    {/each}
                  </div>
                </div>
                <div class="space-y-2">
                  <Label class="text-xs text-muted-foreground">Round 2 (3 waza)</Label>
                  <div class="grid grid-cols-3 gap-2">
                    {#each [0, 1, 2] as i}
                      <Select.Root
                        value={hanteiRound2[i] || ''}
                        onValueChange={(v) => {
                          const newVal = [...hanteiRound2];
                          newVal[i] = v;
                          hanteiRound2 = newVal;
                        }}
                      >
                        <Select.Trigger class="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm">
                          <Select.Value placeholder="Select" />
                          <Select.Icon class="ml-auto">
                            <ChevronDown class="h-4 w-4 text-muted-foreground" />
                          </Select.Icon>
                        </Select.Trigger>
                        <Select.Content class="z-40">
                          {#each KIHON_WAZA_OPTIONS as opt}
                            <Select.Item value={opt.id}>{opt.short}</Select.Item>
                          {/each}
                        </Select.Content>
                      </Select.Root>
                    {/each}
                  </div>
                </div>
                <Button onclick={onApplyHanteiSettings} variant="secondary" size="sm" class="w-full"><Check class="mr-2 h-4 w-4" /> Apply Hantei</Button>
              </div>
            </div>

            <Separator />

            <div class="space-y-3">
              <h4 class="text-sm font-semibold flex items-center gap-2"><Lock class="h-4 w-4 text-red-400" />Security</h4>
              <p class="text-xs text-muted-foreground">Set portal passcodes. Leave blank to clear.</p>
              <div class="space-y-3">
                <div class="space-y-2">
                  <Label class="text-xs text-muted-foreground">Admin Passcode</Label>
                  <div class="flex gap-2">
                    <Input type="password" bind:value={adminPasscodeInput} placeholder={adminPasscode ? "????????" : "Set admin passcode"} class="text-sm" />
                    <Button onclick={onSaveAdminPasscode} variant="secondary" size="sm">
                      <KeyRound class="mr-2 h-4 w-4" /> Save
                    </Button>
                  </div>
                  <p class="text-[10px] text-muted-foreground">Status: {adminPasscode ? 'Set' : 'Not set'}</p>
                </div>
                <div class="space-y-2">
                  <Label class="text-xs text-muted-foreground">Courtkeeper Passcode</Label>
                  <div class="flex gap-2">
                    <Input type="password" bind:value={courtkeeperPasscodeInput} placeholder={courtkeeperPasscode ? "????????" : "Set courtkeeper passcode"} class="text-sm" />
                    <Button onclick={onSaveCourtkeeperPasscode} variant="secondary" size="sm">
                      <KeyRound class="mr-2 h-4 w-4" /> Save
                    </Button>
                  </div>
                  <p class="text-[10px] text-muted-foreground">Status: {courtkeeperPasscode ? 'Set' : 'Not set'}</p>
                </div>
                <Button onclick={onLockAdmin} variant="outline" size="sm" class="w-full">
                  <Lock class="mr-2 h-4 w-4" /> Lock Admin
                </Button>

                <Separator />

                <div class="space-y-3">
                  <h4 class="text-sm font-semibold flex items-center gap-2"><RefreshCw class="h-4 w-4 text-muted-foreground" /> Actions</h4>
                  <div class="space-y-2">
                    <Button onclick={onRefreshParticipants} variant="outline" size="sm" class="w-full justify-start">
                      <RefreshCw class="mr-2 h-4 w-4" /> Update Participants
                    </Button>
                    <Button onclick={onResetTournament} variant="outline" size="sm" class="w-full justify-start border-amber-700/60 text-amber-400 hover:bg-amber-900/20">
                      <RotateCcw class="mr-2 h-4 w-4" /> Reset All Scores
                    </Button>
                    <Button onclick={onDeleteTournament} variant="outline" size="sm" class="w-full justify-start border-red-700/60 text-red-400 hover:bg-red-900/20">
                      <Trash2 class="mr-2 h-4 w-4" /> Delete Tournament
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right column -->
          <div class="flex-1 min-w-0 space-y-4">
            <div class="rounded-2xl border border-border bg-card/70 backdrop-blur-sm p-4 h-full flex flex-col">
              <div class="flex items-center justify-between mb-3">
                <div>
                  <h3 class="font-semibold">Match Timeline</h3>
                  <p class="text-xs text-muted-foreground">Live view of completed, in-progress, and pending matches</p>
                </div>
                <div class="text-xs text-muted-foreground flex items-center gap-2">
                  <span>{matches.length} total</span>
                  <span class="w-1 h-1 rounded-full bg-border"></span>
                  <span class="text-emerald-400">{completedMatches.length} done</span>
                </div>
              </div>

              <div class="relative flex-1 overflow-y-auto pr-2">
                <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-border/70"></div>
                <div class="space-y-4 relative">
                  {#each completedMatches as match (match._id)}
                    {@const p1 = getMemberById(match.player1Id)}
                    {@const p2 = getMemberById(match.player2Id)}
                    <div class="flex gap-4 items-start">
                      <div class="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white z-10">
                        <Check class="h-4 w-4" />
                      </div>
                      <div class="flex-1 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                        <div class="flex items-center justify-between mb-1">
                          <span class="text-sm font-medium">{p1?.firstName} {p1?.lastName?.charAt(0)}. vs {p2?.firstName} {p2?.lastName?.charAt(0)}.</span>
                          <span class="text-xs text-emerald-400">{match.player1Score.length}-{match.player2Score.length}</span>
                        </div>
                        <div class="text-xs text-muted-foreground">Court {match.court ?? 'A/B'} ? Completed</div>
                      </div>
                    </div>
                  {/each}

                  {#each matches.filter((m) => m.status === 'in_progress') as match (match._id)}
                    {@const p1 = getMemberById(match.player1Id)}
                    {@const p2 = getMemberById(match.player2Id)}
                    <div class="flex gap-4 items-start">
                      <div class="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white z-10 animate-pulse">
                        <Play class="h-4 w-4" />
                      </div>
                      <div class="flex-1 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                        <div class="flex items-center justify-between mb-1">
                          <span class="text-sm font-medium text-amber-100">{p1?.firstName} {p1?.lastName?.charAt(0)}. vs {p2?.firstName} {p2?.lastName?.charAt(0)}.</span>
                          <span class="text-xs text-amber-400 font-mono">{match.timer ?? 'LIVE'}</span>
                        </div>
                        <div class="text-xs text-amber-300/80">Court {match.court ?? 'A/B'} ? In Progress</div>
                      </div>
                    </div>
                  {/each}

                  {#each matches.filter((m) => m.status !== 'completed' && m.status !== 'in_progress') as match, idx (match._id)}
                    {@const p1 = getMemberById(match.player1Id)}
                    {@const p2 = getMemberById(match.player2Id)}
                    <div class="flex gap-4 items-start">
                      <div class="w-8 h-8 rounded-full bg-border flex items-center justify-center text-zinc-200 z-10">
                        <span class="text-xs font-medium">{idx + 1}</span>
                      </div>
                      <div class="flex-1 p-3 rounded-lg bg-card/60 border border-border/70 border-dashed">
                        <div class="flex items=center justify-between mb-1">
                          <span class="text-sm text-foreground/90">{p1?.firstName} {p1?.lastName?.charAt(0)}. vs {p2?.firstName} {p2?.lastName?.charAt(0)}.</span>
                          <span class="text-xs text-muted-foreground">Pending</span>
                        </div>
                        <div class="text-xs text-muted-foreground">Court {match.court ?? '?'}</div>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Sheet.Content>
  </Sheet.Portal>
</Sheet.Root>




